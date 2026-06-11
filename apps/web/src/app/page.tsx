"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Trash2,
  TrafficCone,
  Wind,
  ShieldAlert,
  Cpu,
  LineChart,
  Radio,
  Database,
  Boxes,
  Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MODULES = [
  { icon: Trash2, title: "Smart Waste", desc: "Bin telemetry, fill-level forecasting & route optimization.", color: "text-emerald-400", href: "/waste" },
  { icon: TrafficCone, title: "Transportation", desc: "Traffic forecasting, congestion detection & mobility heatmaps.", color: "text-amber-400", href: "/transportation" },
  { icon: Wind, title: "Environment", desc: "Air quality, noise & temperature with environmental alerts.", color: "text-sky-400", href: "/environment" },
  { icon: ShieldAlert, title: "Emergency AI", desc: "Incident detection, flood & fire risk, response dashboard.", color: "text-rose-400", href: "/emergency" },
];

const CAPABILITIES = [
  "Artificial Intelligence", "Smart Cities", "IoT Systems", "Real-Time Systems",
  "Data Analytics", "Predictive Modeling", "Cloud Readiness", "Full-Stack Engineering",
];

const STACK = [
  { icon: Boxes, label: "Next.js 15 · TypeScript" },
  { icon: Radio, label: "WebSocket · SSE Live Feeds" },
  { icon: Cpu, label: "Scikit-Learn · Forecasting" },
  { icon: Database, label: "PostgreSQL · Prisma" },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div className="pointer-events-none absolute inset-0 radial-aurora" />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 glow-primary">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold">Matrix Smart Makkah</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Smart City OS
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/analytics" className="hidden text-sm text-muted-foreground hover:text-foreground sm:block">
            Analytics
          </Link>
          <Button asChild variant="glow" size="sm">
            <Link href="/command-center">
              Launch Console <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="outline" className="mx-auto mb-6 border-primary/30 bg-primary/5 text-primary">
            <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Production-grade Smart City AI Platform
          </Badge>
          <h1 className="mx-auto max-w-4xl text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            The operating system for a{" "}
            <span className="text-gradient">smarter Makkah</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Unify waste, mobility, environment and emergency response on one
            real-time, AI-driven command platform — turning a city of sensors
            into actionable intelligence.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="glow">
              <Link href="/command-center">
                Open Command Center <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/analytics">
                <LineChart className="h-4 w-4" /> Explore Analytics
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Stack chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mx-auto mt-14 flex max-w-4xl flex-wrap items-center justify-center gap-3"
        >
          {STACK.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur"
            >
              <s.icon className="h-4 w-4 text-primary" />
              {s.label}
            </div>
          ))}
        </motion.div>
      </section>

      {/* Modules */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m, i) => (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
            >
              <Link
                href={m.href}
                className="group block h-full rounded-xl border border-border bg-card/50 p-6 backdrop-blur transition-all hover:border-primary/40 hover:bg-card"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-secondary/60">
                  <m.icon className={`h-5 w-5 ${m.color}`} />
                </div>
                <h3 className="mb-1 font-semibold">{m.title}</h3>
                <p className="text-sm text-muted-foreground">{m.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-sm text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Open module <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24 text-center">
        <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Engineered to demonstrate
        </h2>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {CAPABILITIES.map((c) => (
            <span
              key={c}
              className="rounded-lg border border-border bg-card/40 px-3.5 py-1.5 text-sm"
            >
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Matrix Smart Makkah — Designed & engineered by{" "}
            <span className="font-semibold text-foreground">Abdulaziz AlAmawi</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Github className="h-4 w-4" />
            Smart City Operating System · v1.0
          </div>
        </div>
      </footer>
    </div>
  );
}
