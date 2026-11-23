import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Quote = {
  ticker: string;
  name: string;
  open: number;
  /** Intraday closes, oldest first; the last one is the live price. */
  points: number[];
  /** Bumps on every tick, so the pill can flash. */
  tick: number;
};

const LENGTH = 28;

/** A seeded intraday walk from `open` to `last`. */
function day(open: number, last: number, seed: number) {
  return Array.from({ length: LENGTH }, (_, i) => {
    const t = i / (LENGTH - 1);
    const wobble = Math.sin(i * 0.8 + seed) * 0.004 + Math.cos(i * 0.31 + seed * 2) * 0.003;
    return open + (last - open) * t + open * wobble * Math.sin(t * Math.PI);
  });
}

const SEED: Quote[] = [
  { ticker: "AAPL", name: "Apple Inc.", open: 229.1, points: day(229.1, 231.58, 1), tick: 0 },
  { ticker: "NVDA", name: "NVIDIA Corp.", open: 186.02, points: day(186.02, 182.36, 2), tick: 0 },
  { ticker: "MSFT", name: "Microsoft Corp.", open: 509.75, points: day(509.75, 512.4, 3), tick: 0 },
];

const SW = 92;
const SH = 26;
function line(points: number[], open: number) {
  const lo = Math.min(open, ...points);
  const hi = Math.max(open, ...points);
  const y = (v: number) => SH - ((v - lo) / (hi - lo || 1)) * SH;
  return {
    d: points.map((v, i) => `${i ? "L" : "M"}${((i / (LENGTH - 1)) * SW).toFixed(1)} ${y(v).toFixed(1)}`).join(" "),
    base: y(open),
  };
}

/** Finance · medium. Stocks-style rows tick live; the change pill flashes on every move; tap a row to focus it. */
export function WatchlistWidget({ index }: { index?: number }) {
  const [quotes, setQuotes] = useState(SEED);
  const [focus, setFocus] = useState(0);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      const which = Math.floor(Math.random() * SEED.length);
      setQuotes((qs) =>
        qs.map((q, i) => {
          if (i !== which) return q;
          const last = q.points[q.points.length - 1];
          // A small random step, at most ±0.2%.
          const next = +(last * (1 + (Math.random() - 0.5) * 0.004)).toFixed(2);
          return { ...q, points: [...q.points.slice(1), next], tick: q.tick + 1 };
        }),
      );
    }, 1600);
    return () => window.clearInterval(t);
  }, []);

  return (
    <Widget size="medium" index={index} label="Stock watchlist">
      <div className="flex items-center justify-between text-[13px] leading-none">
        <span className="font-semibold text-heading">Watchlist</span>
        <span className="flex items-center gap-1.5 text-[11px] text-tertiary">
          <span className="relative flex size-1.5">
            <motion.span
              className="absolute inset-0 rounded-full bg-ios-green"
              animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            />
            <span className="relative size-1.5 rounded-full bg-ios-green" />
          </span>
          Market open · Nov 9
        </span>
      </div>

      <ul className="mt-auto flex flex-col">
        {quotes.map((q, i) => {
          const price = q.points[q.points.length - 1];
          const change = (price - q.open) / q.open;
          const up = change >= 0;
          const color = up ? "var(--ios-green)" : "var(--ios-red)";
          const { d, base } = line(q.points, q.open);
          const focused = i === focus;
          return (
            <li key={q.ticker} className={cn(i > 0 && "border-t-[0.5px] border-split")}>
              <button
                type="button"
                onClick={() => setFocus(i)}
                aria-pressed={focused}
                className="relative -mx-2 flex h-[44px] w-[calc(100%+1rem)] cursor-pointer items-center gap-2.5 rounded-[8px] px-2 text-left outline-none"
              >
                {focused ? (
                  <motion.span
                    layoutId={`wl-focus-${index ?? 0}`}
                    className="absolute inset-x-0 inset-y-0.5 rounded-[8px] bg-fill-tertiary"
                    transition={{ type: "spring", stiffness: 480, damping: 36 }}
                  />
                ) : null}
                <div className="relative w-[92px] shrink-0 leading-tight">
                  <div className="text-[14px] font-semibold text-heading">{q.ticker}</div>
                  <div className="truncate text-[11px] text-tertiary">{q.name}</div>
                </div>

                <svg viewBox={`0 0 ${SW} ${SH}`} className="relative h-[26px] min-w-0 flex-1 overflow-visible" preserveAspectRatio="none" aria-hidden>
                  <line x1="0" x2={SW} y1={base} y2={base} strokeDasharray="1.5 2.5" strokeWidth="1" className="stroke-fill" vectorEffect="non-scaling-stroke" />
                  <motion.path
                    fill="none"
                    stroke={color}
                    strokeWidth={focused ? 2 : 1.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    d={d}
                    initial={{ opacity: 0, d }}
                    animate={{ opacity: 1, d }}
                    transition={{
                      opacity: { duration: 1.1, delay: delay + i * 0.12, ease: [0.22, 1, 0.36, 1] },
                      d: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                    }}
                  />
                </svg>

                <AnimatedNumber
                  value={price}
                  format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                  className="relative w-[62px] shrink-0 text-right text-[14px] font-semibold text-heading"
                />
                <span
                  className="relative grid h-[22px] w-[62px] shrink-0 place-items-center overflow-hidden rounded-md text-[12px] font-semibold text-white transition-colors duration-500"
                  style={{ background: color }}
                >
                  <motion.span
                    key={q.tick}
                    aria-hidden
                    className="absolute inset-0 bg-white"
                    initial={{ opacity: q.tick ? 0.5 : 0 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                  <AnimatedNumber
                    value={change}
                    format={{ style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: "always" }}
                    className="relative"
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Widget>
  );
}
