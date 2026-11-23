import { type AnimationPlaybackControls, animate, motion, useMotionValue, useTransform } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/registry/antuikit/lib/utils";

/** A small live dot: steady, or pinging when something needs eyes. */
export function LiveDot({ color, ping = false }: { color: string; ping?: boolean }) {
  return (
    <span className="relative flex size-1.5 shrink-0">
      {ping ? <span className="absolute inset-0 animate-ping rounded-full opacity-70" style={{ background: color }} /> : null}
      <span className="relative size-1.5 rounded-full" style={{ background: color }} />
    </span>
  );
}

/** m:ss for a count of seconds. */
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** HH:MM:SS of a date, 24 h. */
export const clock = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/**
 * Press-and-hold to sign. The fill runs while held and springs back if released
 * early; completing it fires `onConfirm`. Space and Enter hold it too.
 */
export function HoldButton({
  label,
  holdingLabel = "Keep holding…",
  onConfirm,
  tint,
  icon,
  duration = 1.1,
  className,
}: {
  label: ReactNode;
  holdingLabel?: ReactNode;
  onConfirm: () => void;
  tint: string;
  icon?: ReactNode;
  duration?: number;
  className?: string;
}) {
  const progress = useMotionValue(0);
  const width = useTransform(progress, (v) => `${v * 100}%`);
  const run = useRef<AnimationPlaybackControls | null>(null);
  const held = useRef(false);
  const [holding, setHolding] = useState(false);

  useEffect(() => () => run.current?.stop(), []);

  const start = () => {
    if (held.current) return;
    held.current = true;
    setHolding(true);
    run.current?.stop();
    run.current = animate(progress, 1, {
      duration: duration * (1 - progress.get()),
      ease: "linear",
      onComplete: () => {
        held.current = false;
        setHolding(false);
        progress.set(0);
        onConfirm();
      },
    });
  };
  const cancel = () => {
    if (!held.current) return;
    held.current = false;
    setHolding(false);
    run.current?.stop();
    run.current = animate(progress, 0, { type: "spring", stiffness: 420, damping: 32 });
  };

  return (
    <motion.button
      type="button"
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          start();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === " " || e.key === "Enter") cancel();
      }}
      onContextMenu={(e) => e.preventDefault()}
      animate={{ scale: holding ? 0.96 : 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      className={cn(
        "relative flex h-7 cursor-pointer touch-none items-center justify-center gap-1.5 overflow-hidden rounded-full bg-fill-secondary px-3 text-[12px] font-semibold whitespace-nowrap text-heading select-none",
        className,
      )}
    >
      <motion.span aria-hidden className="absolute inset-y-0 left-0" style={{ width, background: tint, opacity: 0.32 }} />
      {icon ? (
        <span className="relative grid place-items-center" style={{ color: tint }}>
          {icon}
        </span>
      ) : null}
      <span className="relative">{holding ? holdingLabel : label}</span>
    </motion.button>
  );
}
