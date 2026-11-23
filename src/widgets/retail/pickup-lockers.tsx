import { ArrowUndo16Regular, BoxMultiple20Filled, Checkmark16Filled, Send16Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

type Parcel = { order: string; name: string; hours: number };
type Door = { n: number; parcel: Parcel | null; reminded?: boolean };

const EXPIRE_H = 72;
const NAMES = ["Hannah Webb", "Luis Ortega", "Mei Tanaka", "Sam Adeyemi", "Clara Novak", "Idris Shah", "June Park", "Owen Hale", "Rosa Lind", "Theo Marsh", "Ada Brooks", "Kofi Mensah", "Nina Volkova", "Paolo Greco"];
const FILLED: Record<number, number> = { 1: 6, 2: 30, 4: 77, 5: 2, 7: 14, 8: 51, 10: 9, 11: 3, 13: 40, 15: 22, 16: 81, 18: 1, 19: 19, 21: 60, 22: 5, 23: 11 };

const START: Door[] = Array.from({ length: 24 }, (_, k) => {
  const n = k + 1;
  const h = FILLED[n];
  return {
    n,
    parcel: h === undefined ? null : { order: `#${40180 + n * 7}`, name: NAMES[n % NAMES.length], hours: h },
  };
});

const age = (h: number) => (h < 1 ? "just now" : h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h`);
const two = (n: number) => String(n).padStart(2, "0");

/** Retail · medium. The click-and-collect locker bank with loaded, empty and expired doors; customers collect live and doors swing open, and a tap picks a door to remind its customer or pull an expired parcel back to stock. */
export function PickupLockersWidget({ index }: { index?: number }) {
  const [doors, setDoors] = useState(START);
  const [sel, setSel] = useState(4);
  const [opening, setOpening] = useState<number | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  const doorsRef = useRef(doors);
  useEffect(() => {
    doorsRef.current = doors;
  }, [doors]);

  // A customer scans their code every few seconds and their door swings open, then empties;
  // otherwise the stockroom loads a fresh web order into a free door.
  useEffect(() => {
    const t = window.setInterval(() => {
      const ds = doorsRef.current;
      const ready = ds.filter((d) => d.parcel && d.parcel.hours < EXPIRE_H && d.n !== sel);
      if (ready.length > 6 && Math.random() < 0.65) {
        setOpening(ready[Math.floor(Math.random() * ready.length)].n);
        return;
      }
      const empty = ds.filter((d) => !d.parcel && d.n !== sel);
      if (!empty.length) return;
      const n = empty[Math.floor(Math.random() * empty.length)].n;
      const parcel = { order: `#${40400 + Math.floor(Math.random() * 99)}`, name: NAMES[Math.floor(Math.random() * NAMES.length)], hours: 0 };
      setDoors((xs) => xs.map((x) => (x.n === n ? { n, parcel } : x)));
    }, 4200);
    return () => window.clearInterval(t);
  }, [sel]);

  useEffect(() => {
    if (opening === null) return;
    const t = window.setTimeout(() => {
      setDoors((ds) => ds.map((x) => (x.n === opening ? { n: x.n, parcel: null } : x)));
      setOpening(null);
    }, 1300);
    return () => window.clearTimeout(t);
  }, [opening]);

  const ready = doors.filter((d) => d.parcel && d.parcel.hours < EXPIRE_H).length;
  const expired = doors.filter((d) => d.parcel && d.parcel.hours >= EXPIRE_H).length;
  const door = doors.find((d) => d.n === sel) ?? doors[0];
  const p = door.parcel;
  const isExpired = !!p && p.hours >= EXPIRE_H;

  return (
    <Widget size="medium" index={index} label="Pickup lockers">
      <WidgetHeader
        icon={<BoxMultiple20Filled />}
        tint="var(--ios-teal)"
        title="Pickup Lockers"
        subtitle={
          <>
            <AnimatedNumber value={ready} /> ready ·{" "}
            <span className={cn(expired && "font-medium text-ios-orange")}>
              <AnimatedNumber value={expired} /> expired
            </span>{" "}
            · 24 doors
          </>
        }
      />

      <div className="mt-2 flex min-h-0 flex-1 gap-3">
        <div className="grid w-[214px] shrink-0 grid-cols-8 grid-rows-3 gap-[3px] rounded-[10px] bg-fill-tertiary p-[3px]">
          {doors.map((d, k) => {
            const exp = !!d.parcel && d.parcel.hours >= EXPIRE_H;
            const isOpen = opening === d.n;
            return (
              <button
                key={d.n}
                type="button"
                aria-label={`Door ${d.n}`}
                onClick={() => setSel(d.n)}
                className={cn(
                  "relative cursor-pointer rounded-[5px] bg-fill-quaternary [perspective:120px]",
                  sel === d.n && "ring-1 ring-inset ring-sel",
                )}
              >
                <motion.span
                  className={cn(
                    "absolute inset-0 flex flex-col items-center justify-between rounded-[5px] py-[3px] text-[9px] leading-none font-semibold tabular",
                    !d.parcel
                      ? "bg-fill-secondary text-tertiary"
                      : exp
                        ? "bg-ios-orange/15 text-ios-orange"
                        : "bg-ios-teal/15 text-ios-teal",
                  )}
                  style={{ transformOrigin: "left center" }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1, rotateY: isOpen ? -68 : 0 }}
                  transition={{
                    opacity: { delay: delay + k * 0.015 },
                    scale: { type: "spring", stiffness: 380, damping: 24, delay: delay + k * 0.015 },
                    rotateY: { type: "spring", stiffness: 160, damping: 16 },
                  }}
                >
                  <span>{two(d.n)}</span>
                  <span className={cn("h-[3px] w-2 rounded-full", d.parcel ? "bg-black/35" : "bg-fill")} />
                </motion.span>
              </button>
            );
          })}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={`${door.n}-${p?.order ?? "empty"}`}
              initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="leading-tight whitespace-nowrap"
            >
              <div className={cn("text-[11px] font-medium", isExpired ? "text-ios-orange" : p ? "text-ios-teal" : "text-tertiary")}>
                Door {two(door.n)} · {isExpired ? "Expired" : p ? "Ready" : "Empty"}
              </div>
              {p ? (
                <>
                  <div className="mt-0.5 text-[20px] font-semibold tracking-tight text-heading tabular">{p.order}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-secondary">
                    <MemojiAvatar who={p.name} size={20} />
                    <span className="truncate">{p.name}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-tertiary">
                    Waiting <span className={cn("font-medium", isExpired ? "text-ios-orange" : "text-secondary")}>{age(p.hours)}</span>
                    {isExpired ? " · over 72h" : ""}
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-0.5 text-[20px] font-semibold tracking-tight text-tertiary">Free</div>
                  <div className="mt-1 text-[11px] whitespace-normal text-tertiary">Next web order loads here.</div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-auto">
            {p && isExpired ? (
              <Button
                block
                size="small"
                variant="filled"
                color="orange"
                className="text-ios-orange"
                icon={<ArrowUndo16Regular />}
                onClick={() => setDoors((ds) => ds.map((x) => (x.n === door.n ? { n: x.n, parcel: null } : x)))}
              >
                Back to stock
              </Button>
            ) : p ? (
              <Button
                block
                size="small"
                variant="filled"
                color={door.reminded ? "green" : "cyan"}
                icon={door.reminded ? <Checkmark16Filled /> : <Send16Regular />}
                onClick={() => setDoors((ds) => ds.map((x) => (x.n === door.n ? { ...x, reminded: true } : x)))}
              >
                {door.reminded ? "Reminder sent" : "Send reminder"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Widget>
  );
}
