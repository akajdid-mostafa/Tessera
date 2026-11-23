import { DataTrending20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { seeded } from "./_parts";

/* A 64-port regional network over the last 30 days (Oct 10 – Nov 8). Uptime is
 * per-day port availability against a 97 % target; two dips are a firmware
 * rollout and a cabinet outage. Utilisation is time-based. Revenue in USD. */
type Metric = "uptime" | "usage" | "revenue";

const DAYS = 30;
const PORTS = 64;
const START = new Date(2026, 9, 10);
const TARGET = 97;
const dayLabel = (i: number) => {
  const d = new Date(START);
  d.setDate(d.getDate() + i);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const DATA = (() => {
  const r = seeded(97);
  return Array.from({ length: DAYS }, (_, i) => {
    const dow = (START.getDay() + i) % 7;
    const weekend = dow === 0 || dow === 6 || dow === 5;
    let up = 98.9 + (r() - 0.5) * 1.3;
    if (i === 9) up = 96.2;
    if (i === 22) up = 96.7;
    const usage = 21.5 + (weekend ? 4.2 : 0) + (r() - 0.5) * 3.4 + i * 0.05;
    const revenue = usage * 200 * (0.96 + r() * 0.08);
    return { up: Math.min(99.9, up), usage, revenue };
  });
})();

const avg = (k: "up" | "usage") => DATA.reduce((a, d) => a + d[k], 0) / DAYS;
const SUM_REV = DATA.reduce((a, d) => a + d.revenue, 0);

const PCT = { minimumFractionDigits: 1, maximumFractionDigits: 1 } as const;
const USD = { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 } as const;

const METRICS: Record<
  Metric,
  {
    total: number;
    day: (i: number) => number;
    height: (i: number) => number;
    format: typeof PCT | typeof USD;
    suffix?: string;
    delta: string;
    meta: string;
    bar: string;
  }
> = {
  uptime: {
    total: avg("up"),
    day: (i) => DATA[i].up,
    height: (i) => Math.max(0.04, (DATA[i].up - 94) / 6),
    format: PCT,
    suffix: "%",
    delta: "+0.4 pt",
    meta: `Target ${TARGET}% · ${DATA.filter((d) => d.up < TARGET).length} days under`,
    bar: "bg-fill",
  },
  usage: {
    total: avg("usage"),
    day: (i) => DATA[i].usage,
    height: (i) => DATA[i].usage / 34,
    format: PCT,
    suffix: "%",
    delta: "+1.8 pt",
    meta: "6.1 sessions / port / day",
    bar: "bg-ios-blue",
  },
  revenue: {
    total: SUM_REV,
    day: (i) => DATA[i].revenue,
    height: (i) => DATA[i].revenue / 6_400,
    format: USD,
    delta: "+8.1%",
    meta: `$${Math.round(SUM_REV / DAYS / PORTS).toLocaleString("en-US")} / port / day`,
    bar: "bg-ios-green",
  },
};

/** EV charging · medium. Network uptime, utilisation and revenue over 30 days; switch metrics and hover a day to read it. */
export function NetworkTrendWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [metric, setMetric] = useState<Metric>("uptime");
  const [hover, setHover] = useState<number | null>(null);
  const m = METRICS[metric];
  const value = hover == null ? m.total : m.day(hover);
  const under = (i: number) => metric === "uptime" && DATA[i].up < TARGET;

  return (
    <Widget size="medium" index={index} label="Network performance">
      <WidgetHeader
        icon={<DataTrending20Filled />}
        tint="var(--ios-indigo)"
        title="Network"
        subtitle={`${PORTS} ports · 30 days`}
        extra={
          <Segmented
            size="small"
            value={metric}
            onChange={(v) => {
              setMetric(v as Metric);
              setHover(null);
            }}
            options={[
              { value: "uptime", label: "Uptime" },
              { value: "usage", label: "Usage" },
              { value: "revenue", label: "Revenue" },
            ]}
          />
        }
      />

      <div className="mt-1.5 flex items-baseline-last gap-2 whitespace-nowrap">
        <span className="text-[26px] leading-none font-semibold tracking-tight text-heading">
          <AnimatedNumber value={value} format={m.format} suffix={m.suffix} />
        </span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={hover == null ? `${metric}-d` : `${metric}-${hover}`}
            initial={{ opacity: 0, rotateX: -90 }}
            animate={{ opacity: 1, rotateX: 0 }}
            exit={{ opacity: 0, rotateX: 90 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className={cn(
              "mb-0.5 rounded-full px-1.5 py-px text-[11px] font-semibold tabular",
              hover == null
                ? "bg-ios-green/15 text-ios-green"
                : under(hover)
                  ? "bg-ios-orange/15 text-ios-orange"
                  : "bg-fill-tertiary text-secondary",
            )}
          >
            {hover == null ? `${m.delta} vs Oct` : dayLabel(hover)}
          </motion.span>
        </AnimatePresence>
        <span className="mb-0.5 ml-auto truncate text-[11px] text-tertiary tabular">
          {hover != null && under(hover) ? (hover === 9 ? "Firmware rollout" : "Cabinet 3 outage") : m.meta}
        </span>
      </div>

      <div className="relative mt-2 h-[70px]" onPointerLeave={() => setHover(null)}>
        <div className="absolute inset-0 flex items-end gap-[3px]">
          {DATA.map((_, i) => {
            const active = hover === i;
            return (
              <div
                key={i}
                className="relative flex h-full flex-1 cursor-pointer items-end"
                onPointerEnter={() => setHover(i)}
                onPointerDown={() => setHover(i)}
              >
                <motion.div
                  className={cn(
                    "w-full rounded-t-[3px] rounded-b-[1px] transition-[background-color,opacity] duration-200",
                    under(i) ? "bg-ios-orange" : m.bar,
                    hover != null && !active && "opacity-40",
                  )}
                  initial={{ height: 0 }}
                  animate={{
                    height: `${Math.min(1, m.height(i)) * 100}%`,
                    transition: { type: "spring", stiffness: 160, damping: 20, delay: delay + i * 0.012 },
                  }}
                />
              </div>
            );
          })}
        </div>
        {metric === "uptime" ? (
          <motion.div
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[var(--ant-color-text-secondary)]"
            style={{ bottom: `${((TARGET - 94) / 6) * 100}%` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.3 }}
          >
            <span className="absolute right-0 bottom-0.5 rounded bg-[var(--widget-surface)] px-1 text-[10px] text-secondary tabular">
              {TARGET}% target
            </span>
          </motion.div>
        ) : null}
      </div>

      <div className="mt-1 flex justify-between text-[10px] text-tertiary tabular">
        <span>{dayLabel(0)}</span>
        <span>{dayLabel(14)}</span>
        <span>{dayLabel(DAYS - 1)}</span>
      </div>
    </Widget>
  );
}
