import { Dismiss16Regular, Pause16Filled, Play16Filled, Wallet20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

type Phase = "live" | "confirm" | "paused";

const BUDGET = 4_000;
/** 2:40 PM: the share of the day gone, so the share of budget that should be spent. */
const PACE = (14 + 40 / 60) / 24;
/** The bar spans 0 to 150% of the daily budget. */
const SPAN = 1.5;
const CONFIRM_MS = 4000;
const USD = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const;

/** Marketing · small. A campaign overspending its daily budget ticks up live; Pause asks to confirm, then the spend freezes. */
export function BudgetPacingWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [phase, setPhase] = useState<Phase>("live");
  const [spend, setSpend] = useState(4_712);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (phase === "paused") return;
    const t = window.setInterval(() => {
      setSpend((s) => s + 6 + Math.round(Math.random() * 12));
      setTick((n) => n + 1);
    }, 1800);
    return () => window.clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "confirm") return;
    const t = window.setTimeout(() => setPhase("live"), CONFIRM_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  const paused = phase === "paused";
  const over = spend > BUDGET;
  const ratio = spend / BUDGET;
  const alarm = over && !paused;

  return (
    <Widget
      size="small"
      index={index}
      label="Ad budget pacing"
      glow={{ mode: "pulse", colors: ["#FF453A", "#FF9F0A", "#FF453A"], blur: 18, duration: 1.2 }}
      glowActive={alarm && tick % 2 === 1}
    >
      <WidgetHeader
        icon={<Wallet20Filled />}
        tint="var(--ios-blue)"
        title="Holiday Retargeting"
        subtitle={paused ? "Paused at 2:41 PM · Meta" : "Meta Ads · today"}
      />

      <div className="mt-2.5 flex items-baseline-last justify-between gap-1">
        <AnimatedNumber
          value={spend}
          format={USD}
          className={cn(
            "text-[26px] leading-none font-semibold tracking-tight transition-colors duration-300",
            alarm ? "text-ios-red" : "text-heading",
          )}
        />
        <motion.span
          className={cn(
            "mb-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular transition-colors duration-300",
            alarm ? "bg-ios-red/15 text-ios-red" : "bg-fill-secondary text-secondary",
          )}
          animate={alarm ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={alarm ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
        >
          <AnimatedNumber value={ratio} format={{ style: "percent", maximumFractionDigits: 0 }} />
        </motion.span>
      </div>

      <div className="relative mt-2.5 h-1.5 rounded-full bg-fill-secondary">
        <motion.div
          className={cn("absolute inset-y-0 left-0 rounded-full transition-colors duration-300", paused ? "bg-fill" : over ? "bg-ios-red" : "bg-ios-blue")}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(1, ratio / SPAN) * 100}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20, delay: tick === 0 ? delay : 0 }}
        />
        {/* Expected pace and the budget line */}
        <span
          className="absolute -top-[3px] h-3 w-[2px] rounded-full bg-tertiary"
          style={{ left: `${(PACE / SPAN) * 100}%` }}
        />
        <span
          className="absolute -top-[3px] h-3 w-[2px] rounded-full bg-heading ring-2 ring-[var(--widget-surface)]"
          style={{ left: `${(1 / SPAN) * 100}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] leading-tight text-tertiary tabular whitespace-nowrap">
        <span>Pace {Math.round(PACE * 100)}%</span>
        <span className={alarm ? "font-medium text-ios-red" : undefined}>
          {over ? (
            <>
              +<AnimatedNumber value={spend - BUDGET} format={USD} /> over $4K
            </>
          ) : (
            "Within budget"
          )}
        </span>
      </div>

      <div className="relative mt-auto h-8">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={phase}
            className="absolute inset-0 flex gap-1.5"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {phase === "live" ? (
              <Button block color="danger" variant="filled" icon={<Pause16Filled />} onClick={() => setPhase("confirm")}>
                Pause
              </Button>
            ) : phase === "confirm" ? (
              <>
                <Button
                  shape="circle"
                  variant="filled"
                  color="default"
                  icon={<Dismiss16Regular />}
                  aria-label="Keep running"
                  onClick={() => setPhase("live")}
                />
                <Button
                  block
                  color="danger"
                  variant="solid"
                  className="relative overflow-hidden"
                  onClick={() => setPhase("paused")}
                >
                  Confirm pause
                  <motion.span
                    className="absolute bottom-0 left-0 h-[2px] bg-white/70"
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: CONFIRM_MS / 1000, ease: "linear" }}
                  />
                </Button>
              </>
            ) : (
              <Button block variant="filled" color="default" icon={<Play16Filled />} onClick={() => setPhase("live")}>
                Resume
              </Button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Widget>
  );
}
