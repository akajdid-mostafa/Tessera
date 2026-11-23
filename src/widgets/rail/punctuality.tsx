import { Clock20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { enterDelay, late, useInterval } from "./_parts";

type Counts = { total: number; ppm: number; rt: number; casl: number };
type Page = { key: string; title: string; hint: string; target: number; lowerIsBetter?: boolean; scale: number; value: (c: Counts) => number };

const PAGES: Page[] = [
  { key: "ppm", title: "PPM", hint: "Arrived within 5 min", target: 92.5, scale: 100, value: (c) => (c.ppm / c.total) * 100 },
  { key: "rt", title: "Right time", hint: "Arrived within 59 s", target: 70, scale: 100, value: (c) => (c.rt / c.total) * 100 },
  { key: "casl", title: "CaSL", hint: "Cancelled or 30+ min late", target: 2.5, lowerIsBetter: true, scale: 10, value: (c) => (c.casl / c.total) * 100 },
];
const HEADCODES = ["1B37", "2S41", "1C20", "2P14", "1A47", "1C28", "2H52", "1B53", "2S45", "1C34"];
const R = 31;
const C = 2 * Math.PI * R;

/** Rail · small. Today's public performance measure on a ring with its target tick, nudged by every arrival as it lands; tap to page through PPM, right time and CaSL. */
export function PunctualityWidget({ index }: { index?: number }) {
  const [c, setC] = useState<Counts>({ total: 451, ppm: 412, rt: 307, casl: 9 });
  const [page, setPage] = useState(0);
  const [last, setLast] = useState({ id: "1C14", by: 0, n: 0 });
  const delay = enterDelay(index);

  useInterval(() => {
    const r = Math.random();
    const by = r < 0.66 ? 0 : r < 0.91 ? 1 + Math.floor(Math.random() * 4) : r < 0.985 ? 6 + Math.floor(Math.random() * 9) : 34;
    setC((x) => ({ total: x.total + 1, ppm: x.ppm + (by <= 5 ? 1 : 0), rt: x.rt + (by === 0 ? 1 : 0), casl: x.casl + (by >= 30 ? 1 : 0) }));
    setLast((l) => ({ id: HEADCODES[(l.n + 1) % HEADCODES.length], by, n: l.n + 1 }));
  }, 3500);

  const p = PAGES[page];
  const v = p.value(c);
  const ok = p.lowerIsBetter ? v <= p.target : v >= p.target;
  const frac = Math.min(1, v / p.scale);
  const tickDeg = (p.target / p.scale) * 360;
  const color = ok ? "var(--ios-green)" : "var(--ios-orange)";

  return (
    <Widget size="small" index={index} label="Punctuality" pressable onPress={() => setPage((x) => (x + 1) % PAGES.length)}>
      <WidgetHeader icon={<Clock20Filled />} tint="var(--ios-indigo)" title="Punctuality" subtitle="Brighton Main Line · today" />

      <div className="mt-2 flex items-center gap-3">
        <div className="relative size-[76px] shrink-0">
          <svg viewBox="0 0 76 76" className="size-full -rotate-90" aria-hidden>
            <circle cx="38" cy="38" r={R} fill="none" strokeWidth="7" className="stroke-fill-tertiary" />
            <motion.circle
              cx="38"
              cy="38"
              r={R}
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C, stroke: color }}
              animate={{ strokeDashoffset: C * (1 - frac), stroke: color }}
              transition={{ strokeDashoffset: { type: "spring", stiffness: 60, damping: 16, delay: page === 0 && c.total === 451 ? delay : 0 }, stroke: { duration: 0.4 } }}
            />
            {/* target tick, across the track */}
            <motion.g
              initial={false}
              animate={{ rotate: tickDeg }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
              style={{ transformBox: "view-box", transformOrigin: "38px 38px" }}
            >
              <line x1={38 + R - 6} x2={38 + R + 6} y1="38" y2="38" strokeWidth="2" strokeLinecap="round" className="stroke-heading" />
            </motion.g>
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className={cn("text-[18px] leading-none font-semibold tracking-tight", ok ? "text-heading" : "text-ios-orange")}>
              <AnimatedNumber value={v} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
              <span className="text-[10px] font-medium text-tertiary">%</span>
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1 leading-tight whitespace-nowrap">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={p.key} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}>
              <div className="truncate text-[13px] font-semibold text-heading">{p.title}</div>
              <div className="truncate text-[10px] text-tertiary">{p.hint}</div>
              <div className="mt-1.5 text-[10px] text-tertiary">Target</div>
              <div className="text-[13px] font-semibold text-secondary tabular">
                {p.lowerIsBetter ? "≤ " : ""}
                {p.target}%
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between text-[10px] text-tertiary tabular whitespace-nowrap">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={last.n} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
            {last.id} arr{" "}
            <span className={cn("font-semibold", last.by > 5 ? "text-ios-orange" : "text-secondary")}>{late(last.by)}</span>
            {" · "}
            {c.total} trains
          </motion.span>
        </AnimatePresence>
        <span className="flex gap-1">
          {PAGES.map((x, i) => (
            <span key={x.key} className={cn("size-1.5 rounded-full transition-colors", i === page ? "bg-heading" : "bg-fill")} />
          ))}
        </span>
      </div>
    </Widget>
  );
}
