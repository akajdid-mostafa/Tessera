import {
  ArrowDown12Filled,
  ArrowUp12Filled,
  Building16Regular,
  Code16Regular,
  Globe16Regular,
  ShoppingBag16Regular,
} from "@fluentui/react-icons";
import type { ReactNode } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { cn } from "@/registry/antuikit/lib/utils";

/* Shared bits for the tour-sales widgets built from Kaibab Yonder Tours'
 * booking seed (tenant KY, base currency USD). */

/** The products the seed sells, by their English names. */
export const PRODUCT = {
  sedona: "Sedona–Oak Creek day tour",
  montezuma: "Montezuma Castle tour",
  package3: "Red Rock 3-day package",
  lodge: "Red Rock Lodge",
  rafting: "Verde River rafting",
  drone: "Highland photo & drone",
  cooking: "Local cooking workshop",
} as const;

/** Whole dollars with the $ sign, e.g. $1,238. */
export const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/** Compact dollars for rolling digits: pass with `prefix="$"`. */
export const COMPACT = { notation: "compact", maximumFractionDigits: 1 } as const;

export type Channel = "website" | "widget" | "b2b" | "marketplace";

export const CHANNEL: Record<Channel, { label: string; icon: ReactNode; tone: string }> = {
  website: { label: "Website", icon: <Globe16Regular className="size-3" />, tone: "bg-ios-blue/12 text-ios-blue" },
  widget: { label: "Widget", icon: <Code16Regular className="size-3" />, tone: "bg-ios-purple/12 text-ios-purple" },
  b2b: { label: "B2B", icon: <Building16Regular className="size-3" />, tone: "bg-ios-teal/12 text-ios-teal" },
  marketplace: {
    label: "Marketplace",
    icon: <ShoppingBag16Regular className="size-3" />,
    tone: "bg-ios-pink/12 text-ios-pink",
  },
};

/**
 * The dashboard's change chip, aware of the stat's polarity: a rise is good
 * for bookings (`up`), bad for overdue receivables (`down`). Zero is neutral.
 */
export function DeltaChip({
  delta,
  polarity = "up",
  percent = false,
  className,
}: {
  delta: number;
  polarity?: "up" | "down";
  percent?: boolean;
  className?: string;
}) {
  const good = polarity === "up" ? delta > 0 : delta < 0;
  const flat = delta === 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] leading-none font-semibold tabular transition-colors duration-300",
        flat ? "bg-fill-secondary text-secondary" : good ? "bg-ios-green/15 text-ios-green" : "bg-ios-red/15 text-ios-red",
        className,
      )}
    >
      {flat ? null : delta > 0 ? <ArrowUp12Filled className="size-2.5" /> : <ArrowDown12Filled className="size-2.5" />}
      <AnimatedNumber
        value={Math.abs(delta)}
        format={percent ? { style: "percent", maximumFractionDigits: 1 } : undefined}
      />
    </span>
  );
}
