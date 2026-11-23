import { Warning12Filled, Water20Filled } from "@fluentui/react-icons";
import { animate, AnimatePresence, motion, useAnimate, useMotionValue, useMotionValueEvent, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/* Concrete gravity dam, section through the spillway. Levels in m a.s.l.:
 * Min operating 480 · spillway crest 508 · Normal max 515 · Max flood 520 · Dam crest 523.
 * A flood is passing: the pool sits in the flood-control zone and is rising, so the
 * operator raises the four radial gates. Discharge ≈ 220 m³/s per gate per metre of
 * opening; turbines pass 420 m³/s. Simulated time runs ×60 so the level visibly moves. */
const MIN_OP = 480;
const SPILL_CREST = 508;
const NORMAL_MAX = 515;
const MAX_FLOOD = 520;
const DAM_CREST = 523;
const AREA = 45e6; // m² of pool at this stage
const TURBINES = 420;
const PER_GATE_M = 220;
const GATES = 4;
const MAX_STEP = 1.0;
const MAX_OPEN = 12;
const TICK_MS = 2000;
const SIM_HOURS_PER_TICK = 2 / 60;
const HOLD_S = 1.4;

const yOf = (e: number) => 136 - (e - 466) * 2.25;
const TRUNNION = { x: 214, y: 27.75 };
const GATE_R = 27;
const spillQ = (open: number) => GATES * PER_GATE_M * open;

const DAM =
  "M190 136 L190 41.5 Q194 38.6 198.5 41 C204 45.5 209.5 57 214 68 L246 127 Q250 134 258 132 L262 127.5 L262 136 Z";
const JET = "M194.5 40.6 C203.5 45.6 209 57.5 213.4 68.6 L245.4 127.6 Q249.8 134.6 258.4 132.4 L268 124";
const BED = "M0 106 C40 122 72 133 112 136";

type Phase = "idle" | "hold" | "travel";

/** Water · large. A dam cross-section with the pool in its flood zone; step a gate target and hold to raise the spillway gates. */
export function DamSectionWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [level, setLevel] = useState(518.62);
  const [inflow, setInflow] = useState(3240);
  const [opening, setOpening] = useState(1.5);
  const [target, setTarget] = useState(2.5);
  const [phase, setPhase] = useState<Phase>("idle");
  const [holdPct, setHoldPct] = useState(0);
  const openRef = useRef(opening);
  openRef.current = opening;
  const levelRef = useRef(level);
  const inflowRef = useRef(inflow);
  const hold = useMotionValue(0);
  const holdAnim = useRef<ReturnType<typeof animate> | null>(null);
  const [stepper, shake] = useAnimate();
  useMotionValueEvent(hold, "change", (v) => setHoldPct(v));

  useEffect(() => {
    const t = window.setInterval(() => {
      const q = inflowRef.current;
      const next = Math.round(q + (2960 - q) * 0.015 + (Math.random() - 0.5) * 30);
      const out = TURBINES + spillQ(openRef.current);
      const dh = ((next - out) * 3600 * SIM_HOURS_PER_TICK) / AREA;
      inflowRef.current = next;
      levelRef.current = Math.min(DAM_CREST - 1, levelRef.current + dh);
      setInflow(next);
      setLevel(Math.round(levelRef.current * 1000) / 1000);
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => () => holdAnim.current?.stop(), []);

  const outflow = TURBINES + spillQ(opening);
  const rate = ((inflow - outflow) * 3600 * 100) / AREA; // cm/h
  const inFlood = level > NORMAL_MAX;
  const rising = rate > 0.5;
  const alarm = inFlood && rising;
  const storage = 1412 + (level - 518.62) * 45;
  const active = storage / 1590;

  const step = (d: number) => {
    if (phase !== "idle") return;
    const next = Math.round((target + d) * 10) / 10;
    if (next < 0 || next > MAX_OPEN || Math.abs(next - opening) > MAX_STEP + 1e-6) {
      shake(stepper.current, { x: [0, -5, 5, -3, 3, 0] }, { duration: 0.35 });
      return;
    }
    setTarget(next);
  };

  const startHold = () => {
    if (phase !== "idle" || target === opening) return;
    setPhase("hold");
    holdAnim.current = animate(hold, 1, {
      duration: HOLD_S * (1 - hold.get()),
      ease: "linear",
      onComplete: () => {
        setPhase("travel");
        hold.set(0);
        const from = openRef.current;
        animate(from, target, {
          duration: 1.6 + Math.abs(target - from) * 1.8,
          ease: [0.4, 0, 0.2, 1],
          onUpdate: (v) => setOpening(Math.round(v * 100) / 100),
          onComplete: () => {
            setOpening(target);
            setPhase("idle");
          },
        });
      },
    });
  };
  const cancelHold = () => {
    if (phase !== "hold") return;
    holdAnim.current?.stop();
    animate(hold, 0, { duration: 0.25 });
    setPhase("idle");
  };

  const sy = yOf(level);
  const gateRot = ((opening * 2.25) / GATE_R) * (180 / Math.PI);
  const jetW = 0.8 + Math.min(opening, 6) * 0.9;
  const flowDur = Math.max(0.5, 2.4 / Math.max(0.3, opening));
  const raising = target > opening;

  return (
    <Widget size="large" index={index} label="Dam cross-section and spillway gates">
      <WidgetHeader
        icon={<Water20Filled />}
        tint={alarm ? "var(--ios-orange)" : "var(--ios-blue)"}
        title="Cedar Creek Dam"
        subtitle="Reservoir · 4 radial spillway gates"
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={inFlood ? "flood" : "normal"}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                inFlood ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-tertiary text-secondary",
              )}
            >
              {inFlood ? <Warning12Filled /> : null}
              {inFlood ? "Flood zone" : "Normal pool"}
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="mt-2 flex items-baseline-last gap-2 whitespace-nowrap">
        <div className="leading-none">
          <AnimatedNumber
            value={level}
            format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
            className="text-[30px] font-semibold tracking-tight text-heading"
          />
          <span className="ml-1 text-[12px] font-medium text-tertiary">m a.s.l.</span>
        </div>
        <span
          className={cn(
            "mb-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
            alarm ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-tertiary text-secondary",
          )}
        >
          <AnimatedNumber value={rate} format={{ maximumFractionDigits: 1, minimumFractionDigits: 1, signDisplay: "always" }} suffix=" cm/h" />
        </span>
        <div className="mb-0.5 ml-auto text-right text-[11px] leading-tight text-tertiary">
          <div>
            <AnimatedNumber value={Math.round(storage)} className="font-semibold text-secondary" /> hm³
          </div>
          <div>
            <AnimatedNumber value={active} format={{ style: "percent", maximumFractionDigits: 0 }} /> active
          </div>
        </div>
      </div>

      <svg viewBox="0 0 300 140" className="mt-2 w-full overflow-visible" aria-label="Dam cross-section">
        {/* Ground */}
        <path d={`${BED} H262 V140 H0 Z`} className="fill-fill-secondary" />

        {/* Reservoir */}
        <motion.path d={`M0 ${sy} H190 V136 H112 C72 133 40 122 0 106 Z`}
          initial={false}
          animate={{ d: `M0 ${sy} H190 V136 H112 C72 133 40 122 0 106 Z` }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
          fill="var(--ios-blue)"
          fillOpacity="0.16"
        />
        {/* Flood-control band glows only while the pool is in it */}
        {inFlood ? (
          <motion.rect
            x="0"
            width="190"
            y={yOf(MAX_FLOOD)}
            height={yOf(NORMAL_MAX) - yOf(MAX_FLOOD)}
            fill="var(--ios-orange)"
            animate={{ opacity: alarm ? [0.1, 0.24, 0.1] : 0.1 }}
            transition={alarm ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.4 }}
          />
        ) : null}
        {/* Surface with a slow ripple */}
        <motion.path
          d={`M-6 ${sy} q5 -1.4 10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t6 0`}
          fill="none"
          stroke="var(--ios-blue)"
          strokeWidth="1.4"
          animate={reduce ? undefined : { x: [0, 10] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        {/* Inflow streaks, faster with more water arriving */}
        {[6, 15, 27].map((dy, k) => (
          <motion.line
            key={dy}
            x1="0"
            x2="14"
            y1={sy + dy}
            y2={sy + dy}
            stroke="var(--ios-blue)"
            strokeWidth="1.2"
            strokeLinecap="round"
            initial={{ x: -16, opacity: 0 }}
            animate={reduce ? { opacity: 0.4 } : { x: [-16, 120], opacity: [0, 0.6, 0] }}
            transition={{ duration: 9000 / inflow, repeat: Infinity, delay: k * 0.7, ease: "linear" }}
          />
        ))}

        {/* Reference elevations */}
        {[
          { e: MAX_FLOOD, label: "Max flood 520" },
          { e: NORMAL_MAX, label: "Normal max 515" },
          { e: MIN_OP, label: "Min operating 480" },
        ].map((r) => (
          <g key={r.e}>
            <line
              x1="0"
              x2="188"
              y1={yOf(r.e)}
              y2={yOf(r.e)}
              strokeDasharray="3 3"
              strokeWidth="0.8"
              className={r.e === NORMAL_MAX && inFlood ? "stroke-[var(--ios-orange)]" : "stroke-tertiary"}
            />
            {/* Normal max sits only 5 m under max flood, so its label hangs below the
                line instead of above it, where the two would collide. */}
            <text x="3" y={r.e === NORMAL_MAX ? yOf(r.e) + 9 : yOf(r.e) - 2} fontSize="8.5" className="fill-tertiary">
              {r.label}
            </text>
          </g>
        ))}

        {/* Tailwater and outflow streaks */}
        <rect x="262" y={yOf(474.6)} width="38" height={136 - yOf(474.6)} fill="var(--ios-blue)" fillOpacity="0.16" />
        <line x1="262" x2="300" y1={yOf(474.6)} y2={yOf(474.6)} stroke="var(--ios-blue)" strokeWidth="1.2" />
        {[4, 10].map((dy, k) => (
          <motion.line
            key={dy}
            x1="262"
            x2="272"
            y1={yOf(474.6) + dy}
            y2={yOf(474.6) + dy}
            stroke="var(--ios-blue)"
            strokeWidth="1.2"
            strokeLinecap="round"
            animate={reduce ? { opacity: 0.4 } : { x: [0, 30], opacity: [0, 0.7, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: k * 0.6, ease: "linear" }}
          />
        ))}

        {/* Pier and bridge deck behind the gate */}
        <rect x="186" y={yOf(DAM_CREST)} width="22" height={yOf(SPILL_CREST) - yOf(DAM_CREST)} className="fill-fill-tertiary" />
        <rect x="180" y={yOf(DAM_CREST) - 2.5} width="36" height="4" rx="1" className="fill-tertiary" />
        <text x="220" y={yOf(DAM_CREST) + 1.5} fontSize="8.5" className="fill-tertiary">
          Crest 523
        </text>

        {/* Dam body */}
        <path d={DAM} strokeWidth="1.2" strokeLinejoin="round" className="fill-fill stroke-tertiary" />
        <text x="226" y={yOf(SPILL_CREST) + 3} fontSize="8.5" className="fill-tertiary">
          Spillway 508
        </text>

        {/* Spill sheet under the gate, down the face and off the flip bucket */}
        {opening > 0.02 ? (
          <>
            <path d={JET} fill="none" stroke="var(--ios-blue)" strokeOpacity="0.55" strokeWidth={jetW} strokeLinecap="round" />
            <motion.path
              d={JET}
              fill="none"
              stroke="var(--widget-surface)"
              strokeOpacity="0.7"
              strokeWidth={Math.max(0.6, jetW * 0.45)}
              strokeDasharray="2 7"
              strokeLinecap="round"
              animate={reduce ? undefined : { strokeDashoffset: [0, -9] }}
              transition={{ duration: flowDur, repeat: Infinity, ease: "linear" }}
            />
          </>
        ) : null}

        {/* Radial gate: skin plate and arms, rotating about the trunnion */}
        <g transform={`rotate(${gateRot} ${TRUNNION.x} ${TRUNNION.y})`}>
          <line x1={TRUNNION.x} y1={TRUNNION.y} x2="192" y2="41.2" strokeWidth="1.2" className="stroke-secondary" />
          <line x1={TRUNNION.x} y1={TRUNNION.y} x2="192" y2="14.3" strokeWidth="1.2" className="stroke-secondary" />
          <path
            d={`M192 41.2 A${GATE_R} ${GATE_R} 0 0 1 192 14.3`}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            className={phase === "travel" ? "stroke-[var(--ios-blue)]" : "stroke-heading"}
          />
        </g>
        <circle cx={TRUNNION.x} cy={TRUNNION.y} r="2.2" className="fill-heading" />
      </svg>

      <div className="mt-2 grid grid-cols-3 gap-2 whitespace-nowrap">
        {[
          { label: "Inflow", value: inflow, unit: "m³/s" },
          { label: "Outflow", value: outflow, unit: "m³/s" },
          { label: "Spill", value: spillQ(opening), unit: "m³/s" },
        ].map((s) => (
          <div key={s.label} className="min-w-0 leading-tight">
            <div className="text-[11px] text-tertiary">{s.label}</div>
            <div className="text-[15px] font-semibold text-heading">
              <AnimatedNumber value={Math.round(s.value)} />
              <span className="ml-0.5 text-[10px] font-medium text-tertiary">{s.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-center gap-2">
        <div ref={stepper} className="flex h-10 items-center gap-1 rounded-xl bg-fill-tertiary px-1">
          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={() => step(-0.5)}
            disabled={phase !== "idle"}
            aria-label="Lower target"
            className="grid size-7 cursor-pointer place-items-center rounded-lg text-[16px] font-semibold text-secondary hover:bg-fill-secondary disabled:cursor-default disabled:opacity-40"
          >
            −
          </motion.button>
          <div className="w-[70px] text-center leading-tight whitespace-nowrap">
            <div className="text-[10px] text-tertiary">
              Gates <span className="tabular">{opening.toFixed(1)}</span> →
            </div>
            <div className="text-[14px] font-semibold text-heading">
              <AnimatedNumber value={target} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
              <span className="ml-0.5 text-[10px] font-medium text-tertiary">m</span>
            </div>
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={() => step(0.5)}
            disabled={phase !== "idle"}
            aria-label="Raise target"
            className="grid size-7 cursor-pointer place-items-center rounded-lg text-[16px] font-semibold text-secondary hover:bg-fill-secondary disabled:cursor-default disabled:opacity-40"
          >
            +
          </motion.button>
        </div>

        <motion.button
          type="button"
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onPointerCancel={cancelHold}
          disabled={phase === "travel" || target === opening}
          whileTap={phase === "idle" || phase === "hold" ? { scale: 0.97 } : undefined}
          className={cn(
            "relative h-10 min-w-0 flex-1 cursor-pointer touch-none overflow-hidden rounded-xl text-[12px] font-semibold select-none",
            "bg-fill-secondary text-heading disabled:cursor-default",
          )}
        >
          <span className="absolute inset-y-0 left-0 bg-ios-blue/30" style={{ width: `${holdPct * 100}%` }} />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={phase}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="relative flex items-center justify-center gap-1.5 px-2 whitespace-nowrap"
            >
              {phase === "travel" ? (
                <>
                  <motion.span
                    className="size-1.5 rounded-full bg-ios-blue"
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 0.7, repeat: Infinity }}
                  />
                  TRAVEL · <span className="tabular">{opening.toFixed(2)} m</span>
                </>
              ) : phase === "hold" ? (
                "Siren on · keep holding"
              ) : target === opening ? (
                <span className="font-medium text-tertiary">At target · max step {MAX_STEP.toFixed(1)} m</span>
              ) : (
                `Hold to ${raising ? "raise" : "lower"} all 4 gates`
              )}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
    </Widget>
  );
}
