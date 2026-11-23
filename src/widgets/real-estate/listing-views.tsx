import { Eye20Filled, Heart20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Metric = "views" | "saves";

const METRIC = {
  views: { label: "Views today", color: "var(--ios-blue)", week: [212, 248, 231, 296, 318, 284], lastWeekToday: 171 },
  saves: { label: "Saves today", color: "var(--ios-pink)", week: [14, 19, 16, 22, 27, 21], lastWeekToday: 11 },
} as const;
const DAYS = ["T", "W", "T", "F", "S", "S", "M"];
const TICK_MS = 2600;
/* Roughly the drawn width, so the stretched viewBox keeps the stroke even. */
const W = 145;

/** A W × 30 polyline through the seven days, plus its closed area. */
function sparkPaths(values: number[]) {
  const max = Math.max(...values) * 1.08;
  const min = Math.min(...values) * 0.7;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * W, 30 - ((v - min) / (max - min)) * 28]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
  return { line, area: `${line} L${W} 30 L0 30 Z`, last: pts[pts.length - 1] };
}

/** Real estate · small. Today's views roll in live over a 7-day sparkline; tap to switch to saves. */
export function ListingViewsWidget({ index }: { index?: number }) {
  const [metric, setMetric] = useState<Metric>("views");
  const [today, setToday] = useState({ views: 186, saves: 12 });
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      setToday((d) => ({
        views: d.views + 1 + Math.floor(Math.random() * 3),
        saves: Math.random() < 0.3 ? d.saves + 1 : d.saves,
      }));
      setPulse((p) => p + 1);
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, []);

  const m = METRIC[metric];
  const value = today[metric];
  const series = [...m.week, value];
  const { line, area, last } = sparkPaths(series);
  const change = (value - m.lastWeekToday) / m.lastWeekToday;
  const delay = 0.3 + (index ?? 0) * 0.06;

  return (
    <Widget
      size="small"
      index={index}
      label="Listing views"
      pressable
      onPress={() => setMetric((x) => (x === "views" ? "saves" : "views"))}
    >
      <WidgetHeader
        icon={metric === "views" ? <Eye20Filled /> : <Heart20Filled />}
        tint={m.color}
        title="Noe Valley Loft"
        subtitle="Listing #4821 · 2BR"
      />

      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-tertiary">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={metric}
            initial={{ opacity: 0, y: 5, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -5, filter: "blur(3px)" }}
            className="truncate"
          >
            {m.label}
          </motion.span>
        </AnimatePresence>
        <span className="ml-auto flex items-center gap-1">
          <motion.span
            className="size-1.5 rounded-full bg-ios-green"
            animate={{ opacity: [1, 0.35, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          Live
        </span>
      </div>

      <div className="mt-0.5 flex items-baseline gap-1.5">
        <AnimatedNumber
          value={value}
          className="text-[28px] leading-none font-semibold tracking-tight text-heading"
        />
        <span
          className={cn(
            "rounded-full px-1.5 py-px text-[10px] font-semibold tabular",
            change >= 0 ? "bg-ios-green/15 text-ios-green" : "bg-ios-red/15 text-ios-red",
          )}
        >
          <AnimatedNumber value={change} format={{ style: "percent", maximumFractionDigits: 0, signDisplay: "always" }} />
        </span>
      </div>

      <div className="relative mt-auto h-[30px]">
        <svg viewBox={`0 0 ${W} 30`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
          <defs>
            <linearGradient id="lv-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={m.color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={m.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <motion.path d={area}
            key={`a-${metric}`}
            fill="url(#lv-fill)"
            initial={{ opacity: 0, d: area }}
            animate={{ opacity: 1, d: area }}
            transition={{ opacity: { delay: metric === "views" ? delay + 0.4 : 0.3, duration: 0.5 }, d: { duration: 0.6 } }}
          />
          <motion.path d={line}
            key={`l-${metric}`}
            fill="none"
            stroke={m.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, d: line }}
            animate={{ pathLength: 1, d: line }}
            transition={{
              pathLength: { delay: metric === "views" ? delay : 0, duration: 0.9, ease: [0.22, 1, 0.36, 1] },
              d: { duration: 0.6 },
            }}
          />
        </svg>
        <motion.span
          className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--widget-surface)]"
          style={{ background: m.color }}
          initial={false}
          animate={{ left: `${(last[0] / W) * 100}%`, top: `${(last[1] / 30) * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
        >
          <motion.span
            key={pulse}
            className="absolute inset-0 rounded-full"
            style={{ background: m.color }}
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
        </motion.span>
      </div>
      <div className="mt-1 flex justify-between text-[9px] text-tertiary">
        {DAYS.map((d, i) => (
          <span key={i} className={cn(i === DAYS.length - 1 && "font-semibold text-secondary")}>
            {d}
          </span>
        ))}
      </div>
    </Widget>
  );
}
