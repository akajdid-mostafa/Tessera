import { TopSpeed20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { enterDelay, useInterval } from "./_parts";

/* Distance-based supervision over 12 km of line (route km 18–30). */
const KM0 = 18;
const LEN = 12;
const TSR = { from: 5.2, to: 6.0, v: 40 };
const DECEL = 0.6; // m/s², braking curve deceleration
const ms = (kmh: number) => kmh / 3.6;
const kmh = (v: number) => v * 3.6;

/** Static line speed with the temporary speed restriction. */
const mrsp = (x: number) => (x < TSR.from ? 125 : x < TSR.to ? TSR.v : x < 8.6 ? 100 : 125);
/** Permitted speed: the line speed, capped by the braking curve into the TSR. */
const permitted = (x: number) =>
  x < TSR.from ? Math.min(125, kmh(Math.sqrt(ms(TSR.v) ** 2 + 2 * DECEL * (TSR.from - x) * 1000))) : mrsp(x);

/** The driver: holds line speed, brakes a touch late for the TSR, then climbs back. */
function actual(x: number) {
  if (x < 1.5) return 118 + (x / 1.5) * 6;
  if (x < 4.45) return 124 - 0.4 * Math.sin(x * 3);
  if (x < 5.12) return kmh(Math.sqrt(Math.max(ms(38.5) ** 2, ms(124) ** 2 - 2 * 0.78 * (x - 4.45) * 1000)));
  if (x < 6.2) return 38.5 + 0.4 * Math.sin(x * 9);
  if (x < 8.8) return Math.min(98, kmh(Math.sqrt(ms(38.5) ** 2 + 2 * 0.35 * (x - 6.2) * 1000)));
  return Math.min(123, kmh(Math.sqrt(ms(98) ** 2 + 2 * 0.35 * (x - 8.8) * 1000)));
}

const W = 250;
const H = 106;
const V_MAX = 140;
const X = (x: number) => (x / LEN) * W;
const Y = (v: number) => H - (v / V_MAX) * H;

const MRSP_D = (() => {
  const steps: [number, number][] = [[0, 125], [TSR.from, TSR.v], [TSR.to, 100], [8.6, 125], [LEN, 125]];
  return steps.map(([x, v], i) => (i === 0 ? `M0 ${Y(v)}` : `H${X(x)} V${Y(v)}`)).join(" ") + ` H${W}`;
})();
const CURVE_D = (() => {
  const pts = Array.from({ length: 24 }, (_, i) => 3.9 + ((TSR.from - 3.9) * i) / 23).filter((x) => permitted(x) < 125 || x > 4.2);
  return pts.map((x, i) => `${i ? "L" : "M"}${X(x).toFixed(1)} ${Y(permitted(x)).toFixed(1)}`).join(" ");
})();
const SAMPLES = Array.from({ length: LEN * 20 + 1 }, (_, i) => i / 20);

/** Rail · medium. A train's speed against the line limit, a temporary restriction and its braking curve, drawn as it runs; it warns when the driver brakes late, and scrubbing reads limit and speed at any kilometre. */
export function SpeedProfileWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [pos, setPos] = useState(0.4);
  const [scrub, setScrub] = useState<number | null>(null);
  const delay = enterDelay(index);

  // Time runs about 12× fast: the 12 km pass takes under a minute.
  useInterval(() => setPos((p) => (p >= LEN - 0.2 ? 0.2 : p + (actual(p) / 3600) * 0.25 * 12)), 250);

  const trace = useMemo(() => {
    const past = SAMPLES.filter((x) => x <= pos);
    const d = past.map((x, i) => `${i ? "L" : "M"}${X(x).toFixed(1)} ${Y(actual(x)).toFixed(1)}`).join(" ");
    const over = past.filter((x) => actual(x) > permitted(x));
    const od = over.length > 1 ? over.map((x, i) => `${i ? "L" : "M"}${X(x).toFixed(1)} ${Y(actual(x)).toFixed(1)}`).join(" ") : "";
    return { d, od };
  }, [pos]);

  const at = scrub ?? pos;
  const v = actual(at);
  const perm = permitted(at);
  const overspeed = actual(pos) > permitted(pos) + 0.5;
  const toTarget = TSR.from - pos;
  const showTarget = toTarget > 0 && toTarget < 4;

  return (
    <Widget size="medium" index={index} label="Speed against limit" glow={{ colors: ["var(--ios-orange)", "var(--ios-red)", "var(--ios-orange)"], mode: "pulse", duration: 1.2 }} glowActive={overspeed}>
      <WidgetHeader
        icon={<TopSpeed20Filled />}
        tint={overspeed ? "var(--ios-orange)" : "var(--ios-blue)"}
        title="Speed vs Limit"
        subtitle="1A47 · Class 700 · ETCS L2 · FS"
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={overspeed ? "w" : "ok"}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                overspeed ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-tertiary text-secondary",
              )}
            >
              {overspeed ? "Overspeed warning" : "Supervised"}
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="mt-2 flex h-[122px] gap-3">
        <div className="flex w-[104px] shrink-0 flex-col whitespace-nowrap">
          <div className="text-[11px] text-tertiary tabular">{scrub !== null ? `At km ${(KM0 + at).toFixed(1)}` : "Speed"}</div>
          <div className={cn("text-[30px] leading-none font-semibold tracking-tight", overspeed && scrub === null ? "text-ios-orange" : "text-heading")}>
            <AnimatedNumber value={Math.round(v)} />
            <span className="text-[12px] font-medium text-tertiary"> km/h</span>
          </div>
          <div className="mt-1 text-[11px] text-tertiary tabular">
            Permitted <span className="font-semibold text-secondary">{Math.floor(perm)}</span>
          </div>
          <div className="mt-auto leading-tight">
            <div className="text-[11px] text-tertiary">Target</div>
            {showTarget && scrub === null ? (
              <>
                <div className="text-[13px] font-semibold text-heading tabular">
                  40 in <AnimatedNumber value={toTarget} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} /> km
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-fill-tertiary">
                  <motion.div
                    className="h-full rounded-full bg-ios-orange"
                    animate={{ width: `${(1 - toTarget / 4) * 100}%` }}
                    transition={{ duration: 0.25, ease: "linear" }}
                  />
                </div>
              </>
            ) : (
              <div className="text-[13px] font-semibold text-heading tabular">
                {Math.floor(mrsp(at))} <span className="text-[11px] font-normal text-tertiary">line speed</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div
            className="relative h-[106px] cursor-crosshair"
            onPointerMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setScrub(Math.min(LEN, Math.max(0, ((e.clientX - r.left) / r.width) * LEN)));
            }}
            onPointerLeave={() => setScrub(null)}
          >
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
              <motion.rect
                x={X(TSR.from)}
                width={X(TSR.to) - X(TSR.from)}
                y="0"
                height={H}
                fill="var(--ios-orange)"
                fillOpacity="0.13"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                style={{ transformBox: "fill-box", transformOrigin: "bottom" }}
                transition={{ type: "spring", stiffness: 200, damping: 24, delay: delay + 0.3 }}
              />
              {[25, 50, 75, 100].map((s) => (
                <line key={s} x1="0" x2={W} y1={Y(s)} y2={Y(s)} strokeWidth="1" vectorEffect="non-scaling-stroke" className="stroke-split" />
              ))}
              <motion.path
                d={MRSP_D}
                fill="none"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                className="stroke-secondary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay, duration: 0.8 }}
              />
              <motion.path
                d={CURVE_D}
                fill="none"
                stroke="var(--ios-orange)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                vectorEffect="non-scaling-stroke"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.4, duration: 0.8 }}
              />
              <path d={trace.d} fill="none" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="stroke-heading" />
              {trace.od ? (
                <path d={trace.od} fill="none" stroke="var(--ios-orange)" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              ) : null}
              {scrub !== null ? (
                <line x1={X(scrub)} x2={X(scrub)} y1="0" y2={H} strokeDasharray="2 2" strokeWidth="1" vectorEffect="non-scaling-stroke" className="stroke-tertiary" />
              ) : null}
            </svg>
            <span className="pointer-events-none absolute left-0.5 text-[9px] leading-none text-tertiary" style={{ top: `calc(${(Y(125) / H) * 100}% - 11px)` }}>
              125
            </span>
            <span
              className="pointer-events-none absolute -translate-x-1/2 text-[9px] leading-none font-semibold text-ios-orange"
              style={{ left: `${(X((TSR.from + TSR.to) / 2) / W) * 100}%`, top: `calc(${(Y(TSR.v) / H) * 100}% - 12px)` }}
            >
              TSR 40
            </span>
            <span className="pointer-events-none absolute text-[9px] leading-none text-tertiary" style={{ left: `calc(${(X(TSR.to) / W) * 100}% + 4px)`, top: `calc(${(Y(100) / H) * 100}% + 3px)` }}>
              100
            </span>
            {/* the train */}
            <motion.span
              className={cn(
                "pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--widget-surface)]",
                overspeed ? "bg-ios-orange" : "bg-heading",
              )}
              initial={{ opacity: 0 }}
              animate={{ left: `${(X(pos) / W) * 100}%`, top: `${(Y(actual(pos)) / H) * 100}%`, opacity: 1 }}
              transition={{ left: { duration: 0.25, ease: "linear" }, top: { duration: 0.25, ease: "linear" }, opacity: { delay: delay + 0.5 } }}
            />
            {overspeed && !reduce ? (
              <motion.span
                className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ios-orange"
                style={{ left: `${(X(pos) / W) * 100}%`, top: `${(Y(actual(pos)) / H) * 100}%` }}
                animate={{ scale: [1, 2.6], opacity: [0.6, 0] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeOut" }}
              />
            ) : null}
          </div>
          <div className="relative mt-1 h-3 text-[10px] text-tertiary tabular">
            {[0, 3, 6, 9, 12].map((k) => (
              <span key={k} className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full" style={{ left: `${(k / LEN) * 100}%` }}>
                {k === 0 ? `km ${KM0}` : KM0 + k}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Widget>
  );
}
