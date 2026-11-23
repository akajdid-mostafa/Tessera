import { Airplane20Filled } from "@fluentui/react-icons";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const TRIPS = [
  {
    city: "Lisbon",
    country: "Portugal",
    month: 11,
    day: 2,
    hour: 9,
    flight: "TP 1758",
    bg: "linear-gradient(155deg,#ffb36b 0%,#ff6f7d 52%,#a2479e 100%)",
  },
  {
    city: "Cape Town",
    country: "South Africa",
    month: 1,
    day: 14,
    hour: 21,
    flight: "AX 44",
    bg: "linear-gradient(155deg,#38d0c9 0%,#2a86e0 55%,#1c3f8c 100%)",
  },
  {
    city: "Kyoto",
    country: "Japan",
    month: 3,
    day: 28,
    hour: 1,
    flight: "AX 86",
    bg: "linear-gradient(155deg,#f6a6c8 0%,#c573d9 50%,#5b3fa8 100%)",
  },
] as const;

/** The next occurrence of a month/day/hour, so the countdown never goes negative. */
function departure(t: (typeof TRIPS)[number], now: number) {
  const y = new Date(now).getFullYear();
  let d = new Date(y, t.month - 1, t.day, t.hour, 0, 0).getTime();
  if (d <= now) d = new Date(y + 1, t.month - 1, t.day, t.hour, 0, 0).getTime();
  return d;
}

/* The plane's glide path, a shallow arc in a 72×34 box. */
const P0 = { x: 4, y: 30 };
const P1 = { x: 36, y: -4 };
const P2 = { x: 68, y: 22 };
const ARC = `M${P0.x} ${P0.y} Q${P1.x} ${P1.y} ${P2.x} ${P2.y}`;
const q = (t: number, a: number, b: number, c: number) => (1 - t) ** 2 * a + 2 * (1 - t) * t * b + t ** 2 * c;
const angle = (t: number) =>
  (Math.atan2(2 * (1 - t) * (P1.y - P0.y) + 2 * t * (P2.y - P1.y), 2 * (1 - t) * (P1.x - P0.x) + 2 * t * (P2.x - P1.x)) * 180) /
  Math.PI;

/** Travel · small. Days to the next trip on its destination's colors; tap to page trips, the plane keeps gliding. */
export function TripCountdownWidget({ index }: { index?: number }) {
  const [page, setPage] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const trip = TRIPS[page];

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const t = useMotionValue(0);
  const x = useTransform(t, (v) => q(v, P0.x, P1.x, P2.x));
  const y = useTransform(t, (v) => q(v, P0.y, P1.y, P2.y));
  const rotate = useTransform(t, angle);
  const opacity = useTransform(t, [0, 0.12, 0.85, 1], [0, 1, 1, 0]);

  useEffect(() => {
    const c = animate(t, [0, 1], {
      duration: 5.5,
      ease: "easeInOut",
      repeat: Infinity,
      repeatDelay: 1.2,
      delay: 0.4 + (index ?? 0) * 0.06,
    });
    return () => c.stop();
  }, [t, index]);

  const dep = departure(trip, now);
  const left = Math.max(0, dep - now);
  const days = Math.floor(left / 86_400_000);
  const hours = Math.floor((left % 86_400_000) / 3_600_000);
  const mins = Math.floor((left % 3_600_000) / 60_000);
  const date = new Date(dep).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <Widget
      size="small"
      index={index}
      label="Trip countdown"
      pressable
      onPress={() => setPage((n) => (n + 1) % TRIPS.length)}
      surfaceClassName="ring-white/10"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <AnimatePresence initial={false}>
          <motion.div
            key={trip.city}
            className="absolute inset-0"
            style={{ background: trip.bg }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        </AnimatePresence>
        <div className="absolute -bottom-10 -left-8 size-32 rounded-full bg-white/15 blur-2xl" />
      </div>

      <div className="relative flex h-full flex-col text-white">
        <svg viewBox="0 0 72 34" className="absolute -right-1 -top-1 h-[34px] w-[72px] overflow-visible" aria-hidden>
          <path d={ARC} fill="none" stroke="white" strokeOpacity="0.45" strokeWidth="1.2" strokeDasharray="2 3" />
          <motion.g style={{ x, y, opacity }}>
            <motion.g style={{ rotate }}>
              <g transform="translate(-7 -7)">
                <Airplane20Filled width={14} height={14} color="white" />
              </g>
            </motion.g>
          </motion.g>
        </svg>

        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={trip.city}
            initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
            className="max-w-[78px] leading-tight"
          >
            <div className="truncate text-[15px] font-semibold">{trip.city}</div>
            <div className="truncate text-[11px] text-white/75">{trip.country}</div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-auto flex items-baseline-last gap-1.5 leading-none">
          <AnimatedNumber value={days} className="text-[40px] font-semibold tracking-tight" />
          <span className="mb-1 text-[13px] font-medium text-white/80">{days === 1 ? "day" : "days"}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-white/80">
          <span className="truncate tabular">
            {date} ·{" "}
            <AnimatedNumber value={hours} className="font-semibold text-white" />h{" "}
            <AnimatedNumber value={mins} format={{ minimumIntegerDigits: 2 }} trend={-1} className="font-semibold text-white" />m
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[10px] text-white/70">{trip.flight}</span>
          <div className="flex gap-1">
            {TRIPS.map((x, i) => (
              <motion.span
                key={x.city}
                layout
                className={cn("h-1.5 rounded-full", i === page ? "w-3.5 bg-white" : "w-1.5 bg-white/40")}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            ))}
          </div>
        </div>
      </div>
    </Widget>
  );
}
