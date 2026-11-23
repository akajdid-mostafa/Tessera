import { Mail20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type View = "opens" | "clicks";
const LIST = 18_900;
const CELLS = 40;
const PER_CELL = LIST / CELLS;
const TICK_MS = 1200;
const PCT = { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 } as const;

/** Marketing · small. A newsletter going out as a waffle of the list that fills live; tap to swap opens for clicks. */
export function EmailSendWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [view, setView] = useState<View>("opens");
  const [stats, setStats] = useState({ sent: 12_420, opens: 3_960, clicks: 388 });

  useEffect(() => {
    const t = window.setInterval(() => {
      setStats((s) => {
        const sent = Math.min(LIST, s.sent + 180 + Math.round(Math.random() * 160));
        const opens = Math.min(Math.round(sent * 0.46), s.opens + Math.round((sent * 0.44 - s.opens) * 0.07 + Math.random() * 40));
        const clicks = Math.min(Math.round(opens * 0.13), s.clicks + Math.round((opens * 0.12 - s.clicks) * 0.1 + Math.random() * 6));
        return { sent, opens: Math.max(s.opens, opens), clicks: Math.max(s.clicks, clicks) };
      });
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, []);

  const done = stats.sent >= LIST;
  const isOpens = view === "opens";
  const hero = (isOpens ? stats.opens : stats.clicks) / stats.sent;
  const lit = (isOpens ? stats.opens : stats.clicks) / PER_CELL;
  const sentCells = stats.sent / PER_CELL;

  return (
    <Widget
      size="small"
      index={index}
      label="Newsletter send"
      pressable
      onPress={() => setView((v) => (v === "opens" ? "clicks" : "opens"))}
    >
      <WidgetHeader
        icon={<Mail20Filled />}
        tint="var(--ios-orange)"
        title="Gift Guide #2"
        subtitle={done ? "Sent · 18,900" : "Sending…"}
      />

      <div className="mt-2 flex items-baseline gap-1.5 whitespace-nowrap">
        <AnimatedNumber value={hero} format={PCT} className="text-[24px] leading-none font-semibold tracking-tight text-heading" />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={view}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={cn("text-[11px] font-semibold", isOpens ? "text-ios-orange" : "text-ios-indigo")}
          >
            {isOpens ? "opened" : "clicked"}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="mt-2.5 grid grid-cols-10 gap-[3px]" aria-hidden>
        {Array.from({ length: CELLS }, (_, i) => {
          const state = i < Math.floor(lit) ? "lit" : i < Math.floor(sentCells) ? "sent" : "queued";
          return (
            <motion.span
              key={i}
              className={cn(
                "aspect-square rounded-[4px] transition-colors duration-500",
                state === "queued" && "bg-fill-tertiary",
                state === "sent" && "bg-ios-blue/30",
                state === "lit" && (isOpens ? "bg-ios-orange" : "bg-ios-indigo"),
              )}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 22, delay: delay + (i % 10) * 0.025 + Math.floor(i / 10) * 0.05 }}
            />
          );
        })}
      </div>

      <div className="mt-auto flex items-center justify-between text-[10px] leading-none whitespace-nowrap text-tertiary tabular">
        <span className="flex items-center gap-1">
          <span className="size-[7px] rounded-[2px] bg-ios-blue/40" />
          <AnimatedNumber value={stats.sent / LIST} format={{ style: "percent", maximumFractionDigits: 0 }} /> delivered
        </span>
        <span>1 = 2.5%</span>
      </div>
    </Widget>
  );
}
