import { Cart24Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { STORE_URL } from "./brand";

/**
 * The floating buy button: a round cart in the corner that opens the store.
 * Its blue is the Live Sales widget's surface. Sits under the inspector drawer
 * (z-50), so an open drawer covers it rather than fighting it for the corner.
 */
export function BuyButton() {
  return (
    <motion.a
      href={STORE_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Buy on UI8"
      title="Buy on UI8"
      className="fixed right-5 bottom-5 z-40 grid size-[52px] place-items-center rounded-full bg-[oklch(0.5_0.3_264.43)] text-white shadow-[0_8px_24px_-6px_oklch(0.5_0.3_264.43/0.7),0_2px_6px_rgb(0_0_0/0.25)] ring-1 ring-inset ring-white/15"
      initial={{ opacity: 0, scale: 0.6, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
    >
      <Cart24Filled />
    </motion.a>
  );
}
