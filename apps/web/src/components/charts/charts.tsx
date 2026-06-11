"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  RadialBar,
  RadialBarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ForecastSeries } from "@/lib/types";

const AXIS = { stroke: "hsl(var(--muted-foreground))", fontSize: 11 };
const GRID = "hsl(var(--border))";

function hourLabel(t: string) {
  const d = new Date(t);
  if (isNaN(d.getTime())) return t;
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function TooltipBox({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <div className="mb-1 font-medium text-muted-foreground">
        {typeof label === "string" ? hourLabel(label) : label}
      </div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: p.color || p.stroke || p.fill }}
          />
          <span className="text-foreground">
            {p.name}: <span className="font-semibold tabular-nums">{Number(p.value).toLocaleString()}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Forecast chart: history + forecast + confidence band ────────────────────
export function ForecastChart({ series, height = 280 }: { series: ForecastSeries; height?: number }) {
  const data = [
    ...series.history.map((h) => ({ t: h.t, actual: h.value })),
    ...series.forecast.map((f, i) => ({
      t: f.t,
      forecast: f.value,
      low: series.confidenceLow[i]?.value,
      high: series.confidenceHigh[i]?.value,
    })),
  ];
  const splitIndex = series.history.length;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="gActual" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.18} />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="t" tickFormatter={hourLabel} tick={AXIS} tickLine={false} axisLine={false} minTickGap={40} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={36} />
        <Tooltip content={<TooltipBox />} />
        <Area type="monotone" dataKey="high" stroke="none" fill="url(#gBand)" name="Upper" />
        <Area type="monotone" dataKey="low" stroke="none" fill="hsl(var(--background))" name="Lower" />
        <Area type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gActual)" name="Actual" />
        <Line type="monotone" dataKey="forecast" stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="5 4" dot={false} name="Forecast" />
        <ReferenceLine x={data[splitIndex]?.t} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 4" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TrendArea({
  data,
  dataKey = "value",
  color = "hsl(var(--primary))",
  height = 220,
  xKey = "t",
}: {
  data: any[];
  dataKey?: string;
  color?: string;
  height?: number;
  xKey?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id={`area-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={false} minTickGap={30} tickFormatter={(v) => (typeof v === "string" && v.includes("T") ? hourLabel(v) : v)} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={36} />
        <Tooltip content={<TooltipBox />} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#area-${dataKey})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarSeries({
  data,
  dataKey = "value",
  xKey = "name",
  color = "hsl(var(--primary))",
  height = 240,
  colorByValue,
}: {
  data: any[];
  dataKey?: string;
  xKey?: string;
  color?: string;
  height?: number;
  colorByValue?: (v: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={false} interval={0} angle={data.length > 6 ? -25 : 0} textAnchor={data.length > 6 ? "end" : "middle"} height={data.length > 6 ? 50 : 30} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={36} />
        <Tooltip content={<TooltipBox />} cursor={{ fill: "hsl(var(--secondary) / 0.4)" }} />
        <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((d, i) => (
            <Cell key={i} fill={colorByValue ? colorByValue(d[dataKey]) : color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MultiLine({
  data,
  lines,
  xKey = "t",
  height = 260,
}: {
  data: any[];
  lines: { key: string; color: string; name: string }[];
  xKey?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={false} minTickGap={30} tickFormatter={(v) => (typeof v === "string" && v.includes("T") ? hourLabel(v) : v)} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={36} />
        <Tooltip content={<TooltipBox />} />
        {lines.map((l) => (
          <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={2} dot={false} name={l.name} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RadialGauge({
  value,
  label,
  color = "hsl(var(--primary))",
  height = 180,
}: {
  value: number;
  label?: string;
  color?: string;
  height?: number;
}) {
  const data = [{ name: label ?? "", value, fill: color }];
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="72%"
          outerRadius="100%"
          data={data}
          startAngle={220}
          endAngle={-40}
        >
          <RadialBar background={{ fill: "hsl(var(--secondary))" }} dataKey="value" cornerRadius={12} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums">{Math.round(value)}</span>
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}
