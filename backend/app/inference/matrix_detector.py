"""
Matrix Detector:
Infers realistic dotted-line / secondary reporting lines for ~5% of retail employees.
Focuses on known cross-functional retail matrix pairings (e.g. Loss Prevention in Stores,
Embedded Data Analysts in Merchandising, E-comm Fulfillment with Logistics, Field HR with Store Ops).
"""

from typing import List, Dict, Optional
from backend.app.schemas import (
    Employee,
    ReportingEdge,
    EdgeType,
    RetailDepartment,
    SeniorityLevel,
)
from backend.app.inference.confidence import SENIORITY_RANK

# Complementary department matrix pairings in retail
COMPLEMENTARY_MATRIX_PAIRS = {
    RetailDepartment.LOSS_PREVENTION: RetailDepartment.STORE_OPS,
    RetailDepartment.DATA_ANALYTICS: RetailDepartment.MERCHANDISING,
    RetailDepartment.ECOMMERCE: RetailDepartment.SUPPLY_CHAIN,
    RetailDepartment.STORE_OPS: RetailDepartment.PEOPLE,
    RetailDepartment.MERCHANDISING: RetailDepartment.FINANCE,
}


class MatrixDetector:
    @staticmethod
    def infer_matrix_edges(
        employees: List[Employee],
        primary_edges: List[ReportingEdge],
        target_ratio: float = 0.05,
    ) -> List[ReportingEdge]:
        """
        Infers dotted-line matrix edges for ~5% of employees based on cross-functional alignment.
        """
        matrix_edges: List[ReportingEdge] = []
        max_matrix_count = max(2, int(len(employees) * target_ratio))

        # Index employees by department and seniority
        dept_leaders: Dict[RetailDepartment, List[Employee]] = {d: [] for d in RetailDepartment}
        emp_by_id = {e.id: e for e in employees}
        primary_manager_map = {edge.source_id: edge.target_id for edge in primary_edges}

        for emp in employees:
            if emp.inferred_department and emp.inferred_seniority in (
                SeniorityLevel.L3_DIRECTOR,
                SeniorityLevel.L4_MANAGER,
            ):
                dept_leaders[emp.inferred_department].append(emp)

        # Candidates for dotted line: L4, L5, L6 roles with matching cross-functional pairs
        candidate_subs = [
            e for e in employees
            if e.inferred_seniority in (
                SeniorityLevel.L4_MANAGER,
                SeniorityLevel.L5_SENIOR_IC,
                SeniorityLevel.L6_IC,
            )
            and e.inferred_department in COMPLEMENTARY_MATRIX_PAIRS
        ]

        # Prioritize roles with specific cross-functional keyword tokens
        def priority_score(emp: Employee) -> int:
            t = emp.raw_title.lower()
            if "investigator" in t or "loss prevention" in t or "lp" in t:
                return 3
            if "analyst" in t or "pricing" in t or "forecast" in t:
                return 2
            if "fulfillment" in t or "hrbp" in t or "partner" in t:
                return 2
            return 1

        candidate_subs.sort(key=priority_score, reverse=True)

        for sub in candidate_subs:
            if len(matrix_edges) >= max_matrix_count:
                break

            primary_mgr_id = primary_manager_map.get(sub.id)
            target_partner_dept = COMPLEMENTARY_MATRIX_PAIRS.get(sub.inferred_department)
            if not target_partner_dept:
                continue

            potential_mgrs = dept_leaders.get(target_partner_dept, [])
            if not potential_mgrs:
                continue

            # Pick leader with closest location or seniority rank higher than subordinate
            sub_rank = SENIORITY_RANK.get(sub.inferred_seniority, 6)
            best_mgr: Optional[Employee] = None
            best_score = 0.0

            for mgr in potential_mgrs:
                if mgr.id == primary_mgr_id or mgr.id == sub.id:
                    continue
                mgr_rank = SENIORITY_RANK.get(mgr.inferred_seniority, 6)
                if mgr_rank >= sub_rank:
                    continue

                score = 0.80
                if sub.location and mgr.location and sub.location == mgr.location:
                    score += 0.08

                if score > best_score:
                    best_score = score
                    best_mgr = mgr

            if best_mgr and best_score >= 0.75:
                edge = ReportingEdge(
                    source_id=sub.id,
                    target_id=best_mgr.id,
                    edge_type=EdgeType.MATRIX,
                    confidence=round(best_score, 2),
                    inference_rationale=(
                        f"Matrix dotted-line: {sub.inferred_department.value} role "
                        f"cross-aligned with {best_mgr.inferred_department.value} leadership ({best_mgr.raw_title})"
                    ),
                )
                matrix_edges.append(edge)
                sub.inferred_matrix_manager_id = best_mgr.id
                sub.matrix_confidence = edge.confidence

        return matrix_edges
