// ───────────────────────────────────────────────────────────────────────────
// Matrix Smart Makkah — Core domain types
// Smart City Operating System
// Author: Abdulaziz AlAmawi
// ───────────────────────────────────────────────────────────────────────────

export type Severity = "info" | "low" | "medium" | "high" | "critical";
export type ModuleKey = "waste" | "transport" | "environment" | "emergency";
export type Trend = "up" | "down" | "flat";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface District {
  id: string;
  name: string;
  nameAr: string;
  center: GeoPoint;
  population: number;
}

// ── Waste ──────────────────────────────────────────────────────────────────
export interface WasteBin {
  id: string;
  code: string;
  districtId: string;
  location: GeoPoint;
  fillLevel: number; // 0..100
  capacityLiters: number;
  temperatureC: number;
  batteryPct: number;
  lastEmptiedAt: string;
  predictedFullAt: string; // ISO — when bin is forecast to reach 100%
  hoursUntilFull: number;
  status: "ok" | "warning" | "critical" | "offline";
  fillRatePerHour: number;
}

export interface CollectionRoute {
  id: string;
  name: string;
  binIds: string[];
  distanceKm: number;
  durationMin: number;
  priorityScore: number;
  savingsPct: number;
}

// ── Transport ────────────────────────────────────────────────────────────────
export interface TrafficSegment {
  id: string;
  name: string;
  districtId: string;
  from: GeoPoint;
  to: GeoPoint;
  speedKmh: number;
  freeFlowKmh: number;
  congestionIndex: number; // 0..1
  vehiclesPerHour: number;
  status: "free" | "moderate" | "heavy" | "jam";
}

// ── Environment ──────────────────────────────────────────────────────────────
export interface EnvironmentStation {
  id: string;
  name: string;
  districtId: string;
  location: GeoPoint;
  aqi: number; // Air Quality Index
  pm25: number;
  pm10: number;
  co2: number;
  noiseDb: number;
  temperatureC: number;
  humidityPct: number;
  status: "good" | "moderate" | "unhealthy" | "hazardous";
}

// ── Emergency ────────────────────────────────────────────────────────────────
export type IncidentType =
  | "fire"
  | "flood"
  | "medical"
  | "accident"
  | "structural"
  | "crowd";

export interface Incident {
  id: string;
  type: IncidentType;
  districtId: string;
  location: GeoPoint;
  severity: Severity;
  title: string;
  detail: string;
  reportedAt: string;
  status: "detected" | "dispatched" | "responding" | "resolved";
  responseUnits: number;
  etaMin: number;
  aiConfidence: number; // 0..1
}

export interface RiskScore {
  districtId: string;
  floodRisk: number; // 0..100
  fireRisk: number;
  crowdRisk: number;
  overall: number;
  drivers: string[];
}

// ── Alerts / events ──────────────────────────────────────────────────────────
export interface CityAlert {
  id: string;
  module: ModuleKey;
  severity: Severity;
  title: string;
  message: string;
  districtId: string;
  createdAt: string;
  acknowledged: boolean;
}

export interface AiRecommendation {
  id: string;
  module: ModuleKey;
  title: string;
  rationale: string;
  impact: string;
  confidence: number; // 0..1
  estimatedSavings?: number;
  priority: Severity;
}

// ── KPIs / aggregates ─────────────────────────────────────────────────────────
export interface Kpi {
  label: string;
  value: number;
  unit?: string;
  trend: Trend;
  changePct: number;
}

export interface TimeSeriesPoint {
  t: string; // ISO timestamp or label
  value: number;
  forecast?: boolean;
}

export interface ForecastSeries {
  metric: string;
  unit: string;
  history: TimeSeriesPoint[];
  forecast: TimeSeriesPoint[];
  confidenceLow: TimeSeriesPoint[];
  confidenceHigh: TimeSeriesPoint[];
  model: string;
  mape: number; // mean abs percentage error
}

export interface CitySnapshot {
  timestamp: string;
  bins: WasteBin[];
  segments: TrafficSegment[];
  stations: EnvironmentStation[];
  incidents: Incident[];
  alerts: CityAlert[];
  recommendations: AiRecommendation[];
  risk: RiskScore[];
  kpis: {
    overall: Kpi[];
    waste: Kpi[];
    transport: Kpi[];
    environment: Kpi[];
    emergency: Kpi[];
  };
}
