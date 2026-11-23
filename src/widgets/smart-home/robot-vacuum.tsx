import { Home16Regular, Pause16Filled, Play16Filled } from "@fluentui/react-icons";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

type Phase = "cleaning" | "paused" | "returning" | "docked";

/* Living room lanes, boustrophedon, in map units (viewBox 164 × 72). */
const LANES = Array.from({ length: 8 }, (_, i) => 9 + i * 7.6);
const X0 = 10;
const X1 = 94;
const PTS = LANES.flatMap((y, i) => (i % 2 ? [[X1, y], [X0, y]] : [[X0, y], [X1, y]]));
const SEGS = PTS.slice(1).map((p, i) => {
  const a = PTS[i];
  return { a, b: p, len: Math.hypot(p[0] - a[0], p[1] - a[1]) };
});
const LEN = SEGS.reduce((s, x) => s + x.len, 0);
const PATH = `M${PTS.map((p) => p.join(" ")).join("L")}`;
const DOCK = { x: 150, y: 62 };
const ROOM_M2 = 31.5;
const FULL_MIN = 38;
const START = 0.38;
/** The doorway the robot drives through on its way back to the dock. */
const DOOR = { x: 104, y: 45 };

const at = (p: number) => {
  let d = p * LEN;
  for (const s of SEGS) {
    if (d <= s.len) {
      const t = d / s.len;
      return { x: s.a[0] + (s.b[0] - s.a[0]) * t, y: s.a[1] + (s.b[1] - s.a[1]) * t };
    }
    d -= s.len;
  }
  const last = PTS[PTS.length - 1];
  return { x: last[0], y: last[1] };
};

/** Smart home · small. A robot vacuum painting its lanes across a live room map with area, time left and battery rolling; pause, resume or send it home to the dock. */
export function RobotVacuumWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [phase, setPhase] = useState<Phase>("cleaning");
  const [p, setP] = useState(START);
  const [battery, setBattery] = useState(64);

  useEffect(() => {
    if (phase === "cleaning") {
      const t = window.setInterval(() => {
        setP((v) => Math.min(1, v + 0.0035));
        setBattery((b) => (Math.random() < 0.1 ? Math.max(12, b - 1) : b));
      }, 120);
      return () => window.clearInterval(t);
    }
    if (phase === "returning") {
      const t = window.setTimeout(() => setPhase("docked"), 2600);
      return () => window.clearTimeout(t);
    }
    if (phase === "docked") {
      const t = window.setInterval(() => setBattery((b) => Math.min(100, b + 1)), 900);
      return () => window.clearInterval(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "cleaning" && p >= 1) setPhase("returning");
  }, [phase, p]);

  const pos = at(p);
  const first = p === START;
  const area = ROOM_M2 * p;
  const left = Math.round(FULL_MIN * (1 - p));
  const subtitle =
    phase === "cleaning" ? "Cleaning · Living Room" : phase === "paused" ? "Paused · Living Room" : phase === "returning" ? "Returning to dock" : "Docked · charging";

  return (
    <Widget size="small" index={index} label="Robot vacuum">
      <WidgetHeader icon={<RobotGlyph />} tint="var(--ios-indigo)" title="Roborock S8" subtitle={subtitle} />

      <svg viewBox="0 0 164 72" className="mt-1.5 w-full shrink-0" style={{ height: 72 }} aria-hidden>
        {/* Floor plan: living room, doorway, kitchen with the dock. */}
        <rect x="2" y="2" width="160" height="68" rx="5" style={{ fill: "var(--ant-color-fill-quaternary)" }} />
        <path d="M104 2v34M104 54v16" strokeWidth="2" style={{ stroke: "var(--ant-color-text-tertiary)" }} />
        <rect x="2" y="2" width="160" height="68" rx="5" fill="none" strokeWidth="2" style={{ stroke: "var(--ant-color-text-tertiary)" }} />
        <text x="133" y="14" textAnchor="middle" fontSize="9" style={{ fill: "var(--ant-color-text-tertiary)" }}>
          Kitchen
        </text>
        <rect x="112" y="22" width="42" height="22" rx="3" style={{ fill: "var(--ios-indigo)", opacity: 0.16 }} />
        <text x="133" y="36" textAnchor="middle" fontSize="9" style={{ fill: "var(--ant-color-text-tertiary)" }}>
          Done
        </text>

        {/* Lanes still to clean, then the cleaned swath painted over them. */}
        <path d={PATH} fill="none" strokeWidth="0.8" strokeDasharray="1.5 3" style={{ stroke: "var(--ant-color-text-tertiary)", opacity: 0.6 }} />
        <motion.path
          d={PATH}
          fill="none"
          strokeWidth="6.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={LEN}
          initial={{ strokeDashoffset: LEN }}
          animate={{ strokeDashoffset: LEN * (1 - p) }}
          transition={first ? { duration: reduce ? 0 : 1.2, ease: "easeOut", delay } : { duration: 0.15, ease: "linear" }}
          style={{ stroke: "var(--ios-indigo)", opacity: 0.3 }}
        />

        {/* Dock. */}
        <rect x={DOCK.x - 6} y={DOCK.y + 3} width="12" height="4" rx="1.5" style={{ fill: "var(--ant-color-text-secondary)" }} />

        {/* The robot, with a bumper notch facing its heading. */}
        <motion.g
          initial={{ x: pos.x, y: pos.y, opacity: 0 }}
          animate={
            phase === "returning"
              ? { x: [pos.x, DOOR.x, DOCK.x], y: [pos.y, DOOR.y, DOCK.y], opacity: 1 }
              : phase === "docked"
                ? { x: DOCK.x, y: DOCK.y, opacity: 1 }
                : { x: pos.x, y: pos.y, opacity: 1 }
          }
          transition={
            phase === "returning"
              ? { duration: reduce ? 0 : 2.4, ease: "easeInOut" }
              : first
                ? { opacity: { delay: delay + 1, duration: 0.3 } }
                : { duration: 0.12, ease: "linear" }
          }
        >
          {phase === "cleaning" && !reduce ? (
            <motion.circle
              r="5"
              fill="none"
              strokeWidth="1"
              style={{ stroke: "var(--ios-indigo)" }}
              initial={{ r: 5, opacity: 0.6 }}
              animate={{ r: [5, 11], opacity: [0.6, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
            />
          ) : null}
          <circle r="5" strokeWidth="1.5" style={{ fill: "var(--widget-surface)", stroke: "var(--ios-indigo)" }} />
          <circle r="1.8" style={{ fill: "var(--ios-indigo)" }} />
        </motion.g>
      </svg>

      <div className="mt-auto flex items-baseline-last justify-between gap-2">
        <div className="min-w-0 leading-tight whitespace-nowrap">
          <div className="text-[22px] leading-none font-semibold tracking-tight text-heading">
            <AnimatedNumber value={area} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
            <span className="ml-0.5 text-[12px] font-medium text-tertiary">m²</span>
          </div>
          <div className="mt-1 truncate text-[11px] text-tertiary tabular">
            {phase === "docked" ? "Done" : <><AnimatedNumber value={left} /> min left</>} ·{" "}
            <span className={cn(battery < 20 ? "text-ios-red" : "text-secondary")}>
              <AnimatedNumber value={battery} />%
            </span>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            size="small"
            shape="circle"
            variant="filled"
            color="default"
            aria-label="Send to dock"
            icon={<Home16Regular />}
            disabled={phase === "docked" || phase === "returning"}
            onClick={() => setPhase("returning")}
          />
          <Button
            size="small"
            shape="circle"
            type="primary"
            aria-label={phase === "cleaning" ? "Pause" : "Start"}
            icon={phase === "cleaning" ? <Pause16Filled /> : <Play16Filled />}
            disabled={phase === "returning"}
            onClick={() => {
              if (phase === "cleaning") setPhase("paused");
              else {
                if (phase === "docked") setP(0);
                setPhase("cleaning");
              }
            }}
          />
        </div>
      </div>
    </Widget>
  );
}

/** A round robot vacuum seen from above, for the header chip. */
function RobotGlyph() {
  return (
    <svg viewBox="0 0 20 20" width="1em" height="1em" aria-hidden>
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="10" cy="8" r="2.4" fill="currentColor" />
      <path d="M5 13.5h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
