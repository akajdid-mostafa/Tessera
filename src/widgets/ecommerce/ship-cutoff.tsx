import { VehicleTruckProfile20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

/** The band runs 08:00–20:00, in minutes since midnight. */
const DAY_START = 8 * 60;
const DAY_END = 20 * 60;
const SPAN = DAY_END - DAY_START;
const START_NOW = 13 * 60 + 41;
/** The loop rewinds a few minutes before the courier leaves. */
const LOOP_AT = 14 * 60 + 24;
/** Orders packed per hour by the current shift. */
const RATE = 46;
const TICK_MS = 1500;

type Pickup = { id: string; carrier: string; at: number; orders: number; done?: boolean };
const PICKUPS: Pickup[] = [
  { id: "ground-am", carrier: "Ground AM", at: 11 * 60, orders: 0, done: true },
  { id: "courier", carrier: "Same-day courier", at: 14 * 60 + 30, orders: 41 },
  { id: "express", carrier: "Express", at: 16 * 60, orders: 52 },
  { id: "ground", carrier: "Ground PM", at: 18 * 60, orders: 74 },
];
const OPEN = PICKUPS.filter((p) => !p.done);
/** Orders due by each open pickup, packed oldest-cutoff first. */
const CUMULATIVE = OPEN.map((_, i) => OPEN.slice(0, i + 1).reduce((s, p) => s + p.orders, 0));

const pad = (n: number) => String(n).padStart(2, "0");
const clock = (min: number) => `${pad(Math.floor(min / 60) % 24)}:${pad(Math.floor(min % 60))}`;
const pos = (min: number) => `${((min - DAY_START) / SPAN) * 100}%`;

/** E-commerce · medium. Today's carrier pickups on a timeline with a moving NOW; orders left to pack roll down and the courier shows at risk. */
export function ShipCutoffWidget({ index }: { index?: number }) {
  const [tick, setTick] = useState(0);
  const [selected, setSelected] = useState(0);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      setTick((k) => (START_NOW + k + 1 >= LOOP_AT ? 0 : k + 1));
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, []);

  const now = START_NOW + tick;
  /** One simulated minute per tick. */
  const packed = (tick * RATE) / 60;
  const p = OPEN[selected];
  const left = Math.ceil(Math.max(0, Math.min(p.orders, CUMULATIVE[selected] - packed)));
  const queue = Math.max(0, CUMULATIVE[selected] - packed);
  const eta = now + (queue / RATE) * 60;
  const slack = Math.round(p.at - eta);
  const late = slack < 0;

  return (
    <Widget size="medium" index={index} label="Ship-by cutoffs">
      <WidgetHeader
        icon={<VehicleTruckProfile20Filled />}
        tint={late ? "var(--ios-orange)" : "var(--ios-teal)"}
        title="Ship Today"
        subtitle={`Warehouse B · packing ${RATE}/h`}
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={late ? "risk" : "ok"}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: "spring", stiffness: 480, damping: 24 }}
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                late ? "bg-ios-orange/15 text-ios-orange" : "bg-ios-green/15 text-ios-green",
              )}
            >
              {late ? "At risk" : "On track"}
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="mt-2 flex items-end gap-4">
        <div className="min-w-0">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="truncate text-[11px] text-tertiary"
            >
              To pack for {p.carrier}
            </motion.div>
          </AnimatePresence>
          <div className="flex items-baseline gap-1">
            <AnimatedNumber
              value={left}
              className="text-[28px] leading-none font-semibold tracking-tight text-heading"
            />
            <span className="text-[12px] text-tertiary">orders</span>
          </div>
        </div>
        <div className="ml-auto shrink-0 pb-0.5 text-right leading-tight">
          <div className="text-[11px] text-tertiary">
            Done by <span className="font-semibold text-secondary tabular">{clock(eta)}</span>
          </div>
          <div className={cn("text-[11px] font-semibold tabular", late ? "text-ios-orange" : "text-ios-green")}>
            {late ? `${-slack} min past ${clock(p.at)}` : `${slack} min to spare`}
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <div className="relative h-[18px]">
          {PICKUPS.map((x) => {
            const openIndex = OPEN.indexOf(x);
            const on = openIndex === selected;
            return (
              <Tooltip key={x.id} title={x.done ? `${x.carrier} · picked up` : `${x.carrier} · ${x.orders} orders`}>
                <motion.button
                  type="button"
                  disabled={x.done}
                  onClick={() => openIndex >= 0 && setSelected(openIndex)}
                  whileHover={x.done ? undefined : { y: -1 }}
                  whileTap={x.done ? undefined : { scale: 0.92 }}
                  className={cn(
                    "absolute top-0 -translate-x-1/2 rounded-full px-1.5 py-px text-[10px] font-semibold tabular transition-colors",
                    x.done
                      ? "cursor-default bg-fill-quaternary text-tertiary line-through"
                      : on
                        ? late
                          ? "cursor-pointer bg-ios-orange/15 text-ios-orange"
                          : "cursor-pointer bg-ios-teal/15 text-ios-teal"
                        : "cursor-pointer bg-fill-secondary text-secondary",
                  )}
                  style={{ left: pos(x.at) }}
                >
                  {clock(x.at)}
                </motion.button>
              </Tooltip>
            );
          })}
        </div>

        <div className="relative mt-1 h-[16px] overflow-hidden rounded-[6px] bg-fill-quaternary">
          {/* Hours already gone. */}
          <motion.div
            className="absolute inset-y-0 left-0 bg-fill-secondary"
            initial={{ width: 0 }}
            animate={{ width: pos(now) }}
            transition={{ type: "spring", stiffness: 80, damping: 20, delay: now === START_NOW ? delay : 0 }}
          />
          {/* The packing window from now to the selected cutoff. */}
          <motion.div
            className={cn("absolute inset-y-[3px] rounded-[4px]", late ? "bg-ios-orange/40" : "bg-ios-teal/40")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, left: pos(now), width: `${((p.at - now) / SPAN) * 100}%` }}
            transition={{
              opacity: { delay: delay + 0.3, duration: 0.4 },
              left: { type: "spring", stiffness: 160, damping: 24 },
              width: { type: "spring", stiffness: 160, damping: 24 },
            }}
          />
          {/* Where packing will finish, past the cutoff when late. */}
          <motion.div
            className={cn("absolute inset-y-0 w-[2px] rounded-full", late ? "bg-ios-orange" : "bg-ios-teal")}
            initial={false}
            animate={{ left: pos(Math.min(DAY_END, eta)) }}
            transition={{ type: "spring", stiffness: 160, damping: 24 }}
          />
          {PICKUPS.map((x) => (
            <span
              key={x.id}
              className="absolute inset-y-0 w-px bg-[var(--ant-color-text-tertiary)] opacity-60"
              style={{ left: pos(x.at) }}
            />
          ))}
          <motion.div
            className="absolute inset-y-0 w-[2px] -translate-x-1/2 rounded-full bg-ios-red"
            initial={false}
            animate={{ left: pos(now) }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
          />
        </div>

        <div className="relative mt-1 h-[11px] text-[9px] leading-none text-tertiary tabular">
          <span className="absolute left-0">08:00</span>
          <motion.span
            className="absolute -translate-x-1/2 font-semibold text-ios-red"
            initial={false}
            animate={{ left: pos(now) }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
          >
            {clock(now)}
          </motion.span>
          <span className="absolute right-0">20:00</span>
        </div>
      </div>
    </Widget>
  );
}
