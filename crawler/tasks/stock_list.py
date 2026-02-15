import httpx
import asyncio
from bs4 import BeautifulSoup
from datetime import datetime
from typing import List, Dict, Optional
import sqlalchemy
from sqlalchemy import text
import os
import logging

from tasks import app

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://stock:password@postgres:5432/stock_db")
engine = sqlalchemy.create_engine(DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://"))

TWSE_STOCK_LIST_URL = "https://www.twse.com.tw/exchangeReport/STOCK_DAY_ALL"
OTC_STOCK_LIST_URL = "https://www.tpex.org.tw/web/stock/aftertrading/daily_close_quotes/stk_quote_result.php"


async def fetch_twse_stocks() -> List[Dict]:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(
            "https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL",
            headers={"Accept": "application/json"}
        )
        if response.status_code == 200:
            data = response.json()
            return [
                {
                    "stock_code": item.get("Code", ""),
                    "name": item.get("Name", ""),
                    "market": "上市"
                }
                for item in data
            ]
    return []


async def fetch_otc_stocks() -> List[Dict]:
    stocks = []
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(OTC_STOCK_LIST_URL)
        if response.status_code == 200:
            data = response.json()
            if data.get("aaData"):
                for item in data["aaData"]:
                    if len(item) >= 2:
                        stocks.append({
                            "stock_code": item[0],
                            "name": item[1],
                            "market": "上櫃"
                        })
    return stocks


@app.task(bind=True, max_retries=3)
def update_stock_list(self):
    logger.info("Starting stock list update...")
    
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        twse_stocks = loop.run_until_complete(fetch_twse_stocks())
        otc_stocks = loop.run_until_complete(fetch_otc_stocks())
        
        all_stocks = twse_stocks + otc_stocks
        logger.info(f"Fetched {len(all_stocks)} stocks")
        
        with engine.begin() as conn:
            for stock in all_stocks:
                conn.execute(text("""
                    INSERT INTO companies (stock_code, name, market)
                    VALUES (:stock_code, :name, :market)
                    ON CONFLICT (stock_code) 
                    DO UPDATE SET name = EXCLUDED.name, market = EXCLUDED.market
                """), stock)
        
        logger.info(f"Updated {len(all_stocks)} stocks in database")
        return {"status": "success", "count": len(all_stocks)}
        
    except Exception as e:
        logger.error(f"Error updating stock list: {e}")
        self.retry(exc=e, countdown=60)
        return {"status": "error", "message": str(e)}
    finally:
        loop.close()
