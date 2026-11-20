import { cn } from "@/lib/utils";

/**
 * Deterministic illustrated avatar.
 * The same name always yields the same face (skin, hair, hairstyle), and the
 * background / outfit use the active theme (`--brand`, `--brand-accent`,
 * `--brand-soft`), so student avatars are coral and teacher avatars are indigo.
 */

const SKIN = ["#F8D5B8", "#F1C09A", "#DFA67A", "#C68863", "#9B6A4A"];
const HAIR = ["#2B1D18", "#4A2F22", "#6B4A32", "#1F2937", "#8A5A2B"];

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

interface AvatarProps {
  name?: string | null;
  size?: number;
  className?: string;
  rounded?: "full" | "xl";
}

export default function Avatar({ name, size = 40, className, rounded = "xl" }: AvatarProps) {
  const seed = hash((name || "user").toLowerCase());
  const skin = SKIN[seed % SKIN.length];
  const hair = HAIR[(seed >> 3) % HAIR.length];
  const style = (seed >> 6) % 4; // 0 short, 1 long, 2 bun, 3 curly
  const gid = `av-${seed}`;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label={name ? `${name} avatar` : "User avatar"}
      className={cn(
        "shrink-0 overflow-hidden",
        rounded === "full" ? "rounded-full" : "rounded-xl",
        className
      )}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--brand-soft)" }} />
          <stop offset="1" style={{ stopColor: "var(--brand-accent)", stopOpacity: 0.75 }} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" fill={`url(#${gid})`} />

      {/* back hair */}
      {style === 1 && <path d="M18 30c0-14 8-20 14-20s14 6 14 20v18H18z" fill={hair} />}
      {style === 2 && <circle cx="32" cy="12" r="7" fill={hair} />}
      {style === 3 && (
        <g fill={hair}>
          <circle cx="20" cy="22" r="8" />
          <circle cx="44" cy="22" r="8" />
          <circle cx="32" cy="15" r="10" />
        </g>
      )}

      {/* shoulders */}
      <path d="M8 66c1-13 11-19 24-19s23 6 24 19z" style={{ fill: "var(--brand)" }} />
      <path d="M26 47l6 7 6-7" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
      {/* neck */}
      <rect x="28" y="38" width="8" height="10" rx="3" fill={skin} />
      {/* head */}
      <ellipse cx="32" cy="29" rx="12" ry="13.5" fill={skin} />

      {/* front hair */}
      {style === 0 && <path d="M20 28c-1-11 6-16 13-16 8 0 12 6 11 15-3-5-8-8-12-8-5 0-9 3-12 9z" fill={hair} />}
      {style === 1 && <path d="M20 29c-1-11 6-17 13-17 8 0 12 7 11 17-2-7-6-10-12-10s-9 3-12 10z" fill={hair} />}
      {style === 2 && <path d="M20 28c0-9 6-14 13-14 8 0 12 6 11 14-3-5-7-7-12-7s-9 2-12 7z" fill={hair} />}
      {style === 3 && <path d="M21 26c2-6 6-8 11-8s9 2 11 8c-3-3-7-4-11-4s-8 1-11 4z" fill={hair} />}

      {/* face */}
      <circle cx="27.5" cy="30" r="1.4" fill="#2B1D18" />
      <circle cx="36.5" cy="30" r="1.4" fill="#2B1D18" />
      <path d="M28 35.5c1.2 1.4 6.8 1.4 8 0" fill="none" stroke="#2B1D18" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
