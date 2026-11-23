import { Bed20Filled, CheckmarkCircle12Filled, Clock12Regular, Send16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

/** A line's answer from the hotel; `changed` = the live line differs from what was last sent. */
type Line = "pending" | "confirmed" | "rejected" | "changed";
type State = "draft" | "sent" | "partiallyConfirmed" | "confirmed" | "closed";

type RoomingList = {
  id: string;
  hotel: string;
  place: string;
  range: string;
  /** Days from today to the due day (first check-in less `roomingDueDays`). */
  dueIn: number;
  dueOn: string;
  version: number;
  closed: boolean;
  lines: Line[];
  /** The hotel is answering the last send. */
  awaiting: boolean;
  /** A send is sweeping out right now. */
  sending: boolean;
};

const SEED: RoomingList[] = [
  {
    id: "RL-26-0001",
    hotel: "Red Rock Lodge",
    place: "Sedona",
    range: "Nov 12–16",
    dueIn: 1,
    dueOn: "Nov 10",
    version: 1,
    closed: false,
    // 6 of 11 confirmed; a booking on v1 was cancelled the day after it went out.
    lines: ["confirmed", "confirmed", "confirmed", "pending", "confirmed", "changed", "confirmed", "pending", "confirmed", "pending", "pending"],
    awaiting: false,
    sending: false,
  },
  {
    id: "RL-26-0002",
    hotel: "Juniper Cabins",
    place: "Oak Creek",
    range: "Nov 20–23",
    dueIn: 6,
    dueOn: "Nov 15",
    version: 0,
    closed: false,
    lines: Array<Line>(7).fill("pending"),
    awaiting: false,
    sending: false,
  },
  {
    id: "RL-26-0003",
    hotel: "Oak Creek Cabins",
    place: "Oak Creek",
    range: "Nov 13–15",
    dueIn: 2,
    dueOn: "Nov 11",
    version: 2,
    closed: false,
    lines: Array<Line>(5).fill("confirmed"),
    awaiting: false,
    sending: false,
  },
];

/** `roomingState`: closed, never sent, then by the hotel's answers. */
function stateOf(l: RoomingList): State {
  if (l.closed) return "closed";
  if (l.version === 0) return "draft";
  const ok = l.lines.filter((x) => x === "confirmed").length;
  if (ok === 0) return "sent";
  return ok === l.lines.length ? "confirmed" : "partiallyConfirmed";
}

const STATE: Record<State, { label: string; text: string }> = {
  draft: { label: "Draft", text: "text-tertiary" },
  sent: { label: "Sent", text: "text-ios-blue" },
  partiallyConfirmed: { label: "Partial", text: "text-ios-yellow" },
  confirmed: { label: "Confirmed", text: "text-ios-green" },
  closed: { label: "Closed", text: "text-tertiary" },
};

const CELL: Record<Line, string> = {
  pending: "bg-fill-secondary",
  confirmed: "bg-ios-green",
  rejected: "bg-ios-red",
  changed: "bg-ios-orange",
};

const SWEEP_MS = 750;

/** Tour guest · medium. Rooming lists per hotel with their state, the hotel's confirmed lines as ticks and the due day; "Send" sweeps a new version across the bar and moves the list to sent, then the hotel's confirmations tick in one by one, and now and then an amended booking flags a list as changed again. */
export function RoomingWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [lists, setLists] = useState(SEED);
  const [settled, setSettled] = useState(false);
  const listsRef = useRef(lists);
  useEffect(() => {
    listsRef.current = lists;
  }, [lists]);

  useEffect(() => {
    const t = window.setTimeout(() => setSettled(true), (delay + 1) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  // The hotel answers a sent version, a line at a time.
  useEffect(() => {
    const t = window.setInterval(() => {
      setLists((ls) =>
        ls.map((l) => {
          if (!l.awaiting || l.sending) return l;
          const open = l.lines.flatMap((x, i) => (x === "pending" ? [i] : []));
          if (!open.length) return { ...l, awaiting: false };
          const pick = open[Math.floor(Math.random() * open.length)];
          return { ...l, lines: l.lines.map((x, i) => (i === pick ? "confirmed" : x)), awaiting: open.length > 1 };
        }),
      );
    }, 520);
    return () => window.clearInterval(t);
  }, []);

  // Now and then a booking on a confirmed list is amended: the list is marked changed.
  useEffect(() => {
    const t = window.setInterval(() => {
      const target = listsRef.current.find((l) => stateOf(l) === "confirmed" && !l.sending && !l.awaiting);
      if (!target) return;
      const at = Math.floor(Math.random() * target.lines.length);
      setLists((ls) => ls.map((l) => (l.id === target.id ? { ...l, lines: l.lines.map((x, i) => (i === at ? "changed" : x)) } : l)));
    }, 16_000);
    return () => window.clearInterval(t);
  }, []);

  const send = (id: string) => {
    setLists((ls) => ls.map((l) => (l.id === id ? { ...l, sending: true } : l)));
    window.setTimeout(() => {
      setLists((ls) =>
        ls.map((l) =>
          l.id === id ? { ...l, sending: false, awaiting: true, version: l.version + 1, lines: l.lines.map(() => "pending") } : l,
        ),
      );
    }, SWEEP_MS);
  };

  const rooms = lists.reduce((a, l) => a + l.lines.length, 0);
  const ok = lists.reduce((a, l) => a + l.lines.filter((x) => x === "confirmed").length, 0);
  const dueSoon = lists.filter((l) => l.dueIn <= 2 && stateOf(l) !== "confirmed").length;

  return (
    <Widget size="medium" index={index} label="Rooming lists">
      <WidgetHeader
        icon={<Bed20Filled />}
        tint="var(--ios-teal)"
        title="Rooming Lists"
        subtitle={
          <span className="tabular">
            <AnimatedNumber value={ok} />/{rooms} rooms confirmed · Nov check-ins
          </span>
        }
        extra={
          <AnimatePresence>
            {dueSoon ? (
              <motion.span
                key="due"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mt-0.5 flex h-5 items-center gap-1 rounded-full bg-ios-orange/15 px-2 text-[10px] font-semibold whitespace-nowrap text-ios-orange tabular"
              >
                <Clock12Regular /> <AnimatedNumber value={dueSoon} /> due ≤ 2d
              </motion.span>
            ) : null}
          </AnimatePresence>
        }
      />

      {/* 28 header + 4 + 3 × 36 + 2 × 10 = 160 of 164. */}
      <ul className="mt-1 flex flex-col gap-2.5">
        {lists.map((l, li) => (
          <Row key={l.id} l={l} delay={settled ? 0 : delay + li * 0.08} onSend={() => send(l.id)} />
        ))}
      </ul>
    </Widget>
  );
}

function Row({ l, delay, onSend }: { l: RoomingList; delay: number; onSend: () => void }) {
  const st = stateOf(l);
  const ok = l.lines.filter((x) => x === "confirmed").length;
  const changed = l.lines.includes("changed");
  const canSend = !l.closed && (l.version === 0 || changed);
  const dueLabel = l.dueIn <= 0 ? "due today" : l.dueIn === 1 ? "due tomorrow" : `due ${l.dueOn}`;
  const dueHot = l.dueIn <= 2 && st !== "confirmed";

  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 30, delay }}
      className="relative flex h-[36px] items-center gap-2 not-first:before:absolute not-first:before:inset-x-0 not-first:before:-top-[5px] not-first:before:h-[0.5px] not-first:before:bg-split"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Tooltip title={`${l.id} · ${l.place} · ${l.version ? `v${l.version} sent` : "never sent"}`}>
            <span className="min-w-0 truncate text-[12px] leading-[15px] font-semibold text-heading">{l.hotel}</span>
          </Tooltip>
          <AnimatePresence>
            {changed ? (
              <motion.span
                key="changed"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: "spring", stiffness: 500, damping: 26 }}
                className="flex h-[15px] shrink-0 items-center gap-1 rounded-full bg-ios-orange/15 px-1.5 text-[9px] font-semibold text-ios-orange"
              >
                <span className="size-1 rounded-full bg-ios-orange" />
                Changed
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
        <div className="truncate text-[10px] leading-[13px] text-tertiary tabular">
          {l.range} · <span className={cn(dueHot && "font-semibold text-ios-orange")}>{dueLabel}</span>
        </div>
      </div>

      <div className="w-[108px] shrink-0">
        <div className="flex items-baseline justify-between text-[10px] leading-[13px]">
          <motion.span key={st} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} className={cn("font-semibold", STATE[st].text)}>
            {l.sending ? "Sending…" : STATE[st].label}
          </motion.span>
          <span className="font-medium text-secondary tabular">
            <AnimatedNumber value={ok} />/{l.lines.length}
          </span>
        </div>
        <div className="relative mt-[3px] flex h-[6px] gap-[2px] overflow-hidden rounded-full">
          {l.lines.map((x, i) => (
            <motion.span
              key={`${i}-${x}`}
              className={cn("h-full flex-1 rounded-[2px]", CELL[x])}
              initial={delay ? { scaleY: 0, opacity: 0 } : x === "pending" ? false : { scaleY: 0.2, opacity: 0.4 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 520, damping: 22, delay: delay ? delay + 0.15 + i * 0.03 : 0 }}
            />
          ))}
          <AnimatePresence>
            {l.sending ? (
              <motion.span
                key="sweep"
                className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-ios-blue to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                exit={{ opacity: 0 }}
                transition={{ duration: SWEEP_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
              />
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex w-[66px] shrink-0 justify-end">
        <AnimatePresence mode="popLayout" initial={false}>
          {canSend || l.sending ? (
            <motion.span key="send" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}>
              <Tooltip title={l.version ? `Send new version v${l.version + 1} to the hotel` : "Send the first version to the hotel"}>
                <Button size="small" type="primary" icon={<Send16Filled />} disabled={l.sending} onClick={onSend} className="tabular">
                  v{l.version + 1}
                </Button>
              </Tooltip>
            </motion.span>
          ) : (
            <motion.span
              key={`v${l.version}-${st === "confirmed"}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-semibold whitespace-nowrap tabular",
                st === "confirmed" ? "bg-ios-green/15 text-ios-green" : "bg-fill-tertiary text-secondary",
              )}
            >
              {st === "confirmed" ? <CheckmarkCircle12Filled /> : <Clock12Regular />}v{l.version}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.li>
  );
}
