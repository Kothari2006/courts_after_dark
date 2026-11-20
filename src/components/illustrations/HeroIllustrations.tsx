import { cn } from "@/lib/utils";

/**
 * Flat-style hero illustrations (inline SVG: crisp at any size, zero network
 * cost, themed through CSS variables so they follow the student / teacher
 * palette automatically).
 */

const B = { fill: "var(--brand)" };
const A = { fill: "var(--brand-accent)" };
const S = { fill: "var(--brand-soft)" };
const INK = "#292524";

export function StudentHero({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 250"
      role="img"
      aria-label="Student with a badminton racket and books"
      className={cn("h-auto w-full", className)}
    >
      {/* backdrop */}
      <circle cx="180" cy="118" r="102" style={S} />
      <circle cx="262" cy="46" r="18" style={A} opacity="0.55" />
      <circle cx="58" cy="70" r="9" style={B} opacity="0.35" />
      <path d="M44 150l6-12 6 12-6 12z" style={A} opacity="0.8" />
      <ellipse cx="170" cy="228" rx="140" ry="12" style={S} />

      {/* books */}
      <rect x="236" y="196" width="78" height="16" rx="4" style={B} />
      <rect x="242" y="180" width="66" height="16" rx="4" style={A} />
      <rect x="238" y="164" width="72" height="16" rx="4" fill="#fff" stroke="#E7D5CC" />
      <rect x="248" y="170" width="28" height="3" rx="1.5" style={B} opacity="0.5" />

      {/* legs + shoes */}
      <rect x="140" y="178" width="22" height="46" rx="9" fill="#3B3F5C" />
      <rect x="170" y="178" width="22" height="46" rx="9" fill="#323652" />
      <rect x="134" y="217" width="32" height="12" rx="6" fill={INK} />
      <rect x="166" y="217" width="32" height="12" rx="6" fill={INK} />

      {/* torso (hoodie) */}
      <rect x="126" y="110" width="80" height="84" rx="30" style={B} />
      <path d="M150 112c4 14 28 14 32 0" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" />
      <rect x="150" y="150" width="32" height="20" rx="8" fill="#fff" fillOpacity="0.18" />

      {/* arm holding racket */}
      <path d="M200 128l36-22" stroke="var(--brand)" strokeWidth="16" strokeLinecap="round" />
      <circle cx="238" cy="104" r="8" fill="#F1C09A" />
      <path d="M238 100l14-30" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="262" cy="46" rx="22" ry="28" fill="#fff" fillOpacity="0.7" stroke={INK} strokeWidth="4" transform="rotate(18 262 46)" />
      <g stroke={INK} strokeOpacity="0.35" strokeWidth="1.4" transform="rotate(18 262 46)">
        <path d="M250 26v40M262 20v52M274 26v40M242 38h40M240 50h44M244 62h36" />
      </g>

      {/* other arm */}
      <path d="M132 130l-18 34" stroke="var(--brand)" strokeWidth="15" strokeLinecap="round" />
      <circle cx="112" cy="168" r="7.5" fill="#F1C09A" />

      {/* head */}
      <rect x="156" y="92" width="20" height="22" rx="8" fill="#F1C09A" />
      <ellipse cx="166" cy="76" rx="27" ry="29" fill="#F8D5B8" />
      <path d="M138 74c-3-22 13-34 29-34 17 0 30 12 26 34-6-12-16-18-28-18s-20 6-27 18z" fill="#3A2A24" />
      <circle cx="196" cy="64" r="12" fill="#3A2A24" />
      <circle cx="156" cy="79" r="2.4" fill="#3A2A24" />
      <circle cx="177" cy="79" r="2.4" fill="#3A2A24" />
      <path d="M158 90c4 5 14 5 18 0" fill="none" stroke="#3A2A24" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="150" cy="87" r="4" fill="#F06449" opacity="0.18" />
      <circle cx="184" cy="87" r="4" fill="#F06449" opacity="0.18" />

      {/* shuttlecock */}
      <g transform="translate(86 52) rotate(-30)">
        <circle cx="0" cy="0" r="6" fill="#fff" stroke="#E7D5CC" />
        <path d="M-6 2l-8 20h28l-8-20z" fill="#fff" stroke="#E7D5CC" />
        <path d="M-2 4l-3 18M2 4l3 18" stroke="#E7D5CC" />
      </g>
    </svg>
  );
}

export function TeacherHero({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 250"
      role="img"
      aria-label="Teacher presenting at a board"
      className={cn("h-auto w-full", className)}
    >
      <circle cx="170" cy="120" r="104" style={S} />
      <circle cx="40" cy="60" r="10" style={A} opacity="0.5" />
      <circle cx="300" cy="40" r="16" style={B} opacity="0.3" />
      <ellipse cx="170" cy="230" rx="140" ry="12" style={S} />

      {/* board */}
      <rect x="22" y="38" width="170" height="116" rx="12" fill="#fff" stroke="var(--brand-accent)" strokeWidth="5" />
      <rect x="40" y="56" width="52" height="7" rx="3.5" style={B} />
      <rect x="40" y="70" width="86" height="5" rx="2.5" style={S} />
      <g>
        <rect x="46" y="112" width="18" height="30" rx="4" style={A} />
        <rect x="72" y="96" width="18" height="46" rx="4" style={B} />
        <rect x="98" y="104" width="18" height="38" rx="4" style={A} />
        <rect x="124" y="84" width="18" height="58" rx="4" style={B} />
      </g>
      <path d="M150 106l12-14 12 8 12-18" fill="none" stroke="var(--brand)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="86" y="154" width="12" height="42" rx="3" fill="#C7CBE6" />
      <rect x="120" y="154" width="12" height="42" rx="3" fill="#C7CBE6" />

      {/* plant */}
      <rect x="20" y="190" width="26" height="30" rx="6" style={B} />
      <path d="M33 190c-14-14-12-30-2-40 4 14 10 22 2 40zM33 190c12-12 16-26 10-38-6 12-14 20-10 38z" fill="#4CAF8E" />

      {/* teacher legs */}
      <rect x="226" y="180" width="22" height="44" rx="9" fill="#2E3150" />
      <rect x="254" y="180" width="22" height="44" rx="9" fill="#262946" />
      <rect x="220" y="217" width="32" height="12" rx="6" fill="#1E1B4B" />
      <rect x="250" y="217" width="32" height="12" rx="6" fill="#1E1B4B" />

      {/* torso (blazer) */}
      <rect x="212" y="112" width="80" height="86" rx="28" style={B} />
      <path d="M252 114l-14 36 14 8 14-8-14-36z" fill="#fff" />
      <path d="M252 114l-14 36M252 114l14 36" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" />
      <rect x="258" y="156" width="6" height="30" rx="3" style={A} />

      {/* pointing arm + pointer */}
      <path d="M214 132l-34-6" stroke="var(--brand)" strokeWidth="15" strokeLinecap="round" />
      <circle cx="176" cy="125" r="7.5" fill="#DFA67A" />
      <path d="M176 125l-40-32" stroke="#1E1B4B" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="134" cy="91" r="4" fill="var(--brand-accent)" />
      {/* other arm with book */}
      <path d="M290 132l6 34" stroke="var(--brand)" strokeWidth="15" strokeLinecap="round" />
      <rect x="282" y="160" width="36" height="26" rx="4" style={A} />
      <rect x="286" y="164" width="28" height="18" rx="2" fill="#fff" />
      <circle cx="296" cy="168" r="7" fill="#DFA67A" />

      {/* head */}
      <rect x="242" y="94" width="20" height="22" rx="8" fill="#DFA67A" />
      <ellipse cx="252" cy="78" rx="26" ry="28" fill="#E9B88F" />
      <path d="M226 76c-2-22 12-32 27-32 16 0 28 11 25 32-6-11-15-16-26-16s-19 5-26 16z" fill="#1F2937" />
      <circle cx="242" cy="80" r="2.4" fill="#1F2937" />
      <circle cx="263" cy="80" r="2.4" fill="#1F2937" />
      <g fill="none" stroke="#1E1B4B" strokeWidth="2.4">
        <circle cx="242" cy="80" r="8" />
        <circle cx="263" cy="80" r="8" />
        <path d="M250 80h5" />
      </g>
      <path d="M244 92c4 5 14 5 18 0" fill="none" stroke="#1F2937" strokeWidth="2.4" strokeLinecap="round" />

      {/* floating shapes */}
      <path d="M300 90l5-10 5 10-5 10z" style={A} opacity="0.8" />
      <circle cx="318" cy="112" r="5" style={B} opacity="0.5" />
    </svg>
  );
}
