import { Building16Regular, BuildingMultiple20Filled, MoneyHand20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { entranceDelay, money, USD, USD_COMPACT } from "./_parts-b";

/* The agency contracts' ledger in the base currency (`b2bBalance` = receivable − payable). */
const RECEIVABLE = 14_280;
const PAYABLE = 16_125;

/** Ledger rows as they post, in turn; each column sums to zero over the loop, so the balance swings around zero and back. */
const POSTINGS = [
  { rec: 740, pay: 0 },
  { rec: 1_290, pay: 0 },
  { rec: 0, pay: 310 },
  { rec: 660, pay: 0 },
  { rec: 0, pay: -310 },
  { rec: -2_690, pay: 0 },
];

const TOP_AGENCY = { name: "Gulfways Travel", commissionBps: 1200 };

const PAYOUTS = [
  { agency: "Gulfways Travel", amount: 1_240 },
  { agency: "Desert Sky Travel", amount: 805 },
  { agency: "Northland Trails Co.", amount: 415 },
];
const PAYOUT_TOTAL = PAYOUTS.reduce((s, p) => s + p.amount, 0);

/** Tour sales · small. The B2B net balance rolls as agency postings land and turns red below zero, over a receivable/payable bar; tap to swap to the agencies' payout requests. */
export function B2bBalanceWidget({ index }: { index?: number }) {
  const delay = entranceDelay(index);
  const [back, setBack] = useState(false);
  const [rec, setRec] = useState(0);
  const [pay, setPay] = useState(0);
  const [delta, setDelta] = useState<{ v: number; at: number } | null>(null);
  const step = useRef(0);

  // Roll in from zero once the widget lands, then let the ledger post.
  useEffect(() => {
    let tick: number | undefined;
    const t = window.setTimeout(() => {
      setRec(RECEIVABLE);
      setPay(PAYABLE);
      tick = window.setInterval(() => {
        const p = POSTINGS[step.current % POSTINGS.length];
        step.current += 1;
        setRec((r) => r + p.rec);
        setPay((v) => v + p.pay);
        setDelta({ v: p.rec - p.pay, at: Date.now() });
      }, 4200);
    }, (delay + 0.25) * 1000);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(tick);
    };
  }, [delay]);

  const net = rec - pay;
  const share = rec + pay > 0 ? rec / (rec + pay) : 0.5;

  return (
    <Widget size="small" index={index} label="B2B balance" pressable onPress={() => setBack((b) => !b)}>
      <AnimatePresence mode="wait" initial={false}>
        {!back ? (
          <motion.div
            key="balance"
            className="flex h-full flex-col"
            initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -14, filter: "blur(4px)" }}
            transition={{ duration: 0.22 }}
          >
            <WidgetHeader
              icon={<BuildingMultiple20Filled />}
              tint="var(--ios-purple)"
              title="B2B balance"
              subtitle="Receivable − payable"
              extra={<Dots on={0} />}
            />

            <div className="relative mt-2 h-[30px]">
              <AnimatedNumber
                value={net}
                format={USD}
                className={cn(
                  "text-[24px] leading-none font-semibold tracking-tight transition-colors duration-mid",
                  net < 0 ? "text-ios-red" : "text-heading",
                )}
              />
              <AnimatePresence>
                {delta ? (
                  <motion.span
                    key={delta.at}
                    className={cn(
                      "absolute right-0 -top-1 text-[10px] font-semibold tabular",
                      delta.v >= 0 ? "text-ios-green" : "text-ios-red",
                    )}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: [0, 1, 1, 0], y: [6, 0, 0, -6] }}
                    transition={{ duration: 2.2, times: [0, 0.15, 0.75, 1] }}
                  >
                    {delta.v >= 0 ? "+" : ""}
                    {money(delta.v)}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="mt-1 flex h-[6px] gap-[2px] overflow-hidden rounded-full bg-fill-tertiary">
              <motion.span
                className="h-full rounded-l-full bg-ios-green"
                initial={{ width: "0%" }}
                animate={{ width: rec ? `${share * 100}%` : "0%" }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
              <motion.span
                className="h-full flex-1 rounded-r-full bg-ios-red"
                initial={{ opacity: 0 }}
                animate={{ opacity: pay ? 0.85 : 0 }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] whitespace-nowrap text-tertiary">
              <span>
                Receive <AnimatedNumber value={rec} format={USD_COMPACT} className="font-semibold text-ios-green" />
              </span>
              <span>
                Pay <AnimatedNumber value={pay} format={USD_COMPACT} className="font-semibold text-ios-red" />
              </span>
            </div>

            <div className="mt-auto flex items-center gap-1.5 text-[11px]">
              <span className="grid size-5 shrink-0 place-items-center rounded-md bg-ios-purple/15 text-[12px] text-ios-purple">
                <Building16Regular />
              </span>
              <span className="min-w-0 flex-1 truncate text-secondary">{TOP_AGENCY.name}</span>
              <span className="shrink-0 rounded-full bg-fill-tertiary px-1.5 text-[10px] font-semibold text-secondary tabular">
                {TOP_AGENCY.commissionBps / 100}% comm.
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="payouts"
            className="flex h-full flex-col"
            initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -14, filter: "blur(4px)" }}
            transition={{ duration: 0.22 }}
          >
            <WidgetHeader
              icon={<MoneyHand20Filled />}
              tint="var(--ios-orange)"
              title="Payout requests"
              subtitle="Agencies waiting on you"
              extra={<Dots on={1} />}
            />
            <PayoutCount />
            <ul className="m-0 mt-auto flex list-none flex-col p-0">
              {PAYOUTS.map((p, i) => (
                <motion.li
                  key={p.agency}
                  className={cn("flex h-[17px] items-center gap-2 text-[11px]", i < PAYOUTS.length - 1 && "border-b-[0.5px] border-split")}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.06, type: "spring", stiffness: 400, damping: 30 }}
                >
                  <span className="min-w-0 flex-1 truncate text-secondary">{p.agency}</span>
                  <span className="shrink-0 font-semibold text-heading tabular">{money(p.amount)}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </Widget>
  );
}

/** The count rolls up from zero each time the side shows. */
function PayoutCount() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setN(PAYOUTS.length), 120);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className="mt-2 flex items-baseline gap-1.5 whitespace-nowrap">
      <AnimatedNumber value={n} className="text-[28px] leading-none font-semibold tracking-tight text-heading" />
      <span className="text-[11px] text-tertiary">
        requested · <span className="font-semibold text-ios-orange tabular">{money(PAYOUT_TOTAL)}</span>
      </span>
    </div>
  );
}

function Dots({ on }: { on: number }) {
  return (
    <span className="flex shrink-0 items-center gap-[3px] pt-1" aria-hidden>
      {[0, 1].map((i) => (
        <span key={i} className={cn("size-[5px] rounded-full", i === on ? "bg-heading" : "bg-fill")} />
      ))}
    </span>
  );
}
