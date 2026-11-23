import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

/** Entrance delay shared by every factory widget: lands just after the card does. */
export const enterDelay = (index?: number) => 0.3 + (index ?? 0) * 0.06;

/** A setInterval that always reads the latest callback and is cleared on unmount. */
export function useInterval(fn: () => void, ms: number | null) {
  const saved = useRef(fn);
  saved.current = fn;
  useEffect(() => {
    if (ms === null) return;
    const t = window.setInterval(() => saved.current(), ms);
    return () => window.clearInterval(t);
  }, [ms]);
}

/** A sparkline path through `points`, scaled into a `w × h` box. */
export function sparkPath(points: number[], w: number, h: number, lo?: number, hi?: number) {
  const min = lo ?? Math.min(...points);
  const max = hi ?? Math.max(...points);
  const span = max - min || 1;
  return points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

/** ISA-18.2 alarm priority: colour, shape and number travel together. */
export type Priority = 1 | 2 | 3;
const PRIORITY = {
  1: { color: "var(--ios-red)", ink: "#fff" },
  2: { color: "var(--ios-orange)", ink: "#fff" },
  3: { color: "var(--ios-yellow)", ink: "#000" },
} as const;

/**
 * The alarm mark: P1 a red diamond, P2 an orange triangle pointing up, P3 a yellow
 * triangle pointing down, each carrying its number. It flashes at about 1 Hz only
 * while the alarm is unacknowledged, and holds steady once acknowledged.
 */
export function AlarmMark({
  priority,
  flashing = false,
  size = 18,
}: {
  priority: Priority;
  flashing?: boolean;
  size?: number;
}) {
  const reduce = useReducedMotion();
  const p = PRIORITY[priority];
  const shape =
    priority === 1 ? (
      <rect x="4" y="4" width="12" height="12" rx="1.6" transform="rotate(45 10 10)" fill={p.color} />
    ) : priority === 2 ? (
      <path d="M10 1.8 18.6 17.2H1.4Z" fill={p.color} strokeLinejoin="round" stroke={p.color} strokeWidth="1.2" />
    ) : (
      <path d="M1.4 2.8H18.6L10 18.2Z" fill={p.color} strokeLinejoin="round" stroke={p.color} strokeWidth="1.2" />
    );
  const ty = priority === 2 ? 14.6 : priority === 3 ? 10.6 : 13.3;
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} className="shrink-0 overflow-visible" aria-label={`Priority ${priority} alarm`}>
      <motion.g
        animate={flashing && !reduce ? { opacity: [1, 0.22, 1] } : { opacity: 1 }}
        transition={flashing && !reduce ? { duration: 1, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
      >
        {shape}
        <text x="10" y={ty} textAnchor="middle" fontSize="9.5" fontWeight="700" fill={p.ink}>
          {priority}
        </text>
      </motion.g>
    </svg>
  );
}

/** mm:ss from seconds, for downtime and hold timers. */
export const clock = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
