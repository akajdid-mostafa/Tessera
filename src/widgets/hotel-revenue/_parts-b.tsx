/* Shared bits for the revenue shelf's rate, channel and parity widgets (Seabright Villas, USD). */

/** Turkish usd, whole amounts, the $ sign: "$8,430". */
export const USD = {
  style: "currency",
  currency: "USD",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
} as const;

export const usd = (n: number) => n.toLocaleString("en-US", USD);

export const PROPERTY = "Seabright Villas";

/** Standard Double (302): the room type the rate widgets read. */
export const ROOM_TYPE = "Standard Double";

export type LevelId = 1 | 2 | 3;

/** The property's rate levels, with the master plan's (Best Available Rate, 3021) price on each. */
export const LEVELS: { id: LevelId; name: string; color: string; bar: number }[] = [
  { id: 2, name: "High Season", color: "#16a34a", bar: 375 },
  { id: 3, name: "Low season", color: "#dc2626", bar: 210 },
  { id: 1, name: "Weekend + Friday", color: "#7c3aed", bar: 300 },
];

export const levelOf = (id: LevelId) => LEVELS.find((l) => l.id === id)!;

/** "just now", "42s ago", "3 min ago", "2 h ago". */
export function ago(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  return `${Math.floor(m / 60)} h ago`;
}

/** A dog-eared corner: the page folds down in orange, the cut shows the widget surface. */
export const FOLD_BG = "linear-gradient(225deg, var(--widget-surface) 50%, var(--ios-orange) 50%)";
