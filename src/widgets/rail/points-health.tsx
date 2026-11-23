import { ArrowSwap20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { enterDelay, hhmm, useInterval } from "./_parts";

type Throw = { s: number; to: "N" | "R"; at: number };

const LIMIT = 4.0; // s, maintenance limit for this machine
const WARN = 3.8;
const BARS = 14;
const S_MAX = 4.6;
const SEED: Throw[] = [3.21, 3.28, 3.19, 3.34, 3.3, 3.42, 3.27, 3.86, 3.36, 3.31, 3.45, 3.39, 3.92, 3.41].map((s, i) => ({
  s,
  to: i % 2 ? "N" : "R",
  at: 7 * 60 + 2 + i * 4,
}));
const THROW_MS = 5200;
const TRAVEL_MS = 1100;

/** Rail · small. A point machine throwing live between normal and reverse with its last throw times against the 4.0 s limit, creeping up as the slide chairs dry out; hover a bar to read that throw. */
export function PointsHealthWidget({ index }: { index?: number }) {
  const [throws, setThrows] = useState(SEED);
  const [moving, setMoving] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const delay = enterDelay(index);

  useInterval(() => {
    setMoving(true);
    setThrows((ts) => {
      const last = ts[ts.length - 1];
      const n = ts.length + 1;
      // Every fifth throw drags: the dry chair the next inspection should lubricate.
      const s = n % 5 === 0 ? 3.95 + Math.random() * 0.3 : 3.25 + Math.random() * 0.22 + (n % 5) * 0.03;
      return [...ts.slice(1), { s: Math.round(s * 100) / 100, to: last.to === "N" ? "R" : "N", at: last.at + 4 }];
    });
  }, THROW_MS);

  // The blade travels, then detection proves the new position.
  useEffect(() => {
    if (!moving) return;
    const t = window.setTimeout(() => setMoving(false), TRAVEL_MS);
    return () => window.clearTimeout(t);
  }, [moving]);

  const latest = throws[throws.length - 1];
  const shown = hover !== null ? throws[hover] : latest;
  const pos = moving ? (latest.to === "N" ? "R" : "N") : latest.to;
  const slow = throws.slice(-5).filter((t) => t.s > WARN).length;
  const tone = (s: number) => (s > LIMIT ? "red" : s > WARN ? "orange" : "ok");
  const shownTone = tone(shown.s);

  return (
    <Widget size="small" index={index} label="Point machine health">
      <WidgetHeader
        icon={<ArrowSwap20Filled />}
        tint={slow >= 2 ? "var(--ios-orange)" : "var(--ios-indigo)"}
        title="Points 231B"
        subtitle="East Croydon · HW2000"
      />

      <div className="mt-2 flex h-9 items-center justify-between">
        <div className="leading-none whitespace-nowrap">
          <div
            className={cn(
              "text-[26px] font-semibold tracking-tight",
              shownTone === "red" ? "text-ios-red" : shownTone === "orange" ? "text-ios-orange" : "text-heading",
            )}
          >
            <AnimatedNumber value={shown.s} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />
            <span className="text-[12px] font-medium text-tertiary"> s</span>
          </div>
        </div>
        {/* the turnout: the set route reads bold, the blade light flashes while it travels */}
        <svg viewBox="0 0 64 36" className="h-9 w-16 shrink-0" aria-label={`Points ${pos === "N" ? "normal" : "reverse"}`}>
          <motion.path
            d="M20 26 H64"
            fill="none"
            strokeLinecap="round"
            initial={{ strokeWidth: pos === "N" && !moving ? 3 : 1.5, stroke: pos === "N" && !moving ? "var(--ant-color-text-heading)" : "var(--ant-color-text-quaternary)" }}
            animate={{ strokeWidth: pos === "N" && !moving ? 3 : 1.5, stroke: pos === "N" && !moving ? "var(--ant-color-text-heading)" : "var(--ant-color-text-quaternary)" }}
            transition={{ duration: 0.3 }}
          />
          <motion.path
            d="M20 26 Q40 26 62 8"
            fill="none"
            strokeLinecap="round"
            initial={{ strokeWidth: pos === "R" && !moving ? 3 : 1.5, stroke: pos === "R" && !moving ? "var(--ant-color-text-heading)" : "var(--ant-color-text-quaternary)" }}
            animate={{ strokeWidth: pos === "R" && !moving ? 3 : 1.5, stroke: pos === "R" && !moving ? "var(--ant-color-text-heading)" : "var(--ant-color-text-quaternary)" }}
            transition={{ duration: 0.3 }}
          />
          <path d="M2 26 H20" fill="none" strokeWidth="3" strokeLinecap="round" stroke="var(--ant-color-text-heading)" />
          <motion.circle
            cx="20"
            cy="26"
            r="3.2"
            animate={moving ? { opacity: [1, 0.2, 1], fill: "var(--ios-orange)" } : { opacity: 1, fill: "var(--ios-green)" }}
            transition={moving ? { duration: 0.35, repeat: Infinity } : { duration: 0.2 }}
          />
          <text x="62" y="35" fontSize="8" fontWeight="600" textAnchor="end" className="fill-tertiary">
            {pos}
          </text>
        </svg>
      </div>

      <div className="relative mt-2 h-12" onPointerLeave={() => setHover(null)}>
        <div className="absolute inset-0 flex items-end gap-[3px]">
          {throws.map((t, i) => {
            const tn = tone(t.s);
            return (
              <motion.button
                key={`${t.at}`}
                type="button"
                layout
                onPointerEnter={() => setHover(i)}
                className="relative h-full min-w-0 flex-1 cursor-crosshair outline-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ layout: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.3 } }}
              >
                <motion.span
                  className={cn(
                    "absolute inset-x-0 bottom-0 origin-bottom rounded-[2px]",
                    tn === "red" ? "bg-ios-red" : tn === "orange" ? "bg-ios-orange" : hover === i ? "bg-secondary" : "bg-fill",
                  )}
                  style={{ height: `${(t.s / S_MAX) * 100}%` }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ type: "spring", stiffness: 240, damping: 22, delay: i < BARS && t.at < SEED[BARS - 1].at + 1 ? delay + i * 0.03 : 0 }}
                />
              </motion.button>
            );
          })}
        </div>
        <span
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-ios-red/70"
          style={{ top: `${(1 - LIMIT / S_MAX) * 100}%` }}
        />
      </div>

      <div className="mt-auto flex items-center justify-between text-[10px] text-tertiary tabular whitespace-nowrap">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={`${shown.at}-${hover !== null}`} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }}>
            {shown.to === "N" ? "R→N" : "N→R"} · {hhmm(shown.at)}
          </motion.span>
        </AnimatePresence>
        <span className={slow >= 2 ? "font-semibold text-ios-orange" : undefined}>{slow >= 2 ? "Inspect · slow" : `Limit ${LIMIT.toFixed(1)} s`}</span>
      </div>
    </Widget>
  );
}
