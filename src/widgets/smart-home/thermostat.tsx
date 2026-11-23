import { Fire20Filled, Power20Filled, Temperature20Filled, WeatherSnowflake20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type PointerEvent, useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Mode = "heat" | "cool" | "off";

const MIN = 10;
const MAX = 30;
const START = 135;
const SWEEP = 270;
const TICKS = 61;
const CX = 64;
const CY = 64;

const MODES: Record<Mode, { label: string; color: string; chip: string; Icon: typeof Fire20Filled }> = {
  heat: { label: "Heat", color: "var(--ios-orange)", chip: "bg-ios-orange/15 text-ios-orange", Icon: Fire20Filled },
  cool: { label: "Cool", color: "var(--ios-blue)", chip: "bg-ios-blue text-white", Icon: WeatherSnowflake20Filled },
  off: { label: "Off", color: "var(--ant-color-text-tertiary)", chip: "bg-fill-secondary text-secondary", Icon: Power20Filled },
};
const NEXT: Record<Mode, Mode> = { heat: "cool", cool: "off", off: "heat" };

const angle = (v: number) => START + ((Math.min(MAX, Math.max(MIN, v)) - MIN) / (MAX - MIN)) * SWEEP;
const polar = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
};
const ONE = { minimumFractionDigits: 1, maximumFractionDigits: 1 } as const;

/** Smart home · small. A thermostat dial whose ticks light up between the room and the setpoint while it heats or cools; drag around the dial (or use arrow keys) to set the target and tap the chip to switch Heat, Cool and Off. */
export function ThermostatWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [mode, setMode] = useState<Mode>("heat");
  const [target, setTarget] = useState(21.5);
  const [inside, setInside] = useState(19.6);
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);
  const dial = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), delay * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  // The room follows the system: 0.1° every few seconds toward the setpoint, or back to 18.4° when off.
  useEffect(() => {
    const t = window.setInterval(() => {
      setInside((c) => {
        const goal = mode === "off" ? 18.4 : target;
        if (mode === "heat" && c >= goal) return c;
        if (mode === "cool" && c <= goal) return c;
        if (Math.abs(goal - c) < 0.05) return c;
        return Math.round((c + Math.sign(goal - c) * 0.1) * 10) / 10;
      });
    }, 2600);
    return () => window.clearInterval(t);
  }, [mode, target]);

  const fromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const el = dial.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const deg = (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
    let rel = (((deg - START) % 360) + 360) % 360;
    if (rel > SWEEP) rel = rel > SWEEP + (360 - SWEEP) / 2 ? 0 : SWEEP;
    setTarget(Math.round((MIN + (rel / SWEEP) * (MAX - MIN)) * 2) / 2);
  };

  const m = MODES[mode];
  const active = mode !== "off";
  const working = (mode === "heat" && inside < target - 0.15) || (mode === "cool" && inside > target + 0.15);
  const status = mode === "off" ? "Off" : working ? (mode === "heat" ? "Heating" : "Cooling") : "Holding";
  const lo = Math.min(inside, target);
  const hi = Math.max(inside, target);
  const knob = polar(angle(ready ? target : MIN), 52);
  const now = polar(angle(inside), 38);

  return (
    <Widget size="small" index={index} label="Thermostat">
      <WidgetHeader
        icon={<Temperature20Filled />}
        tint={active ? m.color : "var(--ios-teal)"}
        title="Thermostat"
        subtitle={status}
        extra={
          <motion.button
            type="button"
            aria-label={`Mode: ${m.label}. Switch mode`}
            whileTap={{ scale: 0.85 }}
            onClick={() => setMode((x) => NEXT[x])}
            className={cn("grid size-7 shrink-0 cursor-pointer place-items-center rounded-full text-[15px] transition-colors", m.chip)}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={mode}
                initial={{ scale: 0.4, rotate: -90, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.4, rotate: 90, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 26 }}
                className="grid place-items-center"
              >
                <m.Icon />
              </motion.span>
            </AnimatePresence>
          </motion.button>
        }
      />

      <div
        ref={dial}
        role="slider"
        tabIndex={0}
        aria-label="Target temperature"
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={target}
        className="relative mx-auto mt-1 size-[124px] shrink-0 cursor-grab touch-none rounded-full outline-none active:cursor-grabbing"
        onPointerDown={(e) => {
          if (!active) return;
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {}
          setDragging(true);
          fromPointer(e);
        }}
        onPointerMove={(e) => dragging && fromPointer(e)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={(e) => {
          if (!active) return;
          if (e.key === "ArrowUp" || e.key === "ArrowRight") setTarget((v) => Math.min(MAX, v + 0.5));
          if (e.key === "ArrowDown" || e.key === "ArrowLeft") setTarget((v) => Math.max(MIN, v - 0.5));
        }}
      >
        <svg viewBox="0 0 128 128" className="absolute inset-0 size-full" aria-hidden>
          {Array.from({ length: TICKS }, (_, i) => {
            const v = MIN + (i / (TICKS - 1)) * (MAX - MIN);
            const a = START + (i / (TICKS - 1)) * SWEEP;
            const lit = active && v >= lo - 0.01 && v <= hi + 0.01 && hi - lo > 0.15;
            const p0 = polar(a, lit ? 43 : 46);
            const p1 = polar(a, 56);
            const k = lit ? Math.round((mode === "cool" ? hi - v : v - lo) / 0.33) : 0;
            return (
              <motion.line
                key={i}
                x1={p0.x}
                y1={p0.y}
                x2={p1.x}
                y2={p1.y}
                strokeWidth={lit ? 2.2 : 1.4}
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={
                  lit && working
                    ? { opacity: [1, 0.45, 1], stroke: m.color }
                    : { opacity: lit ? 1 : 0.35, stroke: lit ? m.color : "var(--ant-color-text-tertiary)" }
                }
                transition={
                  lit && working
                    ? { opacity: { duration: 1.6, repeat: Infinity, delay: 1.6 + k * 0.08 }, stroke: { duration: 0.3 } }
                    : { opacity: { delay: ready ? 0 : delay + i * 0.008, duration: 0.25 }, stroke: { duration: 0.3 } }
                }
              />
            );
          })}
          <motion.circle
            r="2.6"
            cx={now.x}
            cy={now.y}
            initial={false}
            animate={{ cx: now.x, cy: now.y }}
            transition={{ type: "spring", stiffness: 160, damping: 20 }}
            style={{ fill: "var(--ant-color-text-secondary)" }}
          />
          {active ? (
            <motion.circle
              r={dragging ? 7 : 5.5}
              strokeWidth="2.5"
              initial={{ cx: polar(START, 52).x, cy: polar(START, 52).y, r: dragging ? 7 : 5.5 }}
              animate={{ cx: knob.x, cy: knob.y, r: dragging ? 7 : 5.5 }}
              transition={dragging ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 18 }}
              style={{ fill: "var(--widget-surface)", stroke: m.color }}
            />
          ) : null}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="text-[11px] font-medium text-tertiary">{active ? `${m.label} to` : "System"}</span>
          <span className="mt-1 text-[26px] font-semibold tracking-tight text-heading">
            {active ? <AnimatedNumber value={target} format={ONE} suffix="°" /> : "Off"}
          </span>
          <span className="mt-1.5 text-[11px] text-tertiary tabular">
            Inside <AnimatedNumber value={inside} format={ONE} suffix="°" className="font-semibold text-secondary" />
          </span>
        </div>
      </div>
    </Widget>
  );
}
