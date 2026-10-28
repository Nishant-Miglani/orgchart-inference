import React, { useState, useMemo } from "react";
import {
  Search,
  Crown,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import { Company, Employee, SeniorityLevel } from "../types";

interface DirectoryViewProps {
  company: Company;
  onSelectEmployee: (emp: Employee) => void;
  onHighlightChain: (emp: Employee) => void;
}

const SENIORITY_META: Record<
  SeniorityLevel,
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  L0_EXEC: { label: "CEO / Exec", badgeClass: "badge-l0", icon: <Crown size={11} /> },
  L1_C_SUITE: { label: "C-Suite", badgeClass: "badge-l1", icon: <Briefcase size={11} /> },
  L2_VP: { label: "VP / Exec", badgeClass: "badge-l2", icon: <Briefcase size={11} /> },
  L3_DIRECTOR: { label: "Director", badgeClass: "badge-l3", icon: <Briefcase size={11} /> },
  L4_MANAGER: { label: "Manager", badgeClass: "badge-l4", icon: <Briefcase size={11} /> },
  L5_SENIOR_IC: { label: "Senior IC", badgeClass: "badge-l5", icon: <Briefcase size={11} /> },
  L6_IC: { label: "IC / Staff", badgeClass: "badge-l6", icon: <Briefcase size={11} /> },
};

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  company,
  onSelectEmployee,
  onHighlightChain,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedSeniorityTier, setSelectedSeniorityTier] = useState("All");

  const empMap = useMemo(() => {
    return new Map(company.employees.map((e) => [e.id, e]));
  }, [company.employees]);

  // Unique departments in this company
  const departments = useMemo(() => {
    const set = new Set<string>();
    company.employees.forEach((e) => {
      if (e.inferred_department) set.add(e.inferred_department);
    });
    return Array.from(set).sort();
  }, [company.employees]);

  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return company.employees.filter((emp) => {
      // Dept filter
      if (selectedDept !== "All" && emp.inferred_department !== selectedDept) {
        return false;
      }

      // Seniority tier filter
      if (selectedSeniorityTier !== "All") {
        if (selectedSeniorityTier === "Exec" && !["L0_EXEC", "L1_C_SUITE"].includes(emp.inferred_seniority || "")) {
          return false;
        }
        if (selectedSeniorityTier === "VP" && emp.inferred_seniority !== "L2_VP") {
          return false;
        }
        if (selectedSeniorityTier === "Director" && emp.inferred_seniority !== "L3_DIRECTOR") {
          return false;
        }
        if (selectedSeniorityTier === "Manager" && emp.inferred_seniority !== "L4_MANAGER") {
          return false;
        }
        if (selectedSeniorityTier === "IC" && !["L5_SENIOR_IC", "L6_IC"].includes(emp.inferred_seniority || "")) {
          return false;
        }
      }

      // Search term
      if (term) {
        const nameMatch = emp.name.toLowerCase().includes(term);
        const titleMatch = emp.raw_title.toLowerCase().includes(term);
        const deptMatch = emp.inferred_department ? emp.inferred_department.toLowerCase().includes(term) : false;
        if (!nameMatch && !titleMatch && !deptMatch) {
          return false;
        }
      }

      return true;
    });
  }, [company.employees, searchTerm, selectedDept, selectedSeniorityTier]);

  return (
    <div
      style={{
        flex: 1,
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-primary)",
        padding: "16px 24px",
        overflow: "hidden",
      }}
    >
      {/* Top Search & Filter Bar (Sticky, never scrolls out) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "12px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", flex: 1 }}>
          {/* Search box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "0 10px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-medium)",
              borderRadius: "8px",
              height: "36px",
              width: "260px",
            }}
          >
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search person or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "12px",
                width: "100%",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Department Select */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>Dept:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{
                height: "36px",
                padding: "0 8px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-medium)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "var(--text-primary)",
                outline: "none",
              }}
            >
              <option value="All">All Departments ({departments.length})</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Seniority Filter Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {[
              { id: "All", label: "All Tiers" },
              { id: "Exec", label: "C-Suite / CEO" },
              { id: "VP", label: "VPs" },
              { id: "Director", label: "Directors" },
              { id: "Manager", label: "Managers" },
              { id: "IC", label: "ICs & Staff" },
            ].map((tier) => (
              <button
                key={tier.id}
                onClick={() => setSelectedSeniorityTier(tier.id)}
                className={`btn-chip ${selectedSeniorityTier === tier.id ? "active" : ""}`}
                style={{ fontSize: "11px", padding: "4px 8px" }}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
          Showing <strong>{filteredEmployees.length}</strong> of {company.employees.length} employees
        </div>
      </div>

      {/* Scrollable Table Container */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "auto",
          border: "1px solid var(--border-subtle)",
          borderRadius: "8px",
          background: "var(--bg-card)",
          boxShadow: "0 1px 3px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          {/* Sticky Header */}
          <thead
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              background: "var(--bg-secondary)",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <tr style={{ textAlign: "left" }}>
              <th style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text-secondary)", background: "var(--bg-secondary)" }}>Employee</th>
              <th style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text-secondary)", background: "var(--bg-secondary)" }}>Job Title</th>
              <th style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text-secondary)", background: "var(--bg-secondary)" }}>Department</th>
              <th style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text-secondary)", background: "var(--bg-secondary)" }}>Seniority Tier</th>
              <th style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text-secondary)", background: "var(--bg-secondary)" }}>Direct Manager</th>
              <th style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text-secondary)", background: "var(--bg-secondary)" }}>Confidence</th>
              <th style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text-secondary)", background: "var(--bg-secondary)", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp, idx) => {
              const seniority = emp.inferred_seniority || "L6_IC";
              const meta = SENIORITY_META[seniority] || SENIORITY_META.L6_IC;
              const manager = emp.inferred_manager_id ? empMap.get(emp.inferred_manager_id) : null;
              const conf = emp.manager_confidence;

              return (
                <tr
                  key={emp.id}
                  style={{
                    borderTop: "1px solid var(--border-subtle)",
                    background: idx % 2 === 0 ? "var(--bg-card)" : "var(--bg-secondary)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "var(--bg-card)" : "var(--bg-secondary)")}
                >
                  {/* Name + Avatar */}
                  <td style={{ padding: "10px 14px" }}>
                    <div
                      onClick={() => onSelectEmployee(emp)}
                      style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                    >
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          background: "var(--accent-purple-subtle)",
                          color: "var(--accent-purple)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {emp.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{emp.name}</span>
                    </div>
                  </td>

                  {/* Title */}
                  <td style={{ padding: "10px 14px", color: "var(--text-primary)", fontWeight: 500 }}>
                    {emp.raw_title}
                  </td>

                  {/* Dept */}
                  <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>
                    {emp.inferred_department}
                  </td>

                  {/* Seniority */}
                  <td style={{ padding: "10px 14px" }}>
                    <span className={`badge ${meta.badgeClass}`}>
                      {meta.icon}
                      {meta.label}
                    </span>
                  </td>

                  {/* Direct Manager */}
                  <td style={{ padding: "10px 14px" }}>
                    {manager ? (
                      <span
                        onClick={() => onSelectEmployee(manager)}
                        style={{ color: "var(--text-primary)", cursor: "pointer", textDecoration: "underline" }}
                      >
                        {manager.name}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>None (CEO / Root)</span>
                    )}
                  </td>

                  {/* Confidence */}
                  <td style={{ padding: "10px 14px" }}>
                    {conf !== undefined && conf !== null ? (
                      <span
                        style={{
                          fontWeight: 600,
                          color: conf >= 0.85 ? "var(--accent-emerald)" : "var(--accent-blue)",
                        }}
                      >
                        {(conf * 100).toFixed(0)}%
                      </span>
                    ) : (
                      <span style={{ color: "var(--accent-amber)" }}>Unassigned</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "6px" }}>
                      <button
                        onClick={() => onSelectEmployee(emp)}
                        className="btn-secondary"
                        style={{ padding: "3px 8px", fontSize: "11px" }}
                        title="View employee profile drawer"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => onHighlightChain(emp)}
                        className="btn-secondary"
                        style={{ padding: "3px 8px", fontSize: "11px", color: "var(--accent-blue)" }}
                        title="Trace hierarchy chain to CEO"
                      >
                        <TrendingUp size={11} />
                        Trace
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Pinned Footer */}
      <div
        style={{
          padding: "8px 4px 0 4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "11px",
          color: "var(--text-muted)",
          flexShrink: 0,
        }}
      >
        <span>Scroll vertically inside the directory table to inspect all {filteredEmployees.length} employees.</span>
        <span>Click any row or &ldquo;Profile&rdquo; to open full reporting details.</span>
      </div>
    </div>
  );
};
