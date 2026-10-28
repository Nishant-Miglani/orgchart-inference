"""
Retail Taxonomy: Definitions of retail sub-sectors, departments, canonical roles,
seniority levels, functional sub-tracks, and realistic reporting relationships.
"""

from typing import Dict, List, Any
from backend.app.schemas import SeniorityLevel, RetailDepartment

RETAIL_SUB_SECTORS = [
    "Fashion & Apparel",
    "Luxury Goods & Cosmetics",
    "Big Box & General Merchandise",
    "Grocery & FMCG Supermarkets",
    "Consumer Electronics & Appliances",
    "Home Furnishings & Decor",
    "Omnichannel Direct-to-Consumer (D2C)",
    "Pharmacy & Health Retail",
]

# Common Retail HQ & Field Locations
RETAIL_LOCATIONS = [
    "New York, NY",
    "Chicago, IL",
    "Los Angeles, CA",
    "Seattle, WA",
    "Minneapolis, MN",
    "Dallas, TX",
    "Atlanta, GA",
    "Boston, MA",
    "San Francisco, CA",
    "Charlotte, NC",
    "Columbus, OH",
    "Nashville, TN",
]

# Canonical role definitions organized by Department, Sub-track, and Seniority Level
# Each sub-track forms a realistic, coherent operational division.
DEPARTMENT_TRACKS: Dict[RetailDepartment, List[Dict[str, Any]]] = {
    RetailDepartment.EXECUTIVE: [
        {
            "track_name": "executive",
            "roles": {
                SeniorityLevel.L0_EXEC: [
                    "Chief Executive Officer",
                    "CEO & President",
                    "President & Chief Executive Officer",
                    "Founder & Chief Executive Officer",
                ]
            },
        }
    ],
    RetailDepartment.MERCHANDISING: [
        {
            "track_name": "category_buying",
            "c_suite": "Chief Merchandising Officer",
            "vp": "VP Category Management & Merchandising",
            "director": "Director of Category Buying",
            "manager": "Category Buying Manager",
            "senior_ic": ["Senior Category Buyer", "Senior Merchant"],
            "ic": ["Associate Buyer", "Assistant Merchant", "Buying Coordinator"],
        },
        {
            "track_name": "inventory_planning",
            "c_suite": "Chief Merchandising Officer",
            "vp": "VP Merchandising Strategy & Inventory",
            "director": "Director of Inventory Allocation & Planning",
            "manager": "Merchandising Planning Manager",
            "senior_ic": ["Senior Inventory Planner"],
            "ic": ["Merchandise Allocation Specialist", "Inventory Planning Coordinator"],
        },
        {
            "track_name": "sourcing_product",
            "c_suite": "Chief Merchandising Officer",
            "vp": "VP Global Sourcing & Product Development",
            "director": "General Merchandise Manager (GMM)",
            "manager": "Divisional Merchandise Manager (DMM)",
            "senior_ic": ["Senior Sourcing Merchant"],
            "ic": ["Assistant Sourcing Specialist"],
        },
    ],
    RetailDepartment.SUPPLY_CHAIN: [
        {
            "track_name": "fulfillment_dc",
            "c_suite": "Chief Supply Chain Officer",
            "vp": "VP Distribution & Fulfillment",
            "director": "Director of Warehouse Operations",
            "manager": "Distribution Center General Manager",
            "senior_ic": ["Continuous Improvement Lead"],
            "ic": ["Warehouse Supervisor", "Inventory Control Coordinator"],
        },
        {
            "track_name": "logistics_freight",
            "c_suite": "Chief Supply Chain Officer",
            "vp": "VP Global Logistics",
            "director": "Director of Transportation & Fleet",
            "manager": "Inbound Logistics Manager",
            "senior_ic": ["Senior Customs & Freight Specialist"],
            "ic": ["Freight Operations Specialist", "Supply Chain Associate"],
        },
        {
            "track_name": "supply_planning",
            "c_suite": "Chief Supply Chain Officer",
            "vp": "VP Supply Chain Strategy",
            "director": "Director of Supply Chain Planning",
            "manager": "Fulfillment Operations Manager",
            "senior_ic": ["Senior Logistics Planner"],
            "ic": ["Logistics Dispatch Coordinator"],
        },
    ],
    RetailDepartment.STORE_OPS: [
        # Store operations is partitioned by Region / District
        {
            "track_name": "store_field_ops",
            "c_suite": "Chief Operating Officer",
            "vp": "VP Retail Store Operations",
            "director": "Regional Director of Stores",
            "manager": "District Store Manager",
            "senior_ic": ["Store General Manager", "Flagship Store General Manager"],
            "ic": [
                "Assistant Store Manager",
                "Retail Department Supervisor",
                "Store Shift Lead",
                "Retail Sales Associate",
            ],
        }
    ],
    RetailDepartment.ECOMMERCE: [
        {
            "track_name": "digital_merchandising",
            "c_suite": "Chief Digital Officer",
            "vp": "VP E-Commerce",
            "director": "Director of Digital Merchandising",
            "manager": "Digital Merchandising Manager",
            "senior_ic": ["Senior Digital Catalog Specialist"],
            "ic": ["Digital Merchandising Associate", "Digital Store Coordinator"],
        },
        {
            "track_name": "digital_product_ux",
            "c_suite": "Chief Digital Officer",
            "vp": "VP Digital Customer Experience",
            "director": "Director of E-Commerce Product",
            "manager": "E-Commerce Product Manager",
            "senior_ic": ["Senior UX/UI Designer"],
            "ic": ["E-Commerce Content Specialist", "Conversion Optimization Specialist"],
        },
    ],
    RetailDepartment.DATA_ANALYTICS: [
        {
            "track_name": "demand_forecasting",
            "c_suite": "Chief Data & Analytics Officer",
            "vp": "VP Data Science & Advanced Analytics",
            "director": "Director of Demand Forecasting & AI",
            "manager": "Lead Demand Forecasting Scientist",
            "senior_ic": ["Senior Retail Data Scientist", "Senior Pricing & Promotion Analyst"],
            "ic": ["Junior Data Scientist", "Pricing Analyst"],
        },
        {
            "track_name": "business_intelligence",
            "c_suite": "Chief Data & Analytics Officer",
            "vp": "VP Business Intelligence & Insights",
            "director": "Director of Enterprise Business Intelligence",
            "manager": "BI & Reporting Manager",
            "senior_ic": ["Senior Analytics Engineer"],
            "ic": ["Retail Data Analyst", "BI Dashboard Developer"],
        },
    ],
    RetailDepartment.TECHNOLOGY: [
        {
            "track_name": "store_pos_systems",
            "c_suite": "Chief Technology Officer",
            "vp": "VP Retail Systems & POS",
            "director": "Director of Store Systems & POS",
            "manager": "Store Systems Engineering Lead",
            "senior_ic": ["Senior POS Systems Engineer"],
            "ic": ["Retail Systems Technician", "Associate Systems Analyst"],
        },
        {
            "track_name": "cloud_core_eng",
            "c_suite": "Chief Technology Officer",
            "vp": "VP Software Engineering",
            "director": "Director of Core Engineering",
            "manager": "Platform Engineering Manager",
            "senior_ic": ["Senior Full Stack Software Engineer", "Senior Cloud Architect"],
            "ic": ["Software Engineer", "DevOps Engineer"],
        },
        {
            "track_name": "it_infrastructure",
            "c_suite": "Chief Information Officer",
            "vp": "VP Enterprise IT & Infrastructure",
            "director": "Director of IT Operations",
            "manager": "IT Operations Manager",
            "senior_ic": ["Senior Systems Administrator"],
            "ic": ["IT Helpdesk Support Lead", "IT Support Technician"],
        },
    ],
    RetailDepartment.MARKETING: [
        {
            "track_name": "brand_creative",
            "c_suite": "Chief Marketing Officer",
            "vp": "VP Brand Marketing",
            "director": "Creative Director",
            "manager": "Social Media & Influencer Manager",
            "senior_ic": ["Senior Copywriter"],
            "ic": ["Social Media Specialist", "Graphic Designer"],
        },
        {
            "track_name": "loyalty_performance",
            "c_suite": "Chief Marketing Officer",
            "vp": "VP CRM, Loyalty & Retention",
            "director": "Director of Customer Loyalty & Rewards",
            "manager": "CRM & Email Marketing Manager",
            "senior_ic": ["Senior Growth Marketing Specialist", "Senior Loyalty Program Analyst"],
            "ic": ["Marketing Campaign Coordinator", "Paid Search Specialist"],
        },
    ],
    RetailDepartment.LOSS_PREVENTION: [
        {
            "track_name": "asset_protection_field",
            "c_suite": "VP Global Asset Protection & Safety",
            "vp": "VP Loss Prevention & Asset Protection",
            "director": "Director of Loss Prevention & Audit",
            "manager": "Regional Loss Prevention Manager",
            "senior_ic": [
                "Senior Loss Prevention Investigator",
                "Organized Retail Crime (ORC) Investigator",
            ],
            "ic": ["Store Loss Prevention Specialist", "Asset Protection Officer"],
        },
        {
            "track_name": "cyber_infosec",
            "c_suite": "VP Global Asset Protection & Safety",
            "vp": "Chief Information Security Officer (CISO)",
            "director": "Director of Cyber Security & Threat Intelligence",
            "manager": "Information Security Operations Lead",
            "senior_ic": ["Senior SecOps Engineer"],
            "ic": ["Fraud & Risk Analyst", "Security Operations Analyst"],
        },
    ],
    RetailDepartment.FINANCE: [
        {
            "track_name": "fpa_commercial",
            "c_suite": "Chief Financial Officer",
            "vp": "VP Financial Planning & Analysis (FP&A)",
            "director": "Director of Commercial Finance",
            "manager": "FP&A Manager - Retail Operations",
            "senior_ic": ["Senior Financial Analyst"],
            "ic": ["Financial Analyst", "Junior Financial Analyst"],
        },
        {
            "track_name": "accounting_control",
            "c_suite": "Chief Financial Officer",
            "vp": "VP Corporate Controller",
            "director": "Director of Retail Accounting",
            "manager": "Accounting Operations Manager",
            "senior_ic": ["Senior Corporate Accountant"],
            "ic": ["Staff Accountant", "Accounts Payable Specialist"],
        },
        {
            "track_name": "procurement_sourcing",
            "c_suite": "Chief Financial Officer",
            "vp": "VP Strategic Sourcing & Procurement",
            "director": "Director of Strategic Procurement",
            "manager": "Strategic Procurement Manager",
            "senior_ic": ["Senior Sourcing Specialist"],
            "ic": ["Procurement Coordinator"],
        },
    ],
    RetailDepartment.PEOPLE: [
        {
            "track_name": "field_hrbp",
            "c_suite": "Chief People Officer",
            "vp": "VP Talent Acquisition & Field HR",
            "director": "Director of HR Business Partners",
            "manager": "Regional HRBP Manager",
            "senior_ic": ["Senior HR Business Partner"],
            "ic": ["HR Coordinator", "People Operations Specialist"],
        },
        {
            "track_name": "training_recruiting",
            "c_suite": "Chief People Officer",
            "vp": "VP Total Rewards & HR Operations",
            "director": "Director of Retail Training & Development",
            "manager": "Store Training & Onboarding Manager",
            "senior_ic": ["Senior Talent Recruiter"],
            "ic": ["Store Recruiter", "Training Assistant"],
        },
    ],
    RetailDepartment.LEGAL: [
        {
            "track_name": "legal_compliance",
            "c_suite": "General Counsel & EVP Legal Affairs",
            "vp": "VP Corporate Compliance & Privacy",
            "director": "Director of Regulatory Compliance",
            "manager": "Corporate Compliance Manager",
            "senior_ic": ["Senior Corporate Counsel", "Senior Privacy Analyst"],
            "ic": ["Legal Specialist", "Contracts Coordinator"],
        }
    ],
}
