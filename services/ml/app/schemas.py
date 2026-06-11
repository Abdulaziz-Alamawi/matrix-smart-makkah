"""Pydantic request/response schemas for the ML service."""
from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class ForecastRequest(BaseModel):
    metric: str = Field("waste", description="Metric key: waste|traffic|aqi|energy")
    horizon: int = Field(24, ge=1, le=168, description="Steps to forecast")
    history: Optional[List[float]] = Field(
        None, description="Optional observed series; if omitted a realistic series is simulated"
    )


class ForecastPoint(BaseModel):
    t: str
    value: float
    forecast: bool = False


class ForecastResponse(BaseModel):
    metric: str
    unit: str
    model: str
    mape: float
    history: List[ForecastPoint]
    forecast: List[ForecastPoint]
    confidence_low: List[ForecastPoint]
    confidence_high: List[ForecastPoint]


class RiskFeatures(BaseModel):
    temperature_c: float = 35.0
    congestion_index: float = 0.4
    population_density: float = 0.5
    air_quality_index: float = 90.0
    active_incidents: int = 1
    rainfall_mm: float = 0.0


class RiskResponse(BaseModel):
    flood_risk: int
    fire_risk: int
    crowd_risk: int
    overall: int
    drivers: List[str]
    model: str


class Device(BaseModel):
    id: str
    battery_pct: float
    temperature_c: float
    uptime_hours: float
    error_rate: float = 0.0
    offline: bool = False


class MaintenanceRequest(BaseModel):
    devices: List[Device]


class MaintenancePrediction(BaseModel):
    id: str
    failure_risk: int
    anomaly_score: float
    recommendation: str


class MaintenanceResponse(BaseModel):
    model: str
    predictions: List[MaintenancePrediction]


class ModelInfo(BaseModel):
    name: str
    algorithm: str
    target: str
    accuracy: float
    trained_at: str
