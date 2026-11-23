import {
  Checkmark16Filled,
  Flash20Filled,
  Home20Filled,
  Phone20Filled,
  Receipt20Filled,
  VehicleCar20Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ComponentType, useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Bill = {
  id: string;
  name: string;
  payee: string;
  day: number;
  date: string;
  weekday: string;
  amount: number;
  Glyph: ComponentType<{ className?: string }>;
  tint: string;
};

/** Days from today (Mon, Nov 9) to each due date; the band spans 22 days. */
const SPAN = 22;
const BILLS: Bill[] = [
  { id: "mobile", name: "Mobile plan", payee: "Northline Wireless", day: 2, date: "Nov 11", weekday: "Wed", amount: 65, Glyph: Phone20Filled, tint: "var(--ios-blue)" },
  { id: "power", name: "Electricity", payee: "City Power & Light", day: 5, date: "Nov 14", weekday: "Sat", amount: 112.48, Glyph: Flash20Filled, tint: "var(--ios-yellow)" },
  { id: "car", name: "Car loan", payee: "Harbor Credit Union", day: 13, date: "Nov 22", weekday: "Sun", amount: 389, Glyph: VehicleCar20Filled, tint: "var(--ios-purple)" },
  { id: "rent", name: "Rent", payee: "Maple Court Apartments", day: 22, date: "Dec 1", weekday: "Tue", amount: 1650, Glyph: Home20Filled, tint: "var(--ios-pink)" },
];
/** Maps a day offset onto the band, leaving room for the end labels. */
const X = (day: number) => 5 + (day / SPAN) * 89;

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const USD = { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

/** Finance · medium. Bills on a 3-week band; Pay settles the nearest one and the total rolls down. */
export function UpcomingBillsWidget({ index }: { index?: number }) {
  const [paid, setPaid] = useState<Set<string>>(new Set());
  const [justPaid, setJustPaid] = useState<string | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  const next = BILLS.find((b) => !paid.has(b.id));
  const total = BILLS.reduce((s, b) => s + (paid.has(b.id) ? 0 : b.amount), 0);
  const due = next ? next.day : SPAN;

  const pay = () => {
    if (!next || justPaid) return;
    setJustPaid(next.id);
    setPaid((p) => new Set(p).add(next.id));
  };
  useEffect(() => {
    if (!justPaid) return;
    const t = window.setTimeout(() => setJustPaid(null), 1400);
    return () => window.clearTimeout(t);
  }, [justPaid]);
  const shownBill = justPaid ? BILLS.find((b) => b.id === justPaid) : next;

  return (
    <Widget size="medium" index={index} label="Upcoming bills">
      <WidgetHeader
        icon={<Receipt20Filled />}
        tint="var(--ios-red)"
        title="Upcoming Bills"
        subtitle="Next 3 weeks · Checking •••• 4821"
      />

      <div className="mt-2 flex items-center gap-3">
        <div className="min-w-0 flex-1 leading-none">
          <AnimatedNumber
            value={total}
            format={USD}
            trend={-1}
            className="text-[26px] font-semibold tracking-tight text-heading"
          />
          <span className="ml-1 text-[11px] text-tertiary">due</span>
        </div>

        <AnimatePresence mode="popLayout" initial={false}>
          {shownBill ? (
            <motion.div
              key={shownBill.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="flex shrink-0 items-center gap-2"
            >
              <div className="text-right leading-tight whitespace-nowrap">
                <div className="text-[12px] font-medium text-heading">{shownBill.name}</div>
                <div className="text-[11px] text-tertiary">
                  {justPaid ? "Paid just now" : `Due ${shownBill.weekday} · in ${shownBill.day}d`}
                </div>
              </div>
              <motion.div
                key={justPaid ? "paid" : "pay"}
                initial={justPaid ? { scale: 0.8 } : false}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 520, damping: 14 }}
              >
                <Button
                  size="small"
                  shape="round"
                  type="primary"
                  onClick={pay}
                  aria-pressed={!!justPaid}
                  icon={justPaid ? <Checkmark16Filled /> : undefined}
                  className={cn(
                    "font-semibold",
                    justPaid
                      ? "pointer-events-none border-0 bg-ios-green/15 text-ios-green shadow-none"
                      : "bg-ios-blue hover:bg-ios-blue/85",
                  )}
                >
                  {justPaid ? "Paid" : `Pay ${money(shownBill.amount)}`}
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="clear"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex shrink-0 items-center gap-1 rounded-full bg-ios-green/15 px-2.5 py-1 text-[12px] font-semibold text-ios-green"
            >
              <Checkmark16Filled /> All caught up
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* The band: bubbles above, track in the middle, dates below. */}
      <div className="relative mt-auto h-[60px]">
        <div className="absolute inset-x-0 top-[26px] h-1 rounded-full bg-fill-secondary" />
        <motion.div
          className="absolute top-[26px] h-1 rounded-full bg-gradient-to-r from-ios-red/30 to-ios-red"
          style={{ left: `${X(0)}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${X(due) - X(0)}%` }}
          transition={{ type: "spring", stiffness: 70, damping: 18, delay }}
        />
        {/* Today */}
        <div className="absolute top-[8px] flex -translate-x-1/2 flex-col items-center" style={{ left: `${X(0)}%` }}>
          <span className="mb-0.5 text-[9px] leading-[12px] font-semibold uppercase tracking-wide text-ios-red">Today</span>
          <span className="h-[12px] w-0.5 rounded-full bg-ios-red" />
        </div>

        {BILLS.map((b, i) => {
          const isPaid = paid.has(b.id);
          const isNext = next?.id === b.id;
          return (
            <Tooltip key={b.id} title={`${b.name} · ${b.payee} · ${money(b.amount)}`}>
              <motion.div
                className="absolute top-0 flex -translate-x-1/2 cursor-default flex-col items-center"
                style={{ left: `${X(b.day)}%` }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 22, delay: delay + 0.3 + i * 0.12 }}
              >
                <motion.span
                  className={cn(
                    "relative grid size-[22px] place-items-center rounded-full text-[12px] text-white",
                    isPaid && "bg-ios-green",
                  )}
                  style={isPaid ? undefined : { background: b.tint }}
                  animate={isPaid ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: "spring", stiffness: 500, damping: 14 }}
                >
                  {isNext ? (
                    <motion.span
                      className="absolute inset-0 rounded-full"
                      style={{ background: b.tint }}
                      animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                    />
                  ) : null}
                  <span className="relative grid place-items-center">
                    {isPaid ? <Checkmark16Filled className="text-[12px]" /> : <b.Glyph className="text-[12px]" />}
                  </span>
                </motion.span>
                <span className={cn("mt-0.5 size-2 rounded-full ring-2 ring-[var(--widget-surface)]", isPaid ? "bg-ios-green" : "bg-heading")} />
                <span className="mt-0.5 text-[10px] leading-tight font-medium whitespace-nowrap text-secondary tabular">{b.date}</span>
                <span
                  className={cn(
                    "text-[10px] leading-tight whitespace-nowrap tabular transition-colors duration-300",
                    isPaid ? "text-tertiary line-through" : "text-tertiary",
                  )}
                >
                  ${b.amount >= 1000 ? b.amount.toLocaleString("en-US") : Math.round(b.amount)}
                </span>
              </motion.div>
            </Tooltip>
          );
        })}
      </div>
    </Widget>
  );
}
