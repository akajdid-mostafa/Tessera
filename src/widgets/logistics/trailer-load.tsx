import { Dismiss16Regular, LockClosed16Filled, VehicleTruckProfile20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

/* A 13.6 m curtainsider takes 33 euro pallets, three abreast, eleven deep. */
const COLS = 11;
const ROWS = 3;
const SLOTS = COLS * ROWS;
const MAX_KG = 24000;
const LOAD_MS = 1500;
const CONFIRM_MS = 5000;
const SKUS = ["Pasta 20×500 g", "Olive oil 6×1 L", "Detergent 4×5 L", "Tissue 24-pack", "Tomato tins 24×400 g", "Flour 10×1 kg"];
const kgOf = (i: number) => 420 + ((i * 137 + 61) % 340);
const skuOf = (i: number) => SKUS[(i * 7 + 3) % SKUS.length];
/* Loaded nose first: slot i fills column floor(i / 3), lane i % 3. */
const orderAt = (col: number, row: number) => col * ROWS + row;

type Phase = "loading" | "confirm" | "sealed";

/** Logistics · medium. A trailer filling pallet by pallet from the nose as the forklift loads it, weight against the 24 t limit; when it is full, seal it with a confirm step and the next trailer backs on. */
export function TrailerLoadWidget({ index }: { index?: number }) {
  const [loaded, setLoaded] = useState(22);
  const [phase, setPhase] = useState<Phase>("loading");
  const [trailer, setTrailer] = useState(4471);
  const [seal, setSeal] = useState(482190);
  const [fresh, setFresh] = useState(true);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setTimeout(() => setFresh(false), (delay + 1.2) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (phase !== "loading" || loaded >= SLOTS) return;
    const t = window.setTimeout(() => setLoaded((n) => Math.min(SLOTS, n + 1)), LOAD_MS);
    return () => window.clearTimeout(t);
  }, [phase, loaded]);

  useEffect(() => {
    if (phase !== "confirm") return;
    const t = window.setTimeout(() => setPhase("loading"), CONFIRM_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  // A sealed trailer pulls away and the next one backs on, already part-loaded.
  useEffect(() => {
    if (phase !== "sealed") return;
    const t = window.setTimeout(() => {
      setTrailer((n) => n + 6);
      setSeal((n) => n + 1);
      setLoaded(9);
      setPhase("loading");
    }, 4200);
    return () => window.clearTimeout(t);
  }, [phase]);

  const kg = Array.from({ length: loaded }, (_, i) => kgOf(i)).reduce((a, b) => a + b, 0);
  const full = loaded >= SLOTS;

  return (
    <Widget size="medium" index={index} label="Trailer loading">
      <WidgetHeader
        icon={<VehicleTruckProfile20Filled />}
        tint={phase === "sealed" ? "var(--ios-green)" : "var(--ios-blue)"}
        title={`Trailer TRL-${trailer}`}
        subtitle="Door 6 · to Dallas hub · ETD 15:30"
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={phase === "sealed" ? "sealed" : full ? "full" : "loading"}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
                phase === "sealed"
                  ? "bg-ios-green/15 text-ios-green"
                  : full
                    ? "bg-ios-blue/15 text-ios-blue"
                    : "bg-fill-tertiary text-secondary",
              )}
            >
              {phase === "sealed" ? (
                <>
                  <LockClosed16Filled className="size-3" /> Sealed
                </>
              ) : full ? (
                "Ready to seal"
              ) : (
                <>
                  <span className="size-1.5 animate-pulse rounded-full bg-ios-blue" /> Loading
                </>
              )}
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="mt-3 flex items-center gap-3">
        {/* top view: cab on the left, rear doors on the right */}
        <motion.div
          key={trailer}
          className="flex min-w-0 flex-1 items-center"
          initial={{ x: fresh ? 0 : 40, opacity: fresh ? 1 : 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 160, damping: 22 }}
        >
          <div className="relative mr-1 h-[46px] w-[18px] shrink-0 rounded-l-[9px] rounded-r-[3px] bg-fill-secondary">
            <span className="absolute inset-y-[7px] left-[3px] w-[4px] rounded-full bg-fill" />
          </div>
          <div className="min-w-0 flex-1 rounded-[6px] p-[3px] ring-1 ring-inset ring-[var(--ant-color-border)]">
            <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
              {Array.from({ length: ROWS }, (_, row) =>
                Array.from({ length: COLS }, (_, col) => {
                  const i = orderAt(col, row);
                  const on = i < loaded;
                  const heavy = kgOf(i) > 640;
                  return (
                    <Tooltip key={`${row}-${col}`} title={on ? `P${i + 1} · ${skuOf(i)} · ${kgOf(i)} kg` : `Slot ${i + 1} · empty`}>
                      <div
                        className="relative h-[17px] rounded-[3px] bg-fill-quaternary"
                        style={{ gridColumn: col + 1, gridRow: row + 1 }}
                      >
                        <AnimatePresence>
                          {on ? (
                            <motion.span
                              className={cn("absolute inset-0 rounded-[3px]", heavy ? "bg-ios-blue" : "bg-ios-blue/55")}
                              initial={{ x: 14, opacity: 0, scale: 0.7 }}
                              animate={{ x: 0, opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              whileHover={{ scale: 1.12 }}
                              transition={{
                                type: "spring",
                                stiffness: 380,
                                damping: 24,
                                delay: fresh ? delay + i * 0.025 : 0,
                              }}
                            />
                          ) : null}
                        </AnimatePresence>
                      </div>
                    </Tooltip>
                  );
                }),
              )}
            </div>
          </div>
          <div className="ml-[2px] h-[52px] w-[3px] shrink-0 rounded-full bg-fill" />
        </motion.div>

        <div className="w-[104px] shrink-0 leading-tight whitespace-nowrap">
          <div className="text-[11px] text-tertiary">Pallets</div>
          <div className="text-[28px] leading-none font-semibold tracking-tight text-heading">
            <AnimatedNumber value={loaded} />
            <span className="text-[14px] font-medium text-tertiary">/{SLOTS}</span>
          </div>
          <div className="mt-1 text-[11px] text-tertiary tabular">
            <AnimatedNumber
              value={kg / 1000}
              format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
              className="font-semibold text-secondary"
            />{" "}
            t of {MAX_KG / 1000} t
          </div>
          <div className="relative mt-1 h-1 overflow-hidden rounded-full bg-fill-secondary">
            <motion.span
              className="absolute inset-y-0 left-0 rounded-full bg-[var(--ant-color-text-secondary)]"
              initial={{ width: 0 }}
              animate={{ width: `${(kg / MAX_KG) * 100}%` }}
              transition={{ type: "spring", stiffness: 140, damping: 22, delay: fresh ? delay : 0 }}
            />
          </div>
        </div>
      </div>

      <div className="mt-auto flex h-7 items-center gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={phase === "sealed" ? "s" : full ? "f" : "l"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="min-w-0 flex-1 truncate text-[11px] text-tertiary tabular"
          >
            {phase === "sealed"
              ? `Seal #${seal} · released to yard`
              : full
                ? `Seal #${seal} ready · ${SLOTS} pallets scanned`
                : `Forklift F-03 · next ${skuOf(loaded)}`}
          </motion.span>
        </AnimatePresence>
        {phase === "confirm" ? (
          <>
            <Button size="small" shape="circle" variant="filled" color="default" icon={<Dismiss16Regular />} aria-label="Cancel" onClick={() => setPhase("loading")} />
            <Button
              size="small"
              color="orange"
              variant="filled"
              className="relative overflow-hidden"
              onClick={() => setPhase("sealed")}
            >
              Confirm seal
              <motion.span
                className="absolute bottom-0 left-0 h-[2px] bg-black/50"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: CONFIRM_MS / 1000, ease: "linear" }}
              />
            </Button>
          </>
        ) : phase === "sealed" ? null : (
          <Button
            size="small"
            type="primary"
            disabled={!full}
            icon={<LockClosed16Filled />}
            onClick={() => setPhase("confirm")}
          >
            Seal trailer
          </Button>
        )}
      </div>
    </Widget>
  );
}
