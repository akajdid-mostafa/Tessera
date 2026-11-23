import { WeatherSqualls20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/* Bodega Bay, CA: a steady west-northwest sea breeze, 18 mph with gusts near 31. */
const BASE_DIR = 292;
const BASE_MPH = 18;
const BASE_GUST = 31;

const UNITS = [
  { key: "mph", label: "mph", k: 1, digits: 0 },
  { key: "kmh", label: "km/h", k: 1.609, digits: 0 },
  { key: "kn", label: "kn", k: 0.869, digits: 0 },
  { key: "ms", label: "m/s", k: 0.447, digits: 1 },
] as const;

const COMPASS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
const point = (deg: number) => COMPASS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];

/** Beaufort force from m/s (WMO upper bounds). */
const BFT = [
  [0.5, "Calm"],
  [1.5, "Light air"],
  [3.3, "Light breeze"],
  [5.5, "Gentle breeze"],
  [7.9, "Moderate breeze"],
  [10.7, "Fresh breeze"],
  [13.8, "Strong breeze"],
  [17.1, "Near gale"],
  [Infinity, "Gale"],
] as const;
const beaufort = (mph: number) => {
  const ms = mph * 0.447;
  const i = BFT.findIndex(([max]) => ms < max);
  return { force: i, name: BFT[i][1] };
};

const LABELS = [
  { t: "N", x: 0, y: -33 },
  { t: "E", x: 33, y: 0 },
  { t: "S", x: 0, y: 33 },
  { t: "W", x: -33, y: 0 },
];

/** Weather · small. A compass whose arrow swings with the live wind and streaks drift downwind; tap to cycle mph, km/h, knots and m/s. */
export function WindWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const clip = `wind-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [unit, setUnit] = useState(0);
  const [dir, setDir] = useState(BASE_DIR);
  const [mph, setMph] = useState(BASE_MPH);
  const [gust, setGust] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setShown(true), delay * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    const t = window.setInterval(() => {
      const isGust = Math.random() < 0.22;
      setGust(isGust);
      setDir((d) => Math.max(BASE_DIR - 18, Math.min(BASE_DIR + 18, d + (Math.random() - 0.5) * 14)));
      setMph(isGust ? 26 + Math.random() * (BASE_GUST - 26) : BASE_MPH + (Math.random() - 0.5) * 6);
    }, 2400);
    return () => window.clearInterval(t);
  }, []);

  const u = UNITS[unit];
  const speed = Number((mph * u.k).toFixed(u.digits));
  const gustV = Math.round(BASE_GUST * u.k * (u.digits ? 10 : 1)) / (u.digits ? 10 : 1);
  const bft = beaufort(mph);

  return (
    <Widget size="small" index={index} label="Wind" pressable onPress={() => setUnit((n) => (n + 1) % UNITS.length)}>
      <WidgetHeader icon={<WeatherSqualls20Filled />} tint="var(--ios-teal)" title="Wind" subtitle="Bodega Bay, CA" />

      <div className="mt-1.5 flex items-center gap-2.5">
        <div className="relative size-[88px] shrink-0">
          <svg viewBox="-50 -50 100 100" className="absolute inset-0 size-full" aria-hidden>
            <circle r="46" fill="none" strokeWidth="1" style={{ stroke: "var(--ant-color-split)" }} />
            {Array.from({ length: 36 }, (_, i) => {
              const a = (i * 10 * Math.PI) / 180;
              const major = i % 9 === 0;
              const r0 = major ? 39 : 42;
              return (
                <motion.line
                  key={i}
                  x1={Math.sin(a) * r0}
                  y1={-Math.cos(a) * r0}
                  x2={Math.sin(a) * 45}
                  y2={-Math.cos(a) * 45}
                  strokeWidth={major ? 1.6 : 1}
                  strokeLinecap="round"
                  style={{ stroke: major ? "var(--ant-color-text-secondary)" : "var(--ant-color-text-tertiary)" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: major ? 1 : 0.55 }}
                  transition={{ delay: delay + i * 0.012, duration: 0.3 }}
                />
              );
            })}
            {LABELS.map((l) => (
              <text
                key={l.t}
                x={l.x}
                y={l.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="10"
                fontWeight={l.t === "N" ? 700 : 500}
                style={{ fill: l.t === "N" ? "var(--ios-red)" : "var(--ant-color-text-tertiary)" }}
              >
                {l.t}
              </text>
            ))}
          </svg>

          {/* The arrow points downwind; its layer turns as one so labels stay put. */}
          <motion.div
            className="absolute inset-0"
            initial={{ rotate: 0, opacity: 0 }}
            animate={shown ? { rotate: dir + 180, opacity: 1 } : { rotate: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 60, damping: 12 }}
          >
            <svg viewBox="-50 -50 100 100" className="size-full overflow-visible" aria-hidden>
              <defs>
                <clipPath id={clip}>
                  <circle r="26" />
                </clipPath>
              </defs>
              {/* Direction variability, on the side the wind comes from. */}
              <path d={arc(180 - 16, 180 + 16, 46)} fill="none" strokeWidth="4" strokeLinecap="round" style={{ stroke: "var(--ios-teal)", opacity: 0.35 }} />
              <g clipPath={`url(#${clip})`}>
                {[-9, 0, 9].map((x, i) => (
                  <motion.line
                    key={x}
                    x1={x}
                    x2={x}
                    y1={0}
                    y2={8}
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    style={{ stroke: "var(--ios-teal)" }}
                    animate={{ y: [26, -34], opacity: [0, 0.8, 0] }}
                    transition={{ duration: gust ? 0.9 : 1.6, repeat: Infinity, ease: "linear", delay: i * 0.45 }}
                  />
                ))}
              </g>
              <path d="M0 -24 L5.5 -13 L1.6 -14.5 L1.6 24 L-1.6 24 L-1.6 -14.5 L-5.5 -13 Z" style={{ fill: "var(--ant-color-text)" }} />
              <circle r="3.4" style={{ fill: "var(--widget-surface)", stroke: "var(--ant-color-text)" }} strokeWidth="1.6" />
            </svg>
          </motion.div>
        </div>

        <div className="min-w-0 flex-1 leading-tight whitespace-nowrap">
          <div className="flex items-baseline gap-0.5 text-[28px] leading-none font-semibold tracking-tight text-heading">
            <AnimatedNumber value={speed} format={{ minimumFractionDigits: u.digits, maximumFractionDigits: u.digits }} />
          </div>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={u.key}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-0.5 text-[12px] font-medium text-tertiary"
            >
              {u.label}
            </motion.div>
          </AnimatePresence>
          <div className="mt-1.5 text-[11px] font-semibold text-secondary tabular">
            {point(dir)} <span className="font-normal text-tertiary">{Math.round(dir)}°</span>
          </div>
          <div className={cn("text-[11px] tabular transition-colors", gust ? "font-semibold text-ios-teal" : "text-tertiary")}>
            Gust {gustV}
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-1 whitespace-nowrap">
        <span className="truncate text-[11px] text-tertiary">
          <span className="font-semibold text-secondary">F{bft.force}</span> · {bft.name}
        </span>
        <span className="flex shrink-0 gap-1">
          {UNITS.map((x, i) => (
            <motion.span
              key={x.key}
              layout
              className={cn("h-1.5 rounded-full", i === unit ? "w-3.5 bg-ios-teal" : "w-1.5 bg-fill")}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          ))}
        </span>
      </div>
    </Widget>
  );
}

/** An SVG arc on a circle of radius r, angles in degrees clockwise from north. */
function arc(a0: number, a1: number, r: number) {
  const p = (a: number) => {
    const rad = (a * Math.PI) / 180;
    return `${(Math.sin(rad) * r).toFixed(2)} ${(-Math.cos(rad) * r).toFixed(2)}`;
  };
  return `M${p(a0)} A${r} ${r} 0 0 1 ${p(a1)}`;
}
