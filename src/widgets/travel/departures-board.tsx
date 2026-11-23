import { Board20Filled, Pin12Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Status = "ON TIME" | "GATE OPEN" | "BOARDING" | "FINAL CALL" | "DEPARTED" | "DELAYED";
const STATUS_TEXT: Record<Status, string> = {
  "ON TIME": "text-secondary",
  "GATE OPEN": "text-ios-teal",
  BOARDING: "text-ios-green",
  "FINAL CALL": "text-ios-orange",
  DEPARTED: "text-tertiary",
  DELAYED: "text-ios-red",
};
const NEXT: Partial<Record<Status, Status>> = {
  "ON TIME": "BOARDING",
  "GATE OPEN": "BOARDING",
  DELAYED: "BOARDING",
  BOARDING: "FINAL CALL",
  "FINAL CALL": "DEPARTED",
};

type Row = { id: string; time: string; flight: string; dest: string; gate: string; status: Status };
const FIRST: Row[] = [
  { id: "AX318", time: "09:40", flight: "AX318", dest: "LISBON", gate: "B7", status: "BOARDING" },
  { id: "NV204", time: "09:55", flight: "NV204", dest: "ATHENS", gate: "C12", status: "GATE OPEN" },
  { id: "AX12", time: "10:05", flight: "AX12", dest: "ISTANBUL", gate: "A3", status: "ON TIME" },
  { id: "AX74", time: "10:20", flight: "AX74", dest: "IZMIR", gate: "B14", status: "ON TIME" },
  { id: "ZR115", time: "10:35", flight: "ZR115", dest: "CAIRO", gate: "D2", status: "DELAYED" },
];
const LATER: Omit<Row, "id" | "status">[] = [
  { time: "10:50", flight: "NV330", dest: "OSLO", gate: "A9" },
  { time: "11:05", flight: "QL418", dest: "ROME", gate: "C4" },
  { time: "11:15", flight: "AX127", dest: "DUBAI", gate: "D8" },
  { time: "11:30", flight: "ZR640", dest: "PARIS", gate: "B2" },
  { time: "11:45", flight: "NV552", dest: "BAKU", gate: "A1" },
  { time: "12:00", flight: "QL205", dest: "MILAN", gate: "C7" },
];
const TICK_MS = 3800;
const COLS = [
  { key: "time", label: "Time", cells: 5 },
  { key: "flight", label: "Flight", cells: 5 },
  { key: "dest", label: "To", cells: 8 },
  { key: "gate", label: "Gate", cells: 3 },
  { key: "status", label: "Status", cells: 10 },
] as const;

/** One split-flap character. A changed letter folds away and the new one falls into place. */
function Flap({ ch, i, delay, className }: { ch: string; i: number; delay: number; className?: string }) {
  return (
    <span className="relative grid h-[17px] w-[9px] place-items-center overflow-hidden rounded-[2px] bg-fill-tertiary">
      <AnimatePresence>
        <motion.span
          key={ch}
          className={cn("absolute font-mono text-[11px] leading-none font-semibold", className)}
          style={{ transformPerspective: 120 }}
          initial={{ rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: 90, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut", delay: delay + i * 0.035 }}
        >
          {ch === " " ? " " : ch}
        </motion.span>
      </AnimatePresence>
      <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-[var(--widget-surface)] opacity-70" />
    </span>
  );
}

/** Travel · medium. A split-flap departures board whose letters flip as flights board, get a final call and leave; tap a flight to follow it and its gate pins to the header. */
export function DeparturesBoardWidget({ index }: { index?: number }) {
  const [rows, setRows] = useState(FIRST);
  const [tick, setTick] = useState(0);
  const [follow, setFollow] = useState<string | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), TICK_MS);
    return () => window.clearInterval(t);
  }, []);

  // Live: the first flight moves through boarding and leaves; the next scheduled one joins at the bottom.
  useEffect(() => {
    if (tick === 0) return;
    const n = tick;
    setRows((list) => {
      const [top, ...rest] = list;
      if (top.status === "DEPARTED") {
        const next = LATER[(n - 1) % LATER.length];
        const opened = rest.map((r, i) => (i === 0 && r.status === "ON TIME" ? { ...r, status: "GATE OPEN" as Status } : r));
        return [...opened, { ...next, id: `${next.flight}-${n}`, status: "ON TIME" }];
      }
      return [{ ...top, status: NEXT[top.status] ?? top.status }, ...rest];
    });
  }, [tick]);

  const followed = rows.find((r) => r.id === follow);

  return (
    <Widget size="medium" index={index} label="Departures board">
      <WidgetHeader
        icon={<Board20Filled />}
        tint="var(--ios-blue)"
        title="Departures"
        subtitle={
          followed ? (
            <span className="font-medium text-secondary">
              Following {followed.flight} · gate {followed.gate} · {followed.status.toLowerCase()}
            </span>
          ) : (
            "JFK · Terminal 1 · tap to follow"
          )
        }
      />

      <div className="mt-1.5 flex justify-between pr-4 pl-1.5 text-[9px] font-medium tracking-wide text-tertiary uppercase">
        {COLS.map((c) => (
          <span key={c.key} style={{ width: c.cells * 10 - 1 }} className="shrink-0">
            {c.label}
          </span>
        ))}
      </div>

      <div className="mt-1 flex flex-col gap-[3px]">
        <AnimatePresence initial={false}>
          {rows.map((r, ri) => {
            const on = follow === r.id;
            return (
              <motion.button
                type="button"
                key={r.id}
                layout
                onClick={() => setFollow(on ? null : r.id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: r.status === "DEPARTED" ? 0.55 : 1, y: 0 }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
                aria-pressed={on}
                aria-label={`${r.flight} to ${r.dest}, ${r.status.toLowerCase()}`}
                className={cn(
                  "relative flex w-full cursor-pointer items-center justify-between rounded-md py-px pr-4 pl-1.5 text-heading transition-colors",
                  on ? "bg-ios-yellow/20" : "hover:bg-fill-quaternary",
                )}
              >
                {COLS.map((c) => {
                  const text = (r[c.key] as string).padEnd(c.cells, " ").slice(0, c.cells);
                  return (
                    <span key={c.key} className="flex shrink-0 gap-px">
                      {[...text].map((ch, i) => (
                        <Flap
                          key={i}
                          ch={ch}
                          i={i}
                          delay={tick === 0 ? delay + ri * 0.08 : 0}
                          className={c.key === "status" ? STATUS_TEXT[r.status] : undefined}
                        />
                      ))}
                    </span>
                  );
                })}
                {on ? <Pin12Filled className="absolute right-0.5 size-3 text-ios-orange" /> : null}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
