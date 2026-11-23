import { Checkmark12Filled, Luggage20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { enterDelay, hhmm, useInterval } from "./_parts";

type Belt = {
  id: string;
  flight: string;
  from: string;
  type: string;
  aibt: number; // on-blocks, minutes after midnight
  total: number;
  delivered: number;
  first: number | null;
  pace: number; // bags per tick
  note: string;
};

const FIRST_TARGET = 15; // min after on-blocks, narrow-body
const LAST_TARGET = 25;
const T0 = 14 * 60 + 22;
const SIM_MIN_PER_TICK = 0.4;
const TICK_MS = 2000;

const SEED: Belt[] = [
  { id: "4", flight: "BA 2611", from: "Nice", type: "A320", aibt: 14 * 60 + 2, total: 168, delivered: 139, first: 14 * 60 + 13, pace: 3, note: "2 loaders" },
  { id: "5", flight: "U2 8318", from: "Lisbon", type: "A320neo", aibt: 14 * 60 + 10, total: 131, delivered: 0, first: null, pace: 3, note: "Offload started" },
  { id: "6", flight: "W9 5733", from: "Budapest", type: "A321neo", aibt: 13 * 60 + 52, total: 214, delivered: 186, first: 14 * 60 + 6, pace: 1, note: "1 loader · hold 2 slow" },
];

const BELT_D = "M40 22H110A36 36 0 0 1 110 94H40A36 36 0 0 1 40 22Z";
const ISLAND_D = "M40 32H110A26 26 0 0 1 110 84H40A26 26 0 0 1 40 32Z";
const BAG_TINT = ["var(--ios-indigo)", "var(--ant-color-text-secondary)", "var(--ios-teal)", "var(--ios-pink)", "var(--ios-blue)", "var(--ant-color-text-tertiary)"];

/** Airport · medium. A reclaim carousel drawn top-down with bags riding the belt while delivered counts roll against first- and last-bag targets; switch belts, and the flight past its last-bag target shows orange. */
export function BaggageBeltWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [belts, setBelts] = useState(SEED);
  const [now, setNow] = useState(T0);
  const [sel, setSel] = useState("4");
  const delay = enterDelay(index);

  useInterval(() => {
    const next = now + SIM_MIN_PER_TICK;
    if (next > 14 * 60 + 46) {
      setNow(T0);
      setBelts(SEED);
      return;
    }
    setNow(next);
    setBelts((bs) =>
      bs.map((b) => {
        const first = b.first ?? (next >= b.aibt + 13 ? Math.round(next) : null);
        if (first === null || b.delivered >= b.total) return { ...b, first };
        const add = b.pace + Math.round(Math.random());
        return { ...b, first, delivered: Math.min(b.total, b.delivered + add) };
      }),
    );
  }, TICK_MS);

  const overdue = (b: Belt) => b.delivered < b.total && now - b.aibt > LAST_TARGET;
  const b = belts.find((x) => x.id === sel) ?? belts[0];
  const late = overdue(b);
  const done = b.delivered >= b.total;
  const waiting = b.first === null;
  const elapsed = Math.floor(now - b.aibt);
  const eta = Math.round(now + (b.total - b.delivered) / ((b.pace + 0.5) / SIM_MIN_PER_TICK));
  const riding = waiting ? 0 : done ? 3 : 11;

  return (
    <Widget size="medium" index={index} label="Baggage reclaim">
      <WidgetHeader
        icon={<Luggage20Filled />}
        tint={belts.some(overdue) ? "var(--ios-orange)" : "var(--ios-purple)"}
        title="Reclaim · Hall A"
        subtitle={`Local ${hhmm(now)}`}
        extra={
          <Segmented
            size="small"
            value={sel}
            onChange={(v) => setSel(v as string)}
            options={belts.map((x) => ({
              value: x.id,
              label: (
                <span className="flex items-center gap-1">
                  Belt {x.id}
                  {overdue(x) ? <span className="size-1.5 rounded-full bg-ios-orange" /> : null}
                </span>
              ),
            }))}
          />
        }
      />

      <div className="mt-auto flex h-[120px] items-center gap-3">
        <svg viewBox="0 0 150 116" className="h-[116px] w-[150px] shrink-0 overflow-visible" aria-hidden>
          {/* Feed belt from the baggage hall, rubber curtain at the wall. */}
          <rect x="88" y="0" width="16" height="22" rx="2" className="fill-fill-tertiary" />
          {[5, 9, 13, 17].map((yy) => (
            <line key={yy} x1="88" x2="104" y1={yy} y2={yy} strokeWidth="0.8" className="stroke-fill" />
          ))}
          <motion.path
            d={BELT_D}
            fill="none"
            strokeWidth="14"
            className="stroke-fill-secondary"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.path
            d={BELT_D}
            fill="none"
            strokeWidth="12"
            strokeDasharray="1 5"
            className="stroke-fill"
            animate={reduce || waiting ? undefined : { strokeDashoffset: [0, -12] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          />
          <path d={ISLAND_D} className="fill-fill-quaternary" />
          <text x="75" y="66" textAnchor="middle" fontSize="22" fontWeight="700" className="fill-tertiary">
            {b.id}
          </text>

          <AnimatePresence>
            {Array.from({ length: riding }, (_, i) => {
              const dur = 14;
              const w = 7 + (i % 3) * 1.5;
              return (
                <motion.g key={`${b.id}-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }}>
                  <rect x={-w / 2} y="-3" width={w} height="6" rx="1.4" fill={BAG_TINT[(i + Number(b.id)) % BAG_TINT.length]} opacity="0.9">
                    {reduce ? null : (
                      <animateMotion path={BELT_D} dur={`${dur}s`} begin={`${-(dur * i) / riding}s`} repeatCount="indefinite" rotate="auto" />
                    )}
                  </rect>
                </motion.g>
              );
            })}
          </AnimatePresence>
        </svg>

        <div className="flex min-w-0 flex-1 flex-col whitespace-nowrap">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={b.id}
              className="leading-tight"
              initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(3px)" }}
            >
              <div className="truncate text-[13px] font-semibold text-heading">
                {b.flight} <span className="font-normal text-secondary">· {b.from}</span>
              </div>
              <div className="truncate text-[11px] text-tertiary tabular">
                {b.type} · on blocks {hhmm(b.aibt)} · {b.note}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-1.5 flex items-baseline gap-1 leading-none">
            <span className="text-[28px] font-semibold tracking-tight text-heading">
              <AnimatedNumber value={b.delivered} />
            </span>
            <span className="text-[12px] font-medium text-tertiary tabular">/{b.total} bags</span>
            <span className="ml-auto text-[11px] text-tertiary tabular">+{elapsed} min</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-fill-secondary">
            <motion.div
              className={cn("h-full rounded-full", late ? "bg-ios-orange" : "bg-[var(--ant-color-text-secondary)]")}
              initial={{ width: 0 }}
              animate={{ width: `${(b.delivered / b.total) * 100}%` }}
              transition={{ type: "spring", stiffness: 140, damping: 24 }}
            />
          </div>

          <div className="mt-1 flex flex-col text-[11px] leading-[15px] tabular">
            <div className="flex items-center justify-between">
              <span className="text-tertiary">First bag</span>
              <span className="font-medium text-secondary">
                {waiting ? `due ${hhmm(b.aibt + FIRST_TARGET)}` : `${hhmm(b.first ?? 0)} · +${(b.first ?? 0) - b.aibt} min`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-tertiary">Last bag · {LAST_TARGET} min</span>
              {done ? (
                <span className="flex items-center gap-0.5 font-medium text-secondary">
                  <Checkmark12Filled /> Complete
                </span>
              ) : late ? (
                <span className="font-semibold text-ios-orange">Overdue +{elapsed - LAST_TARGET} min</span>
              ) : (
                <span className="font-medium text-secondary">ETA {hhmm(waiting ? b.aibt + 24 : eta)}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Widget>
  );
}
