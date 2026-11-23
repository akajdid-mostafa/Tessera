import { ArrowTrendingLines20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { ROOM_TYPES, TOTAL_ROOMS, nightsFrom, rng } from "./_parts-a";

const NIGHTS = nightsFrom(14);
/** Bookings made in the last 7 days that hold each night, from the business date on. */
const BASE = [6, 9, 22, 18, 3, 4, 5, 2, 6, 11, 14, 1, 0, 3];

/** Tint strength by the share of the rooms a night's pickup is: none, then three steps at 8% and 20%. */
const pickupLevel = (count: number, rooms: number): 0 | 1 | 2 | 3 => {
  if (count <= 0 || rooms <= 0) return 0;
  const share = count / rooms;
  return share >= 0.2 ? 3 : share >= 0.08 ? 2 : 1;
};
const LEVEL_BAR = ["bg-transparent", "bg-ios-green/35", "bg-ios-green/65", "bg-ios-green"];
const LEVEL_NAME = ["No pickup", "Light", "Steady", "Strong"];

const GUESTS = ["Megan Turner", "John Smith", "Lena Brooks", "Marco Rossi", "Dana Mitchell", "Olivia Brown", "Emily Carter", "Anna Müller"];
const SOURCES = ["Booking.com", "Booking.com", "Expedia", "Agoda", "Online"];

type Booking = { id: number; start: number; nights: number; guest: string; channel: string; type: number };

const TICK_MS = 3800;
const KEEP = 5;

/** Revenue · medium. Fourteen nights of pickup tinted by share of rooms; new bookings ripple into the nights they hold, hover a night for its count and share. */
export function PickupRowWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [counts, setCounts] = useState(BASE);
  const [ripples, setRipples] = useState<Record<number, number>>({});
  const [latest, setLatest] = useState<Booking | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [grown, setGrown] = useState(false);
  const queue = useRef<Booking[]>([]);
  const timers = useRef<number[]>([]);
  const next = useRef(rng(7261026));
  const ids = useRef(0);

  useEffect(() => {
    const t = window.setTimeout(() => setGrown(true), (delay + 0.5) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    const bump = (night: number, by: number) =>
      setCounts((c) => c.map((v, i) => (i === night ? Math.max(0, v + by) : v)));

    const iv = window.setInterval(() => {
      const r = next.current;
      const id = ++ids.current;
      const start = Math.min(12, Math.floor(Math.pow(r(), 1.3) * 13));
      const nights = Math.min(14 - start, 1 + Math.floor(r() * 3));
      const b: Booking = {
        id,
        start,
        nights,
        guest: GUESTS[Math.floor(r() * GUESTS.length)],
        channel: SOURCES[Math.floor(r() * SOURCES.length)],
        type: Math.floor(r() * ROOM_TYPES.length),
      };
      setLatest(b);
      for (let k = 0; k < nights; k++) {
        const night = start + k;
        timers.current.push(
          window.setTimeout(() => {
            bump(night, 1);
            setRipples((m) => ({ ...m, [night]: id * 100 + k }));
          }, k * 170),
        );
      }
      queue.current.push(b);
      if (queue.current.length > KEEP) {
        const old = queue.current.shift()!;
        timers.current.push(
          window.setTimeout(() => {
            for (let k = 0; k < old.nights; k++) bump(old.start + k, -1);
          }, 1500),
        );
      }
      if (timers.current.length > 40) timers.current = timers.current.slice(-20);
    }, TICK_MS);
    return () => {
      window.clearInterval(iv);
      timers.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const total = counts.reduce((s, v) => s + v, 0);
  const max = Math.max(...BASE, ...counts, 1);
  const h = hover !== null ? counts[hover] : 0;
  const hLevel = pickupLevel(h, TOTAL_ROOMS);

  return (
    <Widget size="medium" index={index} label="Pickup by night">
      <WidgetHeader
        icon={<ArrowTrendingLines20Filled />}
        tint="var(--ios-green)"
        title="Pickup"
        subtitle="Booked in the last 7 days · per night"
        extra={
          <span className="flex items-baseline gap-1 rounded-full bg-ios-green/15 px-2 py-0.5 text-[13px] font-semibold whitespace-nowrap text-ios-green">
            <AnimatedNumber value={grown ? total : 0} prefix="+" />
            <span className="text-[10px] font-medium">room nights</span>
          </span>
        }
      />

      <div className="mt-2 flex min-h-0 flex-1 gap-[3px]" onMouseLeave={() => setHover(null)}>
        {NIGHTS.map((n, i) => {
          const c = counts[i];
          const level = pickupLevel(c, TOTAL_ROOMS);
          const active = hover === i;
          return (
            <div key={i} className="flex min-w-0 flex-1 flex-col items-center" onMouseEnter={() => setHover(i)}>
              <span
                className={cn(
                  "text-[9px] leading-[10px]",
                  n.today ? "font-semibold text-ios-blue" : active ? "text-heading" : n.weekend ? "text-secondary" : "text-tertiary",
                )}
              >
                {n.letter}
              </span>
              <motion.div
                className={cn(
                  "relative mt-1 flex w-full flex-1 cursor-default flex-col items-center rounded-[6px] bg-fill-quaternary",
                  active && "ring-1 ring-inset ring-sel",
                  n.today && !active && "ring-1 ring-ios-blue/50",
                )}
                whileHover={{ y: -2 }}
              >
                <motion.span
                  key={ripples[i] ?? 0}
                  className={cn(
                    "relative z-10 mt-1 text-[10px] leading-3 font-semibold tabular",
                    c ? "text-heading" : "text-tertiary",
                  )}
                  initial={ripples[i] ? { scale: 1.5, y: -2 } : false}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 520, damping: 15 }}
                >
                  {c ? `+${c}` : "0"}
                </motion.span>
                <div className="relative mt-1 w-full flex-1 px-[3px] pb-[3px]">
                  <div className="relative h-full w-full">
                  <motion.div
                    className={cn("absolute inset-x-0 bottom-0 rounded-[3px] transition-colors duration-500", LEVEL_BAR[level])}
                    initial={{ height: "0%" }}
                    animate={{ height: `${(c / max) * 100}%` }}
                    transition={{ type: "spring", stiffness: 220, damping: 24, delay: grown ? 0 : delay + i * 0.035 }}
                  />
                  </div>
                </div>
                <AnimatePresence>
                  {ripples[i] ? (
                    <motion.span
                      key={ripples[i]}
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-[6px] ring-2 ring-ios-green"
                      initial={{ opacity: 0.95, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.35 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                    />
                  ) : null}
                </AnimatePresence>
              </motion.div>
              <span
                className={cn(
                  "mt-1 text-[9px] leading-[10px] tabular",
                  n.today ? "font-semibold text-ios-blue" : active ? "text-heading" : "text-tertiary",
                )}
              >
                {n.day}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 h-4 text-[11px] leading-4 whitespace-nowrap">
        <AnimatePresence mode="wait" initial={false}>
          {hover !== null ? (
            <motion.div
              key={`h${hover}`}
              className="flex items-center gap-1.5 truncate text-tertiary"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <span className="font-semibold text-heading">{NIGHTS[hover].today ? "Tonight" : NIGHTS[hover].long}</span>
              <span>
                · <span className="font-semibold text-secondary tabular">+{h}</span> booking{h === 1 ? "" : "s"} ·{" "}
                <span className="tabular">{Math.round((h / TOTAL_ROOMS) * 100)}%</span> of {TOTAL_ROOMS} rooms ·
              </span>
              <span className={cn("font-medium", hLevel === 3 ? "text-ios-green" : "text-secondary")}>{LEVEL_NAME[hLevel]}</span>
            </motion.div>
          ) : latest ? (
            <motion.div
              key={`b${latest.id}`}
              className="flex items-center gap-1.5 truncate text-tertiary"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
            >
              <MemojiAvatar who={latest.guest} size={16} className="shrink-0" />
              <span className="font-semibold text-heading">{latest.guest}</span>
              <span className="truncate">
                · {latest.channel} · {ROOM_TYPES[latest.type].id} · {latest.nights} night{latest.nights === 1 ? "" : "s"} from{" "}
                {NIGHTS[latest.start].weekday} {NIGHTS[latest.start].day}
              </span>
            </motion.div>
          ) : (
            <motion.div key="idle" className="truncate text-tertiary" exit={{ opacity: 0 }}>
              Fri 16 – Sat 17 lead the week · hover a night for its share
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
