import { Drop20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/* A conventional surface-water train drawn as HP-HMI outlines: intake, coagulation
 * and flocculation, settling, filters, chlorine contact, clearwell. Flow runs through
 * the pipe at a speed set by plant throughput; filter 6 is mid-backwash. */
type Kpi = { label: string; value: number; digits?: number; unit: string; text?: string };
type Stage = { id: string; name: string; x: number; kpis: (live: Live) => Kpi[] };
type Live = { flow: number; raw: number; cl: number; level: number };

const STAGES: Stage[] = [
  {
    id: "intake",
    name: "Intake",
    x: 25,
    kpis: (l) => [
      { label: "Raw flow", value: l.flow, unit: "MLD" },
      { label: "Raw turbidity", value: l.raw, digits: 1, unit: "NTU" },
      { label: "Temperature", value: 12.4, digits: 1, unit: "°C" },
    ],
  },
  {
    id: "coag",
    name: "Coag",
    x: 75,
    kpis: () => [
      { label: "Alum dose", value: 28, unit: "mg/L" },
      { label: "Mixed pH", value: 6.9, digits: 1, unit: "" },
      { label: "Flocculators", value: 3, unit: "/ 3" },
    ],
  },
  {
    id: "settle",
    name: "Settle",
    x: 125,
    kpis: () => [
      { label: "Settled", value: 0.92, digits: 2, unit: "NTU" },
      { label: "Sludge blanket", value: 0.6, digits: 1, unit: "m" },
      { label: "Basins", value: 4, unit: "/ 4" },
    ],
  },
  {
    id: "filter",
    name: "Filters",
    x: 175,
    kpis: () => [
      { label: "In service", value: 7, unit: "/ 8" },
      { label: "F6 backwash", value: 0, unit: "", text: "High-rate" },
      { label: "Avg headloss", value: 1.4, digits: 1, unit: "m" },
    ],
  },
  {
    id: "contact",
    name: "Contact",
    x: 225,
    kpis: (l) => [
      { label: "Free Cl₂", value: l.cl, digits: 2, unit: "mg/L" },
      { label: "CT achieved", value: 142, unit: "%" },
      { label: "NaOCl dose", value: 2.1, digits: 1, unit: "mg/L" },
    ],
  },
  {
    id: "clearwell",
    name: "Clearwell",
    x: 275,
    kpis: (l) => [
      { label: "Level", value: l.level, digits: 2, unit: "m" },
      { label: "Storage", value: Math.round((l.level / 6.2) * 100), unit: "%" },
      { label: "To network", value: l.flow - 5, unit: "MLD" },
    ],
  },
];

const PIPE_Y = 40;
const BOX_T = 14;
const BOX_B = 46;

function StageShape({ id, x, reduce }: { id: string; x: number; reduce: boolean | null }): ReactNode {
  const l = x - 18;
  const r = x + 18;
  const outline = "fill-[var(--widget-surface)] stroke-tertiary";
  switch (id) {
    case "intake":
      return (
        <g>
          {[22, 30].map((y) => (
            <motion.path
              key={y}
              d={`M${l} ${y} q4.5 -3 9 0 t9 0 t9 0 t9 0`}
              fill="none"
              strokeWidth="1.4"
              strokeLinecap="round"
              className="stroke-tertiary"
              animate={reduce ? undefined : { x: [0, -4.5, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: y === 30 ? 0.6 : 0 }}
            />
          ))}
          {[x - 6, x, x + 6].map((bx) => (
            <line key={bx} x1={bx} x2={bx} y1="34" y2={BOX_B} strokeWidth="1.4" className="stroke-tertiary" />
          ))}
        </g>
      );
    case "coag":
      return (
        <g>
          <rect x={l} y={BOX_T + 4} width="36" height={BOX_B - BOX_T - 4} rx="3" strokeWidth="1.4" className={outline} />
          <line x1={x} x2={x} y1={BOX_T - 2} y2="36" strokeWidth="1.4" className="stroke-tertiary" />
          <motion.rect
            x={x - 7}
            y="35"
            width="14"
            height="2.5"
            rx="1.25"
            className="fill-tertiary"
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            animate={reduce ? undefined : { scaleX: [1, 0.12, 1] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
          />
        </g>
      );
    case "settle":
      return (
        <g>
          <path d={`M${l} ${BOX_T + 4} H${r} V36 L${x + 6} ${BOX_B} H${x - 6} L${l} 36 Z`} strokeWidth="1.4" className={outline} />
          {[-10, -3, 4, 11].map((dx) => (
            <line key={dx} x1={x + dx - 3} x2={x + dx + 3} y1="31" y2="24" strokeWidth="1.1" className="stroke-quaternary" />
          ))}
          <path d={`M${x - 6} ${BOX_B - 1} H${x + 6} L${x + 9} 42 H${x - 9} Z`} className="fill-quaternary" />
        </g>
      );
    case "filter":
      return (
        <g>
          <rect x={l} y={BOX_T + 4} width="36" height={BOX_B - BOX_T - 4} rx="3" strokeWidth="1.4" className={outline} />
          <line x1={x} x2={x} y1={BOX_T + 4} y2={BOX_B} strokeWidth="1.1" className="stroke-quaternary" />
          {[34, 39].map((y) => (
            <line key={y} x1={l + 2} x2={r - 2} y1={y} y2={y} strokeWidth="1.1" strokeDasharray="2 1.5" className="stroke-quaternary" />
          ))}
          {/* F6 (right cell) backwash: air scour bubbles rising through the media */}
          {[0, 1, 2, 3].map((b) => (
            <motion.circle
              key={b}
              cx={x + 4 + b * 3.5}
              r="1.3"
              className="fill-none stroke-secondary"
              strokeWidth="0.8"
              initial={{ cy: 43, opacity: 0 }}
              animate={reduce ? { cy: 30, opacity: 0.6 } : { cy: [43, 21], opacity: [0, 1, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: b * 0.4, ease: "easeOut" }}
            />
          ))}
        </g>
      );
    case "contact":
      return (
        <g>
          <rect x={l} y={BOX_T + 4} width="36" height={BOX_B - BOX_T - 4} rx="3" strokeWidth="1.4" className={outline} />
          {[-9, 0, 9].map((dx, k) => (
            <line
              key={dx}
              x1={x + dx}
              x2={x + dx}
              y1={k % 2 ? BOX_T + 4 : BOX_T + 10}
              y2={k % 2 ? BOX_B - 6 : BOX_B}
              strokeWidth="1.4"
              className="stroke-quaternary"
            />
          ))}
        </g>
      );
    default:
      return null;
  }
}

/** Water · medium. A treatment train with flow running between stages; tap a stage to read its live KPIs. */
export function TreatmentTrainWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [sel, setSel] = useState(3);
  const [live, setLive] = useState<Live>({ flow: 186, raw: 4.8, cl: 1.12, level: 4.21 });

  useEffect(() => {
    const t = window.setInterval(() => {
      setLive((l) => ({
        flow: Math.round(186 + (Math.random() - 0.5) * 4),
        raw: Math.round((l.raw + (4.8 - l.raw) * 0.3 + (Math.random() - 0.5) * 0.4) * 10) / 10,
        cl: Math.round((1.12 + (Math.random() - 0.5) * 0.04) * 100) / 100,
        level: Math.round((l.level + (Math.random() - 0.45) * 0.02) * 100) / 100,
      }));
    }, 2600);
    return () => window.clearInterval(t);
  }, []);

  const stage = STAGES[sel];
  const levelY = BOX_B - ((BOX_B - BOX_T - 2) * live.level) / 6.2;
  const flowDur = 120 / live.flow;

  return (
    <Widget size="medium" index={index} label="Water treatment process train">
      <WidgetHeader
        icon={<Drop20Filled />}
        tint="var(--ios-blue)"
        title="Riverside WTP"
        subtitle="Process train · 6 stages"
        extra={
          <div className="text-right leading-tight whitespace-nowrap">
            <div className="text-[11px] text-tertiary">Plant flow</div>
            <div className="text-[15px] font-semibold text-heading">
              <AnimatedNumber value={live.flow} />
              <span className="ml-0.5 text-[11px] font-medium text-tertiary">MLD</span>
            </div>
          </div>
        }
      />

      <svg viewBox="0 0 300 62" className="mt-1 w-full" aria-label="Process train">
        <motion.rect
          y="6"
          width="46"
          height="55"
          rx="8"
          className="fill-fill-tertiary"
          initial={false}
          animate={{ x: stage.x - 23 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
        {/* Pipe, then a moving gap pattern over it */}
        <line x1="0" x2="300" y1={PIPE_Y} y2={PIPE_Y} strokeWidth="2.4" className="stroke-quaternary" />
        <motion.line
          x1="0"
          x2="300"
          y1={PIPE_Y}
          y2={PIPE_Y}
          strokeWidth="2.6"
          strokeDasharray="2 8"
          stroke="var(--widget-surface)"
          animate={reduce ? undefined : { strokeDashoffset: [0, -10] }}
          transition={{ duration: flowDur, repeat: Infinity, ease: "linear" }}
        />

        {STAGES.slice(0, 5).map((s) => (
          <StageShape key={s.id} id={s.id} x={s.x} reduce={reduce} />
        ))}

        {/* Clearwell with its live level */}
        <rect x="257" y={BOX_T} width="36" height={BOX_B - BOX_T} rx="3" strokeWidth="1.4" className="fill-[var(--widget-surface)] stroke-tertiary" />
        <motion.rect
          x="258.5"
          width="33"
          rx="2"
          className="fill-tertiary"
          fillOpacity="0.35"
          initial={{ y: BOX_B - 1, height: 0 }}
          animate={{ y: levelY, height: BOX_B - 1.5 - levelY }}
          transition={{ type: "spring", stiffness: 60, damping: 16, delay: 0.3 + (index ?? 0) * 0.06 }}
        />

        {STAGES.map((s, i) => (
          <g key={s.id} className="cursor-pointer" onClick={() => setSel(i)}>
            <rect x={s.x - 25} y="0" width="50" height="62" fill="transparent" />
            <text
              x={s.x}
              y="58"
              fontSize="9"
              textAnchor="middle"
              fontWeight={i === sel ? 600 : 400}
              className={i === sel ? "fill-heading" : "fill-tertiary"}
            >
              {s.name}
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-auto grid grid-cols-3 gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {stage.kpis(live).map((k, i) => (
            <motion.div
              key={`${stage.id}-${k.label}`}
              initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ type: "spring", stiffness: 420, damping: 32, delay: i * 0.04 }}
              className="min-w-0 leading-tight whitespace-nowrap"
            >
              <div className="truncate text-[10px] text-tertiary">{k.label}</div>
              <div className={cn("truncate text-[14px] font-semibold text-heading")}>
                {k.text ? (
                  k.text
                ) : (
                  <>
                    <AnimatedNumber value={k.value} format={{ minimumFractionDigits: k.digits ?? 0, maximumFractionDigits: k.digits ?? 0 }} />
                    {k.unit ? <span className="ml-0.5 text-[10px] font-medium text-tertiary">{k.unit}</span> : null}
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
