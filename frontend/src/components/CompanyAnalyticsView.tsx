import React, { useMemo } from "react";
import {
  BarChart3,
  Users,
} from "lucide-react";
import { Company } from "../types";

interface CompanyAnalyticsViewProps {
  company: Company;
}

export const CompanyAnalyticsView: React.FC<CompanyAnalyticsViewProps> = ({ company }) => {
  // Department breakdown
  const deptCounts = useMemo(() => {
    const map = new Map<string, number>();
    company.employees.forEach((e) => {
      const d = e.inferred_department || "Other";
      map.set(d, (map.get(d) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [company.employees]);

  // Seniority breakdown
  const seniorityCounts = useMemo(() => {
    const map = new Map<string, number>();
    company.employees.forEach((e) => {
      const s = e.inferred_seniority || "L6_IC";
      map.set(s, (map.get(s) || 0) + 1);
    });
    return [
      { key: "L0_EXEC", label: "L0 - Executive (CEO)", count: map.get("L0_EXEC") || 0, color: "#d97706" },
      { key: "L1_C_SUITE", label: "L1 - C-Suite Officers", count: map.get("L1_C_SUITE") || 0, color: "#7c3aed" },
      { key: "L2_VP", label: "L2 - Vice Presidents", count: map.get("L2_VP") || 0, color: "#4f46e5" },
      { key: "L3_DIRECTOR", label: "L3 - Directors", count: map.get("L3_DIRECTOR") || 0, color: "#0284c7" },
      { key: "L4_MANAGER", label: "L4 - Managers", count: map.get("L4_MANAGER") || 0, color: "#059669" },
      { key: "L5_SENIOR_IC", label: "L5 - Senior ICs", count: map.get("L5_SENIOR_IC") || 0, color: "#ea580c" },
      { key: "L6_IC", label: "L6 - Associates & ICs", count: map.get("L6_IC") || 0, color: "#64748b" },
    ];
  }, [company.employees]);

  const summary = company.evaluation_summary;
  const totalEmployees = company.employee_count;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-primary)",
        overflowY: "auto",
        padding: "24px",
        gap: "24px",
      }}
    >
      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
        <div style={{ padding: "16px", background: "var(--accent-emerald-subtle)", border: "1px solid var(--accent-emerald-border)", borderRadius: "8px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-emerald)" }}>PRECISION SCORE</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent-emerald)", marginTop: "2px" }}>
            {summary ? `${(summary.precision * 100).toFixed(1)}%` : "N/A"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
            True Positives / Inferred Edges
          </div>
        </div>

        <div style={{ padding: "16px", background: "var(--accent-orange-subtle)", border: "1px solid var(--accent-orange-border)", borderRadius: "8px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-orange)" }}>RECALL SCORE</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent-orange)", marginTop: "2px" }}>
            {summary ? `${(summary.recall * 100).toFixed(1)}%` : "N/A"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
            Ground Truth Coverage
          </div>
        </div>

        <div style={{ padding: "16px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "8px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}>TOTAL EMPLOYEES</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", marginTop: "2px" }}>
            {totalEmployees}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
            Across {deptCounts.length} departments
          </div>
        </div>

        <div style={{ padding: "16px", background: "var(--accent-amber-subtle)", border: "1px solid var(--accent-amber-border)", borderRadius: "8px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-amber)" }}>UNASSIGNED NODES</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent-amber)", marginTop: "2px" }}>
            {summary ? summary.unassigned_count : 0}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
            Safely suppressed (no false guess)
          </div>
        </div>
      </div>

      {/* Grid: Department & Seniority Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "20px" }}>
        {/* Department Distribution */}
        <div
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: "8px",
            background: "var(--bg-card)",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Users size={16} color="var(--accent-orange)" />
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
              Headcount Distribution by Department
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {deptCounts.map(([dept, count]) => {
              const pct = ((count / totalEmployees) * 100).toFixed(0);
              return (
                <div key={dept}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{dept}</span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div style={{ height: "6px", background: "var(--bg-muted)", borderRadius: "3px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, var(--accent-orange), var(--accent-purple))",
                        borderRadius: "3px",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Seniority Distribution */}
        <div
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: "8px",
            background: "var(--bg-card)",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <BarChart3 size={16} color="var(--accent-purple)" />
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
              Seniority Hierarchy Distribution
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {seniorityCounts.map((s) => {
              const pct = ((s.count / totalEmployees) * 100).toFixed(0);
              return (
                <div key={s.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{s.label}</span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {s.count} ({pct}%)
                    </span>
                  </div>
                  <div style={{ height: "6px", background: "var(--bg-muted)", borderRadius: "3px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: s.color,
                        borderRadius: "3px",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
