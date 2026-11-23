import { Timer20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Area, AreaChart, ReferenceArea, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { ChartContainer } from "@/registry/antuikit/ui/recharts-chart";
import { Segmented } from "@/registry/antuikit/ui/segmented";

type Service = "Lunch" | "Dinner";
const GOAL = 12;
/* Average ticket time in minutes per 30-minute slot. Dinner peaks past goal as the 19:00 seating lands. */
const SERVICE: Record<Service, { start: number; v: number[]; tickets: number }> = {
  Lunch: { start: 11 * 60, v: [7.2, 8.0, 9.6, 11.1, 12.4, 10.3, 8.8, 7.6], tickets: 96 },
  Dinner: { start: 17 * 60, v: [8.4, 9.1, 10.2, 11.6, 13.8, 15.2, 13.1, 11.4, 10.0, 9.2], tickets: 184 },
};
const TWO = { minimumIntegerDigits: 2 } as const;
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Restaurant · medium. Average ticket time per half hour against a 12-minute goal, lunch or dinner; scrub to read a slot, the dinner rush runs over. */
export function TicketTimesWidget({ index }: { index?: number }) {
  const [svc, setSvc] = useState<Service>("Dinner");
  const [hover, setHover] = useState<number | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const s = SERVICE[svc];
  const data = useMemo(() => s.v.map((v, i) => ({ v, t: hhmm(s.start + i * 30) })), [s]);
  const avg = s.v.reduce((a, b) => a + b, 0) / s.v.length;
  const value = hover === null ? avg : s.v[hover];
  const secs = Math.round(value * 60);
  const diff = secs - GOAL * 60;
  const overSlots = s.v.filter((v) => v > GOAL).length;

  return (
    <Widget size="medium" index={index} label="Ticket times">
      <WidgetHeader
        icon={<Timer20Filled />}
        tint="var(--ios-teal)"
        title="Ticket Times"
        subtitle={`Fire to bump · ${s.tickets} tickets today`}
        extra={
          <Segmented
            size="small"
            value={svc}
            onChange={(v) => {
              setSvc(v as Service);
              setHover(null);
            }}
            options={["Lunch", "Dinner"]}
            className="text-[11px]"
          />
        }
      />

      <div className="mt-1.5 flex h-[30px] items-baseline-last gap-2 whitespace-nowrap">
        <span className="flex items-baseline text-[28px] leading-none font-semibold tracking-tight text-heading">
          <AnimatedNumber value={Math.floor(secs / 60)} />
          <span className="text-tertiary">:</span>
          <AnimatedNumber value={secs % 60} format={TWO} />
        </span>
        <motion.span
          layout
          className={cn(
            "mb-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
            diff > 0 ? "bg-ios-red/15 text-ios-red" : "bg-ios-green/15 text-ios-green",
          )}
        >
          {diff > 0 ? "+" : "−"}
          <AnimatedNumber value={Math.floor(Math.abs(diff) / 60)} />:
          <AnimatedNumber value={Math.abs(diff) % 60} format={TWO} /> vs goal
        </motion.span>
        <span className="mb-0.5 ml-auto text-right text-[11px] leading-tight text-tertiary">
          {hover === null ? (
            <>
              Service avg ·{" "}
              <span className={cn("font-semibold", overSlots ? "text-ios-red" : "text-ios-green")}>
                <AnimatedNumber value={overSlots} /> slots over
              </span>
            </>
          ) : (
            <span className="tabular">
              {data[hover].t}–{hhmm(s.start + hover * 30 + 30)}
            </span>
          )}
        </span>
      </div>

      <ChartContainer
        config={{ v: { label: "Ticket time", color: "var(--ios-teal)" } }}
        className="-mx-1 mt-auto aspect-auto h-[88px] w-[calc(100%+0.5rem)] cursor-crosshair"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const t = Math.min(1, Math.max(0, (e.clientX - r.left - 4) / (r.width - 8)));
          setHover(Math.round(t * (data.length - 1)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <AreaChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="rt-tt-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ios-teal)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--ios-teal)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="t"
            tickLine={false}
            axisLine={false}
            height={14}
            interval={1}
            tick={{ fontSize: 9, fill: "var(--ant-color-text-tertiary)" }}
          />
          <YAxis hide domain={[5, 17]} />
          <ReferenceArea y1={GOAL} y2={17} fill="var(--ios-red)" fillOpacity={0.06} stroke="none" />
          <ReferenceLine
            y={GOAL}
            stroke="var(--ios-red)"
            strokeDasharray="3 3"
            strokeOpacity={0.7}
            label={{ value: "Goal 12:00", position: "insideTopLeft", fontSize: 9, fill: "var(--ant-color-text-tertiary)" }}
          />
          <Tooltip content={() => null} cursor={{ stroke: "var(--ant-color-text-tertiary)", strokeDasharray: "3 3" }} />
          <Area
            key={svc}
            type="monotone"
            dataKey="v"
            stroke="var(--ios-teal)"
            strokeWidth={2}
            fill="url(#rt-tt-fill)"
            baseValue="dataMin"
            animationBegin={svc === "Dinner" ? delay * 1000 : 0}
            animationDuration={900}
            animationEasing="ease-out"
            dot={(p: { cx?: number; cy?: number; index?: number; value?: number | number[] }) => {
              const v = typeof p.value === "number" ? p.value : 0;
              if (p.cx == null || p.cy == null || v <= GOAL) return <g key={`d${p.index}`} />;
              return (
                <circle
                  key={`d${p.index}`}
                  cx={p.cx}
                  cy={p.cy}
                  r={3}
                  fill="var(--ios-red)"
                  stroke="var(--widget-surface)"
                  strokeWidth={1.5}
                />
              );
            }}
            activeDot={{ r: 4, fill: "var(--ios-teal)", stroke: "var(--widget-surface)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ChartContainer>
    </Widget>
  );
}
