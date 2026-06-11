"""
Matrix Smart Makkah — ML Microservice (FastAPI + scikit-learn)

Exposes predictive analytics for the Smart City OS:
  GET  /health            liveness probe
  GET  /models            model registry
  POST /forecast          time-series forecast (GradientBoosting)
  POST /risk              composite risk scoring (RandomForest)
  POST /maintenance       predictive maintenance (IsolationForest)

Author: Abdulaziz AlAmawi
"""
from __future__ import annotations

from contextlib import asynccontextmanager

import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .models import ModelRegistry, iso_labels
from .schemas import (
    ForecastRequest,
    ForecastResponse,
    ForecastPoint,
    MaintenanceRequest,
    MaintenanceResponse,
    ModelInfo,
    RiskFeatures,
    RiskResponse,
)

registry = ModelRegistry()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Train all models on startup (synthetic training data).
    registry.train_all()
    yield


app = FastAPI(
    title="Matrix Smart Makkah — ML Service",
    description="Predictive analytics & forecasting for the Smart City Operating System.",
    version="1.0.0",
    contact={"name": "Abdulaziz AlAmawi"},
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "matrix-smart-makkah-ml",
        "version": "1.0.0",
        "owner": "Abdulaziz AlAmawi",
        "models_trained": bool(registry.trained_at),
    }


@app.get("/models", response_model=list[ModelInfo])
def models():
    return registry.registry_info()


@app.post("/forecast", response_model=ForecastResponse)
def forecast(req: ForecastRequest):
    fm, hist, fc = registry.get_forecast(req.metric, req.horizon, req.history)

    hist_labels = iso_labels(len(hist), 1, -len(hist))
    fc_labels = iso_labels(len(fc), 1, 1)

    # Confidence band widens with horizon, scaled by training error.
    band = (fm.mape / 100.0) * float(np.mean(fc)) + np.std(hist) * 0.3
    low, high = [], []
    for i, (t, v) in enumerate(zip(fc_labels, fc)):
        spread = band * (1 + i / max(1, len(fc)))
        low.append(ForecastPoint(t=t, value=round(float(v - spread), 1), forecast=True))
        high.append(ForecastPoint(t=t, value=round(float(v + spread), 1), forecast=True))

    return ForecastResponse(
        metric=fm.metric,
        unit=fm.unit,
        model="GradientBoostingRegressor (lag+seasonal features)",
        mape=fm.mape,
        history=[ForecastPoint(t=t, value=round(float(v), 1)) for t, v in zip(hist_labels, hist)],
        forecast=[ForecastPoint(t=t, value=round(float(v), 1), forecast=True) for t, v in zip(fc_labels, fc)],
        confidence_low=low,
        confidence_high=high,
    )


@app.post("/risk", response_model=RiskResponse)
def risk(features: RiskFeatures):
    return registry.score_risk(features)


@app.post("/maintenance", response_model=MaintenanceResponse)
def maintenance(req: MaintenanceRequest):
    preds = registry.predict_maintenance(req.devices)
    return MaintenanceResponse(model="IsolationForest", predictions=preds)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
