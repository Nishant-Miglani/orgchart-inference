import {
  Company,
  CompanySummary,
  BenchmarkReport,
  SalesQueryLeaderResponse,
  ReportingChainResponse,
} from "../types";

const API_BASE = "/api";

export async function fetchCompanies(params?: {
  sub_sector?: string;
  domain_type?: string;
  search?: string;
  size_category?: string;
  min_precision?: number;
  limit?: number;
  offset?: number;
}): Promise<{ total: number; items: CompanySummary[] }> {
  const query = new URLSearchParams();
  if (params?.sub_sector) query.set("sub_sector", params.sub_sector);
  if (params?.domain_type) query.set("domain_type", params.domain_type);
  if (params?.search) query.set("search", params.search);
  if (params?.size_category) query.set("size_category", params.size_category);
  if (params?.min_precision !== undefined) query.set("min_precision", params.min_precision.toString());
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.offset) query.set("offset", params.offset.toString());

  const res = await fetch(`${API_BASE}/companies?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch companies: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchCompany(companyId: string): Promise<Company> {
  const res = await fetch(`${API_BASE}/companies/${companyId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch company ${companyId}: ${res.statusText}`);
  }
  return res.json();
}

export async function reinferCompany(
  companyId: string,
  confidenceThreshold: number
): Promise<Company> {
  const res = await fetch(
    `${API_BASE}/companies/${companyId}/re-infer?confidence_threshold=${confidenceThreshold}`,
    { method: "POST" }
  );
  if (!res.ok) {
    throw new Error(`Failed to re-infer company ${companyId}: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchSalesLeader(
  companyId: string,
  department: string = "Data & Analytics"
): Promise<SalesQueryLeaderResponse> {
  const res = await fetch(
    `${API_BASE}/companies/${companyId}/sales/leader?department=${encodeURIComponent(
      department
    )}`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch department leader: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchSalesChain(
  companyId: string,
  options: { employeeId?: string; titleKeyword?: string }
): Promise<ReportingChainResponse> {
  const query = new URLSearchParams();
  if (options.employeeId) query.set("employee_id", options.employeeId);
  if (options.titleKeyword) query.set("title_keyword", options.titleKeyword);

  const res = await fetch(`${API_BASE}/companies/${companyId}/sales/chain?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch reporting chain: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchBenchmarkReport(): Promise<BenchmarkReport> {
  const res = await fetch(`${API_BASE}/benchmark`);
  if (!res.ok) {
    throw new Error(`Failed to fetch benchmark report: ${res.statusText}`);
  }
  return res.json();
}
