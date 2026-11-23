import { Pause16Filled, Play16Filled, Syringe20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

const BAG_ML = 1000;
const RATE = 125; // mL/h, maintenance saline
const START_LEFT = 612;
/** The demo runs the pump about 4x fast so the volume visibly moves. */
const TICK_MS = 700;
const TICK_ML = 0.1;
/** Pumps raise a "channel paused" callback after two minutes. */
const PAUSE_ALARM_S = 120;
const NOW_MIN = 11 * 60 + 52;

const clock = (mins: number) => {
  const m = Math.round(mins) % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Healthcare · small. An infusion pump channel: the bag drains, drops fall at the rate; pause it and the pause timer runs toward a callback. */
export function IvInfusionWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [left, setLeft] = useState(START_LEFT);
  const [running, setRunning] = useState(true);
  const [paused, setPaused] = useState(0);

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setLeft((l) => Math.max(0, Math.round((l - TICK_ML) * 10) / 10)), TICK_MS);
    return () => window.clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (running) return;
    const t = window.setInterval(() => setPaused((p) => p + 1), 1000);
    return () => window.clearInterval(t);
  }, [running]);

  const toggle = () => {
    setRunning((r) => !r);
    setPaused(0);
  };

  const level = left / BAG_ML;
  const emptyAt = clock(NOW_MIN + (left / RATE) * 60);
  const alarm = !running && paused >= PAUSE_ALARM_S;

  return (
    <Widget size="small" index={index} label="IV infusion pump" beam={alarm ? { color: [{ color: "rgba(255,69,58,0)", percent: 0 }, { color: "#FF453A", percent: 70 }], duration: 2.4 } : undefined}>
      <WidgetHeader
        icon={<Syringe20Filled />}
        tint="var(--ios-teal)"
        title="IV Pump"
        subtitle="Bed 12 · Ch A"
        extra={
          <Tooltip title={running ? "Pause channel A" : "Resume infusion"}>
            <Button
              size="small"
              shape="circle"
              aria-label={running ? "Pause infusion" : "Resume infusion"}
              aria-pressed={!running}
              onClick={toggle}
              {...(running
                ? { color: "default" as const, variant: "filled" as const }
                : { type: "primary" as const, className: "bg-ios-orange/15 text-ios-orange hover:bg-ios-orange/25" })}
              icon={
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={running ? "pause" : "play"}
                    className="grid"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 520, damping: 22 }}
                  >
                    {running ? <Pause16Filled /> : <Play16Filled />}
                  </motion.span>
                </AnimatePresence>
              }
            />
          </Tooltip>
        }
      />

      <div className="mt-2 flex min-h-0 flex-1 items-stretch gap-2.5">
        <IvBag level={level} running={running} delay={delay} />

        <div className="flex min-w-0 flex-1 flex-col justify-center whitespace-nowrap leading-tight">
          <div className="text-[11px] text-tertiary">Saline 0.9%</div>
          <div className="flex items-baseline gap-0.5">
            <span className={cn("text-[28px] leading-none font-semibold tracking-tight tabular transition-opacity duration-mid", running ? "text-heading" : "text-heading opacity-50")}>
              {RATE}
            </span>
            <span className="text-[11px] font-medium text-tertiary">mL/h</span>
          </div>
          <div className="mt-1.5 text-[11px] text-tertiary">
            <AnimatedNumber
              value={left}
              format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
              className="font-semibold text-secondary"
            />{" "}
            mL left
          </div>
          <div className="text-[11px] text-tertiary">
            Empty <span className="font-semibold text-secondary tabular">{running ? emptyAt : "--:--"}</span>
          </div>
        </div>
      </div>

      <div className="mt-1.5 flex h-5 items-center gap-1.5">
        <motion.span
          className={cn("size-2 rounded-full", running ? "bg-ios-green" : alarm ? "bg-ios-red" : "bg-ios-orange")}
          animate={{ opacity: running ? [1, 0.4, 1] : [1, 0.2, 1] }}
          transition={{ duration: running ? 2 : 0.9, repeat: Infinity, ease: "easeInOut" }}
        />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={running ? "run" : alarm ? "alarm" : "pause"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className={cn(
              "whitespace-nowrap text-[11px] font-semibold tabular",
              running ? "text-ios-green" : alarm ? "text-ios-red" : "text-ios-orange",
            )}
          >
            {running ? "Infusing" : alarm ? `Callback · ${mmss(paused)}` : `Paused · ${mmss(paused)}`}
          </motion.span>
        </AnimatePresence>
      </div>
    </Widget>
  );
}

/** A soft IV bag on its hanger tab: graduations, a fluid level that drains, the port, a drip chamber with falling drops, and the line. */
function IvBag({ level, running, delay }: { level: number; running: boolean; delay: number }) {
  // Bag interior runs y 11..66 (55 high); the fluid rect is clipped to the bag outline.
  const top = 11;
  const h = 55;
  const fluidY = top + h * (1 - level);
  const clip = `iv-bag-${useId().replace(/:/g, "")}`;
  const bag = "M11 7H29Q35 7 35 13V57Q35 65 28 67H12Q5 65 5 57V13Q5 7 11 7Z";
  return (
    <svg viewBox="0 0 40 100" className="h-full w-[40px] shrink-0 text-tertiary" aria-hidden>
      {/* Hanger tab with its hole. */}
      <path
        d="M16 0.6H24Q26 0.6 26 2.6V7.5H14V2.6Q14 0.6 16 0.6ZM18 3.6a2 1.1 0 0 0 4 0a2 1.1 0 0 0-4 0Z"
        fillRule="evenodd"
        className="fill-fill-secondary"
        stroke="currentColor"
        strokeOpacity={0.45}
        strokeWidth="0.8"
      />

      {/* Bag body and fluid. */}
      <clipPath id={clip}>
        <path d={bag} />
      </clipPath>
      <path d={bag} className="fill-fill-quaternary" />
      <g clipPath={`url(#${clip})`}>
        <motion.rect
          x="0"
          width="40"
          height="80"
          fill="var(--ios-teal)"
          opacity={0.38}
          initial={{ y: top + h }}
          animate={{ y: fluidY }}
          transition={{ type: "spring", stiffness: 60, damping: 16, delay }}
        />
        <motion.line
          x1="0"
          x2="40"
          stroke="var(--ios-teal)"
          strokeWidth="1.2"
          initial={{ y1: top + h, y2: top + h }}
          animate={{ y1: fluidY, y2: fluidY }}
          transition={{ type: "spring", stiffness: 60, damping: 16, delay }}
        />
      </g>
      {/* Heat seal along the top. */}
      <line x1="7" x2="33" y1="10.5" y2="10.5" stroke="currentColor" strokeOpacity={0.3} strokeWidth="0.8" />
      <path d={bag} fill="none" stroke="currentColor" strokeOpacity={0.55} strokeWidth="1.2" />

      {/* Graduations: every 100 mL, longer every 250 mL. */}
      {Array.from({ length: 9 }, (_, i) => (i + 1) / 10).map((g) => (
        <line
          key={g}
          x1="30"
          x2={g === 0.5 ? 24 : 27}
          y1={top + h * g}
          y2={top + h * g}
          stroke="currentColor"
          strokeOpacity={g === 0.5 ? 0.75 : 0.5}
          strokeWidth={g === 0.5 ? 1 : 0.8}
        />
      ))}

      {/* Outlet port and side injection port. */}
      <rect x="17.5" y="66.5" width="5" height="5" rx="1" className="fill-fill" stroke="currentColor" strokeOpacity={0.45} strokeWidth="0.8" />
      <rect x="24" y="66" width="3" height="3.5" rx="1" className="fill-fill-secondary" stroke="currentColor" strokeOpacity={0.35} strokeWidth="0.6" />

      {/* Drip chamber: spike cap, clear barrel, pooled fluid. */}
      <rect x="15" y="71.5" width="10" height="3" rx="1" className="fill-fill" stroke="currentColor" strokeOpacity={0.45} strokeWidth="0.8" />
      <path d="M15.5 74.5H24.5V86.5Q24.5 89.5 21.5 89.5H18.5Q15.5 89.5 15.5 86.5Z" className="fill-fill-quaternary" stroke="currentColor" strokeOpacity={0.55} strokeWidth="1" />
      <path d="M16 84.5H24V86.5Q24 89 21.5 89H18.5Q16 89 16 86.5Z" fill="var(--ios-teal)" opacity={0.5} />
      <rect x="19.3" y="74.5" width="1.4" height="2" fill="currentColor" opacity={0.55} />
      {running ? (
        <motion.circle
          cx="20"
          fill="var(--ios-teal)"
          initial={{ cy: 77.5, r: 0, opacity: 0 }}
          animate={{ cy: [77.5, 77.5, 84.5], r: [0.4, 1.4, 1.2], opacity: [0, 1, 0.3] }}
          transition={{ duration: 1.1, times: [0, 0.45, 1], repeat: Infinity, ease: "easeIn", delay }}
        />
      ) : null}

      {/* Line out of the chamber. */}
      <rect x="18.5" y="89.5" width="3" height="10.5" className="fill-fill-quaternary" stroke="currentColor" strokeOpacity={0.45} strokeWidth="0.7" />
      <rect x="19.4" y="90" width="1.2" height="10" fill="var(--ios-teal)" opacity={running ? 0.55 : 0.25} />
    </svg>
  );
}
