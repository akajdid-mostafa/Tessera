import { WeatherHaze20Filled } from "@fluentui/react-icons";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/** US EPA breakpoints (2024): [concLo, concHi, aqiLo, aqiHi]. */
type Bp = [number, number, number, number][];
const POLLUTANTS: { key: string; name: string; unit: string; base: number; digits: number; bp: Bp }[] = [
  {
    key: "pm25",
    name: "PM2.5",
    unit: "µg/m³",
    base: 24.8,
    digits: 1,
    bp: [[0, 9, 0, 50], [9.1, 35.4, 51, 100], [35.5, 55.4, 101, 150], [55.5, 125.4, 151, 200], [125.5, 225.4, 201, 300]],
  },
  {
    key: "pm10",
    name: "PM10",
    unit: "µg/m³",
    base: 61,
    digits: 0,
    bp: [[0, 54, 0, 50], [55, 154, 51, 100], [155, 254, 101, 150], [255, 354, 151, 200], [355, 424, 201, 300]],
  },
  {
    key: "o3",
    name: "O₃",
    unit: "ppb",
    base: 47,
    digits: 0,
    bp: [[0, 54, 0, 50], [55, 70, 51, 100], [71, 85, 101, 150], [86, 105, 151, 200], [106, 200, 201, 300]],
  },
  {
    key: "no2",
    name: "NO₂",
    unit: "ppb",
    base: 19,
    digits: 0,
    bp: [[0, 53, 0, 50], [54, 100, 51, 100], [101, 360, 101, 150], [361, 649, 151, 200], [650, 1249, 201, 300]],
  },
];

const CATEGORIES = [
  { max: 50, label: "Good", color: "var(--ios-green)" },
  { max: 100, label: "Moderate", color: "var(--ios-yellow)" },
  { max: 150, label: "Sensitive Groups", color: "var(--ios-orange)" },
  { max: 200, label: "Unhealthy", color: "var(--ios-red)" },
  { max: Infinity, label: "Very Unhealthy", color: "var(--ios-purple)" },
];

function toAqi(c: number, bp: Bp) {
  const row = bp.find(([, hi]) => c <= hi) ?? bp[bp.length - 1];
  const [cl, ch, al, ah] = row;
  return Math.round(al + ((Math.max(cl, Math.min(ch, c)) - cl) / (ch - cl)) * (ah - al));
}
const categoryOf = (a: number) => CATEGORIES.find((c) => a <= c.max)!;

const CX = 60;
const CY = 62;
const R = 50;
const SCALE_MAX = 300;
const ARC = `M${CX - R} ${CY} A${R} ${R} 0 0 1 ${CX + R} ${CY}`;
const angle = (a: number) => Math.PI * (1 - Math.min(SCALE_MAX, Math.max(0, a)) / SCALE_MAX);

/** Weather · small. AQI on a rainbow half-gauge with a marker that springs to the value; tap to cycle pollutants. */
export function AirQualityWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const uid = useId().replace(/:/g, "");
  const [page, setPage] = useState(0);
  const [conc, setConc] = useState(() => POLLUTANTS.map((p) => p.base));
  const first = useRef(true);

  useEffect(() => {
    const t = window.setInterval(() => {
      setConc((cs) => cs.map((c, i) => {
        const base = POLLUTANTS[i].base;
        const next = c * (1 + (Math.random() - 0.5) * 0.06);
        return Math.max(base * 0.85, Math.min(base * 1.15, next));
      }));
    }, 3500);
    return () => window.clearInterval(t);
  }, []);

  const p = POLLUTANTS[page];
  const c = Number(conc[page].toFixed(p.digits));
  const aqi = toAqi(c, p.bp);
  const cat = categoryOf(aqi);
  const main = POLLUTANTS.reduce((best, q, i) => (toAqi(conc[i], q.bp) > toAqi(conc[best], POLLUTANTS[best].bp) ? i : best), 0);

  const mv = useMotionValue(0);
  useEffect(() => {
    const ctl = animate(mv, aqi, { type: "spring", stiffness: 90, damping: 16, delay: first.current ? delay + 0.3 : 0 });
    first.current = false;
    return () => ctl.stop();
  }, [aqi, delay, mv]);
  const mx = useTransform(mv, (a) => CX + R * Math.cos(angle(a)));
  const my = useTransform(mv, (a) => CY - R * Math.sin(angle(a)));

  return (
    <Widget
      size="small"
      index={index}
      label="Air quality"
      pressable
      onPress={() => setPage((n) => (n + 1) % POLLUTANTS.length)}
    >
      <WidgetHeader icon={<WeatherHaze20Filled />} tint={cat.color} title="Air Quality" subtitle="Oakland, CA" />

      <div className="relative mx-auto mt-1 w-[124px]">
        <svg viewBox="0 0 120 68" className="block w-full" aria-hidden>
          <defs>
            <linearGradient id={`aq-${uid}`} gradientUnits="userSpaceOnUse" x1={CX - R} y1="0" x2={CX + R} y2="0">
              <stop offset="0%" stopColor="#34c759" />
              <stop offset="22%" stopColor="#ffd60a" />
              <stop offset="42%" stopColor="#ff9f0a" />
              <stop offset="62%" stopColor="#ff453a" />
              <stop offset="84%" stopColor="#bf5af2" />
              <stop offset="100%" stopColor="#8e2846" />
            </linearGradient>
          </defs>
          <motion.path
            d={ARC}
            fill="none"
            stroke={`url(#aq-${uid})`}
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.circle cx={mx} cy={my} r="7" fill="var(--widget-surface)" />
          <motion.circle cx={mx} cy={my} r="4" fill={cat.color} style={{ transition: "fill 300ms" }} />
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center leading-none">
          <AnimatedNumber value={aqi} className="text-[28px] font-semibold tracking-tight text-heading" />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={cat.label}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-0.5 flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-secondary"
            >
              <span className="size-1.5 rounded-full" style={{ background: cat.color }} />
              {cat.label}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-auto flex items-baseline justify-between gap-1 whitespace-nowrap text-[11px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={p.key}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className="font-semibold text-heading"
          >
            {p.name}
            {page === main ? <span className="ml-1 font-normal text-tertiary">main</span> : null}
          </motion.span>
        </AnimatePresence>
        <span className="text-tertiary">
          <AnimatedNumber
            value={c}
            format={{ minimumFractionDigits: p.digits, maximumFractionDigits: p.digits }}
            className="font-medium text-secondary"
          />{" "}
          {p.unit}
        </span>
      </div>
      <div className="mt-1.5 flex justify-center gap-1">
        {POLLUTANTS.map((x, i) => (
          <motion.span
            key={x.key}
            layout
            className={cn("h-1.5 rounded-full", i === page ? "w-3.5" : "w-1.5 bg-fill")}
            style={i === page ? { background: cat.color } : undefined}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        ))}
      </div>
    </Widget>
  );
}
