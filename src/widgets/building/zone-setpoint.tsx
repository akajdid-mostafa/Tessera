import { Add16Regular, Checkmark12Filled, HandRight16Regular, Subtract16Regular, Temperature20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

const SCHEDULE_SP = 22;
const LO = 16;
const HI = 30;
const STEP = 0.5;
const R = 30;
const C = 2 * Math.PI * R;
const SWEEP = 0.75;
const ARC = C * SWEEP;

type Phase = "idle" | "pending" | "writing" | "written";

const frac = (t: number) => Math.min(1, Math.max(0, (t - LO) / (HI - LO)));
const clamp = (v: number) => Math.min(26, Math.max(18, v));
const ONE = { minimumFractionDigits: 1, maximumFractionDigits: 1 } as const;

/** Building · small. A zone thermostat: ± stages a setpoint, which writes after a pause (pending → written) and raises an override badge you can release. */
export function ZoneSetpointWidget({ index }: { index?: number }) {
  const [sp, setSp] = useState(SCHEDULE_SP);
  const [draft, setDraft] = useState(SCHEDULE_SP);
  const [phase, setPhase] = useState<Phase>("idle");
  const [temp, setTemp] = useState(23.4);

  // The room slowly answers the committed setpoint.
  useEffect(() => {
    const t = window.setInterval(() => {
      setTemp((x) => {
        const d = sp - x;
        const step = Math.sign(d) * Math.min(Math.abs(d), 0.1);
        return Math.round((x + step) * 10) / 10;
      });
    }, 2400);
    return () => window.clearInterval(t);
  }, [sp]);

  // Debounced write: dial, pause, write, confirm.
  useEffect(() => {
    if (phase === "idle") return;
    const ms = phase === "pending" ? 1100 : phase === "writing" ? 750 : 1600;
    const t = window.setTimeout(() => {
      if (phase === "pending") setPhase("writing");
      else if (phase === "writing") {
        setSp(draft);
        setPhase("written");
      } else setPhase("idle");
    }, ms);
    return () => window.clearTimeout(t);
  }, [phase, draft]);

  const nudge = (d: number) => {
    setDraft((v) => clamp(v + d));
    setPhase("pending");
  };
  const release = () => {
    setDraft(SCHEDULE_SP);
    setPhase("writing");
  };

  const mode = temp > sp + 0.3 ? "Cooling" : temp < sp - 0.3 ? "Heating" : "Satisfied";
  const tint =
    mode === "Cooling" ? "var(--ios-blue)" : mode === "Heating" ? "var(--ios-orange)" : "var(--ios-green)";
  const staged = phase === "pending" || phase === "writing";
  const override = sp !== SCHEDULE_SP && !staged;
  const delay = 0.3 + (index ?? 0) * 0.06;

  return (
    <Widget size="small" index={index} label="Zone setpoint">
      <WidgetHeader
        icon={<Temperature20Filled />}
        tint={tint}
        title="Huddle 3.2"
        subtitle={mode}
        extra={
          <AnimatePresence>
            {override ? (
              <Tooltip title="Operator override · priority 8 · tap to release to schedule">
                <motion.button
                  type="button"
                  onClick={release}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6, filter: "blur(3px)" }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 500, damping: 26 }}
                  className="flex cursor-pointer items-center gap-0.5 rounded-full bg-ios-orange/15 px-1.5 py-0.5 text-[10px] font-semibold text-ios-orange"
                >
                  <HandRight16Regular className="size-3" />
                  OVR
                </motion.button>
              </Tooltip>
            ) : null}
          </AnimatePresence>
        }
      />

      <div className="relative mx-auto mt-1 size-[74px] shrink-0">
        <svg viewBox="0 0 76 76" className="size-full overflow-visible">
          <g transform="rotate(135 38 38)">
            <circle
              cx="38"
              cy="38"
              r={R}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${ARC} ${C}`}
              style={{ stroke: "var(--ant-color-fill-secondary)" }}
            />
            <motion.circle
              cx="38"
              cy="38"
              r={R}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${ARC} ${C}`}
              initial={{ strokeDashoffset: ARC }}
              animate={{ strokeDashoffset: ARC * (1 - frac(temp)) }}
              transition={{ type: "spring", stiffness: 80, damping: 18, delay }}
              style={{ stroke: tint, transition: "stroke 0.6s" }}
            />
          </g>
          {/* Committed setpoint marker. */}
          <Marker at={frac(sp)} delay={delay} />
          {/* Staged value, hollow until written. */}
          <AnimatePresence>
            {staged ? (
              <motion.g
                key="draft"
                initial={{ opacity: 0, rotate: 135 + 270 * frac(sp) }}
                animate={{ opacity: 1, rotate: 135 + 270 * frac(draft) }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                <circle cx="38" cy="38" r="38" fill="transparent" />
                <circle
                  cx={38 + R}
                  cy="38"
                  r="4.5"
                  fill="var(--widget-surface)"
                  strokeWidth="1.5"
                  strokeDasharray="2 1.6"
                  style={{ stroke: "var(--ios-blue)" }}
                />
              </motion.g>
            ) : null}
          </AnimatePresence>
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center leading-none">
            <AnimatedNumber
              value={temp}
              format={ONE}
              suffix="°"
              className="text-[21px] font-semibold tracking-tight text-heading"
            />
            <div className="mt-0.5 text-[10px] text-tertiary">Room</div>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between">
        <Step label="Lower setpoint" onClick={() => nudge(-STEP)} disabled={draft <= 18}>
          <Subtract16Regular />
        </Step>
        <div className="min-w-0 text-center leading-tight">
          <div className="h-[13px] text-[10px] text-tertiary">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={phase}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={cn(
                  "inline-flex items-center gap-0.5",
                  phase === "written" && "text-ios-green",
                  staged && "text-ios-blue",
                )}
              >
                {phase === "pending" ? "Pending" : phase === "writing" ? "Writing…" : phase === "written" ? (
                  <>
                    <Checkmark12Filled /> Written
                  </>
                ) : (
                  "Setpoint"
                )}
              </motion.span>
            </AnimatePresence>
          </div>
          <AnimatedNumber
            value={staged ? draft : sp}
            format={ONE}
            suffix="°"
            className={cn("text-[15px] font-semibold", staged ? "text-ios-blue" : "text-heading")}
          />
        </div>
        <Step label="Raise setpoint" onClick={() => nudge(STEP)} disabled={draft >= 26}>
          <Add16Regular />
        </Step>
      </div>
    </Widget>
  );
}

function Marker({ at, delay }: { at: number; delay: number }) {
  return (
    <motion.g
      initial={{ rotate: 135 }}
      animate={{ rotate: 135 + 270 * at }}
      transition={{ type: "spring", stiffness: 160, damping: 20, delay }}
    >
      <circle cx="38" cy="38" r="38" fill="transparent" />
      <circle
        cx={38 + R}
        cy="38"
        r="4.5"
        strokeWidth="2"
        style={{ fill: "var(--ant-color-text)", stroke: "var(--widget-surface)" }}
      />
    </motion.g>
  );
}

function Step({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.86 }}
      whileHover={{ scale: 1.06 }}
      transition={{ type: "spring", stiffness: 500, damping: 24 }}
      className="grid size-[30px] cursor-pointer place-items-center rounded-full bg-fill-secondary text-heading disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </motion.button>
  );
}
