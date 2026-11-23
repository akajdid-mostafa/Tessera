import { Clock20Filled, Star12Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import type { Format } from "@number-flow/react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";

type Metric = "Reach" | "Clicks";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
/** Two-hour blocks, by start hour. */
const BLOCKS = Array.from({ length: 12 }, (_, i) => i * 2);
const HOUR_LABELS = ["12a", "4a", "8a", "12p", "4p", "8p"];
/** Now: Monday 2:40 PM, which sits in the 2–4 PM block. */
const NOW = { d: 0, b: 7 };

const bump = (h: number, at: number, w: number, s: number) => w * Math.exp(-((h + 1 - at) ** 2) / (2 * s * s));
const jitter = (d: number, h: number) => (((d * 7 + h * 13) % 5) - 2) / 40;

/** Average reach per post (K) for posts published in that slot, last 90 days. */
function reach(d: number, h: number) {
  const weekend = d >= 5;
  let v = weekend
    ? bump(h, 10, 0.9, 2) + bump(h, 20, 0.7, 2.5)
    : bump(h, 8, 0.35, 1.5) + bump(h, 12.5, 0.6, 1.5) + bump(h, 20, 1, 2.5);
  if (d === 3) v *= 1.18;
  return 6 + 44 * Math.max(0, Math.min(1.05, v + jitter(d, h)));
}
/** Link clicks per 100 impressions. */
function clicks(d: number, h: number) {
  const weekend = d >= 5;
  const v = weekend
    ? 0.6 * (bump(h, 11, 0.8, 2) + bump(h, 19, 0.6, 2.5))
    : bump(h, 8, 0.75, 1.3) + bump(h, 12.5, 1, 1.4) + bump(h, 20, 0.55, 2.5);
  return 0.35 + 2.3 * Math.max(0, Math.min(1.05, v + jitter(d, h) * 0.8));
}

const GRID: Record<Metric, number[][]> = {
  Reach: DAYS.map((_, d) => BLOCKS.map((h) => reach(d, h))),
  Clicks: DAYS.map((_, d) => BLOCKS.map((h) => clicks(d, h))),
};
const FMT: Record<Metric, { format: Format; suffix: string; unit: string }> = {
  Reach: { format: { maximumFractionDigits: 1, minimumFractionDigits: 1 }, suffix: "K", unit: "avg reach" },
  Clicks: { format: { maximumFractionDigits: 2, minimumFractionDigits: 2 }, suffix: "%", unit: "click rate" },
};

const slot = (h: number) => {
  const f = (x: number) => (x % 12 === 0 ? 12 : x % 12);
  const ap = (x: number) => (x % 24 < 12 ? "AM" : "PM");
  return ap(h) === ap(h + 2) ? `${f(h)}–${f(h + 2)} ${ap(h)}` : `${f(h)} ${ap(h)}–${f(h + 2)} ${ap(h + 2)}`;
};

/** Marketing · large. When posts land best, as a week × hour heatmap; hover a cell to read it and switch reach or clicks. */
export function BestTimeWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [metric, setMetric] = useState<Metric>("Reach");
  const [hover, setHover] = useState<{ d: number; b: number } | null>(null);
  const [touched, setTouched] = useState(false);

  const { grid, min, max, avg, best } = useMemo(() => {
    const g = GRID[metric];
    const flat = g.flat();
    let bestAt = { d: 0, b: 0 };
    g.forEach((row, d) => row.forEach((v, b) => v > g[bestAt.d][bestAt.b] && (bestAt = { d, b })));
    return {
      grid: g,
      min: Math.min(...flat),
      max: Math.max(...flat),
      avg: flat.reduce((s, v) => s + v, 0) / flat.length,
      best: bestAt,
    };
  }, [metric]);

  const at = hover ?? best;
  const value = grid[at.d][at.b];
  const vsAvg = value / avg - 1;
  const fmt = FMT[metric];
  const level = (v: number) => (v - min) / (max - min);

  return (
    <Widget size="large" index={index} label="Best time to post">
      <WidgetHeader
        icon={<Clock20Filled />}
        tint="var(--ios-pink)"
        title="Best Time to Post"
        subtitle="Instagram · last 90 days"
        extra={<Segmented size="small" value={metric} onChange={(v) => setMetric(v as Metric)} options={["Reach", "Clicks"]} />}
      />

      <div className="mt-3 flex h-[46px] items-end justify-between gap-3 whitespace-nowrap">
        <div className="min-w-0 leading-none">
          <div className="flex items-center gap-1 text-[11px] text-tertiary">
            {hover ? "Hovered slot" : (
              <>
                <Star12Filled className="text-ios-pink" /> Best slot
              </>
            )}
          </div>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={`${at.d}-${at.b}`}
              initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="mt-1.5 text-[24px] font-semibold tracking-tight text-heading"
            >
              {DAYS[at.d]} <span className="text-secondary">{slot(BLOCKS[at.b])}</span>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="text-right leading-none">
          <AnimatedNumber value={value} format={fmt.format} suffix={fmt.suffix} className="text-[24px] font-semibold tracking-tight text-heading" />
          <div className="mt-1 text-[11px] text-tertiary">
            <span className={cn("font-semibold tabular", vsAvg >= 0 ? "text-ios-green" : "text-ios-red")}>
              <AnimatedNumber value={vsAvg} format={{ style: "percent", maximumFractionDigits: 0, signDisplay: "always" }} />
            </span>{" "}
            {fmt.unit} vs avg
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-[3px]" onMouseLeave={() => setHover(null)}>
        {DAYS.map((day, d) => (
          <div key={day} className="flex h-[27px] items-center gap-[3px]">
            <span className={cn("w-[28px] shrink-0 text-[11px] tabular", at.d === d ? "font-semibold text-heading" : "text-tertiary")}>
              {day}
            </span>
            {BLOCKS.map((h, b) => {
              const v = grid[d][b];
              const isBest = best.d === d && best.b === b;
              const isNow = NOW.d === d && NOW.b === b;
              const isHover = hover?.d === d && hover?.b === b;
              return (
                <motion.button
                  type="button"
                  key={h}
                  aria-label={`${day} ${slot(h)}`}
                  className={cn(
                    "relative h-full min-w-0 flex-1 cursor-default overflow-hidden rounded-[5px] bg-fill-quaternary outline-none",
                    isNow && "ring-1 ring-inset ring-sel",
                  )}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: isHover ? 1.12 : 1, zIndex: isHover ? 2 : 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 26,
                    delay: touched ? 0 : delay + (d + b) * 0.018,
                  }}
                  onMouseEnter={() => {
                    setHover({ d, b });
                    setTouched(true);
                  }}
                  onFocus={() => setHover({ d, b })}
                >
                  <motion.span
                    className="absolute inset-0 bg-ios-pink"
                    initial={false}
                    animate={{ opacity: 0.1 + 0.9 * level(v) ** 1.4 }}
                    transition={{ duration: 0.45, delay: touched ? (d + b) * 0.008 : 0 }}
                  />
                  {isBest ? (
                    <Star12Filled className="absolute inset-0 m-auto size-[11px] text-white" />
                  ) : null}
                  {isNow ? (
                    <motion.span
                      className="absolute right-[3px] top-[3px] size-[5px] rounded-full bg-[var(--ant-color-text)]"
                      animate={{ opacity: [1, 0.25, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    />
                  ) : null}
                </motion.button>
              );
            })}
          </div>
        ))}
        <div className="relative ml-[31px] h-3 text-[10px] leading-none text-tertiary tabular">
          {HOUR_LABELS.map((l, i) => (
            <span key={l} className="absolute" style={{ left: `${(i * 2 * 100) / 12}%` }}>
              {l}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between text-[11px] whitespace-nowrap text-tertiary">
        <div className="flex items-center gap-1">
          Less
          {[0.1, 0.3, 0.55, 0.8, 1].map((o) => (
            <span key={o} className="relative size-[11px] overflow-hidden rounded-[3px] bg-fill-quaternary">
              <span className="absolute inset-0 bg-ios-pink" style={{ opacity: o }} />
            </span>
          ))}
          More
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-[9px] rounded-[3px] ring-1 ring-inset ring-sel" />
          Now · Mon 2:40 PM
        </div>
      </div>
    </Widget>
  );
}
