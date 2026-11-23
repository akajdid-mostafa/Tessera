import { ArrowUndo20Filled, Clock12Regular } from "@fluentui/react-icons";
import { animate, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Tier = { days: number; refund: number };
type Policy = { id: string; name: string; tiers: Tier[]; /** Days shown at the strip's left edge. */ span: number };

/** The storefront's cancellation policies (tour-b2c `POLICIES`): refund % by days before the start. */
const POLICIES: Policy[] = [
  { id: "standard", name: "Standard", tiers: [{ days: 30, refund: 100 }, { days: 14, refund: 50 }, { days: 7, refund: 25 }], span: 40 },
  { id: "flexible", name: "Flexible", tiers: [{ days: 3, refund: 100 }, { days: 1, refund: 50 }], span: 20 },
];

/** KY-26-0412 · Red Rock 3-Day Package Tour, 2 pax × $980. */
const TOTAL = 1_960;
/** Departure Nov 26, 09:00 (Flagstaff pickup), seen from the evening of Nov 9. */
const START_LEFT = 16 * 86_400 + 9 * 3_600 + 14 * 60 + 37;
const DAY = 86_400;

const BASE = 40; // svg baseline
const TOP = 4;

const COLOR: Record<number, string> = {
  100: "var(--ios-green)",
  50: "var(--ios-yellow)",
  25: "var(--ios-orange)",
  0: "var(--ios-red)",
};
const TEXT: Record<number, string> = {
  100: "text-ios-green",
  50: "text-ios-yellow",
  25: "text-ios-orange",
  0: "text-ios-red",
};

/** Cancelling `days` or more before the start refunds the first tier it reaches. */
const refundAt = (p: Policy, days: number) => p.tiers.find((t) => days >= t.days)?.refund ?? 0;
/** The tier boundary the refund drops at next, and what it drops to. */
function nextDrop(p: Policy, days: number) {
  const i = p.tiers.findIndex((t) => days >= t.days);
  if (i < 0) return null;
  return { at: p.tiers[i].days, to: p.tiers[i + 1]?.refund ?? 0 };
}
/** Days before departure as a 0–1 position; a square-root scale keeps the last week readable. */
const fx = (p: Policy, days: number) => 1 - Math.sqrt(Math.min(p.span, Math.max(0, days)) / p.span);

function segments(p: Policy) {
  return [...p.tiers.map((t, i) => ({ from: i === 0 ? p.span : p.tiers[i - 1].days, to: t.days, refund: t.refund })), { from: p.tiers[p.tiers.length - 1].days, to: 0, refund: 0 }];
}

function countdown(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const d = Math.floor(s / DAY);
  const hh = String(Math.floor((s % DAY) / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${d}d ${hh}:${mm}:${ss}`;
}

/** Tour guest · small. The cancellation policy's refund steps on a strip to departure; today sweeps in and the refund rolls down to where it stands, the next drop counts down live, and a tap swaps Standard for Flexible. */
export function RefundMeterWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [pi, setPi] = useState(0);
  const [left, setLeft] = useState(START_LEFT);
  const [sweep, setSweep] = useState<number | null>(POLICIES[0].span);
  const [first, setFirst] = useState(true);
  const p = POLICIES[pi];

  useEffect(() => {
    const t = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, []);

  // Today's marker sweeps in from the booking side; the refund steps down as it passes each tier.
  useEffect(() => {
    const controls = animate(POLICIES[pi].span, START_LEFT / DAY, {
      duration: 1.5,
      ease: [0.45, 0, 0.2, 1],
      delay: first ? delay + 0.2 : 0.05,
      onUpdate: (v) => setSweep(v),
      onComplete: () => setSweep(null),
    });
    return () => controls.stop();
  }, [pi]);

  const days = sweep ?? left / DAY;
  const refund = refundAt(p, days);
  const drop = nextDrop(p, left / DAY);
  const segs = segments(p);
  const cx = fx(p, days);
  const dotTop = ((BASE - (refund / 100) * (BASE - TOP)) / 44) * 100;

  return (
    <Widget
      size="small"
      index={index}
      label="Cancellation refund"
      pressable
      onPress={() => {
        setFirst(false);
        setSweep(POLICIES[(pi + 1) % POLICIES.length].span);
        setPi((n) => (n + 1) % POLICIES.length);
      }}
    >
      <WidgetHeader
        icon={<ArrowUndo20Filled />}
        tint={COLOR[refund]}
        title="Refund Meter"
        subtitle={
          <motion.span key={p.id} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} className="block truncate">
            {p.name} policy · KY-26-0412
          </motion.span>
        }
      />

      <div className="mt-2 flex items-baseline-last justify-between gap-1.5 whitespace-nowrap">
        <AnimatedNumber value={refund} suffix="%" className={cn("text-[30px] leading-none font-semibold tracking-tight", TEXT[refund])} />
        <div className="mb-px text-right leading-tight">
          <AnimatedNumber value={(TOTAL * refund) / 100} prefix="$" className="text-[13px] font-semibold text-heading" />
          <div className="text-[10px] text-tertiary tabular">of $1,960</div>
        </div>
      </div>

      <div className="mt-1 flex items-center gap-1 truncate text-[11px] text-tertiary">
        <Clock12Regular className="shrink-0" />
        {drop ? (
          <span className="truncate tabular">
            <span className={cn("font-semibold", TEXT[drop.to])}>{drop.to}%</span> in {countdown(left - drop.at * DAY)}
          </span>
        ) : (
          <span className="truncate">No refund from here</span>
        )}
      </div>

      <div className="mt-auto">
        <div className="relative h-[36px]">
          <svg viewBox="0 0 100 44" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
            {segs.map((s, i) => {
              const x0 = fx(p, s.from) * 100;
              const x1 = fx(p, s.to) * 100;
              const h = s.refund ? (s.refund / 100) * (BASE - TOP) : 2;
              const state = days < s.to ? "past" : days >= s.from ? "ahead" : "now";
              return (
                <motion.rect
                  key={`${p.id}-${i}`}
                  x={x0}
                  width={Math.max(0.5, x1 - x0 - 1)}
                  rx={1.2}
                  fill={COLOR[s.refund]}
                  initial={{ attrY: BASE, height: 0, opacity: 0 }}
                  animate={{ attrY: BASE - h, height: h, opacity: state === "now" ? 1 : state === "past" ? 0.18 : 0.42 }}
                  transition={{ type: "spring", stiffness: 160, damping: 20, delay: first ? delay + i * 0.06 : i * 0.04, opacity: { duration: 0.3 } }}
                />
              );
            })}
            <line x1="0" x2="100" y1={BASE + 1.5} y2={BASE + 1.5} strokeWidth="1" vectorEffect="non-scaling-stroke" className="stroke-fill-secondary" />
          </svg>
          {/* Today */}
          <div className="pointer-events-none absolute inset-y-0 w-0" style={{ left: `${cx * 100}%` }}>
            <span className="absolute top-0 bottom-0 left-[-0.75px] w-[1.5px] rounded-full bg-heading" />
            <motion.span
              className="absolute left-[-5px] size-2.5 rounded-full ring-2 ring-[var(--widget-surface)]"
              style={{ top: `calc(${dotTop}% - 5px)`, background: COLOR[refund] }}
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
        <div className="relative mt-0.5 h-[11px] text-[9px] leading-[11px] font-medium text-tertiary tabular">
          {p.tiers.map((t) => (
            <motion.span
              key={`${p.id}-${t.days}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -translate-x-1/2"
              style={{ left: `${fx(p, t.days) * 100}%` }}
            >
              {t.days}d
            </motion.span>
          ))}
          <span className="absolute right-0">Dep.</span>
        </div>
      </div>

      <div className="mt-1.5 flex justify-center gap-1">
        {POLICIES.map((x, i) => (
          <motion.span
            key={x.id}
            layout
            className={cn("h-1.5 rounded-full", i === pi ? "w-3.5 bg-heading" : "w-1.5 bg-fill")}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        ))}
      </div>
    </Widget>
  );
}
