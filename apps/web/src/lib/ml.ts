// ───────────────────────────────────────────────────────────────────────────
// Matrix Smart Makkah — Lightweight in-process ML / forecasting utilities
// Used for instant client/server forecasts & trend analytics. Heavyweight
// training (scikit-learn: GradientBoosting, RandomForest, Holt-Winters) runs in
// the Python ML microservice (services/ml) and is surfaced via /api/forecast.
// Author: Abdulaziz AlAmawi
// ───────────────────────────────────────────────────────────────────────────

import type { ForecastSeries, TimeSeriesPoint } from "./types";

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Ordinary least squares trend line: returns slope + intercept.
export function linearRegression(y: number[]): { slope: number; intercept: number } {
  const n = y.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  const xMean = (n - 1) / 2;
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (y[i] - yMean);
    den += (i - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  return { slope, intercept: yMean - slope * xMean };
}

// Double exponential smoothing (Holt's linear trend) — fast time-series forecast.
export function holtForecast(
  series: number[],
  horizon: number,
  alpha = 0.5,
  beta = 0.3
): number[] {
  if (series.length < 2) {
    const last = series[series.length - 1] ?? 0;
    return Array.from({ length: horizon }, () => last);
  }
  let level = series[0];
  let trend = series[1] - series[0];
  for (let i = 1; i < series.length; i++) {
    const prevLevel = level;
    level = alpha * series[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }
  const out: number[] = [];
  for (let h = 1; h <= horizon; h++) out.push(level + h * trend);
  return out;
}

// Simulate a realistic historical series for a metric with seasonality + noise.
export function syntheticHistory(
  metricSeed: string,
  points: number,
  opts: { base: number; amplitude: number; noise: number; growth?: number }
): number[] {
  const rng = mulberry32(
    [...metricSeed].reduce((a, c) => a + c.charCodeAt(0), 7)
  );
  const out: number[] = [];
  for (let i = 0; i < points; i++) {
    const season = opts.amplitude * Math.sin((i / 24) * Math.PI * 2);
    const weekly = opts.amplitude * 0.4 * Math.sin((i / (24 * 7)) * Math.PI * 2);
    const growth = (opts.growth ?? 0) * i;
    const noise = (rng() - 0.5) * opts.noise;
    out.push(Math.max(0, opts.base + season + weekly + growth + noise));
  }
  return out;
}

function labelFor(stepFromNow: number, stepHours: number): string {
  const d = new Date(Date.now() + stepFromNow * stepHours * 3600 * 1000);
  return d.toISOString();
}

// Build a complete forecast bundle (history + forecast + confidence band).
export function buildForecast(
  metric: string,
  unit: string,
  opts: {
    base: number;
    amplitude: number;
    noise: number;
    growth?: number;
    historyPoints?: number;
    horizon?: number;
    stepHours?: number;
    model?: string;
  }
): ForecastSeries {
  const historyPoints = opts.historyPoints ?? 48;
  const horizon = opts.horizon ?? 24;
  const stepHours = opts.stepHours ?? 1;
  const model = opts.model ?? "Holt linear + seasonal";

  const hist = syntheticHistory(metric, historyPoints, opts);
  const fc = holtForecast(hist, horizon);

  // Seasonal correction so the forecast continues the daily wave.
  const seasonalFc = fc.map((v, i) => {
    const idx = historyPoints + i;
    const season = opts.amplitude * Math.sin((idx / 24) * Math.PI * 2) * 0.7;
    return Math.max(0, v * 0.4 + (opts.base + season) * 0.6);
  });

  const history: TimeSeriesPoint[] = hist.map((value, i) => ({
    t: labelFor(i - historyPoints, stepHours),
    value: +value.toFixed(1),
  }));
  const forecast: TimeSeriesPoint[] = seasonalFc.map((value, i) => ({
    t: labelFor(i + 1, stepHours),
    value: +value.toFixed(1),
    forecast: true,
  }));

  const band = opts.noise * 0.9 + opts.amplitude * 0.2;
  const confidenceLow: TimeSeriesPoint[] = forecast.map((p, i) => ({
    t: p.t,
    value: +(p.value - band * (1 + i / horizon)).toFixed(1),
    forecast: true,
  }));
  const confidenceHigh: TimeSeriesPoint[] = forecast.map((p, i) => ({
    t: p.t,
    value: +(p.value + band * (1 + i / horizon)).toFixed(1),
    forecast: true,
  }));

  // Backtest MAPE: compare 1-step Holt prediction vs actual over the history.
  let apeSum = 0;
  let apeN = 0;
  for (let i = 4; i < hist.length; i++) {
    const pred = holtForecast(hist.slice(0, i), 1)[0];
    if (hist[i] !== 0) {
      apeSum += Math.abs((hist[i] - pred) / hist[i]);
      apeN++;
    }
  }
  const mape = apeN ? +((apeSum / apeN) * 100).toFixed(1) : 0;

  return {
    metric,
    unit,
    history,
    forecast,
    confidenceLow,
    confidenceHigh,
    model,
    mape,
  };
}

// Risk scoring: weighted logistic-style squashing of normalized drivers.
export function riskScore(drivers: { value: number; weight: number }[]): number {
  const z = drivers.reduce((a, d) => a + d.value * d.weight, 0);
  const sig = 1 / (1 + Math.exp(-(z - 0.5) * 4));
  return Math.round(sig * 100);
}
