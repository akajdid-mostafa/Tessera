import { WeatherSqualls20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/* Spray conditions hour by hour. Good means wind 5–15 km/h and Delta T 2–8 °C (droplets
 * neither drift nor evaporate); calm air at dawn risks an inversion, and gusts over 20
 * km/h or Delta T over 10 °C rule the hour out. Bar height is wind speed. */
type Rating = "Good" | "Marginal" | "Poor";
type Hour = { h: number; wind: number; dt: number };

const HOURS: Hour[] = [
  { h: 8, wind: 6, dt: 3.1 },
  { h: 9, wind: 9, dt: 4.2 },
  { h: 10, wind: 12, dt: 5.6 },
  { h: 11, wind: 16, dt: 7.4 },
  { h: 12, wind: 19, dt: 8.9 },
  { h: 13, wind: 23, dt: 10.4 },
  { h: 14, wind: 25, dt: 11.2 },
  { h: 15, wind: 21, dt: 9.6 },
  { h: 16, wind: 17, dt: 8.1 },
  { h: 17, wind: 12, dt: 6.2 },
  { h: 18, wind: 8, dt: 4.0 },
  { h: 19, wind: 3, dt: 1.9 },
];
const WIND_MAX = 28;

function rate(x: Hour): Rating {
  if (x.wind > 20 || x.dt > 10 || x.wind < 3.5) return "Poor";
  if (x.wind > 15 || x.dt > 8 || x.dt < 2 || x.wind < 5) return "Marginal";
  return "Good";
}
const FILL: Record<Rating, string> = { Good: "var(--ios-green)", Marginal: "var(--ios-yellow)", Poor: "var(--ios-red)" };
const TEXT: Record<Rating, string> = { Good: "text-ios-green", Marginal: "text-ios-yellow", Poor: "text-ios-red" };
const hh = (h: number) => `${String(h % 24).padStart(2, "0")}:00`;

/** Agriculture · small. The next 12 hours of spray conditions as wind bars coloured good, marginal or poor; the current hour breathes and its wind ticks live, and hovering or tapping an hour previews its window. */
export function SprayWindowWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [sel, setSel] = useState<number | null>(null);
  const [windNow, setWindNow] = useState(HOURS[0].wind);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      setWindNow((w) => Math.round(Math.max(5.2, Math.min(9, w + (Math.random() - 0.5) * 2)) * 10) / 10);
    }, 2600);
    return () => window.clearInterval(t);
  }, []);

  const i = sel ?? 0;
  const hour = i === 0 ? { ...HOURS[0], wind: windNow } : HOURS[i];
  const r = rate(hour);
  let end = i;
  while (end + 1 < HOURS.length && rate(HOURS[end + 1]) === r) end++;
  const until = end + 1 < HOURS.length ? HOURS[end + 1].h : HOURS[end].h + 1;

  return (
    <Widget size="small" index={index} label="Spray window">
      <WidgetHeader icon={<WeatherSqualls20Filled />} tint="var(--ios-teal)" title="Spray Window" subtitle="Field 4 · Next 12 h" />

      <div className="mt-2 whitespace-nowrap">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${r}-${until}`}
            initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -4, filter: "blur(3px)" }}
            transition={{ duration: 0.18 }}
            className="flex items-baseline gap-1.5 leading-none"
          >
            <span className={cn("text-[22px] font-semibold tracking-tight", TEXT[r])}>{r}</span>
            <span className="text-[12px] text-tertiary tabular">to {hh(until)}</span>
          </motion.div>
        </AnimatePresence>
        <div className="mt-1.5 text-[11px] leading-none text-tertiary">
          {i === 0 ? "Now" : hh(hour.h)} ·{" "}
          <AnimatedNumber value={Math.round(hour.wind)} className="font-semibold text-secondary" /> km/h · ΔT{" "}
          <AnimatedNumber value={hour.dt} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} className="font-semibold text-secondary" />
        </div>
      </div>

      <div className="mt-auto flex h-[44px] items-end gap-[3px]" onPointerLeave={() => setSel(null)}>
        {HOURS.map((x, k) => {
          const w = k === 0 ? windNow : x.wind;
          const active = k === i;
          return (
            <button
              key={x.h}
              type="button"
              aria-label={`${hh(x.h)} ${rate(x)}, wind ${x.wind} km/h`}
              onPointerEnter={() => setSel(k)}
              onClick={() => setSel(k)}
              className="flex h-full min-w-0 flex-1 cursor-pointer items-end"
            >
              <motion.span
                className="w-full rounded-[3px]"
                style={{ background: FILL[rate({ ...x, wind: w })] }}
                initial={{ height: 3, opacity: 0.5 }}
                animate={{
                  height: `${Math.max(12, (w / WIND_MAX) * 100)}%`,
                  opacity: active ? 1 : k === 0 && !reduce ? [0.55, 0.95, 0.55] : 0.45,
                }}
                transition={{
                  height: { type: "spring", stiffness: 200, damping: 18, delay: delay + k * 0.03 },
                  opacity: k === 0 && !active ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.15 },
                }}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] leading-none text-tertiary tabular">
        <span className="font-semibold text-secondary">Now</span>
        <span>{hh(HOURS[6].h)}</span>
        <span>{hh(HOURS[11].h)}</span>
      </div>
    </Widget>
  );
}
