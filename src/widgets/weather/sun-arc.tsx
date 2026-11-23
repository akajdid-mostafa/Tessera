import { ArrowDown12Filled, ArrowUp12Filled, WeatherSunny20Filled, WeatherSunnyLow20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";

/* San Francisco, November 9: sunrise 6:42, sunset 4:58, the sun peaks near 33°. */
const SUNRISE = 6 + 42 / 60;
const SUNSET = 16 + 58 / 60;
const NOON = (SUNRISE + SUNSET) / 2;
const PEAK = 33;
const GOLD = 6;
const C0 = Math.cos((2 * Math.PI * ((SUNSET - SUNRISE) / 2)) / 24);
const elevation = (t: number) => ((Math.cos((2 * Math.PI * (t - NOON)) / 24) - C0) / (1 - C0)) * PEAK;
/** Hours from solar noon until the sun sits 6° up: the edge of golden hour. */
const GOLD_OFFSET = (Math.acos((GOLD / PEAK) * (1 - C0) + C0) * 24) / (2 * Math.PI);
const GOLDEN = NOON + GOLD_OFFSET;

const VW = 144;
const VH = 60;
const HZ = 40;
const X = (t: number) => (t / 24) * VW;
/** Above the horizon at true scale; the night side is compressed so it reads as a dip. */
const Y = (e: number) => HZ - (e >= 0 ? e : e * 0.3);
const PATH = Array.from({ length: 97 }, (_, i) => {
  const t = i / 4;
  return `${i ? "L" : "M"}${X(t).toFixed(2)} ${Y(elevation(t)).toFixed(2)}`;
}).join(" ");

const nowHours = () => {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
};
function clock(t: number) {
  let mins = Math.round(t * 60) % (24 * 60);
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  return { h12: h % 12 || 12, m: mins % 60, pm: h >= 12 };
}
function until(from: number, to: number) {
  const mins = Math.round((((to - from) % 24) + 24) % 24 * 60);
  const h = Math.floor(mins / 60);
  return h ? `in ${h}h ${mins % 60}m` : `in ${mins % 60} min`;
}

/** Weather · small. The sun rides its day arc at the real time and breathes; scrub the arc to read any hour. */
export function SunArcWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const uid = useId().replace(/:/g, "");
  const [now, setNow] = useState(nowHours);
  const [scrub, setScrub] = useState<number | null>(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setSettled(true), (delay + 1.4) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    const t = window.setInterval(() => setNow(nowHours()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  const t = scrub ?? now;
  const e = elevation(t);
  const up = e >= 0;
  const setting = now >= SUNRISE && now < SUNSET;
  const event = setting ? SUNSET : SUNRISE;
  const shown = clock(scrub ?? event);

  const title = scrub !== null ? "Sun at" : setting ? "Sunset" : "Sunrise";
  const subtitle =
    scrub !== null
      ? e >= GOLD
        ? `${Math.round(e)}° above horizon`
        : e >= 0
          ? "Golden hour"
          : `${Math.round(-e)}° below horizon`
      : until(now, event);

  return (
    <Widget size="small" index={index} label="Sunrise and sunset">
      <WidgetHeader
        icon={setting ? <WeatherSunnyLow20Filled /> : <WeatherSunny20Filled />}
        tint="var(--ios-orange)"
        title={title}
        subtitle={subtitle}
      />

      <div className="mt-1.5 flex items-baseline gap-1 text-[26px] leading-none font-semibold tracking-tight text-heading">
        <span className="tabular">
          <AnimatedNumber value={shown.h12} />:
          <AnimatedNumber value={shown.m} format={{ minimumIntegerDigits: 2 }} />
        </span>
        <span className="text-[13px] font-medium text-tertiary">{shown.pm ? "PM" : "AM"}</span>
      </div>

      <div
        className="relative mt-auto cursor-ew-resize"
        onPointerMove={(ev) => {
          const r = ev.currentTarget.getBoundingClientRect();
          setScrub(Math.min(23.98, Math.max(0, ((ev.clientX - r.left) / r.width) * 24)));
        }}
        onPointerLeave={() => setScrub(null)}
      >
        <svg viewBox={`0 0 ${VW} ${VH}`} className="block w-full overflow-visible" aria-hidden>
          <defs>
            <clipPath id={`day-${uid}`}>
              <rect x="0" y="-20" width={VW} height={HZ - GOLD + 20} />
            </clipPath>
            <clipPath id={`gold-${uid}`}>
              <rect x="0" y={HZ - GOLD} width={VW} height={GOLD} />
            </clipPath>
            <clipPath id={`night-${uid}`}>
              <rect x="0" y={HZ} width={VW} height={VH - HZ} />
            </clipPath>
            <linearGradient id={`band-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ios-orange)" stopOpacity={0} />
              <stop offset="100%" stopColor="var(--ios-orange)" stopOpacity={0.3} />
            </linearGradient>
          </defs>

          <rect x="0" y={HZ - GOLD} width={VW} height={GOLD} fill={`url(#band-${uid})`} />
          <line x1="0" x2={VW} y1={HZ} y2={HZ} stroke="var(--ant-color-split)" strokeWidth="1" />

          {[
            { clip: "night", stroke: "var(--ant-color-text-tertiary)", dash: "2 3", w: 1.5 },
            { clip: "gold", stroke: "var(--ios-orange)", dash: undefined, w: 2.2 },
            { clip: "day", stroke: "var(--ios-yellow)", dash: undefined, w: 2.2 },
          ].map((s) => (
            <g key={s.clip} clipPath={`url(#${s.clip}-${uid})`}>
              <motion.path
                d={PATH}
                fill="none"
                stroke={s.stroke}
                strokeWidth={s.w}
                strokeDasharray={s.dash}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay, duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
              />
            </g>
          ))}

          {scrub !== null ? (
            <line
              x1={X(scrub)}
              x2={X(scrub)}
              y1={2}
              y2={VH}
              stroke="var(--ant-color-text-tertiary)"
              strokeDasharray="2 2"
              strokeWidth="1"
            />
          ) : null}

          {up ? (
            <motion.circle
              fill="var(--ios-yellow)"
              initial={{ cx: X(t), cy: HZ, r: 0, opacity: 0 }}
              animate={{ cx: X(t), cy: Y(e), r: [8, 12, 8], opacity: [0.28, 0.12, 0.28] }}
              transition={{
                cx: { type: "spring", stiffness: 260, damping: 28 },
                cy: { type: "spring", stiffness: 260, damping: 28 },
                r: { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: delay + 1 },
                opacity: { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: delay + 1 },
              }}
            />
          ) : null}
          <motion.circle
            r="4.5"
            stroke="var(--widget-surface)"
            strokeWidth="1.5"
            initial={{ cx: X(t), cy: HZ, opacity: 0, fill: up ? "var(--ios-yellow)" : "var(--ant-color-text-tertiary)" }}
            animate={{
              cx: X(t),
              cy: Y(e),
              opacity: 1,
              fill: up ? "var(--ios-yellow)" : "var(--ant-color-text-tertiary)",
            }}
            transition={{ type: "spring", stiffness: 260, damping: 28, delay: settled ? 0 : delay + 0.6 }}
          />
        </svg>
      </div>

      <div className="mt-1 flex justify-between text-[10px] text-tertiary tabular">
        <span className="flex items-center gap-0.5">
          <ArrowUp12Filled className="text-ios-yellow" />
          {fmt(SUNRISE)}
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-ios-orange" />
          {fmt(GOLDEN)}
        </span>
        <span className="flex items-center gap-0.5">
          <ArrowDown12Filled className="text-ios-orange" />
          {fmt(SUNSET)}
        </span>
      </div>
    </Widget>
  );
}

function fmt(t: number) {
  const c = clock(t);
  return `${c.h12}:${String(c.m).padStart(2, "0")}`;
}
