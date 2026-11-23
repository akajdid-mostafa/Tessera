import { DataFunnel20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const STEPS = [
  { label: "Visitors", short: "Visitors", count: 84_320 },
  { label: "Product views", short: "Viewed", count: 51_460 },
  { label: "Added to cart", short: "Cart", count: 12_870 },
  { label: "Reached checkout", short: "Checkout", count: 6_240 },
  { label: "Paid orders", short: "Paid", count: 2_712 },
] as const;
const TOP = STEPS[0].count;
const LAST = STEPS.length - 1;

/** E-commerce · medium. Funnel bars fill step by step; hover a step to read its count up top. */
export function ConversionFunnelWidget({ index }: { index?: number }) {
  const [active, setActive] = useState<number>(LAST);
  // Only a hovered step dims the others; at rest every bar is at full strength.
  const [hovered, setHovered] = useState<number | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const step = STEPS[active];
  const ofTop = step.count / TOP;
  const ofPrev = active === 0 ? 1 : step.count / STEPS[active - 1].count;

  return (
    <Widget size="medium" index={index} label="Conversion funnel">
      <WidgetHeader
        icon={<DataFunnel20Filled />}
        tint="var(--ios-indigo)"
        title="Conversion Funnel"
        subtitle="Last 7 days · Web + App"
      />

      <div className="mt-2.5 flex min-h-0 flex-1 gap-3">
        <div className="flex w-[100px] shrink-0 flex-col whitespace-nowrap">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(3px)" }}
              transition={{ duration: 0.2 }}
              className="truncate text-[11px] font-medium text-ios-indigo"
            >
              {step.label}
            </motion.div>
          </AnimatePresence>
          <AnimatedNumber
            value={step.count}
            className="mt-0.5 text-[26px] leading-none font-semibold tracking-tight text-heading"
          />
          <div className="mt-auto text-[11px] leading-tight text-tertiary">
            <AnimatedNumber
              value={ofTop}
              format={{ style: "percent", maximumFractionDigits: 1, minimumFractionDigits: 1 }}
              className="font-semibold text-secondary"
            />{" "}
            of visitors
          </div>
          <div className="text-[11px] leading-tight text-tertiary">
            <AnimatedNumber
              value={ofPrev}
              format={{ style: "percent", maximumFractionDigits: 0 }}
              className="font-semibold text-secondary"
            />{" "}
            {active === 0 ? "baseline" : "step rate"}
          </div>
        </div>

        <ul className="flex min-w-0 flex-1 flex-col justify-between" onMouseLeave={() => {
            setActive(LAST);
            setHovered(null);
          }}>
          {STEPS.map((s, i) => {
            const width = Math.max(0.035, s.count / TOP);
            const drop = i === 0 ? 0 : 1 - s.count / STEPS[i - 1].count;
            const on = i === active;
            return (
              <li
                key={s.label}
                onMouseEnter={() => {
                  setActive(i);
                  setHovered(i);
                }}
                onFocus={() => {
                  setActive(i);
                  setHovered(i);
                }}
                onBlur={() => setHovered(null)}
                tabIndex={0}
                className="flex h-[15px] cursor-default items-center gap-1.5 outline-none"
              >
                <span
                  className={cn(
                    "w-[50px] shrink-0 truncate text-[10px] transition-colors duration-200",
                    on ? "font-semibold text-heading" : "text-tertiary",
                  )}
                >
                  {s.short}
                </span>
                <span className="relative h-full flex-1 overflow-hidden rounded-[5px] bg-fill-quaternary">
                  <motion.span
                    className="absolute inset-y-0 left-0 origin-left rounded-[5px] bg-ios-indigo"
                    style={{ width: `${width * 100}%` }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1, opacity: hovered === null || hovered === i ? 1 : 0.38 }}
                    transition={{
                      scaleX: { type: "spring", stiffness: 140, damping: 20, delay: delay + i * 0.16 },
                      opacity: { duration: 0.2 },
                    }}
                  />
                </span>
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + i * 0.16 + 0.2 }}
                  className={cn(
                    "w-[30px] shrink-0 text-right text-[10px] font-medium tabular",
                    i === 0 ? "text-tertiary" : on ? "text-ios-red" : "text-tertiary",
                  )}
                >
                  {i === 0 ? "100%" : `−${Math.round(drop * 100)}%`}
                </motion.span>
              </li>
            );
          })}
        </ul>
      </div>
    </Widget>
  );
}
