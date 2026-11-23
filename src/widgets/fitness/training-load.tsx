import { ArrowTrendingLines20Filled, Warning16Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useState } from "react";
import { Bar, BarChart, Cell, ReferenceArea, ReferenceLine, XAxis, YAxis } from "recharts";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { ChartContainer } from "@/registry/antuikit/ui/recharts-chart";
import { cn } from "@/registry/antuikit/lib/utils";

const LOW = 8;
const HIGH = 14;
/* Daily strain (0–21) for the fourteen days to today. A race-prep block pushes the last four days over the optimal band. */
const LOAD = [10.4, 12.8, 6.2, 13.1, 11.6, 4.8, 9.9, 13.6, 12.2, 7.4, 14.9, 15.8, 17.6, 16.4];
const DATA = LOAD.map((v, i) => {
  const d = new Date(2026, 10, 9 - (LOAD.length - 1 - i));
  return {
    v,
    day: d.toLocaleDateString("en-US", { weekday: "narrow" }),
    date: i === LOAD.length - 1 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
  };
});
const AVG7 = LOAD.slice(-7).reduce((a, b) => a + b, 0) / 7;
const AVG28 = 11.2;
const RIGHT = 22;

const tone = (v: number) =>
  v > 17 ? "var(--ios-red)" : v > HIGH ? "var(--ios-orange)" : v >= LOW ? "var(--ios-green)" : "var(--ant-color-fill)";

/** Fitness · medium. Two weeks of daily strain against the optimal band; hover a day to read it, the last four days flag overreaching. */
export function TrainingLoadWidget({ index }: { index?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const i = hover ?? DATA.length - 1;
  const p = DATA[i];
  const status = p.v > HIGH ? "Above optimal" : p.v >= LOW ? "Optimal" : "Light day";

  return (
    <Widget size="medium" index={index} label="Training load">
      <WidgetHeader
        icon={<ArrowTrendingLines20Filled />}
        tint="var(--ios-orange)"
        title="Training Load"
        subtitle="Daily strain · last 14 days"
        extra={
          <motion.span
            className="flex items-center gap-1 rounded-full bg-ios-orange/15 px-2 py-0.5 text-[11px] font-semibold text-ios-orange"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: [1, 1.06, 1] }}
            transition={{ opacity: { delay: delay + 0.6 }, scale: { delay: delay + 0.6, duration: 1.8, repeat: Infinity, repeatDelay: 1.4 } }}
          >
            <Warning16Filled className="size-3.5" />
            Overreaching
          </motion.span>
        }
      />

      <div className="mt-1.5 flex h-[30px] items-baseline-last gap-2 whitespace-nowrap">
        <AnimatedNumber
          value={p.v}
          format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
          className="text-[28px] leading-none font-semibold tracking-tight text-heading"
        />
        <div className="mb-0.5 leading-tight">
          <div className={cn("text-[11px] font-semibold", p.v > HIGH ? "text-ios-orange" : p.v >= LOW ? "text-ios-green" : "text-secondary")}>
            {status}
          </div>
          <div className="text-[10px] text-tertiary">{p.date}</div>
        </div>
        <div className="mb-0.5 ml-auto text-right leading-tight">
          <div className="text-[10px] text-tertiary">7-day avg</div>
          <div className="text-[12px] font-semibold text-secondary">
            <AnimatedNumber value={AVG7} format={{ maximumFractionDigits: 1 }} />
            <span className="ml-1 font-semibold text-ios-orange">+{Math.round((AVG7 / AVG28 - 1) * 100)}%</span>
            <span className="font-normal text-tertiary"> vs 28d</span>
          </div>
        </div>
      </div>

      <ChartContainer
        config={{ v: { label: "Strain", color: "var(--ios-green)" } }}
        className="mt-auto aspect-auto h-[86px] w-full cursor-crosshair"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const t = Math.min(0.999, Math.max(0, (e.clientX - r.left) / (r.width - RIGHT)));
          setHover(Math.floor(t * DATA.length));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <BarChart data={DATA} margin={{ top: 4, right: RIGHT, bottom: 0, left: 0 }} barCategoryGap="22%">
          <XAxis
            dataKey="day"
            interval={0}
            tickLine={false}
            axisLine={false}
            height={14}
            tick={{ fontSize: 9, fill: "var(--ant-color-text-tertiary)" }}
          />
          <YAxis hide domain={[0, 21]} />
          <ReferenceArea y1={LOW} y2={HIGH} fill="var(--ios-green)" fillOpacity={0.1} stroke="none" ifOverflow="visible" />
          <ReferenceLine
            y={HIGH}
            stroke="var(--ios-green)"
            strokeDasharray="3 3"
            strokeOpacity={0.6}
            label={{ value: "14", position: "right", fontSize: 9, fill: "var(--ant-color-text-tertiary)" }}
          />
          <ReferenceLine
            y={LOW}
            stroke="var(--ios-green)"
            strokeDasharray="3 3"
            strokeOpacity={0.6}
            label={{ value: "8", position: "right", fontSize: 9, fill: "var(--ant-color-text-tertiary)" }}
          />
          <Bar
            dataKey="v"
            radius={[3, 3, 3, 3]}
            animationBegin={delay * 1000}
            animationDuration={900}
            animationEasing="ease-out"
            isAnimationActive
          >
            {DATA.map((d, j) => (
              <Cell
                key={j}
                fill={tone(d.v)}
                fillOpacity={hover === null || hover === j ? 1 : 0.35}
                style={{ transition: "fill-opacity 160ms" }}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </Widget>
  );
}
