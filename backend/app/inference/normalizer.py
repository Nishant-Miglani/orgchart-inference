"""
Title & Metadata Normalizer:
Extracts standardized Seniority (L0-L6), Department, and Sub-functional scope
from messy real-world job titles and noisy directory metadata using canonical retail taxonomy
and Jaccard token overlap matching.
"""

import re
from typing import Tuple, Optional, Dict, List, Any
from backend.app.schemas import SeniorityLevel, RetailDepartment
from backend.app.generator.retail_taxonomy import DEPARTMENT_TRACKS

# Common real-world abbreviations expanded to canonical words
ABBR_EXPANSIONS = [
    (r"\b(sr\.?|snr)\b", "senior"),
    (r"\b(dir\.?)\b", "director"),
    (r"\b(mgr\.?|mngr)\b", "manager"),
    (r"\b(vp|v\.p\.?)\b", "vice president"),
    (r"\b(gmm|g\.m\.m\.?)\b", "general merchandise manager"),
    (r"\b(dmm|d\.m\.m\.?)\b", "divisional merchandise manager"),
    (r"\b(dc)\b", "distribution center"),
    (r"\b(fp&a|fpa)\b", "financial planning and analysis"),
    (r"\b(lp)\b", "loss prevention"),
    (r"\b(pos)\b", "point of sale"),
    (r"\b(swe)\b", "software engineer"),
    (r"\b(bi)\b", "business intelligence"),
    (r"\b(scm)\b", "supply chain"),
]


def clean_title_tokens(title: str) -> Tuple[str, set]:
    """Cleans title string, expands abbreviations, and returns set of meaningful tokens."""
    t = re.sub(r"[\(\[\{].*?[\)\]\}]", "", title)
    t = re.sub(r"[-–—|/,]", " ", t)
    t = t.lower()
    for pat, repl in ABBR_EXPANSIONS:
        t = re.sub(pat, repl, t)
    t = re.sub(r"[^a-z0-9\s]", "", t)
    tokens = set(t.split()) - {"and", "&", "of", "the", "in", "to", "for", "a", "an"}
    return " ".join(t.split()), tokens


class CanonicalTaxonomyIndex:
    _instance = None

    def __init__(self):
        self.canonical_roles: List[Dict[str, Any]] = []
        self._build_index()

    def _build_index(self):
        for dept, tracks in DEPARTMENT_TRACKS.items():
            for tr in tracks:
                track_name = tr.get("track_name")
                if "roles" in tr:
                    for lvl, roles in tr["roles"].items():
                        for r in roles:
                            cleaned, tokens = clean_title_tokens(r)
                            self.canonical_roles.append({
                                "dept": dept,
                                "track": track_name,
                                "level": lvl,
                                "role": r,
                                "cleaned": cleaned,
                                "tokens": tokens,
                            })
                    continue
                if "c_suite" in tr:
                    cleaned, tokens = clean_title_tokens(tr["c_suite"])
                    self.canonical_roles.append({
                        "dept": dept,
                        "track": track_name,
                        "level": SeniorityLevel.L1_C_SUITE,
                        "role": tr["c_suite"],
                        "cleaned": cleaned,
                        "tokens": tokens,
                    })
                if "vp" in tr:
                    cleaned, tokens = clean_title_tokens(tr["vp"])
                    self.canonical_roles.append({
                        "dept": dept,
                        "track": track_name,
                        "level": SeniorityLevel.L2_VP,
                        "role": tr["vp"],
                        "cleaned": cleaned,
                        "tokens": tokens,
                    })
                if "director" in tr:
                    cleaned, tokens = clean_title_tokens(tr["director"])
                    self.canonical_roles.append({
                        "dept": dept,
                        "track": track_name,
                        "level": SeniorityLevel.L3_DIRECTOR,
                        "role": tr["director"],
                        "cleaned": cleaned,
                        "tokens": tokens,
                    })
                if "manager" in tr:
                    cleaned, tokens = clean_title_tokens(tr["manager"])
                    self.canonical_roles.append({
                        "dept": dept,
                        "track": track_name,
                        "level": SeniorityLevel.L4_MANAGER,
                        "role": tr["manager"],
                        "cleaned": cleaned,
                        "tokens": tokens,
                    })
                for r in tr.get("senior_ic", []):
                    cleaned, tokens = clean_title_tokens(r)
                    self.canonical_roles.append({
                        "dept": dept,
                        "track": track_name,
                        "level": SeniorityLevel.L5_SENIOR_IC,
                        "role": r,
                        "cleaned": cleaned,
                        "tokens": tokens,
                    })
                for r in tr.get("ic", []):
                    cleaned, tokens = clean_title_tokens(r)
                    self.canonical_roles.append({
                        "dept": dept,
                        "track": track_name,
                        "level": SeniorityLevel.L6_IC,
                        "role": r,
                        "cleaned": cleaned,
                        "tokens": tokens,
                    })

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = CanonicalTaxonomyIndex()
        return cls._instance


class TitleNormalizer:
    @staticmethod
    def parse_employee_title(
        raw_title: str,
        department_raw: Optional[str] = None,
    ) -> Tuple[SeniorityLevel, RetailDepartment, Optional[str], float]:
        """
        Parses raw job title and optional department hint.
        Returns: (SeniorityLevel, RetailDepartment, track_name, match_confidence)
        """
        # CEO / Executive direct override
        if re.search(r"\b(ceo|chief\s+executive|founder|president\s*(?:&|and)?\s*ceo)\b", raw_title, re.IGNORECASE):
            return SeniorityLevel.L0_EXEC, RetailDepartment.EXECUTIVE, "executive", 0.99

        index = CanonicalTaxonomyIndex.get_instance()
        _, input_tokens = clean_title_tokens(raw_title)

        best_item = None
        best_jaccard = -1.0

        for item in index.canonical_roles:
            intersection = len(input_tokens.intersection(item["tokens"]))
            union = len(input_tokens.union(item["tokens"]))
            jaccard = intersection / union if union > 0 else 0.0

            # Bonus if raw_department matches canonical department
            if department_raw and department_raw.lower() in item["dept"].value.lower():
                jaccard += 0.05

            if jaccard > best_jaccard:
                best_jaccard = jaccard
                best_item = item

        if best_item and best_jaccard >= 0.20:
            return best_item["level"], best_item["dept"], best_item["track"], round(best_jaccard, 3)

        # Fallback heuristic
        seniority = SeniorityLevel.L6_IC
        if "lead" in raw_title.lower() or "senior" in raw_title.lower():
            seniority = SeniorityLevel.L5_SENIOR_IC
        elif "manager" in raw_title.lower():
            seniority = SeniorityLevel.L4_MANAGER
        elif "director" in raw_title.lower():
            seniority = SeniorityLevel.L3_DIRECTOR
        elif "vp" in raw_title.lower():
            seniority = SeniorityLevel.L2_VP

        return seniority, RetailDepartment.STORE_OPS, "store_field_ops", 0.35

    @staticmethod
    def infer_seniority(raw_title: str) -> SeniorityLevel:
        lvl, _, _, _ = TitleNormalizer.parse_employee_title(raw_title)
        return lvl

    @staticmethod
    def infer_department(raw_title: str, department_raw: Optional[str] = None) -> RetailDepartment:
        _, dept, _, _ = TitleNormalizer.parse_employee_title(raw_title, department_raw)
        return dept

    @staticmethod
    def infer_track(raw_title: str) -> Optional[str]:
        _, _, track, _ = TitleNormalizer.parse_employee_title(raw_title)
        return track
