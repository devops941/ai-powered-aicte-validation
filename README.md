# AI Powered AICTE Document Verification

Automated pre-validation and decision-support system for AICTE Extension of Approval (EoA) applications. Reduces manual document scrutiny time by using OCR, rules-based analysis, tamper detection, and risk scoring.

---

## Project Structure

```
ai-powered-aicte-document-verification/
├── frontend/                  React + TypeScript + Vite (UI)
│   ├── src/
│   │   ├── components/        Reusable UI components
│   │   ├── context/           Global state (AppContext)
│   │   ├── data/              Mock/seed data
│   │   ├── pages/             Page-level components
│   │   ├── api.ts             HTTP client (proxies to backend)
│   │   └── types.ts           TypeScript type definitions
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                   Python + FastAPI (API server)
│   ├── api.py                 FastAPI REST endpoints
│   ├── ocr.py                 PDF/image text extraction
│   ├── extract.py             Field extraction (regex)
│   ├── rules_engine.py        YAML-based rule evaluation
│   ├── tamper.py              ELA + metadata forensics
│   ├── qr_check.py            QR code verification
│   ├── risk.py                Risk scoring algorithm
│   ├── report.py              PDF report generation
│   ├── db.py                  SQLite database layer
│   ├── rules.yaml             Regulatory rules config
│   ├── requirements.txt       Python dependencies
│   ├── samples/               Test documents
│   └── case1_clean/           Reference clean case
│
├── docs/
│   └── PROJECT_SPEC.txt       Full project specification
│
├── run_backend.bat            Start the FastAPI backend
├── run_frontend.bat           Start the React frontend
├── start_full_system.bat      Start both servers at once
└── .gitignore
```

---

## Quick Start

### Option A — Start both servers together
```bat
start_full_system.bat
```

### Option B — Start individually

**Backend** (FastAPI on port 8000):
```bat
run_backend.bat
```

**Frontend** (React on port 3000):
```bat
run_frontend.bat
```

Then open **http://localhost:3000** in your browser.

---

## Setup

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn api:app --host 127.0.0.1 --port 8000 --reload
```

---

## Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | React 19, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend   | Python, FastAPI, SQLite |
| OCR       | PyMuPDF, pdfplumber, pytesseract |
| AI/ML     | OpenCV (ELA), RapidFuzz, pyzbar |
| Reporting | ReportLab |

---

## Roles

| Role | Access |
|------|--------|
| Official (Scrutiny) | Dashboard, Applications, New Application |
| Admin (Director) | All above + Audit Log + Rules Management |
