import { Pause16Filled, Play16Filled, Radar20Filled, Warning16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type PointerEvent, useEffect, useId, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

/* A squall line crossing Tulsa, OK from the west-southwest. Map units are px of a 376 × 256 map,
 * about 0.25 mi each; the line moves ~2.3 px/min (≈ 35 mph). Frames run −60 … +60 min around 4:12 PM. */
const MW = 376;
const MH = 256;
const BASE = 16 * 60 + 12;
const T_MIN = -60;
const T_MAX = 60;
const STEP = 5;
const PIN = { x: 238, y: 122 };
const C0 = { x: 172, y: 146 };
const V = { x: 2.2, y: -0.5 };
/** Along the line (pointing NNE) and its normal (the direction it advances). */
const U = { x: 0.5, y: -0.866 };
const N = { x: 0.866, y: 0.5 };
const ANGLE = -60;

type Cell = { s: number; rx: number; ry: number; peak: number; phase: number };
const CELLS: Cell[] = [
  { s: -92, rx: 26, ry: 15, peak: 2, phase: 0 },
  { s: -48, rx: 30, ry: 18, peak: 3, phase: 1.3 },
  { s: 10, rx: 34, ry: 21, peak: 4, phase: 2.1 },
  { s: 42, rx: 28, ry: 17, peak: 3, phase: 3.4 },
  { s: 84, rx: 22, ry: 13, peak: 2, phase: 4.6 },
];
/** Trailing light rain behind the line. */
const TRAIL = { rx: 120, ry: 22, dy: -30 };
const RINGS = [1, 0.64, 0.38, 0.2];
const LEVELS = [
  { label: "Dry", text: "text-tertiary", pill: "bg-fill-secondary" },
  { label: "Light", text: "text-ios-green", pill: "bg-ios-green/15" },
  { label: "Moderate", text: "text-ios-yellow", pill: "bg-ios-yellow/15" },
  { label: "Heavy", text: "text-ios-red", pill: "bg-ios-red/15" },
  { label: "Hail", text: "text-ios-purple", pill: "bg-ios-purple/15" },
];
const RING_FILL = ["var(--ios-green)", "var(--ios-yellow)", "var(--ios-red)", "var(--ios-purple)"];

const center = (t: number) => ({ x: C0.x + V.x * t, y: C0.y + V.y * t });
const pulse = (c: Cell, t: number) => 1 + 0.12 * Math.sin(t / 14 + c.phase);

/** Radar return over the pin at time t, 0 (dry) … 4 (hail). */
function levelAt(t: number) {
  const c = center(t);
  const dx = PIN.x - c.x;
  const dy = PIN.y - c.y;
  const lx = dx * U.x + dy * U.y;
  const ly = dx * N.x + dy * N.y;
  let lv = (lx / TRAIL.rx) ** 2 + ((ly - TRAIL.dy) / TRAIL.ry) ** 2 <= 1 ? 1 : 0;
  for (const cell of CELLS) {
    const k = pulse(cell, t);
    const d = Math.sqrt(((lx - cell.s) / (cell.rx * k)) ** 2 + (ly / (cell.ry * k)) ** 2);
    RINGS.forEach((r, i) => {
      if (i < cell.peak && d <= r) lv = Math.max(lv, i + 1);
    });
  }
  return lv;
}
const ARRIVE = (() => {
  for (let t = 0; t <= T_MAX; t++) if (levelAt(t) > 0) return t;
  return null;
})();

function clock(min: number) {
  const h = Math.floor(min / 60) % 24;
  return `${h % 12 || 12}:${String(min % 60).padStart(2, "0")} PM`;
}

const PLACES = [
  { name: "Tulsa", x: 172, y: 100, big: true },
  { name: "Sand Springs", x: 58, y: 44 },
  { name: "Owasso", x: 300, y: 34 },
  { name: "Broken Arrow", x: 312, y: 178 },
  { name: "Jenks", x: 184, y: 214 },
];

/** Weather · large. A radar loop of a squall line crossing the city toward your pin under a severe-storm warning; play, pause or drag the timeline to read the rain over you at any frame. */
export function RadarWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [t, setT] = useState(T_MIN);
  const [playing, setPlaying] = useState(true);
  const [dragging, setDragging] = useState(false);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setT((v) => (v >= T_MAX ? T_MIN : v + STEP)), 480);
    return () => window.clearInterval(id);
  }, [playing]);

  const fromX = (clientX: number) => {
    const el = track.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    setT(Math.round((T_MIN + f * (T_MAX - T_MIN)) / STEP) * STEP);
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setPlaying(false);
    setDragging(true);
    fromX(e.clientX);
  };

  const c = center(t);
  const lv = levelAt(t);
  const L = LEVELS[lv];
  const f = (t - T_MIN) / (T_MAX - T_MIN);
  /** Frame-to-frame glide; a drag follows the finger and the loop's wrap jumps back. */
  const glide = dragging || t === T_MIN ? 0 : 0.45;

  return (
    <Widget size="large" index={index} label="Weather radar">
      <WidgetHeader
        icon={<Radar20Filled />}
        tint="var(--ios-indigo)"
        title="Radar"
        subtitle="Tulsa, OK"
        extra={
          <span className="mt-0.5 flex shrink-0 items-center gap-1 rounded-full bg-fill-secondary px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-secondary tabular">
            {t === 0 ? (
              <>
                <motion.span
                  className="size-1.5 rounded-full bg-ios-red"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
                Live
              </>
            ) : t < 0 ? (
              `${-t} min ago`
            ) : (
              <span className="text-ios-indigo">Forecast +{t} min</span>
            )}
          </span>
        }
      />

      <div className="mt-2 flex h-[42px] shrink-0 items-center gap-2 rounded-xl bg-ios-orange/15 px-2.5 whitespace-nowrap">
        <motion.span
          className="grid shrink-0 place-items-center text-[16px] text-ios-orange"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Warning16Filled />
        </motion.span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[12px] font-semibold text-heading">Severe Thunderstorm Warning</span>
          <span className="block truncate text-[11px] text-secondary tabular">
            Until 5:15 PM · reaches you ~{ARRIVE === null ? "—" : clock(BASE + ARRIVE).replace(" PM", "")}
          </span>
        </span>
        <span className="w-[66px] shrink-0">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={L.label}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className={cn("block rounded-md py-0.5 text-center text-[11px] font-semibold", L.pill, L.text)}
            >
              {L.label}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>

      <div className="relative mt-2 min-h-0 flex-1 overflow-hidden rounded-xl bg-fill-quaternary">
        <svg viewBox={`0 0 ${MW} ${MH}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
          <defs>
            <filter id={`blur-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" />
            </filter>
          </defs>

          {/* River and highways. */}
          <motion.path
            d="M-10 58 C60 78 110 70 150 110 S230 170 270 190 S350 232 390 250"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            style={{ stroke: "var(--ios-blue)", opacity: 0.3 }}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay, duration: 1.2, ease: "easeOut" }}
          />
          {["M-6 226 L120 150 L250 100 L392 38", "M210 -8 L205 120 L216 270", "M-6 128 L120 124 L392 132"].map((d, i) => (
            <motion.path
              key={d}
              d={d}
              fill="none"
              strokeWidth="1.6"
              style={{ stroke: "var(--ant-color-text-tertiary)", opacity: 0.4 }}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: delay + 0.15 + i * 0.1, duration: 1, ease: "easeOut" }}
            />
          ))}

          {/* The storm: trailing rain plus five cells along the line. */}
          <motion.g
            filter={`url(#blur-${uid})`}
            initial={{ x: c.x, y: c.y, opacity: 0 }}
            animate={{ x: c.x, y: c.y, opacity: 0.72 }}
            transition={{
              x: { type: "tween", duration: glide, ease: "linear" },
              y: { type: "tween", duration: glide, ease: "linear" },
              opacity: { delay: delay + 0.4, duration: 0.8 },
            }}
          >
            <g transform={`rotate(${ANGLE})`}>
              <ellipse cx="0" cy={TRAIL.dy} rx={TRAIL.rx} ry={TRAIL.ry} style={{ fill: "var(--ios-green)", opacity: 0.55 }} />
              {CELLS.map((cell, k) => {
                const sc = pulse(cell, t);
                return RINGS.slice(0, cell.peak).map((r, i) => (
                  <ellipse
                    key={`${k}-${i}`}
                    cx={cell.s}
                    cy="0"
                    rx={cell.rx * r * sc}
                    ry={cell.ry * r * sc}
                    style={{ fill: RING_FILL[i], transition: "rx 450ms linear, ry 450ms linear" }}
                  />
                ));
              })}
            </g>
          </motion.g>

          {/* Pin with its accuracy circle. */}
          <motion.circle
            cx={PIN.x}
            cy={PIN.y}
            r="16"
            style={{ fill: "var(--ios-blue)", transformBox: "fill-box", transformOrigin: "center" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.18, 0.08, 0.18] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: delay + 0.6 }}
          />
          <motion.circle
            cx={PIN.x}
            cy={PIN.y}
            r="5.5"
            strokeWidth="2"
            style={{ fill: "var(--ios-blue)", stroke: "#fff", transformBox: "fill-box", transformOrigin: "center" }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.6, type: "spring", stiffness: 500, damping: 18 }}
          />

          {PLACES.map((p, i) => (
            <motion.text
              key={p.name}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              fontSize={p.big ? 12 : 10}
              fontWeight={p.big ? 700 : 500}
              strokeWidth="3"
              strokeLinejoin="round"
              paintOrder="stroke"
              style={{ fill: p.big ? "var(--ant-color-text)" : "var(--ant-color-text-secondary)", stroke: "var(--widget-surface)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.3 + i * 0.05 }}
            >
              {p.name}
            </motion.text>
          ))}
        </svg>

        <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-[var(--widget-surface)]/85 px-1.5 py-1 text-[10px] leading-none font-medium text-secondary">
          Light
          <span className="h-1.5 w-14 rounded-full bg-[linear-gradient(90deg,var(--ios-green),var(--ios-yellow),var(--ios-red),var(--ios-purple))]" />
          Hail
        </div>
      </div>

      <div className="mt-2 flex h-7 shrink-0 items-center gap-2">
        <Button
          size="small"
          shape="circle"
          variant="filled"
          color="default"
          aria-label={playing ? "Pause" : "Play"}
          icon={playing ? <Pause16Filled /> : <Play16Filled />}
          onClick={() => setPlaying((p) => !p)}
        />
        <div
          ref={track}
          className="relative h-7 flex-1 cursor-pointer touch-none"
          onPointerDown={onDown}
          onPointerMove={(e) => dragging && fromX(e.clientX)}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
        >
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-fill-secondary" />
          <motion.div
            className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-ios-indigo"
            animate={{ width: `${f * 100}%` }}
            transition={{ type: "tween", duration: glide, ease: "linear" }}
          />
          {Array.from({ length: (T_MAX - T_MIN) / 15 + 1 }, (_, i) => {
            const tt = T_MIN + i * 15;
            return (
              <span
                key={tt}
                className={cn(
                  "absolute top-1/2 w-px -translate-x-1/2 -translate-y-1/2",
                  tt === 0 ? "h-3.5 w-0.5 bg-[var(--ant-color-text-secondary)]" : "h-2 bg-[var(--ant-color-text-tertiary)] opacity-60",
                )}
                style={{ left: `${((tt - T_MIN) / (T_MAX - T_MIN)) * 100}%` }}
              />
            );
          })}
          <motion.span
            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ios-indigo ring-2 ring-[var(--widget-surface)]"
            animate={{ left: `${f * 100}%`, scale: dragging ? 1.35 : 1 }}
            transition={{ left: { type: "tween", duration: glide, ease: "linear" }, scale: { type: "spring", stiffness: 500, damping: 25 } }}
          />
        </div>
        <span className="w-[58px] shrink-0 text-right text-[12px] font-semibold text-heading tabular">
          <AnimatedNumber value={((Math.floor((BASE + t) / 60) - 1) % 12) + 1} />:
          <AnimatedNumber value={(BASE + t) % 60} format={{ minimumIntegerDigits: 2 }} />
          <span className="ml-0.5 text-[10px] font-medium text-tertiary">PM</span>
        </span>
      </div>
    </Widget>
  );
}
