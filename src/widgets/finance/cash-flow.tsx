import { DataBarVertical20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/** Money in and out of checking by month; November is month to date. */
const MONTHS = [
  { m: "Jun", name: "June", inflow: 6_420, outflow: 5_310 },
  { m: "Jul", name: "July", inflow: 6_420, outflow: 7_060 },
  { m: "Aug", name: "August", inflow: 6_420, outflow: 5_480 },
  { m: "Sep", name: "September", inflow: 7_180, outflow: 5_620 },
  { m: "Oct", name: "October", inflow: 6_420, outflow: 5_136 },
  { m: "Nov", name: "Nov to date", inflow: 3_210, outflow: 1_890 },
];
const SCALE = 7_200;
/** Height of each half of the chart, in px. */
const HALF = 44;
const USD = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const;

/** Finance · medium. Income up, spending down for six months; hover previews a month, tap pins it. */
export function CashFlowWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [pinned, setPinned] = useState(4);
  const [hover, setHover] = useState<number | null>(null);
  const sel = hover ?? pinned;
  const cur = MONTHS[sel];
  const net = cur.inflow - cur.outflow;
  const positive = net >= 0;
  const rate = Math.max(0, net / cur.inflow);

  return (
    <Widget size="medium" index={index} label="Cash flow">
      <WidgetHeader
        icon={<DataBarVertical20Filled />}
        tint="var(--ios-green)"
        title="Cash Flow"
        subtitle="Checking · last 6 months"
      />

      <div className="mt-2 flex min-h-0 flex-1 gap-3">
        <div className="flex w-[118px] shrink-0 flex-col whitespace-nowrap">
          <motion.div
            key={cur.name}
            className="text-[11px] text-tertiary"
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Net · {cur.name}
          </motion.div>
          <AnimatedNumber
            value={net}
            format={{ ...USD, signDisplay: "always" }}
            className={cn(
              "text-[24px] leading-none font-semibold tracking-tight",
              positive ? "text-ios-green" : "text-ios-red",
            )}
          />
          <div className="mt-2.5 flex flex-col gap-1 text-[11px] text-tertiary">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-ios-green" />
              In
              <AnimatedNumber value={cur.inflow} format={USD} className="ml-auto font-semibold text-secondary" />
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-ios-orange" />
              Out
              <AnimatedNumber value={cur.outflow} format={USD} className="ml-auto font-semibold text-secondary" />
            </span>
          </div>
          <div className="mt-auto text-[11px] text-tertiary">
            Saved{" "}
            <AnimatedNumber
              value={rate}
              format={{ style: "percent", maximumFractionDigits: 0 }}
              className="font-semibold text-secondary"
            />{" "}
            of income
          </div>
        </div>

        <div className="flex min-w-0 flex-1 justify-between" onMouseLeave={() => setHover(null)}>
          {MONTHS.map((x, i) => {
            const on = i === sel;
            const partial = i === MONTHS.length - 1;
            return (
              <button
                key={x.m}
                type="button"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                onClick={() => setPinned(i)}
                aria-pressed={i === pinned}
                aria-label={`${x.name}: in $${x.inflow}, out $${x.outflow}`}
                className="relative flex w-[34px] cursor-pointer flex-col items-center rounded-lg outline-none"
              >
                {on ? (
                  <motion.span
                    layoutId={`cf-sel-${index ?? 0}`}
                    className="absolute inset-0 rounded-lg bg-fill-quaternary"
                    transition={{ type: "spring", stiffness: 480, damping: 36 }}
                  />
                ) : null}
                <div className="relative flex w-full items-end justify-center" style={{ height: HALF }}>
                  <motion.span
                    className="w-3.5 rounded-t-[5px] rounded-b-[2px] bg-ios-green"
                    initial={{ height: 0 }}
                    animate={{ height: (x.inflow / SCALE) * HALF, opacity: on ? 1 : 0.4 }}
                    transition={{
                      height: { type: "spring", stiffness: 160, damping: 18, delay: delay + i * 0.05 },
                      opacity: { duration: 0.2 },
                    }}
                    style={partial ? { backgroundImage: "repeating-linear-gradient(135deg, transparent 0 3px, rgb(255 255 255 / 0.28) 3px 5px)" } : undefined}
                  />
                </div>
                <span className="relative my-px h-px w-full bg-[var(--ant-color-border-secondary)]" />
                <div className="relative flex w-full items-start justify-center" style={{ height: HALF }}>
                  <motion.span
                    className="w-3.5 rounded-t-[2px] rounded-b-[5px] bg-ios-orange"
                    initial={{ height: 0 }}
                    animate={{ height: (x.outflow / SCALE) * HALF, opacity: on ? 1 : 0.4 }}
                    transition={{
                      height: { type: "spring", stiffness: 160, damping: 18, delay: delay + 0.15 + i * 0.05 },
                      opacity: { duration: 0.2 },
                    }}
                    style={partial ? { backgroundImage: "repeating-linear-gradient(135deg, transparent 0 3px, rgb(255 255 255 / 0.28) 3px 5px)" } : undefined}
                  />
                </div>
                <span
                  className={cn(
                    "relative mt-1 text-[11px] leading-none transition-colors",
                    on ? "font-semibold text-heading" : "text-tertiary",
                  )}
                >
                  {x.m}
                </span>
                {x.outflow > x.inflow ? (
                  <span className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-ios-red" aria-hidden />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </Widget>
  );
}
