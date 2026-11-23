import { motion } from "motion/react";

/** A four-blade fan that spins while running; used for purifiers and ceiling fans. */
export function FanGlyph({ spin }: { spin: boolean }) {
  return (
    <svg viewBox="-10 -10 20 20" width="1em" height="1em" aria-hidden>
      <g
        className={spin ? "animate-spin" : undefined}
        style={{ animationDuration: "1.6s", transformBox: "fill-box", transformOrigin: "center" }}
      >
        {[0, 90, 180, 270].map((a) => (
          <path key={a} d="M0 0C1.5-4.5 5.5-8 8.5-6.5 9.5-3.5 5-1 0 0Z" transform={`rotate(${a})`} fill="currentColor" />
        ))}
      </g>
      <circle r="1.8" fill="currentColor" />
    </svg>
  );
}

/** Window blinds whose slats lift to the given open fraction (0 closed, 1 open). */
export function BlindsGlyph({ open }: { open: number }) {
  const slats = 5;
  return (
    <svg viewBox="0 0 20 20" width="1em" height="1em" aria-hidden>
      <rect x="2" y="2" width="16" height="2" rx="1" fill="currentColor" />
      {Array.from({ length: slats }, (_, i) => (
        <motion.rect
          key={i}
          x="3"
          width="14"
          height="1.6"
          rx="0.8"
          fill="currentColor"
          initial={false}
          animate={{ attrY: 5 + i * 2.6 * (1 - open * 0.75), opacity: 1 - open * 0.35 }}
          transition={{ type: "spring", stiffness: 260, damping: 22, delay: i * 0.03 }}
        />
      ))}
      <line x1="10" x2="10" y1="4" y2="17" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}
