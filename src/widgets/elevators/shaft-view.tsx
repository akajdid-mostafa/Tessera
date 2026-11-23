import { Elevator20Filled } from "@fluentui/react-icons";
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from "motion/react";
import { useCallback, useEffect, useId, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const FLOORS = 12;
const TOP = 16;
const ROW = 23;
const X0 = 44;
const SHAFT_W = 76;
const GAP = 8;
const CAR_W = 44;
const CAR_H = 19;
const H = TOP + FLOORS * ROW + 4;
const CAPACITY = 13;

const TEXT = "var(--ant-color-text)";
const MUTED = "var(--ant-color-text-tertiary)";

type Phase = "moving" | "open" | "closing" | "idle" | "insp";
type Status = { floor: number; target: number; dir: -1 | 0 | 1; phase: Phase; load: number };
type CarDef = { id: string; start: number; stops: number[]; oos?: boolean };

const CARS: CarDef[] = [
  { id: "A", start: 1, stops: [7, 12, 4, 1, 10, 1] },
  { id: "B", start: 9, stops: [3, 1, 11, 6, 1] },
  { id: "C", start: 1, stops: [5, 8, 11, 2, 1, 9] },
  { id: "D", start: 6, stops: [], oos: true },
];

const label = (f: number) => (f === 1 ? "L" : String(f));
const rowY = (f: number) => TOP + (FLOORS - f) * ROW;
const carY = (f: number) => rowY(f) + (ROW - CAR_H) / 2;
const shaftX = (i: number) => X0 + i * (SHAFT_W + GAP);

const initialStatus = (c: CarDef): Status =>
  c.oos
    ? { floor: c.start, target: c.start, dir: 0, phase: "insp", load: 0 }
    : { floor: c.start, target: c.start, dir: 0, phase: "idle", load: 0 };

/** Elevators · large. A four-car bank drawn as shafts: cars travel between floors, doors slide open at each stop, hall calls light up, and car D sits hatched in inspection; tap a car to read it. */
export function ShaftViewWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [sel, setSel] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, Status>>(() =>
    Object.fromEntries(CARS.map((c) => [c.id, initialStatus(c)])),
  );
  const [trips, setTrips] = useState(1284);
  const [wait, setWait] = useState(18);

  const report = useCallback((id: string, s: Status) => {
    setStatus((p) => ({ ...p, [id]: s }));
    if (s.phase === "open") setTrips((t) => t + 1);
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => setWait((w) => Math.min(26, Math.max(14, w + Math.round((Math.random() - 0.5) * 4)))), 4200);
    return () => window.clearInterval(t);
  }, []);

  // Hall calls: every floor a moving car is heading for, lit in its direction.
  const calls = new Map<number, -1 | 1>();
  Object.values(status).forEach((s) => {
    if (s.phase === "moving" && s.dir !== 0) calls.set(s.target, s.dir);
  });

  return (
    <Widget size="large" index={index} label="Elevator shaft view">
      <WidgetHeader
        icon={<Elevator20Filled />}
        tint="var(--ios-blue)"
        title="Harbor Tower · Bank A"
        subtitle="4 cars · L–12 · Up-peak"
        extra={
          <div className="text-right leading-tight">
            <div className="text-[11px] text-tertiary">Avg wait</div>
            <div className="text-[17px] font-semibold text-heading">
              <AnimatedNumber value={wait} />
              <span className="ml-0.5 text-[11px] font-medium text-tertiary">s</span>
            </div>
          </div>
        }
      />

      <svg viewBox={`0 0 376 ${H}`} className="mt-2 w-full shrink-0" style={{ height: H }} onMouseLeave={() => setSel(null)}>
        <defs>
          <pattern id="sv-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" strokeWidth="2" style={{ stroke: "var(--ios-orange)", opacity: 0.22 }} />
          </pattern>
        </defs>

        {/* Floor labels, hall lanterns and floor lines. */}
        {Array.from({ length: FLOORS }, (_, i) => {
          const f = i + 1;
          const y = rowY(f);
          const call = calls.get(f);
          return (
            <g key={f}>
              <text x="16" y={y + ROW / 2 + 3.5} textAnchor="end" fontSize="10" style={{ fill: MUTED, fontVariantNumeric: "tabular-nums" }}>
                {label(f)}
              </text>
              <motion.path
                d={call === -1 ? `M27 ${y + 9}h8l-4 6z` : `M27 ${y + 15}h8l-4-6z`}
                animate={{ opacity: call ? 1 : 0.18 }}
                transition={{ duration: 0.25 }}
                style={{ fill: call ? "var(--ios-blue)" : MUTED }}
              />
              {f > 1 ? <line x1="40" x2="372" y1={y + ROW} y2={y + ROW} strokeWidth="1" strokeDasharray="1 3" style={{ stroke: "var(--ant-color-split)" }} /> : null}
            </g>
          );
        })}

        {CARS.map((c, i) => (
          <Car
            key={c.id}
            def={c}
            x={shaftX(i)}
            order={i}
            status={status[c.id]}
            selected={sel === c.id}
            dim={sel !== null && sel !== c.id}
            onSelect={() => setSel(c.id)}
            onToggle={() => setSel((s) => (s === c.id ? null : c.id))}
            report={report}
            reduce={!!reduce}
            delay={delay}
          />
        ))}
      </svg>

      <div className="mt-auto flex h-[34px] items-center gap-2 rounded-xl bg-fill-quaternary px-2.5 text-[12px] whitespace-nowrap">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={sel ?? "all"}
            initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="flex min-w-0 flex-1 items-center gap-2"
          >
            <Readout sel={sel} status={status} trips={trips} />
          </motion.div>
        </AnimatePresence>
      </div>
    </Widget>
  );
}

function Readout({ sel, status, trips }: { sel: string | null; status: Record<string, Status>; trips: number }) {
  if (sel === null) {
    return (
      <>
        <span className="shrink-0 font-semibold text-heading">3 of 4 in service</span>
        <span className="min-w-0 flex-1 truncate text-[11px] text-tertiary tabular">
          <AnimatedNumber value={trips} /> trips · 14.6 kWh regen
        </span>
        <span className="shrink-0 rounded-full bg-ios-orange/15 px-2 py-0.5 text-[11px] font-semibold text-ios-orange">D inspection</span>
      </>
    );
  }
  const s = status[sel];
  if (s.phase === "insp") {
    return (
      <>
        <span className="shrink-0 font-semibold text-heading">Car D</span>
        <MemojiAvatar who="m6" size={20} />
        <span className="min-w-0 flex-1 truncate text-[11px] text-tertiary">Ravi · door operator service at 6</span>
        <span className="shrink-0 rounded-full bg-ios-orange/15 px-2 py-0.5 text-[11px] font-semibold text-ios-orange">Inspection</span>
      </>
    );
  }
  const what =
    s.phase === "moving"
      ? `${s.dir > 0 ? "▲" : "▼"} to ${label(s.target)}`
      : s.phase === "open"
        ? `Doors open at ${label(s.floor)}`
        : s.phase === "closing"
          ? `Doors closing at ${label(s.floor)}`
          : `Idle at ${label(s.floor)}`;
  return (
    <>
      <span className="shrink-0 font-semibold text-heading">
        Car {sel} · {what}
      </span>
      <span className="min-w-0 flex-1 truncate text-[11px] text-tertiary tabular">
        {s.load}/{CAPACITY} pax · {Math.round((s.load / CAPACITY) * 100)}% load
      </span>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
          s.phase === "moving" ? "bg-ios-blue/15 text-ios-blue" : "bg-fill-secondary text-secondary",
        )}
      >
        {s.phase === "moving" ? "Running" : s.phase === "idle" ? "Idle" : "Doors"}
      </span>
    </>
  );
}

function Car({
  def,
  x,
  order,
  status,
  selected,
  dim,
  onSelect,
  onToggle,
  report,
  reduce,
  delay,
}: {
  def: CarDef;
  x: number;
  order: number;
  status: Status;
  selected: boolean;
  dim: boolean;
  onSelect: () => void;
  onToggle: () => void;
  report: (id: string, s: Status) => void;
  reduce: boolean;
  delay: number;
}) {
  const clip = `sv-car-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const y = useMotionValue(carY(def.start));
  const door = useMotionValue(0);
  const leftX = useTransform(door, [0, 1], [0, -CAR_W / 2 + 3]);
  const rightX = useTransform(door, [0, 1], [0, CAR_W / 2 - 3]);
  const light = useTransform(door, [0, 1], [0, 0.4]);
  const [floor, setFloor] = useState(def.start);
  const [entered, setEntered] = useState(false);

  useMotionValueEvent(y, "change", (v) => {
    const f = Math.round(FLOORS - (v - TOP - (ROW - CAR_H) / 2) / ROW);
    setFloor((p) => (p === f ? p : f));
  });

  useEffect(() => {
    if (def.oos) return;
    let cancelled = false;
    let timer = 0;
    let stop: (() => void) | null = null;
    const wait = (ms: number) =>
      new Promise<void>((r) => {
        timer = window.setTimeout(r, ms);
      });
    const run = async () => {
      let cur = def.start;
      let i = 0;
      let load = 3 + order * 2;
      await wait(delay * 1000 + 500 + order * 450);
      while (!cancelled) {
        const target = def.stops[i % def.stops.length];
        i++;
        const dist = Math.abs(target - cur);
        const dir = (Math.sign(target - cur) || 0) as -1 | 0 | 1;
        report(def.id, { floor: cur, target, dir, phase: "moving", load });
        const move = animate(y, carY(target), { duration: reduce ? 0 : 0.9 + dist * 0.42, ease: [0.45, 0, 0.3, 1] });
        stop = () => move.stop();
        await move;
        if (cancelled) return;
        cur = target;
        load = target === 1 ? Math.round(6 + Math.random() * 7) : Math.max(0, load + Math.round((Math.random() - 0.65) * 6));
        report(def.id, { floor: cur, target, dir: 0, phase: "open", load });
        const open = animate(door, 1, { duration: reduce ? 0 : 0.7, ease: "easeOut" });
        stop = () => open.stop();
        await open;
        await wait(2300);
        if (cancelled) return;
        report(def.id, { floor: cur, target, dir: 0, phase: "closing", load });
        const close = animate(door, 0, { duration: reduce ? 0 : 0.8, ease: "easeInOut" });
        stop = () => close.stop();
        await close;
        await wait(450);
      }
    };
    run();
    return () => {
      cancelled = true;
      stop?.();
      window.clearTimeout(timer);
    };
  }, [def, order, delay, reduce, report, y, door]);

  const cx = x + SHAFT_W / 2;
  const oos = !!def.oos;
  const stroke = selected ? "var(--ios-blue)" : oos ? "var(--ios-orange)" : TEXT;
  const arrow = status.phase === "moving" ? (status.dir > 0 ? " ▲" : " ▼") : "";

  return (
    <motion.g
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: dim ? 0.4 : 1, y: 0 }}
      transition={{ delay: entered ? 0 : delay + order * 0.08, duration: entered ? 0.2 : 0.35 }}
      onAnimationComplete={() => setEntered(true)}
      onMouseEnter={onSelect}
      onClick={onToggle}
      style={{ cursor: "pointer" }}
    >
      <rect x={x} y={TOP} width={SHAFT_W} height={FLOORS * ROW} rx="6" style={{ fill: oos ? "url(#sv-hatch)" : "var(--ant-color-fill-quaternary)" }} />
      {selected ? <rect x={x} y={TOP} width={SHAFT_W} height={FLOORS * ROW} rx="6" fill="none" strokeWidth="1.5" style={{ stroke: "var(--ios-blue)", opacity: 0.5 }} /> : null}
      <text
        x={cx}
        y="10"
        textAnchor="middle"
        fontSize="10"
        fontWeight="600"
        className={oos ? "text-ios-orange" : undefined}
        style={{ fill: oos ? "currentColor" : TEXT, fontVariantNumeric: "tabular-nums" }}
      >
        {oos ? "D · INSP" : `${def.id} · ${label(floor)}${arrow}`}
      </text>

      {/* Hoist rope from the machine room to the car top. */}
      <motion.line x1={cx} x2={cx} y1={TOP + 2} y2={y}strokeWidth="1" style={{ stroke: MUTED, opacity: 0.6 }} />

      <motion.g style={{ y }}>
        <defs>
          <clipPath id={clip}>
            <rect x={cx - CAR_W / 2} y="0" width={CAR_W} height={CAR_H} rx="3" />
          </clipPath>
        </defs>
        <rect x={cx - CAR_W / 2} y="0" width={CAR_W} height={CAR_H} rx="3" style={{ fill: "var(--widget-surface)" }} />
        <motion.rect x={cx - CAR_W / 2} y="0" width={CAR_W} height={CAR_H} rx="3" style={{ fill: "var(--ios-yellow)", opacity: light }} />
        <g clipPath={`url(#${clip})`}>
          <motion.rect
            x={cx - CAR_W / 2}
            y="0"
            width={CAR_W / 2}
            height={CAR_H}
            style={{ x: leftX, fill: selected ? "var(--ios-blue)" : "var(--ant-color-fill)", opacity: selected ? 0.55 : 1 }}
          />
          <motion.rect
            x={cx}
            y="0"
            width={CAR_W / 2}
            height={CAR_H}
            style={{ x: rightX, fill: selected ? "var(--ios-blue)" : "var(--ant-color-fill)", opacity: selected ? 0.55 : 1 }}
          />
          <motion.line x1={cx - 0.5} x2={cx - 0.5} y1="2" y2={CAR_H - 2} strokeWidth="1" style={{ x: leftX, stroke: MUTED }} />
        </g>
        <rect x={cx - CAR_W / 2} y="0" width={CAR_W} height={CAR_H} rx="3" fill="none" strokeWidth="1.25" style={{ stroke }} />
        {oos ? (
          <motion.circle
            cx={cx + CAR_W / 2 + 6}
            cy={CAR_H / 2}
            r="3"
            style={{ fill: "var(--ios-orange)" }}
            animate={reduce ? undefined : { opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : null}
      </motion.g>
    </motion.g>
  );
}
