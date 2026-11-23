/* Shared bits for the occupancy and rate widgets in this shelf: the occupancy color preset and the room types. */

/** Seabright Villas's room types, in their position order, with a short name for tight rows. */
export const ROOM_TYPES = [
  { id: 301, name: "Single Room", short: "Single", rooms: 6 },
  { id: 302, name: "Standard Double", short: "Std Double", rooms: 17 },
  { id: 303, name: "Standard Twin", short: "Std Twin", rooms: 14 },
  { id: 304, name: "Superior Double", short: "Sup Double", rooms: 12 },
  { id: 305, name: "Deluxe Garden View", short: "Garden View", rooms: 10 },
  { id: 306, name: "Deluxe Sea View", short: "Sea View", rooms: 10 },
  { id: 307, name: "Family Room", short: "Family", rooms: 9 },
  { id: 308, name: "Junior Suite", short: "Jr Suite", rooms: 8 },
  { id: 309, name: "Suite", short: "Suite", rooms: 7 },
  { id: 310, name: "Villa", short: "Villa", rooms: 7 },
] as const;

export type OccupancyPreset = "blue" | "orange" | "volcano" | "red";

/**
 * The color of a share of nights sold, "full is busy": blue up to half, orange up to 80%, volcano above,
 * red once every night is sold (or overbooked).
 */
export const occupancyPreset = (percent: number): OccupancyPreset =>
  percent >= 100 ? "red" : percent > 80 ? "volcano" : percent > 50 ? "orange" : "blue";

/** Fill for rails, rings and dots, and a text class that stays readable in light mode. */
export const PRESET: Record<OccupancyPreset, { fill: string; text: string; label: string }> = {
  blue: { fill: "var(--ios-blue)", text: "text-ios-blue", label: "Up to 50%" },
  orange: { fill: "var(--ios-orange)", text: "text-ios-orange", label: "Up to 80%" },
  volcano: { fill: "var(--ant-volcano-6)", text: "text-volcano-7 dark:text-volcano-5", label: "Over 80%" },
  red: { fill: "var(--ios-red)", text: "text-ios-red", label: "Full" },
};

export const pct = (sold: number, availability: number) =>
  availability > 0 ? Math.round((sold / availability) * 100) : 0;

/** Turkish usd, whole numbers, as the rate grid shows them. */
export const USD = { style: "currency", currency: "USD", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 } as const;
