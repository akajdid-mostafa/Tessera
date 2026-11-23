import { CommentMultiple20Filled, Warning12Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/* The last 24 hours, one column per hour from 3 PM yesterday to now (2 PM).
 * A checkout outage between 9 and 11 AM set off a wave of complaints. */
const POS = [22, 25, 28, 31, 26, 20, 14, 8, 5, 3, 2, 3, 6, 12, 19, 24, 27, 30, 26, 14, 12, 15, 21, 9];
const NEG = [6, 5, 7, 8, 6, 5, 4, 2, 1, 1, 1, 1, 2, 4, 6, 7, 9, 14, 48, 72, 39, 18, 11, 3];
const HOUR0 = 15;
const AXIS = [
  { i: 0, label: "3 PM" },
  { i: 6, label: "9 PM" },
  { i: 12, label: "3 AM" },
  { i: 18, label: "9 AM" },
];
const HALF = 29;
const TICK_MS = 3200;

type Mention = { name: string; handle: string; text: string; tone: "pos" | "neg" };
const FEED: Mention[] = [
  { name: "Marisol Vega", handle: "@marisol.v", text: "Order went through, finally", tone: "pos" },
  { name: "Theo Grant", handle: "@theogrant", text: "Still double charged from this morning", tone: "neg" },
  { name: "Priya Nair", handle: "@priyanair", text: "The new winter blend is so good", tone: "pos" },
  { name: "Jonah Fields", handle: "@jfields", text: "Support sorted my refund in 5 min", tone: "pos" },
  { name: "Lena Brandt", handle: "@lenab", text: "Checkout spun forever again", tone: "neg" },
];

const hourLabel = (i: number) => {
  const h = (HOUR0 + i) % 24;
  return `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "AM" : "PM"}`;
};

/** Marketing · medium. Mentions per hour as diverging positive and negative bars with a complaint spike; new mentions land live and hover reads an hour. */
export function BrandMentionsWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [live, setLive] = useState({ feed: 0, pos: POS, neg: NEG });
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => {
      setLive((s) => {
        const feed = (s.feed + 1) % FEED.length;
        const bump = (a: number[]) => a.map((v, i) => (i === a.length - 1 ? v + 1 : v));
        return FEED[feed].tone === "pos" ? { feed, pos: bump(s.pos), neg: s.neg } : { feed, pos: s.pos, neg: bump(s.neg) };
      });
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, []);

  const { feed, pos, neg } = live;
  const totalPos = pos.reduce((s, v) => s + v, 0);
  const totalNeg = neg.reduce((s, v) => s + v, 0);
  const net = Math.round(((totalPos - totalNeg) / (totalPos + totalNeg)) * 100);
  const max = Math.max(...pos, ...neg);
  const m = FEED[feed];

  return (
    <Widget size="medium" index={index} label="Brand mentions">
      <WidgetHeader
        icon={<CommentMultiple20Filled />}
        tint="var(--ios-teal)"
        title="Brand Mentions"
        subtitle={
          <>
            Last 24 h · <AnimatedNumber value={totalPos + totalNeg} /> mentions
          </>
        }
        extra={
          <div className="text-right leading-none whitespace-nowrap">
            <AnimatedNumber
              value={net}
              format={{ signDisplay: "always" }}
              className={cn("text-[18px] font-semibold tracking-tight", net >= 0 ? "text-heading" : "text-ios-red")}
            />
            <div className="mt-0.5 text-[10px] text-tertiary">net sentiment</div>
          </div>
        }
      />

      <div className="mt-1.5 h-[14px] text-[11px] leading-[14px] whitespace-nowrap">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={hover ?? "spike"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1"
          >
            {hover === null ? (
              <>
                <Warning12Filled className="text-ios-red" />
                <span className="font-semibold text-ios-red">Spike 9–11 AM</span>
                <span className="text-tertiary">· “checkout error” · 4.2× usual negatives</span>
              </>
            ) : (
              <>
                <span className="font-semibold text-heading">{hover === pos.length - 1 ? "Now" : hourLabel(hover)}</span>
                <span className="text-tertiary">·</span>
                <span className="font-medium text-ios-green tabular">{pos[hover]} positive</span>
                <span className="text-tertiary">·</span>
                <span className="font-medium text-ios-red tabular">{neg[hover]} negative</span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-1 flex h-[60px] gap-[3px]" onMouseLeave={() => setHover(null)}>
        {pos.map((p, i) => {
          const n = neg[i];
          const dim = hover !== null && hover !== i;
          const live = i === pos.length - 1;
          return (
            <div
              key={i}
              className="relative flex min-w-0 flex-1 cursor-default flex-col"
              onMouseEnter={() => setHover(i)}
            >
              <div className="flex h-1/2 items-end">
                <motion.span
                  className={cn("w-full rounded-t-[3px] rounded-b-[1px] bg-ios-green", live && "animate-fade-pulse")}
                  initial={{ height: 0 }}
                  animate={{ height: Math.max(1, (p / max) * HALF), opacity: dim ? 0.3 : 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 22, delay: hover === null && !live ? delay + i * 0.02 : 0 }}
                />
              </div>
              <div className="flex h-1/2 items-start pt-px">
                <motion.span
                  className={cn("w-full rounded-b-[3px] rounded-t-[1px]", n / max > 0.4 ? "bg-ios-red" : "bg-ios-red/55")}
                  initial={{ height: 0 }}
                  animate={{ height: Math.max(1, (n / max) * HALF), opacity: dim ? 0.3 : 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 22, delay: hover === null && !live ? delay + 0.1 + i * 0.02 : 0 }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="relative mt-1 h-[10px] text-[9px] leading-none text-tertiary tabular">
        {AXIS.map((a) => (
          <span key={a.label} className="absolute" style={{ left: `${(a.i / POS.length) * 100}%` }}>
            {a.label}
          </span>
        ))}
        <span className="absolute right-0">Now</span>
      </div>

      <div className="mt-auto flex h-6 items-center gap-2 overflow-hidden border-t-[0.5px] border-split pt-1.5">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={feed}
            className="flex min-w-0 flex-1 items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <MemojiAvatar who={m.name} size={18} />
            <span className="shrink-0 text-[11px] font-medium text-secondary">{m.handle}</span>
            <span className="min-w-0 truncate text-[11px] text-heading">{m.text}</span>
            <span className={cn("ml-auto size-1.5 shrink-0 rounded-full", m.tone === "pos" ? "bg-ios-green" : "bg-ios-red")} />
          </motion.div>
        </AnimatePresence>
      </div>
    </Widget>
  );
}
