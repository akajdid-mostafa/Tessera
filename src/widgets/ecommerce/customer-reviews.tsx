import {
  ArrowReply16Filled,
  Checkmark16Filled,
  Star16Filled,
  Star16Regular,
  Star20Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

/** Star counts over the last 30 days, 5★ first. */
const DIST = [964, 182, 52, 22, 28];
const TOTAL = DIST.reduce((s, n) => s + n, 0);
const AVERAGE = DIST.reduce((s, n, i) => s + n * (5 - i), 0) / TOTAL;

type Review = {
  id: string;
  name: string;
  stars: number;
  product: string;
  when: string;
  text: string;
  /** Low ratings wait for a reply from the shop. */
  needsReply?: boolean;
};
const REVIEWS: Review[] = [
  {
    id: "r1",
    name: "Mara Lindqvist",
    stars: 5,
    product: "Pour-Over Coffee Kit",
    when: "2h ago",
    text: "Feels like a café setup on my counter. The kettle pours slow and even, and the paper filters fit perfectly.",
  },
  {
    id: "r6",
    name: "Grant Holloway",
    stars: 1,
    product: "Aura ANC Headphones",
    when: "3h ago",
    text: "Left cup started crackling after two weeks. I'd like a replacement before my trip on Friday, please.",
    needsReply: true,
  },
  {
    id: "r2",
    name: "Jonah Pereira",
    stars: 4,
    product: "Arc Desk Lamp",
    when: "5h ago",
    text: "Lovely warm light and a sturdy base. I wish the cable were a little longer, but I'd buy it again.",
  },
  {
    id: "r5",
    name: "Sofia Daskalaki",
    stars: 2,
    product: "Blue-Light Glasses",
    when: "Yesterday",
    text: "Frames are comfortable, but the amber tint is much stronger than the product photos show.",
    needsReply: true,
  },
  {
    id: "r3",
    name: "Priya Natarajan",
    stars: 5,
    product: "Trailhead Pack 24L",
    when: "Yesterday",
    text: "Survived a week of rain in the hills and everything inside stayed dry. Pockets are right where your hands go.",
  },
  {
    id: "r4",
    name: "Felix Rautio",
    stars: 3,
    product: "Low-Profile Keyboard",
    when: "2d ago",
    text: "Typing feels great, but Bluetooth dropped once a day until support sent me a firmware update.",
  },
];

type ReplyState = "sending" | "sent";

/** E-commerce · large. Rating summary with a star histogram and a review card; tap a bar to filter, tap the card to page, reply to low ratings. */
export function CustomerReviewsWidget({ index }: { index?: number }) {
  const [filter, setFilter] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [replies, setReplies] = useState<Record<string, ReplyState>>({});
  const delay = 0.3 + (index ?? 0) * 0.06;

  const list = useMemo(() => (filter === null ? REVIEWS : REVIEWS.filter((r) => r.stars === filter)), [filter]);
  const review = list[page % Math.max(1, list.length)];
  const waiting = REVIEWS.filter((r) => r.needsReply && replies[r.id] !== "sent").length;

  useEffect(() => {
    const sending = Object.keys(replies).filter((k) => replies[k] === "sending");
    if (!sending.length) return;
    const t = window.setTimeout(() => {
      setReplies((r) => ({ ...r, ...Object.fromEntries(sending.map((k) => [k, "sent" as const])) }));
    }, 800);
    return () => window.clearTimeout(t);
  }, [replies]);

  const pickFilter = (stars: number) => {
    setFilter((f) => (f === stars ? null : stars));
    setPage(0);
  };

  return (
    <Widget size="large" index={index} label="Customer reviews">
      <WidgetHeader
        icon={<Star20Filled />}
        tint="var(--ios-yellow)"
        title="Reviews"
        subtitle="Kinfolk Supply · last 30 days"
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={waiting}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: "spring", stiffness: 480, damping: 22 }}
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                waiting ? "bg-ios-red/15 text-ios-red" : "bg-ios-green/15 text-ios-green",
              )}
            >
              {waiting ? `${waiting} need a reply` : "All answered"}
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="mt-3 flex gap-4">
        <div className="flex w-[104px] shrink-0 flex-col">
          <AnimatedNumber
            value={AVERAGE}
            format={{ maximumFractionDigits: 1, minimumFractionDigits: 1 }}
            className="text-[34px] leading-none font-semibold tracking-tight text-heading"
          />
          <Stars value={AVERAGE} delay={delay} className="mt-1.5" />
          <div className="mt-auto text-[11px] text-tertiary">
            <AnimatedNumber value={TOTAL} className="font-semibold text-secondary" /> reviews
          </div>
        </div>

        <ul className="flex min-w-0 flex-1 flex-col gap-1">
          {DIST.map((n, i) => {
            const stars = 5 - i;
            const on = filter === stars;
            const dim = filter !== null && !on;
            return (
              <li key={stars}>
                <button
                  type="button"
                  onClick={() => pickFilter(stars)}
                  aria-pressed={on}
                  className="group flex h-[15px] w-full cursor-pointer items-center gap-1.5"
                >
                  <span className={cn("w-2 text-[11px] tabular", on ? "font-semibold text-heading" : "text-tertiary")}>
                    {stars}
                  </span>
                  <span className="relative h-[8px] flex-1 overflow-hidden rounded-full bg-fill-tertiary">
                    <motion.span
                      className={cn(
                        "absolute inset-y-0 left-0 origin-left rounded-full",
                        stars <= 2 ? "bg-ios-red" : "bg-ios-yellow",
                      )}
                      style={{ width: `${Math.max(2, (n / DIST[0]) * 100)}%` }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1, opacity: dim ? 0.3 : 1 }}
                      transition={{
                        scaleX: { type: "spring", stiffness: 120, damping: 20, delay: delay + i * 0.07 },
                        opacity: { duration: 0.2 },
                      }}
                    />
                  </span>
                  <span
                    className={cn(
                      "w-7 text-right text-[11px] tabular transition-colors",
                      on ? "font-semibold text-heading" : "text-tertiary group-hover:text-secondary",
                    )}
                  >
                    {n}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="relative mt-3 min-h-0 flex-1">
        <AnimatePresence mode="popLayout" initial={false}>
          {review ? (
            <motion.div
              key={`${filter}-${review.id}`}
              role="button"
              tabIndex={0}
              aria-label="Next review"
              onClick={() => setPage((p) => p + 1)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setPage((p) => p + 1);
                }
              }}
              initial={{ opacity: 0, x: 28, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -28, filter: "blur(4px)", transition: { duration: 0.18 } }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              whileTap={{ scale: 0.985 }}
              className="absolute inset-0 flex cursor-pointer flex-col rounded-2xl bg-fill-quaternary p-3 outline-none"
            >
              <div className="flex items-center gap-2">
                <MemojiAvatar who={review.name} size={30} />
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-[13px] font-semibold text-heading">{review.name}</div>
                  <div className="truncate text-[11px] text-tertiary">{review.when} · verified buyer</div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Stars value={review.stars} delay={0.05} small />
                <span className="truncate rounded-full bg-fill-tertiary px-2 py-px text-[11px] font-medium text-secondary">
                  {review.product}
                </span>
              </div>
              <p className="mt-1.5 line-clamp-4 text-[14px] leading-[1.42] text-heading">{review.text}</p>

              <div className="mt-auto flex items-center gap-2">
                {review.needsReply ? (
                  <ReplyButton
                    state={replies[review.id]}
                    onReply={() => setReplies((r) => (r[review.id] ? r : { ...r, [review.id]: "sending" }))}
                  />
                ) : (
                  <span className="text-[11px] text-tertiary">Tap for the next review</span>
                )}
                <div className="ml-auto flex gap-[3px]">
                  {list.map((x, i) => (
                    <motion.span
                      key={x.id}
                      layout
                      className={cn("h-1.5 rounded-full", i === page % list.length ? "w-3 bg-ios-yellow" : "w-1.5 bg-fill")}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </Widget>
  );
}

/** Five stars, filled to `value`, popping in one after another. */
function Stars({ value, delay, small, className }: { value: number; delay: number; small?: boolean; className?: string }) {
  return (
    <div className={cn("flex", small ? "gap-px text-[12px]" : "gap-0.5 text-[14px]", className)} aria-label={`${value.toFixed(1)} stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.min(1, Math.max(0, value - i));
        return (
          <motion.span
            key={i}
            className="relative grid"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 520, damping: 16, delay: delay + 0.15 + i * 0.06 }}
          >
            <Star16Regular className="size-[1em] text-tertiary" />
            {fill > 0 ? (
              <span className="absolute inset-y-0 left-0 flex overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star16Filled className="size-[1em] shrink-0 text-ios-orange" />
              </span>
            ) : null}
          </motion.span>
        );
      })}
    </div>
  );
}

function ReplyButton({ state, onReply }: { state?: ReplyState; onReply: () => void }) {
  const sent = state === "sent";
  return (
    <motion.div
      key={sent ? "sent" : "todo"}
      initial={sent ? { scale: 0.85 } : false}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 520, damping: 14 }}
    >
      <Button
        size="small"
        shape="round"
        type="primary"
        loading={state === "sending"}
        aria-pressed={sent}
        onClick={(e) => {
          e.stopPropagation();
          onReply();
        }}
        icon={sent ? <Checkmark16Filled /> : <ArrowReply16Filled />}
        className={cn(
          "font-semibold",
          sent
            ? "pointer-events-none border-0 bg-ios-green/15 text-ios-green shadow-none"
            : "bg-ios-red text-white hover:bg-ios-red/85",
        )}
      >
        {sent ? "Replied" : state === "sending" ? "Sending" : "Reply"}
      </Button>
    </motion.div>
  );
}
