import { VehicleCarParking20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Lot = { id: string; name: string; sub: string; cap: number; occ: number; drift: number };
const LOTS: Lot[] = [
  { id: "pier", name: "Pier Garage", sub: "420 bays · $4/h", cap: 420, occ: 351, drift: 0 },
  { id: "shilshole", name: "Shilshole Lot", sub: "120 bays · $3/h", cap: 120, occ: 108, drift: 1.2 },
  { id: "ballard", name: "Ballard Ave", sub: "86 curb bays · 2 h max", cap: 86, occ: 52, drift: 0 },
];
/** Pricing target band: 60–85 % occupied leaves a free bay on most blocks. */
const BAND = [0.6, 0.85] as const;

/** Smart city · medium. Lots against the 60–85 % target band; counts tick live and tapping a lot pushes it to the guidance sign. */
export function ParkingWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [occ, setOcc] = useState(() => LOTS.map((l) => l.occ));
  const [sel, setSel] = useState<number | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => {
      setOcc((o) =>
        o.map((v, i) => {
          const l = LOTS[i];
          const step = Math.round((Math.random() - 0.5) * (l.cap > 200 ? 8 : 4) + l.drift);
          return Math.min(l.cap, Math.max(Math.round(l.cap * 0.4), v + step));
        }),
      );
    }, 2600);
    return () => window.clearInterval(t);
  }, []);

  const totalFree = LOTS.reduce((a, l, i) => a + l.cap - occ[i], 0);
  const signValue = sel === null ? totalFree : LOTS[sel].cap - occ[sel];
  const signLabel = sel === null ? "ALL" : LOTS[sel].name.split(" ")[0].toUpperCase();

  return (
    <Widget size="medium" index={index} label="Parking occupancy">
      <WidgetHeader
        icon={<VehicleCarParking20Filled />}
        tint="var(--ios-blue)"
        title="Parking"
        subtitle="Ballard center · target 60–85%"
        extra={
          <div className="flex items-center gap-1.5 rounded-lg bg-[#0d0d0f] px-2 py-1 font-mono text-[12px] leading-none font-semibold ring-1 ring-white/10">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={signLabel}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-[10px] text-white/55"
              >
                {signLabel}
              </motion.span>
            </AnimatePresence>
            <AnimatedNumber value={signValue} className={signValue === 0 ? "text-[#ff453a]" : "text-[#ffb340]"} />
          </div>
        }
      />

      <div className="mt-1.5 flex flex-1 flex-col divide-y-[0.5px] divide-split">
        {LOTS.map((l, i) => {
          const pct = occ[i] / l.cap;
          const free = l.cap - occ[i];
          const full = free === 0;
          const tone = full ? "red" : pct > 0.92 ? "orange" : "calm";
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => setSel((s) => (s === i ? null : i))}
              className={cn(
                "-mx-1.5 flex flex-1 cursor-pointer items-center gap-2 rounded-lg px-1.5 text-left whitespace-nowrap outline-none transition-colors",
                sel === i ? "bg-fill-tertiary" : "hover:bg-fill-quaternary",
              )}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-md text-[12px] font-bold",
                  full ? "bg-ios-red/15 text-ios-red" : "bg-fill-secondary text-secondary",
                )}
              >
                P
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[13px] font-medium text-heading">{l.name}</span>
                <span className={cn("block truncate text-[11px]", full ? "text-ios-red" : "text-tertiary")}>
                  {full ? "Full · diverting to Pier" : l.sub}
                </span>
              </span>
              <span className="relative h-1.5 w-[60px] shrink-0 overflow-hidden rounded-full bg-fill-secondary">
                <span
                  className="absolute inset-y-0 bg-ios-green/30"
                  style={{ left: `${BAND[0] * 100}%`, width: `${(BAND[1] - BAND[0]) * 100}%` }}
                />
                <motion.span
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full",
                    tone === "red" ? "bg-ios-red" : tone === "orange" ? "bg-ios-orange" : "bg-[var(--ant-color-text-secondary)]",
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct * 100}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20, delay: delay + i * 0.08 }}
                />
              </span>
              <span className="w-[40px] text-right leading-tight">
                <AnimatedNumber value={free} className="block text-[14px] font-semibold text-heading" />
                <span className="block text-[10px] text-tertiary">free</span>
              </span>
              <span
                className={cn(
                  "w-[42px] rounded-md py-0.5 text-center text-[11px] font-semibold tabular transition-colors",
                  tone === "red" ? "bg-ios-red text-white" : tone === "orange" ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-secondary text-secondary",
                )}
              >
                {full ? "FULL" : <AnimatedNumber value={pct} format={{ style: "percent", maximumFractionDigits: 0 }} />}
              </span>
            </button>
          );
        })}
      </div>
    </Widget>
  );
}
