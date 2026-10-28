import React from "react";
import {
  Layers,
  BarChart3,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

interface NavbarProps {
  compareWithGroundTruth: boolean;
  onToggleGroundTruth: () => void;
  onOpenBenchmark: () => void;
  precisionScore?: number;
  totalCompanies?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  compareWithGroundTruth,
  onToggleGroundTruth,
  onOpenBenchmark,
  precisionScore,
  totalCompanies = 500,
}) => {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 24px",
        background: "#ffffff",
        borderBottom: "1px solid var(--border-subtle)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Brand & Platform title */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "var(--accent-blue)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 3px rgba(37, 99, 235, 0.3)",
          }}
        >
          <Layers size={18} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
              Firmable
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "1px 6px",
                borderRadius: "4px",
                background: "var(--accent-blue-subtle)",
                color: "var(--accent-blue)",
                border: "1px solid #bfdbfe",
              }}
            >
              OrgChart AI
            </span>
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            B2B Sales Intelligence & Org Chart Inference • {totalCompanies} Companies
          </span>
        </div>
      </div>

      {/* Accuracy KPI & Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {precisionScore !== undefined && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "12px",
            }}
          >
            <ShieldCheck size={14} color="var(--accent-emerald)" />
            <span style={{ color: "var(--text-secondary)" }}>Edge Precision:</span>
            <strong style={{ color: "var(--accent-emerald)" }}>{(precisionScore * 100).toFixed(1)}%</strong>
          </div>
        )}

        <button
          onClick={onToggleGroundTruth}
          className={`btn-secondary ${compareWithGroundTruth ? "active" : ""}`}
          style={{
            padding: "6px 12px",
            fontSize: "12px",
            background: compareWithGroundTruth ? "var(--accent-blue-subtle)" : "#ffffff",
            borderColor: compareWithGroundTruth ? "#bfdbfe" : "var(--border-medium)",
            color: compareWithGroundTruth ? "var(--accent-blue)" : "var(--text-primary)",
          }}
          title="Compare inferred reporting edges against gold standard ground truth"
        >
          <CheckCircle2 size={14} color={compareWithGroundTruth ? "var(--accent-blue)" : "var(--text-muted)"} />
          Ground Truth Overlay
        </button>

        <button onClick={onOpenBenchmark} className="btn-primary" style={{ padding: "6px 14px", fontSize: "12px" }}>
          <BarChart3 size={14} />
          500-Company Benchmark
        </button>
      </div>
    </header>
  );
};
