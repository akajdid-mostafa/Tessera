import { Dismiss16Regular, HomeGarage20Filled } from "@fluentui/react-icons";
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useId, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

type Phase = "open" | "confirmClose" | "closing" | "closed" | "confirmOpen" | "opening";

const TRAVEL_S = 4;
const CONFIRM_MS = 4000;
const LEFT_OPEN_WARN = 15;
const OPENING = { x: 14, y: 38, w: 56, h: 40 };

/** Smart home · small. A garage door drawn on the house front that rolls up on entry and has been left open 24 minutes; closing or opening takes a confirm tap, then the panels travel and the percent counts. */
export function GarageDoorWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const clip = `gd-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [phase, setPhase] = useState<Phase>("open");
  const [mins, setMins] = useState(24);
  const [pct, setPct] = useState(0);
  const open = useMotionValue(0);
  const lift = useTransform(open, [0, 1], [0, -OPENING.h + 4]);
  const glow = useTransform(open, [0, 1], [0, 0.22]);

  useMotionValueEvent(open, "change", (v) => setPct(Math.round(v * 100)));

  // Entrance: the door rolls up to where it was left.
  useEffect(() => {
    const c = animate(open, 1, { delay: delay + 0.2, duration: reduce ? 0 : 1.3, ease: [0.3, 0, 0.2, 1] });
    return () => c.stop();
  }, [open, delay, reduce]);

  useEffect(() => {
    if (phase !== "open") return;
    const t = window.setInterval(() => setMins((m) => m + 1), 60_000);
    return () => window.clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === "confirmClose" || phase === "confirmOpen") {
      const t = window.setTimeout(() => setPhase(phase === "confirmClose" ? "open" : "closed"), CONFIRM_MS);
      return () => window.clearTimeout(t);
    }
    if (phase === "closing" || phase === "opening") {
      const closing = phase === "closing";
      let cancelled = false;
      const c = animate(open, closing ? 0 : 1, { duration: reduce ? 0 : TRAVEL_S, ease: "easeInOut" });
      c.then(() => {
        if (cancelled) return;
        if (closing) setPhase("closed");
        else {
          setMins(0);
          setPhase("open");
        }
      });
      return () => {
        cancelled = true;
        c.stop();
      };
    }
  }, [phase, open, reduce]);

  const moving = phase === "closing" || phase === "opening";
  const isOpen = phase === "open" || phase === "confirmClose";
  const warn = isOpen && mins >= LEFT_OPEN_WARN;

  return (
    <Widget size="small" index={index} label="Garage door">
      <WidgetHeader
        icon={<HomeGarage20Filled />}
        tint={warn ? "var(--ios-orange)" : "var(--ios-teal)"}
        title="Garage Door"
        subtitle={warn ? "Left open" : moving ? "Moving" : isOpen ? "Open" : "Secure"}
      />

      <div className="mt-2 flex items-start gap-2.5">
        <svg viewBox="0 0 84 80" width="80" height="76" className="shrink-0" aria-hidden>
          <defs>
            <clipPath id={clip}>
              <rect x={OPENING.x} y={OPENING.y} width={OPENING.w} height={OPENING.h} />
            </clipPath>
          </defs>
          <path d="M3 31 42 7l39 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: "var(--ant-color-text-tertiary)" }} />
          <rect x="8" y="28" width="68" height="50" style={{ fill: "var(--ant-color-fill-quaternary)" }} />
          <rect x={OPENING.x} y={OPENING.y} width={OPENING.w} height={OPENING.h} style={{ fill: "var(--ant-color-fill-secondary)" }} />
          <motion.rect x={OPENING.x} y={OPENING.y} width={OPENING.w} height={OPENING.h} style={{ fill: "var(--ios-yellow)", opacity: glow }} />
          {/* The car parked inside. */}
          <g style={{ fill: "var(--ant-color-text-tertiary)" }}>
            <path d="M21 73v-6.5l5.5-6.5h21l7 6.5H62a1 1 0 0 1 1 1V73Z" />
            <circle cx="29" cy="74" r="3.2" />
            <circle cx="55" cy="74" r="3.2" />
          </g>
          <g clipPath={`url(#${clip})`}>
            <motion.g style={{ y: lift }}>
              {Array.from({ length: 5 }, (_, i) => (
                <g key={i}>
                  <rect
                    x={OPENING.x}
                    y={OPENING.y + i * 8}
                    width={OPENING.w}
                    height="7.6"
                    rx="1"
                    strokeWidth="0.6"
                    style={{ fill: "var(--widget-surface)", stroke: "var(--ant-color-text-tertiary)" }}
                  />
                  <line
                    x1={OPENING.x + 6}
                    x2={OPENING.x + OPENING.w - 6}
                    y1={OPENING.y + i * 8 + 3.8}
                    y2={OPENING.y + i * 8 + 3.8}
                    strokeWidth="0.6"
                    strokeDasharray="8 3"
                    style={{ stroke: "var(--ant-color-text-tertiary)", opacity: 0.6 }}
                  />
                </g>
              ))}
              <rect x={OPENING.x + OPENING.w / 2 - 5} y={OPENING.y + 34} width="10" height="2" rx="1" style={{ fill: "var(--ant-color-text-secondary)" }} />
            </motion.g>
          </g>
          <line x1="2" x2="82" y1="78" y2="78" strokeWidth="1.5" style={{ stroke: "var(--ant-color-text-tertiary)" }} />
        </svg>

        <div className="min-w-0 flex-1 pt-1 leading-tight whitespace-nowrap">
          <div className={cn("text-[22px] leading-none font-semibold tracking-tight", warn ? "text-ios-orange" : "text-heading")}>
            {moving ? (
              <>
                <AnimatedNumber value={pct} />
                <span className="text-[12px] font-medium text-tertiary">%</span>
              </>
            ) : isOpen ? (
              "Open"
            ) : (
              "Closed"
            )}
          </div>
          <div className={cn("mt-1.5 truncate text-[11px]", warn ? "text-ios-orange" : "text-tertiary")}>
            {moving ? (phase === "closing" ? "Closing…" : "Opening…") : isOpen ? (
              <span className="tabular">
                <AnimatedNumber value={mins} /> min
              </span>
            ) : (
              "Auto-lock on"
            )}
          </div>
          <div className="mt-0.5 truncate text-[11px] text-tertiary">Car inside</div>
        </div>
      </div>

      <div className="mt-auto flex h-6 gap-1.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {phase === "confirmClose" || phase === "confirmOpen" ? (
            <motion.div key="c" className="flex w-full gap-1.5" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <Button
                size="small"
                shape="circle"
                variant="filled"
                color="default"
                icon={<Dismiss16Regular />}
                aria-label="Cancel"
                onClick={() => setPhase(phase === "confirmClose" ? "open" : "closed")}
              />
              <Button
                size="small"
                block
                type="primary"
                className="relative overflow-hidden"
                onClick={() => setPhase(phase === "confirmClose" ? "closing" : "opening")}
              >
                {phase === "confirmClose" ? "Confirm close" : "Confirm open"}
                <motion.span
                  className="absolute bottom-0 left-0 h-[2px] bg-white/70"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: CONFIRM_MS / 1000, ease: "linear" }}
                />
              </Button>
            </motion.div>
          ) : moving ? (
            <motion.div
              key="m"
              className="relative flex h-6 w-full items-center justify-center overflow-hidden rounded-md bg-fill-tertiary text-[11px] font-semibold text-secondary"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <motion.span className="absolute inset-y-0 left-0 bg-ios-teal/25" style={{ width: `${phase === "closing" ? 100 - pct : pct}%` }} />
              <span className="relative">Obstruction sensor on</span>
            </motion.div>
          ) : (
            <motion.div key={phase} className="w-full" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <Button
                size="small"
                block
                variant="filled"
                color={warn ? "orange" : "default"}
                onClick={() => setPhase(isOpen ? "confirmClose" : "confirmOpen")}
              >
                {isOpen ? "Close door" : "Open door"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
