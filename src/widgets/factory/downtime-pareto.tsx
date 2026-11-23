import { Checkmark12Filled, DataBarVertical20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { enterDelay } from "./_parts";

/* Unplanned downtime on a packaging line this shift, as a Pareto: bars by minutes,
 * the cumulative share as a line, the 80% cut dashed. Stops nobody has coded sit
 * in a hatched bar that nags until someone picks a reason. */
type Reason = { key: string; label: string; full: string; min: number; stops: number; uncoded?: boolean };
const SEED: Reason[] = [
  { key: "jam", label: "Jam", full: "Material jam", min: 28, stops: 4 },
  { key: "uncoded", label: "None", full: "Uncoded stops", min: 21, stops: 3, uncoded: true },
  { key: "starved", label: "Starved", full: "Starved infeed", min: 17, stops: 2 },
  { key: "label", label: "Label", full: "Label misfeed", min: 12, stops: 3 },
  { key: "co", label: "C/O", full: "Changeover overrun", min: 9, stops: 1 },
  { key: "sensor", label: "Sensor", full: "Photo-eye fault", min: 7, stops: 2 },
];
const PICK = ["jam", "starved", "label", "sensor"] as const;
/** A fresh uncoded stop lands this long after everything is coded. */
const NEXT_STOP_MS = 12000;
const LABEL_H = 14;

const sortDesc = (rs: Reason[]) => [...rs].sort((a, b) => b.min - a.min);

/** Factory · medium. Shift downtime as a Pareto with a cumulative line; tap the hatched uncoded bar to assign a reason and the bars re-rank. */
export function DowntimeParetoWidget({ index }: { index?: number }) {
  const [reasons, setReasons] = useState(SEED);
  const [picking, setPicking] = useState(false);
  const [first, setFirst] = useState(true);
  const delay = enterDelay(index);

  const uncoded = reasons.find((r) => r.uncoded);
  useEffect(() => {
    if (uncoded) return;
    const t = window.setTimeout(() => {
      setFirst(false);
      setReasons((rs) => sortDesc([...rs, { key: "uncoded", label: "None", full: "Uncoded stops", min: 4, stops: 1, uncoded: true }]));
    }, NEXT_STOP_MS);
    return () => window.clearTimeout(t);
  }, [uncoded]);

  const total = reasons.reduce((s, r) => s + r.min, 0);
  const stops = reasons.reduce((s, r) => s + r.stops, 0);
  const max = Math.max(...reasons.map((r) => r.min));
  const n = reasons.length;

  const cum = useMemo(() => {
    let acc = 0;
    return reasons.map((r) => (acc += r.min) / total);
  }, [reasons, total]);
  const d = cum.map((c, i) => `${i ? "L" : "M"}${(((i + 0.5) / n) * 100).toFixed(2)} ${((1 - c) * 100).toFixed(2)}`).join(" ");

  const assign = (key: string) => {
    if (!uncoded) return;
    setFirst(false);
    setPicking(false);
    setReasons((rs) =>
      sortDesc(
        rs
          .filter((r) => !r.uncoded)
          .map((r) => (r.key === key ? { ...r, min: r.min + uncoded.min, stops: r.stops + uncoded.stops } : r)),
      ),
    );
  };

  return (
    <Widget size="medium" index={index} label="Downtime Pareto">
      <WidgetHeader
        icon={<DataBarVertical20Filled />}
        tint="var(--ios-indigo)"
        title="Downtime · Line 3"
        subtitle="Shift 2 · unplanned, by reason"
      />

      <div className="mt-2 flex min-h-0 flex-1 gap-3">
        <div className="flex w-[96px] shrink-0 flex-col whitespace-nowrap">
          <AnimatePresence mode="popLayout" initial={false}>
            {picking && uncoded ? (
              <motion.div
                key="pick"
                className="flex flex-col"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <div className="text-[12px] font-semibold text-heading">Code {uncoded.min} min</div>
                <div className="text-[11px] text-tertiary">
                  {uncoded.stops} stop{uncoded.stops > 1 ? "s" : ""} · pick one
                </div>
                <div className="mt-1.5 grid grid-cols-2 gap-1">
                  {PICK.map((k, i) => {
                    const r = reasons.find((x) => x.key === k)!;
                    return (
                      <motion.button
                        key={k}
                        type="button"
                        onClick={() => assign(k)}
                        className="h-[24px] cursor-pointer rounded-md bg-fill-tertiary px-1 text-[11px] font-medium text-heading transition-colors hover:bg-fill-secondary"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04, type: "spring", stiffness: 420, damping: 26 }}
                        whileTap={{ scale: 0.92 }}
                      >
                        {r.label}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div key="hero" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <div className="flex items-baseline gap-1 leading-none">
                  <AnimatedNumber value={total} className="text-[30px] font-semibold tracking-tight text-heading" />
                  <span className="text-[12px] text-tertiary">min</span>
                </div>
                <div className="mt-1 text-[11px] text-tertiary tabular">{stops} stops</div>
                <div className="mt-1 text-[11px] text-secondary">
                  Top 2 = <span className="font-semibold tabular">{Math.round(cum[1] * 100)}%</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-auto text-[11px] leading-tight">
            {uncoded ? (
              <span className="text-heading">
                <span className="font-semibold tabular">{uncoded.stops}</span> uncoded
                <span className="block text-tertiary">{picking ? "tap bar to close" : "tap hatched bar"}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-tertiary">
                <Checkmark12Filled />
                All coded
              </span>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 gap-1">
          <div className="relative flex min-w-0 flex-1">
            {reasons.map((r, i) => {
              const bar = (
                <motion.button
                  layout
                  key={r.key}
                  type="button"
                  onClick={() => r.uncoded && setPicking((p) => !p)}
                  aria-label={r.uncoded ? `${r.min} uncoded minutes, assign a reason` : `${r.full}, ${r.min} minutes`}
                  className={cn("flex h-full min-w-0 flex-1 flex-col outline-none", r.uncoded ? "cursor-pointer" : "cursor-default")}
                  transition={{ type: "spring", stiffness: 260, damping: 28 }}
                >
                  <div className="flex min-h-0 w-full flex-1 flex-col justify-end px-[3px]">
                    <motion.div
                      className={cn(
                        "relative flex w-full items-end justify-center overflow-hidden rounded-[5px] pb-1",
                        r.uncoded
                          ? "border border-dashed border-[var(--ant-color-text-tertiary)]"
                          : "bg-fill-secondary transition-colors hover:bg-fill",
                        r.uncoded && picking && "ring-2 ring-[var(--ant-color-text-secondary)]",
                      )}
                      style={
                        r.uncoded
                          ? {
                              backgroundImage:
                                "repeating-linear-gradient(135deg, var(--ant-color-fill) 0 3px, transparent 3px 7px)",
                            }
                          : undefined
                      }
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(16, (r.min / max) * 100)}%` }}
                      transition={{ type: "spring", stiffness: 110, damping: 18, delay: first ? delay + i * 0.08 : 0 }}
                    >
                      <AnimatedNumber value={r.min} className="text-[10px] leading-none font-semibold text-heading" />
                    </motion.div>
                  </div>
                  <span
                    className={cn(
                      "block w-full truncate text-center text-[10px] leading-[14px] whitespace-nowrap",
                      r.uncoded ? "font-semibold text-heading" : "text-tertiary",
                    )}
                    style={{ height: LABEL_H }}
                  >
                    {r.label}
                  </span>
                </motion.button>
              );
              return r.uncoded ? (
                bar
              ) : (
                <Tooltip key={r.key} placement="top" title={`${r.full} · ${r.min} min · ${r.stops} stop${r.stops > 1 ? "s" : ""}`}>
                  {bar}
                </Tooltip>
              );
            })}

            {/* Cumulative share: a line over the bars, dots at each bar's centre. */}
            <div className="pointer-events-none absolute inset-x-0 top-0" style={{ bottom: LABEL_H }}>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
                <line
                  x1="0"
                  x2="100"
                  y1="20"
                  y2="20"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                  className="stroke-[var(--ant-color-text-tertiary)]"
                />
                <motion.path
                  d={d}
                  fill="none"
                  stroke="var(--ant-color-text)"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  initial={{ d, opacity: 0 }}
                  animate={{ d, opacity: 1 }}
                  transition={{ opacity: { duration: 0.8, delay: delay + 0.5 }, d: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
                />
              </svg>
              {cum.map((c, i) => (
                <motion.span
                  key={reasons[i].key}
                  className="absolute size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--ant-color-text)] ring-2 ring-[var(--widget-surface)]"
                  initial={{ opacity: 0, left: `${((i + 0.5) / n) * 100}%`, top: `${(1 - c) * 100}%` }}
                  animate={{ opacity: 1, left: `${((i + 0.5) / n) * 100}%`, top: `${(1 - c) * 100}%` }}
                  transition={{
                    opacity: { delay: first ? delay + 0.6 + i * 0.05 : 0 },
                    default: { type: "spring", stiffness: 260, damping: 28 },
                  }}
                />
              ))}
            </div>
          </div>

          {/* Right axis for the cumulative line. */}
          <div className="relative w-[24px] shrink-0 text-[9px] text-tertiary tabular" style={{ marginBottom: LABEL_H }}>
            <span className="absolute top-0 right-0 -translate-y-1/2">100%</span>
            <span className="absolute right-0 -translate-y-1/2" style={{ top: "20%" }}>
              80%
            </span>
            <span className="absolute right-0 bottom-0 translate-y-1/2">0</span>
          </div>
        </div>
      </div>
    </Widget>
  );
}
