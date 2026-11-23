import { Bed20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const PAGES = [
  { label: "Tonight", sold: 124, adr: 186, color: "var(--ios-purple)" },
  { label: "Tomorrow", sold: 105, adr: 172, color: "var(--ios-indigo)" },
  { label: "Weekend", sold: 136, adr: 214, color: "var(--ios-pink)" },
] as const;
const ROOMS = 142;
const R = 30;
const C = 2 * Math.PI * R;

/** Hospitality · small. Tap to page through nights; the ring and digits follow. */
export function OccupancyWidget({ index }: { index?: number }) {
  const [page, setPage] = useState(0);
  const p = PAGES[page];
  const pct = p.sold / ROOMS;

  return (
    <Widget
      size="small"
      index={index}
      label="Hotel occupancy"
      pressable
      onPress={() => setPage((n) => (n + 1) % PAGES.length)}
    >
      <WidgetHeader icon={<Bed20Filled />} tint={p.color} title="Occupancy" subtitle="The Wren" />

      <div className="mt-1 flex flex-1 items-center gap-2.5">
        <div className="relative size-[68px] shrink-0">
          <svg viewBox="0 0 76 76" className="size-full -rotate-90">
            <circle cx="38" cy="38" r={R} fill="none" strokeWidth="6" className="stroke-fill-secondary" />
            <motion.circle
              cx="38"
              cy="38"
              r={R}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C, stroke: p.color }}
              animate={{ strokeDashoffset: C * (1 - pct), stroke: p.color }}
              transition={{ type: "spring", stiffness: 90, damping: 18, delay: page === 0 ? 0.35 : 0 }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <AnimatedNumber
              value={pct}
              format={{ style: "percent", maximumFractionDigits: 0 }}
              className="text-[15px] font-semibold text-heading"
            />
          </div>
        </div>

        <div className="min-w-0 whitespace-nowrap leading-tight">
          <motion.div
            key={p.label}
            initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            className="text-[11px] font-semibold"
            style={{ color: p.color }}
          >
            {p.label}
          </motion.div>
          <div className="text-[20px] font-semibold tracking-tight text-heading">
            <AnimatedNumber value={p.sold} />
            <span className="text-[12px] font-medium text-tertiary">/{ROOMS}</span>
          </div>
          <div className="text-[11px] text-tertiary">
            ADR <AnimatedNumber value={p.adr} prefix="$" className="font-semibold text-secondary" />
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-1">
        {PAGES.map((x, i) => (
          <motion.span
            key={x.label}
            layout
            className={cn("h-1.5 rounded-full", i === page ? "w-3.5" : "w-1.5 bg-fill")}
            style={i === page ? { background: p.color } : undefined}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        ))}
      </div>
    </Widget>
  );
}
