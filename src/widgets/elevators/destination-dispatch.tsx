import { Keyboard20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const FLOORS = Array.from({ length: 12 }, (_, i) => i + 2);
/** Lobby layout: A C E on the left wall, B D F on the right. F is out of service. */
const CARS = ["A", "B", "C", "D", "E", "F"] as const;
type CarId = (typeof CARS)[number];
const OOS: CarId = "F";
/** Zoned grouping: each pair of cars serves a band of floors. */
const zone = (f: number): CarId[] => (f <= 5 ? ["A", "B"] : f <= 9 ? ["C", "D"] : ["E"]);
const RIDERS: Record<CarId, { floors: number[]; who: string[] }> = {
  A: { floors: [3, 4], who: ["f2"] },
  B: { floors: [5], who: ["m4", "f6"] },
  C: { floors: [7, 8], who: ["m1"] },
  D: { floors: [6, 9], who: ["f8", "m9"] },
  E: { floors: [11, 13], who: ["m5", "f1", "m7"] },
  F: { floors: [], who: [] },
};

type Assign = { floor: number; car: CarId; eta: number };

/** Elevators · medium. A destination-dispatch lobby kiosk: tap a floor and a car is assigned with its walk side, ETA countdown and the riders grouped with you; car F is out of service. */
export function DestinationDispatchWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [a, setA] = useState<Assign | null>({ floor: 9, car: "D", eta: 14 });
  const [wait, setWait] = useState(21);

  useEffect(() => {
    if (!a) return;
    const t = window.setTimeout(() => {
      if (a.eta > 0) setA({ ...a, eta: a.eta - 1 });
      else setA(null);
    }, a.eta > 0 ? 1000 : 4500);
    return () => window.clearTimeout(t);
  }, [a]);

  const pick = (floor: number) => {
    const opts = zone(floor);
    const car = opts[(floor + (a?.floor ?? 0)) % opts.length];
    const eta = 8 + ((floor * 7) % 19);
    setA({ floor, car, eta });
    setWait((w) => Math.round((w * 9 + eta) / 10));
  };

  const riders = a ? RIDERS[a.car] : null;
  const left = a ? ["A", "C", "E"].includes(a.car) : false;

  return (
    <Widget size="medium" index={index} label="Destination dispatch lobby">
      <WidgetHeader
        icon={<Keyboard20Filled />}
        tint="var(--ios-purple)"
        title="Destination Dispatch"
        subtitle="Lobby kiosk · floors 2–13"
        extra={
          <div className="text-right leading-tight">
            <div className="text-[11px] text-tertiary">Avg wait</div>
            <div className="text-[15px] font-semibold text-heading">
              <AnimatedNumber value={wait} />
              <span className="ml-0.5 text-[11px] font-medium text-tertiary">s</span>
            </div>
          </div>
        }
      />

      <div className="mt-2 flex min-h-0 flex-1 gap-3">
        <div className="grid w-[176px] shrink-0 grid-cols-4 grid-rows-3 gap-1">
          {FLOORS.map((f, i) => {
            const on = a?.floor === f;
            return (
              <motion.button
                key={f}
                type="button"
                onClick={() => pick(f)}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: delay + i * 0.025, type: "spring", stiffness: 380, damping: 24 }}
                whileTap={reduce ? undefined : { scale: 0.88 }}
                className={cn(
                  "cursor-pointer rounded-lg text-[14px] font-semibold tabular outline-none transition-colors",
                  on ? "bg-ios-purple text-white" : "bg-fill-tertiary text-heading hover:bg-fill-secondary",
                )}
              >
                {f}
              </motion.button>
            );
          })}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2.5">
            <div className="relative grid size-[50px] shrink-0 place-items-center rounded-[14px] bg-fill-tertiary">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={a ? `${a.car}-${a.floor}` : "none"}
                  initial={{ scale: 0.3, opacity: 0, rotate: -12 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 1.4, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 18 }}
                  className={cn("text-[30px] leading-none font-bold", a ? "text-ios-purple" : "text-tertiary")}
                >
                  {a ? a.car : "?"}
                </motion.span>
              </AnimatePresence>
              {a && a.eta === 0 && !reduce ? (
                <motion.span
                  className="absolute inset-0 rounded-[14px] ring-2 ring-ios-purple"
                  animate={{ opacity: [0.9, 0], scale: [1, 1.25] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 leading-tight whitespace-nowrap">
              {a ? (
                <>
                  <div className="truncate text-[14px] font-semibold text-heading">
                    {a.eta === 0 ? `Car ${a.car} boarding` : `Go to car ${a.car}`}
                  </div>
                  <div className="truncate text-[11px] text-tertiary">
                    {left ? "← Left" : "Right →"} · to {[...new Set([a.floor, ...(riders?.floors ?? [])])].sort((x, y) => x - y).join(", ")}
                  </div>
                  <div className="text-[11px] text-secondary tabular">
                    {a.eta > 0 ? (
                      <>
                        ETA <AnimatedNumber value={a.eta} trend={-1} className="font-semibold" /> s
                      </>
                    ) : (
                      <span className="font-semibold text-ios-green">Doors open</span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[14px] font-semibold text-heading">Where to?</div>
                  <div className="text-[11px] text-tertiary">Tap your floor</div>
                </>
              )}
            </div>
          </div>

          <div className="mt-auto flex items-end gap-2">
            <Lobby car={a?.car ?? null} />
            {riders && riders.who.length ? (
              <span className="mb-0.5 flex shrink-0">
                {riders.who.map((w, i) => (
                  <MemojiAvatar key={w} who={w} size={20} className={cn("ring-[1.5px] ring-[var(--widget-surface)]", i > 0 && "-ml-1.5")} />
                ))}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Widget>
  );
}

/** Lobby plan: three cars each side of the hall, the assigned one lit and car F crossed out. */
function Lobby({ car }: { car: CarId | null }) {
  const pos: Record<CarId, [number, number]> = { A: [4, 0], C: [36, 0], E: [68, 0], B: [4, 33], D: [36, 33], F: [68, 33] };
  return (
    <svg viewBox="0 0 100 44" width="100" height="44" className="shrink-0" aria-hidden>
      <rect x="0" y="12" width="100" height="20" rx="3" style={{ fill: "var(--ant-color-fill-quaternary)" }} />
      {CARS.map((c) => {
        const [x, y] = pos[c];
        const on = car === c;
        const oos = c === OOS;
        return (
          <g key={c}>
            <motion.rect
              x={x}
              y={y}
              width="28"
              height="11"
              rx="2"
              animate={{ opacity: on ? 1 : 0.9 }}
              style={{ fill: on ? "var(--ios-purple)" : "var(--ant-color-fill-secondary)" }}
            />
            <text x={x + 14} y={y + 8.5} textAnchor="middle" fontSize="9" fontWeight="700" style={{ fill: on ? "#fff" : "var(--ant-color-text-tertiary)" }}>
              {c}
            </text>
            {oos ? <path d={`M${x + 2} ${y + 1}l24 9M${x + 26} ${y + 1}l-24 9`} strokeWidth="1.2" style={{ stroke: "var(--ios-red)" }} /> : null}
          </g>
        );
      })}
    </svg>
  );
}
