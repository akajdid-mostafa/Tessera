import {
  type CSSProperties,
  createContext,
  createElement,
  type ReactNode,
} from "react";

/**
 * The three series palettes: `mono` is shades of one color, `accent` is that
 * color plus neutral grays, `multi` is a set of distinct hues.
 */
export type ChartPaletteName = "mono" | "accent" | "multi";

/** How loud the series colors are: `strong` is one step darker. */
export type ChartEmphasis = "default" | "strong";

/** How many series colors each palette defines before it repeats lighter. */
export const CHART_SERIES_COUNT = 12;

/** The width of a series line, the same in every chart library. */
export const CHART_LINE_WIDTH = 1.5;

const SURFACE = "var(--ant-color-bg-container)";

/** `color` mixed into the chart surface: opaque, so overlapping marks do not darken. */
const tint = (color: string, percent: number) =>
  percent >= 100
    ? color
    : `color-mix(in oklab, ${color} ${percent}%, ${SURFACE})`;

// Each step sits further from the surface than the next, in light and dark.
const MONO_STEPS = {
  default: [100, 78, 60, 45, 32, 21],
  strong: [100, 86, 72, 60, 48, 38],
};
const ACCENT_GRAYS = {
  default: [28, 21, 15, 10, 6],
  strong: [52, 38, 27, 18, 12],
};

// Used when the theme defines no `multi` palette: antd's presets, at the
// softer step of each mode's ramp. `strong` takes one step darker in each mode
// (antd's dark ramp darkens as the index falls).
const MULTI_PRESETS = [
  ["volcano", 5, 7],
  ["green", 5, 8],
  ["geekblue", 4, 8],
  ["gold", 4, 8],
  ["cyan", 4, 8],
  ["magenta", 5, 7],
  ["purple", 4, 8],
  ["lime", 5, 8],
  ["orange", 7, 6],
  ["red", 4, 7],
  ["blue", 3, 9],
] as const;
const multiFallback = (emphasis: ChartEmphasis) =>
  MULTI_PRESETS.map(([name, light, dark]) => {
    const shift = emphasis === "strong" ? 1 : 0;
    return `light-dark(var(--ant-${name}-${light + shift}), var(--ant-${name}-${dark - shift}))`;
  });
const MULTI_FALLBACK = {
  default: multiFallback("default"),
  strong: multiFallback("strong"),
};

/**
 * The CSS color of one palette slot (0-based), resolved from the theme's
 * `charts` tokens when it defines them. Past the palette's length the colors
 * repeat, mixed further into the surface on each round.
 */
function slot(
  palette: ChartPaletteName,
  index: number,
  base: string | undefined,
  emphasis: ChartEmphasis,
): string {
  const color = base ?? "var(--ant-color-primary)";
  const strong = emphasis === "strong" ? "-strong" : "";
  const monoSteps = MONO_STEPS[emphasis];
  const grays = ACCENT_GRAYS[emphasis];
  const steps =
    palette === "mono"
      ? monoSteps.length
      : palette === "accent"
        ? grays.length + 1
        : CHART_SERIES_COUNT;
  const i = index % steps;
  const round = Math.floor(index / steps);
  let value: string;
  if (palette === "mono") {
    const derived = tint(color, monoSteps[i] ?? 100);
    value = base
      ? derived
      : `var(--ant-color-chart-mono${strong}-${i + 1}, ${derived})`;
  } else if (palette === "accent") {
    const derived =
      i === 0 ? color : tint("var(--ant-color-text-base)", grays[i - 1] ?? 12);
    value =
      base && i === 0
        ? derived
        : `var(--ant-color-chart-accent${strong}-${i + 1}, ${derived})`;
  } else {
    const presets = MULTI_FALLBACK[emphasis];
    const fallback =
      i === CHART_SERIES_COUNT - 1
        ? tint("var(--ant-color-text-base)", strong ? 45 : 30)
        : (presets[i] ?? presets[0]);
    value = `var(--ant-color-chart-multi${strong}-${i + 1}, ${fallback})`;
  }
  return round === 0 ? value : tint(value, Math.max(30, 100 - round * 35));
}

/** The series colors of `palette`, in order, as CSS colors. */
export function chartPaletteColors(
  palette: ChartPaletteName,
  color?: string,
  emphasis: ChartEmphasis = "default",
  count = CHART_SERIES_COUNT,
): string[] {
  const base = color ? resolveBase(color) : undefined;
  return Array.from({ length: count }, (_, i) =>
    slot(palette, i, base, emphasis),
  );
}

/** The theme's default palette at `emphasis`, falling back to `mono`. */
function themeSeries(emphasis: ChartEmphasis): string[] {
  const strong = emphasis === "strong" ? "-strong" : "";
  return chartPaletteColors("mono", undefined, emphasis).map(
    (fallback, i) => `var(--ant-color-chart${strong}-${i + 1}, ${fallback})`,
  );
}

/** A palette name (`"emerald"`) or `"primary"` as a variable; any other value as is. */
function resolveBase(color: string): string {
  if (color === "primary") return "var(--ant-color-primary)";
  if (/^[a-z]+$/.test(color)) return `var(--ant-${color}-6)`;
  return color;
}

/**
 * The `--chart-series-*` variables that switch every chart below an element
 * to `palette` at `emphasis`. With no palette, the theme's default palette is
 * used. `color` sets the base of `mono` and `accent`: `"primary"`, a palette
 * name such as `"emerald"`, or any CSS color.
 */
export function chartPaletteVars(
  palette?: ChartPaletteName,
  color?: string,
  emphasis: ChartEmphasis = "default",
): CSSProperties {
  const colors = palette
    ? chartPaletteColors(palette, color, emphasis)
    : themeSeries(emphasis);
  return Object.fromEntries(
    colors.map((value, i) => [`--chart-series-${i + 1}`, value]),
  ) as CSSProperties;
}

/** Twelve series colors, typed as a tuple so `series[0]` is a `string`. */
type SeriesColors = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

/**
 * The theme's chart colors as CSS variables, shared by every chart library the
 * kit wraps. Series colors follow the nearest `palette`, then the theme's
 * default palette, then `mono` on the primary color.
 */
export const chartColors = {
  series: themeSeries("default").map(
    (theme, i) => `var(--chart-series-${i + 1}, ${theme})`,
  ) as unknown as SeriesColors,
  grid: "var(--ant-color-chart-grid, var(--ant-color-split))",
  axis: "var(--ant-color-chart-axis, var(--ant-color-border))",
  label: "var(--ant-color-chart-label, var(--ant-color-text-tertiary))",
  text: "var(--ant-color-chart-text, var(--ant-color-text-secondary))",
  positive: "var(--ant-color-chart-positive, var(--ant-color-success))",
  negative: "var(--ant-color-chart-negative, var(--ant-color-error))",
  surface: SURFACE,
  /** The hairline around a raised label or box, as the kit's Card draws it. */
  ring: "color-mix(in oklab, var(--ant-color-text-base) 12%, transparent)",
  /** A soft shadow under a hovered or raised mark: dark in both modes. */
  shadow:
    "light-dark(color-mix(in oklab, var(--ant-color-text-base) 10%, transparent), color-mix(in oklab, var(--ant-color-bg-base) 40%, transparent))",
} as const;

/**
 * Series color `index` (0-based) of the active palette. Past the twelfth the
 * colors repeat, mixed further into the surface on each round.
 */
export function chartSeriesColor(index: number): string {
  const color =
    chartColors.series[index % CHART_SERIES_COUNT] ?? chartColors.series[0];
  const round = Math.floor(index / CHART_SERIES_COUNT);
  return round === 0 ? color : tint(color, Math.max(30, 100 - round * 35));
}

/** The props of `ChartPalette`. */
export interface ChartPaletteProps {
  /** The series palette for every chart inside. Defaults to the theme's. */
  palette?: ChartPaletteName;
  /** The base of `mono` and `accent`: `"primary"`, a palette name such as `"emerald"`, or a CSS color. */
  color?: string;
  /** How loud the series colors are: `strong` is one step darker. */
  emphasis?: ChartEmphasis;
  children?: ReactNode;
}

/**
 * Switches every chart inside, and anything else that reads
 * `chartColors.series` (a legend beside the chart), to one palette. Renders a
 * `display: contents` element, so it adds no box.
 */
export function ChartPalette({
  palette,
  color,
  emphasis,
  children,
}: ChartPaletteProps) {
  return createElement(
    ChartPaletteContext.Provider,
    { value: `${palette}|${color}|${emphasis}` },
    createElement(
      "div",
      {
        style: {
          display: "contents",
          ...chartPaletteVars(palette, color, emphasis),
        },
      },
      children,
    ),
  );
}

/**
 * Changes whenever the nearest `ChartPalette` does, so a chart that resolves
 * its colors in JavaScript (a canvas) knows to resolve them again.
 */
export const ChartPaletteContext = createContext("");

/**
 * Replaces the `cursor: pointer` a chart library writes inline on its own
 * elements with the theme's cursor policy (`--ant-cursor-interactive`), for
 * everything under `element`. Drag cursors (move, grab, resize) are left
 * alone. Returns the function that stops watching.
 */
export function watchInteractiveCursor(element: HTMLElement): () => void {
  const apply = (target: HTMLElement) => {
    if (target.style?.cursor !== "pointer") return;
    const value = getComputedStyle(element)
      .getPropertyValue("--ant-cursor-interactive")
      .trim();
    if (value && value !== "pointer") target.style.cursor = value;
  };
  for (const node of element.querySelectorAll<HTMLElement>("[style]"))
    apply(node);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "attributes") apply(record.target as HTMLElement);
      for (const node of record.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        apply(node);
        for (const child of node.querySelectorAll<HTMLElement>("[style]"))
          apply(child);
      }
    }
  });
  observer.observe(element, {
    attributes: true,
    attributeFilter: ["style"],
    childList: true,
    subtree: true,
  });
  return () => observer.disconnect();
}
