import {
  LayoutDashboard,
  Trash2,
  TrafficCone,
  Wind,
  ShieldAlert,
  LineChart,
  Cpu,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  labelAr: string;
  icon: LucideIcon;
  accent: string;
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/command-center",
    label: "Command Center",
    labelAr: "مركز القيادة",
    icon: LayoutDashboard,
    accent: "text-primary",
  },
  {
    href: "/waste",
    label: "Smart Waste",
    labelAr: "النفايات الذكية",
    icon: Trash2,
    accent: "text-emerald-400",
  },
  {
    href: "/transportation",
    label: "Transportation",
    labelAr: "النقل الذكي",
    icon: TrafficCone,
    accent: "text-amber-400",
  },
  {
    href: "/environment",
    label: "Environment",
    labelAr: "البيئة الذكية",
    icon: Wind,
    accent: "text-sky-400",
  },
  {
    href: "/emergency",
    label: "Emergency AI",
    labelAr: "الطوارئ الذكية",
    icon: ShieldAlert,
    accent: "text-rose-400",
  },
  {
    href: "/analytics",
    label: "Analytics",
    labelAr: "مركز التحليلات",
    icon: LineChart,
    accent: "text-violet-400",
  },
  {
    href: "/ai",
    label: "AI Core",
    labelAr: "نواة الذكاء",
    icon: Cpu,
    accent: "text-cyan-300",
  },
];
