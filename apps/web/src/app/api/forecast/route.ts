import { NextRequest, NextResponse } from "next/server";
import { buildForecast } from "@/lib/ml";

export const dynamic = "force-dynamic";

const PRESETS: Record<string, Parameters<typeof buildForecast>[2] & { unit: string }> = {
  waste: { base: 58, amplitude: 20, noise: 7, horizon: 24, unit: "%" },
  traffic: { base: 50, amplitude: 26, noise: 8, horizon: 24, unit: "%" },
  aqi: { base: 92, amplitude: 34, noise: 11, horizon: 24, unit: "" },
  energy: { base: 420, amplitude: 90, noise: 28, growth: 0.4, horizon: 24, unit: "MW" },
};

// Try the Python ML microservice first; fall back to the in-process forecaster.
async function fromMlService(metric: string, horizon: number) {
  const base = process.env.ML_SERVICE_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base}/forecast`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ metric, horizon }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Normalize snake_case → camelCase used by the frontend chart components.
    return {
      metric: data.metric,
      unit: data.unit,
      model: data.model,
      mape: data.mape,
      history: data.history,
      forecast: data.forecast,
      confidenceLow: data.confidence_low,
      confidenceHigh: data.confidence_high,
      source: "ml-service",
    };
  } catch {
    return null;
  }
}

// GET /api/forecast?metric=waste — time-series forecast bundle.
export async function GET(req: NextRequest) {
  const metric = req.nextUrl.searchParams.get("metric") ?? "waste";
  const horizon = Number(req.nextUrl.searchParams.get("horizon") ?? 24);

  const ml = await fromMlService(metric, horizon);
  if (ml) {
    return NextResponse.json(ml, { headers: { "Cache-Control": "no-store" } });
  }

  const preset = PRESETS[metric] ?? PRESETS.waste;
  const { unit, ...opts } = preset;
  const series = { ...buildForecast(metric, unit, { ...opts, horizon }), source: "in-process" };
  return NextResponse.json(series, { headers: { "Cache-Control": "no-store" } });
}
