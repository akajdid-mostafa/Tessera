import { WeatherSnowflake20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const LOW = 2;
const HIGH = 8;
const SCALE = 11;
const POINTS = 26;
const TICK_MS = 1600;
const STEP_MIN = 5;
const W = 120;
const H = 40;
const y = (t: number) => H - (Math.min(SCALE, Math.max(0, t)) / SCALE) * H;
const xAt = (i: number) => (i / (POINTS - 1)) * W;
const SEED = Array.from({ length: POINTS }, (_, i) => 4.1 + Math.sin(i * 0.9) * 0.35 + Math.cos(i * 2.3) * 0.15);

/** Logistics · small. A reefer's live temperature over its 2–8 °C band; it turns orange and shakes on an excursion. */
export function ColdChainWidget({ index }: { index?: number }) {
  const [temps, setTemps] = useState(SEED);
  const [hover, setHover] = useState<number | null>(null);
  const tick = useRef(0);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      tick.current += 1;
      // Every ~70 s a door-open drift pushes the box past 8 °C, then the unit pulls it back.
      const phase = tick.current % 44;
      const target = phase >= 20 && phase < 28 ? 9 : 4.2;
      setTemps((all) => {
        const last = all[all.length - 1];
        const next = last + (target - last) * 0.28 + (Math.random() - 0.5) * 0.25;
        return [...all.slice(1), Math.round(next * 10) / 10];
      });
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, []);

  const at = hover ?? POINTS - 1;
  const temp = temps[at];
  const latest = temps[POINTS - 1];
  const out = latest > HIGH || latest < LOW;
  const shownOut = temp > HIGH || temp < LOW;
  const line = temps.map((t, i) => `${i ? "L" : "M"}${xAt(i).toFixed(1)} ${y(t).toFixed(1)}`).join(" ");
  const tint = out ? "var(--ios-orange)" : "var(--ios-teal)";

  return (
    <Widget size="small" index={index} label="Cold chain temperature">
      <WidgetHeader
        icon={<WeatherSnowflake20Filled />}
        tint={tint}
        title="MSKU 482193"
        subtitle="Savannah → Hamburg"
      />

      <motion.div
        className="mt-2 flex items-end justify-between"
        animate={out ? { x: [0, -4, 4, -3, 3, -1, 0] } : { x: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <div
          className={cn(
            "text-[28px] leading-none font-semibold tracking-tight transition-colors duration-mid",
            shownOut ? "text-ios-orange" : "text-heading",
          )}
        >
          <AnimatedNumber value={temp} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
          <span className="text-[13px] font-medium text-tertiary"> °C</span>
        </div>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={hover !== null ? "ago" : out ? "out" : "ok"}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className={cn(
              "mb-0.5 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              hover !== null
                ? "bg-fill-tertiary text-secondary tabular"
                : out
                  ? "bg-ios-orange/15 text-ios-orange"
                  : "bg-ios-green/15 text-ios-green",
            )}
          >
            {hover !== null ? `−${(POINTS - 1 - hover) * STEP_MIN} min` : out ? "Excursion" : "In range"}
          </motion.span>
        </AnimatePresence>
      </motion.div>

      <div
        className="relative mt-2 h-[40px] cursor-crosshair"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const t = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
          setHover(Math.round(t * (POINTS - 1)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
          <rect x="0" y={y(HIGH)} width={W} height={y(LOW) - y(HIGH)} rx="3" className="fill-ios-teal/12" />
          {[HIGH, LOW].map((b) => (
            <line
              key={b}
              x1="0"
              x2={W}
              y1={y(b)}
              y2={y(b)}
              strokeDasharray="3 3"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              className="stroke-ios-teal/50"
            />
          ))}
          <motion.path
            d={line}
            fill="none"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ stroke: tint, transition: "stroke 0.4s" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ opacity: { delay, duration: 1.1, ease: [0.22, 1, 0.36, 1] } }}
          />
          {hover !== null ? (
            <line
              x1={xAt(hover)}
              x2={xAt(hover)}
              y1="0"
              y2={H}
              strokeWidth="1"
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
              className="stroke-[var(--ant-color-text-tertiary)]"
            />
          ) : null}
        </svg>
        {/* The dot is HTML so the stretched viewBox does not squash it. */}
        <motion.span
          className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--widget-surface)]"
          style={{ background: shownOut ? "var(--ios-orange)" : "var(--ios-teal)" }}
          initial={{ opacity: 0 }}
          animate={{ left: `${(xAt(at) / W) * 100}%`, top: `${(y(temp) / H) * 100}%`, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 32, opacity: { delay: delay + 1 } }}
        />
        {[HIGH, LOW].map((b) => (
          <span
            key={b}
            className={cn(
              "pointer-events-none absolute left-0.5 text-[9px] leading-none text-ios-teal",
              // Outside the band: inside it the two labels met in the middle.
              b === HIGH ? "-translate-y-[11px]" : "translate-y-[2px]",
            )}
            style={{ top: `${(y(b) / H) * 100}%` }}
          >
            {b}°
          </span>
        ))}
      </div>

      <div className="mt-auto flex justify-between text-[10px] text-tertiary tabular">
        <span>−2 h</span>
        <span className="text-tertiary">Set 4.0 °C</span>
        <span>Now</span>
      </div>
    </Widget>
  );
}
