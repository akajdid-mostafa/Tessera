import { ArrowSwap16Regular, ArrowSwap20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber, type AnimatedNumberProps } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";

const CUR = {
  USD: { sign: "$", bg: "bg-ios-blue" },
  EUR: { sign: "€", bg: "bg-ios-indigo" },
} as const;
type Cur = keyof typeof CUR;

const AMOUNTS = { "500": 500, "1K": 1000, "5K": 5000 } as const;
type AmountKey = keyof typeof AMOUNTS;
const FEE = 0.0042;
/** Seconds a quoted rate is held before it refreshes. */
const LOCK = 20;
const POINTS = 24;

/** The last 24 hourly USD→EUR mid-market rates, oldest first. */
const SEED = Array.from({ length: POINTS }, (_, i) => +(0.8604 + Math.sin(i * 0.55) * 0.0011 + i * 0.00007).toFixed(4));

const SW = 84;
const SH = 22;
function spark(vals: number[]) {
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  return vals
    .map((v, i) => `${i ? "L" : "M"}${((i / (vals.length - 1)) * SW).toFixed(1)} ${(SH - ((v - lo) / (hi - lo || 1)) * SH).toFixed(1)}`)
    .join(" ");
}

const R = 6;
const C = 2 * Math.PI * R;

/** Finance · medium. A currency transfer quote; the rate is held for 20 s then refreshes, swap flips the direction. */
export function FxTransferWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [amountKey, setAmountKey] = useState<AmountKey>("1K");
  const [from, setFrom] = useState<Cur>("USD");
  const [turns, setTurns] = useState(0);
  const [rates, setRates] = useState(SEED);
  const [left, setLeft] = useState(LOCK);

  useEffect(() => {
    const t = window.setInterval(() => setLeft((s) => (s <= 1 ? LOCK : s - 1)), 1000);
    return () => window.clearInterval(t);
  }, []);
  // When the hold runs out, a fresh quote lands (not on the first render).
  const first = useRef(true);
  useEffect(() => {
    if (left !== LOCK) return;
    if (first.current) {
      first.current = false;
      return;
    }
    const step = (Math.random() - 0.45) * 0.0012;
    setRates((rs) => [...rs.slice(1), +(rs[rs.length - 1] + step).toFixed(4)]);
  }, [left]);

  const to: Cur = from === "USD" ? "EUR" : "USD";
  const usdEur = rates[rates.length - 1];
  const rate = from === "USD" ? usdEur : 1 / usdEur;
  const series = from === "USD" ? rates : rates.map((r) => 1 / r);
  const change = (series[series.length - 1] - series[0]) / series[0];
  const up = change >= 0;

  const amount = AMOUNTS[amountKey];
  const fee = amount * FEE;
  const receive = (amount - fee) * rate;
  const d = spark(series);

  const money = (c: Cur) => ({ style: "currency", currency: c, minimumFractionDigits: 2, maximumFractionDigits: 2 }) as const;

  const swap = () => {
    setFrom(to);
    setTurns((n) => n + 1);
  };

  return (
    <Widget size="medium" index={index} label="Currency transfer">
      <WidgetHeader
        icon={<ArrowSwap20Filled />}
        tint="var(--ios-teal)"
        title="Send Money"
        subtitle="Mid-market rate · no markup"
        extra={
          <Segmented
            size="small"
            value={amountKey}
            onChange={(v) => setAmountKey(v as AmountKey)}
            options={Object.keys(AMOUNTS)}
          />
        }
      />

      <div className="mt-3 flex items-center gap-2">
        <Side label="You send" cur={from} value={amount} format={money(from)} delay={delay} />
        <motion.button
          type="button"
          onClick={swap}
          aria-label={`Send ${to} instead`}
          className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full bg-fill-secondary text-[16px] text-heading"
          animate={{ rotate: turns * 180 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
        >
          <ArrowSwap16Regular />
        </motion.button>
        <Side label="They get" cur={to} value={receive} format={money(to)} delay={delay + 0.1} right />
      </div>

      <div className="mt-auto flex items-center gap-2">
        <span className="relative size-4 shrink-0" title="Rate hold">
          <svg viewBox="0 0 16 16" className="size-full -rotate-90" aria-hidden>
            <circle cx="8" cy="8" r={R} fill="none" strokeWidth="2.5" className="stroke-fill-secondary" />
            <motion.circle
              cx="8"
              cy="8"
              r={R}
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              stroke="var(--ios-teal)"
              strokeDasharray={C}
              initial={false}
              animate={{ strokeDashoffset: C * (1 - left / LOCK) }}
              transition={left === LOCK ? { duration: 0.3 } : { duration: 1, ease: "linear" }}
            />
          </svg>
        </span>
        <div className="whitespace-nowrap text-[12px] text-secondary tabular">
          1 {from} ={" "}
          <AnimatedNumber
            value={rate}
            format={{ minimumFractionDigits: 4, maximumFractionDigits: 4 }}
            className="font-semibold text-heading"
          />{" "}
          {to}
        </div>
        <svg viewBox={`0 0 ${SW} ${SH}`} className="h-[22px] min-w-0 flex-1" preserveAspectRatio="none" aria-hidden>
          <motion.path
            d={d}
            initial={{ d, opacity: 0 }}
            animate={{ d, opacity: 1 }}
            transition={{ d: { duration: 0.5 }, opacity: { duration: 0.8, delay: delay + 0.3 } }}
            fill="none"
            stroke={up ? "var(--ios-green)" : "var(--ios-red)"}
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <span
          className={cn(
            "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
            up ? "bg-ios-green/15 text-ios-green" : "bg-ios-red/15 text-ios-red",
          )}
        >
          <AnimatedNumber
            value={change}
            format={{ style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: "always" }}
          />
        </span>
      </div>
      <div className="mt-1.5 flex justify-between whitespace-nowrap text-[11px] text-tertiary tabular">
        <span>
          Fee{" "}
          <AnimatedNumber value={fee} format={money(from)} className="font-medium text-secondary" /> · arrives today
        </span>
        <span>Rate held {left}s</span>
      </div>
    </Widget>
  );
}

function Side({
  label,
  cur,
  value,
  format,
  delay,
  right,
}: {
  label: string;
  cur: Cur;
  value: number;
  format: AnimatedNumberProps["format"];
  delay: number;
  right?: boolean;
}) {
  return (
    <motion.div
      className={cn("min-w-0 flex-1 leading-none", right && "text-right")}
      initial={{ opacity: 0, x: right ? 10 : -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26, delay }}
    >
      <div className="text-[11px] text-tertiary">{label}</div>
      <div className={cn("mt-1.5 flex items-center gap-1.5", right && "flex-row-reverse")}>
        <motion.span
          key={cur}
          className={cn("grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white", CUR[cur].bg)}
          initial={{ scale: 0.4, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
        >
          {CUR[cur].sign}
        </motion.span>
        <AnimatedNumber
          value={value}
          format={format}
          className="truncate text-[22px] font-semibold tracking-tight text-heading"
        />
      </div>
    </motion.div>
  );
}
