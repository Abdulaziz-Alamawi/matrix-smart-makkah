"use client";

import * as React from "react";
import { Wind, Volume2, Thermometer, Droplets, Gauge } from "lucide-react";
import { useLiveData } from "@/hooks/use-live-data";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { LoadingState } from "@/components/dashboard/loading-state";
import { CityMap, type MapPoint } from "@/components/charts/city-map";
import { MultiLine, BarSeries, RadialGauge } from "@/components/charts/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildForecast } from "@/lib/ml";
import { DISTRICTS } from "@/lib/districts";
import { cn } from "@/lib/utils";
import type { EnvironmentStation } from "@/lib/types";

function aqiColor(aqi: number) {
  if (aqi > 200) return "bg-rose-600";
  if (aqi > 150) return "bg-rose-500";
  if (aqi > 100) return "bg-amber-400";
  if (aqi > 50) return "bg-sky-400";
  return "bg-emerald-400";
}
function aqiLabel(s: EnvironmentStation["status"]) {
  return { good: "Good", moderate: "Moderate", unhealthy: "Unhealthy", hazardous: "Hazardous" }[s];
}

export default function EnvironmentPage() {
  const { snapshot } = useLiveData();

  const trends = React.useMemo(() => {
    const aqi = buildForecast("AQI", "", { base: 95, amplitude: 35, noise: 12, horizon: 12 });
    const noise = buildForecast("Noise", "dB", { base: 62, amplitude: 14, noise: 5, horizon: 12 });
    const temp = buildForecast("Temp", "°C", { base: 38, amplitude: 7, noise: 2, horizon: 12 });
    const data = aqi.history.map((h, i) => ({
      t: h.t,
      AQI: h.value,
      Noise: noise.history[i]?.value,
      Temp: temp.history[i]?.value,
    }));
    return { data, mape: aqi.mape };
  }, []);

  if (!snapshot) return <LoadingState label="Connecting to environmental sensors…" />;

  const { stations, kpis } = snapshot;
  const worst = [...stations].sort((a, b) => b.aqi - a.aqi);
  const avgAqi = Math.round(stations.reduce((a, s) => a + s.aqi, 0) / stations.length);

  const mapPoints: MapPoint[] = stations.map((s) => ({
    id: s.id,
    location: s.location,
    color: aqiColor(s.aqi),
    size: 14,
    pulse: s.status === "unhealthy" || s.status === "hazardous",
    label: `${s.name} · AQI ${s.aqi}`,
  }));

  const noiseBars = stations.map((s) => ({ name: DISTRICTS.find((d) => d.id === s.districtId)?.name ?? s.districtId, value: s.noiseDb }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart Environment"
        description="Air quality · noise · temperature monitoring with environmental alerts"
        icon={Wind}
        accent="text-sky-400"
      >
        <Badge variant={avgAqi > 150 ? "destructive" : avgAqi > 100 ? "warning" : "success"}>
          City AQI {avgAqi}
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.environment.map((k, i) => (
          <KpiCard key={k.label} kpi={k} index={i} accent="text-sky-400" icon={[Wind, Volume2, Gauge, Droplets][i]} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Air Quality Stations</CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Good</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Moderate</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> Unhealthy</span>
            </div>
          </CardHeader>
          <CardContent>
            <CityMap points={mapPoints} labels={DISTRICTS.map((d) => ({ location: d.center, text: d.name }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">City Air Quality Index</CardTitle>
          </CardHeader>
          <CardContent>
            <RadialGauge value={avgAqi} label="AQI" color={avgAqi > 150 ? "hsl(0 72% 51%)" : avgAqi > 100 ? "hsl(38 92% 50%)" : "hsl(152 69% 45%)"} height={200} />
            <div className="mt-2 space-y-2">
              {worst.slice(0, 4).map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2 text-xs">
                  <span className="truncate">{s.name}</span>
                  <span className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", aqiColor(s.aqi))} />
                    {s.aqi} · {aqiLabel(s.status)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">24h Environmental Trends</CardTitle>
            <Badge variant="secondary">AQI MAPE {trends.mape}%</Badge>
          </CardHeader>
          <CardContent>
            <MultiLine
              data={trends.data}
              height={260}
              lines={[
                { key: "AQI", color: "hsl(199 89% 60%)", name: "AQI" },
                { key: "Noise", color: "hsl(265 89% 70%)", name: "Noise dB" },
                { key: "Temp", color: "hsl(38 92% 55%)", name: "Temp °C" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Volume2 className="h-4 w-4 text-sky-400" /> Noise Levels by District (dB)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarSeries
              data={noiseBars}
              height={260}
              colorByValue={(v) => (v > 70 ? "hsl(0 72% 51%)" : v > 60 ? "hsl(38 92% 50%)" : "hsl(199 89% 55%)")}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Station Telemetry</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Station</th>
                <th className="pb-2 pr-4 font-medium">AQI</th>
                <th className="pb-2 pr-4 font-medium">PM2.5</th>
                <th className="pb-2 pr-4 font-medium">PM10</th>
                <th className="pb-2 pr-4 font-medium">CO₂</th>
                <th className="pb-2 pr-4 font-medium">Noise</th>
                <th className="pb-2 pr-4 font-medium">Temp</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((s) => (
                <tr key={s.id} className="border-b border-border/40">
                  <td className="py-2 pr-4 font-medium">{s.name}</td>
                  <td className="py-2 pr-4 tabular-nums">{s.aqi}</td>
                  <td className="py-2 pr-4 tabular-nums">{s.pm25}</td>
                  <td className="py-2 pr-4 tabular-nums">{s.pm10}</td>
                  <td className="py-2 pr-4 tabular-nums">{s.co2}</td>
                  <td className="py-2 pr-4 tabular-nums">{s.noiseDb} dB</td>
                  <td className="py-2 pr-4 tabular-nums">{s.temperatureC}°C</td>
                  <td className="py-2">
                    <span className={cn("inline-block h-2 w-2 rounded-full", aqiColor(s.aqi))} /> {aqiLabel(s.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
