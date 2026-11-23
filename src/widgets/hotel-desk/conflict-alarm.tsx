import {
  ArrowSwap16Regular,
  CalendarEdit16Regular,
  Checkmark16Filled,
  CheckmarkCircle20Filled,
  Dismiss16Regular,
  Flag16Regular,
  Warning20Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { RoomChip, Sheet, useTimeouts } from "./_parts-b";

type Way = "move" | "shorten" | "override";
type Conflict = {
  id: string;
  kind: "overlap" | "ooo";
  guest: string;
  /** The guest already in the room, or the out-of-order reason. */
  with: string;
  room: string;
  nights: string;
  moveTo: string;
  shorten: string;
};

const START: Conflict[] = [
  { id: "c7", kind: "overlap", guest: "Matt Kelly", with: "Amy Walker", room: "7", nights: "Oct 17–20", moveTo: "18", shorten: "start Oct 19" },
  { id: "c4", kind: "ooo", guest: "Brooke Sanders", with: "Broken AC", room: "4", nights: "Oct 14–16", moveTo: "22", shorten: "leave Oct 15" },
  { id: "c14", kind: "overlap", guest: "Alex Dean", with: "Emma Wilson", room: "14", nights: "Oct 19–22", moveTo: "21", shorten: "start Oct 22" },
];
/** Bookings that land later and clash again. */
const INCOMING: Conflict[] = [
  { id: "c16", kind: "overlap", guest: "Kevin Adams", with: "Sofia Rossi", room: "16", nights: "Oct 15–18", moveTo: "19", shorten: "start Oct 18" },
  { id: "c9", kind: "ooo", guest: "Megan Turner", with: "Water leak", room: "9", nights: "Oct 20–23", moveTo: "6", shorten: "leave Oct 20" },
];

const WAYS: { way: Way; label: string; icon: ReactNode; sub: (c: Conflict) => string; done: string }[] = [
  { way: "move", label: "Move", icon: <ArrowSwap16Regular />, sub: (c) => `to room ${c.moveTo}, free all nights`, done: "moved" },
  { way: "shorten", label: "Shorten", icon: <CalendarEdit16Regular />, sub: (c) => c.shorten, done: "shortened" },
  {
    way: "override",
    label: "Override",
    icon: <Flag16Regular />,
    sub: (c) => (c.kind === "ooo" ? "keep the room, flagged" : "overbook, flagged"),
    done: "overridden",
  },
];

/** Front desk · small. Stays that overlap in one room or sit in an out-of-order room, red while any are open; tap one for the three ways out and pick one to resolve it with a check while the count rolls down. */
export function ConflictAlarmWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const later = useTimeouts();
  const [list, setList] = useState(START);
  const [open, setOpen] = useState<string | null>(null);
  const [picked, setPicked] = useState<Way | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [fresh, setFresh] = useState(false);
  const [round, setRound] = useState(0);

  const n = list.length;
  const cur = list.find((c) => c.id === open) ?? null;

  // When the calendar is clear, the next clashing booking arrives a little later.
  useEffect(() => {
    if (n > 0) return;
    const t = window.setTimeout(() => {
      const next = INCOMING[round % INCOMING.length];
      setList([{ ...next, id: `${next.id}-${round}` }]);
      setRound((r) => r + 1);
      setFresh(true);
    }, 6000);
    return () => window.clearTimeout(t);
  }, [n, round]);

  useEffect(() => {
    if (!fresh) return;
    const t = window.setTimeout(() => setFresh(false), 1800);
    return () => window.clearTimeout(t);
  }, [fresh]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const resolve = (c: Conflict, w: (typeof WAYS)[number]) => {
    if (picked) return;
    setPicked(w.way);
    later(() => {
      setOpen(null);
      setPicked(null);
      setList((l) => l.filter((x) => x.id !== c.id));
      setToast(`Room ${c.room} · ${c.guest.split(" ")[0]} ${w.done}`);
    }, 750);
  };

  return (
    <Widget
      size="small"
      index={index}
      label="Room conflicts"
      glow={{ mode: "pulse", colors: ["#FF453A", "#FF9F0A", "#FF453A"], blur: 18, duration: 1 }}
      glowActive={fresh}
    >
      <WidgetHeader
        icon={n ? <Warning20Filled /> : <CheckmarkCircle20Filled />}
        tint={n ? "var(--ios-red)" : "var(--ios-green)"}
        title="Conflicts"
        subtitle={
          <motion.span
            key={toast ?? "base"}
            className={cn("block truncate", toast && "font-medium text-ios-green")}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {toast ?? "Room calendar"}
          </motion.span>
        }
      />

      <button
        type="button"
        disabled={!n}
        onClick={() => list[0] && setOpen(list[0].id)}
        className="mt-2 flex h-[38px] cursor-pointer items-center gap-2 text-left disabled:cursor-default"
      >
        <span className={cn("text-[32px] leading-none font-semibold tracking-tight", n ? "text-ios-red" : "text-heading")}>
          <AnimatedNumber value={n} />
        </span>
        <span className="min-w-0 flex-1 text-[11px] leading-[13px] text-tertiary">
          {n ? (n === 1 ? "stay needs a decision" : "stays need a decision") : "No clashes in any room"}
        </span>
        <AnimatePresence mode="popLayout" initial={false}>
          {n ? (
            <motion.span
              key="alarm"
              className="flex text-[22px] text-ios-red"
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.15, 1] }}
              exit={{ scale: 0, transition: { duration: 0.15 } }}
              transition={{ scale: { duration: 1.1, repeat: Infinity, ease: "easeInOut" } }}
            >
              <Warning20Filled />
            </motion.span>
          ) : (
            <motion.span
              key="clear"
              className="flex text-[22px] text-ios-green"
              initial={{ scale: 0, rotate: -60 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 480, damping: 16 }}
            >
              <CheckmarkCircle20Filled />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* 164 − 28 header − 8 mt − 38 hero − 6 mt = 84 px; 3 × 24 rows + 2 × 4 gaps = 80 px, 4 px slack. */}
      <div className="relative mt-1.5 flex min-h-0 flex-1 flex-col gap-1">
        <AnimatePresence mode="popLayout" initial={false}>
          {list.slice(0, 3).map((c, i) => (
            <motion.button
              key={c.id}
              type="button"
              layout
              onClick={() => setOpen(c.id)}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30, filter: "blur(3px)", transition: { duration: 0.25 } }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 30, delay: round === 0 ? delay + 0.15 + i * 0.07 : 0 }}
              className="flex h-[24px] shrink-0 cursor-pointer items-center gap-1.5 rounded-[7px] px-1 text-left hover:bg-fill-tertiary"
            >
              <RoomChip room={c.room} className="h-[20px] min-w-[24px] bg-ios-red/15 text-[10.5px] text-ios-red" />
              <span className="min-w-0 flex-1 truncate text-[11px] text-secondary">
                <span className="font-medium text-heading">{c.guest.split(" ")[0]}</span>
                {c.kind === "ooo" ? " in out of order" : ` × ${c.with.split(" ")[0]}`}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <Sheet open={!!cur} onClose={() => !picked && setOpen(null)} label="Resolve conflict" className="m-1.5 p-2">
        {cur ? (
          <div>
            <div className="flex items-center gap-1.5">
              <MemojiAvatar who={cur.guest} size={22} />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[12px] font-semibold text-heading">
                  {cur.kind === "ooo" ? `Room ${cur.room} is out of order` : `Room ${cur.room} is taken`}
                </div>
                <div className="truncate text-[10px] text-tertiary tabular">
                  {cur.guest} · {cur.nights}
                  {cur.kind === "ooo" ? ` · ${cur.with}` : ""}
                </div>
              </div>
              <Button
                size="small"
                shape="circle"
                variant="text"
                color="default"
                aria-label="Close"
                icon={<Dismiss16Regular />}
                onClick={() => !picked && setOpen(null)}
              />
            </div>
            <div className="mt-1.5 flex flex-col gap-1">
              {WAYS.map((w) => {
                const on = picked === w.way;
                return (
                  <motion.button
                    key={w.way}
                    type="button"
                    onClick={() => resolve(cur, w)}
                    animate={{ opacity: picked && !on ? 0.35 : 1 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "flex h-[30px] cursor-pointer items-center gap-1.5 rounded-[9px] px-1.5 text-left transition-colors duration-200",
                      on ? "bg-ios-green/20" : "bg-fill-tertiary hover:bg-fill-secondary",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-[20px] shrink-0 place-items-center rounded-full text-[13px] transition-colors",
                        on ? "bg-ios-green/15 text-ios-green" : w.way === "override" ? "bg-ios-red/15 text-ios-red" : "bg-fill-secondary text-secondary",
                      )}
                    >
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                          key={on ? "ok" : "icon"}
                          className="grid"
                          initial={{ scale: 0, rotate: -60 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          transition={{ type: "spring", stiffness: 520, damping: 18 }}
                        >
                          {on ? <Checkmark16Filled className="size-3.5" /> : w.icon}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                    <span className="min-w-0 flex-1 leading-[12px]">
                      <span className="block text-[11.5px] font-semibold text-heading">{w.label}</span>
                      <span className="block truncate text-[9.5px] text-tertiary">{w.sub(cur)}</span>
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ) : null}
      </Sheet>
    </Widget>
  );
}
