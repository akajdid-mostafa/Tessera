import { Dismiss16Regular, ShieldLock20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { useInterval } from "./_parts";

type Pos = "open" | "closed";
type Phase = "idle" | "armed" | "travel";
const ARM_S = 5;
const TRAVEL_MS = 6000;

/** Oil & gas · small. A mainline block valve under select-before-operate: arm, confirm within 5 s, then watch the bowtie fill and the flow stop as it travels. */
export function EsdValveWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [pos, setPos] = useState<Pos>("open");
  const [phase, setPhase] = useState<Phase>("idle");
  const [arm, setArm] = useState(ARM_S);
  const [travel, setTravel] = useState(0);
  const [last, setLast] = useState("06:12");

  const target: Pos = pos === "open" ? "closed" : "open";

  useInterval(
    () => {
      if (arm <= 1) {
        setPhase("idle");
        setArm(ARM_S);
      } else setArm(arm - 1);
    },
    phase === "armed" ? 1000 : null,
  );

  useInterval(() => setTravel((t) => Math.min(100, t + 100 / (TRAVEL_MS / 250))), phase === "travel" ? 250 : null);

  useEffect(() => {
    if (phase !== "travel" || travel < 100) return;
    const t = window.setTimeout(() => {
      setPos(target);
      setPhase("idle");
      setTravel(0);
      const now = new Date();
      setLast(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    }, 300);
    return () => window.clearTimeout(t);
  }, [phase, travel, target]);

  // 0 = fully open, 1 = fully closed; drives the bowtie fill and the flow.
  const closedness = phase === "travel" ? (pos === "open" ? travel / 100 : 1 - travel / 100) : pos === "closed" ? 1 : 0;
  const flowing = closedness < 1;
  const label = phase === "travel" ? "TRAVEL" : pos === "open" ? "OPEN" : "CLSD";

  return (
    <Widget size="small" index={index} label="Mainline block valve">
      <WidgetHeader
        icon={<ShieldLock20Filled />}
        tint="var(--ios-teal)"
        title="MLV-122"
        subtitle={`24″ · KP 128.4`}
        extra={
          <span className="grid size-[18px] place-items-center rounded-[5px] text-[10px] font-bold text-secondary ring-1 ring-inset ring-widget-ring" title="Remote control">
            R
          </span>
        }
      />

      {/* Pipe, ISA bowtie and actuator. Hollow = open, solid = closed. */}
      <svg viewBox="0 0 120 40" className="mt-1.5 h-[40px] w-full" aria-hidden>
        <line x1="0" x2="120" y1="28" y2="28" strokeWidth="6" strokeLinecap="round" className="stroke-fill-secondary" />
        {flowing && !reduce ? (
          <motion.line
            x1="0"
            x2="120"
            y1="28"
            y2="28"
            strokeWidth="2"
            strokeDasharray="2 7"
            strokeLinecap="round"
            className="stroke-secondary"
            style={{ opacity: 1 - closedness * 0.8 }}
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: [0, -18] }}
            transition={{ duration: 0.8 + closedness * 2.4, repeat: Infinity, ease: "linear" }}
          />
        ) : null}
        <line x1="60" x2="60" y1="9" y2="28" strokeWidth="1.6" className="stroke-secondary" />
        <rect x="51" y="2" width="18" height="8" rx="2" strokeWidth="1.4" className="fill-[var(--widget-surface)] stroke-secondary" />
        <path d="M46 19 60 28 46 37Z M74 19 60 28 74 37Z" strokeWidth="1.6" strokeLinejoin="round" className="fill-[var(--widget-surface)] stroke-heading" />
        <motion.path
          d="M46 19 60 28 46 37Z M74 19 60 28 74 37Z"
          className="fill-heading"
          initial={false}
          animate={{ opacity: closedness }}
          transition={{ duration: 0.25 }}
        />
      </svg>

      <div className="mt-1 flex items-baseline gap-1.5 whitespace-nowrap">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={label}
            initial={{ opacity: 0, y: 5, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -5, filter: "blur(3px)" }}
            className="text-[20px] leading-none font-semibold tracking-tight text-heading"
          >
            {label}
          </motion.span>
        </AnimatePresence>
        {phase === "travel" ? (
          <AnimatedNumber value={Math.round(closedness * 100)} suffix="%" className="text-[12px] font-medium text-tertiary" />
        ) : null}
      </div>
      <div className="truncate text-[11px] text-tertiary tabular">
        {phase === "travel" ? `Commanded ${target === "closed" ? "CLOSE" : "OPEN"}` : `Last op ${last} · ΔP 0.4 bar`}
      </div>

      <div className="mt-auto">
        <AnimatePresence mode="wait" initial={false}>
          {phase === "armed" ? (
            <motion.div key="arm" className="flex gap-1" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}>
              <Button
                size="small"
                color="orange"
                variant="solid"
                block
                onClick={() => {
                  setTravel(0);
                  setPhase("travel");
                }}
              >
                Confirm {target === "closed" ? "close" : "open"} · {arm}
              </Button>
              <Button size="small" color="default" variant="filled" icon={<Dismiss16Regular />} aria-label="Cancel" onClick={() => setPhase("idle")} />
            </motion.div>
          ) : (
            <motion.div key="sel" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}>
              <Button
                size="small"
                color="default"
                variant="filled"
                block
                disabled={phase === "travel"}
                className={cn(phase === "travel" && "tabular")}
                onClick={() => {
                  setArm(ARM_S);
                  setPhase("armed");
                }}
              >
                {phase === "travel" ? "In travel…" : `Select ${target === "closed" ? "close" : "open"}`}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
