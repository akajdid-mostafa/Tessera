import { CameraDome20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Switch } from "@/registry/antuikit/ui/switch";
import { CAR } from "./_parts";

/* Where a camera saw motion, as a bearing around the car (0° = straight ahead). */
const ZONES = [
  { name: "Front", deg: 0 },
  { name: "Front right", deg: 45 },
  { name: "Right side", deg: 90 },
  { name: "Rear right", deg: 140 },
  { name: "Rear left", deg: 220 },
  { name: "Left side", deg: 270 },
] as const;

type Event = { id: number; min: number; zone: number };
const SEED: Event[] = [
  { id: 1, min: 9 * 60 + 12, zone: 0 },
  { id: 2, min: 13 * 60 + 40, zone: 3 },
  { id: 3, min: 16 * 60 + 5, zone: 4 },
];
const clock = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const blip = (deg: number, r: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [44 + r * Math.cos(a), 44 + r * Math.sin(a)];
};

/** In-car · small. A guard-mode radar that sweeps while armed and drops a pulsing blip for each motion event. */
export function GuardModeWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [armed, setArmed] = useState(true);
  const [events, setEvents] = useState<Event[]>(SEED);
  const last = events[events.length - 1];
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    if (!armed) return;
    const t = window.setInterval(() => {
      setEvents((ev) => {
        const prev = ev[ev.length - 1];
        const zone = (prev.zone + 1 + Math.floor(Math.random() * (ZONES.length - 1))) % ZONES.length;
        return [...ev, { id: prev.id + 1, min: prev.min + 6 + Math.floor(Math.random() * 20), zone }].slice(-6);
      });
    }, 14000);
    return () => window.clearInterval(t);
  }, [armed]);

  return (
    <Widget size="small" index={index} label="Guard mode">
      <WidgetHeader
        icon={<CameraDome20Filled />}
        tint={armed ? "var(--ios-red)" : "var(--ant-color-text-quaternary)"}
        title="Guard mode"
        subtitle={armed ? "Armed · 4 cameras" : "Off"}
        extra={<Switch size="small" color="error" checked={armed} onChange={setArmed} aria-label="Guard mode" />}
      />

      <div className="mt-2 flex items-center gap-2">
        <motion.div
          className={cn("relative size-[84px] shrink-0 transition-opacity duration-500", !armed && "opacity-45")}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay, type: "spring", stiffness: 220, damping: 20 }}
        >
          {armed && !reduce ? (
            <motion.div
              aria-hidden
              className="absolute inset-[2px] rounded-full"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0deg 290deg, color-mix(in srgb, var(--ios-red) 32%, transparent) 360deg)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3.6, repeat: Infinity, ease: "linear" }}
            />
          ) : null}
          <svg viewBox="0 0 88 88" className="absolute inset-0 size-full" aria-hidden>
            <circle cx="44" cy="44" r="42" fill="none" strokeWidth="1" className="stroke-fill" />
            <circle cx="44" cy="44" r="29" fill="none" strokeWidth="1" strokeDasharray="2 3" className="stroke-fill" />
            <g transform={`translate(${44 - CAR.w * 0.1} ${44 - CAR.h * 0.1}) scale(0.2)`}>
              <path d={CAR.body} className="fill-fill-secondary stroke-[var(--ant-color-text-tertiary)]" strokeWidth="5" />
              <path d={CAR.windshield} className="fill-fill" />
              <path d={CAR.rear} className="fill-fill" />
            </g>
            {events.slice(-4).map((e) => {
              const [x, y] = blip(ZONES[e.zone].deg, 35);
              const latest = e.id === last.id;
              return (
                <g key={e.id}>
                  {latest && armed ? (
                    <motion.circle
                      cx={x}
                      cy={y}
                      r="3"
                      fill="none"
                      stroke="var(--ios-red)"
                      strokeWidth="1.5"
                      initial={{ scale: 1, opacity: 0.9 }}
                      animate={{ scale: 3, opacity: 0 }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                    />
                  ) : null}
                  <motion.circle
                    cx={x}
                    cy={y}
                    r={latest ? 3.2 : 2.4}
                    fill={armed ? "var(--ios-red)" : "var(--ant-color-text-tertiary)"}
                    opacity={latest ? 1 : 0.5}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 16 }}
                  />
                </g>
              );
            })}
          </svg>
        </motion.div>

        <div className="min-w-0 leading-tight">
          <div className="text-[30px] leading-none font-semibold tracking-tight text-heading">
            <AnimatedNumber value={last.id} />
          </div>
          <div className="mt-0.5 text-[11px] whitespace-nowrap text-tertiary">events today</div>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={last.id}
              className="mt-1.5"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
            >
              <div className="flex items-center gap-1 text-[13px] font-semibold text-heading tabular">
                <span className={cn("size-1.5 shrink-0 rounded-full", armed ? "bg-ios-red" : "bg-fill")} />
                {clock(last.min)}
              </div>
              <div className="truncate text-[11px] text-tertiary">{ZONES[last.zone].name}</div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-auto truncate text-[11px] text-tertiary">
        {armed ? (
          <>
            <span className="font-medium text-ios-red">Recording</span> · ≈1.2 kWh/day
          </>
        ) : (
          "Cameras idle · not recording"
        )}
      </div>
    </Widget>
  );
}
