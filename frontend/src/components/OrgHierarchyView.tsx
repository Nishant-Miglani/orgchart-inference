import React, { useState, useMemo } from "react";
import {
  Columns3,
  Network,
  ListTree,
  Crown,
  Briefcase,
  ChevronDown,
  Search,
  Sliders,
  X,
  Building2,
} from "lucide-react";
import { Company, Employee, SeniorityLevel } from "../types";
import { OrgChartCanvas } from "./OrgChartCanvas";

export type HierarchyViewMode = "swimlanes" | "levels" | "canvas";

interface OrgHierarchyViewProps {
  company: Company;
  selectedEmployeeId?: string;
  onSelectEmployee: (emp: Employee) => void;
  highlightedEmployeeIds: Set<string>;
  economicBuyerId?: string;
  compareWithGroundTruth: boolean;
  confidenceThreshold: number;
  onThresholdChange: (val: number) => void;
  onReinfer: () => void;
  isReinferring: boolean;
  onClearHighlights?: () => void;
}

const SENIORITY_META: Record<
  SeniorityLevel,
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  L0_EXEC: { label: "CEO", badgeClass: "badge-l0", icon: <Crown size={11} /> },
  L1_C_SUITE: { label: "C-Suite", badgeClass: "badge-l1", icon: <Briefcase size={11} /> },
  L2_VP: { label: "VP", badgeClass: "badge-l2", icon: <Briefcase size={11} /> },
  L3_DIRECTOR: { label: "Director", badgeClass: "badge-l3", icon: <Briefcase size={11} /> },
  L4_MANAGER: { label: "Manager", badgeClass: "badge-l4", icon: <Briefcase size={11} /> },
  L5_SENIOR_IC: { label: "Senior IC", badgeClass: "badge-l5", icon: <Briefcase size={11} /> },
  L6_IC: { label: "IC", badgeClass: "badge-l6", icon: <Briefcase size={11} /> },
};

export const OrgHierarchyView: React.FC<OrgHierarchyViewProps> = ({
  company,
  selectedEmployeeId,
  onSelectEmployee,
  highlightedEmployeeIds,
  economicBuyerId,
  compareWithGroundTruth,
  confidenceThreshold,
  onThresholdChange,
  onReinfer,
  isReinferring,
  onClearHighlights,
}) => {
  const [viewMode, setViewMode] = useState<HierarchyViewMode>("swimlanes");
  const [departmentFilter, setDepartmentFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showThresholdControl, setShowThresholdControl] = useState<boolean>(false);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  const [expandedManagers, setExpandedManagers] = useState<Set<string>>(new Set());

  // Employee mapping
  const empMap = useMemo(() => {
    return new Map(company.employees.map((e) => [e.id, e]));
  }, [company.employees]);

  // Root CEO
  const ceo = useMemo(() => {
    return (
      company.employees.find((e) => e.inferred_seniority === "L0_EXEC") ||
      company.employees[0]
    );
  }, [company.employees]);

  // Children mapping (primary inferred edges)
  const childrenMap = useMemo(() => {
    const map = new Map<string, Employee[]>();
    company.inferred_edges.forEach((edge) => {
      if (edge.edge_type === "primary") {
        const sub = empMap.get(edge.source_id);
        if (sub) {
          if (!map.has(edge.target_id)) {
            map.set(edge.target_id, []);
          }
          map.get(edge.target_id)!.push(sub);
        }
      }
    });
    return map;
  }, [company.inferred_edges, empMap]);

  // Department breakdown
  const departments = useMemo(() => {
    const map = new Map<string, Employee[]>();
    company.employees.forEach((emp) => {
      if (emp.inferred_seniority !== "L0_EXEC") {
        const d = emp.inferred_department || "General";
        if (!map.has(d)) map.set(d, []);
        map.get(d)!.push(emp);
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [company.employees]);

  // Toggle department expand in swimlane
  const toggleDept = (dept: string) => {
    const next = new Set(expandedDepartments);
    if (next.has(dept)) {
      next.delete(dept);
    } else {
      next.add(dept);
    }
    setExpandedDepartments(next);
  };

  // Toggle manager expand
  const toggleManager = (mgrId: string) => {
    const next = new Set(expandedManagers);
    if (next.has(mgrId)) {
      next.delete(mgrId);
    } else {
      next.add(mgrId);
    }
    setExpandedManagers(next);
  };

  // Filtered departments for view
  const activeDepartments = useMemo(() => {
    if (departmentFilter === "All") return departments;
    return departments.filter(([d]) => d === departmentFilter);
  }, [departments, departmentFilter]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden", background: "var(--bg-primary)" }}>
      {/* Top Toolbar: View Mode Selector + Filters */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 24px",
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-subtle)",
          flexWrap: "wrap",
          gap: "10px",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {/* Left: View Mode Segmented Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "var(--bg-card)",
              padding: "2px",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <button
              onClick={() => setViewMode("swimlanes")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: viewMode === "swimlanes" ? 700 : 500,
                background: viewMode === "swimlanes" ? "linear-gradient(135deg, var(--accent-orange) 0%, #ea580c 100%)" : "transparent",
                color: viewMode === "swimlanes" ? "#ffffff" : "var(--text-secondary)",
                border: "none",
                cursor: "pointer",
                boxShadow: viewMode === "swimlanes" ? "0 2px 6px rgba(249, 115, 22, 0.35)" : "none",
                transition: "all 0.15s ease",
              }}
              title="Department columns with management breakdown"
            >
              <Columns3 size={13} />
              Department Swimlanes
            </button>

            <button
              onClick={() => setViewMode("levels")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: viewMode === "levels" ? 700 : 500,
                background: viewMode === "levels" ? "linear-gradient(135deg, var(--accent-orange) 0%, #ea580c 100%)" : "transparent",
                color: viewMode === "levels" ? "#ffffff" : "var(--text-secondary)",
                border: "none",
                cursor: "pointer",
                boxShadow: viewMode === "levels" ? "0 2px 6px rgba(249, 115, 22, 0.35)" : "none",
                transition: "all 0.15s ease",
              }}
              title="Cascading management levels from L0 down to L6"
            >
              <ListTree size={13} />
              Management Level Tree
            </button>

            <button
              onClick={() => setViewMode("canvas")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: viewMode === "canvas" ? 700 : 500,
                background: viewMode === "canvas" ? "linear-gradient(135deg, var(--accent-orange) 0%, #ea580c 100%)" : "transparent",
                color: viewMode === "canvas" ? "#ffffff" : "var(--text-secondary)",
                border: "none",
                cursor: "pointer",
                boxShadow: viewMode === "canvas" ? "0 2px 6px rgba(249, 115, 22, 0.35)" : "none",
                transition: "all 0.15s ease",
              }}
              title="Interactive 2D graph canvas"
            >
              <Network size={13} />
              Visual Graph Canvas
            </button>
          </div>

          {/* Department Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>Dept:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              style={{
                height: "32px",
                padding: "0 8px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-medium)",
                borderRadius: "6px",
                fontSize: "12px",
                color: "var(--text-primary)",
                outline: "none",
              }}
            >
              <option value="All">All Departments ({departments.length})</option>
              {departments.map(([d, emps]) => (
                <option key={d} value={d}>
                  {d} ({emps.length})
                </option>
              ))}
            </select>
          </div>

          {/* Search person within hierarchy */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "0 8px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-medium)",
              borderRadius: "6px",
              height: "32px",
              width: "200px",
            }}
          >
            <Search size={13} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Find person in org..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "12px",
                color: "var(--text-primary)",
                width: "100%",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Right: Threshold & Highlights */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {highlightedEmployeeIds.size > 0 && (
            <button
              onClick={onClearHighlights}
              className="btn-secondary"
              style={{ fontSize: "11px", padding: "4px 8px" }}
            >
              Clear Highlights ({highlightedEmployeeIds.size})
            </button>
          )}

          <button
            onClick={() => setShowThresholdControl(!showThresholdControl)}
            className={`btn-chip ${showThresholdControl ? "active" : ""}`}
            style={{ fontSize: "11px", padding: "4px 8px" }}
            title="Adjust AI Confidence Cutoff"
          >
            <Sliders size={12} />
            Cutoff: {(confidenceThreshold * 100).toFixed(0)}%
          </button>
        </div>
      </div>

      {/* Threshold Popover Slider */}
      {showThresholdControl && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 24px",
            background: "#ffffff",
            borderBottom: "1px solid var(--border-medium)",
            fontSize: "12px",
            zIndex: 20,
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
              Confidence Cutoff: <strong style={{ color: "var(--accent-orange)" }}>{(confidenceThreshold * 100).toFixed(0)}%</strong>
            </span>
            <input
              type="range"
              min="0.45"
              max="0.95"
              step="0.05"
              value={confidenceThreshold}
              onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
              style={{ width: "150px", accentColor: "var(--accent-orange)", cursor: "pointer" }}
            />
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              (Higher cutoff guarantees zero wrong edges. Lower cutoff resolves more indirect edges.)
            </span>
          </div>

          <button
            onClick={onReinfer}
            disabled={isReinferring}
            className="btn-primary"
            style={{ fontSize: "11px", padding: "4px 10px" }}
          >
            {isReinferring ? "Re-inferring..." : "Re-Infer Org Chart"}
          </button>
        </div>
      )}

      {/* Main Hierarchy Content Area */}
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", position: "relative" }}>
        {/* MODE 1: DEPARTMENT SWIMLANES */}
        {viewMode === "swimlanes" && (
          <div
            style={{
              flex: 1,
              height: "100%",
              minHeight: 0,
              overflowY: "auto",
              overflowX: "auto",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* CEO Card at Top */}
            {ceo && (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div
                  onClick={() => onSelectEmployee(ceo)}
                  style={{
                    width: "360px",
                    background: selectedEmployeeId === ceo.id ? "var(--accent-orange-subtle)" : "var(--bg-card)",
                    border: selectedEmployeeId === ceo.id ? "2px solid var(--accent-orange)" : "1px solid var(--border-medium)",
                    borderRadius: "10px",
                    padding: "14px 18px",
                    boxShadow: selectedEmployeeId === ceo.id ? "0 4px 14px rgba(255, 90, 31, 0.25)" : "0 1px 3px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04)",
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span className="badge badge-l0">
                      <Crown size={11} /> Executive Leadership
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
                      Company Head
                    </span>
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", marginTop: "4px" }}>
                    {ceo.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
                    {ceo.raw_title}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", display: "flex", justifyContent: "space-between" }}>
                    <span>{ceo.location || company.headquarters}</span>
                    <span>{(childrenMap.get(ceo.id) || []).length} direct department executives</span>
                  </div>
                </div>
              </div>
            )}

            {/* Department Swimlanes Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)" }}>
                FUNCTIONAL DEPARTMENTS ({activeDepartments.length})
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Click any leader or manager to inspect reports and reporting paths
              </div>
            </div>

            {/* Swimlanes Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "16px",
                alignItems: "start",
              }}
            >
              {activeDepartments.map(([deptName, emps]) => {
                // Find leader of this dept
                const leader =
                  emps.find((e) => ["L1_C_SUITE", "L2_VP"].includes(e.inferred_seniority || "")) ||
                  emps.find((e) => e.inferred_seniority === "L3_DIRECTOR") ||
                  emps[0];

                // Direct managers in dept
                const managers = emps.filter(
                  (e) => ["L3_DIRECTOR", "L4_MANAGER"].includes(e.inferred_seniority || "") && e.id !== leader?.id
                );

                const isDeptExpanded = expandedDepartments.has(deptName);

                return (
                  <div
                    key={deptName}
                    style={{
                      background: "var(--bg-card)",
                      borderRadius: "10px",
                      border: "1px solid var(--border-subtle)",
                      boxShadow: "0 1px 3px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04)",
                      overflow: "hidden",
                    }}
                  >
                    {/* Department Header */}
                    <div
                      style={{
                        padding: "10px 14px",
                        background: "var(--bg-secondary)",
                        borderBottom: "1px solid var(--border-subtle)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Building2 size={13} color="var(--accent-orange)" />
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
                          {deptName}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          color: "var(--accent-purple)",
                          background: "var(--accent-purple-subtle)",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          border: "1px solid var(--accent-purple-border)",
                        }}
                      >
                        {emps.length} emps
                      </span>
                    </div>

                    {/* Department Leader Card */}
                    {leader && (
                      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-subtle)" }}>
                        <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--accent-orange)", marginBottom: "4px" }}>
                          DEPARTMENT EXECUTIVE
                        </div>
                        <div
                          onClick={() => onSelectEmployee(leader)}
                          style={{
                            padding: "8px 10px",
                            background: selectedEmployeeId === leader.id ? "var(--accent-orange-subtle)" : "var(--bg-secondary)",
                            border: selectedEmployeeId === leader.id ? "1px solid var(--accent-orange)" : "1px solid var(--border-subtle)",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontWeight: 700, fontSize: "12px", color: "var(--text-primary)" }}>
                              {leader.name}
                            </span>
                            <span className={`badge ${SENIORITY_META[leader.inferred_seniority || "L2_VP"]?.badgeClass || "badge-l2"}`}>
                              {SENIORITY_META[leader.inferred_seniority || "L2_VP"]?.label}
                            </span>
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                            {leader.raw_title}
                          </div>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
                            Reports to: {leader.inferred_manager_id ? empMap.get(leader.inferred_manager_id)?.name : "CEO"}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Management & Team Sections */}
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>
                          Management & Direct Teams ({managers.length})
                        </span>
                        <button
                          onClick={() => toggleDept(deptName)}
                          style={{
                            background: "transparent",
                            border: "none",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "var(--accent-orange)",
                            cursor: "pointer",
                          }}
                        >
                          {isDeptExpanded ? "Collapse Team" : "View All"}
                        </button>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {(isDeptExpanded ? managers : managers.slice(0, 3)).map((mgr) => {
                          const reports = childrenMap.get(mgr.id) || [];
                          const isMgrExpanded = expandedManagers.has(mgr.id);
                          const isSelected = selectedEmployeeId === mgr.id;

                          return (
                            <div
                              key={mgr.id}
                              style={{
                                background: isSelected ? "var(--accent-orange-subtle)" : "var(--bg-secondary)",
                                border: isSelected ? "1px solid var(--accent-orange)" : "1px solid var(--border-subtle)",
                                borderRadius: "6px",
                                padding: "6px 8px",
                              }}
                            >
                              <div
                                onClick={() => onSelectEmployee(mgr)}
                                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                              >
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-primary)" }}>
                                    {mgr.name}
                                  </div>
                                  <div style={{ fontSize: "10px", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {mgr.raw_title}
                                  </div>
                                </div>
                                <span style={{ fontSize: "10px", color: "var(--accent-orange)", fontWeight: 600 }}>
                                  {reports.length} reports
                                </span>
                              </div>

                              {/* Expand direct reports under this manager */}
                              {reports.length > 0 && (
                                <div style={{ marginTop: "4px", borderTop: "1px dashed var(--border-subtle)", paddingTop: "4px" }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleManager(mgr.id);
                                    }}
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      color: "var(--text-muted)",
                                      fontSize: "10px",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "3px",
                                    }}
                                  >
                                    <ChevronDown
                                      size={11}
                                      style={{ transform: isMgrExpanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
                                    />
                                    {isMgrExpanded ? "Hide Reports" : `Show ${reports.length} Reports`}
                                  </button>

                                  {isMgrExpanded && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "4px", paddingLeft: "10px" }}>
                                      {reports.map((r) => (
                                        <div
                                          key={r.id}
                                          onClick={() => onSelectEmployee(r)}
                                          style={{
                                            fontSize: "10px",
                                            padding: "2px 4px",
                                            borderRadius: "4px",
                                            background: selectedEmployeeId === r.id ? "var(--accent-orange-subtle)" : "transparent",
                                            color: selectedEmployeeId === r.id ? "var(--accent-orange)" : "var(--text-secondary)",
                                            cursor: "pointer",
                                            display: "flex",
                                            justifyContent: "space-between",
                                          }}
                                        >
                                          <span>{r.name}</span>
                                          <span style={{ color: "var(--text-muted)" }}>{r.inferred_seniority}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODE 2: CASCADING MANAGEMENT LEVEL TREE */}
        {viewMode === "levels" && (
          <div
            style={{
              flex: 1,
              height: "100%",
              minHeight: 0,
              overflowY: "auto",
              padding: "20px 24px",
              background: "var(--bg-primary)",
            }}
          >
            <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                  Corporate Management Levels (CEO down to Individual Contributors)
                </h3>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {company.employees.length} employees mapped across 7 seniority tiers
                </span>
              </div>

              {/* Recursive or level-based tree renderer */}
              {[
                { tier: "L0_EXEC", title: "Level 0: Chief Executive Officer" },
                { tier: "L1_C_SUITE", title: "Level 1: C-Suite Executive Officers" },
                { tier: "L2_VP", title: "Level 2: Vice Presidents" },
                { tier: "L3_DIRECTOR", title: "Level 3: Functional Directors" },
                { tier: "L4_MANAGER", title: "Level 4: Operational Managers" },
                { tier: "L5_SENIOR_IC", title: "Level 5: Senior Individual Contributors" },
                { tier: "L6_IC", title: "Level 6: Staff & Associates" },
              ].map(({ tier, title }) => {
                const tierEmps = company.employees.filter((e) => e.inferred_seniority === tier);
                if (tierEmps.length === 0) return null;

                return (
                  <div
                    key={tier}
                    style={{
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                      overflow: "hidden",
                      background: "var(--bg-card)",
                    }}
                  >
                    <div
                      style={{
                        padding: "8px 12px",
                        background: "var(--bg-secondary)",
                        borderBottom: "1px solid var(--border-subtle)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: "12px", color: "var(--text-primary)" }}>
                        {title}
                      </span>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent-orange)" }}>
                        {tierEmps.length} people
                      </span>
                    </div>

                    <div style={{ padding: "8px 12px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "6px" }}>
                      {tierEmps.map((emp) => {
                        const isSelected = selectedEmployeeId === emp.id;
                        return (
                          <div
                            key={emp.id}
                            onClick={() => onSelectEmployee(emp)}
                            style={{
                              padding: "6px 8px",
                              borderRadius: "6px",
                              border: isSelected ? "1px solid var(--accent-orange)" : "1px solid var(--border-subtle)",
                              background: isSelected ? "var(--accent-orange-subtle)" : "var(--bg-secondary)",
                              cursor: "pointer",
                              fontSize: "11px",
                            }}
                          >
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{emp.name}</div>
                            <div style={{ color: "var(--text-muted)", fontSize: "10px" }}>{emp.raw_title}</div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "10px", marginTop: "2px" }}>
                              {emp.inferred_department}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODE 3: INTERACTIVE 2D VISUAL GRAPH CANVAS */}
        {viewMode === "canvas" && (
          <OrgChartCanvas
            company={company}
            selectedEmployeeId={selectedEmployeeId}
            onSelectEmployee={onSelectEmployee}
            highlightedEmployeeIds={highlightedEmployeeIds}
            economicBuyerId={economicBuyerId}
            compareWithGroundTruth={compareWithGroundTruth}
            departmentFilter={departmentFilter}
          />
        )}
      </div>
    </div>
  );
};
