import { ArrowRight12Regular, Checkmark12Filled, PersonAlert20Filled, Warning12Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { ROOM_TYPES, type TypeId } from "./_parts-a";

type Reason = "not_ready_at_eta" | "room_dirty" | "room_occupied";
const REASON: Record<Reason, string> = {
  not_ready_at_eta: "Not ready at ETA",
  room_dirty: "Room dirty",
  room_occupied: "Room occupied",
};
type Risk = { guest: string; room: string; type: TypeId; eta: string; reason: Reason; ready: string };

/* Today's arrivals the turnover check flags, each with a clean room of the same type to move into. */
const POOL: Risk[] = [
  { guest: "Olivia Brown", room: "V2", type: 310, eta: "13:00", reason: "not_ready_at_eta", ready: "V6" },
  { guest: "Anna Schmidt", room: "110", type: 302, eta: "12:45", reason: "room_dirty", ready: "107" },
  { guest: "Sofia Rossi", room: "316", type: 305, eta: "14:00", reason: "room_occupied", ready: "315" },
  { guest: "Kevin Adams", room: "116", type: 302, eta: "14:30", reason: "room_dirty", ready: "114" },
  { guest: "Claire Dubois", room: "111", type: 302, eta: "14:00", reason: "not_ready_at_eta", ready: "113" },
  { guest: "Jacob Ames", room: "115", type: 302, eta: "15:00", reason: "room_occupied", ready: "117" },
];
type Row = Risk & { key: number; moved: boolean; late: boolean };
const START: Row[] = POOL.slice(0, 3).map((r, i) => ({ ...r, key: i, moved: false, late: false }));

/** Front desk · medium. Arrivals whose room won't be ready, with the reason; Move to ready room slides in a clean room of the same type and clears the risk, and a new risk shakes in later. */
export function AtRiskArrivalsWidget({ index }: { index?: number }) {
  const [rows, setRows] = useState<Row[]>(START);
  const [next, setNext] = useState(3);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const open = rows.filter((r) => !r.moved).length;

  // A moved row lingers to show its new room, then leaves.
  useEffect(() => {
    const done = rows.find((r) => r.moved);
    if (!done) return;
    const t = window.setTimeout(() => setRows((rs) => rs.filter((r) => r.key !== done.key)), 1500);
    return () => window.clearTimeout(t);
  }, [rows]);

  // The turnover check runs again and finds a new risk.
  useEffect(() => {
    if (rows.length >= 3) return;
    // The next flagged guest who is not already on the list.
    let k = next;
    while (rows.some((r) => r.guest === POOL[k % POOL.length].guest)) k += 1;
    const t = window.setTimeout(() => {
      setRows((rs) => [...rs, { ...POOL[k % POOL.length], key: k, moved: false, late: true }]);
      setNext(k + 1);
    }, 2600);
    return () => window.clearTimeout(t);
  }, [rows, next]);

  const move = (key: number) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, moved: true } : r)));

  return (
    <Widget size="medium" index={index} label="At-risk arrivals">
      <WidgetHeader
        icon={<PersonAlert20Filled />}
        tint="var(--ios-red)"
        title="At-Risk Arrivals"
        subtitle="Today · turnover check"
        extra={
          <div
            className={cn(
              "flex h-[24px] items-center gap-1 rounded-full px-2 text-[12px] font-semibold whitespace-nowrap transition-colors",
              open ? "bg-ios-red/15 text-ios-red" : "bg-ios-green/15 text-ios-green",
            )}
          >
            {open ? <Warning12Filled /> : <Checkmark12Filled />}
            <AnimatedNumber value={open} />
            <span className="text-[11px] font-medium">at risk</span>
          </div>
        }
      />

      {/* 164 − 28 header − 8 mt = 128 px; 3 × 36 rows + 2 × 8 gaps = 124 px, 4 px slack. */}
      <div className="mt-2 flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {rows.map((r, i) => (
            <motion.div
              key={r.key}
              layout
              initial={r.late ? { opacity: 0, y: 10 } : { opacity: 0, x: -10 }}
              animate={r.late ? { opacity: 1, y: 0, x: [0, -7, 7, -5, 5, -2, 0] } : { opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, x: 24, filter: "blur(3px)", transition: { duration: 0.25 } }}
              transition={{
                default: { type: "spring", stiffness: 380, damping: 30, delay: r.late ? 0 : delay + i * 0.07 },
                layout: { type: "spring", stiffness: 380, damping: 30 },
                x: r.late
                  ? { duration: 0.5, delay: 0.2 }
                  : { type: "spring", stiffness: 380, damping: 30, delay: delay + i * 0.07 },
              }}
              className="relative flex h-[36px] items-center gap-2 not-first:before:absolute not-first:before:inset-x-0 not-first:before:-top-1 not-first:before:h-[0.5px] not-first:before:bg-split"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 24, delay: r.late ? 0 : delay + i * 0.07 }}
              >
                <MemojiAvatar who={r.guest} size={28} />
              </motion.div>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[12.5px] font-medium text-heading">{r.guest}</div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={r.moved ? "ok" : "risk"}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className={cn(
                      "flex items-center gap-1 truncate text-[10.5px] font-medium",
                      r.moved ? "text-ios-green" : "text-ios-red",
                    )}
                  >
                    {r.moved ? <Checkmark12Filled className="shrink-0" /> : <Warning12Filled className="shrink-0" />}
                    <span className="truncate">
                      {r.moved ? `Moved to ${r.ready} · ready` : REASON[r.reason]}
                      <span className="font-normal text-tertiary"> · ETA {r.eta}</span>
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>

              <Tooltip title={ROOM_TYPES[r.type].name}>
                <div
                  className={cn(
                    "relative grid h-[24px] w-[42px] shrink-0 cursor-default place-items-center overflow-hidden rounded-md text-[12px] font-semibold tabular transition-colors duration-300",
                    r.moved ? "bg-ios-green/15 text-ios-green" : "bg-fill-tertiary text-heading",
                  )}
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={r.moved ? r.ready : r.room}
                      initial={{ y: 22, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -22, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 420, damping: 28 }}
                    >
                      {r.moved ? r.ready : r.room}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </Tooltip>

              <Tooltip title={`Move to ready room · ${r.ready} is ${ROOM_TYPES[r.type].short}, inspected`}>
                <motion.button
                  type="button"
                  disabled={r.moved}
                  onClick={() => move(r.key)}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "flex h-[24px] w-[76px] shrink-0 cursor-pointer items-center justify-center gap-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors disabled:cursor-default",
                    r.moved ? "bg-fill-quaternary text-tertiary" : "bg-ios-blue text-white hover:opacity-90",
                  )}
                >
                  {r.moved ? (
                    <>
                      <Checkmark12Filled /> Moved
                    </>
                  ) : (
                    <>
                      Move <ArrowRight12Regular /> {r.ready}
                    </>
                  )}
                </motion.button>
              </Tooltip>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
