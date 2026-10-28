import React from "react";
import {
  X,
  Crown,
  GitFork,
  TrendingUp,
} from "lucide-react";
import { Company, Employee } from "../types";

interface NodeDrawerProps {
  employee: Employee | null;
  company: Company;
  onClose: () => void;
  onSelectEmployee: (emp: Employee) => void;
  onHighlightChain: (emp: Employee) => void;
}

export const NodeDrawer: React.FC<NodeDrawerProps> = ({
  employee,
  company,
  onClose,
  onSelectEmployee,
  onHighlightChain,
}) => {
  if (!employee) return null;

  const empMap = new Map(company.employees.map((e) => [e.id, e]));

  // Find primary manager
  const primaryManager = employee.inferred_manager_id
    ? empMap.get(employee.inferred_manager_id)
    : null;

  // Find matrix manager
  const matrixManager = employee.inferred_matrix_manager_id
    ? empMap.get(employee.inferred_matrix_manager_id)
    : null;

  // Find direct reports
  const directReports = company.employees.filter(
    (e) => e.inferred_manager_id === employee.id
  );

  // Build upward chain to CEO
  const chain: Employee[] = [];
  let curr = primaryManager;
  const visited = new Set<string>();
  while (curr && !visited.has(curr.id)) {
    visited.add(curr.id);
    chain.push(curr);
    curr = curr.inferred_manager_id ? empMap.get(curr.inferred_manager_id) || null : null;
  }

  // Find economic buyer in upward chain
  const economicBuyer = chain.find((e) =>
    ["L2_VP", "L1_C_SUITE", "L0_EXEC"].includes(e.inferred_seniority || "")
  );

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "380px",
        height: "100%",
        background: "var(--bg-elevated)",
        borderLeft: "1px solid var(--border-subtle)",
        boxShadow: "-8px 0 24px rgba(16, 24, 40, 0.08)",
        zIndex: 90,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          background: "var(--bg-secondary)",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              color: "var(--accent-orange)",
              letterSpacing: "0.05em",
            }}
          >
            Employee Profile
          </span>
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
            {employee.name}
          </h2>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
            {employee.raw_title}
          </div>
        </div>

        <button
          onClick={onClose}
          className="btn-secondary"
          style={{ padding: "6px", borderRadius: "50%", border: "none", boxShadow: "none" }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Body Content */}
      <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Quick Highlights */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <div
            style={{
              background: "var(--bg-card)",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)" }}>DEPARTMENT</div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginTop: "2px" }}>
              {employee.inferred_department || "General"}
            </div>
          </div>
          <div
            style={{
              background: "var(--bg-card)",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)" }}>LOCATION</div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginTop: "2px" }}>
              {employee.location || "HQ"}
            </div>
          </div>
        </div>

        {/* Primary Reporting Line & Confidence Rationale */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "8px",
            padding: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-orange)" }}>
              PRIMARY REPORTING LINE
            </span>
            {employee.manager_confidence !== undefined && employee.manager_confidence !== null && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--accent-emerald)",
                  background: "rgba(16, 185, 129, 0.12)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  padding: "1px 6px",
                  borderRadius: "4px",
                }}
              >
                {(employee.manager_confidence * 100).toFixed(0)}% Confidence
              </span>
            )}
          </div>

          {primaryManager ? (
            <div
              onClick={() => onSelectEmployee(primaryManager)}
              style={{
                cursor: "pointer",
                padding: "8px 10px",
                background: "var(--bg-secondary)",
                borderRadius: "6px",
                border: "1px solid var(--border-subtle)",
                marginBottom: "6px",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: "12px", color: "var(--text-primary)" }}>
                {primaryManager.name}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                {primaryManager.raw_title}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: "12px", color: "var(--accent-amber)", marginBottom: "6px" }}>
              Unassigned: Safely left unassigned to preserve precision over guessing.
            </div>
          )}

          {employee.confidence_rationale && (
            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>
              Rationale: {employee.confidence_rationale}
            </div>
          )}
        </div>

        {/* Matrix / Dotted-Line Reporting (if applicable) */}
        {matrixManager && (
          <div
            style={{
              background: "var(--accent-purple-subtle)",
              border: "1px solid var(--accent-purple-border)",
              borderRadius: "8px",
              padding: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--accent-purple)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <GitFork size={12} /> MATRIX / DOTTED-LINE
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--accent-purple)",
                }}
              >
                {((employee.matrix_confidence || 0.85) * 100).toFixed(0)}% Conf
              </span>
            </div>

            <div
              onClick={() => onSelectEmployee(matrixManager)}
              style={{
                cursor: "pointer",
                padding: "8px 10px",
                background: "var(--bg-secondary)",
                borderRadius: "6px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: "12px", color: "var(--text-primary)" }}>
                {matrixManager.name}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                {matrixManager.raw_title}
              </div>
            </div>
          </div>
        )}

        {/* Economic Buyer Above Champion */}
        {economicBuyer && (
          <div
            style={{
              background: "var(--accent-orange-subtle)",
              border: "1px solid var(--accent-orange-border)",
              borderRadius: "8px",
              padding: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                marginBottom: "6px",
                color: "var(--accent-orange)",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              <Crown size={13} /> ECONOMIC BUYER (BUDGET AUTHORITY)
            </div>
            <div style={{ fontWeight: 600, fontSize: "12px", color: "var(--text-primary)" }}>
              {economicBuyer.name}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
              {economicBuyer.raw_title}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Holds executive signing authority above this contact.
            </div>
          </div>
        )}

        {/* Action Button: Highlight reporting chain on canvas */}
        <button
          onClick={() => onHighlightChain(employee)}
          className="btn-primary"
          style={{ justifyContent: "center", width: "100%", padding: "8px 12px" }}
        >
          <TrendingUp size={14} />
          Trace Reporting Path to CEO
        </button>

        {/* Direct Reports Section */}
        {directReports.length > 0 && (
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Direct Reports ({directReports.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {directReports.map((dr) => (
                <div
                  key={dr.id}
                  onClick={() => onSelectEmployee(dr)}
                  style={{
                    padding: "6px 8px",
                    background: "var(--bg-card)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    border: "1px solid var(--border-subtle)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-card)")}
                >
                  <div style={{ fontWeight: 600, fontSize: "12px", color: "var(--text-primary)" }}>
                    {dr.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {dr.raw_title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
