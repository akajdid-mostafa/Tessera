import { Broom16Filled, Checkmark16Filled, Sparkle16Filled, Bed16Filled } from "@fluentui/react-icons";
import type { ComponentType } from "react";

/* Shared by the housekeeping flow and the room card. */

/** The PMS's housekeeping states, in the order a room moves through them. */
export type HkStatus = "dirty" | "pickup" | "clean" | "inspected";
export const HK_ORDER: HkStatus[] = ["dirty", "pickup", "clean", "inspected"];

export const HK: Record<
  HkStatus,
  { label: string; color: string; text: string; Glyph: ComponentType<{ className?: string }> }
> = {
  dirty: { label: "Dirty", color: "var(--ios-orange)", text: "text-ios-orange", Glyph: Broom16Filled },
  pickup: { label: "Pickup", color: "var(--ios-yellow)", text: "text-ios-yellow", Glyph: Bed16Filled },
  clean: { label: "Clean", color: "var(--ios-blue)", text: "text-ios-blue", Glyph: Sparkle16Filled },
  inspected: { label: "Inspected", color: "var(--ios-green)", text: "text-ios-green", Glyph: Checkmark16Filled },
};

/** A tinted fill for a status color, readable under colored text in both themes. */
export const tint = (color: string, pct = 18) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

/** The housekeeping team on shift at Seabright Villas. */
export const ATTENDANTS = ["Ashley King", "Mike Daniels", "Rosa Martinez", "Ellen Shaw"] as const;
