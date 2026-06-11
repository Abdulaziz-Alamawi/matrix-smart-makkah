"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex sticky top-0 h-screen w-64 shrink-0 flex-col border-r border-border bg-card/40 backdrop-blur-xl">
      <Link href="/" className="flex items-center gap-3 px-5 h-16 border-b border-border">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 glow-primary">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight">Matrix Makkah</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Smart City OS
          </div>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] transition-colors",
                  active ? item.accent : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span className="flex-1">{item.label}</span>
              {active && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-secondary/50 p-3">
          <div className="text-[11px] text-muted-foreground">Operated by</div>
          <div className="text-sm font-semibold">Abdulaziz AlAmawi</div>
          <div className="mt-1 text-[10px] text-muted-foreground">
            Smart City Platform v1.0
          </div>
        </div>
      </div>
    </aside>
  );
}
