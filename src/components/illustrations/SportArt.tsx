import { cn } from "@/lib/utils";

/**
 * Illustrated cover art for each sport (replaces the old emoji placeholder on
 * facility cards). Inline SVG, themed with the active palette.
 */

const INK = "#292524";
const B = { fill: "var(--brand)" };
const A = { fill: "var(--brand-accent)" };

function Art({ type }: { type: string }) {
  switch (type) {
    case "BADMINTON":
      return (
        <g>
          <g transform="rotate(-28 100 70)">
            <ellipse cx="100" cy="46" rx="22" ry="30" fill="#fff" fillOpacity="0.75" stroke={INK} strokeWidth="5" />
            <g stroke={INK} strokeOpacity="0.3" strokeWidth="1.5">
              <path d="M88 24v44M100 17v58M112 24v44M80 36h40M78 48h44M82 60h36" />
            </g>
            <path d="M100 76v34" stroke={INK} strokeWidth="6" strokeLinecap="round" />
            <rect x="95" y="96" width="10" height="22" rx="5" style={B} />
          </g>
          <g transform="translate(150 40) rotate(25)">
            <circle r="7" fill="#fff" stroke="#E7D5CC" />
            <path d="M-7 3l-9 24h32l-9-24z" fill="#fff" stroke="#E7D5CC" />
          </g>
        </g>
      );
    case "BASKETBALL":
      return (
        <g>
          <circle cx="100" cy="64" r="38" fill="#F59E5B" />
          <g fill="none" stroke="#7C3F12" strokeWidth="3">
            <path d="M62 64h76M100 26v76" />
            <path d="M72 38c14 10 14 42 0 52M128 38c-14 10-14 42 0 52" />
          </g>
        </g>
      );
    case "FOOTBALL":
      return (
        <g>
          <circle cx="100" cy="64" r="38" fill="#fff" stroke={INK} strokeWidth="4" />
          <path d="M100 44l16 12-6 18H90l-6-18z" fill={INK} />
          <g stroke={INK} strokeWidth="3" strokeLinecap="round">
            <path d="M100 44V28M116 56l16-6M110 74l10 14M90 74L80 88M84 56l-16-6" />
          </g>
        </g>
      );
    case "CRICKET":
      return (
        <g>
          <g transform="rotate(35 100 64)">
            <rect x="88" y="14" width="24" height="64" rx="8" fill="#E8C08A" stroke="#9A6B2F" strokeWidth="3" />
            <rect x="96" y="76" width="8" height="30" rx="4" fill="#9A6B2F" />
            <rect x="94" y="90" width="12" height="16" rx="5" style={B} />
          </g>
          <circle cx="146" cy="92" r="14" fill="#D94B3D" />
          <path d="M136 86c6 4 14 4 20 0M136 98c6-4 14-4 20 0" fill="none" stroke="#fff" strokeWidth="2" />
        </g>
      );
    case "TENNIS":
      return (
        <g>
          <g transform="rotate(-30 96 64)">
            <ellipse cx="96" cy="46" rx="26" ry="32" fill="#fff" fillOpacity="0.7" stroke={INK} strokeWidth="5" />
            <g stroke={INK} strokeOpacity="0.28" strokeWidth="1.5">
              <path d="M82 20v52M96 14v64M110 20v52M72 34h48M70 48h52M74 62h44" />
            </g>
            <path d="M96 78v32" stroke={INK} strokeWidth="6" strokeLinecap="round" />
          </g>
          <circle cx="146" cy="92" r="16" fill="#D8F056" />
          <path d="M132 86c8 6 20 6 28 0M132 98c8-6 20-6 28 0" fill="none" stroke="#fff" strokeWidth="2.4" />
        </g>
      );
    case "GYM":
      return (
        <g>
          <rect x="62" y="60" width="76" height="8" rx="4" fill={INK} />
          <rect x="48" y="44" width="14" height="40" rx="5" style={B} />
          <rect x="36" y="52" width="12" height="24" rx="4" style={A} />
          <rect x="138" y="44" width="14" height="40" rx="5" style={B} />
          <rect x="152" y="52" width="12" height="24" rx="4" style={A} />
        </g>
      );
    default:
      return (
        <g>
          <path d="M40 92V54l60-26 60 26v38z" fill="#fff" fillOpacity="0.75" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <rect x="84" y="66" width="32" height="26" rx="4" style={B} />
          <path d="M50 54h100" stroke={INK} strokeOpacity="0.3" strokeWidth="3" />
        </g>
      );
  }
}

export default function SportArt({ sport, className }: { sport: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 200 128"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`${sport.toLowerCase()} illustration`}
      className={cn("h-full w-full", className)}
    >
      <defs>
        <linearGradient id="sport-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--brand-soft)" }} />
          <stop offset="1" style={{ stopColor: "var(--brand-accent)", stopOpacity: 0.55 }} />
        </linearGradient>
      </defs>
      <rect width="200" height="128" fill="url(#sport-bg)" />
      <circle cx="170" cy="22" r="26" fill="#fff" fillOpacity="0.35" />
      <circle cx="26" cy="108" r="30" fill="#fff" fillOpacity="0.25" />
      <path d="M0 108c40-14 80-14 120-4s60 8 80 0v24H0z" fill="#fff" fillOpacity="0.4" />
      <Art type={sport} />
    </svg>
  );
}
