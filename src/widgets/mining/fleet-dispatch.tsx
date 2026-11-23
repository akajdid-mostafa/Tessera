import { Checkmark12Filled, VehicleTruck20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { AlarmMark, enterDelay, sparkPath, useInterval } from "./_parts";

type View = "Trucks" | "Loaders";
type Tone = "neutral" | "quiet" | "alarm" | "stale";
type Row = {
  id: string;
  sub: string;
  series: number[];
  value: number;
  unit: string;
  pill: string;
  tone: Tone;
  tip: string;
};

const TARGET = 227; // t, nominal payload of a 240 t-class truck
const P110 = TARGET * 1.1;
const P120 = TARGET * 1.2;
const PASS = 57.5; // t per dipper pass, SH-04
const SW = 58;
const SH = 16;

const TRUCKS: Row[] = [
  { id: "HT-211", sub: "Loading · SH-04", series: [224, 231, 219, 236, 228, 222, 233, 226], value: 0, unit: "t", pill: "Pass 0/4", tone: "neutral", tip: "240 t haul truck · cycle 20.6 min · 41.2 t/km fuel" },
  { id: "HT-219", sub: "Hauling → PC1", series: [229, 241, 226, 238, 247, 233, 244, 276], value: 276, unit: "t", pill: "122%", tone: "alarm", tip: "240 t haul truck · last load 276 t, over the 120% limit · strut pressures logged" },
  { id: "HT-217", sub: "Down · ramp 2", series: [232, 227, 230, 224, 229, 226, 231, 231], value: 231, unit: "t", pill: "Tyre 92 °C", tone: "stale", tip: "240 t haul truck · RR tyre 92 °C, 118 psi · tyre crew dispatched 09:44" },
];

const LOADERS: Row[] = [
  { id: "SH-04", sub: "P&H 4100XPC", series: [5420, 5610, 5880, 5540, 5760, 5920, 5680, 5820], value: 5820, unit: "t/h", pill: "1 queued", tone: "quiet", tip: "Rope shovel · 57.5 t dipper · 4 passes · bench 1150" },
  { id: "SH-02", sub: "Hitachi EX5600", series: [3720, 3880, 3910, 3790, 4020, 3860, 3990, 3940], value: 3940, unit: "t/h", pill: "Digging", tone: "quiet", tip: "Hydraulic face shovel · 29 m³ bucket · 5 passes · bench 1165" },
  { id: "SH-06", sub: "Standby · bench 1135", series: [5100, 5240, 4980, 3200, 0, 0, 0, 0], value: 0, unit: "t/h", pill: "No trucks", tone: "stale", tip: "P&H 4100XPC · standby since 10:10 · trucks reassigned to SH-04" },
];

const PILL: Record<Tone, string> = {
  neutral: "bg-fill-tertiary text-secondary",
  quiet: "text-tertiary",
  alarm: "bg-ios-orange/15 text-ios-orange",
  stale: "bg-fill-quaternary text-tertiary",
};

/** Mining · medium. Dispatch rows for trucks or loaders with payload or dig-rate sparklines against the 10/10/20 limits; a truck loads pass by pass live, and the 122% overload flashes until you tap it to acknowledge. */
export function FleetDispatchWidget({ index }: { index?: number }) {
  const [view, setView] = useState<View>("Trucks");
  const [trucks, setTrucks] = useState(TRUCKS);
  const [passes, setPasses] = useState(0);
  const [acked, setAcked] = useState(false);
  const delay = enterDelay(index);

  useInterval(() => {
    const next = passes >= 6 ? 0 : passes + 1;
    setPasses(next);
    setTrucks((ts) =>
      ts.map((t) => {
        if (t.id !== "HT-211") return t;
        if (next === 0) return { ...t, value: 0, sub: "Loading · SH-04", pill: "Pass 0/4" };
        if (next <= 4) {
          const v = Math.round(PASS * next + (Math.random() - 0.5) * 6);
          const done = next === 4;
          return {
            ...t,
            value: v,
            pill: done ? "Loaded" : `Pass ${next}/4`,
            sub: done ? "Hauling → PC1" : "Loading · SH-04",
            series: done ? [...t.series.slice(1), v] : t.series,
          };
        }
        return t;
      }),
    );
  }, 2400);

  const rows = view === "Trucks" ? trucks : LOADERS;
  const loaded = trucks.filter((t) => t.series[t.series.length - 1] > P110).length;

  return (
    <Widget size="medium" index={index} label="Fleet dispatch">
      <WidgetHeader
        icon={<VehicleTruck20Filled />}
        tint={!acked ? "var(--ios-orange)" : "var(--ios-blue)"}
        title="Dispatch · Pit 3"
        subtitle={view === "Trucks" ? `Shift A · ${loaded} of ${trucks.length} last loads over 110%` : "2 of 3 loaders digging · 9,760 t/h"}
        extra={<Segmented size="small" value={view} onChange={(v) => setView(v as View)} options={["Trucks", "Loaders"]} />}
      />

      <ul className="mt-auto flex flex-col gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {rows.map((r, i) => {
            const truck = view === "Trucks";
            const alarm = r.tone === "alarm";
            const lo = truck ? 180 : 0;
            const hi = truck ? 290 : 6500;
            return (
              <motion.li
                key={`${view}-${r.id}`}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ type: "spring", stiffness: 380, damping: 32, delay: i * 0.04 }}
                className={cn("relative", i > 0 && "before:absolute before:inset-x-0 before:-top-1 before:h-[0.5px] before:bg-split")}
              >
                <Tooltip placement="top" title={`${r.id} · ${r.tip}`}>
                  <button
                    type="button"
                    onClick={() => alarm && setAcked(true)}
                    aria-label={alarm && !acked ? `${r.id} overload, acknowledge` : r.id}
                    className="-mx-1.5 flex h-[38px] w-[calc(100%+0.75rem)] cursor-pointer items-center gap-2 px-1.5 text-left whitespace-nowrap transition-colors duration-200 outline-none hover:bg-fill-quaternary"
                  >
                    <span className="grid w-4 shrink-0 place-items-center">
                      {alarm ? (
                        <AlarmMark priority={2} flashing={!acked} size={15} />
                      ) : (
                        <span className={cn("size-2 rounded-full", r.tone === "stale" ? "ring-[1.5px] ring-[var(--ant-color-text-tertiary)] ring-inset" : "bg-[var(--ant-color-text-secondary)]")} />
                      )}
                    </span>
                    <span className="w-[46px] shrink-0 text-[13px] font-semibold text-heading tabular">{r.id}</span>
                    <span className={cn("w-[96px] shrink-0 truncate text-[11px]", r.tone === "stale" ? "text-secondary" : "text-tertiary")}>{r.sub}</span>
                    <svg viewBox={`0 0 ${SW} ${SH}`} preserveAspectRatio="none" className="h-5 min-w-0 flex-1 overflow-visible" aria-hidden>
                      {truck ? (
                        <>
                          <line x1="0" x2={SW} y1={SH - ((P110 - lo) / (hi - lo)) * SH} y2={SH - ((P110 - lo) / (hi - lo)) * SH} strokeWidth="1" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" className="stroke-fill" />
                          <line x1="0" x2={SW} y1={SH - ((P120 - lo) / (hi - lo)) * SH} y2={SH - ((P120 - lo) / (hi - lo)) * SH} strokeWidth="1" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" className="stroke-[var(--ios-orange)] opacity-60" />
                        </>
                      ) : null}
                      <motion.path
                        d={sparkPath(r.series, SW, SH, lo, hi)}
                        fill="none"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        className={r.tone === "stale" ? "stroke-[var(--ant-color-text-tertiary)]" : "stroke-[var(--ant-color-text-secondary)]"}
                        initial={{ d: sparkPath(r.series, SW, SH, lo, hi), opacity: 0 }}
                        animate={{ d: sparkPath(r.series, SW, SH, lo, hi), opacity: 1 }}
                        transition={{ opacity: { duration: 0.8, delay: delay + i * 0.08 }, d: { duration: 0.5 } }}
                      />
                      {alarm ? <circle cx={SW} cy={SH - ((r.series[r.series.length - 1] - lo) / (hi - lo)) * SH} r="2.2" className="fill-[var(--ios-orange)]" /> : null}
                    </svg>
                    <span className={cn("w-[56px] shrink-0 text-right text-[13px] font-semibold", alarm ? "text-ios-orange" : r.tone === "stale" ? "text-tertiary" : "text-heading")}>
                      <AnimatedNumber value={r.value} />
                      <span className="text-[10px] font-medium text-tertiary"> {r.unit}</span>
                    </span>
                    <span className="flex w-[62px] shrink-0 justify-end">
                      <span className={cn("flex items-center gap-0.5 rounded-full px-1.5 py-px text-[10px] font-semibold tabular", PILL[r.tone], r.tone === "quiet" && "px-0 font-medium")}>
                        {alarm && acked ? <Checkmark12Filled className="size-3" /> : null}
                        {r.pill}
                      </span>
                    </span>
                  </button>
                </Tooltip>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </Widget>
  );
}
