# Architecture — Matrix Smart Makkah

> Smart City Operating System · Author: **Abdulaziz AlAmawi**

This document describes the system design, data flow, AI layer and deployment
topology of the Matrix Smart Makkah platform.

---

## 1. Goals & Principles

- **Real-time first** — operators see the city as it is *now*, with sub-5s freshness.
- **AI-native** — forecasting, risk scoring and recommendations are core, not bolted on.
- **Polyglot but cohesive** — Node/TypeScript for the experience tier, Python for ML.
- **Cloud-ready** — containerized, stateless services, health checks, horizontal scale.
- **Graceful degradation** — the UI is fully functional without a DB or live sensor grid
  thanks to a deterministic synthetic data engine (dev/demo), swapped for the real
  device gateway in production.

## 2. High-Level Topology

```
            Sensors / IoT Edge
   (bins · traffic loops · AQ nodes · cameras)
                    │
        MQTT / Kafka device gateway        ← production ingestion
                    │
   ┌────────────────▼─────────────────┐
   │  Stream processor / normalizer    │
   └────────────────┬─────────────────┘
                    │ writes time-series
            ┌────────▼────────┐         ┌────────────────────────┐
            │  PostgreSQL 16  │◄────────│  apps/web (Next.js 15)  │
            │  + Prisma ORM   │  Prisma │  • Dashboards (RSC)     │
            └─────────────────┘         │  • REST API routes      │
                                        │  • SSE live feed        │
                                        └───────────┬────────────┘
                                                    │ HTTP
                                        ┌───────────▼────────────┐
                                        │ services/ml (FastAPI)   │
                                        │ scikit-learn models     │
                                        └─────────────────────────┘
```

In **development/demo**, the IoT gateway + stream processor are replaced by
`src/lib/data-engine.ts`, a deterministic, time-evolving simulation seeded per
entity. This guarantees realistic, reproducible telemetry with zero infrastructure.

## 3. Frontend (`apps/web`)

- **Framework**: Next.js 15 App Router, React 19, TypeScript (strict).
- **Styling**: TailwindCSS + a shadcn-style component layer (Radix primitives),
  custom dark "command console" theme with CSS variables.
- **Motion**: Framer Motion for entrance/transition micro-interactions.
- **Charts**: Recharts (forecast bands, multi-series, radial gauges) + a custom
  CSS-grid heatmap and a projected city map (no external map tiles required).
- **State / realtime**: a `LiveDataProvider` opens an `EventSource` to
  `/api/stream` (Server-Sent Events). If the stream drops, it transparently falls
  back to 5s interval polling of `/api/snapshot`.

### Route map

| Route | Purpose |
|-------|---------|
| `/` | Marketing landing / hero |
| `/command-center` | Unified city overview, alerts, risk, recommendations |
| `/waste` | Bin network, fill forecast, route optimization, cost analytics |
| `/transportation` | Traffic map, congestion forecast, mobility heatmap |
| `/environment` | AQ stations, trends, noise, station telemetry |
| `/emergency` | Incident map, flood/fire/crowd risk, response queue |
| `/analytics` | Forecasts, trends, heatmaps, executive reports |
| `/ai` | Model registry, predictive maintenance, explainable AI |

## 4. Backend / API Tier

The experience-tier backend lives inside Next.js (Node runtime):

- `GET /api/snapshot` — composes a full `CitySnapshot` from the data engine.
- `GET /api/stream` — Server-Sent Events; pushes a fresh snapshot every 3s.
- `GET /api/forecast?metric=` — proxies the Python ML service, normalizing the
  response; falls back to an in-process Holt-linear forecaster if ML is offline.
- `GET /api/health` — liveness/readiness probe for orchestrators.

This separation keeps latency-sensitive composition close to the UI while
delegating heavyweight model training/inference to the Python service.

## 5. AI / ML Layer (`services/ml`)

A FastAPI service that trains models at startup on synthetic-but-realistic
telemetry, then serves inference:

| Capability | Algorithm | Notes |
|------------|-----------|-------|
| Forecasting | `GradientBoostingRegressor` | Lag window (24h) + sin/cos hour + rolling mean/std features; backtested MAPE; widening confidence band |
| Risk scoring | `RandomForestClassifier` | Probability mapped to 0–100 composite; explainable drivers derived from inputs |
| Predictive maintenance | `IsolationForest` | Unsupervised anomaly detection over battery/temp/uptime/error-rate |

Endpoints: `/forecast`, `/risk`, `/maintenance`, `/models`, `/health`
(interactive docs at `/docs`).

### Why two languages?

The requirement set calls for **scikit-learn** (Python) *and* a modern TypeScript
web stack with Prisma (Node). Rather than compromise, the platform runs a thin
Python inference service behind the Node API — a common production pattern that
keeps each ecosystem idiomatic.

## 6. Data Model (PostgreSQL + Prisma)

Normalized metadata tables (`District`, `WasteBin`, `TrafficSegment`,
`EnvironmentStation`, `Incident`) plus append-only **time-series readings**
(`WasteReading`, `TrafficReading`, `EnvironmentReading`, `RiskScore`) indexed by
`(entityId, recordedAt)` for efficient range queries and downsampling.
Enums encode statuses and severities. See `apps/web/prisma/schema.prisma`.

## 7. Real-Time System

- **Transport**: Server-Sent Events (`text/event-stream`) for one-way live push —
  simple, proxy-friendly and reconnect-safe. The design is Socket.IO-compatible:
  the `LiveDataProvider` abstracts the channel so a WebSocket/Socket.IO transport
  can be dropped in without touching components.
- **Cadence**: 3s server push; 5s polling fallback.
- **Backpressure**: stream handlers clean up timers on `cancel()`.

## 8. Deployment & Cloud Readiness

- **Containers**: multi-stage Dockerfiles for both web (Next.js `standalone`) and
  ML (slim Python). Non-root users, health checks.
- **Orchestration**: `docker-compose.yml` wires `db` → `ml` → `web` with health
  gating. Maps cleanly to Kubernetes (Deployments + Services + probes).
- **Config**: 12-factor via environment variables (`DATABASE_URL`,
  `ML_SERVICE_URL`).
- **Observability hooks**: `/health` endpoints on both services; structured logs.

## 9. Scaling Path

| Concern | Dev / Demo | Production |
|---------|-----------|------------|
| Ingestion | Synthetic engine | MQTT/Kafka gateway + stream processor |
| Realtime | SSE from single node | Socket.IO cluster / Redis pub-sub fan-out |
| Forecast | On-startup training | Scheduled retraining + model registry (MLflow) |
| Storage | Single Postgres | Postgres + TimescaleDB hypertables / object store |
| Web | `next dev` | Horizontally-scaled standalone servers behind LB/CDN |

## 10. Security Considerations

- Stateless services; secrets via env, never committed.
- CORS scoped at the ML edge; API routes are server-only.
- Input validation via Pydantic (ML) and Zod (web) at trust boundaries.
- Principle of least privilege for container users.

---

© 2026 **Abdulaziz AlAmawi** — Matrix Smart Makkah.
