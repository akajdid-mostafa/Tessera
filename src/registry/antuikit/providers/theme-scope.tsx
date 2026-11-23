"use client";

import { ConfigProvider, type ConfigProviderProps } from "antd";
import {
  type CSSProperties,
  createContext,
  type ReactNode,
  useContext,
  useId,
  useMemo,
} from "react";
import { cn } from "@/registry/antuikit/lib/utils";
import {
  type AntuikitTheme,
  composeThemeConfig,
  useAntuikitTheme,
} from "@/registry/antuikit/providers/antuikit-provider";

/**
 * ThemeScope's props: every `ConfigProvider` prop (`locale`, `direction`,
 * `componentSize` and the rest), with `theme` taking one config per mode.
 */
export interface ThemeScopeProps extends Omit<ConfigProviderProps, "theme"> {
  /** One `ThemeConfig` per mode, the outer scope's (or the provider's) unless set. */
  theme?: AntuikitTheme;
  /** Forces light or dark inside the scope, where the outer scope's mode applies by default. */
  mode?: "light" | "dark";
  /** Classes for the `<div>` this renders, which carries the scope's key class. */
  className?: string;
  /** Inline styles for that same `<div>`. */
  style?: CSSProperties;
  children: ReactNode;
}

/** The mode and theme `useThemeScope()` returns. */
export interface ThemeScopeValue {
  /** Whether the scope renders in dark mode. */
  isDark: boolean;
  /** The theme the scope resolves its mode against. */
  theme: AntuikitTheme;
}

const ThemeScopeContext = createContext<ThemeScopeValue | null>(null);

/** The nearest ThemeScope's mode and theme, or the root provider's outside one. */
export function useThemeScope(): ThemeScopeValue {
  const root = useAntuikitTheme();
  const scope = useContext(ThemeScopeContext);
  return scope ?? { isDark: root.isDark, theme: root.theme };
}

/**
 * A differently themed region inside `AntuikitProvider`, and it can nest.
 *
 * Use it instead of a nested `<ConfigProvider theme>`, which leaves plain
 * elements like `<div className="bg-primary">` on the outer theme. Mode and
 * theme follow the outer scope; density, `color-scheme`, `App.useApp()` and
 * a popup's `rtl:` classes stay the root's.
 */
export function ThemeScope({
  theme,
  mode,
  className,
  style,
  children,
  ...rest
}: ThemeScopeProps) {
  const { isCompact } = useAntuikitTheme();
  const outer = useThemeScope();
  const dark = mode ? mode === "dark" : outer.isDark;
  const resolved = theme ?? outer.theme;
  const value = useMemo(
    () => ({ isDark: dark, theme: resolved }),
    [dark, resolved],
  );
  const key = `antuikit-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <ConfigProvider
      {...rest}
      theme={{
        ...composeThemeConfig(resolved, dark, isCompact, true),
        cssVar: { key },
      }}
    >
      {/* `dir` follows `direction` so `rtl:` re-scopes with it. Left undefined,
          not `""`, since an empty `dir` means `auto`. */}
      <div dir={rest.direction} className={cn(key, className)} style={style}>
        <ThemeScopeContext.Provider value={value}>
          {children}
        </ThemeScopeContext.Provider>
      </div>
    </ConfigProvider>
  );
}

ThemeScope.displayName = "ThemeScope";
