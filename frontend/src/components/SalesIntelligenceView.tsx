import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Database,
  Lock,
  Crown,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Company, Employee, SalesQueryLeaderResponse, ReportingChainResponse } from "../types";
import { fetchSalesLeader, fetchSalesChain } from "../services/api";

interface SalesIntelligenceViewProps {
  company: Company;
  onSelectEmployee: (emp: Employee) => void;
  onHighlightChain: (emp: Employee) => void;
  onSwitchToChart: () => void;
}

const COMMON_DEPARTMENTS = [
  "Data & Analytics",
  "Loss Prevention & Security",
  "Technology & IT",
  "Merchandising & Buying",
  "Supply Chain & Logistics",
  "Store Operations & Field",
  "E-Commerce & Digital",
  "Finance & Accounting",
];

export const SalesIntelligenceView: React.FC<SalesIntelligenceViewProps> = ({
  company,
  onSelectEmployee,
  onHighlightChain,
  onSwitchToChart,
}) => {
  const [selectedDept, setSelectedDept] = useState("Data & Analytics");
  const [leaderData, setLeaderData] = useState<SalesQueryLeaderResponse | null>(null);
  const [isLeaderLoading, setIsLeaderLoading] = useState(false);

  const [chainData, setChainData] = useState<ReportingChainResponse | null>(null);
  const [isChainLoading, setIsChainLoading] = useState(false);
  const [chainQueryType, setChainQueryType] = useState<string>("Security");

  // Load Leader query
  const handleQueryLeader = useCallback(async (dept: string) => {
    setSelectedDept(dept);
    setIsLeaderLoading(true);
    try {
      const res = await fetchSalesLeader(company.id, dept);
      setLeaderData(res);
    } catch (err) {
      console.error("Leader query failed:", err);
    } finally {
      setIsLeaderLoading(false);
    }
  }, [company.id]);

  // Load Security Chain or Economic Buyer
  const handleQueryChain = useCallback(async (keyword: string) => {
    setChainQueryType(keyword);
    setIsChainLoading(true);
    try {
      const res = await fetchSalesChain(company.id, { titleKeyword: keyword });
      setChainData(res);
    } catch (err) {
      console.error("Chain query failed:", err);
    } finally {
      setIsChainLoading(false);
    }
  }, [company.id]);

  // Run initial queries on mount or when company changes
  useEffect(() => {
    let isCancelled = false;
    async function loadInitial() {
      setIsLeaderLoading(true);
      setIsChainLoading(true);
      try {
        const [leader, chain] = await Promise.all([
          fetchSalesLeader(company.id, "Data & Analytics"),
          fetchSalesChain(company.id, { titleKeyword: "Security" }),
        ]);
        if (!isCancelled) {
          setLeaderData(leader);
          setChainData(chain);
        }
      } catch (err) {
        console.error("Sales query initial load error:", err);
      } finally {
        if (!isCancelled) {
          setIsLeaderLoading(false);
          setIsChainLoading(false);
        }
      }
    }
    loadInitial();
    return () => {
      isCancelled = true;
    };
  }, [company.id]);

  // Executive team
  const executives = company.employees.filter((e) =>
    ["L0_EXEC", "L1_C_SUITE", "L2_VP"].includes(e.inferred_seniority || "")
  );

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        overflowY: "auto",
        padding: "24px",
        gap: "24px",
      }}
    >
      {/* Introduction Banner */}
      <div
        style={{
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "10px",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={16} color="var(--accent-blue)" />
            <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--accent-blue)" }}>
              B2B Sales Deal Intelligence & Path-to-Power
            </span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Map budget authority, identify functional decision makers, and find the shortest path from technical champion to signing executive.
          </p>
        </div>

        <button
          onClick={onSwitchToChart}
          className="btn-secondary"
          style={{ fontSize: "12px", background: "#ffffff" }}
        >
          View Full Org Chart
        </button>
      </div>

      {/* Grid: 2 Intelligence Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "20px" }}>
        {/* Card 1: Functional Leader Finder ("Who runs the Data team?") */}
        <div
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: "10px",
            background: "#ffffff",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Database size={16} color="var(--accent-blue)" />
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
              1. Functional Department Leader
            </h3>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
              SELECT TARGET DEPARTMENT:
            </label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {COMMON_DEPARTMENTS.slice(0, 4).map((d) => (
                <button
                  key={d}
                  onClick={() => handleQueryLeader(d)}
                  className={`btn-chip ${selectedDept === d ? "active" : ""}`}
                  style={{ fontSize: "11px", padding: "4px 8px" }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Leader Result */}
          {isLeaderLoading ? (
            <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
              Querying department leader hierarchy...
            </div>
          ) : leaderData?.leader ? (
            <div
              style={{
                background: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                padding: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
                <div>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--accent-blue)", textTransform: "uppercase" }}>
                    DEPARTMENT LEADER IDENTIFIED
                  </span>
                  <div
                    onClick={() => onSelectEmployee(leaderData.leader!)}
                    style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", cursor: "pointer", marginTop: "2px" }}
                  >
                    {leaderData.leader.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    {leaderData.leader.raw_title}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#059669",
                    background: "#ecfdf5",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    border: "1px solid #a7f3d0",
                  }}
                >
                  {(leaderData.confidence * 100).toFixed(0)}% Confidence
                </span>
              </div>

              {/* Leader Meta stats */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  background: "#ffffff",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-subtle)",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Direct Reports: </span>
                  <strong>{leaderData.direct_reports_count} managers/ICs</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Department Size: </span>
                  <strong>{leaderData.total_department_size} employees</strong>
                </div>
              </div>

              {/* Chain to CEO */}
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                REPORTING LINE TO CEO:
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                <span
                  onClick={() => onSelectEmployee(leaderData.leader!)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid var(--border-medium)",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {leaderData.leader.name} ({leaderData.leader.raw_title})
                </span>
                {leaderData.chain_to_ceo.map((hop) => (
                  <React.Fragment key={hop.id}>
                    <ChevronRight size={12} color="var(--text-muted)" />
                    <span
                      onClick={() => onSelectEmployee(hop)}
                      style={{
                        background: "#ffffff",
                        border: "1px solid var(--border-medium)",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >
                      {hop.name} ({hop.raw_title})
                    </span>
                  </React.Fragment>
                ))}
              </div>

              <button
                onClick={() => {
                  onHighlightChain(leaderData.leader!);
                  onSwitchToChart();
                }}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", fontSize: "12px" }}
              >
                <TrendingUp size={13} />
                Highlight Hierarchy in Org Chart
              </button>
            </div>
          ) : (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
              No leader identified for this department.
            </div>
          )}
        </div>

        {/* Card 2: Security Reporting Chain & Economic Buyer */}
        <div
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: "10px",
            background: "#ffffff",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Lock size={16} color="var(--accent-purple)" />
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
              2. Reporting Line & Economic Buyer Path
            </h3>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
              COMMON TARGET TITLES:
            </label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {["Security", "Buyer", "Scientist", "Store Manager"].map((kw) => (
                <button
                  key={kw}
                  onClick={() => handleQueryChain(kw)}
                  className={`btn-chip ${chainQueryType === kw ? "active" : ""}`}
                  style={{ fontSize: "11px", padding: "4px 8px" }}
                >
                  &ldquo;{kw}&rdquo;
                </button>
              ))}
            </div>
          </div>

          {isChainLoading ? (
            <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
              Tracing upward management hops...
            </div>
          ) : chainData ? (
            <div
              style={{
                background: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                padding: "16px",
              }}
            >
              {/* Target employee */}
              <div style={{ marginBottom: "10px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  RESOLVED TARGET CONTACT
                </span>
                <div
                  onClick={() => onSelectEmployee(chainData.target_employee)}
                  style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", cursor: "pointer" }}
                >
                  {chainData.target_employee.name}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  {chainData.target_employee.raw_title}
                </div>
              </div>

              {/* Economic Buyer Box */}
              {chainData.economic_buyer && (
                <div
                  style={{
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: "6px",
                    padding: "10px 12px",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#b45309", fontSize: "11px", fontWeight: 700 }}>
                    <Crown size={13} />
                    ECONOMIC BUYER: {chainData.economic_buyer.name}
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginTop: "2px" }}>
                    {chainData.economic_buyer.raw_title}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    {chainData.economic_buyer_budget_authority}
                  </div>
                </div>
              )}

              {/* Explanation */}
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", marginBottom: "12px" }}>
                {chainData.explanation}
              </div>

              <button
                onClick={() => {
                  onHighlightChain(chainData.target_employee);
                  onSwitchToChart();
                }}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", fontSize: "12px" }}
              >
                <TrendingUp size={13} />
                Trace Deal Hierarchy in Org Chart
              </button>
            </div>
          ) : (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
              Select a keyword above to trace its reporting line.
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Executive Leadership Roster */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <Crown size={16} color="var(--accent-amber)" />
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
            Executive Leadership & Signing Authorities ({executives.length})
          </h3>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
          {executives.map((exec) => (
            <div
              key={exec.id}
              onClick={() => onSelectEmployee(exec)}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                background: "#f8fafc",
                cursor: "pointer",
                transition: "all 0.12s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#f8fafc")}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)" }}>{exec.name}</span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: "4px",
                    background: exec.inferred_seniority === "L0_EXEC" ? "#fef3c7" : "#ede9fe",
                    color: exec.inferred_seniority === "L0_EXEC" ? "#92400e" : "#5b21b6",
                  }}
                >
                  {exec.inferred_seniority === "L0_EXEC" ? "CEO" : "Executive"}
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                {exec.raw_title}
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                {exec.inferred_department} • {exec.location || "HQ"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
