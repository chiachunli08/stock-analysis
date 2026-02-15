import httpx
import asyncio
from datetime import datetime, date
from typing import List, Dict, Optional
from decimal import Decimal
import sqlalchemy
from sqlalchemy import text
import os
import logging
import re
from bs4 import BeautifulSoup

from tasks import app

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://stock:password@postgres:5432/stock_db")
engine = sqlalchemy.create_engine(DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://"))

MOPS_BASE_URL = "https://mops.twse.com.tw"
MOPS_BALANCE_SHEET = f"{MOPS_BASE_URL}/mops/web/t164sb01"
MOPS_INCOME_STATEMENT = f"{MOPS_BASE_URL}/mops/web/t164sb04"
MOPS_CASH_FLOW = f"{MOPS_BASE_URL}/mops/web/t164sb05"


async def fetch_financial_report_mops(
    client: httpx.AsyncClient,
    stock_code: str,
    year: int,
    season: int,
    report_type: str
) -> Optional[Dict]:
    if report_type == "balance":
        url = "https://mops.twse.com.tw/mops/web/ajax_t164sb01"
    elif report_type == "income":
        url = "https://mops.twse.com.tw/mops/web/ajax_t164sb04"
    else:
        url = "https://mops.twse.com.tw/mops/web/ajax_t164sb05"
    
    form_data = {
        "encodeURIComponent": "1",
        "step": "1",
        "firstin": "1",
        "off": "1",
        "queryName": "co_id",
        "inpuType": "co_id",
        "TYPEK": "all",
        "isnew": "false",
        "co_id": stock_code,
        "year": str(year - 1911),
        "season": f"0{season}"
    }
    
    try:
        response = await client.post(url, data=form_data, timeout=30)
        if response.status_code == 200:
            return parse_financial_html(response.text, report_type)
    except Exception as e:
        logger.warning(f"Error fetching {report_type} for {stock_code}: {e}")
    return None


def parse_financial_html(html: str, report_type: str) -> Dict:
    soup = BeautifulSoup(html, "html.parser")
    result = {}
    
    tables = soup.find_all("table", {"class": "hasBorder"})
    if not tables:
        return result
    
    for table in tables:
        rows = table.find_all("tr")
        for row in rows:
            cells = row.find_all("td")
            if len(cells) >= 2:
                label = cells[0].get_text(strip=True)
                value_str = cells[1].get_text(strip=True) if len(cells) > 1 else ""
                
                key = _map_label_to_key(label, report_type)
                if key:
                    result[key] = _parse_value(value_str)
    
    return result


def _map_label_to_key(label: str, report_type: str) -> Optional[str]:
    mappings = {
        "balance": {
            "資產總計": "total_assets",
            "負債總計": "total_liabilities",
            "權益總額": "stockholders_equity",
            "流動資產": "current_assets",
            "流動負債": "current_liabilities",
            "存貨": "inventory",
            "應收帳款淨額": "accounts_receivable",
            "應收帳款": "accounts_receivable",
            "現金及約當現金": "cash_and_equivalents",
            "商譽": "goodwill",
            "短期借款": "short_term_debt",
            "長期借款": "long_term_debt",
            "不動產、廠房及設備": "fixed_assets",
            "固定資產": "fixed_assets",
        },
        "income": {
            "營業收入": "revenue",
            "營業成本": "cost_of_goods_sold",
            "營業毛利": "gross_profit",
            "營業費用": "operating_expenses",
            "營業利益": "operating_profit",
            "營業外收入及支出": "non_operating_income",
            "本期淨利": "net_income",
            "本期綜合損益總額": "net_income",
            "基本每股盈餘": "eps",
        },
        "cashflow": {
            "營業活動之淨現金流入": "operating_cash_flow",
            "營業活動之淨現金流量": "operating_cash_flow",
            "投資活動之淨現金流入": "investing_cash_flow",
            "投資活動之淨現金流量": "investing_cash_flow",
            "籌資活動之淨現金流入": "financing_cash_flow",
            "籌資活動之淨現金流量": "financing_cash_flow",
        }
    }
    
    mapping = mappings.get(report_type, {})
    for key, value in mapping.items():
        if key in label:
            return value
    return None


def _parse_value(s: str) -> Optional[int]:
    if not s or s in ["-", "--", "N/A", ""]:
        return None
    try:
        s = s.replace(",", "").replace(" ", "").replace("　", "").strip()
        if s.startswith("(") and s.endswith(")"):
            s = "-" + s[1:-1]
        return int(float(s))
    except:
        return None


@app.task(bind=True, max_retries=3)
def fetch_company_reports(self, stock_code: str, years: int = 3):
    logger.info(f"Fetching financial reports for {stock_code}...")
    
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT id FROM companies WHERE stock_code = :code"),
                {"code": stock_code}
            )
            row = result.fetchone()
            if not row:
                return {"status": "error", "message": "Stock not found"}
            company_id = row[0]
        
        current_year = date.today().year
        seasons = [1, 2, 3, 4]
        
        async def fetch_all():
            async with httpx.AsyncClient(timeout=30) as client:
                reports = []
                for year_offset in range(years):
                    year = current_year - year_offset
                    for season in seasons:
                        balance = await fetch_financial_report_mops(client, stock_code, year, season, "balance")
                        income = await fetch_financial_report_mops(client, stock_code, year, season, "income")
                        cashflow = await fetch_financial_report_mops(client, stock_code, year, season, "cashflow")
                        
                        if balance or income or cashflow:
                            reports.append({
                                "year": year,
                                "season": season,
                                "report_date": date(year, season * 3, 15),
                                **{k: v for d in [balance, income, cashflow] if d for k, v in d.items()}
                            })
                        
                        await asyncio.sleep(1)
                return reports
        
        reports = loop.run_until_complete(fetch_all())
        
        with engine.begin() as conn:
            for report in reports:
                columns = ["company_id", "report_date", "year", "season"] + \
                         [k for k in report.keys() if k not in ["year", "season", "report_date"]]
                values = [company_id, report["report_date"], report["year"], report["season"]] + \
                        [report.get(k) for k in columns[4:]]
                
                placeholders = ", ".join([f":{i}" for i in range(len(columns))])
                update_set = ", ".join([f"{col} = EXCLUDED.{col}" for col in columns[3:]])
                
                sql = f"""
                    INSERT INTO financial_reports ({', '.join(columns)})
                    VALUES ({placeholders})
                    ON CONFLICT (company_id, year, season) DO UPDATE SET {update_set}
                """
                
                conn.execute(text(sql), {str(i): v for i, v in enumerate(values)})
        
        logger.info(f"Updated {len(reports)} reports for {stock_code}")
        return {"status": "success", "count": len(reports)}
        
    except Exception as e:
        logger.error(f"Error fetching reports for {stock_code}: {e}")
        self.retry(exc=e, countdown=300)
        return {"status": "error", "message": str(e)}
    finally:
        loop.close()


@app.task(bind=True)
def fetch_all_reports(self):
    logger.info("Starting full financial report fetch...")
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT stock_code FROM companies LIMIT 50"))
            stocks = [row[0] for row in result.fetchall()]
        
        success_count = 0
        for stock_code in stocks:
            task_result = fetch_company_reports.delay(stock_code, years=2)
            success_count += 1
        
        return {"status": "success", "queued": success_count}
        
    except Exception as e:
        logger.error(f"Error in fetch_all_reports: {e}")
        return {"status": "error", "message": str(e)}
