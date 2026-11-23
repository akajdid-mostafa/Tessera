import { CalendarClock20Filled, Checkmark12Filled, LockClosed16Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Win = { id: string; start: number; end: number; title: string; who?: string; ref: string };

const h = (hh: number, mm = 0) => hh * 60 + mm;
const WINDOWS: Win[] = [
  { id: "ups", start: h(1, 30), end: h(3), title: "UPS-B battery string swap", who: "Marco Bianchi", ref: "CHG-4462" },
  { id: "xc", start: h(9), end: h(10), title: "Row C cross-connect audit", who: "Hana Sato", ref: "CHG-4470" },
  { id: "pdu", start: h(13, 30), end: h(15), title: "PDU-B firmware 4.2.1", who: "Emily Young", ref: "CHG-4471" },
  { id: "crah", start: h(16), end: h(17, 30), title: "CRAH-3 filter change", who: "Owen Price", ref: "CHG-4475" },
  { id: "freeze", start: h(20), end: h(24), title: "Quarter-end change freeze", ref: "No changes" },
];
const DAY = 24 * 60;
const START = h(14, 10);
/** One simulated minute per tick, so the live window visibly progresses. */
const TICK_MS = 1500;

const clock = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const short = (name: string) => {
  const [first, last] = name.split(" ");
  return last ? `${first} ${last[0]}.` : first;
};
const pct = (m: number) => (m / DAY) * 100;

type Status = "done" | "live" | "next";
const statusOf = (w: Win, now: number): Status => (now >= w.end ? "done" : now >= w.start ? "live" : "next");

/** Data center · medium. Today's change windows on a 24-hour strip with a moving NOW marker; the live window fills as it runs, and tapping a block shows who owns it. */
export function ChangeWindowsWidget({ index }: { index?: number }) {
  const [now, setNow] = useState(START);
  const [pick, setPick] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => setNow((n) => (n + 1 >= DAY ? h(0, 30) : n + 1)), TICK_MS);
    return () => window.clearInterval(t);
  }, []);

  const auto = WINDOWS.find((w) => statusOf(w, now) === "live") ?? WINDOWS.find((w) => statusOf(w, now) === "next") ?? WINDOWS[0];
  const sel = WINDOWS.find((w) => w.id === pick) ?? auto;
  const st = statusOf(sel, now);
  const freeze = sel.id === "freeze";
  const delay = 0.3 + (index ?? 0) * 0.06;
  const nowPct = pct(now);
  const until = sel.start - now;

  return (
    <Widget size="medium" index={index} label="Change windows">
      <WidgetHeader
        icon={<CalendarClock20Filled />}
        tint="var(--ios-blue)"
        title="Change Windows"
        subtitle="Hall 2 · 4 changes · freeze 20:00"
      />

      <div className="relative mt-2 h-[40px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={sel.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="flex h-full items-center gap-2.5"
          >
            {sel.who ? (
              <MemojiAvatar who={sel.who} size={34} alt={sel.who} />
            ) : (
              <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-ios-orange/15 text-ios-orange">
                <LockClosed16Regular />
              </span>
            )}
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[13px] font-semibold text-heading">{sel.title}</div>
              <div className="truncate text-[11px] text-tertiary tabular">
                {clock(sel.start)}–{sel.end === DAY ? "24:00" : clock(sel.end)}
                {sel.who ? ` · ${short(sel.who)}` : ""} · {sel.ref}
              </div>
            </div>
            <span
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap tabular",
                freeze
                  ? "bg-ios-orange/15 text-ios-orange"
                  : st === "done"
                    ? "bg-fill-tertiary text-secondary"
                    : st === "live"
                      ? "bg-ios-blue/15 text-ios-blue"
                      : "bg-ios-indigo/15 text-ios-indigo",
              )}
            >
              {freeze ? (
                st === "live" ? "Frozen" : `Freeze in ${Math.floor(until / 60)}h ${String(until % 60).padStart(2, "0")}m`
              ) : st === "done" ? (
                <>
                  <Checkmark12Filled /> Done
                </>
              ) : st === "live" ? (
                <>
                  <span className="size-1.5 animate-pulse rounded-full bg-ios-blue" />
                  {Math.round(((now - sel.start) / (sel.end - sel.start)) * 100)}% · live
                </>
              ) : (
                `In ${Math.floor(until / 60)}h ${String(until % 60).padStart(2, "0")}m`
              )}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-auto">
        <div className="relative h-[16px]">
          <motion.span
            className="absolute top-0 -translate-x-1/2 rounded-full bg-ios-red px-1.5 text-[10px] leading-[14px] font-semibold text-white tabular"
            initial={false}
            animate={{ left: `${Math.min(93, Math.max(7, nowPct))}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          >
            {clock(now)}
          </motion.span>
        </div>

        <div className="relative h-[24px] rounded-md bg-fill-quaternary">
          {/* Hour grid */}
          {Array.from({ length: 23 }, (_, i) => (
            <span
              key={i}
              className={cn("absolute top-1 bottom-1 w-px", (i + 1) % 6 === 0 ? "bg-fill" : "bg-fill-tertiary")}
              style={{ left: `${pct((i + 1) * 60)}%` }}
            />
          ))}

          {WINDOWS.map((w, i) => {
            const s = statusOf(w, now);
            const on = sel.id === w.id;
            const isFreeze = w.id === "freeze";
            return (
              <motion.button
                key={w.id}
                type="button"
                aria-label={w.title}
                onClick={() => setPick(w.id)}
                className={cn(
                  "absolute top-[3px] bottom-[3px] origin-left cursor-pointer overflow-hidden rounded-[4px] outline-none",
                  !isFreeze && (s === "done" ? "bg-fill" : s === "live" ? "bg-ios-blue/25" : "bg-ios-indigo/35"),
                  on && "ring-1 ring-inset ring-sel",
                )}
                style={{
                  left: `${pct(w.start)}%`,
                  width: `${pct(w.end - w.start)}%`,
                  background: isFreeze
                    ? "repeating-linear-gradient(135deg, color-mix(in oklab, var(--ios-orange) 40%, transparent) 0 3px, transparent 3px 6px)"
                    : undefined,
                }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                whileHover={{ y: -1 }}
                transition={{
                  default: { type: "spring", stiffness: 220, damping: 22, delay: delay + i * 0.08 },
                  y: { type: "spring", stiffness: 500, damping: 30 },
                }}
              >
                {s === "live" && !isFreeze ? (
                  <motion.span
                    className="absolute inset-y-0 left-0 bg-ios-blue"
                    animate={{ width: `${((now - w.start) / (w.end - w.start)) * 100}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 24 }}
                  />
                ) : null}
              </motion.button>
            );
          })}

          {/* NOW marker */}
          <motion.span
            className="pointer-events-none absolute -top-[3px] -bottom-[3px] w-[2px] -translate-x-1/2 rounded-full bg-ios-red"
            initial={false}
            animate={{ left: `${nowPct}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          />
        </div>

        <div className="relative mt-1 h-[12px] text-[10px] leading-[12px] text-tertiary tabular">
          {[0, 6, 12, 18, 24].map((hh, i, all) => (
            <span
              key={hh}
              className="absolute"
              style={i === 0 ? { left: 0 } : i === all.length - 1 ? { right: 0 } : { left: `${pct(hh * 60)}%`, transform: "translateX(-50%)" }}
            >
              {String(hh).padStart(2, "0")}:00
            </span>
          ))}
        </div>
      </div>
    </Widget>
  );
}
