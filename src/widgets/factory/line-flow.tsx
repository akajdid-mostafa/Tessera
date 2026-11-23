import { Checkmark12Filled, Flow20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { AlarmMark, enterDelay, useInterval } from "./_parts";

/* A PET bottling line drawn as a U: depalletiser → filler → capper, then down the
 * accumulation conveyor to the labeler and back to the case packer. The filler is
 * the designed constraint (720 bpm); every other machine is rated faster, the classic
 * V-curve. Today the labeler runs slow on low web tension, so bottles pack up on the
 * buffer ahead of it and the stations past it run thin. A small queue simulation
 * moves the bottles: nothing here is a canned animation. */

type Pt = readonly [number, number];
const W = 376;
const H = 176;
const V = 60; // conveyor speed, px/s
const GAP = 8; // pitch of packed bottles
const SLOW_RATE = 2.45;
const PREWARM_S = 35;
const CONFIRM_S = 4;

const CONVEYORS: Pt[][] = [
  [[58, 34], [130, 34]],
  [[174, 34], [238, 34]],
  [[266, 34], [350, 34], [350, 140], [278, 140]],
  [[226, 140], [88, 140]],
];
const BUFFER = 2;

type Kind = "depal" | "filler" | "capper" | "labeler" | "packer";
type Station = {
  id: Kind;
  name: string;
  x: number;
  y: number;
  /** Visual transfer rate, bottles/s. */
  rate: number;
  rated: number;
  bpm: number;
  input: number;
  output: number;
  note: string;
};
const STATIONS: Station[] = [
  { id: "depal", name: "Depal", x: 36, y: 34, rate: 3.3, rated: 800, bpm: 760, input: -1, output: 0, note: "Pallet 2 · layer 6 of 9" },
  { id: "filler", name: "Filler", x: 152, y: 34, rate: 3.0, rated: 720, bpm: 720, input: 0, output: 1, note: "72 valves · bowl 1.6 bar" },
  { id: "capper", name: "Capper", x: 252, y: 34, rate: 3.2, rated: 760, bpm: 736, input: 1, output: 2, note: "18 heads · torque 1.9 N·m" },
  { id: "labeler", name: "Labeler", x: 252, y: 140, rate: 3.5, rated: 760, bpm: 752, input: 2, output: 3, note: "Roll 2 · 38% left" },
  { id: "packer", name: "Packer", x: 64, y: 140, rate: 3.6, rated: 840, bpm: 790, input: 3, output: -1, note: "12-pack · 66 cases/min" },
];
const LABELER = 3;
const SLOW_BPM = 612;
const LINE_RATED = 720;

const segLens = (pts: Pt[]) => pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
const LENS = CONVEYORS.map((c) => segLens(c).reduce((a, b) => a + b, 0));
const pointAt = (pts: Pt[], s: number): Pt => {
  const segs = segLens(pts);
  let rest = s;
  for (let i = 0; i < segs.length; i++) {
    if (rest <= segs[i] || i === segs.length - 1) {
      const t = segs[i] ? Math.min(1, rest / segs[i]) : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t];
    }
    rest -= segs[i];
  }
  return pts[pts.length - 1];
};

type Sim = {
  belts: number[][];
  st: { timer: number; blocked: number; starved: number }[];
};
const makeSim = (): Sim => ({
  belts: CONVEYORS.map(() => []),
  st: STATIONS.map(() => ({ timer: 0, blocked: 0, starved: 0 })),
});

function step(sim: Sim, dt: number, slow: boolean) {
  sim.belts.forEach((items, c) => {
    for (let k = 0; k < items.length; k++) {
      const lim = k === 0 ? LENS[c] : items[k - 1] - GAP;
      items[k] = Math.max(items[k], Math.min(lim, items[k] + V * dt));
    }
  });
  // Downstream first, so a transfer frees room for the station behind it.
  for (let i = STATIONS.length - 1; i >= 0; i--) {
    const s = STATIONS[i];
    const st = sim.st[i];
    st.timer = Math.max(0, st.timer - dt);
    if (st.timer > 0) continue;
    const inBelt = s.input >= 0 ? sim.belts[s.input] : null;
    const outBelt = s.output >= 0 ? sim.belts[s.output] : null;
    const hasIn = !inBelt || (inBelt.length > 0 && inBelt[0] >= LENS[s.input] - 0.5);
    const room = !outBelt || outBelt.length === 0 || outBelt[outBelt.length - 1] >= GAP;
    if (hasIn && room) {
      inBelt?.shift();
      outBelt?.push(0);
      st.timer = 1 / (i === LABELER && slow ? SLOW_RATE : s.rate);
      st.blocked = 0;
      st.starved = 0;
    } else if (!hasIn) st.starved += dt;
    else st.blocked += dt;
  }
}

/** Packed share of the accumulation conveyor: bottles nose to tail from its end. */
const bufferFill = (sim: Sim) => {
  const items = sim.belts[BUFFER];
  let packed = 0;
  for (let k = 0; k < items.length; k++) {
    const lim = k === 0 ? LENS[BUFFER] : items[k - 1] - GAP;
    if (items[k] >= lim - 0.6) packed++;
    else break;
  }
  return Math.min(1, (packed * GAP) / LENS[BUFFER]);
};

type StateLabel = "Running" | "Slow" | "Blocked" | "Starved";
type Status = { buffer: number; states: StateLabel[] };

function readStatus(sim: Sim, slow: boolean): Status {
  return {
    buffer: bufferFill(sim),
    states: STATIONS.map((s, i) => {
      if (i === LABELER && slow) return "Slow";
      const st = sim.st[i];
      return st.blocked > 1.2 ? "Blocked" : st.starved > 1.2 ? "Starved" : "Running";
    }),
  };
}

function StationGlyph({ s, slow, selected, reduce }: { s: Station; slow: boolean; selected: boolean; reduce: boolean | null }) {
  const turn = (secs: number) =>
    reduce ? { animate: { rotate: 0 } } : { animate: { rotate: 360 }, transition: { duration: secs, repeat: Infinity, ease: "linear" as const } };
  const stroke = slow ? "var(--ios-yellow)" : selected ? "var(--ant-color-text)" : "var(--ant-color-text-tertiary)";
  const sw = slow || selected ? 1.8 : 1.2;
  if (s.id === "filler" || s.id === "capper") {
    const r = s.id === "filler" ? 20 : 13;
    const n = s.id === "filler" ? 10 : 6;
    return (
      <g>
        <circle cx={s.x} cy={s.y} r={r} className="fill-fill-tertiary" stroke={stroke} strokeWidth={sw} />
        <motion.g {...turn(s.id === "filler" ? 6 : 3)}>
          {Array.from({ length: n }, (_, k) => {
            const a = (k / n) * Math.PI * 2;
            return <circle key={k} cx={s.x + (r - 5) * Math.cos(a)} cy={s.y + (r - 5) * Math.sin(a)} r="2" className="fill-tertiary" />;
          })}
        </motion.g>
      </g>
    );
  }
  const w = s.id === "depal" ? 44 : 48;
  return (
    <g>
      <rect x={s.x - w / 2} y={s.y - 14} width={w} height="28" rx="4" className="fill-fill-tertiary" stroke={stroke} strokeWidth={sw} />
      {s.id === "depal"
        ? [0, 1, 2].map((k) => (
            <rect key={k} x={s.x - 14} y={s.y - 8 + k * 6} width="28" height="3" rx="1" className="fill-fill" />
          ))
        : null}
      {s.id === "labeler" ? (
        <motion.g {...turn(slow ? 3.2 : 1.6)}>
          <circle cx={s.x - 12} cy={s.y} r="7" fill="none" strokeWidth="2" strokeDasharray="4 3" className="stroke-tertiary" />
        </motion.g>
      ) : null}
      {s.id === "labeler" ? <rect x={s.x + 2} y={s.y - 6} width="14" height="12" rx="2" className="fill-fill" /> : null}
      {s.id === "packer"
        ? [0, 1, 2, 3, 4, 5].map((k) => (
            <rect key={k} x={s.x - 13 + (k % 3) * 9} y={s.y - 8 + Math.floor(k / 3) * 9} width="7" height="7" rx="1" className="fill-fill" />
          ))
        : null}
    </g>
  );
}

/** The line drawing. It owns the simulation and its frame loop, so only it re-renders per frame. */
function LineDrawing({
  slow,
  selected,
  onSelect,
  onStatus,
  delay,
}: {
  slow: boolean;
  selected: number;
  onSelect: (i: number) => void;
  onStatus: (s: Status) => void;
  delay: number;
}) {
  const reduce = useReducedMotion();
  const sim = useRef<Sim | null>(null);
  if (!sim.current) {
    const s = makeSim();
    for (let t = 0; t < PREWARM_S; t += 1 / 30) step(s, 1 / 30, true);
    sim.current = s;
  }
  const slowRef = useRef(slow);
  slowRef.current = slow;
  const [, setFrame] = useState(0);

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (sim.current) step(sim.current, dt, slowRef.current);
      setFrame((f) => (f + 1) % 1_000_000);
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [reduce]);

  useInterval(() => sim.current && onStatus(readStatus(sim.current, slowRef.current)), 500);

  const s = sim.current;
  return (
    <motion.svg
      viewBox={`0 0 ${W} ${H}`}
      className="mt-2 h-[176px] w-full shrink-0 overflow-visible"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay }}
      aria-label="Bottling line flow"
    >
      {CONVEYORS.map((c, i) => (
        <polyline
          key={i}
          points={c.map((p) => p.join(",")).join(" ")}
          fill="none"
          strokeWidth="10"
          strokeLinejoin="round"
          className={i === BUFFER ? "stroke-fill-secondary" : "stroke-fill-tertiary"}
        />
      ))}

      {s.belts.map((items, c) =>
        items.map((pos, k) => {
          const [x, y] = pointAt(CONVEYORS[c], pos);
          const empty = c === 0;
          return (
            <circle
              key={`${c}-${k}`}
              cx={x}
              cy={y}
              r="3.3"
              strokeWidth="1.3"
              fill={empty ? "var(--widget-surface)" : "var(--ant-color-text-secondary)"}
              stroke="var(--ant-color-text-secondary)"
            />
          );
        }),
      )}

      {STATIONS.map((st, i) => {
        const isSlow = i === LABELER && slow;
        const top = st.y < H / 2;
        const ny = top ? 68 : 110;
        return (
          <g
            key={st.id}
            onClick={() => onSelect(i)}
            className="cursor-pointer"
            role="button"
            aria-label={`${st.name}${isSlow ? ", running slow" : ""}`}
          >
            <rect x={st.x - 30} y={top ? 8 : 100} width="60" height="68" fill="transparent" />
            <StationGlyph s={st} slow={isSlow} selected={selected === i} reduce={reduce} />
            <text
              x={st.x}
              y={ny}
              textAnchor="middle"
              fontSize="11"
              fontWeight={selected === i ? 700 : 600}
              className={selected === i ? "fill-heading" : "fill-secondary"}
            >
              {st.name}
            </text>
            <text x={st.x} y={ny + 12} textAnchor="middle" fontSize="10" className="fill-tertiary tabular">
              {isSlow ? SLOW_BPM : st.bpm} bpm
            </text>
          </g>
        );
      })}

      {/* Priority 3 on the labeler, beside its name. */}
      {slow ? (
        <g transform={`translate(${STATIONS[LABELER].x + 26} ${101})`}>
          <path d="M0 0h12L6 10.4z" fill="var(--ios-yellow)" />
          <text x="6" y="6" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#000">
            3
          </text>
        </g>
      ) : null}

      <text x="342" y="92" textAnchor="end" fontSize="10" className="fill-tertiary">
        Buffer
      </text>
    </motion.svg>
  );
}

type Phase = "idle" | "confirm" | "ramp";

/** Factory · large. A bottling line drawn as a U whose bottles flow through a live queue simulation and pack up ahead of a slow labeler; tap any machine for its detail, and reset the labeler with a two-tap confirm to watch the buffer drain. */
export function LineFlowWidget({ index }: { index?: number }) {
  const [slow, setSlow] = useState(true);
  const [selected, setSelected] = useState(LABELER);
  const [status, setStatus] = useState<Status>({ buffer: 0.64, states: STATIONS.map((_, i) => (i === LABELER ? "Slow" : "Running")) });
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(CONFIRM_S);
  const [jitter, setJitter] = useState(0);
  const delay = enterDelay(index);

  useInterval(() => setJitter(Math.round((Math.random() - 0.5) * 8)), 2000);
  useInterval(
    () => {
      if (countdown <= 1) {
        setPhase("idle");
        setCountdown(CONFIRM_S);
      } else setCountdown(countdown - 1);
    },
    phase === "confirm" ? 1000 : null,
  );
  useEffect(() => {
    if (phase !== "ramp") return;
    const t = window.setTimeout(() => {
      setSlow(false);
      setPhase("idle");
    }, 1200);
    return () => window.clearTimeout(t);
  }, [phase]);

  const sel = STATIONS[selected];
  const selState = status.states[selected];
  const bpmOf = (i: number) => {
    if (i === LABELER && slow) return SLOW_BPM + jitter;
    if (i === 1 && slow && status.buffer > 0.9) return SLOW_BPM + jitter;
    return STATIONS[i].bpm + (i === 1 ? Math.min(0, jitter) : jitter);
  };
  const out = slow ? SLOW_BPM + jitter : LINE_RATED - 4 + Math.min(0, jitter);
  const selBpm = bpmOf(selected);
  const abnormal = selected === LABELER && slow;

  return (
    <Widget size="large" index={index} label="Bottling line flow">
      <WidgetHeader
        icon={<Flow20Filled />}
        tint={slow ? "var(--ios-orange)" : "var(--ios-indigo)"}
        title="Line 4 · PET 500 ml"
        subtitle="Bottling · constraint Filler"
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={slow ? "slow" : "ok"}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                slow ? "bg-ios-yellow/20 text-heading" : "bg-fill-tertiary text-secondary",
              )}
            >
              {slow ? <AlarmMark priority={3} size={13} /> : <Checkmark12Filled />}
              {slow ? "Labeler slow" : "Balanced"}
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="mt-3 flex items-baseline-last justify-between whitespace-nowrap">
        <div className="leading-none">
          <AnimatedNumber value={out} className="text-[32px] font-semibold tracking-tight text-heading" />
          <span className="text-[12px] text-tertiary"> bpm · rated {LINE_RATED}</span>
        </div>
        <div className="text-right text-[11px] leading-tight tabular">
          <div className="text-tertiary">
            Buffer{" "}
            <AnimatedNumber
              value={status.buffer}
              format={{ style: "percent", maximumFractionDigits: 0 }}
              className={cn("font-semibold", status.buffer > 0.85 ? "text-ios-orange" : "text-secondary")}
            />
          </div>
          <div className="text-tertiary">
            Efficiency{" "}
            <AnimatedNumber
              value={out / LINE_RATED}
              format={{ style: "percent", maximumFractionDigits: 0 }}
              className="font-semibold text-secondary"
            />
          </div>
        </div>
      </div>

      <LineDrawing slow={slow} selected={selected} onSelect={setSelected} onStatus={setStatus} delay={delay} />

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={sel.id}
          className="mt-auto rounded-2xl bg-fill-quaternary p-2.5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        >
          <div className="flex h-[18px] items-center gap-1.5 whitespace-nowrap">
            {abnormal ? <AlarmMark priority={3} size={15} /> : null}
            <span className="text-[13px] font-semibold text-heading">{sel.id === "depal" ? "Depalletiser" : sel.id === "packer" ? "Case packer" : sel.name}</span>
            <span className={cn("text-[11px]", selState === "Running" ? "text-tertiary" : "font-medium text-secondary")}>
              · {selState}
            </span>
            <span className="ml-auto text-[11px] text-tertiary tabular">
              <AnimatedNumber value={selBpm} className="font-semibold text-heading" /> / {sel.rated} bpm
            </span>
          </div>

          <div className="relative mt-2 h-1.5 rounded-full bg-fill-secondary">
            <motion.div
              className={cn("absolute inset-y-0 left-0 rounded-full", abnormal ? "bg-ios-yellow" : "bg-[var(--ant-color-text-secondary)]")}
              initial={{ width: 0 }}
              animate={{ width: `${(selBpm / sel.rated) * 100}%` }}
              transition={{ type: "spring", stiffness: 90, damping: 20 }}
            />
            <span
              className="absolute -top-1 h-3.5 w-[2px] -translate-x-1/2 rounded-full bg-heading"
              style={{ left: `${(LINE_RATED / sel.rated) * 100}%` }}
              title="Line rate"
            />
          </div>

          <div className="mt-2 flex h-6 items-center gap-2 whitespace-nowrap">
            <span className="min-w-0 flex-1 truncate text-[11px] text-tertiary">
              {abnormal ? "Web tension low after splice at 14:02" : sel.note}
            </span>
            {abnormal ? (
              <AnimatePresence mode="popLayout" initial={false}>
                {phase === "idle" ? (
                  <motion.div key="reset" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
                    <Button
                      size="small"
                      color="default"
                      variant="filled"
                      onClick={() => {
                        setCountdown(CONFIRM_S);
                        setPhase("confirm");
                      }}
                    >
                      Reset tension
                    </Button>
                  </motion.div>
                ) : phase === "confirm" ? (
                  <motion.div key="confirm" className="flex gap-1" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
                    <Button size="small" type="text" onClick={() => setPhase("idle")}>
                      Cancel
                    </Button>
                    <Button size="small" color="default" variant="solid" onClick={() => setPhase("ramp")}>
                      Confirm · {countdown}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.span key="ramp" className="text-[11px] font-medium text-secondary" initial={{ opacity: 0 }} animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                    Ramping up…
                  </motion.span>
                )}
              </AnimatePresence>
            ) : null}
          </div>
        </motion.div>
      </AnimatePresence>
    </Widget>
  );
}
