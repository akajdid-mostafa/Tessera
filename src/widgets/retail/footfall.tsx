import { PersonWalking20Filled } from "@fluentui/react-icons";
import { useEffect, useMemo, useState } from "react";
import { Bar, Cell, ComposedChart, Line, Tooltip, XAxis, YAxis } from "recharts";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { ChartContainer } from "@/registry/antuikit/ui/recharts-chart";

/* Door counts per hour, 09:00–21:00. It is 14:40, so the 14:00 bar is still filling. */
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const LAST_WEEK = [86, 142, 198, 264, 331, 352, 318, 296, 284, 301, 276, 188, 96];
const TODAY = [92, 151, 214, 288, 356, 236];
const NOW = TODAY.length - 1;
/** Last Monday's 14:00 hour up to 14:40, so the live hour compares like for like. */
const LW_SO_FAR = LAST_WEEK.slice(0, NOW).reduce((s, n) => s + n, 0) + Math.round(LAST_WEEK[NOW] * (40 / 60));

const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

/** Retail · medium. Hourly door counts against last Monday; the live hour keeps filling and you can scrub any hour. */
export function FootfallWidget({ index }: { index?: number }) {
  const [live, setLive] = useState(TODAY[NOW]);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => setLive((n) => n + 1 + Math.floor(Math.random() * 3)), 2600);
    return () => window.clearInterval(t);
  }, []);

  const data = useMemo(
    () =>
      HOURS.map((h, i) => ({
        h: String(h),
        today: i < NOW ? TODAY[i] : i === NOW ? live : null,
        lw: LAST_WEEK[i],
      })),
    [live],
  );
  const total = TODAY.slice(0, NOW).reduce((s, n) => s + n, 0) + live;

  const i = hover ?? NOW;
  const row = data[i];
  const value = row.today ?? row.lw;
  const base = hover === null ? LW_SO_FAR : row.lw;
  const shown = hover === null ? total : value;
  const delta = (shown - base) / base;
  const isFuture = row.today === null;
  const up = delta >= 0;

  return (
    <Widget size="medium" index={index} label="Footfall">
      <WidgetHeader
        icon={<PersonWalking20Filled />}
        tint="var(--ios-blue)"
        title="Footfall"
        subtitle="Oxford St · today vs last Monday"
        extra={
          <div className="flex items-center gap-3 text-[11px] whitespace-nowrap text-tertiary">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-[2px] bg-ios-blue" /> Today
            </span>
            <span className="flex items-center gap-1">
              <span className="h-0 w-3 border-t-2 border-dashed border-[var(--ant-color-text-tertiary)]" /> Last wk
            </span>
          </div>
        }
      />

      <div className="mt-1.5 flex items-baseline-last gap-2 whitespace-nowrap">
        <div className="leading-none">
          <AnimatedNumber value={shown} className="text-[28px] font-semibold tracking-tight text-heading" />
          <span className="ml-1 text-[12px] font-medium text-tertiary">{isFuture ? "last wk" : "visitors"}</span>
        </div>
        {isFuture ? null : (
          <span
            className={cn(
              "mb-0.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
              up ? "bg-ios-green/15 text-ios-green" : "bg-ios-red/15 text-ios-red",
            )}
          >
            <AnimatedNumber value={delta} format={{ style: "percent", maximumFractionDigits: 1, signDisplay: "always" }} />
          </span>
        )}
        <span className="mb-0.5 ml-auto text-[11px] text-tertiary tabular">
          {hover === null ? "So far · 14:40" : isFuture ? `${hh(HOURS[i])} · forecast` : i === NOW ? `${hh(HOURS[i])} · live` : hh(HOURS[i])}
        </span>
      </div>

      <ChartContainer
        config={{ today: { label: "Today", color: "var(--ios-blue)" }, lw: { label: "Last week", color: "var(--ant-color-text-tertiary)" } }}
        className="-mx-2 mt-auto aspect-auto h-[86px] w-[calc(100%+1rem)] cursor-crosshair"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const t = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
          setHover(Math.min(HOURS.length - 1, Math.floor(t * HOURS.length)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <ComposedChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap="18%">
          <XAxis
            dataKey="h"
            tickLine={false}
            axisLine={false}
            interval={0}
            height={15}
            tickSize={0}
            tickMargin={4}
            tick={{ fontSize: 10, fill: "var(--ant-color-text-tertiary)" }}
            tickFormatter={(v: string) => (Number(v) % 3 === 0 ? v : "")}
          />
          <YAxis hide domain={[0, 380]} />
          <Tooltip content={() => null} cursor={false} />
          <Bar dataKey="today" radius={[3, 3, 1, 1]} animationDuration={900} animationBegin={300 + (index ?? 0) * 60} isAnimationActive>
            {data.map((d, k) => (
              <Cell
                key={d.h}
                fill="var(--ios-blue)"
                fillOpacity={hover === null ? (k === NOW ? 0.6 : 1) : hover === k ? 1 : 0.35}
              />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="lw"
            stroke="var(--ant-color-text-tertiary)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ChartContainer>
    </Widget>
  );
}
