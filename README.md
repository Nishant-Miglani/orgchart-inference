# OrgChart Inference — AI-Native B2B Hierarchy & Deal Intelligence Platform

> **AI-native reporting line inference from unstructured, noisy employee directories in Retail.**

Built for enterprise B2B sales teams to answer high-stakes account mapping questions:
* *"Who runs the Data & Analytics team at this company?"*
* *"Who does the Head of Security report to?"*
* *"Who is the economic buyer above this champion with budget authority?"*

---

## Key Highlights

- **Scale**: Evaluated on **500 retail companies** with **86,914 employees** (all $\ge$ 100 employees).
- **Core Principle**: *"Where you can't resolve a manager, don't guess. A wrong edge is worse than no edge."*
- **Benchmark Performance**: **81.45% Global Precision**, **79.92% Recall**, and **80.68% F1 Score** across the entire 500-company benchmark.
- **Matrix Reporting**: Supports 95% single-manager primary reporting trees + 5% cross-functional dotted-line secondary matrix links.
- **Modern Full-Stack Application**: Fast, responsive React + FastAPI platform with 4 specialized viewing modes, interactive 2D graph canvas, deal intelligence tools, and real-time confidence re-inference.
- **Enterprise Design System**: High-contrast, clean SaaS UI inspired by `firmable.ai/au`, featuring a warm light canvas (`#f8fafc`), crisp white cards (`#ffffff`), Firmable Electric Orange (`#ff5a1f`) primary action CTAs, and Tech Violet (`#6938ef`) intelligence badges.

---

## Application Features & Views

### 1. Typeahead Company Search & Filtering
- **Searchable Index**: Search across all 500 companies by company name, retail category, or headquarters.
- **Category Filter**: Filter companies across 12 retail verticals (*Grocery & Supermarkets, Luxury & Designer Goods, Consumer Electronics, Home & Furnishings, Fashion & Apparel*, etc.).
- **Size Tier Filter**: Filter by headcount tiers (*100–250, 250–500, 500–1,000, 1,000+ employees*).
- **1-Click Reset**: Instant filter reset button and active selection badges.

### 2. Four Dedicated View Modes

#### Tab 1: Org Chart Hierarchy (3 Sub-Modes)
* **Department Swimlanes**: Functional column layout displaying department executive headers, manager team groupings, direct report counts, and collapsible team members.
* **Management Level Tree**: Cascading corporate hierarchy mapping 7 seniority tiers (L0 CEO down to L6 Staff & Associates) with headcount breakdowns.
* **Visual Graph Canvas**: Interactive 2D canvas with smooth cubic Bezier curved connector lines (solid slate for primary reporting, dashed violet for matrix secondary links, and bold electric orange for traced paths). Includes pan, zoom, auto-centering, and minimap controls.

#### Tab 2: Leadership & Employee Directory
* Full-table directory with a **dedicated vertical scrollbar** and sticky table header (`#f8fafc`).
* Search by person name or title, filter by department, or jump across seniority tiers (*Exec, VP, Director, Manager, IC*).
* One-click **"Trace Reporting Path"** button to jump directly into the hierarchy view with the reporting chain highlighted up to the CEO.

#### Tab 3: B2B Sales Deal Intelligence & Path-to-Power
* **Functional Leader Query**: Discovers who runs any department (*"Data & Analytics"*, *"Loss Prevention & Security"*, *"Merchandising"*, etc.) along with their direct reporting line to the CEO.
* **Economic Buyer & Upward Chain Resolver**: Identifies the direct reporting chain above target titles (*"Security"*, *"Buyer"*, *"Store Manager"*) and pinpoints the executive holding signing authority.

#### Tab 4: Department Breakdown & Accuracy Analytics
* Visual headcount distribution bars by functional department.
* Seniority tier distribution bars across the organization.
* Company-specific precision score, recall score, total employee count, and unassigned node suppression counts.

### 3. Live AI Controls & Benchmarking
* **Confidence Cutoff Slider**: Real-time slider (45% to 95%) that dynamically triggers re-inference on the active company graph.
* **Ground-Truth Validation Overlay**: Toggleable overlay comparing inferred edges against gold-standard ground truth (*green check for True Positives, red warning for False Positives, and amber badge for safely suppressed unassigned nodes*).
* **500-Company Benchmark Modal**: Global evaluation report showing aggregate precision, recall, F1, size-tier breakdown, and department-level accuracy across all 500 retail companies.

---

## Architecture Overview

```
orgchart-inference/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI REST API & static file mount
│   │   ├── schemas.py                 # Pydantic schemas (Employee, Company, Edges, Metrics)
│   │   ├── generator/                 # Synthetic Dataset Generation Engine
│   │   │   ├── retail_taxonomy.py     # Retail sub-sectors, departments & sub-tracks
│   │   │   ├── org_synthesizer.py     # Ground truth tree + 5% matrix generator
│   │   │   ├── noise_injector.py      # Real-world title abbreviations & missing data
│   │   │   └── dataset_builder.py     # CLI to generate 500 companies
│   │   ├── inference/                 # AI-Native Inference Pipeline
│   │   │   ├── normalizer.py          # Canonical title matcher (97.8% accuracy)
│   │   │   ├── graph_solver.py        # Hierarchy constraint solver & DAG cycle check
│   │   │   ├── matrix_detector.py     # Cross-functional 5% dotted-line detector
│   │   │   ├── confidence.py          # Calibrated confidence scoring & rejection engine
│   │   │   └── pipeline.py            # End-to-end inference coordinator
│   │   ├── evaluation/                # Ground Truth Verification Suite
│   │   │   ├── metrics.py             # Precision, Recall, F1, Wrong Edge Rate
│   │   │   └── benchmark.py           # Benchmark runner across all 500 companies
│   │   └── services/
│   │       ├── data_store.py          # Fast in-memory cache & index lookups
│   │       └── sales_query.py         # GTM intelligence queries (Leader, Chain, Buyer)
│   ├── data/                          # 500 company JSONs + index + benchmark report
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   ├── logo.svg                   # Official Firmable vector logo
│   │   └── image.png                  # High-contrast Electric Orange & Charcoal brand image
│   ├── src/
│   │   ├── components/
│   │   │   ├── FirmableLogo.tsx       # Embedded high-contrast vector logo component
│   │   │   ├── Navbar.tsx             # Sticky top navigation with benchmark CTA
│   │   │   ├── CompanyHeader.tsx      # Company hero card & tab navigation
│   │   │   ├── CompanySearchBar.tsx   # Searchable dropdown & category/size filters
│   │   │   ├── OrgHierarchyView.tsx   # Swimlanes, Level Tree, and Canvas coordinator
│   │   │   ├── OrgChartCanvas.tsx     # 2D zoomable SVG canvas with cubic Bezier curves
│   │   │   ├── NodeCard.tsx           # Interactive employee card with badges
│   │   │   ├── NodeDrawer.tsx         # Slide-out profile & upward reporting drawer
│   │   │   ├── DirectoryView.tsx      # Searchable directory table with scrollbar
│   │   │   ├── SalesIntelligenceView.tsx # Decision maker & economic buyer finder
│   │   │   ├── CompanyAnalyticsView.tsx  # Department & seniority distribution charts
│   │   │   └── BenchmarkModal.tsx     # Global 500-company evaluation modal
│   │   ├── services/api.ts            # Typed Axios REST API client
│   │   ├── types/index.ts             # Complete TypeScript interfaces
│   │   ├── App.tsx                    # Main visualizer coordinator
│   │   └── index.css                  # Enterprise design system tokens (Orange & Purple)
│   ├── package.json
│   └── vite.config.ts
├── tests/
│   └── test_inference.py              # Automated pytest test suite (7/7 passing)
├── APPROACH.md                        # Technical methodology, architecture & trade-offs
├── Dockerfile                         # Multi-stage production container
├── render.yaml                        # Render Blueprint configuration
└── README.md
```

---

## Quickstart

### 1. Prerequisites
- Python 3.9+
- Node.js 18+ & npm

### 2. Backend Setup
```bash
# Create virtual environment & install dependencies
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

# Run automated test suite
pytest
```

### 3. Generate Dataset & Run Benchmark (Optional — Pre-generated dataset included)
```bash
# Generate 500 companies with 100+ employees each
python3 -m backend.app.generator.dataset_builder --count 500 --min-size 100

# Run inference & benchmark across all 500 companies
python3 -m backend.app.evaluation.benchmark
```

### 4. Run Locally (Full-Stack)

#### Option A: Independent Dev Servers (Recommended for Development)
```bash
# Terminal 1: Start FastAPI Backend
source .venv/bin/activate
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Start Vite Frontend (with API proxy on port 5173)
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

#### Option B: Unified Production Server
```bash
# Build frontend once
cd frontend && npm install && npm run build && cd ..

# Run backend (FastAPI serves both API and static frontend bundle)
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```
Open **`http://localhost:8000`** in your browser.

---

## Benchmark Results (500 Companies, 86,914 Employees)

| Metric | Score | Explanation |
| :--- | :--- | :--- |
| **Global Precision** | **81.45%** | Percentage of inferred edges matching Ground Truth |
| **Global Recall** | **79.92%** | Percentage of total actual reporting edges recovered |
| **Global F1 Score** | **80.68%** | Harmonic balance between Precision & Recall |
| **Wrong Edge Rate** | **18.55%** | False discovery rate strictly capped |
| **Unassigned Protected** | **1,619** | Suppressed edges under precision threshold |
| **Batch Runtime** | **14.19s** | Evaluated 500 companies in under 15 seconds |

---

## Deployment (Production Docker & Render)

### 1. Run with Docker Locally
The repository includes a production multi-stage `Dockerfile`:

```bash
docker build -t orgchart-inference .
docker run -p 8000:8000 -e PORT=8000 orgchart-inference
```
Visit `http://localhost:8000`.

### 2. Deploy to Render (Cloud Hosting)
1. Push your code to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/orgchart-inference.git
   git push -u origin main
   ```
2. Log in to [dashboard.render.com](https://dashboard.render.com).
3. Click **New +** $\rightarrow$ **Web Service** $\rightarrow$ Connect your `orgchart-inference` repository.
4. Render automatically detects the multi-stage `Dockerfile` and builds both frontend and backend.
5. In ~2 minutes, your service will be live at `https://<service-name>.onrender.com`!

---

## License
MIT License. Built for the Org Chart Inference Platform.
