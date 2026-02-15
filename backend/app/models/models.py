from sqlalchemy import Column, Integer, String, BigInteger, Numeric, Date, Boolean, Text, ForeignKey, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    stock_code = Column(String(10), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    name_abbr = Column(String(50))
    industry = Column(String(50), index=True)
    market = Column(String(20))
    listing_date = Column(Date)
    capital = Column(BigInteger)
    
    financial_reports = relationship("FinancialReport", back_populates="company", cascade="all, delete-orphan")
    stock_prices = relationship("StockPrice", back_populates="company", cascade="all, delete-orphan")
    indicators = relationship("Indicator", back_populates="company", cascade="all, delete-orphan")

class FinancialReport(Base):
    __tablename__ = "financial_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    report_date = Column(Date, nullable=False)
    year = Column(Integer, nullable=False)
    season = Column(Integer, nullable=False)
    
    total_assets = Column(BigInteger)
    total_liabilities = Column(BigInteger)
    stockholders_equity = Column(BigInteger)
    current_assets = Column(BigInteger)
    current_liabilities = Column(BigInteger)
    inventory = Column(BigInteger)
    accounts_receivable = Column(BigInteger)
    fixed_assets = Column(BigInteger)
    cash_and_equivalents = Column(BigInteger)
    goodwill = Column(BigInteger)
    short_term_debt = Column(BigInteger)
    long_term_debt = Column(BigInteger)
    
    revenue = Column(BigInteger)
    cost_of_goods_sold = Column(BigInteger)
    gross_profit = Column(BigInteger)
    operating_expenses = Column(BigInteger)
    operating_profit = Column(BigInteger)
    non_operating_income = Column(BigInteger)
    net_income = Column(BigInteger)
    net_income_attributable_to_parent = Column(BigInteger)
    eps = Column(Numeric(10, 2))
    
    operating_cash_flow = Column(BigInteger)
    investing_cash_flow = Column(BigInteger)
    financing_cash_flow = Column(BigInteger)
    free_cash_flow = Column(BigInteger)
    capital_expenditure = Column(BigInteger)
    dividends_paid = Column(BigInteger)
    
    company = relationship("Company", back_populates="financial_reports")

class StockPrice(Base):
    __tablename__ = "stock_prices"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    open = Column(Numeric(10, 2))
    high = Column(Numeric(10, 2))
    low = Column(Numeric(10, 2))
    close = Column(Numeric(10, 2))
    volume = Column(BigInteger)
    turnover = Column(BigInteger)
    change_amount = Column(Numeric(10, 2))
    change_percent = Column(Numeric(5, 2))
    
    company = relationship("Company", back_populates="stock_prices")

class Indicator(Base):
    __tablename__ = "indicators"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    report_date = Column(Date, nullable=False)
    year = Column(Integer, nullable=False)
    season = Column(Integer, nullable=False)
    
    roe = Column(Numeric(8, 4))
    net_margin = Column(Numeric(8, 4))
    asset_turnover = Column(Numeric(8, 4))
    equity_multiplier = Column(Numeric(8, 4))
    gross_margin = Column(Numeric(8, 4))
    operating_margin = Column(Numeric(8, 4))
    inventory_turnover = Column(Numeric(8, 4))
    inventory_turnover_days = Column(Integer)
    accounts_receivable_turnover_days = Column(Integer)
    cash_conversion_cycle = Column(Integer)
    current_ratio = Column(Numeric(8, 4))
    quick_ratio = Column(Numeric(8, 4))
    debt_ratio = Column(Numeric(8, 4))
    interest_coverage = Column(Numeric(8, 4))
    cash_ratio = Column(Numeric(8, 4))
    cash_flow_ratio = Column(Numeric(8, 4))
    free_cash_flow_per_share = Column(Numeric(10, 4))
    pe_ratio = Column(Numeric(8, 4))
    pe_ttm = Column(Numeric(8, 4))
    pb_ratio = Column(Numeric(8, 4))
    ps_ratio = Column(Numeric(8, 4))
    dividend_yield = Column(Numeric(8, 4))
    goodwill_ratio = Column(Numeric(8, 4))
    short_debt_to_cash = Column(Numeric(8, 4))
    short_debt_to_ev = Column(Numeric(8, 4))
    f_score = Column(Integer)
    cbs_score = Column(Integer)
    signal = Column(String(20))
    
    company = relationship("Company", back_populates="indicators")

class TrendAnalysis(Base):
    __tablename__ = "trend_analysis"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    calculation_date = Column(Date, nullable=False)
    period_days = Column(Integer, default=1278)
    trend_line = Column(Numeric(10, 4))
    sd_plus_2 = Column(Numeric(10, 4))
    sd_plus_1 = Column(Numeric(10, 4))
    sd_minus_1 = Column(Numeric(10, 4))
    sd_minus_2 = Column(Numeric(10, 4))
    current_price = Column(Numeric(10, 4))
    position = Column(String(20))
    r_squared = Column(Numeric(8, 6))

class CrawlerLog(Base):
    __tablename__ = "crawler_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    task_name = Column(String(100), nullable=False, index=True)
    status = Column(String(20), nullable=False)
    records_processed = Column(Integer, default=0)
    error_message = Column(Text)
    started_at = Column(Date)
    completed_at = Column(Date)
