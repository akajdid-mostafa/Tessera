import { Bed20Filled, Couch20Filled, Drop20Filled, AnimalRabbit20Filled, Temperature20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ComponentType, useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

type Valve = "leak" | "confirm" | "closing" | "closed";
type Room = {
  id: string;
  name: string;
  Icon: ComponentType<{ className?: string }>;
  temp: number;
  rh: number;
  co2: number;
  /** Temperature over the last 12 h, °C. */
  spark: number[];
  detail: string;
};

const ROOMS: Room[] = [
  { id: "living", name: "Living Room", Icon: Couch20Filled, temp: 21.6, rh: 44, co2: 620, spark: [20.1, 20.0, 19.8, 19.9, 20.6, 21.2, 21.5, 21.4, 21.6, 21.7, 21.5, 21.6], detail: "PM2.5 4 µg/m³ · VOC low" },
  { id: "bedroom", name: "Bedroom", Icon: Bed20Filled, temp: 19.8, rh: 48, co2: 540, spark: [18.9, 18.7, 18.6, 18.8, 19.4, 19.9, 20.1, 19.9, 19.8, 19.7, 19.8, 19.8], detail: "PM2.5 3 µg/m³ · VOC low" },
  { id: "nursery", name: "Nursery", Icon: AnimalRabbit20Filled, temp: 22.4, rh: 51, co2: 1240, spark: [21.0, 21.1, 21.3, 21.4, 21.6, 21.8, 21.9, 22.0, 22.1, 22.3, 22.3, 22.4], detail: "Door closed 2 h · open a window" },
];
const CO2_HIGH = 1000;

/** Smart home · medium. Room sensors with 12-hour temperature sparklines, humidity and CO₂ ticking live, the nursery over 1,000 ppm and a kitchen leak whose water main you shut with a confirm tap; hover a row for air detail. */
export function SensorsWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [rooms, setRooms] = useState(ROOMS);
  const [hover, setHover] = useState<string | null>(null);
  const [valve, setValve] = useState<Valve>("leak");
  const [leakMin, setLeakMin] = useState(2);

  useEffect(() => {
    const t = window.setInterval(() => {
      setRooms((rs) =>
        rs.map((r, i) => ({
          ...r,
          temp: Math.round(Math.min(ROOMS[i].temp + 0.5, Math.max(ROOMS[i].temp - 0.5, r.temp + (Math.random() - 0.5) * 0.2)) * 10) / 10,
          co2: r.id === "nursery" ? Math.min(1480, r.co2 + Math.round(Math.random() * 14)) : Math.min(780, Math.max(480, r.co2 + Math.round((Math.random() - 0.5) * 16))),
        })),
      );
    }, 3200);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (valve === "leak") {
      const t = window.setInterval(() => setLeakMin((m) => m + 1), 60_000);
      return () => window.clearInterval(t);
    }
    if (valve === "confirm" || valve === "closing") {
      const t = window.setTimeout(() => setValve(valve === "confirm" ? "leak" : "closed"), valve === "confirm" ? 4000 : 1400);
      return () => window.clearTimeout(t);
    }
  }, [valve]);

  const alerts = (valve === "closed" ? 0 : 1) + rooms.filter((r) => r.co2 > CO2_HIGH).length;

  return (
    <Widget size="medium" index={index} label="Home sensors">
      <WidgetHeader
        icon={<Temperature20Filled />}
        tint="var(--ios-teal)"
        title="Sensors"
        subtitle="Maple House · 4 rooms"
        extra={
          <span
            className={cn(
              "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular transition-colors",
              alerts ? "bg-ios-red/15 text-ios-red" : "bg-fill-secondary text-secondary",
            )}
          >
            {alerts ? `${alerts} alert${alerts > 1 ? "s" : ""}` : "All clear"}
          </span>
        }
      />

      <div className="mt-1.5 flex flex-1 flex-col divide-y-[0.5px] divide-split" onMouseLeave={() => setHover(null)}>
        {rooms.map((r, i) => {
          const high = r.co2 > CO2_HIGH;
          const showDetail = hover === r.id;
          return (
            <div
              key={r.id}
              onMouseEnter={() => setHover(r.id)}
              className={cn("-mx-1.5 flex flex-1 items-center gap-2 px-1.5 whitespace-nowrap transition-colors", showDetail && "bg-fill-quaternary")}
            >
              <span className={cn("grid size-6 shrink-0 place-items-center rounded-md text-[13px]", high ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-secondary text-secondary")}>
                <r.Icon />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[13px] font-medium text-heading">{r.name}</span>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={showDetail ? "d" : "s"}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="block truncate text-[11px] text-tertiary tabular"
                  >
                    {showDetail ? (
                      r.detail
                    ) : (
                      <>
                        {r.rh}% · CO₂{" "}
                        <span className={cn(high && "font-semibold text-ios-orange")}>
                          <AnimatedNumber value={r.co2} format={{ useGrouping: true }} />
                        </span>{" "}
                        ppm
                      </>
                    )}
                  </motion.span>
                </AnimatePresence>
              </span>
              <Spark values={r.spark} delay={delay + i * 0.08} emphasis={showDetail} />
              <span className="w-[44px] text-right text-[15px] font-semibold text-heading">
                <AnimatedNumber value={r.temp} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} suffix="°" />
              </span>
              <span
                className={cn(
                  "w-[82px] shrink-0 rounded-md py-0.5 text-center text-[11px] font-semibold",
                  high ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-secondary text-secondary",
                )}
              >
                {high ? "Ventilate" : "Good"}
              </span>
            </div>
          );
        })}

        <LeakRow valve={valve} minutes={leakMin} setValve={setValve} hovered={hover === "kitchen"} onHover={() => setHover("kitchen")} />
      </div>
    </Widget>
  );
}

function LeakRow({
  valve,
  minutes,
  setValve,
  hovered,
  onHover,
}: {
  valve: Valve;
  minutes: number;
  setValve: (v: Valve) => void;
  hovered: boolean;
  onHover: () => void;
}) {
  const closed = valve === "closed";
  return (
    <div
      onMouseEnter={onHover}
      className={cn("-mx-1.5 flex flex-1 items-center gap-2 px-1.5 whitespace-nowrap transition-colors", hovered && "bg-fill-quaternary")}
    >
      <span className={cn("relative grid size-6 shrink-0 place-items-center rounded-md text-[13px]", closed ? "bg-fill-secondary text-secondary" : "bg-ios-red/15 text-ios-red")}>
        <Drop20Filled />
        {!closed ? (
          <motion.span
            className="absolute inset-0 rounded-md ring-2 ring-ios-red"
            animate={{ opacity: [0.8, 0], scale: [1, 1.35] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
          />
        ) : null}
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-[13px] font-medium text-heading">Kitchen Sink</span>
        <span className={cn("block truncate text-[11px] tabular", closed ? "text-tertiary" : "text-ios-red")}>
          {closed ? "Water main closed · dry in 40 min" : hovered ? "Under-sink sensor · 1 drop/s" : `Water leak · ${minutes} min ago`}
        </span>
      </span>
      <span className="w-[134px] shrink-0">
        <AnimatePresence mode="popLayout" initial={false}>
          {valve === "leak" ? (
            <motion.div key="l" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <Button size="small" block color="danger" variant="solid" onClick={() => setValve("confirm")}>
                Shut water main
              </Button>
            </motion.div>
          ) : valve === "confirm" ? (
            <motion.div key="c" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <Button size="small" block color="danger" variant="solid" className="relative overflow-hidden" onClick={() => setValve("closing")}>
                Tap to confirm
                <motion.span
                  className="absolute bottom-0 left-0 h-[2px] bg-white/70"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 4, ease: "linear" }}
                />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="s"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={cn(
                "rounded-md py-0.5 text-center text-[11px] font-semibold",
                closed ? "bg-ios-green/15 text-ios-green" : "bg-fill-secondary text-secondary",
              )}
            >
              {closed ? "Valve closed" : "Closing valve…"}
            </motion.div>
          )}
        </AnimatePresence>
      </span>
    </div>
  );
}

function Spark({ values, delay, emphasis }: { values: number[]; delay: number; emphasis: boolean }) {
  const W = 52;
  const Hh = 18;
  const lo = Math.min(...values) - 0.2;
  const hi = Math.max(...values) + 0.2;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * W, Hh - 1 - ((v - lo) / (hi - lo)) * (Hh - 2)]);
  const d = `M${pts.map((p) => p.join(",")).join("L")}`;
  const last = pts[pts.length - 1];
  const stroke = emphasis ? "var(--ios-teal)" : "var(--ant-color-text-secondary)";
  return (
    <svg viewBox={`0 0 ${W} ${Hh}`} width={W} height={Hh} className="shrink-0 overflow-visible" aria-hidden>
      <motion.path
        d={d}
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ stroke }}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay, duration: 0.9, ease: "easeOut" }}
      />
      <motion.circle
        cx={last[0]}
        cy={last[1]}
        r="2"
        style={{ fill: stroke }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.9, type: "spring", stiffness: 400, damping: 18 }}
      />
    </svg>
  );
}
