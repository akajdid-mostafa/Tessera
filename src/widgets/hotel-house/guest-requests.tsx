import {
  Bed16Regular,
  Box16Regular,
  Checkmark16Filled,
  Drop16Regular,
  Food16Regular,
  Key16Regular,
  ServiceBell20Filled,
  Sparkle16Regular,
  Tv16Regular,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ComponentType, useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Req = { id: string; what: string; room: string; guest: string; Icon: ComponentType<{ className?: string }>; opened: number };

/** Housekeeping's promise: a guest request is closed within twenty minutes. */
const SLA = 20 * 60;
/* Open requests at Seabright Villas, oldest first; `opened` is seconds relative to now. */
const OPEN: Req[] = [
  { id: "r1", what: "Extra towels ×2", room: "417", guest: "Nina Petrova", Icon: Drop16Regular, opened: -1130 },
  { id: "r2", what: "Extra pillows", room: "312", guest: "Connor Hale", Icon: Bed16Regular, opened: -480 },
  { id: "r3", what: "TV not working", room: "506", guest: "Anna Schmidt", Icon: Tv16Regular, opened: -240 },
  { id: "r4", what: "Turndown now", room: "V2", guest: "Hans Becker", Icon: Sparkle16Regular, opened: -60 },
];
const INCOMING: Omit<Req, "id" | "opened">[] = [
  { what: "Baby cot", room: "415", guest: "Erica Price", Icon: Box16Regular },
  { what: "Key card not working", room: "108", guest: "Tom Harris", Icon: Key16Regular },
  { what: "Minibar refill", room: "403", guest: "Sofia Rossi", Icon: Food16Regular },
  { what: "Bathrobes ×2", room: "S3", guest: "Lily Dorsey", Icon: Drop16Regular },
];
const ARRIVE_EVERY_S = 11;
const MAX_OPEN = 6;
const R = 12;
const C = 2 * Math.PI * R;

const mmss = (s: number) => {
  const v = Math.abs(s);
  return `${s < 0 ? "−" : ""}${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, "0")}`;
};

/** Guests · medium. Open guest requests as a notification stack with a live SLA ring on the top card; swipe or tap Done to clear it, the next card rises and new requests slide in at the back. */
export function GuestRequestsWidget({ index }: { index?: number }) {
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState(OPEN);
  const [done, setDone] = useState({ total: 23, onTime: 21 });
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  // Live: a new request lands every few seconds, at the back of the queue.
  useEffect(() => {
    if (tick === 0 || tick % ARRIVE_EVERY_S !== 0) return;
    const n = tick / ARRIVE_EVERY_S - 1;
    const r: Req = { ...INCOMING[n % INCOMING.length], id: `in-${tick}`, opened: tick };
    setOpen((list) => (list.length >= MAX_OPEN ? list : [...list, r]));
  }, [tick]);

  const close = (r: Req) => {
    const onTime = tick - r.opened <= SLA;
    setOpen((list) => list.filter((x) => x.id !== r.id));
    setDone((d) => ({ total: d.total + 1, onTime: d.onTime + (onTime ? 1 : 0) }));
  };

  const top = open[0];
  const stack = open.slice(0, 3);

  return (
    <Widget size="medium" index={index} label="Guest requests">
      <WidgetHeader
        icon={<ServiceBell20Filled />}
        tint="var(--ios-indigo)"
        title="Guest Requests"
        subtitle="Housekeeping · closes within 20 min"
        extra={
          <div className="text-right leading-tight whitespace-nowrap">
            <div className="text-[10px] text-tertiary">Open</div>
            <AnimatedNumber value={open.length} className="text-[15px] font-semibold text-heading" />
          </div>
        }
      />

      <div className="relative mt-2.5 h-[76px] shrink-0">
        <AnimatePresence initial={false}>
          {stack.map((r, i) => {
            const age = tick - r.opened;
            const share = Math.min(1, age / SLA);
            const left = SLA - age;
            const color = left < 0 ? "var(--ios-red)" : share > 0.75 ? "var(--ios-orange)" : "var(--ios-green)";
            const text = left < 0 ? "text-ios-red" : share > 0.75 ? "text-ios-orange" : "text-ios-green";
            const isTop = i === 0;
            return (
              <motion.div
                key={r.id}
                className={cn(
                  "absolute inset-x-0 top-0 h-[64px] overflow-hidden rounded-2xl bg-widget-surface ring-1 ring-split ring-inset",
                  isTop && "cursor-grab active:cursor-grabbing",
                )}
                style={{ zIndex: 3 - i }}
                initial={{ opacity: 0, y: 30, scale: 0.85 }}
                animate={{ opacity: 1, y: i * 6, scale: 1 - i * 0.05 }}
                exit={{ opacity: 0, x: 420, rotate: 4, transition: { duration: 0.3 } }}
                transition={{ type: "spring", stiffness: 340, damping: 30, delay: tick === 0 ? delay + i * 0.06 : 0 }}
                drag={isTop ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0.05, right: 0.8 }}
                onDragEnd={(_, info) => {
                  if (isTop && info.offset.x > 110) close(r);
                }}
              >
                <div className="absolute inset-0 bg-fill-tertiary" />
                <motion.div
                  className="relative flex h-full items-center gap-2.5 px-2.5"
                  animate={{ opacity: isTop ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="relative shrink-0">
                    <MemojiAvatar who={r.guest} size={34} />
                    <span className="absolute -right-1 -bottom-1 grid size-[18px] place-items-center rounded-full bg-ios-indigo text-white ring-2 ring-[var(--widget-surface)]">
                      <r.Icon className="size-3" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-[13px] font-semibold text-heading">{r.what}</div>
                    <div className="truncate text-[11px] text-tertiary">
                      Room <span className="font-semibold text-secondary tabular">{r.room}</span> · {r.guest}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <svg viewBox="0 0 30 30" className="size-[28px] -rotate-90">
                      <circle cx="15" cy="15" r={R} fill="none" strokeWidth="3.5" className="stroke-fill-secondary" />
                      <motion.circle
                        cx="15"
                        cy="15"
                        r={R}
                        fill="none"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeDasharray={C}
                        initial={{ strokeDashoffset: C, stroke: color }}
                        animate={{ strokeDashoffset: C * (1 - share), stroke: color }}
                        transition={{ type: "spring", stiffness: 90, damping: 20 }}
                      />
                    </svg>
                    <div className="w-[38px] leading-tight">
                      <div className={cn("text-[12px] font-semibold tabular", text)}>{mmss(left)}</div>
                      <div className="text-[9px] text-tertiary">{left < 0 ? "overdue" : "left"}</div>
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => isTop && close(r)}
                    onPointerDownCapture={(e) => e.stopPropagation()}
                    aria-label={`Done: ${r.what}, room ${r.room}`}
                    className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full bg-ios-green text-white"
                  >
                    <Checkmark16Filled className="size-4" />
                  </motion.button>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {!top ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-x-0 top-0 grid h-[64px] place-items-center rounded-2xl bg-fill-quaternary text-[12px] font-medium text-secondary"
          >
            All caught up · new requests land here
          </motion.div>
        ) : null}
      </div>

      <div className="mt-auto flex items-center text-[11px] text-tertiary whitespace-nowrap">
        <span>
          Closed today <AnimatedNumber value={done.total} className="font-semibold text-secondary" />
        </span>
        <span className="mx-1.5">·</span>
        <span>
          <AnimatedNumber
            value={done.onTime / done.total}
            format={{ style: "percent", maximumFractionDigits: 0 }}
            className="font-semibold text-ios-green"
          />{" "}
          on time
        </span>
        <span className="ml-auto">Swipe right to close</span>
      </div>
    </Widget>
  );
}
