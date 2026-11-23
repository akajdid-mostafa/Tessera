import { Code16Regular } from "@fluentui/react-icons";
import { createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";

/** Set by the showcase around each widget; the shell shows an inspect badge while hovered. */
export const InspectContext = createContext<(() => void) | null>(null);

export function InspectBadge({ visible }: { visible: boolean }) {
  const onInspect = useContext(InspectContext);
  if (!onInspect) return null;
  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          type="button"
          aria-label="Inspect widget"
          onClick={(e) => {
            e.stopPropagation();
            onInspect();
          }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.4 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 520, damping: 26 }}
          className="absolute -right-2 -top-2 z-30 grid size-7 cursor-pointer place-items-center rounded-full bg-[var(--chip-bg)] text-[var(--chip-fg)] shadow-[0_4px_12px_rgb(0_0_0/0.25)]"
        >
          <Code16Regular />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
