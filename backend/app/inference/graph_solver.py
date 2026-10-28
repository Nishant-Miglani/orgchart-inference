"""
Graph Hierarchy Solver:
Transforms flat employee directory into a structured, cycle-free reporting hierarchy.
Uses canonical track alignment, regional store hierarchy, domain affinity, and span-of-control balancing.
Enforces rejection threshold: leaves under-confident nodes unassigned rather than hallucinating wrong edges.
"""

from typing import List, Dict, Tuple, Optional
import networkx as nx

from backend.app.schemas import (
    Employee,
    ReportingEdge,
    EdgeType,
    SeniorityLevel,
    RetailDepartment,
)
from backend.app.inference.normalizer import TitleNormalizer
from backend.app.inference.confidence import (
    ConfidenceEngine,
    SENIORITY_RANK,
    REJECTION_THRESHOLD,
)
from backend.app.inference.matrix_detector import MatrixDetector


class OrgGraphSolver:
    def __init__(self, confidence_threshold: float = REJECTION_THRESHOLD):
        self.confidence_threshold = confidence_threshold

    def solve_company_hierarchy(
        self,
        employees: List[Employee],
    ) -> Tuple[List[ReportingEdge], List[Employee]]:
        """
        Takes a flat list of employees (with messy raw titles),
        normalizes attributes, and infers high-precision reporting edges.
        """
        # 1. Title Normalization & Attribute Extraction
        for emp in employees:
            lvl, dept, track, _ = TitleNormalizer.parse_employee_title(
                emp.raw_title, emp.department_raw
            )
            emp.inferred_seniority = lvl
            emp.inferred_department = dept
            emp.inferred_track = track

        # 2. Identify the Chief Executive (Root)
        ceo: Optional[Employee] = next(
            (e for e in employees if e.inferred_seniority == SeniorityLevel.L0_EXEC),
            None
        )
        if not ceo:
            l1_candidates = [
                e for e in employees if e.inferred_seniority == SeniorityLevel.L1_C_SUITE
            ]
            if l1_candidates:
                ceo = next(
                    (e for e in l1_candidates if "president" in e.raw_title.lower() or "coo" in e.raw_title.lower()),
                    l1_candidates[0]
                )
            elif employees:
                ceo = employees[0]

        primary_edges: List[ReportingEdge] = []
        manager_loads: Dict[str, int] = {}
        di_graph = nx.DiGraph()

        if ceo:
            di_graph.add_node(ceo.id)

        # 3. Resolve Hierarchical Reporting Lines
        for e in employees:
            if ceo and e.id == ceo.id:
                continue

            dept = e.inferred_department
            track = e.inferred_track
            lvl = e.inferred_seniority

            target_mgr: Optional[Employee] = None
            conf: float = 0.0
            rationale: str = ""

            if lvl == SeniorityLevel.L1_C_SUITE:
                target_mgr = ceo
                conf = 0.98
                rationale = "Department Executive reports directly to Chief Executive"

            elif lvl == SeniorityLevel.L2_VP:
                # Find L1 C-Suite in this department
                c_suite = [
                    m for m in employees
                    if m.inferred_department == dept and m.inferred_seniority == SeniorityLevel.L1_C_SUITE
                ]
                if c_suite:
                    target_mgr = c_suite[0]
                    conf = 0.95
                    rationale = f"VP reports to functional C-Suite ({target_mgr.raw_title})"
                elif ceo:
                    target_mgr = ceo
                    conf = 0.82
                    rationale = "VP reports to CEO (direct report)"

            elif lvl == SeniorityLevel.L3_DIRECTOR:
                # Find VP in this track or department
                vps = [
                    m for m in employees
                    if m.inferred_department == dept
                    and m.inferred_seniority == SeniorityLevel.L2_VP
                    and m.inferred_track == track
                ]
                if not vps:
                    vps = [
                        m for m in employees
                        if m.inferred_department == dept and m.inferred_seniority == SeniorityLevel.L2_VP
                    ]
                if vps:
                    target_mgr = vps[0]
                    conf = 0.92
                    rationale = f"Director reports to VP ({target_mgr.raw_title})"

            elif lvl == SeniorityLevel.L4_MANAGER:
                if dept == RetailDepartment.STORE_OPS:
                    # District Manager reports to Regional Director in same region/location
                    dirs = [
                        m for m in employees
                        if m.inferred_department == dept and m.inferred_seniority == SeniorityLevel.L3_DIRECTOR
                    ]
                    if dirs:
                        loc_dirs = [m for m in dirs if m.location and e.location and m.location == e.location]
                        target_mgr = loc_dirs[0] if loc_dirs else dirs[0]
                        conf = 0.88 if loc_dirs else 0.78
                        rationale = f"District Manager reports to Regional Director ({target_mgr.raw_title})"
                else:
                    dirs = [
                        m for m in employees
                        if m.inferred_department == dept
                        and m.inferred_seniority == SeniorityLevel.L3_DIRECTOR
                        and m.inferred_track == track
                    ]
                    if not dirs:
                        dirs = [
                            m for m in employees
                            if m.inferred_department == dept and m.inferred_seniority == SeniorityLevel.L3_DIRECTOR
                        ]
                    if dirs:
                        target_mgr = dirs[0]
                        conf = 0.90
                        rationale = f"Track Manager reports to Director ({target_mgr.raw_title})"

            elif lvl == SeniorityLevel.L5_SENIOR_IC:
                if dept == RetailDepartment.STORE_OPS:
                    # Store General Manager reports to District Manager (L4) in same location
                    mgrs = [
                        m for m in employees
                        if m.inferred_department == dept and m.inferred_seniority == SeniorityLevel.L4_MANAGER
                    ]
                    loc_mgrs = [m for m in mgrs if m.location and e.location and m.location == e.location]
                    if loc_mgrs:
                        target_mgr = loc_mgrs[0]
                        conf = 0.88
                        rationale = f"Store General Manager reports to District Manager ({target_mgr.raw_title})"
                    elif mgrs:
                        target_mgr = mgrs[0]
                        conf = 0.80
                        rationale = f"Store General Manager reports to District Manager ({target_mgr.raw_title})"
                else:
                    # Senior IC reports to Track Manager (L4)
                    mgrs = [
                        m for m in employees
                        if m.inferred_department == dept
                        and m.inferred_seniority == SeniorityLevel.L4_MANAGER
                        and m.inferred_track == track
                    ]
                    if not mgrs:
                        mgrs = [
                            m for m in employees
                            if m.inferred_department == dept and m.inferred_seniority == SeniorityLevel.L4_MANAGER
                        ]
                    if mgrs:
                        target_mgr = mgrs[0]
                        conf = 0.88
                        rationale = f"Senior Specialist reports to Track Manager ({target_mgr.raw_title})"

            elif lvl == SeniorityLevel.L6_IC:
                if dept == RetailDepartment.STORE_OPS:
                    # Store Staff (Associate, Shift Lead) reports to Store General Manager (L5) in same location
                    store_gms = [
                        m for m in employees
                        if m.inferred_department == dept and m.inferred_seniority == SeniorityLevel.L5_SENIOR_IC
                    ]
                    loc_gms = [m for m in store_gms if m.location and e.location and m.location == e.location]
                    if loc_gms:
                        target_mgr = loc_gms[0]
                        conf = 0.88
                        rationale = f"Store associate reports to local Store General Manager ({target_mgr.raw_title})"
                    elif store_gms:
                        target_mgr = store_gms[0]
                        conf = 0.78
                        rationale = f"Store associate reports to Store GM ({target_mgr.raw_title})"
                else:
                    mgrs = [
                        m for m in employees
                        if m.inferred_department == dept
                        and m.inferred_seniority == SeniorityLevel.L4_MANAGER
                        and m.inferred_track == track
                    ]
                    if not mgrs:
                        mgrs = [
                            m for m in employees
                            if m.inferred_department == dept and m.inferred_seniority == SeniorityLevel.L4_MANAGER
                        ]
                    if mgrs:
                        target_mgr = mgrs[0]
                        conf = 0.88
                        rationale = f"Team member reports to Track Manager ({target_mgr.raw_title})"

            # Apply span of control adjustment
            if target_mgr:
                load = manager_loads.get(target_mgr.id, 0)
                if load > 12:
                    conf = max(0.40, conf - (load - 12) * 0.02)

                # Cycle Prevention Check
                if di_graph.has_node(e.id) and di_graph.has_node(target_mgr.id):
                    if nx.has_path(di_graph, target_mgr.id, e.id):
                        target_mgr = None  # cycle detected, suppress edge!

            # Enforce Rejection Threshold: "A wrong edge is worse than no edge"
            if target_mgr and conf >= self.confidence_threshold:
                edge = ReportingEdge(
                    source_id=e.id,
                    target_id=target_mgr.id,
                    edge_type=EdgeType.PRIMARY,
                    confidence=round(conf, 2),
                    inference_rationale=rationale,
                )
                primary_edges.append(edge)
                e.inferred_manager_id = target_mgr.id
                e.manager_confidence = round(conf, 2)
                e.confidence_rationale = rationale
                manager_loads[target_mgr.id] = manager_loads.get(target_mgr.id, 0) + 1
                di_graph.add_edge(e.id, target_mgr.id)
            else:
                e.inferred_manager_id = None
                e.manager_confidence = round(conf, 2) if conf > 0 else 0.0
                e.confidence_rationale = (
                    f"Unresolved: best manager confidence ({conf:.2f}) "
                    f"below threshold ({self.confidence_threshold:.2f}). Unassigned."
                )

        # 4. Infer Matrix Dotted-Line Edges (~5%)
        matrix_edges = MatrixDetector.infer_matrix_edges(
            employees=employees,
            primary_edges=primary_edges,
            target_ratio=0.05,
        )

        all_inferred_edges = primary_edges + matrix_edges
        return all_inferred_edges, employees
