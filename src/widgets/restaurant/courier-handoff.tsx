import { BuildingShop16Filled, ShoppingBag16Filled, VehicleBicycle20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Order = {
  id: number;
  channel: string;
  courier: string;
  /** Seconds until the courier reaches the pass; 0 = here. */
  eta: number;
  trip: number;
  /** Seconds until the bag is sealed; 0 = ready. */
  cook: number;
  /** Seconds the bag or the courier has been waiting. */
  idle: number;
};

const START: Order[] = [
  { id: 4182, channel: "App", courier: "Diego Alvarez", eta: 0, trip: 540, cook: 45, idle: 70 },
  { id: 4185, channel: "Web", courier: "Amara Osei", eta: 150, trip: 600, cook: 0, idle: 195 },
  { id: 4189, channel: "Partner", courier: "Kenji Mori", eta: 430, trip: 660, cook: 280, idle: 0 },
];
const COURIERS = ["Lucia Ferreira", "Sami Haddad", "Priya Raman", "Tomas Berg", "Yara Nasser"];
const CHANNELS = ["App", "Web", "Partner"];
/** One real second is five simulated ones, so couriers visibly move. */
const STEP = 5;

const Clock = ({ s }: { s: number }) => (
  <>
    {Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}
  </>
);

/** Restaurant · medium. Delivery orders at the pass, each a track with its courier riding in and the bag cooking or sealed; one courier waits on food and another bag goes cold, then hand off when both meet. */
export function CourierHandoffWidget({ index }: { index?: number }) {
  const [orders, setOrders] = useState(START);
  const next = useRef(0);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      setOrders((os) =>
        os.map((o) => {
          const eta = Math.max(0, o.eta - STEP);
          const cook = Math.max(0, o.cook - STEP);
          const meeting = (eta === 0) !== (cook === 0);
          const startedWaiting = meeting && (o.eta === 0) === (o.cook === 0);
          return { ...o, eta, cook, idle: meeting ? (startedWaiting ? 0 : o.idle + STEP) : o.idle };
        }),
      );
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  const handOff = (id: number) => {
    const k = next.current;
    next.current += 1;
    const trip = 480 + ((k * 97) % 240);
    const fresh: Order = {
      id: 4190 + k * 3,
      channel: CHANNELS[k % CHANNELS.length],
      courier: COURIERS[k % COURIERS.length],
      eta: trip,
      trip,
      cook: 240 + ((k * 61) % 200),
      idle: 0,
    };
    setOrders((os) => [...os.filter((o) => o.id !== id), fresh]);
  };

  const waiting = orders.filter((o) => (o.eta === 0) !== (o.cook === 0)).length;

  return (
    <Widget size="medium" index={index} label="Courier handoff">
      <WidgetHeader
        icon={<VehicleBicycle20Filled />}
        tint="var(--ios-green)"
        title="Courier Handoff"
        subtitle={
          <>
            Delivery at the pass ·{" "}
            <span className={cn(waiting && "font-medium text-ios-orange")}>
              <AnimatedNumber value={waiting} /> waiting
            </span>
          </>
        }
      />

      <div className="mt-2 flex flex-col">
        <AnimatePresence mode="popLayout" initial={false}>
          {orders.map((o, i) => {
            const here = o.eta === 0;
            const ready = o.cook === 0;
            const progress = 1 - o.eta / o.trip;
            const km = (o.eta / 60) * 0.28;
            const state =
              here && ready
                ? null
                : here
                  ? { label: "Courier waiting", cls: "bg-ios-red/15 text-ios-red" }
                  : ready
                    ? { label: "Bag waiting", cls: o.idle >= 180 ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-tertiary text-secondary" }
                    : { label: "On track", cls: "bg-fill-tertiary text-secondary" };
            return (
              <motion.div
                key={o.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 40, filter: "blur(4px)" }}
                transition={{ type: "spring", stiffness: 380, damping: 32, delay: o.id < 4190 ? delay + i * 0.06 : 0 }}
                className={cn("flex h-[38px] shrink-0 items-center gap-2.5", i > 0 && "border-t-[0.5px] border-split")}
              >
                <div className="w-[52px] shrink-0 leading-tight">
                  <div className="text-[12.5px] font-semibold text-heading tabular">#{o.id}</div>
                  <div className="text-[10.5px] text-tertiary">{o.channel}</div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="relative h-[20px]">
                    <div className="absolute inset-x-[9px] top-1/2 h-0 -translate-y-1/2 border-t-2 border-dashed border-fill" />
                    <motion.div
                      className="absolute top-1/2 left-[9px] h-[2px] -translate-y-1/2 rounded-full bg-ios-green"
                      initial={{ width: 0 }}
                      animate={{ width: `calc((100% - 18px) * ${progress})` }}
                      transition={{ type: "spring", stiffness: 70, damping: 18 }}
                    />
                    <span
                      className={cn(
                        "absolute top-0 right-0 grid size-[20px] place-items-center rounded-full",
                        ready ? "bg-ios-green/15 text-ios-green" : "bg-fill-secondary text-secondary",
                      )}
                    >
                      {ready ? <ShoppingBag16Filled className="size-3" /> : <BuildingShop16Filled className="size-3" />}
                    </span>
                    <motion.div
                      className="absolute top-0"
                      initial={{ left: "0%" }}
                      animate={{ left: `calc((100% - 38px) * ${progress})` }}
                      transition={{ type: "spring", stiffness: 70, damping: 18 }}
                    >
                      <Tooltip title={here ? `${o.courier} is at the pass` : `${o.courier} · ${km.toFixed(1)} km away`}>
                        <span className="block rounded-full ring-[1.5px] ring-[var(--widget-surface)]">
                          <MemojiAvatar who={o.courier} size={20} />
                        </span>
                      </Tooltip>
                    </motion.div>
                  </div>
                  <div className="mt-px flex justify-between text-[10.5px] leading-[13px] whitespace-nowrap text-tertiary tabular">
                    <span className="truncate">
                      {o.courier.split(" ")[0]} · 
                      {here ? (
                        <span className="font-medium text-ios-red">
                          <Clock s={o.idle} />
                        </span>
                      ) : (
                        <Clock s={o.eta} />
                      )}
                    </span>
                    <span className="shrink-0 pl-2">
                      {ready ? (
                        <>
                          Sealed{" "}
                          {!here ? (
                            <span className={cn("font-medium", o.idle >= 180 ? "text-ios-orange" : "text-secondary")}>
                              <Clock s={o.idle} />
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <>
                          Cooking <Clock s={o.cook} />
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex w-[88px] shrink-0 justify-end">
                  {state ? (
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold whitespace-nowrap", state.cls)}>
                      {state.label}
                    </span>
                  ) : (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                      <Button size="small" type="primary" onClick={() => handOff(o.id)}>
                        Hand off
                      </Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
