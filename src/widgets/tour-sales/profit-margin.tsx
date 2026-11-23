import { Gauge20Filled, LockClosed16Filled, LockOpen16Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { COMPACT } from "./_parts-a";

/** November to date: `profitMonth` (cost.baseMargin summed) on the month's revenue, in USD. */
const PROFIT = 10_279;
const REVENUE = 43_188;
const MARGIN = PROFIT / REVENUE;
const TARGET = 0.25;
/** The gauge reads 0–40 %. */
const SCALE = 0.4;
const PEEK_S = 4;

/* Half-circle gauge, drawn at its real size. */
const CX = 66;
const CY = 68;
const R = 56;
const ARC = `M${CX - R},${CY} A${R},${R} 0 0 1 ${CX + R},${CY}`;
const at = (frac: number, r: number) => {
  const a = Math.PI * (1 - frac);
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)] as const;
};

/** Tour sales · small. This month's profit and margin as a gauge; the lock simulates a user without readCost, hiding the figures as "Hidden" behind a blur until tapped to peek. */
export function ProfitMarginWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const uid = useId().replace(/:/g, "");
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const [peek, setPeek] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), delay * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  // A peek without the permission lasts a few seconds, then the figures hide again.
  useEffect(() => {
    if (peek <= 0) return;
    const t = window.setTimeout(() => setPeek((p) => p - 1), 1000);
    return () => window.clearTimeout(t);
  }, [peek]);

  const hidden = locked && peek === 0;
  const fill = ready ? Math.min(1, MARGIN / SCALE) : 0;
  const [t1x, t1y] = at(TARGET / SCALE, R - 8);
  const [t2x, t2y] = at(TARGET / SCALE, R + 8);

  return (
    <Widget size="small" index={index} label="Profit margin">
      <WidgetHeader
        icon={<Gauge20Filled />}
        tint="var(--ios-mint)"
        title="Profit"
        subtitle={locked ? "No readCost" : "November · margin"}
        extra={
          <Tooltip title={locked ? "Grant readCost" : "View as a user without readCost"}>
            <Button
              size="small"
              shape="circle"
              color={locked ? "orange" : "default"}
              variant="filled"
              aria-pressed={locked}
              aria-label={locked ? "Grant cost permission" : "Remove cost permission"}
              icon={locked ? <LockClosed16Filled className="size-3.5" /> : <LockOpen16Regular className="size-3.5" />}
              onClick={() => {
                setLocked((l) => !l);
                setPeek(0);
              }}
            />
          </Tooltip>
        }
      />

      <div className="relative mt-1.5 flex min-h-0 flex-1 flex-col">
        <motion.div
          className="flex min-h-0 flex-1 flex-col"
          animate={{ filter: hidden ? "blur(7px)" : "blur(0px)", opacity: hidden ? 0.55 : 1 }}
          transition={{ duration: 0.35 }}
          aria-hidden={hidden}
        >
          <div className="relative mx-auto h-[74px] w-[132px] shrink-0">
            <svg viewBox="0 0 132 74" className="absolute inset-0 overflow-visible">
              <defs>
                <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--ios-orange)" />
                  <stop offset="55%" stopColor="var(--ios-yellow)" />
                  <stop offset="100%" stopColor="var(--ios-mint)" />
                </linearGradient>
              </defs>
              <path d={ARC} fill="none" stroke="var(--ant-color-fill-secondary)" strokeWidth={10} strokeLinecap="round" />
              <motion.path
                d={ARC}
                fill="none"
                stroke={`url(#${uid}-g)`}
                strokeWidth={10}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: fill }}
                transition={{ type: "spring", stiffness: 60, damping: 16 }}
              />
              <line x1={t1x} y1={t1y} x2={t2x} y2={t2y} stroke="var(--ant-color-text)" strokeWidth={2} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center leading-none">
              <AnimatedNumber
                value={ready ? MARGIN : 0}
                format={{ style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                className="text-[24px] leading-none font-semibold tracking-tight text-heading"
              />
              <span className="mt-0.5 text-[10px] text-tertiary">target {Math.round(TARGET * 100)}%</span>
            </div>
          </div>

          <div className="mt-auto flex items-end justify-between leading-tight">
            <div>
              <AnimatedNumber
                value={ready ? PROFIT : 0}
                prefix="$"
                format={COMPACT}
                className="text-[15px] font-semibold text-heading"
              />
              <div className="text-[10px] text-tertiary">profit</div>
            </div>
            <div className="text-right">
              <AnimatedNumber value={REVENUE} prefix="$" format={COMPACT} className="text-[12px] font-medium text-secondary" />
              <div className="text-[10px] text-tertiary">revenue</div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {locked ? (
            <motion.button
              key="veil"
              type="button"
              onClick={() => setPeek((p) => (p > 0 ? 0 : PEEK_S))}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1 outline-none"
              aria-label={peek > 0 ? "Hide figures" : "Tap to reveal hidden figures"}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {peek === 0 ? (
                  <motion.span
                    key="gizli"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 22 }}
                    className="flex flex-col items-center gap-1"
                  >
                    <span className="inline-flex items-center gap-1 rounded-full bg-fill px-2.5 py-1 text-[13px] font-semibold text-heading shadow-sm">
                      <LockClosed16Filled className="size-3.5 text-ios-orange" />
                      Hidden
                    </span>
                    <span className="text-[10px] text-secondary">Tap to reveal</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="peek"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-0 right-0 inline-flex items-center gap-1 rounded-full bg-ios-orange/15 px-1.5 py-0.5 text-[10px] font-semibold text-ios-orange tabular"
                  >
                    Hides in <AnimatedNumber value={peek} suffix="s" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
