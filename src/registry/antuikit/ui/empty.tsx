"use client";

import type { EmptyProps as AntdEmptyProps } from "antd";
import { Empty as AntdEmpty, ConfigProvider } from "antd";
import { cva } from "class-variance-authority";
import type { ComponentRef, CSSProperties, ReactNode, Ref } from "react";
import { useContext, useId } from "react";
import { cn } from "@/registry/antuikit/lib/utils";
import { EmptyImageDefault } from "@/registry/antuikit/ui/empty-image-default";
import { EmptyImageSimple } from "@/registry/antuikit/ui/empty-image-simple";

/**
 * The palette the illustration is drawn in, and whether its shapes are filled.
 * Every tone is a token mixed into the surface it sits on, so it keeps its
 * contrast in light and dark mode and stays opaque.
 */
export const emptyVariants = cva("", {
  variants: {
    accent: {
      default: "",
      primary:
        "[--antuikit-empty-accent-edge:color-mix(in_srgb,var(--ant-color-primary)_55%,var(--antuikit-empty-surface,var(--ant-color-bg-container)))] [--antuikit-empty-accent-mid:color-mix(in_srgb,var(--ant-color-primary)_35%,var(--antuikit-empty-surface,var(--ant-color-bg-container)))] [--antuikit-empty-accent-lo:color-mix(in_srgb,var(--ant-color-primary)_18%,var(--antuikit-empty-surface,var(--ant-color-bg-container)))] [--antuikit-empty-accent-strong:var(--ant-color-primary)]",
    },
    appearance: {
      outlined: "",
      filled:
        "[--antuikit-empty-fill-1:color-mix(in_srgb,var(--ant-color-text-base)_2%,var(--antuikit-empty-surface,var(--ant-color-bg-container)))] [--antuikit-empty-fill-2:color-mix(in_srgb,var(--ant-color-text-base)_4%,var(--antuikit-empty-surface,var(--ant-color-bg-container)))] [--antuikit-empty-fill-3:color-mix(in_srgb,var(--ant-color-text-base)_6%,var(--antuikit-empty-surface,var(--ant-color-bg-container)))]",
    },
  },
  compoundVariants: [
    {
      accent: "primary",
      appearance: "filled",
      className:
        "[--antuikit-empty-fill-1:color-mix(in_srgb,var(--ant-color-primary)_4%,var(--antuikit-empty-surface,var(--ant-color-bg-container)))] [--antuikit-empty-fill-2:color-mix(in_srgb,var(--ant-color-primary)_8%,var(--antuikit-empty-surface,var(--ant-color-bg-container)))] [--antuikit-empty-fill-3:color-mix(in_srgb,var(--ant-color-primary)_12%,var(--antuikit-empty-surface,var(--ant-color-bg-container)))]",
    },
  ],
  defaultVariants: { accent: "default", appearance: "outlined" },
});

/** Empty's props, plus `accent`, `appearance`, `backdrop` and a `ref`. */
export interface EmptyProps extends AntdEmptyProps {
  /**
   * The palette the illustration is drawn in: `"default"` is grays mixed from
   * the text color, `"primary"` the theme's primary shades, at rest and on
   * hover. Defaults to `"default"`.
   */
  accent?: "default" | "primary";
  /**
   * `"outlined"` draws the illustration in lines only; `"filled"` also fills
   * its shapes with a very light tint of the `accent` palette. Defaults to
   * `"outlined"`.
   */
  appearance?: "outlined" | "filled";
  /**
   * The faint pattern behind the illustration: `"floor"` an isometric floor
   * the illustration stands on, `"grid"` a square grid, `"rings"` circles
   * that widen and narrow, `"none"` nothing. Defaults to `"floor"`, and to
   * `"none"` with the simple image.
   */
  backdrop?: "floor" | "grid" | "rings" | "none";
  /** Forwarded to the underlying Empty. */
  ref?: Ref<ComponentRef<typeof AntdEmpty>>;
}

// The backdrop is drawn around the image's centre, in pixels. The floor's
// tiles run along the illustrations' own ground axes, two across to one down.
const CENTER = 50;
const TILE = 28;
const CELL = 28;
const RINGS = [66, 109, 152];
// the drawn area, centred on the image
const SPAN_X = 800;
const SPAN_Y = 600;

/** The same shaded cells on every render, so server and client agree. */
function scatter(count: number, span: number, rows: number, seed: number) {
  let s = seed;
  const next = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: count }, () => ({
    c: Math.floor(next() * span) - span / 2,
    r: Math.floor(next() * rows) - rows / 2,
    odd: next() < 0.5,
    o: (0.4 + next() * 0.6).toFixed(2),
    d: (3 + next() * 5).toFixed(2),
    t: (-next() * 8).toFixed(2),
  }));
}
const GRID_CELLS = scatter(60, 20, 12, 7);
const FLOOR_TILES = scatter(46, 12, 12, 11);

const SURFACE = "var(--antuikit-empty-surface,var(--ant-color-bg-container))";
// The pattern sits behind the content and fades out before the box's edges.
// The mask's colors are alpha only.
const FADE: Record<string, string> = {
  floor:
    "radial-gradient(ellipse 200px 110px at 50% 50px,#000 30%,transparent)",
  grid: "radial-gradient(ellipse 200px 120px at 50% 50px,#000 30%,transparent)",
  rings:
    "radial-gradient(ellipse 260px 190px at 50% 50px,#000 25%,transparent)",
};
const EDGES = "linear-gradient(#0000,#000 24px,#000 calc(100% - 24px),#0000)";

const BACKDROP_CSS = `@layer components{
.antuikit-empty-backdrop{--antuikit-empty-backdrop-line:color-mix(in srgb,var(--ant-color-text-base) 7%,${SURFACE});--antuikit-empty-backdrop-cell:color-mix(in srgb,var(--ant-color-text-base) 3%,${SURFACE})}
.antuikit-empty-backdrop-cell{opacity:var(--o)}
.antuikit-empty-backdrop-ring{transform-box:fill-box;transform-origin:center}
@media (prefers-reduced-motion:no-preference){
.antuikit-empty-backdrop-cell{animation:antuikit-empty-backdrop-blink 5s ease-in-out infinite}
.antuikit-empty-backdrop-ring{animation:antuikit-empty-backdrop-wave 3.2s cubic-bezier(.45,0,.55,1) infinite}
}
@keyframes antuikit-empty-backdrop-blink{0%,100%{opacity:0}50%{opacity:var(--o)}}
@keyframes antuikit-empty-backdrop-wave{0%,100%{transform:scale(.92);opacity:.55}50%{transform:scale(1.05);opacity:1}}
}`;

function Backdrop({ kind }: { kind: "floor" | "grid" | "rings" }) {
  const id = useId().replace(/[^\w-]/g, "");
  const line = "var(--antuikit-empty-backdrop-line)";
  const cell = "var(--antuikit-empty-backdrop-cell)";
  const blink = (t: { o: string; d: string; t: string }) =>
    ({
      "--o": t.o,
      animationDuration: `${t.d}s`,
      animationDelay: `${t.t}s`,
    }) as CSSProperties;
  const a = TILE;
  const b = TILE / 2;
  return (
    <div
      aria-hidden
      className="antuikit-empty-backdrop pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      style={{
        maskImage: `${FADE[kind]},${EDGES}`,
        maskComposite: "intersect",
        WebkitMaskImage: `${FADE[kind]},${EDGES}`,
        WebkitMaskComposite: "source-in",
      }}
    >
      <style>{BACKDROP_CSS}</style>
      <svg
        aria-hidden="true"
        className="absolute left-1/2 max-w-none"
        style={{
          top: CENTER - SPAN_Y / 2,
          height: SPAN_Y,
          margin: `0 0 0 ${-SPAN_X / 2}px`,
        }}
        width={SPAN_X}
        height={SPAN_Y}
        viewBox={`${-SPAN_X / 2} ${-SPAN_Y / 2} ${SPAN_X} ${SPAN_Y}`}
      >
        {kind === "rings" &&
          RINGS.map((r, i) => (
            <circle
              key={r}
              r={r}
              fill="none"
              stroke={line}
              className="antuikit-empty-backdrop-ring"
              style={{ animationDelay: `${i * 0.35}s` }}
            />
          ))}
        {kind === "grid" && (
          <>
            <defs>
              <pattern
                id={`${id}g`}
                width={CELL}
                height={CELL}
                x={-CELL / 2}
                y={-CELL / 2}
                patternUnits="userSpaceOnUse"
              >
                <path d={`M${CELL} 0V${CELL}H0`} fill="none" stroke={line} />
              </pattern>
            </defs>
            {GRID_CELLS.map((t, i) => (
              <rect
                // biome-ignore lint/suspicious/noArrayIndexKey: static list
                key={i}
                x={t.c * CELL - CELL / 2}
                y={t.r * CELL - CELL / 2}
                width={CELL}
                height={CELL}
                fill={cell}
                className="antuikit-empty-backdrop-cell"
                style={blink(t)}
              />
            ))}
            <rect
              x={-SPAN_X / 2}
              y={-SPAN_Y / 2}
              width={SPAN_X}
              height={SPAN_Y}
              fill={`url(#${id}g)`}
            />
          </>
        )}
        {kind === "floor" && (
          <>
            <defs>
              <pattern
                id={`${id}f`}
                width={2 * a}
                height={2 * b}
                x={-a}
                y={-b}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M0 ${b}L${a} 0L${2 * a} ${b}L${a} ${2 * b}Z`}
                  fill="none"
                  stroke={line}
                />
              </pattern>
              <radialGradient id={`${id}u`}>
                <stop offset="0" stopColor={SURFACE} stopOpacity=".85" />
                <stop offset=".6" stopColor={SURFACE} stopOpacity=".6" />
                <stop offset="1" stopColor={SURFACE} stopOpacity="0" />
              </radialGradient>
            </defs>
            {FLOOR_TILES.map((t, i) => {
              const cx = (t.odd ? a : 0) + 2 * a * t.c;
              const cy = (t.odd ? b : 0) + 2 * b * t.r;
              return (
                <path
                  // biome-ignore lint/suspicious/noArrayIndexKey: static list
                  key={i}
                  d={`M${cx} ${cy - b}l${a} ${b}l${-a} ${b}l${-a} ${-b}Z`}
                  fill={cell}
                  className="antuikit-empty-backdrop-cell"
                  style={blink(t)}
                />
              );
            })}
            <rect
              x={-SPAN_X / 2}
              y={-SPAN_Y / 2}
              width={SPAN_X}
              height={SPAN_Y}
              fill={`url(#${id}f)`}
            />
            {/* the lines fade under the illustration's plinth */}
            <ellipse cx={0} cy={22} rx={86} ry={40} fill={`url(#${id}u)`} />
          </>
        )}
      </svg>
    </div>
  );
}

// One element each, so the compact preset can be recognised by identity, the
// way antd recognises its own.
const PRESENTED_IMAGE_DEFAULT = <EmptyImageDefault />;
const PRESENTED_IMAGE_SIMPLE = <EmptyImageSimple />;

function EmptyRoot({
  accent,
  appearance,
  backdrop,
  className,
  image,
  prefixCls,
  ...props
}: EmptyProps) {
  const { getPrefixCls, empty } = useContext(ConfigProvider.ConfigContext);
  const mergedImage = image ?? empty?.image ?? PRESENTED_IMAGE_DEFAULT;
  const simple = mergedImage === PRESENTED_IMAGE_SIMPLE;
  // antd gives the compact layout only to its own simple image, so it is
  // handed back here for the kit's.
  const normal = simple && `${getPrefixCls("empty", prefixCls)}-normal`;
  const kind = backdrop ?? (simple ? "none" : "floor");
  return (
    <AntdEmpty
      {...props}
      prefixCls={prefixCls}
      image={
        kind === "none" ||
        mergedImage == null ||
        mergedImage === false ||
        typeof mergedImage === "string" ? (
          mergedImage
        ) : (
          <>
            <Backdrop kind={kind} />
            {mergedImage}
          </>
        )
      }
      className={cn(
        emptyVariants({ accent, appearance }),
        normal,
        kind !== "none" && "relative isolate",
        className,
      )}
    />
  );
}

EmptyRoot.displayName = "Empty";

/**
 * Empty, with the kit's own line illustrations in place of antd's two presets.
 *
 * They move on hover with CSS alone. `accent` draws them in the theme's
 * primary shades, `appearance` fills their shapes and `backdrop` sets the
 * pattern behind them. Pass `image` to replace one.
 */
export const Empty = Object.assign(EmptyRoot, {
  PRESENTED_IMAGE_DEFAULT,
  PRESENTED_IMAGE_SIMPLE,
});

// Popups sit on the elevated background, so the illustration's fills match it.
const POPUP_SURFACE = {
  "--antuikit-empty-surface": "var(--ant-color-bg-elevated)",
} as CSSProperties;

function DataEmpty({ componentName }: { componentName?: string }) {
  const { getPrefixCls } = useContext(ConfigProvider.ConfigContext);
  switch (componentName) {
    case "Table":
    case "List":
      return <Empty image={PRESENTED_IMAGE_SIMPLE} />;
    case "Transfer":
      return (
        <Empty
          image={PRESENTED_IMAGE_SIMPLE}
          className={`${getPrefixCls("empty")}-small`}
        />
      );
    case "Select":
    case "TreeSelect":
    case "Cascader":
    case "Mentions":
      return (
        <Empty
          image={PRESENTED_IMAGE_SIMPLE}
          className={`${getPrefixCls("empty")}-small`}
          style={POPUP_SURFACE}
        />
      );
    default:
      return <Empty />;
  }
}

/**
 * A `renderEmpty` for ConfigProvider: antd's own choice of empty state per
 * component, drawn with the kit's illustrations.
 */
export function renderEmpty(componentName?: string): ReactNode {
  // Table hands its filter dropdown's empty state to the filter itself.
  return componentName === "Table.filter" ? null : (
    <DataEmpty componentName={componentName} />
  );
}
