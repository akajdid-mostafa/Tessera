import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Kind = "right" | "fork-left" | "roundabout";
type LaneArrow = "left" | "straight" | "right" | "slight-left";

const STEPS: { kind: Kind; dist: number; verb: string; street: string; lanes: [LaneArrow, boolean][] }[] = [
  {
    kind: "right",
    dist: 350,
    verb: "Turn right",
    street: "Market Street",
    lanes: [["left", false], ["straight", false], ["straight", false], ["right", true]],
  },
  {
    kind: "fork-left",
    dist: 1200,
    verb: "Keep left",
    street: "Ring Road North",
    lanes: [["slight-left", true], ["slight-left", true], ["straight", false], ["straight", false]],
  },
  {
    kind: "roundabout",
    dist: 800,
    verb: "2nd exit",
    street: "Harbour Way",
    lanes: [["left", false], ["straight", true], ["straight", true], ["right", false]],
  },
];

/* Manoeuvre arrows in a 48 × 48 box: the path to take, its head, and a faint road not taken. */
const ARROW: Record<Kind, { path: string; head: string; ghost?: string }> = {
  right: { path: "M17 42 V25 Q17 17 25 17 H35", head: "M29 10.5 L36 17 L29 23.5" },
  "fork-left": {
    path: "M27 42 V30 Q27 25 23 21 L15 13",
    head: "M14 22 V12 H24",
    ghost: "M27 30 Q27 25 31 21 L37 15",
  },
  roundabout: { path: "M24 42 V28 A8 8 0 0 0 24 12 V5.5", head: "M18.5 11 L24 5.5 L29.5 11", ghost: "M16 20 A8 8 0 0 1 24 12" },
};

const LANE: Record<LaneArrow, string> = {
  straight: "M7 13 V3 M3.5 6.5 L7 3 L10.5 6.5",
  right: "M5 13 V8.5 Q5 5 8.5 5 H11 M8.5 2.5 L11 5 L8.5 7.5",
  left: "M9 13 V8.5 Q9 5 5.5 5 H3 M5.5 2.5 L3 5 L5.5 7.5",
  "slight-left": "M8.5 13 V8.5 L4 4 M4 8 V4 H8",
};

const SPEED_M_S = 14;

/** In-car · medium. A glass next-turn card: the distance counts down live and the arrow swells near the junction; tap to peek the step after. */
export function NextTurnWidget({ index }: { index?: number }) {
  const [{ step, dist }, setNav] = useState({ step: 0, dist: STEPS[0].dist });
  const [remain, setRemain] = useState(24.6);
  const [peek, setPeek] = useState(false);
  const peekTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const t = window.setInterval(() => {
      setRemain((r) => Math.max(0.1, Math.round((r - SPEED_M_S / 1000) * 100) / 100));
      setNav((n) => {
        if (n.dist - SPEED_M_S > 0) return { step: n.step, dist: n.dist - SPEED_M_S };
        const next = (n.step + 1) % STEPS.length;
        return { step: next, dist: STEPS[next].dist };
      });
    }, 1000);
    return () => {
      window.clearInterval(t);
      window.clearTimeout(peekTimer.current);
    };
  }, []);

  const press = () => {
    window.clearTimeout(peekTimer.current);
    setPeek(!peek);
    if (!peek) peekTimer.current = window.setTimeout(() => setPeek(false), 4000);
  };

  const nextIdx = (step + 1) % STEPS.length;
  const s = STEPS[peek ? nextIdx : step];
  const show = peek ? dist + STEPS[nextIdx].dist : dist;
  const km = show >= 1000;
  const close = !peek && dist < 100;
  const delay = 0.3 + (index ?? 0) * 0.06;

  return (
    <Widget
      size="medium"
      index={index}
      label="Next turn"
      pressable
      onPress={press}
      surfaceClassName="bg-[linear-gradient(135deg,#10233a_0%,#0a1626_55%,#060d18_100%)] ring-white/10"
    >
      <MapBackdrop />
      <div className="relative flex h-full flex-col text-white">
        <div className="flex gap-3">
          <motion.div
            className="relative grid size-[84px] shrink-0 place-items-center rounded-[22px] bg-[linear-gradient(160deg,rgba(80,200,255,0.3),rgba(40,110,255,0.08))] ring-1 ring-[#5fd4ff]/30 ring-inset backdrop-blur-md"
            animate={{
              scale: close ? 1.06 : 1,
              boxShadow: close ? "0 0 34px rgba(80,200,255,0.5)" : "0 0 18px rgba(80,200,255,0.18)",
            }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.svg
                key={s.kind + String(peek)}
                viewBox="0 0 48 48"
                className="size-14"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ opacity: 0, scale: 0.6, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                transition={{ type: "spring", stiffness: 380, damping: 24 }}
                style={{ filter: "drop-shadow(0 0 6px rgba(110,215,255,0.8))" }}
                aria-hidden
              >
                {ARROW[s.kind].ghost ? <path d={ARROW[s.kind].ghost} stroke="white" strokeOpacity="0.28" strokeWidth="4.5" /> : null}
                <motion.path
                  d={ARROW[s.kind].path}
                  stroke="white"
                  strokeWidth="4.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: step === 0 && !peek ? delay : 0, duration: 0.6, ease: "easeOut" }}
                />
                <path d={ARROW[s.kind].head} stroke="white" strokeWidth="4.5" />
              </motion.svg>
            </AnimatePresence>
          </motion.div>

          <div className="min-w-0 flex-1">
            <div className="flex h-3.5 items-center gap-1.5 text-[11px] leading-none">
              <span className="font-semibold tracking-wide text-[#6fd6ff] uppercase">{peek ? "Then" : close ? "Now" : "In"}</span>
              <span className="truncate text-white/55">{s.verb}</span>
              <span className="ml-auto flex gap-1" aria-hidden>
                {[false, true].map((p) => (
                  <span key={String(p)} className={cn("size-1.5 rounded-full transition-colors", peek === p ? "bg-white" : "bg-white/25")} />
                ))}
              </span>
            </div>
            <div className="mt-0.5 flex items-baseline gap-1 whitespace-nowrap">
              <AnimatedNumber
                value={km ? Math.round(show / 100) / 10 : Math.round(show / 10) * 10}
                format={km ? { minimumFractionDigits: 1, maximumFractionDigits: 1 } : undefined}
                className="text-[32px] leading-none font-semibold tracking-tight"
              />
              <span className="text-[13px] font-medium text-white/55">{km ? "km" : "m"}</span>
            </div>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={s.street}
                className="mt-1 truncate text-[15px] leading-5 font-semibold"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                {s.street}
              </motion.div>
            </AnimatePresence>
            <div className="mt-1.5 flex gap-1" aria-label="Lane guidance">
              {s.lanes.map(([arrow, active], i) => (
                <motion.span
                  key={`${s.street}-${i}`}
                  className={cn(
                    "grid h-5 w-[22px] place-items-center rounded-md ring-1 ring-inset",
                    active ? "bg-[#2aa8ff]/25 text-[#9be6ff] ring-[#5fd4ff]/45" : "bg-white/[0.06] text-white/35 ring-white/5",
                  )}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (step === 0 && !peek ? delay : 0) + i * 0.06, type: "spring", stiffness: 420, damping: 26 }}
                >
                  <svg viewBox="0 0 14 14" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={LANE[arrow]} />
                  </svg>
                </motion.span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto grid grid-cols-3 border-t-[0.5px] border-white/10 pt-2 leading-tight">
          <div>
            <div className="text-[15px] font-semibold tabular">18:42</div>
            <div className="text-[10px] text-white/50">arrival</div>
          </div>
          <div className="text-center">
            <div className="text-[15px] font-semibold">
              <AnimatedNumber value={remain} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
              <span className="text-[11px] font-medium text-white/50"> km</span>
            </div>
            <div className="text-[10px] text-white/50">remaining</div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-[15px] font-semibold tabular">
              <span className="relative h-2.5 w-[18px] rounded-[3px] ring-1 ring-white/50 ring-inset">
                <span className="absolute inset-y-[2px] left-[2px] w-[23%] rounded-[1px] bg-white" />
              </span>
              23%
            </div>
            <div className="text-[10px] text-white/50">on arrival</div>
          </div>
        </div>
      </div>
    </Widget>
  );
}

/** A faint street grid with the route glowing through it, its dashes flowing slowly. */
function MapBackdrop() {
  const route = "M-10 170 C60 160 90 120 150 116 S250 120 290 70 S360 20 420 14";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-16 -left-10 size-48 rounded-full bg-[radial-gradient(circle,rgba(64,170,255,0.32),transparent_65%)]" />
      <svg viewBox="0 0 408 196" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full opacity-70">
        <g stroke="white" strokeOpacity="0.05" strokeWidth="6" fill="none" strokeLinecap="round">
          <path d="M120 -10 L180 210" />
          <path d="M260 -10 L230 210" />
          <path d="M340 -10 L380 210" />
          <path d="M-10 60 L420 40" />
          <path d="M-10 140 L420 160" />
        </g>
        <path d={route} stroke="#3fb6ff" strokeOpacity="0.18" strokeWidth="10" fill="none" strokeLinecap="round" />
        <motion.path
          d={route}
          stroke="#7fdcff"
          strokeOpacity="0.45"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="2 10"
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: [0, -24] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        />
      </svg>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,13,24,0.2),rgba(6,13,24,0.55))]" />
    </div>
  );
}
