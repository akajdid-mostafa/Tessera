import { DoorArrowRight20Filled, VehicleTruckProfile16Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

const CARRIERS = {
  KSF: "Keystone Freight",
  BGL: "Bluegrass Logistics",
  DHL: "DHL Freight",
  SMX: "Summit Express",
  RDG: "Ridgeline Freight",
  LKS: "Lakeshore Logistics",
  PNR: "Pioneer Carriers",
  UPS: "UPS Supply Chain",
  HTL: "Heartland Lines",
} as const;
type Carrier = keyof typeof CARRIERS;
type Dir = "in" | "out";
type Slot = { door: number; from: number; to: number; c: Carrier; dir: Dir; plate: string; pallets: number; late?: boolean };

const hm = (h: number, m = 0) => h * 60 + m;
const DAY_START = hm(6);
const DAY_END = hm(18);
const SPAN = DAY_END - DAY_START;
const START = hm(13, 40);
const MINUTE_MS = 8000;
const DOORS = 6;

const s = (door: number, f: [number, number], t: [number, number], c: Carrier, dir: Dir, plate: string, pallets: number, late?: boolean): Slot => ({
  door, from: hm(...f), to: hm(...t), c, dir, plate, pallets, late,
});
const SLOTS: Slot[] = [
  s(1, [6, 30], [8, 0], "KSF", "in", "4KSF118", 22),
  s(1, [8, 30], [10, 0], "BGL", "out", "5BGL702", 26),
  s(1, [10, 30], [12, 0], "DHL", "in", "4DHL430", 18),
  s(1, [13, 0], [14, 30], "KSF", "out", "4KSF164", 24),
  s(1, [15, 30], [17, 0], "LKS", "in", "2LKS551", 20),
  s(2, [6, 0], [7, 30], "SMX", "out", "4SMX086", 16),
  s(2, [9, 0], [11, 0], "PNR", "in", "4PNR920", 33),
  s(2, [11, 30], [12, 30], "RDG", "out", "3RDG314", 12),
  s(2, [14, 0], [15, 30], "BGL", "in", "5BGL745", 26),
  s(2, [16, 0], [17, 30], "UPS", "out", "4UPS207", 19),
  s(3, [7, 0], [9, 0], "LKS", "in", "2LKS508", 30),
  s(3, [10, 0], [11, 0], "KSF", "out", "4KSF131", 14),
  s(3, [12, 0], [13, 30], "HTL", "in", "4HTL662", 24),
  s(3, [15, 0], [16, 30], "DHL", "out", "4DHL477", 21),
  s(4, [6, 30], [7, 30], "UPS", "out", "4UPS219", 11),
  s(4, [8, 0], [9, 30], "RDG", "in", "3RDG388", 20),
  s(4, [12, 30], [13, 30], "BGL", "in", "5BGL718", 26, true),
  s(4, [14, 30], [16, 0], "SMX", "out", "4SMX140", 17),
  s(4, [16, 30], [18, 0], "KSF", "in", "4KSF199", 23),
  s(5, [7, 30], [9, 0], "DHL", "in", "4DHL412", 19),
  s(5, [9, 30], [11, 30], "PNR", "out", "4PNR955", 32),
  s(5, [13, 15], [14, 45], "LKS", "out", "2LKS590", 25),
  s(5, [16, 0], [17, 0], "HTL", "in", "4HTL681", 15),
  s(6, [6, 0], [7, 0], "RDG", "out", "3RDG301", 10),
  s(6, [8, 0], [10, 0], "SMX", "in", "4SMX122", 28),
  s(6, [11, 0], [12, 30], "UPS", "in", "4UPS263", 21),
  s(6, [13, 30], [15, 0], "KSF", "out", "4KSF176", 24),
  s(6, [15, 30], [17, 0], "BGL", "out", "5BGL790", 27),
];
const DIR = {
  in: { label: "Inbound", tint: "var(--ios-blue)", bg: "bg-ios-blue/20", bar: "bg-ios-blue" },
  out: { label: "Outbound", tint: "var(--ios-mint)", bg: "bg-ios-mint/20", bar: "bg-ios-mint" },
} as const;
const HOURS = [6, 8, 10, 12, 14, 16, 18];

const clock = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(Math.floor(m % 60)).padStart(2, "0")}`;
const x = (m: number) => ((m - DAY_START) / SPAN) * 100;

/** Logistics · large. Six dock doors on a day Gantt with a NOW line; the late truck pulses, every slot explains itself on hover. */
export function DockScheduleWidget({ index }: { index?: number }) {
  const [now, setNow] = useState(START);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => setNow((n) => (n >= DAY_END - 30 ? START : n + 1)), MINUTE_MS);
    return () => window.clearInterval(t);
  }, []);

  const done = SLOTS.filter((x) => !x.late && x.to <= now).length;
  const onDock = SLOTS.filter((x) => !x.late && x.from <= now && now < x.to).length;
  const late = SLOTS.filter((x) => x.late).length;
  const next = SLOTS.filter((x) => x.from > now).sort((a, b) => a.from - b.from)[0];

  return (
    <Widget size="large" index={index} label="Dock schedule">
      <WidgetHeader
        icon={<DoorArrowRight20Filled />}
        tint="var(--ios-indigo)"
        title="Dock Schedule"
        subtitle="Joliet DC · 6 doors"
        extra={
          late ? (
            <span className="flex items-center gap-1.5 rounded-full bg-ios-red/15 px-2 py-0.5 text-[11px] font-semibold text-ios-red">
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-ios-red opacity-70" />
                <span className="relative size-1.5 rounded-full bg-ios-red" />
              </span>
              {late} late
            </span>
          ) : null
        }
      />

      <div className="mt-3 flex items-baseline-last gap-5">
        <div className="leading-none">
          <div className="mb-1 text-[11px] text-tertiary">Turned today</div>
          <div className="flex items-baseline text-[32px] font-semibold tracking-tight text-heading">
            <AnimatedNumber value={done} />
            <span className="text-[15px] font-medium text-tertiary">/{SLOTS.length}</span>
          </div>
        </div>
        <div className="leading-tight">
          <div className="text-[11px] text-tertiary">On dock</div>
          <AnimatedNumber value={onDock} className="text-[17px] font-semibold text-heading" />
        </div>
        <div className="ml-auto flex flex-col items-end gap-1 text-[11px] text-secondary">
          {(["in", "out"] as const).map((d) => (
            <span key={d} className="flex items-center gap-1.5 whitespace-nowrap">
              <span className={cn("h-2 w-3 rounded-[3px]", DIR[d].bar)} />
              {DIR[d].label}
            </span>
          ))}
        </div>
      </div>

      {/* Gantt */}
      <div className="mt-3 flex gap-1.5">
        <div className="flex w-5 shrink-0 flex-col gap-1">
          {Array.from({ length: DOORS }, (_, i) => (
            <div key={i} className="flex h-6 items-center text-[10px] font-semibold text-tertiary">
              D{i + 1}
            </div>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-0 flex">
            {HOURS.slice(0, -1).map((h) => (
              <span key={h} className="flex-1 border-l-[0.5px] border-split first:border-l-0" />
            ))}
          </div>
          <div className="relative flex flex-col gap-1">
            {Array.from({ length: DOORS }, (_, di) => (
              <div key={di} className="relative h-6 rounded-md bg-fill-quaternary">
                {SLOTS.filter((sl) => sl.door === di + 1).map((sl, k) => {
                  const past = !sl.late && sl.to <= now;
                  const active = !sl.late && sl.from <= now && now < sl.to;
                  const d = DIR[sl.dir];
                  const status = sl.late ? "Late, not arrived" : past ? "Departed" : active ? "On dock" : "Scheduled";
                  return (
                    <Tooltip
                      key={sl.plate}
                      title={`D${sl.door} · ${CARRIERS[sl.c]} · ${d.label} · ${clock(sl.from)}–${clock(sl.to)} · ${sl.plate} · ${sl.pallets} pallets · ${status}`}
                    >
                      <motion.div
                        className={cn(
                          "@container absolute inset-y-[2px] origin-left cursor-default overflow-hidden rounded-[5px]",
                          sl.late ? "bg-ios-red/15 ring-1 ring-inset ring-ios-red" : d.bg,
                        )}
                        style={{ left: `${x(sl.from)}%`, width: `calc(${x(sl.to) - x(sl.from)}% - 2px)` }}
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={
                          sl.late
                            ? { scaleX: 1, opacity: [1, 0.45, 1] }
                            : { scaleX: 1, opacity: past ? 0.45 : 1 }
                        }
                        whileHover={{ y: -1, opacity: 1 }}
                        transition={{
                          scaleX: { type: "spring", stiffness: 220, damping: 24, delay: delay + di * 0.05 + k * 0.04 },
                          opacity: sl.late
                            ? { repeat: Infinity, duration: 1.6, ease: "easeInOut", delay: delay + 0.6 }
                            : { duration: 0.4, delay: delay + di * 0.05 },
                        }}
                      >
                        {active ? (
                          <motion.span
                            className={cn("absolute inset-y-0 left-0 opacity-30", d.bar)}
                            animate={{ width: `${((now - sl.from) / (sl.to - sl.from)) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        ) : null}
                        <span
                          className={cn(
                            "relative flex items-center gap-[3px] pl-[4px] text-[9px] leading-5 font-semibold",
                            sl.late ? "text-ios-red" : "text-heading",
                          )}
                        >
                          <span className={cn("size-1 shrink-0 rounded-full", sl.late ? "bg-ios-red" : d.bar)} />
                          {/* Shown only when the slot is wide enough for it; a clipped "K…" said nothing. */}
                          <span className="hidden whitespace-nowrap @[30px]:inline">{sl.c}</span>
                        </span>
                      </motion.div>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>

          {/* NOW line */}
          <motion.div
            className="pointer-events-none absolute -bottom-1 -top-1 w-0"
            initial={{ left: "0%", opacity: 0 }}
            animate={{ left: `${x(now)}%`, opacity: 1 }}
            transition={{
              left: { duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: now === START ? delay : 0 },
              opacity: { delay },
            }}
          >
            <span className="absolute inset-y-0 -left-px w-[2px] rounded-full bg-ios-red" />
            <span className="absolute -left-[4px] -top-[3px] size-2 rounded-full bg-ios-red ring-2 ring-[var(--widget-surface)]" />
          </motion.div>

          <div className="relative mt-1.5 h-3 text-[10px] text-tertiary tabular">
            {HOURS.map((h) => (
              <span
                key={h}
                className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full"
                style={{ left: `${x(hm(h))}%` }}
              >
                {String(h).padStart(2, "0")}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2.5 border-t-[0.5px] border-split pt-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-fill-tertiary text-[16px] text-secondary">
          <VehicleTruckProfile16Regular />
        </span>
        <AnimatePresence mode="popLayout" initial={false}>
          {next ? (
            <motion.div
              key={next.plate}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex min-w-0 flex-1 items-center gap-2"
            >
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[13px] font-medium text-heading">
                  Next · {CARRIERS[next.c]}
                </div>
                <div className="truncate text-[11px] text-tertiary tabular">
                  D{next.door} · {DIR[next.dir].label} · {clock(next.from)} · {next.pallets} pallets
                </div>
              </div>
              <span className="whitespace-nowrap rounded-full bg-fill-tertiary px-2 py-0.5 text-[11px] font-semibold text-secondary">
                in <AnimatedNumber value={next.from - now} trend={-1} /> min
              </span>
            </motion.div>
          ) : (
            <span className="text-[13px] text-tertiary">No more trucks today</span>
          )}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
