# MOIL Limited Manganese AI - Industrial Decision Platform

**SIH26009: Using AI/ML and Space Technology to Identify Manganese Reserves and Overcome Production Shortfalls**

Tailored specifically for **MOIL Limited** operations in the **Balaghat (MP)** and **Bhandara/Dongri Buzurg (MH)** manganese belts.

---

## 🌟 Executive Overview & Unique Value Propositions (UVPs)

Manganese mining faces two core operational bottlenecks:
1. **Upstream Exploration Blindspots:** Traditional geological sampling is slow and costly. Our **Space-Tech Manganese Mineral Prospectivity Index (MMPI)** engine ingests multispectral remote sensing bands to rapidly map high-grade $MnO_2$ reserve zones (% Mn content, depth, stripping ratios).
2. **Downstream Extraction Shortfalls:** Monsoon downpours, blasting schedule delays, and Heavy Earth Moving Machinery (HEMM) breakdowns create severe shift extraction shortfalls against statutory quotas set by the Ministry of Mines.

### Key Differentiators:
* **Closed-Loop Exploration-to-Extraction Architecture:** Direct linkage between macro satellite prospectivity mapping and micro shift-level dispatch.
* **Manganese-Specific Spectral Engine (MMPI):** Implements specialized ratio math:
  $$\text{MMPI} = 0.45 \times \left(\frac{\text{SWIR}_1}{\text{VNIR}}\right) + 0.35 \times \left(\frac{\text{NIR}}{\text{Green}}\right) + 0.20 \times \text{Ferrous Index}$$
* **Prescriptive AI Engine:** Pairs an **XGBoost Regressor** shortfall forecaster with a **SciPy Simplex Linear Programming** solver to dynamically reallocate excavators and haul trucks across alternative mine faces.
* **DGMS Regulatory Safeguards:** Automatic enforcement of Directorate General of Mines Safety rules (e.g. halting open-pit bench blasting when rainfall exceeds 25 mm/hr or slope moisture exceeds 45%).
* **Interactive "What-If" Digital Twin Simulator:** Sliders allow mine superintendents to simulate rainfall shocks or HEMM breakdowns and instantly view re-routing directives, fuel savings, and financial value recovered in INR (₹).

---

## 🏗️ Technical Architecture & Tech Stack

```text
manganese-ai-system/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI entrypoint, CORS, routes
│   │   ├── schemas.py                  # Pydantic v2 validation models
│   │   ├── geospatial_engine.py        # MMPI calculation & GeoJSON generator
│   │   ├── prediction_model.py         # XGBoost model training & inference
│   │   ├── optimizer.py                # SciPy prescriptive reallocation solver
│   │   └── mock_data_generator.py      # Balaghat realistic telemetry synthesizer
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx              # Mine status & shift selector
│   │   │   ├── KPICards.tsx            # Real-time metrics ribbon
│   │   │   ├── ReserveMap.tsx          # Leaflet map with GeoJSON overlays
│   │   │   ├── SimulatorPanel.tsx      # What-If parameter sliders
│   │   │   ├── AnalyticsCharts.tsx     # Recharts production forecasts
│   │   │   └── PrescriptiveAlerts.tsx  # Dynamic action directives & PDF export
│   │   ├── App.tsx                     # Main dashboard layout
│   │   ├── types.ts                    # TypeScript interfaces
│   │   └── index.css                   # Tailwind CSS imports
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.js
└── README.md
```

### Stack Breakdown
* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS (Industrial Dark Theme slate-950/amber/emerald), React-Leaflet, Recharts, Lucide React, jsPDF + html2canvas.
* **Backend:** FastAPI (Python 3.10+), Uvicorn ASGI, Pydantic v2.
* **Data Science & ML:** XGBoost Regressor, SciPy Simplex Optimization (`scipy.optimize.linprog`), NumPy, Pandas, GeoPandas, Shapely, Joblib.

---

## 🚀 Quickstart & Installation Instructions

### Prerequisites
* **Python 3.10+**
* **Node.js v18+** & **npm**

---

### 1. Backend Setup & Launch

```bash
# Navigate to workspace root
cd manganese

# Create Python virtual environment
python -m venv venv

# Activate Virtual Environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# Install Python backend dependencies
pip install -r backend/requirements.txt

# Run FastAPI backend server (Port 8000)
cd backend
python -m uvicorn app.main:app --reload --port 8000
```
> The API will be live at `http://localhost:8000`. Interactive OpenAPI documentation available at `http://localhost:8000/docs`.

---

### 2. Frontend Setup & Launch

Open a second terminal window:

```bash
# Navigate to frontend directory
cd manganese/frontend

# Install NPM packages
npm install

# Start Vite React development server
npm run dev
```
> The Mining Command Dashboard will open automatically at `http://localhost:3000`.

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | System health check and model loading status |
| `GET` | `/api/v1/mines/summary` | Key MOIL site metadata (Balaghat, Dongri Buzurg, Chikla) |
| `GET` | `/api/v1/prospectivity` | Generates MMPI remote sensing prospectivity GeoJSON polygons |
| `POST` | `/api/v1/predict-shortfall` | XGBoost shift extraction prediction & DGMS safety check |
| `POST` | `/api/v1/optimize-fleet` | SciPy Simplex linear programming fleet reallocation solver |
| `POST` | `/api/v1/simulate` | Closed-loop Digital Twin simulator execution |
| `GET` | `/api/v1/telemetry/historical` | 14-shift extraction logs for Recharts time-series |

---

## 🛡️ License & Acknowledgments

Engineered for **MOIL Limited** (Manganese Ore India Limited) under problem statement **SIH26009** for Smart India Hackathon.
