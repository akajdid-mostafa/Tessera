import { Checkmark16Filled, Cube20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber, type AnimatedNumberProps } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { AlarmMark, enterDelay, useInterval } from "./_parts";

type Part = "pc1" | "cv01" | "cv02";
type Stat = { label: string; value: number; unit: string; format?: AnimatedNumberProps["format"]; warn?: boolean };

const TARGET = 6_500; // t/h
const SHIFT_PLAN = 78_000; // t, 12 h shift
const DRIFT_LIMIT = 30; // mm belt tracking offset
const T0 = 13 * 60 + 22;
const SHIFT_START = 6 * 60;

const CV01 = "M100 118 232 50";
const CV02 = "M242 42 326 32";

const PARTS: Record<Part, { name: string; spec: string }> = {
  pc1: { name: "PC1 · Gyratory crusher", spec: "Superior 60-89 · CSS 165 mm" },
  cv01: { name: "CV-01 · Crusher discharge", spec: "1,800 mm belt · 2 × 750 kW · 412 m" },
  cv02: { name: "CV-02 · Stockpile feed", spec: "1,800 mm belt · 1 × 900 kW · 268 m" },
};

const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(Math.floor(m % 60)).padStart(2, "0")}`;

/** Mining · large. The primary crushing circuit in section: a truck tips into the gyratory, ore rides CV-01 and CV-02 onto the stockpile, throughput and shift tonnes tick live, a belt-drift alarm on CV-02 waits for acknowledgement, and tapping a unit shows its readings. */
export function CrusherCircuitWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [tph, setTph] = useState(6_240);
  const [now, setNow] = useState(T0);
  const [shift, setShift] = useState(45_180);
  const [drift, setDrift] = useState(38);
  const [sel, setSel] = useState<Part>("cv02");
  const [acked, setAcked] = useState(false);
  const delay = enterDelay(index);

  useInterval(() => {
    const next = Math.round(Math.min(6_520, Math.max(5_980, tph + (Math.random() - 0.5) * 160)) / 10) * 10;
    setTph(next);
    setShift((s) => Math.round(s + next / 60));
    setNow((n) => n + 1);
    setDrift((d) => Math.min(44, Math.max(33, d + Math.round((Math.random() - 0.5) * 4))));
  }, 2000);

  const planToDate = ((now - SHIFT_START) / 60) * TARGET;
  const power = Math.round(tph * 0.082);
  const alarm = drift > DRIFT_LIMIT;
  const lag = (v: number, k: number) => Math.round(v * k);

  const stats: Record<Part, Stat[]> = {
    pc1: [
      { label: "Feed", value: tph, unit: "t/h" },
      { label: "Power", value: power, unit: "kW" },
      { label: "Bowl level", value: 0.62, unit: "", format: { style: "percent" } },
    ],
    cv01: [
      { label: "Belt load", value: lag(tph, 1), unit: "t/h" },
      { label: "Speed", value: 4.5, unit: "m/s", format: { minimumFractionDigits: 1 } },
      { label: "Drive", value: lag(tph, 0.181), unit: "kW" },
    ],
    cv02: [
      { label: "Belt load", value: lag(tph, 0.99), unit: "t/h" },
      { label: "Speed", value: 4.2, unit: "m/s", format: { minimumFractionDigits: 1 } },
      { label: "Tracking", value: drift, unit: "mm", warn: alarm },
    ],
  };

  const flow = (d: string, dur: number) =>
    reduce ? null : (
      <motion.path
        d={d}
        fill="none"
        strokeWidth="3"
        strokeDasharray="3 5"
        strokeLinecap="round"
        className="pointer-events-none stroke-[var(--ant-color-text-secondary)]"
        initial={{ strokeDashoffset: 0 }}
        animate={{ strokeDashoffset: [0, -16] }}
        transition={{ duration: dur, repeat: Infinity, ease: "linear" }}
      />
    );

  const hit = (p: Part) => ({
    onClick: () => setSel(p),
    className: "cursor-pointer",
    role: "button" as const,
    "aria-label": PARTS[p].name,
  });

  return (
    <Widget size="large" index={index} label="Primary crushing circuit">
      <WidgetHeader
        icon={<Cube20Filled />}
        tint={alarm && !acked ? "var(--ios-orange)" : "var(--ios-indigo)"}
        title="Primary Crushing"
        subtitle="PC1 → CV-01 → CV-02 → CS-01"
        extra={
          <span className="flex items-center gap-1.5 rounded-full bg-fill-tertiary px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-secondary">
            <span className="relative flex size-1.5">
              {!reduce ? <span className="absolute inset-0 animate-ping rounded-full bg-[var(--ant-color-text-secondary)] opacity-60" /> : null}
              <span className="relative size-1.5 rounded-full bg-[var(--ant-color-text-secondary)]" />
            </span>
            Running · {hhmm(now)}
          </span>
        }
      />

      <div className="mt-2 flex items-baseline-last justify-between whitespace-nowrap">
        <div className="leading-none">
          <AnimatedNumber value={tph} className="text-[30px] font-semibold tracking-tight text-heading" />
          <span className="text-[12px] font-medium text-tertiary"> t/h</span>
          <div className="mt-1 text-[11px] text-tertiary tabular">
            Target {TARGET.toLocaleString("en-US")} · <span className="font-medium text-secondary">{Math.round((tph / TARGET) * 100)}%</span>
          </div>
        </div>
        <div className="text-right text-[11px] leading-tight text-tertiary">
          <div className="font-semibold text-secondary tabular">
            <AnimatedNumber value={power} /> kW
          </div>
          <div>of 750 kW</div>
        </div>
      </div>

      {/* The circuit in section. Units are tappable. */}
      <svg viewBox="0 0 376 150" className="mt-2 h-[150px] w-full overflow-visible" aria-label="Crushing circuit">
        <path d="M0 40H54V132H376V150H0Z" className="fill-fill-quaternary" />
        <line x1="0" x2="54" y1="40" y2="40" strokeWidth="1" className="stroke-fill" />

        {/* Haul truck tipping into the dump pocket. */}
        <g transform="translate(8 20)">
          <rect x="0" y="8" width="10" height="9" rx="1.5" className="fill-[var(--ant-color-text-quaternary)]" />
          <circle cx="8" cy="18" r="3" className="fill-heading" />
          <circle cx="36" cy="18" r="3" className="fill-heading" />
          <motion.g
            style={{ originX: 1, originY: 1 }}
            animate={reduce ? undefined : { rotate: [0, 0, 32, 32, 0] }}
            transition={{ duration: 7, times: [0, 0.35, 0.5, 0.75, 0.9], repeat: Infinity, ease: "easeInOut", delay }}
          >
            <path d="M11 4H44L42 16H13Z" className="fill-[var(--ant-color-text-tertiary)]" />
            <path d="M14 4Q27-3 41 4Z" className="fill-[var(--ant-color-text-secondary)]" />
          </motion.g>
        </g>
        {!reduce ? (
          <motion.path
            d="M52 32Q60 40 66 56"
            fill="none"
            strokeWidth="3"
            strokeDasharray="2 3"
            strokeLinecap="round"
            className="stroke-[var(--ant-color-text-secondary)]"
            initial={{ strokeDashoffset: 0 }}
            animate={{ opacity: [0, 0, 1, 1, 0], strokeDashoffset: [0, -20] }}
            transition={{
              opacity: { duration: 7, times: [0, 0.45, 0.52, 0.74, 0.8], repeat: Infinity, delay },
              strokeDashoffset: { duration: 0.5, repeat: Infinity, ease: "linear" },
            }}
          />
        ) : null}

        {/* PC1: dump pocket, gyratory with gyrating mantle, surge pocket, apron feeder. */}
        <g {...hit("pc1")}>
          <rect x="54" y="38" width="46" height="84" fill="transparent" />
          <path d="M56 40H98L92 58H62Z" className="fill-fill-tertiary" />
          <path d="M58 58H96L92 100H62Z" className={cn(sel === "pc1" ? "fill-ios-blue/20" : "fill-fill-secondary")} />
          <path d="M64 60H90L85 96H69Z" className="fill-[var(--widget-surface)]" />
          <motion.path
            d="M77 64 85 94H69Z"
            className="fill-[var(--ant-color-text-quaternary)]"
            animate={reduce ? undefined : { x: [-1.2, 1.2, -1.2] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
          />
          <line x1="58" x2="96" y1="58" y2="58" strokeWidth="2" className="stroke-[var(--ant-color-text-tertiary)]" />
          <path d="M66 100H88L84 112H70Z" className="fill-fill-tertiary" />
          <line x1="66" x2="106" y1="116" y2="116" strokeWidth="4" strokeLinecap="round" className="stroke-fill-secondary" />
          {sel === "pc1" ? <rect x="55" y="39" width="44" height="82" rx="4" fill="none" strokeWidth="1.5" className="stroke-[var(--ios-blue)]" /> : null}
        </g>
        <text x="77" y="144" textAnchor="middle" fontSize="9" fontWeight="600" className="fill-secondary">
          PC1
        </text>

        {/* CV-01 up to the transfer tower. */}
        <g {...hit("cv01")}>
          <path d={CV01} fill="none" strokeWidth="16" stroke="transparent" />
          <path d={CV01} fill="none" strokeWidth="6" strokeLinecap="round" className={sel === "cv01" ? "stroke-[var(--ios-blue)]" : "stroke-fill-secondary"} />
        </g>
        {flow(CV01, 0.7)}
        {[0.2, 0.45, 0.7].map((k) => (
          <line key={k} x1={100 + 132 * k} x2={100 + 132 * k} y1={118 - 68 * k + 3} y2="132" strokeWidth="1.2" className="stroke-fill" />
        ))}
        <text x="212" y="82" textAnchor="middle" fontSize="9" fontWeight="600" className="fill-secondary">
          CV-01
        </text>

        <rect x="228" y="36" width="16" height="96" rx="1.5" className="fill-fill-tertiary" />
        <text x="236" y="30" textAnchor="middle" fontSize="9" className="fill-tertiary">
          TT-1
        </text>

        {/* CV-02 over the stockpile, with its drift alarm. */}
        <g {...hit("cv02")}>
          <path d={CV02} fill="none" strokeWidth="16" stroke="transparent" />
          <path d={CV02} fill="none" strokeWidth="6" strokeLinecap="round" className={sel === "cv02" ? "stroke-[var(--ios-blue)]" : "stroke-fill-secondary"} />
        </g>
        {flow(CV02, 0.75)}
        <text x="276" y="26" textAnchor="middle" fontSize="9" fontWeight="600" className="fill-secondary">
          CV-02
        </text>
        {alarm ? (
          <g transform="translate(294 12)">
            <motion.g animate={!acked && !reduce ? { opacity: [1, 0.22, 1] } : { opacity: 1 }} transition={!acked ? { duration: 1, repeat: Infinity } : { duration: 0.2 }}>
              <path d="M0-6.5 6 4.5H-6Z" fill="var(--ios-orange)" stroke="var(--ios-orange)" strokeWidth="1" strokeLinejoin="round" />
              <text x="0" y="3.4" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#000">
                2
              </text>
            </motion.g>
          </g>
        ) : null}

        {/* CS-01 pile under the stacker. */}
        {!reduce ? (
          <motion.line
            x1="326"
            x2="326"
            y1="35"
            y2="66"
            strokeWidth="2.5"
            strokeDasharray="2 3"
            strokeLinecap="round"
            className="stroke-[var(--ant-color-text-secondary)]"
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: [0, -10] }}
            transition={{ duration: 0.35, repeat: Infinity, ease: "linear" }}
          />
        ) : null}
        <motion.path
          d="M276 132 324 66Q326 64 328 66L376 132Z"
          className="fill-[var(--ant-color-text-quaternary)]"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          style={{ originY: 1 }}
          transition={{ type: "spring", stiffness: 80, damping: 16, delay: delay + 0.2 }}
        />
        <text x="326" y="144" textAnchor="middle" fontSize="9" fontWeight="600" className="fill-secondary">
          CS-01
        </text>
      </svg>

      <div className="mt-2 rounded-2xl bg-fill-quaternary px-3 py-2">
        <div className="flex h-6 items-center gap-1.5 whitespace-nowrap">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={sel}
              className="flex min-w-0 items-baseline gap-1.5"
              initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(3px)" }}
            >
              <span className="truncate text-[13px] font-semibold text-heading">{PARTS[sel].name}</span>
            </motion.div>
          </AnimatePresence>
          {sel === "cv02" && alarm ? (
            <div className="ml-auto flex items-center gap-1.5">
              <AlarmMark priority={2} flashing={!acked} size={16} />
              {acked ? (
                <span className="flex items-center gap-0.5 text-[11px] font-medium text-tertiary">
                  <Checkmark16Filled className="size-3.5" /> Drift acked
                </span>
              ) : (
                <Button size="small" color="orange" variant="filled" onClick={() => setAcked(true)}>
                  Ack drift
                </Button>
              )}
            </div>
          ) : (
            <span className="ml-auto truncate text-[11px] text-tertiary">{PARTS[sel].spec}</span>
          )}
        </div>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {stats[sel].map((s) => (
            <div key={s.label} className="min-w-0 leading-tight whitespace-nowrap">
              <div className="text-[10px] text-tertiary">{s.label}</div>
              <div className={cn("text-[15px] font-semibold", s.warn ? "text-ios-orange" : "text-heading")}>
                <AnimatedNumber value={s.value} format={s.format} />
                {s.unit ? <span className="text-[10px] font-medium text-tertiary"> {s.unit}</span> : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto">
        <div className="flex items-baseline justify-between text-[11px] whitespace-nowrap text-tertiary tabular">
          <span>
            Shift A <AnimatedNumber value={shift} className="font-semibold text-heading" /> t
          </span>
          <span>
            plan to date {Math.round(planToDate).toLocaleString("en-US")} · <span className="font-medium text-secondary">{Math.round((shift / planToDate) * 100)}%</span>
          </span>
        </div>
        <div className="relative mt-1.5 h-1.5 rounded-full bg-fill-secondary">
          <motion.div
            className="h-full rounded-full bg-[var(--ant-color-text-secondary)]"
            initial={{ width: 0 }}
            animate={{ width: `${(shift / SHIFT_PLAN) * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 24, delay: shift === 45_180 ? delay + 0.3 : 0 }}
          />
          <span
            className="absolute -top-1 h-3.5 w-[2px] -translate-x-1/2 rounded-full bg-heading"
            style={{ left: `${(planToDate / SHIFT_PLAN) * 100}%` }}
            title="Plan to date"
          />
        </div>
      </div>
    </Widget>
  );
}
