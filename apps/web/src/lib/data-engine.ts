// ───────────────────────────────────────────────────────────────────────────
// Matrix Smart Makkah — Synthetic IoT Data Engine
// Deterministic, time-evolving sensor simulation for a Smart City OS.
// Produces realistic live telemetry for Waste, Transport, Environment & Emergency
// without requiring a physical sensor grid. In production this layer is replaced
// by the device gateway / Kafka stream (see ARCHITECTURE.md).
// Author: Abdulaziz AlAmawi
// ───────────────────────────────────────────────────────────────────────────

import { DISTRICTS } from "./districts";
import type {
  WasteBin,
  TrafficSegment,
  EnvironmentStation,
  Incident,
  IncidentType,
  CityAlert,
  AiRecommendation,
  RiskScore,
  GeoPoint,
  Severity,
  CitySnapshot,
  Kpi,
} from "./types";

// ── Deterministic PRNG (mulberry32) ─────────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function jitter(point: GeoPoint, rng: () => number, spread = 0.012): GeoPoint {
  return {
    lat: point.lat + (rng() - 0.5) * spread,
    lng: point.lng + (rng() - 0.5) * spread,
  };
}

// Diurnal multiplier — activity peaks around midday & evening (city rhythm).
function diurnal(now: Date, phase = 0): number {
  const h = now.getHours() + now.getMinutes() / 60;
  const base = 0.55 + 0.45 * Math.sin(((h - 6 + phase) / 24) * Math.PI * 2);
  const evening = 0.25 * Math.exp(-Math.pow(h - 20, 2) / 6);
  return Math.min(1.15, base + evening);
}

// Smooth per-entity time wave so values "live" between polls.
function liveWave(id: string, now: Date, period = 90, amp = 1): number {
  const seed = hashStr(id) % 1000;
  const t = now.getTime() / 1000;
  return amp * Math.sin((t / period) * Math.PI * 2 + seed);
}

const BIN_COUNT_PER_DISTRICT = 9;
const SEGMENTS_PER_DISTRICT = 4;

// ── Waste bins ────────────────────────────────────────────────────────────
export function generateBins(now = new Date()): WasteBin[] {
  const bins: WasteBin[] = [];
  const activity = diurnal(now);

  for (const d of DISTRICTS) {
    const rng = mulberry32(hashStr("bin-" + d.id));
    for (let i = 0; i < BIN_COUNT_PER_DISTRICT; i++) {
      const id = `${d.id}-bin-${i + 1}`;
      const capacity = [240, 360, 660, 1100][Math.floor(rng() * 4)];
      // Base fill driven by hours since last emptied + live activity wave.
      const baseRate = 1.8 + rng() * 4.2; // % per hour nominal
      const fillRatePerHour = +(baseRate * (0.7 + activity * 0.6)).toFixed(2);
      const hoursSinceEmpty = 2 + rng() * 26;
      const wave = liveWave(id, now, 120, 6);
      let fillLevel = Math.min(
        100,
        Math.max(0, hoursSinceEmpty * fillRatePerHour * 0.55 + wave)
      );
      fillLevel = +fillLevel.toFixed(1);

      const hoursUntilFull =
        fillLevel >= 100 ? 0 : +((100 - fillLevel) / fillRatePerHour).toFixed(1);
      const predictedFullAt = new Date(
        now.getTime() + hoursUntilFull * 3600 * 1000
      ).toISOString();
      const battery = +(40 + rng() * 60).toFixed(0);
      const offline = rng() < 0.03;

      let status: WasteBin["status"] = "ok";
      if (offline) status = "offline";
      else if (fillLevel >= 90) status = "critical";
      else if (fillLevel >= 72) status = "warning";

      bins.push({
        id,
        code: `MKB-${d.id.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
        districtId: d.id,
        location: jitter(d.center, rng),
        fillLevel,
        capacityLiters: capacity,
        temperatureC: +(28 + activity * 10 + liveWave(id, now, 200, 3)).toFixed(1),
        batteryPct: battery,
        lastEmptiedAt: new Date(
          now.getTime() - hoursSinceEmpty * 3600 * 1000
        ).toISOString(),
        predictedFullAt,
        hoursUntilFull,
        status,
        fillRatePerHour,
      });
    }
  }
  return bins;
}

// ── Traffic segments ────────────────────────────────────────────────────────
const ROAD_NAMES = [
  "Ibrahim Al Khalil Rd",
  "Third Ring Rd",
  "King Abdulaziz Rd",
  "Jabal Omar Ave",
  "Al Haram Expressway",
  "Aziziyah Link",
  "Mina Tunnel 1",
  "Arafat Hwy",
];

export function generateSegments(now = new Date()): TrafficSegment[] {
  const segments: TrafficSegment[] = [];
  const activity = diurnal(now, 1);
  for (const d of DISTRICTS) {
    const rng = mulberry32(hashStr("seg-" + d.id));
    for (let i = 0; i < SEGMENTS_PER_DISTRICT; i++) {
      const id = `${d.id}-seg-${i + 1}`;
      const freeFlow = [60, 80, 100, 120][Math.floor(rng() * 4)];
      const wave = liveWave(id, now, 60, 0.18);
      // Higher activity → lower speed; districts near Haram congest more.
      const congestionBase =
        (d.id === "haram" || d.id === "ajyad" ? 0.45 : 0.2) +
        activity * 0.45 +
        rng() * 0.15 +
        wave;
      const congestionIndex = Math.min(0.98, Math.max(0.04, congestionBase));
      const speedKmh = +(freeFlow * (1 - congestionIndex * 0.85)).toFixed(0);
      const vehiclesPerHour = Math.round(
        (800 + rng() * 2600) * (0.5 + activity)
      );

      let status: TrafficSegment["status"] = "free";
      if (congestionIndex >= 0.78) status = "jam";
      else if (congestionIndex >= 0.55) status = "heavy";
      else if (congestionIndex >= 0.32) status = "moderate";

      const from = jitter(d.center, rng, 0.02);
      const to = jitter(d.center, rng, 0.02);
      segments.push({
        id,
        name: `${ROAD_NAMES[(hashStr(d.id) + i) % ROAD_NAMES.length]}`,
        districtId: d.id,
        from,
        to,
        speedKmh,
        freeFlowKmh: freeFlow,
        congestionIndex: +congestionIndex.toFixed(2),
        vehiclesPerHour,
        status,
      });
    }
  }
  return segments;
}

// ── Environment stations ────────────────────────────────────────────────────
export function generateStations(now = new Date()): EnvironmentStation[] {
  const stations: EnvironmentStation[] = [];
  const activity = diurnal(now, 0.5);
  for (const d of DISTRICTS) {
    const rng = mulberry32(hashStr("env-" + d.id));
    const id = `${d.id}-env`;
    const wave = liveWave(id, now, 180, 18);
    const aqi = Math.round(
      Math.max(20, 55 + activity * 70 + rng() * 40 + wave)
    );
    const noiseDb = +(
      48 +
      activity * 22 +
      (d.id === "haram" ? 8 : 0) +
      liveWave(id, now, 40, 5)
    ).toFixed(0);
    const temperatureC = +(
      32 +
      activity * 9 +
      liveWave(id, now, 600, 4)
    ).toFixed(1);

    let status: EnvironmentStation["status"] = "good";
    if (aqi > 200) status = "hazardous";
    else if (aqi > 150) status = "unhealthy";
    else if (aqi > 100) status = "moderate";

    stations.push({
      id,
      name: `${DISTRICTS.find((x) => x.id === d.id)?.name} AQ Node`,
      districtId: d.id,
      location: d.center,
      aqi,
      pm25: +(aqi * 0.45 + rng() * 6).toFixed(1),
      pm10: +(aqi * 0.7 + rng() * 9).toFixed(1),
      co2: Math.round(400 + activity * 380 + rng() * 120),
      noiseDb,
      temperatureC,
      humidityPct: Math.round(18 + rng() * 35),
      status,
    });
  }
  return stations;
}

// ── Incidents (Emergency AI) ────────────────────────────────────────────────
const INCIDENT_TEMPLATES: Record<
  IncidentType,
  { title: string; detail: string }
> = {
  fire: {
    title: "Thermal anomaly detected",
    detail: "Computer-vision + thermal sensors flagged abnormal heat signature.",
  },
  flood: {
    title: "Flash-flood risk in wadi channel",
    detail: "Rainfall accumulation + drainage load exceeded safe threshold.",
  },
  medical: {
    title: "Mass medical assistance request",
    detail: "Clustered emergency calls indicate heat-stress event.",
  },
  accident: {
    title: "Multi-vehicle collision",
    detail: "Sudden speed-drop pattern detected by traffic AI.",
  },
  structural: {
    title: "Structural vibration alert",
    detail: "Accelerometer drift beyond tolerance on overpass.",
  },
  crowd: {
    title: "Crowd density surge",
    detail: "Density estimation exceeded safe occupancy for the zone.",
  },
};

export function generateIncidents(now = new Date()): Incident[] {
  const incidents: Incident[] = [];
  const rng = mulberry32(
    hashStr("inc-" + Math.floor(now.getTime() / (1000 * 60 * 3)))
  );
  const activity = diurnal(now);
  const count = Math.floor(2 + rng() * 4 + activity * 2);
  const types: IncidentType[] = [
    "fire",
    "flood",
    "medical",
    "accident",
    "structural",
    "crowd",
  ];

  for (let i = 0; i < count; i++) {
    const d = DISTRICTS[Math.floor(rng() * DISTRICTS.length)];
    const type = types[Math.floor(rng() * types.length)];
    const sevRoll = rng();
    const severity: Severity =
      sevRoll > 0.88
        ? "critical"
        : sevRoll > 0.66
          ? "high"
          : sevRoll > 0.4
            ? "medium"
            : "low";
    const statusRoll = rng();
    const status: Incident["status"] =
      statusRoll > 0.75
        ? "detected"
        : statusRoll > 0.5
          ? "dispatched"
          : statusRoll > 0.2
            ? "responding"
            : "resolved";
    const minsAgo = Math.floor(rng() * 90);
    incidents.push({
      id: `inc-${now.getTime()}-${i}`,
      type,
      districtId: d.id,
      location: jitter(d.center, rng),
      severity,
      title: INCIDENT_TEMPLATES[type].title,
      detail: INCIDENT_TEMPLATES[type].detail,
      reportedAt: new Date(now.getTime() - minsAgo * 60000).toISOString(),
      status,
      responseUnits: 1 + Math.floor(rng() * 5),
      etaMin: status === "resolved" ? 0 : 2 + Math.floor(rng() * 12),
      aiConfidence: +(0.72 + rng() * 0.27).toFixed(2),
    });
  }
  return incidents.sort(
    (a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt)
  );
}

// ── Risk scoring (Explainable) ───────────────────────────────────────────────
export function generateRisk(
  stations: EnvironmentStation[],
  segments: TrafficSegment[],
  incidents: Incident[],
  now = new Date()
): RiskScore[] {
  return DISTRICTS.map((d) => {
    const rng = mulberry32(hashStr("risk-" + d.id));
    const env = stations.find((s) => s.districtId === d.id);
    const segs = segments.filter((s) => s.districtId === d.id);
    const incs = incidents.filter((i) => i.districtId === d.id);
    const avgCong =
      segs.reduce((a, s) => a + s.congestionIndex, 0) / (segs.length || 1);
    const heat = env ? (env.temperatureC - 30) / 15 : 0.3;
    const crowdLoad = d.population / 240000;

    const floodRisk = Math.round(
      Math.min(100, 18 + liveWave(d.id, now, 800, 12) + rng() * 18 + heat * 8)
    );
    const fireRisk = Math.round(
      Math.min(100, 22 + heat * 35 + (env ? env.aqi / 8 : 8) + rng() * 12)
    );
    const crowdRisk = Math.round(
      Math.min(100, 25 + crowdLoad * 40 + avgCong * 25 + incs.length * 4)
    );
    const overall = Math.round(floodRisk * 0.3 + fireRisk * 0.3 + crowdRisk * 0.4);

    const drivers: string[] = [];
    if (heat > 0.5) drivers.push("High ambient temperature");
    if (avgCong > 0.5) drivers.push("Sustained traffic congestion");
    if (crowdLoad > 0.6) drivers.push("Elevated population density");
    if (env && env.aqi > 120) drivers.push("Degraded air quality");
    if (incs.length > 1) drivers.push(`${incs.length} active incidents`);
    if (drivers.length === 0) drivers.push("Nominal — within safe operating band");

    return { districtId: d.id, floodRisk, fireRisk, crowdRisk, overall, drivers };
  });
}

// ── Alerts derived from telemetry ─────────────────────────────────────────────
export function deriveAlerts(
  bins: WasteBin[],
  segments: TrafficSegment[],
  stations: EnvironmentStation[],
  incidents: Incident[],
  now = new Date()
): CityAlert[] {
  const alerts: CityAlert[] = [];

  bins
    .filter((b) => b.status === "critical")
    .slice(0, 6)
    .forEach((b) =>
      alerts.push({
        id: `al-w-${b.id}`,
        module: "waste",
        severity: "high",
        title: "Bin near capacity",
        message: `${b.code} at ${b.fillLevel}% — collection recommended within ${b.hoursUntilFull}h.`,
        districtId: b.districtId,
        createdAt: new Date(now.getTime() - Math.random() * 6e5).toISOString(),
        acknowledged: false,
      })
    );

  segments
    .filter((s) => s.status === "jam")
    .slice(0, 5)
    .forEach((s) =>
      alerts.push({
        id: `al-t-${s.id}`,
        module: "transport",
        severity: "medium",
        title: "Severe congestion",
        message: `${s.name} at ${Math.round(s.congestionIndex * 100)}% congestion (${s.speedKmh} km/h).`,
        districtId: s.districtId,
        createdAt: new Date(now.getTime() - Math.random() * 6e5).toISOString(),
        acknowledged: false,
      })
    );

  stations
    .filter((s) => s.status === "unhealthy" || s.status === "hazardous")
    .forEach((s) =>
      alerts.push({
        id: `al-e-${s.id}`,
        module: "environment",
        severity: s.status === "hazardous" ? "critical" : "high",
        title: "Air quality degraded",
        message: `${s.name} AQI ${s.aqi} (${s.status}). Sensitive groups advised.`,
        districtId: s.districtId,
        createdAt: new Date(now.getTime() - Math.random() * 6e5).toISOString(),
        acknowledged: false,
      })
    );

  incidents
    .filter((i) => i.severity === "critical" || i.severity === "high")
    .slice(0, 6)
    .forEach((i) =>
      alerts.push({
        id: `al-i-${i.id}`,
        module: "emergency",
        severity: i.severity,
        title: i.title,
        message: `${i.detail} (${Math.round(i.aiConfidence * 100)}% AI confidence).`,
        districtId: i.districtId,
        createdAt: i.reportedAt,
        acknowledged: false,
      })
    );

  return alerts
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 18);
}

// ── AI recommendations (Explainable AI) ───────────────────────────────────────
export function generateRecommendations(
  bins: WasteBin[],
  segments: TrafficSegment[],
  stations: EnvironmentStation[],
  risk: RiskScore[]
): AiRecommendation[] {
  const recs: AiRecommendation[] = [];

  const criticalBins = bins.filter((b) => b.fillLevel > 80).length;
  if (criticalBins > 0) {
    recs.push({
      id: "rec-waste-1",
      module: "waste",
      title: `Dispatch optimized route for ${criticalBins} high-fill bins`,
      rationale:
        "Forecast model predicts overflow within 4h for clustered bins in 2 districts. Consolidating into one priority route minimizes travel.",
      impact: `Avoids ${criticalBins} overflow events · cuts collection distance ~31%`,
      confidence: 0.91,
      estimatedSavings: 4200 * criticalBins,
      priority: "high",
    });
  }

  const jam = segments.filter((s) => s.status === "jam");
  if (jam.length > 0) {
    recs.push({
      id: "rec-transport-1",
      module: "transport",
      title: `Re-time signals on ${jam.length} congested corridors`,
      rationale:
        "Congestion index trending above 0.78 with rising inflow. Adaptive signal timing + reroute messaging reduces dwell.",
      impact: "Projected −18% average delay on affected corridors",
      confidence: 0.84,
      priority: "medium",
    });
  }

  const badAir = stations.filter((s) => s.aqi > 130);
  if (badAir.length > 0) {
    recs.push({
      id: "rec-env-1",
      module: "environment",
      title: `Issue air-quality advisory for ${badAir.length} zones`,
      rationale:
        "PM2.5 and AQI exceeded sensitive-group thresholds with stagnant dispersion conditions.",
      impact: "Protects vulnerable population · pre-positions misting units",
      confidence: 0.88,
      priority: "high",
    });
  }

  const topRisk = [...risk].sort((a, b) => b.overall - a.overall)[0];
  if (topRisk && topRisk.overall > 55) {
    recs.push({
      id: "rec-emergency-1",
      module: "emergency",
      title: `Pre-stage response units in highest-risk district`,
      rationale: `Composite risk ${topRisk.overall}/100 driven by: ${topRisk.drivers.slice(0, 2).join(", ")}. Forward-deployment cuts response time.`,
      impact: "Projected −40% ETA for next critical incident",
      confidence: 0.86,
      priority: "high",
    });
  }

  return recs;
}

// ── KPI aggregation ───────────────────────────────────────────────────────────
function kpi(
  label: string,
  value: number,
  unit: string,
  trend: Kpi["trend"],
  changePct: number
): Kpi {
  return { label, value, unit, trend, changePct };
}

export function buildKpis(
  bins: WasteBin[],
  segments: TrafficSegment[],
  stations: EnvironmentStation[],
  incidents: Incident[],
  risk: RiskScore[]
): CitySnapshot["kpis"] {
  const avgFill = bins.reduce((a, b) => a + b.fillLevel, 0) / bins.length;
  const criticalBins = bins.filter((b) => b.status === "critical").length;
  const avgSpeed = segments.reduce((a, s) => a + s.speedKmh, 0) / segments.length;
  const avgCong =
    segments.reduce((a, s) => a + s.congestionIndex, 0) / segments.length;
  const avgAqi = stations.reduce((a, s) => a + s.aqi, 0) / stations.length;
  const avgNoise = stations.reduce((a, s) => a + s.noiseDb, 0) / stations.length;
  const activeInc = incidents.filter((i) => i.status !== "resolved").length;
  const avgRisk = risk.reduce((a, r) => a + r.overall, 0) / risk.length;
  const healthScore = Math.round(
    100 -
      (avgFill * 0.15 + avgCong * 100 * 0.25 + avgAqi * 0.15 + avgRisk * 0.45) / 2
  );

  return {
    overall: [
      kpi("City Health Index", Math.max(0, healthScore), "/100", "up", 2.4),
      kpi("Active Sensors", bins.length + segments.length + stations.length, "", "up", 1.1),
      kpi("Active Incidents", activeInc, "", activeInc > 4 ? "up" : "down", -8),
      kpi("Avg Composite Risk", Math.round(avgRisk), "/100", "down", -3.2),
    ],
    waste: [
      kpi("Avg Fill Level", +avgFill.toFixed(1), "%", "up", 4.1),
      kpi("Critical Bins", criticalBins, "", "up", 12),
      kpi("Fleet Efficiency", 88, "%", "up", 6.5),
      kpi("Monthly Savings", 182000, "SAR", "up", 9.3),
    ],
    transport: [
      kpi("Avg Speed", Math.round(avgSpeed), "km/h", avgSpeed > 40 ? "up" : "down", -5),
      kpi("Congestion Index", +(avgCong * 100).toFixed(0), "%", "up", 3.8),
      kpi("Segments Monitored", segments.length, "", "flat", 0),
      kpi("Flow", Math.round(segments.reduce((a, s) => a + s.vehiclesPerHour, 0) / 1000), "k veh/h", "up", 2.2),
    ],
    environment: [
      kpi("Avg AQI", Math.round(avgAqi), "", avgAqi > 100 ? "up" : "down", -4),
      kpi("Avg Noise", Math.round(avgNoise), "dB", "flat", 0.5),
      kpi("Stations Online", stations.length, "", "flat", 0),
      kpi("CO₂ Avg", Math.round(stations.reduce((a, s) => a + s.co2, 0) / stations.length), "ppm", "down", -2.1),
    ],
    emergency: [
      kpi("Active Incidents", activeInc, "", "down", -8),
      kpi("Avg Response ETA", Math.round(incidents.filter(i => i.etaMin>0).reduce((a, i) => a + i.etaMin, 0) / Math.max(1, incidents.filter(i=>i.etaMin>0).length)), "min", "down", -14),
      kpi("Peak District Risk", Math.round(Math.max(...risk.map((r) => r.overall))), "/100", "up", 5),
      kpi("AI Detection Rate", 96, "%", "up", 1.8),
    ],
  };
}

// ── Full snapshot ─────────────────────────────────────────────────────────────
export function buildSnapshot(now = new Date()): CitySnapshot {
  const bins = generateBins(now);
  const segments = generateSegments(now);
  const stations = generateStations(now);
  const incidents = generateIncidents(now);
  const risk = generateRisk(stations, segments, incidents, now);
  const alerts = deriveAlerts(bins, segments, stations, incidents, now);
  const recommendations = generateRecommendations(bins, segments, stations, risk);
  const kpis = buildKpis(bins, segments, stations, incidents, risk);

  return {
    timestamp: now.toISOString(),
    bins,
    segments,
    stations,
    incidents,
    alerts,
    recommendations,
    risk,
    kpis,
  };
}
