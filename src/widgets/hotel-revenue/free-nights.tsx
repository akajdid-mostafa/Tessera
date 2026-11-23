import { Bed20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { ROOM_TYPE, USD } from "./_parts-b";

/** Standard Double, the next 7 nights from the business date (Wed, Oct 14): free rooms and the night's best rate. */
const NIGHTS = [
  { day: "Wed", date: "Oct 14", free: 3, best: 270 },
  { day: "Thu", date: "Oct 15", free: 5, best: 270 },
  { day: "Fri", date: "Oct 16", free: 2, best: 315 },
  { day: "Sat", date: "Oct 17", free: 1, best: 330 },
  { day: "Sun", date: "Oct 18", free: 9, best: 270 },
  { day: "Mon", date: "Oct 19", free: 7, best: 240 },
  { day: "Tue", date: "Oct 20", free: 5, best: 240 },
];
const TOTAL_VALUE = NIGHTS.reduce((s, n) => s + n.free * n.best, 0); // $8,430
const TOTAL_NIGHTS = NIGHTS.reduce((s, n) => s + n.free, 0);
const PEAK = NIGHTS.reduce((best, n, i) => (n.free > NIGHTS[best].free ? i : best), 0);
const MAX_FREE = NIGHTS[PEAK].free;
const ROOMS = 17;

/** Revenue · small. Free room nights over the next week, valued at the best rate; tap to jump to the emptiest night. */
export function FreeNightsWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [page, setPage] = useState(0);
  const [shown, setShown] = useState(0);

  // The total counts up once the widget has landed.
  useEffect(() => {
    const t = window.setTimeout(() => setShown(TOTAL_VALUE), delay * 1000 + 150);
    return () => window.clearTimeout(t);
  }, [delay]);

  const peak = NIGHTS[PEAK];
  const value = page === 0 ? shown : peak.free * peak.best;

  return (
    <Widget
      size="small"
      index={index}
      label="Free nights"
      pressable
      onPress={() => setPage((p) => (p + 1) % 2)}
    >
      <WidgetHeader
        icon={<Bed20Filled />}
        tint="var(--ios-teal)"
        title="Free Nights"
        subtitle={ROOM_TYPE}
      />

      <AnimatedNumber
        value={value}
        format={USD}
        className="mt-2 text-[24px] leading-none font-semibold tracking-tight text-heading"
      />
      <div className="relative mt-0.5 h-[15px] overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={page}
            className="truncate text-[11px] leading-[15px] whitespace-nowrap text-tertiary"
            initial={{ opacity: 0, y: 8, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(3px)" }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
          >
            {page === 0 ? (
              <>
                <span className="font-semibold text-ios-teal">open to book</span> · {TOTAL_NIGHTS} room nights
              </>
            ) : (
              <>
                <span className="font-semibold text-ios-teal">
                  {peak.day}, {peak.date}
                </span>{" "}
                · {peak.free} of {ROOMS} free
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-auto flex h-[40px] items-end gap-[5px]">
        {NIGHTS.map((n, i) => {
          const focus = page === 1 && i === PEAK;
          const dim = page === 1 && i !== PEAK;
          return (
            <div key={n.date} className="relative flex h-full flex-1 items-end">
              <motion.span
                className={cn("w-full origin-bottom rounded-[4px]", focus ? "bg-ios-teal" : "bg-ios-teal/70")}
                style={{ height: `${Math.max(10, (n.free / MAX_FREE) * 100)}%` }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1, opacity: dim ? 0.3 : 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: page === 0 ? delay + i * 0.05 : 0 }}
              />
              <AnimatePresence>
                {focus ? (
                  <motion.span
                    className="absolute -top-[15px] left-1/2 -translate-x-1/2 text-[10px] leading-none font-semibold text-ios-teal tabular"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                  >
                    {n.free}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-[5px]">
        {NIGHTS.map((n, i) => (
          <span
            key={n.date}
            className={cn(
              "flex-1 text-center text-[9px] leading-none",
              page === 1 && i === PEAK ? "font-semibold text-heading" : "text-tertiary",
            )}
          >
            {n.day[0]}
          </span>
        ))}
      </div>
      <div className="mt-1.5 flex justify-center gap-1">
        {[0, 1].map((i) => (
          <motion.span
            key={i}
            layout
            className={cn("h-1.5 rounded-full", i === page ? "w-3.5 bg-ios-teal" : "w-1.5 bg-fill")}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        ))}
      </div>
    </Widget>
  );
}
