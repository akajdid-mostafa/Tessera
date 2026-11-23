import { DataLine20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { walk } from "./_parts";

const N = 36;
const STEP_MIN = 40; // one sample every 40 minutes, 24 h across
const WARN = -12;
const ALARM = -14.4; // 10G-LR receiver sensitivity
const TOP = 0;
const BOTTOM = -16;
const W = 120;
const H = 40;
const yOf = (dbm: number) => 2 + ((TOP - dbm) / (TOP - BOTTOM)) * (H - 4);
const xOf = (i: number) => (i / (N - 1)) * W;
const ONE_DP = { minimumFractionDigits: 1, maximumFractionDigits: 1 } as const;

const SEED = Array.from({ length: N }, (_, i) => -5.9 + Math.sin(i * 0.45) * 0.35 + Math.cos(i * 1.3) * 0.15);

function clock(i: number) {
  const now = 14 * 60 + 40;
  const t = (((now - (N - 1 - i) * STEP_MIN) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

/** Network · small. SFP receive power over 24 h against its warning and LOS thresholds; the trace draws in, ticks live, and dragging across it reads any hour. */
export function OpticalRxWidget({ index }: { index?: number }) {
  const [data, setData] = useState(SEED);
  const [scrub, setScrub] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const t = window.setInterval(() => {
      setData((d) => [...d.slice(1), walk(d[d.length - 1] + (-5.9 - d[d.length - 1]) * 0.3, 0.25, -7, -5)]);
    }, 2600);
    return () => window.clearInterval(t);
  }, []);

  const i = scrub ?? N - 1;
  const value = data[i];
  const line = data.map((v, k) => `${k ? "L" : "M"}${xOf(k).toFixed(1)} ${yOf(v).toFixed(1)}`).join(" ");
  const margin = value - ALARM;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return;
    setScrub(Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * (N - 1)));
  };

  return (
    <Widget size="small" index={index} label="Optical receive power">
      <WidgetHeader icon={<DataLine20Filled />} tint="var(--ios-purple)" title="Te1/1/49 Rx" subtitle="10G-LR · to dist-sw-2" />

      <div className="mt-2 flex items-baseline gap-1 leading-none">
        <AnimatedNumber value={value} format={ONE_DP} className="text-[26px] font-semibold tracking-tight text-heading" />
        <span className="text-[12px] font-medium text-tertiary">dBm</span>
      </div>
      <div className="mt-1 truncate text-[11px] text-tertiary tabular">
        {scrub === null ? (
          <>
            <AnimatedNumber value={margin} format={ONE_DP} className="font-semibold text-secondary" /> dB above LOS
          </>
        ) : (
          <span className="font-semibold text-ios-purple">{clock(i)}</span>
        )}
      </div>

      <div className="mt-auto">
        <div className="relative h-[40px]">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 size-full cursor-crosshair touch-none overflow-visible"
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setScrub(null)}
          >
            <rect x={0} y={yOf(ALARM)} width={W} height={H - yOf(ALARM)} rx={3} className="fill-ios-red/10" />
            <line x1={0} x2={W} y1={yOf(ALARM)} y2={yOf(ALARM)} strokeDasharray="2 2" strokeWidth={1} vectorEffect="non-scaling-stroke" className="stroke-ios-red/60" />
            <line x1={0} x2={W} y1={yOf(WARN)} y2={yOf(WARN)} strokeDasharray="2 2" strokeWidth={1} vectorEffect="non-scaling-stroke" className="stroke-ios-orange/60" />
            <motion.path
              d={line}
              fill="none"
              strokeWidth={1.75}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="stroke-ios-purple"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 + (index ?? 0) * 0.06 }}
            />
            {scrub !== null ? (
              <line x1={xOf(i)} x2={xOf(i)} y1={0} y2={H} strokeWidth={1} vectorEffect="non-scaling-stroke" className="stroke-tertiary" />
            ) : null}
          </svg>
          {/* The marker sits outside the stretched SVG so it stays round. */}
          <motion.span
            className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ios-purple ring-2 ring-[var(--widget-surface)]"
            style={{ top: `${(yOf(value) / H) * 100}%`, left: `${(i / (N - 1)) * 100}%` }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.2 + (index ?? 0) * 0.06, type: "spring", stiffness: 400, damping: 20 }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[9px] text-tertiary">
          <span>24 h</span>
          <span className="text-ios-red/80">LOS −14.4</span>
          <span>Now</span>
        </div>
      </div>
    </Widget>
  );
}
