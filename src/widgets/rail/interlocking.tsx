import { BranchFork20Filled, Checkmark12Filled, LockClosed12Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { enterDelay, useInterval } from "./_parts";

/* VDU convention: free track grey, a set route white (heading ink), occupied red.
 * Signals show their aspect: red danger, yellow caution. */
type Phase = "idle" | "select" | "confirm" | "throw" | "set" | "arrived";
type Aspect = "R" | "Y" | "G";

const MAIN_Y = 24;
const LOOP_Y = 54;
/* The train's path from SG12 into the loop platform, in drawing px. */
const PATH = [
  { x: 48, y: MAIN_Y },
  { x: 96, y: MAIN_Y },
  { x: 124, y: LOOP_Y },
  { x: 200, y: LOOP_Y },
];
const SEGS = PATH.slice(1).map((b, i) => {
  const a = PATH[i];
  return { a, b, len: Math.hypot(b.x - a.x, b.y - a.y) };
});
const TRAIN_LEN = 26;
const D_START = 34;
const D_END = 150;
const SIGNAL_D = 38; // SG12 sits here along the path
const TB_START = 42; // T101 → T102 joint
const TL_START = 89; // T102 → T106 joint

function along(d: number) {
  let left = d;
  for (const s of SEGS) {
    if (left <= s.len) {
      const f = left / s.len;
      return { x: s.a.x + (s.b.x - s.a.x) * f, y: s.a.y + (s.b.y - s.a.y) * f, deg: (Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x) * 180) / Math.PI };
    }
    left -= s.len;
  }
  const s = SEGS[SEGS.length - 1];
  return { x: s.b.x, y: s.b.y, deg: 0 };
}

const ASPECT: Record<Aspect, string> = { R: "var(--ios-red)", Y: "var(--ios-yellow)", G: "var(--ios-green)" };

function Signal({ x, y, below, aspect, label, selected }: { x: number; y: number; below?: boolean; aspect: Aspect; label: string; selected?: boolean }) {
  const hy = below ? y + 15 : y - 15;
  return (
    <g>
      <line x1={x} x2={x} y1={below ? y + 4 : y - 4} y2={below ? hy - 3.5 : hy + 3.5} strokeWidth="1.2" className="stroke-tertiary" />
      <rect x={x - 4.5} y={hy - 4.5} width="9" height="9" rx="4.5" className="fill-[var(--widget-surface)] stroke-tertiary" strokeWidth="1" />
      <motion.circle cx={x} cy={hy} r="3" initial={{ fill: ASPECT[aspect] }}
      animate={{ fill: ASPECT[aspect] }} transition={{ duration: 0.3 }} />
      {selected ? (
        <motion.circle
          cx={x}
          cy={hy}
          r="8"
          fill="none"
          stroke="var(--ios-blue)"
          strokeWidth="1.5"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
      ) : null}
      <text x={x + 8} y={hy + 3} fontSize="8" fontWeight="600" className="fill-tertiary">
        {label}
      </text>
    </g>
  );
}

/** Rail · medium. A signalling panel with live track circuits and signal aspects; tap SG12 to set a route (the main is locked out by a failed track circuit), confirm, watch the points throw, the signal clear and the train run into the loop. */
export function InterlockingWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  const [reverse, setReverse] = useState(false);
  const [moving, setMoving] = useState(false);
  const [d, setD] = useState(D_START);
  const delay = enterDelay(index);

  // Points travel, then the route proves and the signal clears; after the run, the panel resets.
  useEffect(() => {
    const timers: number[] = [];
    if (phase === "throw") {
      setMoving(true);
      timers.push(window.setTimeout(() => {
        setMoving(false);
        setReverse(true);
        setPhase("set");
      }, 2200));
    }
    if (phase === "arrived") {
      timers.push(window.setTimeout(() => setMoving(true), 4200));
      timers.push(window.setTimeout(() => {
        setMoving(false);
        setReverse(false);
        setD(D_START);
        setPhase("idle");
      }, 6000));
    }
    return () => timers.forEach((x) => window.clearTimeout(x));
  }, [phase]);

  // The train runs once the signal has cleared.
  useInterval(
    () => {
      const n = Math.min(D_END, d + (d < 60 ? 3 : 5));
      setD(n);
      if (n >= D_END) setPhase("arrived");
    },
    phase === "set" ? 180 : null,
  );

  const front = d;
  const rear = d - TRAIN_LEN;
  const occ = (from: number, to: number) => rear < to && front > from;
  const routeSet = (phase === "set" || phase === "arrived") && reverse;
  const t101 = occ(-100, TB_START);
  const t102 = occ(TB_START, TL_START);
  const t106 = occ(TL_START, 1000);
  const sg12: Aspect = phase === "set" && front < SIGNAL_D + 4 ? "Y" : "R";
  const pos = along(Math.max(0, d - TRAIN_LEN / 2));

  const track = (occupied: boolean, routed: boolean) =>
    occupied ? "var(--ios-red)" : routed ? "var(--ant-color-text-heading)" : "var(--ant-color-text-quaternary)";
  const tbColor = track(t102, routeSet && rear < TL_START);
  const tlColor = track(t106, routeSet);
  const legOff = "var(--ant-color-fill-secondary)";

  return (
    <Widget size="medium" index={index} label="Interlocking route setting">
      <WidgetHeader
        icon={<BranchFork20Filled />}
        tint="var(--ios-indigo)"
        title="Selhurst Panel · WS3"
        subtitle="East Croydon area · SSI"
        extra={
          <span
            title="Track circuit T103 showing occupied with no train: treat as failed"
            className="flex items-center gap-1.5 rounded-full bg-ios-red/15 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-ios-red"
          >
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-ios-red opacity-70" />
              <span className="relative size-1.5 rounded-full bg-ios-red" />
            </span>
            T103 failed
          </span>
        }
      />

      <svg viewBox="0 0 376 76" className="mt-1.5 h-[76px] w-full" aria-label="Track diagram">
        {/* platforms */}
        <rect x="140" y="11" width="110" height="5" rx="1" className="fill-fill-tertiary" />
        <rect x="140" y="62" width="110" height="5" rx="1" className="fill-fill-tertiary" />
        <text x="134" y="16" fontSize="8" textAnchor="end" className="fill-tertiary">P2</text>
        <text x="134" y="67" fontSize="8" textAnchor="end" className="fill-tertiary">P3</text>

        <g strokeWidth="3.5" strokeLinecap="butt" fill="none">
          {/* T101 approach, occupied by 2S41 while it waits */}
          <motion.path d={`M4 ${MAIN_Y} H90`} animate={{ stroke: track(t101, false) }} initial={false} />
          {/* T102 points 231: toe, normal leg, reverse leg */}
          <motion.path d={`M92 ${MAIN_Y} H98`} animate={{ stroke: tbColor }} initial={false} />
          <motion.path
            d={`M102 ${MAIN_Y} H128`}
            animate={{ stroke: moving ? legOff : reverse ? legOff : track(false, false) }}
            initial={false}
          />
          <motion.path
            d={`M101 ${MAIN_Y + 5.4} L124 ${LOOP_Y}`}
            animate={{ stroke: moving ? legOff : reverse ? tbColor : legOff }}
            initial={false}
          />
          {/* T103 main platform line: failed, flashes red */}
          <motion.path
            d={`M132 ${MAIN_Y} H262`}
            stroke="var(--ios-red)"
            animate={reduce ? { opacity: 1 } : { opacity: [1, 0.35, 1] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* T106 loop */}
          <motion.path d={`M126 ${LOOP_Y} H266`} animate={{ stroke: tlColor }} initial={false} />
          {/* T104 points 232 (normal) and T105 onward */}
          <path d={`M268 ${LOOP_Y} L292 ${MAIN_Y + 5.4}`} stroke="var(--ant-color-fill-secondary)" />
          <path d={`M264 ${MAIN_Y} H372`} stroke="var(--ant-color-text-quaternary)" />
        </g>
        {/* points 231 blade travel */}
        {moving ? (
          <motion.circle cx="98" cy={MAIN_Y} r="5" fill="none" stroke="var(--ios-blue)" strokeWidth="1.5" animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }} />
        ) : null}
        <text x="92" y={MAIN_Y + 15} fontSize="7.5" textAnchor="end" className="fill-tertiary">
          231{reverse ? "R" : "N"}
        </text>
        <text x="197" y={MAIN_Y + 13} fontSize="8" textAnchor="middle" fontWeight="600" fill="var(--ios-red)">
          T103 TCF
        </text>
        <text x="300" y={MAIN_Y + 15} fontSize="7.5" textAnchor="middle" className="fill-tertiary">
          232N
        </text>

        <Signal x={86} y={MAIN_Y} aspect={sg12} label="SG12" selected={phase === "select" || phase === "confirm"} />
        <Signal x={256} y={MAIN_Y} aspect="R" label="SG14" />
        <Signal x={262} y={LOOP_Y} below aspect="R" label="SG16" />

        {/* 2S41 */}
        <motion.g
          initial={{ x: pos.x, y: pos.y, rotate: 0, opacity: 0 }}
          animate={{ x: pos.x, y: pos.y, rotate: pos.deg, opacity: phase === "arrived" && moving ? 0 : 1 }}
          transition={{ duration: 0.2, ease: "linear", opacity: { duration: 0.6, delay: phase === "idle" ? delay : 0 } }}
        >
          <rect x={-TRAIN_LEN / 2} y="-4" width={TRAIN_LEN} height="8" rx="2.5" className="fill-heading" />
          <rect x={TRAIN_LEN / 2 - 4} y="-2.5" width="2.5" height="5" rx="0.8" className="fill-[var(--widget-surface)]" />
        </motion.g>
        <text x={pos.x} y={pos.y - 8} fontSize="8" fontWeight="700" textAnchor="middle" className="fill-secondary">
          2S41
        </text>

        {/* tap target for SG12 */}
        <circle
          cx="86"
          cy={MAIN_Y - 15}
          r="11"
          fill="transparent"
          className={phase === "idle" || phase === "select" ? "cursor-pointer" : undefined}
          onClick={() => (phase === "idle" ? setPhase("select") : phase === "select" ? setPhase("idle") : undefined)}
        >
          <title>Signal SG12</title>
        </circle>
      </svg>

      <div className="relative mt-auto h-10 overflow-hidden rounded-xl bg-fill-tertiary px-2.5">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="flex h-10 items-center gap-2 whitespace-nowrap"
          >
            {phase === "idle" ? (
              <>
                <span className="min-w-0 flex-1 truncate text-[12px] text-secondary">
                  <span className="font-semibold text-heading">2S41</span> waiting at SG12 · tap the signal
                </span>
                <motion.span
                  className="size-2 rounded-full bg-ios-blue"
                  animate={reduce ? undefined : { opacity: [1, 0.25, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              </>
            ) : phase === "select" ? (
              <>
                <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-heading">SG12 to</span>
                <Button size="small" variant="filled" color="default" disabled icon={<LockClosed12Filled />}>
                  Main P2
                </Button>
                <Button size="small" type="primary" onClick={() => setPhase("confirm")}>
                  Loop P3
                </Button>
              </>
            ) : phase === "confirm" ? (
              <>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-[12px] font-semibold text-heading">Set SG12 → SG16?</div>
                  <div className="truncate text-[11px] text-tertiary">Points 231 to reverse · via T102, T106</div>
                </div>
                <Button size="small" variant="filled" color="default" onClick={() => setPhase("select")}>
                  Back
                </Button>
                <Button size="small" type="primary" onClick={() => setPhase("throw")}>
                  Set route
                </Button>
              </>
            ) : phase === "throw" ? (
              <>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-[12px] font-semibold text-heading">Points 231 moving</div>
                  <div className="truncate text-[11px] text-tertiary">Awaiting detection…</div>
                </div>
                <motion.span
                  className="size-4 rounded-full border-2 border-fill border-t-heading"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              </>
            ) : (
              <>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-[12px] font-semibold text-heading">
                    {phase === "set" ? "Route set · SG12 single yellow" : "2S41 in P3 · route released"}
                  </div>
                  <div className={cn("truncate text-[11px] text-tertiary")}>
                    {phase === "set" ? "Sectional release behind the train" : "Panel resets for the next train"}
                  </div>
                </div>
                <Checkmark12Filled className="text-heading" />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Widget>
  );
}
