"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { severityDotClass } from "./severity";
import { relativeTime, cn } from "@/lib/utils";
import { districtById } from "@/lib/districts";
import type { CityAlert } from "@/lib/types";

export function AlertsFeed({
  alerts,
  title = "Critical Alerts",
  max = 8,
}: {
  alerts: CityAlert[];
  title?: string;
  max?: number;
}) {
  const list = alerts.slice(0, max);
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4 text-primary" /> {title}
        </CardTitle>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
          {alerts.length}
        </span>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 overflow-y-auto scrollbar-thin">
        <AnimatePresence initial={false}>
          {list.map((a) => (
            <motion.div
              key={a.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3 rounded-lg border border-border/60 bg-secondary/30 p-3"
            >
              <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", severityDotClass(a.severity))} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{a.title}</p>
                  <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {a.module}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {a.message}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {districtById(a.districtId)?.name} · {relativeTime(a.createdAt)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {list.length === 0 && (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No active alerts — all systems nominal.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
