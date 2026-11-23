import { Broom16Filled, Broom20Filled, Checkmark16Filled, Sparkle16Filled, Wrench16Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { type ComponentType, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Status = "dirty" | "clean" | "inspected" | "ooo";
const CYCLE: Status[] = ["dirty", "clean", "inspected", "ooo"];
const STATUS: Record<Status, { label: string; color: string; text: string; Glyph: ComponentType<{ className?: string }> }> = {
  dirty: { label: "Dirty", color: "var(--ios-orange)", text: "text-ios-orange", Glyph: Broom16Filled },
  clean: { label: "Clean", color: "var(--ios-blue)", text: "text-ios-blue", Glyph: Sparkle16Filled },
  inspected: { label: "Inspected", color: "var(--ios-green)", text: "text-ios-green", Glyph: Checkmark16Filled },
  ooo: { label: "Out of order", color: "var(--ios-red)", text: "text-ios-red", Glyph: Wrench16Filled },
};
const FLOORS = [5, 4, 3, 2];
const PER_FLOOR = 8;
/* Morning board: upper floors still being turned, lower floors mostly done, two rooms out. */
const INITIAL: Status[] = (
  "dddcdicd" + // 5
  "dcdiicdd" + // 4
  "iciioicc" + // 3
  "iiciiici" // 2
)
  .split("")
  .map((c) => ({ d: "dirty", c: "clean", i: "inspected", o: "ooo" })[c] as Status);
const ATTENDANTS = ["Maria Lopez", "Henry Clark", "Gloria Allen"];
const R = 24;
const C = 2 * Math.PI * R;

/** Hospitality · large. The room board by floor; tap a room to move it along, the ring and totals follow, chips spotlight a status. */
export function HousekeepingWidget({ index }: { index?: number }) {
  const [rooms, setRooms] = useState<Status[]>(INITIAL);
  const [focus, setFocus] = useState<Status | null>(null);
  const [touched, setTouched] = useState<number | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  const counts = Object.fromEntries(CYCLE.map((s) => [s, rooms.filter((r) => r === s).length])) as Record<Status, number>;
  const sellable = rooms.length - counts.ooo;
  const ready = counts.inspected + counts.clean;
  const pct = ready / sellable;

  const cycle = (i: number) => {
    setTouched(i);
    setRooms((rs) => rs.map((r, j) => (j === i ? CYCLE[(CYCLE.indexOf(r) + 1) % CYCLE.length] : r)));
  };

  return (
    <Widget size="large" index={index} label="Housekeeping board">
      <WidgetHeader
        icon={<Broom20Filled />}
        tint="var(--ios-mint)"
        title="Housekeeping"
        subtitle="The Wren · Floors 2–5"
      />

      <div className="mt-3 flex items-center gap-3">
        <div className="relative size-14 shrink-0">
          <svg viewBox="0 0 60 60" className="size-full -rotate-90">
            <circle cx="30" cy="30" r={R} fill="none" strokeWidth="7" className="stroke-fill-secondary" />
            <motion.circle
              cx="30"
              cy="30"
              r={R}
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              stroke="var(--ios-green)"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C * (1 - pct) }}
              transition={{ type: "spring", stiffness: 90, damping: 18, delay: touched === null ? delay : 0 }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <AnimatedNumber value={pct} format={{ style: "percent", maximumFractionDigits: 0 }} className="text-[13px] font-semibold text-heading" />
          </div>
        </div>
        <div className="min-w-0 leading-tight">
          <div className="text-[11px] text-tertiary">Ready to sell</div>
          <div className="text-[26px] leading-none font-semibold tracking-tight text-heading">
            <AnimatedNumber value={ready} />
            <span className="text-[13px] font-medium text-tertiary">
              /<AnimatedNumber value={sellable} />
            </span>
          </div>
          <div className="mt-0.5 truncate text-[11px] text-tertiary">
            <AnimatedNumber value={counts.dirty} className="font-semibold text-ios-orange" /> to turn before 14:00
          </div>
        </div>
        <div className="ml-auto flex flex-col items-end gap-1">
          <div className="flex">
            {ATTENDANTS.map((a, i) => (
              <MemojiAvatar
                key={a}
                who={a}
                size={24}
                className={cn("ring-[1.5px] ring-[var(--widget-surface)]", i > 0 && "-ml-2")}
                style={{ zIndex: ATTENDANTS.length - i }}
              />
            ))}
          </div>
          <span className="text-[10px] text-tertiary">3 on shift</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {CYCLE.map((s) => {
          const on = focus === s;
          const st = STATUS[s];
          return (
            <motion.button
              key={s}
              type="button"
              aria-pressed={on}
              onClick={() => {
                setTouched((t) => t ?? -1);
                setFocus((f) => (f === s ? null : s));
              }}
              whileTap={{ scale: 0.94 }}
              className={cn(
                "min-w-0 cursor-pointer rounded-lg px-1.5 py-1 text-left leading-tight transition-colors duration-mid",
                on ? "bg-fill-secondary" : "bg-fill-quaternary hover:bg-fill-tertiary",
              )}
              style={on ? { boxShadow: `inset 0 0 0 1px ${st.color}` } : undefined}
            >
              <div className="flex items-center gap-1 text-[10px] text-tertiary">
                <span className="size-1.5 shrink-0 rounded-full" style={{ background: st.color }} />
                <span className="truncate">{st.label}</span>
              </div>
              <AnimatedNumber value={counts[s]} className="text-[15px] font-semibold text-heading" />
            </motion.button>
          );
        })}
      </div>

      <div className="mt-2.5 flex min-h-0 flex-1 flex-col gap-1.5">
        {FLOORS.map((floor, fi) => (
          <div key={floor} className="flex min-h-0 flex-1 items-stretch gap-1.5">
            <span className="w-4 shrink-0 self-center text-[10px] font-medium text-tertiary tabular">{floor}F</span>
            {Array.from({ length: PER_FLOOR }, (_, ri) => {
              const i = fi * PER_FLOOR + ri;
              const status = rooms[i];
              const st = STATUS[status];
              const dim = focus !== null && focus !== status;
              const room = `${floor}${String(ri + 1).padStart(2, "0")}`;
              return (
                <motion.button
                  key={room}
                  type="button"
                  aria-label={`Room ${room}, ${st.label}. Tap to change.`}
                  onClick={() => cycle(i)}
                  // Text color as a class, so light mode can deepen it (see AUTHORING).
                  className={cn(
                    "relative flex min-w-0 flex-1 cursor-pointer flex-col justify-between overflow-hidden rounded-[9px] p-1 text-left transition-[background-color,color] duration-300",
                    st.text,
                  )}
                  style={{ backgroundColor: `color-mix(in srgb, ${st.color} 18%, transparent)` }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: dim ? 0.22 : 1, scale: dim ? 0.9 : 1 }}
                  whileHover={{ scale: dim ? 0.92 : 1.06 }}
                  whileTap={{ scale: 0.88 }}
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 24,
                    delay: touched === null ? delay + fi * 0.06 + ri * 0.025 : 0,
                  }}
                >
                  <span className="text-[10px] font-semibold tabular">{room}</span>
                  <motion.span
                    key={status}
                    className="self-end"
                    initial={{ scale: 0, rotate: -40 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 520, damping: 18 }}
                  >
                    <st.Glyph className="block size-3" />
                  </motion.span>
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>
    </Widget>
  );
}
