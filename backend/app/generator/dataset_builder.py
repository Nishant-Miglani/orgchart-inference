"""
Dataset Builder: Generates the full synthetic dataset of >= 500 retail companies,
each with >= 100 employees, realistic ground truth trees, 5% matrix reporting,
and injected noise.
"""

import os
import json
import random
import argparse
from typing import List, Dict, Any
from pathlib import Path
from faker import Faker

from backend.app.schemas import Company, CompanySummary
from backend.app.generator.retail_taxonomy import RETAIL_SUB_SECTORS, RETAIL_LOCATIONS
from backend.app.generator.org_synthesizer import OrgSynthesizer
from backend.app.generator.noise_injector import NoiseInjector

fake = Faker()

RETAIL_NAME_PREFIXES = [
    "Apex", "Summit", "Vanguard", "Nordic", "Heritage", "Avenue", "Lumina", "Beacon",
    "Crown", "Evergreen", "Pacific", "Urban", "Metro", "Prime", "Sterling", "Kestrel",
    "Redwood", "Catalyst", "Nova", "Oasis", "Horizon", "BlueSky", "Atlas", "Velocity",
    "Solstice", "Pinnacle", "Meridian", "Cascade", "Crestview", "Frontier", "Zenith",
    "Equinox", "Radiant", "Venture", "Element", "Halcyon", "Ironwood", "Starlight",
    "Amber", "Cobalt", "Harbor", "Timberline", "Sierra", "Goldenrod", "Silvergate"
]

RETAIL_NAME_SUFFIXES = [
    "Retail Group", "Outfitters", "Department Stores", "Supermarkets", "Brands",
    "General Merchandise", "Supply Co.", "Apparel & Co.", "Home Goods", "Provisions",
    "Digital Goods", "Trading Co.", "Luxury Emporium", "Direct Stores", "Holdings",
    "Markets", "Boutique Group", "Omnichannel Stores", "Consumer Brands", "Logistics & Retail"
]


def generate_company_name(existing_names: set) -> str:
    for _ in range(100):
        name = f"{random.choice(RETAIL_NAME_PREFIXES)} {random.choice(RETAIL_NAME_SUFFIXES)}"
        if name not in existing_names:
            existing_names.add(name)
            return name
    # Fallback with city name
    name = f"{fake.city()} {random.choice(RETAIL_NAME_SUFFIXES)}"
    existing_names.add(name)
    return name


def build_synthetic_dataset(
    count: int = 500,
    min_size: int = 100,
    output_dir: str = "backend/data",
    seed: int = 42,
) -> List[CompanySummary]:
    """
    Builds synthetic dataset of `count` companies with at least `min_size` employees.
    Writes:
      - output_dir/companies/{company_id}.json
      - output_dir/companies_index.json
    """
    random.seed(seed)
    Faker.seed(seed)
    synthesizer = OrgSynthesizer(seed=seed)
    noise_injector = NoiseInjector(noise_level=0.65)

    out_path = Path(output_dir)
    companies_dir = out_path / "companies"
    companies_dir.mkdir(parents=True, exist_ok=True)

    existing_names = set()
    summaries: List[CompanySummary] = []

    print(f"Generating {count} retail companies (min {min_size} employees each)...")

    for i in range(1, count + 1):
        company_id = f"comp_{i:04d}"
        company_name = generate_company_name(existing_names)
        sub_sector = random.choice(RETAIL_SUB_SECTORS)
        headquarters = random.choice(RETAIL_LOCATIONS)
        founded_year = random.randint(1975, 2022)

        # Size distribution:
        # ~70% Mid-Market (100 - 135)
        # ~20% Large (136 - 220)
        # ~10% Enterprise (221 - 380)
        rand_val = random.random()
        if rand_val < 0.70:
            target_size = random.randint(min_size, 135)
            size_category = "Mid-Market (100-135)"
        elif rand_val < 0.90:
            target_size = random.randint(136, 220)
            size_category = "Large (136-220)"
        else:
            target_size = random.randint(221, 360)
            size_category = "Enterprise (221-360)"

        # 1. Synthesize ground truth tree + 5% matrix edges
        employees, ground_truth_edges = synthesizer.generate_company_org(
            company_id=company_id,
            company_name=company_name,
            sub_sector=sub_sector,
            target_size=target_size,
        )

        # 2. Inject real-world noise into employee titles and metadata
        employees = noise_injector.apply_noise(employees)

        # Generate realistic domain & domain type
        clean_name = "".join(c for c in company_name.lower() if c.isalnum())
        domain_opts = [
            (".com", "Commercial (.com)"),
            (".com", "Commercial (.com)"),
            (".com", "Commercial (.com)"),
            (".com.au", "Regional AU (.com.au)"),
            (".store", "E-Commerce (.store)"),
            (".io", "Tech & Digital (.io)"),
            (".co", "Corporate (.co)"),
        ]
        tld, dtype = domain_opts[i % len(domain_opts)]
        domain = f"{clean_name}{tld}"
        domain_type = dtype

        company = Company(
            id=company_id,
            name=company_name,
            domain=domain,
            domain_type=domain_type,
            sub_sector=sub_sector,
            size_category=size_category,
            employee_count=len(employees),
            headquarters=headquarters,
            founded_year=founded_year,
            employees=employees,
            inferred_edges=[],
            ground_truth_edges=ground_truth_edges,
        )

        # Save individual company JSON
        comp_file = companies_dir / f"{company_id}.json"
        with open(comp_file, "w", encoding="utf-8") as f:
            f.write(company.model_dump_json(indent=2))

        # Add to index summary
        summary = CompanySummary(
            id=company.id,
            name=company.name,
            domain=company.domain,
            domain_type=company.domain_type,
            sub_sector=company.sub_sector,
            size_category=company.size_category,
            employee_count=company.employee_count,
            headquarters=company.headquarters,
        )
        summaries.append(summary)

        if i % 100 == 0 or i == count:
            print(f"  Generated {i}/{count} companies...")

    # Write master index file
    index_file = out_path / "companies_index.json"
    with open(index_file, "w", encoding="utf-8") as f:
        json.dump([s.model_dump() for s in summaries], f, indent=2)

    total_emps = sum(s.employee_count for s in summaries)
    print(f"Dataset generation complete!")
    print(f"  Total companies: {len(summaries)}")
    print(f"  Total employees: {total_emps:,}")
    print(f"  Average employees/company: {total_emps / len(summaries):.1f}")
    print(f"  Master index saved to: {index_file}")

    return summaries


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate synthetic retail org chart dataset.")
    parser.add_argument("--count", type=int, default=500, help="Number of companies (min 500)")
    parser.add_argument("--min-size", type=int, default=100, help="Minimum employees per company (min 100)")
    parser.add_argument("--out-dir", type=str, default="backend/data", help="Output directory")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    args = parser.parse_args()

    build_synthetic_dataset(
        count=args.count,
        min_size=args.min_size,
        output_dir=args.out_dir,
        seed=args.seed,
    )
