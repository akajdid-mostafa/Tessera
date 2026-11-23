import { Warning12Filled, WeatherSunny20Filled } from "@fluentui/react-icons";
import { useEffect, useMemo, useState } from "react";
import { Area, ComposedChart, Line, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { ChartContainer } from "@/registry/antuikit/ui/recharts-chart";

/* 120 MWac plant, 15-minute intervals 06:00–20:00. The day-ahead forecast is a
 * P50 line inside a P10–P90 band; a passing cloud bank drags actuals under P10. */
const CAPACITY = 120;
const NOW = 31; // 13:45
const CLOUD: Record<number, number> = { 19: 0.9, 20: 0.71, 21: 0.52, 22: 0.47, 23: 0.58, 24: 0.79, 25: 0.93 };

type Point = { t: string; p50: number; band: [number, number]; actual: number | null; low: number | null };

const BASE: Point[] = Array.from({ length: 57 }, (_, i) => {
  const h = 6 + i / 4;
  const s = Math.max(0, Math.sin((Math.PI * (h - 6.4)) / 13.2));
  const p50 = Math.round(Math.min(CAPACITY, 116 * s ** 1.25) * 10) / 10;
  const actual = i <= NOW ? Math.round(p50 * (CLOUD[i] ?? 0.97 + Math.sin(i * 2.3) * 0.025) * 10) / 10 : null;
  return {
    t: `${String(Math.floor(h)).padStart(2, "0")}:${String((i % 4) * 15).padStart(2, "0")}`,
    p50,
    band: [Math.round(p50 * 0.8 * 10) / 10, Math.round(Math.min(CAPACITY, p50 * 1.13) * 10) / 10],
    actual,
    low: null,
  };
});

/** Energy · medium. Actual output traced against the day-ahead P10–P90 band; scrub any 15-minute interval. */
export function SolarForecastWidget({ index }: { index?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const [live, setLive] = useState(BASE[NOW].actual ?? 0);

  useEffect(() => {
    const t = window.setInterval(() => {
      const p = BASE[NOW].p50;
      setLive(Math.round(p * (0.955 + Math.random() * 0.04) * 10) / 10);
    }, 4000);
    return () => window.clearInterval(t);
  }, []);

  const data = useMemo(() => {
    const rows = BASE.map((r, i) => (i === NOW ? { ...r, actual: live } : { ...r }));
    // The under-band stretch is drawn as its own series, one point of overlap each side.
    rows.forEach((r, i) => {
      const under = (k: number) => {
        const x = rows[k];
        return !!x && x.actual !== null && x.actual < x.band[0];
      };
      if (r.actual !== null && (under(i) || under(i - 1) || under(i + 1))) r.low = r.actual;
    });
    return rows;
  }, [live]);

  const energy = useMemo(() => data.reduce((s, r) => s + (r.actual ?? 0) * 0.25, 0), [data]);

  const i = hover ?? NOW;
  const p = data[i];
  const isActual = p.actual !== null;
  const value = p.actual ?? p.p50;
  const delta = p.p50 > 0 ? (value - p.p50) / p.p50 : 0;
  const under = isActual && value < p.band[0];

  return (
    <Widget size="medium" index={index} label="Solar plant production vs forecast">
      <WidgetHeader
        icon={<WeatherSunny20Filled />}
        tint="var(--ios-yellow)"
        title="Mesa Solar · 120 MWac"
        subtitle="Output vs day-ahead P10–P90"
        extra={
          <div className="text-right leading-tight whitespace-nowrap">
            <div className="text-[11px] text-tertiary">Today</div>
            <div className="text-[15px] font-semibold text-heading">
              <AnimatedNumber value={Math.round(energy)} />
              <span className="ml-0.5 text-[11px] font-medium text-tertiary">MWh</span>
            </div>
          </div>
        }
      />

      <div className="mt-1.5 flex items-baseline-last gap-2 whitespace-nowrap">
        <div className="leading-none">
          <AnimatedNumber
            value={value}
            format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            className="text-[28px] font-semibold tracking-tight text-heading"
          />
          <span className="ml-1 text-[13px] font-medium text-tertiary">MW</span>
        </div>
        <span
          className={cn(
            "mb-0.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
            under ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-tertiary text-secondary",
          )}
        >
          {under ? <Warning12Filled /> : null}
          {under ? (
            "Below P10"
          ) : isActual ? (
            <AnimatedNumber value={delta} format={{ style: "percent", maximumFractionDigits: 0, signDisplay: "always" }} suffix=" vs P50" />
          ) : (
            "Forecast"
          )}
        </span>
        <span className="mb-0.5 ml-auto text-[11px] text-tertiary tabular">
          {hover === null ? `Now · ${p.t}` : p.t}
        </span>
      </div>

      <ChartContainer
        config={{
          band: { label: "P10–P90", color: "var(--ant-color-fill-secondary)" },
          p50: { label: "P50", color: "var(--ant-color-text-tertiary)" },
          actual: { label: "Actual", color: "var(--ant-color-text-heading)" },
        }}
        className="-mx-4 -mb-4 mt-auto aspect-auto h-[80px] w-[calc(100%+2rem)] cursor-crosshair"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const t = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
          setHover(Math.round(t * (data.length - 1)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <ComposedChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <XAxis dataKey="t" hide />
          <YAxis hide domain={[0, CAPACITY + 4]} />
          <Tooltip content={() => null} cursor={{ stroke: "var(--ant-color-text-tertiary)", strokeDasharray: "3 3" }} />
          <Area
            type="monotone"
            dataKey="band"
            stroke="none"
            fill="var(--ant-color-fill-secondary)"
            fillOpacity={1}
            isAnimationActive
            animationDuration={700}
            activeDot={false}
          />
          <Line
            type="monotone"
            dataKey="p50"
            stroke="var(--ant-color-text-tertiary)"
            strokeDasharray="3 3"
            strokeWidth={1.25}
            dot={false}
            activeDot={false}
            animationDuration={900}
          />
          <ReferenceLine x={BASE[NOW].t} stroke="var(--ant-color-text-tertiary)" strokeWidth={1} />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="var(--ant-color-text-heading)"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            animationDuration={1300}
            animationBegin={300 + (index ?? 0) * 60}
            activeDot={{ r: 3.5, fill: "var(--ant-color-text-heading)", stroke: "var(--widget-surface)", strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="low"
            stroke="var(--ios-orange)"
            strokeWidth={2.5}
            dot={false}
            activeDot={false}
            connectNulls={false}
            animationDuration={1300}
            animationBegin={300 + (index ?? 0) * 60}
          />
        </ComposedChart>
      </ChartContainer>
    </Widget>
  );
}
