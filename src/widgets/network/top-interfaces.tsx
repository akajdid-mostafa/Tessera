import { DataUsage20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { walk } from "./_parts";

type Dir = "In" | "Out";
type Iface = { name: string; peer: string; gbps: number; base: Record<Dir, number> };

const IFACES: Iface[] = [
  { name: "Te1/0/1", peer: "core-rtr-1", gbps: 10, base: { In: 64, Out: 41 } },
  { name: "Te1/0/2", peer: "dist-sw-1", gbps: 10, base: { In: 47, Out: 58 } },
  { name: "Po1", peer: "fw-edge · 2×10G", gbps: 20, base: { In: 38, Out: 33 } },
  { name: "Te1/0/3", peer: "dist-sw-2", gbps: 10, base: { In: 41, Out: 36 } },
  { name: "Te1/0/48", peer: "backup-nas", gbps: 10, base: { In: 12, Out: 22 } },
  { name: "Gi1/0/12", peer: "nvr-cctv", gbps: 1, base: { In: 52, Out: 9 } },
];
const LEN = 18;
const ROWS = 4;

type Series = Record<string, Record<Dir, number[]>>;

const seed = (): Series =>
  Object.fromEntries(
    IFACES.map((f, i) => [
      f.name,
      {
        In: Array.from({ length: LEN }, (_, k) => f.base.In + Math.sin(k * 0.7 + i) * 6),
        Out: Array.from({ length: LEN }, (_, k) => f.base.Out + Math.cos(k * 0.6 + i) * 5),
      },
    ]),
  );

function spark(values: number[]) {
  return values.map((v, i) => `${i ? "L" : "M"}${((i / (LEN - 1)) * 60).toFixed(1)} ${(16 - (v / 100) * 15).toFixed(1)}`).join(" ");
}

function rate(pct: number, gbps: number) {
  const g = (pct / 100) * gbps;
  return g >= 1 ? { v: g, unit: "Gb/s" } : { v: g * 1000, unit: "Mb/s" };
}

/** Network · medium. The busiest interfaces on the core switch, re-ranked live with each row sliding to its new place; switch In and Out. */
export function TopInterfacesWidget({ index }: { index?: number }) {
  const [dir, setDir] = useState<Dir>("In");
  const [series, setSeries] = useState<Series>(seed);
  const [tick, setTick] = useState(0);
  const count = useRef(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      count.current += 1;
      // The nightly backup job floods the NAS port on a slow on/off rhythm.
      const burst = count.current % 10 >= 5;
      setTick(count.current);
      setSeries((s) => {
        const next: Series = {};
        IFACES.forEach((f) => {
          next[f.name] = { In: [], Out: [] };
          (["In", "Out"] as Dir[]).forEach((d) => {
            const prev = s[f.name][d];
            const last = prev[prev.length - 1];
            let v = walk(last + (f.base[d] - last) * 0.2, 7, 3, 97);
            if (f.name === "Te1/0/48" && d === "Out") v = burst ? walk(89, 3, 84, 96) : walk(f.base.Out, 4, 8, 30);
            next[f.name][d] = [...prev.slice(1), v];
          });
        });
        return next;
      });
    }, 2200);
    return () => window.clearInterval(t);
  }, []);

  const ranked = IFACES.map((f) => ({ f, values: series[f.name][dir], now: series[f.name][dir][LEN - 1] }))
    .sort((a, b) => b.now - a.now)
    .slice(0, ROWS);

  return (
    <Widget size="medium" index={index} label="Top interfaces">
      <WidgetHeader
        icon={<DataUsage20Filled />}
        tint="var(--ios-teal)"
        title="Top Interfaces"
        subtitle="core-sw-01 · 5 min avg"
        extra={<Segmented size="small" value={dir} onChange={(v) => setDir(v as Dir)} options={["In", "Out"]} />}
      />

      <div className="mt-1.5 flex flex-1 flex-col justify-around">
        {ranked.map(({ f, values, now }, i) => {
          const r = rate(now, f.gbps);
          const hot = now >= 85;
          const warm = now >= 70;
          return (
            <motion.div
              key={f.name}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                layout: { type: "spring", stiffness: 380, damping: 32 },
                default: { delay: tick === 0 ? 0.3 + (index ?? 0) * 0.06 + i * 0.06 : 0, type: "spring", stiffness: 300, damping: 26 },
              }}
              className={cn("flex h-[25px] items-center gap-2.5", i > 0 && "border-t-[0.5px] border-split")}
            >
              <div className="w-[92px] min-w-0 shrink-0 leading-none">
                <div className="truncate text-[12px] font-semibold text-heading">{f.name}</div>
                <div className="mt-px truncate text-[9px] text-tertiary">→ {f.peer}</div>
              </div>
              <svg viewBox="0 0 60 17" preserveAspectRatio="none" className="h-[17px] min-w-0 flex-1" aria-hidden>
                <line x1={0} x2={60} y1={16 - 0.85 * 15} y2={16 - 0.85 * 15} strokeDasharray="2 2" strokeWidth={1} vectorEffect="non-scaling-stroke" className="stroke-fill" />
                <motion.path
                  d={spark(values)}
                  fill="none"
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  className={cn("transition-colors duration-mid", hot ? "stroke-ios-red" : warm ? "stroke-ios-orange" : "stroke-secondary")}
                  // Fades in rather than drawing: opacity's dash maths breaks on a
                  // stretched (preserveAspectRatio="none") non-scaling stroke and
                  // leaves a gap in the line.
                  initial={{ opacity: 0, d: spark(values) }}
                  animate={{ opacity: 1, d: spark(values) }}
                  transition={{ opacity: { duration: 0.6, delay: 0.4 + (index ?? 0) * 0.06 }, d: { duration: 0.6 } }}
                />
              </svg>
              <div className="w-[62px] shrink-0 text-right text-[12px] font-medium text-heading whitespace-nowrap">
                <AnimatedNumber value={r.v} format={{ maximumFractionDigits: r.unit === "Gb/s" ? 1 : 0, minimumFractionDigits: r.unit === "Gb/s" ? 1 : 0 }} />
                <span className="text-[10px] text-tertiary"> {r.unit}</span>
              </div>
              <span
                className={cn(
                  "w-[38px] shrink-0 rounded-full py-px text-center text-[11px] font-semibold transition-colors duration-mid",
                  hot ? "bg-ios-red/15 text-ios-red" : warm ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-tertiary text-secondary",
                )}
              >
                <AnimatedNumber value={Math.round(now)} suffix="%" />
              </span>
            </motion.div>
          );
        })}
      </div>
    </Widget>
  );
}
