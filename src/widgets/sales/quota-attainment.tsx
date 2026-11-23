import { Target20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Period = { key: string; subtitle: string; closed: number; target: number; pace: number };

/** Today is Nov 9: day 40 of Q4, day 9 of November, day 313 of the year. */
const PERIODS: Period[] = [
  { key: "q4", subtitle: "Q4 2026 · 52 days left", closed: 318_400, target: 700_000, pace: 40 / 92 },
  { key: "nov", subtitle: "November · 21 days left", closed: 96_200, target: 240_000, pace: 9 / 30 },
  { key: "fy", subtitle: "FY 2026 · 52 days left", closed: 2_312_000, target: 2_800_000, pace: 313 / 365 },
];

const MONEY = { style: "currency", currency: "USD", notation: "compact", maximumSignificantDigits: 3 } as const;

const SIZE = 84;
const R = 36;
const STROKE = 9;
const C = 2 * Math.PI * R;

/** Sales · small. Quota ring with a pace tick; tap to page quarter, month and year. */
export function QuotaAttainmentWidget({ index }: { index?: number }) {
  const [page, setPage] = useState(0);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const p = PERIODS[page];
  const attained = p.closed / p.target;
  const gap = Math.round((attained - p.pace) * 100);
  const ahead = gap >= 0;
  const color = ahead ? "var(--ios-green)" : "var(--ios-orange)";

  // The pace tick sits on the ring at the share of the period already gone.
  const a = p.pace * 2 * Math.PI - Math.PI / 2;
  const cx = SIZE / 2;
  const tick = (d: number) => [cx + Math.cos(a) * (R + d), cx + Math.sin(a) * (R + d)] as const;
  const [x1, y1] = tick(-STROKE / 2 - 3);
  const [x2, y2] = tick(STROKE / 2 + 3);

  return (
    <Widget
      size="small"
      index={index}
      label="Quota attainment"
      pressable
      onPress={() => setPage((n) => (n + 1) % PERIODS.length)}
    >
      <WidgetHeader
        icon={<Target20Filled />}
        tint="var(--ios-green)"
        title="Quota"
        subtitle={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={p.key}
              className="block truncate"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {p.subtitle}
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="mt-2.5 flex items-center gap-2.5">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
            <circle cx={cx} cy={cx} r={R} fill="none" stroke="var(--ant-color-fill-secondary)" strokeWidth={STROKE} />
            <motion.circle
              cx={cx}
              cy={cx}
              r={R}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={C}
              transform={`rotate(-90 ${cx} ${cx})`}
              initial={{ strokeDashoffset: C, stroke: color }}
              animate={{ strokeDashoffset: C * (1 - Math.min(1, attained)), stroke: color }}
              transition={{
                strokeDashoffset: { type: "spring", stiffness: 60, damping: 16, delay },
                stroke: { duration: 0.3 },
              }}
            />
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.5, duration: 0.3 }}
            >
              <motion.line
                initial={false}
                animate={{ x1, y1, x2, y2 }}
                transition={{ type: "spring", stiffness: 200, damping: 24 }}
                stroke="var(--widget-surface)"
                strokeWidth={5}
                strokeLinecap="round"
              />
              <motion.line
                initial={false}
                animate={{ x1, y1, x2, y2 }}
                transition={{ type: "spring", stiffness: 200, damping: 24 }}
                stroke="var(--ant-color-text)"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </motion.g>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <AnimatedNumber
              value={attained}
              format={{ style: "percent", maximumFractionDigits: 0 }}
              className="text-[20px] font-semibold tracking-tight text-heading"
            />
            <span className="mt-0.5 text-[10px] text-tertiary">attained</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 leading-tight whitespace-nowrap">
          <div className="text-[10px] text-tertiary">Closed won</div>
          <AnimatedNumber value={p.closed} format={MONEY} className="text-[17px] font-semibold tracking-tight text-heading" />
          <div className="mt-1.5 text-[10px] text-tertiary">Target</div>
          <AnimatedNumber value={p.target} format={MONEY} className="text-[13px] font-medium text-secondary" />
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap transition-colors duration-300",
            ahead ? "bg-ios-green/15 text-ios-green" : "bg-ios-orange/15 text-ios-orange",
          )}
        >
          <AnimatedNumber value={gap} format={{ signDisplay: "always" }} suffix=" pts" />
          <span className="ml-1 font-medium">{ahead ? "ahead" : "behind"}</span>
        </span>
        <div className="flex gap-1" aria-hidden>
          {PERIODS.map((x, i) => (
            <span
              key={x.key}
              className={cn(
                "h-[5px] rounded-full transition-all duration-300",
                i === page ? "w-3 bg-text" : "w-[5px] bg-fill",
              )}
            />
          ))}
        </div>
      </div>
    </Widget>
  );
}
