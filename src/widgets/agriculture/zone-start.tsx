import { Add16Regular, Dismiss16Regular, Drop20Filled, Play16Filled, Stop16Filled, Subtract16Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { Button } from "@/registry/antuikit/ui/button";

const DURATIONS = [10, 15, 20, 30, 45, 60];
/** Drip block: 9.6 mm/h applied, 44 m³/h through the valve. */
const MM_PER_H = 9.6;
const M3_PER_H = 44;
const CONFIRM_MS = 5000;
const TWO = { minimumIntegerDigits: 2 } as const;

type Phase = "idle" | "confirm" | "running";

/** Agriculture · small. Pick a run time, start, then confirm; the valve opens and counts down with falling drops. */
export function ZoneStartWidget({ index }: { index?: number }) {
  const [di, setDi] = useState(3);
  const [phase, setPhase] = useState<Phase>("idle");
  const [left, setLeft] = useState(0);
  const minutes = DURATIONS[di];

  // An unanswered confirm falls back to idle.
  useEffect(() => {
    if (phase !== "confirm") return;
    const t = window.setTimeout(() => setPhase("idle"), CONFIRM_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "running") return;
    const t = window.setInterval(() => {
      setLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === "running" && left === 0) setPhase("idle");
  }, [phase, left]);

  const running = phase === "running";
  const total = minutes * 60;

  return (
    <Widget
      size="small"
      index={index}
      label="Irrigation zone"
      glow={{ mode: "pulse", colors: ["#0A84FF", "#40C8E0", "#0A84FF"], blur: 18, duration: 2.4 }}
      glowActive={running}
    >
      <AnimatePresence>{running ? <Rain key="rain" /> : null}</AnimatePresence>
      <WidgetHeader
        icon={<Drop20Filled />}
        tint="var(--ios-blue)"
        title="Zone 4"
        subtitle={running ? `Open · ${M3_PER_H} m³/h` : "Almonds · drip"}
      />

      <div className="relative mt-2.5 h-[48px]">
        <AnimatePresence mode="popLayout" initial={false}>
          {running ? (
            <motion.div
              key="run"
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              className="absolute inset-0 text-center"
            >
              <div className="flex items-baseline justify-center text-[28px] leading-none font-semibold tracking-tight text-heading">
                <AnimatedNumber value={Math.floor(left / 60)} format={TWO} trend={-1} />
                <span className="px-px text-tertiary">:</span>
                <AnimatedNumber value={left % 60} format={TWO} trend={-1} className="text-ios-blue" />
              </div>
              <div className="mx-auto mt-2 h-1 w-full overflow-hidden rounded-full bg-fill-secondary">
                <motion.div
                  className="h-full rounded-full bg-ios-blue"
                  animate={{ width: `${(1 - left / total) * 100}%` }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="set"
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              className="absolute inset-0"
            >
              <div className="flex items-center justify-between">
                <Button
                  size="small"
                  shape="circle"
                  variant="filled"
                  color="default"
                  icon={<Subtract16Regular />}
                  aria-label="Shorter"
                  disabled={di === 0 || phase === "confirm"}
                  onClick={() => setDi((i) => Math.max(0, i - 1))}
                />
                <div className="text-[28px] leading-none font-semibold tracking-tight text-heading">
                  <AnimatedNumber value={minutes} />
                  <span className="ml-0.5 text-[12px] font-medium text-tertiary">min</span>
                </div>
                <Button
                  size="small"
                  shape="circle"
                  variant="filled"
                  color="default"
                  icon={<Add16Regular />}
                  aria-label="Longer"
                  disabled={di === DURATIONS.length - 1 || phase === "confirm"}
                  onClick={() => setDi((i) => Math.min(DURATIONS.length - 1, i + 1))}
                />
              </div>
              <div className="mt-1.5 text-center text-[11px] whitespace-nowrap text-tertiary tabular">
                ≈ <AnimatedNumber value={(minutes / 60) * MM_PER_H} format={{ maximumFractionDigits: 1 }} /> mm ·{" "}
                <AnimatedNumber value={Math.round((minutes / 60) * M3_PER_H)} /> m³
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative mt-auto">
        {phase === "idle" ? (
          <Button block type="primary" icon={<Play16Filled />} onClick={() => setPhase("confirm")}>
            Start
          </Button>
        ) : phase === "confirm" ? (
          <div className="flex gap-1.5">
            <Button shape="circle" variant="filled" color="default" icon={<Dismiss16Regular />} aria-label="Cancel" onClick={() => setPhase("idle")} />
            <Button
              block
              color="orange"
              variant="solid"
              className="relative overflow-hidden"
              onClick={() => {
                setLeft(total);
                setPhase("running");
              }}
            >
              Confirm {minutes}m
              <motion.span
                className="absolute bottom-0 left-0 h-[2px] bg-white/70"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: CONFIRM_MS / 1000, ease: "linear" }}
              />
            </Button>
          </div>
        ) : (
          <Button block variant="filled" color="danger" icon={<Stop16Filled />} onClick={() => setPhase("idle")}>
            Stop
          </Button>
        )}
      </div>
    </Widget>
  );
}

/** Slow drops falling behind the content while the valve is open. */
function Rain() {
  const drops = [12, 30, 51, 68, 84, 22, 76, 42];
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {drops.map((x, i) => (
        <motion.span
          key={i}
          className="absolute top-0 h-2.5 w-[3px] rounded-full bg-ios-blue/30"
          style={{ left: `${x}%` }}
          initial={{ y: -12 }}
          animate={{ y: 190 }}
          transition={{ duration: 2.4 + (i % 3) * 0.5, repeat: Infinity, ease: "easeIn", delay: i * 0.35 }}
        />
      ))}
    </motion.div>
  );
}
