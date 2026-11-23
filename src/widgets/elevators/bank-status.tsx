import { ArrowBidirectionalUpDown20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type State = "ok" | "oos" | "indep";
type Unit = {
  id: string;
  name: string;
  state: State;
  floor: number;
  dir: -1 | 0 | 1;
  load: number;
  trips: number;
  /** Trips per hour, 06:00 to now. */
  spark: number[];
  doors: string;
  note?: string;
};

const UNITS: Unit[] = [
  { id: "P1", name: "Passenger 1", state: "ok", floor: 12, dir: -1, load: 9, trips: 342, spark: [4, 18, 46, 52, 31, 22, 28, 40, 34], doors: "1,912 door cycles · 3.1 s" },
  { id: "P2", name: "Passenger 2", state: "ok", floor: 4, dir: 1, load: 14, trips: 318, spark: [3, 15, 44, 49, 30, 24, 25, 37, 31], doors: "1,780 door cycles · 3.3 s" },
  { id: "P3", name: "Passenger 3", state: "oos", floor: 1, dir: 0, load: 0, trips: 121, spark: [5, 17, 41, 47, 11, 0, 0, 0, 0], doors: "62 reopens · torque high", note: "Door operator fault · 10:42" },
  { id: "S1", name: "Service car", state: "indep", floor: -1, dir: 0, load: 0, trips: 64, spark: [2, 6, 9, 8, 7, 9, 8, 7, 8], doors: "402 door cycles · key on", note: "Independent · loading dock" },
];
const CAP = 21;
const floorLabel = (f: number) => (f === 1 ? "L" : f < 0 ? `B${-f}` : String(f));

/** Elevators · medium. Every car in the bank with live position, trips per hour and status; hover a row for its door-cycle health, and P3 shows out of service. */
export function BankStatusWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [units, setUnits] = useState(UNITS);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => {
      setUnits((us) =>
        us.map((u) => {
          if (u.state !== "ok") return u;
          let { floor, dir } = u;
          if (dir === 0) dir = floor >= 12 ? -1 : 1;
          floor = Math.min(14, Math.max(1, floor + dir * (1 + Math.round(Math.random() * 2))));
          const stop = floor === 1 || floor === 14 || Math.random() < 0.25;
          const nextDir: -1 | 0 | 1 = stop ? (floor === 1 ? 1 : floor === 14 ? -1 : 0) : dir;
          return {
            ...u,
            floor,
            dir: nextDir,
            load: floor === 1 ? 6 + Math.round(Math.random() * 12) : Math.max(0, u.load + Math.round((Math.random() - 0.6) * 4)),
            trips: u.trips + (stop ? 1 : 0),
          };
        }),
      );
    }, 2200);
    return () => window.clearInterval(t);
  }, []);

  const inService = units.filter((u) => u.state === "ok").length;

  return (
    <Widget size="medium" index={index} label="Elevator bank status">
      <WidgetHeader
        icon={<ArrowBidirectionalUpDown20Filled />}
        tint="var(--ios-blue)"
        title="Bank Status"
        subtitle="Harbor Tower · trips/h since 06:00"
        extra={
          <span className="mt-0.5 shrink-0 rounded-full bg-fill-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary tabular">
            {inService}/{units.length} in service
          </span>
        }
      />

      <div className="mt-1.5 flex flex-1 flex-col divide-y-[0.5px] divide-split" onMouseLeave={() => setHover(null)}>
        {units.map((u, i) => {
          const showDoors = hover === u.id;
          const sub =
            u.state === "ok"
              ? `${floorLabel(u.floor)} ${u.dir > 0 ? "▲" : u.dir < 0 ? "▼" : "·"} · ${u.load}/${CAP} pax`
              : (u.note ?? "");
          return (
            <div
              key={u.id}
              onMouseEnter={() => setHover(u.id)}
              className={cn(
                "-mx-1.5 flex flex-1 items-center gap-2 px-1.5 whitespace-nowrap transition-colors",
                showDoors && "bg-fill-quaternary",
              )}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-md text-[11px] font-bold tabular",
                  u.state === "oos" ? "bg-ios-red/15 text-ios-red" : "bg-fill-secondary text-secondary",
                )}
              >
                {u.id}
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[13px] font-medium text-heading">{u.name}</span>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={showDoors ? "doors" : sub}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className={cn("block truncate text-[11px] tabular", u.state === "oos" && !showDoors ? "text-ios-red" : "text-tertiary")}
                  >
                    {showDoors ? u.doors : sub}
                  </motion.span>
                </AnimatePresence>
              </span>
              <Spark values={u.spark} tone={u.state} delay={delay + i * 0.08} emphasis={showDoors} />
              <span className="w-[38px] text-right leading-none">
                <AnimatedNumber value={u.trips} className="block text-[13px] font-semibold text-heading" />
                <span className="block text-[10px] leading-[11px] text-tertiary">trips</span>
              </span>
              <span
                className={cn(
                  "w-[84px] shrink-0 rounded-md py-0.5 text-center text-[11px] font-semibold",
                  u.state === "oos" && "bg-ios-red text-white",
                  u.state === "indep" && "bg-ios-blue/15 text-ios-blue",
                  u.state === "ok" && "bg-fill-secondary text-secondary",
                )}
              >
                {u.state === "oos" ? "Out of service" : u.state === "indep" ? "Independent" : "In service"}
              </span>
            </div>
          );
        })}
      </div>
    </Widget>
  );
}

function Spark({ values, tone, delay, emphasis }: { values: number[]; tone: State; delay: number; emphasis: boolean }) {
  const W = 52;
  const Hh = 18;
  const max = 55;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * W},${Hh - 1 - (v / max) * (Hh - 2)}`);
  const d = `M${pts.join("L")}`;
  const stroke = tone === "oos" ? "var(--ios-red)" : emphasis ? "var(--ios-blue)" : "var(--ant-color-text-secondary)";
  const last = pts[pts.length - 1].split(",").map(Number);
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
