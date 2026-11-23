import { DataTrending20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useId, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";

/** Cumulative closed-won by week of Q4, in $K. Week 6 is this week. */
const CLOSED = [0, 34, 71, 118, 176, 241, 318];
const NOW = CLOSED.length - 1;
const WEEKS = 13;
const QUOTA = 700;
const COMMIT_END = 642;
const BEST_END = 781;
const COMMIT = Array.from({ length: WEEKS + 1 }, (_, i) =>
  i <= NOW ? CLOSED[i] : Math.round(318 + (COMMIT_END - 318) * ((i - NOW) / (WEEKS - NOW)) ** 1.15),
);
const BEST = Array.from({ length: WEEKS + 1 }, (_, i) =>
  i <= NOW ? CLOSED[i] : Math.round(318 + (BEST_END - 318) * ((i - NOW) / (WEEKS - NOW)) ** 1.1),
);

const W = 376;
const H = 84;
const TOP = 4;
const PLOT = 68;
const MAX = 820;
const x = (i: number) => 3 + (i / WEEKS) * (W - 6);
const y = (v: number) => TOP + PLOT * (1 - v / MAX);
const line = (vals: number[], from = 0) =>
  vals
    .slice(from)
    .map((v, i) => `${i === 0 ? "M" : "L"}${x(i + from).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(" ");

const CLOSED_LINE = line(CLOSED);
const CLOSED_AREA = `${CLOSED_LINE} L${x(NOW)} ${y(0)} L${x(0)} ${y(0)} Z`;
const BAND =
  line(BEST, NOW) +
  " " +
  COMMIT.slice(NOW)
    .map((v, i) => `L${x(WEEKS - i).toFixed(1)} ${y(COMMIT[WEEKS - i]).toFixed(1)}`)
    .join(" ") +
  " Z";

const weekDate = (i: number) =>
  new Date(2026, 9, 1 + i * 7).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const K = { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 0 } as const;

/** Sales · medium. Closed-won line meets a commit/best-case band against quota; scrub any week. */
export function ForecastWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [hover, setHover] = useState<number | null>(null);
  const uid = useId().replace(/:/g, "");

  const past = hover !== null && hover <= NOW;
  const value = (hover === null ? COMMIT_END : past ? CLOSED[hover] : COMMIT[hover]) * 1000;
  const label =
    hover === null ? "Commit · end of Q4" : past ? `Closed · wk ${hover}, ${weekDate(hover)}` : `Commit · wk ${hover}, ${weekDate(hover)}`;
  const gap = COMMIT_END - QUOTA;

  return (
    <Widget size="medium" index={index} label="Quarter forecast versus commit">
      <WidgetHeader
        icon={<DataTrending20Filled />}
        tint="var(--ios-blue)"
        title="Q4 Forecast"
        subtitle="Team West · week 6 of 13"
      />

      <div className="mt-2 flex items-baseline-last gap-2.5 whitespace-nowrap">
        <AnimatedNumber value={value} format={K} className="text-[26px] leading-none font-semibold tracking-tight text-heading" />
        <div className="min-w-0 pb-px text-[11px] leading-tight">
          <div className="truncate text-tertiary tabular">{label}</div>
          {hover === null ? (
            <span className="font-semibold text-ios-orange tabular">−${Math.abs(gap)}K to quota</span>
          ) : past ? (
            <span className="font-medium text-secondary tabular">{Math.round((CLOSED[hover] / QUOTA) * 100)}% of quota</span>
          ) : (
            <span className="font-medium text-secondary tabular">Best case ${BEST[hover]}K</span>
          )}
        </div>
        <div className="ml-auto shrink-0 pb-px text-right text-[10px] leading-[14px] text-tertiary tabular">
          <div className="flex items-center justify-end gap-1.5">
            <span className="h-2 w-3 rounded-[2px] bg-ios-blue/25" /> Best case ${BEST_END}K
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <span className="w-3 border-t border-dashed border-tertiary" /> Quota ${QUOTA}K
          </div>
        </div>
      </div>

      <div
        className="mt-auto -mb-1 cursor-crosshair touch-none"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const t = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
          setHover(Math.round(t * WEEKS));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="block overflow-visible" aria-hidden>
          <defs>
            <linearGradient id={`fc-area-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ios-blue)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--ios-blue)" stopOpacity={0} />
            </linearGradient>
            <clipPath id={`fc-reveal-${uid}`}>
              <motion.rect
                x={0}
                y={0}
                height={H}
                initial={{ width: x(NOW) }}
                animate={{ width: W }}
                transition={{ duration: 0.9, delay: delay + 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </clipPath>
          </defs>

          {/* Month ticks */}
          {[
            { i: 0, t: "Oct" },
            { i: 4.4, t: "Nov" },
            { i: 8.7, t: "Dec" },
          ].map((m) => (
            <text key={m.t} x={x(m.i) + 2} y={H - 1} fontSize={10} fill="var(--ant-color-text-tertiary)">
              {m.t}
            </text>
          ))}
          <line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke="var(--ant-color-split)" />

          {/* Quota */}
          <line
            x1={0}
            x2={W}
            y1={y(QUOTA)}
            y2={y(QUOTA)}
            stroke="var(--ant-color-text-tertiary)"
            strokeDasharray="3 3"
          />
          <text x={4} y={y(QUOTA) - 3} fontSize={10} fill="var(--ant-color-text-tertiary)">
            Quota
          </text>

          {/* Closed so far */}
          <motion.path
            d={CLOSED_AREA}
            fill={`url(#fc-area-${uid})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: delay + 0.4 }}
          />
          <motion.path
            d={CLOSED_LINE}
            fill="none"
            stroke="var(--ios-blue)"
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Forecast band, revealed after the line lands */}
          <g clipPath={`url(#fc-reveal-${uid})`}>
            <path d={BAND} fill="var(--ios-blue)" fillOpacity={0.16} />
            <path d={line(BEST, NOW)} fill="none" stroke="var(--ios-blue)" strokeOpacity={0.4} strokeWidth={1} />
            <path
              d={line(COMMIT, NOW)}
              fill="none"
              stroke="var(--ios-blue)"
              strokeWidth={2}
              strokeDasharray="4 3"
              strokeLinecap="round"
            />
          </g>

          {/* Today */}
          <line
            x1={x(NOW)}
            x2={x(NOW)}
            y1={y(CLOSED[NOW]) + 4}
            y2={y(0)}
            stroke="var(--ios-blue)"
            strokeOpacity={0.5}
            strokeDasharray="1 2"
          />
          <motion.circle
            cx={x(NOW)}
            cy={y(CLOSED[NOW])}
            r={4}
            fill="var(--ios-blue)"
            stroke="var(--widget-surface)"
            strokeWidth={2}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 18, delay: delay + 0.85 }}
          />

          {/* Scrub */}
          {hover !== null ? (
            <g>
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={TOP}
                y2={y(0)}
                stroke="var(--ant-color-text-tertiary)"
                strokeDasharray="3 3"
              />
              {hover > NOW ? (
                <circle cx={x(hover)} cy={y(BEST[hover])} r={3} fill="var(--widget-surface)" stroke="var(--ios-blue)" strokeWidth={1.5} />
              ) : null}
              <circle
                cx={x(hover)}
                cy={y(COMMIT[hover])}
                r={4}
                fill="var(--ios-blue)"
                stroke="var(--widget-surface)"
                strokeWidth={2}
              />
            </g>
          ) : null}
        </svg>
      </div>
    </Widget>
  );
}
