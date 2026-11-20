import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: "lime" | "cyan" | "amber" | "slate";
}

export default function DashboardStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = "lime",
}: DashboardStatCardProps) {
  const getBadgeStyle = () => {
    switch (badgeColor) {
      case "lime":
        return "bg-lime-400/10 text-lime-400 border-lime-400/20";
      case "cyan":
        return "bg-cyan-400/10 text-cyan-400 border-cyan-400/20";
      case "amber":
        return "bg-amber-400/10 text-amber-400 border-amber-400/20";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="relative overflow-hidden group rounded-2xl border border-slate-800/80 bg-gradient-to-br from-[var(--surface)] to-[var(--brand-soft)]/60 p-5 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:border-lime-400/40 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/10 border border-lime-400/20 text-slate-300 transition-transform group-hover:scale-110">
          <Icon className="h-5 w-5 text-lime-400" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-black tracking-tight text-white">{value}</span>
        {badge && (
          <span
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide",
              getBadgeStyle()
            )}
          >
            {badge}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-2 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}

