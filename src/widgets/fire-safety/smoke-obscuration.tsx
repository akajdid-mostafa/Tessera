import { DataArea20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const PRE = 1.5;
const ALARM = 2.5;
const MAX = 3;
const N = 49;
/** Half-hour samples from 14:30 yesterday to 14:30 today. */
const timeOf = (i: number) => {
  const m = (14 * 60 + 30 + i * 30) % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
/** Steam from the kitchenette kettle at 08:00–09:00 today. */
const SPIKE: Record<number, number> = { 35: 0.92, 36: 1.71, 37: 1.38, 38: 0.74 };

const SEED = Array.from({ length: N }, (_, i) => {
  const base = 0.34 + i * 0.0018 + Math.sin(i * 0.7) * 0.03 + Math.sin(i * 2.3) * 0.015;
  return Math.round((SPIKE[i] ?? base) * 100) / 100;
});

const W = 164;
const H = 58;
const y = (v: number) => H - (v / MAX) * H;
const x = (i: number) => (i / (N - 1)) * W;
const TWO = { minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

/** Fire safety · small. Twenty-four hours of a photoelectric detector's obscuration against pre-alarm and alarm lines: the line draws in, the morning steam spike crosses pre-alarm in amber, the live reading ticks, and scrubbing reads any half hour. */
export function SmokeObscurationWidget({ index }: { index?: number }) {
  const [data, setData] = useState(SEED);
  const [hover, setHover] = useState<number | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const id = window.setInterval(() => {
      setData((d) => [...d.slice(0, -1), Math.round((0.42 + (Math.random() - 0.5) * 0.05) * 100) / 100]);
    }, 2000);
    return () => window.clearInterval(id);
  }, []);

  const i = hover ?? N - 1;
  const v = data[i];
  const level = v >= ALARM ? "alarm" : v >= PRE ? "pre" : "ok";
  const path = data.map((d, k) => `${k ? "L" : "M"}${x(k).toFixed(1)} ${y(d).toFixed(1)}`).join(" ");
  const peak = 36;

  return (
    <Widget size="small" index={index} label="Detector obscuration">
      <WidgetHeader icon={<DataArea20Filled />} tint="var(--ios-purple)" title="Detector L1-D042" subtitle="Photo · 5F Kitchen hall" />

      <div className="mt-2 flex items-baseline justify-between gap-1 whitespace-nowrap leading-none">
        <span className={cn("flex items-baseline transition-colors duration-300", level === "pre" ? "text-ios-orange" : level === "alarm" ? "text-ios-red" : "text-heading")}>
          <AnimatedNumber value={v} format={TWO} className="text-[26px] font-semibold tracking-tight" />
          <span className="ml-0.5 text-[11px] font-medium text-tertiary">%/ft</span>
        </span>
        <span className="text-[11px] text-tertiary tabular">{hover === null ? "now" : timeOf(i)}</span>
      </div>
      <div className="mt-1 h-[13px] overflow-hidden text-[10px] text-tertiary">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={level === "pre" ? "pre" : hover === null ? "now" : "h"}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            className={cn("truncate", level === "pre" && "font-medium text-ios-orange")}
          >
            {level === "pre" ? "Pre-alarm · kettle steam" : "Drift comp. 74% · clean at 80%"}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative mt-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-[58px] w-full cursor-crosshair overflow-visible"
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setHover(Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * (N - 1)));
          }}
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label="24 hour obscuration trend"
        >
          <rect x="0" y="0" width={W} height={y(ALARM)} rx="3" style={{ fill: "var(--ios-red)", fillOpacity: 0.07 }} />
          <line x1="0" x2={W} y1={y(ALARM)} y2={y(ALARM)} strokeDasharray="3 3" style={{ stroke: "var(--ios-red)", strokeOpacity: 0.7 }} />
          <line x1="0" x2={W} y1={y(PRE)} y2={y(PRE)} strokeDasharray="3 3" style={{ stroke: "var(--ios-orange)", strokeOpacity: 0.7 }} />
          {/* Below its line: above it, the label rose into the status line over the chart. */}
          <text x="2" y={y(ALARM) + 10} fontSize="9" fontWeight="600" style={{ fill: "var(--ios-red)" }}>
            Alarm {ALARM}
          </text>
          <text x="2" y={y(PRE) + 10} fontSize="9" fontWeight="600" style={{ fill: "var(--ant-color-text-tertiary)" }}>
            Pre {PRE}
          </text>
          <motion.path
            d={path}
            fill="none"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            style={{ stroke: "var(--ios-purple)" }}
          />
          {/* The spike above pre-alarm, picked out in amber. */}
          <motion.circle
            cx={x(peak)}
            cy={y(data[peak])}
            r="3"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.9, type: "spring", stiffness: 400, damping: 18 }}
            style={{ fill: "var(--ios-orange)", stroke: "var(--widget-surface)", strokeWidth: 1.5 }}
          />
          {hover !== null ? (
            <g pointerEvents="none">
              <line x1={x(i)} x2={x(i)} y1="0" y2={H} strokeDasharray="2 2" style={{ stroke: "var(--ant-color-text-tertiary)" }} />
              <circle cx={x(i)} cy={y(v)} r="3.5" style={{ fill: "var(--ios-purple)", stroke: "var(--widget-surface)", strokeWidth: 2 }} />
            </g>
          ) : (
            <g pointerEvents="none">
              <motion.circle
                cx={x(N - 1)}
                cy={y(v)}
                r="6"
                style={{ fill: "var(--ios-purple)" }}
                animate={{ opacity: [0.35, 0, 0.35], scale: [0.6, 1.4, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <circle cx={x(N - 1)} cy={y(v)} r="2.5" style={{ fill: "var(--ios-purple)" }} />
            </g>
          )}
        </svg>
      </div>
      <div className="relative mt-1 h-[11px] text-[9px] leading-none text-tertiary tabular">
        <span className="absolute left-0">14:30</span>
        <span className="absolute -translate-x-1/2" style={{ left: `${(19 / (N - 1)) * 100}%` }}>
          00:00
        </span>
        <span className="absolute -translate-x-1/2" style={{ left: `${(35 / (N - 1)) * 100}%` }}>
          08:00
        </span>
        <span className="absolute right-0">now</span>
      </div>
    </Widget>
  );
}
