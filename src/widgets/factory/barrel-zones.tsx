import { Temperature20Filled } from "@fluentui/react-icons";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { AlarmMark, enterDelay, useInterval } from "./_parts";

/* An injection press barrel, nozzle on the left, feed on the right, set for PP.
 * Each zone shows PV against SP with the ±3 °C band; Z3's heater band is failing,
 * so it sits low at 100% output: an outline and a priority 2 mark, never a fill. */
type Zone = { key: string; name: string; sp: number; pv: number; out: number };
const SEED: Zone[] = [
  { key: "Noz", name: "Nozzle", sp: 230, pv: 230.4, out: 38 },
  { key: "Z1", name: "Front", sp: 228, pv: 227.6, out: 46 },
  { key: "Z2", name: "Front-mid", sp: 225, pv: 225.3, out: 52 },
  { key: "Z3", name: "Middle", sp: 220, pv: 215.8, out: 100 },
  { key: "Z4", name: "Rear-mid", sp: 210, pv: 209.5, out: 57 },
  { key: "Z5", name: "Rear", sp: 200, pv: 200.2, out: 61 },
];
const FAULT = 3;
const BAND = 3;
const SPAN = 8;
const CYCLE = 24.6;
const PHASES = [
  { name: "Inject", to: 1.2 },
  { name: "Hold", to: 4.2 },
  { name: "Recovery", to: 12.2 },
  { name: "Cooling", to: 22.4 },
  { name: "Eject", to: CYCLE },
];
const phaseAt = (t: number) => PHASES.find((p) => t < p.to) ?? PHASES[0];

const W = 376;
const COLS = SEED.length;
const GAP = 4;
const COL_W = (W - GAP * (COLS - 1)) / COLS;
const cx = (i: number) => i * (COL_W + GAP) + COL_W / 2;
const devPct = (d: number) => 50 + (Math.max(-SPAN, Math.min(SPAN, d)) / SPAN) * 50;

/** Factory · medium. Six barrel heat zones as PV-vs-SP bullets over a drawn barrel whose screw turns during recovery; hover a zone for its output, tap the low zone to acknowledge. */
export function BarrelZonesWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [zones, setZones] = useState(SEED);
  const [t, setT] = useState(5.4);
  const [hover, setHover] = useState<number | null>(null);
  const [acked, setAcked] = useState(false);
  const delay = enterDelay(index);

  useInterval(() => setT((x) => +((x + 0.2) % CYCLE).toFixed(1)), 200);
  useInterval(() => {
    setZones((zs) =>
      zs.map((z, i) => {
        if (i === FAULT) return { ...z, pv: +Math.max(212.6, z.pv - 0.05 - Math.random() * 0.12).toFixed(1) };
        const pv = z.sp + (z.pv - z.sp) * 0.5 + (Math.random() - 0.5) * 1.1;
        const out = Math.round(Math.max(25, Math.min(75, z.out + (z.sp - pv) * 4 + (Math.random() - 0.5) * 4)));
        return { ...z, pv: +pv.toFixed(1), out };
      }),
    );
  }, 1800);

  const phase = phaseAt(t);
  const turning = phase.name === "Recovery" && !reduce;
  const fault = zones[FAULT];
  const h = hover !== null ? zones[hover] : null;

  return (
    <Widget size="medium" index={index} label="Injection barrel heat zones">
      <WidgetHeader
        icon={<Temperature20Filled />}
        tint={acked ? "var(--ios-indigo)" : "var(--ios-orange)"}
        title="IMM-07 · Barrel heats"
        subtitle="PP homopolymer · ±3 °C band"
        extra={
          <span className="flex items-center gap-1 rounded-full bg-ios-orange/15 py-0.5 pr-2 pl-1 text-[11px] font-semibold whitespace-nowrap text-ios-orange">
            <AlarmMark priority={2} flashing={!acked} size={14} />
            Z3 low
          </span>
        }
      />

      <div className="mt-2.5 flex" style={{ gap: GAP }}>
        {zones.map((z, i) => {
          const d = z.pv - z.sp;
          const out = Math.abs(d) > BAND;
          return (
            <button
              key={z.key}
              type="button"
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              onClick={() => i === FAULT && setAcked(true)}
              aria-label={`${z.name} zone ${z.pv} of ${z.sp} degrees${i === FAULT && !acked ? ", acknowledge" : ""}`}
              className={cn(
                "flex h-[56px] min-w-0 flex-1 cursor-pointer flex-col items-center rounded-lg pt-1 whitespace-nowrap outline-none",
                "transition-colors hover:bg-fill-quaternary",
                out && "ring-[1.5px] ring-ios-orange/80 ring-inset",
              )}
            >
              <span className="text-[10px] leading-none font-semibold text-tertiary">{z.key}</span>
              <AnimatedNumber
                value={z.pv}
                format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                className={cn("mt-0.5 text-[15px] leading-tight font-semibold", out ? "text-ios-orange" : "text-heading")}
              />
              {/* Deviation bullet: centre is SP, shaded band is ±3 °C, ends are ±8. */}
              <span className="relative mt-1 h-2 w-[46px] rounded-full bg-fill-tertiary">
                <span
                  className="absolute inset-y-0 bg-fill"
                  style={{ left: `${devPct(-BAND)}%`, right: `${100 - devPct(BAND)}%` }}
                />
                <span className="absolute inset-y-[-2px] left-1/2 w-px bg-[var(--ant-color-text-tertiary)]" />
                <motion.span
                  className={cn(
                    "absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--widget-surface)]",
                    out ? "bg-ios-orange" : "bg-[var(--ant-color-text)]",
                  )}
                  initial={{ left: "50%", opacity: 0 }}
                  animate={{ left: `${devPct(d)}%`, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 140, damping: 16, delay: zones === SEED ? delay + i * 0.05 : 0 }}
                />
              </span>
              <span className="mt-1 text-[10px] leading-none text-tertiary tabular">SP {z.sp}</span>
            </button>
          );
        })}
      </div>

      {/* The barrel: heater bands brighten with their output, the screw flights turn in recovery. */}
      <svg viewBox={`0 0 ${W} 30`} className="mt-2 h-[30px] w-full overflow-visible" aria-hidden>
        <defs>
          <clipPath id={`bz-core-${index ?? 0}`}>
            <rect x="14" y="9" width={W - 16} height="12" rx="2" />
          </clipPath>
        </defs>
        <path d="M14 10 3 13.5v3L14 20Z" className="fill-fill" />
        <rect x="14" y="9" width={W - 16} height="12" rx="2" className="fill-fill-tertiary" />
        <g clipPath={`url(#bz-core-${index ?? 0})`}>
          <motion.g
            animate={turning ? { x: [0, -9] } : { x: 0 }}
            transition={turning ? { duration: 0.5, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
          >
            {Array.from({ length: Math.ceil(W / 9) + 2 }, (_, k) => (
              <line
                key={k}
                x1={14 + k * 9}
                x2={20 + k * 9}
                y1="20"
                y2="10"
                strokeWidth="1.4"
                className="stroke-[var(--ant-color-text-tertiary)]"
              />
            ))}
          </motion.g>
        </g>
        {zones.map((z, i) => {
          const out = Math.abs(z.pv - z.sp) > BAND;
          return (
            <motion.rect
              key={z.key}
              x={cx(i) - 22}
              y="3"
              width="44"
              height="24"
              rx="3"
              fill="var(--ant-color-text)"
              stroke={out ? "var(--ios-orange)" : "none"}
              strokeWidth="1.5"
              initial={{ fillOpacity: 0 }}
              animate={{ fillOpacity: 0.06 + (z.out / 100) * 0.26 }}
              transition={{ duration: 0.8, delay: zones === SEED ? delay + 0.2 + i * 0.05 : 0 }}
            />
          );
        })}
      </svg>

      <div className="mt-auto flex items-center justify-between gap-2 text-[11px] leading-none whitespace-nowrap">
        <span className="truncate text-tertiary tabular">
          {h ? (
            <>
              <span className="font-semibold text-heading">{h.name}</span> · SP {h.sp} · PV {h.pv.toFixed(1)} · Out {h.out}%
            </>
          ) : (
            <>
              Z3 at {fault.out}% out · cushion 4.2 mm · cycle {CYCLE} s
            </>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-secondary">
          <motion.span
            className="size-1.5 rounded-full bg-[var(--ant-color-text-secondary)]"
            animate={turning ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
            transition={turning ? { duration: 0.8, repeat: Infinity } : { duration: 0.2 }}
          />
          <span className="w-[54px]">{phase.name}</span>
        </span>
      </div>
    </Widget>
  );
}
