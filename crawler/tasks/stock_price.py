import httpx
import asyncio
from datetime import datetime, date, timedelta
from typing import List, Dict, Optional
from decimal import Decimal
import sqlalchemy
from sqlalchemy import text
import os
import logging
import json

from tasks import app

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://stock:password@postgres:5432/stock_db")
engine = sqlalchemy.create_engine(DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://"))


async def fetch_daily_price_twse(client: httpx.AsyncClient, stock_code: str, target_date: date) -> Optional[Dict]:
    url = "https://www.twse.com.tw/exchangeReport/STOCK_DAY"
    params = {
        "response": "json",
        "date": target_date.strftime("%Y%m%d"),
        "stockNo": stock_code
    }
    
    try:
        response = await client.get(url, params=params, timeout=30)
        if response.status_code == 200:
            data = response.json()
            if data.get("stat") == "OK" and data.get("data"):
                rows = data["data"]
                if rows:
                    latest = rows[-1]
                    return {
                        "date": _parse_twse_date(latest[0], target_date.year),
                        "volume": _parse_number(latest[1]),
                        "turnover": _parse_number(latest[2]),
                        "open": _parse_number(latest[3]),
                        "high": _parse_number(latest[4]),
                        "low": _parse_number(latest[5]),
                        "close": _parse_number(latest[6]),
                        "change_amount": _parse_number(latest[7]),
                        "change_percent": _parse_change_percent(latest[8])
                    }
    except Exception as e:
        logger.warning(f"Error fetching price for {stock_code}: {e}")
    return None


async def fetch_daily_price_otc(client: httpx.AsyncClient, stock_code: str, target_date: date) -> Optional[Dict]:
    url = "https://www.tpex.org.tw/web/stock/aftertrading/daily_trading_info/stk_price_result.php"
    params = {
        "l": "zh-tw",
        "d": f"{target_date.year - 1911}/{target_date.month:02d}",
        "stkno": stock_code
    }
    
    try:
        response = await client.get(url, params=params, timeout=30)
        if response.status_code == 200:
            data = response.json()
            if data.get("aaData"):
                rows = data["aaData"]
                if rows:
                    latest = rows[-1]
                    return {
                        "date": _parse_otc_date(latest[0], target_date.year),
                        "volume": _parse_number(latest[1]) * 1000,
                        "turnover": _parse_number(latest[2]),
                        "open": _parse_number(latest[3]),
                        "high": _parse_number(latest[4]),
                        "low": _parse_number(latest[5]),
                        "close": _parse_number(latest[6]),
                        "change_amount": _parse_number(latest[7]),
                        "change_percent": _parse_change_percent(latest[8])
                    }
    except Exception as e:
        logger.warning(f"Error fetching OTC price for {stock_code}: {e}")
    return None


def _parse_twse_date(date_str: str, year: int) -> date:
    parts = date_str.split("/")
    if len(parts) == 3:
        y = int(parts[0]) + 1911 if int(parts[0]) < 1000 else int(parts[0])
        return date(y, int(parts[1]), int(parts[2]))
    return date.today()


def _parse_otc_date(date_str: str, year: int) -> date:
    parts = date_str.split("/")
    if len(parts) == 3:
        y = int(parts[0]) + 1911 if int(parts[0]) < 1000 else int(parts[0])
        return date(y, int(parts[1]), int(parts[2]))
    return date.today()


def _parse_number(s: str) -> Optional[Decimal]:
    if not s or s == "--" or s == "X" or s == "-":
        return None
    try:
        s = s.replace(",", "").replace(" ", "").replace("　", "")
        if s.startswith("+"):
            s = s[1:]
        return Decimal(s)
    except:
        return None


def _parse_change_percent(s: str) -> Optional[Decimal]:
    if not s or s == "--" or s == "X" or s == "-":
        return None
    try:
        s = s.replace("%", "").replace(" ", "").replace("　", "")
        return Decimal(s)
    except:
        return None


@app.task(bind=True, max_retries=3)
def fetch_all_daily_prices(self):
    logger.info("Starting daily price fetch...")
    target_date = date.today()
    
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        with engine.connect() as conn:
            result = conn.execute(text("SELECT id, stock_code, market FROM companies"))
            companies = result.fetchall()
        
        logger.info(f"Fetching prices for {len(companies)} companies")
        
        async def fetch_prices():
            async with httpx.AsyncClient(timeout=30) as client:
                tasks = []
                for company in companies:
                    company_id, stock_code, market = company
                    if market == "上市":
                        tasks.append((company_id, stock_code, fetch_daily_price_twse(client, stock_code, target_date)))
                    elif market == "上櫃":
                        tasks.append((company_id, stock_code, fetch_daily_price_otc(client, stock_code, target_date)))
                
                results = []
                for company_id, stock_code, task in tasks[:100]:
                    price = await task
                    if price:
                        results.append((company_id, stock_code, price))
                    await asyncio.sleep(0.5)
                return results
        
        prices = loop.run_until_complete(fetch_prices())
        
        with engine.begin() as conn:
            for company_id, stock_code, price in prices:
                conn.execute(text("""
                    INSERT INTO stock_prices 
                    (company_id, date, open, high, low, close, volume, turnover, change_amount, change_percent)
                    VALUES (:company_id, :date, :open, :high, :low, :close, :volume, :turnover, :change_amount, :change_percent)
                    ON CONFLICT (company_id, date) DO UPDATE SET
                        open = EXCLUDED.open,
                        high = EXCLUDED.high,
                        low = EXCLUDED.low,
                        close = EXCLUDED.close,
                        volume = EXCLUDED.volume,
                        turnover = EXCLUDED.turnover,
                        change_amount = EXCLUDED.change_amount,
                        change_percent = EXCLUDED.change_percent
                """), {
                    "company_id": company_id,
                    "date": price["date"],
                    "open": price["open"],
                    "high": price["high"],
                    "low": price["low"],
                    "close": price["close"],
                    "volume": price["volume"],
                    "turnover": price["turnover"],
                    "change_amount": price["change_amount"],
                    "change_percent": price["change_percent"]
                })
        
        logger.info(f"Updated {len(prices)} stock prices")
        return {"status": "success", "count": len(prices)}
        
    except Exception as e:
        logger.error(f"Error fetching daily prices: {e}")
        self.retry(exc=e, countdown=300)
        return {"status": "error", "message": str(e)}
    finally:
        loop.close()


@app.task(bind=True)
def fetch_historical_prices(self, stock_code: str, months: int = 12):
    logger.info(f"Fetching historical prices for {stock_code}...")
    
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT id, market FROM companies WHERE stock_code = :code"),
                {"code": stock_code}
            )
            row = result.fetchone()
            if not row:
                return {"status": "error", "message": "Stock not found"}
            company_id, market = row
        
        async def fetch():
            async with httpx.AsyncClient(timeout=30) as client:
                prices = []
                today = date.today()
                for i in range(months):
                    target_date = today - timedelta(days=i*30)
                    if market == "上市":
                        price = await fetch_daily_price_twse(client, stock_code, target_date)
                    else:
                        price = await fetch_daily_price_otc(client, stock_code, target_date)
                    if price:
                        prices.append(price)
                    await asyncio.sleep(0.3)
                return prices
        
        prices = loop.run_until_complete(fetch())
        
        with engine.begin() as conn:
            for price in prices:
                conn.execute(text("""
                    INSERT INTO stock_prices 
                    (company_id, date, open, high, low, close, volume, turnover, change_amount, change_percent)
                    VALUES (:company_id, :date, :open, :high, :low, :close, :volume, :turnover, :change_amount, :change_percent)
                    ON CONFLICT (company_id, date) DO UPDATE SET
                        open = EXCLUDED.open,
                        high = EXCLUDED.high,
                        low = EXCLUDED.low,
                        close = EXCLUDED.close,
                        volume = EXCLUDED.volume,
                        turnover = EXCLUDED.turnout
                """), {
                    "company_id": company_id,
                    **price
                })
        
        return {"status": "success", "count": len(prices)}
        
    except Exception as e:
        logger.error(f"Error fetching historical prices: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        loop.close()
