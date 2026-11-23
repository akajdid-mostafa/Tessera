import { ArrowUp16Filled, VehicleTruckProfile20Filled, Warning16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

const PLAN = 2840;
const COLS = 15;
const DOTS = COLS * 2;
const TICK_MS = 3000;
const VIEWS = {
  sent: { label: "Dispatched", color: "var(--ios-purple)", dot: "bg-ios-purple" },
  left: { label: "Left to dispatch", color: "var(--ios-teal)", dot: "bg-ios-teal" },
} as const;
type View = keyof typeof VIEWS;

/** Logistics · small. Today's dispatch count climbs live along a dotted bar; tap to flip to what is left. */
export function DispatchedTodayWidget({ index }: { index?: number }) {
  const [sent, setSent] = useState(2200);
  const [view, setView] = useState<View>("sent");
  const [entering, setEntering] = useState(true);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setTimeout(() => setEntering(false), (delay + 0.8) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    const t = window.setInterval(() => {
      setSent((s) => (s >= PLAN - 4 ? 2200 : s + 1 + Math.floor(Math.random() * 4)));
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, []);

  const left = PLAN - sent;
  const v = VIEWS[view];
  const value = view === "sent" ? sent : left;
  const filled = Math.round((sent / PLAN) * DOTS);

  return (
    <Widget
      size="small"
      index={index}
      label="Dispatched today"
      pressable
      onPress={() => setView((x) => (x === "sent" ? "left" : "sent"))}
    >
      <WidgetHeader
        icon={<VehicleTruckProfile20Filled />}
        tint={v.color}
        title="Today"
        subtitle={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={view}
              className="inline-block"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              {v.label}
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="mt-2.5 flex items-baseline-last gap-1.5">
        <AnimatedNumber
          value={value}
          trend={view === "sent" ? 1 : -1}
          className="text-[28px] leading-none font-semibold tracking-tight text-heading"
        />
        {view === "sent" ? (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-0.5 inline-flex items-center rounded-full bg-ios-green/15 px-1 py-px text-[10px] font-semibold text-ios-green"
          >
            <ArrowUp16Filled className="size-2.5" />
            15%
          </motion.span>
        ) : (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-0.5 text-[11px] text-tertiary"
          >
            by 22:00
          </motion.span>
        )}
      </div>

      <div className="mt-2.5 grid gap-[4px]" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
        {Array.from({ length: DOTS }, (_, i) => {
          // Dots run down each column, so the bar fills left to right.
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const order = col * 2 + row;
          const on = view === "sent" ? order < filled : order >= filled;
          return (
            <motion.span
              key={i}
              className={cn("aspect-square rounded-full", on ? v.dot : "bg-fill-secondary")}
              initial={{ scale: 0 }}
              animate={{ scale: on ? 1 : 0.7 }}
              transition={{ type: "spring", stiffness: 500, damping: 24, delay: (entering ? delay : 0) + order * 0.012 }}
            />
          );
        })}
      </div>

      <div className="mt-auto flex items-center gap-1 text-[11px]">
        <Tooltip title="US-48211 Denver · US-48230 Dallas · US-48252 Atlanta">
          <span className="flex cursor-default items-center gap-1 font-medium text-ios-orange">
            <Warning16Filled className="size-3.5" />3 delayed
          </span>
        </Tooltip>
        <span className="ml-auto text-tertiary tabular">of {PLAN.toLocaleString("en-US")}</span>
      </div>
    </Widget>
  );
}
