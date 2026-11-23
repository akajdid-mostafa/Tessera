import { ArrowUp12Filled, Gauge20Filled } from "@fluentui/react-icons";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const MIN = 300;
const MAX = 850;
const SCORE = 768;
const LAST = 756;

/** Score bands, with the label shown under the number. */
const BANDS = [
  { to: 579, label: "Poor", color: "var(--ios-red)", text: "text-ios-red" },
  { to: 669, label: "Fair", color: "var(--ios-orange)", text: "text-ios-orange" },
  { to: 739, label: "Good", color: "var(--ios-yellow)", text: "text-ios-yellow" },
  { to: 799, label: "Very good", color: "var(--ios-green)", text: "text-ios-green" },
  { to: 850, label: "Excellent", color: "var(--ios-mint)", text: "text-ios-mint" },
] as const;
const band = BANDS.find((b) => SCORE <= b.to) ?? BANDS[BANDS.length - 1];

/** What moved the score, for the second page. */
const FACTORS = [
  { label: "Card utilization", value: "8%", tone: "text-ios-green", fill: 0.08, color: "var(--ios-green)" },
  { label: "On-time payments", value: "100%", tone: "text-ios-green", fill: 1, color: "var(--ios-green)" },
  { label: "Credit age", value: "7y 4m", tone: "text-secondary", fill: 0.55, color: "var(--ios-blue)" },
  { label: "Hard inquiries", value: "1 · −6", tone: "text-ios-orange", fill: 0.2, color: "var(--ios-orange)" },
] as const;

/* Gauge geometry, in a 140×78 box: a half ring centred at (70, 70). */
const CX = 70;
const CY = 70;
const R = 58;
const frac = (s: number) => (s - MIN) / (MAX - MIN);
const point = (f: number, r = R) => {
  const a = Math.PI * (1 - f);
  return [CX + Math.cos(a) * r, CY - Math.sin(a) * r] as const;
};
const arc = (f0: number, f1: number) => {
  const [x0, y0] = point(f0);
  const [x1, y1] = point(f1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};

/** Finance · small. A half gauge sweeps to the score; tap to page to what moved it. */
export function CreditScoreWidget({ index }: { index?: number }) {
  const [page, setPage] = useState(0);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [shown, setShown] = useState(MIN);

  // The marker travels along the ring, so it is driven by one value.
  const f = useMotionValue(0);
  const mx = useTransform(f, (v) => point(v)[0]);
  const my = useTransform(f, (v) => point(v)[1]);

  useEffect(() => {
    const controls = animate(f, frac(SCORE), { type: "spring", stiffness: 40, damping: 14, delay });
    const t = window.setTimeout(() => setShown(SCORE), delay * 1000);
    return () => {
      controls.stop();
      window.clearTimeout(t);
    };
  }, [f, delay]);

  return (
    <Widget size="small" index={index} label="Credit score" pressable onPress={() => setPage((p) => (p + 1) % 2)}>
      <WidgetHeader icon={<Gauge20Filled />} tint="var(--ios-green)" title="Credit Score" subtitle="Updated Nov 1" />

      <div className="relative mt-1 min-h-0 flex-1">
        <AnimatePresence mode="popLayout" initial={false}>
          {page === 0 ? (
            <motion.div
              key="gauge"
              className="flex flex-col items-center"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            >
              <div className="relative h-[78px] w-[140px]">
                <svg viewBox="0 0 140 78" className="size-full overflow-visible" aria-hidden>
                  {BANDS.map((b, i) => {
                    const from = frac(i === 0 ? MIN : BANDS[i - 1].to + 1);
                    const to = frac(b.to);
                    return (
                      <motion.path
                        key={b.label}
                        d={arc(from + (i ? 0.006 : 0), to - (i < BANDS.length - 1 ? 0.006 : 0))}
                        fill="none"
                        stroke={b.color}
                        strokeWidth={8}
                        strokeLinecap="butt"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: b === band ? 1 : 0.35 }}
                        transition={{ duration: 0.5, delay: delay + i * 0.06 }}
                      />
                    );
                  })}
                  <motion.circle
                    cx={mx}
                    cy={my}
                    r={7}
                    className="fill-[var(--widget-surface)]"
                    stroke={band.color}
                    strokeWidth={3.5}
                  />
                  <text x={point(0)[0]} y={CY + 8} textAnchor="middle" className="fill-tertiary text-[10px] tabular">
                    {MIN}
                  </text>
                  <text x={point(1)[0]} y={CY + 8} textAnchor="middle" className="fill-tertiary text-[10px] tabular">
                    {MAX}
                  </text>
                </svg>
                <div className="absolute inset-x-0 top-[30px] flex flex-col items-center leading-none">
                  <AnimatedNumber value={shown} className="text-[28px] font-semibold tracking-tight text-heading" />
                  <span className={cn("mt-0.5 text-[11px] font-semibold", band.text)}>{band.label}</span>
                </div>
              </div>
              <div className="mt-1.5 flex items-center gap-1 whitespace-nowrap text-[11px] text-tertiary">
                <span className="inline-flex items-center font-semibold text-ios-green tabular">
                  <ArrowUp12Filled />
                  {SCORE - LAST} pts
                </span>
                since Oct
              </div>
            </motion.div>
          ) : (
            <motion.ul
              key="factors"
              className="flex flex-col gap-[7px] pt-1"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            >
              {FACTORS.map((x, i) => (
                <li key={x.label} className="leading-none">
                  <div className="flex items-baseline justify-between gap-2 whitespace-nowrap text-[11px]">
                    <span className="truncate text-secondary">{x.label}</span>
                    <span className={cn("font-semibold tabular", x.tone)}>{x.value}</span>
                  </div>
                  <div className="mt-[3px] h-[3px] overflow-hidden rounded-full bg-fill-secondary">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: x.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(4, x.fill * 100)}%` }}
                      transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.08 * i }}
                    />
                  </div>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-1">
        {[0, 1].map((i) => (
          <motion.span
            key={i}
            className="h-1 rounded-full bg-heading"
            animate={{ width: i === page ? 10 : 4, opacity: i === page ? 0.9 : 0.25 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        ))}
      </div>
    </Widget>
  );
}
