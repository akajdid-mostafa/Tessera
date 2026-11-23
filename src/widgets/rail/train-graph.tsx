import { Checkmark16Filled, VehicleSubway20Filled, Warning16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { enterDelay, hhmm, late, useInterval } from "./_parts";

type Code = "LBG" | "ECR" | "RDH" | "GTW" | "HHE" | "BTN";
type Stop = [Code, number, number]; // station, arrive, depart (minutes after midnight)
type Train = { id: string; fast: boolean; units: string; stops: Stop[]; lostAt?: Code; lost?: number; why?: string };

const KM: Record<Code, number> = { LBG: 0, ECR: 16.1, RDH: 33.0, GTW: 43.6, HHE: 60.2, BTN: 81.0 };
const NAME: Record<Code, string> = {
  LBG: "London Bridge",
  ECR: "East Croydon",
  RDH: "Redhill",
  GTW: "Gatwick Airport",
  HHE: "Haywards Heath",
  BTN: "Brighton",
};
const CODES = Object.keys(KM) as Code[];
const JUNCTION_KM = 35.5; // Earlswood Jn, where the Quarry line rejoins
const MIN_HEADWAY = 3; // minutes
const HOLD = 4; // regulation: hold the fast at East Croydon

const t = (h: number, m: number) => h * 60 + m;
const T0 = t(7, 0);
const T1 = t(9, 0);
const START = t(7, 46);

const TRAINS: Train[] = [
  { id: "1C14", fast: false, units: "8-car Class 377", stops: [["BTN", t(6, 44), t(6, 44)], ["HHE", t(7, 2), t(7, 3)], ["GTW", t(7, 15), t(7, 17)], ["RDH", t(7, 25), t(7, 26)], ["ECR", t(7, 40), t(7, 41)], ["LBG", t(7, 56), t(7, 56)]] },
  { id: "1B29", fast: false, units: "8-car Class 377", stops: [["LBG", t(6, 50), t(6, 50)], ["ECR", t(7, 4), t(7, 5)], ["RDH", t(7, 19), t(7, 20)], ["GTW", t(7, 28), t(7, 30)], ["HHE", t(7, 43), t(7, 44)], ["BTN", t(8, 3), t(8, 3)]] },
  { id: "1C20", fast: false, units: "12-car Class 700", stops: [["BTN", t(7, 0), t(7, 0)], ["HHE", t(7, 18), t(7, 19)], ["GTW", t(7, 31), t(7, 33)], ["RDH", t(7, 41), t(7, 42)], ["ECR", t(7, 56), t(7, 57)], ["LBG", t(8, 12), t(8, 12)]] },
  { id: "1B37", fast: true, units: "12-car Class 700", stops: [["LBG", t(7, 4), t(7, 4)], ["ECR", t(7, 17), t(7, 18)], ["GTW", t(7, 35), t(7, 37)], ["HHE", t(7, 49), t(7, 50)], ["BTN", t(8, 8), t(8, 8)]] },
  { id: "1B41", fast: false, units: "8-car Class 377", lostAt: "ECR", lost: 7, why: "Door fault at East Croydon", stops: [["LBG", t(7, 20), t(7, 20)], ["ECR", t(7, 34), t(7, 35)], ["RDH", t(7, 49), t(7, 50)], ["GTW", t(7, 58), t(8, 0)], ["HHE", t(8, 13), t(8, 14)], ["BTN", t(8, 33), t(8, 33)]] },
  { id: "1C28", fast: true, units: "12-car Class 700", stops: [["BTN", t(7, 22), t(7, 22)], ["HHE", t(7, 39), t(7, 40)], ["GTW", t(7, 52), t(7, 54)], ["ECR", t(8, 10), t(8, 11)], ["LBG", t(8, 24), t(8, 24)]] },
  { id: "1A47", fast: true, units: "12-car Class 700", stops: [["LBG", t(7, 34), t(7, 34)], ["ECR", t(7, 47), t(7, 48)], ["GTW", t(8, 4), t(8, 6)], ["HHE", t(8, 18), t(8, 19)], ["BTN", t(8, 37), t(8, 37)]] },
  { id: "1C34", fast: false, units: "8-car Class 377", stops: [["BTN", t(7, 40), t(7, 40)], ["HHE", t(7, 58), t(7, 59)], ["GTW", t(8, 11), t(8, 13)], ["RDH", t(8, 21), t(8, 22)], ["ECR", t(8, 36), t(8, 37)], ["LBG", t(8, 52), t(8, 52)]] },
  { id: "1B53", fast: false, units: "8-car Class 377", stops: [["LBG", t(7, 50), t(7, 50)], ["ECR", t(8, 4), t(8, 5)], ["RDH", t(8, 19), t(8, 20)], ["GTW", t(8, 28), t(8, 30)], ["HHE", t(8, 43), t(8, 44)], ["BTN", t(9, 3), t(9, 3)]] },
];

/** Shift every time after a station's arrival by `by` minutes. */
function lose(stops: Stop[], at: Code, by: number): Stop[] {
  const i = stops.findIndex((s) => s[0] === at);
  return stops.map((s, k) => (k < i ? s : k === i ? [s[0], s[1], s[2] + by] : [s[0], s[1] + by, s[2] + by]));
}

type Pt = { t: number; km: number };
const points = (stops: Stop[]): Pt[] => stops.flatMap(([c, a, d]) => (a === d ? [{ t: a, km: KM[c] }] : [{ t: a, km: KM[c] }, { t: d, km: KM[c] }]));

/** Where a path is at time `at`, or null outside its run. */
function posAt(pts: Pt[], at: number): number | null {
  if (at < pts[0].t || at > pts[pts.length - 1].t) return null;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if (at <= b.t) return b.t === a.t ? b.km : a.km + ((b.km - a.km) * (at - a.t)) / (b.t - a.t);
  }
  return null;
}
/** When a path passes `km`, or null. */
function timeAt(pts: Pt[], km: number): number | null {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if ((km - a.km) * (km - b.km) <= 0 && a.km !== b.km) return a.t + ((b.t - a.t) * (km - a.km)) / (b.km - a.km);
  }
  return null;
}

const W = 330;
const H = 196;
const X = (m: number) => ((m - T0) / (T1 - T0)) * W;
const Y = (km: number) => (km / KM.BTN) * H;
const pathOf = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${X(p.t).toFixed(1)} ${Y(p.km).toFixed(1)}`).join(" ");

/** Split a path at time `at` into the run so far and the forecast. */
function split(pts: Pt[], at: number): [Pt[], Pt[]] {
  const km = posAt(pts, at);
  if (at <= pts[0].t) return [[], pts];
  if (km === null) return [pts, []];
  const here = { t: at, km };
  return [[...pts.filter((p) => p.t < at), here], [here, ...pts.filter((p) => p.t > at)]];
}

/** Rail · large. A time-distance train graph with a creeping NOW line, each train's run drawn solid and its forecast dashed; a late stopper sets up a headway conflict at Earlswood Jn that you clear by holding the fast behind it. */
export function TrainGraphWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [now, setNow] = useState(START);
  const [sel, setSel] = useState("1A47");
  const [held, setHeld] = useState(false);
  const delay = enterDelay(index);

  useInterval(() => setNow((n) => (n >= t(8, 44) ? START : n + 1)), 3000);

  const live = TRAINS.map((tr) => {
    let stops = tr.lostAt && tr.lost ? lose(tr.stops, tr.lostAt, tr.lost) : tr.stops;
    if (tr.id === "1A47" && held) stops = lose(stops, "ECR", HOLD);
    const pts = points(stops);
    const plan = points(tr.stops);
    const end = stops[stops.length - 1];
    const planEnd = tr.stops[tr.stops.length - 1];
    return { ...tr, run: stops, pts, plan, delayed: end[1] - planEnd[1] };
  });
  const depAt = (stops: Stop[], c: Code) => stops.find((x) => x[0] === c)?.[2] ?? Infinity;
  /** Minutes late right now: a loss only counts once the train has run into it. */
  const delayNow = (tr: Train) =>
    (tr.lostAt && now >= depAt(tr.stops, tr.lostAt) ? tr.lost ?? 0 : 0) +
    (tr.id === "1A47" && held && now >= depAt(tr.stops, "ECR") ? HOLD : 0);

  const slow = live.find((x) => x.id === "1B41")!;
  const fast = live.find((x) => x.id === "1A47")!;
  const tSlow = timeAt(slow.pts, JUNCTION_KM) ?? 0;
  const tFast = timeAt(fast.pts, JUNCTION_KM) ?? 0;
  const conflict = Math.abs(tFast - tSlow) < MIN_HEADWAY;
  const conflictAt = Math.min(tSlow, tFast);

  const running = live.filter((x) => posAt(x.pts, now) !== null);
  const lateNow = running.filter((x) => delayNow(x) > 0);
  const s = live.find((x) => x.id === sel) ?? slow;
  const nextStop = s.run.find((x) => x[1] > now);
  const delayed = delayNow(s);

  return (
    <Widget size="large" index={index} label="Train graph">
      <WidgetHeader
        icon={<VehicleSubway20Filled />}
        tint={conflict ? "var(--ios-red)" : "var(--ios-indigo)"}
        title="Train Graph"
        subtitle="Brighton Main Line · LBG–BTN · 81 km"
        extra={
          conflict ? (
            <span className="flex items-center gap-1.5 rounded-full bg-ios-red/15 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-ios-red">
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-ios-red opacity-70" />
                <span className="relative size-1.5 rounded-full bg-ios-red" />
              </span>
              Conflict {hhmm(conflictAt)}
            </span>
          ) : (
            <span className="rounded-full bg-fill-tertiary px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-secondary">Plan clear</span>
          )
        }
      />

      <div className="mt-2 flex items-baseline-last gap-5 whitespace-nowrap">
        <div className="leading-tight">
          <div className="text-[11px] text-tertiary">Running</div>
          <AnimatedNumber value={running.length} className="text-[22px] font-semibold tracking-tight text-heading" />
        </div>
        <div className="leading-tight">
          <div className="text-[11px] text-tertiary">Late</div>
          <AnimatedNumber value={lateNow.length} className={cn("text-[22px] font-semibold tracking-tight", lateNow.length ? "text-ios-orange" : "text-heading")} />
        </div>
        <div className="leading-tight">
          <div className="text-[11px] text-tertiary">Min headway</div>
          <div className={cn("text-[22px] font-semibold tracking-tight", conflict ? "text-ios-red" : "text-heading")}>
            <AnimatedNumber value={Math.abs(tFast - tSlow)} format={{ maximumFractionDigits: 1, minimumFractionDigits: 1 }} />
            <span className="text-[11px] font-medium text-tertiary"> min</span>
          </div>
        </div>
        <div className="ml-auto text-right leading-tight">
          <div className="text-[11px] text-tertiary">Now</div>
          <div className="text-[22px] font-semibold tracking-tight text-heading tabular">{hhmm(now)}</div>
        </div>
      </div>

      <div className="mt-2 flex gap-1.5">
        <div className="relative h-[196px] w-[26px] shrink-0 text-[9px] font-semibold text-tertiary">
          {CODES.map((c, i) => (
            <span
              key={c}
              title={NAME[c]}
              className={cn("absolute left-0", i === 0 ? "top-0" : i === CODES.length - 1 ? "bottom-0" : "-translate-y-1/2")}
              style={i === 0 || i === CODES.length - 1 ? undefined : { top: `${(Y(KM[c]) / H) * 100}%` }}
            >
              {c}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative h-[196px]">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-label="Time-distance graph">
              {CODES.map((c) => (
                <line key={c} x1="0" x2={W} y1={Y(KM[c])} y2={Y(KM[c])} strokeWidth="1" vectorEffect="non-scaling-stroke" className="stroke-split" />
              ))}
              {[30, 60, 90].map((m) => (
                <line key={m} x1={X(T0 + m)} x2={X(T0 + m)} y1="0" y2={H} strokeDasharray="2 3" strokeWidth="1" vectorEffect="non-scaling-stroke" className="stroke-split" />
              ))}
              <line x1="0" x2={W} y1={Y(JUNCTION_KM)} y2={Y(JUNCTION_KM)} strokeDasharray="1 3" strokeWidth="1" vectorEffect="non-scaling-stroke" className="stroke-tertiary" />

              {live.map((tr, i) => {
                const [past, future] = split(tr.pts, now);
                const isSel = tr.id === sel;
                const hot = conflict && (tr.id === "1A47" || tr.id === "1B41");
                const color = tr.delayed > 0 && tr.id === "1B41" ? "var(--ios-orange)" : tr.fast ? "var(--ios-blue)" : "var(--ant-color-text-secondary)";
                const w = isSel ? 2.6 : 1.5;
                return (
                  <motion.g
                    key={tr.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: sel && !isSel && !hot ? 0.7 : 1 }}
                    transition={{ duration: 0.6, delay: delay + 0.1 + i * 0.05 }}
                  >
                    {tr.delayed > 0 || (tr.id === "1A47" && held) ? (
                      <path d={pathOf(tr.plan)} fill="none" strokeDasharray="1 3" strokeWidth="1" vectorEffect="non-scaling-stroke" className="stroke-tertiary" />
                    ) : null}
                    {past.length > 1 ? (
                      <path d={pathOf(past)} fill="none" stroke={color} strokeWidth={w} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    ) : null}
                    {future.length > 1 ? (
                      <path d={pathOf(future)} fill="none" stroke={color} strokeWidth={w} strokeDasharray="4 3" strokeOpacity="0.55" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    ) : null}
                    <path
                      d={pathOf(tr.pts)}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="12"
                      vectorEffect="non-scaling-stroke"
                      className="cursor-pointer"
                      style={{ pointerEvents: "stroke" }}
                      onClick={() => setSel(tr.id)}
                    >
                      <title>{`${tr.id} · ${NAME[tr.stops[0][0]]} → ${NAME[tr.stops[tr.stops.length - 1][0]]}`}</title>
                    </path>
                  </motion.g>
                );
              })}
            </svg>

            {/* trains on the move: one dot each where NOW cuts their path */}
            {running.map((tr) => {
              const km = posAt(tr.pts, now) ?? 0;
              return (
                <motion.span
                  key={tr.id}
                  className={cn(
                    "pointer-events-none absolute size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--widget-surface)]",
                    tr.id === "1B41" ? "bg-ios-orange" : tr.fast ? "bg-ios-blue" : "bg-secondary",
                  )}
                  initial={false}
                  animate={{ left: `${(X(now) / W) * 100}%`, top: `${(Y(km) / H) * 100}%` }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                />
              );
            })}

            {/* the predicted conflict at the junction */}
            <AnimatePresence>
              {conflict ? (
                <motion.span
                  key="conflict"
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${(X(conflictAt) / W) * 100}%`, top: `${(Y(JUNCTION_KM) / H) * 100}%` }}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.4 }}
                >
                  {!reduce ? (
                    <motion.span
                      className="absolute -inset-1 rounded-full border-2 border-ios-red"
                      animate={{ scale: [1, 1.9], opacity: [0.8, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                    />
                  ) : null}
                  <span className="block size-3 rounded-full border-2 border-ios-red bg-[var(--widget-surface)]" />
                </motion.span>
              ) : null}
            </AnimatePresence>
            <span
              className="pointer-events-none absolute right-0 text-[9px] leading-none text-tertiary"
              style={{ top: `calc(${(Y(JUNCTION_KM) / H) * 100}% + 3px)` }}
            >
              Earlswood Jn
            </span>

            {/* NOW */}
            <motion.div
              className="pointer-events-none absolute inset-y-0 w-0"
              initial={{ left: "0%", opacity: 0 }}
              animate={{ left: `${(X(now) / W) * 100}%`, opacity: 1 }}
              transition={{ left: { duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: now === START ? delay : 0 }, opacity: { delay } }}
            >
              <span className="absolute inset-y-0 -left-px w-[2px] rounded-full bg-ios-red/70" />
            </motion.div>
          </div>
          <div className="relative mt-1 h-3 text-[10px] text-tertiary tabular">
            {[0, 30, 60, 90, 120].map((m) => (
              <span key={m} className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full" style={{ left: `${(m / 120) * 100}%` }}>
                {hhmm(T0 + m)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Selected train */}
      <div className="mt-auto flex h-[46px] items-center gap-2.5 rounded-2xl bg-fill-quaternary px-3">
        <span
          className={cn(
            "shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[12px] font-semibold",
            s.id === "1B41" ? "bg-ios-orange/15 text-ios-orange" : s.fast ? "bg-ios-blue/15 text-ios-blue" : "bg-fill-tertiary text-secondary",
          )}
        >
          {s.id}
        </span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`${s.id}-${held}`}
            initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
            className="min-w-0 flex-1 leading-tight whitespace-nowrap"
          >
            <div className="truncate text-[13px] font-semibold text-heading">
              {NAME[s.stops[0][0]]} → {NAME[s.stops[s.stops.length - 1][0]]}
            </div>
            <div className={cn("flex items-center gap-1 truncate text-[11px] tabular", conflict && (s.id === "1A47" || s.id === "1B41") ? "text-ios-red" : "text-tertiary")}>
              {conflict && (s.id === "1A47" || s.id === "1B41") ? <Warning16Filled className="size-3 shrink-0" /> : null}
              <span className="truncate">
                {conflict && s.id === "1A47"
                  ? `Meets 1B41 at Earlswood Jn ${hhmm(conflictAt)} · <${MIN_HEADWAY} min`
                  : s.id === "1B41"
                    ? `${s.why} · ${nextStop ? `next ${NAME[nextStop[0]]} ${hhmm(nextStop[1])}` : "terminated"}`
                    : s.id === "1A47" && held
                      ? `Held ${HOLD} min at East Croydon · path clear`
                      : `${s.units} · ${nextStop ? `next ${NAME[nextStop[0]]} ${hhmm(nextStop[1])}` : "terminated"}`}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
        {conflict && s.id === "1A47" ? (
          <Button size="small" type="primary" onClick={() => setHeld(true)}>
            Hold {HOLD} min
          </Button>
        ) : (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular",
              delayed > 0 ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-tertiary text-secondary",
            )}
          >
            {late(delayed)}
          </span>
        )}
        {s.id === "1A47" && held ? <Checkmark16Filled className="shrink-0 text-tertiary" /> : null}
      </div>
    </Widget>
  );
}
