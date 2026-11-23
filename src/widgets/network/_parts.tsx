import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@/registry/antuikit/lib/utils";

const ARM_MS = 4000;

/**
 * A two-step command button for actions that touch live traffic. The first
 * press arms it (red, with a draining bar showing how long the arm lasts), the
 * second press runs it. Left alone it disarms itself.
 */
export function GuardButton({
  label,
  confirmLabel = "Confirm",
  icon,
  onConfirm,
  disabled,
  emphasis = false,
  className,
}: {
  label: ReactNode;
  confirmLabel?: ReactNode;
  icon?: ReactNode;
  onConfirm: () => void;
  disabled?: boolean;
  /** Draw the idle state filled with the accent, for when the action is the advised next step. */
  emphasis?: boolean;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), ARM_MS);
    return () => window.clearTimeout(t);
  }, [armed]);

  useEffect(() => {
    if (disabled) setArmed(false);
  }, [disabled]);

  return (
    <motion.button
      type="button"
      layout
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
      whileTap={{ scale: 0.93 }}
      className={cn(
        "relative flex h-[26px] shrink-0 cursor-pointer items-center gap-1 overflow-hidden rounded-full px-2.5 text-[11px] font-semibold whitespace-nowrap outline-none transition-colors duration-mid disabled:cursor-default disabled:opacity-40",
        armed
          ? "bg-ios-red text-white"
          : emphasis
            ? "bg-ios-orange/15 text-ios-orange hover:bg-ios-orange/25"
            : "bg-fill-secondary text-heading hover:bg-fill",
        className,
      )}
    >
      {icon}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={armed ? "confirm" : "idle"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="block"
        >
          {armed ? confirmLabel : label}
        </motion.span>
      </AnimatePresence>
      {armed ? (
        <motion.span
          className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-white/70"
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: ARM_MS / 1000, ease: "linear" }}
        />
      ) : null}
    </motion.button>
  );
}

/** A random walk that stays inside [min, max]. */
export function walk(v: number, step: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v + (Math.random() - 0.5) * step * 2));
}
