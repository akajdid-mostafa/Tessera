import {
  BuildingBank16Regular,
  ErrorCircle12Filled,
  Hourglass16Regular,
  Link16Regular,
  LockClosed12Regular,
  Money16Regular,
  Payment16Regular,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ComponentType, useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { tint } from "./_parts-a";

type Method = "cash" | "card" | "transfer" | "link";
const METHODS: Method[] = ["cash", "card", "transfer", "link"];
const METHOD: Record<Method, { label: string; color: string; Icon: ComponentType<{ className?: string }> }> = {
  cash: { label: "Cash", color: "var(--ios-green)", Icon: Money16Regular },
  card: { label: "Credit card", color: "var(--ios-blue)", Icon: Payment16Regular },
  transfer: { label: "Transfer", color: "var(--ios-indigo)", Icon: BuildingBank16Regular },
  link: { label: "Payment link", color: "var(--ios-teal)", Icon: Link16Regular },
};
/** Taken at the desk today, in USD, before the waiting links below come in. */
const TAKEN: Record<Method, number> = { cash: 845, card: 2790, transfer: 1200, link: 660 };

/** Credit card links sent to guests and still waiting, oldest first. */
const WAITING = [
  { guest: "Olivia Brown", face: "f3", ref: "R822100123", amount: 330 },
  { guest: "Marco Rossi", face: "m2", ref: "R822100187", amount: 585 },
  { guest: "Anna Schmidt", face: "f6", ref: "R822100204", amount: 248 },
];
const PAID_BEFORE = 4;
const FAILED = 1;
const AUTHS = [
  { card: "Visa ··4417", guest: "Olivia Brown", amount: 600 },
  { card: "Mastercard ··0932", guest: "Marco Rossi", amount: 360 },
];
const AUTH_TOTAL = AUTHS.reduce((s, a) => s + a.amount, 0);

const USD = { maximumFractionDigits: 0 } as const;

/** Front desk · medium. Today's payments by method as a stacked bar in USD with payment links and open authorizations; a waiting link turns paid live, tap a method to filter. */
export function PaymentsTodayWidget({ index }: { index?: number }) {
  const [k, setK] = useState(0);
  const [paid, setPaid] = useState(false);
  const [filter, setFilter] = useState<Method | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  // Live: the oldest waiting link is paid by the guest, then the next one moves up.
  useEffect(() => {
    if (k >= WAITING.length) return;
    const t = window.setTimeout(
      () => {
        if (paid) {
          setPaid(false);
          setK((n) => n + 1);
        } else setPaid(true);
      },
      paid ? 2600 : k === 0 ? 4200 + delay * 1000 : 5200,
    );
    return () => window.clearTimeout(t);
  }, [k, paid, delay]);

  const flipped = k + (paid ? 1 : 0);
  const totals: Record<Method, number> = {
    ...TAKEN,
    link: TAKEN.link + WAITING.slice(0, flipped).reduce((s, w) => s + w.amount, 0),
  };
  const all = METHODS.reduce((s, m) => s + totals[m], 0);
  const hero = filter ? totals[filter] : all;
  const waiting = WAITING.length - flipped;
  const current = WAITING[k];
  const toggle = (m: Method) => setFilter((f) => (f === m ? null : m));

  return (
    <Widget size="medium" index={index} label="Payments today">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-heading">
            <span className="truncate">Payments Today</span>
            <AnimatePresence mode="popLayout" initial={false}>
              {filter ? (
                <motion.span
                  key={filter}
                  className="flex h-4 items-center rounded px-1 text-[10px] font-semibold text-heading"
                  style={{ backgroundColor: tint(METHOD[filter].color, 22) }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  {METHOD[filter].label}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </div>
          <div className="mt-1 flex items-baseline gap-1 whitespace-nowrap">
            <AnimatedNumber
              value={hero}
              prefix="$"
              format={USD}
              className="text-[28px] leading-none font-semibold tracking-tight text-heading"
            />
            <span className="text-[11px] text-tertiary">USD</span>
          </div>
        </div>

        {/* The payment link being watched: waiting, then paid with a check. */}
        <div className="relative h-[44px] w-[176px] shrink-0">
          <AnimatePresence mode="popLayout" initial={false}>
            {current ? (
              <motion.div
                key={current.ref}
                className="absolute inset-0 flex items-center gap-2 overflow-hidden rounded-xl bg-fill-quaternary pr-2 pl-1.5 transition-colors duration-500"
                style={paid ? { backgroundColor: tint("var(--ios-green)", 14) } : undefined}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 380, damping: 28, delay: k === 0 ? delay : 0 }}
              >
                <MemojiAvatar who={current.face} size={28} />
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-[11px] text-tertiary">
                    <span className="text-secondary">{current.guest.replace(/ (\S)\S*$/, " $1.")}</span>
                  </div>
                  <div className="text-[13px] font-semibold text-heading tabular">
                    ${current.amount.toLocaleString("en-US")}
                    <span className="text-[10px] font-normal text-tertiary"> link</span>
                  </div>
                </div>
                <StatusPill paid={paid} />
              </motion.div>
            ) : (
              <motion.div
                key="done"
                className="absolute inset-0 flex items-center gap-2 rounded-xl px-2.5 text-[11px] font-medium text-ios-green"
                style={{ backgroundColor: tint("var(--ios-green)", 12) }}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <CheckDot />
                All payment links paid
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-2.5 flex h-2.5 gap-[2px] overflow-hidden rounded-full">
        {METHODS.map((m, i) => (
          <motion.button
            key={m}
            type="button"
            aria-label={`Filter by ${METHOD[m].label}`}
            onClick={() => toggle(m)}
            className="relative h-full min-w-[3px] basis-0 cursor-pointer overflow-hidden first:rounded-l-full last:rounded-r-full"
            style={{ backgroundColor: METHOD[m].color }}
            initial={{ flexGrow: 0.001 }}
            animate={{ flexGrow: totals[m], opacity: filter && filter !== m ? 0.22 : 1 }}
            transition={{
              flexGrow: { type: "spring", stiffness: 90, damping: 18, delay: k === 0 && !paid ? delay + i * 0.08 : 0 },
              opacity: { duration: 0.25 },
            }}
          >
            {m === "link" ? (
              <motion.span
                key={flipped}
                aria-hidden
                className="absolute inset-0 bg-white"
                initial={{ opacity: flipped ? 0.7 : 0 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.9 }}
              />
            ) : null}
          </motion.button>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {METHODS.map((m) => {
          const meta = METHOD[m];
          const on = filter === m;
          return (
            <motion.button
              key={m}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(m)}
              whileTap={{ scale: 0.94 }}
              className={cn(
                "min-w-0 cursor-pointer rounded-lg px-1.5 py-1 text-left leading-tight transition-[background-color,opacity] duration-300",
                on ? "bg-fill-secondary" : "bg-fill-quaternary hover:bg-fill-tertiary",
                filter && !on && "opacity-55",
              )}
              style={on ? { boxShadow: `inset 0 0 0 1px ${meta.color}` } : undefined}
            >
              <div className="flex items-center gap-1 text-[10px] text-tertiary">
                <span className="size-1.5 shrink-0 rounded-full" style={{ background: meta.color }} />
                <span className="truncate">{meta.label}</span>
              </div>
              <AnimatedNumber value={totals[m]} prefix="$" format={USD} className="text-[13px] font-semibold text-heading" />
            </motion.button>
          );
        })}
      </div>

      <div className="mt-auto flex items-center gap-2.5 text-[11px] whitespace-nowrap text-tertiary">
        <span className="flex items-center gap-1">
          <Hourglass16Regular className="size-3 text-ios-orange" />
          <AnimatedNumber value={waiting} className="font-semibold text-heading" /> waiting
        </span>
        <span className="flex items-center gap-1">
          <CheckDot small />
          <AnimatedNumber value={PAID_BEFORE + flipped} className="font-semibold text-heading" /> paid
        </span>
        <span className="flex items-center gap-1">
          <ErrorCircle12Filled className="size-3 text-ios-red" />
          <span className="font-semibold text-heading tabular">{FAILED}</span> failed
        </span>
        <Tooltip title={AUTHS.map((a) => `${a.card} · ${a.guest} · $${a.amount.toLocaleString("en-US")}`).join("  ·  ")}>
          <span className="ml-auto flex cursor-default items-center gap-1">
            <LockClosed12Regular className="size-3 text-ios-purple" />
            <span className="font-semibold text-heading tabular">{AUTHS.length}</span> open auths ·{" "}
            <span className="font-medium text-secondary tabular">${AUTH_TOTAL.toLocaleString("en-US")}</span>
          </span>
        </Tooltip>
      </div>
    </Widget>
  );
}

/** A small green disc with a check. */
function CheckDot({ small }: { small?: boolean }) {
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-full bg-ios-green", small ? "size-3" : "size-4")}>
      <svg viewBox="0 0 12 12" className={small ? "size-2" : "size-2.5"} aria-hidden>
        <path d="M2.5 6.2 5 8.6 9.6 3.6" fill="none" stroke="black" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/** Waiting (hourglass, orange) that turns Paid with a check drawn in. */
function StatusPill({ paid }: { paid: boolean }) {
  return (
    <motion.span
      layout
      className={cn(
        "flex h-5 shrink-0 items-center gap-1 rounded-full px-1.5 text-[10px] font-semibold transition-colors duration-300",
        paid ? "text-ios-green" : "text-ios-orange",
      )}
      style={{ backgroundColor: tint(paid ? "var(--ios-green)" : "var(--ios-orange)", 18) }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {paid ? (
          <motion.span
            key="paid"
            className="grid size-3 place-items-center rounded-full bg-ios-green"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 520, damping: 16 }}
          >
            <svg viewBox="0 0 12 12" className="size-2" aria-hidden>
              <motion.path
                d="M2.5 6.2 5 8.6 9.6 3.6"
                fill="none"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.35, delay: 0.12 }}
              />
            </svg>
          </motion.span>
        ) : (
          <motion.span
            key="waiting"
            animate={{ rotate: [0, 180, 180] }}
            transition={{ duration: 1.8, repeat: Infinity, times: [0, 0.4, 1], ease: "easeInOut" }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <Hourglass16Regular className="block size-3" />
          </motion.span>
        )}
      </AnimatePresence>
      {paid ? "Paid" : "Waiting"}
    </motion.span>
  );
}
