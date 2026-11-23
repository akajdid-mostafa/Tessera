"use client";

import type { TabsProps as AntdTabsProps, GlobalToken, TabsRef } from "antd";
import { Tabs as AntdTabs, theme as antdTheme } from "antd";
import { cva } from "class-variance-authority";
import type { Ref } from "react";
import { cn } from "@/registry/antuikit/lib/utils";
import { Icon } from "@/registry/antuikit/ui/icon";

/** antd's `type` values. antd does not export this union from its root. */
type AntdTabsType = NonNullable<AntdTabsProps["type"]>;

/**
 * antd's three looks plus three the kit adds. Each addition is a `line` tab
 * with a hover surface: the area around the label, the padded tab, or the tab
 * down to the rail.
 */
export type TabsType = AntdTabsType | "floating" | "padded" | "docked";

/**
 * Which color paints the indicator and the active label: `default` is neutral
 * text color, `primary` is antd's own primary color.
 */
export type TabsColor = "default" | "primary";

const isAntdType = (t: TabsType | undefined): t is AntdTabsType =>
  t === "line" || t === "card" || t === "editable-card";

/**
 * `color="default"`: the indicator and the selected, hovered and pressed
 * labels use `colorTextBase` instead of antd's primary color. This is CSS, not
 * a `components.Tabs` token block, because component tokens are one value for
 * both modes and `colorTextBase` has to flip in dark mode. Hover rules skip
 * disabled tabs, or antd's disabled color would lose to them.
 */
const NEUTRAL = [
  "[&_.ant-tabs-ink-bar]:bg-text-base",
  "[&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:text-text-base",
  "[&_.ant-tabs-tab:not(.ant-tabs-tab-disabled):hover]:text-text-base",
  "[&_.ant-tabs-tab:not(.ant-tabs-tab-disabled)_.ant-tabs-tab-btn:active]:text-text-base",
  // A clicked tab or `+` keeps antd's pressed color while it holds mouse
  // focus, so that state is covered too. The keyboard focus ring stays antd's.
  "[&_.ant-tabs-tab:not(.ant-tabs-tab-disabled)_.ant-tabs-tab-btn:focus:not(:focus-visible)]:text-text-base",
  "[&_.ant-tabs-tab:not(.ant-tabs-tab-disabled)_.ant-tabs-tab-remove:active]:text-text-base",
  "[&_.ant-tabs-tab:not(.ant-tabs-tab-disabled)_.ant-tabs-tab-remove:focus:not(:focus-visible)]:text-text-base",
  "[&_.ant-tabs-nav-add:hover]:text-text-base",
  "[&_.ant-tabs-nav-add:active]:text-text-base",
  "[&_.ant-tabs-nav-add:focus:not(:focus-visible)]:text-text-base",
];

/**
 * `floating`: antd's line tab with a hover highlight drawn as a `::before` on
 * the label, so the tab and its underline keep the label's width. It reaches
 * less far up and down than sideways, because the line box already has space
 * above and below the text. The nav wrap clips its content, so on a
 * horizontal bar it is widened by the overhang and padded back. `-z-10` puts
 * the highlight behind the text, inside the tab list's stacking context.
 */
const FLOATING = [
  "[&_.ant-tabs-tab-btn]:relative",
  "[&_.ant-tabs-tab-btn]:before:absolute",
  "[&_.ant-tabs-tab-btn]:before:-inset-x-xs",
  "[&_.ant-tabs-tab-btn]:before:-inset-y-xxs",
  "[&_.ant-tabs-tab-btn]:before:-z-10",
  "[&_.ant-tabs-tab-btn]:before:rounded",
  "[&_.ant-tabs-tab-btn]:before:opacity-0",
  "[&_.ant-tabs-tab-btn]:before:transition-opacity",
  "[&_.ant-tabs-tab:not(.ant-tabs-tab-disabled):hover_.ant-tabs-tab-btn]:before:opacity-100",
  "[&.ant-tabs-top_.ant-tabs-nav-wrap]:-mx-xs",
  "[&.ant-tabs-top_.ant-tabs-nav-wrap]:px-xs",
  "[&.ant-tabs-bottom_.ant-tabs-nav-wrap]:-mx-xs",
  "[&.ant-tabs-bottom_.ant-tabs-nav-wrap]:px-xs",
  // No geometry change on any placement: labels sit where `line` puts them.
];

/**
 * `padded`: the whole tab is the highlight, so the underline spans the padded
 * tab. Margins give back what the padding adds, so labels sit where `line`
 * puts them at every size and placement. Each margin is set on one axis only,
 * so it never touches the axis antd's own gutter is on.
 */
const PADDED = [
  "[&_.ant-tabs-tab]:px-xs",
  "[&_.ant-tabs-tab]:py-xxs",
  "[&_.ant-tabs-tab]:rounded",
  "[&_.ant-tabs-tab]:transition-colors",
  // Horizontal only: vertical tabs are spaced by antd's top margin.
  "[&.ant-tabs-top_.ant-tabs-tab+.ant-tabs-tab]:ms-base",
  "[&.ant-tabs-bottom_.ant-tabs-tab+.ant-tabs-tab]:ms-base",
  // Per size, antd's padding minus ours. The size arms are more specific, so
  // their order does not matter.
  "[&.ant-tabs-top_.ant-tabs-tab]:my-xs",
  "[&.ant-tabs-small.ant-tabs-top_.ant-tabs-tab]:my-xxs",
  "[&.ant-tabs-large.ant-tabs-top_.ant-tabs-tab]:my-sm",
  "[&.ant-tabs-bottom_.ant-tabs-tab]:my-xs",
  "[&.ant-tabs-small.ant-tabs-bottom_.ant-tabs-tab]:my-xxs",
  "[&.ant-tabs-large.ant-tabs-bottom_.ant-tabs-tab]:my-sm",
  // Vertical: the margins make up the difference to antd's `8px 24px` tab
  // and its 16px spacing, so every label keeps its position.
  "[&.ant-tabs-left_.ant-tabs-tab]:mx-base",
  "[&.ant-tabs-left_.ant-tabs-tab:first-child]:mt-xxs",
  "[&.ant-tabs-left_.ant-tabs-tab+.ant-tabs-tab]:mt-lg",
  "[&.ant-tabs-right_.ant-tabs-tab]:mx-base",
  "[&.ant-tabs-right_.ant-tabs-tab:first-child]:mt-xxs",
  "[&.ant-tabs-right_.ant-tabs-tab+.ant-tabs-tab]:mt-lg",
];

/**
 * `docked`: the tab is padded and fills on hover down to the rail, rounded on
 * the side away from it. Rules key on antd's physical placement classes,
 * which antd has already flipped for right-to-left. The indicator is 1.5 times
 * `lineWidthBold`, a ratio because the Tabs-level variable is not emitted.
 * Height is set on a top or bottom bar and width on a side bar, because
 * antd's inline style sets the other dimension.
 */
// Spelled out per side: Tailwind reads source text, so a class built in a
// template literal would never be generated.
const DOCKED = [
  // Horizontal only: a vertical tab keeps antd's padding and label position.
  "[&.ant-tabs-top_.ant-tabs-tab]:px-sm",
  "[&.ant-tabs-bottom_.ant-tabs-tab]:px-sm",
  // One spacing step less than antd's padding at each size, so the filled
  // block is not a slab. Horizontal only.
  "[&.ant-tabs-top_.ant-tabs-tab]:py-xs",
  "[&.ant-tabs-small.ant-tabs-top_.ant-tabs-tab]:py-xxs",
  "[&.ant-tabs-large.ant-tabs-top_.ant-tabs-tab]:py-sm",
  "[&.ant-tabs-bottom_.ant-tabs-tab]:py-xs",
  "[&.ant-tabs-small.ant-tabs-bottom_.ant-tabs-tab]:py-xxs",
  "[&.ant-tabs-large.ant-tabs-bottom_.ant-tabs-tab]:py-sm",
  // The height the block gives up comes back as margin away from the rail,
  // so the bar stays as tall as `line`'s and nothing below it moves.
  "[&.ant-tabs-top_.ant-tabs-tab]:mt-xs",
  "[&.ant-tabs-bottom_.ant-tabs-tab]:mb-xs",
  // antd's gutter minus the padding, so labels keep `line`'s spacing.
  "[&.ant-tabs-top_.ant-tabs-tab+.ant-tabs-tab]:ms-xs",
  "[&.ant-tabs-bottom_.ant-tabs-tab+.ant-tabs-tab]:ms-xs",
  "[&_.ant-tabs-tab]:transition-colors",
  "[&.ant-tabs-top_.ant-tabs-tab]:rounded-t-sm",
  "[&.ant-tabs-top_.ant-tabs-ink-bar]:h-[calc(var(--ant-line-width-bold)*1.5)]",
  "[&.ant-tabs-top_.ant-tabs-ink-bar]:rounded-t-full",
  "[&.ant-tabs-bottom_.ant-tabs-tab]:rounded-b-sm",
  "[&.ant-tabs-bottom_.ant-tabs-ink-bar]:h-[calc(var(--ant-line-width-bold)*1.5)]",
  "[&.ant-tabs-bottom_.ant-tabs-ink-bar]:rounded-b-full",
  "[&.ant-tabs-left_.ant-tabs-tab]:rounded-l-sm",
  "[&.ant-tabs-left_.ant-tabs-ink-bar]:w-[calc(var(--ant-line-width-bold)*1.5)]",
  "[&.ant-tabs-left_.ant-tabs-ink-bar]:rounded-l-full",
  "[&.ant-tabs-right_.ant-tabs-tab]:rounded-r-sm",
  "[&.ant-tabs-right_.ant-tabs-ink-bar]:w-[calc(var(--ant-line-width-bold)*1.5)]",
  "[&.ant-tabs-right_.ant-tabs-ink-bar]:rounded-r-full",
];

/**
 * The hover fill follows `color`: `colorFillTertiary` under `default`, and
 * `colorPrimaryBg` under `primary`, where the hovered label also stays
 * `colorPrimary` instead of antd's lighter hover color, which washes out on
 * the tint. No fill on a disabled tab.
 */
const PRIMARY_HOVER_INK =
  "[&_.ant-tabs-tab:not(.ant-tabs-tab-disabled):hover]:text-primary";
const HOVER_FILL_ON_LABEL = {
  default: "[&_.ant-tabs-tab-btn]:before:bg-fill-tertiary",
  primary: ["[&_.ant-tabs-tab-btn]:before:bg-primary-bg", PRIMARY_HOVER_INK],
} as const;
const HOVER_FILL_ON_ITEM = {
  default:
    "[&_.ant-tabs-tab:not(.ant-tabs-tab-disabled):hover]:bg-fill-tertiary",
  primary: [
    "[&_.ant-tabs-tab:not(.ant-tabs-tab-disabled):hover]:bg-primary-bg",
    PRIMARY_HOVER_INK,
  ],
} as const;

/**
 * Every Tabs: the gap between a tab's icon and label is `sizeXS` instead of
 * antd's `marginSM`, which reads loose beside the text. Same selector as antd,
 * so an icon-only tab still has no gap.
 */
const ICON_GAP = "[&_.ant-tabs-tab-icon:not(:last-child)]:me-xs";

/**
 * Every Tabs: a resting label is `colorTextSecondary`, so the selected and
 * hovered labels read as a step up under either color. Disabled tabs are
 * skipped. This also beats antd's own hover color, so `primary` hands it back:
 * `colorPrimaryHover` for antd's types here, and the filled types through
 * their hover fill arm, never both, or two utilities would compete.
 */
const RESTING_INK =
  "[&_.ant-tabs-tab:not(.ant-tabs-tab-disabled)]:text-secondary";
const PRIMARY_LINE_HOVER_INK =
  "[&_.ant-tabs-tab:not(.ant-tabs-tab-disabled):hover]:text-primary-hover";

/**
 * Every Tabs: a `small` label is `fontSizeSM`, where antd only tightens the
 * padding. It is CSS rather than a `titleFontSizeSM` token, because a
 * component token value does not shrink in compact mode.
 */
const SMALL_FONT = "[&.ant-tabs-small_.ant-tabs-tab]:text-sm";

/**
 * The classes for each `type` and `color`. antd paints `line`, `card` and
 * `editable-card` itself, and `primary` is antd's own look, so those are empty.
 */
export const tabsVariants = cva([ICON_GAP, RESTING_INK, SMALL_FONT], {
  variants: {
    type: {
      line: "",
      card: "",
      "editable-card": "",
      floating: FLOATING,
      padded: PADDED,
      docked: DOCKED,
    },
    color: {
      default: NEUTRAL,
      primary: "",
    },
  },
  compoundVariants: [
    {
      type: ["line", "card", "editable-card"],
      color: "primary",
      class: PRIMARY_LINE_HOVER_INK,
    },
    { type: "floating", color: "default", class: HOVER_FILL_ON_LABEL.default },
    { type: "floating", color: "primary", class: HOVER_FILL_ON_LABEL.primary },
    {
      type: ["padded", "docked"],
      color: "default",
      class: HOVER_FILL_ON_ITEM.default,
    },
    {
      type: ["padded", "docked"],
      color: "primary",
      class: HOVER_FILL_ON_ITEM.primary,
    },
  ],
  defaultVariants: { type: "line", color: "default" },
});

/**
 * Tabs' props, with three more `type` values, a `color` and a `ref`. `type`
 * and `color` are omitted and declared again because an `interface extends`
 * cannot widen an inherited member.
 */
export interface TabsProps extends Omit<AntdTabsProps, "type" | "color"> {
  /**
   * How the tab bar looks, `line` by default: antd's `line`, `card` and
   * `editable-card`, or the kit's `floating`, `padded` and `docked`.
   *
   * On hover, `floating` highlights the label, `padded` the padded tab and
   * `docked` the tab down to the rail. `indicator.size` overrides `docked`'s.
   * @default "line"
   */
  type?: TabsType;
  /**
   * The indicator and active label color, `default` (neutral text color) by
   * default, or `primary` for antd's primary color with a tinted hover.
   *
   * Resting labels use the secondary text color under both. This replaces the
   * inert HTML `color` attribute, so it never reaches the root element.
   * @default "default"
   */
  color?: TabsColor;
  /** Forwarded to the underlying Tabs. */
  ref?: Ref<TabsRef>;
}

const withMoreIcon = (moreIcon: TabsProps["moreIcon"]) =>
  moreIcon ?? <Icon name="more" />;

const isVertical = (
  placement: TabsProps["tabPlacement"] | TabsProps["tabPosition"],
) =>
  placement === "start" ||
  placement === "end" ||
  placement === "left" ||
  placement === "right";

/**
 * The props antd's Tabs receives and the classes painted beside them. Exported
 * for Card, whose tab bar is antd's own Tabs, so both resolve the same way. It
 * returns a pair because Card has to pass the classes as `rootClassName`.
 * `token` is passed in so this stays a plain function, not a hook.
 */
export const resolveTabsProps = (
  { type, color, indicator, moreIcon, ...props }: TabsProps,
  token: GlobalToken,
) => {
  // `docked`'s indicator spans the tab's content: antd's length minus
  // the padding on each side, read from the live token so compact mode follows.
  // Your own `indicator` keys win.
  const dockedIndicator: TabsProps["indicator"] =
    type === "docked"
      ? {
          size: (origin) =>
            origin -
            2 *
              (isVertical(props.tabPlacement ?? props.tabPosition)
                ? token.paddingXS
                : token.paddingSM),
          ...indicator,
        }
      : indicator;

  return [
    {
      ...props,
      // The kit's types are not forwarded: antd would stamp an `ant-tabs-<type>`
      // class it has no styles for.
      type: isAntdType(type) ? type : undefined,
      indicator: dockedIndicator,
      moreIcon: withMoreIcon(moreIcon),
    },
    tabsVariants({ type, color }),
  ] as const;
};

/**
 * Tabs in neutral colors by default, with `floating`, `padded` and `docked`
 * types, a `color` switch to antd's primary paint, and the overflow icon from
 * the icon pack.
 *
 * The overflow menu is a portal, so style it through `classNames.popup.root`.
 */
export const Tabs = ({ className, ...props }: TabsProps) => {
  const { token } = antdTheme.useToken();
  const [antdProps, classes] = resolveTabsProps(props, token);

  return <AntdTabs {...antdProps} className={cn(classes, className)} />;
};

Tabs.displayName = "Tabs";
