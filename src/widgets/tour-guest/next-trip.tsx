import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { daysBetween, solidFill, TODAY, USD_FMT, usd } from "./_parts-a";

type Status = "confirmed" | "option" | "request";
type Trip = {
  id: string;
  title: string;
  date: string;
  when: string;
  where: string;
  status: Status;
  paid: number;
  total: number;
};

/* The demo account's upcoming reservations on the storefront, soonest first. */
const TRIPS: Trip[] = [
  { id: "RT-24817", title: "Red Rock 3-Day Package Tour", date: "2027-06-14", when: "Mon, Jun 14", where: "Flagstaff · Sedona · Oak Creek", status: "confirmed", paid: 915, total: 3050 },
  { id: "RT-24760", title: "Red Rock Spa & Massage", date: "2027-06-15", when: "Tue, Jun 15 · 17:30", where: "Oak Creek Resort, Sedona", status: "confirmed", paid: 360, total: 360 },
  { id: "RT-24790", title: "Lake Powell Boat Tour", date: "2027-07-03", when: "Sat, Jul 3 · 11:00", where: "Wahweap Marina", status: "option", paid: 0, total: 670 },
];

const STATUS: Record<Status, { label: string; cls: string; dot: string }> = {
  confirmed: { label: "Confirmed", cls: "bg-ios-green/15 text-ios-green", dot: "bg-ios-green" },
  option: { label: "On option", cls: "bg-ios-orange/15 text-ios-orange", dot: "bg-ios-orange" },
  request: { label: "Requested", cls: "bg-ios-blue/15 text-ios-blue", dot: "bg-ios-blue" },
};

const CARD_H = 46;

/** One half of a split-flap card, opaque so the flaps can cover each other. */
function Half({ d, part }: { d: number; part: "top" | "bottom" }) {
  return (
    <div
      className={cn(
        "absolute inset-x-0 h-1/2 overflow-hidden",
        part === "top" ? "top-0 rounded-t-[8px]" : "bottom-0 rounded-b-[8px]",
      )}
      style={{ background: solidFill("fill-secondary") }}
    >
      <span
        className={cn(
          "absolute inset-x-0 grid place-items-center text-[32px] leading-none font-semibold text-heading tabular",
          part === "top" ? "top-0" : "bottom-0",
        )}
        style={{ height: CARD_H }}
      >
        {d}
      </span>
    </div>
  );
}

/** A split-flap digit that tumbles forward, one flap at a time, to its target. */
function FlipDigit({ target, delay }: { target: number; delay: number }) {
  const [cur, setCur] = useState(0);
  const [prev, setPrev] = useState(0);
  const [flips, setFlips] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (cur === target) return;
    const wait = started.current ? 80 : delay * 1000;
    const t = window.setTimeout(() => {
      started.current = true;
      const from = cur;
      setPrev(from);
      setCur((from + 1) % 10);
      setFlips((f) => f + 1);
    }, wait);
    return () => window.clearTimeout(t);
  }, [cur, target, delay]);

  return (
    <span className="relative block w-[34px] [perspective:220px]" style={{ height: CARD_H }}>
      <Half d={cur} part="top" />
      <Half d={flips ? prev : cur} part="bottom" />
      {flips ? (
        <>
          <motion.div
            key={`out-${flips}`}
            className="absolute inset-0 origin-center [backface-visibility:hidden]"
            initial={{ rotateX: 0 }}
            animate={{ rotateX: -90 }}
            transition={{ duration: 0.08, ease: "easeIn" }}
          >
            <Half d={prev} part="top" />
          </motion.div>
          <motion.div
            key={`in-${flips}`}
            className="absolute inset-0 origin-center [backface-visibility:hidden]"
            initial={{ rotateX: 90 }}
            animate={{ rotateX: 0 }}
            transition={{ duration: 0.1, delay: 0.08, ease: "easeOut" }}
          >
            <Half d={cur} part="bottom" />
          </motion.div>
        </>
      ) : null}
      {/* The hinge. */}
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-widget-surface" />
    </span>
  );
}

/** Tour guest · small. The storefront customer's next trip as split-flap day digits with its status and how much is paid; tap to page trips. */
export function NextTripWidget({ index }: { index?: number }) {
  const [page, setPage] = useState(0);
  const [paged, setPaged] = useState(false);
  const trip = TRIPS[page];
  const delay = 0.3 + (index ?? 0) * 0.06;
  const days = Math.max(0, daysBetween(TODAY, trip.date));
  const digits = String(Math.min(days, 999)).padStart(3, "0").split("").map(Number);
  const st = STATUS[trip.status];
  const full = trip.paid >= trip.total;

  return (
    <Widget
      size="small"
      index={index}
      label="Next trip"
      pressable
      onPress={() => {
        setPaged(true);
        setPage((p) => (p + 1) % TRIPS.length);
      }}
    >
      <div className="flex h-5 items-center gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={trip.status}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className={cn(
              "flex items-center gap-1 rounded-full px-2 text-[11px] leading-5 font-semibold whitespace-nowrap",
              st.cls,
            )}
          >
            <span className={cn("size-1.5 rounded-full", st.dot)} />
            {st.label}
          </motion.span>
        </AnimatePresence>
        <div className="ml-auto flex gap-1" aria-hidden>
          {TRIPS.map((t, i) => (
            <span
              key={t.id}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === page ? "w-3 bg-heading" : "w-1.5 bg-fill",
              )}
            />
          ))}
        </div>
      </div>

      <div className="mt-2.5 flex items-end gap-1">
        {digits.map((d, i) => (
          <FlipDigit key={i} target={d} delay={delay + 0.2 + i * 0.12} />
        ))}
        <div className="ml-1 pb-0.5 text-[11px] leading-tight text-tertiary">
          days
          <br />
          to go
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={trip.id}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="mt-2 leading-tight"
        >
          <div className="truncate text-[13px] font-semibold text-heading">{trip.title}</div>
          <div className="truncate text-[11px] text-tertiary">
            {trip.when} · {trip.where}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-auto">
        <div className="h-1 overflow-hidden rounded-full bg-fill-secondary">
          <motion.div
            className={cn("h-full rounded-full", full ? "bg-ios-green" : "bg-ios-blue")}
            initial={{ width: 0 }}
            animate={{ width: `${(trip.paid / trip.total) * 100}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 18, delay: paged ? 0 : delay + 0.3 }}
          />
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-1 text-[11px] whitespace-nowrap">
          <span className={cn("font-semibold", full ? "text-ios-green" : "text-heading")}>
            {full ? (
              "Paid in full"
            ) : (
              <>
                <AnimatedNumber value={trip.paid} prefix="$" format={USD_FMT} /> paid
              </>
            )}
          </span>
          <span className="text-tertiary tabular">of {usd(trip.total)}</span>
        </div>
      </div>
    </Widget>
  );
}
