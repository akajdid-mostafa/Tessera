import { AlertUrgent20Filled, CheckmarkCircle20Filled, Dismiss16Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

type Phase = "trapped" | "confirm" | "leveling" | "released";

const START = 252;
const CONFIRM_MS = 5000;
const LEVEL_MS = 3400;
const TWO = { minimumIntegerDigits: 2 } as const;

/** Elevators · small. A live entrapment: the clock counts, the card pulses red, and a guarded two-step rescue levels the car to L7 and opens the doors. */
export function EntrapmentWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("trapped");
  const [secs, setSecs] = useState(START);
  const released = phase === "released";

  useEffect(() => {
    if (released) return;
    const t = window.setInterval(() => setSecs((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [released]);

  useEffect(() => {
    if (phase !== "confirm" && phase !== "leveling") return;
    const t = window.setTimeout(
      () => setPhase(phase === "confirm" ? "trapped" : "released"),
      phase === "confirm" ? CONFIRM_MS : LEVEL_MS,
    );
    return () => window.clearTimeout(t);
  }, [phase]);

  return (
    <Widget
      size="small"
      index={index}
      label="Elevator entrapment"
      glow={{ mode: "pulse", colors: ["#FF453A", "#FF9F0A", "#FF453A"], blur: 18, duration: 1.4 }}
      glowActive={!released}
    >
      <WidgetHeader
        icon={released ? <CheckmarkCircle20Filled /> : <AlertUrgent20Filled />}
        tint={released ? "var(--ios-green)" : "var(--ios-red)"}
        title={released ? "Passengers out" : "Entrapment"}
        subtitle="Car 3 · Harbor Tower"
      />

      <div className="mt-2 flex items-baseline gap-1.5 whitespace-nowrap">
        <span
          className={cn(
            "text-[30px] leading-none font-semibold tracking-tight tabular transition-colors",
            released ? "text-heading" : "text-ios-red",
          )}
        >
          <AnimatedNumber value={Math.floor(secs / 60)} format={TWO} trend={1} />:
          <AnimatedNumber value={secs % 60} format={TWO} trend={1} />
        </span>
        <span className="text-[11px] text-tertiary">{released ? "total" : "elapsed"}</span>
      </div>

      <div className="mt-2 flex items-center gap-1.5 whitespace-nowrap">
        <span className="flex">
          <MemojiAvatar who="f4" size={18} className="ring-[1.5px] ring-[var(--widget-surface)]" />
          <MemojiAvatar who="m2" size={18} className="-ml-1.5 ring-[1.5px] ring-[var(--widget-surface)]" />
        </span>
        <span className="truncate text-[11px] text-secondary">{released ? "2 pax · out at L7" : "2 pax · stuck L7–L8"}</span>
      </div>

      <div className="mt-1 flex h-[14px] items-center gap-1.5 text-[11px] whitespace-nowrap">
        {released ? (
          <span className="truncate text-ios-green">Doors open · car held</span>
        ) : (
          <>
            <span className="relative grid size-2 shrink-0 place-items-center">
              <motion.span
                className="absolute size-2 rounded-full bg-ios-red"
                animate={reduce ? undefined : { scale: [1, 2.2], opacity: [0.6, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
              />
              <span className="size-1.5 rounded-full bg-ios-red" />
            </span>
            <span className="truncate text-tertiary">Intercom open · tech 9 min</span>
          </>
        )}
      </div>

      <div className="mt-auto flex h-6 gap-1.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {phase === "trapped" ? (
            <motion.div key="t" className="w-full" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <Button size="small" block color="danger" variant="solid" onClick={() => setPhase("confirm")}>
                Level to L7
              </Button>
            </motion.div>
          ) : phase === "confirm" ? (
            <motion.div key="c" className="flex w-full gap-1.5" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <Button size="small" shape="circle" variant="filled" color="default" icon={<Dismiss16Regular />} aria-label="Cancel" onClick={() => setPhase("trapped")} />
              <Button size="small" block color="danger" variant="solid" className="relative overflow-hidden" onClick={() => setPhase("leveling")}>
                Confirm rescue
                <motion.span
                  className="absolute bottom-0 left-0 h-[2px] bg-white/70"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: CONFIRM_MS / 1000, ease: "linear" }}
                />
              </Button>
            </motion.div>
          ) : phase === "leveling" ? (
            <motion.div
              key="l"
              className="relative flex h-6 w-full items-center justify-center overflow-hidden rounded-md bg-fill-tertiary text-[11px] font-semibold text-heading"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <motion.span
                className="absolute inset-y-0 left-0 bg-ios-orange/30"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: LEVEL_MS / 1000, ease: "easeInOut" }}
              />
              <span className="relative">Leveling to L7…</span>
            </motion.div>
          ) : (
            <motion.div key="r" className="w-full" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <Button
                size="small"
                block
                variant="filled"
                color="default"
                onClick={() => {
                  setSecs(START);
                  setPhase("trapped");
                }}
              >
                Close incident
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
