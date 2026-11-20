import { cn } from "@/lib/utils";

export type EmptyVariant = "calendar" | "gear" | "bell" | "list" | "trophy" | "people";

const B = { fill: "var(--brand)" };
const A = { fill: "var(--brand-accent)" };
const S = { fill: "var(--brand-soft)" };

/** Themed empty-state illustration (inline SVG, 160x120). */
export default function EmptyArt({
  variant = "list",
  className,
}: {
  variant?: EmptyVariant;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 160 120" aria-hidden="true" className={cn("h-28 w-auto", className)}>
      <ellipse cx="80" cy="106" rx="62" ry="7" style={S} />
      <circle cx="80" cy="56" r="46" style={S} />
      <circle cx="132" cy="26" r="5" style={A} opacity="0.7" />
      <circle cx="26" cy="38" r="4" style={B} opacity="0.35" />
      <path d="M136 70l3-6 3 6-3 6z" style={A} opacity="0.8" />

      {variant === "calendar" && (
        <g>
          <rect x="44" y="32" width="72" height="62" rx="10" fill="#fff" stroke="var(--brand-accent)" strokeWidth="3" />
          <path d="M44 48h72v-6a10 10 0 0 0-10-10H54a10 10 0 0 0-10 10z" style={B} />
          <rect x="58" y="24" width="6" height="14" rx="3" style={A} />
          <rect x="96" y="24" width="6" height="14" rx="3" style={A} />
          <g style={S}>
            <rect x="54" y="58" width="14" height="10" rx="3" />
            <rect x="73" y="58" width="14" height="10" rx="3" />
            <rect x="92" y="58" width="14" height="10" rx="3" />
            <rect x="54" y="74" width="14" height="10" rx="3" />
          </g>
          <rect x="73" y="74" width="14" height="10" rx="3" style={B} />
        </g>
      )}

      {variant === "gear" && (
        <g>
          <path d="M42 54l38-16 38 16v34l-38 16-38-16z" fill="#fff" stroke="var(--brand-accent)" strokeWidth="3" strokeLinejoin="round" />
          <path d="M42 54l38 16 38-16M80 70v34" fill="none" stroke="var(--brand-accent)" strokeWidth="3" strokeLinejoin="round" />
          <path d="M60 46l38 16v10l-10-4v-8l-28-12z" style={B} opacity="0.9" />
          <circle cx="80" cy="56" r="0" />
        </g>
      )}

      {variant === "bell" && (
        <g>
          <path d="M80 28c-16 0-26 12-26 28v14l-8 10h68l-8-10V56c0-16-10-28-26-28z" fill="#fff" stroke="var(--brand-accent)" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="80" cy="24" r="5" style={B} />
          <path d="M70 90a10 10 0 0 0 20 0z" style={B} />
          <path d="M62 52c2-8 8-12 14-13" fill="none" stroke="var(--brand-accent)" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}

      {variant === "list" && (
        <g>
          <rect x="46" y="28" width="68" height="78" rx="10" fill="#fff" stroke="var(--brand-accent)" strokeWidth="3" />
          <rect x="66" y="22" width="28" height="14" rx="6" style={B} />
          <g style={S}>
            <rect x="56" y="50" width="48" height="7" rx="3.5" />
            <rect x="56" y="66" width="36" height="7" rx="3.5" />
            <rect x="56" y="82" width="42" height="7" rx="3.5" />
          </g>
          <circle cx="104" cy="86" r="11" style={B} />
          <path d="M98.5 86l4 4 7-8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}

      {variant === "trophy" && (
        <g>
          <path d="M58 30h44v22a22 22 0 0 1-44 0z" style={B} />
          <path d="M58 36H46c0 14 6 22 14 24M102 36h12c0 14-6 22-14 24" fill="none" stroke="var(--brand-accent)" strokeWidth="4" strokeLinecap="round" />
          <rect x="74" y="72" width="12" height="14" style={A} />
          <rect x="62" y="86" width="36" height="9" rx="4" style={B} />
          <path d="M70 40v10" stroke="#fff" strokeOpacity="0.6" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}

      {variant === "people" && (
        <g>
          <circle cx="62" cy="52" r="12" fill="#F1C09A" />
          <path d="M42 96c0-16 8-26 20-26s20 10 20 26z" style={B} />
          <circle cx="102" cy="56" r="10" fill="#DFA67A" />
          <path d="M86 96c0-14 7-22 16-22s16 8 16 22z" style={A} />
          <path d="M50 48c2-10 12-14 20-8-6-1-12 2-14 8z" fill="#3A2A24" />
        </g>
      )}
    </svg>
  );
}
