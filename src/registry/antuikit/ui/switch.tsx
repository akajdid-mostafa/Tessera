"use client";

import type { SwitchProps as AntdSwitchProps } from "antd";
import { Switch as AntdSwitch, theme as antdTheme } from "antd";
import { cva } from "class-variance-authority";
import type { CSSProperties, Ref } from "react";
import { cn } from "@/registry/antuikit/lib/utils";

/** The status colors, named as Tag and Alert name them. */
type SwitchStatusColor = "primary" | "success" | "warning" | "error";

/**
 * The squircle radius: 1.5x `borderRadiusSM` where `corner-shape` is supported
 * (plain `square` elsewhere), capped at 45% of the track height so it stays
 * short of a pill. The small arm keys on antd's size class, because `size` can
 * come from `<ConfigProvider componentSize>` without a prop.
 */
const SQUIRCLE_RADIUS = [
  "supports-[corner-shape:squircle]:[--antuikit-switch-corner-scale:1.5]",
  "[--antuikit-switch-radius:min(calc(var(--ant-border-radius-sm)*var(--antuikit-switch-corner-scale,1)),max(var(--ant-border-radius-sm),calc(var(--ant-switch-track-height)*0.45)))]",
  "[&.ant-switch-small]:[--antuikit-switch-radius:min(calc(var(--ant-border-radius-sm)*var(--antuikit-switch-corner-scale,1)),max(var(--ant-border-radius-sm),calc(var(--ant-switch-track-height-sm)*0.45)))]",
];

/**
 * Shared by `square` and `squircle`. `.ant-switch-inner` clips the track text
 * at a fixed 100px radius, so it inherits the track's. The knob is the handle's
 * `::before`, rounded to the track radius minus `trackPadding`.
 */
const BOXED = [
  "rounded-[var(--antuikit-switch-radius)]",
  "[&_.ant-switch-inner]:rounded-[inherit]",
  "[&_.ant-switch-handle]:before:rounded-[max(0px,calc(var(--antuikit-switch-radius)_-_var(--ant-switch-track-padding)))]",
];

/** The `shape` classes, exported so another element can match a Switch's corners. */
const switchVariants = cva("", {
  variants: {
    shape: {
      square: [
        ...BOXED,
        "[--antuikit-switch-radius:var(--ant-border-radius-sm)]",
      ].join(" "),
      squircle: [
        ...BOXED,
        ...SQUIRCLE_RADIUS,
        "corner-squircle",
        "[&_.ant-switch-handle]:before:corner-squircle",
      ].join(" "),
      // antd rounds the small knob by the medium knob's size, which only
      // reads as a circle while the small knob is the smaller of the two.
      default:
        "[&.ant-switch-small_.ant-switch-handle]:before:rounded-[calc(var(--ant-switch-handle-size-sm)*0.5)]",
    },
  },
  defaultVariants: { shape: "default" },
});

/** Switch's props, plus `color`, `shape` and a `ref`. */
export interface SwitchProps extends AntdSwitchProps {
  /**
   * The on track's color: `primary`, a status (`success`, `warning`, `error`),
   * antd's presets (`blue`, `green`, `gold` and the rest) or a palette from
   * your theme (the default theme adds `amber`, `emerald`, `teal`, `sky`,
   * `indigo`, `violet`, `fuchsia`, `rose` and grays like `slate` and `zinc`).
   * A gray, a CSS color or an unknown name falls back to `primary`.
   * @default "primary"
   */
  color?: SwitchStatusColor | (string & {});
  /**
   * Corners of the track, with the knob following them: `square` uses the
   * theme's small radius, `squircle` a superellipse (drawn as `square` where
   * `corner-shape` is unsupported), and `default` the pill.
   *
   * @default "default"
   */
  shape?: "square" | "squircle" | "default";
  /** Forwarded to the `<button>` the switch renders. */
  ref?: Ref<HTMLButtonElement>;
}

/**
 * Whether a palette's shade 6 is a gray rather than a hue, by its HSL
 * saturation. Hues sit near 100% and grays near 0%, so 0.5 splits them.
 */
const isNeutral = (hex: string): boolean => {
  const raw = hex.replace("#", "");
  if (raw.length < 6) return false;
  const [r = 0, g = 0, b = 0] = [0, 2, 4].map(
    (i) => Number.parseInt(raw.slice(i, i + 2), 16) / 255,
  );
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return true;
  const lightness = (max + min) / 2;
  return (max - min) / (1 - Math.abs(2 * lightness - 1)) < 0.5;
};

/**
 * Re-points `colorPrimary`, its hover and its border on the switch itself,
 * which recolors every state antd paints from them, the loading spinner
 * included. Inline, because the names are built per color at runtime and an
 * inline style outranks antd's own variables.
 */
const colorVars = (
  color: SwitchProps["color"],
  token: Record<string, unknown>,
): CSSProperties | undefined => {
  if (color === undefined || color === "primary") return undefined;
  if (color === "success" || color === "warning" || color === "error") {
    return {
      "--ant-color-primary": `var(--ant-color-${color})`,
      "--ant-color-primary-hover": `var(--ant-color-${color}-hover)`,
      "--ant-color-primary-border": `var(--ant-color-${color}-border)`,
    } as CSSProperties;
  }
  if (!/^[a-z][a-z0-9]*$/.test(color)) return undefined;
  const base = token[`${color}6`];
  if (typeof base !== "string" || typeof token[`${color}3`] !== "string") {
    return undefined;
  }
  if (isNeutral(base)) return undefined;
  return {
    "--ant-color-primary": `var(--ant-${color}-6)`,
    "--ant-color-primary-hover": `var(--ant-${color}-5)`,
    "--ant-color-primary-border": `var(--ant-${color}-3)`,
  } as CSSProperties;
};

/**
 * Shows the hover color while a wrapping `<label>` is hovered, using the same
 * variables as antd's own `:hover`, so `color` applies here too. It does
 * nothing without a label, and skips disabled and loading switches.
 */
const LABEL_HOVER = [
  "[label:hover_&:not(.ant-switch-disabled):not(.ant-switch-loading)]:bg-tertiary",
  "[label:hover_&.ant-switch-checked:not(.ant-switch-disabled):not(.ant-switch-loading)]:bg-primary-hover",
];

/**
 * Switch, with a `color` for the on track, a `shape` for its corners, and a
 * hover state while a wrapping `<label>` is hovered.
 *
 * In a `<label>`, point `aria-labelledby` at the title and `aria-describedby`
 * at the description, or the whole label text becomes the switch's name.
 */
export const Switch = ({
  className,
  color,
  shape,
  style,
  ...props
}: SwitchProps) => {
  const { token } = antdTheme.useToken();
  const vars = colorVars(color, token as unknown as Record<string, unknown>);
  return (
    <AntdSwitch
      {...props}
      style={vars ? { ...vars, ...style } : style}
      className={cn(switchVariants({ shape }), LABEL_HOVER, className)}
    />
  );
};

Switch.displayName = "Switch";

export { switchVariants };
