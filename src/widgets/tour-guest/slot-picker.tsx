import { Checkmark16Filled, Star12Filled, Water20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { USD_FMT } from "./_parts-a";

type Slot = { time: string; sold: number; waitlist: number };

/* Verde River rafting: three 2-hour departures from Beasley Flat, 16 seats each. */
const CAPACITY = 16;
const PRICE = 120;
const PARTY = 2;
const SLOTS: Slot[] = [
  { time: "10:00", sold: 7, waitlist: 0 },
  { time: "13:00", sold: 14, waitlist: 0 },
  { time: "16:00", sold: 16, waitlist: 3 },
];
/** The morning raft keeps selling while the widget is open, down to this many seats left. */
const LIVE_FLOOR = 5;

/** Tour guest · medium. An activity's departure slots with live seats and the lead guide; tap a slot to select it, nearly-full slots shimmer and a full one offers the waitlist. */
export function SlotPickerWidget({ index }: { index?: number }) {
  const [slots, setSlots] = useState(SLOTS);
  const [sel, setSel] = useState<string | null>(null);
  const [held, setHeld] = useState<string | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlots((ss) =>
        ss.map((s, i) => (i === 0 && CAPACITY - s.sold - PARTY > LIVE_FLOOR ? { ...s, sold: s.sold + 1 } : s)),
      );
    }, 6500);
    return () => window.clearInterval(id);
  }, []);

  const pick = (time: string) => {
    setHeld(null);
    setSel((s) => (s === time ? null : time));
  };

  const chosen = slots.find((s) => s.time === sel) ?? null;
  const chosenFull = chosen ? chosen.sold >= CAPACITY : false;
  const total = chosen && !chosenFull ? PRICE * PARTY : 0;

  return (
    <Widget size="medium" index={index} label="Rafting slots">
      <WidgetHeader
        icon={<Water20Filled />}
        tint="var(--ios-teal)"
        title="Verde River Rafting"
        subtitle="Beasley Flat · Sat, Nov 14 · 2 h"
        extra={
          <Tooltip title="Jake Y. · Lead guide, 12 years · English, Spanish">
            <div className="flex shrink-0 cursor-default items-center gap-1.5">
              <MemojiAvatar who="m4" size={26} className="ring-[1.5px] ring-ios-teal/40" />
              <div className="leading-tight">
                <div className="text-[11px] font-semibold whitespace-nowrap text-heading">Jake Y.</div>
                <div className="flex items-center gap-0.5 text-[10px] font-semibold text-ios-orange tabular">
                  <Star12Filled className="size-2.5" />
                  4.9
                  <span className="font-normal text-tertiary">· 1,530</span>
                </div>
              </div>
            </div>
          </Tooltip>
        }
      />

      <div className="mt-2.5 grid grid-cols-3 gap-2">
        {slots.map((s, i) => {
          const isSel = sel === s.time;
          const full = s.sold >= CAPACITY;
          const mine = isSel && !full ? PARTY : 0;
          const left = CAPACITY - s.sold - mine;
          const free = CAPACITY - s.sold;
          const nearly = !full && free <= 3;
          const tone = full ? "var(--ios-red)" : nearly ? "var(--ios-orange)" : "var(--ios-teal)";
          return (
            <motion.button
              key={s.time}
              type="button"
              onClick={() => pick(s.time)}
              aria-pressed={isSel}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 28, delay: delay + i * 0.07 }}
              className="relative h-[78px] cursor-pointer overflow-hidden rounded-2xl bg-fill-quaternary p-2.5 text-left outline-none transition-colors duration-200 hover:bg-fill-tertiary"
            >
              {nearly ? (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-ios-orange/25 to-transparent"
                  initial={{ x: "-100%" }}
                  animate={{ x: "260%" }}
                  transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.9, ease: "easeInOut" }}
                />
              ) : null}
              {/* Selection is a calm 200 ms cross-fade: the old slot fades out as the new one fades in. */}
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-inset transition-opacity duration-200 ease-out",
                  full ? "bg-ios-orange/10 ring-ios-orange" : "bg-ios-blue/10 ring-ios-blue",
                  isSel ? "opacity-100" : "opacity-0",
                )}
              />

              <div className="relative flex h-[22px] items-center">
                <span className="text-[18px] leading-none font-semibold tracking-tight text-heading tabular">{s.time}</span>
                <AnimatePresence initial={false}>
                  {isSel ? (
                    <motion.span
                      key="tick"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className={cn(
                        "ml-auto grid size-[18px] place-items-center rounded-full",
                        full ? "bg-ios-orange/15 text-ios-orange" : "bg-ios-blue text-white",
                      )}
                    >
                      <Checkmark16Filled className="size-3" />
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </div>

              <div className="relative mt-2 flex gap-[2px]" aria-hidden>
                {Array.from({ length: CAPACITY }, (_, p) => {
                  const kind = p < s.sold ? "sold" : p < s.sold + mine ? "mine" : "free";
                  return (
                    <motion.span
                      key={p}
                      className="h-[6px] flex-1 rounded-full"
                      initial={{ scaleY: 0 }}
                      animate={{
                        scaleY: 1,
                        backgroundColor:
                          kind === "sold" ? tone : kind === "mine" ? "var(--ios-blue)" : "var(--ant-color-fill-secondary)",
                      }}
                      transition={{
                        scaleY: { type: "spring", stiffness: 500, damping: 20, delay: delay + 0.15 + i * 0.07 + p * 0.015 },
                        backgroundColor: { duration: 0.25 },
                      }}
                    />
                  );
                })}
              </div>

              <div
                className={cn(
                  "relative mt-1.5 truncate text-[11px] font-semibold whitespace-nowrap",
                  full ? "text-ios-red" : nearly ? "text-ios-orange" : "text-secondary",
                )}
              >
                {full ? (
                  isSel ? (
                    <>Waitlist #{s.waitlist + 1}</>
                  ) : (
                    <>
                      Full · <AnimatedNumber value={s.waitlist} /> waiting
                    </>
                  )
                ) : isSel && left === 0 ? (
                  "Last 2 are yours"
                ) : (
                  <>
                    <AnimatedNumber value={left} trend={-1} /> seat{left === 1 ? "" : "s"} left
                  </>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-auto flex h-7 items-center gap-2">
        <div className="min-w-0 flex-1 truncate text-[11px] text-tertiary">
          {chosen ? (
            <>
              <span className="font-semibold text-heading tabular">{chosen.time}</span> · {PARTY} guests · shared raft
            </>
          ) : (
            <>Pick a slot · {PARTY} guests · ${PRICE.toLocaleString("en-US")} pp</>
          )}
        </div>
        <AnimatedNumber
          value={total}
          prefix="$"
          format={USD_FMT}
          className={cn("text-[15px] font-semibold", total ? "text-heading" : "text-tertiary")}
        />
        <Button
          size="small"
          shape="round"
          type="primary"
          disabled={!chosen}
          aria-pressed={held === sel && !!sel}
          onClick={() => setHeld(sel)}
          icon={held && held === sel ? <Checkmark16Filled /> : undefined}
          className={cn(
            "font-semibold shadow-none",
            !chosen
              ? ""
              : held === sel
                ? "pointer-events-none border-0 bg-ios-green/15 text-ios-green"
                : chosenFull
                  ? "bg-ios-orange/15 text-ios-orange hover:bg-ios-orange/25"
                  : "bg-ios-blue hover:bg-ios-blue/85",
          )}
        >
          {held && held === sel ? (chosenFull ? "On waitlist" : "Held 15 min") : chosenFull ? "Join waitlist" : "Reserve"}
        </Button>
      </div>
    </Widget>
  );
}
