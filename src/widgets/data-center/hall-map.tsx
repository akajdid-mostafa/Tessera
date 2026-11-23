import { Board20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";

type Metric = "Inlet" | "Power" | "Space";
type Rack = { id: string; row: number; col: number; inlet: number; kw: number; space: number; note?: string };

const ROWS = ["A", "B", "C", "D"];
const COLS = 10;

/** Deterministic wobble so every load shows the same hall. */
const noise = (n: number) => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

const SPECIAL: Record<string, Partial<Rack>> = {
  C06: { inlet: 26.1, kw: 18.6, space: 74, note: "GPU pod edge" },
  C07: { inlet: 27.6, kw: 28.4, space: 88, note: "GPU pod · 8 nodes" },
  C08: { inlet: 28.3, kw: 31.2, space: 91, note: "GPU pod · 8 nodes" },
  B03: { inlet: 20.9, kw: 0.4, space: 12, note: "Reserved · install Nov 18" },
  B04: { inlet: 21.6, kw: 3.1, space: 38 },
  D10: { inlet: 21.1, kw: 4.2, space: 52, note: "Meet-me patching" },
};

const BASE: Rack[] = ROWS.flatMap((r, row) =>
  Array.from({ length: COLS }, (_, col) => {
    const id = `${r}${String(col + 1).padStart(2, "0")}`;
    const k = row * COLS + col;
    // Racks in the middle of a row sit furthest from the CRAHs and run a touch warmer.
    const mid = 1 - Math.abs(col - 4.5) / 4.5;
    const rack: Rack = {
      id,
      row,
      col,
      inlet: 20.6 + row * 0.35 + mid * 1.6 + noise(k) * 0.9,
      kw: 5.5 + noise(k + 40) * 5.5,
      space: 46 + noise(k + 80) * 44,
    };
    return { ...rack, ...SPECIAL[id] };
  }),
);

/* Thermal scale stops, °C → iOS color. */
const STOPS: [number, string][] = [
  [18, "var(--ios-blue)"],
  [22, "var(--ios-teal)"],
  [25, "var(--ios-green)"],
  [27, "var(--ios-yellow)"],
  [29, "var(--ios-orange)"],
  [32, "var(--ios-red)"],
];
function thermal(t: number) {
  if (t <= STOPS[0][0]) return STOPS[0][1];
  for (let i = 1; i < STOPS.length; i++) {
    const [b, cb] = STOPS[i];
    const [a, ca] = STOPS[i - 1];
    if (t <= b) {
      const p = Math.round(((t - a) / (b - a)) * 100);
      return `color-mix(in oklab, ${cb} ${p}%, ${ca})`;
    }
  }
  return STOPS[STOPS.length - 1][1];
}

const METRIC: Record<
  Metric,
  {
    unit: string;
    value: (r: Rack) => number;
    fill: (v: number) => string;
    dp: number;
    legend: string;
    marks: { v: number; label: string }[];
    min: number;
    max: number;
    alarm: (v: number) => boolean;
    alarmLabel: string;
  }
> = {
  Inlet: {
    unit: "°C",
    value: (r) => r.inlet,
    fill: thermal,
    dp: 1,
    legend: `linear-gradient(90deg, ${STOPS.map(([t, c]) => `${c} ${((t - 18) / 14) * 100}%`).join(", ")})`,
    marks: [
      { v: 18, label: "18°" },
      { v: 27, label: "27° ASHRAE" },
      { v: 32, label: "32°" },
    ],
    min: 18,
    max: 32,
    alarm: (v) => v > 27,
    alarmLabel: "above 27 °C",
  },
  Power: {
    unit: "kW",
    value: (r) => r.kw,
    fill: (v) => `color-mix(in oklab, var(--ios-indigo) ${Math.round(14 + Math.min(1, v / 35) * 86)}%, transparent)`,
    dp: 1,
    legend: "linear-gradient(90deg, color-mix(in oklab, var(--ios-indigo) 14%, transparent), var(--ios-indigo))",
    marks: [
      { v: 0, label: "0" },
      { v: 12, label: "12 kW budget" },
      { v: 35, label: "35 kW" },
    ],
    min: 0,
    max: 35,
    alarm: (v) => v > 12,
    alarmLabel: "over 12 kW budget",
  },
  Space: {
    unit: "%",
    value: (r) => r.space,
    fill: (v) => `color-mix(in oklab, var(--ios-purple) ${Math.round(12 + (v / 100) * 88)}%, transparent)`,
    dp: 0,
    legend: "linear-gradient(90deg, color-mix(in oklab, var(--ios-purple) 12%, transparent), var(--ios-purple))",
    marks: [
      { v: 0, label: "0%" },
      { v: 85, label: "85% cap" },
      { v: 100, label: "100%" },
    ],
    min: 0,
    max: 100,
    alarm: (v) => v >= 85,
    alarmLabel: "at the 85% cap",
  },
};

/* Floor geometry, px in a 376 × 240 drawing. */
const W = 376;
const H = 240;
const X0 = 32;
const RW = 28;
const GAP = (312 - RW * COLS) / (COLS - 1);
const ROW_Y = [22, 76, 138, 192];
const RH = 30;
const HOT = [
  { y: 52, h: 24 },
  { y: 168, h: 24 },
];
const COLD_Y = [13, 122, 231];
const rx = (col: number) => X0 + col * (RW + GAP);

/** Data center · large. A data hall floor plan, every rack tinted by inlet temperature, power or space; values breathe live, hover reads a rack, and the segmented control re-tints the hall. */
export function HallMapWidget({ index }: { index?: number }) {
  const [metric, setMetric] = useState<Metric>("Inlet");
  const [racks, setRacks] = useState(BASE);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => {
      setRacks(
        BASE.map((r, k) => {
          const w = Math.random() - 0.5;
          // The GPU pod is mid-training: its inlet breathes the most.
          const pod = r.id === "C07" || r.id === "C08";
          return {
            ...r,
            inlet: r.inlet + w * (pod ? 0.9 : 0.4) + Math.sin(Date.now() / 4000 + k) * 0.15,
            kw: Math.max(0, r.kw + w * (pod ? 2.4 : 0.5)),
          };
        }),
      );
    }, 3000);
    return () => window.clearInterval(t);
  }, []);

  const m = METRIC[metric];
  const values = racks.map(m.value);
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const peakI = values.indexOf(Math.max(...values));
  const peak = racks[peakI];
  const flagged = values.filter(m.alarm).length;
  const rack = hover ? racks.find((r) => r.id === hover)! : null;
  const fmt = { minimumFractionDigits: m.dp, maximumFractionDigits: m.dp };
  const delay = 0.3 + (index ?? 0) * 0.06;

  return (
    <Widget size="large" index={index} label="Data hall floor map">
      <WidgetHeader
        icon={<Board20Filled />}
        tint="var(--ios-indigo)"
        title="Data Hall 2"
        subtitle="40 racks · 2 hot aisles"
        extra={<Segmented size="small" value={metric} onChange={(v) => setMetric(v as Metric)} options={["Inlet", "Power", "Space"]} />}
      />

      <div className="relative mt-2 h-[58px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={rack ? "rack" : "hall"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex h-full items-end justify-between gap-3"
          >
            <div className="min-w-0 leading-none">
              <div className="truncate text-[11px] text-tertiary">
                {rack ? (
                  <>
                    <span className="font-semibold text-heading">Rack {rack.id}</span>
                    {rack.note ? ` · ${rack.note}` : ""}
                  </>
                ) : (
                  `Hall average · ${metric.toLowerCase()}`
                )}
              </div>
              <div
                className={cn(
                  "mt-1.5 text-[28px] font-semibold tracking-tight",
                  rack && m.alarm(m.value(rack)) ? "text-ios-orange" : "text-heading",
                )}
              >
                <AnimatedNumber value={rack ? m.value(rack) : avg} format={fmt} />
                <span className="ml-0.5 text-[13px] font-medium text-tertiary">{m.unit}</span>
              </div>
            </div>
            <div className="shrink-0 pb-0.5 text-right text-[11px] leading-[15px] whitespace-nowrap text-tertiary tabular">
              {rack ? (
                <>
                  <div>
                    Inlet <span className="font-semibold text-secondary">{rack.inlet.toFixed(1)} °C</span> · Power{" "}
                    <span className="font-semibold text-secondary">{rack.kw.toFixed(1)} kW</span>
                  </div>
                  <div>
                    Space <span className="font-semibold text-secondary">{Math.round(rack.space)}%</span> · 42U ·
                    feeds A+B
                  </div>
                </>
              ) : (
                <>
                  <div>
                    Peak <span className="font-semibold text-secondary">{peak.id}</span> ·{" "}
                    <span className="font-semibold text-secondary">
                      {m.value(peak).toFixed(m.dp)} {m.unit}
                    </span>
                  </div>
                  <div className={flagged ? "font-semibold text-ios-orange" : undefined}>
                    {flagged ? `${flagged} rack${flagged > 1 ? "s" : ""} ${m.alarmLabel}` : "All racks in range"}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 block h-[240px] w-full" onMouseLeave={() => setHover(null)} aria-label="Data hall floor plan">
        <rect x={0.5} y={0.5} width={W - 1} height={H - 1} rx={10} fill="none" strokeWidth={1} className="stroke-split" />

        {/* Hot aisle containment */}
        {HOT.map((h) => (
          <g key={h.y}>
            <rect x={X0 - 3} y={h.y} width={318} height={h.h} rx={4} className="fill-ios-orange/10" />
            <text x={X0 + 156} y={h.y + h.h / 2 + 3} textAnchor="middle" className="fill-tertiary text-[9px]">
              Hot aisle · contained
            </text>
          </g>
        ))}

        {/* Cold air leaving the CRAHs along each cold aisle */}
        {COLD_Y.map((y) =>
          [
            { d: `M18 ${y} H${X0 + 150}` },
            { d: `M358 ${y} H${X0 + 162}` },
          ].map((a) => (
            <motion.path
              key={a.d}
              d={a.d}
              fill="none"
              strokeWidth={1.2}
              strokeDasharray="2 7"
              strokeLinecap="round"
              className="stroke-ios-teal/50"
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: [0, -18] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
            />
          )),
        )}

        {/* CRAH units on the side walls */}
        {[
          { x: 3, y: 46, label: "CRAH-1" },
          { x: 3, y: 134, label: "CRAH-2" },
          { x: 359, y: 46, label: "CRAH-3" },
          { x: 359, y: 134, label: "CRAH-4" },
        ].map((c) => (
          <g key={c.label}>
            <rect x={c.x} y={c.y} width={14} height={60} rx={4} className="fill-fill-tertiary" />
            <text
              x={c.x + 7}
              y={c.y + 30}
              textAnchor="middle"
              transform={`rotate(-90 ${c.x + 7} ${c.y + 30})`}
              dy={3}
              className="fill-tertiary text-[9px] font-semibold"
            >
              {c.label}
            </text>
          </g>
        ))}

        {ROWS.map((r, i) => (
          <text key={r} x={24} y={ROW_Y[i] + RH / 2 + 3.5} textAnchor="middle" className="fill-tertiary text-[10px] font-semibold">
            {r}
          </text>
        ))}

        {racks.map((r) => {
          const v = m.value(r);
          const on = hover === r.id;
          const alarm = m.alarm(v);
          return (
            <g key={r.id} onMouseEnter={() => setHover(r.id)} className="cursor-default">
              <motion.rect
                x={rx(r.col)}
                y={ROW_Y[r.row]}
                width={RW}
                height={RH}
                rx={4}
                style={{ fill: m.fill(v), transformBox: "fill-box", transformOrigin: "center" }}
                className="transition-[fill] duration-700"
                initial={{ opacity: 0, scaleY: 0.3 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: delay + r.col * 0.035 + r.row * 0.05 }}
              />
              {/* Front door edge, facing the cold aisle */}
              <rect
                x={rx(r.col) + 4}
                y={r.row % 2 === 0 ? ROW_Y[r.row] + 1.5 : ROW_Y[r.row] + RH - 3}
                width={RW - 8}
                height={1.5}
                rx={0.75}
                className="pointer-events-none fill-[var(--widget-surface)]"
                opacity={0.55}
              />
              {alarm ? (
                <motion.rect
                  x={rx(r.col) - 1.5}
                  y={ROW_Y[r.row] - 1.5}
                  width={RW + 3}
                  height={RH + 3}
                  rx={5.5}
                  fill="none"
                  strokeWidth={1.5}
                  className="pointer-events-none stroke-ios-orange"
                  animate={{ opacity: [0.9, 0.25, 0.9] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
              ) : null}
              {on ? (
                <rect
                  x={rx(r.col) - 2}
                  y={ROW_Y[r.row] - 2}
                  width={RW + 4}
                  height={RH + 4}
                  rx={6}
                  fill="none"
                  strokeWidth={2}
                  className="pointer-events-none stroke-heading"
                />
              ) : null}
            </g>
          );
        })}
      </svg>

      <div className="mt-auto">
        <motion.div
          key={metric}
          className="h-1.5 origin-left rounded-full"
          style={{ background: m.legend }}
          initial={{ scaleX: 0.2, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 160, damping: 22 }}
        />
        <div className="relative mt-1 h-[12px] text-[10px] leading-[12px] whitespace-nowrap text-tertiary tabular">
          {m.marks.map((mk, i) => {
            const p = ((mk.v - m.min) / (m.max - m.min)) * 100;
            return (
              <span
                key={mk.label}
                className="absolute"
                style={
                  i === 0
                    ? { left: 0 }
                    : i === m.marks.length - 1
                      ? { right: 0 }
                      : { left: `${p}%`, transform: "translateX(-50%)" }
                }
              >
                {mk.label}
              </span>
            );
          })}
        </div>
      </div>
    </Widget>
  );
}
