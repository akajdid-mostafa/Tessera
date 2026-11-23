import { Home20Filled, WeatherMoon16Filled, WeatherSunny16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { seeded } from "./_parts";

/* An 11 kW three-phase wallbox at home, 13:20 on a sunny weekday. Three ways to
 * charge: now at the day rate, at night in the off-peak window, or only from
 * solar surplus. Solar needs 4.1 kW (6 A on three phases) to start; below that
 * the charger pauses (OCPP SuspendedEVSE) and waits for the sun. */
type Mode = "now" | "offpeak" | "solar";
type State = "Charging" | "Scheduled" | "Paused" | "Plugged";

const NOW_H = 13 + 20 / 60;
const MAX_KW = 11;
const SOLAR_MIN = 4.1;
const CAP = 77;
const KM_PER_PCT = 4.6;
const BANDS = [
  { from: 0, to: 7, kind: "off" },
  { from: 7, to: 17, kind: "day" },
  { from: 17, to: 23, kind: "peak" },
  { from: 23, to: 24, kind: "off" },
] as const;
const PRICE = { off: 0.16, day: 0.27, peak: 0.38 } as const;
const BAND_CLASS = { off: "bg-ios-indigo/45", day: "bg-fill-secondary", peak: "bg-ios-orange/45" } as const;
const EUR = { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

const hhmm = (h: number) => {
  const t = ((h % 24) + 24) % 24;
  const hh = Math.floor(t);
  const mm = Math.round((t - hh) * 60);
  return `${String(mm === 60 ? hh + 1 : hh).padStart(2, "0")}:${String(mm === 60 ? 0 : mm).padStart(2, "0")}`;
};
const pct = (h: number) => `${(h / 24) * 100}%`;

/** EV charging · medium. A home wallbox: pick now, off-peak or solar; drag the battery's limit handle. */
export function HomeWallboxWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [mode, setMode] = useState<Mode>("solar");
  const [target, setTarget] = useState(80);
  const [soc, setSoc] = useState(62);
  const [kwh, setKwh] = useState(14.2);
  const [cost, setCost] = useState(2.18);
  const [surplus, setSurplus] = useState(5.6);
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const rand = useMemo(() => seeded(7), []);

  const reached = soc >= target;
  const state: State = reached
    ? "Plugged"
    : mode === "now"
      ? "Charging"
      : mode === "offpeak"
        ? "Scheduled"
        : surplus >= SOLAR_MIN
          ? "Charging"
          : "Paused";
  const kw = !ready || state !== "Charging" ? 0 : mode === "now" ? MAX_KW - 0.2 + surplus * 0.02 : Math.min(MAX_KW, surplus);

  const live = useRef({ kw, mode });
  useEffect(() => {
    live.current = { kw, mode };
  }, [kw, mode]);

  useEffect(() => {
    const r = window.setTimeout(() => setReady(true), delay * 1000 + 250);
    const t = window.setInterval(() => {
      setSurplus((s) => {
        const cloud = rand() < 0.1 ? -2.2 : 0;
        return Math.max(2.6, Math.min(7.2, s + (rand() - 0.5) * 0.9 + (5.2 - s) * 0.1 + cloud));
      });
      const { kw: k, mode: m } = live.current;
      if (k > 0) {
        const dE = k * 0.017;
        setSoc((v) => Math.min(100, v + (dE / CAP) * 100));
        setKwh((v) => v + dE);
        if (m === "now") setCost((v) => v + dE * PRICE.day);
      }
    }, 1500);
    return () => {
      window.clearTimeout(r);
      window.clearInterval(t);
    };
  }, [delay, rand]);

  const setFromX = (clientX: number) => {
    const r = barRef.current?.getBoundingClientRect();
    if (!r) return;
    let v = Math.round(((clientX - r.left) / r.width) * 100);
    v = Math.max(50, Math.min(100, v));
    for (const snap of [80, 90]) if (Math.abs(v - snap) <= 2) v = snap;
    setTarget(v);
  };

  const needH = Math.max(0, ((target - soc) / 100) * CAP) / MAX_KW;
  const plan: [number, number][] =
    reached
      ? []
      : mode === "now"
        ? [[NOW_H, Math.min(24, NOW_H + needH)]]
        : mode === "offpeak"
          ? 23 + needH > 24
            ? [
                [23, 24],
                [0, 23 + needH - 24],
              ]
            : [[23, 23 + needH]]
          : [[NOW_H, 17]];

  const tone =
    state === "Charging"
      ? { dot: "bg-ios-green", text: "text-ios-green" }
      : state === "Paused"
        ? { dot: "bg-ios-orange", text: "text-ios-orange" }
        : state === "Scheduled"
          ? { dot: "bg-ios-indigo", text: "text-ios-indigo" }
          : { dot: "bg-tertiary", text: "text-secondary" };

  const sub =
    state === "Plugged"
      ? "car stopped at limit"
      : state === "Scheduled"
        ? "starts 23:00"
        : state === "Paused"
          ? `surplus ${surplus.toFixed(1)} kW, needs ${SOLAR_MIN}`
          : mode === "solar"
            ? "solar surplus"
            : "16 A × 3 phases";

  const meta = reached
    ? `Limit reached · ${Math.round(target * KM_PER_PCT)} km range`
    : mode === "now"
      ? `Day rate €${PRICE.day.toFixed(2)} · full ~${hhmm(NOW_H + needH)}`
      : mode === "offpeak"
        ? `Night €${PRICE.off.toFixed(2)}/kWh · done ~${hhmm(23 + needH)}`
        : `Solar ${(surplus + 1.2).toFixed(1)} kW − home 1.2 kW`;

  return (
    <Widget size="medium" index={index} label="Home charger">
      <WidgetHeader
        icon={<Home20Filled />}
        tint="var(--ios-green)"
        title="Home charger"
        subtitle="Type 2 · 11 kW · Garage"
        extra={
          <Segmented
            size="small"
            value={mode}
            onChange={(v) => setMode(v as Mode)}
            options={[
              { value: "now", label: "Now" },
              { value: "offpeak", label: "Off-peak" },
              { value: "solar", label: "Solar" },
            ]}
          />
        }
      />

      <div className="mt-1.5 flex items-end justify-between gap-3 whitespace-nowrap">
        <div className="min-w-0 leading-tight">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={`${state}-${sub}`}
              initial={{ opacity: 0, y: 5, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -5, filter: "blur(3px)" }}
              className="flex items-center gap-1.5 truncate text-[11px]"
            >
              <span className={cn("size-1.5 shrink-0 rounded-full", tone.dot)} />
              <span className={cn("font-semibold", tone.text)}>{state}</span>
              <span className="truncate text-tertiary">· {sub}</span>
            </motion.div>
          </AnimatePresence>
          <div className="mt-0.5 text-[28px] leading-none font-semibold tracking-tight text-heading">
            <AnimatedNumber value={kw} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
            <span className="ml-1 text-[12px] font-medium text-tertiary">kW</span>
          </div>
        </div>
        <div className="shrink-0 text-right leading-tight">
          <div className="text-[11px] text-tertiary">{dragging ? "Set limit" : "Charge limit"}</div>
          <div className="text-[20px] font-semibold tracking-tight text-heading">
            <AnimatedNumber value={target} suffix="%" />
            <span className="ml-1 text-[11px] font-medium text-tertiary">
              <AnimatedNumber value={Math.round(target * KM_PER_PCT)} /> km
            </span>
          </div>
        </div>
      </div>

      {/* Battery with a draggable limit */}
      <div
        ref={barRef}
        role="slider"
        tabIndex={0}
        aria-label="Charge limit"
        aria-valuemin={50}
        aria-valuemax={100}
        aria-valuenow={target}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") setTarget((t) => Math.min(100, t + 5));
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") setTarget((t) => Math.max(50, t - 5));
        }}
        onPointerDown={(e: PointerEvent<HTMLDivElement>) => {
          try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
          setDragging(true);
          setFromX(e.clientX);
        }}
        onPointerMove={(e) => dragging && setFromX(e.clientX)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        className="relative mt-2 h-[22px] shrink-0 cursor-ew-resize touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ios-blue"
      >
        <div className="absolute inset-0 overflow-hidden rounded-full bg-fill-secondary">
          {/* Still to charge, up to the limit */}
          <motion.div
            className="absolute inset-y-0 opacity-35"
            style={{
              backgroundImage: "repeating-linear-gradient(135deg, var(--ios-green) 0 2px, transparent 2px 6px)",
            }}
            initial={false}
            animate={{ left: `${Math.min(soc, target)}%`, width: `${Math.max(0, target - soc)}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
          />
          <motion.div
            className="absolute inset-y-0 left-0 overflow-hidden rounded-full bg-ios-green"
            initial={{ width: 0 }}
            animate={{ width: `${soc}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 18, delay: kwh === 14.2 ? delay : 0 }}
          >
            {kw > 0 ? (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent bg-[length:40px_100%] bg-no-repeat"
                initial={{ x: "-20%" }}
                animate={{ x: "110%" }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
              />
            ) : null}
            <span className="absolute inset-y-0 left-2.5 flex items-center text-[11px] font-semibold text-black tabular">
              {Math.floor(soc)}%
            </span>
          </motion.div>
          {[80, 90].map((m) => (
            <span key={m} className="absolute inset-y-[5px] w-px bg-[var(--widget-surface)] opacity-60" style={{ left: `${m}%` }} />
          ))}
        </div>
        <motion.span
          className="absolute -top-[4px] -bottom-[4px] w-[7px] -translate-x-1/2 rounded-full bg-heading ring-2 ring-[var(--widget-surface)]"
          initial={false}
          animate={{ left: `${target}%`, scaleY: dragging ? 1.12 : 1 }}
          transition={{ type: "spring", stiffness: 520, damping: 18 }}
        />
      </div>

      {/* 24 h tariff ribbon with the plan */}
      <div className="mt-auto pt-3">
        <div className="relative h-2">
          <div className="absolute inset-0 flex overflow-hidden rounded-full">
            {BANDS.map((b) => (
              <span key={b.from} className={cn("h-full", BAND_CLASS[b.kind])} style={{ width: pct(b.to - b.from) }} />
            ))}
          </div>
          <AnimatePresence>
            {plan.map(([a, b]) => (
              <motion.span
                key={`${mode}-${a}`}
                className={cn("absolute inset-y-[1.5px] rounded-full", mode === "solar" ? "bg-ios-yellow" : "bg-ios-green")}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1, left: pct(a), width: pct(Math.max(0.15, b - a)) }}
                exit={{ opacity: 0 }}
                style={{ originX: 0 }}
                transition={{ type: "spring", stiffness: 160, damping: 22 }}
              />
            ))}
          </AnimatePresence>
          <span className="absolute -top-[3px] -bottom-[3px] w-[2px] -translate-x-1/2 rounded-full bg-heading" style={{ left: pct(NOW_H) }} />
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px] leading-tight whitespace-nowrap text-tertiary">
          <span className="tabular">
            <span className="font-semibold text-secondary">
              +<AnimatedNumber value={kwh} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} /> kWh
            </span>{" "}
            · <AnimatedNumber value={cost} format={EUR} />
          </span>
          <span className="flex min-w-0 items-center gap-1">
            {reached ? null : mode === "offpeak" ? (
              <WeatherMoon16Filled className="shrink-0 text-ios-indigo" />
            ) : mode === "solar" ? (
              <WeatherSunny16Filled className="shrink-0 text-ios-yellow" />
            ) : null}
            <span className="truncate tabular">{meta}</span>
          </span>
        </div>
      </div>
    </Widget>
  );
}
