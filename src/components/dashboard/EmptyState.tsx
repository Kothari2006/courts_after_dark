import Link from "next/link";
import { LucideIcon } from "lucide-react";
import EmptyArt, { EmptyVariant } from "@/components/illustrations/EmptyArt";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  /** Illustration to show; defaults to a generic clipboard. */
  art?: EmptyVariant;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
  art = "list",
}: EmptyStateProps) {
  return (
    <div className="animate-rise flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-gradient-to-b from-[var(--surface)] to-[var(--brand-soft)]/40 p-8 sm:p-12 text-center">
      <EmptyArt variant={art} className="mb-4 h-32" />
      <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-2">
        <Icon className="h-4 w-4 text-lime-400" aria-hidden="true" />
        {title}
      </h3>
      <p className="max-w-md text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
        {description}
      </p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition-all hover:bg-lime-300 hover:-translate-y-0.5 shadow-lg shadow-lime-400/25"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
