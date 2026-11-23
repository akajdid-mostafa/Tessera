import { ArrowCounterclockwise12Regular, PeopleTeam20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type PointerEvent, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { type Departure, DEPARTURES } from "./_parts-a";

/** The track's scale in seats; capacity can be dragged between MIN and SCALE. */
const SCALE = 20;
const MIN = 4;
const pct = (n: number) => `${(Math.min(n, SCALE) / SCALE) * 100}%`;
const SPRING = { type: "spring", stiffness: 260, damping: 26 } as const;

function CapacityRow({
  d,
  capacity,
  onCapacity,
  enter,
}: {
  d: Departure;
  capacity: number;
  onCapacity: (n: number) => void;
  enter: number;
}) {
  const [dragging, setDragging] = useState(false);
  const [touched, setTouched] = useState(false);
  const delay = touched ? 0 : enter;
  const setCapacity = (n: number) => {
    setTouched(true);
    onCapacity(n);
  };
  const custom = capacity !== d.defaultCapacity;
  const over = d.sold > capacity;
  const fromX = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const n = Math.round(((e.clientX - r.left) / r.width) * SCALE);
    setCapacity(Math.max(MIN, Math.min(SCALE, n)));
  };

  return (
    <div className="flex h-[27px] items-center gap-2">
      <div className="w-[118px] shrink-0 leading-[1.15]">
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-semibold text-heading tabular">{d.time}</span>
          <AnimatePresence initial={false}>
            {custom ? (
              <motion.span
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: "spring", stiffness: 500, damping: 26 }}
                className="rounded-full bg-ios-purple/15 px-1.5 text-[9px] leading-[13px] font-semibold text-ios-purple"
              >
                Private
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
        <div className="truncate text-[10.5px] text-tertiary">{d.title}</div>
      </div>

      {/* Track: grey box = capacity, fill = sold, red = sold past capacity. */}
        <div
          title={`Drag to set capacity · default ${d.defaultCapacity}`}
          role="slider"
          aria-label={`${d.title} capacity`}
          aria-valuemin={MIN}
          aria-valuemax={SCALE}
          aria-valuenow={capacity}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") setCapacity(Math.min(SCALE, capacity + 1));
            if (e.key === "ArrowLeft") setCapacity(Math.max(MIN, capacity - 1));
          }}
          onPointerDown={(e) => {
            try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
            setDragging(true);
            fromX(e);
          }}
          onPointerMove={(e) => dragging && fromX(e)}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          className="relative h-[14px] min-w-0 flex-1 cursor-ew-resize touch-none outline-none"
        >
          <div className="absolute inset-x-0 top-1/2 h-[6px] -translate-y-1/2 rounded-full bg-fill-quaternary" />
          <motion.div
            className="absolute top-1/2 left-0 h-[10px] -translate-y-1/2 rounded-[4px] bg-fill-secondary"
            initial={{ width: 0 }}
            animate={{ width: pct(capacity) }}
            transition={dragging ? { duration: 0 } : { ...SPRING, delay }}
          />
          <motion.div
            className="absolute top-1/2 left-0 h-[10px] -translate-y-1/2 rounded-[4px] bg-ios-indigo"
            initial={{ width: 0 }}
            animate={{ width: pct(Math.min(d.sold, capacity)) }}
            transition={dragging ? { duration: 0 } : { ...SPRING, delay: delay + 0.1 }}
          />
          <motion.div
            className="absolute top-1/2 h-[10px] -translate-y-1/2 rounded-r-[4px] bg-ios-red"
            initial={{ width: 0, left: pct(capacity) }}
            animate={{ left: pct(capacity), width: over ? `${((d.sold - capacity) / SCALE) * 100}%` : 0 }}
            transition={dragging ? { duration: 0 } : { ...SPRING, delay: delay + 0.2 }}
          />
          {over ? (
            <motion.div
              aria-hidden
              className="absolute top-1/2 h-[10px] -translate-y-1/2 rounded-r-[4px] bg-ios-red"
              style={{ left: pct(capacity), width: `${((d.sold - capacity) / SCALE) * 100}%` }}
              animate={{ opacity: [0, 0.6, 0], scaleY: [1, 1.8, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: delay + 0.6 }}
            />
          ) : null}
          {/* default-capacity ghost tick while overridden */}
          {custom ? (
            <span
              aria-hidden
              className="absolute top-0 bottom-0 w-px border-l border-dashed border-[var(--ant-color-text-tertiary)]"
              style={{ left: pct(d.defaultCapacity) }}
            />
          ) : null}
          {/* the bar's end: grab it */}
          <motion.span
            aria-hidden
            className="absolute top-1/2 h-[14px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-heading shadow-sm ring-2 ring-[var(--widget-surface)]"
            initial={{ left: "0%", opacity: 0 }}
            animate={{ left: pct(capacity), opacity: 1, scaleY: dragging ? 1.25 : 1 }}
            transition={dragging ? { duration: 0 } : { ...SPRING, delay }}
          />
        </div>

      <div className="flex w-[66px] shrink-0 items-center justify-end gap-1">
        <AnimatePresence initial={false}>
          {custom ? (
            <motion.button
              type="button"
              aria-label={`Reset ${d.title} to ${d.defaultCapacity}`}
              onClick={() => setCapacity(d.defaultCapacity)}
              initial={{ opacity: 0, scale: 0.5, rotate: 90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: -90 }}
              whileTap={{ scale: 0.85, rotate: -120 }}
              transition={{ type: "spring", stiffness: 480, damping: 24 }}
              className="grid size-[18px] cursor-pointer place-items-center rounded-full bg-fill-tertiary text-secondary hover:bg-fill-secondary"
            >
              <ArrowCounterclockwise12Regular />
            </motion.button>
          ) : null}
        </AnimatePresence>
        <span className={cn("text-[12px] font-semibold whitespace-nowrap", over ? "text-ios-red" : "text-heading")}>
          <AnimatedNumber value={d.sold} />
          <span className="font-medium text-tertiary">/</span>
          <AnimatedNumber value={capacity} className={over ? undefined : "text-secondary"} />
        </span>
      </div>
    </div>
  );
}

/** Tour ops · medium. Today's departures as sold-vs-capacity bars with Private and overbooked states; drag a bar's end to override capacity, reset springs it back. */
export function DepartureCapacityWidget({ index }: { index?: number }) {
  const [caps, setCaps] = useState<Record<string, number>>(() =>
    Object.fromEntries(DEPARTURES.map((d) => [d.id, d.capacity])),
  );
  const delay = 0.3 + (index ?? 0) * 0.06;
  const sold = DEPARTURES.reduce((a, d) => a + d.sold, 0);
  const seats = DEPARTURES.reduce((a, d) => a + caps[d.id], 0);
  const overbooked = DEPARTURES.filter((d) => d.sold > caps[d.id]).length;

  return (
    <Widget size="medium" index={index} label="Departure capacity">
      <WidgetHeader
        icon={<PeopleTeam20Filled />}
        tint="var(--ios-indigo)"
        title="Departure Capacity"
        subtitle={
          overbooked ? (
            <span className="text-ios-red">
              <AnimatedNumber value={overbooked} /> overbooked · today
            </span>
          ) : (
            "All departures within capacity"
          )
        }
        extra={
          <div className="text-right leading-tight">
            <div className="text-[10px] text-tertiary">Sold / seats</div>
            <div className="text-[15px] font-semibold text-heading">
              <AnimatedNumber value={sold} />
              <span className="text-[11px] font-medium text-tertiary">
                /<AnimatedNumber value={seats} />
              </span>
            </div>
          </div>
        }
      />

      <div className="mt-2 flex flex-col gap-[3px]">
        {DEPARTURES.map((d, i) => (
          <CapacityRow
            key={d.id}
            d={d}
            capacity={caps[d.id]}
            onCapacity={(n) => setCaps((c) => ({ ...c, [d.id]: n }))}
            enter={delay + i * 0.07}
          />
        ))}
      </div>
    </Widget>
  );
}
