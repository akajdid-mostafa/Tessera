import {
  Home20Filled,
  MoviesAndTv20Filled,
  PersonArrowRight20Filled,
  Warning16Filled,
  WeatherMoon20Filled,
  WeatherSunnyLow20Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ComponentType, useId, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type RoomId = "bedroom" | "nursery" | "bath" | "entry" | "living" | "kitchen";
type Person = "maya" | "dan" | "leo";
type SceneId = "morning" | "leave" | "movie" | "night";
type HomeState = {
  lights: Record<RoomId, number>;
  /** 0 closed, 1 open. */
  blinds: number;
  fan: boolean;
  locked: boolean;
  people: Record<Person, RoomId | null>;
};

const W = 376;
const H = 252;

const ROOMS: { id: RoomId; name: string; x: number; y: number; w: number; h: number; light: [number, number, number]; temp: number }[] = [
  { id: "bedroom", name: "Bedroom", x: 3, y: 3, w: 133, h: 115, light: [96, 80, 80], temp: 20.4 },
  { id: "nursery", name: "Nursery", x: 136, y: 3, w: 104, h: 115, light: [188, 62, 62], temp: 22.1 },
  { id: "bath", name: "Bath", x: 240, y: 3, w: 133, h: 77, light: [290, 52, 56], temp: 23.0 },
  { id: "entry", name: "Entry", x: 240, y: 80, w: 133, h: 38, light: [262, 108, 34], temp: 20.8 },
  { id: "living", name: "Living Room", x: 3, y: 118, w: 221, h: 131, light: [112, 180, 104], temp: 21.8 },
  { id: "kitchen", name: "Kitchen", x: 224, y: 118, w: 149, h: 131, light: [292, 182, 84], temp: 18.9 },
];

const PEOPLE: { id: Person; name: string; who: string }[] = [
  { id: "maya", name: "Maya", who: "f3" },
  { id: "dan", name: "Dan", who: "m8" },
  { id: "leo", name: "Leo", who: "m1" },
];

/** Where people stand in each room, in order of arrival. */
const SPOTS: Record<RoomId, [number, number][]> = {
  bedroom: [[34, 66], [58, 66], [110, 102]],
  nursery: [[214, 86], [160, 92], [188, 100]],
  bath: [[262, 64], [318, 62], [342, 62]],
  entry: [[284, 101], [308, 101], [332, 101]],
  living: [[60, 196], [90, 196], [120, 196]],
  kitchen: [[256, 152], [312, 222], [262, 222]],
};

const EVENING: HomeState = {
  lights: { bedroom: 0, nursery: 30, bath: 0, entry: 40, living: 80, kitchen: 100 },
  blinds: 0.7,
  fan: false,
  locked: false,
  people: { maya: "living", dan: "kitchen", leo: "nursery" },
};

const SCENES: { id: SceneId; name: string; Icon: ComponentType<{ className?: string }>; tint: string; ink: string; state: HomeState }[] = [
  {
    id: "morning",
    name: "Morning",
    Icon: WeatherSunnyLow20Filled,
    tint: "var(--ios-orange)",
    ink: "text-black",
    state: {
      lights: { bedroom: 40, nursery: 0, bath: 100, entry: 0, living: 60, kitchen: 100 },
      blinds: 1,
      fan: false,
      locked: true,
      people: { maya: "kitchen", dan: "bath", leo: "living" },
    },
  },
  {
    id: "leave",
    name: "Leave",
    Icon: PersonArrowRight20Filled,
    tint: "var(--ios-blue)",
    ink: "text-white",
    state: {
      lights: { bedroom: 0, nursery: 0, bath: 0, entry: 0, living: 0, kitchen: 0 },
      blinds: 0.3,
      fan: false,
      locked: true,
      people: { maya: null, dan: null, leo: null },
    },
  },
  {
    id: "movie",
    name: "Movie",
    Icon: MoviesAndTv20Filled,
    tint: "var(--ios-purple)",
    ink: "text-white",
    state: {
      lights: { bedroom: 0, nursery: 0, bath: 0, entry: 0, living: 12, kitchen: 0 },
      blinds: 0,
      fan: false,
      locked: true,
      people: { maya: "living", dan: "living", leo: "living" },
    },
  },
  {
    id: "night",
    name: "Night",
    Icon: WeatherMoon20Filled,
    tint: "var(--ios-indigo)",
    ink: "text-white",
    state: {
      lights: { bedroom: 0, nursery: 8, bath: 0, entry: 0, living: 0, kitchen: 0 },
      blinds: 0,
      fan: true,
      locked: true,
      people: { maya: "bedroom", dan: "bedroom", leo: "nursery" },
    },
  },
];

const WALL = "var(--ant-color-text-tertiary)";
const FURN = "var(--ant-color-text-tertiary)";

/** Wall runs with door and window gaps left open. */
const WALLS = [
  "M3 3H373V86M373 112V160M373 208V249H170M40 249H3V3",
  "M3 118H100M126 118H190M214 118H250M300 118H373",
  "M136 3V118M240 3V118M224 118V150M224 215V249",
  "M240 80H330M356 80H373",
];

/** Smart home · large. A floor plan where room lights glow, blinds tilt, the bedroom fan spins and the family's memoji move between rooms; tap a room to switch its light, run a scene to restage the house, and the open kitchen window keeps flagging. */
export function FloorPlanWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [state, setState] = useState<HomeState>(EVENING);
  const [scene, setScene] = useState<SceneId | null>(null);
  const [hover, setHover] = useState<RoomId | null>(null);
  /** What last changed the house, so the entrance waits but a tap answers at once. */
  const [cause, setCause] = useState<"enter" | "scene" | "tap">("enter");
  const [memory, setMemory] = useState<Record<RoomId, number>>(EVENING.lights);

  const home = PEOPLE.filter((p) => state.people[p.id]).length;
  const lit = Object.values(state.lights).filter((v) => v > 0).length;

  // People placed in arrival order so two in one room never stack.
  const placed = (() => {
    const used: Partial<Record<RoomId, number>> = {};
    return PEOPLE.map((p) => {
      const r = state.people[p.id];
      if (!r) return { ...p, room: null, pos: null as [number, number] | null };
      const n = used[r] ?? 0;
      used[r] = n + 1;
      return { ...p, room: r, pos: SPOTS[r][n] };
    });
  })();
  /** Anyone away walks out through the front door. */
  const DOOR_OUT: [number, number] = [350, 99];

  const toggleRoom = (id: RoomId) => {
    setScene(null);
    setCause("tap");
    const cur = state.lights[id];
    if (cur > 0) setMemory((m) => ({ ...m, [id]: cur }));
    setState((s) => ({ ...s, lights: { ...s.lights, [id]: cur > 0 ? 0 : memory[id] || 80 } }));
  };

  const room = hover ? ROOMS.find((r) => r.id === hover)! : null;
  const inRoom = room ? placed.filter((p) => p.room === room.id).map((p) => p.name) : [];

  return (
    <Widget size="large" index={index} label="Home floor plan">
      <WidgetHeader
        icon={<Home20Filled />}
        tint="var(--ios-orange)"
        title="Maple House"
        subtitle={home ? `${home} people home · 21.4° inside` : "Away · everyone out"}
        extra={
          <span className="mt-0.5 flex shrink-0 items-center gap-1 rounded-full bg-fill-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary tabular">
            <span className="size-1.5 rounded-full bg-ios-yellow" />
            <AnimatedNumber value={lit} /> lights on
          </span>
        }
      />

      <div className="relative mt-2 shrink-0" style={{ height: H }} onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full">
          <defs>
            <radialGradient id={`${uid}-glow`}>
              <stop offset="0%" stopColor="#FFD60A" stopOpacity="0.6" />
              <stop offset="55%" stopColor="#FFB340" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#FFB340" stopOpacity="0" />
            </radialGradient>
            {ROOMS.map((r) => (
              <clipPath key={r.id} id={`${uid}-${r.id}`}>
                <rect x={r.x} y={r.y} width={r.w} height={r.h} />
              </clipPath>
            ))}
          </defs>

          {/* Floors and light pools. */}
          {ROOMS.map((r, i) => {
            const level = state.lights[r.id];
            const order = ROOMS.length - i;
            return (
              <g key={r.id}>
                <motion.rect
                  x={r.x}
                  y={r.y}
                  width={r.w}
                  height={r.h}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: delay + i * 0.05, duration: 0.4 }}
                  style={{ fill: hover === r.id ? "var(--ant-color-fill-tertiary)" : "var(--ant-color-fill-quaternary)", transition: "fill 160ms" }}
                />
                <g clipPath={`url(#${uid}-${r.id})`}>
                  <motion.circle
                    cx={r.light[0]}
                    cy={r.light[1]}
                    r={r.light[2]}
                    fill={`url(#${uid}-glow)`}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: level > 0 ? 0.35 + (level / 100) * 0.65 : 0, scale: level > 0 ? 0.75 + (level / 100) * 0.35 : 0.6 }}
                    transition={{ type: "spring", stiffness: 90, damping: 18, delay: cause === "scene" ? order * 0.09 : cause === "tap" ? 0 : delay + 0.4 }}
                    style={{ transformBox: "fill-box", transformOrigin: "center" }}
                  />
                </g>
              </g>
            );
          })}

          <Furniture />

          {/* Living room blinds on the south window: slats stand open or close flat. */}
          <line x1="40" x2="170" y1="249" y2="249" strokeWidth="3" style={{ stroke: "var(--ios-teal)", opacity: 0.45 }} />
          {Array.from({ length: 13 }, (_, i) => (
            <motion.rect
              key={i}
              x={42 + i * 10}
              y="241"
              width="8"
              height="7"
              rx="1"
              initial={false}
              animate={{ scaleY: 1 - state.blinds * 0.8 }}
              transition={{ type: "spring", stiffness: 160, damping: 18, delay: i * 0.025 }}
              style={{ fill: "var(--ant-color-text-secondary)", opacity: 0.55, originY: 1 }}
            />
          ))}

          {/* Windows: nursery and bedroom glazing, the kitchen casement swung open. */}
          <line x1="160" x2="215" y1="3" y2="3" strokeWidth="3" style={{ stroke: "var(--ios-teal)", opacity: 0.45 }} />
          <line x1="30" x2="100" y1="3" y2="3" strokeWidth="3" style={{ stroke: "var(--ios-teal)", opacity: 0.45 }} />
          <path d="M373 160L352 172M373 208L352 196" strokeWidth="2" strokeLinecap="round" style={{ stroke: "var(--ios-orange)" }} />
          <path d="M352 172A24 24 0 0 1 373 184M352 196A24 24 0 0 0 373 184" fill="none" strokeWidth="1" strokeDasharray="2 2" style={{ stroke: "var(--ios-orange)" }} />
          <motion.circle
            cx="362"
            cy="184"
            r="4"
            style={{ fill: "var(--ios-orange)" }}
            animate={reduce ? undefined : { opacity: [1, 0.35, 1], scale: [1, 1.25, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Walls draw themselves in. */}
          {WALLS.map((d, i) => (
            <motion.path
              key={d}
              d={d}
              fill="none"
              strokeWidth={i === 0 ? 3 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: delay + i * 0.08, duration: 0.9, ease: "easeInOut" }}
              style={{ stroke: WALL }}
            />
          ))}

          {/* Front door with its lock. */}
          <path d="M373 86A26 26 0 0 0 350 99" fill="none" strokeWidth="1" strokeDasharray="2 2" style={{ stroke: WALL }} />
          <line x1="373" x2="373" y1="86" y2="112" strokeWidth="1.5" style={{ stroke: WALL, opacity: 0.6 }} />
          <motion.g
            initial={{ scale: 1 }}
            animate={{ scale: [1.3, 1] }}
            key={String(state.locked)}
            transition={{ type: "spring", stiffness: 400, damping: 14 }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          >
            <circle cx="356" cy="99" r="8" style={{ fill: state.locked ? "var(--ios-green)" : "var(--ios-orange)" }} />
            <rect x="352.5" y="98" width="7" height="5.5" rx="1" fill="#000" />
            <path
              d={state.locked ? "M354 98v-2a2 2 0 0 1 4 0v2" : "M354 98v-2a2 2 0 0 1 4 0"}
              fill="none"
              stroke="#000"
              strokeWidth="1.3"
              transform={state.locked ? undefined : "translate(-1.5 -1)"}
            />
          </motion.g>

          {/* Bedroom ceiling fan. */}
          <g transform="translate(108 30)">
            <circle r="13" fill="none" strokeWidth="1" style={{ stroke: FURN, opacity: 0.35 }} />
            <g
              className={state.fan && !reduce ? "animate-spin" : undefined}
              style={{ animationDuration: "1.1s", transformBox: "fill-box", transformOrigin: "center" }}
            >
              {[0, 90, 180, 270].map((a) => (
                <path key={a} d="M0 0C1.5-5 6-9.5 9.5-8 10.5-4 5.5-1 0 0Z" transform={`rotate(${a})`} style={{ fill: state.fan ? "var(--ios-teal)" : FURN, opacity: state.fan ? 0.9 : 0.5 }} />
              ))}
            </g>
            <circle r="2" style={{ fill: "var(--widget-surface)" }} />
          </g>

          {/* Room names and light switches. */}
          {ROOMS.map((r) => {
            const on = state.lights[r.id] > 0;
            return (
              <g key={r.id} pointerEvents="none">
                <text x={r.x + 7} y={r.y + 14} fontSize="10" fontWeight="600" style={{ fill: hover === r.id ? "var(--ant-color-text)" : "var(--ant-color-text-secondary)" }}>
                  {r.name}
                </text>
                <motion.circle
                  cx={r.light[0]}
                  cy={r.light[1]}
                  r="3.5"
                  animate={{ scale: on ? [1.6, 1] : 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  strokeWidth="1.2"
                  style={{ fill: on ? "#FFD60A" : "var(--widget-surface)", stroke: on ? "#FFB340" : FURN, transformBox: "fill-box", transformOrigin: "center" }}
                />
              </g>
            );
          })}

          {/* Hit areas. */}
          {ROOMS.map((r) => (
            <rect
              key={r.id}
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              fill="transparent"
              onMouseEnter={() => setHover(r.id)}
              onClick={() => toggleRoom(r.id)}
              style={{ cursor: "pointer" }}
            />
          ))}
        </svg>

        {/* The family, as memoji, walking between rooms. */}
        {placed.map((p, i) => {
          const pos = p.pos ?? DOOR_OUT;
          return (
            <motion.div
              key={p.id}
              className="pointer-events-none absolute"
              initial={{ left: pos[0] - 12, top: pos[1] - 12, opacity: 0, scale: 0.5 }}
              animate={{ left: pos[0] - 12, top: pos[1] - 12, opacity: p.pos ? 1 : 0, scale: p.pos ? 1 : 0.5 }}
              transition={{ type: "spring", stiffness: 70, damping: 16, delay: cause === "enter" ? delay + 0.8 + i * 0.1 : 0.15 + i * 0.12 }}
            >
              <MemojiAvatar who={p.who} size={24} className="shadow-sm ring-[1.5px] ring-[var(--widget-surface)]" />
            </motion.div>
          );
        })}
      </div>

      <div className="mt-1.5 flex h-5 items-center gap-1.5 text-[12px] whitespace-nowrap">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={hover ?? "alert"}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.18 }}
            className="flex min-w-0 flex-1 items-center gap-1.5"
          >
            {room ? (
              <>
                <span className="shrink-0 font-semibold text-heading">{room.name}</span>
                <span className="min-w-0 flex-1 truncate text-[11px] text-tertiary tabular">
                  {room.temp.toFixed(1)}° · {state.lights[room.id] ? `light ${state.lights[room.id]}%` : "light off"}
                  {inRoom.length ? ` · ${inRoom.join(", ")}` : ""}
                </span>
                <span className="shrink-0 text-[11px] text-tertiary">Tap to switch</span>
              </>
            ) : (
              <>
                <Warning16Filled className="shrink-0 text-[13px] text-ios-orange" />
                <span className="shrink-0 font-semibold text-ios-orange">Kitchen window open</span>
                <span className="min-w-0 flex-1 truncate text-[11px] text-tertiary">18.9° · heating paused in kitchen</span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-auto grid grid-cols-4 gap-1.5">
        {SCENES.map((s, i) => {
          const active = scene === s.id;
          return (
            <motion.button
              key={s.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setScene(s.id);
                setCause("scene");
                setState(s.state);
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.5 + i * 0.05, type: "spring", stiffness: 340, damping: 24 }}
              whileTap={reduce ? undefined : { scale: 0.93 }}
              className={cn(
                "flex h-[42px] min-w-0 cursor-pointer items-center gap-1.5 rounded-[14px] px-1.5 text-left outline-none transition-[background-color,box-shadow] duration-300",
                active ? "bg-white shadow-[0_2px_10px_rgba(0,0,0,0.12)] ring-1 ring-black/5" : "bg-fill-tertiary hover:bg-fill-secondary",
              )}
            >
              <span
                className={cn("grid size-[22px] shrink-0 place-items-center rounded-full text-[13px] transition-colors", active ? s.ink : "text-secondary")}
                style={{ background: active ? s.tint : "var(--ant-color-fill-secondary)" }}
              >
                <s.Icon />
              </span>
              <span className={cn("truncate text-[11px] font-semibold", active ? "text-black" : "text-heading")}>{s.name}</span>
            </motion.button>
          );
        })}
      </div>
    </Widget>
  );
}

/** Faint furniture so each room reads at a glance. */
function Furniture() {
  const s = { stroke: FURN, opacity: 0.5 };
  return (
    <g fill="none" strokeWidth="1" style={s} pointerEvents="none">
      {/* Bedroom: bed with pillows, nightstand. */}
      <rect x="18" y="34" width="58" height="72" rx="4" />
      <rect x="23" y="38" width="22" height="10" rx="3" />
      <rect x="49" y="38" width="22" height="10" rx="3" />
      <rect x="80" y="36" width="12" height="12" rx="2" />
      {/* Nursery: crib and a rocking chair. */}
      <rect x="148" y="24" width="50" height="30" rx="3" />
      <path d="M156 24v30M164 24v30M172 24v30M180 24v30M188 24v30" />
      <circle cx="218" cy="56" r="9" />
      {/* Bath: tub and basin. */}
      <rect x="300" y="12" width="64" height="30" rx="10" />
      <rect x="252" y="24" width="20" height="16" rx="6" />
      {/* Living: TV wall, sofa, coffee table. */}
      <line x1="96" x2="166" y1="123" y2="123" strokeWidth="3" />
      <path d="M30 210h120v28H30zM30 210v28M150 210v28" />
      <rect x="70" y="164" width="46" height="22" rx="4" />
      {/* Kitchen: counter run and island. */}
      <path d="M232 241H364V216" />
      <path d="M232 233H356V216" />
      <rect x="262" y="168" width="52" height="28" rx="3" />
    </g>
  );
}
