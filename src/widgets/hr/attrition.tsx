import { ArrowTrendingDown20Filled } from "@fluentui/react-icons";
import { useMemo, useState } from "react";
import { Area, ComposedChart, Line, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { ChartContainer } from "@/registry/antuikit/ui/recharts-chart";
import { Segmented } from "@/registry/antuikit/ui/segmented";

type Mode = "All" | "Voluntary";
const MONTHS = ["Dec '25", "Jan '26", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov '26"];
/** Rolling 12-month attrition, % of average headcount. */
const SERIES: Record<Mode, { values: number[]; target: number; domain: [number, number] }> = {
  All: { values: [14.2, 14.0, 13.8, 13.9, 13.5, 13.1, 12.8, 12.6, 12.3, 12.0, 11.7, 11.4], target: 12, domain: [9.5, 15] },
  Voluntary: { values: [10.1, 10.3, 10.0, 9.8, 9.9, 9.5, 9.2, 9.0, 8.7, 8.9, 8.6, 8.3], target: 9, domain: [7, 11] },
};
const PCT = { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 } as const;

/** HR · medium. Rolling 12-month attrition against the target line; switch all or voluntary and scrub any month. */
export function AttritionWidget({ index }: { index?: number }) {
  const [mode, setMode] = useState<Mode>("All");
  const [hover, setHover] = useState<number | null>(null);
  const s = SERIES[mode];

  const data = useMemo(() => {
    const over = (i: number) => i >= 0 && i < s.values.length && s.values[i] > s.target;
    return s.values.map((v, i) => ({
      m: MONTHS[i],
      v,
      // Months above target are retraced in red, one point of overlap each side.
      over: over(i) || over(i - 1) || over(i + 1) ? v : null,
    }));
  }, [s]);

  const i = hover ?? data.length - 1;
  const point = data[i];
  const change = point.v - data[0].v;
  const above = point.v > s.target;

  return (
    <Widget size="medium" index={index} label="Attrition trend">
      <WidgetHeader
        icon={<ArrowTrendingDown20Filled />}
        tint="var(--ios-purple)"
        title="Attrition"
        subtitle="Rolling 12 months · 248 employees"
        extra={
          <Segmented
            size="small"
            value={mode}
            onChange={(v) => {
              setMode(v as Mode);
              setHover(null);
            }}
            options={["All", "Voluntary"]}
          />
        }
      />

      <div className="mt-1.5 flex items-baseline-last gap-2 whitespace-nowrap">
        <AnimatedNumber value={point.v / 100} format={PCT} className="text-[28px] leading-none font-semibold tracking-tight text-heading" />
        <span
          className={cn(
            "mb-0.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
            above ? "bg-ios-red/15 text-ios-red" : "bg-ios-green/15 text-ios-green",
          )}
        >
          {above ? "Above" : "Below"} {s.target}% target
        </span>
        <span className="mb-0.5 ml-auto text-[11px] text-tertiary tabular">
          {hover === null ? (
            <>
              <AnimatedNumber value={change} format={{ maximumFractionDigits: 1, minimumFractionDigits: 1, signDisplay: "always" }} /> pts
              since Dec
            </>
          ) : (
            point.m
          )}
        </span>
      </div>

      <ChartContainer
        config={{ v: { label: "Attrition", color: "var(--ios-purple)" } }}
        className="-mx-4 -mb-4 mt-auto aspect-auto h-[96px] w-[calc(100%+2rem)] cursor-crosshair"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const t = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
          setHover(Math.round(t * (data.length - 1)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <ComposedChart data={data} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="hr-attrition-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ios-purple)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--ios-purple)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="m" hide />
          <YAxis hide domain={s.domain} />
          <Tooltip content={() => null} cursor={{ stroke: "var(--ant-color-text-tertiary)", strokeDasharray: "3 3" }} />
          <Area
            key={`a-${mode}`}
            type="monotone"
            dataKey="v"
            stroke="var(--ios-purple)"
            strokeWidth={2}
            fill="url(#hr-attrition-fill)"
            animationDuration={1100}
            animationBegin={300 + (index ?? 0) * 60}
            activeDot={{ r: 4, fill: "var(--ios-purple)", stroke: "var(--widget-surface)", strokeWidth: 2 }}
          />
          <Line
            key={`o-${mode}`}
            type="monotone"
            dataKey="over"
            stroke="var(--ios-red)"
            strokeWidth={2.5}
            dot={false}
            activeDot={false}
            connectNulls={false}
            animationDuration={1100}
            animationBegin={300 + (index ?? 0) * 60}
          />
          <ReferenceLine
            y={s.target}
            stroke="var(--ant-color-text-tertiary)"
            strokeDasharray="4 3"
            label={{
              value: `Target ${s.target}%`,
              position: "insideTopRight",
              fill: "var(--ant-color-text-tertiary)",
              fontSize: 10,
              offset: 6,
              // The chart bleeds to the card edge; pull the label back inside the padding.
              dx: -10,
            }}
          />
        </ComposedChart>
      </ChartContainer>
    </Widget>
  );
}
