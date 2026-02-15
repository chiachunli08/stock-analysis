from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from decimal import Decimal
from datetime import date

from app.models.models import Company, FinancialReport, StockPrice, Indicator, TrendAnalysis
from app.models.schemas import (
    CompanyResponse, CompanyDetail, FinancialReportResponse,
    StockPriceResponse, IndicatorResponse, ScreenerFilter,
    ScreenerResult, TrendAnalysisResponse
)

class CompanyService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all(self, skip: int = 0, limit: int = 50) -> tuple[List[Company], int]:
        result = await self.db.execute(
            select(Company).order_by(Company.stock_code).offset(skip).limit(limit)
        )
        companies = result.scalars().all()
        
        count_result = await self.db.execute(select(func.count(Company.id)))
        total = count_result.scalar()
        
        return companies, total
    
    async def get_by_code(self, stock_code: str) -> Optional[Company]:
        result = await self.db.execute(
            select(Company).where(Company.stock_code == stock_code)
        )
        return result.scalar_one_or_none()
    
    async def get_detail(self, stock_code: str) -> Optional[CompanyDetail]:
        company = await self.get_by_code(stock_code)
        if not company:
            return None
        
        latest_indicators = await self._get_latest_indicators(company.id)
        latest_price = await self._get_latest_price(company.id)
        
        return CompanyDetail(
            **{c.name: getattr(company, c.name) for c in company.__table__.columns},
            latest_indicators=latest_indicators,
            latest_price=latest_price
        )
    
    async def _get_latest_indicators(self, company_id: int) -> Optional[IndicatorResponse]:
        result = await self.db.execute(
            select(Indicator)
            .where(Indicator.company_id == company_id)
            .order_by(Indicator.report_date.desc())
            .limit(1)
        )
        indicator = result.scalar_one_or_none()
        return IndicatorResponse.model_validate(indicator) if indicator else None
    
    async def _get_latest_price(self, company_id: int) -> Optional[StockPriceResponse]:
        result = await self.db.execute(
            select(StockPrice)
            .where(StockPrice.company_id == company_id)
            .order_by(StockPrice.date.desc())
            .limit(1)
        )
        price = result.scalar_one_or_none()
        return StockPriceResponse.model_validate(price) if price else None

class ScreenerService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def screen(self, filters: ScreenerFilter, skip: int = 0, limit: int = 50) -> ScreenerResult:
        subquery = (
            select(
                Indicator.company_id,
                func.max(Indicator.report_date).label("max_date")
            )
            .group_by(Indicator.company_id)
            .subquery()
        )
        
        query = (
            select(Company, Indicator)
            .join(Indicator, Company.id == Indicator.company_id)
            .join(
                subquery,
                and_(
                    Indicator.company_id == subquery.c.company_id,
                    Indicator.report_date == subquery.c.max_date
                )
            )
        )
        
        if filters.roe_min is not None:
            query = query.where(Indicator.roe >= filters.roe_min)
        if filters.roe_max is not None:
            query = query.where(Indicator.roe <= filters.roe_max)
        if filters.pe_min is not None:
            query = query.where(Indicator.pe_ttm >= filters.pe_min)
        if filters.pe_max is not None:
            query = query.where(Indicator.pe_ttm <= filters.pe_max)
        if filters.pb_min is not None:
            query = query.where(Indicator.pb_ratio >= filters.pb_min)
        if filters.pb_max is not None:
            query = query.where(Indicator.pb_ratio <= filters.pb_max)
        if filters.current_ratio_min is not None:
            query = query.where(Indicator.current_ratio >= filters.current_ratio_min)
        if filters.f_score_min is not None:
            query = query.where(Indicator.f_score >= filters.f_score_min)
        if filters.cbs_score_min is not None:
            query = query.where(Indicator.cbs_score >= filters.cbs_score_min)
        if filters.signal:
            query = query.where(Indicator.signal.in_(filters.signal))
        if filters.industry:
            query = query.where(Company.industry.in_(filters.industry))
        if filters.market:
            query = query.where(Company.market.in_(filters.market))
        
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        result = await self.db.execute(query.offset(skip).limit(limit))
        rows = result.all()
        
        companies = []
        for company, indicator in rows:
            companies.append(CompanyDetail(
                **{c.name: getattr(company, c.name) for c in company.__table__.columns},
                latest_indicators=IndicatorResponse.model_validate(indicator)
            ))
        
        return ScreenerResult(total=total, companies=companies)

class FinancialReportService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_company(
        self, company_id: int, 
        years: Optional[int] = None,
        skip: int = 0, limit: int = 20
    ) -> List[FinancialReportResponse]:
        query = (
            select(FinancialReport)
            .where(FinancialReport.company_id == company_id)
            .order_by(FinancialReport.report_date.desc())
        )
        
        if years:
            start_year = date.today().year - years
            query = query.where(FinancialReport.year >= start_year)
        
        result = await self.db.execute(query.offset(skip).limit(limit))
        reports = result.scalars().all()
        
        return [FinancialReportResponse.model_validate(r) for r in reports]

class TrendAnalysisService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_latest(self, company_id: int) -> Optional[TrendAnalysisResponse]:
        result = await self.db.execute(
            select(TrendAnalysis)
            .where(TrendAnalysis.company_id == company_id)
            .order_by(TrendAnalysis.calculation_date.desc())
            .limit(1)
        )
        trend = result.scalar_one_or_none()
        return TrendAnalysisResponse.model_validate(trend) if trend else None
