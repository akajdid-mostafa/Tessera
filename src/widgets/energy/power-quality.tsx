import { DataHistogram20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { AlarmMark, enterDelay, useInterval } from "./_parts";

/* An 11 kV bus feeding a plant full of six-pulse drives, so the 5th and 7th
 * dominate. Limits follow IEEE 519: voltage 3% per harmonic and 5% THD below
 * 69 kV; current (ISC/IL 20–50) 7% below the 11th, 3.5% from it, 8% TDD. */
const ORDERS = [3, 5, 7, 11, 13] as const;
const PAGES = [
  { key: "V", label: "THDv", base: [0.6, 3.4, 1.9, 0.9, 0.6], limit: [3, 3, 3, 3, 3], total: 5, max: 4.2 },
  { key: "I", label: "TDD", base: [1.2, 6.1, 3.8, 1.6, 1.1], limit: [7, 7, 7, 3.5, 3.5], total: 8, max: 8.4 },
] as const;
const rss = (xs: number[]) => Math.sqrt(xs.reduce((s, x) => s + x * x, 0));
const BAR_H = 52;

/** Energy · small. A bus's harmonic spectrum against IEEE 519 limit ticks, jittering live; tap to swap voltage and current, hover a bar to read it. */
export function PowerQualityWidget({ index }: { index?: number }) {
  const [page, setPage] = useState(0);
  const [noise, setNoise] = useState<number[]>(() => ORDERS.map(() => 1));
  const [hover, setHover] = useState<number | null>(null);
  const delay = enterDelay(index);

  useInterval(() => setNoise(ORDERS.map(() => 0.95 + Math.random() * 0.1)), 1800);

  const p = PAGES[page];
  const vals = p.base.map((v, i) => +(v * noise[i]).toFixed(2));
  const total = rss(vals);
  const over = vals.map((v, i) => v > p.limit[i]);
  const worst = over.findIndex(Boolean);
  const hero = hover !== null ? vals[hover] : total;

  return (
    <Widget size="small" index={index} label="Power quality" pressable onPress={() => setPage((n) => (n + 1) % PAGES.length)}>
      <WidgetHeader
        icon={<DataHistogram20Filled />}
        tint={worst >= 0 ? "var(--ios-orange)" : "var(--ios-indigo)"}
        title="Power Quality"
        subtitle="Bus 2 · 11 kV"
        extra={
          <div className="mt-1 flex gap-[3px]">
            {PAGES.map((x, i) => (
              <motion.span
                key={x.key}
                layout
                className={cn("h-1.5 rounded-full", i === page ? "w-3 bg-heading" : "w-1.5 bg-fill")}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            ))}
          </div>
        }
      />

      <div className="mt-2 flex items-baseline gap-1 whitespace-nowrap">
        <AnimatedNumber
          value={hero}
          format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
          suffix="%"
          className="text-[26px] leading-none font-semibold tracking-tight text-heading"
        />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={`${page}-${hover}`}
            className="text-[11px] text-tertiary"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            {hover !== null ? `h${ORDERS[hover]} ${p.key}` : p.label}
          </motion.span>
        </AnimatePresence>
        <span className="ml-auto text-[10px] text-tertiary tabular">lim {hover !== null ? p.limit[hover] : p.total}</span>
      </div>

      <div className="mt-2 flex gap-2" style={{ height: BAR_H }}>
        {vals.map((v, i) => {
          const lim = p.limit[i];
          return (
            <div
              key={ORDERS[i]}
              className="relative flex min-w-0 flex-1 items-end rounded-[3px] bg-fill-quaternary"
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
            >
              <motion.div
                className={cn(
                  "w-full rounded-[3px]",
                  over[i] ? "bg-ios-yellow" : hover === i ? "bg-[var(--ant-color-text)]" : "bg-[var(--ant-color-text-tertiary)]",
                )}
                initial={{ height: 0 }}
                animate={{ height: `${Math.min(100, (v / p.max) * 100)}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 18, delay: page === 0 && noise[0] === 1 ? delay + i * 0.06 : 0 }}
              />
              {/* Limit tick: a hairline across the slot, overhanging a little. */}
              <motion.span
                className="absolute -inset-x-0.5 h-[2px] rounded-full bg-heading"
                initial={false}
                animate={{ bottom: `${Math.min(100, (lim / p.max) * 100)}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 26 }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-2 text-center text-[10px] leading-none text-tertiary tabular">
        {ORDERS.map((o) => (
          <span key={o} className="flex-1">
            {o}
          </span>
        ))}
      </div>

      <div className="mt-auto flex h-[15px] items-center gap-1 text-[11px] leading-none whitespace-nowrap">
        {worst >= 0 ? (
          <>
            <AlarmMark priority={3} size={14} />
            <span className="truncate font-medium text-heading">
              h{ORDERS[worst]} over {p.limit[worst]}%
            </span>
          </>
        ) : (
          <span className="truncate text-tertiary">In limit · PF 0.94</span>
        )}
      </div>
    </Widget>
  );
}
