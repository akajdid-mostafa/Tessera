import { Map20Filled, Trophy16Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { type PointerEvent, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const KM = 21.1;
const TIME_S = 6760; // 1:52:40
const MAP_W = 376;
const MAP_H = 196;

/* The loop, clockwise round the lake from the boathouse; a closed Catmull-Rom spline through these. */
const WAYPOINTS: [number, number][] = [
  [40, 156], [68, 134], [92, 98], [108, 58], [148, 34], [200, 30], [246, 44], [292, 34], [332, 50],
  [348, 92], [330, 130], [292, 150], [250, 166], [206, 156], [170, 168], [130, 172], [90, 172], [56, 168],
];

const ROUTE: [number, number][] = (() => {
  const P = WAYPOINTS;
  const n = P.length;
  const out: [number, number][] = [];
  const STEPS = 14;
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n];
    const p1 = P[i];
    const p2 = P[(i + 1) % n];
    const p3 = P[(i + 2) % n];
    for (let s = 0; s < STEPS; s++) {
      const t = s / STEPS;
      const t2 = t * t;
      const t3 = t2 * t;
      const c = (a: number, b: number, cc: number, d: number) =>
        0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(out[0]);
  return out;
})();
const CUM = ROUTE.reduce<number[]>((acc, p, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + Math.hypot(p[0] - ROUTE[i - 1][0], p[1] - ROUTE[i - 1][1]));
  return acc;
}, []);
const LEN = CUM[CUM.length - 1];
const ROUTE_D = ROUTE.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");

function pointAt(f: number): [number, number] {
  const target = Math.min(1, Math.max(0, f)) * LEN;
  let lo = 0;
  let hi = CUM.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (CUM[mid] < target) lo = mid;
    else hi = mid;
  }
  const seg = CUM[hi] - CUM[lo] || 1;
  const t = (target - CUM[lo]) / seg;
  return [ROUTE[lo][0] + (ROUTE[hi][0] - ROUTE[lo][0]) * t, ROUTE[lo][1] + (ROUTE[hi][1] - ROUTE[lo][1]) * t];
}

/* Elevation in metres along the loop: periodic, so it ends where it started. */
const elev = (f: number) =>
  36 + 16 * Math.sin(2 * Math.PI * f + 0.9) + 8 * Math.sin(6 * Math.PI * f + 0.3) + 4 * Math.sin(14 * Math.PI * f);
const N = 160;
const SAMPLES = Array.from({ length: N + 1 }, (_, i) => elev(i / N));
const GAIN = Math.round(SAMPLES.reduce((a, v, i) => (i && v > SAMPLES[i - 1] ? a + v - SAMPLES[i - 1] : a), 0));
const E_MIN = Math.min(...SAMPLES) - 6;
const E_MAX = Math.max(...SAMPLES) + 4;
/** Climb in metres per km at f. */
const grade = (f: number) => (elev(Math.min(1, f + 0.004)) - elev(Math.max(0, f - 0.004))) / (0.008 * KM);
const paceAt = (f: number) => Math.round(TIME_S / KM - 4 + grade(f) * 0.45 + f * 8);
const hrAt = (f: number) => Math.round(147 + 17 * f + Math.max(-4, Math.min(8, grade(f) * 0.25)));
const AVG_HR = Math.round(SAMPLES.reduce((a, _, i) => a + hrAt(i / N), 0) / SAMPLES.length);
const AVG_PACE = Math.round(TIME_S / KM);

const PROFILE_H = 60;
const py = (e: number) => PROFILE_H - 2 - ((e - E_MIN) / (E_MAX - E_MIN)) * (PROFILE_H - 6);
const LINE_D = SAMPLES.map((e, i) => `${i ? "L" : "M"}${((i / N) * MAP_W).toFixed(1)} ${py(e).toFixed(1)}`).join(" ");
const AREA_D = `${LINE_D} L${MAP_W} ${PROFILE_H} L0 ${PROFILE_H} Z`;
const KM_MARKS = [5, 10, 15, 20];

/** Fitness · large. A half-marathon loop drawn on a map over its elevation profile; scrub the profile to run the pin round the route and read pace, elevation and heart rate at that point. */
export function RouteReplayWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [f, setF] = useState<number | null>(null);

  const scrub = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setF(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
  };

  const live = f !== null;
  const at = f ?? 1;
  const [px, pyPin] = pointAt(at);
  const pace = live ? paceAt(at) : AVG_PACE;
  const stats = [
    { label: live ? "At" : "Distance", value: at * KM, digits: 1, unit: "km" },
    { label: live ? "Pace" : "Avg pace", pace, unit: "/km" },
    { label: live ? "Elevation" : "Elev gain", value: live ? Math.round(elev(at)) : GAIN, digits: 0, unit: "m" },
    { label: live ? "Heart rate" : "Avg HR", value: live ? hrAt(at) : AVG_HR, digits: 0, unit: "bpm" },
  ];

  return (
    <Widget size="large" index={index} label="Run route replay">
      <WidgetHeader
        icon={<Map20Filled />}
        tint="var(--ios-orange)"
        title="Riverside Half"
        subtitle="Sat, Nov 7 · 21.1 km loop"
        extra={
          <motion.span
            className="flex items-center gap-1 whitespace-nowrap rounded-full bg-ios-yellow/15 px-2 py-0.5 text-[11px] font-semibold text-ios-yellow tabular"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 22, delay: delay + 1.4 }}
          >
            <Trophy16Filled className="size-3.5" />
            PB 1:52:40
          </motion.span>
        }
      />

      <div className="relative mt-2 min-h-0 flex-1 overflow-hidden rounded-xl bg-fill-quaternary">
        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
          <path d="M0 0 H122 C112 40 72 72 42 110 C27 130 12 140 0 146 Z" fill="var(--ios-green)" opacity={0.12} />
          <ellipse cx="214" cy="100" rx="64" ry="36" fill="var(--ios-blue)" opacity={0.18} />
          <path d="M0 190 C90 180 170 196 250 186 S340 180 376 188" fill="none" stroke="var(--ios-blue)" strokeWidth="8" opacity={0.2} />
          <g className="stroke-fill-secondary" strokeWidth="2" fill="none" strokeLinecap="round">
            <path d="M126 12 L376 8" />
            <path d="M364 8 V196" />
            <path d="M0 74 L80 84" />
            <path d="M270 196 L300 160" />
          </g>

          <motion.path
            d={ROUTE_D}
            fill="none"
            stroke="var(--widget-surface)"
            strokeWidth="7"
            strokeLinejoin="round"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay }}
          />
          <motion.path
            d={ROUTE_D}
            fill="none"
            stroke="var(--ios-orange)"
            strokeWidth="3.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1, opacity: live ? 0.35 : 1 }}
            transition={{ pathLength: { duration: 1.6, ease: [0.22, 1, 0.36, 1], delay }, opacity: { duration: 0.2 } }}
          />
          {live ? (
            <path
              d={ROUTE_D}
              pathLength={1}
              strokeDasharray={`${at} 2`}
              fill="none"
              stroke="var(--ios-orange)"
              strokeWidth="3.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}

          {KM_MARKS.map((k, i) => {
            const [x, y] = pointAt(k / KM);
            return (
              <motion.g
                key={k}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
                transition={{ type: "spring", stiffness: 420, damping: 20, delay: delay + 0.4 + (k / KM) * 1.2 + i * 0.02 }}
              >
                <circle cx={x} cy={y} r="8" fill="var(--widget-surface)" stroke="var(--ios-orange)" strokeWidth="1.5" />
                <text x={x} y={y + 3.2} textAnchor="middle" fontSize="9" fontWeight="600" className="fill-[var(--ant-color-text)] tabular">
                  {k}
                </text>
              </motion.g>
            );
          })}

          {/* Start and finish at the boathouse. */}
          <circle cx={WAYPOINTS[0][0]} cy={WAYPOINTS[0][1]} r="6" fill="var(--ios-green)" stroke="var(--widget-surface)" strokeWidth="2.5" />
          {!live ? (
            <motion.circle
              cx={WAYPOINTS[0][0]}
              cy={WAYPOINTS[0][1]}
              fill="none"
              stroke="var(--ios-green)"
              strokeWidth="1.5"
              initial={{ r: 6, opacity: 0.8 }}
              animate={{ r: [6, 16], opacity: [0.8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: delay + 1.6 }}
            />
          ) : (
            <motion.circle
              r="6.5"
              fill="var(--ios-orange)"
              stroke="var(--widget-surface)"
              strokeWidth="2.5"
              initial={{ cx: px, cy: pyPin }}
              animate={{ cx: px, cy: pyPin }}
              transition={{ type: "spring", stiffness: 600, damping: 40 }}
            />
          )}
        </svg>
        <div className="absolute top-1.5 left-2 flex items-center gap-1 rounded-md bg-[var(--widget-surface)]/80 px-1.5 text-[10px] leading-4 font-medium text-secondary">
          <span className="size-1.5 rounded-full bg-ios-green" />
          Start · Boathouse
        </div>
        <motion.div
          className="absolute right-2 bottom-1.5 rounded-md bg-[var(--widget-surface)]/80 px-1.5 text-[10px] leading-4 font-medium text-secondary"
          animate={{ opacity: live ? 0 : 1 }}
          transition={{ duration: 0.2 }}
        >
          Drag the profile to replay
        </motion.div>
      </div>

      <div className="mt-2 grid h-[36px] shrink-0 grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.unit} className="min-w-0 whitespace-nowrap leading-tight">
            <div className={cn("truncate text-[10.5px]", live ? "text-ios-orange" : "text-tertiary")}>{s.label}</div>
            <div className="text-[16px] font-semibold tracking-tight text-heading">
              {"pace" in s && s.pace !== undefined ? (
                <>
                  <AnimatedNumber value={Math.floor(s.pace / 60)} />:
                  <AnimatedNumber value={s.pace % 60} format={{ minimumIntegerDigits: 2 }} />
                </>
              ) : (
                <AnimatedNumber
                  value={s.value ?? 0}
                  format={{ minimumFractionDigits: s.digits, maximumFractionDigits: s.digits }}
                />
              )}
              <span className="ml-0.5 text-[10px] font-medium text-tertiary">{s.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div
        className="relative mt-2 h-[60px] shrink-0 cursor-ew-resize touch-none"
        onPointerDown={(e) => {
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {}
          scrub(e);
        }}
        onPointerMove={scrub}
        onPointerLeave={() => setF(null)}
        onPointerUp={(e) => {
          if (e.pointerType !== "mouse") setF(null);
        }}
      >
        <motion.svg
          viewBox={`0 0 ${MAP_W} ${PROFILE_H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full origin-bottom"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 18, delay: delay + 0.3 }}
          aria-label={`Elevation profile, ${GAIN} m of climbing`}
        >
          <path d={AREA_D} fill="var(--ios-teal)" opacity={0.2} />
          <path d={LINE_D} fill="none" stroke="var(--ios-teal)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </motion.svg>
        {live ? (
          <>
            <div className="pointer-events-none absolute inset-y-0 w-px bg-ios-orange" style={{ left: `${at * 100}%` }} />
            <div
              className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ios-orange ring-2 ring-[var(--widget-surface)]"
              style={{ left: `${at * 100}%`, top: py(elev(at)) }}
            />
          </>
        ) : null}
      </div>
      <div className="relative mt-1 h-3 shrink-0 text-[10px] leading-3 text-tertiary tabular">
        <span className="absolute left-0">0 km</span>
        {[5, 10, 15].map((k) => (
          <span key={k} className="absolute -translate-x-1/2" style={{ left: `${(k / KM) * 100}%` }}>
            {k}
          </span>
        ))}
        <span className="absolute right-0">{KM} km</span>
      </div>
    </Widget>
  );
}
