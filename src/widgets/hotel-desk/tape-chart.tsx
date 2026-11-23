import { CalendarLtr20Filled, Checkmark12Filled, LockClosed12Filled, Warning12Filled } from "@fluentui/react-icons";
import { AnimatePresence, animate, motion, useMotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { PROPERTY, ROOM_TYPES, type TypeId } from "./_parts-a";

type Status = "tentative" | "reserved" | "checked_in" | "checked_out" | "no_show" | "block" | "out_of_order";
const STATUS: Record<Status, { label: string; color: string; text: string }> = {
  tentative: { label: "Tentative", color: "var(--ios-orange)", text: "text-ios-orange" },
  reserved: { label: "Reserved", color: "var(--ios-indigo)", text: "text-ios-indigo" },
  checked_in: { label: "Checked in", color: "var(--ios-green)", text: "text-ios-green" },
  checked_out: { label: "Checked out", color: "var(--ant-color-text-quaternary)", text: "text-secondary" },
  no_show: { label: "No show", color: "var(--ios-red)", text: "text-ios-red" },
  block: { label: "Block", color: "var(--ios-purple)", text: "text-ios-purple" },
  out_of_order: { label: "Out of order", color: "var(--ios-pink)", text: "text-ios-pink" },
};

const ROWS: { room: string; type: TypeId }[] = [
  { room: "104", type: 301 },
  { room: "108", type: 302 },
  { room: "110", type: 302 },
  { room: "111", type: 302 },
  { room: "206", type: 303 },
  { room: "207", type: 303 },
  { room: "301", type: 304 },
  { room: "501", type: 308 },
];
const FIRST = 12;
const NIGHTS = 7;
const TODAY = 14;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const P = 31;

type Bar = {
  id: string;
  name: string;
  status: Status;
  row: number;
  start: number;
  end: number;
  res?: string;
  channel?: string;
  total?: number;
  locked?: boolean;
  segment?: { index: number; count: number; link: string };
};
/* Six October nights around the PMS date, eight rooms. */
const BARS: Bar[] = [
  { id: "ns", name: "Kevin Adams", status: "no_show", row: 0, start: 12, end: 13, res: "R822100097", channel: "Agoda", total: 245 },
  { id: "ooo", name: "Broken AC", status: "out_of_order", row: 0, start: 13, end: 16 },
  { id: "elif", name: "Ellie Dawson", status: "checked_in", row: 1, start: 11, end: 17, res: "R822100088", channel: "Online", total: 1_680 },
  { id: "zey", name: "Jenna Clark", status: "checked_out", row: 2, start: 12, end: 14, res: "R822100102", channel: "Booking.com", total: 540 },
  { id: "anna", name: "Anna Schmidt", status: "reserved", row: 2, start: 14, end: 18, res: "R822100117", channel: "Expedia", total: 1_120 },
  { id: "burak", name: "Brian Young", status: "checked_in", row: 3, start: 11, end: 14, res: "R822100091", channel: "Online", total: 810 },
  { id: "claire", name: "Claire Dubois", status: "reserved", row: 3, start: 14, end: 17, res: "R822100123", channel: "Booking.com", total: 870 },
  { id: "lena1", name: "Lena Brooks", status: "checked_in", row: 4, start: 13, end: 15, res: "R822100109", channel: "Online", total: 1_225, segment: { index: 1, count: 2, link: "lena2" } },
  { id: "lena2", name: "Lena Brooks", status: "checked_in", row: 5, start: 15, end: 18, res: "R822100109", channel: "Online", total: 1_225, segment: { index: 2, count: 2, link: "lena1" } },
  { id: "deniz", name: "Dana Mitchell", status: "tentative", row: 6, start: 16, end: 19, res: "R822100131", channel: "Online", total: 990 },
  { id: "owner", name: "Owner use", status: "block", row: 7, start: 12, end: 14 },
  { id: "marco", name: "Marco Rossi", status: "reserved", row: 7, start: 15, end: 20, res: "R822100126", channel: "Booking.com", total: 2_750, locked: true },
];
const MOVABLE: Status[] = ["tentative", "reserved", "checked_in"];
const isStay = (b: Bar) => b.status !== "block" && b.status !== "out_of_order";
const nights = (b: Bar) => b.end - b.start;
const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
const clampDay = (d: number) => Math.min(Math.max(d, FIRST), FIRST + NIGHTS);
const leftPct = (b: Pick<Bar, "start">) => ((clampDay(b.start) - FIRST) / NIGHTS) * 100;
const widthPct = (b: Pick<Bar, "start" | "end">) => ((clampDay(b.end) - clampDay(b.start)) / NIGHTS) * 100;

type Note = { kind: "ok" | "bad" | "info"; text: string };

/** Front desk · large. A week of the tape chart for eight rooms: stays colored by status, a split stay linked across rooms, a locked stay and a today column; tap a stay for its details, drag it to another room and it snaps into a dashed fit slot or springs back on a conflict. */
export function TapeChartWidget({ index }: { index?: number }) {
  const [bars, setBars] = useState<Bar[]>(BARS);
  const [picked, setPicked] = useState<string | null>(null);
  const [ghost, setGhost] = useState<{ id: string; row: number } | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    if (!note || note.kind === "info") return;
    const t = window.setTimeout(() => setNote(null), 2600);
    return () => window.clearTimeout(t);
  }, [note]);

  /** The first thing in the way in `row` for `bar`'s nights, or null when it fits. */
  const clash = (bar: Bar, row: number) =>
    bars.find((o) => o.id !== bar.id && o.row === row && o.status !== "no_show" && o.start < bar.end && bar.start < o.end) ?? null;

  const drop = (bar: Bar, row: number) => {
    const c = clash(bar, row);
    if (c) {
      const day = Math.max(c.start, bar.start);
      setNote({ kind: "bad", text: `${ROWS[row].room} conflicts with ${c.name} on Oct ${day}` });
      return false;
    }
    setBars((bs) => bs.map((b) => (b.id === bar.id ? { ...b, row } : b)));
    setNote({ kind: "ok", text: `${bar.name} moved to ${ROWS[row].room} · ${ROOM_TYPES[ROWS[row].type].name}` });
    setPicked(bar.id);
    return true;
  };

  const sel = bars.find((b) => b.id === picked) ?? null;
  const ghostBar = ghost ? bars.find((b) => b.id === ghost.id) : null;
  const ghostOk = ghostBar && ghost ? !clash(ghostBar, ghost.row) : false;
  const seg1 = bars.find((b) => b.id === "lena1");
  const seg2 = bars.find((b) => b.id === "lena2");

  return (
    <Widget size="large" index={index} label="Tape chart">
      <WidgetHeader
        icon={<CalendarLtr20Filled />}
        tint="var(--ios-indigo)"
        title="Tape Chart"
        subtitle={`${PROPERTY} · Oct 12–18`}
        extra={
          <span className="rounded-full bg-fill-tertiary px-2 py-0.5 text-[11px] font-medium text-secondary">
            Drag to move
          </span>
        }
      />

      {/* Night header */}
      <div className="mt-2 flex">
        <div className="w-[46px] shrink-0" />
        <div className="grid min-w-0 flex-1" style={{ gridTemplateColumns: `repeat(${NIGHTS}, minmax(0, 1fr))` }}>
          {DAYS.map((d, i) => {
            const today = FIRST + i === TODAY;
            return (
              <div key={d} className="flex h-[26px] flex-col items-center justify-center leading-none">
                <span className={cn("text-[9.5px]", today ? "font-semibold text-ios-red" : "text-tertiary")}>
                  {today ? "Today" : d}
                </span>
                <span
                  className={cn(
                    "mt-0.5 grid h-[14px] min-w-[18px] place-items-center rounded-full px-1 text-[11px] font-semibold tabular",
                    today ? "bg-ios-red text-white" : "text-heading",
                  )}
                >
                  {FIRST + i}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="mt-0.5 flex">
        <div className="w-[46px] shrink-0">
          {ROWS.map((r, i) => (
            <motion.div
              key={r.room}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30, delay: delay + i * 0.04 }}
              className="flex flex-col justify-center border-b-[0.5px] border-split leading-tight"
              style={{ height: P }}
            >
              <span className="text-[12px] font-semibold text-heading tabular">{r.room}</span>
              <span className="truncate text-[9.5px] text-tertiary">{ROOM_TYPES[r.type].short}</span>
            </motion.div>
          ))}
        </div>
        <div className="relative min-w-0 flex-1" style={{ height: P * ROWS.length }}>
          {/* Grid: nights, rooms and the today column */}
          <div
            className="absolute inset-y-0 bg-ios-red/[0.07]"
            style={{ left: `${((TODAY - FIRST) / NIGHTS) * 100}%`, width: `${100 / NIGHTS}%` }}
          />
          {Array.from({ length: NIGHTS - 1 }, (_, i) => (
            <span
              key={i}
              className="absolute inset-y-0 w-px bg-[var(--ant-color-split)]"
              style={{ left: `${((i + 1) / NIGHTS) * 100}%` }}
            />
          ))}
          {ROWS.map((r, i) => (
            <span key={r.room} className="absolute inset-x-0 h-px bg-[var(--ant-color-split)]" style={{ top: (i + 1) * P - 1 }} />
          ))}

          {/* The split stay's link between its two rooms */}
          {seg1 && seg2 && seg1.row !== seg2.row ? (
            <motion.span
              aria-hidden
              className="absolute w-0 border-l-[1.5px] border-dashed"
              style={{ borderColor: STATUS.checked_in.color, left: `${leftPct(seg2)}%` }}
              initial={{ opacity: 0 }}
              animate={{
                opacity: ghost ? 0 : 1,
                top: Math.min(seg1.row, seg2.row) * P + P / 2,
                height: Math.abs(seg2.row - seg1.row) * P,
              }}
              transition={{ opacity: { delay: ghost ? 0 : delay + 0.6 }, default: { type: "spring", stiffness: 300, damping: 30 } }}
            />
          ) : null}

          {/* Fit slot while dragging */}
          <AnimatePresence>
            {ghost && ghostBar && ghost.row !== ghostBar.row ? (
              <motion.div
                key="ghost"
                className={cn(
                  "absolute rounded-[6px] border-[1.5px] border-dashed",
                  ghostOk ? "border-ios-green bg-ios-green/10" : "border-ios-red bg-ios-red/10",
                )}
                style={{
                  left: `calc(${leftPct(ghostBar)}% + 1.5px)`,
                  width: `calc(${widthPct(ghostBar)}% - 3px)`,
                  height: P - 8,
                }}
                initial={{ opacity: 0, top: ghost.row * P + 4 }}
                animate={{ opacity: 1, top: ghost.row * P + 4 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 36 }}
              />
            ) : null}
          </AnimatePresence>

          {bars.map((b, i) => (
            <StayBar
              key={b.id}
              bar={b}
              selected={picked === b.id}
              enter={delay + 0.15 + b.row * 0.05 + i * 0.015}
              onPick={() => {
                setPicked((p) => (p === b.id ? null : b.id));
                setNote(null);
              }}
              onRefuse={() => setNote({ kind: "bad", text: `${b.name} is locked to ${ROWS[b.row].room}` })}
              onHover={(row) => setGhost(row === null ? null : { id: b.id, row })}
              onDrop={(row) => drop(b, row)}
            />
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="mt-auto h-[44px] overflow-hidden rounded-xl bg-fill-quaternary px-2.5">
        <AnimatePresence mode="wait" initial={false}>
          {note ? (
            <motion.div
              key={`n${note.text}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className={cn(
                "flex h-full items-center gap-1.5 text-[12px] font-medium",
                note.kind === "ok" ? "text-ios-green" : "text-ios-red",
              )}
            >
              {note.kind === "ok" ? <Checkmark12Filled /> : <Warning12Filled />}
              <span className="truncate">{note.text}</span>
            </motion.div>
          ) : sel ? (
            <motion.div
              key={`s${sel.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="flex h-full items-center gap-2"
            >
              {isStay(sel) ? (
                <MemojiAvatar who={sel.name} size={28} />
              ) : (
                <span className="size-7 shrink-0 rounded-full" style={{ background: `color-mix(in srgb, ${STATUS[sel.status].color} 30%, transparent)` }} />
              )}
              <div className="min-w-0 flex-1 leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[12.5px] font-semibold text-heading">{sel.name}</span>
                  <span className={cn("shrink-0 text-[10.5px] font-medium", STATUS[sel.status].text)}>{STATUS[sel.status].label}</span>
                  {sel.locked ? <LockClosed12Filled className="shrink-0 text-tertiary" /> : null}
                  {sel.segment ? (
                    <span className="shrink-0 text-[10.5px] text-tertiary">
                      Split {sel.segment.index}/{sel.segment.count}
                    </span>
                  ) : null}
                </div>
                <div className="truncate text-[10.5px] text-tertiary tabular">
                  {[
                    sel.res,
                    `Oct ${sel.start}–${sel.end} · ${nights(sel)} night${nights(sel) > 1 ? "s" : ""}`,
                    ROWS[sel.row].room,
                    sel.channel,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
              {sel.total ? <span className="shrink-0 text-[12px] font-semibold text-heading tabular">{usd(sel.total)}</span> : null}
            </motion.div>
          ) : (
            <motion.div
              key="legend"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid h-full grid-cols-4 content-center gap-x-2 gap-y-1"
            >
              {(Object.keys(STATUS) as Status[]).map((s) => (
                <span key={s} className="flex min-w-0 items-center gap-1 text-[10px] text-tertiary">
                  <span className="size-2 shrink-0 rounded-[3px]" style={{ background: STATUS[s].color }} />
                  <span className="truncate">{STATUS[s].label}</span>
                </span>
              ))}
              <span className="flex min-w-0 items-center gap-1 text-[10px] text-tertiary">
                <LockClosed12Filled className="size-2.5 shrink-0" />
                <span className="truncate">Locked</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Widget>
  );
}

function StayBar({
  bar,
  selected,
  enter,
  onPick,
  onRefuse,
  onHover,
  onDrop,
}: {
  bar: Bar;
  selected: boolean;
  enter: number;
  onPick: () => void;
  onRefuse: () => void;
  onHover: (row: number | null) => void;
  onDrop: (row: number) => boolean;
}) {
  const y = useMotionValue(bar.row * P);
  const x = useMotionValue(0);
  const dragged = useRef(false);
  const over = useRef<number | null>(null);
  const st = STATUS[bar.status];
  const movable = MOVABLE.includes(bar.status) && !bar.locked;
  const clippedL = bar.start < FIRST;
  const clippedR = bar.end > FIRST + NIGHTS;

  // A move lands: glide to the new row.
  useEffect(() => {
    const c = animate(y, bar.row * P, { type: "spring", stiffness: 420, damping: 34 });
    return () => c.stop();
  }, [bar.row, y]);

  const shake = () => animate(x, [0, -5, 5, -3, 3, 0], { duration: 0.4 });
  const target = () => Math.min(ROWS.length - 1, Math.max(0, Math.round(y.get() / P)));

  const fill =
    bar.status === "checked_out"
      ? { backgroundColor: "var(--ant-color-fill-secondary)" }
      : bar.status === "block" || bar.status === "out_of_order"
        ? {
            backgroundColor: `color-mix(in srgb, ${st.color} 16%, transparent)`,
            backgroundImage: `repeating-linear-gradient(135deg, transparent 0 4px, color-mix(in srgb, ${st.color} 32%, transparent) 4px 5.5px)`,
          }
        : { backgroundColor: `color-mix(in srgb, ${st.color} 24%, transparent)` };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`${bar.name}, ${st.label}, Oct ${bar.start}–${bar.end}`}
      drag={movable ? "y" : false}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={{ top: 0, bottom: (ROWS.length - 1) * P }}
      onTapStart={() => {
        dragged.current = false;
      }}
      onTap={() => {
        if (dragged.current) return;
        onPick();
        if (bar.locked) {
          shake();
          onRefuse();
        }
      }}
      onDragStart={() => {
        dragged.current = true;
        over.current = bar.row;
      }}
      onDrag={() => {
        const t = target();
        if (t !== over.current) {
          over.current = t;
          onHover(t);
        }
      }}
      onDragEnd={() => {
        const t = target();
        onHover(null);
        over.current = null;
        if (t === bar.row || !onDrop(t)) {
          animate(y, bar.row * P, { type: "spring", stiffness: 420, damping: 30 });
          if (t !== bar.row) shake();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPick();
        }
      }}
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1, zIndex: selected ? 5 : 1, boxShadow: "0 0px 0px rgba(0,0,0,0)" }}
      whileHover={{ scaleY: 1.08 }}
      whileDrag={{ scale: 1.04, zIndex: 20, boxShadow: "0 6px 16px rgba(0,0,0,0.25)" }}
      transition={{
        default: { type: "spring", stiffness: 420, damping: 28 },
        scaleX: { type: "spring", stiffness: 300, damping: 26, delay: enter },
        opacity: { duration: 0.25, delay: enter },
      }}
      className={cn(
        "absolute top-[4px] flex origin-left items-center gap-1 overflow-hidden px-1.5 outline-none",
        clippedL ? "rounded-r-[6px]" : clippedR ? "rounded-l-[6px]" : "rounded-[6px]",
        movable ? "cursor-grab touch-none active:cursor-grabbing" : "cursor-pointer",
        bar.status === "tentative" && "border border-dashed border-ios-orange",
        selected && "ring-2 ring-[var(--ant-color-text-heading)] ring-inset",
      )}
      style={{
        y,
        x,
        left: `calc(${leftPct(bar)}% + ${clippedL ? 0 : 1.5}px)`,
        width: `calc(${widthPct(bar)}% - ${clippedL || clippedR ? 1.5 : 3}px)`,
        height: P - 8,
        ...fill,
      }}
    >
      {isStay(bar) && bar.status !== "checked_out" ? (
        <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: st.color }} />
      ) : null}
      <span
        className={cn(
          "min-w-0 flex-1 truncate pl-0.5 text-[10.5px] font-medium",
          bar.status === "checked_out" || bar.status === "no_show" ? "text-secondary" : "text-heading",
          bar.status === "no_show" && "line-through",
          !isStay(bar) && st.text,
        )}
      >
        {bar.name}
      </span>
      {bar.segment ? (
        <span className="shrink-0 rounded-[3px] bg-ios-green/20 px-0.5 text-[9px] font-semibold text-ios-green tabular">
          {bar.segment.index}/{bar.segment.count}
        </span>
      ) : null}
      {bar.locked ? <LockClosed12Filled className="size-3 shrink-0 text-secondary" /> : null}
    </motion.div>
  );
}
