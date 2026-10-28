export type SeniorityLevel =
  | "L0_EXEC"
  | "L1_C_SUITE"
  | "L2_VP"
  | "L3_DIRECTOR"
  | "L4_MANAGER"
  | "L5_SENIOR_IC"
  | "L6_IC";

export type RetailDepartment =
  | "Executive Leadership"
  | "Merchandising & Buying"
  | "Supply Chain & Logistics"
  | "Store Operations & Field"
  | "E-Commerce & Digital"
  | "Data & Analytics"
  | "Technology & IT"
  | "Marketing & Brand"
  | "Loss Prevention & Security"
  | "Finance & Accounting"
  | "People & HR"
  | "Legal & Compliance";

export type EdgeType = "primary" | "matrix";

export interface ReportingEdge {
  source_id: string;
  target_id: string;
  edge_type: EdgeType;
  confidence: number;
  inference_rationale: string;
  is_correct?: boolean | null;
}

export interface Employee {
  id: string;
  name: string;
  raw_title: string;
  department_raw?: string | null;
  location?: string | null;

  ground_truth_manager_id?: string | null;
  ground_truth_matrix_manager_id?: string | null;
  ground_truth_seniority?: SeniorityLevel | null;
  ground_truth_department?: RetailDepartment | null;

  inferred_seniority?: SeniorityLevel | null;
  inferred_department?: RetailDepartment | null;
  inferred_track?: string | null;
  inferred_manager_id?: string | null;
  inferred_matrix_manager_id?: string | null;
  manager_confidence?: number | null;
  matrix_confidence?: number | null;
  confidence_rationale?: string | null;
}

export interface Company {
  id: string;
  name: string;
  domain?: string;
  domain_type?: string;
  sub_sector: string;
  size_category: string;
  employee_count: number;
  headquarters: string;
  founded_year: number;
  employees: Employee[];
  inferred_edges: ReportingEdge[];
  ground_truth_edges?: ReportingEdge[];
  evaluation_summary?: EvaluationSummary | null;
}

export interface EvaluationSummary {
  company_id: string;
  company_name: string;
  total_employees: number;
  ground_truth_primary_edges: number;
  ground_truth_matrix_edges: number;
  inferred_primary_edges: number;
  inferred_matrix_edges: number;
  true_positives: number;
  false_positives: number;
  false_negatives: number;
  precision: number;
  recall: number;
  f1_score: number;
  wrong_edge_rate: number;
  matrix_precision: number;
  matrix_recall: number;
  department_accuracy: number;
  seniority_accuracy: number;
  unassigned_count: number;
}

export interface CompanySummary {
  id: string;
  name: string;
  domain?: string;
  domain_type?: string;
  sub_sector: string;
  size_category: string;
  employee_count: number;
  headquarters: string;
  precision: number;
  recall: number;
  f1_score: number;
  wrong_edge_rate: number;
  unassigned_count: number;
}

export interface SalesQueryLeaderResponse {
  department: string;
  leader?: Employee | null;
  chain_to_ceo: Employee[];
  direct_reports_count: number;
  total_department_size: number;
  confidence: number;
  explanation: string;
}

export interface ReportingChainHop {
  employee: Employee;
  confidence: number;
  edge_type: string;
  rationale: string;
}

export interface ReportingChainResponse {
  target_employee: Employee;
  chain: ReportingChainHop[];
  economic_buyer?: Employee | null;
  economic_buyer_budget_authority: string;
  explanation: string;
}

export interface BenchmarkReport {
  execution_time_seconds: number;
  total_companies_evaluated: number;
  total_employees_evaluated: number;
  confidence_threshold: number;
  aggregate_metrics: {
    global_precision: number;
    global_recall: number;
    global_f1: number;
    global_wrong_edge_rate: number;
    true_positives: number;
    false_positives: number;
    false_negatives: number;
    total_ground_truth_edges: number;
    total_inferred_edges: number;
    total_unassigned_nodes: number;
  };
  by_sub_sector: Record<
    string,
    {
      companies: number;
      precision: number;
      recall: number;
      wrong_edge_rate: number;
    }
  >;
}
