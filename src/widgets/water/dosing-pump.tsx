import { Add16Regular, Drop20Filled, Subtract16Regular } from "@fluentui/react-icons";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { enterDelay, useInterval } from "./_parts";

/* A flow-paced sodium hypochlorite dosing pump, drawn HP-HMI style: grey outlines,
 * the plunger strokes at the real rate. Feed (L/h) = dose (mg/L) × plant flow / product
 * strength (12.5 % NaOCl ≈ 125,000 mg/L). The pump makes 60 L/h at 100 strokes/min. */
const CONC = 125_000;
const PUMP_MAX = 60;
const BULK_L = 10_000;
const SP_MIN = 1.0;
const SP_MAX = 3.0;

const feedOf = (sp: number, mld: number) => (sp * ((mld * 1e6) / 24)) / CONC;

function Pump({ spm }: { spm: number }) {
  const reduce = useReducedMotion();
  const period = 60 / Math.max(1, spm);
  return (
    <svg viewBox="0 0 52 52" className="size-[52px] shrink-0" aria-hidden>
      {/* suction and discharge */}
      <line x1="36" x2="36" y1="36" y2="50" strokeWidth="1.5" className="stroke-tertiary" />
      <line x1="36" x2="36" y1="2" y2="16" strokeWidth="1.5" className="stroke-tertiary" />
      <path d="M33 44 36 40 39 44Z" className="fill-tertiary" />
      <path d="M33 10 36 6 39 10Z" className="fill-tertiary" />
      {/* motor and gearbox */}
      <rect x="2" y="17" width="16" height="18" rx="3" strokeWidth="1.5" className="fill-fill-quaternary stroke-tertiary" />
      {[22, 26, 30].map((y) => (
        <line key={y} x1="5" x2="15" y1={y} y2={y} strokeWidth="1" className="stroke-fill" />
      ))}
      {/* pump head */}
      <circle cx="36" cy="26" r="10" strokeWidth="1.5" className="fill-[var(--widget-surface)] stroke-tertiary" />
      {/* plunger */}
      <motion.g
        animate={reduce ? undefined : { x: [0, 4, 0] }}
        transition={{ duration: period, repeat: Infinity, ease: "easeInOut" }}
      >
        <line x1="18" x2="27" y1="26" y2="26" strokeWidth="2" className="stroke-heading" />
        <rect x="26" y="19" width="3" height="14" rx="1.5" className="fill-heading" />
      </motion.g>
      {/* a slug of product leaving on each stroke */}
      {reduce ? null : (
        <motion.circle
          cx="36"
          r="1.6"
          className="fill-heading"
          initial={{ cy: 15, opacity: 0 }}
          animate={{ cy: [15, 3], opacity: [0, 1, 0] }}
          transition={{ duration: period, repeat: Infinity, ease: "easeOut" }}
        />
      )}
    </svg>
  );
}

/** Water · small. A hypochlorite dosing pump whose plunger strokes at the live rate; step the dose setpoint and feed, stroke rate and days of supply follow. */
export function DosingPumpWidget({ index }: { index?: number }) {
  const [sp, setSp] = useState(2.1);
  const [mld, setMld] = useState(42);
  const [tank, setTank] = useState(6_420);
  const delay = enterDelay(index);

  const feed = feedOf(sp, mld);
  const spm = Math.round((feed / PUMP_MAX) * 100);
  const days = tank / (feed * 24);
  const pct = tank / BULK_L;

  useInterval(() => {
    setMld((m) => Math.round(Math.max(38, Math.min(46, m + (Math.random() - 0.5) * 1.6)) * 10) / 10);
    // One tick stands for six minutes of draw.
    setTank((t) => (t < 2_000 ? 6_420 : t - feedOf(sp, mld) * 0.1));
  }, 1800);

  const step = (d: number) => setSp((s) => Math.round(Math.min(SP_MAX, Math.max(SP_MIN, s + d)) * 10) / 10);

  return (
    <Widget size="small" index={index} label="Hypochlorite dosing pump">
      <WidgetHeader
        icon={<Drop20Filled />}
        tint="var(--ios-teal)"
        title="Hypo Dosing"
        subtitle="CP-2 · Flow-paced"
        extra={
          <Tooltip title="Auto · paced by plant flow">
            <span className="grid size-5 place-items-center rounded-md bg-fill-tertiary text-[11px] font-bold text-secondary">A</span>
          </Tooltip>
        }
      />

      <div className="mt-2 flex items-center gap-2 whitespace-nowrap">
        <Pump spm={spm} />
        <div className="min-w-0 leading-none">
          <div>
            <AnimatedNumber
              value={feed}
              format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
              className="text-[24px] font-semibold tracking-tight text-heading"
            />
            <span className="ml-0.5 text-[12px] font-medium text-tertiary">L/h</span>
          </div>
          <div className="mt-1.5 text-[11px] text-tertiary">
            <AnimatedNumber value={spm} className="font-semibold text-secondary" /> spm ·{" "}
            <AnimatedNumber value={mld} format={{ maximumFractionDigits: 0 }} className="font-semibold text-secondary" /> MLD
          </div>
        </div>
      </div>

      <Tooltip title={`Bulk tank ${Math.round(tank).toLocaleString("en-US")} of ${BULK_L.toLocaleString("en-US")} L`}>
        <div className="mt-2.5">
          <div className="flex justify-between text-[11px] leading-none text-tertiary tabular">
            <span>
              Bulk <span className="font-semibold text-secondary">{Math.round(pct * 100)}%</span>
            </span>
            <span>
              <AnimatedNumber value={days} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} className="font-semibold text-secondary" /> d left
            </span>
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-fill-tertiary">
            <motion.div
              className="h-full rounded-full bg-[var(--ant-color-text-secondary)]"
              initial={{ width: "0%" }}
              animate={{ width: `${pct * 100}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 18, delay }}
            />
          </div>
        </div>
      </Tooltip>

      <div className="mt-auto flex items-center justify-between">
        <Button
          size="small"
          shape="circle"
          variant="filled"
          color="default"
          icon={<Subtract16Regular />}
          aria-label="Lower dose"
          disabled={sp <= SP_MIN}
          onClick={() => step(-0.1)}
        />
        <div className="text-[11px] whitespace-nowrap text-tertiary">
          SP{" "}
          <AnimatedNumber
            value={sp}
            format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
            className="text-[15px] font-semibold text-heading"
          />{" "}
          mg/L
        </div>
        <Button
          size="small"
          shape="circle"
          variant="filled"
          color="default"
          icon={<Add16Regular />}
          aria-label="Raise dose"
          disabled={sp >= SP_MAX}
          onClick={() => step(0.1)}
        />
      </div>
    </Widget>
  );
}
