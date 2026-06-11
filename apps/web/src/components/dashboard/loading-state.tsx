"use client";

import { Loader2 } from "lucide-react";

export function LoadingState({ label = "Connecting to live sensor feed…" }: { label?: string }) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-xl border border-border bg-card/50"
        />
      ))}
    </div>
  );
}
