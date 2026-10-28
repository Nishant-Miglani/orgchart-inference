# Firmable — Org Chart Inference Platform

> **AI-native reporting line inference from unstructured, noisy employee directories in Retail.**

Built for enterprise sales teams to answer high-stakes account mapping questions:
* *"Who runs the data team at this company?"*
* *"Who does the Head of Security report to?"*
* *"Who is the economic buyer above this champion?"*

---

## Key Highlights

- **Scale**: Generated and evaluated on **500 retail companies** with **86,914 employees** (all $\ge$ 100 employees).
- **Core Principle**: *"Where you can't resolve a manager, don't guess. A wrong edge is worse than no edge."*
- **81.45% Global Precision**, **79.92% Recall**, and **80.68% F1** across the entire 500-company benchmark.
- **Matrix Reporting**: Supports 95% single-manager primary reporting trees + 5% cross-functional dotted-line matrix edges.
- **Interactive Web App**: Modern full-stack React + FastAPI app with zoomable canvas, cubic Bezier connector lines, sales deal intelligence tools, live confidence threshold re-inference, and ground-truth comparison mode.

---

## Architecture Overview

```
firmable/
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
│   ├── src/
│   │   ├── components/                # OrgChartCanvas, NodeCard, NodeDrawer, SalesQueryBar...
│   │   ├── services/api.ts            # Typed API client
│   │   ├── types/index.ts             # TypeScript definitions
│   │   ├── App.tsx                    # Main visualizer application
│   │   └── index.css                  # Modern dark-theme design system
│   ├── package.json
│   └── vite.config.ts
├── tests/
│   └── test_inference.py              # Automated pytest test suite
├── APPROACH.md                        # Detailed technical methodology & evaluation
├── Dockerfile                         # Production deployment container
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

# Run automated tests
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
```bash
# Terminal 1: Start FastAPI Backend
source .venv/bin/activate
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Start React Frontend (with API proxy)
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

Alternatively, if you build the frontend (`npm --prefix frontend run build`), FastAPI serves the entire app directly on `http://localhost:8000`!

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

## Deployment (Production Docker)

The repository includes a production-ready `Dockerfile` that builds both the React client and FastAPI backend into a single container:

```bash
docker build -t firmable-orgchart .
docker run -p 8000:8000 firmable-orgchart
```

Can be deployed directly to **Render**, **Railway**, or **Fly.io**.

---

## License
MIT License. Built for the Firmable Assessment.
