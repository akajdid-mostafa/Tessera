import type { Format } from "@number-flow/react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/registry/antuikit/lib/utils";

/* Shared by the inventory and restriction widgets of this shelf: Seabright Villas's room types,
   channels, the business date and the corner-mark chips the rate grid draws. */

export const PROPERTY = "Seabright Villas";

/** The property's business date: Wed, Oct 14, 2026 (America/New_York). */
export const BUSINESS_DATE = new Date(2026, 9, 14);

export const ROOM_TYPES = [
  { id: 301, name: "Single Room", rooms: 6 },
  { id: 302, name: "Standard Double", rooms: 17 },
  { id: 303, name: "Standard Twin", rooms: 14 },
  { id: 304, name: "Superior Double", rooms: 12 },
  { id: 305, name: "Deluxe Garden View", rooms: 10 },
  { id: 306, name: "Deluxe Sea View", rooms: 10 },
  { id: 307, name: "Family Room", rooms: 9 },
  { id: 308, name: "Junior Suite", rooms: 8 },
  { id: 309, name: "Suite", rooms: 7 },
  { id: 310, name: "Villa", rooms: 7 },
] as const;

export const TOTAL_ROOMS = ROOM_TYPES.reduce((s, t) => s + t.rooms, 0);

export type Field = "price" | "availability" | "min_stay" | "max_stay" | "cta" | "ctd" | "stop_sell" | "cut_off";

/** Connected channels and the fields each one takes (its capabilities). */
export const CHANNELS: { id: number; name: string; short: string; takes: Field[] }[] = [
  { id: 1, name: "Online", short: "On", takes: ["price", "availability", "min_stay", "max_stay", "cta", "ctd", "stop_sell", "cut_off"] },
  { id: 6, name: "Booking.com", short: "B.", takes: ["price", "availability", "min_stay", "max_stay", "cta", "ctd", "stop_sell"] },
  { id: 2, name: "Expedia", short: "Ex", takes: ["price", "availability", "min_stay", "max_stay", "stop_sell"] },
  { id: 3, name: "Agoda", short: "Ag", takes: ["price", "availability", "min_stay", "max_stay", "cta", "ctd", "stop_sell", "cut_off"] },
  { id: 4, name: "iCal", short: "iC", takes: ["stop_sell"] },
];

/** The days from the business date on. */
export function nightsFrom(count: number, offset = 0) {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(BUSINESS_DATE.getFullYear(), BUSINESS_DATE.getMonth(), BUSINESS_DATE.getDate() + offset + i);
    const dow = date.getDay();
    return {
      date,
      day: date.getDate(),
      weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
      letter: date.toLocaleDateString("en-US", { weekday: "narrow" }),
      long: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      weekend: dow === 5 || dow === 6,
      today: offset + i === 0,
    };
  });
}

export type Night = ReturnType<typeof nightsFrom>[number];

export const USD: Format = {
  style: "currency",
  currency: "USD",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
};

export const usd0 = (n: number) => new Intl.NumberFormat("en-US", USD as Intl.NumberFormatOptions).format(n);

/** A seeded generator, so every live sequence plays the same story on each load. */
export function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── Occupancy steps: calm blues while there is room, then orange, volcano, red at full or overbooked. ── */

const VOLCANO = "color-mix(in srgb, var(--ios-orange) 40%, var(--ios-red))";

export type OccStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Sold of available, not clamped: over 1 is overbooked; sold with nothing open is overbooked too. */
export const occupancyRatio = (sold: number, availability: number) =>
  availability > 0 ? sold / availability : sold > 0 ? Infinity : 0;

export function occStep(sold: number, availability: number): OccStep {
  const r = occupancyRatio(sold, availability);
  if (r > 1) return 6;
  if (r === 1) return 5;
  if (r >= 0.9) return 4;
  if (r >= 0.75) return 3;
  if (r >= 0.5) return 2;
  if (r >= 0.25) return 1;
  return 0;
}

export const OCC_LABEL = ["Quiet", "Filling", "Half full", "Busy", "Nearly full", "Full", "Overbooked"] as const;

export function occTint(step: OccStep): { className: string; style?: CSSProperties } {
  switch (step) {
    case 0:
      return { className: "bg-fill-tertiary text-secondary" };
    case 1:
      return { className: "bg-ios-blue/15 text-heading" };
    case 2:
      return { className: "bg-ios-blue/30 text-heading" };
    case 3:
      return { className: "bg-ios-orange/35 text-heading" };
    case 4:
      return { className: "text-heading", style: { backgroundColor: `color-mix(in srgb, ${VOLCANO} 50%, transparent)` } };
    case 5:
      return { className: "bg-ios-red/55 text-heading" };
    default:
      return { className: "bg-ios-red text-white font-bold" };
  }
}

/** A solid swatch for the step, for legends and bars. */
export function occSwatch(step: OccStep): CSSProperties {
  const fills = [
    "var(--ant-color-fill-secondary)",
    "color-mix(in srgb, var(--ios-blue) 30%, transparent)",
    "color-mix(in srgb, var(--ios-blue) 60%, transparent)",
    "var(--ios-orange)",
    VOLCANO,
    "color-mix(in srgb, var(--ios-red) 75%, transparent)",
    "var(--ios-red)",
  ];
  return { background: fills[step] };
}

/* ── Restriction marks, as the rate grid writes them in a cell's corners. ── */

export type MarkKind = "min_stay" | "cta" | "ctd" | "stop_sell";

export const MARK: Record<MarkKind, { label: string; long: string; on: string }> = {
  min_stay: { label: "☾", long: "Min stay", on: "bg-ios-indigo/15 text-ios-indigo" },
  cta: { label: "CTA", long: "Closed to arrival", on: "bg-ios-orange/15 text-ios-orange" },
  ctd: { label: "CTD", long: "Closed to departure", on: "bg-ios-orange/15 text-ios-orange" },
  stop_sell: { label: "Stop", long: "Stop sell", on: "bg-ios-red/15 text-ios-red" },
};

/** A restriction chip: the min stay reads ☾n, the rest their short code. */
export function MarkChip({
  kind,
  value,
  className,
  children,
}: {
  kind: MarkKind;
  value?: number;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-4 items-center gap-0.5 rounded-[5px] px-1 text-[10px] leading-none font-semibold whitespace-nowrap tabular",
        MARK[kind].on,
        className,
      )}
    >
      {kind === "min_stay" ? `☾${value ?? 2}` : MARK[kind].label}
      {children}
    </span>
  );
}
