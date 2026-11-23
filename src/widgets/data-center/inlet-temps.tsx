import { Temperature20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const RACKS = ["B01", "B02", "B03", "B04", "B05", "B06", "B07", "B08"];
/** Bottom, middle and top inlet sensors per rack, °C. */
const BASE = [
  [20.4, 21.2, 22.6],
  [20.8, 21.9, 23.4],
  [21.0, 22.3, 23.9],
  [20.6, 21.7, 23.1],
  [21.4, 22.8, 24.6],
  [22.1, 24.0, 26.7],
  [21.2, 22.6, 24.2],
  [20.2, 21.0, 22.2],
];
const SENSOR = ["bottom", "mid", "top"];
const LOW = 18;
const HIGH = 27;

const W = 336;
const H = 84;
const LABEL_Y = H + 12;
const AXIS = 20;
const Y_MIN = 16;
const Y_MAX = 32;
const y = (t: number) => 3 + ((Y_MAX - t) / (Y_MAX - Y_MIN)) * (H - 6);
const COL = (W - AXIS) / RACKS.length;
const x = (i: number) => AXIS + COL * (i + 0.5);

function readings(step: number) {
  return BASE.map((r, i) =>
    r.map((t, s) => {
      // B06's top sensor sits under a hot-aisle leak and breathes across 27 °C.
      if (i === 5 && s === 2) return t + 1.25 * Math.sin(step * 0.55);
      return t + 0.3 * Math.sin(step * 0.7 + i * 1.3 + s);
    }),
  );
}

const level = (t: number) => (t > 30 ? "crit" : t > HIGH ? "high" : "ok");

/** Data center · medium. Inlet sensors of eight racks plotted against the ASHRAE 18–27 °C band; dots rise in, drift live, and hover picks a rack. */
export function InletTempsWidget({ index }: { index?: number }) {
  const [step, setStep] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => setStep((s) => s + 1), 2400);
    return () => window.clearInterval(t);
  }, []);

  const data = readings(step);
  const hottest = data.reduce((best, r, i) => (Math.max(...r) > Math.max(...data[best]) ? i : best), 0);
  const active = hover ?? hottest;
  const max = Math.max(...data[active]);
  const maxSensor = SENSOR[data[active].indexOf(max)];
  const outCount = data.flat().filter((t) => t > HIGH).length;
  const delay = 0.3 + (index ?? 0) * 0.06;

  return (
    <Widget size="medium" index={index} label="Rack inlet temperatures">
      <WidgetHeader
        icon={<Temperature20Filled />}
        tint={outCount ? "var(--ios-orange)" : "var(--ios-teal)"}
        title="Cold Aisle B"
        subtitle={outCount ? `${outCount} sensor${outCount > 1 ? "s" : ""} above 27 °C` : "All inlets in ASHRAE band"}
        extra={
          <div className="text-right leading-none whitespace-nowrap">
            <div className="text-[11px] text-tertiary">
              {RACKS[active]} · {maxSensor}
            </div>
            <div className={cn("mt-1 text-[20px] font-semibold tracking-tight", max > HIGH ? "text-ios-orange" : "text-heading")}>
              <AnimatedNumber value={max} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
              <span className="text-[12px] font-medium text-tertiary">°C</span>
            </div>
          </div>
        }
      />

      <div className="mt-auto">
        <svg viewBox={`0 0 ${W} ${LABEL_Y}`} className="block h-[96px] w-full overflow-visible" onMouseLeave={() => setHover(null)}>
          <rect x={AXIS} y={y(HIGH)} width={W - AXIS} height={y(LOW) - y(HIGH)} rx="6" className="fill-ios-green/10" />
          {[HIGH, LOW].map((t) => (
            <g key={t}>
              <line x1={AXIS} x2={W} y1={y(t)} y2={y(t)} strokeDasharray="3 3" strokeWidth="1" className="stroke-ios-green/50" />
              <text x={0} y={y(t) + 3} className="fill-tertiary text-[9px] tabular">
                {t}°
              </text>
            </g>
          ))}
          <text x={0} y={y(31) + 3} className="fill-tertiary text-[9px] tabular">
            31°
          </text>

          {data.map((r, i) => {
            const lo = Math.min(...r);
            const hi = Math.max(...r);
            const on = i === active;
            return (
              <g key={RACKS[i]}>
                <rect
                  x={x(i) - COL / 2 + 2}
                  y={0}
                  width={COL - 4}
                  height={LABEL_Y}
                  rx="6"
                  className={cn("transition-colors duration-mid", on && hover !== null ? "fill-fill-tertiary" : "fill-transparent")}
                  onMouseEnter={() => setHover(i)}
                />
                <motion.line
                  x1={x(i)}
                  x2={x(i)}
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="pointer-events-none stroke-fill"
                  initial={{ y1: y(Y_MIN), y2: y(Y_MIN) }}
                  animate={{ y1: y(hi), y2: y(lo) }}
                  transition={{ type: "spring", stiffness: 90, damping: 16, delay: delay + i * 0.05 }}
                />
                {r.map((t, s) => {
                  const lv = level(t);
                  return (
                    <g key={s} className="pointer-events-none">
                      {lv !== "ok" ? (
                        <motion.circle
                          cx={x(i)}
                          cy={y(t)}
                          r={6}
                          className={lv === "crit" ? "fill-ios-red/30" : "fill-ios-orange/30"}
                          animate={{ scale: [1, 1.6, 1], opacity: [0.9, 0.2, 0.9] }}
                          style={{ transformBox: "fill-box", transformOrigin: "center" }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        />
                      ) : null}
                      <motion.circle
                        cx={x(i)}
                        r={on ? 3.6 : 3}
                        className={cn(
                          "transition-colors duration-mid",
                          lv === "crit" ? "fill-ios-red" : lv === "high" ? "fill-ios-orange" : on ? "fill-heading" : "fill-secondary",
                        )}
                        initial={{ cy: y(Y_MIN), opacity: 0 }}
                        animate={{ cy: y(t), opacity: 1 }}
                        transition={{ type: "spring", stiffness: 110, damping: 15, delay: step === 0 ? delay + i * 0.05 + s * 0.04 : 0 }}
                      />
                    </g>
                  );
                })}
                <text
                  x={x(i)}
                  y={LABEL_Y - 1}
                  textAnchor="middle"
                  className={cn(
                    "pointer-events-none text-[9px] tabular transition-colors duration-mid",
                    hi > HIGH ? "fill-ios-orange font-semibold" : on && hover !== null ? "fill-heading" : "fill-tertiary",
                  )}
                >
                  {RACKS[i]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </Widget>
  );
}
