import {
  Checkmark16Filled,
  CheckmarkCircle16Filled,
  DoorArrowRight16Regular,
  Luggage20Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { Button } from "@/registry/antuikit/ui/button";
import { Tag } from "@/registry/antuikit/ui/tag";

type Guest = { name: string; room: string; type: string; eta: string; vip?: boolean };
const QUEUE: Guest[] = [
  { name: "Isabella Rossi", room: "1204", type: "Deluxe King · 3 nts", eta: "14:30", vip: true },
  { name: "Kenji Watanabe", room: "807", type: "Skyline Twin · 2 nts", eta: "15:10" },
  { name: "Allison Kerr", room: "1502", type: "Wren Suite · 5 nts", eta: "15:45", vip: true },
  { name: "Lukas Becker", room: "611", type: "Superior Queen · 1 nt", eta: "16:20" },
  { name: "Sofia Mendes", room: "905", type: "Deluxe King · 4 nts", eta: "17:05" },
  { name: "Omar Haddad", room: "1110", type: "Family Room · 2 nts", eta: "18:40" },
];
const TOTAL = 31;
const R = 9;
const C = 2 * Math.PI * R;

/** Hospitality · medium. Today's arrivals; check a guest in and the button turns to a check, the row leaves, the count rolls. */
export function ArrivalsTodayWidget({ index }: { index?: number }) {
  const [checked, setChecked] = useState(12);
  const [queue, setQueue] = useState(QUEUE);
  const [done, setDone] = useState<string | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => {
      setQueue((q) => q.filter((g) => g.name !== done));
      setDone(null);
    }, 900);
    return () => window.clearTimeout(t);
  }, [done]);

  const checkIn = (g: Guest) => {
    if (done) return;
    setDone(g.name);
    setChecked((c) => c + 1);
  };

  return (
    <Widget size="medium" index={index} label="Arrivals today">
      <WidgetHeader
        icon={<Luggage20Filled />}
        tint="var(--ios-teal)"
        title="Arrivals · Today"
        subtitle="The Wren · Front desk"
        extra={
          <div className="flex items-center gap-2">
            <div className="text-right leading-tight">
              <div className="text-[10px] text-tertiary">Checked in</div>
              <div className="text-[15px] font-semibold text-heading">
                <AnimatedNumber value={checked} />
                <span className="text-[11px] font-medium text-tertiary">/{TOTAL}</span>
              </div>
            </div>
            <svg viewBox="0 0 24 24" className="size-7 -rotate-90">
              <circle cx="12" cy="12" r={R} fill="none" strokeWidth="3.5" className="stroke-fill-secondary" />
              <motion.circle
                cx="12"
                cy="12"
                r={R}
                fill="none"
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="var(--ios-teal)"
                strokeDasharray={C}
                initial={{ strokeDashoffset: C }}
                animate={{ strokeDashoffset: C * (1 - checked / TOTAL) }}
                transition={{ type: "spring", stiffness: 90, damping: 18, delay: checked === 12 ? delay : 0 }}
              />
            </svg>
          </div>
        }
      />

      {/* 164 − 28 header − 8 mt = 128 px; 3 × 36 rows + 2 × 8 gaps = 124 px, 4 px slack. */}
      <div className="relative mt-2 flex min-h-0 flex-1 flex-col gap-2">
        <AnimatePresence initial={false} mode="popLayout">
          {queue.slice(0, 3).map((g, i) => {
            const isDone = done === g.name;
            return (
              <motion.div
                key={g.name}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: isDone ? 0.55 : 1, y: 0 }}
                exit={{ opacity: 0, x: 40, filter: "blur(4px)", transition: { duration: 0.25 } }}
                transition={{ type: "spring", stiffness: 380, damping: 30, delay: checked === 12 ? delay + i * 0.07 : 0 }}
                className="relative flex h-[36px] shrink-0 items-center gap-2.5 not-first:before:absolute not-first:before:inset-x-0 not-first:before:-top-1 not-first:before:h-[0.5px] not-first:before:bg-split"
              >
                <MemojiAvatar who={g.name} size={26} />
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[12.5px] font-semibold text-heading">{g.name}</span>
                    {g.vip ? (
                      <Tag size="small" color="gold" variant="filled" className="me-0 shrink-0 rounded-full text-[9px] font-semibold">
                        VIP
                      </Tag>
                    ) : null}
                  </div>
                  <div className="truncate text-[11px] text-tertiary">
                    <span className="font-medium text-secondary tabular">{g.room}</span> · {g.type}
                  </div>
                </div>
                <div className="text-right leading-tight">
                  <div className="text-[10px] text-tertiary">ETA</div>
                  <div className="text-[12px] font-medium text-secondary tabular">{g.eta}</div>
                </div>
                <Button
                  size="small"
                  shape="circle"
                  aria-label={`Check in ${g.name}`}
                  onClick={() => checkIn(g)}
                  {...(isDone
                    ? { type: "primary" as const, className: "bg-ios-green hover:bg-ios-green/85" }
                    : { color: "default", variant: "filled" as const })}
                  icon={
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={isDone ? "done" : "in"}
                        className="grid"
                        initial={{ scale: 0, rotate: -60 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 520, damping: 20 }}
                      >
                        {isDone ? <Checkmark16Filled /> : <DoorArrowRight16Regular />}
                      </motion.span>
                    </AnimatePresence>
                  }
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {queue.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.2 }}
            className="m-auto flex flex-col items-center gap-1 text-center"
          >
            <CheckmarkCircle16Filled className="text-[24px] text-ios-green" />
            <div className="text-[12px] font-semibold text-heading">Front desk is clear</div>
            <div className="text-[11px] text-tertiary">Next arrivals expected after 19:00</div>
          </motion.div>
        ) : null}
      </div>
    </Widget>
  );
}
