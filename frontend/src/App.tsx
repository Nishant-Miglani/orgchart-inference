import React, { useState, useEffect } from "react";
import {
  fetchCompanies,
  fetchCompany,
  reinferCompany,
  fetchBenchmarkReport,
} from "./services/api";
import { Company, CompanySummary, Employee, BenchmarkReport } from "./types";
import { Navbar } from "./components/Navbar";
import { CompanySearchBar } from "./components/CompanySearchBar";
import { CompanyHeader, CompanyDetailTab } from "./components/CompanyHeader";
import { OrgChartCanvas } from "./components/OrgChartCanvas";
import { DirectoryView } from "./components/DirectoryView";
import { SalesIntelligenceView } from "./components/SalesIntelligenceView";
import { CompanyAnalyticsView } from "./components/CompanyAnalyticsView";
import { NodeDrawer } from "./components/NodeDrawer";
import { BenchmarkModal } from "./components/BenchmarkModal";
import { Search, Sliders, Sparkles, X } from "lucide-react";

export const App: React.FC = () => {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("comp_0001");
  const [company, setCompany] = useState<Company | null>(null);

  // Category & Domain Type Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedDomainType, setSelectedDomainType] = useState<string>("All");

  // Detail view active tab
  const [activeTab, setActiveTab] = useState<CompanyDetailTab>("chart");

  // Selected employee for side drawer
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [highlightedEmployeeIds, setHighlightedEmployeeIds] = useState<Set<string>>(new Set());
  const [economicBuyerId, setEconomicBuyerId] = useState<string | undefined>(undefined);

  // Org chart view controls
  const [chartDepartmentFilter, setChartDepartmentFilter] = useState<string>("All");
  const [chartPersonSearch, setChartPersonSearch] = useState<string>("" );
  const [compareWithGroundTruth, setCompareWithGroundTruth] = useState<boolean>(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.68);
  const [showThresholdControl, setShowThresholdControl] = useState<boolean>(false);
  const [isReinferring, setIsReinferring] = useState<boolean>(false);

  // Benchmark modal
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState<boolean>(false);
  const [benchmarkReport, setBenchmarkReport] = useState<BenchmarkReport | null>(null);

  // Status
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Load companies index on mount
  useEffect(() => {
    async function loadInitial() {
      try {
        const data = await fetchCompanies({ limit: 500 });
        setCompanies(data.items);
        if (data.items.length > 0) {
          const firstId = data.items[0].id;
          setSelectedCompanyId(firstId);
          const compData = await fetchCompany(firstId);
          setCompany(compData);
        }
      } catch (err) {
        console.error("Failed to load initial dataset:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitial();
  }, []);

  // Load company when selection changes
  const handleSelectCompany = async (companyId: string) => {
    setSelectedCompanyId(companyId);
    setSelectedEmployee(null);
    setHighlightedEmployeeIds(new Set());
    setEconomicBuyerId(undefined);
    setBannerMessage(null);
    setChartDepartmentFilter("All");
    setChartPersonSearch("");
    try {
      const compData = await fetchCompany(companyId);
      setCompany(compData);
    } catch (err) {
      console.error("Failed to load company:", err);
    }
  };

  // Re-Inference with threshold slider
  const handleReinfer = async () => {
    if (!company) return;
    setIsReinferring(true);
    try {
      const updated = await reinferCompany(company.id, confidenceThreshold);
      setCompany(updated);
      setBannerMessage(`Org chart re-inferred with ${(confidenceThreshold * 100).toFixed(0)}% confidence cutoff.`);
    } catch (err) {
      console.error("Failed to re-infer:", err);
    } finally {
      setIsReinferring(false);
    }
  };

  // Open Benchmark Report
  const handleOpenBenchmark = async () => {
    try {
      const rep = await fetchBenchmarkReport();
      setBenchmarkReport(rep);
      setIsBenchmarkOpen(true);
    } catch (err) {
      console.error("Failed to fetch benchmark report:", err);
    }
  };

  // Trace reporting path from node drawer or directory
  const handleHighlightChain = (emp: Employee) => {
    if (!company) return;
    const empMap = new Map(company.employees.map((e) => [e.id, e]));
    const ids = new Set<string>([emp.id]);
    let curr = emp.inferred_manager_id ? empMap.get(emp.inferred_manager_id) : null;
    let buyerId: string | undefined = undefined;

    while (curr && !ids.has(curr.id)) {
      ids.add(curr.id);
      if (!buyerId && ["L2_VP", "L1_C_SUITE", "L0_EXEC"].includes(curr.inferred_seniority || "")) {
        buyerId = curr.id;
      }
      curr = curr.inferred_manager_id ? empMap.get(curr.inferred_manager_id) : null;
    }

    setHighlightedEmployeeIds(ids);
    setEconomicBuyerId(buyerId);
    setSelectedEmployee(emp);
    setBannerMessage(`Tracing reporting hierarchy for ${emp.name} (${emp.raw_title}) up to Executive Leadership.`);
  };

  // Auto-search person within org chart
  const handleChartPersonSearch = (val: string) => {
    setChartPersonSearch(val);
    if (!val.trim() || !company) return;
    const matched = company.employees.find(
      (e) =>
        e.name.toLowerCase().includes(val.toLowerCase()) ||
        e.raw_title.toLowerCase().includes(val.toLowerCase())
    );
    if (matched) {
      setSelectedEmployee(matched);
      setHighlightedEmployeeIds(new Set([matched.id]));
    }
  };

  if (isLoading || !company) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "var(--bg-primary)",
          color: "var(--text-secondary)",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "3px solid #e2e8f0",
            borderTopColor: "var(--accent-blue)",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
          Loading 500 Enterprise Retail Companies & Org Charts...
        </div>
      </div>
    );
  }

  // Unique departments for canvas filter
  const departments = Array.from(
    new Set(company.employees.map((e) => e.inferred_department).filter(Boolean))
  ) as string[];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "#f8fafc" }}>
      {/* 1. Sleek Top Navbar */}
      <Navbar
        compareWithGroundTruth={compareWithGroundTruth}
        onToggleGroundTruth={() => setCompareWithGroundTruth(!compareWithGroundTruth)}
        onOpenBenchmark={handleOpenBenchmark}
        precisionScore={company.evaluation_summary?.precision}
        totalCompanies={companies.length}
      />

      {/* 2. Company Search Box & Category / Domain Type Filters */}
      <CompanySearchBar
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        onSelectCompany={handleSelectCompany}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedDomainType={selectedDomainType}
        onSelectDomainType={setSelectedDomainType}
      />

      {/* 3. Selected Company Details Header & Navigation Tabs */}
      <CompanyHeader
        company={company}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 4. Notification Banner (if any chain is traced or re-inferred) */}
      {bannerMessage && (
        <div
          style={{
            padding: "8px 24px",
            background: "#eff6ff",
            borderBottom: "1px solid #bfdbfe",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "#1e40af",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={14} color="var(--accent-blue)" />
            <span>{bannerMessage}</span>
          </div>
          <button
            onClick={() => setBannerMessage(null)}
            style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 5. Main Content Area based on Active Tab */}
      <div style={{ flex: 1, position: "relative", display: "flex", overflow: "hidden" }}>
        {activeTab === "chart" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
            {/* Org Chart Sub-Toolbar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 20px",
                background: "#ffffff",
                borderBottom: "1px solid var(--border-subtle)",
                zIndex: 10,
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {/* Department filter for canvas */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
                    Filter Dept:
                  </span>
                  <select
                    value={chartDepartmentFilter}
                    onChange={(e) => setChartDepartmentFilter(e.target.value)}
                    style={{
                      height: "32px",
                      padding: "0 8px",
                      background: "#ffffff",
                      border: "1px solid var(--border-medium)",
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: "var(--text-primary)",
                      outline: "none",
                    }}
                  >
                    <option value="All">All Departments ({company.employees.length} nodes)</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Person search inside chart */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "0 8px",
                    background: "#ffffff",
                    border: "1px solid var(--border-medium)",
                    borderRadius: "6px",
                    height: "32px",
                    width: "220px",
                  }}
                >
                  <Search size={13} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Find person in chart..."
                    value={chartPersonSearch}
                    onChange={(e) => handleChartPersonSearch(e.target.value)}
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontSize: "12px",
                      color: "var(--text-primary)",
                      width: "100%",
                    }}
                  />
                  {chartPersonSearch && (
                    <button
                      onClick={() => setChartPersonSearch("")}
                      style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Right: Confidence Threshold Settings */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={() => setShowThresholdControl(!showThresholdControl)}
                  className={`btn-chip ${showThresholdControl ? "active" : ""}`}
                  style={{ fontSize: "11px", padding: "4px 8px" }}
                  title="Adjust AI Confidence Cutoff"
                >
                  <Sliders size={12} />
                  Cutoff: {(confidenceThreshold * 100).toFixed(0)}%
                </button>

                {highlightedEmployeeIds.size > 0 && (
                  <button
                    onClick={() => {
                      setHighlightedEmployeeIds(new Set());
                      setEconomicBuyerId(undefined);
                      setBannerMessage(null);
                    }}
                    className="btn-secondary"
                    style={{ fontSize: "11px", padding: "4px 8px" }}
                  >
                    Clear Highlights
                  </button>
                )}
              </div>
            </div>

            {/* Threshold Popover Drawer (if open) */}
            {showThresholdControl && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 20px",
                  background: "#ffffff",
                  borderBottom: "1px solid var(--border-medium)",
                  fontSize: "12px",
                  zIndex: 20,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                    Confidence Threshold: <strong style={{ color: "var(--accent-blue)" }}>{(confidenceThreshold * 100).toFixed(0)}%</strong>
                  </span>
                  <input
                    type="range"
                    min="0.45"
                    max="0.95"
                    step="0.05"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                    style={{ width: "150px", accentColor: "var(--accent-blue)", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    (Higher = stricter precision. Lower = higher recall.)
                  </span>
                </div>

                <button
                  onClick={handleReinfer}
                  disabled={isReinferring}
                  className="btn-primary"
                  style={{ fontSize: "11px", padding: "4px 10px" }}
                >
                  {isReinferring ? "Re-inferring..." : "Re-Infer Org Chart"}
                </button>
              </div>
            )}

            {/* Canvas */}
            <OrgChartCanvas
              company={company}
              selectedEmployeeId={selectedEmployee?.id}
              onSelectEmployee={(emp) => setSelectedEmployee(emp)}
              highlightedEmployeeIds={highlightedEmployeeIds}
              economicBuyerId={economicBuyerId}
              compareWithGroundTruth={compareWithGroundTruth}
              departmentFilter={chartDepartmentFilter}
            />
          </div>
        )}

        {activeTab === "directory" && (
          <DirectoryView
            company={company}
            onSelectEmployee={(emp) => setSelectedEmployee(emp)}
            onHighlightChain={(emp) => {
              handleHighlightChain(emp);
              setActiveTab("chart");
            }}
          />
        )}

        {activeTab === "sales" && (
          <SalesIntelligenceView
            company={company}
            onSelectEmployee={(emp) => setSelectedEmployee(emp)}
            onHighlightChain={(emp) => handleHighlightChain(emp)}
            onSwitchToChart={() => setActiveTab("chart")}
          />
        )}

        {activeTab === "analytics" && (
          <CompanyAnalyticsView company={company} />
        )}

        {/* Slide-out Employee Detail Drawer */}
        {selectedEmployee && (
          <NodeDrawer
            employee={selectedEmployee}
            company={company}
            onClose={() => setSelectedEmployee(null)}
            onSelectEmployee={(emp) => setSelectedEmployee(emp)}
            onHighlightChain={(emp) => {
              handleHighlightChain(emp);
              setActiveTab("chart");
            }}
          />
        )}
      </div>

      {/* 500-Company Benchmark Modal */}
      {isBenchmarkOpen && (
        <BenchmarkModal
          report={benchmarkReport}
          onClose={() => setIsBenchmarkOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
