"use client";

import * as React from "react";
import { TrafficCone, Gauge, Car, Activity, Navigation } from "lucide-react";
import { useLiveData } from "@/hooks/use-live-data";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { LoadingState } from "@/components/dashboard/loading-state";
import { CityMap, type MapPoint } from "@/components/charts/city-map";
import { TrendArea, BarSeries } from "@/components/charts/charts";
import { Heatmap, type HeatCell } from "@/components/charts/heatmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildForecast } from "@/lib/ml";
import { DISTRICTS, districtById } from "@/lib/districts";
import { cn } from "@/lib/utils";

function congColor(idx: number) {
  if (idx >= 0.78) return "bg-rose-500";
  if (idx >= 0.55) return "bg-amber-400";
  if (idx >= 0.32) return "bg-sky-400";
  return "bg-emerald-400";
}

const HOURS = ["00", "03", "06", "09", "12", "15", "18", "21"];

export default function TransportPage() {
  const { snapshot } = useLiveData();

  const forecast = React.useMemo(
    () => buildForecast("Congestion index", "%", { base: 52, amplitude: 26, noise: 7, horizon: 24 }),
    []
  );

  if (!snapshot) return <LoadingState label="Connecting to traffic sensor grid…" />;

  const { segments, kpis } = snapshot;
  const sorted = [...segments].sort((a, b) => b.congestionIndex - a.congestionIndex);

  const mapPoints: MapPoint[] = segments.map((s) => ({
    id: s.id,
    location: s.from,
    color: congColor(s.congestionIndex),
    size: s.status === "jam" ? 13 : 9,
    pulse: s.status === "jam",
    label: `${s.name} · ${Math.round(s.congestionIndex * 100)}%`,
  }));

  // Heatmap: districts x time-of-day congestion (seeded by current congestion).
  const heatCells: HeatCell[] = [];
  DISTRICTS.forEach((d) => {
    const segs = segments.filter((s) => s.districtId === d.id);
    const base = segs.reduce((a, s) => a + s.congestionIndex, 0) / (segs.length || 1);
    HOURS.forEach((h, hi) => {
      const hour = parseInt(h, 10);
      const diurnal = 0.5 + 0.5 * Math.sin(((hour - 6) / 24) * Math.PI * 2);
      const v = Math.min(1, Math.max(0.05, base * (0.5 + diurnal)));
      heatCells.push({ row: d.name, col: h, value: v, raw: `${Math.round(v * 100)}%` });
    });
  });

  const byDistrictSpeed = DISTRICTS.map((d) => {
    const segs = segments.filter((s) => s.districtId === d.id);
    return {
      name: d.name,
      value: Math.round(segs.reduce((a, s) => a + s.speedKmh, 0) / (segs.length || 1)),
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart Transportation"
        description="Traffic forecasting · congestion detection · mobility heatmaps"
        icon={TrafficCone}
        accent="text-amber-400"
      >
        <Badge variant={sorted[0]?.status === "jam" ? "destructive" : "warning"}>
          {segments.filter((s) => s.status === "jam").length} corridors jammed
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.transport.map((k, i) => (
          <KpiCard key={k.label} kpi={k} index={i} accent="text-amber-400" icon={[Gauge, Activity, Navigation, Car][i]} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Live Traffic Network</CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Free</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Heavy</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> Jam</span>
            </div>
          </CardHeader>
          <CardContent>
            <CityMap points={mapPoints} labels={DISTRICTS.map((d) => ({ location: d.center, text: d.name }))} />
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">Most Congested Corridors</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-3 overflow-y-auto scrollbar-thin" style={{ maxHeight: 360 }}>
            {sorted.slice(0, 9).map((s) => (
              <div key={s.id} className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-medium">{s.name}</span>
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", congColor(s.congestionIndex))} />
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{districtById(s.districtId)?.name}</span>
                  <span>{s.speedKmh} km/h · {Math.round(s.congestionIndex * 100)}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Congestion Forecast (24h)</CardTitle>
            <Badge variant="secondary">MAPE {forecast.mape}%</Badge>
          </CardHeader>
          <CardContent>
            <TrendArea data={[...forecast.history, ...forecast.forecast]} color="hsl(38 92% 55%)" height={260} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avg Speed by District</CardTitle>
          </CardHeader>
          <CardContent>
            <BarSeries
              data={byDistrictSpeed}
              height={260}
              colorByValue={(v) => (v < 25 ? "hsl(0 72% 51%)" : v < 45 ? "hsl(38 92% 50%)" : "hsl(152 69% 45%)")}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mobility Heatmap · Congestion by District × Hour</CardTitle>
        </CardHeader>
        <CardContent>
          <Heatmap rows={DISTRICTS.map((d) => d.name)} cols={HOURS} cells={heatCells} />
        </CardContent>
      </Card>
    </div>
  );
}
