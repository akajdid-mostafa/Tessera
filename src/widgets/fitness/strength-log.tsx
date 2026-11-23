import { Checkmark12Filled, Dumbbell20Filled, Trophy16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Exercise = { name: string; sets: number; reps: number; kg: number; rest: number; lastKg: number };
const PLAN: Exercise[] = [
  { name: "Back Squat", sets: 4, reps: 5, kg: 102.5, rest: 150, lastKg: 100 },
  { name: "Romanian Deadlift", sets: 3, reps: 8, kg: 80, rest: 120, lastKg: 80 },
  { name: "Walking Lunge", sets: 3, reps: 10, kg: 20, rest: 90, lastKg: 17.5 },
];
const R = 32;
const C = 2 * Math.PI * R;
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const vol = (e: Exercise, sets: number) => sets * e.reps * e.kg;

/** Fitness · medium. A strength session's current lift as set chips beside a rest timer; tap the next set to log it and the rest ring restarts, tap the last logged set to undo. */
export function StrengthLogWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [ex, setEx] = useState(0);
  const [done, setDone] = useState(2);
  const [rest, setRest] = useState(72);
  const [restTotal, setRestTotal] = useState(PLAN[0].rest);
  const advance = useRef<number | null>(null);

  const e = PLAN[ex];
  const finished = done >= e.sets;
  const sessionDone = finished && ex === PLAN.length - 1;

  useEffect(() => {
    if (rest <= 0) return;
    const t = window.setTimeout(() => setRest((r) => Math.max(0, r - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [rest]);

  useEffect(
    () => () => {
      if (advance.current) window.clearTimeout(advance.current);
    },
    [],
  );

  const logSet = () => {
    const next = done + 1;
    setDone(next);
    if (next < e.sets) {
      setRest(e.rest);
      setRestTotal(e.rest);
      return;
    }
    setRest(0);
    if (ex < PLAN.length - 1) {
      const nextEx = PLAN[ex + 1];
      advance.current = window.setTimeout(() => {
        setEx((x) => x + 1);
        setDone(0);
        setRest(nextEx.rest);
        setRestTotal(nextEx.rest);
      }, 1800);
    }
  };

  const undo = () => {
    if (advance.current) window.clearTimeout(advance.current);
    setDone((d) => Math.max(0, d - 1));
    setRest(0);
  };

  const volume = PLAN.slice(0, ex).reduce((a, p) => a + vol(p, p.sets), 0) + vol(e, done);
  const resting = rest > 0;
  const pr = e.kg > e.lastKg;

  return (
    <Widget size="medium" index={index} label="Strength session">
      <WidgetHeader
        icon={<Dumbbell20Filled />}
        tint="var(--ios-indigo)"
        title="Leg Day"
        subtitle={`Exercise ${ex + 1} of ${PLAN.length} · Strength A`}
        extra={
          <div className="text-right leading-tight whitespace-nowrap">
            <div className="text-[11px] text-tertiary">Volume</div>
            <div className="text-[15px] font-semibold text-heading">
              <AnimatedNumber value={volume} format={{ maximumFractionDigits: 0 }} />
              <span className="text-[11px] font-medium text-tertiary"> kg</span>
            </div>
          </div>
        }
      />

      <div className="mt-2.5 flex items-center gap-3.5">
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={ex}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
              className="whitespace-nowrap leading-tight"
            >
              <div className="truncate text-[15px] font-semibold text-heading">{e.name}</div>
              <div className="truncate text-[11px] text-tertiary tabular">
                {e.sets} × {e.reps} @ {e.kg} kg · rest {mmss(e.rest)}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-2 flex gap-1.5">
            {Array.from({ length: e.sets }, (_, s) => {
              const isDone = s < done;
              const isNext = s === done;
              const isLast = s === done - 1;
              const tip = isNext ? "Tap to log this set" : isLast ? "Tap to undo" : isDone ? "Logged" : "Up later";
              return (
                <Tooltip key={`${ex}-${s}`} title={tip} mouseEnterDelay={0.3}>
                  <motion.button
                    type="button"
                    aria-label={`Set ${s + 1}, ${isDone ? "logged" : "not logged"}`}
                    onClick={isNext ? logSet : isLast ? undo : undefined}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={isNext || isLast ? { scale: 0.9 } : undefined}
                    transition={{ type: "spring", stiffness: 420, damping: 26, delay: ex === 0 ? delay + s * 0.05 : s * 0.05 }}
                    className={cn(
                      "relative flex h-10 min-w-0 flex-1 flex-col items-center justify-center rounded-xl leading-tight outline-none transition-colors duration-mid",
                      isDone && "bg-ios-green/15",
                      isNext && "cursor-pointer bg-fill-tertiary hover:bg-fill-secondary",
                      !isDone && !isNext && "bg-fill-quaternary",
                      isLast && "cursor-pointer",
                    )}
                  >
                    {isNext && !resting ? (
                      <motion.span
                        className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-ios-orange"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                      />
                    ) : null}
                    <span className="text-[10px] text-tertiary">Set {s + 1}</span>
                    <span className={cn("text-[12px] font-semibold tabular", isDone || isNext ? "text-heading" : "text-tertiary")}>
                      {e.reps} × {e.kg}
                    </span>
                    <AnimatePresence>
                      {isDone ? (
                        <motion.span
                          key="ok"
                          className="absolute top-1 right-1 grid size-3.5 place-items-center rounded-full bg-ios-green text-[9px] text-white"
                          initial={{ scale: 0 }}
                          animate={{ scale: [0, 1.3, 1] }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                        >
                          <Checkmark12Filled />
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                  </motion.button>
                </Tooltip>
              );
            })}
          </div>
        </div>

        <Tooltip title={resting ? "Tap to skip rest" : finished ? "Exercise done" : "Rest over"}>
          <motion.button
            type="button"
            aria-label={resting ? `Rest ${mmss(rest)} left, skip` : "Rest timer"}
            onClick={() => setRest(0)}
            whileTap={resting ? { scale: 0.92 } : undefined}
            className={cn("relative grid size-[76px] shrink-0 place-items-center rounded-full outline-none", resting && "cursor-pointer")}
          >
            <svg viewBox="0 0 76 76" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="38" cy="38" r={R} fill="none" strokeWidth="6" className="stroke-fill-secondary" />
              <motion.circle
                cx="38"
                cy="38"
                r={R}
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={C}
                initial={{ strokeDashoffset: C, stroke: resting ? "var(--ios-blue)" : "var(--ios-green)" }}
                animate={{
                  strokeDashoffset: resting ? C * (1 - rest / restTotal) : 0,
                  stroke: resting ? "var(--ios-blue)" : "var(--ios-green)",
                }}
                transition={{ type: "spring", stiffness: 90, damping: 20 }}
              />
            </svg>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={resting ? "rest" : finished ? "done" : "go"}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ type: "spring", stiffness: 420, damping: 26 }}
                className="relative text-center leading-none"
              >
                {resting ? (
                  <>
                    <div className="text-[17px] font-semibold text-heading tabular">
                      <AnimatedNumber value={Math.floor(rest / 60)} />:
                      <AnimatedNumber value={rest % 60} format={{ minimumIntegerDigits: 2 }} />
                    </div>
                    <div className="mt-0.5 text-[10px] text-tertiary">Rest</div>
                  </>
                ) : (
                  <div className="text-[15px] font-semibold text-ios-green">{sessionDone ? "Done" : finished ? "Next" : "Go"}</div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.button>
        </Tooltip>
      </div>

      <div className="mt-auto flex h-4 items-center gap-1.5 whitespace-nowrap text-[11px]">
        {pr ? <Trophy16Filled className="size-3.5 shrink-0 text-ios-yellow" /> : null}
        <span className={cn("truncate", pr ? "font-semibold text-ios-yellow" : "text-tertiary")}>
          {sessionDone
            ? "Session complete · 3 lifts logged"
            : pr
              ? `+${e.kg - e.lastKg} kg on last week · new best`
              : `Same as last week · ${e.sets} × ${e.reps} @ ${e.lastKg} kg`}
        </span>
      </div>
    </Widget>
  );
}
