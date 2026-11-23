import { BuildingHome20Filled } from "@fluentui/react-icons";
import { useMemo, useState } from "react";
import { Area, AreaChart, Tooltip, XAxis, YAxis } from "recharts";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { ChartContainer } from "@/registry/antuikit/ui/recharts-chart";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { cn } from "@/registry/antuikit/lib/utils";

type Range = "1Y" | "3Y" | "5Y";
const MONTHS: Record<Range, number> = { "1Y": 12, "3Y": 36, "5Y": 60 };

/** Sixty months of a valuation that mostly climbs, with a believable wobble. */
const HISTORY = (() => {
  const out: { date: string; value: number }[] = [];
  let v = 742_000;
  const start = new Date(2021, 10, 1);
  for (let i = 0; i < 60; i++) {
    v *= 1 + 0.009 + Math.sin(i * 1.7) * 0.012 + Math.cos(i * 0.6) * 0.006;
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    out.push({
      date: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      value: Math.round(v / 500) * 500,
    });
  }
  return out;
})();

const MONEY = {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
} as const;

/** Real estate · medium. Scrub the chart to read any month, Stocks-style. */
export function PropertyValueWidget({ index }: { index?: number }) {
  const [range, setRange] = useState<Range>("1Y");
  const [hover, setHover] = useState<number | null>(null);
  const data = useMemo(() => HISTORY.slice(-MONTHS[range]), [range]);
  const first = data[0].value;
  const point = data[hover ?? data.length - 1];
  const change = ((point.value - first) / first) * 100;
  const up = change >= 0;

  return (
    <Widget size="medium" index={index} label="Property valuation">
      <WidgetHeader
        icon={<BuildingHome20Filled />}
        tint="var(--ios-orange)"
        title="Pacific Heights · 3BR"
        subtitle="San Francisco, CA · 1,960 ft²"
        extra={
          <Segmented
            size="small"
            value={range}
            onChange={(v) => {
              setRange(v as Range);
              setHover(null);
            }}
            options={["1Y", "3Y", "5Y"]}
            className="text-[11px]"
          />
        }
      />

      <div className="mt-2 flex items-baseline-last gap-2">
        <AnimatedNumber
          value={point.value}
          format={MONEY}
          className="text-[30px] leading-none font-semibold tracking-tight text-heading"
        />
        <span
          className={cn(
            "mb-0.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
            up ? "bg-ios-green/15 text-ios-green" : "bg-ios-red/15 text-ios-red",
          )}
        >
          <AnimatedNumber
            value={change / 100}
            format={{
              style: "percent",
              maximumFractionDigits: 1,
              signDisplay: "always",
            }}
          />
        </span>
        <span className="mb-0.5 ml-auto text-[11px] text-tertiary tabular">
          {hover === null ? "Estimated today" : point.date}
        </span>
      </div>

      <ChartContainer
        config={{ value: { label: "Value", color: "var(--ios-orange)" } }}
        className="-mx-4 -mb-4 mt-auto aspect-auto h-[78px] w-[calc(100%+2rem)] cursor-crosshair"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const t = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
          setHover(Math.round(t * (data.length - 1)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <AreaChart data={data} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="pv-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ios-orange)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--ios-orange)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis hide domain={["dataMin - 20000", "dataMax + 10000"]} />
          <Tooltip
            content={() => null}
            cursor={{ stroke: "var(--ant-color-text-tertiary)", strokeDasharray: "3 3" }}
          />
          <Area
            key={range}
            type="monotone"
            dataKey="value"
            stroke="var(--ios-orange)"
            strokeWidth={2}
            fill="url(#pv-fill)"
            animationDuration={900}
            animationEasing="ease-out"
            activeDot={{
              r: 4,
              fill: "var(--ios-orange)",
              stroke: "var(--widget-surface)",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ChartContainer>
    </Widget>
  );
}
