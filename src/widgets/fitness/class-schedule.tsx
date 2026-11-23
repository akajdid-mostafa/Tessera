import { CalendarLtr20Filled, Checkmark16Filled, PersonAdd16Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Session = {
  id: string;
  time: string;
  mins: number;
  name: string;
  coach: string;
  room: string;
  booked: number;
  cap: number;
  waitlist: number;
  color: string;
};
const SESSIONS: Session[] = [
  { id: "spin", time: "12:15", mins: 45, name: "Rhythm Spin", coach: "Maya Chen", room: "Cycle room", booked: 18, cap: 20, waitlist: 0, color: "var(--ios-pink)" },
  { id: "hiit", time: "17:45", mins: 30, name: "HIIT Circuit", coach: "Diego Alvarez", room: "Studio B", booked: 16, cap: 16, waitlist: 4, color: "var(--ios-orange)" },
  { id: "yoga", time: "19:00", mins: 60, name: "Power Yoga", coach: "Priya Nair", room: "Studio A", booked: 9, cap: 24, waitlist: 0, color: "var(--ios-purple)" },
];

/** Fitness · medium. Today's studio classes with coach, fill and spots; book one and the spot count rolls, a full class takes you onto the waitlist. */
export function ClassScheduleWidget({ index }: { index?: number }) {
  const [mine, setMine] = useState<Record<string, boolean>>({});
  const delay = 0.3 + (index ?? 0) * 0.06;
  const count = Object.values(mine).filter(Boolean).length;

  return (
    <Widget size="medium" index={index} label="Studio classes today">
      <WidgetHeader
        icon={<CalendarLtr20Filled />}
        tint="var(--ios-pink)"
        title="Classes · Today"
        subtitle="Northside Studio · Mon, Nov 9"
        extra={
          <div className="text-right leading-tight">
            <div className="text-[10px] text-tertiary">You're in</div>
            <div className="text-[15px] font-semibold text-heading">
              <AnimatedNumber value={count} />
              <span className="text-[11px] font-medium text-tertiary"> class{count === 1 ? "" : "es"}</span>
            </div>
          </div>
        }
      />

      <div className="mt-2 flex min-h-0 flex-1 flex-col">
        {SESSIONS.map((s, i) => {
          const on = !!mine[s.id];
          const full = s.booked >= s.cap;
          const booked = s.booked + (on && !full ? 1 : 0);
          const left = s.cap - booked;
          const wait = s.waitlist + (on && full ? 1 : 0);
          const fill = booked / s.cap;
          const barColor = full ? "var(--ios-red)" : fill >= 0.8 ? "var(--ios-orange)" : "var(--ios-green)";
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30, delay: delay + i * 0.07 }}
              className="flex h-[41px] shrink-0 items-center gap-2.5 border-split [&:not(:first-child)]:border-t-[0.5px]"
            >
              <div className="w-[38px] shrink-0 leading-tight">
                <div className="text-[12.5px] font-semibold text-heading tabular">{s.time}</div>
                <div className="text-[10px] text-tertiary tabular">{s.mins} min</div>
              </div>
              <span className="h-6 w-[3px] shrink-0 rounded-full" style={{ background: s.color }} />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[12.5px] font-semibold text-heading">{s.name}</div>
                <div className="flex items-center gap-1 truncate text-[11px] text-tertiary">
                  <MemojiAvatar who={s.coach} size={14} />
                  <span className="truncate">
                    {s.coach.split(" ")[0]} · {s.room}
                  </span>
                </div>
              </div>
              <Tooltip title={`${booked} of ${s.cap} booked${wait ? ` · ${wait} waiting` : ""}`}>
                <div className="w-[64px] shrink-0 leading-tight">
                  <div className="h-1 overflow-hidden rounded-full bg-fill-secondary">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: barColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${fill * 100}%` }}
                      transition={{ type: "spring", stiffness: 90, damping: 18, delay: on ? 0 : delay + 0.2 + i * 0.07 }}
                    />
                  </div>
                  <div
                    className={cn(
                      "mt-1 text-[11px] font-semibold whitespace-nowrap",
                      full ? "text-ios-red" : left <= 3 ? "text-ios-orange" : "text-secondary",
                    )}
                  >
                    {full ? (
                      <>
                        Full · <AnimatedNumber value={wait} /> wait
                      </>
                    ) : (
                      <>
                        <AnimatedNumber value={left} /> left
                      </>
                    )}
                  </div>
                </div>
              </Tooltip>
              <Button
                size="small"
                shape="circle"
                aria-label={on ? `Cancel ${s.name}` : full ? `Join waitlist for ${s.name}` : `Book ${s.name}`}
                aria-pressed={on}
                onClick={() => setMine((m) => ({ ...m, [s.id]: !m[s.id] }))}
                {...(on
                  ? { type: "primary" as const, className: full ? "bg-ios-orange/15 text-ios-orange hover:bg-ios-orange/25" : "bg-ios-green/15 text-ios-green hover:bg-ios-green/25" }
                  : { color: "default", variant: "filled" as const })}
                icon={
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={on ? "on" : "off"}
                      className="grid"
                      initial={{ scale: 0, rotate: -60 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 520, damping: 20 }}
                    >
                      {on ? <Checkmark16Filled /> : <PersonAdd16Regular />}
                    </motion.span>
                  </AnimatePresence>
                }
              />
            </motion.div>
          );
        })}
      </div>
    </Widget>
  );
}
