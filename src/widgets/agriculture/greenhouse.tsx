import { LeafThree20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useSpring, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Key = "vpd" | "temp" | "rh" | "co2";
const METRICS: { key: Key; label: string; unit: string; min: number; max: number; lo: number; hi: number; digits: number }[] = [
  { key: "vpd", label: "VPD", unit: "kPa", min: 0.2, max: 1.8, lo: 0.8, hi: 1.0, digits: 2 },
  { key: "temp", label: "Air", unit: "°C", min: 14, max: 32, lo: 21, hi: 25, digits: 1 },
  { key: "rh", label: "Humidity", unit: "%", min: 40, max: 100, lo: 65, hi: 85, digits: 0 },
  { key: "co2", label: "CO₂", unit: "ppm", min: 400, max: 1200, lo: 800, hi: 1000, digits: 0 },
];

const CX = 60;
const CY = 60;
const R = 50;
const at = (t: number) => {
  const a = Math.PI * (1 - t);
  return { x: CX + R * Math.cos(a), y: CY - R * Math.sin(a) };
};
const arc = (t0: number, t1: number) => {
  const a = at(t0);
  const b = at(t1);
  return `M${a.x.toFixed(2)} ${a.y.toFixed(2)} A${R} ${R} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
};

/** Saturation pressure deficit from air temperature and relative humidity (Tetens). */
const vpdOf = (t: number, rh: number) => 0.6108 * Math.exp((17.27 * t) / (t + 237.3)) * (1 - rh / 100);

/** Agriculture · small. Live greenhouse climate on a half gauge with its target band; tap to page VPD, air, humidity and CO₂. */
export function GreenhouseWidget({ index }: { index?: number }) {
  const [page, setPage] = useState(0);
  const [air, setAir] = useState({ temp: 23.4, rh: 69, co2: 870 });

  useEffect(() => {
    const t = window.setInterval(() => {
      setAir((a) => ({
        temp: Math.round((a.temp + (23.4 - a.temp) * 0.3 + (Math.random() - 0.5) * 0.4) * 10) / 10,
        rh: Math.round(a.rh + (69 - a.rh) * 0.3 + (Math.random() - 0.5) * 2.4),
        co2: Math.round(a.co2 + (870 - a.co2) * 0.3 + (Math.random() - 0.5) * 40),
      }));
    }, 3000);
    return () => window.clearInterval(t);
  }, []);

  const values: Record<Key, number> = { ...air, vpd: Math.round(vpdOf(air.temp, air.rh) * 100) / 100 };
  const m = METRICS[page];
  const v = values[m.key];
  const norm = (x: number) => Math.min(1, Math.max(0, (x - m.min) / (m.max - m.min)));
  const inBand = v >= m.lo && v <= m.hi;

  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 300 + (index ?? 0) * 60);
    return () => window.clearTimeout(id);
  }, [index]);
  const target = ready ? norm(v) : 0;
  const t = useSpring(0, { stiffness: 90, damping: 16 });
  useEffect(() => {
    t.set(target);
  }, [t, target]);
  const kx = useTransform(t, (x) => at(x).x);
  const ky = useTransform(t, (x) => at(x).y);

  return (
    <Widget
      size="small"
      index={index}
      label="Greenhouse climate"
      pressable
      onPress={() => setPage((p) => (p + 1) % METRICS.length)}
    >
      <WidgetHeader icon={<LeafThree20Filled />} tint="var(--ios-green)" title="Greenhouse 2" subtitle="Tomatoes · day setpoints" />

      <div className="relative mx-auto mt-1 h-[66px] w-[120px]">
        <svg viewBox="0 0 120 66" className="size-full overflow-visible" aria-hidden>
          <path d={arc(0, 1)} fill="none" stroke="var(--ant-color-fill-secondary)" strokeWidth={7} strokeLinecap="round" />
          <motion.path
            d={arc(norm(m.lo), norm(m.hi))}
            fill="none"
            stroke="var(--ios-green)"
            strokeOpacity={0.6}
            strokeWidth={7}
            initial={false}
            animate={{ d: arc(norm(m.lo), norm(m.hi)) }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
          <motion.circle
            cx={kx}
            cy={ky}
            r={5.5}
            fill="var(--widget-surface)"
            stroke={inBand ? "var(--ant-color-text-heading)" : "var(--ios-orange)"}
            strokeWidth={2.5}
            style={{ transition: "stroke 300ms" }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center leading-none">
          <AnimatedNumber
            value={v}
            format={{ minimumFractionDigits: m.digits, maximumFractionDigits: m.digits, useGrouping: false }}
            className={cn("text-[24px] font-semibold tracking-tight", inBand ? "text-heading" : "text-ios-orange")}
          />
        </div>
      </div>

      <div className="mt-1 h-[14px] text-center text-[11px] whitespace-nowrap">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={m.key}
            initial={{ opacity: 0, y: 5, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -5, filter: "blur(3px)" }}
            className="text-tertiary tabular"
          >
            <span className="font-semibold text-secondary">{m.label}</span> {m.unit} · {m.lo}–{m.hi}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-auto flex justify-center gap-1">
        {METRICS.map((x, i) => (
          <motion.span
            key={x.key}
            layout
            className={cn("h-1.5 rounded-full", i === page ? "w-3.5 bg-ios-green" : "w-1.5 bg-fill")}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        ))}
      </div>
    </Widget>
  );
}
