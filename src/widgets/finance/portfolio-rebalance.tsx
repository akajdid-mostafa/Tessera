import { ArrowUp12Filled, Checkmark16Filled, DataPie20Filled, Scales20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

type Asset = { id: string; name: string; short: string; color: string; actual: number; target: number };

/** Shares in %, each set summing to 100. */
const ASSETS: Asset[] = [
  { id: "us", name: "US stocks", short: "US", color: "var(--ios-blue)", actual: 51.2, target: 45 },
  { id: "intl", name: "Intl stocks", short: "Intl", color: "var(--ios-teal)", actual: 18.1, target: 20 },
  { id: "bond", name: "Bonds", short: "Bonds", color: "var(--ios-purple)", actual: 21.0, target: 25 },
  { id: "re", name: "Real estate", short: "REITs", color: "var(--ios-orange)", actual: 4.6, target: 5 },
  { id: "cash", name: "Cash", short: "Cash", color: "var(--ios-mint)", actual: 5.1, target: 5 },
];
const START = 248_312.4;
const BAND = 5;

type Phase = "drifted" | "review" | "done";

const SIZE = 156;
const R = 68;
const STROKE = 16;
const C = 2 * Math.PI * R;
const GAP = 3;

const k = (n: number) => `$${(n / 1000).toFixed(1)}K`;
const USD = { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

/** Finance · large. Allocation donut with drift against target per asset; review and confirm trades to rebalance. */
export function PortfolioRebalanceWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [phase, setPhase] = useState<Phase>("drifted");
  const [focus, setFocus] = useState<string | null>(null);
  const [value, setValue] = useState(START);
  const [dayChange, setDayChange] = useState(1_204.18);

  // The account value drifts with the market.
  useEffect(() => {
    const t = window.setInterval(() => {
      const step = Math.round((Math.random() - 0.42) * 16_000) / 100;
      setValue((v) => +(v + step).toFixed(2));
      setDayChange((d) => +(d + step).toFixed(2));
    }, 2600);
    return () => window.clearInterval(t);
  }, []);

  const balanced = phase === "done";
  const share = (a: Asset) => (balanced ? a.target : a.actual);
  const drift = (a: Asset) => (balanced ? 0 : a.actual - a.target);
  const maxDrift = Math.max(...ASSETS.map((a) => Math.abs(drift(a))));
  const over = maxDrift > BAND;

  const trades = ASSETS.filter((a) => Math.abs(a.actual - a.target) >= 0.3).map((a) => ({
    ...a,
    amount: ((a.target - a.actual) / 100) * value,
  }));
  const sells = trades.filter((t) => t.amount < 0);
  const buys = trades.filter((t) => t.amount > 0);

  let acc = 0;
  const arcs = ASSETS.map((a) => {
    const s = share(a);
    const start = acc;
    acc += s;
    return { a, start, len: s };
  });

  const focused = ASSETS.find((a) => a.id === focus) ?? null;

  return (
    <Widget size="large" index={index} label="Portfolio rebalance">
      <WidgetHeader
        icon={<DataPie20Filled />}
        tint="var(--ios-indigo)"
        title="Retirement"
        subtitle="Roth IRA •••• 2207"
        extra={
          <motion.span
            key={balanced ? "ok" : "drift"}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap tabular",
              balanced ? "bg-ios-green/15 text-ios-green" : over ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-tertiary text-secondary",
            )}
          >
            {balanced ? "On target" : `Drift ${maxDrift.toFixed(1)}%`}
          </motion.span>
        }
      />

      <div className="mt-3 leading-none">
        <AnimatedNumber value={value} format={USD} className="text-[30px] font-semibold tracking-tight text-heading" />
        <div className="mt-1 flex items-center gap-1 text-[12px] text-tertiary">
          <span className={cn("inline-flex items-center font-semibold tabular", dayChange >= 0 ? "text-ios-green" : "text-ios-red")}>
            <motion.span animate={{ rotate: dayChange >= 0 ? 0 : 180 }} className="grid place-items-center">
              <ArrowUp12Filled />
            </motion.span>
            <AnimatedNumber value={Math.abs(dayChange)} format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} />
          </span>
          today
        </div>
      </div>

      <div className="mt-3 flex min-h-0 flex-1 items-center gap-3">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }} onMouseLeave={() => setFocus(null)}>
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full -rotate-90" aria-hidden>
            {arcs.map(({ a, start, len }, i) => {
              const dash = `${Math.max(0, (len / 100) * C - GAP)} ${C}`;
              return (
                <motion.circle
                  key={a.id}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={R}
                  fill="none"
                  stroke={a.color}
                  strokeWidth={STROKE}
                  className="cursor-pointer"
                  onMouseEnter={() => setFocus(a.id)}
                  initial={{ strokeDasharray: `0 ${C}`, strokeDashoffset: -(start / 100) * C }}
                  animate={{
                    strokeDasharray: dash,
                    strokeDashoffset: -(start / 100) * C,
                    opacity: focus && focus !== a.id ? 0.3 : 1,
                  }}
                  transition={{
                    strokeDasharray: { type: "spring", stiffness: 70, damping: 16, delay: phase === "drifted" ? delay + i * 0.08 : 0 },
                    strokeDashoffset: { type: "spring", stiffness: 70, damping: 16 },
                    opacity: { duration: 0.2 },
                  }}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={focused?.id ?? "all"}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.18 }}
                className="leading-tight whitespace-nowrap"
              >
                {focused ? (
                  <>
                    <div className="text-[11px] text-tertiary">{focused.name}</div>
                    <div className="text-[22px] font-semibold tracking-tight text-heading tabular">{share(focused).toFixed(1)}%</div>
                    <div className="text-[11px] text-tertiary tabular">target {focused.target}%</div>
                  </>
                ) : (
                  <>
                    <div className="text-[11px] text-tertiary">Stocks / bonds</div>
                    <div className="text-[22px] font-semibold tracking-tight text-heading tabular">
                      {Math.round(share(ASSETS[0]) + share(ASSETS[1]))}/{Math.round(100 - share(ASSETS[0]) - share(ASSETS[1]))}
                    </div>
                    <div className="text-[11px] text-tertiary">target 65/35</div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <ul className="flex min-w-0 flex-1 flex-col" onMouseLeave={() => setFocus(null)}>
          {ASSETS.map((a, i) => {
            const d = drift(a);
            const big = Math.abs(d) > BAND;
            const mid = Math.abs(d) >= 2;
            return (
              <li
                key={a.id}
                onMouseEnter={() => setFocus(a.id)}
                className={cn(
                  "flex h-[30px] cursor-default items-center gap-2 px-1.5 transition-colors",
                  i > 0 && "border-t-[0.5px] border-split",
                  focus === a.id && "bg-fill-quaternary",
                )}
              >
                <span className="size-2 shrink-0 rounded-full" style={{ background: a.color }} />
                <span className="min-w-0 flex-1 truncate text-[12px] text-secondary">{a.name}</span>
                <AnimatedNumber
                  value={share(a)}
                  format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                  suffix="%"
                  className="w-[42px] text-right text-[12px] font-semibold text-heading"
                />
                <span
                  className={cn(
                    "grid h-[18px] w-[44px] shrink-0 place-items-center rounded-md text-[11px] font-semibold transition-colors duration-500",
                    big ? "bg-ios-orange/15 text-ios-orange" : mid ? "bg-ios-yellow/15 text-ios-yellow" : "bg-fill-tertiary text-tertiary",
                  )}
                >
                  <AnimatedNumber
                    value={d}
                    format={{ minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: "exceptZero" }}
                  />
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-3 flex h-[44px] items-center gap-3 rounded-2xl bg-fill-quaternary px-3">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={phase}
            className="min-w-0 flex-1 leading-tight"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            {phase === "drifted" ? (
              <>
                <div className="truncate text-[12px] font-semibold text-heading">US stocks over the 5% band</div>
                <div className="truncate text-[11px] text-tertiary">{trades.length} trades bring it back · no tax in an IRA</div>
              </>
            ) : phase === "review" ? (
              <>
                <div className="truncate text-[12px] font-semibold text-heading tabular">
                  Sell {sells.map((t) => `${k(-t.amount)} ${t.name}`).join(", ")}
                </div>
                <div className="truncate text-[11px] text-tertiary tabular">
                  Buy {buys.map((t) => `${k(t.amount)} ${t.short}`).join(", ")}
                </div>
              </>
            ) : (
              <>
                <div className="truncate text-[12px] font-semibold text-ios-green">Rebalanced to target</div>
                <div className="truncate text-[11px] text-tertiary">Orders fill at today's close</div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
        {phase === "done" ? (
          <Button size="small" shape="round" type="text" onClick={() => setPhase("drifted")} className="shrink-0 font-medium">
            Reset
          </Button>
        ) : (
          <Button
            size="small"
            shape="round"
            type="primary"
            icon={phase === "review" ? <Checkmark16Filled /> : <Scales20Filled />}
            onClick={() => setPhase(phase === "drifted" ? "review" : "done")}
            className={cn("shrink-0 font-semibold", phase === "review" ? "bg-ios-green/15 text-ios-green hover:bg-ios-green/25" : "bg-ios-indigo hover:bg-ios-indigo/85")}
          >
            {phase === "review" ? "Confirm" : "Rebalance"}
          </Button>
        )}
      </div>
    </Widget>
  );
}
