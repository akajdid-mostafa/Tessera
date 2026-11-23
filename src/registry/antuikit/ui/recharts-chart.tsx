"use client";

import type { ComponentType, CSSProperties, ReactNode } from "react";
import { createContext, useContext } from "react";
import {
  Legend,
  type LegendPayload,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
} from "recharts";
import {
  CHART_LINE_WIDTH,
  type ChartEmphasis,
  type ChartPaletteName,
  chartColors,
  chartPaletteVars,
  chartSeriesColor,
} from "@/registry/antuikit/lib/chart-colors";
import { cn } from "@/registry/antuikit/lib/utils";

export {
  type ChartEmphasis,
  ChartPalette,
  type ChartPaletteName,
  type ChartPaletteProps,
  chartColors,
  chartSeriesColor,
} from "@/registry/antuikit/lib/chart-colors";

/**
 * Names and colors for each series, keyed by `dataKey`. A series without a
 * `color` takes the theme's next series color.
 */
export type ChartConfig = Record<
  string,
  {
    /** The name shown in the tooltip and legend. Defaults to the key. */
    label?: ReactNode;
    /** Any CSS color. Defaults to the theme's series color for this position. */
    color?: string;
    /** An icon drawn in the legend instead of the color dot. */
    icon?: ComponentType;
  }
>;

const ChartConfigContext = createContext<ChartConfig>({});

/** The `ChartConfig` of the nearest `ChartContainer`. */
export function useChartConfig(): ChartConfig {
  return useContext(ChartConfigContext);
}

/**
 * Recharts paints its own defaults as fixed hex attributes. These rules match
 * only those defaults, so a color you pass on a mark is left alone, and repaint
 * them with the theme's chart colors.
 */
const RECHARTS_DEFAULTS = cn(
  "text-sm",
  "[&_[stroke='#ccc']]:[stroke:var(--chart-grid)]",
  // Grid and axis lines take the theme's hairline instead of 1px.
  "[&_[stroke='#ccc']]:[stroke-width:var(--ant-line-width)]",
  "[&_[stroke='#666']]:[stroke-width:var(--ant-line-width)]",
  "[&_[fill='#ccc']]:[fill:var(--chart-cursor)]",
  "[&_[fill='#eee']]:[fill:var(--chart-track)]",
  "[&_[stroke='#666']]:[stroke:var(--chart-axis)]",
  "[&_[fill='#666']]:[fill:var(--chart-axis)]",
  "[&_text[fill='#666']]:[fill:var(--chart-label)]",
  "[&_text[fill='#ccc']]:[fill:var(--chart-label)]",
  "[&_text[fill='#808080']]:[fill:var(--chart-text)]",
  "[&_path[fill='#808080']]:[fill:var(--chart-first)]",
  "[&_[stroke='#fff']]:[stroke:var(--chart-surface)]",
  "[&_[stroke='#FFF']]:[stroke:var(--chart-surface)]",
  "[&_[fill='#fff']]:[fill:var(--chart-surface)]",
  "[&_text[fill='#333']]:[fill:var(--chart-text)]",
  "[&_[stroke='black']]:[stroke:var(--chart-text)]",
  "[&_[fill='black']]:[fill:var(--chart-text)]",
  "[&_[fill='#3182bd']]:[fill:var(--chart-first)]",
  "[&_[stroke='#3182bd']]:[stroke:var(--chart-first)]",
  // A line left at Recharts' default 1px takes the kit's series line width; a
  // width you pass on the mark is kept. An area's edge stays at 1px.
  "[&_.recharts-line-curve[stroke-width='1']]:[stroke-width:var(--chart-line-width)]",
  // Surfaces, sectors and brush travellers take focus on click. The ring shows
  // for keyboard focus only, in the kit's focus color.
  "[&_[tabindex]]:outline-none",
  "[&_[tabindex]:focus-visible]:outline-2",
  "[&_[tabindex]:focus-visible]:outline-offset-2",
  "[&_[tabindex]:focus-visible]:outline-primary-border",
  "[&_[tabindex]:focus-visible]:outline-solid",
);

/** The props of `ChartContainer`. */
export interface ChartContainerProps
  extends Omit<React.ComponentProps<"div">, "children"> {
  /** Names and colors for each series, keyed by `dataKey`. */
  config: ChartConfig;
  /** The series palette: shades of one color, one color plus grays, or distinct hues. Defaults to the theme's. */
  palette?: ChartPaletteName;
  /** The base of `mono` and `accent`: `"primary"`, a palette name such as `"emerald"`, or a CSS color. */
  color?: string;
  /** How loud the series colors are: `strong` is one step darker. */
  emphasis?: ChartEmphasis;
  /** One Recharts chart, such as `<AreaChart>`. */
  children: React.ComponentProps<typeof ResponsiveContainer>["children"];
}

/**
 * A responsive frame for one Recharts chart that paints its grid, axes, cursor
 * and labels with the theme's chart colors and exposes each series color as
 * `var(--series-<key>)`.
 */
export function ChartContainer({
  config,
  palette,
  color,
  emphasis,
  className,
  style,
  children,
  ...props
}: ChartContainerProps) {
  const vars: Record<string, string> = {
    ...(palette || emphasis === "strong"
      ? (chartPaletteVars(palette, color, emphasis) as Record<string, string>)
      : {}),
    "--chart-grid": chartColors.grid,
    "--chart-axis": chartColors.axis,
    "--chart-label": chartColors.label,
    "--chart-text": chartColors.text,
    "--chart-surface": chartColors.surface,
    "--chart-cursor": "var(--ant-color-fill-tertiary)",
    "--chart-track": "var(--ant-color-fill-quaternary)",
    "--chart-first": chartColors.series[0],
    "--chart-line-width": `${CHART_LINE_WIDTH}px`,
  };
  Object.entries(config).forEach(([key, item], index) => {
    vars[`--series-${key}`] = item.color ?? chartSeriesColor(index);
  });

  return (
    <ChartConfigContext.Provider value={config}>
      <div
        {...props}
        className={cn("aspect-video w-full", RECHARTS_DEFAULTS, className)}
        style={{ ...vars, ...style } as CSSProperties}
      >
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </ChartConfigContext.Provider>
  );
}

/** Recharts' `Tooltip`. Pass it `content={<ChartTooltipContent />}`. */
export const ChartTooltip = Tooltip;

/** The props of `ChartTooltipContent`. */
export type ChartTooltipContentProps = Partial<TooltipContentProps> & {
  /** Hide the title row. */
  hideLabel?: boolean;
  /** Hide the color marker beside each row. */
  hideIndicator?: boolean;
  /** The marker's shape: a dot, a vertical line or a dashed line. Defaults to `dot`. */
  indicator?: "dot" | "line" | "dashed";
  /** Reads each row's name from this field of the data instead of the series key. */
  nameKey?: string;
};

/** Tooltip content in the theme's popup style, with names from `ChartConfig`. */
export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  formatter,
  hideLabel = false,
  hideIndicator = false,
  indicator = "dot",
  nameKey,
}: ChartTooltipContentProps) {
  const config = useChartConfig();
  if (!active || !payload?.length) return null;

  const title = hideLabel
    ? null
    : labelFormatter
      ? labelFormatter(label, payload)
      : label;

  return (
    <div className="grid min-w-32 gap-xxs rounded-lg bg-elevated px-sm py-xs text-sm text-text shadow-secondary">
      {title !== null && title !== undefined && title !== "" && (
        <div className="font-strong">{title}</div>
      )}
      {payload.map((item, index) => {
        const key = String(
          (nameKey && item.payload?.[nameKey]) ?? item.dataKey ?? item.name,
        );
        const entry = config[key];
        const color = item.color ?? item.payload?.fill;
        const name = entry?.label ?? item.name ?? key;
        const value = formatter
          ? formatter(item.value, item.name, item, index, payload)
          : typeof item.value === "number"
            ? item.value.toLocaleString()
            : item.value;
        return (
          <div
            key={item.graphicalItemId ?? key}
            className="flex items-center gap-xs"
          >
            {!hideIndicator && (
              <span
                className={cn(
                  "shrink-0",
                  indicator === "dot" && "size-xs rounded-full",
                  indicator === "line" && "h-sm w-xxs rounded-full",
                  indicator === "dashed" &&
                    "h-sm w-0 border-dashed [border-inline-start-width:var(--ant-line-width-bold)]",
                )}
                style={{
                  backgroundColor: indicator === "dashed" ? undefined : color,
                  borderColor: color,
                }}
              />
            )}
            <span className="flex-1 text-secondary">{name}</span>
            <span className="font-strong tabular-nums">{value}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Recharts' `Legend`. Pass it `content={<ChartLegendContent />}`. */
export const ChartLegend = Legend;

/** The props of `ChartLegendContent`. Recharts' `Legend` passes the handlers and `layout`. */
export interface ChartLegendContentProps {
  payload?: readonly LegendPayload[];
  /** Reads each item's name from this field of the data instead of the series key. */
  nameKey?: string;
  /** `vertical` stacks the items in a column. Recharts' `Legend` passes it. */
  layout?: "horizontal" | "vertical";
  onMouseEnter?: LegendHandler;
  onMouseLeave?: LegendHandler;
  onClick?: LegendHandler;
}

type LegendHandler = (
  data: LegendPayload,
  index: number,
  event: React.MouseEvent<HTMLElement>,
) => void;

/**
 * Legend items as a color dot (or the config's icon) and the series name. An
 * inactive item is dimmed, and the `Legend` mouse and click handlers fire.
 */
export function ChartLegendContent({
  payload,
  nameKey,
  layout = "horizontal",
  onMouseEnter,
  onMouseLeave,
  onClick,
}: ChartLegendContentProps) {
  const config = useChartConfig();
  if (!payload?.length) return null;
  return (
    <div
      className={cn(
        "flex gap-base text-sm",
        layout === "vertical"
          ? "flex-col items-start gap-xs px-sm"
          : "flex-wrap items-center justify-center pt-sm",
      )}
    >
      {payload.map((item, index) => {
        const key = String(
          (nameKey &&
            (item.payload as Record<string, unknown> | undefined)?.[nameKey]) ??
            item.dataKey ??
            item.value,
        );
        const entry = config[key];
        const IconComponent = entry?.icon;
        const content = (
          <>
            {IconComponent ? (
              <span style={{ color: item.color }}>
                <IconComponent />
              </span>
            ) : (
              <span
                className="size-xs shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
            )}
            {entry?.label ?? item.value}
          </>
        );
        const itemClass = cn(
          "flex items-center gap-xxs text-secondary",
          item.inactive && "opacity-50",
        );
        const handlers = {
          onMouseEnter: onMouseEnter
            ? (event: React.MouseEvent<HTMLElement>) =>
                onMouseEnter(item, index, event)
            : undefined,
          onMouseLeave: onMouseLeave
            ? (event: React.MouseEvent<HTMLElement>) =>
                onMouseLeave(item, index, event)
            : undefined,
        };
        // A clickable item is a button so it works from the keyboard too.
        return onClick ? (
          <button
            // biome-ignore lint/suspicious/noArrayIndexKey: two series may share a dataKey; legend order is stable
            key={`${key}-${index}`}
            type="button"
            className={cn(itemClass, "cursor-(--ant-cursor-interactive)")}
            onClick={(event) => onClick(item, index, event)}
            {...handlers}
          >
            {content}
          </button>
        ) : (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: two series may share a dataKey; legend order is stable
            key={`${key}-${index}`}
            className={itemClass}
            {...handlers}
          >
            {content}
          </span>
        );
      })}
    </div>
  );
}

ChartContainer.displayName = "ChartContainer";
ChartTooltipContent.displayName = "ChartTooltipContent";
ChartLegendContent.displayName = "ChartLegendContent";
