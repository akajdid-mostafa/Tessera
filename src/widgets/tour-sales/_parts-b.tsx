import type { Format } from "@number-flow/react";

/* Shared bits of the second tour-sales shelf (discount approval, channel mix,
 * best seller, offers pulse, B2B balance). Money is the workspace's base
 * currency, US dollars, drawn with the $ sign. */

/** Whole dollars, rolling digits. */
export const USD: Format = {
  style: "currency",
  currency: "USD",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
};

/** Whole dollars, compact ("$1.2M"), for tight legends. */
export const USD_COMPACT: Format = {
  style: "currency",
  currency: "USD",
  currencyDisplay: "narrowSymbol",
  notation: "compact",
  maximumFractionDigits: 1,
};

const usdText = new Intl.NumberFormat("en-US", USD as Intl.NumberFormatOptions);

/** A static dollar amount ("$4,860", "-$70"). */
export const money = (n: number) => usdText.format(n);

/** The stagger every widget's entrance uses. */
export const entranceDelay = (index?: number) => 0.3 + (index ?? 0) * 0.06;
