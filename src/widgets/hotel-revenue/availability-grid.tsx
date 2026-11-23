import { TableSimple20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import {
  OCC_LABEL,
  PROPERTY,
  ROOM_TYPES,
  nightsFrom,
  occStep,
  occSwatch,
  occTint,
  rng,
  type OccStep,
} from "./_parts-a";

const NIGHTS = nightsFrom(14);

/** Open rooms per type and night (the server's availability), with the rooms blocked out of it. */
const AVAIL: number[][] = [
  [6, 5, 6, 6, 6, 5, 6, 6, 6, 6, 6, 6, 6, 6],
  [17, 17, 16, 17, 17, 16, 17, 17, 17, 17, 17, 17, 17, 16],
  [14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 13, 14],
  [12, 12, 12, 12, 12, 11, 12, 12, 12, 12, 12, 12, 12, 12],
  [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  [10, 10, 10, 10, 10, 10, 10, 10, 9, 10, 10, 10, 10, 10],
  [9, 9, 9, 9, 9, 8, 9, 9, 9, 9, 9, 9, 9, 9],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  [7, 7, 7, 7, 7, 6, 6, 7, 7, 7, 7, 7, 7, 7],
  [7, 7, 7, 7, 6, 7, 7, 7, 7, 7, 7, 7, 7, 7],
];
const BLOCKED = AVAIL.map((row, t) => row.map((a) => ROOM_TYPES[t].rooms - a));

/** Sold per type and night; the fair weekend (Fri 16 – Sat 17) runs hot and the Suite is overbooked on Saturday. */
const BASE_SOLD: number[][] = [
  [3, 3, 5, 6, 2, 2, 1, 2, 2, 4, 5, 1, 2, 2],
  [10, 12, 15, 17, 6, 7, 5, 6, 8, 13, 15, 4, 4, 6],
  [7, 8, 12, 13, 4, 3, 4, 3, 4, 10, 11, 3, 5, 6],
  [6, 7, 11, 12, 3, 3, 4, 4, 5, 8, 10, 4, 4, 4],
  [4, 5, 9, 10, 2, 4, 2, 3, 4, 7, 8, 3, 4, 3],
  [5, 6, 9, 10, 4, 3, 3, 4, 6, 8, 9, 3, 3, 4],
  [3, 4, 7, 8, 3, 3, 3, 2, 3, 6, 7, 2, 3, 2],
  [3, 3, 6, 7, 2, 2, 3, 3, 3, 6, 7, 3, 3, 3],
  [2, 3, 6, 8, 2, 3, 2, 2, 3, 5, 6, 2, 1, 2],
  [4, 4, 6, 7, 3, 3, 3, 3, 2, 5, 6, 2, 2, 1],
];

const BOOKING_CHANNELS = ["Booking.com", "Booking.com", "Expedia", "Agoda", "Online", "Booking.com", "Online"];

type Event = { id: number; t: number; d: number; kind: "book" | "cancel"; channel: string };
type Cell = { t: number; d: number };

const TICK_MS = 3400;

/** Revenue · large. Ten room types by fourteen nights of rooms left, tinted by how full each night is; bookings tick cells down live, hover a cell for sold, total and blocked. */
export function AvailabilityGridWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [sold, setSold] = useState(BASE_SOLD);
  const [event, setEvent] = useState<Event | null>(null);
  const [bumps, setBumps] = useState<Record<string, number>>({});
  const [hover, setHover] = useState<Cell | null>(null);
  const [counted, setCounted] = useState(false);
  const soldRef = useRef(sold);
  const next = useRef(rng(20261014));
  const ids = useRef(0);

  useEffect(() => {
    soldRef.current = sold;
  }, [sold]);

  useEffect(() => {
    const t = window.setTimeout(() => setCounted(true), (delay + 0.4) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    const iv = window.setInterval(() => {
      const r = next.current;
      const grid = soldRef.current;
      const cancel = r() < 0.25;
      let pick: Cell | null = null;
      for (let tries = 0; tries < 30 && !pick; tries++) {
        const d = Math.floor(Math.pow(r(), 1.5) * 14);
        const t = Math.floor(r() * ROOM_TYPES.length);
        const ok = cancel ? grid[t][d] > BASE_SOLD[t][d] : grid[t][d] < AVAIL[t][d];
        if (ok) pick = { t, d };
      }
      if (!pick) return;
      const { t, d } = pick;
      const id = ++ids.current;
      const step = cancel ? -1 : 1;
      setSold((g) => g.map((row, ti) => (ti === t ? row.map((v, di) => (di === d ? v + step : v)) : row)));
      setBumps((b) => ({ ...b, [`${t}-${d}`]: id }));
      setEvent({ id, t, d, kind: cancel ? "cancel" : "book", channel: BOOKING_CHANNELS[Math.floor(r() * BOOKING_CHANNELS.length)] });
    }, TICK_MS);
    return () => window.clearInterval(iv);
  }, []);

  const tonightSold = sold.reduce((s, row) => s + row[0], 0);
  const tonightOpen = AVAIL.reduce((s, row) => s + row[0], 0);
  const tonightLeft = tonightOpen - tonightSold;

  const sel: Cell = hover ?? (event ? { t: event.t, d: event.d } : { t: 1, d: 3 });
  const selType = ROOM_TYPES[sel.t];
  const selSold = sold[sel.t][sel.d];
  const selOpen = AVAIL[sel.t][sel.d];
  const selStep = occStep(selSold, selOpen);
  const selLeft = selOpen - selSold;

  return (
    <Widget size="large" index={index} label="Availability grid">
      <WidgetHeader
        icon={<TableSimple20Filled />}
        tint="var(--ios-blue)"
        title="Availability"
        subtitle={`${PROPERTY} · rooms left`}
        extra={
          <span className="flex items-center gap-1.5 rounded-full bg-fill-tertiary px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-secondary">
            <span className="relative flex size-1.5">
              <motion.span
                className="absolute inset-0 rounded-full bg-ios-green"
                animate={{ scale: [1, 2.4], opacity: [0.7, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
              />
              <span className="relative size-1.5 rounded-full bg-ios-green" />
            </span>
            Live
          </span>
        }
      />

      <div className="mt-2 flex h-[36px] items-baseline-last justify-between gap-3">
        <div className="flex items-baseline-last gap-2">
          <AnimatedNumber
            value={counted ? tonightLeft : 0}
            className="text-[30px] leading-none font-semibold tracking-tight text-heading"
          />
          <div className="mb-0.5 text-[11px] leading-tight whitespace-nowrap text-tertiary">
            left tonight
            <div>
              <AnimatedNumber value={counted ? tonightSold : 0} className="font-semibold text-secondary" /> sold of {tonightOpen}
            </div>
          </div>
        </div>
        <div className="flex min-w-0 flex-col items-end gap-1.5">
          <div className="h-5 max-w-full overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              {event ? (
                <motion.span
                  key={event.id}
                  className={cn(
                    "flex h-5 items-center gap-1 rounded-full px-2 text-[11px] whitespace-nowrap",
                    event.kind === "book" ? "bg-ios-blue/12 text-secondary" : "bg-ios-green/12 text-secondary",
                  )}
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -14, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 30 }}
                >
                  <span className="font-semibold text-heading">{event.channel}</span>
                  <span className="truncate">
                    {ROOM_TYPES[event.t].id} · {NIGHTS[event.d].weekday} {NIGHTS[event.d].day}
                  </span>
                  <span className={cn("font-semibold tabular", event.kind === "book" ? "text-ios-blue" : "text-ios-green")}>
                    {event.kind === "book" ? "−1" : "+1"}
                  </span>
                </motion.span>
              ) : (
                <motion.span key="wait" className="flex h-5 items-center text-[11px] text-tertiary">
                  Waiting for bookings…
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-[3px] text-[9px] text-tertiary">
            Quiet
            {([0, 1, 2, 3, 4, 5, 6] as OccStep[]).map((s) => (
              <span key={s} className="h-2 w-2.5 rounded-[2px]" style={occSwatch(s)} />
            ))}
            Full
          </div>
        </div>
      </div>

      <div
        className="mt-2 grid min-h-0 flex-1 gap-[2px]"
        style={{
          gridTemplateColumns: "26px repeat(14, minmax(0, 1fr))",
          gridTemplateRows: "20px repeat(10, minmax(0, 1fr))",
        }}
        onMouseLeave={() => setHover(null)}
      >
        <motion.span
          aria-hidden
          className="-m-[2px] rounded-md bg-ios-blue/12"
          style={{ gridColumn: 2, gridRow: "1 / -1" }}
          initial={{ opacity: 0, scaleY: 0.6 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ delay, type: "spring", stiffness: 200, damping: 24 }}
        />
        {NIGHTS.map((n, d) => (
          <span
            key={`h${d}`}
            className={cn(
              "relative z-10 flex flex-col items-center justify-center text-[9px] leading-[10px] tabular",
              n.today ? "font-semibold text-ios-blue" : n.weekend ? "text-secondary" : "text-tertiary",
              hover?.d === d && "text-heading",
            )}
            style={{ gridColumn: d + 2, gridRow: 1 }}
          >
            <span>{n.letter}</span>
            <span className="font-semibold">{n.day}</span>
          </span>
        ))}
        {ROOM_TYPES.map((type, t) => (
          <span
            key={`l${type.id}`}
            className={cn(
              "flex items-center text-[10px] font-semibold tabular transition-colors",
              hover?.t === t ? "text-heading" : "text-tertiary",
            )}
            style={{ gridColumn: 1, gridRow: t + 2 }}
          >
            {type.id}
          </span>
        ))}
        {ROOM_TYPES.map((type, t) =>
          NIGHTS.map((_, d) => {
            const s = sold[t][d];
            const open = AVAIL[t][d];
            const left = open - s;
            const tint = occTint(occStep(s, open));
            const k = `${t}-${d}`;
            const bump = bumps[k];
            const active = sel.t === t && sel.d === d;
            const kind = event && event.t === t && event.d === d ? event.kind : null;
            return (
              <motion.span
                key={k}
                onMouseEnter={() => setHover({ t, d })}
                className={cn(
                  "relative z-10 grid cursor-default place-items-center rounded-[4px] text-[11px] font-semibold tabular transition-colors duration-500",
                  tint.className,
                  active && "ring-1 ring-inset ring-sel",
                )}
                style={{ ...tint.style, gridColumn: d + 2, gridRow: t + 2 }}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.22, zIndex: 20 }}
                transition={{ type: "spring", stiffness: 420, damping: 24, delay: counted ? 0 : delay + t * 0.025 + d * 0.014 }}
                aria-label={`${type.id} ${type.name}, ${NIGHTS[d].long}: ${left} left`}
              >
                <motion.span
                  key={bump ?? 0}
                  initial={bump ? { scale: 1.7, y: -2 } : false}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 16 }}
                >
                  {left < 0 ? `−${-left}` : left}
                </motion.span>
                <AnimatePresence>
                  {bump && kind ? (
                    <motion.span
                      key={`r${bump}`}
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute inset-0 rounded-[4px] ring-2",
                        kind === "book" ? "ring-ios-blue" : "ring-ios-green",
                      )}
                      initial={{ opacity: 1, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.9 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                    />
                  ) : null}
                </AnimatePresence>
              </motion.span>
            );
          }),
        )}
      </div>

      <div className="mt-2 flex h-[44px] shrink-0 items-center gap-3 rounded-xl bg-fill-quaternary px-3">
        <span className="h-6 w-1.5 shrink-0 rounded-full transition-colors" style={occSwatch(selStep)} />
        <div className="min-w-0 flex-1 leading-tight">
          <motion.div
            key={`${sel.t}-${sel.d}`}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            className="truncate text-[12px] font-semibold text-heading"
          >
            {selType.id} {selType.name}
          </motion.div>
          <div className="truncate text-[11px] text-tertiary">
            {NIGHTS[sel.d].today ? "Tonight" : NIGHTS[sel.d].long} · {OCC_LABEL[selStep]}
          </div>
        </div>
        <div className="shrink-0 text-right leading-tight">
          <div className="text-[12px] text-tertiary">
            <AnimatedNumber value={selSold} className="font-semibold text-heading" /> sold / {selOpen}
          </div>
          <div className="text-[11px] whitespace-nowrap text-tertiary tabular">
            {BLOCKED[sel.t][sel.d] ? `${BLOCKED[sel.t][sel.d]} blocked · ` : ""}
            <span className={cn(selLeft < 0 ? "font-semibold text-ios-red" : selLeft === 0 ? "text-ios-orange" : "")}>
              {selLeft < 0 ? `overbooked by ${-selLeft}` : selLeft === 0 ? "sold out" : `${selLeft} left`}
            </span>
          </div>
        </div>
      </div>
    </Widget>
  );
}
