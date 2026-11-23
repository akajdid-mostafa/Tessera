import { AlertUrgent20Filled, CheckmarkCircle16Filled } from "@fluentui/react-icons";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Col = "avail" | "enroute" | "scene" | "transport";
type Kind = "Medic" | "Engine" | "Ladder";
type Unit = { id: string; who: string; kind: Kind; col: Col; since: number; bg: boolean };
type Incident = { n: number; status: "pending" | "enroute" | "scene" | "clear"; since: number; unit: string | null };
type State = { tick: number; units: Unit[]; inc: Incident };

const COLS: { key: Col; label: string; dot: string }[] = [
  { key: "avail", label: "Available", dot: "bg-ios-green" },
  { key: "enroute", label: "En route", dot: "bg-ios-blue" },
  { key: "scene", label: "On scene", dot: "bg-ios-orange" },
  { key: "transport", label: "Transport", dot: "bg-ios-purple" },
];
/** Seconds (sim ticks) a unit stays in each state before it moves on. */
const DUR: Record<Col, number> = { avail: 16, enroute: 7, scene: 9, transport: 8 };
const TICK_MS = 1000;
const PROCESS_TARGET = 60;

const CALLS = [
  { type: "Cardiac arrest", addr: "41 NW Market St", unit: "M12", km: 1.8, eta: 5 },
  { type: "Fall from height", addr: "7 Shilshole Ave", unit: "M21", km: 2.4, eta: 7 },
  { type: "Kitchen fire, 3rd floor", addr: "112 Ballard Ave", unit: "E6", km: 1.1, eta: 4 },
];

const U = (id: string, who: string, kind: Kind, col: Col, since: number, bg = true): Unit => ({ id, who, kind, col, since, bg });
const INITIAL: State = {
  tick: 0,
  units: [
    U("M12", "f3", "Medic", "avail", -20, false),
    U("M21", "m5", "Medic", "avail", -20, false),
    U("E6", "m8", "Engine", "avail", -20, false),
    U("M9", "f5", "Medic", "avail", -9),
    U("L2", "m1", "Ladder", "avail", -2),
    U("M7", "f7", "Medic", "enroute", -3),
    U("E3", "m6", "Engine", "enroute", 0),
    U("M4", "f2", "Medic", "scene", -4),
    U("M15", "m10", "Medic", "transport", -2),
  ],
  inc: { n: 0, status: "pending", since: -14, unit: null },
};

const nextCol = (u: Unit): Col =>
  u.col === "avail" ? "enroute" : u.col === "enroute" ? "scene" : u.col === "scene" ? (u.kind === "Medic" ? "transport" : "avail") : "avail";
/* A small per-unit offset keeps background units from moving in lockstep. */
const durOf = (u: Unit) => DUR[u.col] + (u.id.charCodeAt(1) % 3);

function step(s: State): State {
  const tick = s.tick + 1;
  const units = s.units.map((u) => {
    // Units held for incidents only move once the dispatcher assigns them.
    if (!u.bg && u.col === "avail") return u;
    return tick - u.since >= durOf(u) ? { ...u, col: nextCol(u), since: tick } : u;
  });
  let inc = s.inc;
  const assigned = units.find((u) => u.id === inc.unit);
  if (inc.status === "enroute" && assigned?.col === "scene") inc = { ...inc, status: "scene", since: tick };
  else if (inc.status === "scene" && tick - inc.since >= 5) inc = { ...inc, status: "clear", since: tick };
  else if (inc.status === "clear" && tick - inc.since >= 5) inc = { n: inc.n + 1, status: "pending", since: tick, unit: null };
  return { tick, units, inc };
}

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.max(0, sec) % 60).padStart(2, "0")}`;

/** Smart city · large. An EMS dispatch board: a P1 call waits with its processing timer while unit chips move between Available, En route, On scene and Transport; assign the closest unit and follow it to the scene. */
export function DispatchBoardWidget({ index }: { index?: number }) {
  const [s, setS] = useState(INITIAL);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => setS(step), TICK_MS);
    return () => window.clearInterval(t);
  }, []);

  const call = CALLS[s.inc.n % CALLS.length];
  const pending = s.inc.status === "pending";
  const waited = s.tick - s.inc.since;
  const overdue = pending && waited > PROCESS_TARGET;
  const closest =
    s.units.find((u) => u.id === call.unit && u.col === "avail") ??
    s.units.find((u) => !u.bg && u.col === "avail") ??
    s.units.find((u) => u.col === "avail");
  const assigned = s.units.find((u) => u.id === s.inc.unit);

  const assign = () => {
    if (!closest) return;
    setS((x) => ({
      ...x,
      units: x.units.map((u) => (u.id === closest.id ? { ...u, col: "enroute", since: x.tick } : u)),
      inc: { ...x.inc, status: "enroute", unit: closest.id, since: x.tick },
    }));
  };

  return (
    <Widget
      size="large"
      index={index}
      label="EMS dispatch board"
      glow={{ mode: "pulse", colors: ["#FF453A", "#FF9F0A", "#FF453A"], blur: 18, duration: 1.4 }}
      glowActive={overdue}
    >
      <WidgetHeader
        icon={<AlertUrgent20Filled />}
        tint="var(--ios-red)"
        title="Dispatch"
        subtitle={`Ballard EMS · ${s.units.length} units`}
        extra={
          <span
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
              pending ? "bg-ios-red/15 text-ios-red" : "bg-fill-tertiary text-secondary",
            )}
          >
            {pending ? (
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-ios-red opacity-70" />
                <span className="relative size-1.5 rounded-full bg-ios-red" />
              </span>
            ) : null}
            {pending ? "1 waiting" : "0 waiting"}
          </span>
        }
      />

      {/* the call */}
      <div className="relative mt-3 h-[94px] shrink-0 overflow-hidden rounded-xl bg-fill-quaternary">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`${s.inc.n}-${s.inc.status === "clear" ? "clear" : "open"}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="absolute inset-0 flex flex-col px-3 py-2.5"
          >
            {s.inc.status === "clear" ? (
              <div className="flex flex-1 items-center justify-center gap-2 text-[13px] text-tertiary">
                <CheckmarkCircle16Filled className="text-ios-green" />
                No calls waiting
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <motion.span
                    className="rounded-[5px] bg-ios-red px-1.5 text-[11px] leading-[18px] font-bold text-white"
                    animate={pending ? { opacity: [1, 0.55, 1] } : { opacity: 1 }}
                    transition={pending ? { repeat: Infinity, duration: 1.2 } : { duration: 0.2 }}
                  >
                    P1
                  </motion.span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-heading">{call.type}</span>
                  <span className={cn("text-[15px] leading-[18px] font-semibold tabular", overdue ? "text-ios-red" : "text-heading")}>
                    {pending ? mmss(waited) : s.inc.status === "scene" ? "On scene" : `ETA ${call.eta} min`}
                  </span>
                </div>
                <div className="mt-1 flex justify-between gap-2 text-[11px] leading-4 text-tertiary whitespace-nowrap">
                  <span className="truncate">{call.addr} · caller on line</span>
                  <span className={cn(overdue && "font-semibold text-ios-red")}>
                    {pending ? (overdue ? "Over 60 s" : "Processing") : `Assigned ${assigned?.id ?? ""}`}
                  </span>
                </div>
                <div className="mt-auto flex items-center gap-2 pt-2">
                  {pending && closest ? (
                    <>
                      <MemojiAvatar who={closest.who} size={22} alt={`${closest.id} crew lead`} />
                      <span className="min-w-0 flex-1 truncate text-[11px] text-secondary tabular">
                        Closest <span className="font-semibold text-heading">{closest.id}</span> · {call.km} km · {call.eta} min
                      </span>
                      <Button size="small" type="primary" danger onClick={assign}>
                        Assign {closest.id}
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-[11px] font-medium text-secondary whitespace-nowrap">
                        {s.inc.status === "scene" ? `${assigned?.id} arrived` : `${assigned?.id} en route`}
                      </span>
                      <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-fill-secondary">
                        <motion.span
                          className={cn("absolute inset-y-0 left-0 rounded-full", s.inc.status === "scene" ? "bg-ios-orange" : "bg-ios-blue")}
                          initial={{ width: "0%" }}
                          animate={{ width: s.inc.status === "scene" ? "100%" : `${Math.min(100, ((s.tick - s.inc.since) / DUR.enroute) * 100)}%` }}
                          transition={{ duration: 0.9, ease: "linear" }}
                        />
                      </span>
                    </>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* the unit board */}
      <LayoutGroup>
        <div className="mt-3 grid min-h-0 flex-1 grid-cols-4 gap-1.5">
          {COLS.map((c, ci) => {
            const list = s.units.filter((u) => u.col === c.key);
            return (
              <div key={c.key} className="flex min-w-0 flex-col gap-1 rounded-lg bg-fill-quaternary p-1">
                <div className="flex items-center gap-1 px-0.5 pt-0.5 text-[10px] font-medium text-tertiary whitespace-nowrap">
                  <span className={cn("size-1.5 shrink-0 rounded-full", c.dot)} />
                  <span className="truncate">{c.label}</span>
                  <AnimatedNumber value={list.length} className="ml-auto font-semibold text-secondary" />
                </div>
                {list.map((u) => (
                  <Tooltip key={u.id} title={`${u.id} · ${u.kind} · ${c.label.toLowerCase()} ${Math.max(1, Math.round((s.tick - u.since) / 2))} min`}>
                    <motion.div
                      layoutId={`unit-${u.id}`}
                      layout
                      className={cn(
                        "relative flex h-6 shrink-0 cursor-default items-center gap-1 overflow-hidden rounded-md pr-1.5 pl-1 transition-colors",
                        u.id === s.inc.unit && s.inc.status !== "clear" ? "bg-ios-red/15" : "bg-[var(--widget-surface)]",
                      )}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.04 }}
                      transition={{
                        layout: { type: "spring", stiffness: 260, damping: 28 },
                        opacity: { delay: s.tick ? 0 : delay + ci * 0.06 },
                        scale: { type: "spring", stiffness: 400, damping: 24, delay: s.tick ? 0 : delay + ci * 0.06 },
                      }}
                    >
                      <MemojiAvatar who={u.who} size={18} alt={`${u.id} crew lead`} />
                      <span className="text-[12px] font-semibold text-heading">{u.id}</span>
                      <span className="ml-auto text-[10px] text-tertiary tabular">{u.kind[0]}</span>
                    </motion.div>
                  </Tooltip>
                ))}
              </div>
            );
          })}
        </div>
      </LayoutGroup>

      <div className="mt-2.5 flex justify-between text-[11px] text-tertiary tabular whitespace-nowrap">
        <span>
          Answered ≤15 s <span className="font-semibold text-secondary">94%</span>
        </span>
        <span>
          90th response <span className="font-semibold text-secondary">8:12</span>
        </span>
      </div>
    </Widget>
  );
}
