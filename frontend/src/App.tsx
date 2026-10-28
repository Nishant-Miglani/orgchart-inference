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
import { OrgHierarchyView } from "./components/OrgHierarchyView";
import { DirectoryView } from "./components/DirectoryView";
import { SalesIntelligenceView } from "./components/SalesIntelligenceView";
import { CompanyAnalyticsView } from "./components/CompanyAnalyticsView";
import { NodeDrawer } from "./components/NodeDrawer";
import { BenchmarkModal } from "./components/BenchmarkModal";
import { Sparkles, X } from "lucide-react";

export const App: React.FC = () => {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("comp_0001");
  const [company, setCompany] = useState<Company | null>(null);

  // Category & Size Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSize, setSelectedSize] = useState<string>("All");

  // Detail view active tab
  const [activeTab, setActiveTab] = useState<CompanyDetailTab>("chart");

  // Selected employee for side drawer
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [highlightedEmployeeIds, setHighlightedEmployeeIds] = useState<Set<string>>(new Set());
  const [economicBuyerId, setEconomicBuyerId] = useState<string | undefined>(undefined);

  // Ground Truth & Threshold controls
  const [compareWithGroundTruth, setCompareWithGroundTruth] = useState<boolean>(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.68);
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

  // Trace reporting path from node drawer, directory, or sales view
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
    setBannerMessage(`Tracing hierarchy path for ${emp.name} (${emp.raw_title}) up to Executive Leadership.`);
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
            border: "3px solid var(--border-subtle)",
            borderTopColor: "var(--accent-orange)",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
          Loading 500 Enterprise Retail Companies & Org Charts...
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "var(--bg-primary)" }}>
      {/* 1. Sleek Top Navbar */}
      <Navbar
        compareWithGroundTruth={compareWithGroundTruth}
        onToggleGroundTruth={() => setCompareWithGroundTruth(!compareWithGroundTruth)}
        onOpenBenchmark={handleOpenBenchmark}
        precisionScore={company.evaluation_summary?.precision}
        totalCompanies={companies.length}
      />

      {/* 2. Company Search Box & Category / Size Filters (Clean & Simple) */}
      <CompanySearchBar
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        onSelectCompany={handleSelectCompany}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedSize={selectedSize}
        onSelectSize={setSelectedSize}
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
            background: "var(--accent-orange-subtle)",
            borderBottom: "1px solid var(--accent-orange-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "var(--accent-orange)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={14} color="var(--accent-orange)" />
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
      <div style={{ flex: 1, minHeight: 0, position: "relative", display: "flex", overflow: "hidden" }}>
        {activeTab === "chart" && (
          <OrgHierarchyView
            company={company}
            selectedEmployeeId={selectedEmployee?.id}
            onSelectEmployee={(emp) => setSelectedEmployee(emp)}
            highlightedEmployeeIds={highlightedEmployeeIds}
            economicBuyerId={economicBuyerId}
            compareWithGroundTruth={compareWithGroundTruth}
            confidenceThreshold={confidenceThreshold}
            onThresholdChange={setConfidenceThreshold}
            onReinfer={handleReinfer}
            isReinferring={isReinferring}
            onClearHighlights={() => {
              setHighlightedEmployeeIds(new Set());
              setEconomicBuyerId(undefined);
              setBannerMessage(null);
            }}
          />
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
