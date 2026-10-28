from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class SeniorityLevel(str, Enum):
    L0_EXEC = "L0_EXEC"            # CEO, President, Founder
    L1_C_SUITE = "L1_C_SUITE"      # Chief Officers (CTO, CMO, CFO, COO, CSCO, CPO)
    L2_VP = "L2_VP"                # VP, SVP, EVP
    L3_DIRECTOR = "L3_DIRECTOR"    # Director, Senior Director, Head of
    L4_MANAGER = "L4_MANAGER"      # Manager, Lead, Supervisor, District Manager
    L5_SENIOR_IC = "L5_SENIOR_IC"  # Senior Buyer, Senior Engineer, Senior Analyst
    L6_IC = "L6_IC"                # Associate, Coordinator, Specialist, IC


class RetailDepartment(str, Enum):
    EXECUTIVE = "Executive Leadership"
    MERCHANDISING = "Merchandising & Buying"
    SUPPLY_CHAIN = "Supply Chain & Logistics"
    STORE_OPS = "Store Operations & Field"
    ECOMMERCE = "E-Commerce & Digital"
    DATA_ANALYTICS = "Data & Analytics"
    TECHNOLOGY = "Technology & IT"
    MARKETING = "Marketing & Brand"
    LOSS_PREVENTION = "Loss Prevention & Security"
    FINANCE = "Finance & Accounting"
    PEOPLE = "People & HR"
    LEGAL = "Legal & Compliance"


class EdgeType(str, Enum):
    PRIMARY = "primary"  # 95% single-manager primary reporting
    MATRIX = "matrix"    # 5% dotted line dual reporting


class ReportingEdge(BaseModel):
    source_id: str = Field(..., description="Employee who reports")
    target_id: str = Field(..., description="Manager being reported to")
    edge_type: EdgeType = Field(default=EdgeType.PRIMARY)
    confidence: float = Field(..., ge=0.0, le=1.0)
    inference_rationale: str = Field(default="")
    is_correct: Optional[bool] = Field(default=None, description="Compared with Ground Truth")


class Employee(BaseModel):
    id: str
    name: str
    raw_title: str
    department_raw: Optional[str] = None
    location: Optional[str] = None
    
    # Ground Truth fields (used for benchmarking)
    ground_truth_manager_id: Optional[str] = None
    ground_truth_matrix_manager_id: Optional[str] = None
    ground_truth_seniority: Optional[SeniorityLevel] = None
    ground_truth_department: Optional[RetailDepartment] = None
    
    # Inferred fields
    inferred_seniority: Optional[SeniorityLevel] = None
    inferred_department: Optional[RetailDepartment] = None
    inferred_track: Optional[str] = None
    inferred_manager_id: Optional[str] = None
    inferred_matrix_manager_id: Optional[str] = None
    manager_confidence: Optional[float] = None
    matrix_confidence: Optional[float] = None
    confidence_rationale: Optional[str] = None


class Company(BaseModel):
    id: str
    name: str
    domain: Optional[str] = None
    domain_type: Optional[str] = None
    sub_sector: str
    size_category: str
    employee_count: int
    headquarters: str
    founded_year: int
    employees: List[Employee]
    inferred_edges: List[ReportingEdge] = []
    ground_truth_edges: List[ReportingEdge] = []
    evaluation_summary: Optional[Dict[str, Any]] = None


class CompanySummary(BaseModel):
    id: str
    name: str
    domain: Optional[str] = None
    domain_type: Optional[str] = None
    sub_sector: str
    size_category: str
    employee_count: int
    headquarters: str
    precision: float = 0.0
    recall: float = 0.0
    f1_score: float = 0.0
    wrong_edge_rate: float = 0.0
    unassigned_count: int = 0


class SalesQueryLeaderResponse(BaseModel):
    department: str
    leader: Optional[Employee] = None
    chain_to_ceo: List[Employee] = []
    direct_reports_count: int = 0
    total_department_size: int = 0
    confidence: float = 0.0
    explanation: str


class ReportingChainResponse(BaseModel):
    target_employee: Employee
    chain: List[Dict[str, Any]]  # List of {employee: Employee, confidence: float, edge_type: str}
    economic_buyer: Optional[Employee] = None
    economic_buyer_budget_authority: str
    explanation: str


class EvaluationMetrics(BaseModel):
    total_companies: int
    total_employees: int
    total_ground_truth_edges: int
    total_inferred_edges: int
    true_positives: int
    false_positives: int
    false_negatives: int
    precision: float
    recall: float
    f1_score: float
    wrong_edge_rate: float  # False Positives / Total Inferred Edges
    matrix_precision: float
    matrix_recall: float
    by_department: Dict[str, Dict[str, float]] = {}
    by_seniority: Dict[str, Dict[str, float]] = {}
