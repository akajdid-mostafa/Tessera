import { FoodGrains20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Bin = {
  id: string;
  crop: string;
  fill: number;
  mc: number;
  tons: number;
  temps: number[];
  co2: number;
  cables: number;
};

const BINS: Bin[] = [
  { id: "Bin 1", crop: "Yellow corn", fill: 0.86, mc: 14.6, tons: 742, temps: [8.0, 8.1, 8.0, 8.2, 8.1, 8.3, 8.4], co2: 430, cables: 5 },
  { id: "Bin 2", crop: "Soft red wheat", fill: 0.64, mc: 12.9, tons: 318, temps: [7.6, 7.5, 7.5, 7.4, 7.3, 7.3, 7.2], co2: 410, cables: 3 },
  { id: "Bin 3", crop: "Yellow corn", fill: 0.92, mc: 15.8, tons: 796, temps: [16.8, 17.3, 18.1, 18.9, 19.8, 20.7, 21.6], co2: 1150, cables: 5 },
];
const HOT = 2;
const HOT_LIMIT = 15;
const TICK_MS = 2600;

/** Agriculture · medium. Bins with fill, moisture and a 7-day temperature trace; Bin 3's hot spot keeps climbing until you aerate it. */
export function GrainBinsWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [fans, setFans] = useState(false);
  const [hot, setHot] = useState({ t: BINS[HOT].temps[6], co2: BINS[HOT].co2 });

  useEffect(() => {
    const t = window.setInterval(() => {
      setHot((h) =>
        fans
          ? { t: Math.max(12.4, h.t - 0.2), co2: Math.max(520, h.co2 - 40) }
          : { t: Math.min(24, h.t + 0.1), co2: Math.min(1600, h.co2 + 15) },
      );
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, [fans]);

  const alarm = hot.t > HOT_LIMIT;

  return (
    <Widget size="medium" index={index} label="Grain storage">
      <WidgetHeader
        icon={<FoodGrains20Filled />}
        tint="var(--ios-orange)"
        title="Grain Storage"
        subtitle="Kessler Farm · 1,856 t"
        extra={
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => setFans((f) => !f)}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors",
              fans ? "bg-fill-secondary text-heading" : "bg-ios-red/15 text-ios-red",
            )}
          >
            <FanGlyph spinning={fans} />
            {fans ? "Fans on · Bin 3" : "Aerate Bin 3"}
          </motion.button>
        }
      />

      <div className="mt-1.5 flex flex-1 flex-col divide-y-[0.5px] divide-split">
        {BINS.map((b, i) => {
          const isHot = i === HOT;
          const temps = isHot ? [...b.temps.slice(0, 6), hot.t] : b.temps;
          const now = temps[6];
          const delta = now - temps[0];
          const red = isHot && alarm;
          return (
            <Tooltip
              key={b.id}
              title={`CO₂ ${(isHot ? hot.co2 : b.co2).toLocaleString()} ppm · ${b.cables} cables · ${b.tons} t`}
              placement="left"
            >
              <div className="flex flex-1 items-center gap-2 whitespace-nowrap">
                <BinGlyph fill={b.fill} hot={red} delay={delay + i * 0.08} />
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-[13px] font-medium text-heading">
                    {b.id} <span className="font-normal text-tertiary">· {b.crop}</span>
                  </div>
                  <div className={cn("truncate text-[11px] tabular", red ? "text-ios-red" : "text-tertiary")}>
                    {red
                      ? `Hot spot · CO₂ ${hot.co2.toLocaleString()} ppm`
                      : `${Math.round(b.fill * 100)}% full · ${b.mc}% mc`}
                  </div>
                </div>
                <Spark values={temps} red={red} delay={delay + 0.2 + i * 0.1} />
                <div className="w-[46px] text-right text-[14px] font-semibold text-heading tabular">
                  <AnimatedNumber value={now} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} suffix="°" />
                </div>
                <span
                  className={cn(
                    "w-[44px] rounded-md py-0.5 text-center text-[11px] font-semibold tabular transition-colors",
                    red ? "bg-ios-red text-white" : "bg-fill-secondary text-secondary",
                  )}
                >
                  <AnimatedNumber value={delta} format={{ maximumFractionDigits: 1, minimumFractionDigits: 1, signDisplay: "always" }} />
                </span>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </Widget>
  );
}

/** A bin silhouette whose grain rises to its fill, two sensor cables, and a pulsing hot spot. */
function BinGlyph({ fill, hot, delay }: { fill: number; hot: boolean; delay: number }) {
  const H = 17;
  return (
    <svg viewBox="0 0 18 26" className="h-[26px] w-[18px] shrink-0" aria-hidden>
      <path d="M1 8.5 L9 1.5 L17 8.5 Z" fill="var(--ant-color-fill)" />
      <rect x="1" y="8.5" width="16" height={H} rx="1.5" fill="var(--ant-color-fill-secondary)" />
      <motion.rect
        x="1"
        width="16"
        rx="1.5"
        fill="var(--ios-yellow)"
        fillOpacity={0.55}
        initial={{ height: 0, y: 8.5 + H }}
        animate={{ height: H * fill, y: 8.5 + H * (1 - fill) }}
        transition={{ delay, type: "spring", stiffness: 120, damping: 18 }}
      />
      <path d="M6 9.5 V24.5 M12 9.5 V24.5" stroke="var(--widget-surface)" strokeOpacity={0.6} strokeWidth={0.8} />
      {hot ? (
        <motion.circle
          cx="12"
          cy="18"
          r="2.4"
          fill="var(--ios-red)"
          animate={{ opacity: [1, 0.35, 1], scale: [1, 1.3, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
      ) : null}
    </svg>
  );
}

function Spark({ values, red, delay }: { values: number[]; red: boolean; delay: number }) {
  const W = 52;
  const H = 18;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = Math.max(1.2, hi - lo);
  const mid = (lo + hi) / 2;
  const d = values
    .map((v, i) => `${i ? "L" : "M"}${((i / (values.length - 1)) * W).toFixed(1)} ${(H / 2 - ((v - mid) / span) * (H - 4)).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[18px] w-[52px] shrink-0 overflow-visible" aria-hidden>
      <motion.path
        d={d}
        fill="none"
        stroke={red ? "var(--ios-red)" : "var(--ant-color-text-tertiary)"}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

/** Four fan blades; they spin while aeration runs. */
function FanGlyph({ spinning }: { spinning: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 16 16"
      className="size-3.5"
      animate={spinning ? { rotate: 360 } : { rotate: 0 }}
      transition={spinning ? { duration: 1.2, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
      aria-hidden
    >
      {[0, 90, 180, 270].map((r) => (
        <path key={r} d="M8 8 C7 5 7.5 2 9.5 2 C11 2.4 10.5 5.5 8 8 Z" fill="currentColor" transform={`rotate(${r} 8 8)`} />
      ))}
      <circle cx="8" cy="8" r="1.4" fill="currentColor" />
    </motion.svg>
  );
}
