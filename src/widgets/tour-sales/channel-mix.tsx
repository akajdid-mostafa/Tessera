import { DataPie20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { entranceDelay, USD, USD_COMPACT } from "./_parts-b";

type Range = "30d" | "90d";

/** The booking channels the product records (`Booking.channel`), with the share of base-currency revenue. */
const CHANNELS = [
  { key: "website", name: "Website", color: "var(--ios-blue)", text: "text-ios-blue" },
  { key: "b2b", name: "B2B agencies", color: "var(--ios-purple)", text: "text-ios-purple" },
  { key: "panel", name: "Panel", color: "var(--ios-indigo)", text: "text-ios-indigo" },
  { key: "widget", name: "Widget", color: "var(--ios-teal)", text: "text-ios-teal" },
  { key: "offer", name: "Offers", color: "var(--ios-orange)", text: "text-ios-orange" },
  { key: "marketplace", name: "Marketplace", color: "var(--ios-pink)", text: "text-ios-pink" },
] as const;

/** Revenue (USD) and bookings per channel, in `CHANNELS` order. */
const DATA: Record<Range, { revenue: number; bookings: number }[]> = {
  "30d": [
    { revenue: 41_260, bookings: 86 },
    { revenue: 28_690, bookings: 54 },
    { revenue: 16_430, bookings: 29 },
    { revenue: 13_820, bookings: 31 },
    { revenue: 12_180, bookings: 9 },
    { revenue: 9_740, bookings: 22 },
  ],
  "90d": [
    { revenue: 118_420, bookings: 247 },
    { revenue: 103_150, bookings: 196 },
    { revenue: 40_270, bookings: 71 },
    { revenue: 37_790, bookings: 88 },
    { revenue: 46_830, bookings: 31 },
    { revenue: 23_610, bookings: 55 },
  ],
};

const SIZE = 124;
const C = SIZE / 2;
const R = 46;
const STROKE = 15;
const CIRC = 2 * Math.PI * R;
const GAP = 2.5;
const POP = 6;

function arcs(range: Range) {
  const rows = DATA[range];
  const total = rows.reduce((s, r) => s + r.revenue, 0);
  let start = 0;
  return rows.map((r) => {
    const len = (r.revenue / total) * CIRC;
    const mid = ((start + len / 2) / CIRC) * Math.PI * 2 - Math.PI / 2;
    const a = { start, len: Math.max(len - GAP, 0.5), share: r.revenue / total, mid };
    start += len;
    return a;
  });
}

/** Tour sales · medium. Revenue by booking channel as a donut that sweeps in; tap a slice or a legend row to pop it out and read its dollars and bookings, and switch 30 or 90 days to watch the slices re-share. */
export function ChannelMixWidget({ index }: { index?: number }) {
  const delay = entranceDelay(index);
  const [range, setRange] = useState<Range>("30d");
  const [sel, setSel] = useState<number | null>(null);
  // The sweep-in is staggered once; later re-shares (range switch) move every slice together.
  const [landed, setLanded] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setLanded(true), (delay + 1.2) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);
  const rows = DATA[range];
  const segs = arcs(range);
  const total = rows.reduce((s, r) => s + r.revenue, 0);
  const bookings = rows.reduce((s, r) => s + r.bookings, 0);
  const pick = (i: number) => setSel((s) => (s === i ? null : i));
  const ch = sel === null ? null : CHANNELS[sel];

  return (
    <Widget size="medium" index={index} label="Revenue by channel">
      <WidgetHeader
        icon={<DataPie20Filled />}
        tint="var(--ios-blue)"
        title="Revenue by channel"
        subtitle="Base currency · USD"
        extra={
          <Segmented
            size="small"
            value={range}
            onChange={(v) => setRange(v as Range)}
            options={["30d", "90d"]}
          />
        }
      />

      <div className="mt-1 flex min-h-0 flex-1 items-center gap-3">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="overflow-visible" aria-label="Channel share donut">
            <circle cx={C} cy={C} r={R} fill="none" stroke="var(--ant-color-fill-quaternary)" strokeWidth={STROKE} />
            {segs.map((s, i) => {
              const on = sel === i;
              const dim = sel !== null && !on;
              return (
                <motion.g
                  key={CHANNELS[i].key}
                  animate={{ x: on ? Math.cos(s.mid) * POP : 0, y: on ? Math.sin(s.mid) * POP : 0, opacity: dim ? 0.35 : 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 22 }}
                  onClick={() => pick(i)}
                  className="cursor-pointer"
                >
                  <motion.circle
                    cx={C}
                    cy={C}
                    r={R}
                    fill="none"
                    stroke={CHANNELS[i].color}
                    strokeLinecap="butt"
                    transform={`rotate(-90 ${C} ${C})`}
                    initial={{ strokeDasharray: `0 ${CIRC}`, strokeDashoffset: -s.start, strokeWidth: STROKE }}
                    animate={{
                      strokeDasharray: `${s.len} ${CIRC}`,
                      strokeDashoffset: -s.start,
                      strokeWidth: on ? STROKE + 4 : STROKE,
                    }}
                    transition={{
                      strokeDasharray: { type: "spring", stiffness: 90, damping: 18, delay: landed ? 0 : delay + i * 0.08 },
                      strokeDashoffset: { type: "spring", stiffness: 90, damping: 18 },
                      strokeWidth: { type: "spring", stiffness: 420, damping: 22 },
                    }}
                  />
                </motion.g>
              );
            })}
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={ch?.key ?? "all"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16 }}
                className={cn("max-w-[72px] truncate text-[10px] font-medium", ch ? ch.text : "text-tertiary")}
              >
                {ch ? ch.name : "Revenue"}
              </motion.div>
            </AnimatePresence>
            <AnimatedNumber
              value={sel === null ? total : rows[sel].revenue}
              format={USD_COMPACT}
              className="text-[17px] leading-tight font-semibold tracking-tight text-heading"
            />
            <div className="text-[10px] text-tertiary">
              <AnimatedNumber value={sel === null ? bookings : rows[sel].bookings} /> bookings
            </div>
          </div>
        </div>

        <ul className="m-0 flex min-w-0 flex-1 list-none flex-col p-0">
          {CHANNELS.map((c, i) => {
            const on = sel === i;
            return (
              <motion.li
                key={c.key}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: sel !== null && !on ? 0.45 : 1, x: 0 }}
                transition={{ delay: landed ? 0 : delay + 0.1 + i * 0.05, duration: 0.25 }}
              >
                <button
                  type="button"
                  onClick={() => pick(i)}
                  className={cn(
                    "flex h-[19px] w-full cursor-pointer items-center gap-2 rounded-md px-1.5 text-left transition-colors duration-mid",
                    on ? "bg-fill-tertiary" : "hover:bg-fill-quaternary",
                  )}
                >
                  <span className="size-2 shrink-0 rounded-full" style={{ background: c.color }} />
                  <span className="min-w-0 flex-1 truncate text-[12px] text-heading">{c.name}</span>
                  <AnimatedNumber
                    value={segs[i].share}
                    format={{ style: "percent", maximumFractionDigits: 0 }}
                    className="w-[30px] text-right text-[11px] text-tertiary"
                  />
                  <AnimatedNumber
                    value={rows[i].revenue}
                    format={on ? USD : USD_COMPACT}
                    className="w-[70px] text-right text-[12px] font-semibold text-heading"
                  />
                </button>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </Widget>
  );
}
