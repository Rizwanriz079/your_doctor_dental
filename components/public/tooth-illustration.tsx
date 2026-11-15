import { useId } from "react";

/**
 * Original illustrated "glass tooth": a smooth, symmetric molar with a soft gloss,
 * faint scan contours and an orbit ring that passes behind and in front of it.
 * Pure SVG, no external assets. Every stroke-only path sets fill="none".
 */
const TOOTH =
  "M240 92C262 72 300 62 330 70C372 82 392 124 388 172C385 214 368 246 360 282C352 322 352 372 340 420C332 452 318 470 302 466C284 462 280 430 276 400C271 362 262 330 240 330C218 330 209 362 204 400C200 430 196 462 178 466C162 470 148 452 140 420C128 372 128 322 120 282C112 246 95 214 92 172C88 124 108 82 150 70C180 62 218 72 240 92Z";

export function ToothIllustration({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 480 520" className={className} role="img" aria-label="Illustration of a healthy tooth">
      <defs>
        <radialGradient id={`${id}-ti-glow`} cx="50%" cy="46%" r="52%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="60%" stopColor="#cdebec" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#cdebec" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-ti-body`} x1="0.15" y1="0.05" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#f1f9fb" />
          <stop offset="100%" stopColor="#bfe2e7" />
        </linearGradient>
        <radialGradient id={`${id}-ti-depth`} cx="72%" cy="62%" r="60%">
          <stop offset="0%" stopColor="#0f8b8d" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0f8b8d" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-ti-gloss`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-ti-ring`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2fa3a5" stopOpacity="0" />
          <stop offset="50%" stopColor="#2fa3a5" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#2fa3a5" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-ti-clip`}>
          <path d={TOOTH} />
        </clipPath>
        {/* lower half of the ring's own (rotated) coordinate space = the part in front of the tooth */}
        <clipPath id={`${id}-ti-front`}>
          <rect x="0" y="300" width="480" height="220" />
        </clipPath>
        <filter id={`${id}-ti-blur`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      {/* ambient glow and floor shadow */}
      <circle cx="240" cy="260" r="225" fill={`url(#${id}-ti-glow)`} />
      <ellipse cx="240" cy="488" rx="110" ry="14" fill="#17324d" opacity="0.12" filter={`url(#${id}-ti-blur)`} />

      {/* orbit ring – back half (behind the tooth) */}
      <g transform="rotate(-10 240 300)">
        <ellipse cx="240" cy="300" rx="215" ry="56" fill="none" stroke={`url(#${id}-ti-ring)`} strokeWidth="1.5" opacity="0.55" />
      </g>

      {/* tooth body */}
      <path d={TOOTH} fill={`url(#${id}-ti-body)`} />
      <g clipPath={`url(#${id}-ti-clip)`}>
        <path d={TOOTH} fill={`url(#${id}-ti-depth)`} />
        {/* faint digital scan contours */}
        <g className="tooth-scan" fill="none" stroke="#0f8b8d" strokeOpacity="0.1" strokeWidth="1">
          {Array.from({ length: 9 }, (_, i) => (
            <path key={i} d={`M80 ${120 + i * 40} Q240 ${100 + i * 40} 400 ${120 + i * 40}`} />
          ))}
        </g>
        {/* soft gloss on the upper-left of the crown */}
        <ellipse cx="185" cy="150" rx="62" ry="80" fill={`url(#${id}-ti-gloss)`} opacity="0.9" transform="rotate(-18 185 150)" />
      </g>
      {/* soft teal outline so the edge reads on light backgrounds, then a white rim light */}
      <path d={TOOTH} fill="none" stroke="#63bcbe" strokeWidth="5" strokeOpacity="0.45" strokeLinejoin="round" />
      <path d={TOOTH} fill="none" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.95" strokeLinejoin="round" />
      {/* crisp specular highlight */}
      <path d="M128 168C126 140 138 112 160 98" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" opacity="0.85" />

      {/* orbit ring – front half (passes in front of the tooth) */}
      <g transform="rotate(-10 240 300)">
        <ellipse
          cx="240"
          cy="300"
          rx="215"
          ry="56"
          fill="none"
          stroke={`url(#${id}-ti-ring)`}
          strokeWidth="2.25"
          clipPath={`url(#${id}-ti-front)`}
        />
        <circle className="tooth-beacon" cx="442" cy="319" r="11" fill="#2fa3a5" opacity="0.18" />
        <circle cx="442" cy="319" r="5" fill="#2fa3a5" />
      </g>

      {/* sparkle */}
      <path className="tooth-sparkle" d="M318 150l5 13 13 5-13 5-5 13-5-13-13-5 13-5z" fill="#ffffff" />
      <path className="tooth-sparkle" d="M318 150l5 13 13 5-13 5-5 13-5-13-13-5 13-5z" fill="none" stroke="#0f8b8d" strokeOpacity="0.15" />
    </svg>
  );
}
