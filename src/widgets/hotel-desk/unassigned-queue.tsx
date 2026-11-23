import { ArrowCounterclockwise12Regular, Checkmark12Filled, DoorArrowRight20Filled, Wand16Filled, Warning12Filled } from "@fluentui/react-icons";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { ROOM_TYPES, type TypeId } from "./_parts-a";

type Stay = { id: string; guest: string; booker?: string; type: TypeId; dates: string; nights: number; fit: string | null; why?: string };

/* Reservations with no room yet (roomId null), and the room the assigner finds for each. */
const STAYS: Stay[] = [
  { id: "R822100141", guest: "Derek Kane", type: 302, dates: "Oct 14–16", nights: 2, fit: "107" },
  { id: "R822100156", guest: "John Smith", type: 302, dates: "Oct 21–22", nights: 1, fit: "111" },
  { id: "R822100163", guest: "Lena Weiss", booker: "Globe Travel", type: 302, dates: "Oct 23–25", nights: 2, fit: "113" },
  { id: "R822100138", guest: "Megan Turner", type: 303, dates: "Oct 15–19", nights: 4, fit: "212" },
  { id: "R822100170", guest: "Mason Ross", type: 310, dates: "Oct 19–22", nights: 3, fit: null, why: "No free Villa · Yoga retreat" },
];
const GROUPS: TypeId[] = [302, 303, 310];
const STEP_MS = 420;

/** Front desk · medium. Reservations with no room, grouped by room type; Auto assign flies each card into a room-number chip while the count rolls down, and the one that can't fit stays behind with its reason. */
export function UnassignedQueueWidget({ index }: { index?: number }) {
  const uid = useId();
  const [assigned, setAssigned] = useState<string[]>([]);
  const [failed, setFailed] = useState<string[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const left = STAYS.length - assigned.length;
  const done = cursor === null && (assigned.length > 0 || failed.length > 0);

  // The assigner walks the queue one stay at a time.
  useEffect(() => {
    if (cursor === null) return;
    const t = window.setTimeout(() => {
      const s = STAYS[cursor];
      if (s.fit) setAssigned((a) => [...a, s.id]);
      else setFailed((f) => [...f, s.id]);
      setCursor(cursor + 1 < STAYS.length ? cursor + 1 : null);
    }, STEP_MS);
    return () => window.clearTimeout(t);
  }, [cursor]);

  const run = () => {
    if (done) {
      setAssigned([]);
      setFailed([]);
      return;
    }
    if (cursor === null) setCursor(0);
  };

  return (
    <Widget size="medium" index={index} label="Unassigned reservations">
      <WidgetHeader
        icon={<DoorArrowRight20Filled />}
        tint="var(--ios-purple)"
        title="Unassigned"
        subtitle="No room yet · next 14 days"
        extra={
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "flex h-[24px] items-center gap-1 rounded-full px-2 text-[12px] font-semibold transition-colors",
                left > 1 ? "bg-ios-purple/15 text-ios-purple" : left === 1 ? "bg-ios-orange/15 text-ios-orange" : "bg-ios-green/15 text-ios-green",
              )}
            >
              <AnimatedNumber value={left} trend={-1} />
              <span className="text-[11px] font-medium">open</span>
            </div>
            <motion.button
              type="button"
              onClick={run}
              disabled={cursor !== null}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "flex h-[24px] cursor-pointer items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold whitespace-nowrap transition-colors disabled:cursor-progress",
                done ? "bg-fill-tertiary text-secondary" : "bg-ios-purple text-white",
              )}
            >
              {done ? <ArrowCounterclockwise12Regular /> : (
                <motion.span
                  className="grid"
                  animate={cursor !== null ? { rotate: [0, -20, 20, 0] } : { rotate: 0 }}
                  transition={cursor !== null ? { duration: 0.5, repeat: Infinity } : undefined}
                >
                  <Wand16Filled className="size-3.5" />
                </motion.span>
              )}
              {done ? "Reset" : "Auto assign"}
            </motion.button>
          </div>
        }
      />

      <LayoutGroup id={uid}>
        <div className="mt-1.5 flex flex-col gap-[3px]">
          {GROUPS.map((g, gi) => {
            const waiting = STAYS.filter((s) => s.type === g && !assigned.includes(s.id));
            return (
              <motion.div
                key={g}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 30, delay: delay + gi * 0.07 }}
                className="flex h-[29px] items-center gap-2"
              >
                <div className="w-[62px] shrink-0 leading-tight">
                  <div className="truncate text-[11px] font-semibold text-heading">{ROOM_TYPES[g].short}</div>
                  <div className="text-[10px] text-tertiary tabular">
                    {STAYS.filter((s) => s.type === g).length === 1 ? "1 stay" : `${STAYS.filter((s) => s.type === g).length} stays`}
                  </div>
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-1">
                  <AnimatePresence mode="popLayout">
                    {waiting.map((s) => {
                      const bad = failed.includes(s.id);
                      return (
                        <motion.div
                          key={s.id}
                          layoutId={`stay-${s.id}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={bad ? { opacity: 1, scale: 1, x: [0, -6, 6, -4, 4, 0] } : { opacity: 1, scale: 1, x: 0 }}
                          transition={{ type: "spring", stiffness: 380, damping: 30, x: { duration: 0.45 } }}
                          className={cn(
                            "flex h-[28px] min-w-0 items-center gap-1.5 rounded-lg bg-fill-quaternary pr-1.5 pl-1",
                            bad ? "w-auto max-w-[220px] ring-1 ring-ios-red ring-inset" : "w-[94px]",
                          )}
                        >
                          <MemojiAvatar who={s.guest} size={20} />
                          <Tooltip title={`${s.id} · ${s.booker ? `${s.booker} · ` : ""}${ROOM_TYPES[s.type].name} · ${s.nights} night${s.nights > 1 ? "s" : ""}`}>
                            <div className="min-w-0 cursor-default leading-[1.15]">
                              <div className="truncate text-[10.5px] font-medium text-heading">{s.guest}</div>
                              <div className={cn("flex items-center gap-0.5 truncate text-[9.5px] tabular", bad ? "text-ios-red" : "text-tertiary")}>
                                {bad ? <Warning12Filled className="size-2.5 shrink-0" /> : null}
                                <span className="truncate">{bad ? s.why : s.dates}</span>
                              </div>
                            </div>
                          </Tooltip>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {waiting.length === 0 ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-center gap-1 text-[11px] text-ios-green"
                    >
                      <Checkmark12Filled /> All placed
                    </motion.span>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-auto flex h-[26px] items-center gap-1.5 rounded-xl bg-fill-quaternary px-2">
          <span className="shrink-0 text-[10px] font-medium text-tertiary">Assigned</span>
          <div className="flex min-w-0 flex-1 items-center gap-1">
            {assigned.length === 0 ? (
              <span className="truncate text-[10px] text-tertiary">Rooms land here</span>
            ) : null}
            {STAYS.filter((s) => assigned.includes(s.id)).map((s) => (
              <motion.div
                key={s.id}
                layoutId={`stay-${s.id}`}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="flex h-[20px] items-center gap-1 rounded-full bg-ios-green/15 pr-1.5 pl-0.5 text-ios-green"
              >
                <MemojiAvatar who={s.guest} size={16} />
                <span className="text-[11px] font-semibold tabular">{s.fit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </LayoutGroup>
    </Widget>
  );
}
