import React from "react";
import {
  Globe,
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  ExternalLink,
  GitGraph,
  UsersRound,
  Sparkles,
  BarChart2,
} from "lucide-react";
import { Company } from "../types";

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
        background: "#ffffff",
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
        {/* Left: Avatar + Title + Badges */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "10px",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-blue)",
              fontWeight: 800,
              fontSize: "18px",
              flexShrink: 0,
            }}
          >
            {company.name.slice(0, 2).toUpperCase()}
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

              {/* Domain pill */}
              {company.domain && (
                <a
                  href={`https://${company.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--accent-blue)",
                    background: "var(--accent-blue-subtle)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    border: "1px solid #bfdbfe",
                    textDecoration: "none",
                  }}
                  title={`Visit https://${company.domain}`}
                >
                  <Globe size={12} />
                  {company.domain}
                  <ExternalLink size={11} style={{ opacity: 0.7 }} />
                </a>
              )}

              {/* Category Pill */}
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#3730a3",
                  background: "#e0e7ff",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  border: "1px solid #c7d2fe",
                }}
              >
                {company.sub_sector}
              </span>

              {/* Domain Type Pill */}
              {company.domain_type && (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#0f766e",
                    background: "#ccfbf1",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    border: "1px solid #99f6e4",
                  }}
                >
                  {company.domain_type}
                </span>
              )}

              {/* Size Category */}
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  background: "#f1f5f9",
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
                    color: precision >= 0.8 ? "var(--accent-emerald)" : "var(--accent-blue)",
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
              background: "#f8fafc",
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
              background: "#f8fafc",
              border: "1px solid var(--border-subtle)",
              borderRadius: "6px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>MATRIX LINKS</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#7c3aed" }}>
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
            borderBottom: activeTab === "chart" ? "2px solid var(--accent-blue)" : "2px solid transparent",
            padding: "10px 4px",
            fontSize: "13px",
            fontWeight: activeTab === "chart" ? 700 : 500,
            color: activeTab === "chart" ? "var(--accent-blue)" : "var(--text-secondary)",
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
            borderBottom: activeTab === "directory" ? "2px solid var(--accent-blue)" : "2px solid transparent",
            padding: "10px 4px",
            fontSize: "13px",
            fontWeight: activeTab === "directory" ? 700 : 500,
            color: activeTab === "directory" ? "var(--accent-blue)" : "var(--text-secondary)",
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
            borderBottom: activeTab === "sales" ? "2px solid var(--accent-blue)" : "2px solid transparent",
            padding: "10px 4px",
            fontSize: "13px",
            fontWeight: activeTab === "sales" ? 700 : 500,
            color: activeTab === "sales" ? "var(--accent-blue)" : "var(--text-secondary)",
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
            borderBottom: activeTab === "analytics" ? "2px solid var(--accent-blue)" : "2px solid transparent",
            padding: "10px 4px",
            fontSize: "13px",
            fontWeight: activeTab === "analytics" ? 700 : 500,
            color: activeTab === "analytics" ? "var(--accent-blue)" : "var(--text-secondary)",
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
