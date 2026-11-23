import { ArrowUndo20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/** Why items came back over the last 30 days, biggest first. */
const REASONS = [
  { name: "Wrong size", items: 214, color: "var(--ios-orange)", dot: "bg-ios-orange" },
  { name: "Damaged", items: 96, color: "var(--ios-red)", dot: "bg-ios-red" },
  { name: "Looks off", items: 81, color: "var(--ios-purple)", dot: "bg-ios-purple" },
  { name: "Unwanted", items: 77, color: "var(--ios-blue)", dot: "bg-ios-blue" },
  { name: "Too late", items: 52, color: "var(--ios-teal)", dot: "bg-ios-teal" },
] as const;
const TOTAL = REASONS.reduce((s, r) => s + r.items, 0);
const SHIPPED = 7_650;
const REFUNDED = 18_420;
/** A sliver of track between segments. */
const GAP = 0.012;

const SEGMENTS = (() => {
  let start = 0;
  return REASONS.map((r) => {
    const share = r.items / TOTAL;
    const seg = { start: start + GAP / 2, length: share - GAP };
    start += share;
    return seg;
  });
})();

/** E-commerce · small. Return rate in a ring split by reason; tap to step through reasons as the active slice thickens. */
export function ReturnReasonsWidget({ index }: { index?: number }) {
  const [active, setActive] = useState(0);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const r = REASONS[active];

  return (
    <Widget
      size="small"
      index={index}
      label="Return reasons"
      pressable
      onPress={() => setActive((a) => (a + 1) % REASONS.length)}
    >
      <WidgetHeader
        icon={<ArrowUndo20Filled />}
        tint="var(--ios-purple)"
        title="Returns"
        subtitle="Last 30 days"
      />

      <div className="mt-2.5 flex items-center gap-2.5">
        <div className="relative size-[72px] shrink-0">
          <svg viewBox="0 0 80 80" className="size-full -rotate-90" aria-hidden>
            <circle cx={40} cy={40} r={33} fill="none" stroke="var(--ant-color-fill-quaternary)" strokeWidth={9} />
            {SEGMENTS.map((s, i) => {
              const on = i === active;
              return (
                <motion.circle
                  key={REASONS[i].name}
                  cx={40}
                  cy={40}
                  r={33}
                  fill="none"
                  stroke={REASONS[i].color}
                  initial={{ pathLength: 0, pathOffset: s.start, opacity: 1, strokeWidth: 9 }}
                  animate={{ pathLength: s.length, pathOffset: s.start, opacity: on ? 1 : 0.4, strokeWidth: on ? 12 : 9 }}
                  transition={{
                    pathLength: { delay: delay + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                    opacity: { duration: 0.25 },
                    strokeWidth: { type: "spring", stiffness: 420, damping: 20 },
                  }}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <AnimatedNumber
              value={TOTAL / SHIPPED}
              format={{ style: "percent", maximumFractionDigits: 1, minimumFractionDigits: 1 }}
              className="text-[15px] font-semibold tracking-tight text-heading"
            />
            <span className="mt-0.5 text-[9px] text-tertiary">returned</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-[10px] text-tertiary">{active === 0 ? "Top reason" : `Reason #${active + 1}`}</div>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 5, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -5, filter: "blur(3px)" }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1 whitespace-nowrap text-[12px] font-semibold text-heading"
            >
              <span className={cn("size-2 shrink-0 rounded-full", r.dot)} />
              {r.name}
            </motion.div>
          </AnimatePresence>
          <AnimatedNumber
            value={r.items / TOTAL}
            format={{ style: "percent", maximumFractionDigits: 0 }}
            className="mt-1 block text-[24px] leading-none font-semibold tracking-tight text-heading"
          />
          <div className="mt-0.5 text-[11px] text-tertiary">
            <AnimatedNumber value={r.items} className="text-secondary" /> items
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center text-[11px] text-tertiary">
        <span className="truncate">
          <span className="font-semibold text-secondary tabular">${(REFUNDED / 1000).toFixed(1)}K</span> refunded
        </span>
        <div className="ml-auto flex shrink-0 gap-[3px]">
          {REASONS.map((x, i) => (
            <motion.span
              key={x.name}
              layout
              className={cn("h-1.5 rounded-full", i === active ? cn("w-3", x.dot) : "w-1.5 bg-fill")}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          ))}
        </div>
      </div>
    </Widget>
  );
}
