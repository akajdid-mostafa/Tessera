import { Money20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Area, AreaChart, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { ChartContainer } from "@/registry/antuikit/ui/recharts-chart";
import { DeltaChip, COMPACT, usd } from "./_parts-a";

type Point = { key: string; label: string; nov: boolean; bookings: number; revenue: number };

/** The dashboard's 30-day trend points, Oct 11 → Nov 9 (today), in USD. */
const SEED: Point[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2026, 9, 11 + i);
  const weekend = d.getDay() === 0 || d.getDay() === 6;
  const bookings = Math.max(4, Math.round(10 + Math.sin(i * 0.9) * 3.4 + Math.cos(i * 0.37) * 2.6 + (weekend ? 3 : 0) + i * 0.06));
  const ticket = 425 + Math.sin(i * 1.3) * 62 + Math.cos(i * 0.5) * 31;
  return {
    key: d.toISOString().slice(0, 10),
    label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    nov: d.getMonth() === 10,
    bookings,
    revenue: Math.round(bookings * ticket),
  };
});
const NOV_1 = SEED.findIndex((p) => p.nov);
/** October 1–9, the same stretch of the previous month. */
const PREV_PERIOD = 37_164;
const TODAY = SEED.length - 1;

/** Tour sales · medium. Month-to-date revenue in USD against last month with a 30-day area; scrub the crosshair to read any day's bookings and revenue while new bookings land live. */
export function RevenueMonthWidget({ index }: { index?: number }) {
  const [points, setPoints] = useState(SEED);
  const [hover, setHover] = useState<number | null>(null);
  const [landed, setLanded] = useState<{ id: number; amount: number } | null>(null);

  useEffect(() => {
    let n = 0;
    const t = window.setInterval(() => {
      n += 1;
      const amount = 240 + ((n * 371) % 620);
      setPoints((ps) => ps.map((p, i) => (i === TODAY ? { ...p, bookings: p.bookings + 1, revenue: p.revenue + amount } : p)));
      setLanded({ id: n, amount });
    }, 6_500);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!landed) return;
    const t = window.setTimeout(() => setLanded(null), 1_600);
    return () => window.clearTimeout(t);
  }, [landed]);

  const month = points.slice(NOV_1);
  const mtd = month.reduce((s, p) => s + p.revenue, 0);
  const mtdBookings = month.reduce((s, p) => s + p.bookings, 0);
  const change = (mtd - PREV_PERIOD) / PREV_PERIOD;
  const point = hover === null ? null : points[hover];
  const data = points.map((p, i) => ({
    ...p,
    oct: i <= NOV_1 ? p.revenue : null,
    cur: i >= NOV_1 ? p.revenue : null,
  }));

  return (
    <Widget size="medium" index={index} label="Revenue this month">
      <WidgetHeader
        icon={<Money20Filled />}
        tint="var(--ios-green)"
        title="Revenue · November"
        subtitle={<span className="tabular">vs Oct 1–9 · {usd(PREV_PERIOD)}</span>}
        extra={<DeltaChip delta={change} percent polarity="up" className="mt-0.5" />}
      />

      <div className="relative mt-2 flex items-baseline-last justify-between gap-2">
        <AnimatedNumber
          value={point ? point.revenue : mtd}
          prefix="$"
          format={COMPACT}
          className="text-[28px] leading-none font-semibold tracking-tight text-heading"
        />
        <AnimatePresence>
          {landed && !point ? (
            <motion.span
              key={landed.id}
              initial={{ opacity: 0, y: 6, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
              className="mr-auto mb-1 rounded-full bg-ios-green/15 px-2 py-0.5 text-[11px] font-semibold text-ios-green tabular"
            >
              +{usd(landed.amount)}
            </motion.span>
          ) : null}
        </AnimatePresence>
        <div className="mb-0.5 shrink-0 text-right text-[11px] leading-[14px]">
          <div className="font-medium text-heading tabular">{point ? point.label : "Month to date"}</div>
          <div className="text-tertiary tabular">
            <AnimatedNumber value={point ? point.bookings : mtdBookings} className="font-semibold text-secondary" />{" "}
            bookings
          </div>
        </div>
      </div>

      <ChartContainer
        config={{
          cur: { label: "November", color: "var(--ios-green)" },
          oct: { label: "October", color: "var(--ant-color-text-tertiary)" },
        }}
        className="-mx-4 -mb-4 mt-auto aspect-auto h-[90px] w-[calc(100%+2rem)] cursor-crosshair"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const t = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
          setHover(Math.round(t * (points.length - 1)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="rm-cur" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ios-green)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--ios-green)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="rm-oct" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ant-color-text-tertiary)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--ant-color-text-tertiary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="key" hide />
          <YAxis hide domain={[0, "dataMax + 800"]} />
          <ReferenceLine x={SEED[NOV_1].key} stroke="var(--ant-color-split)" strokeDasharray="3 3" />
          {point ? (
            <ReferenceLine y={point.revenue} stroke="var(--ant-color-text-tertiary)" strokeDasharray="3 3" />
          ) : null}
          <Tooltip content={() => null} cursor={{ stroke: "var(--ant-color-text-tertiary)", strokeDasharray: "3 3" }} />
          <Area
            type="monotone"
            dataKey="oct"
            stroke="var(--ant-color-text-tertiary)"
            strokeWidth={1.5}
            fill="url(#rm-oct)"
            connectNulls={false}
            animationDuration={900}
            activeDot={{ r: 3.5, fill: "var(--ant-color-text-tertiary)", stroke: "var(--widget-surface)", strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="cur"
            stroke="var(--ios-green)"
            strokeWidth={2}
            fill="url(#rm-cur)"
            connectNulls={false}
            animationDuration={900}
            animationBegin={300}
            activeDot={{ r: 4, fill: "var(--ios-green)", stroke: "var(--widget-surface)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ChartContainer>
    </Widget>
  );
}
