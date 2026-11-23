import { Checkmark12Filled, DataArea20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { AlarmMark, enterDelay } from "./_parts";

/* Minimum night flow per district metered area. Between 02:00 and 04:00 almost nobody
 * draws water, so the inflow left over after legitimate night use (a per-property
 * allowance plus metered night users) is mostly leakage. N-07's MNF has stepped up
 * 17 % on its 30-night average: a new burst somewhere, flagged priority 3. */
type Dma = { id: string; props: number; mnf: number; legit: number; peak: number; avg30: number };
const DMAS: Dma[] = [
  { id: "N-07", props: 1840, mnf: 6.8, legit: 2.0, peak: 22.4, avg30: 5.8 },
  { id: "N-09", props: 2310, mnf: 4.1, legit: 2.6, peak: 28.1, avg30: 4.0 },
  { id: "S-02", props: 960, mnf: 2.2, legit: 1.3, peak: 11.6, avg30: 2.3 },
];
const SHAPE = [0.42, 0.34, 0.3, 0.29, 0.31, 0.45, 0.78, 1, 0.92, 0.8, 0.72, 0.7, 0.74, 0.7, 0.64, 0.62, 0.66, 0.78, 0.9, 0.86, 0.76, 0.66, 0.56, 0.48, 0.42];
const curve = (d: Dma) => SHAPE.map((s) => d.mnf + ((d.peak - d.mnf) * (s - 0.29)) / 0.71);
const ALARM_AT = 1.12; // MNF more than 12 % over its 30-night mean

const W = 252;
const H = 124;
const TOP = 4;
const BOT = 106;
const xOf = (h: number) => (h / 24) * W;
const W0 = 2;
const W1 = 4;

function smooth(pts: [number, number][]) {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
const hhmm = (h: number) => `${String(Math.floor(h) % 24).padStart(2, "0")}:${String(Math.round((h % 1) * 60) % 60).padStart(2, "0")}`;

/** Water · medium. Last night's inflow to a metered district with the 02–04 minimum-night-flow window and the leakage gap shaded; switch districts, and scrub the trace to read any quarter hour. */
export function NightFlowWidget({ index }: { index?: number }) {
  const [id, setId] = useState(DMAS[0].id);
  const [hover, setHover] = useState<number | null>(null);
  const delay = enterDelay(index);
  const d = DMAS.find((x) => x.id === id) ?? DMAS[0];
  const flows = curve(d);
  const hi = Math.ceil((d.peak * 1.12) / 5) * 5;
  const yOf = (v: number) => BOT - (v / hi) * (BOT - TOP);
  const pts = flows.map((v, h) => [xOf(h), yOf(v)] as [number, number]);
  const line = smooth(pts);
  const area = `${line} L${W} ${BOT} L0 ${BOT}Z`;
  const ratio = d.mnf / d.avg30;
  const alarm = ratio > ALARM_AT;
  const leak = d.mnf - d.legit;

  const at = (h: number) => {
    const i = Math.min(23, Math.floor(h));
    return flows[i] + (flows[i + 1] - flows[i]) * (h - i);
  };
  const shown = hover === null ? d.mnf : at(hover);

  return (
    <Widget size="medium" index={index} label="District minimum night flow">
      <WidgetHeader
        icon={<DataArea20Filled />}
        tint="var(--ios-blue)"
        title="Night Flow"
        subtitle={`DMA ${d.id} · ${d.props.toLocaleString("en-US")} props`}
        extra={
          <Segmented
            size="small"
            value={id}
            onChange={(v) => {
              setId(v as string);
              setHover(null);
            }}
            options={DMAS.map((x) => x.id)}
          />
        }
      />

      <div className="mt-2 flex min-h-0 flex-1 gap-3">
        <div className="flex w-[112px] shrink-0 flex-col whitespace-nowrap">
          <div className="text-[11px] leading-none text-tertiary tabular">
            {hover === null ? "MNF · 02–04" : `Flow · ${hhmm(hover)}`}
          </div>
          <div className="mt-1.5 leading-none">
            <AnimatedNumber
              value={shown}
              format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
              className="text-[30px] font-semibold tracking-tight text-heading"
            />
            <span className="ml-1 text-[12px] font-medium text-tertiary">L/s</span>
          </div>
          <div className="mt-1.5 text-[11px] leading-none text-tertiary">
            Leak ≈{" "}
            <AnimatedNumber
              value={leak}
              format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
              className="font-semibold text-secondary"
            />{" "}
            L/s
          </div>
          <div className="mt-1 text-[11px] leading-none text-tertiary">
            Night use{" "}
            <AnimatedNumber
              value={d.legit}
              format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
              className="font-semibold text-secondary"
            />
          </div>

          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={d.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className={cn(
                "mt-auto inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                alarm ? "bg-ios-yellow/20 text-heading" : "bg-fill-tertiary text-secondary",
              )}
            >
              {alarm ? <AlarmMark priority={3} size={12} /> : <Checkmark12Filled />}
              {ratio >= 1 ? "+" : "−"}
              {Math.abs(Math.round((ratio - 1) * 100))}% vs 30 d
            </motion.span>
          </AnimatePresence>
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-full min-w-0 flex-1 cursor-crosshair touch-none overflow-visible"
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const h = Math.min(24, Math.max(0, ((e.clientX - r.left) / r.width) * 24));
            setHover(Math.round(h * 4) / 4);
          }}
          onPointerLeave={() => setHover(null)}
          aria-label="Inflow over the last 24 hours"
        >
          <rect x={xOf(W0)} y={TOP} width={xOf(W1) - xOf(W0)} height={BOT - TOP} className="fill-fill-quaternary" />
          <motion.rect
            x={xOf(W0)}
            width={xOf(W1) - xOf(W0)}
            fill={alarm ? "var(--ios-yellow)" : "var(--ant-color-fill-secondary)"}
            initial={{ y: yOf(d.legit), height: 0, opacity: 0 }}
            animate={{ y: yOf(d.mnf), height: yOf(d.legit) - yOf(d.mnf), opacity: alarm ? 0.45 : 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 20, delay: delay + 0.5 }}
          />
          <motion.line
            x1={xOf(W0) - 8}
            x2={xOf(W1) + 8}
            strokeWidth="1.2"
            strokeDasharray="3 2"
            className="stroke-secondary"
            initial={{ y1: yOf(d.legit), y2: yOf(d.legit) }}
            animate={{ y1: yOf(d.legit), y2: yOf(d.legit) }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
          <motion.path
            d={area}
            initial={{ d: area, opacity: 0 }}
            animate={{ d: area, opacity: 1 }}
            transition={{ type: "spring", stiffness: 90, damping: 18, opacity: { duration: 0.6, delay } }}
            className="fill-fill-tertiary"
          />
          <motion.path
            d={line}
            fill="none"
            strokeWidth="1.6"
            strokeLinejoin="round"
            className="stroke-heading"
            initial={{ d: line, pathLength: 0 }}
            animate={{ d: line, pathLength: 1 }}
            transition={{ type: "spring", stiffness: 90, damping: 18, pathLength: { duration: 1.1, ease: "easeOut", delay } }}
          />
          <line x1="0" x2={W} y1={BOT} y2={BOT} strokeWidth="1" className="stroke-split" />
          {[0, 6, 12, 18, 24].map((h) => (
            <text
              key={h}
              x={xOf(h)}
              y={H - 2}
              fontSize="10"
              textAnchor={h === 0 ? "start" : h === 24 ? "end" : "middle"}
              className="fill-tertiary tabular"
            >
              {String(h).padStart(2, "0")}
            </text>
          ))}
          {hover !== null ? (
            <g pointerEvents="none">
              <line x1={xOf(hover)} x2={xOf(hover)} y1={TOP} y2={BOT} strokeWidth="1" className="stroke-tertiary" />
              <circle cx={xOf(hover)} cy={yOf(at(hover))} r="3.5" strokeWidth="2" className="fill-heading stroke-[var(--widget-surface)]" />
            </g>
          ) : null}
        </svg>
      </div>
    </Widget>
  );
}
