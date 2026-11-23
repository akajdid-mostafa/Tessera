import { cn } from "@/registry/antuikit/lib/utils";

/* Shared bits of the tour-ops widgets in `_entries-b.ts`. */

/** Minutes since midnight. */
export const hm = (h: number, m = 0) => h * 60 + m;

/** 14:05 from minutes since midnight. */
export const clock = (m: number) =>
  `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(Math.floor(m % 60)).padStart(2, "0")}`;

/** A small live dot that pings, for a status chip. `tone` is a Tailwind bg class. */
export function PingDot({ tone, className }: { tone: string; className?: string }) {
  return (
    <span className={cn("relative flex size-1.5 shrink-0", className)}>
      <span className={cn("absolute inset-0 animate-ping rounded-full opacity-70", tone)} />
      <span className={cn("relative size-1.5 rounded-full", tone)} />
    </span>
  );
}
