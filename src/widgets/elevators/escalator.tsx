import { Warning16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type State = "run" | "eco" | "fault";
type Unit = { id: string; route: string; dir: 1 | -1; speed: number; pax: number; state: State; note?: string };

const UNITS: Unit[] = [
  { id: "E1", route: "Level 1 → 2", dir: 1, speed: 0.5, pax: 1420, state: "run" },
  { id: "E2", route: "Level 2 → 1", dir: -1, speed: 0.5, pax: 1185, state: "run" },
  { id: "E3", route: "Level 2 → 3", dir: 1, speed: 0, pax: 0, state: "fault", note: "Handrail speed fault · 12:40" },
  { id: "E4", route: "Level 3 → 2", dir: -1, speed: 0.2, pax: 160, state: "eco" },
];

/* Profile geometry: a 30° incline between two landings. */
const LOW = { x: 30, y: 68 };
const HIGH = { x: 124, y: 14 };
const TREAD = 9;
const RISE = TREAD * Math.tan(Math.PI / 6);
const STEPS = Math.ceil((HIGH.x - LOW.x) / TREAD) + 4;
const STAIR = (() => {
  let d = `M${LOW.x - TREAD * 2} ${LOW.y + RISE}`;
  for (let i = 0; i < STEPS; i++) d += `h${TREAD}v${-RISE}`;
  return d;
})();
const STEP_DEPTH_M = 0.4;

/** Elevators · small. An escalator in profile with steps and handrail moving at its speed and direction; tap to page through the mall's four units, one stopped on a handrail fault. */
export function EscalatorWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const clip = `esc-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [page, setPage] = useState(0);
  const [pax, setPax] = useState(() => UNITS.map((u) => u.pax));

  useEffect(() => {
    const t = window.setInterval(() => {
      setPax((p) => p.map((v, i) => (UNITS[i].state === "run" ? Math.max(900, v + Math.round((Math.random() - 0.5) * 60)) : v)));
    }, 3000);
    return () => window.clearInterval(t);
  }, []);

  const u = UNITS[page];
  const fault = u.state === "fault";
  const moving = u.speed > 0 && !reduce;
  const period = u.speed > 0 ? STEP_DEPTH_M / u.speed : 1;
  const accent = fault ? "var(--ios-orange)" : "var(--ant-color-text)";

  return (
    <Widget
      size="small"
      index={index}
      label="Escalator status"
      pressable
      onPress={() => setPage((p) => (p + 1) % UNITS.length)}
    >
      <WidgetHeader
        icon={<EscalatorGlyph />}
        tint={fault ? "var(--ios-orange)" : "var(--ios-teal)"}
        title={`Escalator ${u.id}`}
        subtitle={fault ? "Stopped" : u.state === "eco" ? "Eco standby" : u.dir > 0 ? "Running up" : "Running down"}
        extra={
          <div className="mt-1.5 flex gap-1" aria-hidden>
            {UNITS.map((x, i) => (
              <motion.span
                key={x.id}
                className={cn("size-1.5 rounded-full", i === page ? (x.state === "fault" ? "bg-ios-orange" : "bg-[var(--ant-color-text)]") : "bg-fill")}
                animate={{ scale: i === page ? 1.3 : 1 }}
              />
            ))}
          </div>
        }
      />

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.svg
          key={u.id}
          viewBox="0 0 164 78"
          className="mt-1 w-full shrink-0"
          style={{ height: 78 }}
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -14 }}
          transition={{ duration: 0.3 }}
        >
          <defs>
            <clipPath id={clip}>
              <polygon points={`${LOW.x},${LOW.y + 2} ${LOW.x},${LOW.y - 12} ${HIGH.x},${HIGH.y - 12} ${HIGH.x},${HIGH.y + 2}`} />
            </clipPath>
          </defs>

          {/* Truss and landings. */}
          <path
            d={`M4 ${LOW.y}H${LOW.x}L${HIGH.x} ${HIGH.y}H160V${HIGH.y + 8}H${HIGH.x + 4}L${LOW.x + 4} ${LOW.y + 8}H4Z`}
            style={{ fill: "var(--ant-color-fill-tertiary)" }}
          />
          <line x1="0" x2={LOW.x} y1={LOW.y} y2={LOW.y} strokeWidth="1.5" style={{ stroke: "var(--ant-color-text-tertiary)" }} />
          <line x1={HIGH.x} x2="164" y1={HIGH.y} y2={HIGH.y} strokeWidth="1.5" style={{ stroke: "var(--ant-color-text-tertiary)" }} />

          {/* Glass balustrade under the handrail. */}
          <path
            d={`M${LOW.x - 6} ${LOW.y - 2}L${LOW.x - 6} ${LOW.y - 14}L${HIGH.x - 6} ${HIGH.y - 14}L${HIGH.x + 6} ${HIGH.y - 14}L${HIGH.x + 6} ${HIGH.y - 2}Z`}
            style={{ fill: "var(--ios-teal)", opacity: 0.08 }}
          />

          {/* Steps: a staircase slid along the incline, one tread per period. */}
          <g clipPath={`url(#${clip})`}>
            <motion.path
              d={STAIR}
              fill="none"
              strokeWidth="1.5"
              strokeLinejoin="round"
              style={{ stroke: accent, opacity: fault ? 0.7 : 0.85 }}
              initial={{ x: 0, y: 0 }}
              animate={moving ? { x: [0, TREAD * u.dir], y: [0, -RISE * u.dir] } : { x: 0, y: 0 }}
              transition={moving ? { duration: period, repeat: Infinity, ease: "linear" } : { duration: 0.6 }}
            />
          </g>

          {/* Handrail with travelling marks. */}
          <path
            d={`M${LOW.x - 10} ${LOW.y - 14}L${HIGH.x - 6} ${HIGH.y - 14}L${HIGH.x + 8} ${HIGH.y - 14}`}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ stroke: fault ? "var(--ios-orange)" : "var(--ant-color-text-secondary)" }}
          />
          <motion.path
            d={`M${LOW.x - 10} ${LOW.y - 14}L${HIGH.x - 6} ${HIGH.y - 14}L${HIGH.x + 8} ${HIGH.y - 14}`}
            fill="none"
            strokeWidth="1.2"
            strokeDasharray="2 9"
            strokeLinecap="round"
            style={{ stroke: "var(--widget-surface)" }}
            initial={{ strokeDashoffset: 0 }}
            animate={moving ? { strokeDashoffset: [0, -11 * u.dir] } : { strokeDashoffset: 0 }}
            transition={moving ? { duration: period * 1.15, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
          />

          {/* Direction chevrons on the lower landing, or a fault beacon. */}
          {fault ? (
            <motion.circle
              cx="10"
              cy="61"
              r="4"
              style={{ fill: "var(--ios-orange)" }}
              animate={reduce ? undefined : { opacity: [1, 0.25, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
          ) : (
            <motion.path
              d={u.dir > 0 ? "M4 64l6-6 6 6" : "M4 58l6 6 6-6"}
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ stroke: "var(--ios-teal)" }}
              initial={{ opacity: 0, y: u.dir * 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.2, type: "spring", stiffness: 300, damping: 18 }}
            />
          )}
        </motion.svg>
      </AnimatePresence>

      <div className="mt-auto flex items-baseline-last justify-between gap-2">
        <div className="min-w-0 leading-tight whitespace-nowrap">
          <div className="text-[24px] leading-none font-semibold tracking-tight text-heading">
            <AnimatedNumber value={u.speed} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />
            <span className="ml-0.5 text-[12px] font-medium text-tertiary">m/s</span>
          </div>
          <div className={cn("mt-1 flex items-center gap-1 truncate text-[11px]", fault ? "text-ios-orange" : "text-tertiary")}>
            {fault ? (
              <>
                <Warning16Filled className="shrink-0 text-[12px]" />
                <span className="truncate">{u.note}</span>
              </>
            ) : (
              <span className="truncate tabular">
                <AnimatedNumber value={pax[page]} format={{ useGrouping: true }} /> pax/h · {u.route}
              </span>
            )}
          </div>
        </div>
      </div>

    </Widget>
  );
}

/** An escalator profile for the header chip. */
function EscalatorGlyph() {
  return (
    <svg viewBox="0 0 20 20" width="1em" height="1em" aria-hidden>
      <path d="M2 16h4l7-9h5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 12.5l5-6.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
