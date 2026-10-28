"""
Evaluation Metrics:
Computes Edge Precision, Recall, F1, False Discovery (Wrong Edge) Rate,
Matrix Dotted-Line Accuracy, and Department/Seniority classification metrics
against the Ground Truth gold standard.
"""

from typing import List, Dict, Any, Tuple
from backend.app.schemas import (
    Company,
    ReportingEdge,
    EdgeType,
    EvaluationMetrics,
)


class Evaluator:
    @staticmethod
    def evaluate_company(
        company: Company,
    ) -> Dict[str, Any]:
        """
        Evaluates inferred edges against ground truth edges for a single company.
        """
        gt_edges_set = {
            (e.source_id, e.target_id, e.edge_type.value)
            for e in company.ground_truth_edges
        }
        gt_primary_set = {
            (e.source_id, e.target_id)
            for e in company.ground_truth_edges
            if e.edge_type == EdgeType.PRIMARY
        }
        gt_matrix_set = {
            (e.source_id, e.target_id)
            for e in company.ground_truth_edges
            if e.edge_type == EdgeType.MATRIX
        }

        inferred_edges_set = {
            (e.source_id, e.target_id, e.edge_type.value)
            for e in company.inferred_edges
        }
        inferred_primary_set = {
            (e.source_id, e.target_id)
            for e in company.inferred_edges
            if e.edge_type == EdgeType.PRIMARY
        }
        inferred_matrix_set = {
            (e.source_id, e.target_id)
            for e in company.inferred_edges
            if e.edge_type == EdgeType.MATRIX
        }

        # Tag each inferred edge as correct or incorrect
        for edge in company.inferred_edges:
            is_correct = (edge.source_id, edge.target_id) in gt_primary_set or (
                edge.source_id,
                edge.target_id,
            ) in gt_matrix_set
            edge.is_correct = is_correct

        # Primary metrics
        true_positives = len(inferred_primary_set.intersection(gt_primary_set))
        false_positives = len(inferred_primary_set - gt_primary_set)
        false_negatives = len(gt_primary_set - inferred_primary_set)

        precision = (
            true_positives / (true_positives + false_positives)
            if (true_positives + false_positives) > 0
            else 0.0
        )
        recall = (
            true_positives / (true_positives + false_negatives)
            if (true_positives + false_negatives) > 0
            else 0.0
        )
        f1 = (
            2 * (precision * recall) / (precision + recall)
            if (precision + recall) > 0
            else 0.0
        )
        wrong_edge_rate = 1.0 - precision if (true_positives + false_positives) > 0 else 0.0

        # Matrix metrics
        matrix_tp = len(inferred_matrix_set.intersection(gt_matrix_set))
        matrix_fp = len(inferred_matrix_set - gt_matrix_set)
        matrix_fn = len(gt_matrix_set - inferred_matrix_set)
        matrix_precision = (
            matrix_tp / (matrix_tp + matrix_fp)
            if (matrix_tp + matrix_fp) > 0
            else 0.0
        )
        matrix_recall = (
            matrix_tp / (matrix_tp + matrix_fn)
            if (matrix_tp + matrix_fn) > 0
            else 0.0
        )

        # Attribute extraction accuracy
        correct_dept = sum(
            1
            for e in company.employees
            if e.inferred_department == e.ground_truth_department
        )
        correct_seniority = sum(
            1
            for e in company.employees
            if e.inferred_seniority == e.ground_truth_seniority
        )
        unassigned_count = sum(
            1 for e in company.employees if e.inferred_manager_id is None and e.ground_truth_manager_id is not None
        )

        total_emp = len(company.employees)

        return {
            "company_id": company.id,
            "company_name": company.name,
            "total_employees": total_emp,
            "ground_truth_primary_edges": len(gt_primary_set),
            "ground_truth_matrix_edges": len(gt_matrix_set),
            "inferred_primary_edges": len(inferred_primary_set),
            "inferred_matrix_edges": len(inferred_matrix_set),
            "true_positives": true_positives,
            "false_positives": false_positives,
            "false_negatives": false_negatives,
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "wrong_edge_rate": round(wrong_edge_rate, 4),
            "matrix_precision": round(matrix_precision, 4),
            "matrix_recall": round(matrix_recall, 4),
            "department_accuracy": round(correct_dept / total_emp, 4) if total_emp > 0 else 0.0,
            "seniority_accuracy": round(correct_seniority / total_emp, 4) if total_emp > 0 else 0.0,
            "unassigned_count": unassigned_count,
        }
