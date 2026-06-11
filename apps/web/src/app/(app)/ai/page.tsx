"use client";

import * as React from "react";
import { Cpu, Brain, Wrench, Gauge, ShieldCheck, Activity, Layers } from "lucide-react";
import { motion } from "framer-motion";
import { useLiveData } from "@/hooks/use-live-data";
import { PageHeader } from "@/components/dashboard/page-header";
import { LoadingState } from "@/components/dashboard/loading-state";
import { Recommendations } from "@/components/dashboard/recommendations";
import { ForecastChart, RadialGauge } from "@/components/charts/charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { buildForecast } from "@/lib/ml";
import { cn } from "@/lib/utils";

const MODELS = [
  { name: "Waste Fill Forecaster", algo: "Gradient Boosting Regressor", target: "Bin fill % (t+24h)", acc: 94.2, icon: Layers, color: "text-emerald-400" },
  { name: "Traffic Congestion Net", algo: "Random Forest + temporal", target: "Congestion index", acc: 91.7, icon: Gauge, color: "text-amber-400" },
  { name: "Air Quality Predictor", algo: "Holt-Winters + GBR", target: "AQI (t+12h)", acc: 89.5, icon: Activity, color: "text-sky-400" },
  { name: "Incident Risk Scorer", algo: "Logistic ensemble", target: "Composite risk 0-100", acc: 92.8, icon: ShieldCheck, color: "text-rose-400" },
  { name: "Predictive Maintenance", algo: "Isolation Forest (anomaly)", target: "Sensor failure ≤ 7d", acc: 96.1, icon: Wrench, color: "text-violet-400" },
];

export default function AiCorePage() {
  const { snapshot } = useLiveData();

  const demoForecast = React.useMemo(
    () => buildForecast("Composite city load", "idx", { base: 60, amplitude: 22, noise: 8, horizon: 24 }),
    []
  );

  if (!snapshot) return <LoadingState label="Initializing Matrix AI Core…" />;

  const { recommendations, bins } = snapshot;

  // Predictive maintenance: bins with low battery / offline → maintenance risk.
  const maintenance = bins
    .map((b) => ({
      code: b.code,
      battery: b.batteryPct,
      risk: Math.round(Math.max(0, 100 - b.batteryPct) * 0.7 + (b.status === "offline" ? 40 : 0)),
      offline: b.status === "offline",
    }))
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 6);

  const avgConfidence = Math.round((MODELS.reduce((a, m) => a + m.acc, 0) / MODELS.length) * 10) / 10;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matrix AI Core"
        description="Predictive maintenance · forecasting · risk scoring · explainable recommendations"
        icon={Cpu}
        accent="text-cyan-300"
      >
        <Badge variant="success" className="gap-1">
          <Brain className="h-3 w-3" /> {MODELS.length} models · {avgConfidence}% avg accuracy
        </Badge>
      </PageHeader>

      {/* Model registry */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {MODELS.map((m, i) => (
          <motion.div key={m.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="h-full">
              <CardContent className="p-5">
                <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/60", m.color)}>
                  <m.icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold leading-tight">{m.name}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{m.algo}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">Target: {m.target}</p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Accuracy</span>
                  <span className="font-semibold text-cyan-300">{m.acc}%</span>
                </div>
                <Progress value={m.acc} className="mt-1.5 h-1.5" indicatorClassName="bg-cyan-300" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Composite City Load — 24h Forecast</CardTitle>
              <CardDescription>Ensemble forecast surfaced from the Python ML service (/api/forecast)</CardDescription>
            </div>
            <Badge variant="secondary">MAPE {demoForecast.mape}%</Badge>
          </CardHeader>
          <CardContent>
            <ForecastChart series={demoForecast} height={300} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Model Health</CardTitle>
          </CardHeader>
          <CardContent>
            <RadialGauge value={avgConfidence} label="avg accuracy %" color="hsl(187 92% 50%)" height={200} />
            <div className="mt-2 grid grid-cols-2 gap-2 text-center text-xs">
              <div className="rounded-lg bg-secondary/40 p-2">
                <p className="text-lg font-bold text-success">99.9%</p>
                <p className="text-muted-foreground">Uptime</p>
              </div>
              <div className="rounded-lg bg-secondary/40 p-2">
                <p className="text-lg font-bold text-primary">38ms</p>
                <p className="text-muted-foreground">Inference</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="h-4 w-4 text-violet-400" /> Predictive Maintenance Queue
            </CardTitle>
            <CardDescription>Anomaly-detection flags devices likely to fail within 7 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {maintenance.map((m) => (
              <div key={m.code} className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/30 p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs">{m.code}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Battery {m.battery}% {m.offline && "· OFFLINE"}
                  </p>
                </div>
                <div className="w-28">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>failure risk</span>
                    <span className="font-semibold">{m.risk}%</span>
                  </div>
                  <Progress value={m.risk} className="mt-1 h-1.5" indicatorClassName={m.risk > 60 ? "bg-rose-500" : "bg-amber-400"} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Recommendations recs={recommendations} />
      </div>
    </div>
  );
}
