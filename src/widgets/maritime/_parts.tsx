import { useEffect, useRef } from "react";

/** Entrance delay shared by every maritime widget: lands just after the card does. */
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

/** hh:mm from minutes after midnight (wraps past 24 h). */
export const hhmm = (m: number) => {
  const v = ((Math.round(m) % 1440) + 1440) % 1440;
  return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
};

/** A signed h:mm delta, e.g. +2:40 or −0:25. */
export const delta = (m: number) => {
  const a = Math.abs(Math.round(m));
  return `${m < 0 ? "−" : "+"}${Math.floor(a / 60)}:${String(a % 60).padStart(2, "0")}`;
};

/** A sparkline path through `points`, scaled into a `w × h` box. */
export function sparkPath(points: number[], w: number, h: number, lo?: number, hi?: number) {
  const min = lo ?? Math.min(...points);
  const max = hi ?? Math.max(...points);
  const span = max - min || 1;
  return points
    .map((v, i) => `${i ? "L" : "M"}${((i / (points.length - 1)) * w).toFixed(1)} ${(h - ((v - min) / span) * h).toFixed(1)}`)
    .join(" ");
}
