<div align="center">

# 🛰️ Matrix Smart Makkah

### Smart City Operating System — A Production-Grade Smart City AI Platform

Unify **waste**, **mobility**, **environment** and **emergency response** on one
real-time, AI-driven command platform — turning a city of sensors into
actionable intelligence.

**Designed & engineered by [Abdulaziz AlAmawi](#-author)**

![Status](https://img.shields.io/badge/status-production--grade-06b6d4)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.6-f7931e?logo=scikitlearn)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169e1?logo=postgresql)
![License](https://img.shields.io/badge/license-MIT-22c55e)

</div>

---

## ✨ Overview

Matrix Smart Makkah is a full-stack platform that ingests live IoT telemetry from
across Makkah, runs predictive AI models, and presents operators with a premium
command center for real-time decision-making. It demonstrates **Artificial
Intelligence, Smart Cities, IoT Systems, Real-Time Systems, Data Analytics,
Predictive Modeling, Cloud Readiness, and Full-Stack Engineering** in one
coherent product.

## 🧩 Modules

| Module | Capabilities |
|--------|-------------|
| 🗑️ **Smart Waste** | Real-time bin monitoring · fill-level prediction · AI route optimization · cost-reduction analytics |
| 🚦 **Smart Transportation** | Traffic forecasting · congestion detection · mobility heatmaps · flow analytics |
| 🌬️ **Smart Environment** | Air-quality (AQI/PM) · noise · temperature monitoring · environmental alerts |
| 🛡️ **Emergency AI Core** | Incident detection · flood & fire prediction · composite risk · response dashboard |
| 🎛️ **Command Center** | City overview · live monitoring · critical alerts · AI recommendations |
| 📊 **Analytics Center** | Historical analytics · forecast dashboards · trend analysis · executive reports |
| 🧠 **AI Core** | Predictive maintenance · forecasting · risk scoring · explainable recommendations |

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     Operators / City Leadership             │
└───────────────────────────┬────────────────────────────────┘
                            │  HTTPS / SSE
┌───────────────────────────▼────────────────────────────────┐
│  apps/web  —  Next.js 15 · TypeScript · Tailwind · shadcn   │
│  • App Router dashboards + Framer Motion                    │
│  • REST API routes  (/api/snapshot, /api/forecast, …)       │
│  • Live feed via Server-Sent Events  (/api/stream)          │
└───────────┬───────────────────────────────┬────────────────┘
            │ Prisma                          │ HTTP
┌───────────▼────────────┐      ┌─────────────▼───────────────┐
│  PostgreSQL 16         │      │  services/ml — FastAPI       │
│  (time-series + meta)  │      │  scikit-learn models:        │
│                        │      │  • GradientBoosting forecast │
│                        │      │  • RandomForest risk         │
│                        │      │  • IsolationForest maint.    │
└────────────────────────┘      └──────────────────────────────┘
            ▲
            │  IoT device gateway / stream (synthetic data engine in dev)
┌───────────┴────────────────────────────────────────────────┐
│  Sensors: bins · traffic loops · AQ stations · cameras      │
└─────────────────────────────────────────────────────────────┘
```

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for the full design.

## 🛠️ Tech Stack

**Frontend** — Next.js 15 (App Router), TypeScript, TailwindCSS, shadcn-style UI,
Framer Motion, Recharts.
**Backend** — Next.js REST API routes + Server-Sent Events live feed; FastAPI
ML microservice (Node.js + Python polyglot backend).
**Database** — PostgreSQL 16 with Prisma ORM (time-series readings + metadata).
**AI Layer** — scikit-learn (GradientBoosting, RandomForest, IsolationForest),
predictive analytics & time-series forecasting.
**Infra** — Docker, docker-compose, multi-stage builds, health checks.

## 📁 Repository Layout

```
matrix-smart-makkah/
├── apps/
│   └── web/                # Next.js 15 frontend + REST/SSE backend
│       ├── src/app/        # Routes: landing, command-center, modules, analytics, ai
│       ├── src/components/ # UI, charts, dashboard, shell
│       ├── src/lib/        # data-engine, ml, routing, types, districts
│       ├── src/hooks/      # live-data (SSE) provider
│       └── prisma/         # schema.prisma + seed.ts
├── services/
│   └── ml/                 # FastAPI + scikit-learn microservice
│       └── app/            # main.py, models.py, schemas.py
├── docker-compose.yml      # db + web + ml
├── ARCHITECTURE.md
└── README.md
```

## 🚀 Quick Start

### Option A — Docker (full stack)

```bash
docker compose up --build
# Web      → http://localhost:3000
# ML API   → http://localhost:8000/docs
# Postgres → localhost:5432
```

### Option B — Local development

**Web app**
```bash
cd apps/web
npm install
npm run dev            # http://localhost:3000
```

**ML service**
```bash
cd services/ml
python -m venv .venv && . .venv/Scripts/activate   # (PowerShell: .venv\Scripts\Activate.ps1)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000          # http://localhost:8000/docs
```

**Database (optional — enables persistence)**
```bash
# Start Postgres (or use docker compose up db)
cd apps/web
cp .env.example .env
npx prisma generate
npx prisma db push
npm run prisma:seed
```

> The web app ships with a deterministic **synthetic IoT data engine**, so every
> dashboard is fully live **without** a database or sensor grid — ideal for demos.
> In production the engine is swapped for the real device gateway / stream.

## 🔌 API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/snapshot` | Full real-time city telemetry snapshot |
| `GET` | `/api/stream` | Live sensor feed (Server-Sent Events) |
| `GET` | `/api/forecast?metric=` | Forecast (proxies the ML service) |
| `GET` | `/api/health` | Liveness probe |
| `POST` | `:8000/forecast` | ML forecast (GradientBoosting) |
| `POST` | `:8000/risk` | Composite risk score (RandomForest) |
| `POST` | `:8000/maintenance` | Predictive maintenance (IsolationForest) |

## 🧠 AI / ML

- **Time-series forecasting** — `GradientBoostingRegressor` over lag + seasonal
  features for waste fill, congestion, AQI and energy demand (with confidence bands & MAPE).
- **Composite risk scoring** — `RandomForestClassifier` producing explainable
  flood / fire / crowd risk with human-readable drivers.
- **Predictive maintenance** — `IsolationForest` anomaly detection flags devices
  likely to fail within 7 days.

## 🎨 Design

A premium, startup-grade dark console inspired by **Tesla, Palantir, SmartThings
and Google Smart City** — deep-space palette, glassmorphism, ambient glows,
real-time pulses and motion. Built to be visually distinct and portfolio-ready.

## 👤 Author

**Abdulaziz AlAmawi** — Designer & Full-Stack / AI Engineer.
This project is owned and maintained by Abdulaziz AlAmawi.

## 📄 License

MIT © 2026 Abdulaziz AlAmawi
