import { GasPump20Filled, Gauge20Filled, VehicleCar20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const FUEL = 0.68;
const SEGMENTS = 5;
const TWO = { minimumIntegerDigits: 2 } as const;

/** Car rental · small. A live return countdown; tap swaps fuel for mileage. */
export function RentalReturnWidget({ index }: { index?: number }) {
  const [left, setLeft] = useState(2 * 3600 + 14 * 60 + 33);
  const [view, setView] = useState<"fuel" | "km">("fuel");

  useEffect(() => {
    const t = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, []);

  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;

  return (
    <Widget
      size="small"
      index={index}
      label="Rental return"
      pressable
      onPress={() => setView((v) => (v === "fuel" ? "km" : "fuel"))}
    >
      <WidgetHeader icon={<VehicleCar20Filled />} tint="var(--ios-blue)" title="Corolla Hybrid" subtitle="8KXM421" />

      <div className="mt-3 truncate text-[11px] text-tertiary">Return by 18:30 · LAX</div>
      <div className="mt-0.5 flex items-baseline text-[24px] leading-none font-semibold tracking-tight text-heading">
        <AnimatedNumber value={h} format={TWO} />
        <span className="px-px text-tertiary">:</span>
        <AnimatedNumber value={m} format={TWO} />
        <span className="px-px text-tertiary">:</span>
        <AnimatedNumber value={s} format={TWO} trend={-1} className="text-ios-blue" />
      </div>
      <div className="relative mt-auto h-[34px]">
        <AnimatePresence mode="popLayout" initial={false}>
          {view === "fuel" ? (
            <motion.div
              key="fuel"
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              className="absolute inset-0 flex flex-col justify-end gap-1.5"
            >
              <div className="flex items-center gap-1 text-[11px] text-secondary">
                <GasPump20Filled className="text-ios-orange" fontSize={13} />
                Fuel <span className="ml-auto font-semibold text-heading tabular">68%</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: SEGMENTS }, (_, i) => {
                  const fill = Math.min(1, Math.max(0, FUEL * SEGMENTS - i));
                  return (
                    <span key={i} className="relative h-3 flex-1 overflow-hidden rounded-[4px] bg-fill-secondary">
                      <motion.span
                        className={cn("absolute inset-y-0 left-0 rounded-[4px] bg-ios-orange", fill < 1 && fill > 0 && "animate-fade-pulse")}
                        initial={{ width: 0 }}
                        animate={{ width: `${fill * 100}%` }}
                        transition={{ delay: 0.4 + i * 0.08, type: "spring", stiffness: 160, damping: 20 }}
                      />
                    </span>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="km"
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              className="absolute inset-0 flex flex-col justify-end gap-1.5"
            >
              <div className="flex items-center gap-1 text-[11px] text-secondary">
                <Gauge20Filled className="text-ios-teal" fontSize={13} />
                Mileage
                <span className="ml-auto font-semibold text-heading tabular">
                  <AnimatedNumber value={412} /> km
                </span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-[4px] bg-fill-secondary">
                <motion.span
                  className="absolute inset-y-0 left-0 rounded-[4px] bg-ios-teal"
                  initial={{ width: 0 }}
                  animate={{ width: "41.2%" }}
                  transition={{ type: "spring", stiffness: 140, damping: 20 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
