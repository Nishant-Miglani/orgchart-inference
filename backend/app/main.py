"""
FastAPI Main Application:
Provides high-performance REST APIs for company org charts,
real-time inference, evaluation metrics, and sales deal intelligence.
"""

from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from backend.app.schemas import (
    Company,
    CompanySummary,
    SalesQueryLeaderResponse,
    ReportingChainResponse,
)
from backend.app.services.data_store import CompanyDataStore
from backend.app.services.sales_query import SalesQueryService
from backend.app.inference.pipeline import InferencePipeline

app = FastAPI(
    title="Firmable Org Chart Inference Platform",
    description="AI-native org chart hierarchy inference from unstructured employee directories in Retail.",
    version="1.0.0",
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

data_store = CompanyDataStore.get_instance()
sales_service = SalesQueryService(data_store=data_store)


@app.get("/api/health")
def health_check():
    summaries, total = data_store.list_companies(limit=1)
    return {
        "status": "healthy",
        "total_companies": total,
        "platform": "Firmable Org Chart Inference Engine",
        "industry": "Retail & E-Commerce",
    }


@app.get("/api/companies")
def list_companies(
    sub_sector: Optional[str] = Query(None, description="Filter by retail category/sub-sector"),
    search: Optional[str] = Query(None, description="Search company name, HQ, or sector"),
    size_category: Optional[str] = Query(None, description="Filter by size tier"),
    min_precision: Optional[float] = Query(None, description="Filter by minimum precision score"),
    limit: int = Query(500, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    companies, total_count = data_store.list_companies(
        sub_sector=sub_sector,
        search_query=search,
        size_category=size_category,
        min_precision=min_precision,
        limit=limit,
        offset=offset,
    )
    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "items": companies,
    }


@app.get("/api/companies/{company_id}", response_model=Company)
def get_company(company_id: str):
    company = data_store.get_company(company_id)
    if not company:
        raise HTTPException(status_code=404, detail=f"Company {company_id} not found.")
    return company


@app.post("/api/companies/{company_id}/re-infer", response_model=Company)
def reinfer_company_org(
    company_id: str,
    confidence_threshold: float = Query(0.68, ge=0.40, le=0.95),
):
    """
    Runs live inference with a customized confidence threshold slider.
    Allows user to observe precision vs recall trade-offs in real time!
    """
    company = data_store.get_company(company_id)
    if not company:
        raise HTTPException(status_code=404, detail=f"Company {company_id} not found.")

    pipeline = InferencePipeline(confidence_threshold=confidence_threshold)
    updated_company = pipeline.process_company(company)
    return updated_company


@app.get("/api/companies/{company_id}/sales/leader", response_model=SalesQueryLeaderResponse)
def get_department_leader(
    company_id: str,
    department: str = Query("Data & Analytics", description="Department to find leader for"),
):
    """
    Answers: 'Who runs the data team at this company?'
    """
    result = sales_service.find_department_leader(company_id=company_id, department_query=department)
    if not result:
        raise HTTPException(status_code=404, detail="No matching department leader found.")
    return result


@app.get("/api/companies/{company_id}/sales/chain", response_model=ReportingChainResponse)
def get_reporting_chain_and_economic_buyer(
    company_id: str,
    employee_id: Optional[str] = Query(None, description="Employee ID to trace"),
    title_keyword: Optional[str] = Query(None, description="Job title keyword (e.g. 'Security', 'Buyer')"),
):
    """
    Answers:
    1. 'Who does the Head of Security report to?'
    2. 'Who is the economic buyer above this champion?'
    """
    result = sales_service.get_reporting_chain_and_economic_buyer(
        company_id=company_id,
        employee_id=employee_id,
        title_keyword=title_keyword,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Employee or title keyword not found in company directory.")
    return result


@app.get("/api/benchmark")
def get_benchmark():
    """
    Returns global ground-truth benchmark metrics across all 500 retail companies.
    """
    report = data_store.get_benchmark_report()
    return report


from fastapi.staticfiles import StaticFiles

frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
