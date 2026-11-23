import { HeartCircle20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Page = { id: string; who: string | null; label: string; count: number; goal: number };
const START: Page[] = [
  { id: "store", who: null, label: "Whole store", count: 38, goal: 60 },
  { id: "maya", who: "Maya Collins", label: "Maya · tills", count: 15, goal: 15 },
  { id: "jonah", who: "Jonah Reyes", label: "Jonah · fitting", count: 9, goal: 15 },
  { id: "ellie", who: "Ellie Kane", label: "Ellie · floor", count: 6, goal: 15 },
];
/** 14:40 of a 09:00–21:00 day: where the count should be by now. */
const PACE = 0.47;

/* Half-ring gauge, 180° from the left. */
const R = 50;
const CX = 60;
const CY = 58;
const LEN = Math.PI * R;
const ARC = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;
const at = (t: number, r: number) => {
  const a = Math.PI * (1 - t);
  return { x: CX + r * Math.cos(a), y: CY - r * Math.sin(a) };
};

/** Retail · small. Loyalty sign-ups against the day's goal on a half gauge with a pace tick, ticking up live; tap to page through the store and each associate. */
export function LoyaltySignupsWidget({ index }: { index?: number }) {
  const [pages, setPages] = useState(START);
  const [page, setPage] = useState(0);
  const [paged, setPaged] = useState(false);
  const [flash, setFlash] = useState<{ id: number; who: string } | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      const k = 1 + Math.floor(Math.random() * 3);
      setPages((ps) => ps.map((p, i) => (i === 0 || i === k ? { ...p, count: p.count + 1 } : p)));
      setFlash({ id: Date.now(), who: START[k].who ?? "" });
    }, 6500);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 1800);
    return () => window.clearTimeout(t);
  }, [flash]);

  const p = pages[page];
  const pct = Math.min(1, p.count / p.goal);
  const done = p.count >= p.goal;
  const ahead = p.count - Math.round(p.goal * PACE);
  const tickIn = at(PACE, R - 9);
  const tickOut = at(PACE, R + 7);

  return (
    <Widget
      size="small"
      index={index}
      label="Loyalty sign-ups"
      pressable
      onPress={() => {
        setPage((n) => (n + 1) % pages.length);
        setPaged(true);
      }}
    >
      <WidgetHeader icon={<HeartCircle20Filled />} tint="var(--ios-pink)" title="Loyalty" subtitle="Sign-ups · today" />

      <AnimatePresence>
        {flash ? (
          <motion.span
            key={flash.id}
            initial={{ opacity: 0, y: 6, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
            className="absolute top-3.5 right-3 flex items-center gap-1 rounded-full bg-ios-pink/15 py-0.5 pr-1.5 pl-0.5 text-[11px] font-semibold text-ios-pink"
          >
            <MemojiAvatar who={flash.who} size={16} />
            +1
          </motion.span>
        ) : null}
      </AnimatePresence>

      <div className="relative mx-auto mt-1 h-[66px] w-[120px] shrink-0">
        <svg viewBox="0 0 120 66" className="absolute inset-0 size-full overflow-visible">
          <path d={ARC} fill="none" strokeWidth={10} strokeLinecap="round" className="stroke-fill-secondary" />
          <motion.path
            d={ARC}
            fill="none"
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={LEN}
            initial={{ strokeDashoffset: LEN, stroke: done ? "var(--ios-green)" : "var(--ios-pink)" }}
            animate={{ strokeDashoffset: LEN * (1 - pct), stroke: done ? "var(--ios-green)" : "var(--ios-pink)" }}
            transition={{ type: "spring", stiffness: 80, damping: 18, delay: paged ? 0 : delay }}
          />
          <line
            x1={tickIn.x}
            y1={tickIn.y}
            x2={tickOut.x}
            y2={tickOut.y}
            strokeWidth={2}
            strokeLinecap="round"
            className="stroke-[var(--ant-color-text-secondary)]"
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center leading-none whitespace-nowrap">
          <AnimatedNumber value={p.count} className="text-[26px] font-semibold tracking-tight text-heading" />
          <span className="text-[12px] font-medium text-tertiary">/{p.goal}</span>
        </div>
      </div>

      <div className="mt-auto flex h-[22px] items-center gap-1.5 whitespace-nowrap">
        {p.who ? <MemojiAvatar who={p.who} size={20} /> : null}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={p.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="min-w-0 truncate text-[11.5px] font-medium text-secondary"
          >
            {p.label}
          </motion.span>
        </AnimatePresence>
        <span
          className={cn(
            "ml-auto shrink-0 rounded-full px-1.5 py-px text-[10.5px] font-semibold",
            done ? "bg-ios-green/15 text-ios-green" : ahead >= 0 ? "bg-ios-blue/15 text-ios-blue" : "bg-ios-orange/15 text-ios-orange",
          )}
        >
          {done ? "Goal hit" : ahead >= 0 ? `+${ahead} pace` : `${ahead} pace`}
        </span>
      </div>

      <div className="mt-1.5 flex justify-center gap-1">
        {pages.map((x, i) => (
          <motion.span
            key={x.id}
            layout
            className={cn("h-1.5 rounded-full", i === page ? "w-3.5 bg-ios-pink" : "w-1.5 bg-fill")}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        ))}
      </div>
    </Widget>
  );
}
