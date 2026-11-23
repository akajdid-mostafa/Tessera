import {
  AlertOff16Regular,
  CheckmarkCircle16Filled,
  Heart16Filled,
  Warning16Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

/* One cycle of each waveform as a relative path, `unit` wide, on a 40-high box. */
const WAVES = {
  ecg: { base: 30, unit: 60, d: "l10 0 q3 -4 6 0 l4 0 l2 3 l3 -22 l3 26 l2 -7 l5 0 q4 -7 8 0 l17 0" },
  pleth: { base: 33, unit: 60, d: "c6 0 8 -22 16 -22 c5 0 7 10 10 12 c2 1 4 -3 6 -3 c4 0 8 13 28 13" },
  art: { base: 33, unit: 60, d: "l4 0 c2 0 3 -24 7 -24 c3 0 5 9 8 11 c1 1 2 -3 4 -3 c4 0 6 16 18 16 l19 0" },
  resp: { base: 30, unit: 120, d: "c20 0 20 -18 40 -18 c20 0 20 18 40 18 l40 0" },
} as const;

type AlarmKey = "hr" | "spo2";
type Sim = {
  n: number;
  hr: number;
  spo2: number;
  sys: number;
  dia: number;
  resp: number;
  temp: number;
  acked: boolean;
  since: number | null;
};

const TICK_MS = 1200;
/** Ticks per scenario; an episode runs from tick 6 to 18, then the patient settles. */
const CYCLE = 22;
const EPISODES: AlarmKey[] = ["spo2", "hr"];
const START: Sim = { n: 0, hr: 78, spo2: 97, sys: 124, dia: 78, resp: 16, temp: 37.1, acked: false, since: null };
const TEMP_TREND = [36.8, 36.9, 37.0, 37.2, 37.3, 37.1, 37.0, 37.1];

const alarmOf = (s: Sim): AlarmKey | null => (s.spo2 < 90 ? "spo2" : s.hr > 120 ? "hr" : null);
const toward = (v: number, target: number, k: number, jitter: number) =>
  v + (target - v) * k + (Math.random() - 0.5) * jitter;

function step(s: Sim): Sim {
  const n = s.n + 1;
  const phase = n % CYCLE;
  const key = EPISODES[Math.floor(n / CYCLE) % EPISODES.length];
  const acked = phase === 0 ? false : s.acked;
  // Acknowledging means a nurse is at the bedside: the episode is treated and resolves.
  const active = phase >= 6 && phase < 18 && !acked;
  const next: Sim = {
    n,
    hr: Math.round(toward(s.hr, active && key === "hr" ? 134 : 78, 0.35, 3)),
    spo2: Math.round(Math.min(100, toward(s.spo2, active && key === "spo2" ? 86 : 97, 0.4, 1))),
    sys: Math.round(toward(s.sys, active && key === "hr" ? 138 : 124, 0.3, 3)),
    dia: Math.round(toward(s.dia, 78, 0.3, 2)),
    resp: Math.round(toward(s.resp, active && key === "spo2" ? 25 : 16, 0.35, 1.2)),
    temp: Math.round(toward(s.temp, 37.1, 0.2, 0.1) * 10) / 10,
    acked,
    since: null,
  };
  const now = alarmOf(next);
  next.since = now ? (alarmOf(s) === now && s.since !== null ? s.since : n) : null;
  return next;
}

/** Healthcare · large. A bedside monitor with live traces; an alarm flashes its tile until acknowledged. */
export function PatientVitalsWidget({ index }: { index?: number }) {
  const [sim, setSim] = useState<Sim>(START);

  useEffect(() => {
    const t = window.setInterval(() => setSim(step), TICK_MS);
    return () => window.clearInterval(t);
  }, []);

  const alarm = alarmOf(sim);
  const flashing = alarm !== null && !sim.acked;
  const silenced = alarm !== null && sim.acked;
  const stateOf = (k: AlarmKey) => (alarm === k ? (sim.acked ? "silenced" : "alarm") : "ok");
  const elapsed = sim.since === null ? 0 : Math.round((sim.n - sim.since) * (TICK_MS / 1000));
  const map = Math.round((sim.sys + 2 * sim.dia) / 3);
  const fast = sim.hr > 110;

  return (
    <Widget
      size="large"
      index={index}
      label="Bedside patient monitor"
      surfaceClassName="bg-[linear-gradient(180deg,#0e141b_0%,#06090d_100%)] ring-white/10"
      glow={{ mode: "pulse", colors: ["#FF453A", "#FF9F0A", "#FF453A"], blur: 22, duration: 1.1 }}
      glowActive={flashing}
    >
      <div className="flex h-full flex-col text-white">
        <div className="flex h-7 items-center gap-2">
          <MemojiAvatar who="m6" size={28} />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[13px] font-semibold">James Whitaker · 67 M</div>
            <div className="truncate text-[11px] text-white/45">ICU Bed 12 · MRN 448210</div>
          </div>
          {flashing ? (
            <motion.span
              className="rounded-full bg-ios-red px-2 py-0.5 text-[11px] font-bold tracking-wide text-white"
              animate={{ opacity: [1, 0.45, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ALARM
            </motion.span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-white/60">
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-ios-green opacity-70" />
                <span className="relative size-1.5 rounded-full bg-ios-green" />
              </span>
              Monitoring
            </span>
          )}
        </div>

        <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 grid-rows-[1.2fr_1fr_1fr] gap-1.5">
          <Tile label="HR" unit="bpm" limits="50–120" color="var(--ios-green)" state={stateOf("hr")} className="col-span-2">
            <div className="relative mt-1 flex min-h-0 flex-1 items-center gap-2">
              <div className="flex w-[84px] shrink-0 items-center gap-1 text-ios-green">
                <AnimatedNumber value={sim.hr} className="text-[38px] leading-none font-semibold tracking-tight" />
                <motion.span
                  className="text-[12px]"
                  animate={{ scale: [1, 1.35, 1] }}
                  transition={{ duration: 60 / sim.hr, repeat: Infinity, times: [0, 0.15, 1] }}
                >
                  <Heart16Filled />
                </motion.span>
              </div>
              <Trace wave="ecg" color="var(--ios-green)" cycle={60 / sim.hr} speedKey={fast} className="h-full flex-1" />
            </div>
          </Tile>

          <Tile label="SpO₂" unit="%" limits="≥ 90" color="var(--ios-teal)" state={stateOf("spo2")}>
            <Value value={sim.spo2} unit="%" className="text-ios-teal" />
            <Trace wave="pleth" color="var(--ios-teal)" cycle={60 / sim.hr} speedKey={fast} className="-mx-2 -mb-2 mt-auto h-7" />
          </Tile>

          <Tile label="ART" unit="mmHg" limits="90–160" color="var(--ios-red)" state="ok">
            <div className="relative mt-1 flex items-baseline gap-1 text-ios-red">
              <span className="text-[22px] leading-none font-semibold tracking-tight">
                <AnimatedNumber value={sim.sys} />/<AnimatedNumber value={sim.dia} />
              </span>
              <span className="text-[11px] font-medium text-white/45">
                (<AnimatedNumber value={map} />)
              </span>
            </div>
            <Trace wave="art" color="var(--ios-red)" cycle={60 / sim.hr} speedKey={fast} className="-mx-2 -mb-2 mt-auto h-7" />
          </Tile>

          <Tile label="Resp" unit="rpm" limits="8–30" color="var(--ios-yellow)" state="ok">
            <Value value={sim.resp} unit="rpm" className="text-ios-yellow" />
            <Trace wave="resp" color="var(--ios-yellow)" cycle={60 / sim.resp} speedKey={sim.resp > 20} className="-mx-2 -mb-2 mt-auto h-7" />
          </Tile>

          <Tile label="Temp" unit="°C" limits="35.5–38.5" color="var(--ios-orange)" state="ok">
            <Value value={sim.temp} unit="°C" fraction className="text-ios-orange" />
            <div className="relative mt-auto flex items-end gap-1.5">
              <svg viewBox="0 0 70 20" preserveAspectRatio="none" className="h-5 flex-1" aria-hidden>
                <polyline
                  points={TEMP_TREND.map((v, i) => `${(i / (TEMP_TREND.length - 1)) * 70},${18 - (v - 36.6) * 22}`).join(" ")}
                  fill="none"
                  stroke="var(--ios-orange)"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={0.8}
                />
              </svg>
              <span className="text-[9px] leading-none text-white/40">8 h</span>
            </div>
          </Tile>
        </div>

        <div className="mt-2 flex h-8 shrink-0 items-center gap-2 overflow-hidden rounded-xl bg-white/[0.05] pr-1 pl-2.5">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={flashing ? "alarm" : silenced ? "silenced" : "ok"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="flex min-w-0 flex-1 items-center gap-1.5 whitespace-nowrap text-[12px]"
            >
              {flashing ? (
                <>
                  <Warning16Filled className="shrink-0 text-ios-red" />
                  <span className="truncate font-semibold text-ios-red tabular">
                    {alarm === "spo2" ? `SpO₂ ${sim.spo2}% · below 90` : `HR ${sim.hr} · above 120`} ·{" "}
                    {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
                  </span>
                </>
              ) : silenced ? (
                <>
                  <AlertOff16Regular className="shrink-0 text-white/60" />
                  <MemojiAvatar who="f4" size={18} />
                  <span className="truncate text-white/70">Silenced · RN Patel at bedside</span>
                </>
              ) : (
                <>
                  <CheckmarkCircle16Filled className="shrink-0 text-ios-green" />
                  <span className="truncate text-white/60">All parameters within limits</span>
                </>
              )}
            </motion.div>
          </AnimatePresence>
          {flashing ? (
            <Button
              size="small"
              type="primary"
              danger
              icon={<AlertOff16Regular />}
              onClick={() => setSim((s) => ({ ...s, acked: true }))}
            >
              Acknowledge
            </Button>
          ) : (
            <span className="shrink-0 pr-1.5 text-[10px] text-white/35 tabular">NIBP q15 · 14:30</span>
          )}
        </div>
      </div>
    </Widget>
  );
}

function Tile({
  label,
  unit,
  limits,
  color,
  state,
  className,
  children,
}: {
  label: string;
  unit: string;
  limits: string;
  color: string;
  state: "ok" | "alarm" | "silenced";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-col overflow-hidden rounded-xl bg-white/[0.05] p-2 ring-1 ring-inset transition-shadow duration-mid",
        state === "ok" ? "ring-white/[0.06]" : "ring-ios-red/70",
        className,
      )}
    >
      {state === "alarm" ? (
        <motion.span
          className="pointer-events-none absolute inset-0 bg-ios-red"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.34, 0] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}
      <div className="relative flex items-center gap-1 text-[11px] leading-none font-semibold" style={{ color }}>
        {label}
        <span className="text-[9px] font-medium text-white/40">{unit}</span>
        {state === "silenced" ? (
          <AlertOff16Regular className="ml-auto text-[12px] text-white/60" />
        ) : (
          <span className="ml-auto text-[9px] font-medium text-white/35 tabular">{limits}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Value({ value, unit, fraction, className }: { value: number; unit: string; fraction?: boolean; className?: string }) {
  return (
    <div className={cn("relative mt-1 flex items-baseline gap-0.5", className)}>
      <AnimatedNumber
        value={value}
        format={fraction ? { minimumFractionDigits: 1, maximumFractionDigits: 1 } : undefined}
        className="text-[24px] leading-none font-semibold tracking-tight"
      />
      <span className="text-[11px] font-medium text-white/45">{unit}</span>
    </div>
  );
}

/**
 * A waveform scrolling right to left. Two halves of identical cycles loop
 * seamlessly; the speed only changes when the rate crosses a band (`speedKey`),
 * so a jittering number does not restart the sweep every tick.
 */
function Trace({
  wave,
  color,
  cycle,
  speedKey,
  className,
}: {
  wave: keyof typeof WAVES;
  color: string;
  cycle: number;
  speedKey: boolean;
  className?: string;
}) {
  const w = WAVES[wave];
  const copies = wave === "resp" ? 2 : 4;
  const d = `M0 ${w.base} ${Array.from({ length: copies * 2 }, () => w.d).join(" ")}`;
  const id = `pv-glow-${wave}`;
  return (
    <div
      className={cn(
        "relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_14%,black_86%,transparent)]",
        className,
      )}
    >
      <motion.svg
        key={String(speedKey)}
        viewBox={`0 0 ${w.unit * copies * 2} 40`}
        preserveAspectRatio="none"
        className="absolute inset-y-0 left-0 h-full"
        style={{ width: "200%" }}
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: cycle * copies, repeat: Infinity, ease: "linear" }}
        aria-hidden
      >
        <defs>
          <filter id={id} x="-10%" y="-50%" width="120%" height="200%">
            <feGaussianBlur stdDeviation="1.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          filter={`url(#${id})`}
        />
      </motion.svg>
    </div>
  );
}
