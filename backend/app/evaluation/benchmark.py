"""
Benchmark Runner:
Executes the inference pipeline across all 500 companies in the dataset,
computes global aggregate metrics, updates the company records and index,
and outputs benchmark_report.json.
"""

import json
import time
from pathlib import Path
from typing import Dict, Any, List

from backend.app.schemas import CompanySummary, Company
from backend.app.inference.pipeline import InferencePipeline


def run_benchmark(
    data_dir: str = "backend/data",
    confidence_threshold: float = 0.65,
) -> Dict[str, Any]:
    start_time = time.time()
    pipeline = InferencePipeline(confidence_threshold=confidence_threshold)
    companies_dir = Path(data_dir) / "companies"
    index_file = Path(data_dir) / "companies_index.json"

    company_files = sorted(list(companies_dir.glob("comp_*.json")))
    total_files = len(company_files)
    print(f"Running Org Chart Inference & Evaluation on {total_files} companies...")

    total_employees = 0
    total_gt_primary = 0
    total_gt_matrix = 0
    total_inf_primary = 0
    total_inf_matrix = 0
    total_tp = 0
    total_fp = 0
    total_fn = 0
    total_matrix_tp = 0
    total_matrix_fp = 0
    total_matrix_fn = 0
    total_unassigned = 0

    sub_sector_metrics: Dict[str, Dict[str, Any]] = {}
    size_metrics: Dict[str, Dict[str, Any]] = {}
    updated_summaries: List[Dict[str, Any]] = []

    for idx, file_path in enumerate(company_files, 1):
        with open(file_path, "r", encoding="utf-8") as f:
            comp_data = json.load(f)
        company = Company.model_validate(comp_data)

        # Process inference & evaluation
        updated_company = pipeline.process_company(company)

        # Save updated company JSON
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(updated_company.model_dump_json(indent=2))

        # Accumulate metrics
        eval_res = updated_company.evaluation_summary or {}
        emp_count = updated_company.employee_count
        total_employees += emp_count

        total_gt_primary += eval_res.get("ground_truth_primary_edges", 0)
        total_gt_matrix += eval_res.get("ground_truth_matrix_edges", 0)
        total_inf_primary += eval_res.get("inferred_primary_edges", 0)
        total_inf_matrix += eval_res.get("inferred_matrix_edges", 0)

        tp = eval_res.get("true_positives", 0)
        fp = eval_res.get("false_positives", 0)
        fn = eval_res.get("false_negatives", 0)
        unassigned = eval_res.get("unassigned_count", 0)

        total_tp += tp
        total_fp += fp
        total_fn += fn
        total_unassigned += unassigned

        # Sector breakdown
        sector = updated_company.sub_sector
        if sector not in sub_sector_metrics:
            sub_sector_metrics[sector] = {"tp": 0, "fp": 0, "fn": 0, "count": 0}
        sub_sector_metrics[sector]["tp"] += tp
        sub_sector_metrics[sector]["fp"] += fp
        sub_sector_metrics[sector]["fn"] += fn
        sub_sector_metrics[sector]["count"] += 1

        # Size breakdown
        size_cat = updated_company.size_category
        if size_cat not in size_metrics:
            size_metrics[size_cat] = {"tp": 0, "fp": 0, "fn": 0, "count": 0}
        size_metrics[size_cat]["tp"] += tp
        size_metrics[size_cat]["fp"] += fp
        size_metrics[size_cat]["fn"] += fn
        size_metrics[size_cat]["count"] += 1

        # Summary for fast index
        updated_summaries.append({
            "id": updated_company.id,
            "name": updated_company.name,
            "sub_sector": updated_company.sub_sector,
            "size_category": updated_company.size_category,
            "employee_count": updated_company.employee_count,
            "headquarters": updated_company.headquarters,
            "precision": eval_res.get("precision", 0.0),
            "recall": eval_res.get("recall", 0.0),
            "f1_score": eval_res.get("f1_score", 0.0),
            "wrong_edge_rate": eval_res.get("wrong_edge_rate", 0.0),
            "unassigned_count": unassigned,
        })

        if idx % 100 == 0 or idx == total_files:
            print(f"  Processed {idx}/{total_files} companies...")

    # Update index file with evaluation stats
    with open(index_file, "w", encoding="utf-8") as f:
        json.dump(updated_summaries, f, indent=2)

    # Compute global micro metrics
    global_precision = total_tp / (total_tp + total_fp) if (total_tp + total_fp) > 0 else 0.0
    global_recall = total_tp / (total_tp + total_fn) if (total_tp + total_fn) > 0 else 0.0
    global_f1 = (
        2 * (global_precision * global_recall) / (global_precision + global_recall)
        if (global_precision + global_recall) > 0
        else 0.0
    )
    global_wrong_edge_rate = 1.0 - global_precision

    # Sector summary
    sector_summary = {}
    for s, data in sub_sector_metrics.items():
        s_prec = data["tp"] / (data["tp"] + data["fp"]) if (data["tp"] + data["fp"]) > 0 else 0.0
        s_rec = data["tp"] / (data["tp"] + data["fn"]) if (data["tp"] + data["fn"]) > 0 else 0.0
        sector_summary[s] = {
            "companies": data["count"],
            "precision": round(s_prec, 4),
            "recall": round(s_rec, 4),
            "wrong_edge_rate": round(1.0 - s_prec, 4),
        }

    elapsed_time = round(time.time() - start_time, 2)

    report = {
        "execution_time_seconds": elapsed_time,
        "total_companies_evaluated": total_files,
        "total_employees_evaluated": total_employees,
        "confidence_threshold": confidence_threshold,
        "aggregate_metrics": {
            "global_precision": round(global_precision, 4),
            "global_recall": round(global_recall, 4),
            "global_f1": round(global_f1, 4),
            "global_wrong_edge_rate": round(global_wrong_edge_rate, 4),
            "true_positives": total_tp,
            "false_positives": total_fp,
            "false_negatives": total_fn,
            "total_ground_truth_edges": total_gt_primary + total_gt_matrix,
            "total_inferred_edges": total_inf_primary + total_inf_matrix,
            "total_unassigned_nodes": total_unassigned,
        },
        "by_sub_sector": sector_summary,
    }

    report_path = Path(data_dir) / "benchmark_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print("\n================== BENCHMARK REPORT ==================")
    print(f"Total Companies:        {total_files}")
    print(f"Total Employees:        {total_employees:,}")
    print(f"Global Precision:       {global_precision:.2%}")
    print(f"Global Recall:          {global_recall:.2%}")
    print(f"Global F1 Score:        {global_f1:.2%}")
    print(f"Wrong Edge Rate (FP):   {global_wrong_edge_rate:.2%}")
    print(f"Total Unassigned Nodes: {total_unassigned:,} (Safely suppressed under threshold)")
    print(f"Execution Time:         {elapsed_time}s")
    print(f"Report saved to:        {report_path}")
    print("======================================================\n")

    return report


if __name__ == "__main__":
    run_benchmark()
