import { Pulse20Filled } from "@fluentui/react-icons";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { enterDelay, sparkPath, useInterval } from "./_parts";

/** ISO 20816-3, group 2, rigid foundation: velocity RMS zone limits in mm/s. */
const ZONES = [
  { key: "A", to: 1.4, label: "New machine", fill: "transparent" },
  { key: "B", to: 2.8, label: "Unrestricted", fill: "var(--ant-color-fill-quaternary)" },
  { key: "C", to: 4.5, label: "Restricted", fill: "color-mix(in srgb, var(--ios-orange) 14%, transparent)" },
  { key: "D", to: 6, label: "Damage", fill: "color-mix(in srgb, var(--ios-red) 14%, transparent)" },
] as const;
const MAX = 6;
const PER_DAY = 6;
const DAYS = ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon"];

/** Seven days at 4-hour samples: flat in zone A/B, then a bearing starting to wear. */
const SEED = Array.from({ length: DAYS.length * PER_DAY }, (_, i) => {
  const wear = Math.max(0, i - 18) ** 1.6 * 0.0103;
  return +(1.52 + Math.sin(i * 1.3) * 0.08 + Math.cos(i * 0.7) * 0.06 + wear).toFixed(2);
});

const zoneOf = (v: number) => ZONES.find((z) => v < z.to) ?? ZONES[3];
const W = 220;
const H = 92;
const y = (v: number) => H - (v / MAX) * H;

/** Factory · medium. A pump bearing's vibration trend over ISO zone bands; the zone pointer settles with a damped wobble, scrub the trend to read any sample. */
export function VibrationWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [data, setData] = useState(SEED);
  const [hover, setHover] = useState<number | null>(null);
  const delay = enterDelay(index);

  useInterval(() => {
    setData((d) => [...d.slice(0, -1), +(3.08 + (Math.random() - 0.5) * 0.16).toFixed(2)]);
  }, 2600);

  const at = hover ?? data.length - 1;
  const value = data[at];
  const zone = zoneOf(value);
  const abnormal = zone.key === "C" || zone.key === "D";
  const tone = zone.key === "D" ? "var(--ios-red)" : "var(--ios-orange)";
  const d = sparkPath(data, W, H, 0, MAX);
  const crossed = data.findIndex((v) => v >= 2.8);
  const when = (i: number) =>
    i === data.length - 1 && hover === null
      ? "Now"
      : `${DAYS[Math.floor(i / PER_DAY)]} ${String((i % PER_DAY) * 4).padStart(2, "0")}:00`;

  return (
    <Widget size="medium" index={index} label="Bearing vibration">
      <WidgetHeader
        icon={<Pulse20Filled />}
        tint={abnormal ? "var(--ios-orange)" : "var(--ios-indigo)"}
        title="P-201 · Motor DE bearing"
        subtitle="Velocity RMS · ISO 20816-3"
        extra={
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap transition-colors duration-500",
              abnormal ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-tertiary text-secondary",
            )}
          >
            Zone {zone.key}
          </span>
        }
      />

      <div className="mt-2 flex min-h-0 flex-1 gap-3">
        <div className="flex w-[98px] shrink-0 flex-col whitespace-nowrap leading-tight">
          <div className="flex items-baseline gap-1">
            <AnimatedNumber
              value={value}
              format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
              className="text-[30px] leading-none font-semibold tracking-tight text-heading"
            />
            <span className="text-[12px] text-tertiary">mm/s</span>
          </div>
          <div className={cn("mt-1 truncate text-[11px] font-medium", abnormal ? "text-ios-orange" : "text-secondary")}>
            {zone.label}
          </div>

          {/* Zone bar: widths follow the ISO limits, the pointer rides the value. */}
          <div className="relative mt-2.5">
            <div className="flex h-1.5 gap-px overflow-hidden rounded-full">
              {ZONES.map((z, i) => {
                const from = i ? ZONES[i - 1].to : 0;
                return (
                  <span
                    key={z.key}
                    className={cn(
                      "h-full",
                      z.key === "C" ? "bg-ios-orange/40" : z.key === "D" ? "bg-ios-red/40" : i ? "bg-fill" : "bg-fill-secondary",
                    )}
                    style={{ width: `${((z.to - from) / MAX) * 100}%` }}
                  />
                );
              })}
            </div>
            <motion.svg
              width="8"
              height="5"
              viewBox="0 0 8 5"
              className="absolute top-2 -translate-x-1/2 text-heading"
              initial={{ left: "0%" }}
              animate={{ left: `${(value / MAX) * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 5, delay: hover === null ? delay : 0 }}
              aria-hidden
            >
              <path d="M4 0 8 5H0z" fill="currentColor" />
            </motion.svg>
          </div>

          <div className="mt-auto text-[11px] text-tertiary tabular">{when(at)}</div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div
            className="relative min-h-0 flex-1 cursor-crosshair"
            onPointerMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const t = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
              setHover(Math.round(t * (data.length - 1)));
            }}
            onPointerLeave={() => setHover(null)}
          >
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
              {ZONES.map((z, i) => {
                const from = i ? ZONES[i - 1].to : 0;
                return <rect key={z.key} x="0" width={W} y={y(z.to)} height={y(from) - y(z.to)} fill={z.fill} />;
              })}
              {[1.4, 2.8, 4.5].map((v) => (
                <line
                  key={v}
                  x1="0"
                  x2={W}
                  y1={y(v)}
                  y2={y(v)}
                  strokeDasharray="2 3"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                  className={v === 4.5 ? "stroke-ios-red/60" : "stroke-fill"}
                />
              ))}
              {crossed > 0 ? (
                <line
                  x1={(crossed / (data.length - 1)) * W}
                  x2={(crossed / (data.length - 1)) * W}
                  y1="0"
                  y2={H}
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                  className="stroke-ios-orange/50"
                />
              ) : null}
              <motion.path d={d}
                fill="none"
                stroke="var(--ant-color-text)"
                strokeWidth="1.75"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                initial={{ d: d, opacity: 0 }}
                animate={{ opacity: 1, d }}
                transition={{
                  opacity: { duration: 1.3, delay, ease: [0.22, 1, 0.36, 1] },
                  d: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                }}
              />
              {hover !== null ? (
                <line
                  x1={(hover / (data.length - 1)) * W}
                  x2={(hover / (data.length - 1)) * W}
                  y1="0"
                  y2={H}
                  strokeDasharray="3 3"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                  className="stroke-tertiary"
                />
              ) : null}
            </svg>

            {ZONES.map((z, i) => {
              const from = i ? ZONES[i - 1].to : 0;
              return (
                <span
                  key={z.key}
                  className="pointer-events-none absolute right-0.5 -translate-y-1/2 text-[9px] font-semibold text-tertiary"
                  style={{ top: `${(1 - (from + z.to) / 2 / MAX) * 100}%` }}
                >
                  {z.key}
                </span>
              );
            })}

            {/* Live sample (or the scrubbed one): a dot that breathes while it's "now". */}
            <span
              className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${hover === null ? 100 : (hover / (data.length - 1)) * 100}%`, top: `${(1 - value / MAX) * 100}%` }}
            >
              {hover === null && !reduce ? (
                <motion.span
                  className="absolute inset-0 rounded-full"
                  style={{ background: tone }}
                  animate={{ scale: [1, 2.6], opacity: [0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                />
              ) : null}
              <span
                className="absolute inset-0 rounded-full ring-2 ring-[var(--widget-surface)]"
                style={{ background: abnormal ? tone : "var(--ant-color-text)" }}
              />
            </span>
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-tertiary">
            {DAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </div>
      </div>
    </Widget>
  );
}
