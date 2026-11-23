import { Warning12Filled, WeatherSqualls20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useAnimationFrame, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/* A 4.2 MW, 150 m rotor class machine: cut-in 3 m/s, rated 12 m/s, cut-out 25 m/s,
 * rotor 4.9–12.3 rpm. Power and rotor speed come from the wind, not from a timer. */
const RATED_MW = 4.2;
const CUT_IN = 3;
const RATED = 12;
const CUT_OUT = 25;
const SCALE_MAX = 26;

type Turbine = { id: string; base: number; fault?: string };
const TURBINES: Turbine[] = [
  { id: "T-07", base: 9.6 },
  { id: "T-12", base: 8.4, fault: "Icing" },
  { id: "T-03", base: 2.6 },
];

const powerAt = (ws: number) => {
  if (ws < CUT_IN || ws >= CUT_OUT) return 0;
  if (ws >= RATED) return RATED_MW;
  return (RATED_MW * (ws ** 3 - CUT_IN ** 3)) / (RATED ** 3 - CUT_IN ** 3);
};
const rpmAt = (ws: number) => {
  if (ws >= CUT_OUT) return 0;
  if (ws < CUT_IN) return 0.8; // idling, blades pitched
  return Math.min(12.3, 4.9 + ((ws - CUT_IN) / (RATED - CUT_IN)) * 7.4);
};

/** Energy · small. The rotor turns at the rpm the wind gives it; tap to step through turbines. */
export function WindTurbineWidget({ index }: { index?: number }) {
  const [page, setPage] = useState(0);
  const [gust, setGust] = useState([0, 0, 0]);
  const reduce = useReducedMotion();

  useEffect(() => {
    const t = window.setInterval(() => {
      setGust((g) => g.map((v) => Math.max(-1.2, Math.min(1.2, v * 0.7 + (Math.random() - 0.5) * 0.9))));
    }, 1600);
    return () => window.clearInterval(t);
  }, []);

  const tb = TURBINES[page];
  const ws = Math.max(0, Math.round((tb.base + gust[page]) * 10) / 10);
  const stopped = !!tb.fault;
  const mw = stopped ? 0 : powerAt(ws);
  const rpm = stopped ? 0 : rpmAt(ws);
  const producing = mw > 0;
  const state = stopped ? `Stopped · ${tb.fault}` : producing ? "Producing" : "Ready · low wind";

  /* Rotor: integrate rpm every frame, easing toward the target so gusts spin it up gently. */
  const rotor = useRef<SVGGElement>(null);
  const angle = useRef(0);
  const speed = useRef(0);
  const target = useRef(rpm);
  target.current = rpm;
  useAnimationFrame((_, delta) => {
    if (reduce || !rotor.current) return;
    speed.current += (target.current - speed.current) * Math.min(1, delta / 1400);
    angle.current = (angle.current + speed.current * 6 * (delta / 1000)) % 360;
    rotor.current.setAttribute("transform", `rotate(${angle.current} 30 30)`);
  });

  return (
    <Widget
      size="small"
      index={index}
      label="Wind turbine"
      pressable
      onPress={() => setPage((p) => (p + 1) % TURBINES.length)}
    >
      <WidgetHeader
        icon={<WeatherSqualls20Filled />}
        tint={stopped ? "var(--ios-orange)" : "var(--ios-teal)"}
        title={tb.id}
        subtitle="Kestrel Ridge"
        extra={
          <span className="mt-1 flex gap-[3px]">
            {TURBINES.map((x, i) => (
              <motion.span
                key={x.id}
                layout
                className={cn("h-1.5 rounded-full", i === page ? "w-3 bg-secondary" : "w-1.5 bg-fill")}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            ))}
          </span>
        }
      />

      <div className="mt-1 flex min-h-0 flex-1 gap-2">
        <svg viewBox="0 0 60 116" className="h-full w-[46px] shrink-0 overflow-visible" preserveAspectRatio="xMidYMax meet" aria-hidden>
          <path d="M28.4 32 L31.6 32 L33.2 114 L26.8 114 Z" className="fill-fill" />
          <rect x="24" y="27" width="14" height="6" rx="3" className="fill-quaternary" />
          <g ref={rotor}>
            {[0, 120, 240].map((a) => (
              <path
                key={a}
                d="M30 30 C 28.2 22, 28.6 10, 30 2 C 31.8 10, 32.2 22, 30 30 Z"
                transform={`rotate(${a} 30 30)`}
                className={stopped ? "fill-quaternary" : "fill-secondary"}
              />
            ))}
          </g>
          <circle cx="30" cy="30" r="3" className="fill-heading" />
          {stopped ? (
            <motion.circle
              cx="30"
              cy="30"
              r="7"
              fill="none"
              stroke="var(--ios-orange)"
              strokeWidth="1.5"
              animate={{ opacity: [0.9, 0.2, 0.9] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
          ) : null}
        </svg>

        <div className="flex min-w-0 flex-1 flex-col whitespace-nowrap">
          <div className="leading-none">
            <AnimatedNumber
              value={mw}
              format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
              className="text-[24px] font-semibold tracking-tight text-heading"
            />
            <span className="ml-0.5 text-[12px] font-medium text-tertiary">MW</span>
          </div>
          <div className="mt-1 text-[11px] text-tertiary tabular">
            <AnimatedNumber value={rpm} format={{ maximumFractionDigits: 1, minimumFractionDigits: 1 }} /> rpm
          </div>

          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={state}
              initial={{ opacity: 0, y: 4, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className={cn(
                "mt-1.5 inline-flex w-fit items-center gap-1 truncate rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                stopped ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-tertiary text-secondary",
              )}
            >
              {stopped ? <Warning12Filled /> : null}
              {state}
            </motion.span>
          </AnimatePresence>

          <div className="mt-auto">
            <div className="mb-1 flex items-baseline justify-between text-[10px] leading-none">
              <span className="text-tertiary">Wind</span>
              <span className="font-semibold text-secondary tabular">
                <AnimatedNumber value={ws} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} /> m/s
              </span>
            </div>
            <div className="relative h-1.5 rounded-full bg-fill-secondary">
              <div
                className="absolute inset-y-0 rounded-full bg-fill"
                style={{ left: `${(CUT_IN / SCALE_MAX) * 100}%`, right: `${(1 - CUT_OUT / SCALE_MAX) * 100}%` }}
              />
              {[CUT_IN, RATED, CUT_OUT].map((v) => (
                <span
                  key={v}
                  className="absolute -top-0.5 h-2.5 w-px bg-quaternary"
                  style={{ left: `${(v / SCALE_MAX) * 100}%` }}
                />
              ))}
              <motion.span
                className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-heading ring-2 ring-[var(--widget-surface)]"
                initial={{ left: "0%" }}
                animate={{ left: `${(Math.min(ws, SCALE_MAX) / SCALE_MAX) * 100}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.1 }}
              />
            </div>
            <div className="relative mt-1 h-2.5 text-[9px] leading-none text-tertiary tabular">
              {[CUT_IN, RATED, CUT_OUT].map((v) => (
                <span key={v} className="absolute -translate-x-1/2" style={{ left: `${(v / SCALE_MAX) * 100}%` }}>
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Widget>
  );
}
