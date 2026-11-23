import { Filter20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/* Individual filter effluent, 24 h at 30-minute samples. Target ≤0.15 NTU, the
 * combined-effluent limit is 0.3 NTU. The bump after 05:00 is filter ripening after
 * the 05:00 backwash, run to waste and well under the limit. */
const LIMIT = 0.3;
const Y_MAX = 0.36;
const W = 145;
const H = 46;
const BW = 28; // 05:00 backwash sample index
const RIPEN: Record<number, number> = { 28: 0.21, 29: 0.15, 30: 0.11, 31: 0.09 };

const SEED = Array.from({ length: 48 }, (_, i) => {
  const base = i < BW ? 0.061 + i * 0.0012 : 0.058 + (i - BW) * 0.0005;
  return Math.round((RIPEN[i] ?? base + Math.sin(i * 1.9) * 0.006) * 1000) / 1000;
});
const timeOf = (i: number) => {
  const m = (14 * 60 + 30 - (47 - i) * 30 + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
const yOf = (v: number) => H - (Math.min(v, Y_MAX) / Y_MAX) * (H - 2) - 1;
const xOf = (i: number, n: number) => (i / (n - 1)) * W;

/** Water · small. A 24 h effluent-turbidity trace under its 0.3 NTU limit; scrub to read any half-hour. */
export function FilterTurbidityWidget({ index }: { index?: number }) {
  const [data, setData] = useState(SEED);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => {
      setData((d) => [...d.slice(0, -1), Math.round((0.064 + Math.random() * 0.014) * 1000) / 1000]);
    }, 3000);
    return () => window.clearInterval(t);
  }, []);

  const path = useMemo(
    () => data.map((v, i) => `${i ? "L" : "M"}${xOf(i, data.length).toFixed(1)} ${yOf(v).toFixed(1)}`).join(" "),
    [data],
  );
  const p95 = useMemo(() => [...data].sort((a, b) => a - b)[Math.floor(data.length * 0.95) - 1], [data]);

  const i = hover ?? data.length - 1;
  const v = data[i];
  const over = v > LIMIT;
  const delay = 0.3 + (index ?? 0) * 0.06;

  return (
    <Widget size="small" index={index} label="Filter effluent turbidity">
      <WidgetHeader icon={<Filter20Filled />} tint="var(--ios-teal)" title="Filter 4" subtitle="Effluent · run 9.5 h" />

      <div className="mt-2 leading-none whitespace-nowrap">
        <AnimatedNumber
          value={v}
          format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
          className={cn("text-[26px] font-semibold tracking-tight", over ? "text-ios-orange" : "text-heading")}
        />
        <span className="ml-1 text-[12px] font-medium text-tertiary">NTU</span>
      </div>
      <div className="mt-1 flex justify-between text-[11px] leading-none whitespace-nowrap text-tertiary tabular">
        <span>{hover === null ? "Now" : timeOf(i)}</span>
        <span>
          P95 <span className="font-semibold text-secondary">{p95.toFixed(2)}</span>
        </span>
      </div>

      <div
        className="relative mt-auto h-[46px] cursor-crosshair touch-none"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const t = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
          setHover(Math.round(t * (data.length - 1)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
          <rect x="0" y={yOf(LIMIT)} width={W} height={H - yOf(LIMIT)} className="fill-fill-quaternary" />
          <line
            x1="0"
            x2={W}
            y1={yOf(LIMIT)}
            y2={yOf(LIMIT)}
            strokeDasharray="3 3"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            className="stroke-tertiary"
          />
          <line
            x1={xOf(BW, data.length)}
            x2={xOf(BW, data.length)}
            y1="0"
            y2={H}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            className="stroke-fill"
          />
          <motion.path
            d={path}
            fill="none"
            strokeWidth="1.75"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="stroke-heading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
          />
          {hover !== null ? (
            <line
              x1={xOf(i, data.length)}
              x2={xOf(i, data.length)}
              y1="0"
              y2={H}
              strokeDasharray="2 2"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              className="stroke-tertiary"
            />
          ) : null}
        </svg>
        <span
          className="pointer-events-none absolute right-0 pt-0.5 text-[9px] leading-none text-tertiary tabular"
          style={{ top: `${(yOf(LIMIT) / H) * 100}%` }}
        >
          0.3 limit
        </span>
        <span
          className="pointer-events-none absolute bottom-0 -translate-x-1/2 translate-y-full pt-0.5 text-[9px] leading-none text-tertiary"
          style={{ left: `${(xOf(BW, data.length) / W) * 100}%` }}
        >
          BW
        </span>
        <motion.span
          className={cn(
            "pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--widget-surface)]",
            over ? "bg-ios-orange" : "bg-heading",
          )}
          animate={{ left: `${(xOf(i, data.length) / W) * 100}%`, top: `${(yOf(v) / H) * 100}%` }}
          transition={{ type: "spring", stiffness: 500, damping: 36 }}
        />
      </div>
      <div className="h-2.5" />
    </Widget>
  );
}
