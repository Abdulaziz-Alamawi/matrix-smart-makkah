"use client";

import { useLiveData } from "@/hooks/use-live-data";
import { cn, formatTime } from "@/lib/utils";

export function LiveIndicator() {
  const { connected, lastUpdate, source } = useLiveData();
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs">
      <span className="relative flex h-2.5 w-2.5">
        {connected && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
        )}
        <span
          className={cn(
            "relative inline-flex h-2.5 w-2.5 rounded-full",
            connected ? "bg-success" : "bg-destructive"
          )}
        />
      </span>
      <span className="font-medium">
        {connected ? "LIVE" : "OFFLINE"}
      </span>
      <span className="text-muted-foreground hidden sm:inline">
        {source === "stream" ? "· SSE feed" : source === "poll" ? "· polling" : ""}
        {lastUpdate ? ` · ${formatTime(lastUpdate)}` : ""}
      </span>
    </div>
  );
}
