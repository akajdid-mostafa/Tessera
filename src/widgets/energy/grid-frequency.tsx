import { Pulse20Filled, Warning12Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/* A ±0.2 Hz window around 50 Hz. The ±50 mHz deadband is shaded, the ±100 mHz
 * alert limits are ticked; colour only appears when the pointer leaves them. */
const NOMINAL = 50;
const SPAN = 0.2;
const DEADBAND = 0.05;
const ALERT = 0.1;
const CX = 60;
const CY = 60;
const R = 48;

/** A generator trip: the dip, the arrest and the slow primary-response recovery. */
const TRIP = [49.968, 49.921, 49.889, 49.874, 49.881, 49.898, 49.917, 49.936, 49.952, 49.966, 49.978, 49.988];
const TRIP_EVERY = 34;

const toT = (hz: number) => Math.min(1, Math.max(0, (hz - (NOMINAL - SPAN)) / (2 * SPAN)));
const pointAt = (t: number) => {
  const a = Math.PI * (1 - t);
  return { x: CX + R * Math.cos(a), y: CY - R * Math.sin(a) };
};
const arc = (t0: number, t1: number) => {
  const a = pointAt(Math.min(t0, t1));
  const b = pointAt(Math.max(t0, t1));
  return `M ${a.x} ${a.y} A ${R} ${R} 0 0 1 ${b.x} ${b.y}`;
};

/** Energy · small. A live frequency pointer on a ±0.2 Hz arc; tap for today's deadband compliance. */
export function GridFrequencyWidget({ index }: { index?: number }) {
  const [hz, setHz] = useState(50.012);
  const [page, setPage] = useState(0);
  const [range, setRange] = useState({ min: 49.912, max: 50.071 });
  const tick = useRef(0);
  const trip = useRef(-1);
  const last = useRef(hz);

  useEffect(() => {
    const t = window.setInterval(() => {
      tick.current += 1;
      if (trip.current < 0 && tick.current % TRIP_EVERY === 14) trip.current = 0;
      const f = last.current;
      let v: number;
      if (trip.current >= 0) {
        v = TRIP[trip.current] + (Math.random() - 0.5) * 0.002;
        trip.current = trip.current + 1 >= TRIP.length ? -1 : trip.current + 1;
      } else {
        v = f + (NOMINAL - f) * 0.25 + (Math.random() - 0.5) * 0.016;
      }
      const r = Math.round(v * 1000) / 1000;
      last.current = r;
      setHz(r);
      setRange((g) => ({ min: Math.min(g.min, r), max: Math.max(g.max, r) }));
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  const dev = hz - NOMINAL;
  const alarm = Math.abs(dev) > ALERT;
  const live = page === 0;

  const spring = useSpring(toT(NOMINAL - SPAN), { stiffness: 140, damping: 20 });
  useEffect(() => {
    spring.set(toT(hz));
  }, [hz, spring]);
  const mx = useTransform(spring, (t) => pointAt(t).x);
  const my = useTransform(spring, (t) => pointAt(t).y);

  return (
    <Widget
      size="small"
      index={index}
      label="Grid frequency"
      pressable
      onPress={() => setPage((p) => (p + 1) % 2)}
    >
      <WidgetHeader
        icon={<Pulse20Filled />}
        tint={alarm ? "var(--ios-orange)" : "var(--ios-indigo)"}
        title="Frequency"
        subtitle={live ? "Grid · 50 Hz" : "Today · 00–now"}
      />

      <div className="relative mt-1.5 h-[82px]">
        <svg viewBox="0 0 120 72" className="size-full" aria-hidden>
          <path d={arc(0, 1)} fill="none" strokeWidth="6" strokeLinecap="round" className="stroke-fill-secondary" />
          <path
            d={arc(toT(NOMINAL - DEADBAND), toT(NOMINAL + DEADBAND))}
            fill="none"
            strokeWidth="6"
            className="stroke-fill"
          />
          {[NOMINAL - ALERT, NOMINAL + ALERT, NOMINAL].map((v) => {
            const a = Math.PI * (1 - toT(v));
            const r0 = v === NOMINAL ? R - 6 : R + 4;
            const r1 = v === NOMINAL ? R - 10 : R + 8;
            return (
              <line
                key={v}
                x1={CX + r0 * Math.cos(a)}
                y1={CY - r0 * Math.sin(a)}
                x2={CX + r1 * Math.cos(a)}
                y2={CY - r1 * Math.sin(a)}
                strokeWidth="1.5"
                strokeLinecap="round"
                className="stroke-quaternary"
              />
            );
          })}
          {live && alarm ? (
            <path
              d={arc(toT(NOMINAL), toT(hz))}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              stroke="var(--ios-orange)"
            />
          ) : null}
          {!live ? (
            <motion.path
              d={arc(toT(range.min), toT(range.max))}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              stroke="var(--ios-indigo)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.85 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : null}
          <motion.circle
            cx={mx}
            cy={my}
            r="5"
            strokeWidth="2.5"
            stroke="var(--widget-surface)"
            fill={alarm ? "var(--ios-orange)" : "var(--ant-color-text-heading)"}
            animate={{ opacity: live ? 1 : 0.25 }}
          />
          <text x="12" y="71" textAnchor="middle" fontSize="8" className="fill-tertiary tabular">
            49.8
          </text>
          <text x="108" y="71" textAnchor="middle" fontSize="8" className="fill-tertiary tabular">
            50.2
          </text>
        </svg>

        <div className="absolute inset-x-0 bottom-1.5 text-center leading-none">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            >
              {live ? (
                <AnimatedNumber
                  value={hz}
                  format={{ minimumFractionDigits: 3, maximumFractionDigits: 3 }}
                  className={cn(
                    "text-[22px] font-semibold tracking-tight",
                    alarm ? "text-ios-orange" : "text-heading",
                  )}
                />
              ) : (
                <AnimatedNumber
                  value={0.994}
                  format={{ style: "percent", maximumFractionDigits: 1, minimumFractionDigits: 1 }}
                  className="text-[22px] font-semibold tracking-tight text-heading"
                />
              )}
              <div className="mt-0.5 text-[10px] text-tertiary">{live ? "Hz" : "in deadband"}</div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-1 text-[11px] leading-none whitespace-nowrap">
        {live ? (
          <span className={cn("flex items-center gap-1 tabular", alarm ? "font-semibold text-ios-orange" : "text-tertiary")}>
            {alarm ? <Warning12Filled /> : null}
            Δf {dev >= 0 ? "+" : "−"}
            {Math.abs(Math.round(dev * 1000))} mHz
          </span>
        ) : (
          <span className="truncate text-tertiary tabular">
            {range.min.toFixed(3)}–{range.max.toFixed(3)}
          </span>
        )}
        <span className="flex shrink-0 gap-1">
          {[0, 1].map((i) => (
            <motion.span
              key={i}
              layout
              className={cn("h-1.5 rounded-full", i === page ? "w-3.5 bg-secondary" : "w-1.5 bg-fill")}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          ))}
        </span>
      </div>
    </Widget>
  );
}
