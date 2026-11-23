import { Flash20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const LIMIT = 1000;
const WARN = 900;
const N = 24;
const W = 145;
const H = 56;
const Y_MIN = 600;
const Y_MAX = 1060;
const STEP_MIN = 5;
const SEED = [742, 751, 748, 763, 770, 768, 781, 790, 786, 801, 812, 808, 815, 829, 834, 826, 838, 851, 846, 858, 864, 852, 861, 874];

const x = (i: number) => (i / (N - 1)) * W;
const y = (v: number) => H - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * H;
const pct = (v: number) => `${(y(v) / H) * 100}%`;

function clock(minutes: number) {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Building · small. Main-meter demand against a 1,000 kW peak limit: a new reading lands every few seconds and scrubbing the curve reads any five-minute interval. */
export function DemandWidget({ index }: { index?: number }) {
  const [series, setSeries] = useState(SEED);
  const [end, setEnd] = useState(14 * 60 + 35);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => {
      setSeries((s) => {
        const last = s[s.length - 1];
        // Drifts up into the warning band, then the load-shed sequence pulls it back.
        const bias = last > 940 ? -38 : 6;
        const next = Math.round(Math.min(985, Math.max(720, last + bias + (Math.random() - 0.4) * 26)));
        return [...s.slice(1), next];
      });
      setEnd((e) => e + STEP_MIN);
    }, 2600);
    return () => window.clearInterval(t);
  }, []);

  const i = hover ?? N - 1;
  const value = series[i];
  const live = series[N - 1];
  const high = value >= WARN;
  const liveHigh = live >= WARN;
  const line = series.map((v, k) => `${k ? "L" : "M"}${x(k).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  const delay = 0.3 + (index ?? 0) * 0.06;
  const fillId = `bd-fill-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <Widget size="small" index={index} label="Building demand">
      <WidgetHeader icon={<Flash20Filled />} tint="var(--ios-teal)" title="Demand" subtitle="Main meter · HQ" />

      <div className="mt-2 leading-none">
        <span className={cn("text-[26px] font-semibold tracking-tight transition-colors duration-500", high ? "text-ios-orange" : "text-heading")}>
          <AnimatedNumber value={value} format={{ maximumFractionDigits: 0 }} />
        </span>
        <span className="ml-0.5 text-[12px] font-medium text-tertiary">kW</span>
        <div className="mt-1 truncate text-[11px] text-tertiary tabular">
          {hover !== null ? (
            <span className="text-secondary">{clock(end - (N - 1 - hover) * STEP_MIN)}</span>
          ) : (
            "Now"
          )}{" "}
          ·{" "}
          <AnimatedNumber
            value={value / LIMIT}
            format={{ style: "percent", maximumFractionDigits: 0 }}
            className={cn("font-semibold", high ? "text-ios-orange" : "text-secondary")}
          />{" "}
          of limit
        </div>
      </div>

      <div
        className="relative -mx-1 mt-auto h-[50px] cursor-crosshair touch-none"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const t = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
          setHover(Math.round(t * (N - 1)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ios-teal)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--ios-teal)" stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* Warning band 900–1,000 kW and the contracted limit. */}
          <rect x="0" y={y(LIMIT)} width={W} height={y(WARN) - y(LIMIT)} style={{ fill: "var(--ios-orange)", fillOpacity: 0.12 }} />
          <motion.line
            x1="0"
            x2={W}
            y1={y(LIMIT)}
            y2={y(LIMIT)}
            strokeWidth="1"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
            style={{ stroke: "var(--ios-red)" }}
            animate={liveHigh ? { opacity: [0.9, 0.25, 0.9] } : { opacity: 0.55 }}
            transition={liveHigh ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.4 }}
          />
          <motion.path
            d={area}
            fill={`url(#${fillId})`}
            initial={{ d: area, opacity: 0 }}
            animate={{ opacity: 1, d: area }}
            transition={{ opacity: { delay: delay + 0.6, duration: 0.6 }, d: { duration: 0.6, ease: "easeOut" } }}
          />
          <motion.path
            d={line}
            fill="none"
            strokeWidth="1.75"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ stroke: "var(--ios-teal)" }}
            initial={{ d: line, opacity: 0 }}
            animate={{ opacity: 1, d: line }}
            transition={{ opacity: { delay, duration: 1.1, ease: [0.22, 1, 0.36, 1] }, d: { duration: 0.6, ease: "easeOut" } }}
          />
          {hover !== null ? (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1="0"
              y2={H}
              strokeWidth="1"
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
              style={{ stroke: "var(--ant-color-text-tertiary)" }}
            />
          ) : null}
        </svg>
        <span className="pointer-events-none absolute right-0 -translate-y-full pb-px text-[9px] font-medium text-ios-red/80 tabular" style={{ top: pct(LIMIT) }}>
          1,000
        </span>
        {/* The point being read: the live reading, or the scrubbed one. */}
        <motion.span
          className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--widget-surface)]"
          style={{ background: high ? "var(--ios-orange)" : "var(--ios-teal)" }}
          initial={false}
          animate={{ left: `${(i / (N - 1)) * 100}%`, top: pct(value) }}
          transition={{ type: "spring", stiffness: 500, damping: 34 }}
        />
      </div>
    </Widget>
  );
}
