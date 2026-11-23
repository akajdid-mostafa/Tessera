import { Cloud20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Service = { id: string; name: string; mtd: number; prev: number; share: number; dot: string; bar: string };

/** Month to date in $, against the same point of October. `share` is how the next dollars split. */
const SEED: Service[] = [
  { id: "compute", name: "Compute", mtd: 6800, prev: 6500, share: 0.42, dot: "bg-ios-blue", bar: "bg-ios-blue" },
  { id: "db", name: "Database", mtd: 4000, prev: 3900, share: 0.24, dot: "bg-ios-indigo", bar: "bg-ios-indigo" },
  { id: "egress", name: "Egress", mtd: 2000, prev: 1220, share: 0.17, dot: "bg-ios-pink", bar: "bg-ios-pink" },
  { id: "storage", name: "Storage", mtd: 1800, prev: 1750, share: 0.11, dot: "bg-ios-teal", bar: "bg-ios-teal" },
  { id: "other", name: "Other", mtd: 1100, prev: 1200, share: 0.06, dot: "bg-fill", bar: "bg-fill" },
];
const BUDGET = 52_000;
const SCALE = 60_000;
const DAYS = 30;
/** Day 9, 14:20. */
const START_ELAPSED = 8 + 14.33 / 24;
/** Each tick stands for five minutes of billing. */
const TICK_DAYS = 5 / 1440;
const K = { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 } as const;

/** SaaS · medium. Month-to-date cloud spend by service against budget, with a forecast that runs past it; costs accrue live and hovering a service shows its change on last month. */
export function CloudSpendWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [services, setServices] = useState(SEED);
  const [elapsed, setElapsed] = useState(START_ELAPSED);
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => {
      const spend = 1826 * TICK_DAYS * (0.8 + Math.random() * 0.4);
      setServices((list) => list.map((s) => ({ ...s, mtd: s.mtd + spend * s.share })));
      setElapsed((e) => e + TICK_DAYS);
    }, 3000);
    return () => window.clearInterval(t);
  }, []);

  const mtd = services.reduce((a, s) => a + s.mtd, 0);
  const prev = services.reduce((a, s) => a + s.prev, 0);
  const forecast = (mtd / elapsed) * DAYS;
  const over = forecast > BUDGET;
  const s = services.find((x) => x.id === sel) ?? null;
  const value = s ? s.mtd : mtd;
  const change = s ? s.mtd / s.prev - 1 : mtd / prev - 1;
  const hot = change > 0.25;

  return (
    <Widget size="medium" index={index} label="Cloud spend">
      <WidgetHeader
        icon={<Cloud20Filled />}
        tint="var(--ios-blue)"
        title="Cloud Spend"
        subtitle={`November · day ${Math.ceil(elapsed)} of ${DAYS}`}
        extra={
          <div className="text-right leading-tight">
            <div className="text-[11px] text-tertiary">Forecast</div>
            <AnimatedNumber
              value={Math.round(forecast / 100) * 100}
              format={K}
              className={cn("text-[15px] font-semibold", over ? "text-ios-orange" : "text-heading")}
            />
          </div>
        }
      />

      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="min-w-0 leading-none">
          <div className="h-[14px] text-[11px]">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={s?.id ?? "all"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-1.5 whitespace-nowrap text-tertiary"
              >
                {s ? (
                  <>
                    <span className={cn("size-2 rounded-full", s.dot)} />
                    <span className="font-medium text-secondary">{s.name}</span> · {Math.round((s.mtd / mtd) * 100)}% of spend
                  </>
                ) : (
                  <>Month to date · budget {"$52k"}</>
                )}
              </motion.span>
            </AnimatePresence>
          </div>
          <AnimatedNumber
            value={Math.round(value / 10) * 10}
            format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
            className="mt-1 block text-[28px] font-semibold tracking-tight text-heading"
          />
        </div>
        <span
          className={cn(
            "mb-0.5 shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold tabular transition-colors duration-300",
            hot ? "bg-ios-red/15 text-ios-red" : change > 0 ? "bg-fill-tertiary text-secondary" : "bg-ios-green/15 text-ios-green",
          )}
        >
          {change >= 0 ? "+" : "−"}
          {Math.abs(change * 100).toFixed(change > 0.25 ? 0 : 1)}% vs Oct
        </span>
      </div>

      <div className="mt-auto">
        <div className="relative h-3">
          <span
            className="absolute -translate-x-full whitespace-nowrap pr-1 text-[9px] font-medium leading-3 text-tertiary"
            style={{ left: `${(BUDGET / SCALE) * 100}%` }}
          >
            Budget
          </span>
          <motion.span
            className={cn("absolute whitespace-nowrap pl-1 text-[9px] font-medium leading-3", over ? "text-ios-orange" : "text-tertiary")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, left: `${(Math.min(forecast, SCALE) / SCALE) * 100}%` }}
            transition={{ opacity: { delay: delay + 0.8 } }}
          >
            {over ? "Over" : "Fcst"}
          </motion.span>
        </div>
        <div className="relative mt-0.5 h-[14px]" onMouseLeave={() => setSel(null)}>
          <div className="absolute inset-0 overflow-hidden rounded-full bg-fill-tertiary">
            <motion.span
              className={cn("absolute inset-y-0 left-0 rounded-full", over ? "bg-ios-orange/20" : "bg-fill-secondary")}
              initial={{ width: 0 }}
              animate={{ width: `${(Math.min(forecast, SCALE) / SCALE) * 100}%` }}
              transition={{ type: "spring", stiffness: 70, damping: 18, delay: delay + 0.4 }}
            />
            <div className="absolute inset-y-0 left-0 flex" style={{ width: `${(mtd / SCALE) * 100}%` }}>
              {services.map((x, i) => (
                <motion.span
                  key={x.id}
                  onMouseEnter={() => setSel(x.id)}
                  className={cn(
                    "h-full cursor-pointer border-r border-[var(--widget-surface)] transition-opacity duration-200 last:border-r-0",
                    x.bar,
                    sel && sel !== x.id && "opacity-35",
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${(x.mtd / mtd) * 100}%` }}
                  transition={{ type: "spring", stiffness: 160, damping: 24, delay: delay + i * 0.07 }}
                />
              ))}
            </div>
          </div>
          <span
            className="pointer-events-none absolute -inset-y-1 w-[2px] -translate-x-1/2 rounded-full bg-[var(--ant-color-text)]"
            style={{ left: `${(BUDGET / SCALE) * 100}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between">
          {services.map((x) => (
            <button
              key={x.id}
              type="button"
              onMouseEnter={() => setSel(x.id)}
              onMouseLeave={() => setSel(null)}
              onFocus={() => setSel(x.id)}
              onBlur={() => setSel(null)}
              className={cn(
                "flex cursor-pointer items-center gap-1 whitespace-nowrap text-[11px] transition-colors duration-200",
                sel === x.id ? "font-medium text-heading" : "text-tertiary",
              )}
            >
              <span className="relative flex size-1.5">
                {x.mtd / x.prev - 1 > 0.25 ? (
                  <span className={cn("absolute inset-0 animate-ping rounded-full opacity-70", x.dot)} />
                ) : null}
                <span className={cn("relative size-1.5 rounded-full", x.dot)} />
              </span>
              {x.name}
            </button>
          ))}
        </div>
      </div>
    </Widget>
  );
}
