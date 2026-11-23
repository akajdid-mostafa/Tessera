import { Pulse20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/* Ride quality from the car-top sensor on every run: horizontal vibration as the A95
 * peak-to-peak value in milli-g (95 % of the run sits under it). Under 15 mg rides
 * smooth, the bank's limit is 25 mg. Car C's guide rollers have flat spots: a regular
 * knock through the run and an A95 above the limit. A new run lands every few seconds. */
type Car = { id: string; base: number; knock: boolean };
const CARS: Car[] = [
  { id: "A", base: 13, knock: false },
  { id: "B", base: 11, knock: false },
  { id: "C", base: 31, knock: true },
  { id: "D", base: 16, knock: false },
];
const LIMIT = 25;
const RUN_MS = 5200;
const N = 64;
const W = 164;
const H = 44;
const SCALE = 26; // mg from centre to edge; A95 is peak-to-peak, so the band is ±limit/2

const rnd = (k: number) => {
  const x = Math.sin(k * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const FLOORS = [
  ["L", "14"],
  ["14", "6"],
  ["6", "B1"],
  ["B1", "11"],
  ["11", "L"],
];

function trace(car: Car, run: number, a95: number) {
  return Array.from({ length: N }, (_, i) => {
    const t = i / (N - 1);
    // Accelerate, cruise, decelerate: vibration grows with speed.
    const speed = Math.min(1, t / 0.2, (1 - t) / 0.2);
    const knock = car.knock && i % 9 === 4 ? 1.6 : 0;
    const v = (rnd(i + run * 97 + car.id.charCodeAt(0)) - 0.5) * (0.35 + speed) + knock * (i % 2 ? 1 : -1) * 0.4;
    return v * a95 * 0.95;
  });
}
const yOf = (mg: number) => H / 2 - (mg / SCALE) * (H / 2);

/** Elevators · small. Horizontal vibration A95 for each car's latest run against the 25 mg limit; a new run traces in every few seconds with a scan line, and tapping a car chip switches to it, car C knocking on worn guide rollers. */
export function RideQualityWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [car, setCar] = useState(0);
  const [run, setRun] = useState(0);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => setRun((r) => r + 1), RUN_MS);
    return () => window.clearInterval(t);
  }, []);

  const c = CARS[car];
  const a95 = Math.round((c.base + (rnd(run * 31 + car) - 0.5) * 3) * 10) / 10;
  const pts = trace(c, run, a95);
  const d = pts.map((v, i) => `${i ? "L" : "M"}${((i / (N - 1)) * W).toFixed(1)} ${yOf(v).toFixed(1)}`).join(" ");
  const over = a95 > LIMIT;
  const [from, to] = FLOORS[(run + car) % FLOORS.length];

  return (
    <Widget size="small" index={index} label="Elevator ride quality">
      <WidgetHeader icon={<Pulse20Filled />} tint="var(--ios-indigo)" title="Ride Quality" subtitle={`Car ${c.id} · ${from} → ${to}`} />

      <div className="mt-2 flex gap-1">
        {CARS.map((x, i) => (
          <motion.button
            key={x.id}
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => setCar(i)}
            aria-label={`Car ${x.id}`}
            aria-pressed={i === car}
            className={cn(
              "relative h-[22px] flex-1 cursor-pointer rounded-md text-[12px] font-semibold transition-colors",
              i === car ? "text-[var(--widget-surface)]" : "bg-fill-tertiary text-secondary hover:bg-fill-secondary",
            )}
          >
            {i === car ? <motion.span layoutId={`rq-chip-${index ?? 0}`} className="absolute inset-0 rounded-md bg-heading" transition={{ type: "spring", stiffness: 500, damping: 34 }} /> : null}
            <span className="relative">{x.id}</span>
            {x.base > LIMIT ? <span className="absolute top-1 right-1 size-1.5 rounded-full bg-ios-orange" /> : null}
          </motion.button>
        ))}
      </div>

      <div className="mt-2 whitespace-nowrap">
        <div className="leading-none">
          <AnimatedNumber value={a95} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} className={cn("text-[26px] font-semibold tracking-tight", over ? "text-ios-orange" : "text-heading")} />
          <span className="ml-1 text-[12px] font-medium text-tertiary">mg A95</span>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={over ? "over" : "ok"}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.15 }}
            className={cn("mt-1 text-[11px] leading-none", over ? "font-semibold text-ios-orange" : "text-tertiary")}
          >
            {over ? "Check guide rollers" : a95 < 15 ? `Smooth · limit ${LIMIT} mg` : `Fair · limit ${LIMIT} mg`}
          </motion.div>
        </AnimatePresence>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-auto h-11 w-full overflow-hidden" aria-hidden>
        {[LIMIT / 2, -LIMIT / 2].map((l) => (
          <line key={l} x1="0" x2={W} y1={yOf(l)} y2={yOf(l)} strokeWidth="1" strokeDasharray="2 2" className="stroke-fill" />
        ))}
        <motion.path
          key={`${car}-${run}`}
          d={d}
          fill="none"
          strokeWidth="1.2"
          strokeLinejoin="round"
          className={over ? "stroke-[var(--ios-orange)]" : "stroke-secondary"}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: run === 0 ? 1.2 : 1.8, ease: "linear", delay: run === 0 ? delay : 0 }}
        />
        {reduce ? null : (
          <motion.line
            key={`scan-${car}-${run}`}
            y1="0"
            y2={H}
            strokeWidth="1"
            className="stroke-tertiary"
            initial={{ x1: 0, x2: 0, opacity: 0.9 }}
            animate={{ x1: W, x2: W, opacity: 0 }}
            transition={{ duration: run === 0 ? 1.2 : 1.8, ease: "linear", delay: run === 0 ? delay : 0 }}
          />
        )}
      </svg>
    </Widget>
  );
}
