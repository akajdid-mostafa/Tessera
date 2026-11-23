import { Umbrella20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";

/* Intensity on Apple's three-band scale: 1 = light, 2 = moderate, 3 = heavy. */
const g = (m: number, mu: number, s: number, a: number) => a * Math.exp(-((m - mu) ** 2) / (2 * s * s));
const START = 12;
const END = 56;
const FORECAST = Array.from({ length: 120 }, (_, m) => {
  if (m < START || m > END) return 0;
  const ramp = Math.min(1, (m - START) / 4, (END - m) / 6);
  return Math.max(0, ramp * (0.85 + g(m, 27, 5, 1.75) + g(m, 44, 4, 0.8) - g(m, 37, 2.5, 0.4)));
});
const WET = 0.05;
const VW = 600;
const VH = 100;
const TOP = 3.3;
const X = (m: number) => (m / 60) * VW;
const Y = (v: number) => VH - (Math.min(v, TOP) / TOP) * (VH - 4);
const GUIDES = [
  { v: 1, label: "Light" },
  { v: 2, label: "Moderate" },
  { v: 3, label: "Heavy" },
];
/** Band edges in in/hr (AMS): light < 0.10, moderate 0.10–0.30, heavy > 0.30. */
const inHr = (v: number) => (v <= 1 ? v * 0.1 : v <= 2 ? 0.1 + (v - 1) * 0.2 : 0.3 + (v - 2) * 0.3);
const band = (v: number) => (v < WET ? "No rain" : v < 1 ? "Light rain" : v < 2 ? "Moderate rain" : "Heavy rain");

/** Catmull-Rom through the samples, so the area reads as one smooth curve. */
function smooth(pts: [number, number][]) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Weather · medium. Minute-by-minute rain for the next hour; the headline counts down live, hover to scrub a minute. */
export function RainNextHourWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const uid = useId().replace(/:/g, "");
  const [offset, setOffset] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  // The forecast window slides one minute per real minute; it loops so the demo never runs dry.
  useEffect(() => {
    const t = window.setInterval(() => setOffset((o) => (o + 1) % 50), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const data = FORECAST.slice(offset, offset + 61);
  const pts = data.map((v, m) => [X(m), Y(v)] as [number, number]);
  const line = smooth(pts);
  const area = `${line} L${VW} ${VH} L0 ${VH} Z`;

  const raining = data[0] >= WET;
  const firstWet = data.findIndex((v) => v >= WET);
  const lastWet = data.length - 1 - [...data].reverse().findIndex((v) => v >= WET);
  const peak = Math.max(...data);

  const base = new Date();
  const at = (m: number) =>
    new Date(base.getTime() + m * 60_000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  let headline: { lead: string; n: number | null; tail: string };
  if (hover !== null) {
    headline = { lead: `${band(data[hover])}${hover === 0 ? " now" : " in "}`, n: hover === 0 ? null : hover, tail: hover === 0 ? "" : " min" };
  } else if (firstWet === -1) {
    headline = { lead: "No rain for the next hour", n: null, tail: "" };
  } else if (!raining) {
    headline = { lead: "Rain starting in ", n: firstWet, tail: " min" };
  } else if (lastWet < 60) {
    headline = { lead: `${band(data[0])} stopping in `, n: lastWet + 1, tail: " min" };
  } else {
    headline = { lead: `${band(data[0])} for the next hour`, n: null, tail: "" };
  }

  return (
    <Widget size="medium" index={index} label="Next-hour precipitation">
      <WidgetHeader
        icon={<Umbrella20Filled />}
        tint="var(--ios-blue)"
        title="Next-Hour Precipitation"
        subtitle="Brooklyn, NY"
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={hover === null ? "peak" : "point"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-right text-[11px] leading-tight whitespace-nowrap text-tertiary tabular"
            >
              {hover === null ? "Peak " : `${at(hover)} · `}
              <span className="font-semibold text-ios-blue">
                {inHr(hover === null ? peak : data[hover]).toFixed(2)}
              </span>{" "}
              in/hr
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="mt-1.5 truncate text-[18px] leading-none font-semibold tracking-tight whitespace-nowrap text-heading">
        {headline.lead}
        {headline.n !== null ? <AnimatedNumber value={headline.n} className="text-ios-blue" /> : null}
        {headline.tail}
      </div>

      <div
        className="relative mt-auto h-[60px] cursor-crosshair"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setHover(Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * 60));
        }}
        onPointerLeave={() => setHover(null)}
      >
        {GUIDES.map((gd) => (
          <div key={gd.v} className="pointer-events-none absolute inset-x-0" style={{ top: `${(Y(gd.v) / VH) * 100}%` }}>
            <div className="border-t border-dashed border-split" />
            <span className="absolute -top-[11px] right-0 text-[9px] leading-none text-tertiary">{gd.label}</span>
          </div>
        ))}

        <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
          <defs>
            <linearGradient id={`rain-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ios-blue)" stopOpacity={0.6} />
              <stop offset="100%" stopColor="var(--ios-blue)" stopOpacity={0.08} />
            </linearGradient>
            <clipPath id={`reveal-${uid}`}>
              <motion.rect
                x="0"
                y="0"
                height={VH}
                initial={{ width: 0 }}
                animate={{ width: VW }}
                transition={{ delay, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </clipPath>
          </defs>
          <g clipPath={`url(#reveal-${uid})`}>
            <path d={area} fill={`url(#rain-${uid})`} />
            <path
              d={line}
              fill="none"
              stroke="var(--ios-blue)"
              strokeWidth={2}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>
          <line x1="0" x2={VW} y1={VH - 0.5} y2={VH - 0.5} stroke="var(--ant-color-split)" vectorEffect="non-scaling-stroke" />
        </svg>

        <span className="pointer-events-none absolute bottom-0 left-0 size-2 -translate-x-1/2 translate-y-1/2">
          <span className="absolute inset-0 animate-ping rounded-full bg-ios-blue opacity-60" />
          <span className="absolute inset-0 rounded-full bg-ios-blue ring-2 ring-[var(--widget-surface)]" />
        </span>

        {hover !== null ? (
          <>
            <span
              className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-[var(--ant-color-text-tertiary)]"
              style={{ left: `${(hover / 60) * 100}%` }}
            />
            <span
              className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ios-blue ring-2 ring-[var(--widget-surface)]"
              style={{ left: `${(hover / 60) * 100}%`, top: `${(Y(data[hover]) / VH) * 100}%` }}
            />
          </>
        ) : null}
      </div>

      <div className="mt-1 flex justify-between text-[10px] text-tertiary tabular">
        {["Now", "10m", "20m", "30m", "40m", "50m", "60m"].map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </Widget>
  );
}
