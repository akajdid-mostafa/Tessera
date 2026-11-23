import { CheckmarkCircle16Filled, Timer20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const PHASES = [
  { name: "Pre-vacuum", min: 6 },
  { name: "Heat-up", min: 9 },
  { name: "Sterilize", min: 20 },
  { name: "Exhaust", min: 6 },
  { name: "Dry", min: 12 },
] as const;
const STARTS = PHASES.reduce<number[]>((a, p, i) => [...a, i ? a[i - 1] + PHASES[i - 1].min * 60 : 0], []);
const TOTAL = PHASES.reduce((s, p) => s + p.min * 60, 0);
/** Simulated seconds per real second. */
const SPEED = 6;
/** Ticks the "Passed" state holds before the next load starts. */
const HOLD = 9;
const F0_TARGET = 15;

const phaseAt = (t: number) => {
  let i = PHASES.length - 1;
  while (i > 0 && t < STARTS[i]) i--;
  return i;
};

/** Chamber temperature (°C) and pressure (bar abs) at a moment of the cycle. */
function chamber(t: number) {
  const i = phaseAt(t);
  const f = (t - STARTS[i]) / (PHASES[i].min * 60);
  const j = (Math.random() - 0.5) * 0.2;
  switch (i) {
    case 0:
      return { T: 62 + 30 * f + 6 * Math.sin(f * Math.PI * 6), p: 0.9 + 0.72 * Math.sin(f * Math.PI * 6) };
    case 1:
      return { T: 100 + 21.3 * f + j, p: 1.02 + 1.04 * f };
    case 2:
      return { T: 121.3 + j, p: 2.06 + j * 0.05 };
    case 3:
      return { T: 121 - 32 * f + j, p: 2.05 - 1.05 * f };
    default:
      return { T: 88 - 12 * f + j, p: 0.18 + j * 0.02 };
  }
}

const lethal = (T: number, dtSec: number) => (T >= 100 ? (dtSec / 60) * 10 ** ((T - 121.1) / 10) : 0);

type Sim = { t: number; T: number; p: number; f0: number; hold: number };

const START_T = STARTS[2] + 5 * 60 + 28;
const START: Sim = (() => {
  let f0 = 0;
  for (let t = 0; t < START_T; t += SPEED) f0 += lethal(chamber(t).T, SPEED);
  const c = chamber(START_T);
  return { t: START_T, T: c.T, p: c.p, f0, hold: 0 };
})();

function step(s: Sim): Sim {
  if (s.hold > 0) {
    if (s.hold >= HOLD) {
      const c = chamber(0);
      return { t: 0, T: c.T, p: c.p, f0: 0, hold: 0 };
    }
    return { ...s, hold: s.hold + 1 };
  }
  const t = s.t + SPEED;
  if (t >= TOTAL) return { ...s, t: TOTAL, T: 74, p: 1.01, hold: 1 };
  const c = chamber(t);
  return { t, T: c.T, p: c.p, f0: s.f0 + lethal(c.T, SPEED), hold: 0 };
}

const TWO = { minimumIntegerDigits: 2 } as const;
const ONE = { minimumFractionDigits: 1, maximumFractionDigits: 1 } as const;

/** Lab · small. A steam autoclave cycle: the phase strip fills as the sterilize hold counts down in rolling digits, chamber temperature, pressure and F₀ tick live, and hovering a phase previews its planned time. */
export function AutoclaveCycleWidget({ index }: { index?: number }) {
  const [sim, setSim] = useState<Sim>(START);
  const [hover, setHover] = useState<number | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const id = window.setInterval(() => setSim(step), 1000);
    return () => window.clearInterval(id);
  }, []);

  const done = sim.hold > 0;
  const cur = phaseAt(sim.t);
  const left = Math.max(0, STARTS[cur] + PHASES[cur].min * 60 - sim.t);
  const show = hover ?? cur;
  const secs = hover !== null ? PHASES[hover].min * 60 : left;
  const label =
    hover !== null
      ? `${PHASES[hover].name} · ${hover < cur || done ? "done" : hover === cur ? "running" : "planned"}`
      : done
        ? "Cycle 4471 · unload"
        : `${PHASES[cur].name} · ${cur + 1} of 5`;

  return (
    <Widget size="small" index={index} label="Autoclave cycle">
      <WidgetHeader icon={<Timer20Filled />} tint="var(--ios-teal)" title="Autoclave 2" subtitle="Liquids · 121 °C · 20 min" />

      <div className="mt-2 h-[14px] overflow-hidden text-[11px] font-medium text-tertiary">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={label} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="truncate">
            {label}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-1 h-[32px] whitespace-nowrap leading-none">
        {done && hover === null ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 text-[26px] font-semibold tracking-tight text-ios-green"
          >
            <CheckmarkCircle16Filled className="text-[22px]" /> Passed
          </motion.div>
        ) : (
          <span className={cn("text-[30px] font-semibold tracking-tight", hover !== null && show !== cur ? "text-secondary" : "text-heading")}>
            <AnimatedNumber value={Math.floor(secs / 60)} />
            <span className="text-tertiary">:</span>
            <AnimatedNumber value={Math.floor(secs % 60)} format={TWO} />
          </span>
        )}
      </div>

      <div className="mt-1 flex items-baseline gap-2 whitespace-nowrap text-[11px] text-secondary tabular">
        <span>
          <AnimatedNumber value={sim.T} format={ONE} />
          <span className="text-tertiary"> °C</span>
        </span>
        <span>
          <AnimatedNumber value={sim.p} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />
          <span className="text-tertiary"> bar</span>
        </span>
      </div>
      <div className="mt-0.5 whitespace-nowrap text-[11px] text-secondary tabular">
        F₀ <AnimatedNumber value={sim.f0} format={ONE} className={sim.f0 >= F0_TARGET ? "text-ios-green" : undefined} />
        <span className="text-tertiary"> / {F0_TARGET} min</span>
      </div>

      <div className="mt-auto flex h-[16px] items-center gap-[3px]" onMouseLeave={() => setHover(null)}>
        {PHASES.map((p, i) => {
          const past = done || i < cur;
          const now = !done && i === cur;
          const frac = past ? 1 : now ? (sim.t - STARTS[i]) / (p.min * 60) : 0;
          return (
            <button
              key={p.name}
              type="button"
              aria-label={p.name}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="flex h-full cursor-pointer items-center outline-none"
              style={{ flex: p.min }}
            >
              <span
                className={cn(
                  "relative block w-full overflow-hidden rounded-full bg-fill-tertiary transition-[height] duration-200",
                  hover === i ? "h-[9px]" : "h-[6px]",
                )}
              >
                <motion.span
                  className={cn("absolute inset-y-0 left-0 rounded-full", now ? "bg-ios-teal" : done ? "bg-ios-green" : "bg-fill")}
                  initial={{ width: 0 }}
                  animate={{ width: `${frac * 100}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20, delay: sim.t === START_T ? delay + i * 0.06 : 0 }}
                />
                {now ? (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-ios-teal"
                    animate={{ opacity: [0, 0.25, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </Widget>
  );
}
