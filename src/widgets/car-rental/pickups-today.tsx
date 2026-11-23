import { CalendarClock20Filled, Checkmark12Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

const LANES = [
  { id: "Economy", color: "var(--ios-teal)" },
  { id: "Compact", color: "var(--ios-blue)" },
  { id: "SUV", color: "var(--ios-indigo)" },
  { id: "Premium", color: "var(--ios-purple)" },
] as const;
type Lane = (typeof LANES)[number]["id"];
type Pickup = { at: number; name: string; car: string; cls: Lane; plate: string };

const hm = (h: number, m = 0) => h * 60 + m;
const DAY_START = hm(8);
const DAY_END = hm(20);
const SPAN = DAY_END - DAY_START;
const START = hm(13, 18);
const MINUTE_MS = 2000;

const PICKUPS: Pickup[] = [
  { at: hm(8, 30), name: "Mike Johnson", car: "Fiat Egea", cls: "Economy", plate: "8KRL104" },
  { at: hm(9, 15), name: "Sophie Laurent", car: "VW Golf", cls: "Compact", plate: "8FHT662" },
  { at: hm(10), name: "Daniel Novak", car: "Toyota C-HR", cls: "SUV", plate: "8ERT218" },
  { at: hm(10, 45), name: "Emily Davis", car: "Renault Clio", cls: "Economy", plate: "8BNM870" },
  { at: hm(11, 30), name: "Marco Rossi", car: "BMW 520i", cls: "Premium", plate: "8PRM520" },
  { at: hm(12, 20), name: "Sarah Miller", car: "Peugeot 308", cls: "Compact", plate: "8GHT311" },
  { at: hm(13), name: "James Carter", car: "Hyundai Tucson", cls: "SUV", plate: "8SUV044" },
  { at: hm(13, 45), name: "Jessica Brown", car: "Fiat Egea", cls: "Economy", plate: "8KRL129" },
  { at: hm(14, 30), name: "Lukas Weber", car: "Mercedes C 200", cls: "Premium", plate: "8MRC200" },
  { at: hm(15, 40), name: "Nina Petrova", car: "Toyota Corolla", cls: "Compact", plate: "8CRL778" },
  { at: hm(17, 10), name: "Omar Haddad", car: "Dacia Duster", cls: "SUV", plate: "8DST509" },
  { at: hm(18, 30), name: "Ryan Thompson", car: "Renault Clio", cls: "Economy", plate: "8BNM902" },
];
const HOURS = [8, 10, 12, 14, 16, 18, 20];

const clock = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(Math.floor(m % 60)).padStart(2, "0")}`;
const x = (m: number) => ((m - DAY_START) / SPAN) * 100;
const laneColor = (cls: Lane) => LANES.find((l) => l.id === cls)?.color ?? "var(--ios-blue)";

/** Car rental · large. The desk's day on a timeline: NOW creeps right, passed pickups tick done. */
export function PickupsTodayWidget({ index }: { index?: number }) {
  const [now, setNow] = useState(START);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(
      () => setNow((n) => (n + 1 > DAY_END ? DAY_START + 20 : n + 1)),
      MINUTE_MS,
    );
    return () => window.clearInterval(t);
  }, []);

  const done = PICKUPS.filter((p) => p.at <= now).length;
  const upcoming = PICKUPS.filter((p) => p.at > now);
  const next = upcoming[0];

  return (
    <Widget size="large" index={index} label="Pickups today">
      <WidgetHeader
        icon={<CalendarClock20Filled />}
        tint="var(--ios-teal)"
        title="Pickups Today"
        subtitle="LAX Airport · Desk B"
        extra={
          <span className="rounded-full bg-fill-tertiary px-2 py-0.5 text-[11px] font-semibold text-secondary tabular">
            {clock(now)}
          </span>
        }
      />

      <div className="mt-3 flex items-baseline-last justify-between">
        <div className="leading-none">
          <div className="mb-1 text-[11px] text-tertiary">Handed over</div>
          <div className="flex items-baseline text-[32px] font-semibold tracking-tight text-heading">
            <AnimatedNumber value={done} />
            <span className="text-[15px] font-medium text-tertiary">/{PICKUPS.length}</span>
          </div>
        </div>
        <div className="text-right leading-tight">
          <div className="text-[11px] text-tertiary">Next pickup</div>
          {next ? (
            <div className="text-[15px] font-semibold text-ios-teal">
              in <AnimatedNumber value={next.at - now} trend={-1} /> min
            </div>
          ) : (
            <div className="text-[15px] font-semibold text-tertiary">All done</div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-3 flex gap-2">
        <div className="flex w-[50px] shrink-0 flex-col gap-1 pt-px">
          {LANES.map((l) => (
            <div key={l.id} className="flex h-[22px] items-center gap-1.5 text-[10px] text-tertiary">
              <span className="size-1.5 shrink-0 rounded-full" style={{ background: l.color }} />
              {l.id}
            </div>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="flex flex-col gap-1">
            {LANES.map((l, li) => (
              <div key={l.id} className="relative h-[22px] rounded-md bg-fill-quaternary">
                {PICKUPS.filter((p) => p.cls === l.id).map((p, k) => {
                  const isDone = p.at <= now;
                  return (
                    <Tooltip
                      key={p.plate}
                      title={`${clock(p.at)} · ${p.name} · ${p.car} · ${p.plate}`}
                    >
                      <motion.span
                        className="absolute inset-y-[3px] grid aspect-square origin-center cursor-default place-items-center rounded-[5px] text-white"
                        style={{
                          left: `${x(p.at)}%`,
                          background: l.color,
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: isDone ? 0.55 : 1 }}
                        whileHover={{ scale: 1.15, opacity: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 260,
                          damping: 22,
                          delay: delay + li * 0.06 + k * 0.05,
                        }}
                      >
                        <AnimatePresence>
                          {isDone ? (
                            <motion.span
                              initial={{ scale: 0, rotate: -40 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 20 }}
                              className="grid"
                            >
                              <Checkmark12Filled />
                            </motion.span>
                          ) : null}
                        </AnimatePresence>
                      </motion.span>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>

          {/* NOW line */}
          <motion.div
            className="pointer-events-none absolute -bottom-1 -top-1 w-0"
            initial={{ left: "0%", opacity: 0 }}
            animate={{ left: `${x(now)}%`, opacity: 1 }}
            transition={{
              left: { duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: now === START ? delay : 0 },
              opacity: { delay },
            }}
          >
            <span className="absolute inset-y-0 -left-px w-[2px] rounded-full bg-ios-red" />
            <span className="absolute -left-[4px] -top-[3px] size-2 rounded-full bg-ios-red ring-2 ring-[var(--widget-surface)]" />
          </motion.div>

          <div className="relative mt-1.5 h-3 text-[10px] leading-3 text-tertiary tabular">
            {HOURS.map((h) => (
              <span
                key={h}
                className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full"
                style={{ left: `${x(hm(h))}%` }}
              >
                {String(h).padStart(2, "0")}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Up next */}
      <div className="mt-auto pt-1.5">
        <div className="mb-1 text-[11px] leading-4 font-semibold text-tertiary">Up next</div>
        <div className="flex flex-col">
          <AnimatePresence mode="popLayout" initial={false}>
            {upcoming.slice(0, 2).map((p) => (
              <motion.div
                key={p.plate}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="flex items-center gap-2.5 border-t-[0.5px] border-split py-1.5 first:border-t-0"
              >
                <MemojiAvatar who={p.name} size={30} />
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-[13px] font-medium text-heading">{p.name}</div>
                  <div className="flex items-center gap-1 truncate text-[11px] text-tertiary">
                    <span className="size-1.5 rounded-full" style={{ background: laneColor(p.cls) }} />
                    {p.car} · {p.cls}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 leading-tight">
                  <span className="text-[13px] font-semibold text-heading tabular">{clock(p.at)}</span>
                  <span className="rounded-[4px] px-1 text-[10px] font-medium text-secondary ring-1 ring-inset ring-[var(--ant-color-border)] tabular">
                    {p.plate}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </Widget>
  );
}
