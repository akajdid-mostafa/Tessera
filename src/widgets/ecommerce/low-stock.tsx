import { BoxMultiple20Filled, Checkmark16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

const CAPACITY = 120;
const PER_DAY = 3.5;
const FLOOR = 2;
const SALE_EVERY_MS = 5200;
const REORDER_QTY = 120;

/** E-commerce · small. Stock drains as units sell; Reorder springs into a confirmed order. */
export function LowStockWidget({ index }: { index?: number }) {
  const [units, setUnits] = useState(7);
  const [ordered, setOrdered] = useState(false);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => setUnits((u) => Math.max(FLOOR, u - 1)), SALE_EVERY_MS);
    return () => window.clearInterval(t);
  }, []);

  const share = units / CAPACITY;
  const cover = units / PER_DAY;
  const critical = units <= 4;

  return (
    <Widget size="small" index={index} label="Low stock alert">
      <WidgetHeader
        icon={<BoxMultiple20Filled />}
        tint={critical ? "var(--ios-red)" : "var(--ios-orange)"}
        title="Aura ANC · Black"
        subtitle="SKU AUR-200-BK"
      />

      <div className="mt-2 flex items-baseline gap-1">
        <AnimatedNumber
          value={units}
          className={cn(
            "text-[32px] leading-none font-semibold tracking-tight transition-colors duration-500",
            critical ? "text-ios-red" : "text-heading",
          )}
        />
        <span className="text-[12px] font-medium text-tertiary">units left</span>
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={ordered ? "incoming" : "cover"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="mt-0.5 truncate text-[11px] text-tertiary"
        >
          {ordered ? (
            <span className="font-medium text-ios-green">+{REORDER_QTY} arriving Thu</span>
          ) : (
            <>
              <AnimatedNumber
                value={cover}
                format={{ maximumFractionDigits: 1, minimumFractionDigits: 1 }}
                className="font-semibold text-secondary"
              />{" "}
              days of cover
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <Tooltip title={`${units} of ${CAPACITY} · sells ~${PER_DAY}/day`}>
        <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-fill-secondary">
          <AnimatePresence>
            {ordered ? (
              <motion.span
                className="absolute inset-y-0 left-0 rounded-full bg-ios-green/35"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            ) : null}
          </AnimatePresence>
          <motion.span
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-ios-red to-ios-orange"
            initial={{ width: "100%" }}
            animate={{ width: `${Math.max(4, share * 100)}%` }}
            transition={{ type: "spring", stiffness: 60, damping: 16, delay }}
          />
          <motion.span
            className="absolute inset-y-0 w-1.5 rounded-full bg-ios-red"
            style={{ left: `calc(${Math.max(4, share * 100)}% - 6px)` }}
            animate={{ opacity: [1, 0.25, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: delay + 0.8 }}
          />
        </div>
      </Tooltip>

      <motion.div
        className="mt-auto"
        key={ordered ? "done" : "todo"}
        initial={ordered ? { scale: 0.86 } : false}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 520, damping: 14 }}
      >
        <Button
          block
          size="small"
          shape="round"
          type="primary"
          aria-pressed={ordered}
          onClick={() => setOrdered(true)}
          className={cn(
            "font-semibold",
            ordered
              ? "pointer-events-none border-0 bg-ios-green/15 text-ios-green shadow-none"
              : "bg-ios-orange/15 text-ios-orange hover:bg-ios-orange/25",
          )}
          icon={ordered ? <Checkmark16Filled /> : undefined}
        >
          {ordered ? "Ordered" : `Reorder ${REORDER_QTY}`}
        </Button>
      </motion.div>
    </Widget>
  );
}
