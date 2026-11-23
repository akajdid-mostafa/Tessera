"use client";

import type { TagProps as AntdTagProps } from "antd";
import { Tag as AntdTag, theme as antdTheme } from "antd";
import type {
  CheckableTagGroupProps as AntdCheckableTagGroupProps,
  CheckableTagProps as AntdCheckableTagProps,
} from "antd/es/tag";
import type { CheckableTagGroupRef } from "antd/es/tag/CheckableTagGroup";
import { cva } from "class-variance-authority";
import type { CSSProperties, Ref } from "react";
import { cn } from "@/registry/antuikit/lib/utils";
import { Badge, type BadgeProps } from "@/registry/antuikit/ui/badge";
import { Icon } from "@/registry/antuikit/ui/icon";

/**
 * The compound selectors here beat antd by layer order and each other by
 * specificity: fill 0-1-0, solid 0-2-0, disabled fill and text 0-3-0,
 * disabled border 0-4-0. Keep that ladder when you change a selector.
 */
const tagVariants = cva("inline-flex items-center [&>span]:flex", {
  variants: {
    size: {
      medium: "",
      small: [
        "inline-flex items-center px-xxs align-middle",
        // `controlHeightXS`, not `size`: compact mode halves `size`, which
        // would push the label out of the box.
        "h-control-xs",
        // One step below the active small font, capped at `fontSizeXS`, so
        // `small` stays smaller than `medium` in compact mode too.
        "[--antuikit-tag-fs:min(var(--ant-font-size-xs,var(--ant-font-size-sm)),calc(var(--ant-font-size-sm)_-_1px))]",
        "text-(length:--antuikit-tag-fs)",
        // Keep after the font-size class: tailwind-merge drops a `leading-*`
        // listed before `text-(length:…)`, and the line overflows the box.
        "leading-none",
      ],
    },
    shape: {
      default: "",
      round: "rounded-full",
      squircle: [
        "corner-squircle",
        "supports-[corner-shape:squircle]:[--antuikit-tag-corner-scale:1.5]",
        "rounded-[var(--antuikit-tag-radius)]",
      ].join(" "),
    },
    emphasis: {
      default: "",
      subtle: [
        // `border-transparent`, not `border-none`: antd's `filled` keeps the
        // border box, so removing it would shrink the tag.
        "border-transparent",
        "bg-fill-quaternary",
        // The text keeps antd's semantic color, so a subtle error tag still
        // reads as an error. Solid's light text would vanish on this fill.
        "[&.ant-tag-solid]:text-text",
        // These outrank antd's disabled rules, so the disabled look is
        // restated here, with a border only on outlined tags, as antd does.
        "[&.ant-tag.ant-tag-disabled.ant-tag-outlined]:border-border-disabled",
        "[&.ant-tag.ant-tag-disabled]:bg-container-disabled",
        "[&.ant-tag.ant-tag-disabled]:text-disabled",
      ],
    },
  },
  defaultVariants: {
    emphasis: "default",
    size: "medium",
    shape: "default",
  },
  // The squircle radius is antd's scaled 1.5x and capped at 45% of the
  // height, so the bent corner reads like the default one. The cap differs
  // per size, hence a compound variant. The scale is set only under
  // `@supports`, so other browsers keep antd's own radius. A small tag takes
  // `borderRadiusSM` minus half `sizeXXS` (4px), never below `borderRadiusXS`.
  compoundVariants: [
    {
      shape: "default",
      size: "small",
      class:
        "[--antuikit-tag-radius:max(var(--ant-border-radius-xs),calc(var(--ant-border-radius-sm)_-_var(--ant-size-xxs)*0.5))] rounded-[var(--antuikit-tag-radius)]",
    },
    {
      shape: "squircle",
      size: "medium",
      class:
        "[--antuikit-tag-radius:min(calc(var(--ant-border-radius-sm)*var(--antuikit-tag-corner-scale,1)),max(var(--ant-border-radius-sm),calc(var(--ant-font-size-sm)*var(--ant-line-height-sm)*0.45)))]",
    },
    {
      shape: "squircle",
      size: "small",
      class:
        "[--antuikit-tag-radius:min(calc(max(var(--ant-border-radius-xs),calc(var(--ant-border-radius-sm)_-_var(--ant-size-xxs)*0.5))*var(--antuikit-tag-corner-scale,1)),max(max(var(--ant-border-radius-xs),calc(var(--ant-border-radius-sm)_-_var(--ant-size-xxs)*0.5)),calc(var(--ant-control-height-xs)*0.45)))]",
    },
  ],
});

/**
 * Preset text at shade 8 instead of antd's shade 7, which misses WCAG AA on
 * most presets, and status text from the `-text` token instead of antd's base
 * color. The guards are needed because `variant` and `disabled` can come from
 * context. Solid tags keep antd's light text, and `pink` (an alias of
 * `magenta`) already passes.
 */
const PRESET_TEXT_AA: Record<string, string> = {
  success:
    "[&.ant-tag-success:not(.ant-tag-solid):not(.ant-tag-disabled)]:text-success-text",
  processing:
    "[&.ant-tag-processing:not(.ant-tag-solid):not(.ant-tag-disabled)]:text-info-text",
  warning:
    "[&.ant-tag-warning:not(.ant-tag-solid):not(.ant-tag-disabled)]:text-warning-text",
  error:
    "[&.ant-tag-error:not(.ant-tag-solid):not(.ant-tag-disabled)]:text-error-text",
  blue: "[&.ant-tag-blue:not(.ant-tag-solid):not(.ant-tag-disabled)]:text-blue-8",
  purple:
    "[&.ant-tag-purple:not(.ant-tag-solid):not(.ant-tag-disabled)]:text-purple-8",
  cyan: "[&.ant-tag-cyan:not(.ant-tag-solid):not(.ant-tag-disabled)]:text-cyan-8",
  green:
    "[&.ant-tag-green:not(.ant-tag-solid):not(.ant-tag-disabled)]:text-green-8",
  magenta:
    "[&.ant-tag-magenta:not(.ant-tag-solid):not(.ant-tag-disabled)]:text-magenta-8",
  red: "[&.ant-tag-red:not(.ant-tag-solid):not(.ant-tag-disabled)]:text-red-8",
  orange:
    "[&.ant-tag-orange:not(.ant-tag-solid):not(.ant-tag-disabled)]:text-orange-8",
  yellow:
    "[&.ant-tag-yellow:not(.ant-tag-solid):not(.ant-tag-disabled)]:text-yellow-8",
  volcano:
    "[&.ant-tag-volcano:not(.ant-tag-solid):not(.ant-tag-disabled)]:text-volcano-8",
  geekblue:
    "[&.ant-tag-geekblue:not(.ant-tag-solid):not(.ant-tag-disabled)]:text-geekblue-8",
  lime: "[&.ant-tag-lime:not(.ant-tag-solid):not(.ant-tag-disabled)]:text-lime-8",
  gold: "[&.ant-tag-gold:not(.ant-tag-solid):not(.ant-tag-disabled)]:text-gold-8",
};

/**
 * A theme palette's ramp, as inline custom properties. The classes below use
 * fixed names because Tailwind cannot compile `bg-(--ant-${name}-1)`. Your
 * own `style` is spread after these, so it still wins.
 */
const PALETTE_RAMP = (name: string): CSSProperties =>
  ({
    "--antuikit-tag-light": `var(--ant-${name}-1)`,
    "--antuikit-tag-border": `var(--ant-${name}-3)`,
    "--antuikit-tag-dark": `var(--ant-${name}-6)`,
    "--antuikit-tag-text": `var(--ant-${name}-8)`,
    "--antuikit-tag-solid-bg": `var(--ant-${name}-8)`,
    "--antuikit-tag-solid-bg-dark": `var(--ant-${name}-4)`,
  }) as CSSProperties;

/**
 * The `emphasis="subtle"` subset: text only, so subtle's neutral fill wins.
 * These share a layer with subtle's own rules, so the standoff is arranged in
 * JS rather than left to the cascade.
 */
const PALETTE_TEXT_CLASSES = [
  "[&.ant-tag-filled:not(.ant-tag-disabled)]:text-(--antuikit-tag-text)",
  "[&.ant-tag-outlined:not(.ant-tag-disabled)]:text-(--antuikit-tag-text)",
];

/**
 * antd's own preset treatment, rebuilt for palettes it does not know:
 * shade 1 fills, shade 3 borders the outlined variant, shade 6 is the solid
 * fill. Keyed on the `ant-tag-<variant>` class antd stamps, because `variant`
 * can arrive from ConfigProvider context the wrapper cannot read.
 */
const PALETTE_FILL_CLASSES = [
  ...PALETTE_TEXT_CLASSES,
  "[&.ant-tag-filled:not(.ant-tag-disabled)]:bg-(--antuikit-tag-light)",
  "[&.ant-tag-outlined:not(.ant-tag-disabled)]:bg-(--antuikit-tag-light)",
  "[&.ant-tag-outlined:not(.ant-tag-disabled)]:border-(--antuikit-tag-border)",
  "[&.ant-tag-solid:not(.ant-tag-disabled)]:bg-(--antuikit-tag-dark)",
  "[&.ant-tag-solid:not(.ant-tag-disabled)]:border-(--antuikit-tag-dark)",
];

/**
 * The neutral arm is appended rather than substituted: only the unprefixed
 * member competes with the shade-6 fill above, and `cn()` collapses that one
 * since both are the same tailwind-merge group.
 */
const PALETTE_TREATMENT_CLASSES = (neutral: boolean) => [
  ...PALETTE_FILL_CLASSES,
  "[&.ant-tag-solid:not(.ant-tag-disabled)]:text-text-light-solid",
  ...(neutral ? NEUTRAL_SOLID_FILL : []),
];

/**
 * Is this palette a gray ramp rather than a hue? Read from the live ramp, so
 * a theme's own grays classify themselves. Hues sit far above the 0.5
 * saturation cut and grays far below it.
 */
const isNeutralPalette = (
  name: string,
  token: Record<string, unknown>,
): boolean => {
  const hex = token[`${name}6`];
  if (typeof hex !== "string") return false;
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
 * A gray shade 6 is too light for white text, so a solid neutral tag fills
 * two steps darker: shade 8 in light mode and shade 4 in dark, because the
 * ramps run in opposite directions.
 */
const NEUTRAL_SOLID_FILL = [
  "[&.ant-tag-solid:not(.ant-tag-disabled)]:bg-(--antuikit-tag-solid-bg)",
  "[&.ant-tag-solid:not(.ant-tag-disabled)]:border-(--antuikit-tag-solid-bg)",
  "dark:[&.ant-tag-solid:not(.ant-tag-disabled)]:bg-(--antuikit-tag-solid-bg-dark)",
  "dark:[&.ant-tag-solid:not(.ant-tag-disabled)]:border-(--antuikit-tag-solid-bg-dark)",
];

/**
 * The theme palette a `color` names, or `undefined` if antd handles it. A
 * name counts when it is not an antd preset and the theme has its ramp, so
 * your own palettes work without a list.
 */
const paletteNameOf = (
  color: AntdTagProps["color"] | BadgeProps["color"],
  token: Record<string, unknown>,
): string | undefined => {
  if (typeof color !== "string") return undefined;
  if (color in antdTheme.defaultSeed) return undefined;
  if (!/^[a-z][a-z0-9]*$/.test(color)) return undefined;
  return typeof token[`${color}1`] === "string" &&
    typeof token[`${color}8`] === "string"
    ? color
    : undefined;
};

/**
 * The close glyph takes the tag's text color, where antd paints it gray even
 * beside red text. The disabled opacity is pinned because antd's disabled
 * close icon still receives hover.
 */
const CLOSE_ICON_COLOR = cn(
  "text-inherit",
  "opacity-80 hover:opacity-100",
  "[.ant-tag-disabled_&]:opacity-100",
);

type TagClassNames = Exclude<
  NonNullable<AntdTagProps["classNames"]>,
  (...args: never[]) => unknown
>;

/**
 * Puts the close color on antd's `close` slot, so a `closeIcon` of yours gets
 * it too. Ours first, so a conflicting utility of yours wins.
 */
const withCloseColor = (
  theirs: AntdTagProps["classNames"],
): AntdTagProps["classNames"] => {
  const merge = (resolved: TagClassNames | undefined): TagClassNames => ({
    ...resolved,
    close: cn(CLOSE_ICON_COLOR, resolved?.close),
  });
  if (typeof theirs === "function") return (info) => merge(theirs(info));
  return merge(theirs);
};

/**
 * antd sizes the × from the default scale, so a small tag keeps a full-size
 * glyph. The small class applies antd's formula to the small font instead.
 */
const CLOSE_ICON_SIZE = {
  medium: "flex",
  small:
    "text-[length:calc(var(--antuikit-tag-fs)_-_var(--ant-line-width)*2)] flex ",
} as const;

/** Badge's status values. */
export type TagStatus = NonNullable<BadgeProps["status"]>;

/** Badge does not know palette names either, so pass it the variable. */
const statusDotColor = (
  statusColor: BadgeProps["color"],
  token: Record<string, unknown>,
): BadgeProps["color"] => {
  const palette = paletteNameOf(statusColor, token);
  return palette ? `var(--ant-${palette}-6)` : statusColor;
};

/** A tag carrying only an icon becomes a square, derived from its own height. */
const ICON_ONLY = {
  medium:
    "inline-flex size-md shrink-0 items-center justify-center p-0 align-middle [&>span]:ms-0",
  small:
    "inline-flex h-control-xs w-[var(--ant-control-height-xs)] shrink-0 items-center justify-center p-0 align-middle [&>span]:ms-0",
} as const;

/**
 * An optical inset: a glyph's box has whitespace a letter does not, so the
 * icon is pulled toward the edge. It is a fraction of `sizeXXS`, since an
 * `em` fraction blurs to a sub-pixel margin.
 */
const ICON_INSET_LEAD = {
  medium: [
    "[&>svg:first-child]:-ms-[calc(var(--ant-size-xxs)*0.5)]",
    "[&>.anticon:first-child]:-ms-[calc(var(--ant-size-xxs)*0.5)]",
    "[&>svg+span]:ms-xxs",
    "[&>span+svg]:ms-xxs",
    "[&>.anticon+span]:ms-xxs",
    "[&>span+.anticon]:ms-xxs",
  ],
  small: [
    "[&>svg:first-child]:-ms-[calc(var(--ant-size-xxs)*0.25)]",
    "[&>.anticon:first-child]:-ms-[calc(var(--ant-size-xxs)*0.25)]",
    "[&>svg+span]:ms-xxs",
    "[&>span+svg]:ms-xxs",
    "[&>.anticon+span]:ms-xxs",
    "[&>span+.anticon]:ms-xxs",
  ],
} as const;

const ICON_INSET_CLOSE = "-me-[calc(var(--ant-size-xxs)*0.5)]";

/** The padding override is a 0-2-0 compound so it beats `small`'s own `px-xxs`. */
const AVATAR_HOST =
  "inline-flex items-center align-middle [&.ant-tag]:ps-[calc(var(--ant-size-xxs)*0.5)]";

/** The tag's content height minus twice the inset, so the gaps come out equal. */
const AVATAR_IMG = {
  medium:
    "h-[calc(var(--ant-font-size-sm)*var(--ant-line-height-sm)_-_var(--ant-size-xxs))]",
  small:
    "h-[calc(var(--ant-control-height-xs)_-_var(--ant-size-xxs)_-_var(--ant-line-width)*2)]",
} as const;

/**
 * Concentric corners: inner radius = outer radius − inset. Only `squircle`
 * sets `--antuikit-tag-radius`, so the fallback covers every other shape.
 */
const AVATAR_RADIUS_CONCENTRIC =
  "rounded-[max(0px,calc(var(--antuikit-tag-radius,var(--ant-border-radius-sm))_-_var(--ant-size-xxs)*0.5))]";

const AVATAR_SHAPE = {
  default: AVATAR_RADIUS_CONCENTRIC,
  round: "rounded-full",
  squircle: cn("corner-squircle", AVATAR_RADIUS_CONCENTRIC),
} as const;

/** Tag's props, plus `emphasis`, `size`, `shape`, `status`, `statusColor`, `avatar` and a `ref`. */
export interface TagProps extends AntdTagProps {
  /**
   * `subtle` uses a neutral fill and no border, keeping the colored text.
   *
   * @default "default"
   */
  emphasis?: "subtle" | "default";
  /**
   * `small` is a shorter tag with smaller text, for dense metadata.
   *
   * @default "medium"
   */
  size?: "small" | "medium";
  /**
   * `squircle` smooths the corners in Chromium 139 and later, and `round` makes a pill.
   *
   * @default "default"
   */
  shape?: "default" | "squircle" | "round";
  /** Shows a Badge status dot before the label. */
  status?: TagStatus;
  /** The dot's own color, which also shows a plain dot without `status`. */
  statusColor?: BadgeProps["color"];
  /** An image URL shown as a small picture at the start of the tag. */
  avatar?: string;
  /** Forwarded to the root element. */
  ref?: Ref<HTMLSpanElement | HTMLAnchorElement>;
}

/** Your own `closeIcon` always wins and is never wrapped. */
const withCloseIcon = (
  closable: TagProps["closable"],
  closeIcon: TagProps["closeIcon"],
  size: NonNullable<TagProps["size"]>,
): TagProps["closeIcon"] => {
  if (closeIcon !== undefined && closeIcon !== null) return closeIcon;
  if (closable === undefined || closable === false) return closeIcon;
  return (
    <span className={cn(ICON_INSET_CLOSE, CLOSE_ICON_SIZE[size])}>
      <Icon name="close" />
    </span>
  );
};

const TagRoot = ({
  emphasis,
  size,
  shape,
  status,
  statusColor,
  avatar,
  className,
  classNames,
  closable,
  closeIcon,
  color,
  style,
  icon,
  children,
  ...props
}: TagProps) => {
  const { token } = antdTheme.useToken();
  const tokens = token as unknown as Record<string, unknown>;
  const palette = paletteNameOf(color, tokens);
  const neutral = palette ? isNeutralPalette(palette, tokens) : false;
  const childless =
    children === undefined || children === null || children === false;
  const iconOnly = Boolean(icon) && !avatar && childless;
  const dot = status !== undefined || statusColor !== undefined;

  return (
    <AntdTag
      {...props}
      icon={icon}
      color={palette ? undefined : color}
      style={palette ? { ...PALETTE_RAMP(palette), ...style } : style}
      closable={closable}
      classNames={withCloseColor(classNames)}
      closeIcon={withCloseIcon(closable, closeIcon, size ?? "medium")}
      className={cn(
        color && !palette ? PRESET_TEXT_AA[color] : undefined,
        palette
          ? emphasis === "subtle"
            ? PALETTE_TEXT_CLASSES
            : PALETTE_TREATMENT_CLASSES(neutral)
          : undefined,
        tagVariants({ emphasis, size, shape }),
        iconOnly ? ICON_ONLY[size ?? "medium"] : undefined,
        icon && !iconOnly ? ICON_INSET_LEAD[size ?? "medium"] : undefined,
        avatar ? AVATAR_HOST : undefined,
        className,
      )}
    >
      {avatar ? (
        <img
          src={avatar}
          alt=""
          className={cn(
            "aspect-square shrink-0 object-cover",
            AVATAR_IMG[size ?? "medium"],
            AVATAR_SHAPE[shape ?? "default"],
            (!childless || dot) && "me-xxs",
          )}
        />
      ) : null}
      {dot ? (
        <Badge
          status={status}
          color={statusDotColor(statusColor, tokens)}
          classNames={{ indicator: "top-auto" }}
          className="me-xxs"
          elevated={false}
        />
      ) : null}
      {children}
    </AntdTag>
  );
};

TagRoot.displayName = "Tag";

/** Tag.CheckableTag's props, plus `size`, `shape` and a `ref`. */
export interface CheckableTagProps extends AntdCheckableTagProps {
  /** Forwarded to the root `<span>`. */
  ref?: Ref<HTMLSpanElement>;
  /**
   * `small` is a shorter tag with smaller text, as on Tag.
   *
   * @default "medium"
   */
  size?: "small" | "medium";
  /**
   * Corner shape, as on Tag: `squircle` (Chromium 139 and later), `round` for a pill, or `default`.
   *
   * @default "default"
   */
  shape?: "squircle" | "round" | "default";
}

/** Tag.CheckableTag with Tag's `size` and `shape`. */
const CheckableTag = ({
  size,
  shape,
  className,
  ...props
}: CheckableTagProps) => (
  <AntdTag.CheckableTag
    {...props}
    className={cn(tagVariants({ size, shape }), className)}
  />
);

CheckableTag.displayName = "Tag.CheckableTag";

/** Tag.CheckableTagGroup's props, generic over the option value, plus `size`, `shape` and a `ref`. */
export type CheckableTagGroupProps<T extends string | number = string> =
  AntdCheckableTagGroupProps<T> & {
    /** Forwarded to antd's group, whose `nativeElement` is the root `<div>`. */
    ref?: Ref<CheckableTagGroupRef>;
    /**
     * `small` gives every option a shorter tag with smaller text.
     *
     * @default "medium"
     */
    size?: "small" | "medium";
    /**
     * Corner shape of every option: `squircle` (Chromium 139 and later), `round` for a pill, or `default`.
     *
     * @default "default"
     */
    shape?: "squircle" | "round" | "default";
  };

type CheckableTagGroupClassNames = Exclude<
  NonNullable<AntdCheckableTagGroupProps["classNames"]>,
  (...args: never[]) => unknown
>;

/** Adds the item classes to antd's `item` slot, ours first so yours win. */
const withItemClasses = (
  theirs: AntdCheckableTagGroupProps["classNames"],
  ours: string,
): AntdCheckableTagGroupProps["classNames"] => {
  const merge = (
    resolved: CheckableTagGroupClassNames | undefined,
  ): CheckableTagGroupClassNames => ({
    ...resolved,
    item: cn(ours, resolved?.item),
  });
  if (typeof theirs === "function") return (info) => merge(theirs(info));
  return merge(theirs);
};

/** Tag.CheckableTagGroup with Tag's `size` and `shape` on every option. */
const CheckableTagGroup = <T extends string | number = string>(
  props: CheckableTagGroupProps<T>,
) => {
  const { size, shape, classNames, ...rest } = props;
  return (
    <AntdTag.CheckableTagGroup<T>
      {...rest}
      classNames={withItemClasses(classNames, tagVariants({ size, shape }))}
    />
  );
};

CheckableTagGroup.displayName = "Tag.CheckableTagGroup";

/**
 * Tag with `emphasis`, `size`, `shape`, a status dot, an avatar and theme palette colors.
 *
 * `color` takes a palette from your theme as well as antd's presets, and
 * preset text is darkened to meet WCAG AA. `Tag.CheckableTag` and
 * `Tag.CheckableTagGroup` take the same `size` and `shape`.
 */
export const Tag = Object.assign(TagRoot, {
  CheckableTag,
  CheckableTagGroup,
});

export { CheckableTag, CheckableTagGroup, tagVariants };
