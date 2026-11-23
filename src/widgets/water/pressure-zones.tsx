import { ArrowCounterclockwise16Regular, Dismiss16Regular, Map20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { AlarmMark, HoldButton, enterDelay, useInterval } from "./_parts";

/* A distribution network in HP-HMI outline: mains are thin grey lines, pressure
 * transmitters are hollow circles, the pump station a square. A 300 mm main bursts on
 * Oak St a few seconds in: PT-4 falls under the 2.0 bar low-low (priority 1), PT-5
 * under the 3.0 bar low (priority 2) and inlet flow jumps. Isolating it means closing
 * V-12 and V-14 (hold to confirm); PT-4 then recovers through the south loop and the
 * properties on that block are out of supply until the crew repairs it. */
type Phase = "normal" | "burst" | "confirm" | "closing" | "isolated";
type NodeId = "PT-1" | "PT-2" | "PT-3" | "PT-4" | "PT-5" | "PT-6";
type Node = { id: NodeId; x: number; y: number; lx: number; ly: number; anchor: "start" | "middle" | "end"; where: string };

const NODES: Node[] = [
  { id: "PT-1", x: 92, y: 118, lx: 84, ly: 108, anchor: "end", where: "Station Rd" },
  { id: "PT-2", x: 182, y: 46, lx: 182, ly: 33, anchor: "middle", where: "North Hill" },
  { id: "PT-3", x: 182, y: 190, lx: 182, ly: 211, anchor: "middle", where: "Brook Lane" },
  { id: "PT-4", x: 272, y: 118, lx: 285, ly: 116, anchor: "start", where: "Oak St" },
  { id: "PT-5", x: 348, y: 46, lx: 348, ly: 67, anchor: "middle", where: "High Ridge" },
  { id: "PT-6", x: 348, y: 190, lx: 348, ly: 211, anchor: "middle", where: "Eastfield" },
];
const PIPES: [number, number, number, number][] = [
  [22, 118, 92, 118],
  [92, 118, 182, 46],
  [92, 118, 182, 190],
  [182, 190, 272, 118],
  [182, 46, 348, 46],
  [182, 190, 348, 190],
  [272, 118, 348, 190],
];
/* The burst main, PT-2 → PT-4, with its two isolation valves and the break between them. */
const MAIN = [182, 46, 272, 118] as const;
const along = (t: number) => [MAIN[0] + (MAIN[2] - MAIN[0]) * t, MAIN[1] + (MAIN[3] - MAIN[1]) * t] as const;
const V12 = along(0.22);
const V14 = along(0.78);
const BREAK = along(0.5);
const ANGLE = (Math.atan2(MAIN[3] - MAIN[1], MAIN[2] - MAIN[0]) * 180) / Math.PI;

const PRESSURE: Record<"normal" | "burst" | "isolated", Record<NodeId, number>> = {
  normal: { "PT-1": 5.2, "PT-2": 4.4, "PT-3": 4.6, "PT-4": 4.1, "PT-5": 3.8, "PT-6": 4.0 },
  burst: { "PT-1": 4.7, "PT-2": 3.2, "PT-3": 4.0, "PT-4": 1.6, "PT-5": 2.7, "PT-6": 3.3 },
  isolated: { "PT-1": 5.1, "PT-2": 4.2, "PT-3": 4.3, "PT-4": 3.4, "PT-5": 3.6, "PT-6": 3.7 },
};
const INLET = { normal: 182, burst: 246, isolated: 176 };
const OUT_OF_SUPPLY = 212;
const LL = 2.0;
const L = 3.0;
const prio = (p: number): 1 | 2 | null => (p < LL ? 1 : p < L ? 2 : null);

function Valve({ x, y, closed, highlight }: { x: number; y: number; closed: boolean; highlight: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${ANGLE})`}>
      {highlight ? (
        <motion.circle
          r="10"
          fill="none"
          strokeWidth="1.2"
          className="stroke-heading"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0.9, 0.3, 0.9], scale: 1 }}
          transition={{ opacity: { duration: 1.2, repeat: Infinity }, scale: { type: "spring", stiffness: 300, damping: 20 } }}
        />
      ) : null}
      <motion.path
        d="M-6 -4.5 L0 0 L-6 4.5Z M6 -4.5 L0 0 L6 4.5Z"
        strokeWidth="1.3"
        strokeLinejoin="round"
        className="stroke-heading"
        initial={false}
        animate={{ fill: closed ? "var(--ant-color-text)" : "var(--widget-surface)" }}
        transition={{ duration: 0.4 }}
      />
    </g>
  );
}

/** Water · large. A distribution network map where a main bursts live, pressures sag into P1 and P2 alarms and inlet flow jumps; tap a sensor to read it, then hold to close two valves and isolate the break. */
export function PressureZonesWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const delay = enterDelay(index);
  const [phase, setPhase] = useState<Phase>("normal");
  const [acked, setAcked] = useState(false);
  const [closing, setClosing] = useState(0);
  const [sel, setSel] = useState<NodeId>("PT-4");
  const [jitter, setJitter] = useState<Record<NodeId, number>>({ "PT-1": 0, "PT-2": 0, "PT-3": 0, "PT-4": 0, "PT-5": 0, "PT-6": 0 });

  // The burst arrives a few seconds after the widget lands, and again after each repair.
  useEffect(() => {
    if (phase !== "normal") return;
    const t = window.setTimeout(() => {
      setPhase("burst");
      setAcked(false);
      setSel("PT-4");
    }, 4200);
    return () => window.clearTimeout(t);
  }, [phase]);

  useInterval(() => {
    setJitter((j) => {
      const next = { ...j };
      for (const k of Object.keys(next) as NodeId[]) next[k] = Math.round((Math.random() - 0.5) * 2) / 10;
      return next;
    });
  }, 2200);

  useInterval(
    () => {
      setClosing((c) => {
        const n = Math.min(100, c + 9);
        if (n >= 100) setPhase("isolated");
        return n;
      });
    },
    phase === "closing" ? 280 : null,
  );

  const state = phase === "normal" ? "normal" : phase === "isolated" ? "isolated" : "burst";
  const p = (id: NodeId) => Math.max(0, PRESSURE[state][id] + (state === "burst" && id === "PT-4" ? jitter[id] / 2 : jitter[id] / 3));
  const inlet = INLET[state] + jitter["PT-1"] * 20;
  const node = NODES.find((n) => n.id === sel) ?? NODES[3];
  const selP = p(sel);
  const selPrio = prio(selP);
  const flashing = state === "burst" && !acked;
  const isolated = phase === "isolated";
  const valvesClosed = isolated || (phase === "closing" && closing > 60);

  return (
    <Widget size="large" index={index} label="Distribution network pressure">
      <WidgetHeader
        icon={<Map20Filled />}
        tint="var(--ios-blue)"
        title="Network Pressure"
        subtitle="Eastside zone · 6 PTs · bar"
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={state}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                state === "burst" ? "bg-ios-red/15 text-ios-red" : "bg-fill-tertiary text-secondary",
              )}
            >
              {state === "burst" ? <AlarmMark priority={1} flashing={flashing} size={12} /> : null}
              {state === "burst" ? "2 alarms" : isolated ? "Isolated" : "Normal"}
            </motion.span>
          </AnimatePresence>
        }
      />

      <svg viewBox="0 0 376 216" className="mt-2 h-[216px] w-full shrink-0 overflow-visible" aria-label="Network map">
        {PIPES.map(([x1, y1, x2, y2], i) => (
          <g key={i}>
            <motion.line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              strokeWidth="2"
              strokeLinecap="round"
              className="stroke-fill"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: delay + i * 0.05 }}
            />
            {reduce ? null : (
              <motion.line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                strokeWidth="2"
                strokeDasharray="2 14"
                strokeLinecap="round"
                className="stroke-tertiary"
                initial={{ strokeDashoffset: 0, opacity: 0 }}
                animate={{ strokeDashoffset: -32, opacity: 0.8 }}
                transition={{ strokeDashoffset: { duration: state === "burst" ? 1.1 : 1.8, repeat: Infinity, ease: "linear" }, opacity: { delay: delay + 0.6 } }}
              />
            )}
          </g>
        ))}

        {/* The Oak St main: live, burst, or isolated between the valves. */}
        <line x1={MAIN[0]} y1={MAIN[1]} x2={MAIN[2]} y2={MAIN[3]} strokeWidth="2" strokeLinecap="round" className="stroke-fill" />
        {isolated ? (
          <line x1={V12[0]} y1={V12[1]} x2={V14[0]} y2={V14[1]} strokeWidth="2.5" strokeDasharray="3 3" className="stroke-[var(--widget-surface)]" />
        ) : !reduce ? (
          <motion.line
            x1={MAIN[0]}
            y1={MAIN[1]}
            x2={MAIN[2]}
            y2={MAIN[3]}
            strokeWidth="2"
            strokeDasharray="2 14"
            strokeLinecap="round"
            className="stroke-tertiary"
            initial={{ strokeDashoffset: -32 }}
            animate={{ strokeDashoffset: -32 }}
            transition={{ duration: state === "burst" ? 0.8 : 1.8, repeat: Infinity, ease: "linear" }}
          />
        ) : null}

        {state === "burst" ? (
          <g>
            {reduce
              ? null
              : [0, 0.7].map((d) => (
                  <motion.circle
                    key={d}
                    cx={BREAK[0]}
                    cy={BREAK[1]}
                    fill="none"
                    stroke="var(--ios-red)"
                    strokeWidth="1.5"
                    initial={{ r: 3, opacity: 0.9 }}
                    animate={{ r: 16, opacity: 0 }}
                    transition={{ duration: 1.4, repeat: Infinity, delay: d, ease: "easeOut" }}
                  />
                ))}
            <circle cx={BREAK[0]} cy={BREAK[1]} r="3.5" fill="var(--ios-red)" />
          </g>
        ) : null}

        <Valve x={V12[0]} y={V12[1]} closed={valvesClosed} highlight={phase === "confirm" || phase === "closing"} />
        <Valve x={V14[0]} y={V14[1]} closed={valvesClosed} highlight={phase === "confirm" || phase === "closing"} />
        {phase !== "normal" && phase !== "burst" ? (
          <g fontSize="10" className="fill-tertiary">
            <text x={V12[0] - 4} y={V12[1] + 18} textAnchor="end">
              V-12
            </text>
            <text x={V14[0] + 10} y={V14[1] - 10}>
              V-14
            </text>
          </g>
        ) : null}

        {/* Pump station */}
        <rect x="12" y="108" width="20" height="20" rx="3" strokeWidth="1.5" className="fill-[var(--widget-surface)] stroke-secondary" />
        <path d="M18 113 L27 118 L18 123Z" className="fill-secondary" />
        <text x="22" y="143" fontSize="10" textAnchor="middle" className="fill-tertiary">
          PS-1
        </text>

        {NODES.map((n, i) => {
          const v = p(n.id);
          const pr = prio(v);
          const active = sel === n.id;
          return (
            <g key={n.id} className="cursor-pointer" onClick={() => setSel(n.id)} role="button" aria-label={`${n.id} ${v.toFixed(1)} bar`}>
              <circle cx={n.x} cy={n.y} r="14" fill="transparent" />
              {active ? (
                <motion.circle cx={n.x} cy={n.y} r="9" strokeWidth="1" className="fill-fill-quaternary stroke-tertiary" initial={{ scale: 0.5 }} animate={{ scale: 1 }} />
              ) : null}
              <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18, delay: delay + 0.3 + i * 0.05 }}>
                {pr ? (
                  <g transform={`translate(${n.x - 8} ${n.y - 8})`}>
                    <AlarmMark priority={pr} flashing={flashing} size={16} />
                  </g>
                ) : (
                  <circle cx={n.x} cy={n.y} r="4.5" strokeWidth="1.8" className="fill-[var(--widget-surface)] stroke-heading" />
                )}
              </motion.g>
              <text
                x={n.lx}
                y={n.ly}
                fontSize="12"
                fontWeight="600"
                textAnchor={n.anchor}
                fill="currentColor"
                className={cn("tabular", pr === 1 ? "text-ios-red" : pr === 2 ? "text-ios-orange" : "text-heading")}
              >
                {v.toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-2 grid grid-cols-3 gap-2 whitespace-nowrap">
        <div className="min-w-0">
          <div className="text-[11px] leading-none text-tertiary">Inlet FT-1</div>
          <div className="mt-1 leading-none">
            <AnimatedNumber value={Math.round(inlet)} className="text-[20px] font-semibold tracking-tight text-heading" />
            <span className="ml-0.5 text-[11px] text-tertiary">L/s</span>
          </div>
        </div>
        <div className="min-w-0">
          <div className="truncate text-[11px] leading-none text-tertiary">
            {node.id} · {node.where}
          </div>
          <div className="mt-1 flex items-center gap-1 leading-none">
            <AnimatedNumber
              value={selP}
              format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
              className={cn("text-[20px] font-semibold tracking-tight", selPrio === 1 ? "text-ios-red" : selPrio === 2 ? "text-ios-orange" : "text-heading")}
            />
            <span className="text-[11px] text-tertiary">bar</span>
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] leading-none text-tertiary">Out of supply</div>
          <div className="mt-1 leading-none">
            <AnimatedNumber value={isolated ? OUT_OF_SUPPLY : 0} className="text-[20px] font-semibold tracking-tight text-heading" />
            <span className="ml-0.5 text-[11px] text-tertiary">props</span>
          </div>
        </div>
      </div>

      <div className="mt-auto h-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex h-8 items-center gap-2 whitespace-nowrap"
          >
            {phase === "normal" ? (
              <span className="text-[12px] text-tertiary">All PTs in band · last burst 41 days ago</span>
            ) : phase === "burst" ? (
              <>
                <button
                  type="button"
                  onClick={() => setAcked(true)}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-lg px-1 py-1 text-left transition-colors hover:bg-fill-quaternary"
                  aria-label={acked ? "Burst alarm acknowledged" : "Acknowledge burst alarm"}
                >
                  <AlarmMark priority={1} flashing={flashing} size={15} />
                  <span className="min-w-0 truncate text-[12px] leading-tight">
                    <span className="font-semibold text-heading">Burst · Oak St 300 mm</span>
                    <span className="block text-[11px] text-tertiary">{acked ? "Acknowledged" : "Tap to acknowledge"}</span>
                  </span>
                </button>
                <Button size="small" variant="solid" color="default" onClick={() => setPhase("confirm")}>
                  Isolate…
                </Button>
              </>
            ) : phase === "confirm" ? (
              <>
                <Button shape="circle" size="small" variant="filled" color="default" icon={<Dismiss16Regular />} aria-label="Cancel" onClick={() => setPhase("burst")} />
                <HoldButton
                  label="Hold to close V-12 + V-14"
                  tint="var(--ios-red)"
                  onConfirm={() => {
                    setAcked(true);
                    setClosing(0);
                    setPhase("closing");
                  }}
                  className="h-8 flex-1"
                />
              </>
            ) : phase === "closing" ? (
              <div className="flex flex-1 items-center gap-2 text-[12px] text-secondary">
                <span className="font-semibold text-heading">Closing</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-fill-tertiary">
                  <motion.div className="h-full rounded-full bg-[var(--ant-color-text-secondary)]" animate={{ width: `${closing}%` }} transition={{ duration: 0.25 }} />
                </div>
                <span className="w-9 text-right tabular">{closing}%</span>
              </div>
            ) : (
              <>
                <span className="min-w-0 flex-1 truncate text-[12px] text-secondary">
                  <span className="font-semibold text-heading">Isolated</span> · crew ETA 18 min
                </span>
                <Button
                  size="small"
                  variant="filled"
                  color="default"
                  icon={<ArrowCounterclockwise16Regular />}
                  onClick={() => {
                    setClosing(0);
                    setPhase("normal");
                  }}
                >
                  Repaired
                </Button>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Widget>
  );
}
