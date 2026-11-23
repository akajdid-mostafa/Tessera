import { BatteryCharge20Filled } from "@fluentui/react-icons";
import { motion, useReducedMotion } from "motion/react";
import { type PointerEvent, useId, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";

/* Wh/km for each of the last 50 km: highway, a climb, a regen descent, then town. */
const WH = [
  158, 162, 166, 163, 160, 168, 172, 170, 165, 161, 158, 155, 160, 167, 175, 182, 190, 204, 216, 224, 219, 208, 196,
  180, 150, 118, 92, 74, 88, 120, 148, 156, 160, 158, 154, 150, 147, 152, 158, 163, 166, 170, 168, 164, 160, 157, 159,
  162, 165, 163, 161,
];
const SOC = 68;
const USABLE_WH = 100_000 * (SOC / 100);
const RATED_KM = 455;
const AVG = Math.round(WH.reduce((a, b) => a + b, 0) / WH.length);
const rangeAt = (whKm: number) => Math.round(USABLE_WH / whKm);
/** The trailing 10 km average at a point, which is what a projection is built on. */
const paceAt = (i: number) => {
  const run = WH.slice(Math.max(0, i - 9), i + 1);
  return Math.round(run.reduce((a, b) => a + b, 0) / run.length);
};

const VW = 132;
const VH = 44;
const LO = 60;
const HI = 240;
const yOf = (v: number) => VH - 2 - ((v - LO) / (HI - LO)) * (VH - 4);
const xOf = (i: number) => (i / (WH.length - 1)) * VW;
const LINE = WH.map((v, i) => `${i ? "L" : "M"}${xOf(i).toFixed(1)} ${yOf(v).toFixed(1)}`).join("");
const AVG_Y = yOf(AVG);

/** In-car · small. Charge and projected range over a 50 km consumption trace; scrub the trace to see the range at that pace. */
export function RangeEnergyWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const id = `re${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [hover, setHover] = useState<number | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * (WH.length - 1));
    setHover(Math.min(WH.length - 1, Math.max(0, i)));
  };

  const pace = hover === null ? AVG : paceAt(hover);

  return (
    <Widget size="small" index={index} label="Range and energy">
      <WidgetHeader
        icon={<BatteryCharge20Filled />}
        tint="var(--ios-green)"
        title="Range"
        subtitle={hover === null ? "Projected · last 50 km" : `At ${pace} Wh/km pace`}
      />

      <div className="mt-2 flex items-baseline gap-1 text-heading">
        <AnimatedNumber value={rangeAt(pace)} className="text-[30px] leading-none font-semibold tracking-tight" />
        <span className="text-[12px] font-medium text-tertiary">km</span>
        <span className="ml-auto text-[11px] text-tertiary tabular">Rated {RATED_KM}</span>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-fill-secondary">
          <motion.div
            className="absolute inset-y-0 left-0 overflow-hidden rounded-full bg-ios-green"
            initial={{ width: 0 }}
            animate={{ width: `${SOC}%` }}
            transition={{ delay, type: "spring", stiffness: 90, damping: 18 }}
          >
            {reduce ? null : (
              <motion.span
                className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.65),transparent)] bg-[length:32px_100%] bg-no-repeat"
                initial={{ x: "-30%" }}
                animate={{ x: "130%" }}
                transition={{ delay: delay + 1, duration: 2.2, repeat: Infinity, repeatDelay: 2.4, ease: "easeInOut" }}
              />
            )}
          </motion.div>
        </div>
        <span className="text-[12px] font-semibold text-heading tabular">{SOC}%</span>
      </div>

      <div
        className="relative mt-2 min-h-0 flex-1 cursor-crosshair touch-none"
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
          <defs>
            <clipPath id={`${id}-reveal`}>
              <motion.rect
                x="0"
                y="-4"
                height={VH + 8}
                initial={{ width: 0 }}
                animate={{ width: VW }}
                transition={{ delay: delay + 0.1, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              />
            </clipPath>
            <clipPath id={`${id}-worse`}>
              <rect x="0" y="-4" width={VW} height={AVG_Y + 4} />
            </clipPath>
            <clipPath id={`${id}-better`}>
              <rect x="0" y={AVG_Y} width={VW} height={VH - AVG_Y + 4} />
            </clipPath>
          </defs>
          <line x1="0" x2={VW} y1={AVG_Y} y2={AVG_Y} strokeDasharray="3 3" strokeWidth="1" vectorEffect="non-scaling-stroke" className="stroke-[var(--ant-color-text-quaternary)]" />
          <g clipPath={`url(#${id}-reveal)`}>
            {(["worse", "better"] as const).map((k) => (
              <path
                key={k}
                d={LINE}
                clipPath={`url(#${id}-${k})`}
                fill="none"
                stroke={k === "worse" ? "var(--ios-orange)" : "var(--ios-green)"}
                strokeWidth="1.8"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>
        </svg>
        {hover !== null ? (
          <>
            <span className="pointer-events-none absolute inset-y-0 w-px bg-[var(--ant-color-text-tertiary)]" style={{ left: `${(hover / (WH.length - 1)) * 100}%` }} />
            <span
              className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--widget-surface)]"
              style={{
                left: `${(hover / (WH.length - 1)) * 100}%`,
                top: `${(yOf(WH[hover]) / VH) * 100}%`,
                background: WH[hover] > AVG ? "var(--ios-orange)" : "var(--ios-green)",
              }}
            />
          </>
        ) : null}
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[11px] leading-none whitespace-nowrap text-tertiary">
        <span className="tabular">{hover === null ? "50 km ago" : `${WH.length - 1 - hover} km ago`}</span>
        <span>
          {hover === null ? "avg " : ""}
          <span className="font-semibold text-secondary tabular">{hover === null ? AVG : WH[hover]}</span> Wh/km
        </span>
      </div>
    </Widget>
  );
}
