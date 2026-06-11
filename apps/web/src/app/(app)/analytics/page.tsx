"use client";

import * as React from "react";
import { LineChart, TrendingUp, FileText, Activity, Download } from "lucide-react";
import { useLiveData } from "@/hooks/use-live-data";
import { PageHeader } from "@/components/dashboard/page-header";
import { LoadingState } from "@/components/dashboard/loading-state";
import { ForecastChart, BarSeries, MultiLine } from "@/components/charts/charts";
import { Heatmap, type HeatCell } from "@/components/charts/heatmap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildForecast } from "@/lib/ml";
import { DISTRICTS } from "@/lib/districts";

const DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

export default function AnalyticsPage() {
  const { snapshot } = useLiveData();

  const forecasts = React.useMemo(
    () => ({
      waste: buildForecast("Waste fill", "%", { base: 58, amplitude: 20, noise: 7, horizon: 24 }),
      traffic: buildForecast("Congestion", "%", { base: 50, amplitude: 26, noise: 8, horizon: 24 }),
      aqi: buildForecast("AQI", "", { base: 92, amplitude: 34, noise: 11, horizon: 24 }),
      energy: buildForecast("Energy demand", "MW", { base: 420, amplitude: 90, noise: 28, growth: 0.4, horizon: 24 }),
    }),
    []
  );

  const weekTrend = React.useMemo(() => {
    const w = buildForecast("w", "", { base: 60, amplitude: 12, noise: 6, historyPoints: 7, stepHours: 24 });
    const t = buildForecast("t", "", { base: 52, amplitude: 16, noise: 7, historyPoints: 7, stepHours: 24 });
    const a = buildForecast("a", "", { base: 95, amplitude: 25, noise: 10, historyPoints: 7, stepHours: 24 });
    return DAYS.map((d, i) => ({
      t: d,
      Waste: Math.round(w.history[i]?.value ?? 0),
      Traffic: Math.round(t.history[i]?.value ?? 0),
      AQI: Math.round(a.history[i]?.value ?? 0),
    }));
  }, []);

  if (!snapshot) return <LoadingState label="Aggregating historical analytics…" />;

  // Activity heatmap: district x weekday composite load.
  const heatCells: HeatCell[] = [];
  DISTRICTS.forEach((d, di) => {
    DAYS.forEach((day, dayi) => {
      const v = Math.min(1, Math.max(0.1, 0.4 + 0.4 * Math.sin((di + dayi) / 2) + (dayi === 4 ? 0.25 : 0)));
      heatCells.push({ row: d.name, col: day, value: v, raw: `${Math.round(v * 100)}` });
    });
  });

  const executive = [
    { label: "City Health Index", value: snapshot.kpis.overall[0]?.value, unit: "/100", note: "Composite of all modules, trending positive." },
    { label: "Predicted overflow events avoided", value: 41, unit: "", note: "Waste forecasting + route optimization (last 30d)." },
    { label: "Avg incident response improvement", value: 14, unit: "%", note: "Driven by pre-staging recommendations." },
    { label: "Estimated operational savings", value: 182, unit: "K SAR/mo", note: "Fleet routing + predictive maintenance." },
  ];

  const reports = [
    { title: "Executive City Brief", desc: "Weekly summary for city leadership", period: "Week 24 · 2026" },
    { title: "Waste Operations Report", desc: "Fleet, routes & cost analysis", period: "June 2026" },
    { title: "Mobility & Congestion Report", desc: "Corridor performance & forecasts", period: "June 2026" },
    { title: "Environmental Compliance Report", desc: "AQI, noise & emissions audit", period: "Q2 2026" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics Center"
        description="Historical analytics · forecast dashboards · trend analysis · executive reports"
        icon={LineChart}
        accent="text-violet-400"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4" /> Export
        </Button>
      </PageHeader>

      {/* Executive summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {executive.map((e, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{e.label}</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">
                {e.value}
                <span className="text-base text-muted-foreground">{e.unit}</span>
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">{e.note}</p>
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="forecasts">
        <TabsList>
          <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmaps</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="forecasts">
          <div className="grid gap-4 lg:grid-cols-2">
            {[
              { title: "Waste Fill Level", s: forecasts.waste },
              { title: "Traffic Congestion", s: forecasts.traffic },
              { title: "Air Quality Index", s: forecasts.aqi },
              { title: "Energy Demand", s: forecasts.energy },
            ].map((f) => (
              <Card key={f.title}>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{f.title}</CardTitle>
                    <CardDescription>{f.s.model}</CardDescription>
                  </div>
                  <Badge variant="secondary">MAPE {f.s.mape}%</Badge>
                </CardHeader>
                <CardContent>
                  <ForecastChart series={f.s} height={240} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-violet-400" /> 7-Day Multi-Metric Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MultiLine
                  data={weekTrend}
                  height={300}
                  lines={[
                    { key: "Waste", color: "hsl(152 69% 45%)", name: "Waste %" },
                    { key: "Traffic", color: "hsl(38 92% 55%)", name: "Traffic %" },
                    { key: "AQI", color: "hsl(199 89% 60%)", name: "AQI" },
                  ]}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sensor Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <BarSeries
                  data={[
                    { name: "Waste", value: snapshot.bins.length },
                    { name: "Traffic", value: snapshot.segments.length },
                    { name: "Env", value: snapshot.stations.length },
                  ]}
                  height={260}
                  color="hsl(265 89% 65%)"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="heatmap">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-violet-400" /> City Activity Load · District × Weekday
              </CardTitle>
              <CardDescription>Normalized composite load across all monitored systems</CardDescription>
            </CardHeader>
            <CardContent>
              <Heatmap rows={DISTRICTS.map((d) => d.name)} cols={DAYS} cells={heatCells} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid gap-4 sm:grid-cols-2">
            {reports.map((r) => (
              <Card key={r.title} className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-violet-400/15 text-violet-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{r.period}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" /> PDF
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
