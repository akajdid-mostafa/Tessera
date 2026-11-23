import { Crown16Filled } from "@fluentui/react-icons";
import type { Format } from "@number-flow/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { entranceDelay } from "./_parts-b";

type Stat = { label: string; value: number; format?: Format; danger?: boolean };
type Insight = {
  id: "topProduct" | "busiestDay" | "cancellationRate";
  label: string;
  title: string;
  stats: [Stat, Stat];
};

const PERCENT: Format = { style: "percent", maximumFractionDigits: 0 };

/* The overview's insights (`OverviewInsight.messageKey`), as of Monday 9 November. */
const INSIGHTS: Insight[] = [
  {
    id: "topProduct",
    label: "Best seller · 30 days",
    title: "Montezuma Castle Tour",
    stats: [
      { label: "Bookings", value: 48 },
      { label: "Of all sales", value: 48 / 166, format: PERCENT },
    ],
  },
  {
    id: "busiestDay",
    label: "Busiest · next 7 days",
    title: "Saturday, 14 November",
    stats: [
      { label: "Occupancy", value: 0.92, format: PERCENT },
      { label: "Seats left", value: 4 },
    ],
  },
  {
    id: "cancellationRate",
    label: "Cancellation rate · 30 days",
    title: "7 of 166 bookings",
    stats: [
      { label: "Rate", value: 0.042, format: { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }, danger: true },
      { label: "Cancelled", value: 7, danger: true },
    ],
  },
];

/** Tour sales · medium. The month's best-selling tour on a photo cover with a crown that bounces in; tap to page through the busiest day ahead and the cancellation rate. */
export function BestSellerWidget({ index }: { index?: number }) {
  const delay = entranceDelay(index);
  const [page, setPage] = useState(0);
  const [touched, setTouched] = useState(false);
  const ins = INSIGHTS[page];
  // The first page waits for the widget to land; later pages start at once.
  const start = touched ? 0.15 : delay;

  return (
    <Widget
      size="medium"
      index={index}
      label="Sales insights"
      pressable
      onPress={() => {
        setTouched(true);
        setPage((p) => (p + 1) % INSIGHTS.length);
      }}
    >
      <div className="flex min-h-0 flex-1 gap-3">
        <div className="relative w-[168px] shrink-0 overflow-hidden rounded-[14px]">
          {/* No `initial={false}` here: it would also hold back the crown, bars and dots inside the first cover. */}
          <AnimatePresence mode="popLayout">
            <motion.div
              key={ins.id}
              className="absolute inset-0"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
            >
              {ins.id === "topProduct" ? <MontezumaCover start={start} /> : null}
              {ins.id === "busiestDay" ? <WeekCover start={start} /> : null}
              {ins.id === "cancellationRate" ? <DotsCover start={start} /> : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={ins.id}
              className="leading-tight"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <div className="truncate pr-9 text-[10.5px] text-tertiary">{ins.label}</div>
              <div className="mt-0.5 line-clamp-2 text-[15px] font-semibold text-heading">{ins.title}</div>
            </motion.div>
          </AnimatePresence>

          <div className="absolute top-[3px] right-0 flex items-center gap-1" aria-hidden>
            {INSIGHTS.map((x, i) => (
              <motion.span
                key={x.id}
                className={cn("h-[5px] rounded-full", i === page ? "bg-heading" : "bg-fill")}
                animate={{ width: i === page ? 12 : 5 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            ))}
          </div>

          <div className="mt-auto grid grid-cols-2 gap-1.5">
            {ins.stats.map((st, i) => (
              <div key={`${ins.id}-${st.label}`} className="min-w-0 rounded-[10px] bg-fill-tertiary px-2 py-1.5 leading-tight">
                <div className="truncate text-[10px] text-tertiary">{st.label}</div>
                <Hero value={st.value} format={st.format} after={start + 0.2 + i * 0.08} danger={st.danger} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Widget>
  );
}

/** The hero figure, rolling up from zero each time its page shows. */
function Hero({ value, format, after, danger }: { value: number; format?: Format; after: number; danger?: boolean }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setShown(value), after * 1000);
    return () => window.clearTimeout(t);
  }, [value, after]);
  return (
    <AnimatedNumber
      value={shown}
      format={format}
      className={cn("block text-[20px] leading-none font-semibold tracking-tight", danger ? "text-ios-red" : "text-heading")}
    />
  );
}

/** Red-rock buttes in the Arizona high desert (Unsplash, free license), served from their CDN. */
const COVER = "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=336&h=328&fit=crop&auto=format&q=70";

/** The best seller's cover: a real desert photo drifting slowly, with a crown that bounces in. */
function MontezumaCover({ start }: { start: number }) {
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#c8734a_0%,#7a3d2a_100%)]" aria-hidden />
      <motion.img
        src={COVER}
        alt=""
        draggable={false}
        loading="lazy"
        className="absolute inset-0 size-full object-cover"
        initial={{ scale: 1.15, opacity: 0 }}
        animate={{ scale: [1.05, 1.13, 1.05], opacity: 1 }}
        transition={{ scale: { duration: 16, repeat: Infinity, ease: "easeInOut", delay: start }, opacity: { duration: 0.5, delay: start } }}
      />
      <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(0,0,0,0.4)_100%)]" />
      <motion.span
        className="absolute top-2 left-2 grid size-6 place-items-center rounded-full bg-ios-yellow-deep text-[14px] text-white shadow-[0_3px_8px_-2px_rgba(0,0,0,0.35)]"
        initial={{ y: -22, opacity: 0, rotate: -18 }}
        animate={{ y: [-22, 0, -7, 0], opacity: 1, rotate: [-18, 0, 6, 0] }}
        transition={{ duration: 0.9, times: [0, 0.45, 0.7, 1], ease: "easeOut", delay: start + 0.15 }}
        aria-label="Best seller"
        role="img"
      >
        <Crown16Filled />
      </motion.span>
      <span className="absolute right-2 bottom-1.5 rounded-full bg-black/35 px-1.5 text-[9px] font-medium text-white">
        Camp Verde · Arizona
      </span>
    </>
  );
}

const WEEK = [
  { d: "T", occ: 58 },
  { d: "W", occ: 64 },
  { d: "T", occ: 71 },
  { d: "F", occ: 83 },
  { d: "S", occ: 92 },
  { d: "S", occ: 86 },
  { d: "M", occ: 61 },
];

/** The next seven departure days as occupancy bars, Saturday lit. */
function WeekCover({ start }: { start: number }) {
  return (
    <div className="absolute inset-0 flex items-end justify-between bg-[linear-gradient(135deg,#5e5ce6_0%,#7b61ff_60%,#a07bff_100%)] px-3 pt-2 pb-1.5">
      {WEEK.map((w, i) => {
        const top = i === 4;
        return (
          <div key={i} className="flex h-full w-[14px] flex-col items-center justify-end gap-1">
            <motion.span
              className={cn("w-full rounded-[4px]", top ? "bg-white" : "bg-white/40")}
              initial={{ height: 0 }}
              animate={{ height: (w.occ / 100) * 118 }}
              transition={{ type: "spring", stiffness: 160, damping: 18, delay: start + i * 0.05 }}
            />
            <span className={cn("text-[9px] leading-none font-semibold", top ? "text-white" : "text-white/70")}>{w.d}</span>
          </div>
        );
      })}
    </div>
  );
}

const COLS = 13;
const TOTAL = 166;
const CANCELLED = new Set([17, 40, 58, 91, 112, 137, 151]);

/** Every booking of the month as a dot; the seven cancelled ones turn red. */
function DotsCover({ start }: { start: number }) {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(135deg,#2c3e50_0%,#3f5872_100%)]">
      <svg viewBox="0 0 168 164" className="absolute inset-0 size-full" aria-hidden>
        {Array.from({ length: TOTAL }, (_, i) => {
          const x = 18 + (i % COLS) * 11;
          const y = 16 + Math.floor(i / COLS) * 11;
          const red = CANCELLED.has(i);
          return red ? (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r={3.4}
              fill="var(--ios-red)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{ transformOrigin: `${x}px ${y}px` }}
              transition={{ type: "spring", stiffness: 500, damping: 14, delay: start + 0.3 + [...CANCELLED].indexOf(i) * 0.08 }}
            />
          ) : (
            <circle key={i} cx={x} cy={y} r={2.4} fill="#ffffff" opacity={0.38} />
          );
        })}
      </svg>
    </div>
  );
}
