-- 台股財報分析系統 Database Schema

-- 公司基本資料
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    stock_code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_abbr VARCHAR(50),
    industry VARCHAR(50),
    market VARCHAR(20) CHECK (market IN ('上市', '上櫃', '興櫃')),
    listing_date DATE,
    capital BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companies_stock_code ON companies(stock_code);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_market ON companies(market);

-- 財報原始數據 (按季)
CREATE TABLE IF NOT EXISTS financial_reports (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    year INTEGER NOT NULL,
    season INTEGER NOT NULL CHECK (season IN (1, 2, 3, 4)),
    
    -- 資產負債表 (單位: 千元)
    total_assets BIGINT,
    total_liabilities BIGINT,
    stockholders_equity BIGINT,
    current_assets BIGINT,
    current_liabilities BIGINT,
    inventory BIGINT,
    accounts_receivable BIGINT,
    fixed_assets BIGINT,
    cash_and_equivalents BIGINT,
    goodwill BIGINT,
    short_term_debt BIGINT,
    long_term_debt BIGINT,
    
    -- 綜合損益表 (單位: 千元)
    revenue BIGINT,
    cost_of_goods_sold BIGINT,
    gross_profit BIGINT,
    operating_expenses BIGINT,
    operating_profit BIGINT,
    non_operating_income BIGINT,
    net_income BIGINT,
    net_income_attributable_to_parent BIGINT,
    eps DECIMAL(10, 2),
    
    -- 現金流量表 (單位: 千元)
    operating_cash_flow BIGINT,
    investing_cash_flow BIGINT,
    financing_cash_flow BIGINT,
    free_cash_flow BIGINT,
    capital_expenditure BIGINT,
    dividends_paid BIGINT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(company_id, year, season)
);

CREATE INDEX idx_financial_reports_company ON financial_reports(company_id);
CREATE INDEX idx_financial_reports_date ON financial_reports(report_date);
CREATE INDEX idx_financial_reports_year_season ON financial_reports(year, season);

-- 股價數據
CREATE TABLE IF NOT EXISTS stock_prices (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    open DECIMAL(10, 2),
    high DECIMAL(10, 2),
    low DECIMAL(10, 2),
    close DECIMAL(10, 2),
    volume BIGINT,
    turnover BIGINT,
    change_amount DECIMAL(10, 2),
    change_percent DECIMAL(5, 2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(company_id, date)
);

CREATE INDEX idx_stock_prices_company ON stock_prices(company_id);
CREATE INDEX idx_stock_prices_date ON stock_prices(date);

-- 計算後指標 (自動更新)
CREATE TABLE IF NOT EXISTS indicators (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    year INTEGER NOT NULL,
    season INTEGER NOT NULL,
    
    -- 杜邦分析核心指標
    roe DECIMAL(8, 4),
    net_margin DECIMAL(8, 4),
    asset_turnover DECIMAL(8, 4),
    equity_multiplier DECIMAL(8, 4),
    
    -- 獲利能力
    gross_margin DECIMAL(8, 4),
    operating_margin DECIMAL(8, 4),
    
    -- 營運能力
    inventory_turnover DECIMAL(8, 4),
    inventory_turnover_days INTEGER,
    accounts_receivable_turnover_days INTEGER,
    cash_conversion_cycle INTEGER,
    
    -- 償債能力
    current_ratio DECIMAL(8, 4),
    quick_ratio DECIMAL(8, 4),
    debt_ratio DECIMAL(8, 4),
    interest_coverage DECIMAL(8, 4),
    
    -- 現金流指標
    cash_ratio DECIMAL(8, 4),
    cash_flow_ratio DECIMAL(8, 4),
    free_cash_flow_per_share DECIMAL(10, 4),
    
    -- 估值指標 (每日更新)
    pe_ratio DECIMAL(8, 4),
    pe_ttm DECIMAL(8, 4),
    pb_ratio DECIMAL(8, 4),
    ps_ratio DECIMAL(8, 4),
    dividend_yield DECIMAL(8, 4),
    
    -- 排雷指標
    goodwill_ratio DECIMAL(8, 4),
    short_debt_to_cash DECIMAL(8, 4),
    short_debt_to_ev DECIMAL(8, 4),
    
    -- 綜合評分
    f_score INTEGER CHECK (f_score >= 0 AND f_score <= 9),
    cbs_score INTEGER CHECK (cbs_score >= 0 AND cbs_score <= 100),
    signal VARCHAR(20) CHECK (signal IN ('低估', '低價', '中等', '過熱', '觀望')),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(company_id, year, season)
);

CREATE INDEX idx_indicators_company ON indicators(company_id);
CREATE INDEX idx_indicators_date ON indicators(report_date);
CREATE INDEX idx_indicators_signal ON indicators(signal);
CREATE INDEX idx_indicators_cbs_score ON indicators(cbs_score);

-- 技術指標 / 五線譜
CREATE TABLE IF NOT EXISTS trend_analysis (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    calculation_date DATE NOT NULL,
    period_days INTEGER DEFAULT 1278,
    
    trend_line DECIMAL(10, 4),
    sd_plus_2 DECIMAL(10, 4),
    sd_plus_1 DECIMAL(10, 4),
    sd_minus_1 DECIMAL(10, 4),
    sd_minus_2 DECIMAL(10, 4),
    current_price DECIMAL(10, 4),
    position VARCHAR(20) CHECK (position IN ('+2SD', '+1SD', 'TL', '-1SD', '-2SD', 'N/A')),
    r_squared DECIMAL(8, 6),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(company_id, calculation_date)
);

CREATE INDEX idx_trend_analysis_company ON trend_analysis(company_id);

-- 產業中位數 (用於排雷比較)
CREATE TABLE IF NOT EXISTS industry_benchmarks (
    id SERIAL PRIMARY KEY,
    industry VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    season INTEGER NOT NULL,
    
    median_roe DECIMAL(8, 4),
    median_equity_multiplier DECIMAL(8, 4),
    median_current_ratio DECIMAL(8, 4),
    median_debt_ratio DECIMAL(8, 4),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(industry, year, season)
);

-- 爬蟲執行記錄
CREATE TABLE IF NOT EXISTS crawler_logs (
    id SERIAL PRIMARY KEY,
    task_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
    records_processed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_crawler_logs_task ON crawler_logs(task_name);
CREATE INDEX idx_crawler_logs_status ON crawler_logs(status);

-- 更新時間觸發器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_financial_reports_updated_at
    BEFORE UPDATE ON financial_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_indicators_updated_at
    BEFORE UPDATE ON indicators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
