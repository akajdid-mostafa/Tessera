import { Wallet20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Bar, BarChart, XAxis } from "recharts";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/registry/antuikit/ui/recharts-chart";
import { Progress } from "@/registry/antuikit/ui/progress";
import { Segmented } from "@/registry/antuikit/ui/segmented";

const SERIES = {
  travel: { label: "Travel", color: "var(--ios-blue)" },
  meals: { label: "Meals", color: "var(--ios-orange)" },
  software: { label: "Software", color: "var(--ios-purple)" },
  office: { label: "Office", color: "var(--ios-mint)" },
} as const;
type Key = keyof typeof SERIES;
const KEYS = Object.keys(SERIES) as Key[];

const DATA = {
  Week: ["M", "T", "W", "T", "F", "S", "S"].map((d, i) => ({
    d,
    travel: [420, 0, 610, 180, 260, 0, 0][i],
    meals: [84, 120, 96, 140, 210, 60, 38][i],
    software: [0, 249, 0, 0, 99, 0, 0][i],
    office: [36, 58, 0, 120, 42, 0, 0][i],
  })),
  Month: ["W1", "W2", "W3", "W4", "W5"].map((d, i) => ({
    d,
    travel: [1240, 980, 1610, 720, 380][i],
    meals: [420, 512, 388, 610, 140][i],
    software: [349, 0, 1150, 99, 0][i],
    office: [180, 260, 90, 312, 44][i],
  })),
} as const;
type Period = keyof typeof DATA;
const BUDGET = { Week: 3200, Month: 12000 } as const;

/** Finance · large. Tap a category to drop it from the stack; the total and budget re-flow. */
export function SpendingWidget({ index }: { index?: number }) {
  const [period, setPeriod] = useState<Period>("Week");
  const [off, setOff] = useState<Set<Key>>(new Set());
  const on = KEYS.filter((k) => !off.has(k));
  const rows = DATA[period];

  const total = useMemo(
    () => rows.reduce((s, r) => s + on.reduce((a, k) => a + r[k], 0), 0),
    [rows, on],
  );
  const share = total / BUDGET[period];

  const toggle = (k: Key) =>
    setOff((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else if (on.length > 1) next.add(k);
      return next;
    });

  return (
    <Widget size="large" index={index} label="Card spending" glow={{ blur: 28, duration: 8 }}>
      <WidgetHeader
        icon={<Wallet20Filled />}
        tint="var(--ios-blue)"
        title="Corporate Card"
        subtitle="Visa •••• 4821"
        extra={
          <Segmented size="small" value={period} onChange={(v) => setPeriod(v as Period)} options={["Week", "Month"]} />
        }
      />

      <div className="mt-4 text-[12px] text-tertiary">Spent this {period.toLowerCase()}</div>
      <AnimatedNumber
        value={total}
        format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
        className="text-[34px] leading-none font-semibold tracking-tight text-heading"
      />

      <div className="mt-3 flex flex-wrap gap-1.5">
        {KEYS.map((k) => {
          const active = !off.has(k);
          return (
            <motion.button
              key={k}
              type="button"
              onClick={() => toggle(k)}
              whileTap={{ scale: 0.92 }}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors duration-mid",
                active ? "bg-fill-secondary text-heading" : "bg-transparent text-tertiary ring-1 ring-inset ring-widget-ring",
              )}
            >
              <motion.span
                className="size-2 rounded-full"
                animate={{ scale: active ? 1 : 0.6, opacity: active ? 1 : 0.4 }}
                style={{ background: SERIES[k].color }}
              />
              {SERIES[k].label}
            </motion.button>
          );
        })}
      </div>

      <ChartContainer config={SERIES} className="mt-2 aspect-auto min-h-0 flex-1">
        <BarChart data={rows as unknown as Record<string, number | string>[]} margin={{ top: 8, right: 0, bottom: 0, left: 0 }} barCategoryGap="28%">
          <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
          <ChartTooltip
            cursor={{ fill: "var(--ant-color-fill-quaternary)", radius: 6 }}
            content={<ChartTooltipContent formatter={(v) => `$${Number(v).toLocaleString()}`} />}
          />
          {on.map((k) => (
            <Bar
              key={`${period}-${k}`}
              dataKey={k}
              stackId="s"
              fill={SERIES[k].color}
              stroke="var(--widget-surface)"
              strokeWidth={2}
              radius={4}
              animationDuration={700}
            />
          ))}
        </BarChart>
      </ChartContainer>

      <div className="mt-2">
        <div className="mb-1 flex justify-between text-[11px] text-tertiary tabular">
          <span>Budget ${BUDGET[period].toLocaleString()}</span>
          <AnimatedNumber value={Math.min(share, 9.99)} format={{ style: "percent", maximumFractionDigits: 0 }} className="font-semibold text-secondary" />
        </div>
        <Progress
          percent={Math.round(share * 100)}
          showInfo={false}
          size={{ height: 6 }}
          strokeColor={share > 0.9 ? "var(--ios-red)" : { from: "var(--ios-blue)", to: "var(--ios-purple)" }}
          railColor="var(--ant-color-fill-secondary)"
        />
      </div>
    </Widget>
  );
}
