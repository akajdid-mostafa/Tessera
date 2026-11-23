"use client";

import type { ButtonProps as AntdButtonProps } from "antd";
import { Button as AntdButton, theme as antdTheme, ConfigProvider } from "antd";
import { cva } from "class-variance-authority";
import type { CSSProperties, ReactNode, Ref } from "react";
import { useContext } from "react";
import { cn } from "@/registry/antuikit/lib/utils";
import { Icon } from "@/registry/antuikit/ui/icon";

/** antd's `shape` values, derived so a value a new antd release adds flows in. */
type AntdButtonShape = NonNullable<AntdButtonProps["shape"]>;

/** antd's `color` values, derived for the same reason. */
type AntdButtonColor = NonNullable<AntdButtonProps["color"]>;

/**
 * The button's corner radius for its size, as one property the squircle can
 * scale. antd's size class selects it, because `size` can come from
 * `ConfigProvider`. The cap at 45% of the control height stops a large theme
 * radius from turning a squircle into a pill, and never lowers antd's own.
 */
const BUTTON_RADIUS = [
  "[--antuikit-btn-radius:min(calc(var(--ant-border-radius)*var(--antuikit-btn-corner-scale,1)),max(var(--ant-border-radius),calc(var(--ant-control-height)*0.45)))]",
  "[&.ant-btn-sm]:[--antuikit-btn-radius:min(calc(var(--ant-border-radius-sm)*var(--antuikit-btn-corner-scale,1)),max(var(--ant-border-radius-sm),calc(var(--ant-control-height-sm)*0.45)))]",
  "[&.ant-btn-lg]:[--antuikit-btn-radius:min(calc(var(--ant-border-radius-lg)*var(--antuikit-btn-corner-scale,1)),max(var(--ant-border-radius-lg),calc(var(--ant-control-height-lg)*0.45)))]",
].join(" ");

/**
 * A squircle corner reads smaller than a round one at the same radius, so the
 * radius is scaled by 1.5. The scale is set only inside
 * `@supports (corner-shape: squircle)`, so a browser without `corner-shape`
 * keeps antd's own radius instead of a larger round corner.
 */
const BUTTON_SQUIRCLE = [
  "corner-squircle",
  "supports-[corner-shape:squircle]:[--antuikit-btn-corner-scale:1.5]",
  BUTTON_RADIUS,
  "rounded-[var(--antuikit-btn-radius)]",
].join(" ");

/**
 * A `default` button keeps its own ink on hover and press. antd moves the
 * label and border of `outlined`, `dashed` and `link` to the primary color;
 * here the label stays `colorText` and the border darkens to
 * `colorTextSecondary` on hover and `colorText` on press. The focus ring is
 * `colorTextTertiary` instead of `colorPrimaryBorder`. A ghost button keeps
 * antd's treatment, since its label is light.
 */
const DEFAULT_NEUTRAL = [
  "[&.ant-btn-color-default:is(.ant-btn-variant-outlined,.ant-btn-variant-dashed,.ant-btn-variant-link):not(.ant-btn-background-ghost)]:[--ant-btn-text-color-hover:var(--ant-color-text)]",
  "[&.ant-btn-color-default:is(.ant-btn-variant-outlined,.ant-btn-variant-dashed,.ant-btn-variant-link):not(.ant-btn-background-ghost)]:[--ant-btn-text-color-active:var(--ant-color-text)]",
  "[&.ant-btn-color-default:is(.ant-btn-variant-outlined,.ant-btn-variant-dashed,.ant-btn-variant-link):not(.ant-btn-background-ghost)]:[--ant-btn-color-hover:var(--ant-color-text-secondary)]",
  "[&.ant-btn-color-default:is(.ant-btn-variant-outlined,.ant-btn-variant-dashed,.ant-btn-variant-link):not(.ant-btn-background-ghost)]:[--ant-btn-color-active:var(--ant-color-text)]",
  "[&.ant-btn-color-default:not(.ant-btn-background-ghost):focus-visible]:[outline-color:var(--ant-color-text-tertiary)]",
].join(" ");

/**
 * Every `shape` value has a key, so the exported cva takes whatever the prop
 * takes. antd draws its own four, so they map to nothing.
 */
const buttonVariants = cva("", {
  variants: {
    shape: {
      default: "",
      circle: "",
      round: "",
      square: "",
      squircle: BUTTON_SQUIRCLE,
    },
  },
  defaultVariants: { shape: "default" },
});

/**
 * An `avatar` face is the control height minus a `sizeXXS / 2` inset on each
 * side, and the start padding is cut to the same inset, so the face sits the
 * same distance from the edge, the top and the bottom. The height is a custom
 * property antd's size class selects, since `size` can come from
 * `ConfigProvider`. The face's radius is the button's minus the inset, so the
 * corners stay concentric at every `shape`.
 */
const AVATAR_HOST = [
  "[--antuikit-btn-face:calc(var(--ant-control-height)_-_var(--ant-size-xxs))]",
  "[&.ant-btn-sm]:[--antuikit-btn-face:calc(var(--ant-control-height-sm)_-_var(--ant-size-xxs))]",
  "[&.ant-btn-lg]:[--antuikit-btn-face:calc(var(--ant-control-height-lg)_-_var(--ant-size-xxs))]",
  BUTTON_RADIUS,
  "[--antuikit-btn-face-radius:max(0px,calc(var(--antuikit-btn-radius)_-_var(--ant-size-xxs)*0.5))]",
].join(" ");

/**
 * The padding cut, only when the button has a label (antd zeroes the padding
 * of an icon-only one). It follows `iconPlacement`, because antd places an end
 * icon by reversing the children and leaves the padding where it was. Both are
 * flat classes, so your own `ps-*` or `pe-*` in `className` still overrides them.
 */
const AVATAR_HOST_PADDING = {
  start: "ps-[calc(var(--ant-size-xxs)*0.5_-_var(--ant-line-width))]",
  end: "pe-[calc(var(--ant-size-xxs)*0.5_-_var(--ant-line-width))]",
} as const;

/**
 * `AntuikitProvider` pulls a button's icon toward its edge to make up for the
 * whitespace inside a glyph. A face has none, so the pull is zeroed. It is an
 * inline style so it beats the provider's class whatever its selector, and your
 * own `styles.icon` is merged after it, so yours still wins.
 */
const AVATAR_ICON_STYLE = {
  marginInlineStart: 0,
  marginInlineEnd: 0,
} as const;

/**
 * `loadingPlacement="center"`, keyed on antd's `ant-btn-loading` class so it
 * follows `loading.delay`. The label fades out but keeps its space, so the
 * button does not resize, and it stays in the accessibility tree. With no
 * icon, antd adds the icon slot only while loading, so the slot is unboxed
 * and adds no width or gap.
 */
const LOADING_CENTER = "[&.ant-btn-loading>:not(.ant-btn-icon)]:opacity-0";
const LOADING_CENTER_NO_ICON = "[&.ant-btn-loading>.ant-btn-icon]:contents";

/** The spinner, centered on the button whatever sits in the icon slot. */
const LOADING_SPINNER =
  "absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2";

type ButtonLoading = NonNullable<AntdButtonProps["loading"]>;
type ButtonLoadingConfig = Extract<ButtonLoading, object>;

type ButtonStyles = NonNullable<AntdButtonProps["styles"]>;
type ButtonStylesFn = Extract<ButtonStyles, (...args: never) => unknown>;
type ButtonStylesRecord = ReturnType<ButtonStylesFn>;

/**
 * Adds the face's icon style to `styles`, in both its object and function
 * forms, with your own `icon` style spread over it.
 */
const withFaceIconStyle = (theirs: ButtonStyles | undefined): ButtonStyles => {
  const merge = (resolved: ButtonStylesRecord | undefined) => ({
    ...resolved,
    icon: { ...AVATAR_ICON_STYLE, ...resolved?.icon },
  });

  return typeof theirs === "function"
    ? (info: Parameters<ButtonStylesFn>[0]) => merge(theirs(info))
    : merge(theirs);
};

/** Concentric corners: the face's radius is the button's minus the inset. */
const AVATAR_RADIUS_CONCENTRIC = "rounded-[var(--antuikit-btn-face-radius)]";

/**
 * `circle` and `round` give the button a round cap, so the face is a full
 * circle there. `square` keeps antd's own radius.
 */
const AVATAR_SHAPE = {
  default: AVATAR_RADIUS_CONCENTRIC,
  circle: "rounded-full",
  round: "rounded-full",
  square: AVATAR_RADIUS_CONCENTRIC,
  squircle: cn("corner-squircle", AVATAR_RADIUS_CONCENTRIC),
} as const;

/**
 * Button's props, with a `squircle` shape, theme palettes on `color`, an
 * `avatar` and a `ref`. `shape` and `color` are omitted and declared again
 * because an `interface extends` cannot widen an inherited member.
 */
export interface ButtonProps extends Omit<AntdButtonProps, "shape" | "color"> {
  /**
   * The button's color, `default` unless set: `primary`, `danger`, antd's
   * presets (`blue`, `green`, `gold` and the rest) or a palette from your
   * theme (the default theme adds `amber`, `emerald`, `teal`, `sky`,
   * `indigo`, `violet`, `fuchsia`, `rose` and grays like `slate` and `zinc`).
   * Like a preset, a palette needs a `variant` beside it.
   * @default "default"
   */
  color?: AntdButtonColor | (string & {});
  /**
   * The corner shape, `default` unless set: `round` for a pill, `circle` for a
   * round icon button, `square` (drawn like `default`), or `squircle`, a
   * superellipse corner that keeps antd's own corner where it is unsupported.
   * For a rounded-square icon button, pass `shape="circle"` with the
   * `corner-squircle` class.
   * @default "default"
   */
  shape?: AntdButtonShape | "squircle";
  /**
   * An image URL shown as a face in the icon slot, sized from the button and
   * rounded to match its `shape`, with no default.
   *
   * `loading` still swaps it for the spinner, and an explicit `icon` wins. It
   * follows `iconPlacement` and mirrors in right-to-left layouts.
   */
  avatar?: string;
  /**
   * Where the `loading` spinner goes: `inline` swaps it into the icon slot,
   * `center` hides the label and icon and centers it, so the button keeps its
   * size.
   * @default "inline"
   */
  loadingPlacement?: "inline" | "center";
  /** Forwarded to the rendered `<button>` or `<a>`. */
  ref?: Ref<HTMLButtonElement | HTMLAnchorElement>;
}

/**
 * `squircle` is forwarded to antd as `"default"`. antd would stamp a class it
 * has no styles for, and `undefined` would fall through to a `ConfigProvider`
 * shape such as `round` and draw a squircle pill.
 */
const forwardedShape = (
  shape: ButtonProps["shape"],
): AntdButtonShape | undefined => (shape === "squircle" ? "default" : shape);

/**
 * The theme palette name in `color`, or `undefined` when antd handles the
 * value itself: one of antd's own names, or a name the theme has no colors for.
 */
const paletteNameOf = (
  color: ButtonProps["color"],
  token: Record<string, unknown>,
): string | undefined => {
  if (typeof color !== "string") return undefined;
  if (color in antdTheme.defaultSeed) return undefined;
  if (!/^[a-z][a-z0-9]*$/.test(color)) return undefined;
  return typeof token[`${color}1`] === "string" &&
    typeof token[`${color}7`] === "string"
    ? color
    : undefined;
};

/**
 * Points Button's seven color variables at a theme palette. A preset color
 * sets only these, so every variant derives from them the way antd's do. They
 * are inline because each value is built from the palette name, which a
 * Tailwind class cannot be, and inline also beats antd's own variable block.
 * Your own `style` is spread after them and still wins.
 */
const paletteVars = (name: string): CSSProperties =>
  ({
    "--ant-btn-color-base": `var(--ant-${name}-6)`,
    "--ant-btn-color-hover": `var(--ant-${name}-5)`,
    "--ant-btn-color-active": `var(--ant-${name}-7)`,
    "--ant-btn-color-light": `var(--ant-${name}-1)`,
    "--ant-btn-color-light-hover": `var(--ant-${name}-2)`,
    "--ant-btn-color-light-active": `var(--ant-${name}-3)`,
    "--ant-btn-shadow": `0 var(--ant-control-outline-width) 0 var(--ant-${name}-1)`,
  }) as CSSProperties;

/**
 * Button with a `squircle` shape, theme palettes on `color`, an `avatar` face,
 * a centered `loading` spinner that keeps the button's size, and a `default`
 * color that stays neutral on hover and press.
 *
 * `Button.Group` is not included. Use `Space.Compact` to join buttons.
 */
export const Button = ({
  shape,
  className,
  color,
  variant,
  style,
  avatar,
  icon,
  loading,
  loadingPlacement = "inline",
  ...props
}: ButtonProps) => {
  const { token } = antdTheme.useToken();
  const palette = paletteNameOf(
    color,
    token as unknown as Record<string, unknown>,
  );

  // antd ignores `color` unless `variant` is set too, so a palette only
  // paints when both are, the same as a preset.
  const painted = palette !== undefined && variant !== undefined;

  // An explicit `icon` wins, so the slot never holds two things.
  const face = icon === undefined && avatar !== undefined;
  const childless = props.children === undefined || props.children === null;

  // `iconPosition` is antd's deprecated alias. It is read so the padding cut
  // lands on the right edge for code that still passes it.
  const placement = props.iconPlacement ?? props.iconPosition ?? "start";

  const contextLoadingIcon = useContext(ConfigProvider.ConfigContext).button
    ?.loadingIcon;

  const slotIcon: ReactNode = face ? (
    <img
      src={avatar}
      alt=""
      className={cn(
        "aspect-square h-(--antuikit-btn-face) shrink-0 object-cover",
        AVATAR_SHAPE[shape ?? "default"],
      )}
    />
  ) : (
    icon
  );
  const hasIcon = Boolean(slotIcon);
  const centered = loadingPlacement === "center" && Boolean(loading);

  // antd replaces the icon with `loading.icon` while loading. Centered, that
  // slot keeps the icon, faded, so its width stays, with the spinner on top.
  let forwardedLoading: AntdButtonProps["loading"] = loading;
  if (centered) {
    const config: ButtonLoadingConfig =
      typeof loading === "object" ? loading : {};
    forwardedLoading = {
      ...config,
      icon: (
        <>
          {hasIcon ? (
            <span className="inline-flex opacity-0">{slotIcon}</span>
          ) : null}
          <span className={LOADING_SPINNER}>
            {config.icon ?? contextLoadingIcon ?? <Icon name="loading" />}
          </span>
        </>
      ),
    };
  }

  return (
    <AntdButton
      {...props}
      // The palette name is forwarded, since antd keeps `variant` only when
      // `color` is set. The `ant-btn-color-<name>` class it adds has no styles.
      color={color as AntdButtonProps["color"]}
      variant={variant}
      style={painted ? { ...paletteVars(palette), ...style } : style}
      styles={face ? withFaceIconStyle(props.styles) : props.styles}
      shape={forwardedShape(shape)}
      icon={slotIcon}
      loading={forwardedLoading}
      className={cn(
        DEFAULT_NEUTRAL,
        buttonVariants({ shape }),
        face ? AVATAR_HOST : undefined,
        face && !childless ? AVATAR_HOST_PADDING[placement] : undefined,
        centered ? LOADING_CENTER : undefined,
        centered && !hasIcon ? LOADING_CENTER_NO_ICON : undefined,
        className,
      )}
    />
  );
};

Button.displayName = "Button";

export { buttonVariants };
