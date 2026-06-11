"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Gauge,
  Radio,
  ShieldAlert,
  Trash2,
  TrafficCone,
  Wind,
  Cpu,
} from "lucide-react";
import Link from "next/link";
import { useLiveData } from "@/hooks/use-live-data";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AlertsFeed } from "@/components/dashboard/alerts-feed";
import { Recommendations } from "@/components/dashboard/recommendations";
import { LoadingState } from "@/components/dashboard/loading-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DISTRICTS, districtById } from "@/lib/districts";
import { cn } from "@/lib/utils";

const MODULE_META = [
  { key: "waste", label: "Waste Network", icon: Trash2, accent: "text-emerald-400", href: "/waste" },
  { key: "transport", label: "Mobility Grid", icon: TrafficCone, accent: "text-amber-400", href: "/transportation" },
  { key: "environment", label: "Environment", icon: Wind, accent: "text-sky-400", href: "/environment" },
  { key: "emergency", label: "Emergency AI", icon: ShieldAlert, accent: "text-rose-400", href: "/emergency" },
] as const;

function riskColor(v: number) {
  if (v >= 70) return "bg-destructive";
  if (v >= 45) return "bg-warning";
  return "bg-success";
}

export default function CommandCenter() {
  const { snapshot } = useLiveData();
  if (!snapshot) return <LoadingState />;

  const { kpis, alerts, recommendations, risk } = snapshot;

  const moduleHealth = {
    waste: {
      online: snapshot.bins.filter((b) => b.status !== "offline").length,
      total: snapshot.bins.length,
      critical: snapshot.bins.filter((b) => b.status === "critical").length,
    },
    transport: {
      online: snapshot.segments.length,
      total: snapshot.segments.length,
      critical: snapshot.segments.filter((s) => s.status === "jam").length,
    },
    environment: {
      online: snapshot.stations.length,
      total: snapshot.stations.length,
      critical: snapshot.stations.filter((s) => s.status === "unhealthy" || s.status === "hazardous").length,
    },
    emergency: {
      online: snapshot.incidents.filter((i) => i.status !== "resolved").length,
      total: snapshot.incidents.length,
      critical: snapshot.incidents.filter((i) => i.severity === "critical").length,
    },
  } as const;

  const sortedRisk = [...risk].sort((a, b) => b.overall - a.overall);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart City Command Center"
        description="Unified real-time view of Makkah's connected infrastructure"
        icon={Gauge}
      >
        <Badge variant="success" className="gap-1">
          <Radio className="h-3 w-3" /> {snapshot.bins.length + snapshot.segments.length + snapshot.stations.length} sensors streaming
        </Badge>
      </PageHeader>

      {/* Overall KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.overall.map((k, i) => (
          <KpiCard key={k.label} kpi={k} index={i} icon={[Activity, Radio, ShieldAlert, Gauge][i]} />
        ))}
      </div>

      {/* Module status grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODULE_META.map((m, i) => {
          const h = moduleHealth[m.key];
          const pct = h.total ? Math.round((h.online / h.total) * 100) : 100;
          const Icon = m.icon;
          return (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={m.href}>
                <Card className="group transition-colors hover:border-primary/40">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/60", m.accent)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      {h.critical > 0 ? (
                        <Badge variant="destructive">{h.critical} critical</Badge>
                      ) : (
                        <Badge variant="success">nominal</Badge>
                      )}
                    </div>
                    <p className="mt-3 text-sm font-semibold">{m.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {h.online}/{h.total} nodes active
                    </p>
                    <Progress
                      value={pct}
                      className="mt-3 h-1.5"
                      indicatorClassName={h.critical > 0 ? "bg-warning" : "bg-success"}
                    />
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Alerts + Risk + Recs */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1 h-[460px]">
          <AlertsFeed alerts={alerts} max={10} />
        </div>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4 text-primary" /> District Risk Index
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedRisk.slice(0, 8).map((r) => {
              const d = districtById(r.districtId);
              return (
                <div key={r.districtId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{d?.name}</span>
                    <span className="tabular-nums text-muted-foreground">{r.overall}/100</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", riskColor(r.overall))}
                      style={{ width: `${r.overall}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="lg:col-span-1">
          <Recommendations recs={recommendations} />
        </div>
      </div>

      {/* AI core banner */}
      <Card className="relative overflow-hidden border-primary/20">
        <div className="pointer-events-none absolute inset-0 radial-aurora opacity-60" />
        <CardContent className="relative flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 glow-primary">
              <Cpu className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Matrix AI Core is monitoring {DISTRICTS.length} districts in real time</p>
              <p className="text-sm text-muted-foreground">
                Predictive maintenance · time-series forecasting · risk scoring · explainable recommendations
              </p>
            </div>
          </div>
          <Link
            href="/ai"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Open AI Core
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
