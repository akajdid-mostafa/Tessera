import { PlantGrass20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Area, AreaChart, ReferenceArea, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { ChartContainer } from "@/registry/antuikit/ui/recharts-chart";
import { Segmented } from "@/registry/antuikit/ui/segmented";

type Depth = 10 | 30 | 60;
const DEPTHS: Record<Depth, { full: number; refill: number; loss: number; gain: number; lag: number; start: number }> = {
  10: { full: 32, refill: 19, loss: 0.62, gain: 10, lag: 0, start: 27 },
  30: { full: 33, refill: 21, loss: 0.34, gain: 6, lag: 2, start: 28 },
  60: { full: 34, refill: 24, loss: 0.12, gain: 1.6, lag: 5, start: 28.5 },
};
const DAYS = ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"];
const IRRIGATIONS = [10, 34];
const STEP_H = 3;

/** Seven days at 3 h steps: a drydown that is steeper by day, irrigation pulses arriving later at depth. */
function series(depth: Depth) {
  const d = DEPTHS[depth];
  const out: { t: string; v: number }[] = [];
  let v = d.start;
  for (let i = 0; i < 56; i++) {
    const hour = (i * STEP_H) % 24;
    const day = hour >= 9 && hour <= 18;
    v -= d.loss * (day ? 1.4 : 0.35) * (0.9 + Math.sin(i * 1.3) * 0.1);
    if (IRRIGATIONS.some((k) => i === k + d.lag)) v += d.gain;
    v = Math.min(d.full + 1.2, v);
    out.push({ t: `${DAYS[Math.floor((i * STEP_H) / 24)]} ${String(hour).padStart(2, "0")}:00`, v: Math.round(v * 10) / 10 });
  }
  return out;
}

/** Agriculture · medium. Moisture at one probe depth between its refill and full lines; scrub to read any hour. */
export function SoilMoistureWidget({ index }: { index?: number }) {
  const [depth, setDepth] = useState<Depth>(10);
  const [hover, setHover] = useState<number | null>(null);
  const data = useMemo(() => series(depth), [depth]);
  const d = DEPTHS[depth];
  const last = data[data.length - 1].v;
  const point = data[hover ?? data.length - 1];
  const daysLeft = Math.max(0, (last - d.refill) / (d.loss * 4.2));
  const below = last <= d.refill;
  const soon = below || daysLeft < 1;

  return (
    <Widget size="medium" index={index} label="Soil moisture profile">
      <WidgetHeader
        icon={<PlantGrass20Filled />}
        tint="var(--ios-green)"
        title="Soil Moisture"
        subtitle="Probe P-07 · Block 4 almonds"
        extra={
          <Segmented
            size="small"
            value={depth}
            onChange={(v) => {
              setDepth(v as Depth);
              setHover(null);
            }}
            options={[
              { value: 10, label: "10 cm" },
              { value: 30, label: "30 cm" },
              { value: 60, label: "60 cm" },
            ]}
          />
        }
      />

      <div className="mt-1.5 flex items-baseline-last gap-2 whitespace-nowrap">
        <span className="text-[26px] leading-none font-semibold tracking-tight text-heading">
          <AnimatedNumber value={point.v} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
          <span className="ml-0.5 text-[12px] font-medium text-tertiary">% VWC</span>
        </span>
        <motion.span
          key={`${depth}-${soon}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "mb-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
            soon ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-secondary text-secondary",
          )}
        >
          {below ? "Below refill" : soon ? "Irrigate today" : `Refill in ${daysLeft.toFixed(1)} d`}
        </motion.span>
        <span className="mb-0.5 ml-auto text-[11px] text-tertiary tabular">{hover === null ? "Now" : point.t}</span>
      </div>

      <ChartContainer
        config={{ v: { label: "VWC", color: "var(--ios-teal)" } }}
        className="mt-auto aspect-auto h-[70px] w-full cursor-crosshair"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const t = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
          setHover(Math.round(t * (data.length - 1)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="soil-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ios-teal)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--ios-teal)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="t" hide />
          <YAxis hide domain={[d.refill - 7, d.full + 3]} />
          <ReferenceArea y1={d.refill} y2={d.full} fill="var(--ios-green)" fillOpacity={0.08} stroke="none" />
          <ReferenceLine
            y={d.full}
            stroke="var(--ios-blue)"
            strokeDasharray="3 3"
            strokeOpacity={0.7}
            label={{ value: "Full", position: "insideTopLeft", fontSize: 9, fill: "var(--ant-color-text-tertiary)" }}
          />
          <ReferenceLine
            y={d.refill}
            stroke="var(--ios-orange)"
            strokeDasharray="3 3"
            strokeOpacity={0.8}
            label={{ value: "Refill", position: "insideBottomLeft", fontSize: 9, fill: "var(--ant-color-text-tertiary)" }}
          />
          <Tooltip content={() => null} cursor={{ stroke: "var(--ant-color-text-tertiary)", strokeDasharray: "3 3" }} />
          <Area
            key={depth}
            type="monotone"
            dataKey="v"
            stroke="var(--ios-teal)"
            strokeWidth={2}
            fill="url(#soil-fill)"
            baseValue="dataMin"
            animationDuration={900}
            animationEasing="ease-out"
            isAnimationActive
            dot={(p: { cx?: number; cy?: number; index?: number }) =>
              p.index === data.length - 1 && p.cx != null && p.cy != null ? (
                <g key="last">
                  <motion.circle
                    cx={p.cx}
                    cy={p.cy}
                    r={4}
                    fill="var(--ios-teal)"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 2.6, opacity: 0 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    style={{ transformBox: "fill-box", transformOrigin: "center" }}
                  />
                  <circle cx={p.cx} cy={p.cy} r={3} fill="var(--ios-teal)" stroke="var(--widget-surface)" strokeWidth={1.5} />
                </g>
              ) : (
                <g key={`d${p.index}`} />
              )
            }
            activeDot={{ r: 4, fill: "var(--ios-teal)", stroke: "var(--widget-surface)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ChartContainer>
    </Widget>
  );
}
