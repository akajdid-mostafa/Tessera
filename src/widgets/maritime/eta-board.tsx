import { VehicleShip16Regular, VehicleShip20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { delta, enterDelay, hhmm, sparkPath, useInterval } from "./_parts";

type Sort = "ETA" | "Delay";
type Vessel = {
  id: string;
  name: string;
  voy: string;
  from: string;
  plan: number; // planned arrival at pilot station, minutes after midnight
  eta: number;
  berth: string;
  dtg: number; // nm to pilot station
  imo: string;
  loa: number;
  draft: number;
  sog: number[]; // kn, last 12 h
  drift: number; // ETA drift per tick, min
  note?: string;
};

const SORTS: Sort[] = ["ETA", "Delay"];
const SEED: Vessel[] = [
  {
    id: "aurora", name: "MSC Aurora", voy: "1312W", from: "Algeciras", plan: 860, eta: 860, berth: "B33",
    dtg: 38.4, imo: "9839284", loa: 366, draft: 15.2, drift: 0,
    sog: [18.2, 18.4, 18.1, 18.3, 18.0, 17.9, 18.2, 18.1, 17.8, 17.6, 17.9, 17.8],
  },
  {
    id: "elba", name: "Maersk Elba", voy: "245S", from: "Port Said", plan: 905, eta: 900, berth: "B31",
    dtg: 51.2, imo: "9778832", loa: 399, draft: 14.6, drift: 0,
    sog: [16.1, 16.3, 16.4, 16.2, 16.6, 16.5, 16.4, 16.3, 16.5, 16.4, 16.2, 16.4],
  },
  {
    id: "harmony", name: "ONE Harmony", voy: "061W", from: "Valencia", plan: 1205, eta: 1365, berth: "B32",
    dtg: 166.0, imo: "9806079", loa: 364, draft: 14.1, drift: 0.6, note: "Heavy weather, reduced speed",
    sog: [17.6, 17.4, 17.5, 16.8, 15.2, 13.9, 12.6, 11.8, 11.2, 10.9, 11.1, 10.8],
  },
];

function pill(late: number) {
  if (Math.abs(late) <= 15) return { text: "On time", cls: "bg-fill-tertiary text-secondary" };
  if (late < 0) return { text: delta(late), cls: "bg-ios-green/15 text-ios-green" };
  if (late <= 60) return { text: delta(late), cls: "bg-ios-orange/15 text-ios-orange" };
  return { text: delta(late), cls: "bg-ios-red/15 text-ios-red" };
}

/** Maritime · medium. Inbound vessels with AIS speed sparklines and ETA against plan; ETAs roll as AIS updates arrive, sort by ETA or delay, hover a row for the vessel's particulars. */
export function EtaBoardWidget({ index }: { index?: number }) {
  const [vessels, setVessels] = useState(SEED);
  const [sort, setSort] = useState<Sort>("ETA");
  const delay = enterDelay(index);

  // Each AIS report moves the vessel on and nudges its ETA.
  useInterval(() => {
    setVessels((vs) =>
      vs.map((v) => {
        const last = v.sog[v.sog.length - 1];
        const sog = Math.round((last + (Math.random() - 0.5) * 0.3) * 10) / 10;
        return {
          ...v,
          sog: [...v.sog.slice(1), sog],
          dtg: Math.max(0, Math.round((v.dtg - sog * 0.02) * 10) / 10),
          eta: v.eta + Math.round(v.drift + (Math.random() - 0.5) * 1.4),
        };
      }),
    );
  }, 4000);

  const rows = [...vessels].sort((a, b) => (sort === "ETA" ? a.eta - b.eta : b.eta - b.plan - (a.eta - a.plan)));
  const late = vessels.filter((v) => v.eta - v.plan > 15).length;

  return (
    <Widget size="medium" index={index} label="Vessel arrivals">
      <WidgetHeader
        icon={<VehicleShip20Filled />}
        tint="var(--ios-blue)"
        title="Vessel Arrivals"
        subtitle={`Next 24 h · ${vessels.length} inbound · ${late} late`}
        extra={<Segmented size="small" value={sort} onChange={(v) => setSort(v as Sort)} options={SORTS} />}
      />

      <div className="mt-1 flex flex-col gap-2">
        {rows.map((v, i) => {
          const lateBy = v.eta - v.plan;
          const p = pill(lateBy);
          const bad = lateBy > 60;
          return (
            <Tooltip
              key={v.id}
              title={`IMO ${v.imo} · LOA ${v.loa} m · Draft ${v.draft} m · ${v.dtg.toFixed(1)} nm to pilot · planned ${hhmm(v.plan)}${v.note ? ` · ${v.note}` : ""}`}
            >
              <motion.div
                layout
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  layout: { type: "spring", stiffness: 380, damping: 32 },
                  default: { delay: delay + i * 0.07, type: "spring", stiffness: 260, damping: 26 },
                }}
                className="relative flex h-[37px] cursor-default items-center gap-2.5 not-first:before:absolute not-first:before:inset-x-0 not-first:before:-top-1 not-first:before:h-[0.5px] not-first:before:bg-split"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-fill-tertiary text-[15px] text-secondary">
                  <VehicleShip16Regular />
                </span>
                <div className="min-w-0 flex-1 leading-tight whitespace-nowrap">
                  <div className="truncate text-[13px] font-medium text-heading">{v.name}</div>
                  <div className="mt-0.5 truncate text-[11px] text-tertiary tabular">
                    {v.voy} · {v.from} · {v.dtg.toFixed(0)} nm
                  </div>
                </div>
                <svg viewBox="0 0 44 16" className="h-4 w-11 shrink-0 overflow-visible" aria-hidden>
                  <motion.path
                    d={sparkPath(v.sog, 44, 16, 9, 19)}
                    fill="none"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    style={{ stroke: bad ? "var(--ios-orange)" : "var(--ant-color-text-tertiary)" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: delay + 0.3 + i * 0.07, duration: 0.6 }}
                  />
                </svg>
                <div className="w-[42px] shrink-0 text-right text-[13px] font-semibold text-heading">
                  <AnimatedNumber value={Math.floor((((v.eta % 1440) + 1440) % 1440) / 60)} format={{ minimumIntegerDigits: 2 }} />
                  :
                  <AnimatedNumber value={(((v.eta % 60) + 60) % 60)} format={{ minimumIntegerDigits: 2 }} />
                </div>
                <span className={cn("w-[50px] shrink-0 rounded-full py-0.5 text-center text-[10px] font-semibold tabular", p.cls)}>
                  {p.text}
                </span>
                <span className="w-7 shrink-0 rounded-md bg-fill-tertiary py-0.5 text-center text-[10px] font-semibold text-secondary">
                  {v.berth}
                </span>
              </motion.div>
            </Tooltip>
          );
        })}
      </div>
    </Widget>
  );
}
