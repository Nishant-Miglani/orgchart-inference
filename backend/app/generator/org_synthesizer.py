"""
Org Synthesizer: Procedurally generates realistic, valid corporate hierarchy trees
for retail companies based on operational sub-tracks, including 95% single-manager
primary reporting and 5% matrix dotted-line reporting.
"""

import random
from typing import List, Dict, Tuple, Optional
from faker import Faker
from backend.app.schemas import (
    SeniorityLevel,
    RetailDepartment,
    EdgeType,
    Employee,
    ReportingEdge,
)
from backend.app.generator.retail_taxonomy import (
    DEPARTMENT_TRACKS,
    RETAIL_LOCATIONS,
    RETAIL_SUB_SECTORS,
)

fake = Faker()


class OrgSynthesizer:
    def __init__(self, seed: Optional[int] = None):
        if seed is not None:
            random.seed(seed)
            Faker.seed(seed)

    def generate_company_org(
        self,
        company_id: str,
        company_name: str,
        sub_sector: str,
        target_size: int = 120,
    ) -> Tuple[List[Employee], List[ReportingEdge]]:
        """
        Generates a ground truth hierarchy tree for a retail company of size target_size (>= 100).
        Organizes roles by coherent functional sub-tracks and regions.
        """
        employees: List[Employee] = []
        edges: List[ReportingEdge] = []
        emp_counter = 1

        hq_location = random.choice(RETAIL_LOCATIONS)

        # 1. Create Root (CEO / President)
        ceo_id = f"{company_id}_emp_{emp_counter:04d}"
        emp_counter += 1
        ceo_title = random.choice(
            DEPARTMENT_TRACKS[RetailDepartment.EXECUTIVE][0]["roles"][SeniorityLevel.L0_EXEC]
        )
        ceo = Employee(
            id=ceo_id,
            name=fake.name(),
            raw_title=ceo_title,
            department_raw=RetailDepartment.EXECUTIVE.value,
            location=hq_location,
            ground_truth_manager_id=None,
            ground_truth_seniority=SeniorityLevel.L0_EXEC,
            ground_truth_department=RetailDepartment.EXECUTIVE,
        )
        employees.append(ceo)

        # 2. Select Departments active in this retail business
        core_depts = [
            RetailDepartment.MERCHANDISING,
            RetailDepartment.STORE_OPS,
            RetailDepartment.SUPPLY_CHAIN,
            RetailDepartment.TECHNOLOGY,
            RetailDepartment.MARKETING,
            RetailDepartment.FINANCE,
            RetailDepartment.PEOPLE,
        ]
        optional_depts = [
            RetailDepartment.ECOMMERCE,
            RetailDepartment.DATA_ANALYTICS,
            RetailDepartment.LOSS_PREVENTION,
            RetailDepartment.LEGAL,
        ]
        active_depts = list(core_depts)
        for dept in optional_depts:
            if target_size > 115 or random.random() < 0.85:
                active_depts.append(dept)

        dept_weights = {
            RetailDepartment.STORE_OPS: 0.28,
            RetailDepartment.MERCHANDISING: 0.18,
            RetailDepartment.SUPPLY_CHAIN: 0.16,
            RetailDepartment.TECHNOLOGY: 0.10,
            RetailDepartment.ECOMMERCE: 0.08,
            RetailDepartment.MARKETING: 0.06,
            RetailDepartment.DATA_ANALYTICS: 0.04,
            RetailDepartment.FINANCE: 0.04,
            RetailDepartment.LOSS_PREVENTION: 0.03,
            RetailDepartment.PEOPLE: 0.02,
            RetailDepartment.LEGAL: 0.01,
        }

        remaining_budget = target_size - 1
        dept_sizes = {}
        total_w = sum(dept_weights.get(d, 0.05) for d in active_depts)
        for d in active_depts:
            w = dept_weights.get(d, 0.05) / total_w
            dept_sizes[d] = max(4, int(remaining_budget * w))

        diff = remaining_budget - sum(dept_sizes.values())
        if diff != 0:
            dept_sizes[RetailDepartment.STORE_OPS] += diff

        # Generate each department tree using realistic functional tracks
        for dept in active_depts:
            tracks = DEPARTMENT_TRACKS.get(dept, [])
            if not tracks:
                continue

            d_size = dept_sizes[dept]
            # 1. Create Department C-Suite Executive (L1)
            c_suite_title = tracks[0].get("c_suite", f"Chief {dept.value} Officer")
            l1_id = f"{company_id}_emp_{emp_counter:04d}"
            emp_counter += 1
            l1_emp = Employee(
                id=l1_id,
                name=fake.name(),
                raw_title=c_suite_title,
                department_raw=dept.value,
                location=hq_location,
                ground_truth_manager_id=ceo.id,
                ground_truth_seniority=SeniorityLevel.L1_C_SUITE,
                ground_truth_department=dept,
            )
            employees.append(l1_emp)
            edges.append(
                ReportingEdge(
                    source_id=l1_emp.id,
                    target_id=ceo.id,
                    edge_type=EdgeType.PRIMARY,
                    confidence=1.0,
                    inference_rationale="Department Executive reports directly to CEO",
                )
            )

            # Special handling for Store Operations (Geographic Districts & Stores)
            if dept == RetailDepartment.STORE_OPS:
                # VP Retail Store Operations
                vp_id = f"{company_id}_emp_{emp_counter:04d}"
                emp_counter += 1
                vp_emp = Employee(
                    id=vp_id,
                    name=fake.name(),
                    raw_title="VP Retail Store Operations",
                    department_raw=dept.value,
                    location=hq_location,
                    ground_truth_manager_id=l1_emp.id,
                    ground_truth_seniority=SeniorityLevel.L2_VP,
                    ground_truth_department=dept,
                )
                employees.append(vp_emp)
                edges.append(
                    ReportingEdge(
                        source_id=vp_emp.id,
                        target_id=l1_emp.id,
                        edge_type=EdgeType.PRIMARY,
                        confidence=1.0,
                        inference_rationale="VP Retail Stores reports to COO",
                    )
                )

                # 2-3 Regional Directors (each in a specific region)
                regions = ["Northeast", "Midwest", "Southeast", "West Coast"]
                num_regions = max(1, min(3, d_size // 12))
                active_regions = regions[:num_regions]

                store_budget_left = d_size - 2
                per_region_budget = max(4, store_budget_left // num_regions)

                for reg in active_regions:
                    reg_loc = random.choice(RETAIL_LOCATIONS)
                    dir_id = f"{company_id}_emp_{emp_counter:04d}"
                    emp_counter += 1
                    dir_emp = Employee(
                        id=dir_id,
                        name=fake.name(),
                        raw_title=f"Regional Director of Stores ({reg})",
                        department_raw=dept.value,
                        location=reg_loc,
                        ground_truth_manager_id=vp_emp.id,
                        ground_truth_seniority=SeniorityLevel.L3_DIRECTOR,
                        ground_truth_department=dept,
                    )
                    employees.append(dir_emp)
                    edges.append(
                        ReportingEdge(
                            source_id=dir_emp.id,
                            target_id=vp_emp.id,
                            edge_type=EdgeType.PRIMARY,
                            confidence=1.0,
                            inference_rationale="Regional Director reports to VP Retail Stores",
                        )
                    )

                    # 1-2 District Managers under this Regional Director
                    num_districts = max(1, per_region_budget // 6)
                    for dist_idx in range(num_districts):
                        mgr_id = f"{company_id}_emp_{emp_counter:04d}"
                        emp_counter += 1
                        mgr_emp = Employee(
                            id=mgr_id,
                            name=fake.name(),
                            raw_title=f"District Store Manager ({reg} District {dist_idx + 1})",
                            department_raw=dept.value,
                            location=reg_loc,
                            ground_truth_manager_id=dir_emp.id,
                            ground_truth_seniority=SeniorityLevel.L4_MANAGER,
                            ground_truth_department=dept,
                        )
                        employees.append(mgr_emp)
                        edges.append(
                            ReportingEdge(
                                source_id=mgr_emp.id,
                                target_id=dir_emp.id,
                                edge_type=EdgeType.PRIMARY,
                                confidence=1.0,
                                inference_rationale="District Store Manager reports to Regional Director",
                            )
                        )

                        # Store GMs (L5) reporting to District Manager
                        store_gm_id = f"{company_id}_emp_{emp_counter:04d}"
                        emp_counter += 1
                        store_gm_emp = Employee(
                            id=store_gm_id,
                            name=fake.name(),
                            raw_title="Store General Manager",
                            department_raw=dept.value,
                            location=reg_loc,
                            ground_truth_manager_id=mgr_emp.id,
                            ground_truth_seniority=SeniorityLevel.L5_SENIOR_IC,
                            ground_truth_department=dept,
                        )
                        employees.append(store_gm_emp)
                        edges.append(
                            ReportingEdge(
                                source_id=store_gm_emp.id,
                                target_id=mgr_emp.id,
                                edge_type=EdgeType.PRIMARY,
                                confidence=1.0,
                                inference_rationale="Store GM reports to District Manager",
                            )
                        )

                        # Store Associates & Shift Leads (L6) reporting to Store GM
                        num_store_staff = max(2, (per_region_budget - 3) // num_districts)
                        store_roles = [
                            "Assistant Store Manager",
                            "Retail Department Supervisor",
                            "Store Shift Lead",
                            "Retail Sales Associate",
                        ]
                        for _ in range(num_store_staff):
                            ic_id = f"{company_id}_emp_{emp_counter:04d}"
                            emp_counter += 1
                            ic_emp = Employee(
                                id=ic_id,
                                name=fake.name(),
                                raw_title=random.choice(store_roles),
                                department_raw=dept.value,
                                location=reg_loc,
                                ground_truth_manager_id=store_gm_emp.id,
                                ground_truth_seniority=SeniorityLevel.L6_IC,
                                ground_truth_department=dept,
                            )
                            employees.append(ic_emp)
                            edges.append(
                                ReportingEdge(
                                    source_id=ic_emp.id,
                                    target_id=store_gm_emp.id,
                                    edge_type=EdgeType.PRIMARY,
                                    confidence=1.0,
                                    inference_rationale="Store associate reports to Store GM",
                                )
                            )
                continue

            # Standard Functional Departments (Merchandising, Supply Chain, Tech, etc.)
            num_tracks = len(tracks)
            budget_per_track = max(3, (d_size - 1) // num_tracks)

            for track in tracks:
                # VP (L2)
                vp_title = track.get("vp")
                vp_id = f"{company_id}_emp_{emp_counter:04d}"
                emp_counter += 1
                vp_emp = Employee(
                    id=vp_id,
                    name=fake.name(),
                    raw_title=vp_title,
                    department_raw=dept.value,
                    location=hq_location,
                    ground_truth_manager_id=l1_emp.id,
                    ground_truth_seniority=SeniorityLevel.L2_VP,
                    ground_truth_department=dept,
                )
                employees.append(vp_emp)
                edges.append(
                    ReportingEdge(
                        source_id=vp_emp.id,
                        target_id=l1_emp.id,
                        edge_type=EdgeType.PRIMARY,
                        confidence=1.0,
                        inference_rationale=f"VP reports to functional C-Suite ({l1_emp.raw_title})",
                    )
                )

                # Director (L3)
                dir_title = track.get("director")
                dir_id = f"{company_id}_emp_{emp_counter:04d}"
                emp_counter += 1
                dir_emp = Employee(
                    id=dir_id,
                    name=fake.name(),
                    raw_title=dir_title,
                    department_raw=dept.value,
                    location=hq_location,
                    ground_truth_manager_id=vp_emp.id,
                    ground_truth_seniority=SeniorityLevel.L3_DIRECTOR,
                    ground_truth_department=dept,
                )
                employees.append(dir_emp)
                edges.append(
                    ReportingEdge(
                        source_id=dir_emp.id,
                        target_id=vp_emp.id,
                        edge_type=EdgeType.PRIMARY,
                        confidence=1.0,
                        inference_rationale=f"Director reports to VP ({vp_emp.raw_title})",
                    )
                )

                # Manager (L4)
                mgr_title = track.get("manager")
                mgr_id = f"{company_id}_emp_{emp_counter:04d}"
                emp_counter += 1
                mgr_emp = Employee(
                    id=mgr_id,
                    name=fake.name(),
                    raw_title=mgr_title,
                    department_raw=dept.value,
                    location=hq_location,
                    ground_truth_manager_id=dir_emp.id,
                    ground_truth_seniority=SeniorityLevel.L4_MANAGER,
                    ground_truth_department=dept,
                )
                employees.append(mgr_emp)
                edges.append(
                    ReportingEdge(
                        source_id=mgr_emp.id,
                        target_id=dir_emp.id,
                        edge_type=EdgeType.PRIMARY,
                        confidence=1.0,
                        inference_rationale=f"Manager reports to Director ({dir_emp.raw_title})",
                    )
                )

                # Senior ICs (L5) & ICs (L6)
                senior_ics = track.get("senior_ic", [])
                regular_ics = track.get("ic", [])
                track_staff_budget = max(1, budget_per_track - 3)

                for staff_idx in range(track_staff_budget):
                    is_senior = staff_idx == 0 and senior_ics
                    level = SeniorityLevel.L5_SENIOR_IC if is_senior else SeniorityLevel.L6_IC
                    role_pool = senior_ics if is_senior else regular_ics
                    if not role_pool:
                        role_pool = ["Specialist, " + dept.value]

                    staff_id = f"{company_id}_emp_{emp_counter:04d}"
                    emp_counter += 1
                    staff_emp = Employee(
                        id=staff_id,
                        name=fake.name(),
                        raw_title=random.choice(role_pool),
                        department_raw=dept.value,
                        location=hq_location,
                        ground_truth_manager_id=mgr_emp.id,
                        ground_truth_seniority=level,
                        ground_truth_department=dept,
                    )
                    employees.append(staff_emp)
                    edges.append(
                        ReportingEdge(
                            source_id=staff_emp.id,
                            target_id=mgr_emp.id,
                            edge_type=EdgeType.PRIMARY,
                            confidence=1.0,
                            inference_rationale=f"Specialist reports to Track Manager ({mgr_emp.raw_title})",
                        )
                    )

        # 4. Inject 5% Matrix Dotted-Line Relationships
        total_emp = len(employees)
        target_matrix_count = max(2, int(total_emp * 0.05))

        matrix_candidates = [
            e for e in employees
            if e.ground_truth_seniority in (SeniorityLevel.L4_MANAGER, SeniorityLevel.L5_SENIOR_IC, SeniorityLevel.L6_IC)
        ]
        random.shuffle(matrix_candidates)

        matrix_added = 0
        for cand in matrix_candidates:
            if matrix_added >= target_matrix_count:
                break

            cand_dept = cand.ground_truth_department
            related_dept = None
            if cand_dept == RetailDepartment.LOSS_PREVENTION:
                related_dept = RetailDepartment.STORE_OPS
            elif cand_dept == RetailDepartment.DATA_ANALYTICS:
                related_dept = RetailDepartment.MERCHANDISING
            elif cand_dept == RetailDepartment.ECOMMERCE:
                related_dept = RetailDepartment.SUPPLY_CHAIN
            elif cand_dept == RetailDepartment.STORE_OPS:
                related_dept = RetailDepartment.PEOPLE
            elif cand_dept == RetailDepartment.MERCHANDISING:
                related_dept = RetailDepartment.FINANCE
            else:
                related_dept = RetailDepartment.STORE_OPS

            potential_mgrs = [
                e for e in employees
                if e.ground_truth_department == related_dept
                and e.ground_truth_seniority in (SeniorityLevel.L3_DIRECTOR, SeniorityLevel.L4_MANAGER)
            ]
            if potential_mgrs:
                matrix_mgr = random.choice(potential_mgrs)
                if matrix_mgr.id != cand.ground_truth_manager_id:
                    cand.ground_truth_matrix_manager_id = matrix_mgr.id
                    edges.append(
                        ReportingEdge(
                            source_id=cand.id,
                            target_id=matrix_mgr.id,
                            edge_type=EdgeType.MATRIX,
                            confidence=0.85,
                            inference_rationale=f"Matrix dotted-line: {cand_dept.value} embedded with {related_dept.value} ({matrix_mgr.raw_title})",
                        )
                    )
                    matrix_added += 1

        return employees, edges
