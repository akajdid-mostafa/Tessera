import { ArrowSwap16Regular, CurrencyDollarEuro20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/* Thirty days of the euro against the yen, from a fixed seed so every render draws the same line. */
function series(n: number) {
  let s = 11;
  const rnd = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648 - 0.5;
  };
  const out: number[] = [];
  let v = 169.2;
  for (let i = 0; i < n; i++) {
    v += 0.12 + rnd() * 1.1 + Math.sin(i / 4) * 0.25;
    out.push(Math.round(v * 100) / 100);
  }
  return out;
}
const SEED = series(30);
const W = 164;
const H = 36;
const TICK_MS = 4000;

function line(xs: number[]) {
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  return xs
    .map((v, i) => {
      const x = (i / (xs.length - 1)) * (W - 4) + 2;
      const y = H - 3 - ((v - lo) / (hi - lo || 1)) * (H - 6);
      return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

/** Travel · small. Euro to yen with a thirty-day line and a live rate tick; tap to swap the direction and the amount rolls into the other currency. */
export function CurrencyWidget({ index }: { index?: number }) {
  const [rates, setRates] = useState(SEED);
  const [flip, setFlip] = useState(false);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const rate = rates[rates.length - 1];
  const change = rate / rates[0] - 1;
  const d = line(rates);
  const end = d.split(" ").slice(-2);

  // Live: the last point of the line follows the market, a small move every few seconds.
  useEffect(() => {
    const t = window.setInterval(() => {
      setRates((xs) => {
        const last = xs[xs.length - 1];
        const next = Math.round((last + (Math.random() - 0.48) * 0.3) * 100) / 100;
        return [...xs.slice(0, -1), next];
      });
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, []);

  return (
    <Widget size="small" index={index} label="Currency exchange" pressable onPress={() => setFlip((f) => !f)}>
      <WidgetHeader
        icon={<CurrencyDollarEuro20Filled />}
        tint="var(--ios-indigo)"
        title="Exchange"
        subtitle={flip ? "JPY → EUR" : "EUR → JPY"}
        extra={
          <motion.span
            animate={{ rotate: flip ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="mt-1 grid size-6 place-items-center rounded-full bg-fill-tertiary text-secondary"
          >
            <ArrowSwap16Regular className="size-3.5" />
          </motion.span>
        }
      />

      <div className="mt-2.5 text-[11px] text-tertiary tabular">{flip ? "¥10,000 is" : "€100 is"}</div>
      <AnimatedNumber
        value={flip ? 10_000 / rate : 100 * rate}
        format={
          flip
            ? { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }
            : { style: "currency", currency: "JPY", maximumFractionDigits: 0 }
        }
        className="text-[26px] leading-none font-semibold tracking-tight text-heading"
      />

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-auto w-full overflow-visible">
        <motion.path
          d={d}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke="var(--ios-indigo)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay }}
        />
        <motion.circle
          cx={Number(end[0].slice(1))}
          cy={Number(end[1])}
          r="3"
          fill="var(--ios-indigo)"
          stroke="var(--widget-surface)"
          strokeWidth="1.5"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 18, delay: delay + 1 }}
        />
      </svg>
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-tertiary tabular">
        <span>30 days</span>
        <span>
          <span className={cn("font-semibold", change >= 0 ? "text-ios-green" : "text-ios-red")}>
            {change >= 0 ? "+" : "−"}
            {Math.abs(change * 100).toFixed(1)}%
          </span>{" "}
          · {rate.toFixed(2)}
        </span>
      </div>
    </Widget>
  );
}
