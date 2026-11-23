import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Dir = "N" | "S" | "E" | "W";
type Light = "g" | "y" | "r";
const DIRS: Dir[] = ["N", "S", "E", "W"];
const STREET: Record<Dir, string> = { N: "15th Ave NW", S: "15th Ave NW", E: "Market St", W: "Market St" };
/** Arrival chance per plan second; the avenue carries more. */
const RATE: Record<Dir, number> = { N: 0.24, S: 0.27, E: 0.4, W: 0.37 };

/** Plan 3, 64 s cycle: Φ2+6 north–south, Φ4+8 east–west, 4 s amber and 2 s all-red each. */
const CYCLE = 64;
const SEGMENTS = [
  { from: 0, to: 22, axis: "ns", light: "g" },
  { from: 22, to: 26, axis: "ns", light: "y" },
  { from: 26, to: 28, axis: "all", light: "r" },
  { from: 28, to: 58, axis: "ew", light: "g" },
  { from: 58, to: 62, axis: "ew", light: "y" },
  { from: 62, to: 64, axis: "all", light: "r" },
] as const;
const axisOf = (d: Dir) => (d === "N" || d === "S" ? "ns" : "ew");
function lightAt(t: number, d: Dir): Light {
  const s = SEGMENTS.find((x) => t >= x.from && t < x.to)!;
  return s.axis === axisOf(d) ? s.light : "r";
}
const LIGHT_COLOR: Record<Light, string> = { g: "var(--ios-green)", y: "var(--ios-yellow)", r: "var(--ios-red)" };

/** Where the i-th queued car sits, where it leaves to, and how it is drawn. */
const GEO: Record<Dir, { at: (i: number) => { x: number; y: number }; out: { x: number; y: number }; w: number; h: number; signal: { x: number; y: number }; lane: string }> = {
  N: { at: (i) => ({ x: 90, y: 64 - i * 9 }), out: { x: 90, y: 214 }, w: 5, h: 7, signal: { x: 76, y: 70 }, lane: "M80 0 H100 V70 H80 Z" },
  S: { at: (i) => ({ x: 110, y: 136 + i * 9 }), out: { x: 110, y: -14 }, w: 5, h: 7, signal: { x: 124, y: 130 }, lane: "M100 130 H120 V200 H100 Z" },
  E: { at: (i) => ({ x: 136 + i * 9, y: 90 }), out: { x: -14, y: 90 }, w: 7, h: 5, signal: { x: 130, y: 76 }, lane: "M130 80 H200 V100 H130 Z" },
  W: { at: (i) => ({ x: 64 - i * 9, y: 110 }), out: { x: 214, y: 110 }, w: 7, h: 5, signal: { x: 70, y: 124 }, lane: "M0 100 H70 V120 H0 Z" },
};
const SHOWN = 8;
const METERS_PER_CAR = 7;

const LOS = (delay: number) => (delay <= 10 ? "A" : delay <= 20 ? "B" : delay <= 35 ? "C" : delay <= 55 ? "D" : delay <= 80 ? "E" : "F");

/** Smart city · large. A live plan view: signals cycle, queues build on red and discharge on green; hover an approach to trace it. */
export function IntersectionWidget({ index }: { index?: number }) {
  const nextId = useRef(100);
  const [sim, setSim] = useState(() => ({
    t: 4,
    q: {
      N: [1, 2, 3, 4, 5],
      S: [6, 7, 8, 9, 10, 11],
      E: [12, 13, 14, 15],
      W: [16, 17, 18],
    } as Record<Dir, number[]>,
  }));
  const [hover, setHover] = useState<Dir | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSim((s) => {
        const t = (s.t + 1) % CYCLE;
        const q = { ...s.q };
        for (const d of DIRS) {
          let lane = q[d];
          if (lightAt(t, d) === "g" && lane.length) lane = lane.slice(1);
          if (Math.random() < RATE[d] && lane.length < 14) lane = [...lane, nextId.current++];
          q[d] = lane;
        }
        return { t, q };
      });
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  const { t, q } = sim;
  const seg = SEGMENTS.find((x) => t >= x.from && t < x.to)!;
  const left = seg.to - t;
  const avgQueue = DIRS.reduce((a, d) => a + q[d].length, 0) / 4;
  const delay = Math.round(11 + avgQueue * 3.2);
  const los = LOS(delay);
  const phaseName = seg.axis === "ns" ? "Φ2+6 N–S" : seg.axis === "ew" ? "Φ4+8 E–W" : "All red";

  return (
    <Widget size="large" index={index} label="Intersection live">
      <WidgetHeader
        icon={<SignalGlyph />}
        tint="var(--ios-green)"
        title="Market St × 15th Ave NW"
        subtitle="Ballard · Site 1042 · Plan 3 midday"
      />

      <div className="mt-2.5 flex items-start gap-3">
        <svg viewBox="0 0 200 200" className="size-[200px] shrink-0 overflow-hidden rounded-[18px]" aria-hidden>
          <rect width="200" height="200" fill="var(--ant-color-fill-quaternary)" />
          {[
            [0, 0],
            [128, 0],
            [0, 128],
            [128, 128],
          ].map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x + 4} y={y + 4} width={64} height={64} rx={10} fill="var(--ant-color-fill-tertiary)" />
          ))}
          <rect x="80" y="0" width="40" height="200" fill="var(--ant-color-fill-secondary)" />
          <rect x="0" y="80" width="200" height="40" fill="var(--ant-color-fill-secondary)" />
          <path d="M100 0 V66 M100 134 V200 M0 100 H66 M134 100 H200" stroke="var(--ant-color-text-tertiary)" strokeDasharray="5 5" strokeWidth={1} />
          {/* Zebra crossings and stop lines. */}
          <path
            d="M80 75 H120 M80 125 H120 M75 80 V120 M125 80 V120"
            stroke="var(--widget-surface)"
            strokeOpacity={0.75}
            strokeWidth={6}
            strokeDasharray="2.5 2.5"
          />
          <path d="M80 70 H100 M100 130 H120 M70 100 V120 M130 80 V100" stroke="var(--widget-surface)" strokeWidth={1.6} />

          <AnimatePresence>
            {hover ? (
              <motion.path
                key={hover}
                d={GEO[hover].lane}
                fill="var(--ios-blue)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.18 }}
                exit={{ opacity: 0 }}
              />
            ) : null}
          </AnimatePresence>

          {DIRS.map((d) => (
            <g key={d}>
              <AnimatePresence initial={false}>
                {q[d].slice(0, SHOWN).map((id, i) => {
                  const g = GEO[d];
                  const p = g.at(i);
                  const back = g.at(i + 2);
                  return (
                    <motion.g
                      key={id}
                      initial={{ x: back.x, y: back.y, opacity: 0 }}
                      animate={{ x: p.x, y: p.y, opacity: 1 }}
                      exit={{ x: g.out.x, y: g.out.y, opacity: 0, transition: { duration: 1.1, ease: "easeIn" } }}
                      transition={{ type: "spring", stiffness: 140, damping: 20 }}
                    >
                      <rect
                        x={-g.w / 2}
                        y={-g.h / 2}
                        width={g.w}
                        height={g.h}
                        rx={1.6}
                        fill={hover === d ? "var(--ios-blue)" : "var(--ant-color-text-secondary)"}
                      />
                    </motion.g>
                  );
                })}
              </AnimatePresence>
              <circle
                cx={GEO[d].signal.x}
                cy={GEO[d].signal.y}
                r={3.6}
                fill={LIGHT_COLOR[lightAt(t, d)]}
                stroke="var(--widget-surface)"
                strokeWidth={1.5}
                style={{ transition: "fill 250ms" }}
              />
            </g>
          ))}
        </svg>

        <div className="min-w-0 flex-1" onMouseLeave={() => setHover(null)}>
          <div className="text-[11px] text-tertiary">Control delay</div>
          <div className="flex items-center gap-1.5">
            <span className="text-[26px] leading-none font-semibold tracking-tight text-heading">
              <AnimatedNumber value={delay} />
              <span className="ml-0.5 text-[12px] font-medium text-tertiary">s/veh</span>
            </span>
            <motion.span
              key={los}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "grid size-5 place-items-center rounded-md text-[11px] font-bold",
                los <= "C" ? "bg-fill-secondary text-secondary" : los === "D" ? "bg-ios-orange/15 text-ios-orange" : "bg-ios-red/15 text-ios-red",
              )}
            >
              {los}
            </motion.span>
          </div>

          <div className="mt-2 text-[11px] text-tertiary">Queue by approach</div>
          <div className="mt-1 flex flex-col gap-0.5">
            {DIRS.map((d) => {
              const m = q[d].length * METERS_PER_CAR;
              const long = m >= 63;
              return (
                <button
                  key={d}
                  type="button"
                  onMouseEnter={() => setHover(d)}
                  onFocus={() => setHover(d)}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-lg px-1 py-[3px] text-left outline-none transition-colors",
                    hover === d && "bg-fill-tertiary",
                  )}
                >
                  <span
                    className="size-2 shrink-0 rounded-full transition-colors duration-300"
                    style={{ background: LIGHT_COLOR[lightAt(t, d)] }}
                  />
                  <span className="w-3 text-[12px] font-semibold text-heading">{d}</span>
                  <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-fill-secondary">
                    <motion.span
                      className={cn("absolute inset-y-0 left-0 rounded-full", long ? "bg-ios-orange" : "bg-[var(--ant-color-text-tertiary)]")}
                      animate={{ width: `${Math.min(100, (m / 98) * 100)}%` }}
                      transition={{ type: "spring", stiffness: 160, damping: 22 }}
                    />
                  </span>
                  <span className="w-[34px] text-right text-[11px] font-medium text-secondary tabular">
                    <AnimatedNumber value={m} suffix=" m" />
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-1.5 truncate text-[11px] text-tertiary">{hover ? STREET[hover] : "Hover an approach"}</div>
        </div>
      </div>

      <div className="mt-auto">
        <div className="mb-1 flex items-baseline justify-between text-[11px] whitespace-nowrap">
          <span className="font-semibold text-heading">{phaseName}</span>
          <span className="text-tertiary tabular">
            <AnimatedNumber value={left} trend={-1} className="font-semibold text-secondary" /> s left · cycle {CYCLE} s
          </span>
        </div>
        <div className="relative flex h-2 gap-px">
          {SEGMENTS.map((s) => (
            <span
              key={s.from}
              className="h-full rounded-[2px] transition-opacity duration-300"
              style={{
                flexGrow: s.to - s.from,
                background: LIGHT_COLOR[s.light],
                opacity: s === seg ? 1 : 0.28,
              }}
            />
          ))}
          <motion.span
            className="absolute -top-[3px] h-[14px] w-[3px] -translate-x-1/2 rounded-full bg-[var(--ant-color-text-heading)] ring-2 ring-[var(--widget-surface)]"
            animate={{ left: `${((t + 0.5) / CYCLE) * 100}%` }}
            transition={t === 0 ? { duration: 0 } : { duration: 0.5, ease: "linear" }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2.5">
        <MemojiAvatar who="f4" size={28} alt="Elena Ruiz" />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[13px] font-medium text-heading">Elena Ruiz</div>
          <div className="truncate text-[11px] text-tertiary">TMC operator · adaptive on</div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-fill-tertiary px-2 py-1 text-[11px] font-medium text-secondary">
          <motion.span
            className="size-1.5 rounded-full bg-ios-green"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
          DS 0.<AnimatedNumber value={Math.min(99, Math.round(72 + avgQueue * 3))} />
        </span>
      </div>
    </Widget>
  );
}

/** A three-lamp signal head for the header chip. */
function SignalGlyph() {
  return (
    <svg viewBox="0 0 20 20" width="1em" height="1em" aria-hidden>
      <rect x="6" y="1.5" width="8" height="17" rx="3" fill="currentColor" />
      {[5.6, 10, 14.4].map((cy) => (
        <circle key={cy} cx="10" cy={cy} r="1.9" fill="#000" fillOpacity={0.3} />
      ))}
    </svg>
  );
}
