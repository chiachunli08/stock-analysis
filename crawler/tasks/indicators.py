import sqlalchemy
from sqlalchemy import text
import os
import logging
from decimal import Decimal
from datetime import date
from typing import Optional, Dict, List
import numpy as np
from scipy import stats

from tasks import app

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://stock:password@postgres:5432/stock_db")
engine = sqlalchemy.create_engine(DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://"))


def calculate_roe(net_income: Optional[int], equity: Optional[int]) -> Optional[Decimal]:
    if not net_income or not equity or equity == 0:
        return None
    return Decimal(str(net_income / equity * 100))


def calculate_net_margin(net_income: Optional[int], revenue: Optional[int]) -> Optional[Decimal]:
    if not net_income or not revenue or revenue == 0:
        return None
    return Decimal(str(net_income / revenue * 100))


def calculate_gross_margin(gross_profit: Optional[int], revenue: Optional[int]) -> Optional[Decimal]:
    if not gross_profit or not revenue or revenue == 0:
        return None
    return Decimal(str(gross_profit / revenue * 100))


def calculate_asset_turnover(revenue: Optional[int], total_assets: Optional[int]) -> Optional[Decimal]:
    if not revenue or not total_assets or total_assets == 0:
        return None
    return Decimal(str(revenue / total_assets))


def calculate_equity_multiplier(total_assets: Optional[int], equity: Optional[int]) -> Optional[Decimal]:
    if not total_assets or not equity or equity == 0:
        return None
    return Decimal(str(total_assets / equity))


def calculate_current_ratio(current_assets: Optional[int], current_liabilities: Optional[int]) -> Optional[Decimal]:
    if not current_assets or not current_liabilities or current_liabilities == 0:
        return None
    return Decimal(str(current_assets / current_liabilities))


def calculate_quick_ratio(current_assets: Optional[int], inventory: Optional[int], current_liabilities: Optional[int]) -> Optional[Decimal]:
    if not current_assets or not current_liabilities or current_liabilities == 0:
        return None
    quick_assets = current_assets - (inventory or 0)
    return Decimal(str(quick_assets / current_liabilities))


def calculate_debt_ratio(total_liabilities: Optional[int], total_assets: Optional[int]) -> Optional[Decimal]:
    if not total_liabilities or not total_assets or total_assets == 0:
        return None
    return Decimal(str(total_liabilities / total_assets * 100))


def calculate_cash_ratio(cash: Optional[int], current_liabilities: Optional[int]) -> Optional[Decimal]:
    if not cash or not current_liabilities or current_liabilities == 0:
        return None
    return Decimal(str(cash / current_liabilities * 100))


def calculate_inventory_turnover_days(inventory: Optional[int], cost_of_goods: Optional[int]) -> Optional[int]:
    if not inventory or not cost_of_goods or cost_of_goods == 0:
        return None
    return int((inventory / cost_of_goods) * 365)


def calculate_receivable_turnover_days(receivables: Optional[int], revenue: Optional[int]) -> Optional[int]:
    if not receivables or not revenue or revenue == 0:
        return None
    return int((receivables / revenue) * 365)


def calculate_goodwill_ratio(goodwill: Optional[int], total_assets: Optional[int]) -> Optional[Decimal]:
    if not goodwill or not total_assets or total_assets == 0:
        return Decimal("0")
    return Decimal(str(goodwill / total_assets * 100))


def calculate_f_score(reports: List[Dict]) -> int:
    score = 0
    
    if len(reports) < 2:
        return 0
    
    current = reports[0]
    previous = reports[1]
    
    if current.get("net_income", 0) > 0:
        score += 1
    if current.get("operating_cash_flow", 0) > 0:
        score += 1
    
    current_roa = (current.get("net_income", 0) / current.get("total_assets", 1)) if current.get("total_assets") else 0
    previous_roa = (previous.get("net_income", 0) / previous.get("total_assets", 1)) if previous.get("total_assets") else 0
    if current_roa > previous_roa:
        score += 1
    
    current_ocf = current.get("operating_cash_flow", 0) or 0
    if current_ocf > current.get("net_income", 0):
        score += 1
    
    current_debt_ratio = calculate_debt_ratio(
        current.get("total_liabilities"),
        current.get("total_assets")
    )
    previous_debt_ratio = calculate_debt_ratio(
        previous.get("total_liabilities"),
        previous.get("total_assets")
    )
    if current_debt_ratio and previous_debt_ratio and current_debt_ratio < previous_debt_ratio:
        score += 1
    
    current_cr = calculate_current_ratio(
        current.get("current_assets"),
        current.get("current_liabilities")
    )
    previous_cr = calculate_current_ratio(
        previous.get("current_assets"),
        previous.get("current_liabilities")
    )
    if current_cr and previous_cr and current_cr > previous_cr:
        score += 1
    
    if current.get("shares") == previous.get("shares"):
        score += 1
    
    current_gm = calculate_gross_margin(
        current.get("gross_profit"),
        current.get("revenue")
    )
    previous_gm = calculate_gross_margin(
        previous.get("gross_profit"),
        previous.get("revenue")
    )
    if current_gm and previous_gm and current_gm > previous_gm:
        score += 1
    
    current_at = calculate_asset_turnover(
        current.get("revenue"),
        current.get("total_assets")
    )
    previous_at = calculate_asset_turnover(
        previous.get("revenue"),
        previous.get("total_assets")
    )
    if current_at and previous_at and current_at > previous_at:
        score += 1
    
    return score


def calculate_cbs_score(indicators: Dict) -> int:
    score = 0
    
    roe = indicators.get("roe")
    if roe:
        if roe >= 20:
            score += 20
        elif roe >= 15:
            score += 15
        elif roe >= 10:
            score += 10
        elif roe >= 7:
            score += 5
    
    gross_margin = indicators.get("gross_margin")
    if gross_margin:
        if gross_margin >= 40:
            score += 15
        elif gross_margin >= 30:
            score += 10
        elif gross_margin >= 20:
            score += 5
    
    current_ratio = indicators.get("current_ratio")
    if current_ratio:
        if current_ratio >= 2:
            score += 10
        elif current_ratio >= 1.5:
            score += 7
        elif current_ratio >= 1:
            score += 3
    
    quick_ratio = indicators.get("quick_ratio")
    if quick_ratio:
        if quick_ratio >= 1:
            score += 10
        elif quick_ratio >= 0.75:
            score += 5
    
    debt_ratio = indicators.get("debt_ratio")
    if debt_ratio is not None:
        if debt_ratio <= 30:
            score += 15
        elif debt_ratio <= 50:
            score += 10
        elif debt_ratio <= 70:
            score += 5
    
    cash_ratio = indicators.get("cash_ratio")
    if cash_ratio:
        if cash_ratio >= 20:
            score += 10
        elif cash_ratio >= 10:
            score += 5
    
    f_score = indicators.get("f_score", 0)
    score += f_score * 2
    
    return min(score, 100)


def determine_signal(cbs_score: int, pe_ttm: Optional[Decimal]) -> Optional[str]:
    if cbs_score < 40:
        return "觀望"
    
    if not pe_ttm:
        return "中等"
    
    if pe_ttm < 10:
        return "低估"
    elif pe_ttm < 15:
        return "低價"
    elif pe_ttm < 25:
        return "中等"
    else:
        return "過熱"


@app.task(bind=True)
def calculate_company_indicators(self, company_id: int):
    logger.info(f"Calculating indicators for company {company_id}")
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT * FROM financial_reports 
                WHERE company_id = :company_id 
                ORDER BY report_date DESC 
                LIMIT 8
            """), {"company_id": company_id})
            reports = [dict(row._mapping) for row in result.fetchall()]
        
        if not reports:
            return {"status": "skipped", "message": "No reports found"}
        
        price_result = conn.execute(text("""
            SELECT close FROM stock_prices
            WHERE company_id = :company_id
            ORDER BY date DESC LIMIT 1
        """), {"company_id": company_id})
        price_row = price_result.fetchone()
        current_price = Decimal(str(price_row[0])) if price_row else None
        
        for report in reports:
            indicators = {}
            
            indicators["roe"] = calculate_roe(
                report.get("net_income"),
                report.get("stockholders_equity")
            )
            indicators["net_margin"] = calculate_net_margin(
                report.get("net_income"),
                report.get("revenue")
            )
            indicators["gross_margin"] = calculate_gross_margin(
                report.get("gross_profit"),
                report.get("revenue")
            )
            indicators["operating_margin"] = calculate_net_margin(
                report.get("operating_profit"),
                report.get("revenue")
            )
            indicators["asset_turnover"] = calculate_asset_turnover(
                report.get("revenue"),
                report.get("total_assets")
            )
            indicators["equity_multiplier"] = calculate_equity_multiplier(
                report.get("total_assets"),
                report.get("stockholders_equity")
            )
            indicators["current_ratio"] = calculate_current_ratio(
                report.get("current_assets"),
                report.get("current_liabilities")
            )
            indicators["quick_ratio"] = calculate_quick_ratio(
                report.get("current_assets"),
                report.get("inventory"),
                report.get("current_liabilities")
            )
            indicators["debt_ratio"] = calculate_debt_ratio(
                report.get("total_liabilities"),
                report.get("total_assets")
            )
            indicators["cash_ratio"] = calculate_cash_ratio(
                report.get("cash_and_equivalents"),
                report.get("current_liabilities")
            )
            indicators["inventory_turnover_days"] = calculate_inventory_turnover_days(
                report.get("inventory"),
                report.get("cost_of_goods_sold")
            )
            indicators["accounts_receivable_turnover_days"] = calculate_receivable_turnover_days(
                report.get("accounts_receivable"),
                report.get("revenue")
            )
            indicators["goodwill_ratio"] = calculate_goodwill_ratio(
                report.get("goodwill"),
                report.get("total_assets")
            )
            
            if current_price and report.get("eps"):
                eps = Decimal(str(report["eps"]))
                if eps > 0:
                    indicators["pe_ttm"] = current_price / eps
            
            indicators["f_score"] = calculate_f_score(reports)
            indicators["cbs_score"] = calculate_cbs_score(indicators)
            indicators["signal"] = determine_signal(
                indicators["cbs_score"],
                indicators.get("pe_ttm")
            )
            
            with engine.begin() as conn:
                conn.execute(text("""
                    INSERT INTO indicators (
                        company_id, report_date, year, season,
                        roe, net_margin, gross_margin, operating_margin,
                        asset_turnover, equity_multiplier,
                        current_ratio, quick_ratio, debt_ratio, cash_ratio,
                        inventory_turnover_days, accounts_receivable_turnover_days,
                        goodwill_ratio, pe_ttm, f_score, cbs_score, signal
                    ) VALUES (
                        :company_id, :report_date, :year, :season,
                        :roe, :net_margin, :gross_margin, :operating_margin,
                        :asset_turnover, :equity_multiplier,
                        :current_ratio, :quick_ratio, :debt_ratio, :cash_ratio,
                        :inventory_turnover_days, :accounts_receivable_turnover_days,
                        :goodwill_ratio, :pe_ttm, :f_score, :cbs_score, :signal
                    )
                    ON CONFLICT (company_id, year, season) DO UPDATE SET
                        roe = EXCLUDED.roe,
                        net_margin = EXCLUDED.net_margin,
                        gross_margin = EXCLUDED.gross_margin,
                        operating_margin = EXCLUDED.operating_margin,
                        asset_turnover = EXCLUDED.asset_turnover,
                        equity_multiplier = EXCLUDED.equity_multiplier,
                        current_ratio = EXCLUDED.current_ratio,
                        quick_ratio = EXCLUDED.quick_ratio,
                        debt_ratio = EXCLUDED.debt_ratio,
                        cash_ratio = EXCLUDED.cash_ratio,
                        inventory_turnover_days = EXCLUDED.inventory_turnover_days,
                        accounts_receivable_turnover_days = EXCLUDED.accounts_receivable_turnover_days,
                        goodwill_ratio = EXCLUDED.goodwill_ratio,
                        pe_ttm = EXCLUDED.pe_ttm,
                        f_score = EXCLUDED.f_score,
                        cbs_score = EXCLUDED.cbs_score,
                        signal = EXCLUDED.signal
                """), {
                    "company_id": company_id,
                    "report_date": report["report_date"],
                    "year": report["year"],
                    "season": report["season"],
                    **{k: float(v) if isinstance(v, Decimal) else v for k, v in indicators.items()}
                })
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Error calculating indicators: {e}")
        return {"status": "error", "message": str(e)}


@app.task(bind=True)
def calculate_all(self):
    logger.info("Calculating indicators for all companies...")
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT id FROM companies"))
            company_ids = [row[0] for row in result.fetchall()]
        
        for company_id in company_ids:
            calculate_company_indicators.delay(company_id)
        
        return {"status": "success", "count": len(company_ids)}
        
    except Exception as e:
        logger.error(f"Error in calculate_all: {e}")
        return {"status": "error", "message": str(e)}


@app.task(bind=True)
def update_trend_analysis(self):
    logger.info("Updating trend analysis...")
    
    try:
        with engine.connect() as conn:
            companies = conn.execute(text("SELECT id FROM companies")).fetchall()
        
        for (company_id,) in companies:
            prices = conn.execute(text("""
                SELECT date, close FROM stock_prices
                WHERE company_id = :company_id
                ORDER BY date DESC
                LIMIT 1278
            """), {"company_id": company_id}).fetchall()
            
            if len(prices) < 252:
                continue
            
            dates = np.array([(p[0] - date(1970, 1, 1)).days for p in reversed(prices)])
            closes = np.array([float(p[1]) for p in reversed(prices)])
            
            slope, intercept, r_value, p_value, std_err = stats.linregress(dates, closes)
            
            residuals = closes - (slope * dates + intercept)
            std_dev = np.std(residuals)
            
            current_price = float(prices[0][1])
            trend_line = slope * dates[-1] + intercept
            
            position = "N/A"
            if current_price >= trend_line + 2 * std_dev:
                position = "+2SD"
            elif current_price >= trend_line + std_dev:
                position = "+1SD"
            elif current_price <= trend_line - 2 * std_dev:
                position = "-2SD"
            elif current_price <= trend_line - std_dev:
                position = "-1SD"
            else:
                position = "TL"
            
            with engine.begin() as conn:
                conn.execute(text("""
                    INSERT INTO trend_analysis (
                        company_id, calculation_date, period_days,
                        trend_line, sd_plus_2, sd_plus_1, sd_minus_1, sd_minus_2,
                        current_price, position, r_squared
                    ) VALUES (
                        :company_id, CURRENT_DATE, 1278,
                        :trend_line, :sd_plus_2, :sd_plus_1, :sd_minus_1, :sd_minus_2,
                        :current_price, :position, :r_squared
                    )
                    ON CONFLICT (company_id, calculation_date) DO UPDATE SET
                        trend_line = EXCLUDED.trend_line,
                        sd_plus_2 = EXCLUDED.sd_plus_2,
                        sd_plus_1 = EXCLUDED.sd_plus_1,
                        sd_minus_1 = EXCLUDED.sd_minus_1,
                        sd_minus_2 = EXCLUDED.sd_minus_2,
                        current_price = EXCLUDED.current_price,
                        position = EXCLUDED.position,
                        r_squared = EXCLUDED.r_squared
                """), {
                    "company_id": company_id,
                    "trend_line": trend_line,
                    "sd_plus_2": trend_line + 2 * std_dev,
                    "sd_plus_1": trend_line + std_dev,
                    "sd_minus_1": trend_line - std_dev,
                    "sd_minus_2": trend_line - 2 * std_dev,
                    "current_price": current_price,
                    "position": position,
                    "r_squared": r_value ** 2
                })
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Error updating trend analysis: {e}")
        return {"status": "error", "message": str(e)}
