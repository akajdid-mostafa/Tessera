import { motion, useReducedMotion } from "motion/react";
import { type ReactNode, useState } from "react";
import { cn } from "@/registry/antuikit/lib/utils";
import { BorderBeam, type BorderBeamProps } from "@/registry/antuikit/ui/border-beam";
import { Card } from "@/registry/antuikit/ui/card";
import { GlowEffect, type GlowEffectProps } from "./glow-effect";
import { InspectBadge } from "./inspect";

/** iOS widget families: small 1×1, medium 2×1, large 2×2, extra-large 4×2. */
export type WidgetSize = "small" | "medium" | "large" | "xlarge";

export const SPAN: Record<WidgetSize, string> = {
  small: "col-span-1 row-span-1",
  medium: "col-span-2 row-span-1",
  large: "col-span-2 row-span-2",
  xlarge: "col-span-2 sm:col-span-4 row-span-2",
};

export interface WidgetProps {
  size: WidgetSize;
  /** Position in the grid, used to stagger the entrance. */
  index?: number;
  /** Glow behind the widget while hovered. `true` uses the default spectrum. */
  glow?: boolean | Omit<GlowEffectProps, "active">;
  /** Forces the glow on, regardless of hover (for live events). */
  glowActive?: boolean;
  /** Presses down on tap. Off for widgets whose children are controls. */
  pressable?: boolean;
  onPress?: () => void;
  /** Replaces the surface fill, for full-bleed tinted widgets. */
  surfaceClassName?: string;
  className?: string;
  label?: string;
  /** A light that runs the widget's edge, for live or highlighted states. */
  beam?: boolean | Omit<BorderBeamProps, "children">;
  children: ReactNode;
}

/**
 * The widget's corner, shared by every layer that traces its edge (surface,
 * beam, glow). A squircle where `corner-shape` is supported, which needs a
 * larger radius to read the same size; a plain round corner elsewhere.
 * `corner-shape` does not inherit, so a layer that only inherits the radius
 * (antd's BorderBeam does) draws a rounder corner than the card it rides.
 */
const WIDGET_CORNER = cn(
  "corner-squircle",
  "rounded-[calc(var(--ant-border-radius-lg)*2.75)]",
  "supports-[corner-shape:squircle]:rounded-[calc(var(--ant-border-radius-lg)*4)]",
);

function MaybeBeam({ beam, children }: { beam?: WidgetProps["beam"]; children: ReactNode }) {
  if (!beam) return <>{children}</>;
  const props = typeof beam === "object" ? beam : {};
  return (
    <BorderBeam {...props} className={cn(WIDGET_CORNER, props.className)}>
      {children}
    </BorderBeam>
  );
}

/**
 * The widget shell. An antuikit Card (squircle, borderless) inside a motion
 * wrapper that owns the entrance, hover lift, press and optional glow.
 */
export function Widget({
  size,
  index = 0,
  glow,
  glowActive,
  pressable = false,
  onPress,
  surfaceClassName,
  className,
  label,
  beam,
  children,
}: WidgetProps) {
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  // The stagger delay is for the entrance only; once it has landed, settling back
  // from a hover or a press must start at once.
  const [landed, setLanded] = useState(false);
  const glowProps = typeof glow === "object" ? glow : {};

  return (
    <motion.article
      aria-label={label}
      className={cn(
        "relative isolate min-h-0 min-w-0",
        SPAN[size],
        className,
      )}
      initial={reduce ? false : { opacity: 0, y: 18, scale: 0.97, filter: "blur(6px)" }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        // A lingering `filter` keeps the widget on its own compositing layer,
        // which softens its edge; drop it once the entrance lands.
        transitionEnd: { filter: "none" },
        // The stagger belongs to the entrance alone. As the component's default
        // transition it also delayed the hover lift and the press by up to 0.3 s.
        transition: { delay: landed ? 0 : 0.06 * index, type: "spring", stiffness: 260, damping: 26 },
      }}
      onAnimationComplete={() => setLanded(true)}
      // No `layout`: cells never move (placeholders hold their size), and a layout
      // node re-measures the grid on every re-render, i.e. on every live tick.
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      whileHover={reduce ? undefined : { y: -3 }}
      whileTap={pressable && !reduce ? { scale: 0.97 } : undefined}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onPress}
      style={{ cursor: pressable ? "pointer" : undefined }}
    >
      <InspectBadge visible={hovered} />
      {glow ? (
        <GlowEffect
          {...glowProps}
          className={WIDGET_CORNER}
          active={glowActive ?? hovered}
        />
      ) : null}
      <MaybeBeam beam={beam}>
      <Card
        variant="borderless"
        className={cn(
          "h-full overflow-hidden bg-widget-surface",
          WIDGET_CORNER,
          "ring-1 ring-widget-ring ring-inset",
          surfaceClassName,
        )}
        classNames={{ body: "h-full" }}
        styles={{ body: { padding: 0 } }}
      >
        <div className="relative flex h-full flex-col p-4">{children}</div>
      </Card>
      </MaybeBeam>
    </motion.article>
  );
}

/**
 * Fuller, brighter fills for the header icon chip than the flat iOS system colors,
 * in OKLCH so every hue reads at a similar weight behind a white glyph.
 */
const CHIP_FILL: Record<string, string> = {
  primary: "oklch(0.5 0.3 264.43)",
  indigo: "oklch(0.52 0.27 272)",
  blue: "oklch(0.6 0.23 252)",
  teal: "oklch(0.64 0.15 205)",
  mint: "oklch(0.68 0.16 172)",
  green: "oklch(0.64 0.21 148)",
  yellow: "oklch(0.76 0.17 78)",
  orange: "oklch(0.67 0.21 48)",
  red: "oklch(0.6 0.24 25)",
  pink: "oklch(0.6 0.25 2)",
  purple: "oklch(0.55 0.27 302)",
};
const chipFill = (tint: string) => {
  if (tint === "var(--ant-color-primary)") return CHIP_FILL.primary;
  const name = /^var\(--ios-([a-z]+)\)$/.exec(tint)?.[1];
  return (name && CHIP_FILL[name]) || tint;
};

/** The small title row most widgets open with: a tinted icon chip and a label. */
export function WidgetHeader({
  icon,
  title,
  subtitle,
  tint = "var(--ant-color-primary)",
  extra,
}: {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  tint?: string;
  extra?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      {icon ? (
        <span
          className="grid size-7 shrink-0 place-items-center rounded-full text-[15px] text-white"
          style={{ background: chipFill(tint) }}
        >
          {icon}
        </span>
      ) : null}
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate text-[13px] font-semibold text-heading">{title}</div>
        {subtitle ? (
          <div className="truncate text-[11px] text-tertiary">{subtitle}</div>
        ) : null}
      </div>
      {extra}
    </div>
  );
}
