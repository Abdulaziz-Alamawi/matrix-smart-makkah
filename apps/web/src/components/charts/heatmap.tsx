"use client";

import { cn } from "@/lib/utils";

export interface HeatCell {
  row: string;
  col: string;
  value: number; // 0..1 normalized
  raw?: number | string;
}

function heatColor(v: number): string {
  // green → amber → red
  const stops = [
    { p: 0, c: [16, 185, 129] },
    { p: 0.5, c: [245, 158, 11] },
    { p: 1, c: [239, 68, 68] },
  ];
  let a = stops[0];
  let b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (v >= stops[i].p && v <= stops[i + 1].p) {
      a = stops[i];
      b = stops[i + 1];
      break;
    }
  }
  const t = (v - a.p) / (b.p - a.p || 1);
  const rgb = a.c.map((ch, i) => Math.round(ch + (b.c[i] - ch) * t));
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

export function Heatmap({
  rows,
  cols,
  cells,
  unit = "",
}: {
  rows: string[];
  cols: string[];
  cells: HeatCell[];
  unit?: string;
}) {
  const lookup = new Map(cells.map((c) => [`${c.row}|${c.col}`, c]));
  return (
    <div className="w-full overflow-x-auto scrollbar-thin">
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `minmax(72px, auto) repeat(${cols.length}, minmax(36px, 1fr))`,
        }}
      >
        <div />
        {cols.map((c) => (
          <div key={c} className="pb-1 text-center text-[10px] text-muted-foreground">
            {c}
          </div>
        ))}
        {rows.map((r) => (
          <div key={r} className="contents">
            <div className="flex items-center pr-2 text-xs text-muted-foreground">
              {r}
            </div>
            {cols.map((c) => {
              const cell = lookup.get(`${r}|${c}`);
              const v = cell?.value ?? 0;
              return (
                <div
                  key={c}
                  title={`${r} · ${c}: ${cell?.raw ?? Math.round(v * 100)}${unit}`}
                  className={cn(
                    "aspect-square rounded-[5px] transition-transform hover:scale-110 hover:ring-2 hover:ring-white/30"
                  )}
                  style={{ backgroundColor: heatColor(v), opacity: 0.35 + v * 0.65 }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
