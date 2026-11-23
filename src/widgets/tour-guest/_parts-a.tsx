/* Shared bits for the guest-side tour widgets (payment schedule, overdue
 * balances, next trip, day program, slot picker). Amounts are US dollars,
 * the tenants' base currency; the UI copy is English. */

/** Whole dollars with the $ sign: $3,050. */
export const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/** Format for `AnimatedNumber` paired with `prefix="$"`. */
export const USD_FMT = { maximumFractionDigits: 0 } as const;

/** "2026-11-09" → "Nov 9". */
export function shortDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** The demo's today, so day counts stay stable on every render. */
export const TODAY = "2026-11-09";

/** Whole days from `from` to `to` (ISO dates). */
export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T12:00:00`) - Date.parse(`${from}T12:00:00`)) / 86_400_000);
}

/** "14:30" → minutes past midnight, and back. */
export const toMin = (hm: string) => {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
};
export const clock = (m: number) => {
  const v = ((Math.round(m) % 1440) + 1440) % 1440;
  return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
};

/** An opaque fill: a translucent antd fill laid over the widget surface. */
export const solidFill = (token: "fill" | "fill-secondary" | "fill-tertiary" | "fill-quaternary") =>
  `linear-gradient(var(--ant-color-${token}), var(--ant-color-${token})), var(--widget-surface)`;
