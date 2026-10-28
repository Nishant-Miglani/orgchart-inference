"""
Data Store Service:
Provides high-performance in-memory indexing, caching, and retrieval
for all 500 companies and evaluation metrics.
"""

import json
from pathlib import Path
from typing import List, Dict, Optional, Any, Tuple
from backend.app.schemas import Company, CompanySummary


class CompanyDataStore:
    _instance = None

    def __init__(self, data_dir: str = "backend/data"):
        self.data_dir = Path(data_dir)
        self.companies_dir = self.data_dir / "companies"
        self.index_file = self.data_dir / "companies_index.json"
        self.benchmark_file = self.data_dir / "benchmark_report.json"
        self._summaries: List[CompanySummary] = []
        self._company_cache: Dict[str, Company] = {}
        self._load_index()

    def _load_index(self):
        if self.index_file.exists():
            with open(self.index_file, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
                self._summaries = [CompanySummary.model_validate(item) for item in raw_data]

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = CompanyDataStore()
        return cls._instance

    def list_companies(
        self,
        sub_sector: Optional[str] = None,
        domain_type: Optional[str] = None,
        search_query: Optional[str] = None,
        size_category: Optional[str] = None,
        min_precision: Optional[float] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[CompanySummary], int]:
        """Filters and paginates companies."""
        filtered = self._summaries

        if sub_sector and sub_sector.lower() != "all":
            filtered = [c for c in filtered if c.sub_sector.lower() == sub_sector.lower()]

        if domain_type and domain_type.lower() != "all":
            filtered = [
                c for c in filtered
                if c.domain_type and (domain_type.lower() in c.domain_type.lower())
            ]

        if size_category and size_category.lower() != "all":
            filtered = [c for c in filtered if c.size_category.lower() == size_category.lower()]

        if min_precision is not None:
            filtered = [c for c in filtered if c.precision >= min_precision]

        if search_query:
            q = search_query.lower()
            filtered = [
                c for c in filtered
                if q in c.name.lower()
                or (c.domain and q in c.domain.lower())
                or q in c.headquarters.lower()
                or q in c.sub_sector.lower()
            ]

        total_count = len(filtered)
        paginated = filtered[offset : offset + limit]
        return paginated, total_count

    def get_company(self, company_id: str) -> Optional[Company]:
        """Loads and caches full company record with employees and inferred edges."""
        if company_id in self._company_cache:
            return self._company_cache[company_id]

        file_path = self.companies_dir / f"{company_id}.json"
        if not file_path.exists():
            return None

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        company = Company.model_validate(data)
        self._company_cache[company_id] = company
        return company

    def get_benchmark_report(self) -> Dict[str, Any]:
        """Returns the global evaluation report across all 500 companies."""
        if self.benchmark_file.exists():
            with open(self.benchmark_file, "r", encoding="utf-8") as f:
                return json.load(f)
        return {"error": "Benchmark report not generated yet."}
