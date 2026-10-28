import React from "react";
import {
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  GitGraph,
  UsersRound,
  Sparkles,
  BarChart2,
} from "lucide-react";
import { Company } from "../types";
import { FirmableLogo } from "./FirmableLogo";

export type CompanyDetailTab = "chart" | "directory" | "sales" | "analytics";

interface CompanyHeaderProps {
  company: Company;
  activeTab: CompanyDetailTab;
  onTabChange: (tab: CompanyDetailTab) => void;
}

export const CompanyHeader: React.FC<CompanyHeaderProps> = ({
  company,
  activeTab,
  onTabChange,
}) => {
  const precision = company.evaluation_summary?.precision;

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border-subtle)",
        padding: "16px 24px 0 24px",
      }}
    >
      {/* Top Profile Summary */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        {/* Left: Company Image / Logo + Title + Badges */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div
            style={{
              height: "48px",
              padding: "0 14px",
              borderRadius: "10px",
              background: "#ffffff",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 1px 3px rgba(16, 24, 40, 0.08)",
            }}
          >
            <FirmableLogo height={24} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                {company.name}
              </h1>

              {/* Category Pill */}
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--accent-purple)",
                  background: "var(--accent-purple-subtle)",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  border: "1px solid var(--accent-purple-border)",
                }}
              >
                {company.sub_sector}
              </span>

              {/* Size Category */}
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  background: "var(--bg-card)",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {company.size_category}
              </span>
            </div>

            {/* Metadata row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
                fontSize: "12px",
                color: "var(--text-secondary)",
                marginTop: "6px",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <MapPin size={13} color="var(--text-muted)" />
                {company.headquarters}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Calendar size={13} color="var(--text-muted)" />
                Founded {company.founded_year}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Users size={13} color="var(--text-muted)" />
                <strong>{company.employee_count}</strong> Employees
              </span>
              {precision !== undefined && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: precision >= 0.8 ? "var(--accent-emerald)" : "var(--accent-orange)",
                    fontWeight: 600,
                  }}
                >
                  <ShieldCheck size={13} />
                  {(precision * 100).toFixed(1)}% Inferred Precision
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Stat Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              padding: "6px 12px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "6px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>INFERRED EDGES</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
              {company.inferred_edges.length}
            </div>
          </div>
          <div
            style={{
              padding: "6px 12px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "6px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>MATRIX LINKS</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--accent-purple)" }}>
              {company.inferred_edges.filter((e) => e.edge_type === "matrix").length}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: "0",
        }}
      >
        <button
          onClick={() => onTabChange("chart")}
          style={{
            background: "transparent",
            border: "none",
            borderBottom: activeTab === "chart" ? "2px solid var(--accent-orange)" : "2px solid transparent",
            padding: "10px 4px",
            fontSize: "13px",
            fontWeight: activeTab === "chart" ? 700 : 500,
            color: activeTab === "chart" ? "var(--accent-orange)" : "var(--text-secondary)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.15s ease",
          }}
        >
          <GitGraph size={15} />
          Org Chart Hierarchy
        </button>

        <button
          onClick={() => onTabChange("directory")}
          style={{
            background: "transparent",
            border: "none",
            borderBottom: activeTab === "directory" ? "2px solid var(--accent-orange)" : "2px solid transparent",
            padding: "10px 4px",
            fontSize: "13px",
            fontWeight: activeTab === "directory" ? 700 : 500,
            color: activeTab === "directory" ? "var(--accent-orange)" : "var(--text-secondary)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.15s ease",
          }}
        >
          <UsersRound size={15} />
          Leadership & Directory ({company.employees.length})
        </button>

        <button
          onClick={() => onTabChange("sales")}
          style={{
            background: "transparent",
            border: "none",
            borderBottom: activeTab === "sales" ? "2px solid var(--accent-orange)" : "2px solid transparent",
            padding: "10px 4px",
            fontSize: "13px",
            fontWeight: activeTab === "sales" ? 700 : 500,
            color: activeTab === "sales" ? "var(--accent-orange)" : "var(--text-secondary)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.15s ease",
          }}
        >
          <Sparkles size={15} />
          Sales Intelligence & Decision Makers
        </button>

        <button
          onClick={() => onTabChange("analytics")}
          style={{
            background: "transparent",
            border: "none",
            borderBottom: activeTab === "analytics" ? "2px solid var(--accent-orange)" : "2px solid transparent",
            padding: "10px 4px",
            fontSize: "13px",
            fontWeight: activeTab === "analytics" ? 700 : 500,
            color: activeTab === "analytics" ? "var(--accent-orange)" : "var(--text-secondary)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.15s ease",
          }}
        >
          <BarChart2 size={15} />
          Department Breakdown & Accuracy
        </button>
      </div>
    </div>
  );
};
