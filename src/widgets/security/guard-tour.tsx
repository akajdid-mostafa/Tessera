import { Call16Regular, CallEnd16Regular, PersonWalking20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { mmss } from "./_parts";

const W = 376;
const H = 88;
/** Twenty checkpoints walked clockwise around the building. */
const CP: { x: number; y: number; name: string }[] = [
  { x: 30, y: 10, name: "Main gate" },
  { x: 82, y: 10, name: "Visitor lot" },
  { x: 134, y: 10, name: "North lobby" },
  { x: 186, y: 10, name: "Bike store" },
  { x: 238, y: 10, name: "Canteen door" },
  { x: 290, y: 10, name: "Smoking shelter" },
  { x: 342, y: 10, name: "NE corner" },
  { x: 362, y: 30, name: "Chiller plant" },
  { x: 362, y: 58, name: "Generator yard" },
  { x: 342, y: 78, name: "Loading dock 2" },
  { x: 290, y: 78, name: "Waste compound" },
  { x: 238, y: 78, name: "Sprinkler room" },
  { x: 186, y: 78, name: "South stair" },
  { x: 134, y: 78, name: "Staff car park" },
  { x: 82, y: 78, name: "Fuel store" },
  { x: 30, y: 78, name: "SW corner" },
  { x: 12, y: 58, name: "West fence" },
  { x: 12, y: 30, name: "Comms room" },
  { x: 12, y: 12, name: "Guard house" },
  { x: 30, y: 26, name: "Key safe" },
];
const MISSED = 8;
const SEED_DONE = 14;
const STEP_MS = 4500;
const START_MIN = 60; // 01:00
const EVERY_MIN = 6;
const D = CP.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");
const SEG = CP.slice(1).map((p, i) => Math.hypot(p.x - CP[i].x, p.y - CP[i].y));
const TOTAL = SEG.reduce((s, l) => s + l, 0);
const walked = (n: number) => SEG.slice(0, Math.max(0, n - 1)).reduce((s, l) => s + l, 0) / TOTAL;
const at = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const GUARD = "Ravi Menon";

type Call = { kind: "idle" } | { kind: "ringing" } | { kind: "on"; s: number };

/** Security · medium. A night patrol drawn as its route: the walked path draws in, the guard steps to each checkpoint live, a missed checkpoint pings red, and you can call the guard. */
export function GuardTourWidget({ index }: { index?: number }) {
  const [done, setDone] = useState(SEED_DONE);
  const [probe, setProbe] = useState<number | null>(null);
  const [call, setCall] = useState<Call>({ kind: "idle" });

  useEffect(() => {
    const t = window.setInterval(() => setDone((d) => (d >= CP.length + 1 ? 1 : d + 1)), STEP_MS);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (call.kind === "ringing") {
      const t = window.setTimeout(() => setCall({ kind: "on", s: 0 }), 2200);
      return () => window.clearTimeout(t);
    }
    if (call.kind === "on") {
      const t = window.setTimeout(() => setCall({ kind: "on", s: call.s + 1 }), 1000);
      return () => window.clearTimeout(t);
    }
  }, [call]);

  const complete = done > CP.length;
  const passed = Math.min(done, CP.length);
  const missed = passed > MISSED ? 1 : 0;
  const scanned = passed - missed;
  const compliance = passed ? scanned / passed : 1;
  const here = CP[Math.max(0, passed - 1)];
  const next = complete ? null : CP[passed];
  const delay = 0.3 + (index ?? 0) * 0.06;

  const status = (i: number) => (i < passed ? (i === MISSED ? "missed" : "scanned") : i === passed ? "next" : "todo");

  return (
    <Widget size="medium" index={index} label="Guard tour">
      <WidgetHeader
        icon={<PersonWalking20Filled />}
        tint="var(--ios-indigo)"
        title="Night Patrol B"
        subtitle={complete ? `Tour complete · ${Math.round(compliance * 100)}%` : `${scanned} of ${CP.length} scanned · ${missed} missed`}
        extra={
          <div className="flex items-center gap-1.5">
            <MemojiAvatar who="m4" size={26} alt={GUARD} />
            <motion.button
              type="button"
              layout
              onClick={() => setCall((c) => (c.kind === "idle" ? { kind: "ringing" } : { kind: "idle" }))}
              whileTap={{ scale: 0.92 }}
              className={cn(
                "flex h-[26px] cursor-pointer items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold whitespace-nowrap outline-none transition-colors duration-mid tabular",
                call.kind === "idle" ? "bg-ios-green/15 text-ios-green hover:bg-ios-green/25" : "bg-ios-red text-white",
              )}
            >
              {call.kind === "idle" ? <Call16Regular /> : <CallEnd16Regular />}
              {call.kind === "idle" ? "Call" : call.kind === "ringing" ? "Ringing…" : mmss(call.s)}
            </motion.button>
          </div>
        }
      />

      <div className="relative mt-1.5 h-[88px] w-full">
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full overflow-visible" onMouseLeave={() => setProbe(null)} aria-label="Patrol route">
          <rect x={42} y={22} width={300} height={44} rx={8} className="fill-fill-quaternary" />
          <text x={192} y={47.5} textAnchor="middle" className="fill-tertiary text-[10px]">
            Building A · 3 floors
          </text>

          <path d={D} fill="none" strokeWidth={1.5} strokeDasharray="2 4" strokeLinecap="round" className="stroke-fill" />
          <motion.path
            d={D}
            fill="none"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-ios-indigo/60"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: walked(passed) }}
            transition={{ duration: done === SEED_DONE ? 1.6 : 1.1, ease: "easeInOut", delay: done === SEED_DONE ? delay : 0 }}
          />

          {CP.map((p, i) => {
            const s = status(i);
            return (
              <g key={p.name} onMouseEnter={() => setProbe(i)} className="cursor-default">
                <circle cx={p.x} cy={p.y} r={9} fill="transparent" />
                {s === "missed" ? (
                  <motion.circle
                    cx={p.x}
                    cy={p.y}
                    r={4}
                    className="fill-ios-red/40"
                    animate={{ scale: [1, 2.6], opacity: [0.8, 0] }}
                    style={{ transformBox: "fill-box", transformOrigin: "center" }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                  />
                ) : null}
                {s === "next" ? (
                  <motion.circle
                    cx={p.x}
                    cy={p.y}
                    r={6.5}
                    fill="none"
                    strokeWidth={1.5}
                    className="stroke-ios-indigo"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  />
                ) : null}
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  r={probe === i ? 5 : 4}
                  strokeWidth={1.5}
                  className={cn(
                    "transition-colors duration-mid",
                    s === "missed"
                      ? "fill-ios-red stroke-ios-red"
                      : s === "scanned"
                        ? "fill-secondary stroke-secondary"
                        : "fill-[var(--widget-surface)] stroke-fill",
                  )}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                  transition={{ type: "spring", stiffness: 400, damping: 18, delay: delay + i * 0.03 }}
                />
              </g>
            );
          })}
        </svg>

        {/* The guard, walking from checkpoint to checkpoint */}
        <motion.div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
          initial={false}
          animate={{ left: here.x, top: here.y }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
        >
          <div className="rounded-full ring-[1.5px] ring-ios-indigo">
            <MemojiAvatar who="m4" size={20} alt="" />
          </div>
        </motion.div>
      </div>

      <div className="relative mt-auto flex h-[22px] items-center gap-2 overflow-hidden text-[11px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={probe !== null ? `p${probe}-${status(probe)}` : `n${passed}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="min-w-0 flex-1 truncate text-tertiary tabular"
          >
            {probe !== null ? (
              <>
                <span className="font-semibold text-heading">CP-{probe + 1}</span> {CP[probe].name} ·{" "}
                {status(probe) === "missed" ? (
                  <span className="font-semibold text-ios-red">missed, due {at(START_MIN + probe * EVERY_MIN)}</span>
                ) : status(probe) === "scanned" ? (
                  `scanned ${at(START_MIN + probe * EVERY_MIN)}`
                ) : (
                  `due ${at(START_MIN + probe * EVERY_MIN)}`
                )}
              </>
            ) : next ? (
              <>
                Next <span className="font-semibold text-heading">CP-{passed + 1}</span> {next.name} · due{" "}
                {at(START_MIN + passed * EVERY_MIN)}
              </>
            ) : (
              <>Tour logged · report sent to supervisor</>
            )}
          </motion.div>
        </AnimatePresence>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 font-semibold tabular",
            compliance < 1 ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-tertiary text-secondary",
          )}
        >
          {Math.round(compliance * 100)}% compliance
        </span>
      </div>
    </Widget>
  );
}
