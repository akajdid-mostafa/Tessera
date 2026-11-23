import { VehicleBus20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { DEPARTURES, minutesOf, Ring, TWO } from "./_parts-a";

/* The board at 08:14:20: Montezuma has left, the next three are paged. */
const START = 8 * 3600 + 14 * 60 + 20;
const NEXT = DEPARTURES.filter((d) => minutesOf(d.time) * 60 > START).slice(0, 3);

/** Tour ops · small. Today's next departure: its time turns into a live countdown, the guide sits in a sold/capacity ring; tap to page the next three. */
export function NextDepartureWidget({ index }: { index?: number }) {
  const [page, setPage] = useState(0);
  const [now, setNow] = useState(START);
  const [counting, setCounting] = useState(false);
  const [paged, setPaged] = useState(false);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const tick = window.setInterval(() => setNow((n) => n + 1), 1000);
    const morph = window.setTimeout(() => setCounting(true), (delay + 1.4) * 1000);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(morph);
    };
  }, [delay]);

  const d = NEXT[page];
  const left = Math.max(0, minutesOf(d.time) * 60 - now);
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  const over = d.sold > d.capacity;
  const tint = over ? "var(--ios-red)" : "var(--ios-indigo)";

  return (
    <Widget
      size="small"
      index={index}
      label="Next departure"
      pressable
      onPress={() => {
        setPaged(true);
        setPage((p) => (p + 1) % NEXT.length);
      }}
    >
      <WidgetHeader
        icon={<VehicleBus20Filled />}
        tint="var(--ios-indigo)"
        title="Next Departure"
        subtitle={`From ${d.from}`}
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={d.id}
          initial={{ opacity: 0, x: 14, filter: "blur(3px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, x: -14, filter: "blur(3px)", transition: { duration: 0.15 } }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="mt-2 leading-tight"
        >
          <div className="truncate text-[13px] font-semibold text-heading">{d.title}</div>
          <div className="truncate text-[11px] text-tertiary">
            {d.guide} · Guide
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-auto flex items-end justify-between gap-1">
        <div className="min-w-0 leading-none whitespace-nowrap">
          <div className="relative h-[30px]">
            <AnimatePresence mode="popLayout" initial={false}>
              {counting ? (
                <motion.div
                  key="count"
                  initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 26 }}
                  className={cn(
                    "flex items-baseline font-semibold tracking-tight",
                    h > 0 || left === 0 ? "text-[21px]" : "text-[26px]",
                    left === 0 ? "text-ios-green" : "text-heading",
                  )}
                >
                  {left === 0 ? (
                    "Boarding"
                  ) : (
                    <>
                      {h > 0 ? (
                        <>
                          <AnimatedNumber value={h} />:
                        </>
                      ) : null}
                      <AnimatedNumber value={m} format={h > 0 ? TWO : undefined} trend={-1} />:
                      <AnimatedNumber value={s} format={TWO} trend={-1} />
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="time"
                  exit={{ opacity: 0, y: -8, filter: "blur(4px)", transition: { duration: 0.2 } }}
                  className="text-[26px] font-semibold tracking-tight text-heading tabular"
                >
                  {d.time}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="mt-1 text-[11px] font-medium text-ios-indigo">{counting ? `Departs ${d.time}` : "Today"}</div>
          <div className="mt-1 text-[11px] text-tertiary">
            <AnimatedNumber value={d.sold} className={cn("font-semibold", over ? "text-ios-red" : "text-secondary")} />/
            {d.capacity} seats
          </div>
        </div>

        <Ring
          size={58}
          stroke={3}
          delay={paged ? 0 : delay}
          parts={[{ value: d.sold / d.capacity, color: tint }]}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={d.guide}
              className="grid"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
            >
              {/* 48px leaves ~2px between the face and the 3px ring (58px box). */}
              <MemojiAvatar who={d.guide} size={48} />
            </motion.span>
          </AnimatePresence>
        </Ring>
      </div>

      <div className="mt-1.5 flex justify-center gap-1">
        {NEXT.map((x, i) => (
          <span
            key={x.id}
            className={cn("h-1 rounded-full transition-all duration-300", i === page ? "w-3 bg-ios-indigo" : "w-1 bg-fill-secondary")}
          />
        ))}
      </div>
    </Widget>
  );
}
