"use client";

import * as React from "react";
import type { CitySnapshot } from "@/lib/types";

interface LiveState {
  snapshot: CitySnapshot | null;
  connected: boolean;
  lastUpdate: number;
  source: "stream" | "poll" | "idle";
}

const LiveContext = React.createContext<LiveState>({
  snapshot: null,
  connected: false,
  lastUpdate: 0,
  source: "idle",
});

/**
 * Connects to the live sensor feed via Server-Sent Events (the platform's
 * real-time channel). Falls back to interval polling if the stream drops.
 */
export function LiveDataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<LiveState>({
    snapshot: null,
    connected: false,
    lastUpdate: 0,
    source: "idle",
  });

  React.useEffect(() => {
    let es: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch("/api/snapshot", { cache: "no-store" });
        const data = (await res.json()) as CitySnapshot;
        if (!cancelled)
          setState({
            snapshot: data,
            connected: true,
            lastUpdate: Date.now(),
            source: "poll",
          });
      } catch {
        if (!cancelled)
          setState((s) => ({ ...s, connected: false, source: "idle" }));
      }
    };

    const startPolling = () => {
      poll();
      pollTimer = setInterval(poll, 5000);
    };

    try {
      es = new EventSource("/api/stream");
      es.onmessage = (ev) => {
        if (cancelled) return;
        try {
          const data = JSON.parse(ev.data) as CitySnapshot;
          setState({
            snapshot: data,
            connected: true,
            lastUpdate: Date.now(),
            source: "stream",
          });
        } catch {
          /* ignore malformed frame */
        }
      };
      es.onerror = () => {
        es?.close();
        es = null;
        if (!pollTimer) startPolling();
      };
    } catch {
      startPolling();
    }

    return () => {
      cancelled = true;
      es?.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, []);

  return <LiveContext.Provider value={state}>{children}</LiveContext.Provider>;
}

export function useLiveData() {
  return React.useContext(LiveContext);
}
