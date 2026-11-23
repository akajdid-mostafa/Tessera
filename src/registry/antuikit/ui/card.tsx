"use client";

import type { CardProps as AntdCardProps, GlobalToken } from "antd";
import {
  Card as AntdCard,
  ConfigProvider as AntdConfigProvider,
  Skeleton as AntdSkeleton,
  theme as antdTheme,
} from "antd";
import type { CSSProperties, ReactNode, Ref } from "react";
import { cn } from "@/registry/antuikit/lib/utils";
import { resolveTabsProps, type TabsProps } from "@/registry/antuikit/ui/tabs";

/**
 * Card's `type` values: antd's own, read off the prop because antd does not
 * export `CardType` from its root, plus the kit's `inset`.
 */
export type CardType = NonNullable<AntdCardProps["type"]> | "inset";

/**
 * Card's props, with a wider `type` and `tabProps`, plus `shape`, `color`,
 * `emphasis`, `disabled`, `footer` and a `ref`.
 */
export interface CardProps extends Omit<AntdCardProps, "type" | "tabProps"> {
  /**
   * The card's chrome: `inner` gives it a lighter header, for a card inside a
   * card, and `inset` tints the card and puts everything below the header on
   * its own raised surface. Unset is a plain card.
   */
  type?: CardType;
  /**
   * Corner shape: `squircle` is a superellipse on twice the large radius, and
   * stays a plain corner where `corner-shape` is unsupported.
   *
   * @default "default"
   */
  shape?: keyof typeof CARD_SHAPE;
  /**
   * Paints the card in a color ramp: antd's presets (`blue`, `green`, `gold`
   * and the rest) or a palette from your theme (the default theme adds
   * `amber`, `emerald`, `teal`, `sky`, `indigo`, `violet`, `fuchsia`, `rose`
   * and grays like `slate` and `zinc`). A name with no ramp is ignored, and
   * `emphasis` sets how strong the color is.
   */
  color?: string;
  /**
   * How strongly `color` shows: `default` is a light tint with colored text,
   * `subtle` a neutral ground with colored text, and `strong` a solid fill with
   * white text. Without a `color`, only `subtle` does anything.
   *
   * @default "default"
   */
  emphasis?: "default" | "subtle" | "strong";
  /**
   * Dims the card and takes it out of pointer, keyboard and screen reader
   * interaction.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * Content below the body and the actions, with a divider above it like the
   * header's. Under `type="inset"` it sits on the tinted ground, outside the
   * raised surface.
   */
  footer?: ReactNode;
  /**
   * Props for the `tabList` bar, in the kit's Tabs vocabulary. The bar defaults
   * to `type="floating"`, `color="default"` and a size that matches the card.
   * Pass `{ type: "line", color: "primary" }` for antd's look.
   */
  tabProps?: TabsProps;
  /** Forwarded to the root `<div>`. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * antd builds the `tabList` bar from its own Tabs, so the kit's Tabs styles are
 * applied through `resolveTabsProps`. They go on `rootClassName`, because antd
 * overwrites `tabProps.className`. antd gives every card that is not small
 * `large` tabs, so the default here is `medium`.
 */
const withTabsDefaults = (
  tabProps: CardProps["tabProps"],
  isSmall: boolean,
  token: GlobalToken,
): AntdCardProps["tabProps"] => {
  const [antdProps, classes] = resolveTabsProps(
    {
      type: "floating",
      size: isSmall ? "small" : "medium",
      ...tabProps,
    },
    token,
  );
  const { className, rootClassName, ...rest } = antdProps;
  return { ...rest, rootClassName: cn(classes, className, rootClassName) };
};

/**
 * antd's elevation, inverted: an outlined card rests on `shadow-tertiary`
 * instead of a border, a borderless card is flat, and `hoverable` lifts to
 * `shadow-secondary`. `border-transparent` keeps the border box, which antd's
 * cover offset relies on.
 */
const CARD_ELEVATION = [
  "[&.ant-card-bordered]:border-transparent",
  "[&.ant-card-bordered]:shadow-tertiary",
  "[&:not(.ant-card-bordered)]:shadow-none",
  "[&.ant-card-hoverable:hover]:shadow-secondary",
  "[&_.ant-card-grid-hoverable:hover]:shadow-secondary",
].join(" ");

/**
 * `pointer-events-none` only stops the mouse. The `inert` attribute set on the
 * card also stops the keyboard and screen readers. The dimming is antd's own
 * `opacityLoading`.
 */
const CARD_DISABLED = "pointer-events-none opacity-(--ant-opacity-loading)";

/**
 * antd rounds the cover's top corners even when a header sits above it, which
 * cuts notches into the image. This squares them in that case only.
 */
const CARD_COVER = "[&>.ant-card-head+.ant-card-cover>*]:rounded-t-none";

/**
 * The palette `color` names, or `undefined` when the active theme has no ramp
 * for it. Tag, Badge and Button have their own copies, which probe other
 * shades and skip antd's preset names.
 */
const paletteNameOf = (
  color: unknown,
  token: Record<string, unknown>,
): string | undefined => {
  if (typeof color !== "string") return undefined;
  if (!/^[a-z][a-z0-9]*$/.test(color)) return undefined;
  return typeof token[`${color}1`] === "string" &&
    typeof token[`${color}9`] === "string"
    ? color
    : undefined;
};

/**
 * The ramp as inline custom properties, because a class built from the name at
 * runtime is never generated. The solid fill is shade 7 in both modes under
 * white text. It keeps the palette's look, and in dark mode most palettes fall
 * below AA contrast there.
 */
const PALETTE_RAMP = (name: string): CSSProperties =>
  ({
    "--antuikit-card-tint": `var(--ant-${name}-1)`,
    "--antuikit-card-ink": `var(--ant-${name}-9)`,
    "--antuikit-card-solid": `var(--ant-${name}-7)`,
  }) as CSSProperties;

const COLOR_SOLID_FILL = "bg-[var(--antuikit-card-solid)]";

/**
 * antd colors the header, `extra`, `actions` and Meta text separately, so a new
 * text color is handed to each. Links lose their own color and keep an
 * underline.
 */
const COLOR_INK_DOWN = [
  // The header divider follows the text color, so it shows on tints and fills.
  "[&>.ant-card-head]:border-b-current/20",
  "[&_.ant-card-head]:text-inherit",
  "[&_.ant-card-extra]:text-inherit",
  "[&_.ant-card-actions>li]:text-inherit",
  "[&_.ant-card-meta-title]:text-inherit",
  "[&_.ant-card-meta-description]:text-inherit",
  "[&_a]:text-inherit",
  "[&_a]:underline",
].join(" ");

/** Under `inset` only the header sits on the color, so only it takes the ink. */
const COLOR_INK_DOWN_INSET = [
  "[&>.ant-card-head_.ant-card-extra]:text-inherit",
  "[&>.ant-card-head_a]:text-inherit",
  "[&>.ant-card-head_a]:underline",
].join(" ");

/**
 * Under `inset` the text color goes on the header alone. The body inherits the
 * root's color and sits on the white island, where white text would vanish.
 */
const COLOR_INK = {
  strong: {
    card: "text-text-light-solid",
    head: "[&>.ant-card-head]:text-text-light-solid",
  },
  tinted: {
    card: "text-[var(--antuikit-card-ink)]",
    head: "[&>.ant-card-head]:text-[var(--antuikit-card-ink)]",
  },
} as const;

/**
 * `corner-shape` needs a larger radius to show, so `squircle` doubles it inside
 * `@supports`. Unguarded, a browser without `corner-shape` would get a plain
 * corner at twice the radius. The inset island and the cover read the same
 * variable.
 */
const CARD_SHAPE = {
  default: "",
  squircle: [
    "corner-squircle",
    "[--antuikit-card-radius:var(--ant-border-radius-lg)]",
    "supports-[corner-shape:squircle]:[--antuikit-card-radius:calc(var(--ant-border-radius-lg)*2)]",
    "rounded-[var(--antuikit-card-radius)]",
    "[&>*:not(.ant-card-head)]:corner-squircle",
    "[&_.ant-card-cover>*]:corner-squircle",
    "[&_.ant-card-cover>*]:rounded-t-[var(--antuikit-card-radius)]",
  ].join(" "),
} as const;

/**
 * The root takes a tinted ground and drops its shadow, and every child but the
 * header becomes the island: inset 2px at the sides and bottom, with concentric
 * corners and the card's shadow. antd renders these as siblings and omits the
 * body on an empty card, hence `:not(.ant-card-head)` on `:last-child`.
 */
const CARD_INSET = [
  "bg-fill-tertiary",
  "[&>.ant-card-head]:border-b-0",
  "[&>.ant-card-head]:mb-0",
  "[&>*:not(.ant-card-head)]:bg-container",
  "[&.ant-card.ant-card-bordered]:shadow-none",
  "[&.ant-card.ant-card-hoverable:hover]:shadow-none",
  "[&>*:not(.ant-card-head)]:shadow-tertiary",
  "[&.ant-card-hoverable:hover>*:not(.ant-card-head)]:shadow-secondary",
  "[&>*:not(.ant-card-head)]:mt-0",
  "[&>*:not(.ant-card-head)]:mx-[calc(var(--ant-size-xxs)*0.5)]",
  "[&>*:last-child:not(.ant-card-head)]:mb-[calc(var(--ant-size-xxs)*0.5)]",
  "[&>.ant-card-head+*]:rounded-t-[max(0px,calc(var(--antuikit-card-radius,var(--ant-border-radius-lg))-var(--ant-size-xxs)*0.5))]",
  "[&>*:first-child:not(.ant-card-head)]:rounded-t-[max(0px,calc(var(--antuikit-card-radius,var(--ant-border-radius-lg))-var(--ant-size-xxs)*0.5))]",
  "[&>*:last-child:not(.ant-card-head)]:rounded-b-[max(0px,calc(var(--antuikit-card-radius,var(--ant-border-radius-lg))-var(--ant-size-xxs)*0.5))]",
  "[&_.ant-card-cover>*]:rounded-t-[max(0px,calc(var(--antuikit-card-radius,var(--ant-border-radius-lg))-var(--ant-size-xxs)*0.5))]",
  "[&.ant-card>.ant-card-head+.ant-card-cover>*]:rounded-t-[max(0px,calc(var(--antuikit-card-radius,var(--ant-border-radius-lg))-var(--ant-size-xxs)*0.5))]",
  "[&>.ant-card-body:has(+.ant-card-actions)]:rounded-b-none",
].join(" ");

/**
 * antd's Card has no footer slot, so with a `footer` the body becomes
 * `display: contents` and holds two boxes: the content, which takes the body's
 * padding, and the footer, which `order-last` moves below the actions.
 */
const CARD_WITH_FOOTER = "flex flex-col [&>.ant-card-body]:contents";

const CARD_CONTENT =
  "p-(--ant-card-body-padding) [.ant-card-small_&]:p-(--ant-card-body-padding-sm)";

const CARD_FOOTER = [
  "order-last flex items-center",
  // The header's padding and height, so the two ends of the card match.
  "px-(--ant-card-header-padding) min-h-(--ant-card-header-height)",
  "[.ant-card-small_&]:px-(--ant-card-header-padding-sm) [.ant-card-small_&]:min-h-(--ant-card-header-height-sm)",
].join(" ");

/** The header's divider, turned upside down. */
const CARD_FOOTER_RULE =
  "border-t-[length:var(--ant-line-width)] border-solid border-border-secondary";

/** The raised surface under `inset`, moved from the body onto the content. */
const CARD_CONTENT_INSET = [
  "bg-container shadow-tertiary",
  "[.ant-card-hoverable:hover_&]:shadow-secondary",
  "mx-[calc(var(--ant-size-xxs)*0.5)]",
].join(" ");

/**
 * Card with `color`, `emphasis`, `shape`, `disabled`, a `footer`, an `inset`
 * type and a `tabList` bar in the kit's Tabs style.
 *
 * Import `Card.Grid` and `Card.Meta` from antd. To change a resting shadow,
 * use a scoped class like `[&.ant-card-bordered]:shadow-<key>`, since a plain
 * `shadow-*` does not win.
 */
export const Card = ({
  className,
  color,
  disabled,
  emphasis = "default",
  footer,
  shape = "default",
  size,
  style,
  tabProps,
  type,
  children,
  loading,
  classNames,
  styles,
  ...props
}: CardProps) => {
  const { token } = antdTheme.useToken();
  const { componentSize } = AntdConfigProvider.useConfig();
  const tokens = token as unknown as Record<string, unknown>;
  // antd's own size merge, so a ConfigProvider size of small counts too.
  const isSmallCard = (size ?? componentSize) === "small";
  const palette = paletteNameOf(color, tokens);
  const inset = type === "inset";
  // A level that needs a hue does nothing without a color, except `subtle`.
  const level =
    palette === undefined
      ? emphasis === "subtle"
        ? "neutral"
        : "none"
      : emphasis;

  const ground =
    level === "none"
      ? undefined
      : level === "strong"
        ? COLOR_SOLID_FILL
        : level === "default"
          ? "bg-[var(--antuikit-card-tint)]"
          : "bg-fill-quaternary";

  const ink =
    level === "strong"
      ? COLOR_INK.strong[inset ? "head" : "card"]
      : level === "default" || level === "subtle"
        ? COLOR_INK.tinted[inset ? "head" : "card"]
        : undefined;

  const hasFooter = footer != null && footer !== false && footer !== "";
  const hasActions = Boolean(props.actions?.length);
  // Body classes and styles belong to the content box once the body is
  // `display: contents`. The function forms are left on the body.
  const bodyClass =
    hasFooter && typeof classNames === "object" ? classNames?.body : undefined;
  const bodyStyle =
    hasFooter && typeof styles === "object" ? styles?.body : undefined;

  const body = hasFooter ? (
    <>
      <div
        className={cn(
          CARD_CONTENT,
          inset && CARD_CONTENT_INSET,
          inset && shape === "squircle" && "corner-squircle",
          inset &&
            !props.cover &&
            "rounded-t-[max(0px,calc(var(--antuikit-card-radius,var(--ant-border-radius-lg))-var(--ant-size-xxs)*0.5))]",
          inset &&
            !hasActions &&
            "rounded-b-[max(0px,calc(var(--antuikit-card-radius,var(--ant-border-radius-lg))-var(--ant-size-xxs)*0.5))]",
          loading && "select-none",
          bodyClass,
        )}
        style={bodyStyle}
      >
        {loading ? (
          <AntdSkeleton active loading paragraph={{ rows: 4 }} title={false} />
        ) : (
          children
        )}
      </div>
      <div
        className={cn(
          CARD_FOOTER,
          !inset && CARD_FOOTER_RULE,
          // The footer sits on the colored ground under `inset`, like the header.
          inset &&
            ink &&
            COLOR_INK[level === "strong" ? "strong" : "tinted"].card,
          inset && ink && "[&_a]:text-inherit [&_a]:underline",
          !inset && ink && "border-t-current/20",
        )}
      >
        {footer}
      </div>
    </>
  ) : (
    children
  );

  return (
    <AntdCard
      {...props}
      loading={hasFooter ? false : loading}
      classNames={
        bodyClass && typeof classNames === "object"
          ? { ...classNames, body: undefined }
          : classNames
      }
      styles={
        bodyStyle && typeof styles === "object"
          ? { ...styles, body: undefined }
          : styles
      }
      // Never forwarded: antd would stamp a class for `inset` with no styles.
      type={inset ? undefined : type}
      inert={disabled}
      size={size}
      tabProps={withTabsDefaults(tabProps, isSmallCard, token)}
      style={palette ? { ...PALETTE_RAMP(palette), ...style } : style}
      className={cn(
        CARD_ELEVATION,
        CARD_COVER,
        CARD_SHAPE[shape],
        hasFooter && CARD_WITH_FOOTER,
        inset && CARD_INSET,
        // After CARD_INSET, so tailwind-merge keeps the color's `bg-*` over the
        // inset ground.
        ground,
        ink,
        // Only when the card has a new text color.
        ink && (inset ? COLOR_INK_DOWN_INSET : COLOR_INK_DOWN),
        disabled && CARD_DISABLED,
        className,
      )}
    >
      {body}
    </AntdCard>
  );
};

Card.displayName = "Card";
