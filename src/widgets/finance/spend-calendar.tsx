import { CalendarLtr20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/** Card spend per day from Sun, Oct 11 to today, Mon, Nov 9. */
const SPEND = [
  0, 42, 18, 96, 34, 128, 212,
  64, 0, 27, 51, 140, 88, 176,
  0, 36, 22, 0, 74, 305, 96,
  58, 412, 31, 19, 66, 142, 188,
  0, 47,
];
/** Five Sunday-first weeks; the last five cells are still ahead. */
const CELLS = 35;
const FIRST = new Date(2026, 9, 11);
const TOTAL = SPEND.reduce((s, v) => s + v, 0);
const NO_SPEND = SPEND.filter((v) => v === 0).length;
const TODAY = SPEND.length - 1;

const dayLabel = (i: number) =>
  new Date(FIRST.getFullYear(), FIRST.getMonth(), FIRST.getDate() + i).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

function tone(v: number | undefined) {
  if (v === undefined) return "bg-fill-quaternary";
  if (v === 0) return "bg-ios-mint/25";
  if (v < 50) return "bg-ios-orange/20";
  if (v < 100) return "bg-ios-orange/40";
  if (v < 200) return "bg-ios-orange/65";
  return "bg-ios-orange";
}

const USD = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const;

/** Finance · small. A five-week spend heatmap pops in; hover or tap a day to read it in the hero. */
export function SpendCalendarWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [sel, setSel] = useState<number | null>(null);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), (delay + 1) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);
  const value = sel === null ? TOTAL : SPEND[sel];
  const label = sel === null ? "Last 30 days" : sel === TODAY ? "Today so far" : dayLabel(sel);

  return (
    <Widget size="small" index={index} label="Daily spend calendar">
      <WidgetHeader
        icon={<CalendarLtr20Filled />}
        tint="var(--ios-orange)"
        title="Daily Spend"
        subtitle={`${NO_SPEND} no-spend days`}
      />

      <div className="mt-1.5 flex h-[26px] items-baseline justify-between gap-1 whitespace-nowrap">
        <AnimatedNumber value={value} format={USD} className="text-[20px] leading-none font-semibold tracking-tight text-heading" />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={label}
            className={cn("truncate text-[11px]", sel !== null && SPEND[sel] === 0 ? "font-semibold text-ios-mint" : "text-tertiary")}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {sel !== null && SPEND[sel] === 0 ? "No spend" : label}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="mt-auto grid grid-cols-7 gap-[3px]" onMouseLeave={() => setSel(null)}>
        {Array.from({ length: CELLS }, (_, i) => {
          const v = SPEND[i];
          const future = v === undefined;
          const row = Math.floor(i / 7);
          const col = i % 7;
          return (
            <motion.button
              key={i}
              type="button"
              disabled={future}
              aria-label={future ? `${dayLabel(i)}: ahead` : `${dayLabel(i)}: $${v}`}
              onMouseEnter={() => !future && setSel(i)}
              onFocus={() => !future && setSel(i)}
              onClick={() => !future && setSel((s) => (s === i ? null : i))}
              className={cn(
                "relative grid h-4 place-items-center rounded-[4px] outline-none",
                future ? "cursor-default" : "cursor-pointer",
                tone(v),
                i === TODAY && "ring-1 ring-inset ring-sel",
              )}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: sel === i ? 1.18 : 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 24,
                delay: entered ? 0 : delay + (row + col) * 0.03,
              }}
            >
              {v === 0 ? <span className="size-1 rounded-full bg-ios-mint" /> : null}
            </motion.button>
          );
        })}
      </div>
    </Widget>
  );
}
