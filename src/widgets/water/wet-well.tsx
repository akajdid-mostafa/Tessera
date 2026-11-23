import { ArrowDown12Filled, ArrowUp12Filled, Water20Filled } from "@fluentui/react-icons";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/* A two-pump lift station on level control. Pump calls are read off the well:
 * Stop 0.6 m · Lead start 1.6 m · Lag start 2.0 m · High alarm 2.4 m · Overflow 3.0 m.
 * The lead pump alternates every cycle; tap a pump to make it lead. Time runs ×12. */
const DEPTH = 3.0;
const MARKS = [
  { at: 2.4, label: "High" },
  { at: 2.0, label: "Lag" },
  { at: 1.6, label: "Lead" },
  { at: 0.6, label: "Stop" },
] as const;
const STOP = 0.6;
const LEAD = 1.6;
const LAG = 2.0;
const AREA = 12; // m²
const PUMP_LS = 68;
const SPEEDUP = 12;

const Y0 = 4;
const Y1 = 112;
const yOf = (m: number) => Y1 - (m / DEPTH) * (Y1 - Y0);

function Impeller({ running }: { running: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 16 16"
      className="size-4 shrink-0"
      animate={running && !reduce ? { rotate: 360 } : { rotate: 0 }}
      transition={running ? { duration: 0.9, repeat: Infinity, ease: "linear" } : { duration: 0.4 }}
      aria-hidden
    >
      <circle
        cx="8"
        cy="8"
        r="7"
        strokeWidth="1.5"
        className={running ? "fill-heading stroke-heading" : "fill-none stroke-tertiary"}
      />
      {[0, 120, 240].map((a) => (
        <path
          key={a}
          d="M8 8 Q 10.5 6 9.5 2.6"
          fill="none"
          strokeWidth="1.4"
          strokeLinecap="round"
          transform={`rotate(${a} 8 8)`}
          stroke={running ? "var(--widget-surface)" : "var(--ant-color-text-tertiary)"}
        />
      ))}
    </motion.svg>
  );
}

/** Water · small. The wet-well level rises and falls as pumps call in and out; tap a pump to make it lead. */
export function WetWellWidget({ index }: { index?: number }) {
  const [level, setLevel] = useState(1.18);
  const [inflow, setInflow] = useState(38);
  const [lead, setLead] = useState<0 | 1>(0);
  const [running, setRunning] = useState<[boolean, boolean]>([false, false]);
  const [call, setCall] = useState<{ n: number; label: string }>({ n: 0, label: "" });
  const st = useRef({ level: 1.18, inflow: 38, lead: 0 as 0 | 1, running: [false, false] as [boolean, boolean] });
  st.current.lead = lead;

  useEffect(() => {
    const t = window.setInterval(() => {
      const s = st.current;
      s.inflow = Math.max(30, Math.min(46, s.inflow + (Math.random() - 0.5) * 3));
      const lag = s.lead === 0 ? 1 : 0;
      const r: [boolean, boolean] = [s.running[0], s.running[1]];
      let fired = "";
      if (!r[s.lead] && s.level >= LEAD) {
        r[s.lead] = true;
        fired = "Lead";
      }
      if (!r[lag] && s.level >= LAG) {
        r[lag] = true;
        fired = "Lag";
      }
      if ((r[0] || r[1]) && s.level <= STOP) {
        r[0] = false;
        r[1] = false;
        s.lead = lag; // auto-alternate for even wear
        setLead(lag);
      }
      const out = (r[0] ? PUMP_LS : 0) + (r[1] ? PUMP_LS : 0);
      s.level = Math.max(0.3, Math.min(DEPTH, s.level + ((s.inflow - out) / 1000 / AREA) * SPEEDUP));
      s.running = r;
      setRunning(r);
      setLevel(Math.round(s.level * 100) / 100);
      setInflow(Math.round(s.inflow));
      if (fired) setCall((c) => ({ n: c.n + 1, label: fired }));
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  const out = (running[0] ? PUMP_LS : 0) + (running[1] ? PUMP_LS : 0);
  const rising = inflow > out;

  return (
    <Widget size="small" index={index} label="Lift station wet well">
      <WidgetHeader icon={<Water20Filled />} tint="var(--ios-blue)" title="Lift Station 3" subtitle="Wet well · Auto" />

      <div className="mt-1.5 flex min-h-0 flex-1 gap-2">
        <svg viewBox="0 0 48 116" className="h-full w-[45px] shrink-0 overflow-visible" preserveAspectRatio="xMinYMax meet" aria-hidden>
          <rect x="2" y={Y0} width="40" height={Y1 - Y0} rx="3" strokeWidth="1.5" className="fill-fill-quaternary stroke-quaternary" />
          <motion.rect
            x="3"
            width="38"
            rx="2"
            fill="var(--ios-blue)"
            fillOpacity="0.22"
            initial={{ y: Y1, height: 0 }}
            animate={{ y: yOf(level), height: Y1 - 1 - yOf(level) }}
            transition={{ type: "spring", stiffness: 70, damping: 18 }}
          />
          <motion.line
            x1="3"
            x2="41"
            stroke="var(--ios-blue)"
            strokeWidth="1.5"
            initial={{ y1: Y1, y2: Y1 }}
            animate={{ y1: yOf(level), y2: yOf(level) }}
            transition={{ type: "spring", stiffness: 70, damping: 18 }}
          />
          {MARKS.map((m) => (
            <g key={m.label}>
              <motion.line
                key={call.label === m.label ? `${m.label}-${call.n}` : m.label}
                x1="34"
                x2="47"
                y1={yOf(m.at)}
                y2={yOf(m.at)}
                strokeWidth="1.5"
                className={call.label === m.label ? "stroke-heading" : "stroke-tertiary"}
                initial={call.label === m.label ? { opacity: 1 } : false}
                animate={call.label === m.label ? { opacity: [1, 0.2, 1, 0.2, 1] } : { opacity: 1 }}
                transition={{ duration: 1.2 }}
              />
              <text x="6" y={yOf(m.at) + 3.5} fontSize="10" className="fill-tertiary">
                {m.label}
              </text>
            </g>
          ))}
        </svg>

        <div className="flex min-w-0 flex-1 flex-col whitespace-nowrap">
          <div className="leading-none">
            <AnimatedNumber
              value={level}
              format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
              className="text-[24px] font-semibold tracking-tight text-heading"
            />
            <span className="ml-0.5 text-[12px] font-medium text-tertiary">m</span>
          </div>
          <div className="mt-1 flex items-center gap-0.5 text-[11px] text-tertiary tabular">
            {rising ? <ArrowUp12Filled /> : <ArrowDown12Filled />}
            In <AnimatedNumber value={inflow} className="font-semibold text-secondary" /> L/s
          </div>

          <div className="mt-auto flex flex-col gap-1">
            {[0, 1].map((p) => (
              <motion.button
                key={p}
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  setLead(p as 0 | 1);
                  st.current.lead = p as 0 | 1;
                }}
                className={cn(
                  "flex h-[22px] cursor-pointer items-center gap-1.5 rounded-lg px-1.5 text-[11px] transition-colors",
                  running[p] ? "bg-fill-tertiary" : "bg-fill-quaternary",
                )}
              >
                <Impeller running={running[p]} />
                <span className="font-semibold text-heading">P{p + 1}</span>
                <motion.span
                  layout
                  className={cn(
                    "rounded px-1 text-[9px] font-semibold uppercase leading-[13px]",
                    lead === p ? "bg-heading text-[var(--widget-surface)]" : "text-tertiary",
                  )}
                >
                  {lead === p ? "Lead" : "Lag"}
                </motion.span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </Widget>
  );
}
