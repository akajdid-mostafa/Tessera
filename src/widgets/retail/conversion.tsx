import { ShoppingBag20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Day = { label: string; passby: number; entered: number; bought: number; atv: number; upt: number };
const PAGES: Day[] = [
  { label: "Today · live", passby: 8_420, entered: 1_846, bought: 432, atv: 46.2, upt: 2.8 },
  { label: "Yesterday · Sun", passby: 11_240, entered: 2_610, bought: 548, atv: 52.9, upt: 3.1 },
  { label: "Last Monday", passby: 7_980, entered: 1_702, bought: 369, atv: 44.6, upt: 2.7 },
];
/** Last Monday's conversion, the baseline for the change pill. */
const BASE = PAGES[2].bought / PAGES[2].entered;
const STEPS = [
  { key: "passby", label: "Passed by", bar: "bg-fill" },
  { key: "entered", label: "Came in", bar: "bg-ios-purple/55" },
  { key: "bought", label: "Bought", bar: "bg-ios-purple" },
] as const;

/** Retail · small. Store conversion with the pass-by, entry and purchase funnel ticking live; tap to compare yesterday and last Monday. */
export function ConversionWidget({ index }: { index?: number }) {
  const [page, setPage] = useState(0);
  const [paged, setPaged] = useState(false);
  const [today, setToday] = useState(PAGES[0]);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      setToday((d) => {
        const came = Math.random() < 0.7 ? 1 + Math.floor(Math.random() * 2) : 0;
        return {
          ...d,
          passby: d.passby + 4 + Math.floor(Math.random() * 5),
          entered: d.entered + came,
          bought: d.bought + (Math.random() < 0.3 ? 1 : 0),
        };
      });
    }, 3000);
    return () => window.clearInterval(t);
  }, []);

  const d = page === 0 ? today : PAGES[page];
  const conv = d.bought / d.entered;
  const change = (conv - BASE) * 100;

  return (
    <Widget
      size="small"
      index={index}
      label="Store conversion"
      pressable
      onPress={() => {
        setPage((n) => (n + 1) % PAGES.length);
        setPaged(true);
      }}
    >
      <WidgetHeader
        icon={<ShoppingBag20Filled />}
        tint="var(--ios-purple)"
        title="Conversion"
        subtitle={d.label}
        extra={
          <div className="flex gap-1 pt-1" aria-hidden>
            {PAGES.map((x, i) => (
              <span
                key={x.label}
                className={cn("h-[5px] rounded-full transition-all duration-300", i === page ? "w-3 bg-ios-purple" : "w-[5px] bg-fill")}
              />
            ))}
          </div>
        }
      />

      <div className="mt-0.5 flex items-baseline-last gap-1.5 whitespace-nowrap">
        <AnimatedNumber
          value={conv}
          format={{ style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }}
          className="text-[28px] leading-none font-semibold tracking-tight text-heading"
        />
        {page < 2 ? (
          <span
            className={cn(
              "mb-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              change >= 0 ? "bg-ios-green/15 text-ios-green" : "bg-ios-red/15 text-ios-red",
            )}
          >
            <AnimatedNumber value={change} format={{ maximumFractionDigits: 1, minimumFractionDigits: 1, signDisplay: "always" }} suffix=" pts" />
          </span>
        ) : null}
      </div>
      <div className="mt-1 text-[11px] leading-[14px] whitespace-nowrap text-tertiary">
        Basket{" "}
        <AnimatedNumber
          value={d.atv}
          format={{ style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }}
          className="font-medium text-secondary"
        />{" "}
        · <AnimatedNumber value={d.upt} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} className="font-medium text-secondary" />{" "}
        items
      </div>

      <div className="mt-auto flex flex-col gap-1.5">
        {STEPS.map((s, i) => {
          const v = d[s.key];
          const share = v / d.passby;
          return (
            <div key={s.key}>
              <div className="flex justify-between text-[10px] leading-[12px] text-tertiary">
                <span>{s.label}</span>
                <span className="font-medium text-secondary tabular">
                  <AnimatedNumber value={v} />
                </span>
              </div>
              <div className="mt-px h-1 rounded-full bg-fill-quaternary">
                <motion.div
                  className={cn("h-full rounded-full", s.bar)}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.sqrt(share) * 100}%` }}
                  transition={{ type: "spring", stiffness: 90, damping: 18, delay: paged ? 0 : delay + i * 0.1 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Widget>
  );
}
