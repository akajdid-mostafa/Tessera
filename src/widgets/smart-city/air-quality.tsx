import { WeatherDuststorm20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";

/** PM2.5 hourly means over the last 24 h, µg/m³: two rush hours and a calm night. */
const SEED = [14, 16, 19, 23, 25, 22, 18, 15, 12, 10, 9, 8, 8, 9, 12, 18, 24, 21, 16, 13, 12, 13, 15, 16.4];
const WHO_24H = 15;
const GOOD = 9;
const NOW_HOUR = 18;

/** US EPA 2024 PM2.5 breakpoints to AQI. */
const BREAKS = [
  [0, 9, 0, 50],
  [9.1, 35.4, 51, 100],
  [35.5, 55.4, 101, 150],
  [55.5, 125.4, 151, 200],
  [125.5, 225.4, 201, 300],
] as const;
function aqiOf(pm: number) {
  const c = Math.round(pm * 10) / 10;
  const b = BREAKS.find(([lo, hi]) => c <= hi) ?? BREAKS[BREAKS.length - 1];
  return Math.round(b[2] + ((Math.max(c, b[0]) - b[0]) / (b[1] - b[0])) * (b[3] - b[2]));
}
const CATS = [
  { max: 50, label: "Good", color: "var(--ios-green)" },
  { max: 100, label: "Moderate", color: "var(--ios-yellow)" },
  { max: 150, label: "Sensitive", color: "var(--ios-orange)" },
  { max: 200, label: "Unhealthy", color: "var(--ios-red)" },
  { max: 999, label: "Very unhealthy", color: "var(--ios-purple)" },
];

const W = 145;
const H = 40;
const MAX = 30;
const y = (v: number) => H - 2 - (v / MAX) * (H - 4);

/** Smart city · small. PM2.5 over 24 h against the WHO guideline, line turning orange above it; scrub an hour and the AQI follows. */
export function AirQualityWidget({ index }: { index?: number }) {
  const uid = `aq${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [pm, setPm] = useState(SEED);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => {
      setPm((s) => {
        const last = s[s.length - 1];
        const next = Math.round(Math.min(24, Math.max(11, last + (Math.random() - 0.45) * 1.4)) * 10) / 10;
        return [...s.slice(0, -1), next];
      });
    }, 4000);
    return () => window.clearInterval(t);
  }, []);

  const i = hover ?? pm.length - 1;
  const v = pm[i];
  const aqi = aqiOf(v);
  const cat = CATS.find((c) => aqi <= c.max)!;
  const hour = (NOW_HOUR - (pm.length - 1 - i) + 24) % 24;

  const pts = pm.map((p, k) => `${((k / (pm.length - 1)) * W).toFixed(1)},${y(p).toFixed(1)}`);
  const line = `M${pts.join(" L")}`;
  const area = `${line} L${W},${H} L0,${H} Z`;
  const delay = 0.3 + (index ?? 0) * 0.06;

  return (
    <Widget size="small" index={index} label="Air quality">
      <WidgetHeader icon={<WeatherDuststorm20Filled />} tint="var(--ios-teal)" title="Air Quality" subtitle="Ballard station · PM2.5" />

      <div className="mt-2 flex items-center gap-2">
        <AnimatedNumber value={aqi} className="text-[30px] leading-none font-semibold tracking-tight text-heading" />
        <div className="min-w-0 leading-tight">
          <div className="flex items-center gap-1 text-[12px] font-semibold text-heading">
            <motion.span
              className="size-2 shrink-0 rounded-full"
              style={{ background: cat.color }}
              animate={{ scale: [1, 1.35, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={cat.label}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="truncate"
              >
                {cat.label}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="text-[11px] whitespace-nowrap text-tertiary tabular">
            <AnimatedNumber value={v} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} className="text-secondary" /> µg/m³
          </div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-auto h-[40px] w-full cursor-crosshair overflow-visible"
        preserveAspectRatio="none"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const t = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
          setHover(Math.round(t * (pm.length - 1)));
        }}
        onPointerLeave={() => setHover(null)}
        aria-hidden
      >
        <defs>
          <clipPath id={`${uid}-hi`}>
            <rect x="0" y="0" width={W} height={y(WHO_24H)} />
          </clipPath>
          <clipPath id={`${uid}-lo`}>
            <rect x="0" y={y(WHO_24H)} width={W} height={H} />
          </clipPath>
        </defs>
        <rect x="0" y={y(GOOD)} width={W} height={H - y(GOOD)} fill="var(--ios-green)" fillOpacity={0.1} />
        <path d={area} fill="var(--ant-color-fill-tertiary)" />
        <line x1="0" x2={W} y1={y(WHO_24H)} y2={y(WHO_24H)} stroke="var(--ant-color-text-tertiary)" strokeDasharray="2 2" strokeWidth={0.8} />
        {(["lo", "hi"] as const).map((k) => (
          <motion.path
            key={k}
            d={line}
            fill="none"
            clipPath={`url(#${uid}-${k})`}
            stroke={k === "hi" ? "var(--ios-orange)" : "var(--ant-color-text-secondary)"}
            strokeWidth={1.8}
            strokeLinejoin="round"
            strokeLinecap="round"
           
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
        {hover !== null ? (
          <line
            x1={(hover / (pm.length - 1)) * W}
            x2={(hover / (pm.length - 1)) * W}
            y1="0"
            y2={H}
            stroke="var(--ant-color-text-tertiary)"
            strokeWidth={1}
           
          />
        ) : null}
      </svg>
      <div className="mt-1 flex justify-between text-[9px] text-tertiary tabular">
        <span>{hover === null ? "−24 h" : `${String(hour).padStart(2, "0")}:00`}</span>
        <span>┄ WHO 15</span>
        <span>Now</span>
      </div>
    </Widget>
  );
}
