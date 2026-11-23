import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/registry/antuikit/lib/utils";

/* Shared bits for the front desk shelf: the property, the business day, money in usd,
 * a safe interval hook, a room chip and a bottom sheet that rises over the widget. */

export const PROPERTY = "Seabright Villas";
export const BUSINESS_DAY = "Wed, Oct 14";

/** Dollars for rolling digits. */
export const USD = {
  style: "currency",
  currency: "USD",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
} as const;

/** Dollars as plain text. */
export const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/** Minutes since midnight as HH:mm. */
export const clock = (mins: number) =>
  `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(Math.floor(mins) % 60).padStart(2, "0")}`;

/** setInterval that always calls the latest callback and is cleared on unmount; `null` pauses it. */
export function useInterval(fn: () => void, ms: number | null) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  useEffect(() => {
    if (ms === null) return;
    const id = window.setInterval(() => ref.current(), ms);
    return () => window.clearInterval(id);
  }, [ms]);
}

/** One-shot timeouts that are all cleared when the widget unmounts. */
export function useTimeouts() {
  const ids = useRef(new Set<number>());
  useEffect(() => {
    const set = ids.current;
    return () => {
      set.forEach((id) => window.clearTimeout(id));
      set.clear();
    };
  }, []);
  return (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      ids.current.delete(id);
      fn();
    }, ms);
    ids.current.add(id);
  };
}

/** A room number in a small rounded chip. */
export function RoomChip({ room, className }: { room: string; className?: string }) {
  return (
    <span
      className={cn(
        "grid h-[20px] min-w-[28px] shrink-0 place-items-center rounded-[6px] bg-fill-secondary px-1 text-[11px] leading-none font-semibold text-secondary tabular",
        className,
      )}
    >
      {room}
    </span>
  );
}

/** A sheet that rises from the widget's bottom edge over a dimmed face. Tapping the dim closes it. */
export function Sheet({
  open,
  onClose,
  label,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="sheet"
          className="absolute inset-0 z-30 flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.18, delay: 0.05 } }}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-widget-surface/70 backdrop-blur-[3px]"
          />
          <motion.div
            role="dialog"
            aria-label={label}
            className={cn(
              "relative m-2 rounded-[18px] bg-widget-surface p-2.5 shadow-[0_-6px_24px_rgba(0,0,0,0.22)] ring-1 ring-split ring-inset",
              className,
            )}
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            exit={{ y: "110%" }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
