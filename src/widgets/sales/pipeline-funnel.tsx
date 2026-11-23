import { Filter20Filled, Warning16Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

const STAGES = ["Leads", "MQL", "SQL", "Opps", "Won"] as const;
/** Stage counts per quarter; Q4 is to date (day 40 of 92). */
const DATA = {
  Q3: [1_080, 380, 171, 82, 27],
  Q4: [1_240, 412, 168, 74, 21],
} as const;
type Quarter = keyof typeof DATA;
/** Team benchmark for each step's conversion. */
const BENCH = [0.32, 0.4, 0.45, 0.32];

const W = 376;
const H = 78;
const BAR = 30;
const MAXH = H;
const MINH = 22;
const cx = (i: number) => BAR / 2 + (i * (W - BAR)) / (STAGES.length - 1);
const barH = (v: number, max: number) => MINH + (MAXH - MINH) * Math.sqrt(v / max);

/** Sales · medium. A five-stage funnel; the weakest step against benchmark is flagged, and Q3/Q4 morphs the bars. */
export function PipelineFunnelWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [q, setQ] = useState<Quarter>("Q4");
  const [hover, setHover] = useState<number | null>(null);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), (delay + 1) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);
  const counts = DATA[q];
  const max = DATA.Q4[0];
  const heights = counts.map((v) => barH(v, max));
  const conv = counts.slice(1).map((v, i) => v / counts[i]);
  const gaps = conv.map((c, i) => c - BENCH[i]);
  const worst = gaps.indexOf(Math.min(...gaps));
  const overall = counts[counts.length - 1] / counts[0];

  return (
    <Widget size="medium" index={index} label="Pipeline funnel">
      <WidgetHeader
        icon={<Filter20Filled />}
        tint="var(--ios-blue)"
        title="Pipeline Funnel"
        subtitle={
          <>
            Lead to won{" "}
            <AnimatedNumber
              value={overall}
              format={{ style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }}
              className="font-semibold text-secondary"
            />
            {q === "Q4" ? " · quarter to date" : " · full quarter"}
          </>
        }
        extra={<Segmented size="small" value={q} onChange={(v) => setQ(v as Quarter)} options={["Q3", "Q4"]} />}
      />

      <div className="relative mt-2.5" style={{ height: H }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full overflow-visible" aria-hidden>
          {/* Connectors between bars, as trapezoids. */}
          {conv.map((_, i) => {
            const x0 = cx(i) + BAR / 2;
            const x1 = cx(i + 1) - BAR / 2;
            const h0 = heights[i];
            const h1 = heights[i + 1];
            const d = `M${x0} ${(H - h0) / 2} L${x1} ${(H - h1) / 2} L${x1} ${(H + h1) / 2} L${x0} ${(H + h0) / 2} Z`;
            const flagged = i === worst && gaps[i] < 0;
            return (
              <motion.path
                key={i}
                d={d}
                initial={{ d, opacity: 0 }}
                animate={{ d, opacity: hover === null || hover === i ? 1 : 0.4 }}
                transition={{ d: { type: "spring", stiffness: 140, damping: 20 }, opacity: { duration: 0.3, delay: entered ? 0 : delay + 0.4 } }}
                fill={flagged ? "var(--ios-orange)" : "var(--ios-blue)"}
                fillOpacity={flagged ? 0.22 : 0.12}
              />
            );
          })}
          {heights.map((h, i) => {
            const won = i === STAGES.length - 1;
            return (
              <motion.rect
                key={STAGES[i]}
                x={cx(i) - BAR / 2}
                width={BAR}
                rx={7}
                fill={won ? "var(--ios-green)" : "var(--ios-blue)"}
                fillOpacity={won ? 1 : 1 - i * 0.15}
                initial={{ attrY: H / 2, height: 0 }}
                animate={{ attrY: (H - h) / 2, height: h }}
                transition={{ type: "spring", stiffness: 160, damping: 18, delay: entered ? i * 0.04 : delay + i * 0.08 }}
              />
            );
          })}
        </svg>

        {/* Conversion chips sit on the connectors. */}
        {conv.map((c, i) => {
          const flagged = i === worst && gaps[i] < 0;
          const mid = (cx(i) + cx(i + 1)) / 2;
          return (
            <Tooltip
              key={i}
              title={`${STAGES[i]} → ${STAGES[i + 1]}: ${Math.round(c * 100)}% · team bench ${Math.round(BENCH[i] * 100)}%`}
            >
              <motion.span
                className={cn(
                  "absolute top-1/2 flex h-[20px] -translate-x-1/2 -translate-y-1/2 cursor-default items-center gap-0.5 rounded-full px-1.5 text-[11px] font-semibold whitespace-nowrap shadow-sm tabular",
                  flagged ? "bg-ios-orange/15 text-ios-orange" : "bg-[var(--widget-surface)] text-heading ring-1 ring-inset ring-widget-ring",
                )}
                style={{ left: `${(mid / W) * 100}%` }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: hover === i ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 20, delay: entered ? 0 : delay + 0.5 + i * 0.08 }}
              >
                {flagged ? <Warning16Filled className="text-[11px]" /> : null}
                <AnimatedNumber value={c} format={{ style: "percent", maximumFractionDigits: 0 }} />
              </motion.span>
            </Tooltip>
          );
        })}
      </div>

      <div className="relative mt-auto h-[30px]">
        {STAGES.map((s, i) => (
          <div
            key={s}
            className={cn(
              "absolute top-0 flex flex-col leading-tight whitespace-nowrap",
              i === 0 ? "items-start" : i === STAGES.length - 1 ? "items-end" : "-translate-x-1/2 items-center",
            )}
            style={
              i === 0
                ? { left: 0 }
                : i === STAGES.length - 1
                  ? { right: 0 }
                  : { left: `${(cx(i) / W) * 100}%` }
            }
          >
            <AnimatedNumber
              value={counts[i]}
              className={cn("text-[13px] font-semibold", i === STAGES.length - 1 ? "text-ios-green" : "text-heading")}
            />
            <span className="text-[11px] text-tertiary">{s}</span>
          </div>
        ))}
      </div>
    </Widget>
  );
}
