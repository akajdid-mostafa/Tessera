import { BuildingFactory20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { AlarmMark, enterDelay, sparkPath, useInterval } from "./_parts";

type State = "run" | "setup" | "idle" | "down";
type Machine = {
  id: string;
  model: string;
  state: State;
  note: string;
  parts: number;
  goal: number;
  /** Base spindle load % while cutting. */
  base: number;
  load: number[];
  cycle: number;
  ideal: number;
  operator: string;
};

const LEN = 20;
const hist = (base: number, seed: number) =>
  Array.from({ length: LEN }, (_, i) => Math.round(base + Math.sin(i * 1.1 + seed) * 7 + Math.cos(i * 0.5 + seed) * 4));

const SEED: Machine[] = [
  {
    id: "CNC-03", model: "Mazak QTN 200", state: "down", note: "Spindle overload", parts: 97, goal: 180, base: 0,
    load: [...hist(66, 3).slice(0, 14), 88, 104, 118, 0, 0, 0], cycle: 52.4, ideal: 48.0, operator: "Matt Y.",
  },
  {
    id: "CNC-04", model: "Okuma LB3000", state: "idle", note: "Starved · no blanks", parts: 140, goal: 200, base: 0,
    load: [...hist(48, 4).slice(0, 12), 0, 0, 0, 0, 0, 0, 0, 0], cycle: 61.0, ideal: 58.5, operator: "Dana K.",
  },
  {
    id: "CNC-06", model: "Haas ST-20", state: "setup", note: "Changeover 3/7", parts: 0, goal: 120, base: 0,
    load: Array(LEN).fill(0), cycle: 0, ideal: 44.0, operator: "Sarah T.",
  },
  {
    id: "CNC-01", model: "DMG Mori NLX 2500", state: "run", note: "Op 20 · T12", parts: 186, goal: 220, base: 54,
    load: hist(54, 1), cycle: 41.8, ideal: 40.0, operator: "Eric S.",
  },
  {
    id: "CNC-02", model: "Haas VF-2", state: "run", note: "Op 10 · T04", parts: 212, goal: 240, base: 62,
    load: hist(62, 2), cycle: 38.2, ideal: 36.0, operator: "Brian O.",
  },
  {
    id: "CNC-05", model: "DMG Mori DMU 50", state: "run", note: "Op 40 · T21", parts: 64, goal: 90, base: 71,
    load: hist(71, 5), cycle: 94.5, ideal: 92.0, operator: "Zoe A.",
  },
];

const SHARE: { key: State; label: string; className: string }[] = [
  { key: "run", label: "run", className: "bg-[var(--ant-color-text-secondary)]" },
  { key: "setup", label: "setup", className: "bg-fill" },
  { key: "idle", label: "idle", className: "bg-ios-yellow" },
  { key: "down", label: "down", className: "bg-ios-red" },
];

function StateMark({ m, acked }: { m: Machine; acked: boolean }) {
  if (m.state === "down") return <AlarmMark priority={1} flashing={!acked} />;
  if (m.state === "idle") return <AlarmMark priority={3} />;
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" className="shrink-0" aria-label={m.state === "run" ? "Running" : "Setup"}>
      {m.state === "run" ? (
        <circle cx="10" cy="10" r="5" fill="var(--ant-color-text-secondary)" />
      ) : (
        <circle cx="10" cy="10" r="4.5" fill="none" strokeWidth="1.6" strokeDasharray="2.4 2" stroke="var(--ant-color-text-tertiary)" />
      )}
    </svg>
  );
}

type Metric = "Parts" | "Load";
const SW = 80;
const SH = 22;

/** Factory · large. A machining cell ranked by severity: spindle-load sparklines and part counts tick live, the down machine flashes until you tap it, hover any row for its detail. */
export function MachineFleetWidget({ index }: { index?: number }) {
  const [machines, setMachines] = useState(SEED);
  const [metric, setMetric] = useState<Metric>("Parts");
  const [acked, setAcked] = useState(false);
  const [util, setUtil] = useState(0);
  const delay = enterDelay(index);

  useEffect(() => {
    const t = window.setTimeout(() => setUtil(0.634), delay * 1000 + 150);
    return () => window.clearTimeout(t);
  }, [delay]);

  useInterval(() => {
    const runners = machines.filter((m) => m.state === "run");
    const lucky = runners[Math.floor(Math.random() * runners.length)]?.id;
    setMachines((ms) =>
      ms.map((m) => {
        if (m.state !== "run") return m;
        const next = Math.round(m.base + (Math.random() - 0.5) * 16);
        return {
          ...m,
          load: [...m.load.slice(1), next],
          parts: m.id === lucky ? Math.min(m.goal, m.parts + 1) : m.parts,
        };
      }),
    );
    setUtil((u) => (u ? +(u + (Math.random() - 0.45) * 0.004).toFixed(3) : u));
  }, 2200);

  const count = (s: State) => machines.filter((m) => m.state === s).length;

  return (
    <Widget size="large" index={index} label="Machining cell overview">
      <WidgetHeader
        icon={<BuildingFactory20Filled />}
        tint={acked ? "var(--ios-indigo)" : "var(--ios-red)"}
        title="Cell B · Machining"
        subtitle="Shift 2 · 6 machines"
        extra={<Segmented size="small" value={metric} onChange={(v) => setMetric(v as Metric)} options={["Parts", "Load"]} />}
      />

      <div className="mt-3 flex items-baseline-last gap-3">
        <div className="shrink-0 leading-none">
          <AnimatedNumber
            value={util}
            format={{ style: "percent", maximumFractionDigits: 0 }}
            className="text-[30px] font-semibold tracking-tight text-heading"
          />
          <div className="mt-1 text-[11px] text-tertiary">utilization · goal 70%</div>
        </div>
        <div className="mb-0.5 min-w-0 flex-1">
          <div className="flex h-2 gap-[2px] overflow-hidden rounded-full">
            {SHARE.map((s, i) => (
              <motion.span
                key={s.key}
                className={cn("h-full rounded-[2px]", s.className)}
                initial={{ flexGrow: 0.0001 }}
                animate={{ flexGrow: count(s.key) }}
                transition={{ type: "spring", stiffness: 120, damping: 20, delay: delay + 0.1 + i * 0.08 }}
              />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-tertiary tabular whitespace-nowrap">
            {SHARE.map((s) => (
              <span key={s.key}>
                <span className="font-semibold text-secondary">{count(s.key)}</span> {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <ul className="mt-auto flex flex-col">
        {machines.map((m, i) => {
          const down = m.state === "down";
          const color = down ? "var(--ios-red)" : "var(--ant-color-text-secondary)";
          const load = m.load[m.load.length - 1];
          return (
            <motion.li
              key={m.id}
              className={cn(i > 0 && "border-t-[0.5px] border-split")}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.15 + i * 0.05, type: "spring", stiffness: 300, damping: 26 }}
            >
              <Tooltip
                placement="left"
                title={`${m.model} · ${m.operator}${m.cycle ? ` · cycle ${m.cycle} s (ideal ${m.ideal})` : ""}`}
              >
                <button
                  type="button"
                  onClick={() => down && setAcked(true)}
                  aria-label={down && !acked ? `${m.id} down, acknowledge` : m.id}
                  className="-mx-2 flex h-[37px] w-[calc(100%+1rem)] cursor-pointer items-center gap-2 rounded-xl px-2 text-left transition-colors duration-200 outline-none hover:bg-fill-quaternary"
                >
                  <StateMark m={m} acked={acked} />
                  <div className="w-[118px] shrink-0 leading-tight whitespace-nowrap">
                    <div className="text-[13px] font-semibold text-heading">{m.id}</div>
                    <div className={cn("truncate text-[11px]", down ? "font-medium text-ios-red" : "text-tertiary")}>{m.note}</div>
                  </div>
                  <svg viewBox={`0 0 ${SW} ${SH}`} preserveAspectRatio="none" className="h-[22px] min-w-0 flex-1 overflow-visible" aria-hidden>
                    <line x1="0" x2={SW} y1={SH} y2={SH} strokeWidth="1" className="stroke-fill-secondary" vectorEffect="non-scaling-stroke" />
                    <motion.path d={sparkPath(m.load, SW, SH, 0, 120)}
                      fill="none"
                      stroke={color}
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      initial={{ d: sparkPath(m.load, SW, SH, 0, 120), opacity: 0 }}
                      animate={{ opacity: 1, d: sparkPath(m.load, SW, SH, 0, 120) }}
                      transition={{
                        opacity: { duration: 1, delay: delay + 0.2 + i * 0.06, ease: [0.22, 1, 0.36, 1] },
                        d: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                      }}
                    />
                  </svg>
                  <div className="w-[58px] shrink-0 text-right leading-none whitespace-nowrap">
                    {metric === "Parts" ? (
                      <>
                        <AnimatedNumber value={m.parts} className="text-[14px] font-semibold text-heading" />
                        <span className="text-[10px] text-tertiary tabular">/{m.goal}</span>
                      </>
                    ) : (
                      <AnimatedNumber
                        value={load}
                        suffix="%"
                        className={cn("text-[14px] font-semibold", down ? "text-ios-red" : load ? "text-heading" : "text-tertiary")}
                      />
                    )}
                  </div>
                </button>
              </Tooltip>
            </motion.li>
          );
        })}
      </ul>
    </Widget>
  );
}
