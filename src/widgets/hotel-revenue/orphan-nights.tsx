import { ArrowUndo16Regular, CalendarEmpty20Filled, Checkmark12Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { MARK, MarkChip, USD, nightsFrom } from "./_parts-a";

const NIGHTS = nightsFrom(14);

type Reason = "min_stay" | "cta";
type Run = {
  type: string;
  start: number;
  nights: number;
  rooms: number;
  reasons: Reason[];
  minStay: number;
  /** The master rate's price on the run's nights (Best Available Rate). */
  rate: number;
  /** The fix: the largest min stay on the arrival day that sells the gap, or lifting closed-to-arrival. */
  fix: { label: string; busy: string };
  /** Five nights around the run: booked, or orphan. */
  strip: ("b" | "o")[];
};

const RUNS: Run[] = [
  {
    type: "302 Standard Double",
    start: 1,
    nights: 1,
    rooms: 2,
    reasons: ["min_stay"],
    minStay: 2,
    rate: 260,
    fix: { label: "Lower min stay to 1", busy: "Lowering min stay…" },
    strip: ["b", "b", "o", "b", "b"],
  },
  {
    type: "306 Deluxe Sea View",
    start: 11,
    nights: 2,
    rooms: 1,
    reasons: ["min_stay"],
    minStay: 3,
    rate: 460,
    fix: { label: "Lower min stay to 2", busy: "Lowering min stay…" },
    strip: ["b", "o", "o", "b", "b"],
  },
  {
    type: "304 Superior Double",
    start: 6,
    nights: 1,
    rooms: 1,
    reasons: ["cta"],
    minStay: 1,
    rate: 315,
    fix: { label: "Open to arrival", busy: "Lifting CTA…" },
    strip: ["b", "o", "b", "b", "b"],
  },
];

const valueOf = (r: Run) => r.rate * r.nights * r.rooms;
const HATCH =
  "repeating-linear-gradient(135deg, var(--ios-orange) 0 2px, color-mix(in srgb, var(--ios-orange) 25%, transparent) 2px 5px)";

type State = "orphan" | "busy" | "open";

/** Revenue · medium. Orphan runs no stay can sell, with why and their value at the best rate; relax the min stay and the gap dissolves into nights open to sell. */
export function OrphanNightsWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [state, setState] = useState<State[]>(() => RUNS.map(() => "orphan"));
  const [counted, setCounted] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const t = window.setTimeout(() => setCounted(true), (delay + 0.3) * 1000);
    return () => {
      window.clearTimeout(t);
      timers.current.forEach((x) => window.clearTimeout(x));
    };
  }, [delay]);

  const set = (i: number, s: State) => setState((all) => all.map((v, j) => (j === i ? s : v)));
  const fix = (i: number) => {
    set(i, "busy");
    timers.current.push(window.setTimeout(() => set(i, "open"), 750));
  };

  const atRisk = RUNS.reduce((s, r, i) => s + (state[i] === "open" ? 0 : valueOf(r)), 0);
  const allOpen = state.every((s) => s === "open");

  return (
    <Widget size="medium" index={index} label="Orphan nights">
      <WidgetHeader
        icon={<CalendarEmpty20Filled />}
        tint="var(--ios-orange)"
        title="Orphan nights"
        subtitle="Gaps no stay can sell · at the best rate"
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            {allOpen ? (
              <motion.span
                key="ok"
                className="flex items-center gap-1 rounded-full bg-ios-green/15 px-2 py-0.5 text-[12px] font-semibold whitespace-nowrap text-ios-green"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Checkmark12Filled /> All open
              </motion.span>
            ) : (
              <motion.span
                key="risk"
                className="flex items-baseline gap-1 rounded-full bg-ios-orange/15 px-2 py-0.5 text-[13px] font-semibold whitespace-nowrap text-ios-orange"
                exit={{ opacity: 0, scale: 0.7 }}
              >
                <AnimatedNumber value={counted ? atRisk : 0} format={USD} />
                <span className="text-[10px] font-medium">at risk</span>
              </motion.span>
            )}
          </AnimatePresence>
        }
      />

      <div className="mt-1.5 flex flex-col gap-2">
        {RUNS.map((r, i) => {
          const s = state[i];
          const open = s === "open";
          const n = NIGHTS[r.start];
          return (
              <motion.div
                key={r.type}
                className={cn(
                  "relative flex h-[37px] items-center gap-2",
                  i > 0 && "before:absolute before:inset-x-0 before:-top-1 before:h-[0.5px] before:bg-split",
                )}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 28, delay: delay + i * 0.08 }}
              >
                <div className="flex h-[24px] w-[48px] shrink-0 items-end gap-[2px]" aria-hidden>
                  {r.strip.map((k, j) => (
                    <div key={j} className="relative h-full flex-1 overflow-hidden rounded-[3px] bg-fill-tertiary">
                      {k === "b" ? (
                        <motion.div
                          className="absolute inset-x-0 bottom-0 bg-ios-blue/45"
                          initial={{ height: 0 }}
                          animate={{ height: "100%" }}
                          transition={{ type: "spring", stiffness: 260, damping: 26, delay: delay + i * 0.08 + j * 0.04 }}
                        />
                      ) : (
                        <>
                          <motion.div
                            className="absolute inset-x-0 bottom-0 bg-ios-green/60"
                            animate={{ height: open ? "100%" : "0%" }}
                            transition={{ type: "spring", stiffness: 220, damping: 22, delay: open ? 0.15 : 0 }}
                          />
                          <AnimatePresence>
                            {!open ? (
                              <motion.div
                                key="hatch"
                                // 14px wider than the cell and slid by a transform: scrolling
                                // `background-position` repainted the hatch every frame.
                                className="absolute inset-y-0 -left-[14px] right-0"
                                style={{ backgroundImage: HATCH, backgroundSize: "7px 7px" }}
                                initial={{ opacity: 0 }}
                                animate={
                                  s === "busy"
                                    ? { opacity: [1, 0.35, 1], x: [0, 14] }
                                    : { opacity: 1, x: [0, 14] }
                                }
                                exit={{ opacity: 0, scale: 1.6, filter: "blur(3px)" }}
                                transition={{
                                  opacity: s === "busy" ? { duration: 0.5, repeat: Infinity } : { delay: delay + 0.2 },
                                  x: { duration: s === "busy" ? 0.6 : 2.6, repeat: Infinity, ease: "linear" },
                                  default: { duration: 0.45 },
                                }}
                              />
                            ) : null}
                          </AnimatePresence>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-[12px] font-semibold text-heading">{r.type}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] whitespace-nowrap text-tertiary">
                    {r.reasons.map((reason) => (
                      <Tooltip
                        key={reason}
                        title={
                          reason === "min_stay"
                            ? `Min stay ${r.minStay} on ${n.weekday} ${n.day} arrivals`
                            : `${MARK.cta.long} on ${n.weekday} ${n.day}`
                        }
                      >
                        <motion.span
                          className="inline-flex cursor-default"
                          animate={open ? { opacity: 0.45, scale: 0.9 } : { opacity: 1, scale: 1 }}
                        >
                          <MarkChip kind={reason} value={r.minStay} className={cn(open && "line-through")} />
                        </motion.span>
                      </Tooltip>
                    ))}
                    <span className="truncate tabular">
                      {n.weekday} {n.day}
                      {r.nights > 1 ? `–${NIGHTS[r.start + r.nights - 1].day}` : ""} · {r.nights} night{r.nights > 1 ? "s" : ""} ·{" "}
                      {r.rooms} room{r.rooms > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="flex w-[118px] shrink-0 flex-col items-end leading-tight">
                  <AnimatedNumber
                    value={counted ? valueOf(r) : 0}
                    format={USD}
                    className={cn("text-[13px] font-semibold transition-colors", open ? "text-ios-green" : "text-heading")}
                  />
                  <div className="mt-0.5 h-[14px] text-[10px] leading-[14px] whitespace-nowrap">
                    <AnimatePresence mode="wait" initial={false}>
                      {s === "orphan" ? (
                        <motion.button
                          key="fix"
                          type="button"
                          onClick={() => fix(i)}
                          className="cursor-pointer rounded-full bg-ios-blue/12 px-1.5 font-semibold text-ios-blue hover:bg-ios-blue/20"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          whileTap={{ scale: 0.92 }}
                        >
                          {r.fix.label}
                        </motion.button>
                      ) : s === "busy" ? (
                        <motion.span
                          key="busy"
                          className="text-tertiary"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {r.fix.busy}
                        </motion.span>
                      ) : (
                        <motion.span
                          key="open"
                          className="flex items-center gap-1 font-semibold text-ios-green"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          <Checkmark12Filled className="size-2.5" />
                          open to sell
                          <button
                            type="button"
                            aria-label={`Undo for ${r.type}`}
                            onClick={() => set(i, "orphan")}
                            className="ml-0.5 grid size-3.5 cursor-pointer place-items-center rounded-full text-tertiary hover:bg-fill-secondary hover:text-secondary"
                          >
                            <ArrowUndo16Regular className="size-2.5" />
                          </button>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
          );
        })}
      </div>
    </Widget>
  );
}
