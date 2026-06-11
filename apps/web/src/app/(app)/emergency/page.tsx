"use client";

import * as React from "react";
import {
  ShieldAlert,
  Flame,
  Waves,
  Ambulance,
  Car,
  Building2,
  Users,
  Radio,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLiveData } from "@/hooks/use-live-data";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { LoadingState } from "@/components/dashboard/loading-state";
import { CityMap, type MapPoint } from "@/components/charts/city-map";
import { SeverityBadge, severityDotClass } from "@/components/dashboard/severity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DISTRICTS, districtById } from "@/lib/districts";
import { cn, relativeTime } from "@/lib/utils";
import type { Incident, IncidentType } from "@/lib/types";

const TYPE_META: Record<IncidentType, { icon: LucideIcon; color: string }> = {
  fire: { icon: Flame, color: "text-rose-500" },
  flood: { icon: Waves, color: "text-sky-400" },
  medical: { icon: Ambulance, color: "text-emerald-400" },
  accident: { icon: Car, color: "text-amber-400" },
  structural: { icon: Building2, color: "text-violet-400" },
  crowd: { icon: Users, color: "text-cyan-400" },
};

function statusColor(s: Incident["status"]) {
  return {
    detected: "bg-rose-500",
    dispatched: "bg-amber-400",
    responding: "bg-sky-400",
    resolved: "bg-emerald-400",
  }[s];
}

function riskTone(v: number) {
  if (v >= 70) return "text-rose-400";
  if (v >= 45) return "text-amber-400";
  return "text-emerald-400";
}

export default function EmergencyPage() {
  const { snapshot } = useLiveData();
  if (!snapshot) return <LoadingState label="Connecting to Emergency AI Core…" />;

  const { incidents, kpis, risk } = snapshot;
  const active = incidents.filter((i) => i.status !== "resolved");
  const sortedRisk = [...risk].sort((a, b) => b.overall - a.overall);

  const mapPoints: MapPoint[] = incidents.map((i) => ({
    id: i.id,
    location: i.location,
    color: i.severity === "critical" || i.severity === "high" ? "bg-rose-500" : i.severity === "medium" ? "bg-amber-400" : "bg-emerald-400",
    size: i.severity === "critical" ? 15 : 11,
    pulse: i.status !== "resolved" && (i.severity === "critical" || i.severity === "high"),
    label: `${i.type} · ${i.severity}`,
  }));

  const topFlood = [...risk].sort((a, b) => b.floodRisk - a.floodRisk)[0];
  const topFire = [...risk].sort((a, b) => b.fireRisk - a.fireRisk)[0];
  const topCrowd = [...risk].sort((a, b) => b.crowdRisk - a.crowdRisk)[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency AI Core"
        description="Incident detection · flood & fire prediction · response coordination"
        icon={ShieldAlert}
        accent="text-rose-400"
      >
        <Badge variant={active.length > 4 ? "destructive" : "warning"} className="gap-1">
          <Radio className="h-3 w-3" /> {active.length} active incidents
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.emergency.map((k, i) => (
          <KpiCard key={k.label} kpi={k} index={i} accent="text-rose-400" icon={[ShieldAlert, Clock, ShieldAlert, Radio][i]} />
        ))}
      </div>

      {/* Predictive risk banners */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Flood Risk", icon: Waves, top: topFlood, value: topFlood?.floodRisk ?? 0, color: "text-sky-400" },
          { label: "Fire Risk", icon: Flame, top: topFire, value: topFire?.fireRisk ?? 0, color: "text-rose-400" },
          { label: "Crowd Risk", icon: Users, top: topCrowd, value: topCrowd?.crowdRisk ?? 0, color: "text-cyan-400" },
        ].map((r, i) => (
          <motion.div key={r.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="overflow-hidden">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Peak {r.label}</p>
                  <p className={cn("mt-1 text-3xl font-bold tabular-nums", riskTone(r.value))}>{r.value}<span className="text-base text-muted-foreground">/100</span></p>
                  <p className="mt-1 text-xs text-muted-foreground">{districtById(r.top?.districtId ?? "")?.name}</p>
                </div>
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/60", r.color)}>
                  <r.icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Incident Map · Live Response</CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> Critical</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Medium</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Low</span>
            </div>
          </CardHeader>
          <CardContent>
            <CityMap points={mapPoints} labels={DISTRICTS.map((d) => ({ location: d.center, text: d.name }))} />
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">Composite Risk by District</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-3 overflow-y-auto scrollbar-thin" style={{ maxHeight: 360 }}>
            {sortedRisk.map((r) => {
              const d = districtById(r.districtId);
              return (
                <div key={r.districtId} className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{d?.name}</span>
                    <span className={cn("text-sm font-bold tabular-nums", riskTone(r.overall))}>{r.overall}</span>
                  </div>
                  <div className="mt-1 flex gap-1">
                    <span className="flex-1 rounded bg-sky-400/20 px-1.5 py-0.5 text-center text-[10px] text-sky-300">F {r.floodRisk}</span>
                    <span className="flex-1 rounded bg-rose-400/20 px-1.5 py-0.5 text-center text-[10px] text-rose-300">🔥 {r.fireRisk}</span>
                    <span className="flex-1 rounded bg-cyan-400/20 px-1.5 py-0.5 text-center text-[10px] text-cyan-300">👥 {r.crowdRisk}</span>
                  </div>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">{r.drivers[0]}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Incident Response Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {incidents.map((inc) => {
            const meta = TYPE_META[inc.type];
            const Icon = meta.icon;
            return (
              <motion.div
                key={inc.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-4 rounded-lg border border-border/60 bg-secondary/30 p-3"
              >
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/60", meta.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{inc.title}</p>
                    <SeverityBadge severity={inc.severity} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {districtById(inc.districtId)?.name} · {relativeTime(inc.reportedAt)} · {Math.round(inc.aiConfidence * 100)}% AI confidence
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className={cn("h-2 w-2 rounded-full", statusColor(inc.status))} />
                    <span className="capitalize">{inc.status}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {inc.responseUnits} units {inc.etaMin > 0 ? `· ETA ${inc.etaMin}m` : "· on-site"}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
