"use client";

import * as React from "react";
import {
  Trash2,
  Truck,
  AlertTriangle,
  Battery,
  Clock,
  Recycle,
  Route as RouteIcon,
} from "lucide-react";
import { useLiveData } from "@/hooks/use-live-data";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { LoadingState } from "@/components/dashboard/loading-state";
import { CityMap, type MapPoint } from "@/components/charts/city-map";
import { TrendArea, BarSeries } from "@/components/charts/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { buildCollectionRoutes } from "@/lib/routing";
import { buildForecast } from "@/lib/ml";
import { districtById, DISTRICTS } from "@/lib/districts";
import { cn, formatCurrency, relativeTime } from "@/lib/utils";

function fillColor(level: number) {
  if (level >= 90) return "bg-rose-500";
  if (level >= 72) return "bg-amber-400";
  if (level >= 45) return "bg-sky-400";
  return "bg-emerald-400";
}
function fillIndicator(level: number) {
  if (level >= 90) return "bg-rose-500";
  if (level >= 72) return "bg-amber-400";
  return "bg-emerald-400";
}

export default function WastePage() {
  const { snapshot } = useLiveData();

  const forecast = React.useMemo(
    () => buildForecast("Avg fill level", "%", { base: 58, amplitude: 22, noise: 8, growth: 0.05, horizon: 24 }),
    []
  );
  const costForecast = React.useMemo(
    () => buildForecast("Collection cost", "SAR/day", { base: 24000, amplitude: 6000, noise: 2200, growth: -40, horizon: 14, stepHours: 24 }),
    []
  );

  if (!snapshot) return <LoadingState label="Connecting to bin sensor network…" />;

  const { bins, kpis } = snapshot;
  const routes = buildCollectionRoutes(bins);
  const critical = bins.filter((b) => b.status === "critical");
  const sortedBins = [...bins].sort((a, b) => b.fillLevel - a.fillLevel);

  const mapPoints: MapPoint[] = bins.map((b) => ({
    id: b.id,
    location: b.location,
    color: fillColor(b.fillLevel),
    size: b.status === "critical" ? 13 : 9,
    pulse: b.status === "critical",
    label: `${b.code} · ${b.fillLevel}%`,
  }));

  const byDistrict = DISTRICTS.map((d) => {
    const ds = bins.filter((b) => b.districtId === d.id);
    return {
      name: d.name,
      value: +(ds.reduce((a, b) => a + b.fillLevel, 0) / (ds.length || 1)).toFixed(0),
    };
  });

  const avgSavings = routes.length
    ? Math.round(routes.reduce((a, r) => a + r.savingsPct, 0) / routes.length)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart Waste Management"
        description="Real-time bin monitoring · fill-level prediction · route optimization"
        icon={Trash2}
        accent="text-emerald-400"
      >
        <Badge variant={critical.length ? "destructive" : "success"}>
          {critical.length} bins critical
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.waste.map((k, i) => (
          <KpiCard key={k.label} kpi={k} index={i} accent="text-emerald-400" icon={[Recycle, AlertTriangle, Truck, Recycle][i]} />
        ))}
      </div>

      {/* Map + critical list */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Live Bin Network · Makkah</CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> OK</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Warning</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> Critical</span>
            </div>
          </CardHeader>
          <CardContent>
            <CityMap
              points={mapPoints}
              labels={DISTRICTS.map((d) => ({ location: d.center, text: d.name }))}
            />
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-400" /> Priority Bins
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-3 overflow-y-auto scrollbar-thin" style={{ maxHeight: 360 }}>
            {sortedBins.slice(0, 9).map((b) => (
              <div key={b.id} className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs">{b.code}</span>
                  <span className={cn("text-xs font-semibold", b.fillLevel >= 90 ? "text-rose-400" : b.fillLevel >= 72 ? "text-amber-400" : "text-emerald-400")}>
                    {b.fillLevel}%
                  </span>
                </div>
                <Progress value={b.fillLevel} className="mt-2 h-1.5" indicatorClassName={fillIndicator(b.fillLevel)} />
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{districtById(b.districtId)?.name}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {b.hoursUntilFull > 0 ? `full in ${b.hoursUntilFull}h` : "FULL"}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Forecast + district bars */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Fill-Level Forecast (24h)</CardTitle>
            <Badge variant="secondary">MAPE {forecast.mape}% · {forecast.model}</Badge>
          </CardHeader>
          <CardContent>
            <TrendArea data={[...forecast.history, ...forecast.forecast]} color="hsl(152 69% 45%)" height={260} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avg Fill by District</CardTitle>
          </CardHeader>
          <CardContent>
            <BarSeries
              data={byDistrict}
              height={260}
              colorByValue={(v) => (v >= 72 ? "hsl(0 72% 51%)" : v >= 50 ? "hsl(38 92% 50%)" : "hsl(152 69% 45%)")}
            />
          </CardContent>
        </Card>
      </div>

      {/* Route optimization + cost analytics */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <RouteIcon className="h-4 w-4 text-emerald-400" /> AI-Optimized Collection Routes
            </CardTitle>
            <Badge variant="success">~{avgSavings}% distance saved</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {routes.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center gap-4 rounded-lg border border-border/60 bg-secondary/30 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-400">
                  <Truck className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.binIds.length} stops · {r.distanceKm} km · ~{r.durationMin} min
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="success">−{r.savingsPct}%</Badge>
                  <p className="mt-1 text-[10px] text-muted-foreground">priority {r.priorityScore}</p>
                </div>
              </div>
            ))}
            {routes.length === 0 && (
              <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                No collection routes needed — network within capacity.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Battery className="h-4 w-4 text-emerald-400" /> Cost Reduction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 rounded-lg bg-success/10 p-3">
              <p className="text-xs text-muted-foreground">Projected monthly savings</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(182000)}</p>
            </div>
            <TrendArea data={[...costForecast.history, ...costForecast.forecast]} color="hsl(152 69% 45%)" height={150} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
