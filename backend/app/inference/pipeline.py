"""
Inference Pipeline:
Coordinates reading company records, running Title Normalization,
Graph Solver, Matrix Detector, and Evaluation against Ground Truth.
"""

import json
from pathlib import Path
from typing import Optional, Dict, Any

from backend.app.schemas import Company, CompanySummary
from backend.app.inference.graph_solver import OrgGraphSolver
from backend.app.evaluation.metrics import Evaluator


class InferencePipeline:
    def __init__(self, confidence_threshold: float = 0.65):
        self.solver = OrgGraphSolver(confidence_threshold=confidence_threshold)

    def process_company(self, company: Company) -> Company:
        """
        Runs the full inference pipeline on a company:
        1. Infers reporting hierarchy and matrix edges
        2. Evaluates against ground truth
        3. Annotates nodes and edges with confidence and evaluation results
        """
        inferred_edges, employees = self.solver.solve_company_hierarchy(company.employees)
        company.employees = employees
        company.inferred_edges = inferred_edges

        # Run evaluation against ground truth
        eval_result = Evaluator.evaluate_company(company)
        company.evaluation_summary = eval_result

        return company

    def process_company_file(self, file_path: Path) -> Company:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        company = Company.model_validate(data)
        updated_company = self.process_company(company)

        # Write back updated company with inferred results
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(updated_company.model_dump_json(indent=2))

        return updated_company
