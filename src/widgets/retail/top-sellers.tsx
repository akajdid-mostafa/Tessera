import { Checkmark16Filled, Trophy20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Item = {
  id: string;
  name: string;
  sku: string;
  price: number;
  /** Product photo. */
  image: string;
  /** Fallback behind the photo while it loads, decorative. */
  swatch: string;
  units: number;
  /** Same product, last Monday, by 14:40. */
  lw: number;
  onHand: number;
  /** Units per hour since 09:00; the last point is the live hour. */
  spark: number[];
};

/** Unsplash product shots (free license), served from their CDN at thumbnail size. */
const photo = (id: string) => `https://images.unsplash.com/photo-${id}?w=84&h=84&fit=crop&auto=format&q=70`;

const START: Item[] = [
  { id: "tee", name: "Graphic Tee", sku: "40211", price: 24, image: photo("1576566588028-4147f3842f27"), swatch: "linear-gradient(135deg,#f4efe6,#d9cfbf)", units: 212, lw: 188, onHand: 140, spark: [12, 20, 26, 31, 38, 44, 41] },
  { id: "shirt", name: "Chambray Overshirt", sku: "40876", price: 49, image: photo("1596755094514-f87e34085b2c"), swatch: "linear-gradient(135deg,#c9d6c2,#8fa588)", units: 168, lw: 142, onHand: 96, spark: [8, 14, 19, 27, 33, 36, 31] },
  { id: "tote", name: "Canvas Tote", sku: "51002", price: 18, image: photo("1544816155-12df9643f363"), swatch: "linear-gradient(135deg,#e8d8b4,#c2a56e)", units: 151, lw: 166, onHand: 13, spark: [11, 18, 22, 25, 27, 26, 22] },
  { id: "jean", name: "Dark Wash Jean", sku: "40533", price: 59, image: photo("1624378439575-d8705ad7ae80"), swatch: "linear-gradient(135deg,#4a4f63,#262a38)", units: 124, lw: 131, onHand: 64, spark: [6, 11, 15, 22, 24, 25, 21] },
  { id: "crew", name: "Crew Sweatshirt", sku: "40190", price: 54, image: photo("1620799140408-edc6dcb6d633"), swatch: "linear-gradient(135deg,#eceff2,#c9ced6)", units: 97, lw: 74, onHand: 52, spark: [4, 7, 12, 16, 19, 21, 18] },
  { id: "sneaker", name: "Everyday Sneaker", sku: "61420", price: 79, image: photo("1600185365483-26d7a4cc7519"), swatch: "linear-gradient(135deg,#ffffff,#d6d9de)", units: 88, lw: 92, onHand: 38, spark: [5, 8, 10, 15, 16, 18, 16] },
];
/** Weighted pick so the tote, already low, keeps selling through. */
const WEIGHTS = [0.24, 0.2, 0.2, 0.14, 0.12, 0.1];
const LOW = 15;
const SW = 56;
const SH = 22;

const sparkPath = (pts: number[]) => {
  const max = Math.max(...pts, 1);
  return pts
    .map((v, i) => `${i ? "L" : "M"}${((i / (pts.length - 1)) * (SW - 4) + 2).toFixed(1)} ${(SH - 2 - (v / max) * (SH - 4)).toFixed(1)}`)
    .join(" ");
};

const pick = () => {
  let r = Math.random();
  for (let i = 0; i < WEIGHTS.length; i++) {
    r -= WEIGHTS[i];
    if (r <= 0) return i;
  }
  return 0;
};

type Mode = "Units" | "Sales";

/** Retail · large. Today's best sellers re-ranking live with hourly sparklines and a change pill vs last Monday; the tote runs low and a tap sends a restock request to the stockroom. */
export function TopSellersWidget({ index }: { index?: number }) {
  const [items, setItems] = useState(START);
  const [mode, setMode] = useState<Mode>("Units");
  const [restock, setRestock] = useState<string[]>([]);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      const k = pick();
      const n = 1 + Math.floor(Math.random() * 2);
      setItems((xs) =>
        xs.map((x, i) =>
          i === k
            ? {
                ...x,
                units: x.units + Math.min(n, x.onHand),
                onHand: Math.max(0, x.onHand - n),
                spark: x.spark.map((v, j) => (j === x.spark.length - 1 ? v + Math.min(n, x.onHand) : v)),
              }
            : x,
        ),
      );
    }, 2400);
    return () => window.clearInterval(t);
  }, []);

  const val = (x: Item) => (mode === "Units" ? x.units : x.units * x.price);
  const ranked = [...items].sort((a, b) => val(b) - val(a));
  const total = items.reduce((s, x) => s + val(x), 0);
  const lwTotal = items.reduce((s, x) => s + (mode === "Units" ? x.lw : x.lw * x.price), 0);
  const change = (total - lwTotal) / lwTotal;
  const money = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const;

  return (
    <Widget size="large" index={index} label="Best sellers">
      <WidgetHeader
        icon={<Trophy20Filled />}
        tint="var(--ios-orange)"
        title="Best Sellers"
        subtitle="Top 6 today · Market St"
        extra={
          <Segmented
            size="small"
            value={mode}
            onChange={(v) => setMode(v as Mode)}
            options={["Units", "Sales"]}
            className="text-[11px]"
          />
        }
      />

      <div className="mt-2.5 flex items-baseline-last gap-2 whitespace-nowrap">
        <div className="leading-none">
          <AnimatedNumber
            value={total}
            format={mode === "Units" ? undefined : money}
            className="text-[28px] font-semibold tracking-tight text-heading"
          />
          {mode === "Units" ? <span className="ml-1 text-[12px] font-medium text-tertiary">units</span> : null}
        </div>
        <span
          className={cn(
            "mb-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
            change >= 0 ? "bg-ios-green/15 text-ios-green" : "bg-ios-red/15 text-ios-red",
          )}
        >
          <AnimatedNumber value={change} format={{ style: "percent", maximumFractionDigits: 1, signDisplay: "always" }} />
        </span>
        <span className="mb-0.5 ml-auto text-[11px] text-tertiary">vs last Mon · 14:40</span>
      </div>

      <div className="mt-2.5 flex min-h-0 flex-1 flex-col">
        {ranked.map((x, rank) => {
          const up = x.units >= x.lw;
          const pct = (x.units - x.lw) / x.lw;
          const low = x.onHand <= LOW;
          const sent = restock.includes(x.id);
          const cover = x.onHand / Math.max(1, x.spark[x.spark.length - 1]);
          return (
            <motion.div
              key={x.id}
              layout="position"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                layout: { type: "spring", stiffness: 380, damping: 32 },
                default: { type: "spring", stiffness: 380, damping: 30, delay: delay + rank * 0.05 },
              }}
              className={cn(
                "-mx-1.5 flex h-[46px] shrink-0 items-center gap-2 px-1.5",
                rank > 0 && "border-t-[0.5px] border-split",
                low && !sent && "cursor-pointer transition-colors hover:bg-fill-quaternary",
              )}
              onClick={() => {
                if (low && !sent) setRestock((r) => [...r, x.id]);
              }}
            >
              <span className="w-3 shrink-0 text-center text-[12px] font-semibold text-tertiary tabular">{rank + 1}</span>
              <span className="relative size-7 shrink-0 overflow-hidden rounded-[8px]" style={{ background: x.swatch }}>
                <img src={x.image} alt="" draggable={false} loading="lazy" className="size-full object-cover" />
                <span aria-hidden className="absolute inset-0 rounded-[8px] ring-1 ring-black/10 ring-inset" />
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[13px] font-semibold text-heading">{x.name}</div>
                <div className="flex h-[15px] items-center text-[11px] whitespace-nowrap">
                  <AnimatePresence mode="wait" initial={false}>
                    {sent ? (
                      <motion.span
                        key="sent"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-0.5 font-medium text-ios-blue"
                      >
                        <Checkmark16Filled className="size-3" /> Restock sent · 15 min
                      </motion.span>
                    ) : low ? (
                      <motion.span key="low" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-ios-orange">
                        <span className="font-semibold">
                          {x.onHand === 0 ? "Sold out" : <>Low · <AnimatedNumber value={x.onHand} /> left</>}
                        </span>
                        <span className="text-tertiary"> · tap to restock</span>
                      </motion.span>
                    ) : (
                      <motion.span key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-tertiary">
                        SKU {x.sku} · <AnimatedNumber value={x.onHand} /> on hand
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <Tooltip title={`${x.spark[x.spark.length - 1]} sold this hour · ${cover.toFixed(1)} h of cover`}>
                <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} className="shrink-0 overflow-visible">
                  <motion.path
                    d={sparkPath(x.spark)}
                    initial={{ d: sparkPath(x.spark), pathLength: 0 }}
                    animate={{ d: sparkPath(x.spark), pathLength: 1 }}
                    transition={{ pathLength: { duration: 0.9, delay: delay + 0.2 + rank * 0.05 }, d: { duration: 0.5 } }}
                    fill="none"
                    stroke={up ? "var(--ios-green)" : "var(--ios-red)"}
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Tooltip>
              <div className="flex w-[66px] shrink-0 flex-col items-end gap-0.5">
                <AnimatedNumber
                  value={val(x)}
                  format={mode === "Units" ? undefined : money}
                  className="text-[13.5px] leading-none font-semibold text-heading"
                />
                <span
                  className={cn(
                    "rounded-[5px] px-1 py-px text-[10.5px] font-semibold",
                    up ? "bg-ios-green/15 text-ios-green" : "bg-ios-red/15 text-ios-red",
                  )}
                >
                  <AnimatedNumber value={pct} format={{ style: "percent", maximumFractionDigits: 0, signDisplay: "always" }} />
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Widget>
  );
}
