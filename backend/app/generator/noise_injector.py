"""
Noise Injector: Simulates real-world messy B2B scraped directory data.
Applies title abbreviations, acronyms, informal variants, missing fields,
and realistic syntax noise to challenge the inference engine.
"""

import random
from typing import List
from backend.app.schemas import Employee

# Common real-world abbreviation and contraction mappings
TITLE_REPLACEMENTS = [
    ("Vice President", "VP"),
    ("Vice President", "V.P."),
    ("Senior Vice President", "SVP"),
    ("Executive Vice President", "EVP"),
    ("Senior", "Sr."),
    ("Senior", "Sr"),
    ("Senior", "Snr"),
    ("Director", "Dir."),
    ("Director", "Dir"),
    ("Manager", "Mgr."),
    ("Manager", "Mgr"),
    ("Chief Executive Officer", "CEO"),
    ("Chief Technology Officer", "CTO"),
    ("Chief Financial Officer", "CFO"),
    ("Chief Operating Officer", "COO"),
    ("Chief Information Officer", "CIO"),
    ("Chief Marketing Officer", "CMO"),
    ("Chief Data & Analytics Officer", "CDAO"),
    ("Chief Digital Officer", "CDO"),
    ("General Merchandise Manager", "GMM"),
    ("Divisional Merchandise Manager", "DMM"),
    ("Human Resources", "HR"),
    ("Loss Prevention", "LP"),
    ("Business Intelligence", "BI"),
    ("Point of Sale", "POS"),
    ("Distribution Center", "DC"),
    ("Supply Chain", "SCM"),
    ("Financial Planning & Analysis", "FP&A"),
    ("Information Security", "InfoSec"),
    ("Customer Experience", "CX"),
    ("Software Engineer", "SWE"),
    ("Site Reliability Engineer", "SRE"),
    ("User Experience", "UX"),
]

# Informal or non-standard buzzword suffixes/prefixes sometimes seen in scraped titles
INFORMAL_VARIANTS = [
    ("Retail Data Scientist", "Data Wrangler & Forecaster"),
    ("Social Media Specialist", "Growth Hacker & Social"),
    ("Senior POS Systems Engineer", "Lead POS Ninja"),
    ("Continuous Improvement Lead", "Operations Guru"),
    ("Customer Experience Associate", "Client Happiness Associate"),
    ("Assistant Store Manager", "Assistant Store Lead (Operations & Flow)"),
    ("Store General Manager", "GM - Store Leader"),
]

DELIMITERS = [" - ", " | ", ", ", " / "]


class NoiseInjector:
    def __init__(self, noise_level: float = 0.65):
        """
        noise_level: Probability of perturbing an employee's raw title/metadata.
        """
        self.noise_level = noise_level

    def perturb_title(self, canonical_title: str) -> str:
        """Applies realistic noise, abbreviations, and formatting inconsistencies."""
        title = canonical_title

        # Check for informal variants
        for original, informal in INFORMAL_VARIANTS:
            if original.lower() in title.lower() and random.random() < 0.25:
                title = title.replace(original, informal)

        # Apply common abbreviations
        if random.random() < self.noise_level:
            for pattern, repl in TITLE_REPLACEMENTS:
                if pattern in title and random.random() < 0.70:
                    title = title.replace(pattern, repl)

        # Add delimiter formatting noise (e.g. "VP, Merchandising" vs "VP - Merchandising")
        if " of " in title and random.random() < 0.40:
            delimiter = random.choice(DELIMITERS)
            title = title.replace(" of ", delimiter, 1)

        # Add region or category tag in parentheses (e.g. "Sr Buyer (Womenswear)")
        if random.random() < 0.15:
            tags = [
                "(East Coast)",
                "(Midwest)",
                "(Apparel)",
                "(Footwear)",
                "(Omnichannel)",
                "(HQ)",
                "[Remote]",
                "(Enterprise)",
            ]
            title = f"{title} {random.choice(tags)}"

        # Occasional minor realistic typo (3% chance)
        if random.random() < 0.03:
            typos = [
                ("Analyst", "Analyt"),
                ("Manager", "Manger"),
                ("Coordinator", "Coordinater"),
                ("Associate", "Associte"),
            ]
            for clean, typo in typos:
                if clean in title:
                    title = title.replace(clean, typo)
                    break

        return title

    def apply_noise(self, employees: List[Employee]) -> List[Employee]:
        """
        Modifies a list of employees in-place to introduce real-world data noise:
        - Messy raw titles
        - Missing department_raw (~30% missing or degraded)
        - Inconsistent location metadata (~15% missing)
        """
        for emp in employees:
            # 1. Messy raw title
            emp.raw_title = self.perturb_title(emp.raw_title)

            # 2. Inconsistent or missing raw department (simulate bad scraping)
            r = random.random()
            if r < 0.25:
                # Missing completely
                emp.department_raw = None
            elif r < 0.40:
                # Generic or truncated department
                generic_map = {
                    "Store Operations & Field": "Operations",
                    "Merchandising & Buying": "Merchandising",
                    "Supply Chain & Logistics": "Operations / Logistics",
                    "Technology & IT": "Engineering",
                    "E-Commerce & Digital": "Digital",
                    "Data & Analytics": "Tech",
                    "Marketing & Brand": "Growth",
                    "Loss Prevention & Security": "Security",
                    "Finance & Accounting": "Finance",
                    "People & HR": "HR",
                    "Legal & Compliance": "Legal",
                }
                if emp.ground_truth_department and emp.ground_truth_department.value in generic_map:
                    emp.department_raw = generic_map[emp.ground_truth_department.value]

            # 3. Missing location (~15%)
            if random.random() < 0.15:
                emp.location = None

        return employees
