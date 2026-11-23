import { Checkmark12Filled, LockClosed12Regular, PaintBrush20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type PointerEvent, useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { LEVELS, type LevelId, ROOM_TYPE, USD, levelOf, usd } from "./_parts-b";

/* October 2026 starts on a Thursday; the week starts on Monday. The business date is Wed, Oct 14. */
const DAYS_IN_MONTH = 31;
const OFFSET = 3;
const TODAY = 14;
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
/** A manual price with no level: the master plan on Fri, Oct 16. */
const MANUAL_PRICE = 275;

/** How the month is stored: high season until the 18th, then low season with Weekend + Friday on Fri and Sat. */
function storedLevel(day: number): LevelId | null {
  if (day === 16) return null;
  if (day <= 18) return 2;
  const weekday = (OFFSET + day - 1) % 7; // 0 = Mon
  return weekday === 4 || weekday === 5 ? 1 : 3;
}
const STORED: Record<number, LevelId | null> = Object.fromEntries(
  Array.from({ length: DAYS_IN_MONTH }, (_, i) => [i + 1, storedLevel(i + 1)]),
);

type Phase = "idle" | "sending" | "sent";

/** Revenue · large. A month painted by rate level; pick a level and brush across days to repaint them, then review the draft. */
export function RateLevelCalendarWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [stored, setStored] = useState(STORED);
  const [draft, setDraft] = useState<Record<number, LevelId>>({});
  const [brush, setBrush] = useState<LevelId>(2);
  const [phase, setPhase] = useState<Phase>("idle");
  const painting = useRef(false);

  const levelOn = (day: number) => draft[day] ?? stored[day];
  const priceOn = (day: number) => {
    const level = levelOn(day);
    return level ? levelOf(level).bar : MANUAL_PRICE;
  };
  const drafts = Object.keys(draft).length;
  const future = Array.from({ length: DAYS_IN_MONTH - TODAY + 1 }, (_, i) => TODAY + i);
  const avg = Math.round(future.reduce((s, d) => s + priceOn(d), 0) / future.length);

  const paint = (day: number) => {
    if (day < TODAY || phase === "sending") return;
    setDraft((d) => {
      if (d[day] === brush) return d;
      const next = { ...d };
      if (stored[day] === brush) delete next[day];
      else next[day] = brush;
      return next;
    });
  };

  const dayAt = (e: PointerEvent) => {
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const day = el?.closest<HTMLElement>("[data-day]")?.dataset.day;
    return day ? Number(day) : null;
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    const day = dayAt(e);
    if (day === null) return;
    painting.current = true;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    paint(day);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!painting.current) return;
    const day = dayAt(e);
    if (day !== null) paint(day);
  };
  const onUp = () => {
    painting.current = false;
  };

  const review = () => {
    if (!drafts || phase !== "idle") return;
    setPhase("sending");
  };

  // The change set goes out as a background job; the drafted days become the stored ones.
  useEffect(() => {
    if (phase === "sending") {
      const t = window.setTimeout(() => {
        setStored((s) => ({ ...s, ...draft }));
        setDraft({});
        setPhase("sent");
      }, 1300);
      return () => window.clearTimeout(t);
    }
    if (phase === "sent") {
      const t = window.setTimeout(() => setPhase("idle"), 2200);
      return () => window.clearTimeout(t);
    }
  }, [phase, draft]);

  return (
    <Widget size="large" index={index} label="Rate level calendar">
      <WidgetHeader
        icon={<PaintBrush20Filled />}
        tint="var(--ios-purple)"
        title="Rate Levels · October"
        subtitle={`${ROOM_TYPE} · Best Available Rate`}
        extra={
          <AnimatePresence mode="popLayout">
            {phase === "sent" ? (
              <motion.span
                key="sent"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mt-0.5 flex items-center gap-1 rounded-full bg-ios-green/15 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-ios-green"
              >
                <Checkmark12Filled /> Saved
              </motion.span>
            ) : drafts ? (
              <motion.button
                key="review"
                type="button"
                onClick={review}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileTap={{ scale: 0.92 }}
                className="mt-0.5 flex cursor-pointer items-center gap-1.5 rounded-full bg-ios-blue py-0.5 pr-2 pl-1 text-[11px] font-semibold whitespace-nowrap text-white"
              >
                <span className="grid h-4 min-w-4 place-items-center rounded-full bg-white/25 px-1 text-[10px] tabular">
                  {phase === "sending" ? (
                    <motion.span
                      className="size-2 rounded-full border-[1.5px] border-white border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <AnimatedNumber value={drafts} />
                  )}
                </span>
                {phase === "sending" ? "Sending" : "Review"}
              </motion.button>
            ) : null}
          </AnimatePresence>
        }
      />

      {/* Palette */}
      <div className="mt-2 flex gap-1.5">
        {LEVELS.map((l, i) => {
          const on = brush === l.id;
          return (
            <motion.button
              key={l.id}
              type="button"
              onClick={() => setBrush(l.id)}
              aria-pressed={on}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 420, damping: 26, delay: delay + i * 0.05 } }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 500, damping: 26 }}
              className={cn(
                "relative flex h-[36px] min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-[10px] px-2 text-left",
                on ? "bg-fill-secondary" : "bg-fill-quaternary",
              )}
              style={on ? { boxShadow: `inset 0 0 0 1px ${l.color}` } : undefined}
            >
              <motion.span
                className="size-2 shrink-0 rounded-full"
                style={{ background: l.color }}
                animate={{ scale: on ? 1.15 : 1 }}
              />
              <span className="min-w-0 leading-tight">
                <span className={cn("block truncate text-[11px] font-semibold", on ? "text-heading" : "text-secondary")}>
                  {l.name.replace(" + Friday", "")}
                </span>
                <span className="block text-[10px] text-tertiary tabular">{usd(l.bar)}</span>
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-[3px]">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="text-center text-[10px] leading-[14px] font-medium text-tertiary">
            {w}
          </span>
        ))}
      </div>

      {/* The month wall */}
      <div
        className="mt-0.5 grid touch-none grid-cols-7 gap-[3px] select-none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {Array.from({ length: OFFSET }, (_, i) => (
          <span key={`pad-${i}`} className="h-[44px]" />
        ))}
        {Array.from({ length: DAYS_IN_MONTH }, (_, i) => {
          const day = i + 1;
          const level = levelOn(day);
          const color = level ? levelOf(level).color : null;
          const past = day < TODAY;
          const drafted = draft[day] !== undefined;
          return (
            <motion.div
              key={day}
              data-day={day}
              className={cn(
                "relative flex h-[44px] flex-col justify-between overflow-hidden rounded-[5px] bg-fill-secondary px-1.5 py-1",
                past ? "cursor-not-allowed" : "cursor-crosshair transition-[filter] hover:brightness-110",
                past ? "text-tertiary" : color ? "text-white" : "text-heading",
              )}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 24, delay: delay + 0.1 + i * 0.012 }}
            >
              {/* The paint: a fresh coat grows from the middle when the level changes. */}
              <AnimatePresence initial={false}>
                {color ? (
                  <motion.span
                    key={color}
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-[5px]"
                    style={{ background: color }}
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: past ? 0.28 : 1, scale: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.35 } }}
                    transition={{ type: "spring", stiffness: 420, damping: 26 }}
                  />
                ) : null}
              </AnimatePresence>
              <span className="relative flex items-center justify-between text-[11px] leading-none font-semibold tabular">
                <span
                  className={cn(
                    day === TODAY && "-mx-1 -my-0.5 rounded-full bg-white px-1 py-0.5 text-black ring-1 ring-black/10",
                  )}
                >
                  {day}
                </span>
                {past ? (
                  <LockClosed12Regular className="size-2.5 opacity-80" />
                ) : drafted ? (
                  <motion.span
                    className="size-1.5 rounded-full bg-white shadow-[0_0_0_1.5px_rgba(0,0,0,0.25)]"
                    animate={{ scale: [1, 1.35, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                ) : !level ? (
                  <span className="text-[9px] font-medium text-tertiary">M</span>
                ) : null}
              </span>
              <AnimatedNumber
                value={priceOn(day)}
                format={{ maximumFractionDigits: 0 }}
                className={cn("relative text-[11px] leading-none font-medium", color && !past ? "opacity-90" : past ? "text-tertiary" : "text-secondary")}
              />
              {drafted ? (
                <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[5px] ring-2 ring-white/80 ring-inset" />
              ) : null}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-auto flex h-5 items-center justify-between gap-2 text-[11px] whitespace-nowrap">
        <span className="text-tertiary">
          Avg BAR from today{" "}
          <AnimatedNumber value={avg} format={USD} className="font-semibold text-heading" />
        </span>
        <span className="truncate text-tertiary">
          {drafts ? (
            <span className="font-medium text-ios-blue">
              {drafts} {drafts === 1 ? "day" : "days"} in draft
            </span>
          ) : (
            "Brush days to repaint · M manual"
          )}
        </span>
      </div>
    </Widget>
  );
}
