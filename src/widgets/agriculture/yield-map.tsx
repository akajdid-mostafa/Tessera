import { VehicleTractor20Filled } from "@fluentui/react-icons";
import { LayoutGroup, motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";

/* A corn harvest logged by the combine's yield monitor, one 4 ha cell per square
 * (16 × 11 over a 64 ha field). Yield runs 7–14 t/ha with a wet, low-yielding swale in
 * the north-east and thinner headlands; grain moisture is highest in the swale. The
 * combine works the field in back-and-forth passes and fills cells live. */
type Layer = "Yield" | "Moisture";
const COLS = 16;
const ROWS = 11;
const HA = 64;
const START = 72;
const Y_LO = 7;
const Y_HI = 14;
const M_LO = 18;
const M_HI = 25;

type Cell = { r: number; c: number; y: number; m: number };
const swale = (r: number, c: number) => Math.exp(-((c - 11.5) ** 2 + (r - 7) ** 2) / 5);
const CELLS: Cell[] = Array.from({ length: ROWS * COLS }, (_, k) => {
  const r = Math.floor(k / COLS);
  const c = k % COLS;
  const head = r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1 ? -0.9 : 0;
  const y = 11.8 + 1.3 * Math.sin(c / 3.1) * Math.cos(r / 2.7) + 0.7 * Math.sin((c + r) / 4) - 4.2 * swale(r, c) + head + Math.sin(c * 12.9 + r * 78.2) * 0.45;
  const m = 20.6 + 3.2 * swale(r, c) + 0.6 * Math.sin(c / 2.3) + Math.sin(c * 7.1 + r * 3.3) * 0.3;
  return { r, c, y: Math.round(y * 10) / 10, m: Math.round(m * 10) / 10 };
});
/** Harvest order: serpentine passes, row by row. */
const ORDER = Array.from({ length: ROWS * COLS }, (_, k) => {
  const r = Math.floor(k / COLS);
  const i = k % COLS;
  return r * COLS + (r % 2 === 0 ? i : COLS - 1 - i);
});

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
function yieldColor(y: number) {
  const t = clamp01((y - Y_LO) / (Y_HI - Y_LO));
  return t < 0.5
    ? `color-mix(in oklab, var(--ios-yellow) ${Math.round(t * 200)}%, var(--ios-red))`
    : `color-mix(in oklab, var(--ios-green) ${Math.round((t - 0.5) * 200)}%, var(--ios-yellow))`;
}
const moistColor = (m: number) => `color-mix(in oklab, var(--ios-blue) ${Math.round(20 + clamp01((m - M_LO) / (M_HI - M_LO)) * 80)}%, transparent)`;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Agriculture · large. A yield-monitor map of a corn field that the combine fills cell by cell in serpentine passes; switch between yield and grain moisture, and hover a harvested cell to read it. */
export function YieldMapWidget({ index }: { index?: number }) {
  const group = useId();
  const [layer, setLayer] = useState<Layer>("Yield");
  const [done, setDone] = useState(START);
  const [hover, setHover] = useState<number | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      // One cell per tick; at the end the map holds a beat, then the next field starts.
      setDone((d) => (d >= ORDER.length + 6 ? 18 : d + 1));
    }, 520);
    return () => window.clearInterval(t);
  }, []);

  const n = Math.min(done, ORDER.length);
  const harvested = new Set(ORDER.slice(0, n));
  const current = n < ORDER.length ? ORDER[n] : null;
  const hc = hover !== null && harvested.has(hover) ? CELLS[hover] : null;
  const cut = ORDER.slice(0, n).map((k) => CELLS[k]);
  const yAvg = hc ? hc.y : avg(cut.map((x) => x.y));
  const mAvg = hc ? hc.m : avg(cut.map((x) => x.m));
  const area = (n / ORDER.length) * HA;

  return (
    <Widget size="large" index={index} label="Harvest yield map">
      <WidgetHeader
        icon={<VehicleTractor20Filled />}
        tint="var(--ios-orange)"
        title="Yield Map"
        subtitle="Field 12 · Corn · 64 ha"
        extra={<Segmented size="small" value={layer} onChange={(v) => setLayer(v as Layer)} options={["Yield", "Moisture"]} />}
      />

      <LayoutGroup id={group}>
        <div
          className="mt-2 grid h-[246px] shrink-0 gap-[2px]"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))` }}
          onPointerLeave={() => setHover(null)}
        >
          {CELLS.map((cell, k) => {
            const on = harvested.has(k);
            const initial = ORDER.indexOf(k) < START;
            return (
              <div
                key={k}
                onPointerEnter={() => setHover(k)}
                className={cn(
                  "relative rounded-[3px] bg-fill-quaternary transition-shadow",
                  hover === k && on && "ring-1 ring-inset ring-sel",
                )}
              >
                {on ? (
                  <motion.span
                    className="absolute inset-0 rounded-[3px] transition-[background-color] duration-300"
                    style={{ backgroundColor: layer === "Yield" ? yieldColor(cell.y) : moistColor(cell.m) }}
                    initial={{ opacity: 0, scale: initial ? 1 : 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      opacity: { duration: 0.35, delay: initial ? delay + ORDER.indexOf(k) * 0.006 : 0 },
                      scale: { type: "spring", stiffness: 420, damping: 22 },
                    }}
                  />
                ) : null}
                {current === k ? (
                  <motion.span
                    layoutId="combine"
                    className="absolute inset-[2px] z-10 rounded-[3px] bg-heading ring-2 ring-[var(--widget-surface)]"
                    transition={{ type: "spring", stiffness: 260, damping: 26 }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </LayoutGroup>

      <div className="mt-2 flex items-center gap-2 text-[10px] leading-none text-tertiary tabular">
        <span>{layer === "Yield" ? Y_LO : `${M_LO}%`}</span>
        <span
          className="h-1.5 flex-1 rounded-full"
          style={{
            background:
              layer === "Yield"
                ? "linear-gradient(90deg, var(--ios-red), var(--ios-yellow), var(--ios-green))"
                : `linear-gradient(90deg, ${moistColor(M_LO)}, ${moistColor(M_HI)})`,
          }}
        />
        <span>{layer === "Yield" ? `${Y_HI} t/ha` : `${M_HI}%`}</span>
      </div>

      <div className="mt-auto grid grid-cols-3 gap-2 whitespace-nowrap">
        <div>
          <div className="text-[11px] leading-none text-tertiary">{hc ? `Cell ${hc.r + 1}·${hc.c + 1}` : "Avg yield"}</div>
          <div className="mt-1 leading-none">
            <AnimatedNumber value={yAvg} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} className="text-[22px] font-semibold tracking-tight text-heading" />
            <span className="ml-0.5 text-[11px] text-tertiary">t/ha</span>
          </div>
        </div>
        <div>
          <div className="text-[11px] leading-none text-tertiary">{hc ? "Moisture" : "Avg moisture"}</div>
          <div className="mt-1 leading-none">
            <AnimatedNumber value={mAvg} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} className="text-[22px] font-semibold tracking-tight text-heading" />
            <span className="ml-0.5 text-[11px] text-tertiary">%</span>
          </div>
        </div>
        <div>
          <div className="text-[11px] leading-none text-tertiary">Harvested</div>
          <div className="mt-1 leading-none">
            <AnimatedNumber value={area} format={{ maximumFractionDigits: 0 }} className="text-[22px] font-semibold tracking-tight text-heading" />
            <span className="ml-0.5 text-[11px] text-tertiary">/ {HA} ha</span>
          </div>
        </div>
      </div>
    </Widget>
  );
}
