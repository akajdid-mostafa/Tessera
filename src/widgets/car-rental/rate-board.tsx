import { Add16Filled, Subtract16Filled, Tag20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

/* Compact class at the airport branch, the next seven days. A trade fair Thu–Fri fills the fleet. */
const DAYS = [
  { short: "T", label: "Tue 10" },
  { short: "W", label: "Wed 11" },
  { short: "T", label: "Thu 12" },
  { short: "F", label: "Fri 13" },
  { short: "S", label: "Sat 14" },
  { short: "S", label: "Sun 15" },
  { short: "M", label: "Mon 16" },
];
const UTIL = [0.64, 0.71, 0.86, 0.92, 0.81, 0.69, 0.58];
const RATES = [46, 48, 52, 54, 55, 48, 44];
const FRI = 3;
const STEP = 2;
const TICK_MS = 4200;
/** The pricing model's suggestion: a floor plus a premium that climbs steeply as the class fills. */
const suggest = (u: number) => Math.round(38 + 34 * u * u);

/** Car rental · small. A daily rate against the suggested price for a week of demand; tap a day, step the rate or tap the gap to match. */
export function RateBoardWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [day, setDay] = useState(FRI);
  const [rates, setRates] = useState(RATES);
  const [util, setUtil] = useState(UTIL);
  const [touched, setTouched] = useState(false);

  // Friday keeps filling as bookings come in.
  useEffect(() => {
    const t = window.setInterval(() => {
      setUtil((u) => u.map((v, i) => (i === FRI ? Math.min(0.99, v + 0.006) : v)));
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, []);

  const rate = rates[day];
  const u = util[day];
  const sug = suggest(u);
  const gap = rate - sug;
  const hot = u >= 0.85;
  const step = (by: number) => {
    setTouched(true);
    setRates((r) => r.map((v, i) => (i === day ? Math.max(29, Math.min(129, v + by)) : v)));
  };

  return (
    <Widget size="small" index={index} label="Daily rate board">
      <WidgetHeader icon={<Tag20Filled />} tint="var(--ios-indigo)" title="Compact rate" subtitle={`Airport · ${DAYS[day].label}`} />

      <div className="mt-2 flex items-baseline justify-between whitespace-nowrap">
        <span className="text-[26px] leading-none font-semibold tracking-tight text-heading">
          <AnimatedNumber value={rate} prefix="$" />
          <span className="text-[12px] font-medium text-tertiary">/day</span>
        </span>
        <span className={cn("text-[11px] font-semibold tabular", hot ? "text-ios-orange" : "text-tertiary")}>
          <AnimatedNumber value={u} format={{ style: "percent", maximumFractionDigits: 0 }} /> full
        </span>
      </div>

      <div className="mt-2.5 flex h-[26px] items-end gap-[3px]">
        {DAYS.map((d, i) => {
          const on = i === day;
          return (
            <motion.button
              type="button"
              key={d.label}
              aria-label={`${d.label}, ${Math.round(util[i] * 100)}% booked`}
              onClick={() => setDay(i)}
              className={cn(
                "min-w-0 flex-1 cursor-pointer rounded-[3px] outline-none transition-colors",
                on ? "bg-ios-indigo" : util[i] >= 0.85 ? "bg-ios-orange/55" : "bg-fill-secondary",
              )}
              initial={{ height: 3 }}
              animate={{ height: `${Math.max(12, util[i] * 100)}%` }}
              whileHover={{ scaleY: 1.06 }}
              style={{ originY: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 20, delay: touched ? 0 : delay + i * 0.04 }}
            />
          );
        })}
      </div>
      <div className="mt-1 flex gap-[3px] text-[9px] leading-none">
        {DAYS.map((d, i) => (
          <span key={d.label} className={cn("flex-1 text-center", i === day ? "font-semibold text-ios-indigo" : "text-tertiary")}>
            {d.short}
          </span>
        ))}
      </div>

      <div className="mt-auto flex h-7 items-center gap-1">
        <Button
          size="small"
          shape="circle"
          variant="filled"
          color="default"
          icon={<Subtract16Filled />}
          aria-label="Lower rate"
          onClick={() => step(-STEP)}
        />
        <motion.button
          type="button"
          onClick={() => {
            setTouched(true);
            setRates((r) => r.map((v, i) => (i === day ? sug : v)));
          }}
          whileTap={{ scale: 0.94 }}
          className={cn(
            "flex h-6 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-full text-[11px] font-semibold whitespace-nowrap tabular transition-colors",
            gap === 0 ? "bg-ios-green/15 text-ios-green" : gap < 0 ? "bg-ios-orange/15 text-ios-orange" : "bg-ios-blue/15 text-ios-blue",
          )}
          aria-label="Match suggested rate"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={gap === 0 ? "match" : "gap"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              {gap === 0 ? (
                "At suggested"
              ) : (
                <>
                  <AnimatedNumber value={gap} format={{ style: "currency", currency: "USD", maximumFractionDigits: 0, signDisplay: "always" }} /> vs ${sug}
                </>
              )}
            </motion.span>
          </AnimatePresence>
        </motion.button>
        <Button
          size="small"
          shape="circle"
          variant="filled"
          color="default"
          icon={<Add16Filled />}
          aria-label="Raise rate"
          onClick={() => step(STEP)}
        />
      </div>
    </Widget>
  );
}
