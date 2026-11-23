import { Fire16Filled, Steps20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const WEEKS = 20;
const GOAL = 8000;
const CELL = 11;
const GAP = 3;
/** Today is Monday, Nov 9, 2026, the first cell of the last column. */
const TODAY = new Date(2026, 10, 9);
const DAYS = (WEEKS - 1) * 7 + 1;
const STREAK_BEFORE = 23;
const START_TODAY = 7860;

/* A deterministic history: weekends run long, a few rest days dip, and a sick day 24 days ago
 * ended the last streak. The 23 days since have all cleared the goal. */
const HISTORY: number[] = (() => {
  let seed = 41;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: DAYS - 1 }, (_, d) => {
    const weekend = d % 7 >= 5;
    const fromToday = DAYS - 1 - d;
    if (fromToday === STREAK_BEFORE + 1) return 2140;
    const base = weekend ? 11200 : 8600;
    let v = Math.round(base + (rnd() - 0.5) * 9000);
    if (fromToday <= STREAK_BEFORE) v = Math.max(8150 + Math.round(rnd() * 600), v);
    else if (rnd() < 0.1) v = Math.round(2600 + rnd() * 2400);
    return Math.max(1800, Math.min(18400, v));
  });
})();

const dateOf = (d: number) => {
  const x = new Date(TODAY);
  x.setDate(TODAY.getDate() - (DAYS - 1 - d));
  return x;
};
const LEVELS = ["bg-fill-tertiary", "bg-ios-green/25", "bg-ios-green/50", "bg-ios-green/75", "bg-ios-green"];
const level = (v: number) => (v < 4000 ? 0 : v < GOAL ? 1 : v < 11000 ? 2 : v < 14000 ? 3 : 4);

const MONTHS = Array.from({ length: WEEKS }, (_, w) => dateOf(w * 7)).flatMap((d, w, all) =>
  w > 0 && d.getMonth() !== all[w - 1].getMonth() ? [{ w, label: d.toLocaleDateString("en-US", { month: "short" }) }] : [],
);

/** Fitness · medium. Twenty weeks of daily steps as a contribution grid; today ticks live toward the goal, and hovering any day reads it out. */
export function StepStreakWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [today, setToday] = useState(START_TODAY);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => {
      setToday((s) => (s >= 9400 ? s : s + 18 + Math.round(Math.random() * 30)));
    }, 2200);
    return () => window.clearInterval(t);
  }, []);

  const steps = [...HISTORY, today];
  const streak = STREAK_BEFORE + (today >= GOAL ? 1 : 0);
  const i = hover ?? DAYS - 1;
  const v = steps[i];
  const isToday = i === DAYS - 1;
  const label = isToday ? "Today" : dateOf(i).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <Widget size="medium" index={index} label="Daily steps">
      <WidgetHeader
        icon={<Steps20Filled />}
        tint="var(--ios-green)"
        title="Steps"
        subtitle={`Last ${WEEKS} weeks · goal 8,000`}
        extra={
          <motion.span
            key={streak}
            initial={{ scale: 0.7 }}
            animate={{ scale: [0.7, 1.15, 1] }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center gap-1 whitespace-nowrap rounded-full bg-ios-orange/15 px-2 py-0.5 text-[11px] font-semibold text-ios-orange"
          >
            <Fire16Filled className="size-3.5" />
            <AnimatedNumber value={streak} /> day streak
          </motion.span>
        }
      />

      <div className="mt-2.5 flex gap-3.5">
        <div className="shrink-0">
          <div
            className="grid grid-flow-col"
            style={{ gridTemplateRows: `repeat(7, ${CELL}px)`, gridAutoColumns: `${CELL}px`, gap: GAP }}
            onPointerLeave={() => setHover(null)}
          >
            {steps.map((s, d) => {
              const col = Math.floor(d / 7);
              const last = d === DAYS - 1;
              return (
                <motion.span
                  key={d}
                  onPointerEnter={() => setHover(d)}
                  className={cn(
                    "rounded-[3px] transition-colors duration-mid",
                    LEVELS[level(s)],
                    hover === d && "ring-1 ring-inset ring-sel",
                  )}
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={last && hover === null ? { opacity: [1, 0.55, 1], scale: 1 } : { opacity: 1, scale: 1 }}
                  transition={
                    last && hover === null
                      ? { opacity: { duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: delay + 1 }, scale: { delay: delay + col * 0.03 } }
                      : { type: "spring", stiffness: 400, damping: 24, delay: hover === null ? delay + col * 0.03 : 0 }
                  }
                />
              );
            })}
          </div>
          <div className="relative mt-1 h-3 text-[10px] leading-3 text-tertiary">
            {MONTHS.map((m) => (
              <span key={m.w} className="absolute" style={{ left: m.w * (CELL + GAP) }}>
                {m.label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col whitespace-nowrap leading-tight">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className={cn("text-[11px] font-semibold", isToday ? "text-ios-green" : "text-secondary")}
            >
              {label}
            </motion.div>
          </AnimatePresence>
          <AnimatedNumber value={v} className="mt-0.5 text-[22px] leading-none font-semibold tracking-tight text-heading" />
          <div className="text-[11px] text-tertiary">steps</div>

          <div className="mt-auto">
            <div className="h-1.5 overflow-hidden rounded-full bg-fill-secondary">
              <motion.div
                className={cn("h-full rounded-full", v >= GOAL ? "bg-ios-green" : "bg-ios-green/50")}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (v / GOAL) * 100)}%` }}
                transition={{ type: "spring", stiffness: 140, damping: 20, delay: hover === null && isToday ? delay + 0.4 : 0 }}
              />
            </div>
            <div className={cn("mt-1 text-[11px] font-semibold", v >= GOAL ? "text-ios-green" : "text-secondary")}>
              {v >= GOAL ? (
                "Goal met"
              ) : (
                <>
                  <AnimatedNumber value={GOAL - v} /> to go
                </>
              )}
            </div>
            <div className="text-[10px] text-tertiary">
              ≈ <AnimatedNumber value={v * 0.00072} format={{ maximumFractionDigits: 1, minimumFractionDigits: 1 }} /> km
            </div>
          </div>
        </div>
      </div>
    </Widget>
  );
}
