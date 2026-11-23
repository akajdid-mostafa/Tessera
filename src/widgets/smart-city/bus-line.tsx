import { VehicleBus16Filled, VehicleBus20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

const STOPS = ["Ballard", "Fremont", "Wallingford", "U District", "Ravenna", "Wedgwood", "Lake City"];
const RUN_MIN = 36;
const TARGET = 6;
const BUNCHED = 3;
const GAPPED = 10;
/** Fraction of the line covered per second; a calm, readable glide. */
const SPEED = 1 / 160;
const TICK = 200;

type Bus = { id: string; driver: string; who: string; p: number; lap: number };
const START: Bus[] = [
  { id: "4431", driver: "Tomás Ortega", who: "m2", p: 0.83, lap: 0 },
  { id: "4423", driver: "Rosa Díaz", who: "f6", p: 0.53, lap: 0 },
  { id: "4419", driver: "Kevin Young", who: "m9", p: 0.48, lap: 0 },
  { id: "4412", driver: "Marcus Lee", who: "m4", p: 0.22, lap: 0 },
  { id: "4407", driver: "Amy Dawson", who: "f2", p: 0.04, lap: 0 },
];

/** Minutes to the bus ahead, wrapping the lead bus to the last one. */
function headways(buses: Bus[]) {
  const sorted = [...buses].sort((a, b) => b.p - a.p);
  const out: Record<string, { min: number; ahead: number }> = {};
  sorted.forEach((b, i) => {
    const ahead = i === 0 ? sorted[sorted.length - 1].p + 1 : sorted[i - 1].p;
    out[b.id] = { min: (ahead - b.p) * RUN_MIN, ahead: Math.min(1, ahead) };
  });
  return out;
}
const tone = (min: number) => (min < BUNCHED ? "bunched" : min > GAPPED ? "gapped" : "ok");

/** Smart city · medium. Buses glide along the line with their headway drawn between them; a bunched pair pulses red until you hold the follower. */
export function BusLineWidget({ index }: { index?: number }) {
  const [buses, setBuses] = useState(START);
  const [sel, setSel] = useState("4419");
  const [held, setHeld] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => {
      setBuses((bs) =>
        bs.map((b) => {
          if (b.id === held) return b;
          const p = b.p + SPEED * (TICK / 1000);
          return p >= 1 ? { ...b, p: p - 1, lap: b.lap + 1 } : { ...b, p };
        }),
      );
    }, TICK);
    return () => window.clearInterval(t);
  }, [held]);

  const hw = headways(buses);
  useEffect(() => {
    if (held && hw[held].min >= TARGET) setHeld(null);
  }, [held, hw]);

  const bunchedCount = buses.filter((b) => tone(hw[b.id].min) === "bunched").length;
  const bus = buses.find((b) => b.id === sel)!;
  const h = hw[sel];
  const nextIdx = Math.min(STOPS.length - 1, Math.ceil(bus.p * (STOPS.length - 1) + 0.001));
  const next = STOPS[nextIdx];
  const last = STOPS.length - 1;
  const selTone = tone(h.min);

  return (
    <Widget size="medium" index={index} label="Bus line headway">
      <WidgetHeader
        icon={<VehicleBus20Filled />}
        tint="var(--ios-blue)"
        title="Line 44 · Ballard → Lake City"
        subtitle={`Headway target ${TARGET} min · 5 buses`}
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={bunchedCount ? "b" : "ok"}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                bunchedCount ? "bg-ios-red/15 text-ios-red" : "bg-fill-secondary text-secondary",
              )}
            >
              {bunchedCount ? "Bunching" : "On target"}
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="flex min-h-0 flex-1 items-center">
        <div className="relative mx-2 h-[48px] w-[calc(100%-16px)]">
          {/* The line and its stops. */}
          <div className="absolute inset-x-0 top-[25px] h-[3px] rounded-full bg-fill-secondary" />
          {STOPS.map((s, i) => {
            const x = (i / (STOPS.length - 1)) * 100;
            const label = i === nextIdx || (i === 0 && nextIdx !== 1) || (i === last && nextIdx !== last - 1);
            return (
              <div key={s} className="absolute top-[22px] -translate-x-1/2" style={{ left: `${x}%` }}>
                <span
                  className={cn(
                    "block size-[9px] rounded-full border-2 bg-[var(--widget-surface)]",
                    s === next ? "border-ios-blue" : "border-[var(--ant-color-text-tertiary)]",
                  )}
                />
                {label ? (
                  <span
                    className={cn(
                      "absolute top-[11px] text-[10px] whitespace-nowrap",
                      i === 0 ? "left-0" : i === STOPS.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2",
                      s === next ? "font-semibold text-ios-blue" : "text-tertiary",
                    )}
                  >
                    {s}
                  </span>
                ) : null}
              </div>
            );
          })}

          {/* Headway between each bus and the one ahead. */}
          {buses.map((b) => {
            const t = tone(hw[b.id].min);
            if (t === "ok") return null;
            const to = hw[b.id].ahead;
            return (
              <motion.div
                key={`gap-${b.id}`}
                className={cn("absolute top-[25px] h-[3px] rounded-full", t === "bunched" ? "bg-ios-red" : "bg-ios-yellow")}
                style={{ left: `${b.p * 100}%`, width: `${(to - b.p) * 100}%`, transition: `left ${TICK}ms linear, width ${TICK}ms linear` }}
                animate={t === "bunched" ? { opacity: [1, 0.35, 1] } : { opacity: 0.8 }}
                transition={t === "bunched" ? { duration: 1.2, repeat: Infinity } : undefined}
              />
            );
          })}

          {buses.map((b, i) => {
            const t = tone(hw[b.id].min);
            const isSel = b.id === sel;
            return (
              <Tooltip key={`${b.id}-${b.lap}`} title={`${b.id} · ${hw[b.id].min.toFixed(1)} min to bus ahead`}>
                <motion.button
                  type="button"
                  onClick={() => setSel(b.id)}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: b.lap ? 0 : 0.3 + (index ?? 0) * 0.06 + i * 0.07, type: "spring", stiffness: 300, damping: 22 }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "absolute top-0 grid size-[18px] -translate-x-1/2 cursor-pointer place-items-center rounded-full text-[11px] ring-2 ring-[var(--widget-surface)] outline-none",
                    isSel
                      ? t === "bunched"
                        ? "bg-ios-red text-white"
                        : "bg-ios-blue text-white"
                      : t === "bunched"
                        ? "bg-ios-red/20 text-ios-red"
                        : "bg-fill text-heading",
                    isSel && "z-10",
                  )}
                  style={{ left: `${b.p * 100}%`, transition: `left ${TICK}ms linear` }}
                  aria-label={`Bus ${b.id}`}
                >
                  <VehicleBus16Filled className="size-[11px]" />
                </motion.button>
              </Tooltip>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <MemojiAvatar who={bus.who} size={28} alt={bus.driver} />
        <div className="min-w-0 flex-1 leading-tight">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={sel}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="truncate text-[13px] font-medium text-heading"
            >
              Bus {bus.id} · {bus.driver}
            </motion.div>
          </AnimatePresence>
          <div className="truncate text-[11px] text-tertiary tabular">
            {held === sel ? `Holding at ${next} · ` : `Next ${next} · `}
            <span className={cn(selTone === "bunched" ? "text-ios-red" : selTone === "gapped" ? "text-ios-orange" : "text-secondary", "font-semibold")}>
              <AnimatedNumber value={h.min} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} /> min
            </span>{" "}
            headway
          </div>
        </div>
        {selTone === "bunched" || held === sel ? (
          <Button
            size="small"
            color="danger"
            variant="filled"
            loading={held === sel}
            disabled={held !== null && held !== sel}
            onClick={() => setHeld(sel)}
          >
            {held === sel ? "Holding" : "Hold bus"}
          </Button>
        ) : (
          <span className="text-[11px] whitespace-nowrap text-tertiary">Tap a bus</span>
        )}
      </div>
    </Widget>
  );
}
