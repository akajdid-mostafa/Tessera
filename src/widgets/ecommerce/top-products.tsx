import {
  Backpack20Filled,
  DrinkCoffee20Filled,
  Glasses20Filled,
  Headphones20Filled,
  Keyboard20Filled,
  Lightbulb20Filled,
  Trophy20Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ComponentType, useEffect, useMemo, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";

type Period = "Today" | "Week" | "Month";
const PERIODS: Period[] = ["Today", "Week", "Month"];

type Product = {
  id: string;
  name: string;
  price: number;
  Glyph: ComponentType<{ className?: string }>;
  /** Tile gradient, decorative. */
  tile: string;
  units: Record<Period, number>;
};

const PRODUCTS: Product[] = [
  {
    id: "aura",
    name: "Aura ANC Headphones",
    price: 249,
    Glyph: Headphones20Filled,
    tile: "linear-gradient(140deg,#bf5af2,#5e5ce6)",
    units: { Today: 18, Week: 96, Month: 402 },
  },
  {
    id: "pour",
    name: "Pour-Over Coffee Kit",
    price: 64,
    Glyph: DrinkCoffee20Filled,
    tile: "linear-gradient(140deg,#ff9f0a,#c2410c)",
    units: { Today: 41, Week: 212, Month: 1650 },
  },
  {
    id: "arc",
    name: "Arc Desk Lamp",
    price: 129,
    Glyph: Lightbulb20Filled,
    tile: "linear-gradient(140deg,#ffd60a,#ff9f0a)",
    units: { Today: 22, Week: 118, Month: 395 },
  },
  {
    id: "trail",
    name: "Trailhead Pack 24L",
    price: 119,
    Glyph: Backpack20Filled,
    tile: "linear-gradient(140deg,#30d158,#00a39b)",
    units: { Today: 15, Week: 140, Month: 610 },
  },
  {
    id: "k2",
    name: "Low-Profile Keyboard",
    price: 159,
    Glyph: Keyboard20Filled,
    tile: "linear-gradient(140deg,#0a84ff,#5e5ce6)",
    units: { Today: 26, Week: 84, Month: 288 },
  },
  {
    id: "lens",
    name: "Blue-Light Glasses",
    price: 79,
    Glyph: Glasses20Filled,
    tile: "linear-gradient(140deg,#40c8e0,#0a84ff)",
    units: { Today: 12, Week: 103, Month: 820 },
  },
];

const STORE_TOTAL: Record<Period, number> = { Today: 21_480, Week: 118_240, Month: 512_900 };
const CHANGE: Record<Period, number> = { Today: 0.082, Week: 0.124, Month: -0.031 };
const VS: Record<Period, string> = { Today: "vs yesterday", Week: "vs last week", Month: "vs October" };

/** Eight believable points per product and period, from a seeded wobble. */
function spark(seed: number, period: Period) {
  const p = PERIODS.indexOf(period) + 1;
  return Array.from({ length: 8 }, (_, i) =>
    0.5 + Math.sin(i * 0.9 + seed * 1.7 + p) * 0.22 + Math.cos(i * 0.4 * p + seed) * 0.14 + (i / 7) * 0.12 * (seed % 2 ? 1 : -0.5),
  );
}
const W = 54;
const H = 20;
function sparkPath(points: number[]) {
  return points
    .map((v, i) => `${i === 0 ? "M" : "L"}${((i / (points.length - 1)) * W).toFixed(1)} ${(H - Math.min(1, Math.max(0, v)) * H).toFixed(1)}`)
    .join(" ");
}

const USD = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const;

/** E-commerce · large. Ranked best-sellers; switching the range re-ranks rows that slide into place. */
export function TopProductsWidget({ index }: { index?: number }) {
  const [period, setPeriod] = useState<Period>("Week");
  const delay = 0.3 + (index ?? 0) * 0.06;
  // Rows stagger in once; after that, re-ranks move without delay.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), 1600);
    return () => window.clearTimeout(t);
  }, []);

  const ranked = useMemo(
    () =>
      PRODUCTS.map((p, seed) => {
        const points = spark(seed, period);
        return {
          ...p,
          seed,
          sold: p.units[period],
          revenue: p.units[period] * p.price,
          points,
          up: points[points.length - 1] >= points[0],
        };
      })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
    [period],
  );
  const top5 = ranked.reduce((s, r) => s + r.revenue, 0);
  const change = CHANGE[period];

  return (
    <Widget size="large" index={index} label="Top products">
      <WidgetHeader
        icon={<Trophy20Filled />}
        tint="var(--ios-yellow)"
        title="Top Products"
        subtitle="Kinfolk Supply · by revenue"
        extra={
          <Segmented
            size="small"
            value={period}
            onChange={(v) => setPeriod(v as Period)}
            options={PERIODS}
          />
        }
      />

      <div className="mt-3 flex items-baseline-last justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[12px] text-tertiary">Top 5 revenue</div>
          <AnimatedNumber
            value={top5}
            format={USD}
            className="text-[30px] leading-none font-semibold tracking-tight text-heading"
          />
        </div>
        <div className="shrink-0 pb-0.5 text-right leading-tight">
          <span
            className={cn(
              "inline-flex rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
              change >= 0 ? "bg-ios-green/15 text-ios-green" : "bg-ios-red/15 text-ios-red",
            )}
          >
            <AnimatedNumber
              value={change}
              format={{ style: "percent", maximumFractionDigits: 1, signDisplay: "always" }}
            />
          </span>
          <div className="mt-0.5 text-[11px] text-tertiary tabular">
            {Math.round((top5 / STORE_TOTAL[period]) * 100)}% of sales · {VS[period]}
          </div>
        </div>
      </div>

      <ul className="mt-auto flex flex-col">
        <AnimatePresence mode="popLayout">
          {ranked.map((r, i) => (
            <motion.li
              key={r.id}
              layout
              initial={{ opacity: 0, x: 24, filter: "blur(4px)" }}
              animate={{
                opacity: 1,
                x: 0,
                filter: "blur(0px)",
                transition: { type: "spring", stiffness: 380, damping: 32, delay: entered ? 0 : delay + i * 0.06 },
              }}
              exit={{ opacity: 0, x: -24, filter: "blur(4px)", transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className={cn(
                "flex h-11 items-center gap-2.5",
                i > 0 && "border-t-[0.5px] border-split",
              )}
            >
              <span
                className={cn(
                  "w-3 shrink-0 text-center text-[13px] font-semibold tabular",
                  i === 0 ? "text-ios-yellow" : "text-tertiary",
                )}
              >
                {i + 1}
              </span>
              <motion.span
                className="grid size-8 shrink-0 place-items-center rounded-full text-[17px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                style={{ background: r.tile }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ rotate: -6, scale: 1.08 }}
                transition={{ type: "spring", stiffness: 420, damping: 18, delay: delay + r.seed * 0.05 }}
              >
                <r.Glyph />
              </motion.span>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[13px] font-medium text-heading">{r.name}</div>
                <div className="truncate text-[11px] text-tertiary">
                  <AnimatedNumber value={r.sold} className="text-secondary" /> sold · ${r.price}
                </div>
              </div>
              <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0 overflow-visible" aria-hidden>
                <motion.path d={sparkPath(r.points)}
                  fill="none"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, d: sparkPath(r.points), stroke: r.up ? "var(--ios-green)" : "var(--ios-red)" }}
                  animate={{
                    pathLength: 1,
                    d: sparkPath(r.points),
                    stroke: r.up ? "var(--ios-green)" : "var(--ios-red)",
                  }}
                  transition={{
                    pathLength: { duration: 0.9, delay: delay + 0.2 + r.seed * 0.06, ease: [0.22, 1, 0.36, 1] },
                    d: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                    stroke: { duration: 0.3 },
                  }}
                />
              </svg>
              <AnimatedNumber
                value={r.revenue}
                format={USD}
                className="w-[66px] shrink-0 text-right text-[13px] font-semibold text-heading"
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </Widget>
  );
}
