from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.services import CompanyService, ScreenerService, FinancialReportService, TrendAnalysisService
from app.models.schemas import (
    CompanyResponse, CompanyDetail, ScreenerFilter,
    ScreenerResult, FinancialReportResponse, TrendAnalysisResponse,
    PaginatedResponse
)

router = APIRouter(prefix="/api", tags=["stocks"])

@router.get("/companies", response_model=PaginatedResponse)
async def get_companies(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    service = CompanyService(db)
    skip = (page - 1) * page_size
    companies, total = await service.get_all(skip=skip, limit=page_size)
    
    return PaginatedResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[CompanyResponse.model_validate(c) for c in companies]
    )

@router.get("/companies/{stock_code}", response_model=CompanyDetail)
async def get_company_detail(
    stock_code: str,
    db: AsyncSession = Depends(get_db)
):
    service = CompanyService(db)
    company = await service.get_detail(stock_code)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@router.get("/companies/{stock_code}/financial-reports", response_model=List[FinancialReportResponse])
async def get_financial_reports(
    stock_code: str,
    years: Optional[int] = Query(None, ge=1, le=10),
    db: AsyncSession = Depends(get_db)
):
    company_service = CompanyService(db)
    company = await company_service.get_by_code(stock_code)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    report_service = FinancialReportService(db)
    return await report_service.get_by_company(company.id, years=years)

@router.get("/companies/{stock_code}/trend", response_model=TrendAnalysisResponse)
async def get_trend_analysis(
    stock_code: str,
    db: AsyncSession = Depends(get_db)
):
    company_service = CompanyService(db)
    company = await company_service.get_by_code(stock_code)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    trend_service = TrendAnalysisService(db)
    trend = await trend_service.get_latest(company.id)
    if not trend:
        raise HTTPException(status_code=404, detail="Trend analysis not found")
    return trend

@router.post("/screener", response_model=ScreenerResult)
async def screen_stocks(
    filters: ScreenerFilter,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    service = ScreenerService(db)
    skip = (page - 1) * page_size
    return await service.screen(filters, skip=skip, limit=page_size)

@router.get("/industries")
async def get_industries(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select, func, distinct
    from app.models.models import Company
    
    result = await db.execute(
        select(Company.industry, func.count(Company.id))
        .where(Company.industry.isnot(None))
        .group_by(Company.industry)
        .order_by(func.count(Company.id).desc())
    )
    industries = [{"name": row[0], "count": row[1]} for row in result.all()]
    return industries

@router.get("/signals")
async def get_signals():
    return [
        {"value": "低估", "label": "低估", "description": "財報良好，股價顯著被低估"},
        {"value": "低價", "label": "低價", "description": "財報良好，股價偏低"},
        {"value": "中等", "label": "中等", "description": "財報良好，股價中等"},
        {"value": "過熱", "label": "過熱", "description": "財報良好，股價過熱"},
        {"value": "觀望", "label": "觀望", "description": "財報狀況不佳"}
    ]
