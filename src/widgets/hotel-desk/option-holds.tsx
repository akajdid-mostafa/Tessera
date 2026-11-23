import { Checkmark16Filled, CheckmarkCircle16Filled, Hourglass20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { useInterval, useTimeouts } from "./_parts-b";

type Hold = {
  id: string;
  name: string;
  /** A group option shows two faces. */
  group?: boolean;
  room: string;
  nights: string;
  /** Minutes until the option lapses and the room goes back on sale. */
  left: number;
  state?: "confirmed" | "released";
};

/** Minutes from now (15:08) to midnight: a hold under this expires today. */
const TO_MIDNIGHT = 8 * 60 + 52;

const START: Hold[] = [
  { id: "da", name: "Dana Mitchell", room: "38", nights: "Oct 22–25", left: 4 * 60 + 52 },
  { id: "tg", name: "Tour group", group: true, room: "27 +5", nights: "Oct 25–28", left: 7 * 60 + 40 },
  { id: "gt", name: "Globe Travel", room: "Unassigned", nights: "Oct 23–25", left: 31 * 60 + 10 },
];
const LATER: Hold = { id: "wg", name: "Wedding group", group: true, room: "Villas ×4", nights: "Oct 31–Nov 2", left: 5 * 60 + 20 };

const left = (m: number) => (m >= 24 * 60 ? `${Math.floor(m / 60 / 24)}d ${Math.floor(m / 60) % 24}h` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`);

/** Front desk · small. Tentative stays by when their option lapses, counting down live; Confirm turns one into a reservation with a check, Release lets it fade out and frees the room. */
export function OptionHoldsWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const later = useTimeouts();
  const [holds, setHolds] = useState(START);
  const [sel, setSel] = useState<string>(START[0].id);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), (delay + 1) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  // The clock runs: a minute off every hold every two seconds.
  useInterval(() => setHolds((hs) => hs.map((h) => (h.state ? h : { ...h, left: Math.max(0, h.left - 1) }))), 2000);

  // With nothing open, a new option comes in.
  const open = holds.filter((h) => !h.state);
  useEffect(() => {
    if (holds.length) return;
    const t = window.setTimeout(() => {
      setHolds([LATER, ...START.map((h) => ({ ...h, id: `${h.id}2` }))]);
      setSel(LATER.id);
    }, 5000);
    return () => window.clearTimeout(t);
  }, [holds.length]);

  const today = open.filter((h) => h.left <= TO_MIDNIGHT).length;
  const cur = open.find((h) => h.id === sel) ?? open[0] ?? null;

  const act = (state: "confirmed" | "released") => {
    if (!cur) return;
    const id = cur.id;
    const next = open.find((h) => h.id !== id)?.id;
    setHolds((hs) => hs.map((h) => (h.id === id ? { ...h, state } : h)));
    if (next) setSel(next);
    if (state === "released") setHolds((hs) => hs.filter((h) => h.id !== id));
    else later(() => setHolds((hs) => hs.filter((h) => h.id !== id)), 1300);
  };

  return (
    <Widget size="small" index={index} label="Option holds">
      <WidgetHeader
        icon={<Hourglass20Filled />}
        tint="var(--ios-orange)"
        title="Option holds"
        subtitle={
          today ? (
            <span className="text-ios-orange">
              <AnimatedNumber value={today} /> expire today
            </span>
          ) : (
            "None expire today"
          )
        }
      />

      <div className="relative mt-1.5 flex min-h-0 flex-1 flex-col gap-1">
        <AnimatePresence mode="popLayout" initial={false}>
          {holds.slice(0, 2).map((h, i) => {
            const on = cur?.id === h.id;
            const soon = h.left <= TO_MIDNIGHT;
            const done = h.state === "confirmed";
            return (
              <motion.button
                key={h.id}
                type="button"
                layout
                disabled={!!h.state}
                onClick={() => setSel(h.id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, filter: "blur(4px)", transition: { duration: 0.35 } }}
                transition={{ type: "spring", stiffness: 380, damping: 30, delay: entered ? 0 : delay + i * 0.07 }}
                className={cn(
                  "relative flex h-[36px] shrink-0 cursor-pointer items-center gap-1.5 overflow-hidden rounded-[8px] px-1 text-left transition-colors",
                  on ? "bg-fill-tertiary" : "hover:bg-fill-quaternary",
                  done && "bg-ios-green/12",
                )}
              >
                {h.group ? (
                  <span className="flex w-[22px] shrink-0">
                    <MemojiAvatar who={h.name} size={16} className="ring-1 ring-[var(--widget-surface)]" />
                    <MemojiAvatar who={`${h.name} 2`} size={16} className="-ml-2.5 mt-1.5 ring-1 ring-[var(--widget-surface)]" />
                  </span>
                ) : (
                  <MemojiAvatar who={h.name} size={22} />
                )}
                <span className="min-w-0 flex-1 leading-[12px]">
                  <span className="block truncate text-[11.5px] font-semibold text-heading">{h.name}</span>
                  <span className="block truncate text-[9.5px] text-tertiary tabular">
                    {done ? "Confirmed · reserved" : h.nights}
                  </span>
                </span>
                <AnimatePresence mode="popLayout" initial={false}>
                  {done ? (
                    <motion.span
                      key="ok"
                      className="grid size-[18px] place-items-center rounded-full bg-ios-green text-white"
                      initial={{ scale: 0, rotate: -60 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 520, damping: 16 }}
                    >
                      <Checkmark16Filled className="size-3" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="left"
                      className={cn("text-[10.5px] font-semibold whitespace-nowrap tabular", soon ? "text-ios-orange" : "text-tertiary")}
                      exit={{ opacity: 0, scale: 0.6 }}
                    >
                      {left(h.left)}
                    </motion.span>
                  )}
                </AnimatePresence>
                {/* What is left of the last day of the option. */}
                {!done ? (
                  <span className="absolute inset-x-1 bottom-0 h-[2px] overflow-hidden rounded-full bg-fill-tertiary">
                    <motion.span
                      className={cn("block h-full origin-left rounded-full", soon ? "bg-ios-orange" : "bg-fill-secondary")}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: Math.min(1, h.left / (24 * 60)) }}
                      transition={{ type: "spring", stiffness: 90, damping: 20, delay: entered ? 0 : delay + 0.2 + i * 0.07 }}
                    />
                  </span>
                ) : null}
              </motion.button>
            );
          })}
        </AnimatePresence>
        {holds.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="m-auto flex flex-col items-center gap-1 text-center"
          >
            <CheckmarkCircle16Filled className="text-[22px] text-ios-green" />
            <div className="text-[11.5px] font-semibold text-heading">No options open</div>
          </motion.div>
        ) : null}
      </div>

      <div className="mt-auto grid grid-cols-2 gap-1.5 pt-1">
        <Button size="small" variant="filled" color="default" disabled={!cur} onClick={() => act("released")}>
          Release
        </Button>
        <Button
          size="small"
          color="green"
          variant="filled"
          disabled={!cur}
          onClick={() => act("confirmed")}
          className="font-semibold"
        >
          Confirm
        </Button>
      </div>
    </Widget>
  );
}
