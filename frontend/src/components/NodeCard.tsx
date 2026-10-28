import React from "react";
import {
  Crown,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  GitFork,
} from "lucide-react";
import { Employee, SeniorityLevel } from "../types";

interface NodeCardProps {
  employee: Employee;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isEconomicBuyer?: boolean;
  compareWithGroundTruth?: boolean;
  onClick?: () => void;
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

export const NodeCard: React.FC<NodeCardProps> = ({
  employee,
  isSelected = false,
  isHighlighted = false,
  isEconomicBuyer = false,
  compareWithGroundTruth = false,
  onClick,
}) => {
  const seniority = employee.inferred_seniority || "L6_IC";
  const meta = SENIORITY_META[seniority] || SENIORITY_META.L6_IC;
  const confidence = employee.manager_confidence;

  // Ground Truth correctness status
  let gtStatus: "correct" | "wrong" | "unassigned_correct" | null = null;
  if (compareWithGroundTruth) {
    if (employee.inferred_manager_id) {
      if (employee.inferred_manager_id === employee.ground_truth_manager_id) {
        gtStatus = "correct";
      } else {
        gtStatus = "wrong";
      }
    } else {
      gtStatus = "unassigned_correct";
    }
  }

  const confidenceClass =
    confidence && confidence >= 0.85
      ? "conf-high"
      : confidence && confidence >= 0.70
      ? "conf-med"
      : "conf-low";

  // Initials for avatar
  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      onClick={onClick}
      className="node-card-interactive"
      style={{
        width: "240px",
        borderRadius: "10px",
        padding: "12px",
        background: isSelected
          ? "#eff6ff"
          : isEconomicBuyer
          ? "#fffbeb"
          : isHighlighted
          ? "#f5f3ff"
          : "#ffffff",
        border: isSelected
          ? "2px solid #2563eb"
          : isEconomicBuyer
          ? "2px solid #d97706"
          : isHighlighted
          ? "2px solid #7c3aed"
          : "1px solid var(--border-subtle)",
        boxShadow: isSelected
          ? "0 4px 12px -2px rgba(37, 99, 235, 0.25)"
          : isEconomicBuyer
          ? "0 4px 12px -2px rgba(217, 119, 6, 0.25)"
          : "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        cursor: "pointer",
        transition: "all 0.15s ease",
        position: "relative",
        userSelect: "none",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 4px 10px 0 rgba(0, 0, 0, 0.08)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow =
            "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)";
        }
      }}
    >
      {/* Top Row: Seniority Badge + Matrix/Ground Truth indicators */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <span className={`badge ${meta.badgeClass}`}>
          {meta.icon}
          {meta.label}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Dual Reporting / Matrix Indicator */}
          {employee.inferred_matrix_manager_id && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "#4f46e5",
                background: "#eef2ff",
                padding: "1px 5px",
                borderRadius: "4px",
                border: "1px solid #c7d2fe",
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
              }}
              title="Matrix / Dotted-line secondary reporting"
            >
              <GitFork size={10} /> Matrix
            </span>
          )}

          {/* Ground Truth Validation Badge */}
          {compareWithGroundTruth && gtStatus && (
            <>
              {gtStatus === "correct" && (
                <span title="Matches Ground Truth reporting edge" style={{ color: "#059669" }}>
                  <CheckCircle2 size={15} />
                </span>
              )}
              {gtStatus === "wrong" && (
                <span title="False Positive: Inferred edge differs from Ground Truth" style={{ color: "#e11d48" }}>
                  <AlertTriangle size={15} />
                </span>
              )}
              {gtStatus === "unassigned_correct" && (
                <span title="Safely left unassigned (Suppressed false guess)" style={{ color: "#2563eb" }}>
                  <ShieldCheck size={15} />
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Employee Identity */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "6px",
            background: isSelected ? "#bfdbfe" : "#f1f5f9",
            color: isSelected ? "#1e40af" : "#475569",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: "13px",
              color: "var(--text-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {employee.name}
          </div>
        </div>
      </div>

      {/* Raw Job Title */}
      <div
        style={{
          fontSize: "11px",
          fontWeight: 500,
          color: "var(--text-secondary)",
          lineHeight: 1.3,
          marginBottom: "8px",
          minHeight: "28px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {employee.raw_title}
      </div>

      {/* Footer: Department & Inferred Confidence */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: "6px",
          fontSize: "11px",
          color: "var(--text-muted)",
        }}
      >
        <span
          style={{
            maxWidth: "120px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={employee.inferred_department || "Department"}
        >
          {employee.inferred_department?.split("&")[0].trim() || "Retail"}
        </span>

        {/* Confidence score */}
        {confidence !== undefined && confidence !== null ? (
          <span
            className={confidenceClass}
            style={{ fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "2px" }}
          >
            {(confidence * 100).toFixed(0)}% conf
          </span>
        ) : (
          <span style={{ color: "var(--accent-amber)", fontWeight: 500 }}>Unassigned</span>
        )}
      </div>

      {/* Economic Buyer Gold Crown Marker */}
      {isEconomicBuyer && (
        <div
          style={{
            position: "absolute",
            top: "-8px",
            right: "10px",
            background: "#d97706",
            color: "#ffffff",
            fontSize: "10px",
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: "4px",
            boxShadow: "0 1px 3px rgba(217, 119, 6, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: "3px",
          }}
        >
          <Crown size={10} /> Economic Buyer
        </div>
      )}
    </div>
  );
};
