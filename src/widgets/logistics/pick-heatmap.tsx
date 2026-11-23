import { Grid20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/* Zone B: ten aisles (columns, 01 nearest pack-out) by five shelf levels (rows, 5 on top). */
const AISLES = 10;
const LEVELS = 5;
const CELLS = AISLES * LEVELS;
const TICK_MS = 900;

/** Picks so far today: fast movers sit near pack-out at waist height (levels 2–3). */
const SEED = Array.from({ length: CELLS }, (_, i) => {
  const aisle = i % AISLES;
  const level = LEVELS - Math.floor(i / AISLES);
  const golden = level === 2 || level === 3 ? 1 : level === 1 ? 0.6 : 0.4;
  return Math.round(18 + 310 * Math.exp(-aisle / 3.2) * golden + ((i * 37) % 23));
});
const codeOf = (i: number) => `B-${String((i % AISLES) + 1).padStart(2, "0")}-${LEVELS - Math.floor(i / AISLES)}`;

/** Weighted pick: hot cells are hit more often. */
function pickCell(v: number[]) {
  const total = v.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < v.length; i++) {
    r -= v[i];
    if (r <= 0) return i;
  }
  return v.length - 1;
}

/** Logistics · small. Zone B's pick locations as a heatmap that warms as picks land, each hit rippling; hover a cell for its location, picks and velocity class. */
export function PickHeatmapWidget({ index }: { index?: number }) {
  const [v, setV] = useState(SEED);
  const [hit, setHit] = useState({ i: -1, n: 0 });
  const [hover, setHover] = useState<number | null>(null);
  const latest = useRef(SEED);
  const delay = 0.3 + (index ?? 0) * 0.06;
  latest.current = v;

  useEffect(() => {
    const t = window.setInterval(() => {
      const i = pickCell(latest.current);
      const add = 1 + Math.floor(Math.random() * 3);
      setV((cur) => cur.map((x, k) => (k === i ? x + add : x)));
      setHit((h) => ({ i, n: h.n + 1 }));
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, []);

  const max = Math.max(...v);
  const total = v.reduce((a, b) => a + b, 0);
  const sorted = [...v].sort((a, b) => b - a);
  const classOf = (x: number) => (x >= sorted[Math.floor(CELLS * 0.2)] ? "A" : x >= sorted[Math.floor(CELLS * 0.5)] ? "B" : "C");

  return (
    <Widget size="small" index={index} label="Pick heatmap">
      <WidgetHeader icon={<Grid20Filled />} tint="var(--ios-orange)" title="Pick Heat" subtitle="Zone B · today" />

      <div className="mt-1.5 h-[36px] leading-none whitespace-nowrap">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={hover === null ? "all" : hover}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            className="text-[10px] text-tertiary tabular"
          >
            {hover === null ? (
              "Picks · 50 locations"
            ) : (
              <>
                <span className="font-semibold text-secondary">{codeOf(hover)}</span> · class {classOf(v[hover])}
              </>
            )}
          </motion.div>
        </AnimatePresence>
        <AnimatedNumber
          value={hover === null ? total : v[hover]}
          className="mt-0.5 text-[22px] font-semibold tracking-tight text-heading"
        />
      </div>

      <div
        className="mt-1.5 grid gap-[2px]"
        style={{ gridTemplateColumns: `repeat(${AISLES}, minmax(0, 1fr))` }}
        onPointerLeave={() => setHover(null)}
      >
        {v.map((x, i) => {
          const t = x / max;
          const dim = hover !== null && hover !== i;
          return (
            <motion.button
              key={i}
              type="button"
              aria-label={`${codeOf(i)}: ${x} picks`}
              onPointerEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              className={cn("relative h-[11px] cursor-crosshair rounded-[3px] outline-none", hover === i && "ring-1 ring-[var(--ant-color-text-heading)]")}
              style={{ background: `color-mix(in srgb, var(--ios-orange) ${Math.round(10 + t * 90)}%, transparent)` }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: dim ? 0.45 : 1, scale: 1 }}
              transition={{
                scale: { type: "spring", stiffness: 420, damping: 22, delay: delay + ((i % AISLES) + Math.floor(i / AISLES)) * 0.025 },
                opacity: { duration: 0.2, delay: hover === null && hit.n === 0 ? delay : 0 },
              }}
            >
              <AnimatePresence>
                {hit.i === i ? (
                  <motion.span
                    key={hit.n}
                    className="pointer-events-none absolute inset-0 rounded-[3px] ring-2 ring-ios-orange"
                    initial={{ scale: 1, opacity: 0.9 }}
                    animate={{ scale: 1.9, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                ) : null}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-auto flex items-center justify-between text-[10px] text-tertiary">
        <span>← Pack-out</span>
        <span className="flex items-center gap-[3px]">
          Low
          {[15, 45, 75, 100].map((p) => (
            <span
              key={p}
              className="size-[7px] rounded-[2px]"
              style={{ background: `color-mix(in srgb, var(--ios-orange) ${p}%, transparent)` }}
            />
          ))}
          High
        </span>
      </div>
    </Widget>
  );
}
