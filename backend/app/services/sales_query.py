"""
Sales Intelligence Query Service:
Answers the three core GTM questions:
1. 'Who runs the data team at this company?' (Department Functional Leader)
2. 'Who does the Head of Security report to?' (Upward Reporting Path Traversal)
3. 'Who is the economic buyer above this champion?' (Budget Holder Identification)
"""

from typing import List, Dict, Optional, Any
from backend.app.schemas import (
    Company,
    Employee,
    SeniorityLevel,
    RetailDepartment,
    SalesQueryLeaderResponse,
    ReportingChainResponse,
)
from backend.app.services.data_store import CompanyDataStore


class SalesQueryService:
    def __init__(self, data_store: Optional[CompanyDataStore] = None):
        self.data_store = data_store or CompanyDataStore.get_instance()

    def find_department_leader(
        self,
        company_id: str,
        department_query: str = "Data & Analytics",
    ) -> Optional[SalesQueryLeaderResponse]:
        """
        Answers: 'Who runs the [data/security/tech/etc.] team at this company?'
        Identifies the highest-ranking executive in that functional domain.
        """
        company = self.data_store.get_company(company_id)
        if not company:
            return None

        # Resolve department enum or keyword
        target_dept = None
        q = department_query.lower()
        for dept in RetailDepartment:
            if q in dept.value.lower() or any(w in dept.value.lower() for w in q.split()):
                target_dept = dept
                break

        if not target_dept:
            target_dept = RetailDepartment.DATA_ANALYTICS

        # Collect employees in this department
        dept_emps = [
            e for e in company.employees
            if e.inferred_department == target_dept
        ]
        if not dept_emps:
            # Fallback by title keyword
            dept_emps = [
                e for e in company.employees
                if any(w in e.raw_title.lower() for w in q.split())
            ]

        if not dept_emps:
            return None

        # Sort by seniority level (L1 C-Suite, L2 VP, L3 Director, L4 Manager)
        seniority_order = [
            SeniorityLevel.L1_C_SUITE,
            SeniorityLevel.L2_VP,
            SeniorityLevel.L3_DIRECTOR,
            SeniorityLevel.L4_MANAGER,
            SeniorityLevel.L5_SENIOR_IC,
            SeniorityLevel.L6_IC,
        ]

        leader = None
        for lvl in seniority_order:
            matches = [e for e in dept_emps if e.inferred_seniority == lvl]
            if matches:
                leader = matches[0]
                break

        if not leader:
            leader = dept_emps[0]

        emp_by_id = {e.id: e for e in company.employees}

        # Build path to CEO
        chain: List[Employee] = []
        curr = leader
        visited = set()
        while curr and curr.inferred_manager_id and curr.id not in visited:
            visited.add(curr.id)
            mgr = emp_by_id.get(curr.inferred_manager_id)
            if mgr:
                chain.append(mgr)
                curr = mgr
            else:
                break

        # Count direct reports
        direct_reports = sum(1 for e in company.employees if e.inferred_manager_id == leader.id)

        conf = leader.manager_confidence or 0.88
        explanation = (
            f"{leader.name} ({leader.raw_title}) leads {target_dept.value} "
            f"with {direct_reports} direct reports and {len(dept_emps)} total departmental staff. "
            f"Reports to {chain[0].raw_title if chain else 'the Board'}."
        )

        return SalesQueryLeaderResponse(
            department=target_dept.value,
            leader=leader,
            chain_to_ceo=chain,
            direct_reports_count=direct_reports,
            total_department_size=len(dept_emps),
            confidence=conf,
            explanation=explanation,
        )

    def get_reporting_chain_and_economic_buyer(
        self,
        company_id: str,
        employee_id: Optional[str] = None,
        title_keyword: Optional[str] = None,
    ) -> Optional[ReportingChainResponse]:
        """
        Answers:
        1. 'Who does the Head of Security report to?' (Path traversal)
        2. 'Who is the economic buyer above this champion?' (Budget Authority)
        """
        company = self.data_store.get_company(company_id)
        if not company:
            return None

        emp_by_id = {e.id: e for e in company.employees}
        target_emp: Optional[Employee] = None

        if employee_id and employee_id in emp_by_id:
            target_emp = emp_by_id[employee_id]
        elif title_keyword:
            kw = title_keyword.lower()
            # Try to match title
            matches = [e for e in company.employees if kw in e.raw_title.lower()]
            if matches:
                # Prefer leader rank if multiple matches
                matches.sort(
                    key=lambda x: [
                        SeniorityLevel.L3_DIRECTOR,
                        SeniorityLevel.L2_VP,
                        SeniorityLevel.L4_MANAGER,
                        SeniorityLevel.L1_C_SUITE,
                    ].index(x.inferred_seniority)
                    if x.inferred_seniority in [
                        SeniorityLevel.L3_DIRECTOR,
                        SeniorityLevel.L2_VP,
                        SeniorityLevel.L4_MANAGER,
                        SeniorityLevel.L1_C_SUITE,
                    ]
                    else 99
                )
                target_emp = matches[0]

        if not target_emp:
            return None

        # Build chain upward to root
        chain: List[Dict[str, Any]] = []
        curr = target_emp
        visited = set()
        economic_buyer: Optional[Employee] = None

        while curr and curr.inferred_manager_id and curr.id not in visited:
            visited.add(curr.id)
            mgr = emp_by_id.get(curr.inferred_manager_id)
            if not mgr:
                break

            # Find matching edge for confidence and edge_type
            edge = next(
                (ed for ed in company.inferred_edges if ed.source_id == curr.id and ed.target_id == mgr.id),
                None
            )
            conf = edge.confidence if edge else (curr.manager_confidence or 0.85)
            edge_type = edge.edge_type.value if edge else "primary"

            chain.append({
                "employee": mgr,
                "confidence": conf,
                "edge_type": edge_type,
                "rationale": edge.inference_rationale if edge else "",
            })

            # Check if this manager is an Economic Buyer (VP or C-Suite budget authority)
            if not economic_buyer and mgr.inferred_seniority in (
                SeniorityLevel.L2_VP,
                SeniorityLevel.L1_C_SUITE,
                SeniorityLevel.L0_EXEC,
            ):
                economic_buyer = mgr

            curr = mgr

        # If no VP found in direct line, pick CEO
        if not economic_buyer and chain:
            economic_buyer = chain[-1]["employee"]

        # Budget authority explanation
        if economic_buyer:
            budget_authority = f"Enterprise Budget Authority: {economic_buyer.raw_title}"
            explanation = (
                f"{target_emp.name} ({target_emp.raw_title}) reports through {len(chain)} hierarchical tier(s). "
                f"The Economic Buyer with contract signing authority is {economic_buyer.name} ({economic_buyer.raw_title})."
            )
        else:
            budget_authority = "Unresolved"
            explanation = f"Reporting path for {target_emp.name} terminates without reaching executive tier."

        return ReportingChainResponse(
            target_employee=target_emp,
            chain=chain,
            economic_buyer=economic_buyer,
            economic_buyer_budget_authority=budget_authority,
            explanation=explanation,
        )
