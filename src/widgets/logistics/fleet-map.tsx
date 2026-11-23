import { Call16Regular, Map20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

type Pt = readonly [number, number];
type Van = {
  id: string;
  driver: string;
  who: string;
  color: string;
  dot: string;
  route: Pt[];
  stops: number;
  start: number;
  speed: number;
  late?: boolean;
};

/* The map is drawn in a 376 × 240 box; the streets are a plain grid. */
const W = 376;
const H = 240;
const XS = [36, 100, 164, 228, 292, 348];
const YS = [28, 88, 148, 208];
const DEPOT: Pt = [36, 208];

const VANS: Van[] = [
  {
    id: "V11",
    driver: "Megan Brooks",
    who: "f4",
    color: "var(--ios-blue)",
    dot: "bg-ios-blue",
    route: [DEPOT, [36, 88], [100, 88], [100, 28], [228, 28]],
    stops: 18,
    start: 0.58,
    speed: 0.0026,
  },
  {
    id: "V14",
    driver: "Daniel Okafor",
    who: "m7",
    color: "var(--ios-purple)",
    dot: "bg-ios-purple",
    route: [DEPOT, [164, 208], [164, 148], [292, 148], [292, 88]],
    stops: 22,
    start: 0.44,
    speed: 0.0022,
  },
  {
    id: "V17",
    driver: "Lena Fischer",
    who: "f8",
    color: "var(--ios-teal)",
    dot: "bg-ios-teal",
    route: [DEPOT, [100, 208], [100, 148], [228, 148], [228, 208], [348, 208]],
    stops: 16,
    start: 0.72,
    speed: 0.0028,
  },
  {
    id: "V22",
    driver: "Tyler Reed",
    who: "m9",
    color: "var(--ios-indigo)",
    dot: "bg-ios-indigo",
    route: [DEPOT, [36, 148], [164, 148], [164, 88], [348, 88], [348, 28]],
    stops: 24,
    start: 0.36,
    speed: 0.0011,
    late: true,
  },
];

const TICK_MS = 500;
const NOW = 13 * 60 + 20;
const MIN_PER_STOP = 6;
const RETURN_MIN = 18;

function measure(route: Pt[]) {
  const segs = route.slice(1).map((b, i) => Math.hypot(b[0] - route[i][0], b[1] - route[i][1]));
  return { segs, total: segs.reduce((a, b) => a + b, 0) };
}
const MEASURED = VANS.map((v) => measure(v.route));

function pointAt(vi: number, f: number): Pt {
  const route = VANS[vi].route;
  const { segs, total } = MEASURED[vi];
  let left = Math.min(1, Math.max(0, f)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (left <= segs[i] || i === segs.length - 1) {
      const t = segs[i] ? Math.min(1, left / segs[i]) : 0;
      const a = route[i];
      const b = route[i + 1];
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    left -= segs[i];
  }
  return route[route.length - 1];
}

/** Stop k sits on the route at this fraction; the first ones are a short way out of the depot. */
const stopAt = (v: Van, k: number) => 0.1 + (0.9 * (k + 1)) / v.stops;
const doneOf = (v: Van, p: number) => Array.from({ length: v.stops }, (_, k) => stopAt(v, k)).filter((s) => s <= p).length;
const pathOf = (route: Pt[]) => route.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
const clock = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(Math.round(m) % 60).padStart(2, "0")}`;

/** Logistics · large. A last-mile fleet on a street map: vans drive their routes live, stops tick off behind them, the late van pulses; tap a van for its driver and ETA. */
export function FleetMapWidget({ index }: { index?: number }) {
  const [p, setP] = useState(() => VANS.map((v) => v.start));
  const [ticks, setTicks] = useState(0);
  const [sel, setSel] = useState(3);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      setP((all) => all.map((x, i) => (x + VANS[i].speed >= 1 ? 0.06 : x + VANS[i].speed)));
      setTicks((n) => n + 1);
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, []);

  const van = VANS[sel];
  const done = doneOf(van, p[sel]);
  const left = van.stops - done;
  const now = NOW + Math.floor(ticks / 12);
  const slip = van.late ? 14 + Math.floor(ticks / 40) : 0;
  const eta = now + left * MIN_PER_STOP + RETURN_MIN + slip;
  const lateCount = VANS.filter((v) => v.late).length;

  return (
    <Widget size="large" index={index} label="Last-mile fleet map">
      <WidgetHeader
        icon={<Map20Filled />}
        tint="var(--ios-blue)"
        title="Last-Mile Fleet"
        subtitle="Depot West · 4 vans out"
        extra={
          lateCount ? (
            <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-ios-orange/15 px-2 py-0.5 text-[11px] font-semibold text-ios-orange">
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-ios-orange opacity-70" />
                <span className="relative size-1.5 rounded-full bg-ios-orange" />
              </span>
              {lateCount} running late
            </span>
          ) : null
        }
      />

      <div className="relative mt-2.5 min-h-0 flex-1 overflow-hidden rounded-xl bg-fill-quaternary">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
          {/* river and park */}
          <path d="M246 0 C258 46 312 66 376 58" fill="none" strokeWidth="14" stroke="var(--ios-blue)" opacity="0.16" />
          <rect x="110" y="98" width="44" height="40" rx="5" fill="var(--ios-green)" opacity="0.14" />
          {/* streets */}
          {YS.map((y) => (
            <line key={`h${y}`} x1="0" x2={W} y1={y} y2={y} strokeWidth="9" strokeLinecap="round" className="stroke-fill-tertiary" />
          ))}
          {XS.map((x) => (
            <line key={`v${x}`} x1={x} x2={x} y1="0" y2={H} strokeWidth="9" strokeLinecap="round" className="stroke-fill-tertiary" />
          ))}

          {/* routes: the selected one in full colour, the others faint */}
          {VANS.map((v, i) => (
            <motion.path
              key={v.id}
              d={pathOf(v.route)}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              stroke={v.color}
              initial={{ pathLength: 0, opacity: 0, strokeWidth: i === sel ? 3 : 2 }}
              animate={{ pathLength: 1, opacity: i === sel ? 1 : 0.3, strokeWidth: i === sel ? 3 : 2 }}
              transition={{
                pathLength: { delay: delay + i * 0.12, duration: 1.2, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 0.3, delay: ticks ? 0 : delay + i * 0.12 },
                strokeWidth: { duration: 0.3 },
              }}
            />
          ))}

          {/* the selected van's stops: filled once delivered */}
          <AnimatePresence>
            {Array.from({ length: van.stops }, (_, k) => {
              const [x, y] = pointAt(sel, stopAt(van, k));
              const delivered = k < done;
              return (
                <motion.circle
                  key={`${van.id}-${k}`}
                  cx={x}
                  cy={y}
                  r="2.6"
                  strokeWidth="1.3"
                  stroke={van.color}
                  initial={{ opacity: 0, scale: 0, fill: delivered ? van.color : "var(--widget-surface)" }}
                  animate={{ opacity: 1, scale: 1, fill: delivered ? van.color : "var(--widget-surface)" }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: ticks ? k * 0.01 : delay + 0.8 + k * 0.02, fill: { duration: 0.3 } }}
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                />
              );
            })}
          </AnimatePresence>

          {/* depot */}
          <rect x={DEPOT[0] - 7} y={DEPOT[1] - 7} width="14" height="14" rx="3.5" className="fill-[var(--ant-color-text-heading)]" />
          <text x={DEPOT[0] + 11} y={DEPOT[1] + 22} fontSize="10" fontWeight="600" className="fill-tertiary">
            Depot
          </text>

          {/* vans */}
          {VANS.map((v, i) => {
            const [x, y] = pointAt(i, p[i]);
            return (
              <motion.g
                key={v.id}
                className="cursor-pointer"
                onClick={() => setSel(i)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, x, y }}
                transition={{ opacity: { delay: delay + 0.6 }, x: { duration: TICK_MS / 1000, ease: "linear" }, y: { duration: TICK_MS / 1000, ease: "linear" } }}
                whileHover={{ scale: 1.2 }}
              >
                {v.late ? (
                  <motion.circle
                    r="7"
                    fill="none"
                    strokeWidth="2"
                    stroke="var(--ios-orange)"
                    initial={{ r: 7 }}
                    animate={{ r: [7, 15], opacity: [0.8, 0] }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut" }}
                  />
                ) : null}
                <circle r="11" fill="transparent" />
                <circle
                  r={i === sel ? 7.5 : 6}
                  fill={v.color}
                  strokeWidth="2.5"
                  stroke={v.late ? "var(--ios-orange)" : "var(--widget-surface)"}
                />
              </motion.g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 flex gap-1.5">
        {VANS.map((v, i) => {
          const d = doneOf(v, p[i]);
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setSel(i)}
              className={cn(
                "flex h-[26px] min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-left whitespace-nowrap outline-none transition-colors",
                i === sel ? "bg-fill-secondary" : "bg-fill-quaternary hover:bg-fill-tertiary",
              )}
            >
              <span className={cn("size-2 shrink-0 rounded-full", v.dot)} />
              <span className="text-[12px] font-semibold text-heading">{v.id}</span>
              <span className={cn("ml-auto text-[10px] tabular", v.late ? "font-semibold text-ios-orange" : "text-tertiary")}>
                {d}/{v.stops}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-2.5 border-t-[0.5px] border-split pt-2.5">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={van.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex min-w-0 flex-1 items-center gap-2.5"
          >
            <MemojiAvatar who={van.who} size={32} alt={van.driver} />
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[13px] font-medium text-heading">{van.driver}</div>
              <div className="truncate text-[11px] text-tertiary tabular">
                {van.id} · <AnimatedNumber value={done} /> of {van.stops} stops
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="text-right leading-tight whitespace-nowrap">
          <div className="text-[11px] text-tertiary">Back at</div>
          <div className="text-[15px] font-semibold text-heading tabular">{clock(eta)}</div>
        </div>
        <span
          className={cn(
            "w-[58px] rounded-full py-0.5 text-center text-[11px] font-semibold whitespace-nowrap",
            van.late ? "bg-ios-orange/15 text-ios-orange" : "bg-ios-green/15 text-ios-green",
          )}
        >
          {van.late ? (
            <>
              +<AnimatedNumber value={slip} /> min
            </>
          ) : (
            "On time"
          )}
        </span>
        <Button shape="circle" color="default" variant="filled" icon={<Call16Regular />} aria-label={`Call ${van.driver}`} />
      </div>
    </Widget>
  );
}
