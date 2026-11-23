"use client";

import type {
  AvatarProps as AntdAvatarProps,
  BadgeProps,
  GetProps,
} from "antd";
import { Avatar as AntdAvatar, theme as antdTheme, Grid } from "antd";
import { cva } from "class-variance-authority";
import type { ComponentRef, CSSProperties, ReactNode, Ref } from "react";
import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/registry/antuikit/lib/utils";

/** antd's own `shape` union, derived so a value antd adds flows in. */
type AntdAvatarShape = NonNullable<AntdAvatarProps["shape"]>;

/**
 * The squircle's radius: antd's scaled 1.5x, since a bent corner reads smaller
 * at the same value, and capped at 45% of the box so a small avatar does not
 * become a circle. A percentage because a numeric `size` leaves antd's radius
 * alone. The scale is only set behind `@supports`, so a browser without
 * `corner-shape` keeps antd's corner.
 */
const AVATAR_RADIUS = [
  "[--antuikit-avatar-radius:min(calc(var(--ant-border-radius)*var(--antuikit-avatar-corner-scale,1)),max(var(--ant-border-radius),45%))]",
  "[&.ant-avatar-sm]:[--antuikit-avatar-radius:min(calc(var(--ant-border-radius-sm)*var(--antuikit-avatar-corner-scale,1)),max(var(--ant-border-radius-sm),45%))]",
  "[&.ant-avatar-lg]:[--antuikit-avatar-radius:min(calc(var(--ant-border-radius-lg)*var(--antuikit-avatar-corner-scale,1)),max(var(--ant-border-radius-lg),45%))]",
].join(" ");

/** Every shape has a key. antd draws `circle` and `square` itself. */
const avatarVariants = cva("", {
  variants: {
    shape: {
      circle: "",
      square: "",
      squircle: [
        "corner-squircle",
        "supports-[corner-shape:squircle]:[--antuikit-avatar-corner-scale:1.5]",
        AVATAR_RADIUS,
        "rounded-[var(--antuikit-avatar-radius)]",
      ].join(" "),
    },
  },
  defaultVariants: { shape: "circle" },
});

/**
 * A ring so stacked avatars separate from what is behind them. `shrink-0`
 * stops antd's `inline-flex` avatar from squashing into an oval in a flex row.
 */
const AVATAR_RING = "shrink-0 border-[length:var(--ant-line-width)]";

/** The ramp steps the color axis paints with, named by role. */
const rampVars = (name: string, neutral: boolean): CSSProperties =>
  ({
    "--antuikit-avatar-fill": `var(--ant-${name}-1)`,
    "--antuikit-avatar-border": `var(--ant-${name}-3)`,
    "--antuikit-avatar-ink": `var(--ant-${name}-8)`,
    // White on a neutral shade 6 is unreadable, so a neutral solid fill moves
    // darker: shade 8 in light mode and 4 in dark, where the ramp runs the
    // other way.
    "--antuikit-avatar-solid": `var(--ant-${name}-${neutral ? 8 : 6})`,
    "--antuikit-avatar-solid-dark": `var(--ant-${name}-${neutral ? 4 : 6})`,
  }) as CSSProperties;

/**
 * The `color` name if the active theme has a ramp for it (an antd preset or a
 * theme palette), or `undefined` to leave the avatar alone. A hex, `"tomato"`
 * or a status color has no ramp.
 */
const rampNameOf = (
  color: BadgeProps["color"],
  token: Record<string, unknown>,
): string | undefined => {
  if (typeof color !== "string") return undefined;
  if (!/^[a-z][a-z0-9]*$/.test(color)) return undefined;
  return typeof token[`${color}1`] === "string" &&
    typeof token[`${color}8`] === "string"
    ? color
    : undefined;
};

/** Whether a ramp is a gray, read off shade 6 so a theme's neutrals count. */
const isNeutralRamp = (
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
 * Gated on `:not(.ant-avatar-image)` in CSS rather than on `src` in JS: antd
 * drops that class when an image fails, so the fallback gets its color back.
 * The ramp steps arrive as inline variables under fixed classes, because
 * Tailwind only generates classes it finds written out in source.
 */
const VARIANT_CLASSES = {
  filled: [
    "[&:not(.ant-avatar-image)]:bg-(--antuikit-avatar-fill)",
    "[&:not(.ant-avatar-image)]:text-(--antuikit-avatar-ink)",
  ],
  solid: [
    "[&:not(.ant-avatar-image)]:bg-(--antuikit-avatar-solid)",
    "dark:[&:not(.ant-avatar-image)]:bg-(--antuikit-avatar-solid-dark)",
    "[&:not(.ant-avatar-image)]:text-text-light-solid",
  ],
  outlined: [
    "[&:not(.ant-avatar-image)]:bg-transparent",
    "[&:not(.ant-avatar-image)]:border-(--antuikit-avatar-border)",
    "[&:not(.ant-avatar-image)]:text-(--antuikit-avatar-ink)",
  ],
} as const;

/**
 * The colorless avatar. antd's white-on-gray pairing is unreadable in light
 * mode, so this is `colorFillSecondary` under `colorTextSecondary`. The pair is
 * flat, not gated like the ramp classes, so a `bg-*` or `text-*` in a caller's
 * `className` replaces it through `cn()` instead of losing to it.
 */
const DEFAULT_CLASSES = ["bg-fill-secondary", "text-secondary"];

/**
 * antd's transparent background for image avatars, restated so the flat fill
 * above does not show around or through the photo.
 */
const IMAGE_RESET = "[&.ant-avatar-image]:bg-transparent";

/**
 * Places `indicator` on the shape's own corner arc rather than on the box
 * corner, where antd's `<Badge>` puts it. The inset is read in CSS with
 * `:has()` because `shape` can come from a group. All four corners anchor with
 * `top` and `inset-inline-start`, so the node's size and RTL cannot move it.
 * The two centers sit on the straight edge, which every shape reaches at its
 * midpoint, so they need no arc.
 */
const INDICATOR_HOST = [
  "relative inline-block",
  // An image's <img> fills the content box, one border inside the painted
  // edge, so the arc starts that much further in.
  "[--antuikit-avatar-edge:0px]",
  "[&:has(>.ant-avatar-image)]:[--antuikit-avatar-edge:var(--ant-line-width-bold)]",
  // Squares take antd's radius per size class. A numeric size keeps the base.
  "[&:has(>.ant-avatar-circle)]:[--antuikit-avatar-corner:50%]",
  "[&:has(>.ant-avatar-square)]:[--antuikit-avatar-corner:var(--ant-border-radius)]",
  "[&:has(>.ant-avatar-square.ant-avatar-lg)]:[--antuikit-avatar-corner:var(--ant-border-radius-lg)]",
  "[&:has(>.ant-avatar-square.ant-avatar-sm)]:[--antuikit-avatar-corner:var(--ant-border-radius-sm)]",
  // A squircle's corner is fuller, so it takes a smaller arc constant. Both
  // are guarded, so without `corner-shape` support the round values apply.
  "[--antuikit-avatar-arc:0.2929]",
  "supports-[corner-shape:squircle]:[&:has(>.corner-squircle)]:[--antuikit-avatar-arc:0.1591]",
  "supports-[corner-shape:squircle]:[&:has(>.corner-squircle)]:[--antuikit-avatar-corner-scale:1.5]",
  // The same radius formula as AVATAR_RADIUS, so the anchor follows the shape.
  "[--antuikit-avatar-inset:calc(var(--antuikit-avatar-edge)_+_(min(calc(var(--antuikit-avatar-corner)*var(--antuikit-avatar-corner-scale,1)),max(var(--antuikit-avatar-corner),45%))_-_var(--antuikit-avatar-edge))*var(--antuikit-avatar-arc))]",
].join(" ");

/**
 * `flex` keeps antd's inline-block Badge out of a line box, which would shift
 * the centering. The status dot and the plain dot are made block with antd's
 * `top` nudge removed, as antd already does for the count, so each one is
 * centered on the point at any `dotSize`.
 */
const INDICATOR_ANCHOR = [
  "absolute flex -translate-x-1/2 -translate-y-1/2",
  "[&_.ant-badge-status-dot]:block [&_.ant-badge-status-dot]:top-0",
  "[&_.ant-badge-dot]:block [&_.ant-badge-dot]:top-0",
  // antd's childless reset skips `-dot`, so a `<Badge dot />` keeps a
  // transform. The anchor centers with `translate`, a separate property.
  "[&_.ant-badge-dot]:transform-none",
].join(" ");

const INDICATOR_POSITION = {
  "top-start":
    "top-[var(--antuikit-avatar-inset)] start-[var(--antuikit-avatar-inset)]",
  "top-center": "top-[var(--antuikit-avatar-edge)] left-1/2",
  "top-end":
    "top-[var(--antuikit-avatar-inset)] start-[calc(100%_-_var(--antuikit-avatar-inset))]",
  "bottom-start":
    "top-[calc(100%_-_var(--antuikit-avatar-inset))] start-[var(--antuikit-avatar-inset)]",
  "bottom-center": "top-[calc(100%_-_var(--antuikit-avatar-edge))] left-1/2",
  "bottom-end":
    "top-[calc(100%_-_var(--antuikit-avatar-inset))] start-[calc(100%_-_var(--antuikit-avatar-inset))]",
} as const;

/**
 * Avatar's props, with a `squircle` value on `shape` and the kit's `variant`,
 * `color`, `indicator` and `indicatorPosition`. `shape` is omitted and declared
 * again because an interface cannot widen an inherited union.
 */
export interface AvatarProps extends Omit<AntdAvatarProps, "shape"> {
  /**
   * Corner shape: `circle`, `square`, or `squircle`, a smooth superellipse
   * corner. `squircle` renders as `square` in browsers without `corner-shape`.
   *
   * @default "circle"
   */
  shape?: AntdAvatarShape | "squircle";
  /**
   * How `color` is painted: `filled` (a tint with dark text, the default once
   * `color` is set), `solid` (the ramp's mid tone with white text) or
   * `outlined` (a colored border and text). Ignored without `color`, and on an
   * image until its `src` fails. `solid` misses AA on most warm presets.
   */
  variant?: "filled" | "solid" | "outlined";
  /**
   * Which ramp paints the avatar: antd's presets (`blue`, `green`, `gold` and
   * the rest) or a palette from your theme (the default theme adds `amber`,
   * `emerald`, `teal`, `sky`, `indigo`, `violet`, `fuchsia`, `rose` and grays
   * like `slate` and `zinc`). A name with no ramp, like a hex, leaves it
   * unpainted, so use `style={{ backgroundColor }}` for a one-off color.
   */
  color?: BadgeProps["color"];
  /**
   * A node on the avatar's corner or edge, like a childless
   * `<Badge count={3} />`, a status dot or a small icon, placed on the shape's
   * edge at every size. Adds a wrapper element only when set. `className`,
   * `style` and `ref` still go to the avatar.
   */
  indicator?: ReactNode;
  /**
   * Where the `indicator` sits: a corner, or the middle of the top or bottom
   * edge. `start` and `end` follow the text direction.
   *
   * @default "top-end"
   */
  indicatorPosition?: keyof typeof INDICATOR_POSITION;
  /** Forwarded to the avatar's root span. */
  ref?: Ref<HTMLSpanElement>;
}

/**
 * Repairs the fallback when an image fails fast. antd resets its "image
 * exists" state in an effect on mount, so a `src` that fails first (a `data:`
 * URI, a cached 404) loses the failure and stays a broken image. The effect
 * replays the error after antd's has run. `replaying` keeps the replay from
 * the caller's `onError`, and a caller that returned `false` is left alone.
 */
function useImageErrorReplay(
  src: AvatarProps["src"],
  onError: AvatarProps["onError"],
) {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const failure = useRef<{
    /** The `src` that failed, so a stale answer cannot repair a newer image. */
    src?: AvatarProps["src"];
    /** The caller's `onError` returned `false`. */
    prevented: boolean;
    /** This event is the effect's own replay, not the browser's. */
    replaying: boolean;
  }>({ prevented: false, replaying: false });

  const handleImageError = () => {
    const state = failure.current;
    if (state.replaying) return true;
    state.src = src;
    state.prevented = onError?.() === false;
    // antd reads this as `errorFlag !== false`, so `true` is its own default.
    return !state.prevented;
  };

  useEffect(() => {
    const state = failure.current;
    // `src` is a ReactNode on antd's other branch, which renders no `<img>`
    // and has no error to lose.
    if (typeof src !== "string") return;
    if (state.src !== src || state.prevented) return;

    const img = rootRef.current?.querySelector("img");
    // antd's own swap landed, which is the ordinary case. Nothing to repair,
    // and nothing that would call `onError` twice.
    if (!img) return;

    state.replaying = true;
    img.dispatchEvent(new Event("error"));
    state.replaying = false;
  }, [src]);

  return { rootRef, handleImageError };
}

/**
 * Holds the root span for the hook above while still passing `ref` to the
 * caller, honoring a callback ref's returned cleanup.
 */
function useComposedRef(
  ours: { current: HTMLSpanElement | null },
  theirs: Ref<HTMLSpanElement> | undefined,
) {
  return useCallback(
    (node: HTMLSpanElement | null) => {
      ours.current = node;
      if (typeof theirs === "function") {
        const cleanup = theirs(node);
        return () => {
          ours.current = null;
          if (typeof cleanup === "function") cleanup();
          else theirs(null);
        };
      }
      if (theirs) theirs.current = node;
      return () => {
        ours.current = null;
        if (theirs) theirs.current = null;
      };
    },
    [ours, theirs],
  );
}

/**
 * antd has no `squircle`, so it gets `square`. `undefined` would fall back to
 * antd's circle, and the indicator's square styles key on `ant-avatar-square`.
 */
const forwardedShape = (
  shape: AvatarProps["shape"],
): AntdAvatarShape | undefined => (shape === "squircle" ? "square" : shape);

const AvatarRoot = ({
  className,
  shape,
  variant,
  color,
  indicator,
  indicatorPosition = "top-end",
  style,
  src,
  onError,
  ref,
  ...props
}: AvatarProps) => {
  const { token } = antdTheme.useToken();
  const { rootRef, handleImageError } = useImageErrorReplay(src, onError);
  const setRoot = useComposedRef(rootRef, ref);
  const tokens = token as unknown as Record<string, unknown>;
  const ramp = rampNameOf(color, tokens);

  // `color` alone means `filled`, the common case; `variant` alone paints
  // nothing, because there is no ramp to paint with.
  const treatment = ramp === undefined ? undefined : (variant ?? "filled");

  const avatar = (
    <AntdAvatar
      {...props}
      src={src}
      onError={handleImageError}
      ref={setRoot}
      shape={forwardedShape(shape)}
      style={
        ramp === undefined
          ? style
          : { ...rampVars(ramp, isNeutralRamp(ramp, tokens)), ...style }
      }
      className={cn(
        AVATAR_RING,
        avatarVariants({ shape }),
        treatment ? VARIANT_CLASSES[treatment] : [DEFAULT_CLASSES, IMAGE_RESET],
        className,
      )}
    />
  );

  if (indicator === undefined || indicator === null) return avatar;

  return (
    <span className={INDICATOR_HOST}>
      {avatar}
      <span
        className={cn(INDICATOR_ANCHOR, INDICATOR_POSITION[indicatorPosition])}
      >
        {indicator}
      </span>
    </span>
  );
};

/** antd's own Avatar.Group props, plus a `ref`. */
export interface AvatarGroupProps extends GetProps<typeof AntdAvatar.Group> {
  /** Forwarded to antd's group, whose handle holds the root `<div>`. */
  ref?: Ref<ComponentRef<typeof AntdAvatar.Group>>;
  /** How far each avatar slides under the one before it. `small` is antd's. */
  overlap?: "none" | "small" | "medium" | "large";
  /** Sets the group on a raised surface whose corners follow `shape`. */
  surface?: boolean;
  /** Spreads the avatars apart on hover and on keyboard focus. */
  expandOnHover?: boolean;
}

/**
 * antd builds the `+n` chip itself with no `className`, so the group styles it
 * from its root: an opaque fill, readable ink and a thicker border that
 * separates the overlap. Photo avatars keep antd's transparent fill, and an
 * avatar with a `color` keeps its own, found by the ramp variable it carries
 * inline. Recolor one chip with `max.style`.
 */
const AVATAR_GROUP = [
  "[&_.ant-avatar]:border-[length:var(--ant-line-width-bold)]",
  "[&_.ant-avatar:not(.ant-avatar-image):not([style*=--antuikit-avatar-fill])]:bg-border-secondary",
  "[&_.ant-avatar:not(.ant-avatar-image):not([style*=--antuikit-avatar-fill])]:text-secondary",
].join(" ");

/**
 * Only avatars move: a bare one, or the span that wraps one for an `indicator`.
 * A label beside them keeps its own margin. Hover and focus outrank the overlap
 * by one pseudo-class.
 */
const avatarGroupVariants = cva(AVATAR_GROUP, {
  variants: {
    overlap: {
      none: "[&>:is(.ant-avatar,:has(>.ant-avatar)):not(:first-child)]:ms-0",
      small: "",
      medium:
        "[&>:is(.ant-avatar,:has(>.ant-avatar)):not(:first-child)]:-ms-sm",
      large: "[&>:is(.ant-avatar,:has(>.ant-avatar)):not(:first-child)]:-ms-md",
    },
    surface: {
      // The ring takes the surface's color. `:where()` keeps it below an
      // outlined avatar's own border.
      true: "items-center bg-elevated p-xxs shadow-tertiary [&_:where(.ant-avatar)]:border-elevated",
      false: "",
    },
    expandOnHover: {
      true: [
        "hover:[&>:is(.ant-avatar,:has(>.ant-avatar)):not(:first-child)]:ms-xxs",
        "focus-within:[&>:is(.ant-avatar,:has(>.ant-avatar)):not(:first-child)]:ms-xxs",
        "motion-safe:[&>:is(.ant-avatar,:has(>.ant-avatar))]:transition-[margin-inline-start]",
        "motion-safe:[&>:is(.ant-avatar,:has(>.ant-avatar))]:duration-mid",
      ].join(" "),
      false: "",
    },
  },
  defaultVariants: { overlap: "small", surface: false, expandOnHover: false },
});

/**
 * A square group's surface is concentric with its avatars: their radius plus
 * the padding. antd rounds a small or large square avatar with the matching
 * radius step and every other size with the base one.
 */
const SURFACE_RADIUS = {
  circle: "rounded-full",
  square: "rounded-[calc(var(--ant-border-radius)+var(--ant-size-xxs))]",
  squareSmall:
    "rounded-[calc(var(--ant-border-radius-sm)+var(--ant-size-xxs))]",
  squareLarge:
    "rounded-[calc(var(--ant-border-radius-lg)+var(--ant-size-xxs))]",
} as const;

const surfaceRadius = (
  shape: AvatarGroupProps["shape"],
  size: AvatarGroupProps["size"],
): string => {
  if (shape !== "square") return SURFACE_RADIUS.circle;
  if (size === "small") return SURFACE_RADIUS.squareSmall;
  if (size === "large") return SURFACE_RADIUS.squareLarge;
  return SURFACE_RADIUS.square;
};

const BREAKPOINTS = ["xxxl", "xxl", "xl", "lg", "md", "sm", "xs"] as const;

/** The group's avatar height as a CSS length, resolved the way antd resolves it. */
const groupHeight = (
  size: AvatarGroupProps["size"],
  screens: Partial<Record<(typeof BREAKPOINTS)[number], boolean>>,
): string => {
  if (typeof size === "number") return `${size}px`;
  if (size && typeof size === "object") {
    const current = BREAKPOINTS.find((bp) => screens[bp]);
    const value = current ? size[current] : undefined;
    if (typeof value === "number") return `${value}px`;
    return "var(--ant-control-height)";
  }
  if (size === "small") return "var(--ant-control-height-sm)";
  if (size === "large") return "var(--ant-control-height-lg)";
  return "var(--ant-control-height)";
};

/**
 * Avatar.Group with an opaque, readable `+n` chip, an `overlap` step, a
 * `surface` to sit on and an `expandOnHover` spread.
 */
const AvatarGroup = ({
  className,
  overlap,
  surface,
  expandOnHover,
  max,
  ...props
}: AvatarGroupProps) => {
  const screens = Grid.useBreakpoint();
  // antd sizes the `+n` text at 18px for any numeric size and at `fontSize`
  // for every token size, so it scales with the chip here instead. A
  // `max.style` font size still wins.
  const chipStyle: CSSProperties = {
    fontSize: `round(calc(${groupHeight(props.size, screens)} * 0.4), 1px)`,
    ...max?.style,
  };
  return (
    <AntdAvatar.Group
      {...props}
      max={max && { ...max, style: chipStyle }}
      className={cn(
        avatarGroupVariants({ overlap, surface, expandOnHover }),
        surface && surfaceRadius(props.shape, props.size),
        className,
      )}
    />
  );
};

AvatarRoot.displayName = "Avatar";
AvatarGroup.displayName = "Avatar.Group";

/**
 * Avatar with a ring, a readable colorless default, a `squircle` shape, a
 * `variant` and `color` pair, and an `indicator` slot on the shape's corner.
 *
 * A `bg-*` or `text-*` in `className` replaces the colorless default.
 */
export const Avatar = Object.assign(AvatarRoot, { Group: AvatarGroup });

export { AvatarGroup, avatarGroupVariants, avatarVariants };
