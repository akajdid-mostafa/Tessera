import { Checkmark12Filled, Info12Regular, Prohibited20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Switch } from "@/registry/antuikit/ui/switch";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { CHANNELS } from "./_parts-a";

/** 306 Deluxe Sea View is sold on every channel but the iCal feed, which only carries 302 and 310. */
const NOT_ON_FEED = new Set([4]);
const TAKERS = CHANNELS.filter((c) => c.takes.includes("stop_sell") && !NOT_ON_FEED.has(c.id));
/** How long each channel takes to answer, in order of arrival. */
const LATENCY: Record<number, number> = { 1: 650, 6: 1150, 3: 1650, 2: 2350 };

type Sync = "synced" | "pending";

/** Revenue · small. One room type's stop sell for a night; the switch bounces over and each channel that takes it syncs from pending to synced. */
export function StopSellWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [stopped, setStopped] = useState(false);
  const [sync, setSync] = useState<Record<number, Sync>>(() => Object.fromEntries(TAKERS.map((c) => [c.id, "synced"])));
  const [sentAt, setSentAt] = useState<"earlier" | "now">("earlier");
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const flip = (next: boolean) => {
    setStopped(next);
    setSentAt("now");
    animate(scope.current, { scale: [1, 1.22, 0.9, 1.04, 1] }, { duration: 0.55, ease: "easeOut" });
    timers.current.forEach((t) => window.clearTimeout(t));
    setSync(Object.fromEntries(TAKERS.map((c) => [c.id, "pending"])));
    timers.current = TAKERS.map((c) =>
      window.setTimeout(() => setSync((s) => ({ ...s, [c.id]: "synced" })), LATENCY[c.id] ?? 1500),
    );
  };

  const synced = TAKERS.filter((c) => sync[c.id] === "synced").length;
  const pending = synced < TAKERS.length;

  return (
    <Widget
      size="small"
      index={index}
      label="Stop sell"
      glow={{ mode: "pulse", colors: ["#ff453a", "#ff9f0a"], blur: 16, duration: 1.1 }}
      glowActive={stopped && pending}
    >
      <WidgetHeader icon={<Prohibited20Filled />} tint="var(--ios-red)" title="Stop sell" subtitle="306 Deluxe Sea View" />

      <div className="mt-2.5 h-[40px] leading-none">
        <div className="h-[11px] text-[11px] text-tertiary">Sat, Oct 17</div>
        {/* The state word and the switch share one row so they sit on the same center line. */}
        <div className="mt-[5px] flex h-[24px] items-center justify-between gap-2">
          <div className="relative h-[22px] min-w-0 flex-1 overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={stopped ? "s" : "o"}
                className={cn("text-[20px] leading-[22px] font-semibold tracking-tight", stopped ? "text-ios-red" : "text-heading")}
                initial={{ y: stopped ? 22 : -22, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: stopped ? -22 : 22, opacity: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
              >
                {stopped ? "Stopped" : "Selling"}
              </motion.div>
            </AnimatePresence>
          </div>
          <div ref={scope} className="flex shrink-0 items-center">
            <Switch checked={stopped} onChange={flip} color="error" aria-label="Stop sell on Sat, Oct 17" />
          </div>
        </div>
      </div>

      <div className="mt-auto flex justify-between">
        {CHANNELS.map((c, i) => {
          const takes = TAKERS.includes(c);
          const state = sync[c.id];
          return (
            <Tooltip
              key={c.id}
              title={
                takes
                  ? `${c.name} · ${state === "pending" ? "sending…" : "synced"}`
                  : `${c.name} · not sent: 306 is not on this feed`
              }
            >
              <motion.span
                className={cn(
                  "relative grid size-[26px] cursor-default place-items-center rounded-lg text-[10px] font-semibold",
                  takes
                    ? stopped
                      ? "bg-ios-red/12 text-ios-red"
                      : "bg-fill-tertiary text-secondary"
                    : "border border-dashed border-split text-tertiary",
                )}
                initial={{ opacity: 0, scale: 0.4, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                whileHover={{ scale: 1.12 }}
                transition={{ type: "spring", stiffness: 420, damping: 22, delay: delay + i * 0.06 }}
              >
                {c.short}
                {takes ? (
                  <span className="absolute -top-1 -right-1 grid size-3 place-items-center rounded-full ring-2 ring-[var(--widget-surface)]">
                    <AnimatePresence mode="popLayout" initial={false}>
                      {state === "pending" ? (
                        <motion.span
                          key="p"
                          className="size-2.5 rounded-full bg-ios-orange"
                          initial={{ scale: 0 }}
                          animate={{ scale: [1, 0.7, 1] }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        />
                      ) : (
                        <motion.span
                          key="s"
                          className="grid size-3 place-items-center rounded-full bg-ios-green text-[8px] text-white"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ type: "spring", stiffness: 600, damping: 18 }}
                        >
                          <Checkmark12Filled className="size-2" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                ) : null}
              </motion.span>
            </Tooltip>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between gap-1 text-[11px] leading-[14px] whitespace-nowrap">
        <span className="text-secondary">
          <span className="font-semibold text-heading tabular">{TAKERS.length}</span> of {CHANNELS.length} channels
        </span>
        <span className="flex items-center gap-1 text-tertiary">
          <motion.span
            className={cn("size-1.5 rounded-full", pending ? "bg-ios-orange" : "bg-ios-green")}
            animate={pending ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
            transition={pending ? { duration: 0.8, repeat: Infinity } : undefined}
          />
          {pending ? (
            <span className="tabular">
              <AnimatedNumber value={synced} />/{TAKERS.length}
            </span>
          ) : sentAt === "now" ? (
            "Synced now"
          ) : (
            "Synced"
          )}
        </span>
      </div>
      <div className="mt-0.5 flex items-center gap-1 truncate text-[10px] leading-[13px] text-tertiary">
        <Info12Regular className="shrink-0" />
        Not sent to iCal · not on feed
      </div>
    </Widget>
  );
}
