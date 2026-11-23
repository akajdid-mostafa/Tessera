import { Flash20Filled, Play16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Phase = "standby" | "armed" | "cranking" | "running" | "cooldown";

/** Seconds each automatic phase lasts before moving on. */
const LASTS: Partial<Record<Phase, number>> = { armed: 4, cranking: 2, running: 12, cooldown: 4 };
const NEXT: Partial<Record<Phase, Phase>> = { armed: "standby", cranking: "running", running: "cooldown", cooldown: "standby" };
const REFILL = 60;
/** Litres in the day tank and burn at full load, for the runtime estimate. */
const TANK_L = 6000;
const BURN_LH = 158;

const TANK_W = 38;
const TANK_H = 84;
const INNER = TANK_H - 8;
const levelY = (pct: number) => 4 + (1 - pct / 100) * INNER;

function wave(amp: number) {
  const q = TANK_W / 4;
  let d = `M${-TANK_W} 0`;
  for (let i = 0; i < 4; i++) d += ` q${q} ${i % 2 ? amp : -amp} ${q * 2} 0`;
  return `${d} V${TANK_H + 10} H${-TANK_W} Z`;
}

/** Data center · small. A standby genset's day tank sloshes gently; arm and confirm a test run and it cranks, rolls to 1,500 rpm and burns fuel before cooling down. */
export function GensetWidget({ index }: { index?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [phase, setPhase] = useState<Phase>("standby");
  const [fuel, setFuel] = useState(82);
  const [tested, setTested] = useState(false);

  useEffect(() => {
    const s = LASTS[phase];
    const next = NEXT[phase];
    if (!s || !next) return;
    const t = window.setTimeout(() => {
      setPhase(next);
      if (phase === "cooldown") setTested(true);
    }, s * 1000);
    return () => window.clearTimeout(t);
  }, [phase]);

  // A test run drinks from the day tank, sped up so you can see it move.
  useEffect(() => {
    if (phase !== "running") return;
    const t = window.setInterval(() => setFuel((f) => Math.max(REFILL + 1, f - 0.3)), 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  const running = phase === "running";
  const busy = phase === "cranking" || running || phase === "cooldown";
  const rpm = running ? 1500 : phase === "cranking" ? 620 : phase === "cooldown" ? 900 : 0;
  const hours = Math.round(((fuel / 100) * TANK_L) / BURN_LH);

  const press = () => {
    if (busy) return;
    setPhase((p) => (p === "armed" ? "cranking" : "armed"));
  };

  const chip =
    phase === "running"
      ? { label: "Running", className: "bg-ios-green/15 text-ios-green", dot: "bg-ios-green" }
      : phase === "cranking"
        ? { label: "Cranking", className: "bg-ios-orange/15 text-ios-orange", dot: "bg-ios-orange" }
        : phase === "cooldown"
          ? { label: "Cool-down", className: "bg-fill-tertiary text-secondary", dot: "bg-ios-orange" }
          : { label: "Standby", className: "bg-fill-tertiary text-secondary", dot: "bg-ios-green" };

  return (
    <Widget size="small" index={index} label="Standby generator">
      <WidgetHeader icon={<Flash20Filled />} tint={busy ? "var(--ios-orange)" : "var(--ios-green)"} title="Genset 1" subtitle={tested ? "Tested OK · today" : "2 MW · diesel"} />

      <div className="mt-1.5 flex h-[84px] items-stretch gap-3">
        <motion.svg
          viewBox={`0 0 ${TANK_W} ${TANK_H}`}
          className="h-[84px] w-[38px] shrink-0"
          aria-label={`Day tank ${Math.round(fuel)}%`}
          animate={running ? { x: [0, -0.6, 0.6, 0] } : { x: 0 }}
          transition={running ? { duration: 0.18, repeat: Infinity } : { duration: 0.2 }}
        >
          <defs>
            <clipPath id={`tank-${uid}`}>
              <rect x={3} y={3} width={TANK_W - 6} height={TANK_H - 6} rx={7} />
            </clipPath>
          </defs>
          <rect x={1} y={1} width={TANK_W - 2} height={TANK_H - 2} rx={9} fill="none" strokeWidth={2} className="stroke-fill" />
          <g clipPath={`url(#tank-${uid})`}>
            <motion.g
              initial={{ y: levelY(0) + 6 }}
              animate={{ y: levelY(fuel) }}
              transition={{ type: "spring", stiffness: 60, damping: 16, delay: phase === "standby" && !tested ? 0.3 + (index ?? 0) * 0.06 : 0 }}
            >
              <motion.path
                d={wave(running ? 3.4 : 1.6)}
                className="fill-ios-indigo/50"
                animate={{ x: [0, TANK_W] }}
                transition={{ duration: running ? 0.9 : 3.2, repeat: Infinity, ease: "linear" }}
              />
            </motion.g>
          </g>
          {/* Refill line */}
          <line x1={4} x2={TANK_W - 4} y1={levelY(REFILL)} y2={levelY(REFILL)} strokeDasharray="2 2" strokeWidth={1} className="stroke-secondary" />
          {[25, 50, 75].map((p) => (
            <line key={p} x1={TANK_W - 8} x2={TANK_W - 3} y1={levelY(p)} y2={levelY(p)} strokeWidth={1} className="stroke-fill" />
          ))}
        </motion.svg>

        <div className="flex min-w-0 flex-1 flex-col leading-none whitespace-nowrap">
          <div className="text-[11px] text-tertiary">Day tank</div>
          <AnimatedNumber
            value={fuel / 100}
            format={{ style: "percent", maximumFractionDigits: 0 }}
            trend={-1}
            className="mt-1 text-[26px] font-semibold tracking-tight text-heading"
          />
          <div className="relative mt-1 h-[14px] overflow-hidden text-[11px] leading-[14px] text-tertiary">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={rpm ? "rpm" : "hours"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                {rpm ? (
                  <>
                    <AnimatedNumber value={rpm} className="font-semibold text-secondary" /> rpm · 50 Hz
                  </>
                ) : (
                  <>
                    <AnimatedNumber value={hours} className="font-semibold text-secondary" /> h at full load
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-auto">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={chip.label}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold", chip.className)}
              >
                <span className={cn("size-1.5 rounded-full", chip.dot, busy && "animate-pulse")} />
                {chip.label}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <motion.button
        type="button"
        onClick={press}
        disabled={busy}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative mt-auto flex h-[26px] w-full cursor-pointer items-center justify-center gap-1 overflow-hidden rounded-full text-[11px] font-semibold whitespace-nowrap outline-none transition-colors duration-mid disabled:cursor-default",
          phase === "armed"
            ? "bg-ios-red text-white"
            : busy
              ? "bg-fill-tertiary text-secondary"
              : "bg-fill-secondary text-heading hover:bg-fill",
        )}
      >
        {phase === "armed" ? (
          "Confirm test run"
        ) : busy ? (
          phase === "cooldown" ? "Cooling down…" : "Test in progress…"
        ) : (
          <>
            <Play16Filled />
            {tested ? "Run test again" : "Start test run"}
          </>
        )}
        {phase === "armed" ? (
          <motion.span
            className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-white/70"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: LASTS.armed, ease: "linear" }}
          />
        ) : null}
      </motion.button>
    </Widget>
  );
}
