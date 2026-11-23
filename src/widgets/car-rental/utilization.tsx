import { ArrowDown16Filled, ArrowUp16Filled, Gauge20Filled } from "@fluentui/react-icons";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useId, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const PERIODS = [
  { label: "Today", value: 0.78, prev: 0.74 },
  { label: "This week", value: 0.71, prev: 0.687 },
  { label: "This month", value: 0.66, prev: 0.698 },
] as const;

/* Half-circle gauge in a 120×66 box, pivot at (60, 60). */
const CX = 60;
const CY = 60;
const R = 48;
const ARC = `M${CX - R} ${CY} A${R} ${R} 0 0 1 ${CX + R} ${CY}`;
const NEEDLE = 36;
const polar = (v: number, r: number) => {
  const a = Math.PI - Math.min(1.04, Math.max(-0.04, v)) * Math.PI;
  return { x: CX + r * Math.cos(a), y: CY - r * Math.sin(a) };
};

/** Car rental · small. A fleet utilization gauge; the needle springs to each period on tap. */
export function UtilizationWidget({ index }: { index?: number }) {
  const [page, setPage] = useState(0);
  const [live, setLive] = useState<number>(PERIODS[0].value);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const p = PERIODS[page];
  const value = page === 0 ? live : p.value;
  const delta = (value - p.prev) * 100;
  const up = delta >= 0;

  const v = useMotionValue(0);
  const x2 = useTransform(v, (t) => polar(t, NEEDLE).x);
  const y2 = useTransform(v, (t) => polar(t, NEEDLE).y);
  const length = useTransform(v, (t) => Math.min(1, Math.max(0.001, t)));

  const gradient = `util-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const c = animate(v, value, {
      type: "spring",
      stiffness: 90,
      damping: 11,
      delay: entered ? 0 : delay,
      onComplete: () => setEntered(true),
    });
    return () => c.stop();
  }, [value]);

  useEffect(() => {
    const t = window.setInterval(() => {
      setLive((l) => Math.min(0.84, Math.max(0.74, l + (Math.random() - 0.45) * 0.012)));
    }, 4000);
    return () => window.clearInterval(t);
  }, []);

  const prevMark = polar(p.prev, R + 8);
  const prevIn = polar(p.prev, R - 8);

  return (
    <Widget
      size="small"
      index={index}
      label="Fleet utilization"
      pressable
      onPress={() => setPage((n) => (n + 1) % PERIODS.length)}
    >
      <WidgetHeader
        icon={<Gauge20Filled />}
        tint="var(--ios-indigo)"
        title="Utilization"
        subtitle="374 cars"
        extra={
          <div className="flex gap-1 pt-1.5">
            {PERIODS.map((x, i) => (
              <motion.span
                key={x.label}
                layout
                className={cn("h-1.5 rounded-full", i === page ? "w-3.5 bg-ios-indigo" : "w-1.5 bg-fill")}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            ))}
          </div>
        }
      />

      <svg viewBox="0 0 120 66" className="mx-auto mt-1 h-[64px] w-[118px] overflow-visible">
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--ios-teal)" />
            <stop offset="100%" stopColor="var(--ios-indigo)" />
          </linearGradient>
        </defs>
        <path d={ARC} fill="none" strokeWidth="10" strokeLinecap="round" className="stroke-fill-secondary" />
        <motion.path
          d={ARC}
          fill="none"
          stroke={`url(#${gradient})`}
          strokeWidth="10"
          strokeLinecap="round"
          style={{ pathLength: length }}
        />
        {/* Last period's mark */}
        <motion.line
          x1={prevIn.x}
          y1={prevIn.y}
          x2={prevMark.x}
          y2={prevMark.y}
          initial={false}
          animate={{ x1: prevIn.x, y1: prevIn.y, x2: prevMark.x, y2: prevMark.y }}
          transition={{ type: "spring", stiffness: 200, damping: 24 }}
          strokeWidth="2"
          strokeLinecap="round"
          className="stroke-[var(--ant-color-text-tertiary)]"
        />
        <motion.line
          x1={CX}
          y1={CY}
          x2={x2}
          y2={y2}
          strokeWidth="3"
          strokeLinecap="round"
          className="stroke-[var(--ant-color-text-heading)]"
        />
        <circle cx={CX} cy={CY} r="5" className="fill-[var(--ant-color-text-heading)]" />
        <circle cx={CX} cy={CY} r="2" fill="var(--widget-surface)" />
      </svg>

      <div className="mt-auto flex items-baseline-last justify-between">
        <div className="leading-none">
          <AnimatedNumber
            value={value}
            format={{ style: "percent", maximumFractionDigits: 0 }}
            className="text-[26px] leading-none font-semibold tracking-tight text-heading"
          />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={p.label}
              initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(3px)" }}
              className="mt-1 text-[11px] font-medium whitespace-nowrap text-ios-indigo"
            >
              {p.label}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex flex-col items-end gap-1 leading-none">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold transition-colors duration-mid",
              up ? "bg-ios-green/15 text-ios-green" : "bg-ios-red/15 text-ios-red",
            )}
          >
            {up ? <ArrowUp16Filled className="size-3" /> : <ArrowDown16Filled className="size-3" />}
            <AnimatedNumber value={Math.abs(delta)} format={{ maximumFractionDigits: 1, minimumFractionDigits: 1 }} />
          </span>
          <span className="text-[10px] whitespace-nowrap text-tertiary">pts vs last wk</span>
        </div>
      </div>
    </Widget>
  );
}
