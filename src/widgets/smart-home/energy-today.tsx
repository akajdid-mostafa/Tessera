import { Flash20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useState } from "react";
import { Area, Bar, ComposedChart, ReferenceArea, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { ChartContainer } from "@/registry/antuikit/ui/recharts-chart";

type Key = "use" | "solar";

/** Hourly home use and rooftop solar in kWh; hours after now are not in yet. */
const USE = [0.42, 0.36, 0.34, 0.33, 0.35, 0.41, 0.78, 1.32, 1.18, 0.74, 0.62, 0.58, 0.81, 0.66, 0.59, 0.71, 1.24, 1.86, 2.31, 2.08, 1.62, 1.12, 0.74, 0.52];
const SOLAR = [0, 0, 0, 0, 0, 0, 0.06, 0.38, 0.92, 1.54, 2.08, 2.46, 2.61, 2.52, 2.18, 1.66, 1.04, 0.48, 0.12, 0, 0, 0, 0, 0];
const NOW = 15;
const PEAK = [16, 21] as const;
const RATE = { off: 0.14, peak: 0.38 };

const DATA = USE.map((u, h) => ({
  h,
  use: h <= NOW ? u : null,
  solar: h <= NOW ? SOLAR[h] : null,
  forecast: h > NOW ? SOLAR[h] : null,
}));
const used = USE.slice(0, NOW + 1).reduce((a, b) => a + b, 0);
const solar = SOLAR.slice(0, NOW + 1).reduce((a, b) => a + b, 0);
const imported = USE.slice(0, NOW + 1).reduce((a, u, h) => a + Math.max(0, u - SOLAR[h]), 0);
const cost = USE.slice(0, NOW + 1).reduce(
  (a, u, h) => a + Math.max(0, u - SOLAR[h]) * (h >= PEAK[0] && h < PEAK[1] ? RATE.peak : RATE.off),
  0,
);

const SERIES: Record<Key, { label: string; color: string; chip: string }> = {
  use: { label: "Use", color: "var(--ios-blue)", chip: "bg-ios-blue" },
  solar: { label: "Solar", color: "var(--ios-orange)", chip: "bg-ios-orange" },
};
const ONE = { minimumFractionDigits: 1, maximumFractionDigits: 1 } as const;
const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

/** Smart home · medium. Today's hourly use as bars over the rooftop solar curve with the 16–21 peak-rate window shaded; scrub an hour to read it and tap a series chip to hide it. */
export function EnergyTodayWidget({ index }: { index?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const [on, setOn] = useState<Record<Key, boolean>>({ use: true, solar: true });
  const pt = hover === null ? null : DATA[hover];

  return (
    <Widget size="medium" index={index} label="Home energy today">
      <WidgetHeader
        icon={<Flash20Filled />}
        tint="var(--ios-green)"
        title="Energy Today"
        subtitle="Peak rate 16:00–21:00 · $0.38/kWh"
        extra={
          <div className="flex gap-1">
            {(Object.keys(SERIES) as Key[]).map((k) => (
              <motion.button
                key={k}
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => setOn((p) => ({ ...p, [k]: !p[k] }))}
                className={cn(
                  "flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium outline-none transition-colors",
                  on[k] ? "bg-fill-secondary text-heading" : "bg-fill-quaternary text-tertiary",
                )}
              >
                <motion.span className={cn("size-1.5 rounded-full", SERIES[k].chip)} animate={{ scale: on[k] ? 1 : 0.5, opacity: on[k] ? 1 : 0.4 }} />
                {SERIES[k].label}
              </motion.button>
            ))}
          </div>
        }
      />

      <div className="mt-1.5 flex h-[30px] items-baseline-last gap-1.5 whitespace-nowrap">
        <span className="text-[26px] leading-none font-semibold tracking-tight text-heading">
          <AnimatedNumber value={pt ? (pt.use ?? 0) : used} format={pt ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : ONE} />
        </span>
        <span className="mb-0.5 text-[12px] text-tertiary">kWh {pt ? `at ${hh(pt.h)}` : "used"}</span>
        <span className="mb-0.5 ml-auto text-[11px] text-tertiary tabular">
          {pt ? (
            pt.use === null ? (
              <span>Solar forecast {(pt.forecast ?? 0).toFixed(2)} kWh</span>
            ) : (
              <>
                <span className="font-semibold text-ios-orange">{(pt.solar ?? 0).toFixed(2)}</span> solar
              </>
            )
          ) : (
            <>
              <span className="font-semibold text-ios-orange">
                <AnimatedNumber value={solar} format={ONE} />
              </span>{" "}
              solar · {(imported).toFixed(1)} from grid ·{" "}
              <span className="font-semibold text-secondary">${cost.toFixed(2)}</span>
            </>
          )}
        </span>
      </div>

      <ChartContainer
        config={{ use: { label: "Use", color: SERIES.use.color }, solar: { label: "Solar", color: SERIES.solar.color } }}
        className="mt-auto aspect-auto h-[94px] w-full cursor-crosshair"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const t = Math.min(0.999, Math.max(0, (e.clientX - r.left) / r.width));
          setHover(Math.floor(t * DATA.length));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <ComposedChart data={DATA} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap="22%">
          <defs>
            <linearGradient id="et-solar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ios-orange)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--ios-orange)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="h"
            tickLine={false}
            axisLine={false}
            interval={0}
            height={14}
            tick={{ fontSize: 9 }}
            tickFormatter={(h: number) => (h % 6 === 0 ? String(h).padStart(2, "0") : "")}
          />
          <YAxis hide domain={[0, 2.8]} />
          <ReferenceArea x1={PEAK[0]} x2={PEAK[1]} fill="var(--ios-red)" fillOpacity={0.07} stroke="none" />
          <ReferenceLine x={NOW} stroke="var(--ant-color-text-tertiary)" strokeDasharray="2 3" />
          <Tooltip content={() => null} cursor={{ fill: "var(--ant-color-fill-quaternary)" }} />
          <Area
            dataKey="forecast"
            type="monotone"
            stroke="var(--ios-orange)"
            strokeOpacity={on.solar ? 0.5 : 0}
            strokeDasharray="3 3"
            strokeWidth={1.5}
            fill="none"
            isAnimationActive={false}
            activeDot={false}
          />
          <Area
            dataKey="solar"
            type="monotone"
            stroke="var(--ios-orange)"
            strokeOpacity={on.solar ? 1 : 0}
            strokeWidth={2}
            fill="url(#et-solar)"
            fillOpacity={on.solar ? 1 : 0}
            animationDuration={900}
            activeDot={on.solar ? { r: 3, fill: "var(--ios-orange)", stroke: "var(--widget-surface)", strokeWidth: 2 } : false}
          />
          <Bar
            dataKey="use"
            fill="var(--ios-blue)"
            fillOpacity={on.use ? 0.9 : 0}
            radius={[3, 3, 0, 0]}
            animationDuration={800}
          />
        </ComposedChart>
      </ChartContainer>
    </Widget>
  );
}
