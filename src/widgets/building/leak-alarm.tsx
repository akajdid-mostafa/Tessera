import { Drop20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

/** ISA-18.2 style: flash only while unacknowledged; isolated holds until the sensor is dry and reset. */
type State = "normal" | "unack" | "ack" | "closing" | "isolated";

const VALVE_X = 104;
const LEAK_X = 44;
const TRIP_AFTER_MS = 2600;
const RETRIP_AFTER_MS = 16000;

/** Building · small. A pantry leak sensor trips: the alarm flashes until acknowledged, Close valve swings the shut-off and stops the flow, and Reset clears it once dry. */
export function LeakAlarmWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [state, setState] = useState<State>("normal");
  const [flow, setFlow] = useState(0);
  const [cycles, setCycles] = useState(0);

  // The leak trips shortly after load, and again a while after each reset.
  useEffect(() => {
    if (state !== "normal") return;
    const t = window.setTimeout(() => setState("unack"), cycles === 0 ? TRIP_AFTER_MS : RETRIP_AFTER_MS);
    return () => window.clearTimeout(t);
  }, [state, cycles]);

  useEffect(() => {
    if (state !== "unack" && state !== "ack") return;
    const t = window.setInterval(() => setFlow(+(13.4 + Math.random() * 1.8).toFixed(1)), 1300);
    setFlow(14.2);
    return () => window.clearInterval(t);
  }, [state]);

  useEffect(() => {
    if (state !== "closing") return;
    const t = window.setTimeout(() => {
      setFlow(0);
      setState("isolated");
    }, 1300);
    return () => window.clearTimeout(t);
  }, [state]);

  const alarm = state !== "normal";
  const leaking = state === "unack" || state === "ack" || state === "closing";
  const closed = state === "closing" || state === "isolated";

  const pill = {
    normal: { text: "Dry", cls: "bg-fill-tertiary text-secondary" },
    unack: { text: "Unacked", cls: "bg-ios-red text-white" },
    ack: { text: "Acked", cls: "bg-ios-red/15 text-ios-red" },
    closing: { text: "Closing", cls: "bg-ios-orange/15 text-ios-orange" },
    isolated: { text: "Isolated", cls: "bg-ios-orange/15 text-ios-orange" },
  }[state];

  const action = {
    normal: null,
    unack: { label: "Acknowledge", danger: true, next: "ack" as State },
    ack: { label: "Close valve", danger: false, next: "closing" as State },
    closing: { label: "Closing…", danger: false, next: "closing" as State },
    isolated: { label: "Reset · sensor dry", danger: false, next: "normal" as State },
  }[state];

  return (
    <Widget
      size="small"
      index={index}
      label="Leak detection"
      glow={{ mode: "pulse", colors: ["#FF453A", "#FF6961", "#FF453A"], blur: 16, duration: 1.2 }}
      glowActive={state === "unack"}
    >
      <WidgetHeader
        icon={<Drop20Filled />}
        tint={alarm ? "var(--ios-red)" : "var(--ios-teal)"}
        title="Leak Detection"
        subtitle={alarm ? "Riser B · L2" : "38 sensors · dry"}
      />

      <div className="mt-2 flex items-baseline-last justify-between">
        <div className="leading-none">
          <AnimatedNumber
            value={flow}
            format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            className={cn("text-[24px] font-semibold tracking-tight", leaking ? "text-ios-red" : "text-heading")}
          />
          <span className="ml-0.5 text-[11px] font-medium text-tertiary">L/min</span>
        </div>
        <motion.span
          key={state}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={state === "unack" && !reduce ? { scale: 1, opacity: [1, 0.35, 1] } : { scale: 1, opacity: 1 }}
          transition={
            state === "unack"
              ? { scale: { type: "spring", stiffness: 500, damping: 24 }, opacity: { duration: 0.9, repeat: Infinity } }
              : { type: "spring", stiffness: 500, damping: 24 }
          }
          className={cn("mb-0.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold", pill.cls)}
        >
          {pill.text}
        </motion.span>
      </div>

      <svg viewBox="0 0 132 44" className="mt-0.5 w-full overflow-visible" aria-hidden>
        {/* Pipe, with water moving through it while the valve is open. */}
        <rect x="0" y="8" width="132" height="10" rx="5" style={{ fill: "var(--ant-color-fill-tertiary)" }} />
        <motion.line
          x1="4"
          x2="128"
          y1="13"
          y2="13"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="3 7"
          style={{ stroke: "var(--ios-blue)" }}
          animate={
            leaking && !closed && !reduce
              ? { opacity: 0.7, strokeDashoffset: [0, -20] }
              : { opacity: leaking ? 0.7 : 0.2, strokeDashoffset: 0 }
          }
          transition={leaking && !closed ? { duration: 0.6, repeat: Infinity, ease: "linear" } : { duration: 0.4 }}
        />

        {/* Shut-off valve: a bowtie with a handle that turns across the pipe to close. */}
        <path
          d={`M${VALVE_X - 8} 6 L${VALVE_X} 13 L${VALVE_X - 8} 20 Z M${VALVE_X + 8} 6 L${VALVE_X} 13 L${VALVE_X + 8} 20 Z`}
          strokeWidth="1.5"
          strokeLinejoin="round"
          style={{
            fill: closed ? "var(--ant-color-text)" : "var(--widget-surface)",
            stroke: "var(--ant-color-text)",
            transition: "fill 0.5s",
          }}
        />
        <motion.line
          x1={VALVE_X - 7}
          x2={VALVE_X + 7}
          y1="1"
          y2="1"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ stroke: "var(--ant-color-text)" }}
          animate={{ rotate: closed ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 60, damping: 12 }}
        />
        <line x1={VALVE_X} x2={VALVE_X} y1="1" y2="6" strokeWidth="1.5" style={{ stroke: "var(--ant-color-text)" }} />

        {/* The weeping joint, the drops and the puddle on the sensor. */}
        <circle cx={LEAK_X} cy="18" r="2" style={{ fill: leaking ? "var(--ios-red)" : "var(--ant-color-fill-secondary)" }} />
        {leaking && !reduce
          ? [0, 0.35, 0.7].map((d) => (
              <motion.circle
                key={d}
                cx={LEAK_X}
                r="1.8"
                style={{ fill: "var(--ios-blue)" }}
                initial={{ cy: 20, opacity: 0 }}
                animate={{ cy: [20, 36], opacity: [0, 1, 0.2] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: d, ease: "easeIn" }}
              />
            ))
          : null}
        <motion.ellipse
          cx={LEAK_X}
          cy="39"
          style={{ fill: "var(--ios-blue)" }}
          initial={{ rx: 0, ry: 0, opacity: 0 }}
          animate={alarm ? { rx: 20, ry: 3.5, opacity: 0.35 } : { rx: 0, ry: 0, opacity: 0 }}
          transition={{ duration: alarm ? 3 : 0.8, ease: "easeOut" }}
        />
        <rect x={LEAK_X - 7} y="40" width="14" height="4" rx="1.5" style={{ fill: alarm ? "var(--ios-red)" : "var(--ant-color-text-tertiary)" }} />
        <text x={LEAK_X + 24} y="44" fontSize="9" style={{ fill: "var(--ant-color-text-tertiary)" }}>
          WLD-B2-07
        </text>
      </svg>

      <div className="mt-auto h-6">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={action ? action.label : "idle"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
          >
            {action ? (
              <Button
                block
                size="small"
                shape="round"
                type={action.danger ? "primary" : "default"}
                danger={action.danger}
                color={action.danger ? undefined : "default"}
                variant={action.danger ? undefined : "filled"}
                loading={state === "closing"}
                onClick={() => {
                  if (state === "closing") return;
                  if (action.next === "normal") setCycles((c) => c + 1);
                  setState(action.next);
                }}
                className="text-[12px] font-semibold"
              >
                {action.label}
              </Button>
            ) : (
              <div className="flex h-6 items-center gap-1.5 text-[11px] text-tertiary">
                <span className="size-1.5 rounded-full bg-ios-green" />
                Last test passed Oct 12
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Widget>
  );
}
