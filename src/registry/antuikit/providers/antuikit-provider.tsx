"use client";

import { StyleProvider } from "@ant-design/cssinjs";
import {
  App,
  theme as antdTheme,
  ConfigProvider,
  type ThemeConfig,
} from "antd";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { antuikitTheme } from "@/registry/antuikit/lib/antuikit.theme.generated";
import { renderEmpty } from "@/registry/antuikit/ui/empty";
import { Icon } from "@/registry/antuikit/ui/icon";

/** Declared locally so the dev-only warning below compiles without @types/node. */
declare const process: { env: { NODE_ENV?: string } };

/**
 * Live provider instances, counted so a second one can warn. Counted by
 * instance because a page may already ship `class="dark"` on `<html>`.
 */
const documentThemeOwners = new Set<string>();

let hasWarnedAboutSharedDocument = false;

/** The theme setting. `auto` follows the OS and resolves to light or dark. */
export type AntuikitThemeMode = "light" | "dark" | "auto";

/** The text direction the provider applies. */
export type AntuikitDirection = "ltr" | "rtl";

const PREFERS_DARK = "(prefers-color-scheme: dark)";

function prefersDark(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function")
    return false;
  return window.matchMedia(PREFERS_DARK).matches;
}

/**
 * Always `false`, so the hydration render matches the server's. Under `auto` a
 * server-rendered app paints light first. Pass `defaultMode` from a cookie to
 * avoid that.
 */
function prefersDarkOnServer(): boolean {
  return false;
}

/**
 * Module-scoped so React does not re-subscribe on every render. It listens in
 * every mode, so switching to `auto` never paints a stale preference.
 */
function subscribeToPreferredScheme(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function")
    return () => {};
  const query = window.matchMedia(PREFERS_DARK);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** What `useAntuikitTheme()` returns: the three axes and their setters. */
export interface AntuikitThemeContextValue {
  /** The setting, which stays `auto` however the OS resolves. Render pickers from it. */
  mode: AntuikitThemeMode;
  setMode: (mode: AntuikitThemeMode) => void;
  /** Whether dark mode paints, with `auto` resolved against the OS. */
  isDark: boolean;
  /** Whether antd's compact density is on. */
  isCompact: boolean;
  setCompact: (compact: boolean) => void;
  toggleCompact: () => void;
  /** The text direction, applied to antd and to `<html dir>`. */
  direction: AntuikitDirection;
  setDirection: (direction: AntuikitDirection) => void;
  /** The theme the provider paints with, which a `ThemeScope` reuses by default. */
  theme: AntuikitTheme;
}

const AntuikitThemeContext = createContext<AntuikitThemeContextValue | null>(
  null,
);

/** Reads and sets the provider's mode, density and direction, and reads its theme. */
export function useAntuikitTheme(): AntuikitThemeContextValue {
  const ctx = useContext(AntuikitThemeContext);
  if (!ctx)
    throw new Error("useAntuikitTheme must be used within <AntuikitProvider>");
  return ctx;
}

/** A theme: one antd `ThemeConfig` for light mode and one for dark. */
export interface AntuikitTheme {
  light: ThemeConfig;
  dark: ThemeConfig;
}

/**
 * antd fixes a small button's inline padding at `8 - lineWidth`, so it stays
 * 7px however large a theme makes the control. This derives it as half the
 * medium padding instead, which is the same 7.5px at antd's default seeds.
 * antd writes the value into a CSS variable on the button, where both
 * variables resolve, so a string works although antd types the token as a
 * number.
 */
const BUTTON_PADDING_INLINE_SM =
  "calc(var(--ant-padding-content-horizontal) * 0.5 - var(--ant-line-width))" as unknown as number;

/**
 * Resolves a theme for the active mode and density, adding antd's compact
 * algorithm when compact is on. `hashed` and `cssVar` are set after the spread
 * so a theme cannot change them, and `inherit` passes through untouched.
 * `ThemeScope` uses it too, with `scoped`: a scope that inherits gets the kit's
 * component defaults from the root, so they are added only where a theme
 * starts fresh, and a value the theme sets itself always wins.
 */
export function composeThemeConfig(
  theme: AntuikitTheme,
  isDark: boolean,
  isCompact: boolean,
  scoped = false,
): ThemeConfig {
  const base = isDark ? theme.dark : theme.light;
  const baseAlgorithm = Array.isArray(base.algorithm)
    ? base.algorithm
    : base.algorithm
      ? [base.algorithm]
      : [isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm];
  const withDefaults = !scoped || base.inherit === false;
  return {
    ...base,
    algorithm: [
      ...baseAlgorithm,
      ...(isCompact ? [antdTheme.compactAlgorithm] : []),
    ],
    components: withDefaults
      ? {
          ...base.components,
          Button: {
            paddingInlineSM: BUTTON_PADDING_INLINE_SM,
            ...base.components?.Button,
          },
        }
      : base.components,
    hashed: false,
    cssVar: undefined,
  };
}

/** Props for `AntuikitProvider`. */
export interface AntuikitProviderProps {
  /**
   * The initial theme setting, `"auto"` by default, which follows the OS. A
   * server cannot read the OS, so an SSR app should persist the visitor's
   * choice in a cookie and pass it here to avoid a flash of the wrong theme.
   *
   * @default "auto"
   */
  defaultMode?: AntuikitThemeMode;
  /**
   * Whether compact density starts on, `false` by default.
   *
   * @default false
   */
  defaultCompact?: boolean;
  /**
   * The initial text direction, `"ltr"` by default.
   *
   * @default "ltr"
   */
  defaultDirection?: AntuikitDirection;
  /**
   * One `ThemeConfig` per mode, antuikit's generated theme by default. Rebuild
   * it from `tokens/*.tokens.json` instead of editing it.
   */
  theme?: AntuikitTheme;
  children: ReactNode;
}

const ALERT_ICONS = {
  closeIcon: <Icon name="close" />,
  successIcon: <Icon name="success" />,
  infoIcon: <Icon name="info" />,
  warningIcon: <Icon name="warning" />,
  errorIcon: <Icon name="error" />,
  classNames: {
    // Centers the icon on the title's line box, so it follows compact mode.
    icon: "[.ant-alert-with-description_&]:mt-[calc((var(--ant-font-size)*var(--ant-line-height)-1em)*0.5)] [.ant-alert-with-description_&]:me-xs",
    title: "text-base m-0 font-medium",
    description: "text-secondary",
    close:
      "mt-xxs text-icon enabled:hover:text-icon-hover disabled:text-disabled",
  },
} as const;

/**
 * Drawer's close glyph, placed at the end of the header where antd puts it at
 * the start. A Drawer's own `closable` replaces this whole value.
 */
const DRAWER_CONFIG = {
  closeIcon: <Icon name="close" />,
  closable: { placement: "end" },
} as const;

/**
 * Draws Checkbox's indeterminate mark as a rounded line that pops in from the
 * center, sized from the box so it keeps its shape when a theme grows the
 * control, and lifts the check mark to center it inside the kit's thinner
 * border. The label centers on the box, which only moves it when the box is
 * taller than the line. On the provider so it also reaches the checkboxes antd
 * renders inside Table and Transfer.
 */
const CHECKBOX_CONFIG = {
  className: [
    "[&_.ant-checkbox-indeterminate]:after:h-[max(calc(var(--ant-size-xxs)*0.75),calc(var(--ant-font-size-lg)*0.125))]",
    "supports-[height:round(1px,1px)]:[&_.ant-checkbox-indeterminate]:after:h-[round(calc(var(--ant-control-interactive-size)*0.1875),1px)]",
    "[&_.ant-checkbox-indeterminate]:after:w-[calc(var(--ant-control-interactive-size)*0.5)]",
    "[&_.ant-checkbox-indeterminate]:after:rounded-full",
    "[&_.ant-checkbox-indeterminate]:after:transition-none [&_.ant-checkbox-indeterminate]:after:origin-top-left",
    "motion-safe:[&_.ant-checkbox-indeterminate]:after:animate-pop-in",
    "[&_.ant-checkbox:not(.ant-checkbox-indeterminate)]:after:top-[calc(50%-var(--ant-line-width-bold))]",
    "[&_.ant-checkbox-label]:self-center",
  ].join(" "),
} as const;

/**
 * The same fix for Cascader, Tree and TreeSelect, which draw their own checkbox
 * span under their own prefix, so the `checkbox` key above never reaches them.
 */
const CASCADER_CHECKBOX = [
  "[&_.ant-cascader-checkbox-indeterminate]:after:h-[max(calc(var(--ant-size-xxs)*0.75),calc(var(--ant-font-size-lg)*0.125))]",
  "supports-[height:round(1px,1px)]:[&_.ant-cascader-checkbox-indeterminate]:after:h-[round(calc(var(--ant-control-interactive-size)*0.1875),1px)]",
  "[&_.ant-cascader-checkbox-indeterminate]:after:w-[calc(var(--ant-control-interactive-size)*0.5)]",
  "[&_.ant-cascader-checkbox-indeterminate]:after:rounded-full",
  "[&_.ant-cascader-checkbox-indeterminate]:after:transition-none [&_.ant-cascader-checkbox-indeterminate]:after:origin-top-left",
  "motion-safe:[&_.ant-cascader-checkbox-indeterminate]:after:animate-pop-in",
  "[&_.ant-cascader-checkbox:not(.ant-cascader-checkbox-indeterminate)]:after:top-[calc(50%-var(--ant-line-width-bold))]",
].join(" ");

const TREE_CHECKBOX = [
  "[&_.ant-tree-checkbox-indeterminate]:after:h-[max(calc(var(--ant-size-xxs)*0.75),calc(var(--ant-font-size-lg)*0.125))]",
  "supports-[height:round(1px,1px)]:[&_.ant-tree-checkbox-indeterminate]:after:h-[round(calc(var(--ant-control-interactive-size)*0.1875),1px)]",
  "[&_.ant-tree-checkbox-indeterminate]:after:w-[calc(var(--ant-control-interactive-size)*0.5)]",
  "[&_.ant-tree-checkbox-indeterminate]:after:rounded-full",
  "[&_.ant-tree-checkbox-indeterminate]:after:transition-none [&_.ant-tree-checkbox-indeterminate]:after:origin-top-left",
  "motion-safe:[&_.ant-tree-checkbox-indeterminate]:after:animate-pop-in",
  "[&_.ant-tree-checkbox:not(.ant-tree-checkbox-indeterminate)]:after:top-[calc(50%-var(--ant-line-width-bold))]",
].join(" ");

const TREE_SELECT_CHECKBOX = [
  "[&_.ant-select-tree-checkbox-indeterminate]:after:h-[max(calc(var(--ant-size-xxs)*0.75),calc(var(--ant-font-size-lg)*0.125))]",
  "supports-[height:round(1px,1px)]:[&_.ant-select-tree-checkbox-indeterminate]:after:h-[round(calc(var(--ant-control-interactive-size)*0.1875),1px)]",
  "[&_.ant-select-tree-checkbox-indeterminate]:after:w-[calc(var(--ant-control-interactive-size)*0.5)]",
  "[&_.ant-select-tree-checkbox-indeterminate]:after:rounded-full",
  "[&_.ant-select-tree-checkbox-indeterminate]:after:transition-none [&_.ant-select-tree-checkbox-indeterminate]:after:origin-top-left",
  "motion-safe:[&_.ant-select-tree-checkbox-indeterminate]:after:animate-pop-in",
  "[&_.ant-select-tree-checkbox:not(.ant-select-tree-checkbox-indeterminate)]:after:top-[calc(50%-var(--ant-line-width-bold))]",
].join(" ");

const NOTIFICATION_ICONS = {
  closeIcon: <Icon name="close" />,
} as const;

const TOUR_ICONS = {
  closeIcon: <Icon name="close" />,
} as const;

const IMAGE_ICONS = {
  preview: {
    closeIcon: <Icon name="close" />,
  },
} as const;

const CASCADER_ICONS = {
  suffixIcon: <Icon name="chevron-down" />,
  expandIcon: <Icon name="chevron-right" className="rtl:-scale-x-100" />,
  loadingIcon: <Icon name="loading" className="motion-safe:animate-spin" />,
  clearIcon: <Icon name="close" />,
  removeIcon: <Icon name="close" />,
  searchIcon: <Icon name="search" />,
} as const;

const TREE_SELECT_ICONS = {
  // Centered in the switcher box with `absolute inset-0 m-auto`, because
  // Icon's baseline nudge sits it low there. `text-base` keeps it at
  // `fontSize`, where antd shrinks it to 10px without `treeLine`. `tree.tsx`
  // does the same.
  switcherIcon: ({ expanded }: { expanded?: boolean }) => (
    <Icon
      name="chevron-down"
      className={`absolute inset-0 m-auto text-base transition-transform ${expanded ? "" : "-rotate-90 rtl:rotate-90"}`}
    />
  ),
} as const;

const PICKER_ICONS = {
  timePicker: {
    suffixIcon: <Icon name="clock" />,
    clearIcon: <Icon name="close" />,
  },
  datePicker: {
    clearIcon: <Icon name="close" />,
  },
  rangePicker: {
    // No `rtl:-scale-x-100`: antd already mirrors the separator's wrapper in
    // RTL, and a second flip would cancel it.
    separator: <Icon name="arrow-right" />,
  },
} as const;

/**
 * antd draws a borderless field with `border: none` and adds the missing
 * `lineWidth` to its padding. Its `transition: all` then animates the padding
 * while the border changes at once, so switching variants makes the field's
 * height jump by a pixel. Only colors and the shadow animate here, and the
 * border fades in from transparent instead of from the text color.
 */
const BORDERLESS_EDGE = [
  "[transition-property:color,background-color,border-color,box-shadow,outline-color]",
  "[&:is(.ant-input-borderless,.ant-input-affix-wrapper-borderless,.ant-input-number-borderless,.ant-input-number-affix-wrapper-borderless,.ant-mentions-borderless,.ant-picker-borderless)]:border-transparent",
].join(" ");

const TRANSFER_ICONS = {
  selectionsIcon: <Icon name="chevron-down" />,
} as const;

/**
 * Pulls a button's icon half a `sizeXXS` toward the edge it sits at, since a
 * glyph's box carries whitespace a letter does not. Skipped for icon-only and
 * `block` buttons, where antd centers the content and the pull would shift it.
 * Dropped while a spinner collapses, so the margin eases back to zero with it.
 * The collapsing slot holds antd's own spinner, so it is hidden. The loading
 * spinner itself is the pack's, here so antd's own Buttons get it too.
 */
const BUTTON_CONFIG = {
  loadingIcon: <Icon name="loading" />,
  classNames: {
    icon: [
      "[.ant-btn:not(.ant-btn-icon-only):not(.ant-btn-block):not(.ant-btn-icon-end)_&:not(.ant-btn-loading-icon-motion-leave-active)]:-ms-[calc(var(--ant-size-xxs)*0.5)]",
      "[.ant-btn-icon-end:not(.ant-btn-icon-only):not(.ant-btn-block)_&:not(.ant-btn-loading-icon-motion-leave-active)]:-me-[calc(var(--ant-size-xxs)*0.5)]",
      "[&.ant-btn-loading-icon-motion-leave_.anticon]:invisible",
    ].join(" "),
  },
} as const;

const FLOAT_BUTTON_ICONS = {
  floatButton: {
    backTopIcon: <Icon name="chevron-up" />,
  },
  floatButtonGroup: {
    closeIcon: <Icon name="close" />,
  },
} as const;

const FORM_ICONS = {
  tooltip: { icon: <Icon name="help" /> },
  classNames: {
    label:
      "[&:before]:order-1 [&:before]:ms-xxs [&:after]:order-last [&>span]:order-2",
  },
} as const;

const SELECT_ICONS = {
  suffixIcon: <Icon name="chevron-down" />,
  clearIcon: <Icon name="close" />,
  removeIcon: <Icon name="close" />,
  loadingIcon: <Icon name="loading" />,
} as const;

const BREADCRUMB_ICONS = {
  separator: <Icon name="chevron-right" className="rtl:-scale-x-100" />,
  dropdownIcon: <Icon name="chevron-down" className="ms-xxs" />,
} as const;

const INPUT_ICONS = {
  password: {
    iconRender: (visible: boolean) => (
      <Icon name={visible ? "eye" : "eye-off"} />
    ),
  },
  search: { searchIcon: <Icon name="search" /> },
} as const;

const TABS_ICONS = {
  addIcon: <Icon name="plus" />,
  removeIcon: <Icon name="close" />,
} as const;

const COLLAPSE_ICONS = {
  // Under `collapsible` "icon" or "header" the arrow's wrapper is a button of
  // its own, so it takes the label antd gives its own arrow there.
  expandIcon: ({
    isActive,
    collapsible,
  }: {
    isActive?: boolean;
    collapsible?: string;
  }) => (
    <Icon
      name="chevron-right"
      aria-label={
        collapsible === "icon" || collapsible === "header"
          ? isActive
            ? "expanded"
            : "collapsed"
          : undefined
      }
      className={`transition-transform ${isActive ? "rotate-90 rtl:-rotate-90" : ""}`}
    />
  ),
} as const;

/**
 * The root provider: it applies the antuikit theme to antd and mirrors the mode
 * and direction onto `<html>` for Tailwind's `dark:` and `rtl:` variants.
 *
 * Mount one, at the root, and use `<ThemeScope>` for a differently themed
 * region. antd's CSS goes in `@layer antd`, so your entry CSS needs
 * `@layer theme, base, antd, antdx, components, utilities;` at the top.
 */
export function AntuikitProvider({
  defaultMode = "auto",
  defaultCompact = false,
  defaultDirection = "ltr",
  theme = antuikitTheme,
  children,
}: AntuikitProviderProps) {
  const [mode, setMode] = useState<AntuikitThemeMode>(defaultMode);
  const systemDark = useSyncExternalStore(
    subscribeToPreferredScheme,
    prefersDark,
    prefersDarkOnServer,
  );
  const [isCompact, setCompact] = useState(defaultCompact);
  const toggleCompact = useCallback(() => setCompact((c) => !c), []);
  const [direction, setDirection] =
    useState<AntuikitDirection>(defaultDirection);
  const isDark = mode === "auto" ? systemDark : mode === "dark";

  const value = useMemo(
    () => ({
      mode,
      setMode,
      isDark,
      isCompact,
      setCompact,
      toggleCompact,
      direction,
      setDirection,
      theme,
    }),
    [mode, isDark, isCompact, toggleCompact, direction, theme],
  );
  const colorScheme = isDark ? "dark" : "light";
  const instanceId = useId();

  /**
   * Mirrors the theme onto `<html>`: the `light`/`dark` class for Tailwind's
   * `dark:` variant (portals included), `color-scheme` for the canvas and
   * native controls, and `dir` for `rtl:`. The restore reads `getAttribute`,
   * because writing back `.dir`'s `""` would mean `auto`.
   */
  useEffect(() => {
    const root = document.documentElement;

    if (process.env.NODE_ENV !== "production") {
      if (documentThemeOwners.size > 0 && !hasWarnedAboutSharedDocument) {
        hasWarnedAboutSharedDocument = true;
        console.warn(
          "[antuikit] Two <AntuikitProvider>s are mounted at once. Each one writes the " +
            "theme onto <html>, which is global, so they overwrite each other: unmount " +
            "them in any order other than together and <html> is left holding the wrong " +
            "theme with nothing mounted. Do not nest <AntuikitProvider>: mount exactly " +
            "one at the root, and use <ThemeScope> for a differently themed region.",
        );
      }
    }
    documentThemeOwners.add(instanceId);

    const hadDark = root.classList.contains("dark");
    const hadLight = root.classList.contains("light");
    const previousColorScheme = root.style.colorScheme;
    const previousDir = root.getAttribute("dir");

    root.classList.toggle("dark", isDark);
    root.classList.toggle("light", !isDark);
    root.style.colorScheme = colorScheme;
    root.setAttribute("dir", direction);

    return () => {
      documentThemeOwners.delete(instanceId);
      if (documentThemeOwners.size === 0) hasWarnedAboutSharedDocument = false;
      root.classList.toggle("dark", hadDark);
      root.classList.toggle("light", hadLight);
      root.style.colorScheme = previousColorScheme;
      if (previousDir === null) root.removeAttribute("dir");
      else root.setAttribute("dir", previousDir);
    };
  }, [isDark, colorScheme, direction, instanceId]);

  return (
    <StyleProvider layer>
      {/* No `cssVar` key: antd generates a unique one per instance, and a fixed
          key would make two roots collide on one selector. */}
      <ConfigProvider
        theme={composeThemeConfig(theme, isDark, isCompact)}
        direction={direction}
        renderEmpty={renderEmpty}
        alert={ALERT_ICONS}
        checkbox={CHECKBOX_CONFIG}
        breadcrumb={BREADCRUMB_ICONS}
        drawer={DRAWER_CONFIG}
        notification={NOTIFICATION_ICONS}
        tour={TOUR_ICONS}
        image={IMAGE_ICONS}
        cascader={{
          ...CASCADER_ICONS,
          classNames: { popup: { root: CASCADER_CHECKBOX } },
        }}
        treeSelect={{
          ...TREE_SELECT_ICONS,
          classNames: { popup: { root: TREE_SELECT_CHECKBOX } },
        }}
        tree={{ className: TREE_CHECKBOX }}
        timePicker={{ ...PICKER_ICONS.timePicker, className: BORDERLESS_EDGE }}
        datePicker={{ ...PICKER_ICONS.datePicker, className: BORDERLESS_EDGE }}
        rangePicker={{
          ...PICKER_ICONS.rangePicker,
          className: BORDERLESS_EDGE,
        }}
        input={{ className: BORDERLESS_EDGE }}
        textArea={{ className: BORDERLESS_EDGE }}
        inputNumber={{ className: BORDERLESS_EDGE }}
        mentions={{ className: BORDERLESS_EDGE }}
        transfer={TRANSFER_ICONS}
        floatButton={FLOAT_BUTTON_ICONS.floatButton}
        floatButtonGroup={FLOAT_BUTTON_ICONS.floatButtonGroup}
        form={FORM_ICONS}
        collapse={{
          ...COLLAPSE_ICONS,
          classNames: {
            icon: "text-xl",
          },
        }}
        inputPassword={INPUT_ICONS.password}
        inputSearch={INPUT_ICONS.search}
        tabs={TABS_ICONS}
        select={{
          ...SELECT_ICONS,
          classNames: {
            suffix: "inline-flex items-center text-base text-text",
            clear: "text-text",
          },
        }}
        button={BUTTON_CONFIG}
        otp={{
          classNames: {
            input: "px-xs [.ant-input-sm]:px-xxs [.ant-input-lg]:px-sm",
          },
        }}
        message={{
          classNames: {
            root: "px-sm py-xs",
          },
        }}
      >
        {/* A real <App> with its div: plain elements inherit `--ant-*` from it,
            and it themes `App.useApp()`'s message, notification and modal. */}
        <App>
          <AntuikitThemeContext.Provider value={value}>
            {children}
          </AntuikitThemeContext.Provider>
        </App>
      </ConfigProvider>
    </StyleProvider>
  );
}
