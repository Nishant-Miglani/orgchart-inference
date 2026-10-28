import React from "react";
import {
  X,
  Award,
  ShieldCheck,
} from "lucide-react";
import { BenchmarkReport } from "../types";

interface BenchmarkModalProps {
  report: BenchmarkReport | null;
  onClose: () => void;
}

export const BenchmarkModal: React.FC<BenchmarkModalProps> = ({ report, onClose }) => {
  if (!report) return null;

  const agg = report.aggregate_metrics;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "var(--accent-blue-subtle)",
                border: "1px solid #bfdbfe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Award size={20} color="var(--accent-blue)" />
            </div>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                Ground-Truth Benchmark Evaluation
              </h2>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Evaluated against gold-standard synthetic ground truth across all 500 retail companies
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: "6px", borderRadius: "50%", border: "none", boxShadow: "none" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Key Metric KPI Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >
            <div
              style={{
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                padding: "14px",
                borderRadius: "8px",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-emerald)" }}>
                GLOBAL PRECISION
              </div>
              <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--accent-emerald)", marginTop: "2px" }}>
                {(agg.global_precision * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                True Positives / Total Inferred
              </div>
            </div>

            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                padding: "14px",
                borderRadius: "8px",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-blue)" }}>
                GLOBAL RECALL
              </div>
              <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--accent-blue)", marginTop: "2px" }}>
                {(agg.global_recall * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                Reporting Lines Resolved
              </div>
            </div>

            <div
              style={{
                background: "#f5f3ff",
                border: "1px solid #ddd6fe",
                padding: "14px",
                borderRadius: "8px",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-purple)" }}>
                F1 SCORE
              </div>
              <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--accent-purple)", marginTop: "2px" }}>
                {(agg.global_f1 * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                Harmonic Mean
              </div>
            </div>

            <div
              style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                padding: "14px",
                borderRadius: "8px",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-amber)" }}>
                UNASSIGNED PROTECTED
              </div>
              <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--accent-amber)", marginTop: "2px" }}>
                {agg.total_unassigned_nodes.toLocaleString()}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                Suppressed to avoid wrong edges
              </div>
            </div>
          </div>

          {/* Dataset Statistics */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 16px",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              fontSize: "12px",
            }}
          >
            <div>
              <span style={{ color: "var(--text-muted)" }}>Total Companies: </span>
              <strong>{report.total_companies_evaluated}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Total Employees: </span>
              <strong>{report.total_employees_evaluated.toLocaleString()}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Confidence Cutoff: </span>
              <strong>{(report.confidence_threshold * 100).toFixed(0)}%</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Benchmark Runtime: </span>
              <strong>{report.execution_time_seconds}s</strong>
            </div>
          </div>

          {/* Sub-Sector Performance Table */}
          <div>
            <h3 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
              Performance Breakdown Across Retail Sub-Sectors
            </h3>
            <div
              style={{
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid var(--border-subtle)" }}>
                    <th style={{ padding: "8px 12px", color: "var(--text-secondary)", fontWeight: 600 }}>Retail Sub-Sector</th>
                    <th style={{ padding: "8px 12px", color: "var(--text-secondary)", fontWeight: 600 }}>Companies</th>
                    <th style={{ padding: "8px 12px", color: "var(--text-secondary)", fontWeight: 600 }}>Precision</th>
                    <th style={{ padding: "8px 12px", color: "var(--text-secondary)", fontWeight: 600 }}>Recall</th>
                    <th style={{ padding: "8px 12px", color: "var(--text-secondary)", fontWeight: 600 }}>Wrong Edge Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(report.by_sub_sector).map(([sector, stats], idx) => (
                    <tr
                      key={sector}
                      style={{
                        borderTop: "1px solid var(--border-subtle)",
                        background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                      }}
                    >
                      <td style={{ padding: "8px 12px", fontWeight: 600, color: "var(--text-primary)" }}>{sector}</td>
                      <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>{stats.companies}</td>
                      <td
                        style={{
                          padding: "8px 12px",
                          fontWeight: 700,
                          color: stats.precision >= 0.8 ? "var(--accent-emerald)" : "var(--accent-blue)",
                        }}
                      >
                        {(stats.precision * 100).toFixed(1)}%
                      </td>
                      <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>{(stats.recall * 100).toFixed(1)}%</td>
                      <td style={{ padding: "8px 12px", color: "var(--accent-amber)" }}>
                        {(stats.wrong_edge_rate * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Principle Box */}
          <div
            style={{
              padding: "12px 16px",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "8px",
              fontSize: "12px",
              lineHeight: 1.5,
              color: "var(--text-secondary)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: 700,
                color: "var(--accent-blue)",
                marginBottom: "4px",
              }}
            >
              <ShieldCheck size={15} /> Key Principle: &ldquo;A Wrong Edge is Worse Than No Edge&rdquo;
            </div>
            In B2B sales intelligence, reaching out to an executive claiming they manage the wrong person damages sales credibility. Our inference engine prioritizes precision over recall by enforcing calibrated confidence thresholds. When title ambiguities or missing metadata prevent confident manager resolution, the engine deliberately leaves the node unassigned rather than hallucinating an inaccurate reporting line.
          </div>
        </div>
      </div>
    </div>
  );
};
