import { ArrowCounterclockwise16Regular, Timer20Filled, Pause16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Timer = { id: string; name: string; total: number; left: number; color: string; paused: boolean; batch: number };
const INITIAL: Timer[] = [
  { id: "fries", name: "Fries blanch", total: 6 * 60, left: 9, color: "var(--ios-yellow)", paused: false, batch: 4 },
  { id: "focaccia", name: "Dough proof", total: 45 * 60, left: 18 * 60 + 40, color: "var(--ios-orange)", paused: false, batch: 2 },
  { id: "stock", name: "Veal stock", total: 4 * 3600, left: 3600 + 52 * 60 + 10, color: "var(--ios-teal)", paused: false, batch: 1 },
];
const R = 11;
const C = 2 * Math.PI * R;
const TWO = { minimumIntegerDigits: 2 } as const;

/** Restaurant · small. Three prep timers counting down with rings; a finished batch flashes red until you tap it to start the next, tap a running one to pause. */
export function PrepTimersWidget({ index }: { index?: number }) {
  const [timers, setTimers] = useState(INITIAL);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(
      () => setTimers((ts) => ts.map((x) => (x.paused || x.left === 0 ? x : { ...x, left: x.left - 1 }))),
      1000,
    );
    return () => window.clearInterval(t);
  }, []);

  const tap = (id: string) =>
    setTimers((ts) =>
      ts.map((x) =>
        x.id !== id ? x : x.left === 0 ? { ...x, left: x.total, batch: x.batch + 1, paused: false } : { ...x, paused: !x.paused },
      ),
    );

  const due = timers.filter((x) => x.left === 0).length;

  return (
    <Widget size="small" index={index} label="Prep timers">
      <WidgetHeader
        icon={<Timer20Filled />}
        tint="var(--ios-orange)"
        title="Prep Timers"
        subtitle={due ? `${due} ready to pull` : "Line prep · 3 running"}
      />

      <div className="mt-2 flex min-h-0 flex-1 flex-col justify-between">
        {timers.map((x, i) => {
          const done = x.left === 0;
          const frac = x.left / x.total;
          const long = x.left >= 3600;
          return (
            <motion.button
              key={x.id}
              type="button"
              onClick={() => tap(x.id)}
              aria-label={done ? `Start next ${x.name} batch` : x.paused ? `Resume ${x.name}` : `Pause ${x.name}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 28, delay: delay + i * 0.07 }}
              className={cn(
                "relative -mx-1 flex h-[36px] cursor-pointer items-center gap-2 overflow-hidden rounded-xl px-1 text-left transition-colors",
                done ? "bg-ios-red/15" : "hover:bg-fill-quaternary",
              )}
            >
              {done ? (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 bg-ios-red/20"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              ) : null}
              <span className="relative grid size-[28px] shrink-0 place-items-center">
                <svg viewBox="0 0 28 28" className="absolute inset-0 -rotate-90">
                  <circle cx="14" cy="14" r={R} fill="none" strokeWidth="3" className="stroke-fill-secondary" />
                  <motion.circle
                    cx="14"
                    cy="14"
                    r={R}
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    stroke={done ? "var(--ios-red)" : x.color}
                    strokeOpacity={x.paused ? 0.45 : 1}
                    strokeDasharray={C}
                    initial={{ strokeDashoffset: C }}
                    animate={{ strokeDashoffset: C * (1 - (done ? 1 : frac)) }}
                    transition={{ type: "spring", stiffness: 80, damping: 20 }}
                  />
                </svg>
                <AnimatePresence mode="popLayout" initial={false}>
                  {done || x.paused ? (
                    <motion.span
                      key={done ? "done" : "pause"}
                      className={cn("relative grid", done ? "text-ios-red" : "text-tertiary")}
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                    >
                      {done ? <ArrowCounterclockwise16Regular className="size-3" /> : <Pause16Filled className="size-3" />}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </span>
              <span className="relative min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[12px] font-semibold text-heading">{x.name}</span>
                <span className={cn("block truncate text-[10px]", done ? "font-semibold text-ios-red" : "text-tertiary")}>
                  {done ? "Pull now" : x.paused ? "Paused" : `Batch ${x.batch}`}
                </span>
              </span>
              <span
                className={cn(
                  "relative flex items-baseline text-[14px] font-semibold tracking-tight",
                  done ? "text-ios-red" : x.paused ? "text-tertiary" : "text-heading",
                )}
              >
                {long ? (
                  <>
                    <AnimatedNumber value={Math.floor(x.left / 3600)} trend={-1} />:
                    <AnimatedNumber value={Math.floor((x.left % 3600) / 60)} format={TWO} trend={-1} />
                    <span className="ml-px text-[10px] font-medium text-tertiary">h</span>
                  </>
                ) : (
                  <>
                    <AnimatedNumber value={Math.floor(x.left / 60)} trend={-1} />:
                    <AnimatedNumber value={x.left % 60} format={TWO} trend={-1} />
                  </>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>
    </Widget>
  );
}
