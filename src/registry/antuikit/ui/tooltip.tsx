"use client";

import type {
  TooltipProps as AntdTooltipProps,
  ConfigProviderProps,
  TooltipRef,
} from "antd";
import { Tooltip as AntdTooltip, ConfigProvider } from "antd";
import { cva } from "class-variance-authority";
import { type Ref, useContext, useMemo } from "react";
import { cn } from "@/registry/antuikit/lib/utils";

/**
 * An empty `motionName` turns rc-motion off, so the bubble shows and hides on
 * the same frame. Zeroing the durations would still step through its stages.
 */
const NO_MOTION = { motionName: "" };

/**
 * A denser bubble than antd's, with no `controlHeight` floor (`min-h-0`). The
 * padding is half of `sizeXS` on the block axis and `sizeXS` inline, from
 * `sizeXS` so it shrinks in compact mode (`sizeXXS` does not). It is held in
 * two variables so `size` and `shape` can change it. Written as `* 0.5`
 * because a bare `/` inside an arbitrary value reads as a Tailwind modifier.
 */
const BUBBLE_INSET = [
  "min-h-0",
  "[--antuikit-tooltip-py:calc(var(--ant-size-xs)*0.5)]",
  "[--antuikit-tooltip-px:var(--ant-size-xs)]",
  "py-(--antuikit-tooltip-py)",
  "px-(--antuikit-tooltip-px)",
];

/**
 * Restores antd's own minimum width (two corner radii plus the arrow), which
 * Slider's stylesheet unsets, so the arrow on a one-digit Slider tooltip keeps
 * a flat edge to sit on. `flex justify-center` centers short content over the
 * arrow and still lets a long title wrap from the start edge, which
 * `text-center` would not. The title arrives wrapped in one `<span>`
 * (`wrapTitle`), so mixed text and elements stay one inline run.
 */
const BUBBLE_MIN_WIDTH = [
  "min-w-[calc(var(--ant-border-radius)*2_+_var(--ant-size-popup-arrow))]",
  "flex",
  "justify-center",
];

/**
 * Under `unique`, these classes land on the shared bubble, which antd hides
 * with `display: none` in `@layer antd`. The `flex` above would win by layer
 * order and leave an empty bubble on screen, so the hidden state is handed back
 * here with a more specific selector.
 */
const UNIQUE_HIDDEN = "[&.ant-tooltip-unique-container-hidden]:hidden";

/**
 * The type is `fontSizeLabel`, clamped to `fontSize - 1px` so it stays a step
 * below body text in compact mode, where a seeded size does not shrink. The
 * line height is antd's `fontSize + 8`, written from `lineHeight` so a theme
 * that changes it moves this too. Keep `leading-*` after `text-(length:…)`:
 * tailwind-merge drops a line height that comes before a font size, which is
 * also how `size="small"`'s `text-sm` replaces both.
 */
const BUBBLE_TYPE = [
  "[--antuikit-tooltip-fs:min(var(--ant-font-size-label,calc(var(--ant-font-size)_-_1px)),calc(var(--ant-font-size)_-_1px))]",
  "text-(length:--antuikit-tooltip-fs)",
  "leading-[calc(var(--antuikit-tooltip-fs)_+_var(--ant-font-size)*var(--ant-line-height)_-_var(--ant-font-size))]",
];

/** The bubble's classes for each `size` and `shape`. */
export const tooltipVariants = cva(
  [...BUBBLE_MIN_WIDTH, ...BUBBLE_INSET, ...BUBBLE_TYPE, UNIQUE_HIDDEN],
  {
    variants: {
      size: {
        medium: "",
        // A step down in type and padding (2px by 6px at the default theme).
        // `text-sm` also replaces the base `leading-*`, so the small bubble
        // gets `fontSizeSM`'s line height.
        small: [
          "text-sm",
          "[--antuikit-tooltip-py:calc(var(--ant-size-xs)*0.25)]",
          "[--antuikit-tooltip-px:calc(var(--ant-size-xs)*0.75)]",
        ],
      },
      shape: {
        default: "",
        // Half of a one-line bubble's height (`0.5lh` plus the block
        // padding), so one line is a pill and a wrapped
        // title keeps the same corners instead of turning into a blob. The
        // inline padding grows 1.5x so text clears the curve.
        round: [
          "rounded-[calc(0.5lh_+_var(--antuikit-tooltip-py))]",
          "px-[calc(var(--antuikit-tooltip-px)*1.5)]",
        ],
        // `corner-shape` only bends the radius it is given, and antd's is too
        // small to read as a squircle, so it doubles. The doubled radius sits
        // behind `@supports`, so other browsers keep antd's radius.
        squircle:
          "corner-squircle supports-[corner-shape:squircle]:rounded-[calc(var(--ant-border-radius-lg)*2)]",
      },
    },
    defaultVariants: {
      size: "medium",
      shape: "default",
    },
  },
);

type OwnClassNames = { root: string; container: string };

type SemanticClassNames = Exclude<
  NonNullable<AntdTooltipProps["classNames"]>,
  (...args: never[]) => unknown
>;

/**
 * A key-wise merge, ours first so a conflicting utility of yours wins in
 * tailwind-merge. antd's function form is wrapped, because `cn()` cannot see
 * into it and ignoring it would drop your classes.
 */
const mergeClassNames = (
  ours: OwnClassNames,
  theirs: TooltipProps["classNames"],
): AntdTooltipProps["classNames"] => {
  if (typeof theirs === "function") {
    return (info) => mergeRecords(ours, theirs(info));
  }
  return mergeRecords(ours, theirs);
};

/** Keys the kit does not style (`arrow`, and any key antd adds) pass through. */
const mergeRecords = (
  ours: OwnClassNames,
  theirs: SemanticClassNames | undefined,
): SemanticClassNames => ({
  ...theirs,
  root: cn(ours.root, theirs?.root),
  container: cn(ours.container, theirs?.container),
});

/** Tooltip's props, plus `size`, `shape`, `transition` and a `ref`. */
export interface TooltipProps extends AntdTooltipProps {
  /**
   * What opens the bubble. The kit adds `focus` to antd's `hover`, so keyboard
   * users see the hint too. A ConfigProvider `tooltip.trigger` still wins.
   *
   * @default ["hover", "focus"]
   */
  trigger?: AntdTooltipProps["trigger"];
  /** Forwarded to the underlying Tooltip. */
  ref?: Ref<TooltipRef>;
  /**
   * Bubble size, where `small` sets smaller type for dense toolbars.
   *
   * @default "medium"
   */
  size?: "small" | "medium";
  /**
   * Corner shape: `round` for a pill on one line that keeps those corners
   * when the title wraps, or `squircle` for superellipse corners
   * in browsers that support `corner-shape`.
   *
   * @default "default"
   */
  shape?: "round" | "squircle" | "default";
  /**
   * Set to `false` to open and close the bubble without its zoom animation.
   *
   * @default true
   */
  transition?: boolean;
}

/**
 * One `<span>` around the title, so the flex bubble has a single item and a
 * title like `Press <kbd>K</kbd> to search` keeps its spaces and line. An
 * empty title is left alone, since antd skips the bubble for it. `min-w-0`
 * lets a title with no spaces, like a URL, wrap inside the bubble.
 */
const wrapTitle = (title: TooltipProps["title"]): TooltipProps["title"] => {
  if (typeof title === "function")
    return () => <span className="min-w-0">{title()}</span>;
  if (title == null || title === false || title === "") return title;
  return <span className="min-w-0">{title}</span>;
};

/** antd opens on hover only, which leaves keyboard users without the hint. */
const DEFAULT_TRIGGER: TooltipProps["trigger"] = ["hover", "focus"];

/**
 * Tooltip with `size`, `shape` and `transition`, a denser bubble, and a
 * default `trigger` that opens on focus.
 *
 * The bubble is a portal, so style it through `classNames` (`root`,
 * `container`, `arrow`), which merges with the kit's classes. Set
 * `getPopupContainer` only when the bubble must scroll or clip with its trigger.
 */
export const Tooltip = ({
  className,
  classNames,
  size,
  shape,
  transition,
  trigger,
  title,
  ...props
}: TooltipProps) => {
  const contextTrigger = useContext(ConfigProvider.ConfigContext).tooltip
    ?.trigger;
  return (
    <AntdTooltip
      {...props}
      title={wrapTitle(title)}
      motion={transition === false ? NO_MOTION : props.motion}
      trigger={trigger ?? contextTrigger ?? DEFAULT_TRIGGER}
      className={cn(className)}
      classNames={mergeClassNames(
        {
          root: "",
          // `cn()` so a size's or shape's padding replaces the base one.
          container: cn(tooltipVariants({ size, shape })),
        },
        classNames,
      )}
    />
  );
};

Tooltip.displayName = "Tooltip";

type TooltipConfig = NonNullable<ConfigProviderProps["tooltip"]>;

/**
 * The kit's bubble as a `<ConfigProvider tooltip>` value, for components that
 * build their own Tooltip and forward no `classNames` (Slider, Progress).
 *
 * The parent's tooltip config is spread back in, since ConfigProvider replaces
 * it instead of merging. The context reaches every Tooltip below it, so prefer
 * a component's own tooltip prop where it has one.
 */
export const useTooltipConfig = (
  size?: TooltipProps["size"],
): TooltipConfig => {
  const parent = useContext(ConfigProvider.ConfigContext).tooltip;
  const container = cn(tooltipVariants({ size }));

  return useMemo(
    () => ({
      ...parent,
      classNames: mergeClassNames({ root: "", container }, parent?.classNames),
    }),
    [parent, container],
  );
};
