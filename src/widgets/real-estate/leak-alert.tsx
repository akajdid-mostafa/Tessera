import { Checkmark16Filled, Drop20Filled, VehicleCar16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

/** Seconds since the tenant reported the leak when the widget loads. */
const REPORTED_AGO = 14 * 60 + 32;
/** The plumber's drive, in seconds; the demo runs it at 20× so it visibly counts down. */
const DRIVE = 18 * 60;
const SPEED = 20;
const TWO = { minimumIntegerDigits: 2 } as const;

type Phase = "open" | "dispatched";

/** Real estate · small. A tenant-reported leak in alarm red with a running timer; Dispatch turns it into a plumber's ETA that counts down to on-site. */
export function LeakAlertWidget({ index }: { index?: number }) {
  const [status, setStatus] = useState<Phase>("open");
  const [since, setSince] = useState(REPORTED_AGO);
  const [eta, setEta] = useState(DRIVE);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => setSince((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (status !== "dispatched") return;
    const t = window.setInterval(() => setEta((s) => Math.max(0, s - SPEED)), 1000);
    return () => window.clearInterval(t);
  }, [status]);

  const phase = status === "dispatched" && eta === 0 ? "onsite" : status;

  const open = phase === "open";
  const timer = open ? since : eta;
  const mm = Math.floor(timer / 60);
  const ss = timer % 60;
  const travelled = 1 - eta / DRIVE;

  return (
    <Widget
      size="small"
      index={index}
      label="Water leak alert"
      glow={{ mode: "pulse", colors: ["#FF453A", "#FF9F0A", "#FF453A"], blur: 18, duration: 1.4 }}
      glowActive={open}
    >
      <WidgetHeader
        icon={
          <motion.span
            className="grid"
            animate={open ? { y: [0, 2, 0], scale: [1, 0.92, 1] } : { y: 0, scale: 1 }}
            transition={open ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
          >
            <Drop20Filled />
          </motion.span>
        }
        tint={open ? "var(--ios-red)" : phase === "dispatched" ? "var(--ios-orange)" : "var(--ios-green)"}
        title="Water Leak"
        subtitle="Unit 4A · Kitchen"
      />

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "mt-2.5 truncate text-[11px] font-medium",
            open ? "text-ios-red" : phase === "dispatched" ? "text-ios-orange" : "text-ios-green",
          )}
        >
          {open ? "Unassigned for" : phase === "dispatched" ? "Plumber arrives in" : "Plumber on site"}
        </motion.div>
      </AnimatePresence>

      {phase === "onsite" ? (
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 18 }}
          className="flex items-center gap-1 text-[22px] leading-none font-semibold tracking-tight text-heading"
        >
          <Checkmark16Filled className="size-6 text-ios-green" />
          Valve off
        </motion.div>
      ) : (
        <div
          className={cn(
            "flex items-baseline text-[28px] leading-none font-semibold tracking-tight",
            open ? "text-ios-red" : "text-heading",
          )}
        >
          <AnimatedNumber value={mm} format={TWO} trend={open ? 1 : -1} />
          <span className="px-px opacity-60">:</span>
          <AnimatedNumber value={ss} format={TWO} trend={open ? 1 : -1} />
        </div>
      )}

      <AnimatePresence mode="popLayout" initial={false}>
        {open ? (
          <motion.div
            key="reporter"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0, transition: { delay: delay + 0.2 } }}
            exit={{ opacity: 0, x: -8 }}
            className="mt-1.5 flex items-center gap-1.5 text-[11px] text-tertiary"
          >
            <MemojiAvatar who="Sarah Allen" size={18} />
            <span className="truncate">
              Reported by <span className="font-medium text-secondary">Sarah A.</span>
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="tech"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className="mt-1.5"
          >
            <div className="flex items-center gap-1.5 text-[11px] text-tertiary">
              <MemojiAvatar who="Mike Turner" size={18} />
              <span className="truncate">
                <span className="font-medium text-secondary">Mike T.</span> · Plumber
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-auto">
        {open ? (
          <Button
            block
            size="small"
            shape="round"
            type="primary"
            danger
            onClick={() => setStatus("dispatched")}
            className="font-semibold"
          >
            Dispatch plumber
          </Button>
        ) : (
          <div className="relative h-6">
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-fill-secondary">
              <motion.div
                className={cn("h-full rounded-full", phase === "onsite" ? "bg-ios-green" : "bg-ios-orange")}
                initial={{ width: 0 }}
                animate={{ width: `${travelled * 100}%` }}
                transition={{ type: "spring", stiffness: 60, damping: 18 }}
              />
            </div>
            <motion.span
              className={cn(
                "absolute top-1/2 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[13px] text-white",
                phase === "onsite" ? "bg-ios-green" : "bg-ios-orange",
              )}
              initial={{ left: "0%", scale: 0 }}
              animate={{ left: `${Math.min(100, Math.max(0, travelled * 100))}%`, scale: 1 }}
              transition={{ left: { type: "spring", stiffness: 60, damping: 18 }, scale: { type: "spring", stiffness: 500, damping: 18 } }}
              style={{ marginLeft: `${12 - travelled * 24}px` }}
            >
              {phase === "onsite" ? <Checkmark16Filled className="size-3.5" /> : <VehicleCar16Filled className="size-3.5" />}
            </motion.span>
          </div>
        )}
      </div>
    </Widget>
  );
}
