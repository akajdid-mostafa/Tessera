"use client";

import type {
  SegmentedProps as AntdSegmentedProps,
  TooltipProps as AntdTooltipProps,
} from "antd";
import { Segmented as AntdSegmented, Tooltip as AntdTooltip } from "antd";
import { type Ref, useMemo } from "react";
import { cn } from "@/registry/antuikit/lib/utils";
import { tooltipVariants } from "@/registry/antuikit/ui/tooltip";

/** Segmented's props, plus a `ref`. */
export interface SegmentedProps<ValueType = string | number>
  extends AntdSegmentedProps<ValueType> {
  /** Forwarded to the root `<div>`. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * Item and thumb corners are the track's radius minus its padding, so they
 * stay concentric at any `borderRadius`. antd picks a fixed radius per size,
 * which only lines up at its default theme. `shape="round"` is skipped because
 * antd pins it to a full pill, and this would beat that.
 */
const CONCENTRIC_ITEM_RADIUS = [
  "[&:not(.ant-segmented-shape-round):not(.ant-segmented-sm):not(.ant-segmented-lg)_:is(.ant-segmented-item,.ant-segmented-thumb)]:rounded-[max(0px,calc(var(--ant-border-radius)_-_var(--ant-segmented-track-padding,var(--ant-line-width-bold))))]",
  "[&.ant-segmented-sm:not(.ant-segmented-shape-round)_:is(.ant-segmented-item,.ant-segmented-thumb)]:rounded-[max(0px,calc(var(--ant-border-radius-sm)_-_var(--ant-segmented-track-padding,var(--ant-line-width-bold))))]",
  "[&.ant-segmented-lg:not(.ant-segmented-shape-round)_:is(.ant-segmented-item,.ant-segmented-thumb)]:rounded-[max(0px,calc(var(--ant-border-radius-lg)_-_var(--ant-segmented-track-padding,var(--ant-line-width-bold))))]",
];

/**
 * Items sit `lineWidth` apart, so the selected item's shadow ring never runs
 * under a neighbor's hover fill.
 */
const ITEM_GAP = "[&_.ant-segmented-group]:gap-[var(--ant-line-width)]";

/** The option shape that can carry a `tooltip`. */
type LabeledOption = Exclude<
  AntdSegmentedProps<string>["options"][number],
  string
>;

/**
 * Adds the kit's small tooltip class to an option tooltip. `classNames` can be
 * a function, so both forms are handled. Ours goes first so the caller's
 * classes win in tailwind-merge.
 */
const withBubbleClass = (
  theirs: AntdTooltipProps["classNames"],
): AntdTooltipProps["classNames"] => {
  const bubble = tooltipVariants({ size: "small" });
  if (typeof theirs === "function") {
    return (info) => {
      const resolved = theirs(info);
      return { ...resolved, container: cn(bubble, resolved?.container) };
    };
  }
  return { ...theirs, container: cn(bubble, theirs?.container) };
};

/**
 * Gives each option's `tooltip` the kit's small bubble and `arrow: false`, and
 * the caller's own config still wins. antd renders option tooltips itself, so
 * the option config is the only way in. A scoped ConfigProvider would replace
 * the app's tooltip config instead of merging with it.
 */
const withKitTooltips = <ValueType,>(
  options: AntdSegmentedProps<ValueType>["options"],
): AntdSegmentedProps<ValueType>["options"] =>
  options.map((option) => {
    if (typeof option !== "object" || option === null) {
      return option;
    }
    // Read-only cast: every labeled arm of the union declares `tooltip` the same way.
    const { tooltip } = option as LabeledOption;
    if (!tooltip) {
      return option;
    }
    const config = typeof tooltip === "string" ? { title: tooltip } : tooltip;
    return {
      ...option,
      tooltip: {
        arrow: false,
        ...config,
        classNames: withBubbleClass(config.classNames),
      },
    };
  });

/**
 * Whether any option has a tooltip. Only then is the control wrapped in
 * `Tooltip.UniqueProvider`, which makes one bubble slide along the row. The
 * provider reaches every tooltip inside, so a Segmented without option
 * tooltips skips it.
 */
const hasTooltip = <ValueType,>(
  options: AntdSegmentedProps<ValueType>["options"],
): boolean =>
  options.some(
    (option) =>
      typeof option === "object" &&
      option !== null &&
      Boolean((option as LabeledOption).tooltip),
  );

/**
 * Segmented with concentric item corners at any theme radius, and option
 * tooltips in the kit's small bubble.
 *
 * For an icon-only option, leave `label` unset and put an `sr-only` word in
 * `icon`. An empty label still adds a gap and pushes the glyph off center.
 */
export const Segmented = <ValueType = string | number>({
  className,
  options,
  ...props
}: SegmentedProps<ValueType>) => {
  // Memoized on the caller's array, so a stable `options` does not re-measure the track.
  const mergedOptions = useMemo(() => withKitTooltips(options), [options]);
  const unique = useMemo(() => hasTooltip(options), [options]);

  const control = (
    <AntdSegmented<ValueType>
      {...props}
      options={mergedOptions}
      // antd's Segmented is a block box, so a column flex or a grid cell
      // stretches its track past the last option. `block` keeps the full width.
      className={cn(CONCENTRIC_ITEM_RADIUS, ITEM_GAP, !props.block && "w-fit", className)}
    />
  );

  return unique ? (
    <AntdTooltip.UniqueProvider>{control}</AntdTooltip.UniqueProvider>
  ) : (
    control
  );
};

Segmented.displayName = "Segmented";
