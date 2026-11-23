import { HeartPulse20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const SCORE = 72;
/* Overnight readings against the 30-day baseline, the three inputs a recovery score weighs most. */
const FACTORS = [
  { id: "hrv", label: "HRV ms", value: 68, unit: "ms", note: "HRV 68 ms · +17% vs 58", good: true },
  { id: "rhr", label: "RHR bpm", value: 51, unit: "bpm", note: "Resting 51 · −3 vs 54", good: true },
  { id: "sleep", label: "Sleep", value: 84, unit: "%", note: "Sleep 6h 48m · 84% need", good: false },
] as const;
type FactorId = (typeof FACTORS)[number]["id"];

const zone = (v: number) =>
  v >= 67
    ? { color: "var(--ios-green)", text: "text-ios-green", label: "Ready for strain" }
    : v >= 34
      ? { color: "var(--ios-yellow)", text: "text-ios-yellow", label: "Maintain today" }
      : { color: "var(--ios-red)", text: "text-ios-red", label: "Rest day" };

/* A 180° arc, radius 50, centred at (60, 58). */
const ARC = "M10 58 A50 50 0 0 1 110 58";

/** Fitness · small. This morning's recovery as a half gauge that sweeps to its zone; tap a contributor to read it against baseline. */
export function RecoveryWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [pick, setPick] = useState<FactorId | null>(null);
  const z = zone(SCORE);
  const f = FACTORS.find((x) => x.id === pick);

  return (
    <Widget size="small" index={index} label="Recovery score">
      <WidgetHeader icon={<HeartPulse20Filled />} tint="var(--ios-green)" title="Recovery" subtitle="Mon · 06:42" />

      <div className="relative mx-auto mt-1 h-[62px] w-[124px] shrink-0">
        <svg viewBox="0 0 120 62" className="absolute inset-0 size-full" aria-hidden>
          <path d={ARC} fill="none" strokeWidth="9" strokeLinecap="round" className="stroke-fill-secondary" />
          <motion.path
            d={ARC}
            fill="none"
            stroke={z.color}
            strokeWidth="9"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1 1"
            initial={{ strokeDashoffset: 1 }}
            animate={{ strokeDashoffset: 1 - SCORE / 100 }}
            transition={{ type: "spring", stiffness: 50, damping: 14, delay }}
          />
          {/* Zone boundaries at 33 % and 66 %. */}
          {[1 / 3, 2 / 3].map((t) => {
            const a = Math.PI * (1 - t);
            const x1 = 60 + Math.cos(a) * 42;
            const y1 = 58 - Math.sin(a) * 42;
            const x2 = 60 + Math.cos(a) * 37;
            const y2 = 58 - Math.sin(a) * 37;
            return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1.5" strokeLinecap="round" className="stroke-fill" />;
          })}
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex items-baseline justify-center">
          <AnimatedNumber value={SCORE} className="text-[28px] leading-none font-semibold tracking-tight text-heading" />
          <span className="text-[13px] font-medium text-tertiary">%</span>
        </div>
      </div>

      <div className="relative mt-1 h-4 overflow-hidden text-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={pick ?? "zone"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className={cn(
              "truncate whitespace-nowrap text-[11px] leading-4 font-semibold",
              f ? (f.good ? "text-ios-green" : "text-ios-orange") : z.text,
            )}
          >
            {f ? f.note : z.label}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-auto grid grid-cols-3 gap-1">
        {FACTORS.map((x, i) => {
          const on = pick === x.id;
          return (
            <motion.button
              key={x.id}
              type="button"
              aria-pressed={on}
              aria-label={x.note}
              onClick={() => setPick(on ? null : x.id)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 420, damping: 26, delay: delay + 0.3 + i * 0.05 }}
              className={cn(
                "flex h-[34px] cursor-pointer flex-col items-center justify-center rounded-lg leading-tight outline-none transition-colors duration-mid",
                on ? "bg-fill-secondary ring-1 ring-inset ring-ios-green/60" : "bg-fill-quaternary hover:bg-fill-tertiary",
              )}
            >
              <span className="text-[12px] font-semibold text-heading tabular">
                {x.value}
                <span className="text-[9px] font-medium text-tertiary">{x.unit === "%" ? "%" : ""}</span>
              </span>
              <span className="text-[9.5px] text-tertiary">{x.label}</span>
            </motion.button>
          );
        })}
      </div>
    </Widget>
  );
}
