"""
Unit & Integration Tests for Org Chart Inference Platform
"""

import pytest
from fastapi.testclient import TestClient

from backend.app.schemas import (
    SeniorityLevel,
    RetailDepartment,
    EdgeType,
    Company,
    Employee,
)
from backend.app.inference.normalizer import TitleNormalizer
from backend.app.generator.org_synthesizer import OrgSynthesizer
from backend.app.generator.noise_injector import NoiseInjector
from backend.app.inference.graph_solver import OrgGraphSolver
from backend.app.evaluation.metrics import Evaluator
from backend.app.main import app

client = TestClient(app)


def test_title_normalization_seniority():
    # L0 CEO
    assert TitleNormalizer.infer_seniority("Chief Executive Officer") == SeniorityLevel.L0_EXEC
    assert TitleNormalizer.infer_seniority("CEO & President") == SeniorityLevel.L0_EXEC
    
    # L1 C-Suite
    assert TitleNormalizer.infer_seniority("Chief Technology Officer") == SeniorityLevel.L1_C_SUITE
    assert TitleNormalizer.infer_seniority("EVP Global Merchandising") == SeniorityLevel.L1_C_SUITE
    
    # L2 VP
    assert TitleNormalizer.infer_seniority("VP Category Management") == SeniorityLevel.L2_VP
    assert TitleNormalizer.infer_seniority("SVP Global Logistics") == SeniorityLevel.L2_VP
    
    # L3 Director
    assert TitleNormalizer.infer_seniority("Director of Category Buying") == SeniorityLevel.L3_DIRECTOR
    assert TitleNormalizer.infer_seniority("General Merchandise Manager (GMM)") == SeniorityLevel.L3_DIRECTOR
    
    # L4 Manager
    assert TitleNormalizer.infer_seniority("Category Buying Manager") == SeniorityLevel.L4_MANAGER
    assert TitleNormalizer.infer_seniority("District Store Manager") == SeniorityLevel.L4_MANAGER
    
    # L5 Senior IC
    assert TitleNormalizer.infer_seniority("Senior Category Buyer") == SeniorityLevel.L5_SENIOR_IC
    assert TitleNormalizer.infer_seniority("Store General Manager") == SeniorityLevel.L5_SENIOR_IC
    
    # L6 IC
    assert TitleNormalizer.infer_seniority("Associate Buyer") == SeniorityLevel.L6_IC
    assert TitleNormalizer.infer_seniority("Retail Sales Associate") == SeniorityLevel.L6_IC


def test_title_normalization_departments():
    assert TitleNormalizer.infer_department("Senior Category Buyer") == RetailDepartment.MERCHANDISING
    assert TitleNormalizer.infer_department("Distribution Center General Manager") == RetailDepartment.SUPPLY_CHAIN
    assert TitleNormalizer.infer_department("District Store Manager") == RetailDepartment.STORE_OPS
    assert TitleNormalizer.infer_department("Lead Demand Forecasting Scientist") == RetailDepartment.DATA_ANALYTICS
    assert TitleNormalizer.infer_department("Director of Store Systems & POS") == RetailDepartment.TECHNOLOGY
    assert TitleNormalizer.infer_department("Senior Loss Prevention Investigator") == RetailDepartment.LOSS_PREVENTION
    assert TitleNormalizer.infer_department("FP&A Manager - Retail Operations") == RetailDepartment.FINANCE
    assert TitleNormalizer.infer_department("Senior HR Business Partner") == RetailDepartment.PEOPLE
    assert TitleNormalizer.infer_department("Corporate Compliance Manager") == RetailDepartment.LEGAL


def test_dataset_synthesizer_constraints():
    synth = OrgSynthesizer(seed=123)
    employees, edges = synth.generate_company_org(
        company_id="test_comp",
        company_name="Test Retailer",
        sub_sector="Fashion & Apparel",
        target_size=120,
    )

    assert len(employees) >= 100
    # Exactly 1 root CEO
    ceos = [e for e in employees if e.ground_truth_seniority == SeniorityLevel.L0_EXEC]
    assert len(ceos) == 1

    # Check 5% matrix reporting edges
    matrix_edges = [e for e in edges if e.edge_type == EdgeType.MATRIX]
    total_emp = len(employees)
    assert len(matrix_edges) >= 2
    # Matrix ratio should be around 5%
    matrix_ratio = len(matrix_edges) / total_emp
    assert 0.03 <= matrix_ratio <= 0.08


def test_wrong_edge_is_worse_than_no_edge():
    """Verifies that ambiguous candidates are suppressed rather than guessed."""
    solver = OrgGraphSolver(confidence_threshold=0.68)
    
    # Create ambiguous IC with non-existent or ambiguous manager
    orphan_emp = Employee(
        id="emp_orphan",
        name="Mystery Consultant",
        raw_title="Special Cross-Company Advisor",
        department_raw="Unknown",
        location="Remote",
    )
    ceo_emp = Employee(
        id="emp_ceo",
        name="Alex Boss",
        raw_title="Chief Executive Officer",
        department_raw="Executive",
        location="HQ",
    )
    
    edges, resolved = solver.solve_company_hierarchy([ceo_emp, orphan_emp])
    # The mystery advisor should NOT be arbitrarily assigned a wrong edge
    assert orphan_emp.inferred_manager_id is None
    assert "Unresolved" in (orphan_emp.confidence_rationale or "")


def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["total_companies"] >= 500


def test_api_company_list_and_filter():
    res = client.get("/api/companies?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 500
    assert len(data["items"]) == 10
    assert "domain" in data["items"][0]
    assert "domain_type" in data["items"][0]

    # Filter by category (sub_sector)
    res_cat = client.get("/api/companies?sub_sector=Fashion%20%26%20Apparel")
    assert res_cat.status_code == 200
    assert res_cat.json()["total"] > 0
    assert all(c["sub_sector"] == "Fashion & Apparel" for c in res_cat.json()["items"])

    # Filter by domain_type
    res_dt = client.get("/api/companies?domain_type=.store")
    assert res_dt.status_code == 200
    assert res_dt.json()["total"] > 0
    assert all(".store" in (c["domain_type"] or "") for c in res_dt.json()["items"])

    # Search by domain
    res_search = client.get("/api/companies?search=harborsupermarkets.com")
    assert res_search.status_code == 200
    assert res_search.json()["total"] >= 1
    assert any("harborsupermarkets.com" in (c["domain"] or "") for c in res_search.json()["items"])


def test_api_sales_queries():
    # Query Data leader
    res_leader = client.get("/api/companies/comp_0001/sales/leader?department=Data%20%26%20Analytics")
    assert res_leader.status_code == 200
    assert "leader" in res_leader.json()

    # Query Security reporting path & economic buyer
    res_sec = client.get("/api/companies/comp_0001/sales/chain?title_keyword=Security")
    assert res_sec.status_code == 200
    data = res_sec.json()
    assert "target_employee" in data
    assert "chain" in data
    assert "economic_buyer" in data
