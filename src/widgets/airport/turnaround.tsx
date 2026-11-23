import { Airplane20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { enterDelay, hhmm, useInterval } from "./_parts";

type TaskId = "deboard" | "bags" | "clean" | "catering" | "fuel" | "boarding" | "push";
type Task = {
  id: TaskId;
  label: string;
  segs: [number, number][];
  plan?: [number, number];
  who: string;
  by: string;
  detail: string;
};

/** Minutes after on-blocks (AIBT 13:50). TOBT is +45, TSAT +47. */
const AIBT = 13 * 60 + 50;
const TOBT = 45;
const TSAT = 47;
const SPAN = 50;
const START_T = 15;
const STEP = 0.25; // 15 sim-seconds per real second

const TASKS: Task[] = [
  { id: "deboard", label: "Deboard", segs: [[2, 11]], who: "Priya Shah", by: "Bridge 52A · Priya S.", detail: "174 pax off · 2 PRM" },
  { id: "bags", label: "Bags", segs: [[3, 14], [22, 40]], who: "Owen Price", by: "Belt loader BL-12 · Owen P.", detail: "96 off · 132 on · 2 ULD" },
  { id: "clean", label: "Cleaning", segs: [[11, 23]], who: "Lena Fischer", by: "Cabin team 3 · Lena F.", detail: "Transit clean · 4 staff" },
  { id: "catering", label: "Catering", segs: [[16, 30]], plan: [10, 22], who: "Marco Silva", by: "Catering truck 14 · Marco S.", detail: "Arrived 6 min late" },
  { id: "fuel", label: "Fuel", segs: [[13, 27]], who: "Tom Hughes", by: "Hydrant HD-07 · Tom H.", detail: "6,800 kg Jet A-1 · 0.8 SG" },
  { id: "boarding", label: "Boarding", segs: [[28, 43]], who: "Aisha Khan", by: "Gate 52 · Aisha K.", detail: "178 pax · 2 standby" },
  { id: "push", label: "Pushback", segs: [[43, 49]], who: "Jack Evans", by: "Tug TG-03 · Jack E.", detail: `TSAT ${hhmm(AIBT + TSAT)} · push to K2` },
];

const within = (t: number, segs: [number, number][]) => segs.some(([a, b]) => t >= a && t < b);
const S = 2.6; // px per metre in the drawing
const NOSE = { x: 188, y: 16 };
const ROTUNDA = { x: 148, y: 6 };
const DOOR_L1 = { x: NOSE.x - 2 * S, y: NOSE.y + 4.5 * S };

/** Airport · large. A turnaround on stand: ground vehicles drive in and out around a top-down A320 as the milestone Gantt runs toward TOBT, late catering flags the TOBT at risk, and tapping a task highlights its vehicle. */
export function TurnaroundWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [t, setT] = useState(START_T);
  const [sel, setSel] = useState<TaskId>("catering");
  const delay = enterDelay(index);

  useInterval(() => setT((v) => (v + STEP > SPAN ? 0 : v + STEP)), 1000);

  const active = (id: TaskId) => within(t, TASKS.find((k) => k.id === id)!.segs);
  const cateringLate = (t > 10 && t < 16) || (t > 22 && t < 30);
  const atRisk = cateringLate;
  const pushing = t >= TSAT;
  const toTobt = Math.max(0, Math.round((TOBT - t) * 60));
  const bridgeOn = t >= 0.5 && t < 44;
  const pushY = pushing ? Math.min(1, (t - TSAT) / 2) * 22 : 0;
  const task = TASKS.find((k) => k.id === sel)!;

  const taskState = (k: Task) => {
    const first = k.segs[0][0];
    const last = k.segs[k.segs.length - 1][1];
    if (t >= last) return { text: `Done ${hhmm(AIBT + last)}`, warn: false };
    if (within(t, k.segs)) {
      const seg = k.segs.find(([a, b]) => t >= a && t < b)!;
      return { text: `${Math.ceil(seg[1] - t)} min left`, warn: k.id === "catering" && cateringLate };
    }
    const next = k.segs.find(([a]) => a > t)?.[0] ?? first;
    return { text: `Starts ${hhmm(AIBT + next)}`, warn: k.id === "catering" && cateringLate };
  };
  const st = taskState(task);

  const bridgeEnd = bridgeOn ? { x: DOOR_L1.x - 3, y: DOOR_L1.y - 1 } : { x: 162, y: 13 };
  const paxPath = `M${DOOR_L1.x - 3} ${DOOR_L1.y - 1}L${ROTUNDA.x} ${ROTUNDA.y}`;
  const paxBack = `M${ROTUNDA.x} ${ROTUNDA.y}L${DOOR_L1.x - 3} ${DOOR_L1.y - 1}`;
  const paxMoving = active("deboard") ? paxPath : active("boarding") ? paxBack : null;

  return (
    <Widget size="large" index={index} label="Aircraft turnaround">
      <WidgetHeader
        icon={<Airplane20Filled />}
        tint={atRisk ? "var(--ios-orange)" : "var(--ios-indigo)"}
        title="Stand 52 · BA 2490"
        subtitle="A320neo G-TTNA · LGW → EDI"
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={atRisk ? "risk" : pushing ? "push" : "ok"}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                atRisk ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-tertiary text-secondary",
              )}
            >
              {atRisk ? "TOBT at risk" : pushing ? "Pushing back" : "On time"}
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="mt-2 flex items-baseline-last gap-2 whitespace-nowrap">
        <div className="flex items-baseline text-[28px] leading-none font-semibold tracking-tight text-heading">
          <AnimatedNumber value={Math.floor(toTobt / 60)} trend={-1} format={{ minimumIntegerDigits: 2 }} />
          <span className="px-px">:</span>
          <AnimatedNumber value={toTobt % 60} trend={-1} format={{ minimumIntegerDigits: 2 }} />
        </div>
        <div className="pb-0.5 text-[11px] leading-tight text-tertiary">
          <div>to TOBT</div>
          <div className="font-semibold text-secondary tabular">{hhmm(AIBT + TOBT)}</div>
        </div>
        <div className="ml-auto pb-0.5 text-right text-[11px] leading-tight text-tertiary tabular">
          <div>
            TSAT <span className="font-semibold text-secondary">{hhmm(AIBT + TSAT)}</span>
          </div>
          <div>
            On blocks {hhmm(AIBT)} · +{Math.floor(t)} min
          </div>
        </div>
      </div>

      {/* The stand, top-down: terminal, jet bridge, the aircraft and its ground vehicles. */}
      <svg viewBox="0 0 376 124" className="mt-2 h-[124px] w-full overflow-hidden rounded-xl bg-fill-quaternary" aria-hidden>
        <rect x="0" y="0" width="376" height="3" className="fill-fill-secondary" />
        <line x1={NOSE.x} x2={NOSE.x} y1="4" y2="124" strokeWidth="1" strokeDasharray="4 4" className="stroke-fill" />
        {[NOSE.x - 62, NOSE.x + 62].map((x) => (
          <line key={x} x1={x} x2={x} y1="8" y2="124" strokeWidth="1" strokeDasharray="2 5" className="stroke-fill" />
        ))}
        <line x1={NOSE.x - 10} x2={NOSE.x + 10} y1={NOSE.y - 3} y2={NOSE.y - 3} strokeWidth="1.5" className="stroke-fill" />

        {/* Jet bridge: rotunda, tunnel, cab at L1. */}
        <circle cx={ROTUNDA.x} cy={ROTUNDA.y} r="5" className="fill-fill-secondary" />
        <motion.line
          x1={ROTUNDA.x}
          y1={ROTUNDA.y}
          x2={bridgeEnd.x}
          y2={bridgeEnd.y}
          initial={false}
          animate={{ x2: bridgeEnd.x, y2: bridgeEnd.y }}
          transition={{ type: "spring", stiffness: 60, damping: 16 }}
          strokeWidth="6"
          strokeLinecap="round"
          className={cn(sel === "deboard" || sel === "boarding" ? "stroke-[var(--ios-blue)]" : "stroke-[var(--ant-color-text-quaternary)]")}
        />
        {paxMoving && !reduce
          ? [0, 1, 2, 3].map((i) => (
              <circle key={`${paxMoving}-${i}`} r="1.3" className="fill-[var(--widget-surface)]">
                <animateMotion path={paxMoving} dur="2.4s" begin={`${-i * 0.6}s`} repeatCount="indefinite" />
              </circle>
            ))
          : null}

        <motion.g initial={false} animate={{ y: pushY }} transition={{ type: "spring", stiffness: 40, damping: 18 }}>
          <g transform={`translate(${NOSE.x} ${NOSE.y}) scale(${S})`}>
            <Aircraft />
            <Vehicle show id="gpu" sel={sel === "push"} parts={[[-6.2, 1.2, 2.4, 1.6]]} />
            <Vehicle show={active("bags")} id="bags" sel={sel === "bags"} parts={[[2.4, 7.4, 7, 1.8], [10.2, 6.9, 2.4, 1.6], [13, 6.8, 2.4, 1.8], [15.8, 6.8, 2.4, 1.8]]} />
            <Vehicle show={active("fuel")} id="fuel" sel={sel === "fuel"} parts={[[8.5, 11.6, 7, 2.4]]}>
              <line x1="10.5" y1="14" x2="10.8" y2="16.6" strokeWidth="1" vectorEffect="non-scaling-stroke" className="stroke-tertiary" />
            </Vehicle>
            <Vehicle
              show={t >= 16 && t < 30}
              id="catering"
              sel={sel === "catering"}
              warn={cateringLate}
              parts={[[2.6, 28.4, 7.5, 2.6], [10.3, 28.6, 2, 2.2]]}
            />
            <Vehicle show={active("clean")} id="clean" sel={sel === "clean"} parts={[[-9.8, 28.5, 5, 2.2], [-4.5, 29, 2.3, 1.3]]} />
            <Vehicle show={t >= 43} id="push" sel={sel === "push"} parts={[[-1.7, -5.6, 3.4, 4]]}>
              <line x1="0" y1="-1.6" x2="0" y2="0" strokeWidth="1.2" vectorEffect="non-scaling-stroke" className="stroke-tertiary" />
            </Vehicle>
          </g>
        </motion.g>

        <text x="8" y="119" fontSize="9" className="fill-tertiary">
          Stand 52 · nose-in
        </text>
      </svg>

      {/* Milestones toward TOBT. */}
      <div className="mt-2 flex gap-2">
        <div className="flex w-[54px] shrink-0 flex-col gap-px">
          {TASKS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setSel(k.id)}
              className={cn(
                "h-[14px] cursor-pointer truncate text-left text-[10px] leading-[14px] transition-colors",
                sel === k.id ? "font-semibold text-heading" : "text-tertiary hover:text-secondary",
                k.id === "catering" && cateringLate && "text-ios-orange",
              )}
            >
              {k.label}
            </button>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="flex flex-col gap-px">
            {TASKS.map((k, ri) => {
              const late = k.id === "catering" && cateringLate;
              return (
                <button
                  key={k.id}
                  type="button"
                  aria-label={`${k.label} details`}
                  onClick={() => setSel(k.id)}
                  className={cn(
                    "relative h-[14px] cursor-pointer rounded-[4px] transition-colors",
                    sel === k.id ? "bg-fill-tertiary" : "hover:bg-fill-quaternary",
                  )}
                >
                  {k.plan ? (
                    <span
                      className="absolute inset-y-[2px] rounded-[3px] border border-dashed border-[var(--ant-color-text-tertiary)]"
                      style={{ left: `${(k.plan[0] / SPAN) * 100}%`, width: `${((k.plan[1] - k.plan[0]) / SPAN) * 100}%` }}
                    />
                  ) : null}
                  {k.segs.map(([a, b], si) => {
                    const p = Math.min(1, Math.max(0, (t - a) / (b - a)));
                    return (
                      <motion.span
                        key={si}
                        className={cn("absolute inset-y-[3px] origin-left overflow-hidden rounded-[3px]", late ? "bg-ios-orange/30" : "bg-fill-secondary")}
                        style={{ left: `${(a / SPAN) * 100}%`, width: `${((b - a) / SPAN) * 100}%` }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ type: "spring", stiffness: 240, damping: 26, delay: delay + 0.3 + ri * 0.05 + si * 0.05 }}
                      >
                        <span
                          className={cn("absolute inset-y-0 left-0 transition-[width] duration-700 ease-out", late || k.id === "catering" ? "bg-ios-orange" : "bg-[var(--ant-color-text-tertiary)]")}
                          style={{ width: `${p * 100}%` }}
                        />
                      </motion.span>
                    );
                  })}
                </button>
              );
            })}
          </div>

          <span
            className="pointer-events-none absolute -top-1 bottom-3 border-l border-dashed border-[var(--ant-color-text-secondary)]"
            style={{ left: `${(TOBT / SPAN) * 100}%` }}
          />
          <motion.span
            className="pointer-events-none absolute -top-1 bottom-3 w-0"
            initial={false}
            animate={{ left: `${(t / SPAN) * 100}%` }}
            transition={{ duration: 0.9, ease: "linear" }}
          >
            <span className="absolute inset-y-0 -left-px w-[2px] rounded-full bg-heading" />
            <span className="absolute -top-[3px] -left-[4px] size-2 rounded-full bg-heading ring-2 ring-[var(--widget-surface)]" />
          </motion.span>

          <div className="relative mt-1 h-3 text-[10px] leading-3 text-tertiary tabular">
            {[0, 15, 30].map((m) => (
              <span key={m} className={cn("absolute", m ? "-translate-x-1/2" : "")} style={{ left: `${(m / SPAN) * 100}%` }}>
                {hhmm(AIBT + m)}
              </span>
            ))}
            <span className="absolute -translate-x-1/2 font-semibold text-secondary" style={{ left: `${(TOBT / SPAN) * 100}%` }}>
              TOBT
            </span>
          </div>
        </div>
      </div>

      <div className="mt-auto flex h-7 items-center gap-2 whitespace-nowrap">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={task.id}
            className="flex min-w-0 flex-1 items-center gap-2"
            initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -4, filter: "blur(3px)" }}
          >
            <MemojiAvatar who={task.who} size={24} alt={task.who} />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[12px] font-semibold text-heading">{task.by}</div>
              <div className="truncate text-[11px] text-tertiary">{task.detail}</div>
            </div>
          </motion.div>
        </AnimatePresence>
        <span className={cn("shrink-0 text-[12px] font-semibold tabular", st.warn ? "text-ios-orange" : "text-secondary")}>{st.text}</span>
      </div>
    </Widget>
  );
}

/** A320 outline in metres, nose at the origin, aft is +y. */
function Aircraft() {
  const ink = { vectorEffect: "non-scaling-stroke" as const, strokeWidth: 1, strokeLinejoin: "round" as const };
  return (
    <g className="fill-[var(--widget-surface)] stroke-[var(--ant-color-text-tertiary)]">
      <path d="M2 13.5 17.9 21V22.6L2 20.5ZM-2 13.5-17.9 21V22.6L-2 20.5Z" {...ink} />
      <path d="M1.6 31 6.2 34.5V35.8L1.2 35.2ZM-1.6 31-6.2 34.5V35.8L-1.2 35.2Z" {...ink} />
      <rect x="4.65" y="11" width="2.2" height="5" rx="0.8" {...ink} />
      <rect x="-6.85" y="11" width="2.2" height="5" rx="0.8" {...ink} />
      <path d="M0 0C1.4 0 2 1.6 2 4V31L0.6 37.6H-0.6L-2 31V4C-2 1.6-1.4 0 0 0Z" {...ink} />
      <rect x="-0.25" y="29.5" width="0.5" height="7.5" className="fill-[var(--ant-color-text-tertiary)]" stroke="none" />
      <path d="M-1 2.2H1" {...ink} />
    </g>
  );
}

function Vehicle({
  show,
  id,
  sel,
  warn,
  parts,
  children,
}: {
  show: boolean;
  id: string;
  sel: boolean;
  warn?: boolean;
  parts: [number, number, number, number][];
  children?: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {show ? (
        <motion.g
          key={id}
          initial={{ opacity: 0, x: reduce ? 0 : 6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: reduce ? 0 : 6 }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        >
          {children}
          {parts.map(([x, y, w, h], i) => (
            <rect
              key={i}
              x={x}
              y={y}
              width={w}
              height={h}
              rx="0.5"
              vectorEffect="non-scaling-stroke"
              strokeWidth={sel ? 1.5 : 0}
              className={cn(
                warn ? "fill-[var(--ios-orange)]" : "fill-[var(--ant-color-text-quaternary)]",
                sel ? "stroke-[var(--ios-blue)]" : "stroke-none",
              )}
            />
          ))}
          {sel && !reduce ? (
            <motion.rect
              x={Math.min(...parts.map((p) => p[0])) - 1}
              y={Math.min(...parts.map((p) => p[1])) - 1}
              width={Math.max(...parts.map((p) => p[0] + p[2])) - Math.min(...parts.map((p) => p[0])) + 2}
              height={Math.max(...parts.map((p) => p[1] + p[3])) - Math.min(...parts.map((p) => p[1])) + 2}
              rx="1"
              fill="none"
              vectorEffect="non-scaling-stroke"
              strokeWidth="1"
              className="stroke-[var(--ios-blue)]"
              animate={{ opacity: [0.8, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
            />
          ) : null}
        </motion.g>
      ) : null}
    </AnimatePresence>
  );
}
