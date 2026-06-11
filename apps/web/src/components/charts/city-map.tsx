"use client";

import { cn } from "@/lib/utils";
import type { GeoPoint } from "@/lib/types";

export interface MapPoint {
  id: string;
  location: GeoPoint;
  color: string; // tailwind text/bg color e.g. "bg-emerald-400"
  size?: number;
  pulse?: boolean;
  label?: string;
}

// Bounding box around Makkah districts (with padding).
const BOUNDS = { minLat: 21.33, maxLat: 21.52, minLng: 39.80, maxLng: 40.0 };

function project(p: GeoPoint) {
  const x = ((p.lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  const y = (1 - (p.lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  return { x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) };
}

export function CityMap({
  points,
  height = 380,
  labels,
}: {
  points: MapPoint[];
  height?: number;
  labels?: { location: GeoPoint; text: string }[];
}) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-border bg-[#0a1622]"
      style={{ height }}
    >
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute inset-0 radial-aurora opacity-40" />

      {/* faux road network */}
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <line x1="10%" y1="50%" x2="92%" y2="42%" stroke="hsl(var(--border))" strokeWidth="1.5" opacity="0.5" />
        <line x1="48%" y1="8%" x2="52%" y2="94%" stroke="hsl(var(--border))" strokeWidth="1.5" opacity="0.5" />
        <line x1="20%" y1="90%" x2="88%" y2="20%" stroke="hsl(var(--border))" strokeWidth="1" opacity="0.35" />
        <line x1="6%" y1="22%" x2="80%" y2="88%" stroke="hsl(var(--border))" strokeWidth="1" opacity="0.35" />
      </svg>

      {labels?.map((l, i) => {
        const { x, y } = project(l.location);
        return (
          <div
            key={i}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70"
            style={{ left: `${x}%`, top: `${y - 6}%` }}
          >
            {l.text}
          </div>
        );
      })}

      {points.map((p) => {
        const { x, y } = project(p.location);
        const size = p.size ?? 10;
        return (
          <div
            key={p.id}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
            title={p.label}
          >
            {p.pulse && (
              <span
                className={cn("absolute inset-0 -z-10 animate-ping rounded-full opacity-60", p.color)}
                style={{ width: size, height: size }}
              />
            )}
            <span
              className={cn("block rounded-full ring-2 ring-black/30 transition-transform group-hover:scale-150", p.color)}
              style={{ width: size, height: size }}
            />
          </div>
        );
      })}
    </div>
  );
}
