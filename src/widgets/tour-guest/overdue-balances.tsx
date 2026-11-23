import { Alert16Regular, AlertUrgent20Filled, Checkmark16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { daysBetween, shortDate, TODAY, USD_FMT, usd } from "./_parts-a";

type Row = {
  reference: string;
  lead: string;
  memoji: string;
  product: string;
  /** Which flag the booking's PaymentSummary raised. */
  flag: "depositOverdue" | "balanceOverdue";
  balance: number;
  dueOn: string;
  channel: string;
  /** This guest pays a few seconds after the reminder lands. */
  paysAfterReminder?: boolean;
};

const ROWS: Row[] = [
  { reference: "KY-26-0377", lead: "Lauren Adler", memoji: "f4", product: "Red Rock 3-Day Package · 2 pax", flag: "balanceOverdue", balance: 1690, dueOn: "2026-10-23", channel: "WhatsApp" },
  { reference: "KY-26-0405", lead: "Marcus Cole", memoji: "m6", product: "Red Rock 3-Day Package · 3 pax", flag: "balanceOverdue", balance: 2135, dueOn: "2026-10-31", channel: "SMS" },
  { reference: "KY-26-0431", lead: "Ella Yates", memoji: "f7", product: "Sedona – Oak Creek Day Tour · 4 pax", flag: "depositOverdue", balance: 360, dueOn: "2026-11-05", channel: "Email", paysAfterReminder: true },
];

/** Tour guest · medium. Bookings with an overdue deposit or balance; Send reminder rings the bell, stamps the row and the overdue total rolls. */
export function OverdueBalancesWidget({ index }: { index?: number }) {
  const [reminded, setReminded] = useState<Record<string, boolean>>({});
  const [ringing, setRinging] = useState<string | null>(null);
  const [settled, setSettled] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);
  const delay = 0.3 + (index ?? 0) * 0.06;

  /* The total rolls up from zero once the widget has landed. */
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), (delay + 0.25) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!ringing) return;
    const t = window.setTimeout(() => setRinging(null), 900);
    return () => window.clearTimeout(t);
  }, [ringing]);

  /* A reminded guest who pays: the row settles and the total rolls down. */
  useEffect(() => {
    const payer = ROWS.find((r) => r.paysAfterReminder && reminded[r.reference] && !settled[r.reference]);
    if (!payer) return;
    const ref = payer.reference;
    const t = window.setTimeout(() => setSettled((s) => ({ ...s, [ref]: true })), 3200);
    return () => window.clearTimeout(t);
  }, [reminded, settled]);

  const open = ROWS.filter((r) => !settled[r.reference]);
  const total = open.reduce((s, r) => s + r.balance, 0);
  const remindedCount = Object.values(reminded).filter(Boolean).length;

  const remind = (ref: string) => {
    if (reminded[ref]) return;
    setRinging(ref);
    setReminded((m) => ({ ...m, [ref]: true }));
  };

  return (
    <Widget size="medium" index={index} label="Overdue balances">
      <WidgetHeader
        icon={<AlertUrgent20Filled />}
        tint="var(--ios-red)"
        title="Overdue Balances"
        subtitle={`${open.length} booking${open.length === 1 ? "" : "s"} · ${remindedCount ? `${remindedCount} reminded` : "none reminded yet"}`}
        extra={
          <div className="text-right leading-tight">
            <div className="text-[10px] text-tertiary">Overdue</div>
            <AnimatedNumber
              value={ready ? total : 0}
              prefix="$"
              format={USD_FMT}
              className="text-[15px] font-semibold text-ios-red"
            />
          </div>
        }
      />

      {/* Header ~32 (two-line extra with rolling digits) + 6 + 3 × 34 + 2 × 10 = 160 of 164. */}
      <div className="mt-1.5 flex min-h-0 flex-1 flex-col gap-2.5">
        {ROWS.map((r, i) => {
          const late = daysBetween(r.dueOn, TODAY);
          const isReminded = !!reminded[r.reference];
          const isSettled = !!settled[r.reference];
          const deposit = r.flag === "depositOverdue";
          return (
            <motion.div
              key={r.reference}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30, delay: delay + i * 0.07 }}
              className="relative flex h-[34px] shrink-0 items-center gap-2.5 not-first:before:absolute not-first:before:inset-x-0 not-first:before:-top-[5px] not-first:before:h-[0.5px] not-first:before:bg-split"
            >
              <MemojiAvatar who={r.memoji} size={26} />
              <div className="relative min-w-0 flex-1 leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12.5px] font-semibold text-heading tabular">{r.reference}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[10px] leading-[15px] font-semibold",
                      deposit ? "bg-ios-orange/15 text-ios-orange" : "bg-ios-red/15 text-ios-red",
                    )}
                  >
                    {deposit ? "Deposit" : "Balance"}
                  </span>
                </div>
                <div className="truncate text-[11px] text-tertiary">
                  {r.lead} · {r.product}
                </div>
                <AnimatePresence>
                  {isReminded ? (
                    <motion.span
                      key="stamp"
                      initial={{ opacity: 0, scale: 2.2, rotate: -22 }}
                      animate={{ opacity: 1, scale: 1, rotate: -9 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 600, damping: 18, delay: 0.25 }}
                      className={cn(
                        "pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 rounded-[5px] border-2 bg-widget-surface/90 px-1.5 text-[10px] leading-[14px] font-bold tracking-wider uppercase",
                        isSettled ? "border-ios-green text-ios-green" : "border-ios-blue text-ios-blue",
                      )}
                    >
                      {isSettled ? "Paid" : "Reminded"}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </div>
              <Tooltip title={`Due ${shortDate(r.dueOn)} · ${deposit ? "deposit" : "balance"} via ${r.channel}`}>
                <div className={cn("w-[62px] shrink-0 text-right leading-tight transition-opacity duration-500", isSettled && "opacity-50")}>
                  <div
                    className={cn(
                      "text-[12.5px] font-semibold whitespace-nowrap text-heading tabular",
                      isSettled && "line-through",
                    )}
                  >
                    {usd(r.balance)}
                  </div>
                  <div
                    className={cn(
                      "text-[11px] font-semibold whitespace-nowrap tabular",
                      isSettled ? "text-ios-green" : late >= 14 ? "text-ios-red" : "text-ios-orange",
                    )}
                  >
                    {isSettled ? "Settled" : `${late} d late`}
                  </div>
                </div>
              </Tooltip>
              <Tooltip title={isReminded ? `Reminder sent by ${r.channel}` : `Send ${r.channel} reminder`}>
                <Button
                  size="small"
                  shape="circle"
                  aria-label={isReminded ? `Reminder sent to ${r.lead}` : `Send reminder to ${r.lead}`}
                  aria-pressed={isReminded}
                  onClick={() => remind(r.reference)}
                  {...(isReminded
                    ? { type: "primary" as const, className: "bg-ios-blue/15 text-ios-blue shadow-none hover:bg-ios-blue/20" }
                    : { color: "default" as const, variant: "filled" as const })}
                  icon={
                    <motion.span
                      className="grid origin-top"
                      animate={ringing === r.reference ? { rotate: [0, -24, 20, -16, 12, -6, 0] } : { rotate: 0 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    >
                      {isReminded && ringing !== r.reference ? <Checkmark16Filled /> : <Alert16Regular />}
                    </motion.span>
                  }
                />
              </Tooltip>
            </motion.div>
          );
        })}
      </div>
    </Widget>
  );
}
