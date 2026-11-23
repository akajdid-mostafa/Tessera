import {
  ArrowUndo16Regular,
  Checkmark16Filled,
  Desktop20Filled,
  Location12Regular,
  LockClosed16Filled,
  ShieldError20Filled,
  Timer12Regular,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

type Phase = "alert" | "confirm" | "frozen" | "approved" | "declined";

const AMOUNT = 842.19;
/** Seconds left before the hold auto-declines. */
const HOLD = 9 * 60 + 42;
const REASONS = [
  { label: "New country", tone: "bg-ios-red/15 text-ios-red" },
  { label: "2.6× your max", tone: "bg-ios-red/15 text-ios-red" },
  { label: "3:12 AM", tone: "bg-fill-tertiary text-secondary" },
];

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const USD = { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

const OUTCOME: Record<"frozen" | "approved" | "declined", { title: string; sub: string; tone: string; text: string }> = {
  frozen: { title: "Card frozen · charge declined", sub: "New card ships Thu, Nov 12", tone: "bg-ios-blue/15", text: "text-ios-blue" },
  approved: { title: "Approved · charge released", sub: "We'll remember this merchant", tone: "bg-ios-green/15", text: "text-ios-green" },
  declined: { title: "No answer · charge declined", sub: "Your card still works", tone: "bg-fill-tertiary", text: "text-secondary" },
};

/** Finance · medium. A held card charge with a live auto-decline clock; confirm or freeze, then undo. */
export function FraudAlertWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [phase, setPhase] = useState<Phase>("alert");
  const [left, setLeft] = useState(HOLD);
  const open = phase === "alert" || phase === "confirm";

  // The hold clock only runs while the alert is open.
  useEffect(() => {
    if (!open) return;
    const t = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [open]);
  useEffect(() => {
    if (open && left === 0) setPhase("declined");
  }, [open, left]);

  // A confirm left alone falls back to the plain alert.
  useEffect(() => {
    if (phase !== "confirm") return;
    const t = window.setTimeout(() => setPhase("alert"), 4000);
    return () => window.clearTimeout(t);
  }, [phase]);

  const undo = () => {
    setLeft(HOLD);
    setPhase("alert");
  };

  const result = open ? null : OUTCOME[phase];

  return (
    <Widget
      size="medium"
      index={index}
      label="Card fraud alert"
      glow={{ mode: "pulse", colors: ["#FF453A", "#FF9F0A", "#FF453A"], blur: 20, duration: 1.6 }}
      glowActive={open}
    >
      <WidgetHeader
        icon={<ShieldError20Filled />}
        tint={open ? "var(--ios-red)" : phase === "approved" ? "var(--ios-green)" : "var(--ios-blue)"}
        title="Card Alert"
        subtitle="Debit •••• 4821 · Held for review"
        extra={
          open ? (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-ios-red/15 px-2 py-0.5 text-[11px] font-semibold text-ios-red tabular">
              <motion.span
                className="grid place-items-center"
                animate={{ rotate: [0, -12, 12, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.5 }}
              >
                <Timer12Regular />
              </motion.span>
              {clock(left)}
            </span>
          ) : null
        }
      />

      <div className="mt-2.5 flex h-[40px] items-center gap-2.5">
        <motion.span
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-fill-tertiary text-[18px] text-secondary"
          initial={{ x: 0 }}
          animate={{ x: [0, -4, 4, -3, 3, 0] }}
          transition={{ duration: 0.5, delay: delay + 0.4 }}
        >
          <Desktop20Filled />
        </motion.span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[13px] font-semibold text-heading">Voltway Electronics</div>
          <div className="flex items-center gap-0.5 whitespace-nowrap text-[11px] text-tertiary">
            <Location12Regular /> Online · Lisbon, PT
          </div>
        </div>
        <div className="relative shrink-0 leading-none">
          <AnimatedNumber
            value={AMOUNT}
            format={USD}
            className={cn(
              "text-[22px] font-semibold tracking-tight transition-colors duration-300",
              phase === "frozen" || phase === "declined" ? "text-tertiary" : "text-heading",
            )}
          />
          <motion.span
            aria-hidden
            className="absolute left-0 top-1/2 h-[2px] rounded-full bg-[var(--ant-color-text-tertiary)]"
            initial={false}
            animate={{ width: phase === "frozen" || phase === "declined" ? "100%" : "0%" }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
          />
        </div>
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        {open ? (
          <motion.div
            key="open"
            className="mt-auto flex flex-col gap-2.5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <div className="flex gap-1.5">
              {REASONS.map((r, i) => (
                <motion.span
                  key={r.label}
                  className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium", r.tone)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 22, delay: delay + 0.5 + i * 0.08 }}
                >
                  {r.label}
                </motion.span>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                block
                shape="round"
                icon={<Checkmark16Filled />}
                onClick={() => setPhase("approved")}
                className="font-semibold"
              >
                It was me
              </Button>
              <motion.div
                className="flex-1"
                key={phase}
                initial={phase === "confirm" ? { scale: 0.92 } : false}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 520, damping: 16 }}
              >
                <Button
                  block
                  shape="round"
                  color="danger"
                  variant={phase === "confirm" ? "solid" : "filled"}
                  icon={<LockClosed16Filled />}
                  onClick={() => setPhase(phase === "confirm" ? "frozen" : "confirm")}
                  className="font-semibold"
                >
                  {phase === "confirm" ? "Tap to freeze card" : "Not me"}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        ) : result ? (
          <motion.div
            key={phase}
            className={cn("mt-auto flex h-[56px] items-center gap-2.5 rounded-2xl px-3", result.tone)}
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
          >
            <motion.span
              className={cn("grid size-8 shrink-0 place-items-center rounded-full bg-[var(--widget-surface)] text-[16px]", result.text)}
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 16, delay: 0.1 }}
            >
              {phase === "approved" ? <Checkmark16Filled /> : <LockClosed16Filled />}
            </motion.span>
            <div className="min-w-0 flex-1 leading-tight">
              <div className={cn("truncate text-[13px] font-semibold", result.text)}>{result.title}</div>
              <div className="truncate text-[11px] text-secondary">{result.sub}</div>
            </div>
            <Button size="small" shape="round" type="text" icon={<ArrowUndo16Regular />} onClick={undo} className="shrink-0 font-medium">
              Undo
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Widget>
  );
}
