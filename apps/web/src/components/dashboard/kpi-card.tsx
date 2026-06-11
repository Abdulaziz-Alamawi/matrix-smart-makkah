"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn, formatCompact } from "@/lib/utils";
import type { Kpi } from "@/lib/types";

export function KpiCard({
  kpi,
  icon: Icon,
  index = 0,
  accent = "text-primary",
}: {
  kpi: Kpi;
  icon?: LucideIcon;
  index?: number;
  accent?: string;
}) {
  const TrendIcon =
    kpi.trend === "up" ? ArrowUpRight : kpi.trend === "down" ? ArrowDownRight : Minus;
  const good = kpi.changePct >= 0;
  const displayValue =
    Math.abs(kpi.value) >= 10000 ? formatCompact(kpi.value) : kpi.value.toLocaleString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Card className="relative overflow-hidden p-5 transition-colors hover:border-primary/40">
        <div className="flex items-start justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {kpi.label}
          </span>
          {Icon && (
            <span className={cn("rounded-md bg-secondary/60 p-1.5", accent)}>
              <Icon className="h-4 w-4" />
            </span>
          )}
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tracking-tight tabular-nums">
            {displayValue}
          </span>
          {kpi.unit && (
            <span className="text-sm text-muted-foreground">{kpi.unit}</span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs">
          <TrendIcon
            className={cn(
              "h-3.5 w-3.5",
              kpi.trend === "flat"
                ? "text-muted-foreground"
                : good
                  ? "text-success"
                  : "text-destructive"
            )}
          />
          <span
            className={cn(
              "font-medium",
              kpi.trend === "flat"
                ? "text-muted-foreground"
                : good
                  ? "text-success"
                  : "text-destructive"
            )}
          >
            {kpi.changePct > 0 ? "+" : ""}
            {kpi.changePct}%
          </span>
          <span className="text-muted-foreground">vs last period</span>
        </div>
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          )}
        />
      </Card>
    </motion.div>
  );
}
