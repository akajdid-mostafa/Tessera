import { CalendarCheckmark20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { DeltaChip } from "./_parts-a";

/** Tue Nov 3 → Mon Nov 9 (today). The last value is replaced by the live count. */
const WEEK = [19, 26, 22, 31, 28, 24, 22];
const DAYS = ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon"];
const DATES = [3, 4, 5, 6, 7, 8, 9];
const TODAY = WEEK.length - 1;

/** New bookings that land while the widget is open, in the order they arrive. */
const INCOMING = [
  { product: "Montezuma", pax: 2 },
  { product: "Sedona–Oak Creek", pax: 4 },
  { product: "Rafting", pax: 3 },
  { product: "3-day package", pax: 2 },
  { product: "Cooking workshop", pax: 5 },
  { product: "Sedona–Oak Creek", pax: 2 },
];
const TICK_MS = 4600;
const CAP = 36;

/* The sparkline is drawn at its real pixel size (the small content box is 164 wide). */
const W = 164;
const H = 40;
const PAD_X = 6;
const xAt = (i: number) => PAD_X + (i * (W - PAD_X * 2)) / TODAY;

function curve(values: number[]) {
  const lo = Math.min(...values) - 2;
  const hi = Math.max(...values) + 2;
  const pts = values.map((v, i) => [xAt(i), 4 + (1 - (v - lo) / (hi - lo)) * (H - 10)] as const);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x1 - x0) / 2;
    d += ` C${x0 + mx},${y0} ${x1 - mx},${y1} ${x1},${y1}`;
  }
  return { d, pts, area: `${d} L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z` };
}

/** Tour sales · small. Today's reservations against yesterday with a polarity-aware chip; new bookings tick in live and the week's sparkline scrubs. */
export function ReservationsTodayWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [live, setLive] = useState({ count: WEEK[TODAY], seq: 417, last: { product: "Sedona–Oak Creek", pax: 2 } });
  const [pulse, setPulse] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => {
      setLive((s) => {
        if (s.count >= CAP) return s;
        const seq = s.seq + 1;
        return { count: s.count + 1, seq, last: INCOMING[seq % INCOMING.length] };
      });
      setPulse((p) => p + 1);
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!pulse) return;
    const t = window.setTimeout(() => setPulse(0), 1400);
    return () => window.clearTimeout(t);
  }, [pulse]);

  const series = WEEK.map((v, i) => (i === TODAY ? live.count : v));
  const { d, pts, area } = curve(series);
  const day = hover ?? TODAY;
  const value = series[day];
  const delta = day === 0 ? 0 : value - series[day - 1];
  const [dx, dy] = pts[day];

  return (
    <Widget
      size="small"
      index={index}
      label="Reservations today"
      glow={{ mode: "pulse", colors: ["#0A84FF", "#64D2FF", "#0A84FF"], blur: 18, duration: 1.4 }}
      glowActive={pulse > 0}
    >
      <WidgetHeader
        icon={<CalendarCheckmark20Filled />}
        tint="var(--ios-blue)"
        title="Reservations"
        subtitle={<span className="tabular">{hover === null ? "Today · Mon, Nov 9" : `${DAYS[day]}, Nov ${DATES[day]}`}</span>}
      />

      <div className="mt-2 flex items-baseline-last gap-2">
        <AnimatedNumber
          value={value}
          className="text-[32px] leading-none font-semibold tracking-tight text-heading"
        />
        <div className="mb-1 flex flex-col items-start gap-0.5">
          <DeltaChip delta={delta} polarity="up" />
          <span className="text-[10px] leading-none whitespace-nowrap text-tertiary">
            {day === 0 ? "first of week" : day === TODAY ? "vs yesterday" : `vs ${DAYS[day - 1]}`}
          </span>
        </div>
      </div>

      <div className="relative mt-1 h-[14px] overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={live.seq}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="truncate text-[11px] leading-[14px] text-tertiary tabular"
          >
            <span className="font-semibold text-ios-blue">+1</span> KY-26-0{live.seq} · {live.last.product} ×{live.last.pax}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-[40px] w-full overflow-visible"
          onPointerLeave={() => setHover(null)}
          aria-label="Reservations over the last 7 days"
        >
          <defs>
            <linearGradient id="rt-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ios-blue)" stopOpacity={0.32} />
              <stop offset="100%" stopColor="var(--ios-blue)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <motion.path
            d={area}
            fill="url(#rt-fill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.6, duration: 0.6 }}
          />
          <motion.path
            d={d}
            fill="none"
            stroke="var(--ios-blue)"
            strokeWidth={2}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
          {hover !== null ? (
            <line x1={dx} x2={dx} y1={0} y2={H} stroke="var(--ant-color-text-tertiary)" strokeDasharray="2 2" />
          ) : null}
          {hover === null ? (
            <motion.circle
              cx={pts[TODAY][0]}
              r={4}
              fill="var(--ios-blue)"
              initial={{ cy: pts[TODAY][1], scale: 1, opacity: 0.5 }}
              animate={{ cy: pts[TODAY][1], scale: [1, 2.4], opacity: [0.5, 0] }}
              transition={{ scale: { duration: 1.8, repeat: Infinity }, opacity: { duration: 1.8, repeat: Infinity }, cy: { type: "spring", stiffness: 200, damping: 20 } }}
            />
          ) : null}
          <motion.circle
            r={3.5}
            fill="var(--ios-blue)"
            stroke="var(--widget-surface)"
            strokeWidth={2}
            initial={{ cx: dx, cy: dy, opacity: 0 }}
            animate={{ cx: dx, cy: dy, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 26, opacity: { delay: delay + 1 } }}
          />
          {series.map((_, i) => (
            <rect
              key={i}
              x={xAt(i) - (W - PAD_X * 2) / TODAY / 2}
              width={(W - PAD_X * 2) / TODAY}
              y={0}
              height={H}
              fill="transparent"
              onPointerEnter={() => setHover(i)}
            />
          ))}
        </svg>
        <div className="mt-1 flex justify-between">
          {DAYS.map((label, i) => (
            <span
              key={label + i}
              className={cn(
                "w-3 text-center text-[10px] leading-3 transition-colors",
                i === day ? "font-semibold text-heading" : "text-tertiary",
              )}
            >
              {label[0]}
            </span>
          ))}
        </div>
      </div>
    </Widget>
  );
}
