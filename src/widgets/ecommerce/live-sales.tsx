import { Cart20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const SEED = [32, 18, 12, 24, 46, 61, 52, 74, 68, 88, 71, 40];
const ORDER_EVERY_MS = 3400;

/** E-commerce · small. Orders arrive live: digits roll, the hour's bar grows, a glow breathes. */
export function LiveSalesWidget({ index }: { index?: number }) {
  const [revenue, setRevenue] = useState(12_480);
  const [orders, setOrders] = useState(142);
  const [bars, setBars] = useState(SEED);
  const [last, setLast] = useState<{ id: number; amount: number } | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => {
      const amount = Math.round(38 + Math.random() * 220);
      setRevenue((r) => r + amount);
      setOrders((o) => o + 1);
      setBars((b) => b.map((v, i) => (i === b.length - 1 ? Math.min(100, v + 6) : v)));
      setLast({ id: Date.now(), amount });
    }, ORDER_EVERY_MS);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!last) return;
    const t = window.setTimeout(() => setLast(null), 1600);
    return () => window.clearTimeout(t);
  }, [last]);

  const max = Math.max(...bars);

  return (
    <Widget
      size="small"
      index={index}
      label="Live sales"
      glow={{ mode: "pulse", colors: ["oklch(0.5 0.3 264.43)", "oklch(0.65 0.22 270)", "oklch(0.5 0.3 264.43)"], blur: 18, duration: 1.6 }}
      glowActive={!!last}
      // A solid primary card in both themes; everything on it is white.
      surfaceClassName="bg-[oklch(0.5_0.3_264.43)] ring-white/10"
    >
      <div className="flex items-start gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/20 text-[15px] text-white">
          <Cart20Filled />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[13px] font-semibold text-white">Store</div>
          <div className="truncate text-[11px] text-white/70">Today</div>
        </div>
      </div>

      <AnimatePresence>
        {last ? (
          <motion.span
            key={last.id}
            initial={{ opacity: 0, y: 6, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
            className="absolute right-3 top-3.5 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[oklch(0.5_0.3_264.43)] tabular"
          >
            +${last.amount}
          </motion.span>
        ) : null}
      </AnimatePresence>

      <div className="mt-3">
        <AnimatedNumber
          value={revenue}
          format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
          className="text-[28px] leading-none font-semibold tracking-tight text-white"
        />
        <div className="mt-1 text-[12px] text-white/70">
          <AnimatedNumber value={orders} className="font-medium text-white/90" /> orders
        </div>
      </div>

      <div className="mt-auto flex h-11 items-end gap-[3px]">
        {bars.map((v, i) => {
          const current = i === bars.length - 1;
          return (
            <motion.span
              key={i}
              className={cn(
                "flex-1 rounded-full",
                current ? "bg-white" : "bg-white/25",
              )}
              initial={{ height: 4 }}
              animate={{ height: `${Math.max(10, (v / max) * 100)}%` }}
              transition={{
                type: "spring",
                stiffness: 220,
                damping: 18,
                delay: 0.3 + (index ?? 0) * 0.06 + i * 0.025,
              }}
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[9px] text-white/60 tabular">
        <span>9 AM</span>
        <span>NOW</span>
      </div>
    </Widget>
  );
}
