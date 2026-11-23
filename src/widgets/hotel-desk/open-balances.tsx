import { Checkmark16Filled, CheckmarkCircle16Filled, Clock16Regular, Money20Filled, Send16Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { USD, usd, useInterval, useTimeouts } from "./_parts-b";

type Link = "none" | "waiting" | "paid";
type Folio = {
  id: string;
  name: string;
  room: string;
  where: "In house" | "Departs today";
  amount: number;
  /** Sort key: the amount, held while a paid row rolls down to zero. */
  key: number;
  link: Link;
};

const START: Folio[] = [
  { id: "at", name: "Alicia Tate", room: "96", where: "In house", amount: 924, key: 924, link: "none" },
  { id: "ed", name: "Ellie Dawson", room: "8", where: "In house", amount: 648, key: 648, link: "none" },
  { id: "pu", name: "Paige Ellis", room: "13", where: "In house", amount: 392, key: 392, link: "none" },
  { id: "np", name: "Nina Petrova", room: "28", where: "Departs today", amount: 175, key: 175, link: "none" },
  { id: "ek", name: "Erin Cole", room: "12", where: "Departs today", amount: 114, key: 114, link: "none" },
  { id: "dm", name: "David Miller", room: "5", where: "In house", amount: 86, key: 86, link: "none" },
];

/** Charges the departments post through the day, in turn. */
const CHARGES = [
  { dept: "Minibar", amount: 34 },
  { dept: "Spa", amount: 120 },
  { dept: "F&B", amount: 58 },
  { dept: "Transfer", amount: 90 },
];

const sorted = (list: Folio[]) => [...list].sort((a, b) => b.key - a.key);

/** Front desk · medium. In-house and departing stays that owe money, largest first with red strips sized to the amount; Send payment link flips to waiting, then paid as the guest pays, and the total rolls down while new charges post live. */
export function OpenBalancesWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const later = useTimeouts();
  const [folios, setFolios] = useState(START);
  const [posted, setPosted] = useState<{ id: string; text: string; n: number } | null>(null);
  const [tick, setTick] = useState(0);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), (delay + 1.2) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  // A department posts a charge to an in-house folio every few seconds.
  useInterval(() => {
    const n = tick;
    const charge = CHARGES[n % CHARGES.length];
    const open = folios.filter((f) => f.link === "none" && f.where === "In house");
    const target = open[(n * 2 + 1) % Math.max(1, open.length)];
    setTick(n + 1);
    if (!target) return;
    setFolios((list) =>
      list.map((f) => (f.id === target.id ? { ...f, amount: f.amount + charge.amount, key: f.key + charge.amount } : f)),
    );
    setPosted({ id: target.id, text: `${charge.dept} ${usd(charge.amount)} posted · ${target.room}`, n });
  }, 7000);

  // When every folio is settled, the next evening's balances come back.
  useEffect(() => {
    if (folios.length) return;
    const t = window.setTimeout(() => setFolios(START), 6000);
    return () => window.clearTimeout(t);
  }, [folios.length]);

  const send = (id: string, i: number) => {
    setFolios((list) => list.map((f) => (f.id === id ? { ...f, link: "waiting" } : f)));
    later(() => setFolios((list) => list.map((f) => (f.id === id ? { ...f, link: "paid", amount: 0 } : f))), 2600 + i * 500);
    later(() => setFolios((list) => list.filter((f) => f.id !== id)), 4200 + i * 500);
  };

  const list = sorted(folios);
  const total = folios.reduce((s, f) => s + f.amount, 0);
  const max = Math.max(1, ...folios.map((f) => f.key));
  const waiting = folios.filter((f) => f.link === "waiting").length;
  const flashFor = posted?.id ?? null;

  return (
    <Widget size="medium" index={index} label="Open balances">
      <WidgetHeader
        icon={<Money20Filled />}
        tint="var(--ios-red)"
        title="Open balances"
        subtitle="In house & departing · USD"
        extra={
          <div className="text-right leading-tight">
            <div className="text-[10px] text-tertiary">Total due</div>
            <AnimatedNumber value={total} format={USD} className="text-[17px] font-semibold tracking-tight text-heading" />
          </div>
        }
      />

      <div className="relative mt-1.5 flex min-h-0 flex-1 flex-col">
        <AnimatePresence mode="popLayout" initial={false}>
          {list.slice(0, 3).map((f, i) => (
            <motion.div
              key={f.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 40, filter: "blur(4px)", transition: { duration: 0.3 } }}
              transition={{ type: "spring", stiffness: 360, damping: 30, delay: entered ? 0 : delay + i * 0.07 }}
              className="flex h-[34px] shrink-0 items-center gap-2 border-split [&:not(:first-child)]:border-t-[0.5px]"
            >
              <MemojiAvatar who={f.name} size={24} />
              <div className="w-[108px] min-w-0 leading-tight">
                <div className="truncate text-[12px] font-semibold text-heading">{f.name}</div>
                <div className={cn("truncate text-[10.5px] tabular", f.where === "Departs today" ? "text-ios-orange" : "text-tertiary")}>
                  <span className="font-medium text-secondary">{f.room}</span> · {f.where}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-1">
                  <AnimatedNumber
                    value={f.amount}
                    format={USD}
                    className={cn("text-[12.5px] font-semibold", f.link === "paid" ? "text-ios-green" : "text-heading")}
                  />
                  <AnimatePresence>
                    {flashFor === f.id && posted ? (
                      <motion.span
                        key={posted.n}
                        className="truncate text-[9.5px] font-semibold text-ios-red"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: [0, 1, 1, 0], y: 0 }}
                        transition={{ duration: 2.2, times: [0, 0.15, 0.75, 1] }}
                      >
                        +{usd(CHARGES[posted.n % CHARGES.length].amount)}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>
                <div className="mt-0.5 h-[4px] overflow-hidden rounded-full bg-fill-tertiary">
                  <motion.div
                    className="h-full rounded-full bg-ios-red"
                    initial={{ width: 0 }}
                    animate={{ width: `${(f.amount / max) * 100}%` }}
                    transition={{ type: "spring", stiffness: 110, damping: 20, delay: entered ? 0 : delay + 0.2 + i * 0.07 }}
                  />
                </div>
              </div>
              <LinkButton state={f.link} name={f.name} onSend={() => send(f.id, i)} />
            </motion.div>
          ))}
        </AnimatePresence>
        {folios.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="m-auto flex items-center gap-1.5 text-[12px] font-semibold text-heading"
          >
            <CheckmarkCircle16Filled className="text-ios-green" />
            Every folio is settled
          </motion.div>
        ) : null}
      </div>

      <div className="mt-auto flex h-[16px] items-center gap-1.5 text-[11px] whitespace-nowrap text-tertiary">
        <span className="tabular">
          <AnimatedNumber value={folios.length} /> stays
          {waiting ? (
            <span className="text-ios-orange">
              {" "}
              · <AnimatedNumber value={waiting} /> waiting
            </span>
          ) : null}
        </span>
        <div className="relative ml-auto h-[16px] min-w-0 flex-1">
          <AnimatePresence mode="popLayout" initial={false}>
            {posted ? (
              <motion.span
                key={posted.n}
                className="absolute inset-0 truncate text-right"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                {posted.text}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </Widget>
  );
}

function LinkButton({ state, name, onSend }: { state: Link; name: string; onSend: () => void }) {
  const face =
    state === "paid"
      ? { icon: <Checkmark16Filled />, label: "Paid" }
      : state === "waiting"
        ? { icon: <Clock16Regular />, label: "Waiting" }
        : { icon: <Send16Regular />, label: "Send link" };
  return (
    <Button
      size="small"
      shape="round"
      aria-label={state === "none" ? `Send payment link to ${name}` : `${face.label}, ${name}`}
      onClick={state === "none" ? onSend : undefined}
      {...(state === "paid"
        ? { color: "green" as const, variant: "filled" as const, className: "w-[84px] font-semibold" }
        : state === "waiting"
          ? { color: "orange" as const, variant: "filled" as const, className: "w-[84px] font-semibold" }
          : { color: "default" as const, variant: "filled" as const, className: "w-[84px]" })}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={state}
          className="flex items-center gap-1 text-[11.5px]"
          initial={{ rotateX: 90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: -90, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
        >
          {state === "waiting" ? (
            <motion.span className="flex" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
              {face.icon}
            </motion.span>
          ) : (
            face.icon
          )}
          {face.label}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
