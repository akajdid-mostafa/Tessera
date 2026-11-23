import { ArrowDown12Filled, ArrowUp12Filled, Trophy20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/** Of the last 40 closed deals per segment: how many were won, and the change in points vs Q3. */
const SEGMENTS = {
  All: { won: 17, delta: 5 },
  SMB: { won: 22, delta: 8 },
  Ent: { won: 11, delta: -3 },
} as const;
type Segment = keyof typeof SEGMENTS;
const KEYS = Object.keys(SEGMENTS) as Segment[];
const N = 40;
const COLS = 10;

/** Sales · small. A 40-deal waffle of won and lost; switching segment recolours the dots in a wave. */
export function WinRateWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [seg, setSeg] = useState<Segment>("All");
  const [changed, setChanged] = useState(false);
  const s = SEGMENTS[seg];
  const rate = s.won / N;
  const up = s.delta >= 0;

  const pick = (k: Segment) => {
    setSeg(k);
    setChanged(true);
  };

  return (
    <Widget size="small" index={index} label="Win rate">
      <WidgetHeader icon={<Trophy20Filled />} tint="var(--ios-green)" title="Win Rate" subtitle="40 closed · vs Q3" />

      <div className="mt-1.5 flex items-baseline gap-1.5 whitespace-nowrap">
        <AnimatedNumber
          value={rate}
          format={{ style: "percent", maximumFractionDigits: 0 }}
          className="text-[26px] leading-none font-semibold tracking-tight text-heading"
        />
        <span className={cn("inline-flex items-center text-[11px] font-semibold tabular", up ? "text-ios-green" : "text-ios-red")}>
          {up ? <ArrowUp12Filled /> : <ArrowDown12Filled />}
          {Math.abs(s.delta)} pts
        </span>
      </div>

      <div className="mt-auto grid grid-cols-10 gap-[4px]" role="img" aria-label={`${s.won} won of ${N}`}>
        {Array.from({ length: N }, (_, i) => {
          const won = i < s.won;
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          return (
            <motion.span
              key={i}
              className="aspect-square rounded-full"
              initial={{ scale: 0, backgroundColor: "var(--ant-color-fill)" }}
              animate={{
                scale: 1,
                backgroundColor: won ? "var(--ios-green)" : "var(--ant-color-fill)",
              }}
              transition={{
                scale: { type: "spring", stiffness: 520, damping: 22, delay: delay + (col + row) * 0.025 },
                backgroundColor: { duration: 0.25, delay: (changed ? 0 : delay + 0.4) + (col + row) * 0.02 },
              }}
            />
          );
        })}
      </div>

      <div className="mt-2 flex gap-1">
        {KEYS.map((k) => (
          <motion.button
            key={k}
            type="button"
            onClick={() => pick(k)}
            aria-pressed={seg === k}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "relative flex-1 cursor-pointer rounded-full py-0.5 text-[11px] font-medium transition-colors",
              seg === k ? "text-heading" : "text-tertiary",
            )}
          >
            {seg === k ? (
              <motion.span
                layoutId={`wr-seg-${index ?? 0}`}
                className="absolute inset-0 rounded-full bg-fill-secondary"
                transition={{ type: "spring", stiffness: 480, damping: 34 }}
              />
            ) : null}
            <span className="relative">{k}</span>
          </motion.button>
        ))}
      </div>
    </Widget>
  );
}
