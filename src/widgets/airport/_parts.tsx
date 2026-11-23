import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { cn } from "@/registry/antuikit/lib/utils";

/** Entrance delay shared by every airport widget: lands just after the card does. */
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

/** HH:MM from minutes after midnight. */
export const hhmm = (m: number) => {
  const d = ((Math.floor(m) % 1440) + 1440) % 1440;
  return `${String(Math.floor(d / 60)).padStart(2, "0")}:${String(d % 60).padStart(2, "0")}`;
};

/** Page dots for widgets that page on tap. */
export function PageDots({ count, active }: { count: number; active: number }) {
  return (
    <span className="flex items-center gap-1" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <motion.span
          key={i}
          className={cn("h-1.5 rounded-full", i === active ? "bg-heading" : "bg-fill")}
          animate={{ width: i === active ? 12 : 6 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
        />
      ))}
    </span>
  );
}

/** A small live dot: steady, or pinging when something needs eyes. */
export function LiveDot({ color, ping = false }: { color: string; ping?: boolean }) {
  return (
    <span className="relative flex size-1.5 shrink-0">
      {ping ? <span className="absolute inset-0 animate-ping rounded-full opacity-70" style={{ background: color }} /> : null}
      <span className="relative size-1.5 rounded-full" style={{ background: color }} />
    </span>
  );
}
