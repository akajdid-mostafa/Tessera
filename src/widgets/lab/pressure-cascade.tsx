import { Gauge20Filled, LockClosed12Regular, LockOpen12Filled, Warning16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { LiveDot } from "./_parts";

type RoomId = "corr" | "gown" | "prep" | "pal" | "mal" | "fill";
type DoorId = "d1" | "d2" | "d3" | "d4" | "d5" | "d6";
type Room = { id: RoomId; name: string; grade: string; x: number; y: number; w: number; h: number; base: number; temp: number; rh: number };
type Door = { id: DoorId; a: RoomId; b: RoomId; x: number; y: number; dir: "v" | "h"; lock?: DoorId };

const ROOMS: Room[] = [
  { id: "prep", name: "Prep", grade: "C", x: 6, y: 6, w: 104, h: 92, base: 30, temp: 20.4, rh: 44 },
  { id: "mal", name: "MAL", grade: "C", x: 116, y: 6, w: 56, h: 92, base: 41, temp: 20.2, rh: 43 },
  { id: "gown", name: "Gowning", grade: "D", x: 6, y: 104, w: 104, h: 60, base: 15, temp: 20.9, rh: 46 },
  { id: "pal", name: "PAL", grade: "B", x: 116, y: 104, w: 56, h: 60, base: 37, temp: 20.1, rh: 42 },
  { id: "fill", name: "Fill Room", grade: "B", x: 178, y: 6, w: 160, h: 158, base: 52, temp: 19.8, rh: 41 },
  { id: "corr", name: "Corridor", grade: "CNC", x: 6, y: 170, w: 332, h: 48, base: 0, temp: 21.6, rh: 48 },
];
const ROOM = Object.fromEntries(ROOMS.map((r) => [r.id, r])) as Record<RoomId, Room>;

/** `a` is the higher-pressure side by design; air flows a → b. */
const DOORS: Door[] = [
  { id: "d1", a: "gown", b: "corr", x: 58, y: 167, dir: "h" },
  { id: "d4", a: "prep", b: "gown", x: 58, y: 101, dir: "h" },
  { id: "d2", a: "pal", b: "gown", x: 113, y: 134, dir: "v", lock: "d3" },
  { id: "d3", a: "fill", b: "pal", x: 175, y: 134, dir: "v", lock: "d2" },
  { id: "d5", a: "mal", b: "prep", x: 113, y: 52, dir: "v", lock: "d6" },
  { id: "d6", a: "fill", b: "mal", x: 175, y: 52, dir: "v", lock: "d5" },
];
const DOOR = Object.fromEntries(DOORS.map((d) => [d.id, d])) as Record<DoorId, Door>;

const DOOR_NAME: Record<DoorId, string> = {
  d1: "Corridor door",
  d2: "PAL outer door",
  d3: "PAL inner door",
  d4: "Prep door",
  d5: "MAL outer door",
  d6: "MAL inner door",
};

const MIN_DP = 10;
const TICK_MS = 800;
/** A door left alone swings shut after this many ticks. */
const HOLD_OPEN = 8;
const CYCLE = 30;

type Sim = { n: number; p: Record<RoomId, number>; open: Record<DoorId, number> };

const START: Sim = {
  n: 0,
  p: Object.fromEntries(ROOMS.map((r) => [r.id, r.base])) as Record<RoomId, number>,
  open: { d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, d6: 0 },
};

function step(s: Sim): Sim {
  const n = s.n + 1;
  const open = { ...s.open };
  (Object.keys(open) as DoorId[]).forEach((k) => (open[k] = Math.max(0, open[k] - 1)));
  // Scheduled traffic: an operator enters Grade B through the PAL, then someone leaves gowning.
  const phase = n % CYCLE;
  if (phase === 6 && !open.d2) open.d3 = HOLD_OPEN;
  if (phase === 21) open.d1 = 5;

  const p = { ...s.p };
  for (const r of ROOMS) {
    if (r.id === "corr") continue;
    let target = r.base;
    for (const d of DOORS) {
      if (!open[d.id] || (d.a !== r.id && d.b !== r.id)) continue;
      const other = d.a === r.id ? d.b : d.a;
      const mean = (s.p[r.id] + s.p[other]) / 2;
      target += (mean - r.base) * 0.85;
    }
    p[r.id] = Math.round((s.p[r.id] + (target - s.p[r.id]) * 0.38 + (Math.random() - 0.5) * 0.5) * 10) / 10;
  }
  return { n, p, open };
}

type LinkState = "ok" | "open" | "low" | "reversed";

/** Lab · large. A cleanroom suite's pressure cascade with airflow arrows at every door: an operator opens the PAL into the fill room and the closed MAL door behind it reverses red, tapping a door opens it while airlock interlocks refuse the second door, and hovering a room or door reads its pressure. */
export function PressureCascadeWidget({ index }: { index?: number }) {
  const [sim, setSim] = useState<Sim>(START);
  const [hover, setHover] = useState<{ kind: "room"; id: RoomId } | { kind: "door"; id: DoorId } | null>(null);
  const [blocked, setBlocked] = useState<{ id: DoorId; k: number } | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const id = window.setInterval(() => setSim(step), TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!blocked) return;
    const t = window.setTimeout(() => setBlocked(null), 2200);
    return () => window.clearTimeout(t);
  }, [blocked]);

  const dp = (d: Door) => sim.p[d.a] - sim.p[d.b];
  const stateOf = (d: Door): LinkState => {
    if (sim.open[d.id]) return "open";
    const v = dp(d);
    return v < 0 ? "reversed" : v < MIN_DP ? "low" : "ok";
  };
  const alarms = DOORS.filter((d) => stateOf(d) === "low" || stateOf(d) === "reversed");

  const toggle = (d: Door) => {
    if (sim.open[d.id]) {
      setSim((s) => ({ ...s, open: { ...s.open, [d.id]: 0 } }));
      return;
    }
    if (d.lock && sim.open[d.lock]) {
      setBlocked({ id: d.id, k: Date.now() });
      return;
    }
    setSim((s) => ({ ...s, open: { ...s.open, [d.id]: HOLD_OPEN } }));
  };

  // Hero: the hovered room or door, else the worst link, else the fill room.
  const focusDoor = hover?.kind === "door" ? DOOR[hover.id] : !hover && alarms.length ? alarms[0] : null;
  const focusRoom = hover?.kind === "room" ? ROOM[hover.id] : ROOM.fill;
  const linkName = (d: Door) => `${ROOM[d.a].name} → ${ROOM[d.b].name}`;
  const heroValue = focusDoor ? dp(focusDoor) : sim.p[focusRoom.id];
  const heroState = focusDoor ? stateOf(focusDoor) : "ok";

  return (
    <Widget size="large" index={index} label="Pressure cascade">
      <WidgetHeader
        icon={<Gauge20Filled />}
        tint="var(--ios-teal)"
        title="Pressure Cascade"
        subtitle="Fill Suite 2 · Δp vs corridor"
        extra={
          <span
            className={cn(
              "flex h-[22px] items-center gap-1.5 rounded-full px-2 text-[11px] font-semibold whitespace-nowrap transition-colors duration-500",
              alarms.length ? "bg-ios-red/15 text-ios-red" : "bg-fill-secondary text-secondary",
            )}
          >
            <LiveDot color={alarms.length ? "var(--ios-red)" : "var(--ios-green)"} ping={alarms.length > 0} />
            {alarms.length ? `${alarms.length} Δp alarm` : "Cascade OK"}
          </span>
        }
      />

      <div className="mt-2 flex h-[56px] items-end justify-between gap-3">
        <div className="min-w-0 leading-none">
          <div className="h-[14px] overflow-hidden text-[11px] font-medium">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={focusDoor ? focusDoor.id : focusRoom.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={cn("truncate", heroState === "low" || heroState === "reversed" ? "text-ios-red" : "text-tertiary")}
              >
                {focusDoor ? `Δp ${linkName(focusDoor)}` : `${focusRoom.name} · Grade ${focusRoom.grade}`}
              </motion.div>
            </AnimatePresence>
          </div>
          <div
            className={cn(
              "mt-1.5 flex items-baseline whitespace-nowrap transition-colors duration-300",
              heroState === "low" || heroState === "reversed" ? "text-ios-red" : heroState === "open" ? "text-ios-orange" : "text-heading",
            )}
          >
            <AnimatedNumber
              value={heroValue}
              format={{ minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: "exceptZero" }}
              className="text-[28px] font-semibold tracking-tight"
            />
            <span className="ml-1 text-[13px] font-medium text-tertiary">Pa</span>
          </div>
        </div>
        <div className="shrink-0 pb-0.5 text-right text-[11px] leading-tight text-tertiary tabular">
          {focusDoor ? (
            <>
              <div>{sim.open[focusDoor.id] ? "Door open" : "Door closed"} · min {MIN_DP} Pa</div>
              <div className={cn("mt-1 font-semibold", heroState === "ok" ? "text-secondary" : heroState === "open" ? "text-ios-orange" : "text-ios-red")}>
                {heroState === "reversed" ? "Flow reversed" : heroState === "low" ? "Below minimum" : heroState === "open" ? "Expected while open" : "Holding"}
              </div>
            </>
          ) : (
            <>
              <div>
                {focusRoom.temp.toFixed(1)} °C · {focusRoom.rh} %RH
              </div>
              <div className="mt-1 font-semibold text-secondary">{focusRoom.id === "corr" ? "Reference" : `Design +${focusRoom.base} Pa`}</div>
            </>
          )}
        </div>
      </div>

      <svg viewBox="0 0 344 224" className="mt-2 min-h-0 w-full flex-1" onMouseLeave={() => setHover(null)} role="img" aria-label="Cleanroom pressure cascade plan">
        {ROOMS.map((r, i) => {
          const on = (hover?.kind === "room" && hover.id === r.id) || (!hover && !alarms.length && r.id === "fill");
          const big = r.w > 100;
          return (
            <motion.g
              key={r.id}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + i * 0.05, type: "spring", stiffness: 260, damping: 24 }}
              style={{ transformBox: "fill-box", transformOrigin: "center", cursor: "default" }}
              onMouseEnter={() => setHover({ kind: "room", id: r.id })}
            >
              <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="7" style={{ fill: "var(--ant-color-fill-tertiary)" }} />
              {on ? (
                <motion.rect
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  x={r.x + 0.75}
                  y={r.y + 0.75}
                  width={r.w - 1.5}
                  height={r.h - 1.5}
                  rx="6.5"
                  fill="none"
                  strokeWidth="1.2"
                  style={{ stroke: "var(--ant-color-text-tertiary)" }}
                />
              ) : null}
              <text x={r.x + 7} y={r.y + 13} fontSize="9.5" fontWeight="500" style={{ fill: "var(--ant-color-text-tertiary)" }}>
                {r.name}
                <tspan dx="4" fontWeight="700" style={{ fill: "var(--ant-color-text-secondary)" }}>
                  {r.grade}
                </tspan>
              </text>
              {r.id === "corr" ? (
                <text x={r.x + r.w - 8} y={r.y + 30} textAnchor="end" fontSize="12" fontWeight="600" style={{ fill: "var(--ant-color-text-secondary)" }}>
                  0 Pa · ref
                </text>
              ) : (
                <text
                  x={r.x + r.w / 2}
                  y={r.id === "fill" ? r.y + 118 : r.y + r.h / 2 + 8}
                  textAnchor="middle"
                  fontSize={big ? 15 : 13}
                  fontWeight="600"
                  style={{ fill: "var(--ant-color-text)", fontVariantNumeric: "tabular-nums" }}
                >
                  +{sim.p[r.id].toFixed(1)}
                </text>
              )}
            </motion.g>
          );
        })}

        {/* Isolator inside the fill room (Grade A), decorative. */}
        <g pointerEvents="none">
          <rect x="204" y="26" width="118" height="54" rx="8" strokeWidth="1.2" strokeDasharray="4 3" style={{ fill: "var(--widget-surface)", fillOpacity: 0.5, stroke: "var(--ant-color-text-tertiary)" }} />
          <text x="263" y="47" textAnchor="middle" fontSize="9.5" style={{ fill: "var(--ant-color-text-tertiary)" }}>
            Isolator · Grade A
          </text>
          <text x="263" y="66" textAnchor="middle" fontSize="12" fontWeight="600" style={{ fill: "var(--ant-color-text-secondary)", fontVariantNumeric: "tabular-nums" }}>
            +{(sim.p.fill + 13.2).toFixed(1)}
          </text>
          <text x="258" y="140" textAnchor="middle" fontSize="9" style={{ fill: "var(--ant-color-text-tertiary)" }}>
            Pa vs corridor
          </text>
        </g>

        {DOORS.map((d, i) => (
          <DoorMark
            key={d.id}
            d={d}
            state={stateOf(d)}
            dp={dp(d)}
            open={sim.open[d.id] > 0}
            shake={blocked?.id === d.id ? blocked.k : 0}
            hovered={hover?.kind === "door" && hover.id === d.id}
            delay={delay + 0.35 + i * 0.05}
            onHover={() => setHover({ kind: "door", id: d.id })}
            onToggle={() => toggle(d)}
          />
        ))}
      </svg>

      <div className="mt-2 flex h-[18px] items-center gap-2 whitespace-nowrap text-[11px] text-tertiary">
        <AnimatePresence mode="popLayout" initial={false}>
          {blocked ? (
            <motion.span
              key="blocked"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-1 font-semibold text-ios-red"
            >
              <Warning16Filled /> Interlocked · {DOOR_NAME[DOOR[blocked.id].lock!]} is open
            </motion.span>
          ) : (
            <motion.span key="locks" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex items-center gap-3">
              {(["d2", "d5"] as DoorId[]).map((id) => {
                const free = !sim.open[id] && !sim.open[DOOR[id].lock!];
                return (
                  <span key={id} className={cn("flex items-center gap-1", free ? "text-tertiary" : "font-medium text-ios-orange")}>
                    {free ? <LockClosed12Regular /> : <LockOpen12Filled />}
                    {id === "d2" ? "PAL" : "MAL"} interlock
                  </span>
                );
              })}
              <span>Tap a door</span>
            </motion.span>
          )}
        </AnimatePresence>
        <span className="ml-auto flex items-center gap-1">
          <LiveDot color="var(--ios-green)" ping />
          Live
        </span>
      </div>
    </Widget>
  );
}

function DoorMark({
  d,
  state,
  dp,
  open,
  shake,
  hovered,
  delay,
  onHover,
  onToggle,
}: {
  d: Door;
  state: LinkState;
  dp: number;
  open: boolean;
  shake: number;
  hovered: boolean;
  delay: number;
  onHover: () => void;
  onToggle: () => void;
}) {
  const color =
    state === "reversed" || state === "low" ? "var(--ios-red)" : state === "open" ? "var(--ios-orange)" : "var(--ant-color-text-tertiary)";
  const v = d.dir === "v";
  // Air flows a → b; for every door here that is leftward (v) or downward (h). Reversed flips it.
  const sign = dp < 0 ? -1 : 1;
  const rot = v ? (sign > 0 ? 180 : 0) : sign > 0 ? 90 : -90;
  const label = v ? { x: d.x, y: d.y + 21 } : { x: d.x + 23, y: d.y + 3.5 };
  const text = Math.abs(dp).toFixed(0);

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.4 }}
      onMouseEnter={onHover}
      onClick={onToggle}
      style={{ cursor: "pointer" }}
    >
      <rect x={d.x - 13} y={d.y - 13} width="26" height="26" fill="transparent" />
      <motion.g key={shake} animate={shake ? { x: [0, -2.5, 2.5, -2, 2, 0] } : undefined} transition={{ duration: 0.4 }}>
        {/* Door opening in the wall. */}
        <rect
          x={v ? d.x - 4 : d.x - 10}
          y={v ? d.y - 10 : d.y - 4}
          width={v ? 8 : 20}
          height={v ? 20 : 8}
          rx="2"
          style={{ fill: "var(--widget-surface)" }}
        />
        {/* Leaf: swings 70° on its hinge when open. */}
        <motion.rect
          x={v ? d.x - 1.25 : d.x - 9}
          y={v ? d.y - 9 : d.y - 1.25}
          width={v ? 2.5 : 18}
          height={v ? 18 : 2.5}
          rx="1.25"
          animate={{ rotate: open ? (v ? -68 : 68) : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          style={{
            transformBox: "fill-box",
            transformOrigin: v ? "50% 0%" : "0% 50%",
            fill: open ? "var(--ios-orange)" : hovered ? "var(--ant-color-text)" : "var(--ant-color-text-secondary)",
          }}
        />
        {/* Airflow chevron. */}
        <g transform={`translate(${d.x} ${d.y}) rotate(${rot})`}>
          <motion.path
            d="M-2.5 -3.5 L1.5 0 L-2.5 3.5"
            fill="none"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ stroke: color }}
            animate={{ x: [-7, 7], opacity: [0, 1, 0] }}
            transition={{ duration: state === "open" ? 0.7 : 1.5, repeat: Infinity, ease: "linear" }}
          />
        </g>
      </motion.g>
      {/* Δp pill. */}
      <rect
        x={label.x - 11}
        y={label.y - 7}
        width="22"
        height="12"
        rx="6"
        style={{
          fill: state === "ok" ? "var(--widget-surface)" : color,
          fillOpacity: state === "ok" ? 0.9 : 0.18,
          stroke: hovered ? "var(--ant-color-text-tertiary)" : "none",
          transition: "fill 0.4s",
        }}
      />
      <text
        x={label.x}
        y={label.y + 2.4}
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        style={{
          fill: state === "ok" ? "var(--ant-color-text-secondary)" : state === "open" ? "var(--ant-color-text)" : "var(--ios-red)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {dp < 0 ? "−" : ""}
        {text}
      </text>
    </motion.g>
  );
}
