import { Flash12Filled, PeopleQueue20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { TWO } from "./_parts-a";

/* Guests at the desk whose room is not clean yet: minutes already waited when the widget opens, and the window
 * of the 30-second loop they are in the lobby. */
const GUESTS = [
  { name: "Olivia Brown", room: "V2", base: 38 * 60, from: 0, to: 30 },
  { name: "Anna Schmidt", room: "110", base: 24 * 60, from: 0, to: 30 },
  { name: "Sofia Rossi", room: "316", base: 9 * 60, from: 0, to: 12 },
  { name: "Kevin Adams", room: "116", base: 0, from: 20, to: 30 },
];
const LOOP = 30;
const PROMISE = 60 * 60;
const R = 26;
const C = 2 * Math.PI * R;

/** Front desk · small. Guests waiting at the desk for a room, with the longest wait ticking on a ring; Rush puts their rooms first for housekeeping and the ring starts to beat. */
export function WaitingDeskWidget({ index }: { index?: number }) {
  const [sec, setSec] = useState(0);
  const [rush, setRush] = useState(false);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => setSec((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  const s = sec % LOOP;
  const here = GUESTS.filter((g) => s >= g.from && s < g.to).map((g) => ({ ...g, waited: g.base + (s - g.from) }));
  const longest = Math.max(...here.map((g) => g.waited));
  const pct = Math.min(longest / PROMISE, 1);
  const tone = longest >= 45 * 60 ? "var(--ios-red)" : "var(--ios-orange)";
  const news = s >= 12 && s < 16 ? "316 ready · Sofia in" : s >= 20 && s < 24 ? "Kevin joined · 116" : null;

  return (
    <Widget size="small" index={index} label="Waiting at the desk">
      <WidgetHeader
        icon={<PeopleQueue20Filled />}
        tint="var(--ios-orange)"
        title="Waiting at Desk"
        subtitle={
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={news ?? "base"}
              className={cn("block truncate", news && "text-ios-green")}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
            >
              {news ?? "Rooms not ready"}
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="mt-2.5 flex items-center gap-2.5">
        <div className="relative size-[64px] shrink-0">
          {rush ? (
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: `0 0 0 2px var(--ios-yellow)` }}
              animate={{ scale: [1, 1.18], opacity: [0.9, 0] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
            />
          ) : null}
          <motion.svg
            viewBox="0 0 64 64"
            className="size-full -rotate-90"
            animate={rush ? { scale: [1, 1.05, 1] } : { scale: 1 }}
            transition={rush ? { duration: 1.1, repeat: Infinity } : { duration: 0.3 }}
          >
            <circle cx="32" cy="32" r={R} fill="none" strokeWidth="6" className="stroke-fill-secondary" />
            <motion.circle
              cx="32"
              cy="32"
              r={R}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C, stroke: rush ? "var(--ios-yellow)" : tone }}
              animate={{ strokeDashoffset: C * (1 - pct), stroke: rush ? "var(--ios-yellow)" : tone }}
              transition={{ type: "spring", stiffness: 70, damping: 18, delay: sec === 0 ? delay : 0 }}
            />
          </motion.svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <div className="flex items-baseline text-[13px] font-semibold text-heading tabular">
              <AnimatedNumber value={Math.floor(longest / 60)} />
              <span>:</span>
              <AnimatedNumber value={longest % 60} format={TWO} />
            </div>
            <span className="mt-0.5 text-[9px] text-tertiary">longest</span>
          </div>
        </div>
        <div className="min-w-0 leading-none">
          <AnimatedNumber value={here.length} className="text-[30px] font-semibold tracking-tight text-heading" />
          <div className="mt-1 text-[11px] text-tertiary">guests waiting</div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between">
        <div className="flex">
          <AnimatePresence initial={false} mode="popLayout">
            {here.map((g, i) => (
              <motion.div
                key={g.name}
                layout
                initial={{ opacity: 0, scale: 0.4, x: 12 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.4, y: -14 }}
                transition={{ type: "spring", stiffness: 420, damping: 26 }}
                className={cn("relative rounded-full", i > 0 && "-ml-2")}
                style={{ zIndex: here.length - i }}
              >
                <Tooltip title={`${g.name} · ${g.room} · ${Math.floor(g.waited / 60)} min`}>
                  <MemojiAvatar
                    who={g.name}
                    size={26}
                    className={cn(
                      "ring-[1.5px] ring-[var(--widget-surface)] transition-shadow",
                      rush && "ring-ios-yellow",
                    )}
                  />
                </Tooltip>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <motion.button
          type="button"
          aria-pressed={rush}
          onClick={() => setRush((r) => !r)}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "flex h-[26px] cursor-pointer items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold transition-colors",
            rush ? "bg-ios-yellow/15 text-ios-yellow" : "bg-ios-orange/15 text-ios-orange",
          )}
        >
          <Flash12Filled />
          {rush ? "Priority" : "Rush"}
        </motion.button>
      </div>
    </Widget>
  );
}
