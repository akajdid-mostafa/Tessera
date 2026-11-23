import { CalendarLtr20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_INITIAL = ["M", "T", "W", "T", "F", "S", "S"];
/** Twelve two-hour blocks, 00–02 … 22–24. */
const BLOCKS = 12;
/** A storefront's daily rhythm: dead at night, a lunch bump, a long evening peak. */
const HOUR_SHAPE = [0.18, 0.08, 0.06, 0.22, 0.48, 0.62, 0.78, 0.6, 0.66, 0.9, 1, 0.52];
/** Weekdays build to Thursday payday; weekend mornings run later. */
const DAY_SCALE = [0.82, 0.86, 0.9, 1.08, 0.94, 0.88, 0.97];

/** Orders over the last four weeks, per weekday × two-hour block, from a fixed wobble. */
const GRID = DAYS.map((_, d) =>
  Array.from({ length: BLOCKS }, (_, b) => {
    const weekendShift = d >= 5 && b >= 3 && b <= 5 ? 0.18 : 0;
    const wobble = Math.sin(d * 2.3 + b * 1.1) * 0.06 + Math.cos(d * 0.7 + b * 2.9) * 0.04;
    return Math.round((HOUR_SHAPE[b] + weekendShift + wobble) * DAY_SCALE[d] * 412);
  }),
);
const FLAT = GRID.flat();
const MAX = Math.max(...FLAT);
const AVG = FLAT.reduce((s, v) => s + v, 0) / FLAT.length;
const PEAK = FLAT.indexOf(MAX);

const pad = (h: number) => String(h).padStart(2, "0");
const blockLabel = (b: number) => `${pad(b * 2)}–${pad(b * 2 + 2)}`;

/** E-commerce · medium. Orders by weekday and hour as a heatmap; hover a cell to roll its count into the hero. */
export function OrderHeatmapWidget({ index }: { index?: number }) {
  const [active, setActive] = useState<number | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const cell = active ?? PEAK;
  const d = Math.floor(cell / BLOCKS);
  const b = cell % BLOCKS;
  const value = GRID[d][b];
  const ratio = value / AVG;
  const label = `${DAYS[d]} ${blockLabel(b)}`;

  const cells = useMemo(
    () =>
      GRID.map((row, di) =>
        row.map((v, bi) => ({ v, mix: Math.round(10 + (v / MAX) * 90), key: di * BLOCKS + bi })),
      ),
    [],
  );

  return (
    <Widget size="medium" index={index} label="Order heatmap">
      <WidgetHeader
        icon={<CalendarLtr20Filled />}
        tint="var(--ios-blue)"
        title="When Orders Land"
        subtitle="Last 4 weeks · local time"
      />

      <div className="mt-2 flex min-h-0 flex-1 gap-3">
        <div className="flex w-[96px] shrink-0 flex-col whitespace-nowrap">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(3px)" }}
              transition={{ duration: 0.18 }}
              className="text-[11px] font-medium text-ios-blue tabular"
            >
              {active === null ? "Peak · " : ""}
              {label}
            </motion.div>
          </AnimatePresence>
          <AnimatedNumber
            value={value}
            className="mt-0.5 text-[26px] leading-none font-semibold tracking-tight text-heading"
          />
          <div className="mt-0.5 text-[11px] text-tertiary">orders</div>
          <div className="mt-auto text-[11px] leading-tight text-tertiary">
            <AnimatedNumber
              value={ratio}
              format={{ maximumFractionDigits: 1, minimumFractionDigits: 1 }}
              suffix="×"
              className={cn("font-semibold", ratio >= 1 ? "text-ios-blue" : "text-secondary")}
            />{" "}
            the avg
          </div>
          <div className="mt-1.5 flex items-center gap-[3px]" aria-hidden>
            <span className="mr-0.5 text-[9px] text-tertiary">Less</span>
            {[18, 40, 65, 100].map((m) => (
              <span
                key={m}
                className="size-[7px] rounded-[2px]"
                style={{ background: `color-mix(in srgb, var(--ios-blue) ${m}%, transparent)` }}
              />
            ))}
            <span className="ml-0.5 text-[9px] text-tertiary">More</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col" onMouseLeave={() => setActive(null)}>
          <div className="flex flex-1 flex-col justify-between">
            {cells.map((row, di) => (
              <div key={di} className="flex items-center gap-[3px]">
                <span
                  className={cn(
                    "w-3 shrink-0 text-[9px] leading-none tabular",
                    di === d ? "font-semibold text-heading" : "text-tertiary",
                  )}
                >
                  {DAY_INITIAL[di]}
                </span>
                {row.map((c, bi) => {
                  const on = c.key === cell;
                  return (
                    <motion.span
                      key={c.key}
                      tabIndex={0}
                      aria-label={`${DAYS[di]} ${blockLabel(bi)}: ${c.v} orders`}
                      onMouseEnter={() => setActive(c.key)}
                      onFocus={() => setActive(c.key)}
                      className={cn(
                        "relative h-[12px] flex-1 cursor-default rounded-[3px] bg-fill-quaternary outline-none",
                        on && "z-10 ring-1 ring-inset ring-sel",
                      )}
                      initial={{ opacity: 0, scale: 0.3 }}
                      animate={{ opacity: 1, scale: on ? 1.12 : 1 }}
                      transition={{
                        opacity: { delay: delay + (di + bi) * 0.025, duration: 0.25 },
                        scale: { type: "spring", stiffness: 420, damping: 22, delay: active === null ? delay + (di + bi) * 0.025 : 0 },
                      }}
                    >
                      <span
                        className="absolute inset-0 rounded-[3px]"
                        style={{ background: `color-mix(in srgb, var(--ios-blue) ${c.mix}%, transparent)` }}
                      />
                    </motion.span>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-1 flex pl-[15px] text-[9px] leading-none text-tertiary tabular">
            {["00", "06", "12", "18"].map((h) => (
              <span key={h} className="flex-1">
                {h}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Widget>
  );
}
