import {
  BuildingBank16Regular,
  Checkmark12Filled,
  Checkmark16Filled,
  Dismiss16Regular,
  Money16Regular,
  Payment16Regular,
  Receipt16Regular,
  Wallet20Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ComponentType, useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { daysBetween, shortDate, TODAY, USD_FMT, usd } from "./_parts-a";

type Kind = "deposit" | "installment" | "balance";
type LineState = "paid" | "partial" | "due" | "overdue" | "upcoming";
type Line = { key: string; label: string; short: string; kind: Kind; dueOn: string; amount: number; paid: number };
type Method = "cash" | "card" | "transfer" | "pos";

/* KY-26-0412: three guests on the Red Rock 3-day package, $3,050 on a
 * 30% deposit, three installments and the balance two weeks before departure. */
const LINES: Line[] = [
  { key: "dep", label: "Deposit", short: "Deposit", kind: "deposit", dueOn: "2026-10-02", amount: 915, paid: 915 },
  { key: "i1", label: "Installment 1", short: "Inst. 1", kind: "installment", dueOn: "2026-10-25", amount: 400, paid: 0 },
  { key: "i2", label: "Installment 2", short: "Inst. 2", kind: "installment", dueOn: "2026-11-09", amount: 400, paid: 150 },
  { key: "i3", label: "Installment 3", short: "Inst. 3", kind: "installment", dueOn: "2026-11-23", amount: 400, paid: 0 },
  { key: "bal", label: "Balance", short: "Balance", kind: "balance", dueOn: "2026-12-14", amount: 935, paid: 0 },
];
const TOTAL = LINES.reduce((s, l) => s + l.amount, 0);

const METHODS: { id: Method; label: string; Icon: ComponentType<{ className?: string }> }[] = [
  { id: "cash", label: "Cash", Icon: Money16Regular },
  { id: "card", label: "Card", Icon: Payment16Regular },
  { id: "transfer", label: "Transfer", Icon: BuildingBank16Regular },
  { id: "pos", label: "POS", Icon: Receipt16Regular },
];

function stateOf(l: Line): LineState {
  if (l.paid >= l.amount) return "paid";
  if (l.paid > 0) return "partial";
  const days = daysBetween(TODAY, l.dueOn);
  if (days < 0) return "overdue";
  return days <= 14 ? "due" : "upcoming";
}

const STATE_TEXT: Record<LineState, string> = {
  paid: "text-ios-green",
  partial: "text-ios-blue",
  due: "text-ios-orange",
  overdue: "text-ios-red",
  upcoming: "text-tertiary",
};

function Node({ line, state, pop }: { line: Line; state: LineState; pop: boolean }) {
  const frac = line.paid / line.amount;
  return (
    <motion.span
      className="relative grid size-5 place-items-center rounded-full"
      animate={pop ? { scale: [1, 1.35, 1] } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 520, damping: 14 }}
    >
      {pop ? (
        <motion.span
          className="absolute inset-0 rounded-full bg-ios-green"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      ) : null}
      {state === "due" ? (
        <motion.span
          className="absolute inset-0 rounded-full bg-ios-orange"
          animate={{ scale: [1, 1.7], opacity: [0.45, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
      ) : null}
      <span
        className={cn(
          "relative grid size-5 place-items-center rounded-full ring-2 ring-[var(--widget-surface)] transition-colors duration-300",
          state === "paid" && "bg-ios-green text-white",
          state === "overdue" && "bg-ios-red text-white",
          state === "upcoming" && "bg-widget-surface shadow-[inset_0_0_0_2px_var(--ant-color-fill)]",
          state === "due" && "bg-widget-surface shadow-[inset_0_0_0_2px_var(--ios-orange)]",
          state === "partial" && "shadow-[inset_0_0_0_2px_var(--ios-blue)]",
        )}
        style={
          state === "partial"
            ? { background: `conic-gradient(var(--ios-blue) ${frac * 360}deg, var(--widget-surface) 0)` }
            : undefined
        }
      >
        {state === "paid" ? <Checkmark12Filled className="size-3" /> : null}
        {state === "overdue" ? <span className="text-[11px] leading-none font-bold">!</span> : null}
        {state === "due" ? <span className="size-1.5 rounded-full bg-ios-orange" /> : null}
      </span>
    </motion.span>
  );
}

/** Tour guest · medium. A booking's payment plan on a stepper; Record payment picks a method and settles the next line. */
export function PaymentScheduleWidget({ index }: { index?: number }) {
  const [lines, setLines] = useState<Line[]>(LINES);
  const [picking, setPicking] = useState(false);
  const [flash, setFlash] = useState<{ key: string; method: Method } | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  const states = lines.map(stateOf);
  const paid = lines.reduce((s, l) => s + l.paid, 0);
  const nextIdx = states.findIndex((s) => s !== "paid");
  const next = nextIdx === -1 ? null : lines[nextIdx];
  const overdue = states.filter((s) => s === "overdue").length;
  const lastPaid = states.reduce((acc, s, i) => (s === "paid" && acc === i - 1 ? i : acc), -1);

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 1600);
    return () => window.clearTimeout(t);
  }, [flash]);

  const record = (method: Method) => {
    if (!next) return;
    const key = next.key;
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, paid: l.amount } : l)));
    setFlash({ key, method });
    setPicking(false);
  };

  const chip =
    nextIdx === -1
      ? { text: "Paid", cls: "bg-ios-green/15 text-ios-green" }
      : overdue
        ? { text: `${overdue} overdue`, cls: "bg-ios-red/15 text-ios-red" }
        : { text: "Partial", cls: "bg-ios-blue/15 text-ios-blue" };

  return (
    <Widget size="medium" index={index} label="Payment schedule">
      <WidgetHeader
        icon={<Wallet20Filled />}
        tint="var(--ios-green)"
        title="Payment Schedule"
        subtitle="KY-26-0412 · Red Rock 3-Day Package · 3 pax"
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={chip.text}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap", chip.cls)}
            >
              {chip.text}
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="mt-2.5 flex h-[34px] items-center gap-3">
        <div className="min-w-0 flex-1 truncate leading-none whitespace-nowrap">
          <AnimatedNumber
            value={paid}
            prefix="$"
            format={USD_FMT}
            className="text-[24px] font-semibold tracking-tight text-heading"
          />
          <span className="ml-1 text-[11px] text-tertiary tabular">of {usd(TOTAL)} paid</span>
        </div>
        <AnimatePresence mode="popLayout" initial={false}>
          {flash ? (
            <motion.span
              key="flash"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 520, damping: 22 }}
              className="flex shrink-0 items-center gap-1 rounded-full bg-ios-green/15 px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap text-ios-green"
            >
              <Checkmark16Filled /> Recorded · {METHODS.find((m) => m.id === flash.method)?.label}
            </motion.span>
          ) : next ? (
            <motion.div key="rec" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <Button
                size="small"
                shape="round"
                type="primary"
                aria-expanded={picking}
                onClick={() => setPicking((p) => !p)}
                className="bg-ios-green/15 font-semibold text-ios-green shadow-none hover:bg-ios-green/25"
              >
                Record payment
              </Button>
            </motion.div>
          ) : (
            <motion.button
              key="done"
              type="button"
              title="Start over"
              onClick={() => setLines(LINES)}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              whileTap={{ scale: 0.94 }}
              className="flex shrink-0 cursor-pointer items-center gap-1 rounded-full bg-ios-green/15 px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap text-ios-green"
            >
              <Checkmark16Filled /> Paid in full
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-fill-secondary">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-ios-green/60 to-ios-green"
          initial={{ width: 0 }}
          animate={{ width: `${(paid / TOTAL) * 100}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 18, delay: flash ? 0 : delay }}
        />
      </div>

      <div className="relative mt-auto h-[64px]">
        <AnimatePresence mode="wait" initial={false}>
          {picking && next ? (
            <motion.div
              key="picker"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="flex h-full flex-col"
            >
              <div className="flex items-center gap-2 text-[11px] text-tertiary">
                <span className="min-w-0 flex-1 truncate">
                  Record <span className="font-semibold text-heading tabular">{usd(next.amount - next.paid)}</span> ·{" "}
                  {next.label} · due {shortDate(next.dueOn)}
                </span>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setPicking(false)}
                  className="grid size-5 cursor-pointer place-items-center rounded-full text-tertiary hover:bg-fill-tertiary"
                >
                  <Dismiss16Regular className="size-3.5" />
                </button>
              </div>
              <div className="mt-auto grid grid-cols-4 gap-1.5">
                {METHODS.map((m, i) => (
                  <motion.button
                    key={m.id}
                    type="button"
                    onClick={() => record(m.id)}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 480, damping: 28, delay: i * 0.04 }}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.94 }}
                    className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-fill-tertiary text-[12px] font-semibold text-heading hover:bg-fill-secondary"
                  >
                    <m.Icon className="text-ios-green" />
                    {m.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="steps"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative grid h-full grid-cols-5"
            >
              {/* The rail runs node center to node center (10% to 90%). */}
              <span className="absolute top-[9px] left-[10%] h-0.5 w-[80%] rounded-full bg-fill-secondary" />
              <motion.span
                className="absolute top-[9px] left-[10%] h-0.5 rounded-full bg-ios-green"
                initial={{ width: 0 }}
                animate={{ width: `${(Math.max(lastPaid, 0) / (lines.length - 1)) * 80}%` }}
                transition={{ type: "spring", stiffness: 70, damping: 18, delay: flash ? 0 : delay + 0.2 }}
              />
              {lines.map((l, i) => {
                const st = states[i];
                return (
                  <Tooltip
                    key={l.key}
                    title={`${l.label} · ${usd(l.paid)} of ${usd(l.amount)} paid · due ${shortDate(l.dueOn)}`}
                  >
                    <motion.div
                      className="relative flex cursor-default flex-col items-center text-center leading-tight"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 380, damping: 24, delay: delay + 0.15 + i * 0.07 }}
                    >
                      <Node line={l} state={st} pop={flash?.key === l.key} />
                      <span className="mt-1 max-w-full truncate text-[11px] font-semibold text-heading">{l.short}</span>
                      <span className={cn("text-[10px] font-medium whitespace-nowrap tabular", STATE_TEXT[st])}>
                        {st === "paid" ? "Paid" : st === "overdue" ? `${shortDate(l.dueOn)} · late` : shortDate(l.dueOn)}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] whitespace-nowrap tabular",
                          st === "paid" ? "text-tertiary" : "text-secondary",
                        )}
                      >
                        {st === "partial" ? `${usd(l.amount - l.paid)} left` : usd(l.amount)}
                      </span>
                    </motion.div>
                  </Tooltip>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
