import { DataBarVertical20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const ADR = { now: [172, 168, 175, 181, 204, 231, 212], last: [165, 160, 171, 174, 192, 219, 205] };
const OCC = { now: [0.71, 0.68, 0.74, 0.79, 0.92, 0.97, 0.88], last: [0.69, 0.66, 0.7, 0.75, 0.88, 0.95, 0.84] };
const rev = (w: "now" | "last") => ADR[w].map((a, i) => a * OCC[w][i]);
const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

const USD = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const;
const PCT = { style: "percent", maximumFractionDigits: 0 } as const;
const METRICS = [
  { name: "ADR", sub: "Avg daily rate", now: ADR.now, last: ADR.last, format: USD, color: "var(--ios-indigo)" },
  { name: "RevPAR", sub: "Per available room", now: rev("now"), last: rev("last"), format: USD, color: "var(--ios-teal)" },
  { name: "Occupancy", sub: "Rooms sold", now: OCC.now, last: OCC.last, format: PCT, color: "var(--ios-orange)" },
] as const;
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

/** Hospitality · small. Seven days against last week as paired bars; tap to swap ADR, RevPAR and occupancy. */
export function AdrRevparWidget({ index }: { index?: number }) {
  const [page, setPage] = useState(0);
  const [paged, setPaged] = useState(false);
  const m = METRICS[page];
  const value = avg([...m.now]);
  const change = value / avg([...m.last]) - 1;
  const max = Math.max(...m.now, ...m.last);
  const min = Math.min(...m.now, ...m.last) * 0.72;
  const delay = 0.3 + (index ?? 0) * 0.06;

  return (
    <Widget size="small" index={index} label="Rate KPIs" pressable onPress={() => {
        setPaged(true);
        setPage((p) => (p + 1) % METRICS.length);
      }}>
      <WidgetHeader
        icon={<DataBarVertical20Filled />}
        tint={m.color}
        title={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={m.name}
              className="block"
              initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
            >
              {m.name}
            </motion.span>
          </AnimatePresence>
        }
        subtitle={m.sub}
        extra={
          <div className="mt-1 flex flex-col gap-[3px]">
            {METRICS.map((x, i) => (
              <motion.span
                key={x.name}
                layout
                className={cn("w-1.5 rounded-full", i === page ? "h-3" : "h-1.5 bg-fill")}
                style={i === page ? { background: m.color } : undefined}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            ))}
          </div>
        }
      />

      <div className="mt-2 leading-none">
        <AnimatedNumber
          value={value}
          format={m.format}
          className="text-[26px] leading-none font-semibold tracking-tight text-heading"
        />
      </div>
      <div className="mt-1 flex items-center gap-1 text-[11px] text-tertiary">
        <span className={cn("font-semibold tabular", change >= 0 ? "text-ios-green" : "text-ios-red")}>
          <AnimatedNumber value={change} format={{ style: "percent", maximumFractionDigits: 1, signDisplay: "always" }} />
        </span>
        <span className="truncate">vs last week</span>
      </div>

      <div className="mt-auto flex h-[34px] items-end gap-[5px]">
        {m.now.map((v, i) => {
          const last = m.last[i];
          const h = (x: number) => `${Math.max(12, ((x - min) / (max - min)) * 100)}%`;
          return (
            <div key={i} className="flex h-full flex-1 items-end gap-px">
              <motion.span
                className="flex-1 rounded-[2px] bg-fill-secondary"
                initial={{ height: 2 }}
                animate={{ height: h(last) }}
                transition={{ type: "spring", stiffness: 220, damping: 20, delay: (paged ? 0 : delay) + i * 0.03 }}
              />
              <motion.span
                className="flex-1 rounded-[2px] transition-colors duration-500"
                style={{ backgroundColor: m.color }}
                initial={{ height: 2 }}
                animate={{ height: h(v) }}
                transition={{ type: "spring", stiffness: 220, damping: 18, delay: (paged ? 0.04 : delay + 0.08) + i * 0.03 }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-[5px] text-[9px] text-tertiary">
        {DAYS.map((d, i) => (
          <span key={i} className="flex-1 text-center">
            {d}
          </span>
        ))}
      </div>
    </Widget>
  );
}
