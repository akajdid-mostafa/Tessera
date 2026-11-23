import { Globe20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const CHANNELS = [
  { name: "Direct", nights: 612, revenue: 128_450, commission: 0, color: "var(--ios-green)" },
  { name: "Booking.com", nights: 744, revenue: 142_380, commission: 0.15, color: "var(--ios-blue)" },
  { name: "Expedia", nights: 371, revenue: 71_920, commission: 0.18, color: "var(--ios-yellow)" },
  { name: "Airbnb", nights: 262, revenue: 44_610, commission: 0.03, color: "var(--ios-pink)" },
  { name: "GDS", nights: 195, revenue: 52_300, commission: 0.1, color: "var(--ios-purple)" },
] as const;
const NIGHTS = CHANNELS.reduce((s, c) => s + c.nights, 0);
const REVENUE = CHANNELS.reduce((s, c) => s + c.revenue, 0);
const AVG_COMMISSION = CHANNELS.reduce((s, c) => s + c.revenue * c.commission, 0) / REVENUE;
const MONEY = { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 } as const;

/** Hospitality · medium. Booking share by channel as one bar; hover a channel to enlarge it and read its revenue. */
export function ChannelMixWidget({ index }: { index?: number }) {
  const [hover, setHoverState] = useState<number | null>(null);
  const [touched, setTouched] = useState(false);
  const setHover = (i: number | null) => {
    setTouched(true);
    setHoverState(i);
  };
  const c = hover === null ? null : CHANNELS[hover];
  const delay = 0.3 + (index ?? 0) * 0.06;

  return (
    <Widget size="medium" index={index} label="Booking channel mix">
      <WidgetHeader
        icon={<Globe20Filled />}
        tint="var(--ios-blue)"
        title="Channel Mix"
        subtitle={`Last 30 days · ${NIGHTS.toLocaleString("en-US")} room nights`}
      />

      <div className="mt-2 flex items-end gap-3">
        <div className="min-w-0 leading-none">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={c?.name ?? "all"}
              initial={{ opacity: 0, y: 4, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(2px)" }}
              transition={{ duration: 0.18 }}
              className="mb-1 truncate text-[11px] font-medium"
              style={{ color: c?.color ?? "var(--ant-color-text-tertiary)" }}
            >
              {c ? `${c.name} revenue` : "Room revenue"}
            </motion.div>
          </AnimatePresence>
          <AnimatedNumber
            value={c?.revenue ?? REVENUE}
            format={MONEY}
            className="text-[28px] leading-none font-semibold tracking-tight text-heading"
          />
        </div>
        <div className="mb-0.5 ml-auto text-right text-[11px] leading-tight text-tertiary">
          <div>
            <AnimatedNumber
              value={(c ?? CHANNELS[0]).nights / NIGHTS}
              format={{ style: "percent", maximumFractionDigits: 0 }}
              className="font-semibold text-secondary"
            />{" "}
            {c ? "of nights" : "direct share"}
          </div>
          <div>
            <AnimatedNumber
              value={c?.commission ?? AVG_COMMISSION}
              format={{ style: "percent", maximumFractionDigits: 1 }}
              className="font-semibold text-secondary"
            />{" "}
            {c ? "commission" : "avg commission"}
          </div>
        </div>
      </div>

      <div className="mt-auto flex h-6 items-center gap-[3px]" onMouseLeave={() => setHover(null)}>
        {CHANNELS.map((ch, i) => {
          const on = hover === i;
          const dim = hover !== null && !on;
          return (
            <motion.div
              key={ch.name}
              role="presentation"
              onMouseEnter={() => setHover(i)}
              className="h-full cursor-pointer"
              style={{ flexBasis: 0, minWidth: 6, display: "flex", alignItems: "center" }}
              initial={{ flexGrow: 0.001 }}
              animate={{ flexGrow: (ch.nights / NIGHTS) * 100 + (on ? 7 : 0) }}
              transition={{
                flexGrow: !touched
                  ? { type: "spring", stiffness: 120, damping: 20, delay: delay + i * 0.08 }
                  : { type: "spring", stiffness: 300, damping: 26 },
              }}
            >
              <motion.span
                className="block w-full rounded-full"
                style={{ background: ch.color }}
                initial={false}
                animate={{ height: on ? 24 : 12, opacity: dim ? 0.35 : 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 26 }}
              />
            </motion.div>
          );
        })}
      </div>

      <div className="mt-2 grid grid-cols-5 gap-1" onMouseLeave={() => setHover(null)}>
        {CHANNELS.map((ch, i) => (
          <button
            key={ch.name}
            type="button"
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            className={cn(
              "min-w-0 cursor-pointer text-left leading-tight outline-none transition-opacity duration-mid",
              hover !== null && hover !== i && "opacity-45",
            )}
          >
            <div className="flex items-center gap-1 text-[10px] text-tertiary">
              <span className="size-1.5 shrink-0 rounded-full" style={{ background: ch.color }} />
              <span className="truncate">{ch.name}</span>
            </div>
            <div className="text-[12px] font-semibold text-heading tabular">{Math.round((ch.nights / NIGHTS) * 100)}%</div>
          </button>
        ))}
      </div>
    </Widget>
  );
}
