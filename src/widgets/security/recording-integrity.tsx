import { HardDrive20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const DAYS = [
  { d: "M", day: "Monday", v: 99.6, note: "All 250 cameras" },
  { d: "T", day: "Tuesday", v: 99.4, note: "2 short gaps · Stair C" },
  { d: "W", day: "Wednesday", v: 98.9, note: "East Fence dropped 41 min" },
  { d: "T", day: "Thursday", v: 93.8, note: "NVR-2 RAID rebuild · 1h 28m gap" },
  { d: "F", day: "Friday", v: 99.1, note: "Firmware push · 6 cameras" },
  { d: "S", day: "Saturday", v: 99.7, note: "All 250 cameras" },
  { d: "S", day: "Today", v: 98.2, note: "East Fence offline 3h 12m" },
];
const TARGET = 95;
const FLOOR = 90;
const h = (v: number) => ((v - FLOOR) / (100 - FLOOR)) * 100;
const AVG = DAYS.reduce((s, x) => s + x.v, 0) / DAYS.length;

/** Security · small. Recording integrity over seven days against a 95% floor: bars rise in a stagger, the day that dipped below glows amber, and hovering a bar explains it. */
export function RecordingIntegrityWidget({ index }: { index?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const day = hover === null ? null : DAYS[hover];
  const value = day ? day.v : AVG;
  const below = value < TARGET;
  const delay = 0.3 + (index ?? 0) * 0.06;

  return (
    <Widget size="small" index={index} label="Recording integrity">
      <WidgetHeader icon={<HardDrive20Filled />} tint="var(--ios-purple)" title="Recording" subtitle="Integrity · 7 days" />

      <div className="mt-2 leading-none">
        <AnimatedNumber
          value={value / 100}
          format={{ style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }}
          className={cn("text-[26px] font-semibold tracking-tight transition-colors duration-300", below ? "text-ios-orange" : "text-heading")}
        />
        <div className="mt-1 h-[13px] text-[10px] text-tertiary">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={hover ?? "avg"}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              className="truncate"
            >
              {day ? `${day.day} · ${day.note}` : `7-day average · target ≥ ${TARGET}%`}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="relative mt-auto h-[42px]" onMouseLeave={() => setHover(null)}>
        {/* Below-target band. */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-[4px] bg-ios-red/10"
          style={{ height: `${h(TARGET)}%` }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-ios-red/60"
          style={{ bottom: `${h(TARGET)}%` }}
        />
        <div className="relative flex h-full items-end gap-[5px]">
          {DAYS.map((x, i) => {
            const low = x.v < TARGET;
            const on = hover === i;
            return (
              <button
                key={i}
                type="button"
                aria-label={`${x.day} ${x.v}%`}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className="flex h-full flex-1 cursor-pointer items-end outline-none"
              >
                <motion.span
                  className={cn(
                    "block w-full rounded-[3px] transition-colors duration-200",
                    low ? "bg-ios-orange" : on ? "bg-ios-purple" : i === DAYS.length - 1 ? "bg-ios-purple/70" : "bg-fill",
                  )}
                  style={low ? { boxShadow: "0 0 10px color-mix(in srgb, var(--ios-orange) 55%, transparent)" } : undefined}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(6, h(x.v))}%`, opacity: hover === null || on ? 1 : 0.55 }}
                  transition={{
                    height: { type: "spring", stiffness: 200, damping: 18, delay: delay + i * 0.05 },
                    opacity: { duration: 0.2 },
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-1 flex gap-[5px] text-[9px] text-tertiary">
        {DAYS.map((x, i) => (
          <span key={i} className={cn("flex-1 text-center", hover === i && "font-semibold text-secondary")}>
            {x.d}
          </span>
        ))}
      </div>
    </Widget>
  );
}
