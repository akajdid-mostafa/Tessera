"use client";

import type { BorderBeamProps as AntdBorderBeamProps } from "antd";
import { BorderBeam as AntdBorderBeam } from "antd";
import { cva } from "class-variance-authority";
import type { PropsWithChildren } from "react";
import { cn } from "@/registry/antuikit/lib/utils";

/**
 * The moving head is the beam layer's `::before`. Reversing the animation
 * alone would run it tail first, so the rotation turns around with it.
 */
export const borderBeamVariants = cva("", {
  variants: {
    reverse: {
      true: "before:[animation-direction:reverse] before:[offset-rotate:reverse]",
      false: "",
    },
  },
  defaultVariants: { reverse: false },
});

/** BorderBeam's props, plus `children`, which antd leaves off its type. */
export interface BorderBeamProps
  extends PropsWithChildren<AntdBorderBeamProps> {
  /** Runs the beam counterclockwise. */
  reverse?: boolean;
}

/**
 * BorderBeam, plus a `reverse` prop that runs the beam counterclockwise.
 *
 * The child must be an HTML element, or forward its `ref` to one, and be
 * `position: relative`.
 */
export const BorderBeam = ({
  className,
  reverse,
  ...props
}: BorderBeamProps) => (
  <AntdBorderBeam
    {...props}
    className={cn(borderBeamVariants({ reverse }), className)}
  />
);

BorderBeam.displayName = "BorderBeam";
