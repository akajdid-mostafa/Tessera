import { type AnimationPlaybackControls, animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/registry/antuikit/lib/utils";

/** Entrance delay shared by every mining widget: lands just after the card does. */
export const enterDelay = (index?: number) => 0.3 + (index ?? 0) * 0.06;

/** A setInterval that always reads the latest callback and is cleared on unmount. */
export function useInterval(fn: () => void, ms: number | null) {
  const saved = useRef(fn);
  saved.current = fn;
  useEffect(() => {
    if (ms === null) return;
    const t = window.setInterval(() => saved.current(), ms);
    return () => window.clearInterval(t);
  }, [ms]);
}

/** A polyline path through `points`, scaled into a `w × h` box between `lo` and `hi`. */
export function sparkPath(points: number[], w: number, h: number, lo: number, hi: number) {
  const span = hi - lo || 1;
  return points
    .map((v, i) => `${i ? "L" : "M"}${((i / (points.length - 1)) * w).toFixed(1)} ${(h - ((v - lo) / span) * h).toFixed(1)}`)
    .join(" ");
}

/** ISA-18.2 alarm priority: P1 red diamond, P2 orange triangle, P3 yellow inverted triangle. Flashes until acknowledged. */
export function AlarmMark({ priority, flashing = false, size = 16 }: { priority: 1 | 2 | 3; flashing?: boolean; size?: number }) {
  const reduce = useReducedMotion();
  const color = priority === 1 ? "var(--ios-red)" : priority === 2 ? "var(--ios-orange)" : "var(--ios-yellow)";
  const ink = priority === 1 ? "#fff" : "#000";
  const shape =
    priority === 1 ? (
      <rect x="4" y="4" width="12" height="12" rx="1.6" transform="rotate(45 10 10)" fill={color} />
    ) : priority === 2 ? (
      <path d="M10 1.8 18.6 17.2H1.4Z" fill={color} stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
    ) : (
      <path d="M1.4 2.8H18.6L10 18.2Z" fill={color} stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
    );
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} className="shrink-0 overflow-visible" aria-label={`Priority ${priority} alarm`}>
      <motion.g
        animate={flashing && !reduce ? { opacity: [1, 0.22, 1] } : { opacity: 1 }}
        transition={flashing && !reduce ? { duration: 1, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
      >
        {shape}
        <text x="10" y={priority === 2 ? 14.6 : priority === 3 ? 10.6 : 13.3} textAnchor="middle" fontSize="9.5" fontWeight="700" fill={ink}>
          {priority}
        </text>
      </motion.g>
    </svg>
  );
}

/**
 * Press and hold to confirm a safety-critical step. The fill runs while held and
 * springs back if released early; completing it fires `onConfirm`. Space and Enter hold it too.
 */
export function HoldButton({
  label,
  holdingLabel = "Keep holding…",
  onConfirm,
  tint,
  icon,
  duration = 1.4,
  disabled,
  className,
}: {
  label: ReactNode;
  holdingLabel?: ReactNode;
  onConfirm: () => void;
  tint: string;
  icon?: ReactNode;
  duration?: number;
  disabled?: boolean;
  className?: string;
}) {
  const progress = useMotionValue(0);
  const width = useTransform(progress, (v) => `${v * 100}%`);
  const run = useRef<AnimationPlaybackControls | null>(null);
  const held = useRef(false);
  const [holding, setHolding] = useState(false);

  useEffect(() => () => run.current?.stop(), []);

  const start = () => {
    if (disabled || held.current) return;
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
      disabled={disabled}
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
        "relative flex h-7 w-full cursor-pointer touch-none items-center justify-center gap-1.5 overflow-hidden rounded-full bg-fill-secondary px-3 text-[12px] font-semibold whitespace-nowrap text-heading select-none disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    >
      <motion.span aria-hidden className="absolute inset-y-0 left-0" style={{ width, background: tint, opacity: 0.35 }} />
      {icon ? <span className="relative grid place-items-center">{icon}</span> : null}
      <span className="relative">{holding ? holdingLabel : label}</span>
    </motion.button>
  );
}

/** mm:ss from seconds. */
export const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
