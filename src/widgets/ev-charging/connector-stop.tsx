import { ArrowClockwise16Filled, HandRight16Regular, LockClosed16Filled, LockOpen16Filled, PlugConnected20Filled } from "@fluentui/react-icons";
import { AnimatePresence, animate, motion, useMotionValue, useTransform, type AnimationPlaybackControls } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { ConnectorGlyph, seeded } from "./_parts";

/* Stopping a public DC session is guarded: hold for 1.2 s so a brushed screen
 * can't end it. The cable stays locked (OCPP Finishing) until the driver asks
 * the charger to release it (UnlockConnector), then the bay reads Available. */
type Phase = "charging" | "stopping" | "ended" | "unlocking" | "released" | "preparing";

const HOLD_S = 1.2;
const PRICE = 0.49;
const R = 30;
const C = 2 * Math.PI * R;
const USD = { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;
const START = { kw: 62.4, kwh: 38.2, soc: 71 };

const COPY: Record<Phase, { word: string; tone: string; hint: string }> = {
  charging: { word: "Charging", tone: "text-ios-green", hint: "Hold to stop" },
  stopping: { word: "Stopping…", tone: "text-tertiary", hint: "Sending stop…" },
  ended: { word: "Finishing", tone: "text-ios-orange", hint: "Tap to release cable" },
  unlocking: { word: "Unlocking…", tone: "text-tertiary", hint: "Releasing latch…" },
  released: { word: "Available", tone: "text-ios-green", hint: "Tap to start again" },
  preparing: { word: "Preparing", tone: "text-ios-teal", hint: "Handshake with car…" },
};

/** EV charging · small. Hold the plug to stop a DC session, then tap to release the locked cable. */
export function ConnectorStopWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [phase, setPhase] = useState<Phase>("charging");
  const [s, setS] = useState({ kw: 0, kwh: START.kwh, soc: START.soc });
  const hold = useMotionValue(0);
  const holdOffset = useTransform(hold, (v) => C * (1 - v));
  const ctrl = useRef<AnimationPlaybackControls | null>(null);
  const timers = useRef<number[]>([]);
  const rand = useRef(seeded(11));

  useEffect(() => {
    const first = window.setTimeout(() => setS((p) => ({ ...p, kw: START.kw })), delay * 1000 + 200);
    return () => {
      window.clearTimeout(first);
      timers.current.forEach((t) => window.clearTimeout(t));
    };
  }, [delay]);

  useEffect(() => {
    if (phase !== "charging") return;
    const t = window.setInterval(() => {
      setS((p) => {
        if (p.kw === 0) return p;
        const target = 75 - (p.soc - 70) * 2.4;
        const kw = Math.max(20, p.kw + (target - p.kw) * 0.3 + (rand.current() - 0.5) * 1.6);
        const dE = kw * (6 / 3600);
        return { kw, kwh: p.kwh + dE, soc: Math.min(100, p.soc + (dE / 64) * 100) };
      });
    }, 2000);
    return () => window.clearInterval(t);
  }, [phase]);

  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  const startHold = () => {
    if (phase !== "charging") return;
    ctrl.current?.stop();
    ctrl.current = animate(hold, 1, {
      duration: HOLD_S * (1 - hold.get()),
      ease: "linear",
      onComplete: () => {
        setPhase("stopping");
        later(1000, () => {
          setS((p) => ({ ...p, kw: 0 }));
          setPhase("ended");
          animate(hold, 0, { duration: 0.4 });
        });
      },
    });
  };
  const endHold = () => {
    if (phase !== "charging" || hold.get() >= 1) return;
    ctrl.current?.stop();
    ctrl.current = animate(hold, 0, { type: "spring", stiffness: 300, damping: 26 });
  };
  const tap = () => {
    if (phase === "ended") {
      setPhase("unlocking");
      later(900, () => setPhase("released"));
    } else if (phase === "released") {
      setPhase("preparing");
      setS({ kw: 0, kwh: 0, soc: 23 });
      later(1500, () => {
        setPhase("charging");
        setS({ kw: 118.6, kwh: 0, soc: 23 });
      });
    }
  };

  const busy = phase === "stopping" || phase === "unlocking" || phase === "preparing";
  const copy = COPY[phase];
  const cost = s.kwh * PRICE;
  const plugged = phase !== "released";

  return (
    <Widget size="small" index={index} label="Stop session and release cable">
      <WidgetHeader icon={<PlugConnected20Filled />} tint="var(--ios-green)" title="Charger 07" subtitle="CCS2 · DC 150 kW" />

      <div className="mt-2.5 flex items-center gap-2.5">
        <motion.button
          type="button"
          aria-label={phase === "charging" ? "Hold to stop charging" : copy.hint}
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onPointerCancel={endHold}
          onClick={tap}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              if (phase === "charging") startHold();
            }
          }}
          onKeyUp={(e) => {
            if (e.key === "Enter" || e.key === " ") endHold();
          }}
          whileTap={{ scale: 0.93 }}
          whileHover={{ scale: 1.04 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
          className="relative grid size-[68px] shrink-0 cursor-pointer touch-none place-items-center rounded-full outline-none select-none"
        >
          <span
            className={cn(
              "absolute inset-[6px] rounded-full transition-colors duration-300",
              phase === "charging" ? "bg-ios-green/15" : phase === "ended" ? "bg-ios-orange/15" : "bg-fill-tertiary",
            )}
          />
          <svg viewBox="0 0 68 68" className="absolute inset-0 size-full -rotate-90" aria-hidden>
            <circle cx="34" cy="34" r={R} fill="none" strokeWidth="3.5" className="stroke-fill-secondary" />
            {/* SoC while plugged in */}
            <motion.circle
              cx="34"
              cy="34"
              r={R}
              fill="none"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: plugged ? C * (1 - s.soc / 100) : C }}
              style={{ stroke: phase === "ended" ? "var(--ios-orange)" : "var(--ios-green)", transition: "stroke 0.3s" }}
              transition={{ type: "spring", stiffness: 70, damping: 16, delay: s.kwh === START.kwh ? delay : 0 }}
            />
            {/* Hold progress */}
            <motion.circle
              cx="34"
              cy="34"
              r={R}
              fill="none"
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="var(--ios-red)"
              strokeDasharray={C}
              style={{ strokeDashoffset: holdOffset }}
            />
          </svg>
          {busy ? (
            <motion.span
              className="absolute inset-[3px] rounded-full border-2 border-transparent border-t-[var(--ios-blue)]"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
          ) : null}
          <motion.span
            className={cn("relative", phase === "released" ? "text-tertiary" : "text-heading")}
            animate={phase === "released" ? { y: 7, opacity: 0.55, scale: 0.9 } : { y: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
          >
            <ConnectorGlyph type="CCS2" className="size-[26px]" />
          </motion.span>
          {/* Latch badge */}
          <AnimatePresence>
            {phase === "ended" || phase === "unlocking" || phase === "released" ? (
              <motion.span
                key={phase === "released" ? "open" : "shut"}
                className={cn(
                  "absolute right-0 bottom-0 grid size-5 place-items-center rounded-full ring-2 ring-[var(--widget-surface)]",
                  phase === "released" ? "bg-ios-green/15 text-ios-green" : "bg-ios-orange/15 text-ios-orange",
                )}
                initial={{ scale: 0, rotate: -40 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
              >
                {phase === "released" ? <LockOpen16Filled className="size-3" /> : <LockClosed16Filled className="size-3" />}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </motion.button>

        <div className="min-w-0 flex-1 leading-tight whitespace-nowrap">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 5, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -5, filter: "blur(3px)" }}
              className={cn("truncate text-[11px] font-semibold", copy.tone)}
            >
              {copy.word}
            </motion.div>
          </AnimatePresence>
          <div className="text-[22px] leading-none font-semibold tracking-tight text-heading">
            {phase === "charging" || phase === "preparing" ? (
              <>
                <AnimatedNumber value={s.kw} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
                <span className="ml-0.5 text-[11px] font-medium text-tertiary">kW</span>
              </>
            ) : (
              <>
                <AnimatedNumber value={s.kwh} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
                <span className="ml-0.5 text-[11px] font-medium text-tertiary">kWh</span>
              </>
            )}
          </div>
          <div className="mt-1 truncate text-[11px] text-tertiary tabular">
            {phase === "charging" || phase === "preparing" ? (
              <>
                <AnimatedNumber value={Math.floor(s.soc)} suffix="%" /> · <AnimatedNumber value={s.kwh} format={{ maximumFractionDigits: 1, minimumFractionDigits: 1 }} /> kWh
              </>
            ) : (
              <AnimatedNumber value={cost} format={USD} />
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-1 text-[11px] whitespace-nowrap text-tertiary">
        {phase === "charging" ? (
          <HandRight16Regular className="size-3.5 shrink-0 text-ios-red" />
        ) : phase === "ended" ? (
          <LockClosed16Filled className="size-3.5 shrink-0 text-ios-orange" />
        ) : phase === "released" ? (
          <ArrowClockwise16Filled className="size-3.5 shrink-0 text-ios-green" />
        ) : null}
        <span className="truncate">{copy.hint}</span>
      </div>
    </Widget>
  );
}
