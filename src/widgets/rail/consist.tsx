import { Checkmark16Filled, Dismiss16Regular, PersonWalking16Regular, VehicleSubway20Filled, Warning16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { enterDelay, useInterval } from "./_parts";

/* 1B37, twelve cars: three four-car units. Load is % of seats, so over 100 means standing. */
const UNITS = [4127, 4133, 4108];
const CARS = 12;
const seatsOf = (c: number) => (c % 4 === 0 || c % 4 === 3 ? 64 : 80);
const STATIONS = ["Kingsmere", "Wexcombe", "Hollins Cross", "Ashby Vale", "Port Ashby"];
/* Load targets after each call: the front fills at the city end, the rear stays quiet. */
const PATTERNS = [
  [96, 104, 92, 85, 78, 71, 64, 55, 44, 38, 31, 26],
  [88, 97, 101, 90, 74, 69, 70, 58, 47, 41, 35, 29],
  [108, 112, 98, 93, 84, 76, 66, 61, 52, 44, 36, 30],
  [72, 79, 70, 66, 58, 51, 47, 40, 34, 29, 24, 19],
];
const RUN_MS = 13000;
const TICK_MS = 500;
const CONFIRM_MS = 5000;

type Fault = { car: number; kind: "door" | "hvac"; text: string; action?: string };
const FAULTS: Fault[] = [
  { car: 2, kind: "hvac", text: "Saloon 27.5 °C · HVAC fan 2 slow" },
  { car: 6, kind: "door", text: "Door 2B not closed and locked", action: "Isolate 2B" },
];
const DOORS = ["1A", "1B", "2A", "2B"];

const crowd = (l: number) => (l > 100 ? "full" : l > 70 ? "busy" : "quiet");
const CROWD = {
  quiet: { label: "Quiet", fill: "bg-ios-green/30", text: "text-ios-green", pill: "bg-ios-green/15 text-ios-green" },
  busy: { label: "Busy", fill: "bg-ios-yellow/35", text: "text-ios-yellow", pill: "bg-ios-yellow/20 text-ios-yellow" },
  full: { label: "Standing", fill: "bg-ios-red/30", text: "text-ios-red", pill: "bg-ios-red/15 text-ios-red" },
} as const;

/** Rail · large. A twelve-car consist with each car filling to its passenger load and showing its faults, the train running stop to stop as loads shift; tap a car for its load, saloon temperature and doors, and isolate the failed door with a confirm. */
export function ConsistWidget({ index }: { index?: number }) {
  const [stop, setStop] = useState(2);
  const [run, setRun] = useState(0.35);
  const [load, setLoad] = useState(PATTERNS[0]);
  const [sel, setSel] = useState(6);
  const [door, setDoor] = useState<"fault" | "confirm" | "isolated">("fault");
  const delay = enterDelay(index);

  useInterval(() => {
    const next = run + TICK_MS / RUN_MS;
    if (next < 1) {
      setRun(next);
      return;
    }
    // Arrive: the next station becomes the current one and passengers reshuffle.
    const s = (stop + 1) % (STATIONS.length - 1);
    setStop(s === 0 ? 1 : s);
    setRun(0);
    setLoad(PATTERNS[s % PATTERNS.length].map((v) => Math.max(8, Math.round(v + (Math.random() - 0.5) * 8))));
  }, TICK_MS);

  useEffect(() => {
    if (door !== "confirm") return;
    const t = window.setTimeout(() => setDoor("fault"), CONFIRM_MS);
    return () => window.clearTimeout(t);
  }, [door]);

  const faults = FAULTS.filter((f) => !(f.kind === "door" && door === "isolated"));
  const l = load[sel];
  const c = CROWD[crowd(l)];
  const pax = Math.round((l / 100) * seatsOf(sel));
  const fault = FAULTS.find((f) => f.car === sel);
  const saloon = fault?.kind === "hvac" ? 27.5 : 21.5 + (sel % 3) * 0.4;
  // The quietest four cars in a row, for the platform advice.
  let best = 0;
  for (let i = 1; i <= CARS - 4; i++) if (load.slice(i, i + 4).reduce((a, b) => a + b) < load.slice(best, best + 4).reduce((a, b) => a + b)) best = i;
  const next = STATIONS[stop + 1] ?? STATIONS[STATIONS.length - 1];
  const minsToNext = Math.max(1, Math.round((1 - run) * 4));

  const car = (i: number) => {
    const li = load[i];
    const k = crowd(li);
    const f = FAULTS.find((x) => x.car === i);
    const live = f && !(f.kind === "door" && door === "isolated");
    return (
      <motion.button
        key={i}
        type="button"
        onClick={() => setSel(i)}
        aria-label={`Car ${i + 1}, ${li}% of seats`}
        className={cn(
          "relative h-[46px] min-w-0 flex-1 cursor-pointer overflow-hidden bg-fill-quaternary outline-none ring-inset transition-shadow",
          i === 0 ? "rounded-l-[18px] rounded-r-[6px]" : i === CARS - 1 ? "rounded-l-[6px] rounded-r-[18px]" : "rounded-[6px]",
          i === sel ? "ring-1 ring-ios-blue" : "ring-[0.5px] ring-[var(--ant-color-border)]",
        )}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 360, damping: 26, delay: delay + i * 0.03 }}
      >
        <motion.span
          className={cn("absolute inset-x-0 bottom-0", CROWD[k].fill)}
          initial={{ height: "0%" }}
          animate={{ height: `${Math.min(100, (li / 120) * 100)}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 18, delay: run === 0.35 ? delay + 0.3 + i * 0.03 : 0 }}
        />
        {live ? (
          <motion.span
            className={cn("absolute right-1 top-1 text-[12px] leading-none", f.kind === "door" ? "text-ios-red" : "text-ios-orange")}
            animate={f.kind === "door" && door !== "isolated" ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
            transition={{ repeat: Infinity, duration: 1.1 }}
          >
            <Warning16Filled className="size-3" />
          </motion.span>
        ) : null}
        <span className="relative grid h-full place-items-center pt-1 text-[12px] font-semibold text-heading tabular">
          <AnimatedNumber value={li} suffix="%" />
        </span>
      </motion.button>
    );
  };

  const row = (from: number) => (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1">
        {Array.from({ length: 6 }, (_, k) => {
          const i = from + k;
          return (
            <div key={i} className={cn("flex min-w-0 flex-1", i % 4 === 0 && i > 0 && k > 0 && "ml-1.5")}>
              {car(i)}
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 text-[10px] text-tertiary tabular">
        {Array.from({ length: 6 }, (_, k) => {
          const i = from + k;
          return (
            <span key={i} className={cn("flex-1 text-center", i % 4 === 0 && i > 0 && k > 0 && "ml-1.5", i === sel && "font-semibold text-heading")}>
              {i + 1}
            </span>
          );
        })}
      </div>
    </div>
  );

  return (
    <Widget size="large" index={index} label="Train consist and car load">
      <WidgetHeader
        icon={<VehicleSubway20Filled />}
        tint="var(--ios-indigo)"
        title="1B37 · 12 cars"
        subtitle={`Kingsmere → Port Ashby · ${UNITS.join(" + ")}`}
        extra={
          faults.length ? (
            <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-ios-orange/15 px-2 py-0.5 text-[11px] font-semibold text-ios-orange">
              <Warning16Filled className="size-3" />
              {faults.length} {faults.length === 1 ? "fault" : "faults"}
            </span>
          ) : null
        }
      />

      {/* where the train is */}
      <div className="mt-2.5 flex h-4 items-center gap-2 text-[11px] whitespace-nowrap">
        <span className="text-tertiary">
          Next <span className="font-semibold text-heading">{next}</span>
        </span>
        <div className="relative h-4 min-w-0 flex-1">
          <span className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-fill-secondary" />
          {STATIONS.map((st, i) => (
            <span
              key={st}
              className={cn(
                "absolute top-1/2 size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--widget-surface)]",
                i <= stop ? "bg-[var(--ant-color-text-secondary)]" : "bg-fill",
              )}
              style={{ left: `${(i / (STATIONS.length - 1)) * 100}%` }}
            />
          ))}
          <motion.span
            className="absolute top-1/2 h-[9px] w-[16px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ios-indigo"
            initial={false}
            animate={{ left: `${((stop + run) / (STATIONS.length - 1)) * 100}%` }}
            transition={{ duration: run === 0 ? 0 : TICK_MS / 1000, ease: "linear" }}
          />
        </div>
        <span className="text-tertiary tabular">
          <AnimatedNumber value={minsToNext} /> min
        </span>
      </div>

      {/* the consist */}
      <div className="mt-3 flex flex-col gap-2">
        {row(0)}
        {row(6)}
      </div>

      {/* the selected car */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={sel}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="mt-3 flex flex-col gap-2 rounded-xl bg-fill-quaternary p-2.5"
        >
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-[13px] font-semibold text-heading">Car {sel + 1}</span>
            <span className="truncate text-[11px] text-tertiary tabular">
              Unit {UNITS[Math.floor(sel / 4)]} · {seatsOf(sel)} seats
            </span>
            <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold", c.pill)}>{c.label}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-tertiary whitespace-nowrap tabular">
            <span>
              ≈ <AnimatedNumber value={pax} className="text-[13px] font-semibold text-heading" /> on board
            </span>
            <span>
              Saloon{" "}
              <span className={cn("text-[13px] font-semibold", fault?.kind === "hvac" ? "text-ios-orange" : "text-heading")}>
                {saloon.toFixed(1)} °C
              </span>
            </span>
            <span className="ml-auto flex gap-1">
              {DOORS.map((d) => {
                const bad = fault?.kind === "door" && d === "2B";
                return (
                  <span
                    key={d}
                    className={cn(
                      "grid h-[18px] w-[24px] place-items-center rounded-[4px] text-[9px] font-semibold",
                      bad && door !== "isolated"
                        ? "bg-ios-red text-white"
                        : bad
                          ? "bg-fill-secondary text-secondary"
                          : "bg-fill-tertiary text-secondary",
                    )}
                  >
                    {d}
                  </span>
                );
              })}
            </span>
          </div>
          <div className="flex h-7 items-center gap-2">
            {fault && !(fault.kind === "door" && door === "isolated") ? (
              <>
                <Warning16Filled className={cn("size-3.5 shrink-0", fault.kind === "door" ? "text-ios-red" : "text-ios-orange")} />
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-secondary">{fault.text}</span>
                {fault.action ? (
                  door === "confirm" ? (
                    <>
                      <Button size="small" shape="circle" variant="filled" color="default" icon={<Dismiss16Regular />} aria-label="Cancel" onClick={() => setDoor("fault")} />
                      <Button size="small" type="primary" danger className="relative overflow-hidden" onClick={() => setDoor("isolated")}>
                        Confirm
                        <motion.span
                          className="absolute bottom-0 left-0 h-[2px] bg-white/70"
                          initial={{ width: "100%" }}
                          animate={{ width: "0%" }}
                          transition={{ duration: CONFIRM_MS / 1000, ease: "linear" }}
                        />
                      </Button>
                    </>
                  ) : (
                    <Button size="small" variant="filled" color="danger" onClick={() => setDoor("confirm")}>
                      {fault.action}
                    </Button>
                  )
                ) : (
                  <span className="text-[11px] text-tertiary">Depot notified</span>
                )}
              </>
            ) : (
              <>
                <Checkmark16Filled className="size-3.5 shrink-0 text-ios-green" />
                <span className="min-w-0 flex-1 truncate text-[11px] text-secondary">
                  {fault ? "Door 2B isolated · locked out of use" : "No faults · fit to run"}
                </span>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-auto flex items-center gap-1.5 text-[11px] text-ios-green whitespace-nowrap">
        <PersonWalking16Regular className="size-3.5 shrink-0" />
        <span className="truncate font-medium">
          Quieter in cars {best + 1}–{best + 4} · {best >= 6 ? "board at the rear" : "board mid-train"}
        </span>
      </div>
    </Widget>
  );
}
