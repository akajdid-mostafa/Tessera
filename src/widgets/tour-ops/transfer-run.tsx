import { AirplaneLanding20Filled, ArrowClockwise16Regular, Checkmark12Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { clock, hm, PingDot } from "./_parts-b";

/* The singles' arrival run at Flagstaff (seed `trn_kaibab_singles_arrival`): two legs, two hotel stops. */
const FLIGHTS = [
  { carrier: "AA", flightNo: "163", at: hm(15, 20), changedTo: null, pax: 2 },
  { carrier: "UA", flightNo: "573", at: hm(15, 50), changedTo: hm(16, 30), pax: 4 },
];
const STOPS = [
  { name: "Pickup · FLG", area: "Flagstaff Airport", at: hm(16, 5), pax: 6 },
  { name: "Red Rock Lodge", area: "Sedona", at: hm(17, 45), pax: 4 },
  { name: "Oak Creek Resort", area: "Oak Creek", at: hm(19, 15), pax: 2 },
];
const SHIFT = 40;
const CAPACITY = 7;
const PAX = FLIGHTS.reduce((s, f) => s + f.pax, 0);

/** Tour ops · medium. An airport arrival run with its legs, stops, seats and driver; the changed flight pulses until "Shift pickup" slides every stop 40 minutes later. */
export function TransferRunWidget({ index }: { index?: number }) {
  const [shifted, setShifted] = useState(false);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const offset = shifted ? SHIFT : 0;

  return (
    <Widget size="medium" index={index} label="Transfer run" glow={shifted ? undefined : { mode: "pulse", colors: ["#FF9F0A", "#FFD60A", "#FF9F0A"], blur: 18, duration: 2 }}>
      <WidgetHeader
        icon={<AirplaneLanding20Filled />}
        tint="var(--ios-teal)"
        title="FLG Arrival Run"
        subtitle="Thu, Nov 12 · AA 163 + UA 573 · 2 stops"
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            {shifted ? (
              <motion.span
                key="ok"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1 rounded-full bg-ios-green/15 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-ios-green"
              >
                <Checkmark12Filled />
                Re-timed
              </motion.span>
            ) : (
              <motion.span
                key="changed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 rounded-full bg-ios-orange/15 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-ios-orange"
              >
                <PingDot tone="bg-ios-orange" />
                Flight changed
              </motion.span>
            )}
          </AnimatePresence>
        }
      />

      <div className="mt-2.5 flex min-h-0 flex-1 gap-3">
        {/* Legs, seats, driver */}
        <div className="flex w-[156px] shrink-0 flex-col">
          {FLIGHTS.map((f) => {
            const alarm = f.changedTo !== null && !shifted;
            return (
              <Tooltip key={f.flightNo} title={`${f.carrier} ${f.flightNo} · ${f.pax} pax${f.changedTo ? ` · new landing ${clock(f.changedTo)}` : ""}`}>
                <div className="relative flex h-6 cursor-default items-center gap-1.5 rounded-md px-1">
                  {alarm ? (
                    <motion.span
                      className="absolute inset-0 rounded-md bg-ios-orange/15"
                      animate={{ opacity: [0.35, 1, 0.35] }}
                      transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                    />
                  ) : null}
                  <span className="relative grid h-4 w-6 shrink-0 place-items-center rounded-[4px] bg-fill-tertiary text-[9px] font-bold text-secondary">
                    {f.carrier}
                  </span>
                  {/* The chip names the carrier; repeating it wrapped the row once a changed time showed two clocks. */}
                  <span className="relative text-[12px] font-semibold whitespace-nowrap text-heading tabular">{f.flightNo}</span>
                  <span className="relative ml-auto flex items-baseline gap-1 text-[11px] whitespace-nowrap tabular">
                    {f.changedTo !== null ? (
                      <>
                        <span className="text-tertiary line-through">{clock(f.at)}</span>
                        <span className="font-semibold text-ios-orange">{clock(f.changedTo)}</span>
                      </>
                    ) : (
                      <span className="font-semibold text-heading">{clock(f.at)}</span>
                    )}
                  </span>
                </div>
              </Tooltip>
            );
          })}

          <div className="mt-2 px-1">
            <div className="flex items-baseline text-[11px] text-tertiary">
              In the Vito
              <span className="ml-auto text-[12px] font-semibold text-heading">
                <AnimatedNumber value={PAX} />
                <span className="font-normal text-tertiary">/{CAPACITY} seats</span>
              </span>
            </div>
            <div className="mt-1 flex gap-[3px]">
              {Array.from({ length: CAPACITY }, (_, i) => (
                <motion.span
                  key={i}
                  className={cn("h-2 flex-1 rounded-[3px]", i < PAX ? "bg-ios-teal" : "bg-fill-secondary")}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 380, damping: 20, delay: delay + 0.2 + i * 0.05 }}
                />
              ))}
            </div>
          </div>

          <div className="mt-auto flex items-center gap-2 px-1">
            <MemojiAvatar who="Chris Adams" size={24} />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[12px] font-medium text-heading">Chris Adams</div>
              <div className="truncate text-[10px] text-tertiary">Driver · Vito KAB 101</div>
            </div>
          </div>
        </div>

        {/* Stops */}
        <div className="flex min-w-0 flex-1 flex-col border-l-[0.5px] border-split pl-3">
          <div className="relative">
            <motion.span
              className="absolute top-3 bottom-3 left-[3px] w-[2px] origin-top rounded-full bg-fill-secondary"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
            />
            {STOPS.map((s, i) => {
              const at = s.at + offset;
              const conflict = i === 0 && !shifted;
              return (
                <div key={s.name} className="relative flex h-6 items-center gap-2">
                  <motion.span
                    className={cn(
                      "relative size-2 shrink-0 rounded-full ring-2 ring-[var(--widget-surface)]",
                      i === 0 ? (conflict ? "bg-ios-orange" : "bg-ios-teal") : "bg-fill",
                    )}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 18, delay: delay + 0.2 + i * 0.12 }}
                  />
                  <span className="min-w-0 flex-1 truncate text-[12px] text-heading">
                    {s.name}
                    <span className="text-[10px] text-tertiary"> · {s.pax}</span>
                  </span>
                  <span className="relative h-4 w-[34px] shrink-0 overflow-hidden text-right text-[12px] leading-4 font-semibold tabular">
                    <AnimatePresence initial={false}>
                      <motion.span
                        key={at}
                        className={cn("absolute inset-0", conflict ? "text-ios-orange" : "text-heading")}
                        initial={{ y: 16, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -16, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 26, delay: i * 0.09 }}
                      >
                        {clock(at)}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-auto">
            <AnimatePresence mode="popLayout" initial={false}>
              {shifted ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex h-6 items-center gap-1.5 text-[11px] text-secondary"
                >
                  <Checkmark12Filled className="shrink-0 text-ios-green" />
                  <span className="truncate">
                    Pickup now <span className="font-semibold text-heading tabular">{clock(STOPS[0].at + SHIFT)}</span>
                  </span>
                  <Button size="small" type="text" className="ml-auto -mr-1.5" onClick={() => setShifted(false)}>
                    Undo
                  </Button>
                </motion.div>
              ) : (
                <motion.div key="act" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  <Button
                    size="small"
                    block
                    color="orange"
                    variant="filled"
                    className="text-ios-orange"
                    icon={<ArrowClockwise16Regular />}
                    onClick={() => setShifted(true)}
                  >
                    Shift pickup +{SHIFT} min
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Widget>
  );
}
