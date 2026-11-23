import { motion } from "motion/react";
import { type CSSProperties, useEffect, useState } from "react";
import { cn } from "@/registry/antuikit/lib/utils";

export interface GlowEffectProps {
  /** Gradient stops, in order around the conic sweep. */
  colors?: string[];
  /** `rotate` sweeps the gradient, `pulse` breathes its opacity and scale, `static` holds still. */
  mode?: "rotate" | "pulse" | "static";
  /** Blur radius in px. */
  blur?: number;
  /** Seconds per sweep or breath. */
  duration?: number;
  /** Shown when true; fades out otherwise. */
  active?: boolean;
  /** How far the glow spills past its parent, in px. */
  spread?: number;
  className?: string;
}

/**
 * A blurred conic gradient behind a surface. The sweep animates a registered
 * `--glow-angle` custom property (see styles.css), so the gradient turns
 * inside a rounded box instead of a rotating square showing its corners.
 */
export function GlowEffect({
  colors = ["#0A84FF", "#BF5AF2", "#FF375F", "#FF9F0A", "#30D158"],
  mode = "rotate",
  blur = 24,
  duration = 6,
  active = true,
  spread = 2,
  className,
}: GlowEffectProps) {
  // Mounted only while lit and through the fade-out. Left in place at opacity 0, the
  // sweep kept animating and every glowing widget kept a blurred layer alive for good.
  const [shown, setShown] = useState(active);
  useEffect(() => {
    if (active) setShown(true);
  }, [active]);
  if (!shown && !active) return null;

  const stops = [...colors, colors[0]].join(", ");
  const style: CSSProperties = {
    inset: -spread,
    background: `conic-gradient(from var(--glow-angle, 0deg), ${stops})`,
    // Kept soft: a glow is a hint behind the card, not a halo around it.
    filter: `blur(${Math.round(blur * 0.7)}px)`,
    animation:
      mode === "rotate"
        ? `glow-spin ${duration}s linear infinite`
        : undefined,
    // Stay on the GPU layer: dropping it as opacity reaches 0 re-rasterises the
    // blur and the last bit of glow pops instead of fading.
    willChange: "opacity, transform",
  };
  return (
    <motion.div
      aria-hidden
      className={cn(
        "pointer-events-none absolute -z-10",
        className,
      )}
      style={style}
      initial={{ opacity: 0, scale: 0.96 }}
      onAnimationComplete={() => {
        if (!active) setShown(false);
      }}
      animate={
        !active
          ? { opacity: 0, scale: 0.96 }
          : mode === "pulse"
            ? { opacity: [0.2, 0.42, 0.2], scale: [0.99, 1.01, 0.99] }
            : { opacity: 0.4, scale: 1 }
      }
      transition={
        !active
          ? // Fade out slowly on a gentle curve so the tail dissolves instead of cutting.
            { duration: 0.9, ease: [0.4, 0, 0.2, 1] }
          : mode === "pulse"
            ? { duration, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
      }
    />
  );
}
