import { ArrowRight12Regular, ArrowSync20Filled, Checkmark12Filled, Flash12Filled, Warning12Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { clock, hm, ROOM_TYPES, TWO, type TypeId } from "./_parts-a";

type Reason = "not_ready_at_eta" | "room_dirty";
type Seam = {
  room: string;
  type: TypeId;
  out: string;
  outAt: number;
  in: string;
  eta: number;
  /** Minutes until an attendant reaches the room; a rush sends one straight away. */
  queue: number;
  reason: Reason;
};

/* Today's turnovers: the guest leaving, the guest arriving into the same room, and the clean in between. */
const SEAMS: Seam[] = [
  { room: "V2", type: 310, out: "Hans Becker", outAt: hm(12), in: "Olivia Brown", eta: hm(13), queue: 15, reason: "not_ready_at_eta" },
  { room: "110", type: 302, out: "Jenna Clark", outAt: hm(11, 30), in: "Anna Schmidt", eta: hm(12, 45), queue: 35, reason: "room_dirty" },
  { room: "111", type: 302, out: "Brian Young", outAt: hm(11), in: "Claire Dubois", eta: hm(14), queue: 20, reason: "not_ready_at_eta" },
];
const REASON: Record<Reason, string> = { not_ready_at_eta: "Not ready at ETA", room_dirty: "Room dirty" };
const START = hm(11, 20);
const END = hm(14, 10);

const readyAt = (s: Seam, rushed: boolean) => s.outAt + (rushed ? 0 : s.queue) + ROOM_TYPES[s.type].cleanMin;

/** Front desk · medium. Today's turnover seams: a bar fills from checkout toward the next guest's ETA from the cleaning minutes and turns red when the room won't make it; Rush gives the room priority and pulls the estimate in. */
export function TurnoverSeamsWidget({ index }: { index?: number }) {
  const [now, setNow] = useState(START);
  const [rushed, setRushed] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => setNow((n) => (n + 1 > END ? START : n + 1)), 1500);
    return () => window.clearInterval(t);
  }, []);

  const late = SEAMS.filter((s) => readyAt(s, rushed.includes(s.room)) > s.eta).length;
  const toggle = (room: string) => {
    setTouched(true);
    setRushed((r) => (r.includes(room) ? r.filter((x) => x !== room) : [...r, room]));
  };

  return (
    <Widget size="medium" index={index} label="Turnover seams">
      <WidgetHeader
        icon={<ArrowSync20Filled />}
        tint="var(--ios-teal)"
        title="Turnover Seams"
        subtitle={<span className="tabular">Today · {clock(now)} · out → in</span>}
        extra={
          <motion.div
            key={late}
            initial={{ scale: touched ? 1.15 : 1 }}
            animate={{ scale: 1 }}
            className={cn(
              "flex h-[24px] items-center gap-1 rounded-full px-2 text-[12px] font-semibold whitespace-nowrap transition-colors",
              late ? "bg-ios-red/15 text-ios-red" : "bg-ios-green/15 text-ios-green",
            )}
          >
            {late ? <Warning12Filled /> : <Checkmark12Filled />}
            <AnimatedNumber value={late} trend={-1} />
            <span className="text-[11px] font-medium">at risk</span>
          </motion.div>
        }
      />

      <div className="mt-2 flex flex-col">
        {SEAMS.map((s, si) => {
          const on = rushed.includes(s.room);
          const ready = readyAt(s, on);
          const isLate = ready > s.eta;
          const span = s.eta - s.outAt;
          const q = on ? 0 : s.queue;
          const qW = Math.min(q / span, 1) * 100;
          const cW = Math.min((q + ROOM_TYPES[s.type].cleanMin) / span, 1) * 100 - qW;
          const nowX = now >= s.outAt && now <= s.eta ? ((now - s.outAt) / span) * 100 : null;
          const color = isLate ? "var(--ios-red)" : "var(--ios-green)";
          const enter = touched ? 0 : delay + 0.15 + si * 0.08;
          return (
            <motion.div
              key={s.room}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30, delay: delay + si * 0.07 }}
              className="flex h-[40px] items-center gap-2 border-split [&:not(:first-child)]:border-t-[0.5px]"
            >
              <div className="w-[44px] shrink-0 leading-tight">
                <div className="flex items-center gap-0.5 text-[13px] font-semibold text-heading tabular">
                  {s.room}
                  <AnimatePresence>
                    {on ? (
                      <motion.span
                        className="grid text-ios-yellow"
                        initial={{ scale: 0, rotate: -60 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 520, damping: 18 }}
                      >
                        <Flash12Filled />
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>
                <div className="truncate text-[10px] text-tertiary">
                  {ROOM_TYPES[s.type].cleanMin} min
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 truncate text-[11px] leading-4 text-secondary">
                  <span className="truncate">{s.out}</span>
                  <span className="shrink-0 text-tertiary tabular">{clock(s.outAt)}</span>
                  <ArrowRight12Regular className="shrink-0 text-tertiary" />
                  <span className="truncate font-medium text-heading">{s.in}</span>
                  <span className="shrink-0 text-tertiary tabular">{clock(s.eta)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Tooltip
                    title={`Out ${clock(s.outAt)} · ${on ? "priority, no wait" : `wait ${s.queue} min`} · clean ${ROOM_TYPES[s.type].cleanMin} min · ready ${clock(ready)}${ready > s.eta ? `, ${ready - s.eta} min after the ETA` : ""}`}
                  >
                    <div className="relative h-[6px] min-w-0 flex-1 cursor-default overflow-hidden rounded-full bg-fill-tertiary">
                      <motion.div
                        className="absolute inset-y-0 left-0"
                        style={{
                          backgroundImage: `repeating-linear-gradient(135deg, transparent 0 3px, color-mix(in srgb, ${color} 45%, transparent) 3px 4.5px)`,
                        }}
                        initial={{ width: "0%" }}
                        animate={{ width: `${qW}%` }}
                        transition={{ type: "spring", stiffness: 140, damping: 22, delay: enter }}
                      />
                      <motion.div
                        className="absolute inset-y-0 rounded-full"
                        initial={{ left: "0%", width: "0%" }}
                        animate={{ left: `${qW}%`, width: `${cW}%`, backgroundColor: color }}
                        transition={{ type: "spring", stiffness: 140, damping: 22, delay: enter }}
                      />
                      {nowX !== null ? (
                        <motion.span
                          className="absolute inset-y-0 w-[2px] -translate-x-1/2 bg-[var(--ant-color-text-heading)]"
                          animate={{ left: `${nowX}%` }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                      ) : null}
                    </div>
                  </Tooltip>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={isLate ? "late" : "ok"}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                      className={cn(
                        "w-[86px] shrink-0 truncate text-[10px] font-medium",
                        isLate ? "text-ios-red" : "text-ios-green",
                      )}
                    >
                      {isLate ? REASON[s.reason] : `On time · ${s.eta - ready}m`}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex w-[54px] shrink-0 flex-col items-end gap-[3px] leading-none">
                <div className={cn("flex items-baseline text-[13px] font-semibold tabular", isLate ? "text-ios-red" : "text-ios-green")}>
                  <AnimatedNumber value={Math.floor(ready / 60)} format={TWO} />
                  <span>:</span>
                  <AnimatedNumber value={ready % 60} format={TWO} />
                </div>
                {isLate || on ? (
                  <motion.button
                    type="button"
                    onClick={() => toggle(s.room)}
                    aria-pressed={on}
                    whileTap={{ scale: 0.88 }}
                    className={cn(
                      "flex h-[18px] cursor-pointer items-center gap-0.5 rounded-full px-1.5 text-[10px] font-semibold transition-colors",
                      on ? "bg-ios-yellow/20 text-ios-yellow" : "bg-ios-red text-white",
                    )}
                  >
                    <Flash12Filled className="size-2.5" />
                    {on ? "Priority" : "Rush"}
                  </motion.button>
                ) : (
                  <span className="text-[10px] text-tertiary">est. ready</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </Widget>
  );
}
