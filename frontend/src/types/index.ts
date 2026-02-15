export interface Company {
  id: number;
  stock_code: string;
  name: string;
  name_abbr?: string;
  industry?: string;
  market?: string;
  listing_date?: string;
  capital?: number;
}

export interface Indicator {
  id: number;
  company_id: number;
  report_date: string;
  year: number;
  season: number;
  roe?: number;
  net_margin?: number;
  asset_turnover?: number;
  equity_multiplier?: number;
  gross_margin?: number;
  operating_margin?: number;
  current_ratio?: number;
  quick_ratio?: number;
  debt_ratio?: number;
  cash_ratio?: number;
  pe_ttm?: number;
  pb_ratio?: number;
  f_score?: number;
  cbs_score?: number;
  signal?: string;
}

export interface StockPrice {
  id: number;
  company_id: number;
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  change_percent?: number;
}

export interface CompanyDetail extends Company {
  latest_indicators?: Indicator;
  latest_price?: StockPrice;
}

export interface ScreenerFilter {
  roe_min?: number;
  roe_max?: number;
  pe_min?: number;
  pe_max?: number;
  pb_min?: number;
  pb_max?: number;
  current_ratio_min?: number;
  f_score_min?: number;
  cbs_score_min?: number;
  signal?: string[];
  industry?: string[];
  market?: string[];
}

export interface ScreenerResult {
  total: number;
  companies: CompanyDetail[];
}

export interface TrendAnalysis {
  company_id: number;
  calculation_date: string;
  current_price?: number;
  trend_line?: number;
  sd_plus_2?: number;
  sd_plus_1?: number;
  sd_minus_1?: number;
  sd_minus_2?: number;
  position?: string;
  r_squared?: number;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  page_size: number;
  items: T[];
}
