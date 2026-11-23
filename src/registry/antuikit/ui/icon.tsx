"use client";

import type { ComponentType, CSSProperties, SVGAttributes } from "react";
import {
  type IconGlyphProps,
  iconDefaults,
  iconPack,
  type SemanticIconName,
} from "@/registry/antuikit/lib/icons";
import { cn } from "@/registry/antuikit/lib/utils";

type SizedStyle = Pick<CSSProperties, "width" | "height">;

/**
 * Icon's props: SVG attributes plus `name`, `as`, `filled` and `size`.
 * `children` is left out, because a glyph draws its own paths.
 */
export interface IconProps extends Omit<SVGAttributes<SVGElement>, "children"> {
  /**
   * The semantic role to draw, like `"close"`, `"search"` or `"chevron-down"`.
   * It resolves through the installed icon pack, so a pack swap changes every
   * glyph at once.
   */
  name?: SemanticIconName;
  /**
   * A component to render instead of the pack's glyph, for a drawing no role
   * covers. It still gets the sizing, `currentColor` and the a11y defaults.
   */
  as?: ComponentType<IconGlyphProps>;
  /**
   * Draw the filled weight, which defaults to on for status roles and off for
   * the rest. Falls back to regular when the pack has no filled glyph.
   */
  filled?: boolean;
  /**
   * Width and height of the glyph, `"1em"` by default so it scales with the
   * text around it.
   */
  size?: SizedStyle["width"];
}

/**
 * A pack-agnostic icon: pass a semantic `name` and it draws that role from the
 * installed icon pack.
 *
 * Decorative by default (`aria-hidden`). Passing `aria-label` or
 * `aria-labelledby` makes it `role="img"`.
 */
export const Icon = ({
  name,
  as,
  filled,
  size = "1em",
  className,
  style,
  ...props
}: IconProps) => {
  const entry = name === undefined ? undefined : iconPack[name];
  const wantsFilled =
    filled ?? (name !== undefined && iconDefaults[name] === "filled");
  const Glyph =
    as ?? (wantsFilled ? (entry?.filled ?? entry?.regular) : entry?.regular);
  if (Glyph === undefined) return null;

  const labeled =
    props["aria-label"] !== undefined || props["aria-labelledby"] !== undefined;

  return (
    <Glyph
      aria-hidden={labeled ? undefined : true}
      role={labeled ? "img" : undefined}
      {...props}
      className={cn(
        // `inline-block` undoes Preflight's `svg { display: block }`.
        // `self-center` centers the glyph in a flex slot, `align-[-0.125em]`
        // in running text. `mb-0` cancels antd's 0.2em margin on a bare svg.
        "inline-block shrink-0 self-center align-[-0.125em] mb-0",
        name === "loading" && "animate-spin",
        className,
      )}
      // Sized through `style`: some packs write their own width and height
      // after spreading props, which would drop a `width` prop.
      style={{ width: size, height: size, ...style }}
      data-antuikit-icon=""
    />
  );
};

Icon.displayName = "Icon";
