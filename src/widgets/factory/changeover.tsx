import { ArrowSync20Filled, Checkmark16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { clock, enterDelay, useInterval } from "./_parts";

/* A SMED mold change on a 350 t injection press, standard 25:00 over seven steps.
 * It opens in the heat soak, ten seconds from overrunning its step, so the clock
 * turns amber live: neutral while inside standard, colour only once it is late. */
const STEPS = [
  { name: "Unclamp mold", std: 180 },
  { name: "Swap water lines", std: 240 },
  { name: "Lift out tool", std: 180 },
  { name: "Load tool 4417", std: 240 },
  { name: "Clamp & connect", std: 180 },
  { name: "Heat soak", std: 300 },
  { name: "First-off check", std: 180 },
] as const;
const STD = STEPS.reduce((s, x) => s + x.std, 0);
const SEED = { step: 5, elapsed: 1482, stepStart: 1192, done: false };
const RESET_MS = 9000;

/** Factory · small. A mold change against its 25:00 standard: the step track fills live, turns amber once late, and Done checks off each step. */
export function ChangeoverWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [run, setRun] = useState(SEED);
  const delay = enterDelay(index);

  useInterval(() => setRun((r) => ({ ...r, elapsed: r.elapsed + 1 })), run.done ? null : 1000);

  // A finished changeover rests on its summary, then the demo starts the next one.
  useEffect(() => {
    if (!run.done) return;
    const t = window.setTimeout(() => setRun(SEED), RESET_MS);
    return () => window.clearTimeout(t);
  }, [run.done]);

  const step = STEPS[run.step];
  const inStep = run.elapsed - run.stepStart;
  const stepLate = !run.done && inStep > step.std;
  const over = run.elapsed - STD;
  const late = over > 0;

  const next = () => {
    const at = run.elapsed;
    setRun((r) => (r.step >= STEPS.length - 1 ? { ...r, done: true } : { ...r, step: r.step + 1, stepStart: at }));
  };

  return (
    <Widget size="small" index={index} label="Mold changeover">
      <WidgetHeader
        icon={<ArrowSync20Filled />}
        tint={late && !run.done ? "var(--ios-orange)" : "var(--ios-indigo)"}
        title="Changeover"
        subtitle="IMM-07 · Tool 4417"
      />

      <div className="mt-2.5 flex items-baseline gap-1 whitespace-nowrap">
        <span
          className={cn(
            "text-[28px] leading-none font-semibold tracking-tight tabular transition-colors duration-500",
            late && !run.done ? "text-ios-orange" : "text-heading",
          )}
        >
          {clock(run.elapsed)}
        </span>
        <span className="text-[11px] text-tertiary tabular">/ {clock(STD)}</span>
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={run.done ? "done" : run.step}
          className="mt-1.5 leading-tight whitespace-nowrap"
          initial={{ opacity: 0, y: 5, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -5, filter: "blur(3px)" }}
        >
          <div className="truncate text-[12px] font-semibold text-heading">
            {run.done ? "Changeover complete" : `${run.step + 1}/7 · ${step.name}`}
          </div>
          <div className={cn("text-[11px] tabular", stepLate || (run.done && late) ? "text-ios-orange" : "text-tertiary")}>
            {run.done
              ? `${late ? "+" : "−"}${clock(Math.abs(over))} vs standard`
              : `${clock(inStep)} of ${clock(step.std)} in step`}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Step track: widths follow each step's standard minutes. */}
      <div className="mt-2 flex h-1.5 gap-[2px]">
        {STEPS.map((s, i) => {
          const isDone = run.done || i < run.step;
          const isNow = !run.done && i === run.step;
          const fill = isDone ? 1 : isNow ? Math.min(1, inStep / s.std) : 0;
          return (
            <div key={s.name} className="relative h-full overflow-hidden rounded-full bg-fill-secondary" style={{ flexGrow: s.std }}>
              <motion.div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full",
                  isNow && stepLate ? "bg-ios-orange" : isNow ? "bg-[var(--ant-color-text)]" : "bg-[var(--ant-color-text-tertiary)]",
                )}
                initial={{ width: 0 }}
                animate={
                  isNow && !reduce
                    ? { width: `${fill * 100}%`, opacity: [1, 0.55, 1] }
                    : { width: `${fill * 100}%`, opacity: 1 }
                }
                transition={{
                  width: { type: "spring", stiffness: 90, damping: 20, delay: run === SEED ? delay + i * 0.05 : 0 },
                  opacity: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex items-center gap-1.5">
        <MemojiAvatar who="f7" size={22} alt="Emily K." />
        <div className="min-w-0 flex-1 leading-tight whitespace-nowrap">
          <div className="truncate text-[11px] font-medium text-heading">Emily K.</div>
          <div className="text-[10px] text-tertiary">Setter</div>
        </div>
        <AnimatePresence mode="popLayout" initial={false}>
          {run.done ? (
            <motion.span
              key="ok"
              className="flex items-center gap-1 text-[11px] text-tertiary"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
            >
              <Checkmark16Filled className="size-3.5" />
              Running
            </motion.span>
          ) : (
            <motion.div key="btn" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}>
              <Button
                size="small"
                color="default"
                variant="filled"
                icon={<Checkmark16Filled />}
                onClick={next}
                aria-label={`Mark step ${run.step + 1}, ${step.name}, done`}
              >
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
