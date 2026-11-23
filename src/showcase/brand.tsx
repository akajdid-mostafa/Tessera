/** The product's name, mark and store link, in one place. */
export const PRODUCT = "Tessera";
export const VERSION = "v1.0";
export const STORE_URL = "https://ui8.net/users/antuikit";

/**
 * True in the public demo build (`VITE_DEMO=1 vite build`). The demo keeps
 * each widget's source out of the bundle and locks the Source tab; the kit you
 * bought runs with it off, so the tab shows the real file.
 */
export const DEMO = import.meta.env.VITE_DEMO === "1";

/** The brand orange (the Open House widget's surface), with its wide-gamut value where supported. */
export const BRAND = "#fa5d19";
const BRAND_P3 = "color(display-p3 0.980392 0.364706 0.098039)";

/**
 * The Tessera mark: two widget tiles that read as a "T". The stem follows the
 * text color, so it works on light and dark; the top tile is the brand orange.
 */
export function Logo({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <rect width="24" height="10" rx="5" fill={BRAND} style={{ fill: BRAND_P3 }} />
      <rect x="7.5" y="8" width="9" height="16" rx="4.5" fill="currentColor" />
    </svg>
  );
}
