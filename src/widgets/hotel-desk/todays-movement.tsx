import { ArrowSwap20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { BUSINESS_DAY, PROPERTY, clock, useInterval } from "./_parts-b";

type Kind = "arr" | "dep" | "inh";
type Guest = { name: string; room: string | null; note: string; until?: string };

const SEG: Record<Kind, { label: string; text: string; soft: string; strong: string; ring: string }> = {
  arr: { label: "Arriving", text: "text-ios-blue", soft: "bg-ios-blue/12", strong: "bg-ios-blue/25", ring: "ring-ios-blue/70" },
  dep: { label: "Departing", text: "text-ios-orange", soft: "bg-ios-orange/12", strong: "bg-ios-orange/25", ring: "ring-ios-orange/70" },
  inh: { label: "In house", text: "text-ios-green", soft: "bg-ios-green/12", strong: "bg-ios-green/25", ring: "ring-ios-green/70" },
};
const ORDER: Kind[] = ["arr", "dep", "inh"];

const ARRIVALS: Guest[] = [
  { name: "Olivia Brown", room: "95", note: "ETA 13:00", until: "Oct 17" },
  { name: "Claire Dubois", room: "11", note: "ETA 14:00", until: "Oct 17" },
  { name: "Anna Schmidt", room: "10", note: "ETA 14:30", until: "Oct 18" },
  { name: "Jacob Ames", room: "15", note: "ETA 15:00", until: "Oct 16" },
  { name: "Julia Novak", room: "97", note: "ETA 16:00", until: "Oct 18" },
  { name: "Connor Hale", room: "1", note: "ETA 17:30", until: "Oct 15" },
  { name: "Derek Kane", room: null, note: "ETA 18:00", until: "Oct 16" },
];
const DEPARTURES: Guest[] = [
  { name: "Hans Becker", room: "95", note: "Out 12:00" },
  { name: "Brian Young", room: "11", note: "Out 12:00" },
  { name: "Jenna Clark", room: "10", note: "Out 12:00" },
  { name: "Erin Cole", room: "12", note: "Out 12:00" },
  { name: "Tom Baker", room: "29", note: "Late out 15:00" },
];
const IN_HOUSE: Guest[] = [
  { name: "Alicia Tate", room: "96", note: "Until Oct 19" },
  { name: "Ellie Dawson", room: "8", note: "Until Oct 17" },
  { name: "Paige Ellis", room: "13", note: "Until Oct 17" },
  { name: "Lena Brooks", room: "25", note: "Until Oct 18" },
  { name: "David Miller", room: "5", note: "Until Oct 16" },
];

/** The desk's day as it plays out; after the last step the day starts over. */
const SCRIPT: Kind[] = ["dep", "dep", "arr", "dep", "arr", "dep", "arr", "arr", "dep", "arr"];

type State = {
  lists: Record<Kind, Guest[]>;
  n: Record<Kind, number>;
  done: { in: number; out: number };
  last: { name: string; verb: string; room: string | null } | null;
  step: number;
  mins: number;
};
const START: State = {
  lists: { arr: ARRIVALS, dep: DEPARTURES, inh: IN_HOUSE },
  n: { arr: 14, dep: 9, inh: 58 },
  done: { in: 3, out: 6 },
  last: null,
  step: 0,
  mins: 11 * 60 + 42,
};

function advance(s: State): State {
  if (s.step >= SCRIPT.length) return { ...START, mins: s.mins + 3 };
  const kind = SCRIPT[s.step];
  const mins = s.mins + 3 + (s.step % 3) * 2;
  const g = s.lists[kind][0];
  if (!g) return { ...s, step: s.step + 1, mins };
  if (kind === "dep") {
    return {
      ...s,
      lists: { ...s.lists, dep: s.lists.dep.slice(1) },
      n: { ...s.n, dep: s.n.dep - 1 },
      done: { ...s.done, out: s.done.out + 1 },
      last: { name: g.name, verb: "checked out", room: g.room },
      step: s.step + 1,
      mins,
    };
  }
  return {
    ...s,
    lists: {
      ...s.lists,
      arr: s.lists.arr.slice(1),
      inh: [{ name: g.name, room: g.room, note: `Until ${g.until}` }, ...s.lists.inh],
    },
    n: { ...s.n, arr: s.n.arr - 1, inh: s.n.inh + 1 },
    done: { ...s.done, in: s.done.in + 1 },
    last: { name: g.name, verb: "checked in", room: g.room },
    step: s.step + 1,
    mins,
  };
}

/** Front desk · medium. Arriving, departing and in-house guests as one bar whose segments morph as guests check in and out live; tap a segment to see its next three guests. */
export function TodaysMovementWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [s, setS] = useState(START);
  const [sel, setSel] = useState<Kind>("arr");

  useInterval(() => setS(advance), 4200);

  const total = s.n.arr + s.n.dep + s.n.inh;
  // A floor keeps the small segments wide enough for their label; the rest follows the counts.
  const weight = (k: Kind) => 0.16 + (s.n[k] / total) * 0.84;
  const first = s === START;
  const guests = s.lists[sel].slice(0, 3);

  return (
    <Widget size="medium" index={index} label="Today's movement">
      <WidgetHeader
        icon={<ArrowSwap20Filled />}
        tint="var(--ios-blue)"
        title="Today's movement"
        subtitle={`${PROPERTY} · ${BUSINESS_DAY}`}
        extra={
          <div className="text-right leading-tight">
            <div className="text-[10px] text-tertiary">Done today</div>
            <div className="text-[12px] font-semibold whitespace-nowrap text-secondary">
              In <AnimatedNumber value={s.done.in} /> · Out <AnimatedNumber value={s.done.out} />
            </div>
          </div>
        }
      />

      <div role="tablist" aria-label="Guest movement" className="mt-2.5 flex h-[42px] gap-[3px]">
        {ORDER.map((k, i) => {
          const seg = SEG[k];
          const on = sel === k;
          return (
            <motion.button
              key={k}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setSel(k)}
              initial={{ flexGrow: 0.001 }}
              animate={{ flexGrow: weight(k) }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 120, damping: 20, delay: first ? delay + i * 0.08 : 0 }}
              style={{ flexBasis: 0 }}
              className={cn(
                "relative min-w-0 cursor-pointer overflow-hidden px-2 text-left ring-inset transition-[background-color,box-shadow] duration-200",
                i === 0 ? "rounded-l-[12px] rounded-r-[4px]" : i === ORDER.length - 1 ? "rounded-l-[4px] rounded-r-[12px]" : "rounded-[4px]",
                on ? cn(seg.strong, "ring-1", seg.ring) : seg.soft,
              )}
            >
              <div className={cn("text-[18px] leading-[22px] font-semibold tracking-tight", seg.text)}>
                <AnimatedNumber value={s.n[k]} />
              </div>
              <div className="truncate text-[10.5px] leading-[13px] font-medium text-secondary">{seg.label}</div>
            </motion.button>
          );
        })}
      </div>

      <div className="relative mt-2 h-[36px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={sel}
            className="absolute inset-0 grid grid-cols-3 gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {guests.map((g, i) => (
                <motion.div
                  key={g.name}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85, filter: "blur(3px)" }}
                  transition={{ type: "spring", stiffness: 380, damping: 30, delay: first && sel === "arr" ? delay + 0.3 + i * 0.06 : 0 }}
                  className="flex min-w-0 items-center gap-1.5"
                >
                  <MemojiAvatar who={g.name} size={24} />
                  <div className="min-w-0 leading-tight">
                    <div className="truncate text-[11.5px] font-semibold text-heading">{g.name}</div>
                    <div className="truncate text-[10px] text-tertiary tabular">
                      {g.room ? <span className="font-medium text-secondary">{g.room}</span> : "Unassigned"} · {g.note}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {guests.length === 0 ? (
              <div className="col-span-3 self-center text-[11.5px] text-tertiary">
                {sel === "arr" ? "No named arrivals left in the queue" : "Everyone due out has left"}
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-auto flex h-[18px] items-center gap-1.5 text-[11px] whitespace-nowrap">
        <span className="relative flex size-1.5 shrink-0">
          <motion.span
            className="absolute inset-0 rounded-full bg-ios-green"
            animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
          <span className="relative size-1.5 rounded-full bg-ios-green" />
        </span>
        <div className="relative h-[18px] min-w-0 flex-1">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={s.last ? s.last.name + s.step : "idle"}
              className="absolute inset-0 flex min-w-0 items-center gap-1.5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
            >
              {s.last ? (
                <>
                  <MemojiAvatar who={s.last.name} size={16} />
                  <span className="truncate text-secondary">
                    <span className="font-medium text-heading">{s.last.name}</span> {s.last.verb}
                    {s.last.room ? <span className="text-tertiary tabular"> · {s.last.room}</span> : null}
                  </span>
                </>
              ) : (
                <span className="text-tertiary">Live from the front desk</span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <span className="text-tertiary tabular">{clock(s.mins)}</span>
      </div>
    </Widget>
  );
}
