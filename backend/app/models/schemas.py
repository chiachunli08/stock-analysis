from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from decimal import Decimal

class CompanyBase(BaseModel):
    stock_code: str
    name: str
    name_abbr: Optional[str] = None
    industry: Optional[str] = None
    market: Optional[str] = None
    listing_date: Optional[date] = None
    capital: Optional[int] = None

class CompanyResponse(CompanyBase):
    id: int
    
    class Config:
        from_attributes = True

class FinancialReportBase(BaseModel):
    report_date: date
    year: int
    season: int

class FinancialReportResponse(FinancialReportBase):
    id: int
    company_id: int
    total_assets: Optional[int]
    total_liabilities: Optional[int]
    stockholders_equity: Optional[int]
    revenue: Optional[int]
    gross_profit: Optional[int]
    operating_profit: Optional[int]
    net_income: Optional[int]
    eps: Optional[Decimal]
    operating_cash_flow: Optional[int]
    free_cash_flow: Optional[int]
    
    class Config:
        from_attributes = True

class IndicatorBase(BaseModel):
    report_date: date
    year: int
    season: int

class IndicatorResponse(IndicatorBase):
    id: int
    company_id: int
    roe: Optional[Decimal]
    net_margin: Optional[Decimal]
    asset_turnover: Optional[Decimal]
    equity_multiplier: Optional[Decimal]
    gross_margin: Optional[Decimal]
    operating_margin: Optional[Decimal]
    current_ratio: Optional[Decimal]
    quick_ratio: Optional[Decimal]
    debt_ratio: Optional[Decimal]
    cash_ratio: Optional[Decimal]
    pe_ttm: Optional[Decimal]
    pb_ratio: Optional[Decimal]
    f_score: Optional[int]
    cbs_score: Optional[int]
    signal: Optional[str]
    
    class Config:
        from_attributes = True

class StockPriceBase(BaseModel):
    date: date
    open: Optional[Decimal]
    high: Optional[Decimal]
    low: Optional[Decimal]
    close: Optional[Decimal]
    volume: Optional[int]

class StockPriceResponse(StockPriceBase):
    id: int
    company_id: int
    change_percent: Optional[Decimal]
    
    class Config:
        from_attributes = True

class CompanyDetail(CompanyResponse):
    latest_indicators: Optional[IndicatorResponse] = None
    latest_price: Optional[StockPriceResponse] = None

class ScreenerFilter(BaseModel):
    roe_min: Optional[Decimal] = None
    roe_max: Optional[Decimal] = None
    pe_min: Optional[Decimal] = None
    pe_max: Optional[Decimal] = None
    pb_min: Optional[Decimal] = None
    pb_max: Optional[Decimal] = None
    current_ratio_min: Optional[Decimal] = None
    f_score_min: Optional[int] = None
    cbs_score_min: Optional[int] = None
    signal: Optional[List[str]] = None
    industry: Optional[List[str]] = None
    market: Optional[List[str]] = None

class ScreenerResult(BaseModel):
    total: int
    companies: List[CompanyDetail]

class TrendAnalysisResponse(BaseModel):
    company_id: int
    calculation_date: date
    current_price: Optional[Decimal]
    trend_line: Optional[Decimal]
    sd_plus_2: Optional[Decimal]
    sd_plus_1: Optional[Decimal]
    sd_minus_1: Optional[Decimal]
    sd_minus_2: Optional[Decimal]
    position: Optional[str]
    r_squared: Optional[Decimal]
    
    class Config:
        from_attributes = True

class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List
