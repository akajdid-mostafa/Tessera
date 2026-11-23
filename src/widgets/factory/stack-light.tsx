import { AlertUrgent20Filled, Checkmark16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { AlarmMark, clock, useInterval } from "./_parts";

type Phase = "fault" | "acked" | "running";
/** How long the technician takes to clear the jam once paged, compressed for the demo. */
const CLEAR_MS = 9000;

const SEGMENTS = [
  { key: "red", color: "var(--ios-red)" },
  { key: "amber", color: "var(--ios-orange)" },
  { key: "green", color: "var(--ios-green)" },
] as const;

/** Factory · small. A press's stack light: the red segment flashes at 1 Hz until acknowledged, a technician is paged, then the tower clears to green. */
export function StackLightWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("fault");
  const [down, setDown] = useState(402);
  const [spm, setSpm] = useState(0);

  useInterval(() => setDown((s) => s + 1), phase === "running" ? null : 1000);
  useInterval(() => setSpm(38 + Math.round(Math.random() * 4)), phase === "running" ? 2000 : null);

  useEffect(() => {
    if (phase !== "acked") return;
    const t = window.setTimeout(() => {
      setPhase("running");
      setSpm(40);
    }, CLEAR_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  const lit = phase === "running" ? "green" : "red";
  const flashing = phase === "fault";

  return (
    <Widget size="small" index={index} label="Press stack light">
      <WidgetHeader
        icon={<AlertUrgent20Filled />}
        tint={phase === "running" ? "var(--ios-indigo)" : "var(--ios-red)"}
        title="Press 04"
        subtitle="Schuler 400 t · Line 2"
      />

      <div className="mt-2 flex min-h-0 flex-1 gap-3">
        {/* The tower: three lenses on a mast. Unlit lenses stay neutral. */}
        <svg viewBox="0 0 26 92" className="h-[92px] w-[26px] shrink-0" aria-hidden>
          <defs>
            <filter id={`sl-glow-${index ?? 0}`} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="2.4" />
            </filter>
          </defs>
          <rect x="11" y="74" width="4" height="12" className="fill-fill" />
          <rect x="5" y="85" width="16" height="5" rx="1.5" className="fill-fill" />
          <rect x="4" y="2" width="18" height="4" rx="2" className="fill-fill" />
          {SEGMENTS.map((s, i) => {
            const on = s.key === lit;
            const y = 7 + i * 22;
            return (
              <g key={s.key}>
                <rect x="3" y={y} width="20" height="20" rx="3" className="fill-fill-tertiary" />
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={
                    on && flashing && !reduce
                      ? { opacity: [1, 0.15, 1] }
                      : { opacity: on ? 1 : 0 }
                  }
                  transition={
                    on && flashing && !reduce
                      ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.35 }
                  }
                >
                  <rect x="3" y={y} width="20" height="20" rx="3" fill={s.color} filter={`url(#sl-glow-${index ?? 0})`} opacity="0.7" />
                  <rect x="3" y={y} width="20" height="20" rx="3" fill={s.color} />
                  <rect x="6" y={y + 3} width="4" height="14" rx="2" fill="#fff" opacity="0.35" />
                </motion.g>
              </g>
            );
          })}
        </svg>

        <div className="flex min-w-0 flex-1 flex-col whitespace-nowrap leading-tight">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={phase === "running" ? "run" : "fault"}
              initial={{ opacity: 0, y: 5, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -5, filter: "blur(3px)" }}
            >
              {phase === "running" ? (
                <>
                  <div className="text-[11px] font-semibold text-secondary">Running</div>
                  <div className="text-[24px] leading-none font-semibold tracking-tight text-heading tabular">
                    {spm}
                    <span className="text-[12px] font-medium text-tertiary"> spm</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-tertiary tabular">Stop lasted {clock(down)}</div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-ios-red">
                    <AlarmMark priority={1} flashing={flashing} size={14} />
                    FAULT
                  </div>
                  <div className="mt-0.5 truncate text-[13px] font-semibold text-heading">Die jam</div>
                  <div className="text-[22px] leading-none font-semibold tracking-tight text-heading tabular">
                    {clock(down)}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-auto">
            <AnimatePresence mode="wait" initial={false}>
              {phase === "fault" ? (
                <motion.div key="ack" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                  <Button
                    size="small"
                    color="danger"
                    variant="solid"
                    block
                    onClick={() => setPhase("acked")}
                    aria-label="Acknowledge fault and page maintenance"
                  >
                    Acknowledge
                  </Button>
                </motion.div>
              ) : phase === "acked" ? (
                <motion.div
                  key="tech"
                  className="flex items-center gap-1.5"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  <span className="relative">
                    <MemojiAvatar who="m6" size={22} alt="Kevin A." />
                    <motion.span
                      className="absolute inset-0 rounded-full ring-2 ring-ios-orange"
                      animate={reduce ? undefined : { scale: [1, 1.35], opacity: [0.8, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                    />
                  </span>
                  <div className="min-w-0 leading-tight">
                    <div className="truncate text-[11px] font-medium text-heading">Kevin A.</div>
                    <div className="text-[10px] text-tertiary">On the way</div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="ok"
                  className={cn("flex items-center gap-1 text-[11px] text-tertiary")}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Checkmark16Filled className="shrink-0" />
                  Cleared by Kevin
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Widget>
  );
}
