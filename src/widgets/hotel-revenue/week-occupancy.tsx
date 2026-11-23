import { Bed20Filled, ChevronLeft16Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { occupancyPreset, PRESET, pct, ROOM_TYPES } from "./_parts-c";

type Week = {
  key: string;
  range: string;
  days: string[];
  /** Per room type in ROOM_TYPES order: availability and sold for each night, Monday first. */
  rows: { avail: number[]; sold: number[] }[];
};

/* Seabright Villas' room type days: the PMS week (ISO 42) and the holiday week (ISO 52). */
const WEEKS: Week[] = [
  {
    key: "W42",
    range: "Oct 12–18",
    days: ["Mon 12", "Tue 13", "Wed 14", "Thu 15", "Fri 16", "Sat 17", "Sun 18"],
    rows: [
      { avail: [6, 6, 6, 5, 6, 6, 6], sold: [2, 1, 1, 2, 3, 2, 2] },
      { avail: [17, 17, 17, 17, 16, 17, 17], sold: [3, 5, 6, 6, 10, 8, 3] },
      { avail: [14, 14, 14, 14, 14, 14, 14], sold: [5, 5, 4, 5, 9, 4, 4] },
      { avail: [12, 12, 12, 12, 12, 12, 12], sold: [5, 4, 4, 5, 8, 6, 2] },
      { avail: [10, 10, 10, 10, 10, 10, 10], sold: [3, 2, 3, 3, 7, 7, 2] },
      { avail: [10, 10, 10, 10, 10, 10, 10], sold: [2, 3, 3, 2, 6, 3, 4] },
      { avail: [9, 9, 9, 9, 9, 9, 9], sold: [2, 2, 2, 2, 6, 4, 3] },
      { avail: [8, 8, 8, 8, 8, 8, 8], sold: [3, 3, 2, 2, 4, 5, 2] },
      { avail: [7, 7, 7, 7, 7, 7, 7], sold: [2, 3, 2, 2, 4, 5, 2] },
      { avail: [7, 7, 7, 7, 7, 7, 6], sold: [2, 1, 2, 3, 2, 3, 3] },
    ],
  },
  {
    key: "W52",
    range: "Dec 21–27",
    days: ["Mon 21", "Tue 22", "Wed 23", "Thu 24", "Fri 25", "Sat 26", "Sun 27"],
    rows: [
      { avail: [6, 6, 6, 6, 6, 6, 6], sold: [4, 4, 3, 3, 5, 4, 5] },
      { avail: [17, 17, 17, 17, 17, 17, 17], sold: [9, 16, 10, 13, 8, 12, 13] },
      { avail: [14, 14, 14, 14, 14, 14, 14], sold: [8, 12, 9, 7, 13, 13, 10] },
      { avail: [12, 12, 12, 12, 12, 12, 12], sold: [9, 11, 6, 6, 6, 11, 11] },
      { avail: [10, 10, 10, 10, 10, 10, 10], sold: [5, 8, 10, 5, 9, 6, 7] },
      { avail: [10, 10, 10, 10, 10, 10, 10], sold: [8, 5, 9, 10, 7, 7, 8] },
      { avail: [9, 9, 9, 9, 9, 9, 9], sold: [7, 8, 4, 5, 6, 5, 4] },
      { avail: [8, 8, 8, 8, 8, 8, 8], sold: [6, 7, 7, 8, 7, 6, 3] },
      { avail: [7, 7, 7, 7, 6, 7, 7], sold: [3, 5, 5, 7, 5, 5, 5] },
      { avail: [7, 6, 7, 7, 7, 7, 7], sold: [5, 4, 3, 3, 3, 6, 4] },
    ],
  },
];

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);

/** Revenue · medium. A rail per room type fills to this ISO week's occupancy in the busy-is-red preset; switch weeks, or tap a rail for its seven nights. */
export function WeekOccupancyWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const uid = useId();
  const [w, setW] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const week = WEEKS[w];
  const overall = pct(sum(week.rows.flatMap((r) => r.sold)), sum(week.rows.flatMap((r) => r.avail)));

  return (
    <Widget size="medium" index={index} label="Week occupancy by room type">
      <WidgetHeader
        icon={<Bed20Filled />}
        tint="var(--ios-blue)"
        title="Week occupancy"
        subtitle={
          <>
            {week.range} · <AnimatedNumber value={overall} suffix="%" className="font-medium text-secondary" /> of
            nights sold
          </>
        }
        extra={
          <div className="flex shrink-0 rounded-full bg-fill-tertiary p-0.5">
            {WEEKS.map((wk, i) => (
              <button
                key={wk.key}
                type="button"
                onClick={() => setW(i)}
                className={cn(
                  "relative cursor-pointer rounded-full px-2 py-0.5 text-[11px] font-semibold outline-none tabular transition-colors duration-mid",
                  w === i ? "text-heading" : "text-tertiary",
                )}
              >
                {w === i ? (
                  <motion.span
                    layoutId={`${uid}-wk`}
                    className="absolute inset-0 rounded-full bg-[var(--widget-surface)] shadow-sm"
                    transition={{ type: "spring", stiffness: 500, damping: 36 }}
                  />
                ) : null}
                <span className="relative">{wk.key}</span>
              </button>
            ))}
          </div>
        }
      />

      <div className="relative mt-2 min-h-0 flex-1">
        {/* No initial={false} here: it would also block the rails' first growth. */}
        <AnimatePresence mode="popLayout">
          {open === null ? (
            <motion.div
              key="rails"
              className="grid h-full grid-flow-col grid-cols-2 grid-rows-5 gap-x-4 gap-y-1"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            >
              {ROOM_TYPES.map((rt, i) => {
                const row = week.rows[i];
                const p = pct(sum(row.sold), sum(row.avail));
                const preset = PRESET[occupancyPreset(p)];
                return (
                  <button
                    key={rt.id}
                    type="button"
                    onClick={() => {
                      setLoaded(true);
                      setOpen(i);
                    }}
                    className="group -mx-1 flex h-full min-w-0 cursor-pointer items-center gap-2 rounded-md px-1 text-left outline-none transition-colors duration-mid hover:bg-fill-quaternary focus-visible:bg-fill-quaternary"
                  >
                    <span className="w-[66px] shrink-0 truncate text-[11px] text-secondary group-hover:text-heading">
                      {rt.short}
                    </span>
                    <span className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-fill-tertiary">
                      <motion.span
                        className="absolute inset-y-0 left-0 rounded-full"
                        initial={loaded ? false : { width: "0%", backgroundColor: preset.fill }}
                        animate={{ width: `${p}%`, backgroundColor: preset.fill }}
                        transition={{
                          width: loaded
                            ? { type: "spring", stiffness: 200, damping: 26 }
                            : { type: "spring", stiffness: 110, damping: 20, delay: delay + 0.1 + i * 0.05 },
                          backgroundColor: { duration: 0.4 },
                        }}
                        onAnimationComplete={() => setLoaded(true)}
                      />
                    </span>
                    <span className={cn("w-[30px] shrink-0 text-right text-[11px] font-semibold", preset.text)}>
                      <AnimatedNumber value={p} suffix="%" />
                    </span>
                  </button>
                );
              })}
            </motion.div>
          ) : (
            <DayDots key={`${week.key}-${open}`} week={week} type={open} onBack={() => setOpen(null)} />
          )}
        </AnimatePresence>
      </div>
    </Widget>
  );
}

function DayDots({ week, type, onBack }: { week: Week; type: number; onBack: () => void }) {
  const rt = ROOM_TYPES[type];
  const row = week.rows[type];
  const nights = row.sold.map((s, d) => ({ day: week.days[d], sold: s, avail: row.avail[d], p: pct(s, row.avail[d]) }));
  const total = pct(sum(row.sold), sum(row.avail));
  const full = nights.filter((n) => n.p >= 100);
  const peak = nights.reduce((a, b) => (b.p > a.p ? b : a));

  return (
    <motion.div
      className="flex h-full flex-col"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
    >
      <div className="flex h-5 items-center gap-1.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to all room types"
          className="-ml-1 grid size-5 cursor-pointer place-items-center rounded-full text-secondary outline-none hover:bg-fill-tertiary"
        >
          <ChevronLeft16Regular />
        </button>
        <span className="text-[11px] text-tertiary tabular">{rt.id}</span>
        <span className="min-w-0 truncate text-[12px] font-semibold text-heading">{rt.name}</span>
        <span className="ml-auto shrink-0 text-[11px] text-tertiary tabular">
          {sum(row.sold)}/{sum(row.avail)} nights ·{" "}
          <span className={cn("font-semibold", PRESET[occupancyPreset(total)].text)}>{total}%</span>
        </span>
      </div>

      <div className="mt-2 grid grid-cols-7">
        {nights.map((n, d) => {
          const preset = PRESET[occupancyPreset(n.p)];
          return (
            <div key={n.day} className="flex min-w-0 flex-col items-center leading-tight">
              <span className="text-[10px] text-tertiary tabular">{n.day}</span>
              <motion.span
                className={cn(
                  "relative mt-1 size-[26px] overflow-hidden rounded-full bg-fill-tertiary",
                  n.p >= 100 && "ring-2 ring-ios-red/40",
                )}
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 480, damping: 22, delay: 0.05 + d * 0.04 }}
              >
                <motion.span
                  className="absolute inset-x-0 bottom-0"
                  style={{ background: preset.fill }}
                  initial={{ height: "0%" }}
                  animate={{ height: `${Math.min(100, n.p)}%` }}
                  transition={{ type: "spring", stiffness: 140, damping: 20, delay: 0.15 + d * 0.05 }}
                />
              </motion.span>
              <span className={cn("mt-1 text-[11px] font-semibold tabular", preset.text)}>{n.p}%</span>
              <span className="text-[10px] text-tertiary tabular">
                {n.sold}/{n.avail}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-auto truncate text-[11px] text-tertiary">
        {full.length ? (
          <>
            <span className="font-medium text-ios-red">Full</span> on {full.map((n) => n.day).join(", ")} · nothing left to
            sell
          </>
        ) : (
          <>
            Busiest on <span className="font-medium text-secondary">{peak.day}</span> · {peak.avail - peak.sold} rooms left
          </>
        )}
      </div>
    </motion.div>
  );
}
