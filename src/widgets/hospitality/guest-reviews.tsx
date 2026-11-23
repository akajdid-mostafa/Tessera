import { ArrowReply16Regular, Checkmark12Filled, Star20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/* The Wren's guest scores over the last 90 days, out of 10, by what guests rate. */
const CATEGORIES = [
  { name: "Location", score: 9.6 },
  { name: "Staff", score: 9.4 },
  { name: "Cleanliness", score: 9.2 },
  { name: "Comfort", score: 8.9 },
  { name: "Breakfast", score: 8.4 },
  { name: "Value", score: 7.9 },
] as const;
const START = { score: 8.9, count: 412, open: 6 };

type Review = { id: number; name: string; room: string; score: number; text: string; source: string; replied?: boolean };
/* The latest reviews, newest first, and the ones that will arrive while the widget is open. */
const FIRST: Review[] = [
  { id: 1, name: "Sofia Mendes", room: "Deluxe King", score: 10, text: "Rooftop breakfast with the whole skyline.", source: "Survey" },
  { id: 2, name: "Lukas Becker", room: "Superior Queen", score: 7, text: "Lovely staff, street noise late at night.", source: "StayRate", replied: true },
  { id: 3, name: "Allison Kerr", room: "Wren Suite", score: 9, text: "Spotless suite, very kind night porter.", source: "TripNest" },
  { id: 4, name: "Kenji Watanabe", room: "Skyline Twin", score: 8, text: "Great spot near the subway, small shower.", source: "StayRate", replied: true },
];
const INCOMING: Omit<Review, "id">[] = [
  { name: "Omar Haddad", room: "Family Room", score: 9, text: "Kids loved the welcome treats at check-in.", source: "TripNest" },
  { name: "Isabella Rossi", room: "Deluxe King", score: 6, text: "Room not ready until 4 pm on arrival.", source: "StayRate" },
  { name: "Mia Novak", room: "Superior Queen", score: 10, text: "Best bagel I have had, and the view, wow.", source: "Survey" },
  { name: "Daniel Okafor", room: "Wren Suite", score: 8, text: "Quiet and comfy, Wi-Fi drops at night.", source: "TripNest" },
];
const ARRIVE_EVERY_MS = 7000;
const ONE = { minimumFractionDigits: 1, maximumFractionDigits: 1 } as const;

/* The gauge: a 180° arc in a 120×66 box. */
const GR = 50;
const ARC = `M10 60 A${GR} ${GR} 0 0 1 110 60`;
const ARC_LEN = Math.PI * GR;

const tone = (s: number) => (s >= 9 ? "text-ios-green" : s >= 8 ? "text-ios-teal" : s >= 7 ? "text-ios-orange" : "text-ios-red");
const fill = (s: number) => (s >= 9 ? "var(--ios-green)" : s >= 8 ? "var(--ios-teal)" : s >= 7 ? "var(--ios-orange)" : "var(--ios-red)");

/** Hospitality · large. The guest score as a half gauge with category bars and the latest reviews; hover a category to read it on the gauge, reply to a review, and new reviews slide in live. */
export function GuestReviewsWidget({ index }: { index?: number }) {
  const [reviews, setReviews] = useState(FIRST);
  const [score, setScore] = useState(START.score);
  const [count, setCount] = useState(START.count);
  const [open, setOpen] = useState(START.open);
  const [hot, setHot] = useState<number | null>(null);
  const next = useRef(0);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      const i = next.current;
      next.current = i + 1;
      const r: Review = { ...INCOMING[i % INCOMING.length], id: 100 + i };
      setReviews((list) => [r, ...list].slice(0, 4));
      setCount((c) => c + 1);
      setOpen((o) => o + 1);
      // A rolling 90-day average barely moves for one review.
      setScore((s) => Math.round(((s * 412 + r.score) / 413) * 100) / 100);
    }, ARRIVE_EVERY_MS);
    return () => window.clearInterval(t);
  }, []);

  const reply = (id: number) => {
    setReviews((list) => list.map((r) => (r.id === id ? { ...r, replied: true } : r)));
    setOpen((o) => Math.max(0, o - 1));
  };

  const shown = hot === null ? score : CATEGORIES[hot].score;
  const label = hot === null ? "Overall" : CATEGORIES[hot].name;

  return (
    <Widget size="large" index={index} label="Guest reviews">
      <WidgetHeader
        icon={<Star20Filled />}
        tint="var(--ios-pink)"
        title="Guest Reviews"
        subtitle="The Wren · last 90 days"
        extra={
          <div className="text-right leading-tight whitespace-nowrap">
            <div className="text-[10px] text-tertiary">Reviews</div>
            <AnimatedNumber value={count} className="text-[15px] font-semibold text-heading" />
          </div>
        }
      />

      <div className="mt-3 flex items-center gap-4">
        {/* The arc's inner hollow spans y 15–60; the 36 px number box (28 px + 4 px NumberFlow band each side)
            sits at y 24–60 so the digits centre near y 42, and the label hangs under the arc ends at y 63–74. */}
        <div className="relative h-[76px] w-[120px] shrink-0">
          <svg viewBox="0 0 120 66" className="absolute inset-x-0 top-0 w-full">
            <path d={ARC} fill="none" strokeWidth="10" strokeLinecap="round" className="stroke-fill-secondary" />
            <motion.path
              d={ARC}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={ARC_LEN}
              initial={{ strokeDashoffset: ARC_LEN, stroke: fill(START.score) }}
              animate={{ strokeDashoffset: ARC_LEN * (1 - shown / 10), stroke: fill(shown) }}
              transition={{ type: "spring", stiffness: 90, damping: 18, delay: hot === null && count === START.count ? delay : 0 }}
            />
          </svg>
          <div className="absolute inset-x-0 top-[24px] grid h-[36px] place-items-center leading-none">
            <AnimatedNumber value={shown} format={ONE} className="text-[28px] font-semibold tracking-tight text-heading" />
          </div>
          <div className="absolute inset-x-0 top-[63px] text-center leading-none">
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] font-medium text-tertiary"
            >
              {label}
            </motion.div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-[3px]" onPointerLeave={() => setHot(null)}>
          {CATEGORIES.map((c, i) => (
            <div
              key={c.name}
              onPointerEnter={() => setHot(i)}
              className={cn(
                "flex h-[15px] cursor-default items-center gap-2 rounded px-1 transition-colors",
                hot === i && "bg-fill-tertiary",
              )}
            >
              <span className="w-[70px] shrink-0 truncate text-[11px] text-secondary">{c.name}</span>
              <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-fill-secondary">
                <motion.span
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ background: fill(c.score) }}
                  initial={{ width: 0 }}
                  animate={{ width: `${((c.score - 5) / 5) * 100}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20, delay: delay + 0.1 + i * 0.05 }}
                />
              </span>
              <span className="w-[22px] text-right text-[11px] font-semibold text-heading tabular">{c.score.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center border-t-[0.5px] border-split pt-2 text-[11px]">
        <span className="font-semibold text-heading">Latest</span>
        <span className="ml-auto text-tertiary">
          <AnimatedNumber value={open} className="font-semibold text-ios-orange" /> awaiting reply
        </span>
      </div>

      {/* Measured: 182 px for the list; 4 × 44 rows = 176 px, 6 px slack. */}
      <div className="mt-1 flex min-h-0 flex-1 flex-col overflow-hidden">
        <AnimatePresence initial={false}>
          {reviews.map((r) => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 44, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex shrink-0 items-center gap-2.5 overflow-hidden"
            >
              <MemojiAvatar who={r.name} size={30} />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="truncate text-[12px] font-semibold text-heading">{r.name}</span>
                  <span className="shrink-0 text-[10px] text-tertiary">
                    {r.room} · {r.source}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-[11px] text-secondary">{r.text}</div>
              </div>
              <span
                className={cn("w-[26px] shrink-0 rounded-md bg-fill-tertiary py-0.5 text-center text-[11px] font-semibold tabular", tone(r.score))}
              >
                {r.score}
              </span>
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                disabled={r.replied}
                onClick={() => reply(r.id)}
                aria-label={r.replied ? `Replied to ${r.name}` : `Reply to ${r.name}`}
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full transition-colors",
                  r.replied ? "bg-ios-green/15 text-ios-green" : "cursor-pointer bg-fill-tertiary text-secondary hover:bg-fill-secondary",
                )}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={r.replied ? "done" : "reply"}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 520, damping: 22 }}
                    className="grid place-items-center"
                  >
                    {r.replied ? <Checkmark12Filled className="size-3.5" /> : <ArrowReply16Regular className="size-4" />}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
