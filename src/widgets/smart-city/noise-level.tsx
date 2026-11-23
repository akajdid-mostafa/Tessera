import { Speaker220Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Sensor = { name: string; limit: number; base: number; event: string };
/* Night limits (23:00–07:00): 55 dB(A) residential, 65 on the commercial street. */
const SENSORS: Sensor[] = [
  { name: "Ferry Pier", limit: 55, base: 57, event: "Ferry horn" },
  { name: "Gilman Park", limit: 55, base: 43, event: "Dog barking" },
  { name: "Ballard Ave", limit: 65, base: 61, event: "Motorbike" },
];
const LO = 30;
const HI = 90;
const WINDOW = 12;
const TICK_MS = 700;

/* Level meter: one bar per sample, newest on the right, against the zone limit. */
const VW = 164;
const VH = 58;
const GAP = 4;
const BW = (VW - GAP * (WINDOW - 1)) / WINDOW;
const by = (db: number) => VH - Math.max(3, ((Math.min(HI, Math.max(LO, db)) - LO) / (HI - LO)) * VH);
/** Energy average of the window: Leq, not the arithmetic mean. */
const leq = (xs: number[]) => 10 * Math.log10(xs.reduce((a, x) => a + 10 ** (x / 10), 0) / xs.length);

function seedFor(s: Sensor) {
  return Array.from({ length: WINDOW }, (_, i) => s.base + Math.sin(i * 1.7) * 2.2);
}

/** Smart city · small. A night-time sound level meter: bars track the live level against the zone's dashed limit while the hero holds the rolling Leq against the zone's limit, spiking on events; tap to step through sensors. */
export function NoiseLevelWidget({ index }: { index?: number }) {
  const [page, setPage] = useState(0);
  const [samples, setSamples] = useState(() => SENSORS.map(seedFor));
  const [tick, setTick] = useState(0);
  const [lmax, setLmax] = useState(() => SENSORS.map((s) => s.base + 9));
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), TICK_MS);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!tick) return;
    // Every ~14 s a short loud event (horn, bike, dog) rides over the background.
    const phase = tick % 20;
    const burst = phase >= 14 && phase < 17;
    const next = SENSORS.map((s, i) => {
      const spike = burst ? [21, 14, 19][i] - (phase - 14) * 4 : 0;
      return Math.round((s.base + (Math.random() - 0.5) * 4 + spike) * 10) / 10;
    });
    setSamples((all) => all.map((xs, i) => [...xs.slice(1), next[i]]));
    setLmax((m) => m.map((x, i) => Math.max(x, next[i])));
  }, [tick]);

  const s = SENSORS[page];
  const xs = samples[page];
  const now = xs[xs.length - 1];
  const avg = Math.round(leq(xs) * 10) / 10;
  const over = avg > s.limit;
  const loud = now > s.limit + 12;

  return (
    <Widget size="small" index={index} label="Night noise level" pressable onPress={() => setPage((p) => (p + 1) % SENSORS.length)}>
      <WidgetHeader
        icon={<Speaker220Filled />}
        tint={over ? "var(--ios-orange)" : "var(--ios-indigo)"}
        title="Night Noise"
        subtitle={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={s.name} className="inline-block" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
              {s.name}
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="relative mt-2 h-[58px] shrink-0">
        <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" className="size-full overflow-visible" aria-hidden>
          {xs.map((v, i) => {
            const y = by(v);
            const latest = i === xs.length - 1;
            const fill = v > s.limit ? "var(--ios-orange)" : "var(--ant-color-text-tertiary)";
            return (
              <motion.rect
                key={i}
                x={i * (BW + GAP)}
                width={BW}
                rx={2}
                fill={fill}
                initial={{ y: VH, height: 0, opacity: 0 }}
                animate={{ y, height: VH - y, opacity: latest ? 1 : v > s.limit ? 0.75 : 0.45 }}
                transition={{
                  y: { type: "spring", stiffness: 220, damping: 24, delay: tick ? 0 : delay + i * 0.03 },
                  height: { type: "spring", stiffness: 220, damping: 24, delay: tick ? 0 : delay + i * 0.03 },
                  opacity: { duration: 0.3, delay: tick ? 0 : delay + i * 0.03 },
                }}
              />
            );
          })}
          {/* the zone's night limit */}
          <motion.line
            x1={0}
            x2={VW}
            strokeWidth="1"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
            className="stroke-[var(--ant-color-text-secondary)]"
            initial={{ y1: by(s.limit), y2: by(s.limit), opacity: 0 }}
            animate={{ y1: by(s.limit), y2: by(s.limit), opacity: 0.8 }}
            transition={{ type: "spring", stiffness: 160, damping: 22, opacity: { delay } }}
          />
        </svg>
      </div>

      <div className="mt-1.5 flex items-baseline-last justify-center gap-1.5 whitespace-nowrap">
        <span className={cn("text-[24px] leading-none font-semibold tracking-tight transition-colors", over ? "text-ios-orange" : "text-heading")}>
          <AnimatedNumber value={avg} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
        </span>
        <span className="mb-px text-[11px] text-tertiary">dB(A) Leq</span>
      </div>

      <div className="mt-auto flex items-center justify-between text-[10px] text-tertiary tabular whitespace-nowrap">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={loud ? "loud" : `${page}-${over}`}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            className={cn(loud || over ? "font-semibold text-ios-orange" : undefined)}
          >
            {loud ? s.event : over ? `Over ${s.limit} limit` : `Limit ${s.limit} · max ${Math.round(lmax[page])}`}
          </motion.span>
        </AnimatePresence>
        <span className="flex gap-1">
          {SENSORS.map((x, i) => (
            <span key={x.name} className={cn("size-1.5 rounded-full transition-colors", i === page ? "bg-heading" : "bg-fill")} />
          ))}
        </span>
      </div>
    </Widget>
  );
}
