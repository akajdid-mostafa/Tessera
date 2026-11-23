"use client";

import type { BadgeProps as AntdBadgeProps } from "antd";
import { Badge as AntdBadge, theme as antdTheme } from "antd";
import { cva } from "class-variance-authority";
import type { CSSProperties, Ref } from "react";
import { cn } from "@/registry/antuikit/lib/utils";

const badgeVariants = cva("", {
  variants: {
    emphasis: {
      default: "",
      strong:
        "[&_.ant-badge-status-text]:text-(color:--antuikit-badge-status-text)",
    },
    shape: {
      default: "",
      square: "[&_.ant-badge-count]:rounded-sm",
      squircle: "[&_.ant-badge-count]:corner-squircle",
    },
  },
  defaultVariants: { emphasis: "default", shape: "default" },
});

/** The label color `emphasis="strong"` gives each status: the text token, not the dot's fill. */
const STATUS_TEXT_COLOR: Record<
  NonNullable<AntdBadgeProps["status"]>,
  string | undefined
> = {
  success: "var(--ant-color-success-text)",
  processing: "var(--ant-color-info-text)",
  // `default` is the placeholder gray, so spreading it would make `strong`
  // quieter. The label keeps its normal color.
  default: undefined,
  error: "var(--ant-color-error-text)",
  warning: "var(--ant-color-warning-text)",
};

/**
 * Whether `color` is one of antd's 13 presets, which antd paints itself. Read
 * from `defaultSeed`, checking for a string, since some seeds are booleans.
 */
const isAntdPreset = (color: string): boolean =>
  typeof (antdTheme.defaultSeed as unknown as Record<string, unknown>)[
    color
  ] === "string";

/**
 * The theme palette a `color` names, or `undefined` if antd handles it. A
 * name counts when it is not an antd preset and the theme has its ramp, so
 * your own palettes work without a list.
 */
const paletteNameOf = (
  color: AntdBadgeProps["color"],
  token: Record<string, unknown>,
): string | undefined => {
  if (typeof color !== "string") return undefined;
  if (isAntdPreset(color)) return undefined;
  if (!/^[a-z][a-z0-9]*$/.test(color)) return undefined;
  return typeof token[`${color}6`] === "string" &&
    typeof token[`${color}8`] === "string"
    ? color
    : undefined;
};

/** The color `emphasis="strong"` spreads onto the label. */
const statusTextColor = (
  status: AntdBadgeProps["status"],
  color: AntdBadgeProps["color"],
  palette: string | undefined,
): string | undefined => {
  if (palette) return `var(--ant-${palette}-8)`;
  if (typeof color === "string" && color !== "") {
    // Shade 8, not the dot's 6: antd's preset dot color is a fill value and
    // misses AA as text on most palettes. A custom color has no ramp to
    // correct against and passes through.
    return isAntdPreset(color) ? `var(--ant-${color}-8)` : color;
  }
  return status ? STATUS_TEXT_COLOR[status] : undefined;
};

/**
 * antd keeps the medium padding on a small count with more than one digit,
 * so the small pill reads too loose. The compound selector matches only that
 * case, leaving medium and single-digit counts alone.
 */
const SMALL_MULTIWORD_PADDING =
  "[&.ant-badge-count-sm.ant-badge-multiple-words]:px-xxs";

/**
 * Lifts the indicator off what it sits on: a ring in the container's
 * background color and a soft shadow that turns into a rim light in dark
 * mode. Keep it one literal string, since Tailwind cannot see a class
 * assembled at runtime.
 */
const INDICATOR_ELEVATION =
  "shadow-[0_0_0_var(--ant-line-width)_var(--ant-color-border-bg),0_2px_2px_0_var(--ant-color-fill)]";

/**
 * antd paints the `default` status dot a translucent gray, so whatever it sits
 * on shows through. This is the same gray flattened onto the container, with
 * antd's value as the fallback for a theme without the token.
 */
const STATUS_DEFAULT_FILL =
  "[&.ant-badge-status-default]:bg-[var(--ant-color-status-default,var(--ant-color-text-placeholder))]";

/** The color a `ring` on a dot that is not `processing` draws in: the dot's own fill. */
const STATUS_DOT_COLOR: Record<
  NonNullable<AntdBadgeProps["status"]>,
  string
> = {
  success: "var(--ant-color-success)",
  processing: "var(--ant-color-info)",
  default: "var(--ant-color-status-default,var(--ant-color-text-placeholder))",
  error: "var(--ant-color-error)",
  warning: "var(--ant-color-warning)",
};

/** The fill antd gives a dot: the color first, then the status, then antd's red for a plain `dot`. */
const dotColor = (
  status: AntdBadgeProps["status"],
  color: AntdBadgeProps["color"],
  palette: string | undefined,
): string => {
  if (palette) return `var(--ant-${palette}-6)`;
  if (typeof color === "string" && color !== "") {
    return isAntdPreset(color) ? `var(--ant-${color}-6)` : color;
  }
  return status ? STATUS_DOT_COLOR[status] : "var(--ant-color-error)";
};

type BadgePulse = "ring" | "fade" | false;

/** antd's own ring on the processing dot, hidden: always, or under reduced motion. */
const HIDE_ANTD_RING = "[&.ant-badge-status-processing]:after:hidden";
const HIDE_ANTD_RING_REDUCED =
  "motion-reduce:[&.ant-badge-status-processing]:after:hidden";

/** antd's ring rebuilt on a `::after`, for dots antd draws no ring on. */
const RING = [
  "[&:is(.ant-badge-dot,.ant-badge-status-dot)]:after:pointer-events-none",
  "[&:is(.ant-badge-dot,.ant-badge-status-dot)]:after:absolute",
  "[&:is(.ant-badge-dot,.ant-badge-status-dot)]:after:inset-0",
  "[&:is(.ant-badge-dot,.ant-badge-status-dot)]:after:rounded-[inherit]",
  "[&:is(.ant-badge-dot,.ant-badge-status-dot)]:after:border-solid",
  "[&:is(.ant-badge-dot,.ant-badge-status-dot)]:after:border-[length:var(--ant-line-width)]",
  "[&:is(.ant-badge-dot,.ant-badge-status-dot)]:after:border-(--antuikit-badge-pulse)",
  "[&:is(.ant-badge-dot,.ant-badge-status-dot)]:after:content-['']",
  "motion-safe:[&:is(.ant-badge-dot,.ant-badge-status-dot)]:after:animate-ring",
  "motion-reduce:[&:is(.ant-badge-dot,.ant-badge-status-dot)]:after:hidden",
].join(" ");

/** The indicator classes for a resolved `pulse`. Every class is scoped to a dot, so a count never animates. */
const pulseClasses = (pulse: BadgePulse, processing: boolean): string => {
  if (pulse === "fade") {
    return cn(
      processing && HIDE_ANTD_RING,
      "motion-safe:[&:is(.ant-badge-dot,.ant-badge-status-dot)]:animate-fade-pulse",
    );
  }
  if (pulse === "ring") {
    // antd already draws this ring on the processing dot. It does not stop
    // for reduced motion, so the kit hides it there.
    return processing ? HIDE_ANTD_RING_REDUCED : RING;
  }
  return processing ? HIDE_ANTD_RING : "";
};

type BadgeClassNames = Exclude<
  NonNullable<AntdBadgeProps["classNames"]>,
  (...args: never[]) => unknown
>;

/**
 * Merges per key, ours first so a conflicting utility of yours wins. The
 * function form is wrapped, so the classes it returns are kept too.
 */
const withIndicatorClasses = (
  theirs: AntdBadgeProps["classNames"],
  elevated: boolean,
  pulse: string,
): AntdBadgeProps["classNames"] => {
  const merge = (resolved: BadgeClassNames | undefined): BadgeClassNames => ({
    ...resolved,
    indicator: cn(
      // `shadow-none` also drops antd's own ring, which is a box-shadow too.
      elevated ? INDICATOR_ELEVATION : "shadow-none",
      SMALL_MULTIWORD_PADDING,
      STATUS_DEFAULT_FILL,
      pulse,
      resolved?.indicator,
    ),
  });
  if (typeof theirs === "function") return (info) => merge(theirs(info));
  return merge(theirs);
};

/** Badge's props, plus `emphasis`, `shape`, `elevated`, `pulse` and a `ref`. */
export interface BadgeProps extends AntdBadgeProps {
  /** Forwarded to the root `<span>`. */
  ref?: Ref<HTMLSpanElement>;
  /**
   * `strong` colors a status label in its status text color. `default` leaves the label its normal color.
   *
   * @default "default"
   */
  emphasis?: "default" | "strong";
  /**
   * Corner shape of the count: `square`, `squircle` (Chromium 139 and later), or `default`, a circle or pill.
   *
   * @default "default"
   */
  shape?: "square" | "squircle" | "default";
  /**
   * Draws a ring and a soft shadow around the count or dot. `false` removes both, for an indicator that sits flat.
   *
   * @default true
   */
  elevated?: boolean;
  /**
   * Animates a dot: `ring` sends a ring out from it, `fade` dims it and brings it back in its own color, `false` keeps it still. A count never animates, and both stop under reduced motion.
   *
   * @default "ring" for `status="processing"`, otherwise `false`
   */
  pulse?: BadgePulse;
}

/**
 * Badge with `emphasis`, `shape`, `elevated`, `pulse`, theme palette colors and a raised count.
 *
 * `color` takes antd's presets, a palette from your theme or any CSS color.
 * With children the count sits on their corner, and without them it renders
 * inline. Your `classNames` merge with the kit's own indicator classes.
 * `Badge.Ribbon` is a separate component: `@/components/ui/ribbon`.
 */
export const Badge = ({
  className,
  classNames,
  emphasis,
  shape,
  elevated = true,
  pulse,
  status,
  color,
  style,
  ...props
}: BadgeProps) => {
  const { token } = antdTheme.useToken();
  const palette = paletteNameOf(
    color,
    token as unknown as Record<string, unknown>,
  );
  const textColor = statusTextColor(status, color, palette);
  const processing = status === "processing";
  const resolvedPulse = pulse ?? (processing ? "ring" : false);
  // Only the rebuilt ring reads the dot color; antd's own reads `color`.
  const ringColor =
    resolvedPulse === "ring" && !processing
      ? dotColor(status, color, palette)
      : undefined;
  const vars: Record<string, string> = {};
  if (textColor && emphasis === "strong") {
    vars["--antuikit-badge-status-text"] = textColor;
  }
  if (ringColor) vars["--antuikit-badge-pulse"] = ringColor;

  return (
    <AntdBadge
      {...props}
      status={status}
      // A palette name goes to antd as its variable: antd only knows its 13
      // preset names, and would paint `background: emerald`, which is nothing.
      color={palette ? `var(--ant-${palette}-6)` : color}
      style={
        Object.keys(vars).length > 0
          ? ({ ...style, ...vars } as CSSProperties)
          : style
      }
      className={cn(
        badgeVariants({
          // `strong` needs a color. Without one the label would get an
          // invalid color.
          emphasis: textColor ? emphasis : "default",
          shape,
        }),
        className,
      )}
      classNames={withIndicatorClasses(
        classNames,
        elevated,
        pulseClasses(resolvedPulse, processing),
      )}
    />
  );
};

Badge.displayName = "Badge";

export { badgeVariants };
