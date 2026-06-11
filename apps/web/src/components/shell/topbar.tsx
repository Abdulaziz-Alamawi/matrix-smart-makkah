"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun, Bell, Search, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS } from "@/lib/nav";
import { LiveIndicator } from "./live-indicator";
import { useLiveData } from "@/hooks/use-live-data";
import { cn } from "@/lib/utils";

export function Topbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { snapshot } = useLiveData();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const current = NAV_ITEMS.find(
    (n) => pathname === n.href || pathname.startsWith(n.href + "/")
  );
  const criticalAlerts =
    snapshot?.alerts.filter(
      (a) => a.severity === "critical" || a.severity === "high"
    ).length ?? 0;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen((o) => !o)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-2 lg:hidden">
        <Activity className="h-5 w-5 text-primary" />
        <span className="font-bold text-sm">Matrix Makkah</span>
      </div>

      <div className="hidden lg:flex flex-col">
        <span className="text-sm font-semibold">{current?.label ?? "Overview"}</span>
        <span className="text-[11px] text-muted-foreground">
          Makkah Smart City · Real-time operations
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <LiveIndicator />

        <Button variant="outline" size="icon" className="relative hidden sm:flex">
          <Bell className="h-4 w-4" />
          {criticalAlerts > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {criticalAlerts}
            </span>
          )}
        </Button>

        {mounted && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-16 border-b border-border bg-card p-3 lg:hidden">
          <nav className="grid grid-cols-2 gap-2">
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                    active ? "bg-primary/10 text-foreground" : "text-muted-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4", item.accent)} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
