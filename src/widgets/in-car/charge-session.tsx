import {
  Fire20Filled,
  Flash16Filled,
  Flash20Filled,
  Play16Filled,
  Stop16Filled,
  WeatherSnowflake20Regular,
} from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

const PACK_KWH = 100;
const WH_PER_KM = 164;
const PEAK_KW = 186;
const COLD_KW = 48;
const COLD_BELOW = 20;
const READY_AT = 35;
/** Demo pacing: one tick stands for a few real seconds of charging. */
const SOC_PER_KW_TICK = 0.0026;

type Sim = { soc: number; temp: number; power: number };
const START: Sim = { soc: 54, temp: 17, power: 0 };

function maxPower(temp: number, soc: number) {
  let kw = temp < COLD_BELOW ? COLD_KW : temp < READY_AT ? COLD_KW + ((temp - COLD_BELOW) / (READY_AT - COLD_BELOW)) * (PEAK_KW - COLD_KW) : PEAK_KW;
  if (soc > 70) kw *= Math.max(0.4, 1 - (soc - 70) / 35);
  return kw;
}

/** In-car · medium. A glassy in-car charge card where a cold battery holds power back until preconditioning warms it; drag the limit to set where it stops. */
export function ChargeSessionWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [sim, setSim] = useState<Sim>(START);
  const [limit, setLimit] = useState(80);
  const [running, setRunning] = useState(true);
  const live = useRef({ limit, running });
  live.current = { limit, running };
  const track = useRef<HTMLDivElement>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      setSim((s) => {
        const temp = Math.min(38, Math.round((s.temp + 0.1) * 100) / 100);
        const on = live.current.running && s.soc < live.current.limit;
        const power = on ? Math.round((maxPower(temp, s.soc) + (Math.random() - 0.5) * 2) * 10) / 10 : 0;
        const soc = on ? Math.min(live.current.limit, s.soc + power * SOC_PER_KW_TICK) : s.soc;
        return { soc, temp, power };
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  const setFromX = (clientX: number) => {
    const r = track.current?.getBoundingClientRect();
    if (!r) return;
    const pct = ((clientX - r.left) / r.width) * 100;
    setLimit(Math.min(100, Math.max(50, Math.round(pct / 5) * 5)));
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    setFromX(e.clientX);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) setFromX(e.clientX);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") setLimit((l) => Math.min(100, l + 5));
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") setLimit((l) => Math.max(50, l - 5));
  };

  const soc = Math.floor(sim.soc);
  const done = sim.soc >= limit;
  const charging = running && !done && sim.power > 0;
  const phase = sim.temp < COLD_BELOW ? "cold" : sim.temp < READY_AT ? "warming" : "ready";
  const minutes = charging ? Math.max(1, Math.round((((limit - sim.soc) / 100) * PACK_KWH * 60) / sim.power)) : 0;
  const kmPerMin = charging ? Math.round(sim.power / (WH_PER_KM / 1000) / 60) : 0;

  return (
    <Widget
      size="medium"
      index={index}
      label="Charging"
      surfaceClassName="bg-[linear-gradient(155deg,#e4f5f1_0%,#f3f7fb_52%,#e5edf9_100%)] dark:bg-[linear-gradient(155deg,#0a2622_0%,#0b1825_55%,#0a1120_100%)]"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-20 -right-12 size-56 rounded-full bg-[radial-gradient(circle,rgba(48,209,88,0.28),transparent_65%)] dark:bg-[radial-gradient(circle,rgba(48,209,88,0.22),transparent_65%)]"
          animate={charging && !reduce ? { scale: [1, 1.12, 1], opacity: [0.8, 1, 0.8] } : { scale: 1, opacity: 0.6 }}
          transition={{ duration: 3, repeat: charging ? Infinity : 0, ease: "easeInOut" }}
        />
      </div>

      <div className="relative flex h-full flex-col">
        <WidgetHeader
          icon={<Flash20Filled />}
          tint="var(--ios-green)"
          title="Charging"
          subtitle={`Fast charger · Bay 4 · ${running ? "Port latched" : "Paused"}`}
          extra={
            <Button
              size="small"
              variant="filled"
              color="default"
              icon={running ? <Stop16Filled /> : <Play16Filled />}
              onClick={() => setRunning((r) => !r)}
            >
              {running ? "Stop" : "Resume"}
            </Button>
          }
        />

        <div className="mt-2 grid grid-cols-[1fr_188px] gap-3">
          <div className="min-w-0 whitespace-nowrap">
            {/* NumberFlow pads its line by a quarter em above and below for the roll; pull that back. */}
            <div className="-my-1.5 flex items-baseline gap-1.5 text-heading">
              <span className="text-[30px] leading-none font-semibold tracking-tight">
                <AnimatedNumber value={soc} />
                <span className="text-[15px]">%</span>
              </span>
              <span className="text-[12px] text-tertiary tabular">→ {limit}%</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[12px] leading-[16px]">
              <Flash16Filled className={cn("shrink-0", charging ? "text-ios-green" : "text-tertiary")} />
              <span className="font-semibold text-heading">
                <AnimatedNumber value={sim.power} format={{ maximumFractionDigits: sim.power < 100 ? 1 : 0, minimumFractionDigits: sim.power < 100 && sim.power > 0 ? 1 : 0 }} /> kW
              </span>
              <span className="truncate text-tertiary">
                · +<AnimatedNumber value={kmPerMin} /> km/min
              </span>
            </div>
            <div className="truncate text-[11px] leading-[14px] text-tertiary">
              {!running ? "Charging stopped" : done ? `Limit reached · ${limit}%` : `${minutes} min to ${limit}%`}
            </div>
          </div>

          <div className="rounded-2xl bg-white/60 px-2.5 py-2 ring-1 ring-black/[0.04] ring-inset backdrop-blur-md dark:bg-white/[0.06] dark:ring-white/10">
            <div className="flex items-center gap-1.5 text-[12px] leading-none">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={phase === "ready" ? "fire" : "snow"}
                  initial={{ scale: 0.3, rotate: -90, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0.3, rotate: 90, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 360, damping: 18 }}
                  className={cn("grid text-[15px]", phase === "ready" ? "text-ios-green" : phase === "warming" ? "text-ios-orange" : "text-ios-blue")}
                >
                  {phase === "ready" ? <Fire20Filled /> : <WeatherSnowflake20Regular />}
                </motion.span>
              </AnimatePresence>
              <span className="text-secondary">Battery</span>
              <span className="font-semibold text-heading">
                <AnimatedNumber value={sim.temp} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} suffix=" °C" />
              </span>
              <span className="ml-auto text-[11px] text-tertiary tabular">{READY_AT}°+</span>
            </div>
            <div className="relative mt-1.5 h-1.5 rounded-full bg-fill-secondary">
              <span className="absolute inset-y-0 right-0 rounded-r-full bg-ios-green/25" style={{ left: `${(READY_AT / 45) * 100}%` }} />
              <motion.span
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full transition-colors duration-700",
                  phase === "ready" ? "bg-ios-green" : phase === "warming" ? "bg-ios-orange" : "bg-ios-blue",
                )}
                initial={{ width: 0 }}
                animate={{ width: `${(sim.temp / 45) * 100}%` }}
                transition={{ type: "spring", stiffness: 90, damping: 20, delay: sim.temp === START.temp ? delay : 0 }}
              />
            </div>
            <div
              className={cn(
                "mt-1.5 truncate text-[11px] leading-none font-medium",
                phase === "cold" ? "text-ios-orange" : phase === "warming" ? "text-secondary" : "text-ios-green",
              )}
            >
              {phase === "cold"
                ? `Cold · limited to ${COLD_KW} kW`
                : phase === "warming"
                  ? `Warming · full speed in ${Math.ceil(READY_AT - sim.temp)} min`
                  : "Preconditioned · full speed"}
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-center gap-3">
          <div className="w-10 shrink-0 leading-none">
            <div className="text-[10px] text-tertiary">Limit</div>
            <div className="mt-1 text-[15px] font-semibold text-heading">
              <AnimatedNumber value={limit} suffix="%" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div
              ref={track}
              role="slider"
              tabIndex={0}
              aria-label="Charge limit"
              aria-valuemin={50}
              aria-valuemax={100}
              aria-valuenow={limit}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onKeyDown={onKey}
              className="relative h-3.5 cursor-pointer touch-none rounded-full bg-black/[0.06] outline-none dark:bg-white/10"
            >
              <span className="absolute inset-y-0 right-0 rounded-r-full border-l border-dashed border-ios-orange/60 bg-ios-orange/10" style={{ left: "90%" }} />
              <motion.span
                className="absolute inset-y-0 left-0 overflow-hidden rounded-full bg-[linear-gradient(90deg,#1fae6a,#30d158)]"
                initial={{ width: 0 }}
                animate={{ width: `${sim.soc}%` }}
                transition={{ type: "spring", stiffness: 80, damping: 20, delay: sim.soc === START.soc ? delay : 0 }}
              >
                {charging && !reduce ? (
                  <motion.span
                    className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)] bg-[length:40px_100%] bg-no-repeat"
                    initial={{ x: "-20%" }}
                    animate={{ x: "110%" }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                ) : null}
              </motion.span>
              <motion.span
                className="absolute top-1/2 size-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.3)] ring-1 ring-black/10"
                initial={false}
                animate={{ left: `${limit}%` }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </div>
            <div className="relative mt-1 h-3 text-[10px] leading-3 text-tertiary">
              <span className="absolute left-[70%] -translate-x-1/2">Daily</span>
              <span className="absolute left-[95%] -translate-x-1/2 text-ios-orange">Trip</span>
            </div>
          </div>
        </div>
      </div>
    </Widget>
  );
}
