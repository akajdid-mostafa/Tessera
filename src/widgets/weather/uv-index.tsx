import { WeatherSunnyHigh20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/* Sydney in late spring: clear sky, solar noon near 12:55, a clear-sky peak of about 11.6. */
const PEAK = 11.6;
const NOON = 13;
const SIGMA = 2.6;
const uv = (t: number) => PEAK * Math.exp(-((t - NOON) ** 2) / (2 * SIGMA * SIGMA));
const T0 = 6;
const T1 = 20;
const STEP = 0.5;
const SLOTS = Array.from({ length: (T1 - T0) / STEP + 1 }, (_, i) => T0 + i * STEP);
const NOW = 10.5;
const NOW_I = SLOTS.indexOf(NOW);

/** WHO exposure categories. */
const CAT = [
  { max: 2, label: "Low", fill: "var(--ios-green)", text: "text-ios-green", pill: "bg-ios-green/15" },
  { max: 5, label: "Moderate", fill: "var(--ios-yellow)", text: "text-ios-yellow", pill: "bg-ios-yellow/15" },
  { max: 7, label: "High", fill: "var(--ios-orange)", text: "text-ios-orange", pill: "bg-ios-orange/15" },
  { max: 10, label: "Very High", fill: "var(--ios-red)", text: "text-ios-red", pill: "bg-ios-red/15" },
  { max: Infinity, label: "Extreme", fill: "var(--ios-purple)", text: "text-ios-purple", pill: "bg-ios-purple/15" },
];
const catOf = (v: number) => CAT.find((c) => Math.round(v) <= c.max)!;

/** Sun-protection window: every minute the index reaches 3, rounded to 5 minutes. */
const PROTECT = (() => {
  const mins = Array.from({ length: (T1 - T0) * 60 }, (_, m) => T0 + m / 60).filter((t) => uv(t) >= 3);
  const r5 = (t: number) => Math.round(t * 12) / 12;
  return [r5(mins[0]), r5(mins[mins.length - 1])] as const;
})();
/** Horizontal position of a time, matched to the centres of the half-hour bars. */
const pct = (t: number) => (((t - T0) / STEP + 0.5) / SLOTS.length) * 100;

function clock(t: number, ampm = true) {
  const h = Math.floor(t);
  const m = Math.round((t - h) * 60);
  if (!ampm) return `${h}:${String(m).padStart(2, "0")}`;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
/** Minutes to a first sunburn for skin type II (MED ≈ 250 J/m²). */
const burnMin = (v: number) => Math.round(166 / Math.max(0.5, v));

/** Weather · medium. Today's UV as half-hour bars coloured by WHO category, the sun-protection window shaded and a live NOW bar; scrub to read any half hour. */
export function UvIndexWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [hover, setHover] = useState<number | null>(null);
  const [cloud, setCloud] = useState(1);

  // Thin cloud passes over the beach and nudges the live reading.
  useEffect(() => {
    const t = window.setInterval(() => setCloud(0.86 + Math.random() * 0.14), 4000);
    return () => window.clearInterval(t);
  }, []);

  const values = SLOTS.map((t, i) => (i === NOW_I ? uv(t) * cloud : uv(t)));
  const i = hover ?? NOW_I;
  const v = values[i];
  const shown = Math.round(v);
  const cat = catOf(v);
  const peakI = values.indexOf(Math.max(...values));

  return (
    <Widget size="medium" index={index} label="UV index">
      <WidgetHeader
        icon={<WeatherSunnyHigh20Filled />}
        tint="var(--ios-orange)"
        title="UV Index"
        subtitle="Bondi Beach · Sydney"
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={cat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={cn("mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap", cat.pill, cat.text)}
            >
              {cat.label}
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="mt-1.5 flex items-baseline-last gap-3 whitespace-nowrap">
        <div className="flex items-baseline gap-1.5 leading-none">
          <AnimatedNumber value={shown} className="text-[32px] font-semibold tracking-tight text-heading" />
          <span className="text-[12px] text-tertiary tabular">{hover === null ? "now" : `at ${clock(SLOTS[i])}`}</span>
        </div>
        <div className="ml-auto text-right text-[11px] leading-tight text-tertiary tabular">
          <div>
            Protect{" "}
            <span className="font-semibold text-secondary">
              {clock(PROTECT[0], false)}–{clock(PROTECT[1], false)}
            </span>
          </div>
          <div>
            {shown < 3 ? (
              "No protection needed"
            ) : (
              <>
                Burns in ~<AnimatedNumber value={burnMin(v)} className="font-semibold text-secondary" /> min
              </>
            )}
          </div>
        </div>
      </div>

      <div
        className="relative mt-auto h-[56px] cursor-crosshair"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
          setHover(Math.min(SLOTS.length - 1, Math.floor(f * SLOTS.length)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <motion.div
          aria-hidden
          className="absolute inset-y-0 rounded-md border-x border-dashed border-ios-orange/50 bg-ios-orange/10"
          style={{ left: `${pct(PROTECT[0])}%`, right: `${100 - pct(PROTECT[1])}%` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.5, duration: 0.6 }}
        />
        <div className="absolute inset-x-0 top-1 bottom-0 flex items-end gap-[2px]">
          {values.map((val, k) => {
            const c = catOf(val);
            const dim = hover !== null && hover !== k;
            return (
              <motion.div
                key={SLOTS[k]}
                className="relative flex-1 origin-bottom rounded-[3px]"
                style={{ background: c.fill, opacity: dim ? 0.4 : k > NOW_I && hover === null ? 0.55 : 1 }}
                initial={{ scaleY: 0, height: `${Math.max(4, (val / 12) * 100)}%` }}
                animate={{ scaleY: 1, height: `${Math.max(4, (val / 12) * 100)}%` }}
                transition={{
                  scaleY: { delay: delay + k * 0.018, type: "spring", stiffness: 170, damping: 18 },
                  height: { type: "spring", stiffness: 140, damping: 20 },
                }}
              >
                {k === NOW_I ? (
                  <motion.span
                    className="absolute -top-1.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-[var(--ant-color-text)]"
                    animate={{ opacity: [1, 0.35, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                ) : null}
              </motion.div>
            );
          })}
        </div>
        <div className="absolute inset-x-0 bottom-0 border-t-[0.5px] border-split" />
      </div>

      <div className="relative mt-1 h-3 text-[10px] leading-none text-tertiary tabular">
        {[9, 12, 15].map((t) => (
          <span key={t} className="absolute -translate-x-1/2" style={{ left: `${pct(t)}%` }}>
            {t === 12 ? "12P" : t > 12 ? `${t - 12}P` : `${t}A`}
          </span>
        ))}
        <span className="absolute left-0">6A</span>
        <span className="absolute right-0">
          Peak {Math.round(values[peakI])} · {clock(SLOTS[peakI], false)}
        </span>
      </div>
    </Widget>
  );
}
