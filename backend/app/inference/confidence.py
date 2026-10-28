"""
Confidence Scoring & Rejection Engine:
Calculates calibrated confidence scores for candidate reporting edges based on
seniority gradient, department coherence, track domain affinity, location, and span of control.
Implements the strict rejection threshold: 'A wrong edge is worse than no edge'.
"""

from typing import Optional, Tuple
from backend.app.schemas import SeniorityLevel, RetailDepartment, Employee

# Numeric ranks for SeniorityLevels (lower number = higher rank)
SENIORITY_RANK = {
    SeniorityLevel.L0_EXEC: 0,
    SeniorityLevel.L1_C_SUITE: 1,
    SeniorityLevel.L2_VP: 2,
    SeniorityLevel.L3_DIRECTOR: 3,
    SeniorityLevel.L4_MANAGER: 4,
    SeniorityLevel.L5_SENIOR_IC: 5,
    SeniorityLevel.L6_IC: 6,
}

REJECTION_THRESHOLD = 0.68  # Edges below 0.68 are strictly suppressed to prevent wrong edges


class ConfidenceEngine:
    @staticmethod
    def calculate_edge_confidence(
        subordinate: Employee,
        manager: Employee,
        current_manager_load: int = 0,
    ) -> Tuple[float, str]:
        """
        Calculates confidence score (0.0 to 1.0) and explanatory rationale.
        Returns: (confidence, rationale)
        """
        sub_rank = SENIORITY_RANK.get(subordinate.inferred_seniority, 6)
        mgr_rank = SENIORITY_RANK.get(manager.inferred_seniority, 6)

        # 1. Structural Sanity Check: Manager must strictly outrank subordinate
        if mgr_rank >= sub_rank:
            return 0.10, "Inverted or equal seniority rank; rejected."

        rank_diff = sub_rank - mgr_rank

        # Executive direct reporting
        if sub_rank == 1 and mgr_rank == 0:
            return 0.98, "Department Executive reports directly to Chief Executive"

        # Base score by level jump
        if rank_diff == 1:
            base = 0.65
            rationale = "Direct adjacent hierarchical tier"
        elif rank_diff == 2:
            base = 0.45
            rationale = "Tier skip (intermediate level absent)"
        else:
            base = 0.30
            rationale = "Multi-tier leap"

        # 2. Department Alignment
        sub_dept = subordinate.inferred_department
        mgr_dept = manager.inferred_department

        if mgr_rank == 0:
            dept_bonus = 0.30
        elif sub_dept == mgr_dept:
            dept_bonus = 0.15
            rationale += f" within {sub_dept.value if sub_dept else 'department'}"
        else:
            dept_bonus = -0.40
            rationale += f" [Mismatched depts: {sub_dept} vs {mgr_dept}]"

        # 3. Sub-functional Domain / Track Match (CRITICAL for precision)
        track_bonus = 0.0
        if subordinate.inferred_track and manager.inferred_track:
            if subordinate.inferred_track == manager.inferred_track:
                track_bonus = 0.20
                rationale += f" (aligned track: {subordinate.inferred_track})"
            else:
                track_bonus = -0.25
                rationale += f" (cross-track mismatch)"
        elif subordinate.inferred_track or manager.inferred_track:
            # One has a specific track, the other is generic
            track_bonus = -0.05

        # 4. Location Affinity (Crucial for Store Field Ops)
        loc_bonus = 0.0
        if subordinate.location and manager.location:
            if subordinate.location == manager.location:
                loc_bonus = 0.10
                rationale += f" (same location: {subordinate.location})"
            else:
                if sub_dept == RetailDepartment.STORE_OPS:
                    # In store ops, reporting across distant locations is almost always wrong
                    loc_bonus = -0.35
                    rationale += f" (location conflict in field ops)"

        # 5. Domain Token Overlap
        sub_tokens = set(subordinate.raw_title.lower().split())
        mgr_tokens = set(manager.raw_title.lower().split())
        common_tokens = (sub_tokens.intersection(mgr_tokens) - {
            "and", "&", "of", "the", "in", "to", "senior", "sr", "director", "manager", "lead", "associate", "specialist"
        })
        token_bonus = 0.05 if common_tokens else 0.0

        # 6. Span of Control Penalty
        span_penalty = 0.0
        if current_manager_load > 10:
            span_penalty = min(0.18, (current_manager_load - 10) * 0.02)
            rationale += f" (manager span penalty: {current_manager_load} reports)"

        score = base + dept_bonus + track_bonus + loc_bonus + token_bonus - span_penalty
        score = max(0.05, min(0.99, round(score, 3)))

        return score, rationale

    @staticmethod
    def should_reject_edge(confidence: float) -> bool:
        """Enforces 'wrong edge is worse than no edge' principle."""
        return confidence < REJECTION_THRESHOLD
