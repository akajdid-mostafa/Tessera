import { ShieldCheckmark16Regular, VehicleCar20Filled, VehicleCarCollision16Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Switch } from "@/registry/antuikit/ui/switch";

/* A return (`HandoverKind` "in") of KY-26-0377: full-to-full fuel policy, so every missing eighth is charged. */
const OUT_KM = 17602;
const IN_KM = 18214;
const EIGHTHS = 8;
const START_FUEL = 5;
const USD_PER_EIGHTH = 12;
const LATE_START = 26;
const LATE_ORANGE = 30;
const LATE_TICK_MS = 4000;
const GROUP = { useGrouping: true } as const;

/** Tour ops · small. A rental car coming back: tap or drag the eight fuel segments to record the level, the odometer rolls in, and the late chip turns orange past 30 minutes. */
export function RentalHandoverWidget({ index }: { index?: number }) {
  const [ready, setReady] = useState(false);
  const [settled, setSettled] = useState(false);
  const [fuel, setFuel] = useState(START_FUEL);
  const [late, setLate] = useState(LATE_START);
  const [damage, setDamage] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const a = window.setTimeout(() => setReady(true), delay * 1000);
    const b = window.setTimeout(() => setSettled(true), delay * 1000 + 900);
    const t = window.setInterval(() => setLate((m) => (m >= 59 ? LATE_START : m + 1)), LATE_TICK_MS);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
      window.clearInterval(t);
    };
  }, [delay]);

  const pick = (clientX: number) => {
    const r = bar.current?.getBoundingClientRect();
    if (!r) return;
    const ratio = (clientX - r.left) / r.width;
    setFuel(ratio < 0.04 ? 0 : Math.max(0, Math.min(EIGHTHS, Math.ceil(ratio * EIGHTHS))));
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    dragging.current = true;
    pick(e.clientX);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) pick(e.clientX);
  };
  const onUp = () => {
    dragging.current = false;
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") setFuel((f) => Math.min(EIGHTHS, f + 1));
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") setFuel((f) => Math.max(0, f - 1));
    else return;
    e.preventDefault();
  };

  const shown = ready ? fuel : 0;
  const tone = fuel <= 2 ? "bg-ios-red" : fuel <= 4 ? "bg-ios-orange" : "bg-ios-green";
  const isLate = late >= LATE_ORANGE;
  const charge = (EIGHTHS - fuel) * USD_PER_EIGHTH;

  return (
    <Widget size="small" index={index} label="Rental handover">
      <WidgetHeader icon={<VehicleCar20Filled />} tint="var(--ios-blue)" title="KKY 301" subtitle="Nissan Versa · Return" />

      <div className="mt-2.5 flex items-center justify-between gap-1">
        <div className="flex items-baseline text-[22px] leading-none font-semibold tracking-tight text-heading">
          <AnimatedNumber value={ready ? IN_KM : OUT_KM} format={GROUP} />
          <span className="ml-0.5 text-[11px] font-medium text-tertiary">km</span>
        </div>
        <motion.span
          key={isLate ? "late" : "ok"}
          initial={{ scale: isLate ? 1.25 : 1 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 14 }}
          className={cn(
            "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap tabular transition-colors duration-500",
            isLate ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-tertiary text-secondary",
          )}
        >
          Late <AnimatedNumber value={late} /> min
        </motion.span>
      </div>
      <div className="mt-1 truncate text-[11px] text-tertiary tabular">
        +<AnimatedNumber value={ready ? IN_KM - OUT_KM : 0} /> km since pickup
      </div>

      <div className="mt-auto">
        <div className="flex items-baseline text-[11px] text-secondary">
          Fuel
          <span className="ml-1 font-semibold text-heading tabular">
            {fuel}/{EIGHTHS}
          </span>
          <span className="ml-auto">
            <AnimatePresence mode="popLayout" initial={false}>
              {charge > 0 ? (
                <motion.span
                  key="charge"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="font-semibold text-ios-orange tabular"
                >
                  Refuel <AnimatedNumber value={charge} prefix="$" format={GROUP} />
                </motion.span>
              ) : (
                <motion.span
                  key="full"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="font-semibold text-ios-green"
                >
                  Full tank
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </div>
        <div
          ref={bar}
          role="slider"
          tabIndex={0}
          aria-label="Fuel in eighths"
          aria-valuemin={0}
          aria-valuemax={EIGHTHS}
          aria-valuenow={fuel}
          className="mt-1.5 flex h-[18px] cursor-pointer touch-none gap-[3px] rounded-[5px] outline-none select-none focus-visible:ring-2 focus-visible:ring-ios-blue"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onKeyDown={onKey}
        >
          {Array.from({ length: EIGHTHS }, (_, i) => (
            <span key={i} className="relative flex-1 overflow-hidden rounded-[4px] bg-fill-secondary">
              <motion.span
                className={cn("absolute inset-0 origin-bottom rounded-[4px] transition-colors duration-300", tone)}
                initial={false}
                animate={{ scaleY: i < shown ? 1 : 0, opacity: i < shown ? 1 : 0 }}
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 26,
                  delay: settled ? 0 : i * 0.06,
                }}
              />
            </span>
          ))}
        </div>

        <div className="mt-2 flex h-5 items-center gap-1.5">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={damage ? "dmg" : "ok"}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              className={cn("flex min-w-0 flex-1 items-center gap-1 text-[11px]", damage ? "text-ios-red" : "text-secondary")}
            >
              {damage ? (
                <VehicleCarCollision16Regular className="shrink-0" />
              ) : (
                <ShieldCheckmark16Regular className="shrink-0 text-ios-green" />
              )}
              <span className="truncate">{damage ? "Scratch, rear bumper" : "No damage"}</span>
            </motion.span>
          </AnimatePresence>
          <Switch size="small" color="error" checked={damage} onChange={setDamage} aria-label="Damage note" />
        </div>
      </div>
    </Widget>
  );
}
