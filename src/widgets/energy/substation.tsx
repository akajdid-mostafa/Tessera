import { Checkmark12Filled, Flash20Filled, LockClosed12Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

/* Utility switchgear convention: RED = closed / energised, GREEN = open. That is the
 * reverse of process plants, so the legend says it. Lines stay neutral grey when live
 * and fade to a dashed hairline when dead. Operation is select → confirm → travel. */
type Feeder = { id: string; name: string; x: number; closed: boolean; mw: number; restore: number };
const SEED: Feeder[] = [
  { id: "F1", name: "Ridge", x: 45, closed: true, mw: 11.4, restore: 11.4 },
  { id: "F2", name: "Mill Rd", x: 115, closed: true, mw: 8.7, restore: 8.7 },
  { id: "F3", name: "Harbor", x: 185, closed: false, mw: 0, restore: 6.9 },
  { id: "F4", name: "Spare", x: 255, closed: false, mw: 0, restore: 2.4 },
];
const SBO_WINDOW = 10; // seconds a selection stays armed
const TRAVEL_MS = 1400;

type Phase = "select" | "confirm" | "travel" | "done";

const LIVE = "var(--ant-color-text-heading)";
const DEAD = "var(--ant-color-text-tertiary)";

function Breaker({ x, y, closed, travel }: { x: number; y: number; closed: boolean; travel?: boolean }) {
  if (travel) {
    return (
      <motion.rect
        x={x - 6}
        y={y - 6}
        width="12"
        height="12"
        rx="1.5"
        fill="none"
        stroke={LIVE}
        strokeWidth="1.5"
        strokeDasharray="2 2"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      />
    );
  }
  return (
    <rect
      x={x - 6}
      y={y - 6}
      width="12"
      height="12"
      rx="1.5"
      fill={closed ? "var(--ios-red)" : "var(--widget-surface)"}
      stroke={closed ? "var(--ios-red)" : "var(--ios-green)"}
      strokeWidth="2"
    />
  );
}

/** A moving gap pattern over a live conductor; speed follows the load it carries. */
function Flow({ d, mw }: { d: string; mw: number }) {
  if (mw <= 0.05) return null;
  return (
    <motion.path
      d={d}
      stroke="var(--widget-surface)"
      strokeWidth="2.6"
      strokeDasharray="1.5 7"
      fill="none"
      opacity={0.75}
      initial={{ strokeDashoffset: 0 }}
      animate={{ strokeDashoffset: [0, -8.5] }}
      transition={{ duration: Math.max(0.35, 3.2 / mw), repeat: Infinity, ease: "linear" }}
    />
  );
}

/** Energy · large. A live single-line diagram; tap a feeder breaker to select, confirm and operate it. */
export function SubstationWidget({ index }: { index?: number }) {
  const [feeders, setFeeders] = useState(SEED);
  const [acked, setAcked] = useState(false);
  const [tripActive, setTripActive] = useState(true);
  const [sel, setSel] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("select");
  const [left, setLeft] = useState(SBO_WINDOW);
  const timers = useRef<number[]>([]);

  // Live load wander on closed feeders.
  useEffect(() => {
    const t = window.setInterval(() => {
      setFeeders((fs) =>
        fs.map((f) =>
          f.closed ? { ...f, mw: Math.max(0.5, Math.round((f.mw + (f.restore - f.mw) * 0.35 + (Math.random() - 0.5) * 0.5) * 10) / 10) } : f,
        ),
      );
    }, 2500);
    return () => window.clearInterval(t);
  }, []);

  // Select-before-operate window: the selection disarms itself.
  useEffect(() => {
    if (!sel || phase === "travel" || phase === "done") return;
    if (left <= 0) {
      setSel(null);
      return;
    }
    const t = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [sel, phase, left]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const select = (id: string) => {
    if (phase === "travel") return;
    setSel((cur) => (cur === id ? null : id));
    setPhase("select");
    setLeft(SBO_WINDOW);
  };

  const f = feeders.find((x) => x.id === sel) ?? null;
  const blocked = !!f && f.id === "F3" && tripActive && !acked;

  const execute = () => {
    if (!f) return;
    const closing = !f.closed;
    setPhase("travel");
    timers.current.push(
      window.setTimeout(() => {
        setFeeders((fs) =>
          fs.map((x) =>
            x.id === f.id ? { ...x, closed: closing, mw: closing ? Math.round(x.restore * 0.4 * 10) / 10 : 0 } : x,
          ),
        );
        if (closing && f.id === "F3") setTripActive(false);
        setPhase("done");
        timers.current.push(window.setTimeout(() => setSel(null), 1400));
      }, TRAVEL_MS),
    );
  };

  const load = feeders.reduce((s, x) => s + x.mw, 0);
  const unacked = tripActive && !acked;

  return (
    <Widget size="large" index={index} label="Substation single-line diagram">
      <WidgetHeader
        icon={<Flash20Filled />}
        tint="var(--ios-indigo)"
        title="Kestrel 132/33 kV"
        subtitle="Primary substation · Remote"
        extra={
          <div className="text-right leading-tight whitespace-nowrap">
            <div className="text-[11px] text-tertiary">Load</div>
            <div className="text-[15px] font-semibold text-heading">
              <AnimatedNumber value={load} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
              <span className="ml-0.5 text-[11px] font-medium text-tertiary">MW</span>
            </div>
          </div>
        }
      />

      <svg viewBox="0 0 300 178" className="mt-1 w-full" aria-label="Single-line diagram">
        {/* Legend: utility lamp convention */}
        <g fontSize="8" className="fill-tertiary">
          <rect x="2" y="3" width="7" height="7" rx="1" fill="var(--ios-red)" />
          <text x="13" y="9.8">Closed</text>
          <rect x="48" y="3.5" width="6" height="6" rx="1" fill="none" stroke="var(--ios-green)" strokeWidth="1.5" />
          <text x="59" y="9.8">Open</text>
        </g>

        {/* 132 kV incomer, CB 52-1, T1, CB 52-2 */}
        <path d="M150 0 V102" stroke={LIVE} strokeWidth="1.6" fill="none" />
        <Flow d="M150 0 V34" mw={load} />
        <Flow d="M150 73 V102" mw={load} />
        <text x="157" y="8.5" fontSize="8" className="fill-tertiary">
          132 kV · L1
        </text>
        <Breaker x={150} y={22} closed />
        <circle cx="150" cy="46" r="11" fill="var(--widget-surface)" stroke={LIVE} strokeWidth="1.6" />
        <circle cx="150" cy="61" r="11" fill="none" stroke={LIVE} strokeWidth="1.6" />
        <text x="167" y="50" fontSize="8.5" className="fill-secondary" fontWeight="600">
          T1 · 90 MVA
        </text>
        <text x="167" y="61" fontSize="8" className="fill-tertiary tabular">
          Tap 9 · 61 °C
        </text>
        <Breaker x={150} y={86} closed />
        <text x="138" y="25" fontSize="8" textAnchor="end" className="fill-tertiary">
          52-1
        </text>
        <text x="138" y="89" fontSize="8" textAnchor="end" className="fill-tertiary">
          52-2
        </text>

        {/* 33 kV bus */}
        <line x1="22" y1="102" x2="278" y2="102" stroke={LIVE} strokeWidth="4" strokeLinecap="round" />
        <text x="22" y="96" fontSize="8" className="fill-tertiary tabular">
          33 kV bus · 33.2 kV
        </text>

        {/* Feeders */}
        {feeders.map((fd) => {
          const travelling = sel === fd.id && phase === "travel";
          const live = fd.closed;
          const selected = sel === fd.id;
          const tripped = fd.id === "F3" && tripActive;
          return (
            <g key={fd.id}>
              <line x1={fd.x} y1="102" x2={fd.x} y2="114" stroke={LIVE} strokeWidth="1.6" />
              <motion.path
                d={`M${fd.x} 126 V148`}
                strokeWidth="1.6"
                fill="none"
                strokeDasharray={live ? undefined : "2 3"}
                initial={{ stroke: live ? LIVE : DEAD }}
                animate={{ stroke: live ? LIVE : DEAD }}
                transition={{ duration: 0.6 }}
              />
              {live ? <Flow d={`M${fd.x} 126 V148`} mw={fd.mw} /> : null}
              <motion.path
                d={`M${fd.x - 4} 148 L${fd.x + 4} 148 L${fd.x} 154 Z`}
                initial={{ fill: live ? LIVE : DEAD }}
                animate={{ fill: live ? LIVE : DEAD }}
                transition={{ duration: 0.6 }}
              />
              {selected ? (
                <motion.rect
                  x={fd.x - 11}
                  y="109"
                  width="22"
                  height="22"
                  rx="5"
                  fill="none"
                  stroke="var(--ios-blue)"
                  strokeWidth="1.5"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                />
              ) : null}
              <Breaker x={fd.x} y={120} closed={fd.closed} travel={travelling} />
              {tripped ? (
                <motion.g
                  animate={unacked ? { opacity: [1, 0.15, 1] } : { opacity: 1 }}
                  transition={unacked ? { duration: 0.9, repeat: Infinity } : { duration: 0.2 }}
                >
                  <rect
                    x={fd.x + 10}
                    y="113"
                    width="9"
                    height="9"
                    transform={`rotate(45 ${fd.x + 14.5} 117.5)`}
                    fill="var(--ios-red)"
                  />
                  <text x={fd.x + 14.5} y="120.3" fontSize="6.5" fontWeight="700" textAnchor="middle" fill="#fff">
                    1
                  </text>
                </motion.g>
              ) : null}
              <rect
                x={fd.x - 16}
                y="104"
                width="32"
                height="32"
                fill="transparent"
                className="cursor-pointer"
                onClick={() => select(fd.id)}
              >
                <title>{`CB 52-${fd.id} · ${fd.closed ? "Closed" : "Open"}`}</title>
              </rect>
              <text x={fd.x} y="166" fontSize="9" textAnchor="middle" fontWeight="600" className="fill-secondary">
                {fd.id} {fd.name}
              </text>
              <text x={fd.x} y="176.5" fontSize="8.5" textAnchor="middle" className={live ? "fill-tertiary tabular" : "fill-tertiary tabular"}>
                {live ? `${fd.mw.toFixed(1)} MW` : tripped ? "Tripped" : "Open"}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-auto flex flex-col gap-2">
        {/* Alarm line */}
        <AnimatePresence mode="popLayout" initial={false}>
          {tripActive ? (
            <motion.div
              key="alarm"
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
              className={cn(
                "flex h-10 items-center gap-2 rounded-xl px-2.5",
                unacked ? "bg-ios-red/12" : "bg-fill-quaternary",
              )}
            >
              <svg viewBox="0 0 14 14" className="size-3.5 shrink-0" aria-label="Priority 1">
                <rect x="2.5" y="2.5" width="9" height="9" transform="rotate(45 7 7)" fill="var(--ios-red)" />
                <text x="7" y="9.4" fontSize="6.5" fontWeight="700" textAnchor="middle" fill="#fff">
                  1
                </text>
              </svg>
              <div className="min-w-0 flex-1 leading-tight whitespace-nowrap">
                <div className="truncate text-[12px] font-semibold text-heading">F3 Harbor · 51 overcurrent trip</div>
                <div className="truncate text-[11px] text-tertiary tabular">
                  14:02:17 · 6.9 MW lost · {unacked ? "Unacknowledged" : "Acknowledged"}
                </div>
              </div>
              {unacked ? (
                <Button size="small" color="danger" variant="solid" onClick={() => setAcked(true)}>
                  Ack
                </Button>
              ) : (
                <Checkmark12Filled className="text-tertiary" />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="clear"
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex h-10 items-center gap-2 rounded-xl bg-fill-quaternary px-2.5 text-[12px] text-tertiary"
            >
              <Checkmark12Filled /> No active alarms · F3 restored
            </motion.div>
          )}
        </AnimatePresence>

        {/* Command line: select-before-operate */}
        <div className="relative h-11 overflow-hidden rounded-xl bg-fill-tertiary px-2.5">
          <AnimatePresence mode="popLayout" initial={false}>
            {!f ? (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex h-11 items-center justify-between gap-3 text-[11px] whitespace-nowrap"
              >
                <span className="text-tertiary">Tap a feeder breaker to operate</span>
                <span className="text-tertiary tabular">
                  50.01 Hz · PF <span className="font-semibold text-secondary">0.97</span>
                </span>
              </motion.div>
            ) : (
              <motion.div
                key={`${f.id}-${phase}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className="flex h-11 items-center gap-2 whitespace-nowrap"
              >
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-[12px] font-semibold text-heading">
                    {phase === "confirm"
                      ? `${f.closed ? "Open" : "Close"} CB 52-${f.id}?`
                      : phase === "travel"
                        ? `CB 52-${f.id} · TRAVEL`
                        : phase === "done"
                          ? `CB 52-${f.id} · ${f.closed ? "CLOSED" : "OPEN"}`
                          : `CB 52-${f.id} · ${f.closed ? "CLOSED" : "OPEN"}`}
                  </div>
                  <div className={cn("flex items-center gap-1 truncate text-[11px]", blocked ? "text-ios-orange" : "text-tertiary")}>
                    {blocked ? <LockClosed12Filled /> : null}
                    {phase === "travel"
                      ? "Awaiting position feedback…"
                      : phase === "done"
                        ? "Feedback confirmed"
                        : blocked
                          ? "Acknowledge the trip first"
                          : phase === "confirm"
                            ? `Selected · ${left}s to execute`
                            : `Selected · ${left}s · ${f.name}`}
                  </div>
                </div>
                {phase === "select" ? (
                  <>
                    <Button size="small" variant="filled" color="default" onClick={() => setSel(null)}>
                      Cancel
                    </Button>
                    <Button size="small" type="primary" disabled={blocked} onClick={() => setPhase("confirm")}>
                      {f.closed ? "Open" : "Close"}
                    </Button>
                  </>
                ) : phase === "confirm" ? (
                  <>
                    <Button size="small" variant="filled" color="default" onClick={() => setPhase("select")}>
                      Back
                    </Button>
                    <Button size="small" type="primary" onClick={execute}>
                      Execute
                    </Button>
                  </>
                ) : phase === "travel" ? (
                  <motion.span
                    className="size-4 rounded-full border-2 border-fill border-t-heading"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <Checkmark12Filled className="text-heading" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
          {f && (phase === "select" || phase === "confirm") ? (
            <motion.span
              key={`${f.id}-bar`}
              className="absolute bottom-0 left-0 h-0.5 bg-ios-blue"
              initial={{ width: "100%" }}
              animate={{ width: `${(left / SBO_WINDOW) * 100}%` }}
              transition={{ duration: 1, ease: "linear" }}
            />
          ) : null}
        </div>
      </div>
    </Widget>
  );
}
