import { Badge } from "@/components/ui/badge";
import type { Severity } from "@/lib/types";

const MAP: Record<
  Severity,
  { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "info" }
> = {
  info: { label: "Info", variant: "info" },
  low: { label: "Low", variant: "success" },
  medium: { label: "Medium", variant: "warning" },
  high: { label: "High", variant: "destructive" },
  critical: { label: "Critical", variant: "destructive" },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const m = MAP[severity];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

export function severityDotClass(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "bg-destructive";
    case "high":
      return "bg-destructive/80";
    case "medium":
      return "bg-warning";
    case "low":
      return "bg-success";
    default:
      return "bg-sky-400";
  }
}
