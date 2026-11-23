import {
  AirplaneTakeOff16Regular,
  Bed16Filled,
  Camera16Filled,
  Flag16Filled,
  Food16Filled,
  Map20Filled,
  PersonWalking16Filled,
  ShoppingBag16Filled,
  VehicleBus16Filled,
  Water16Filled,
  WeatherMoon16Filled,
  WeatherSunny16Filled,
} from "@fluentui/react-icons";
import {
  AnimatePresence,
  animate,
  LayoutGroup,
  motion,
  useMotionValue,
  MotionGlobalConfig,
  useMotionValueEvent,
  useTransform,
} from "motion/react";
import { type ComponentType, useEffect, useRef, useState } from "react";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { clock, toMin } from "./_parts-a";

type StopKind = "visit" | "meal" | "photo" | "free" | "shopping" | "transfer" | "activity";
type Stop = { time: string; kind: StopKind; title: string; included?: boolean; extra?: string };
type Day = {
  title: string;
  stops: Stop[];
  /** When the route ends: hotel check-in, or the drop-off for the last day. */
  end: string;
  overnight?: { place: string; hotel: string };
  finish?: string;
  /** Phase of the road's curve, so each day's route reads differently. */
  phase: number;
};

const KIND: Record<StopKind, { Icon: ComponentType<{ className?: string }>; color: string; bg: string; text: string; label: string }> = {
  visit: { Icon: Flag16Filled, color: "var(--ios-indigo)", bg: "bg-ios-indigo/15", text: "text-ios-indigo", label: "Visit" },
  meal: { Icon: Food16Filled, color: "var(--ios-orange)", bg: "bg-ios-orange/15", text: "text-ios-orange", label: "Meal" },
  photo: { Icon: Camera16Filled, color: "var(--ios-pink)", bg: "bg-ios-pink/15", text: "text-ios-pink", label: "Photo stop" },
  free: { Icon: PersonWalking16Filled, color: "var(--ios-green)", bg: "bg-ios-green/15", text: "text-ios-green", label: "Free time" },
  shopping: { Icon: ShoppingBag16Filled, color: "var(--ios-purple)", bg: "bg-ios-purple/15", text: "text-ios-purple", label: "Shopping" },
  transfer: { Icon: VehicleBus16Filled, color: "var(--ios-blue)", bg: "bg-ios-blue/15", text: "text-ios-blue", label: "Transfer" },
  activity: { Icon: Water16Filled, color: "var(--ios-teal)", bg: "bg-ios-teal/15", text: "text-ios-teal", label: "Activity" },
};

/* The Red Rock 3-day package's program, as the storefront lists it. */
const DAYS: Day[] = [
  {
    title: "Flagstaff → Montezuma → Sedona",
    stops: [
      { time: "08:00", kind: "transfer", title: "Hotel pick-up · Flagstaff" },
      { time: "09:30", kind: "visit", title: "Montezuma Castle", included: true },
      { time: "12:30", kind: "meal", title: "Lunch · Camp Verde", included: false, extra: "Not incl." },
      { time: "15:00", kind: "free", title: "Free time in Sedona" },
      { time: "19:30", kind: "meal", title: "Dinner at the hotel", included: true },
    ],
    end: "21:00",
    overnight: { place: "Sedona", hotel: "Red Rock Lodge · Dinner incl." },
    phase: 0.2,
  },
  {
    title: "Sedona → Oak Creek",
    stops: [
      { time: "09:00", kind: "photo", title: "Airport Mesa viewpoint" },
      { time: "11:30", kind: "visit", title: "Devil's Bridge hike", included: true },
      { time: "14:00", kind: "activity", title: "Verde River rafting", included: false, extra: "+$120" },
      { time: "17:00", kind: "free", title: "Slide Rock swim" },
      { time: "19:30", kind: "meal", title: "Dinner at the resort", included: true },
    ],
    end: "21:00",
    overnight: { place: "Oak Creek", hotel: "Oak Creek Resort · Dinner incl." },
    phase: 1.6,
  },
  {
    title: "Jerome → Cottonwood → Return",
    stops: [
      { time: "07:30", kind: "visit", title: "Jerome ghost town", included: true },
      { time: "12:00", kind: "shopping", title: "Old Town Cottonwood" },
      { time: "16:00", kind: "transfer", title: "Airport / hotel drop-off" },
    ],
    end: "17:30",
    finish: "Flagstaff Airport (FLG)",
    phase: 3.1,
  },
];

/* Route drawing, in the SVG's own 376 × 112 box. */
const W = 376;
const H = 112;
const X0 = 22;
const X1 = W - 22;
const rx = (u: number) => X0 + u * (X1 - X0);
const ry = (u: number, phase: number) => 84 + 11 * Math.sin(u * Math.PI * 2.4 + phase);
const roadPath = (phase: number) =>
  Array.from({ length: 61 }, (_, i) => {
    const u = i / 60;
    return `${i ? "L" : "M"}${rx(u).toFixed(1)} ${ry(u, phase).toFixed(1)}`;
  }).join(" ");
const range = (d: Day) => ({ from: toMin(d.stops[0].time) - 30, to: toMin(d.end) });
const uOf = (d: Day, m: number) => {
  const { from, to } = range(d);
  return Math.min(1, Math.max(0, (m - from) / (to - from)));
};
/* Sun from 06:00 to 21:00 on a shallow arc. */
const sunU = (m: number) => Math.min(1, Math.max(0, (m - 360) / 900));
/* Three layers of the Mogollon Rim country: a hazy far ridge, flat-topped red-rock
 * mesas and buttes in the middle, and the near desert floor the road crosses. */
const FAR_RIDGE =
  "M0 112 V58 C22 50 40 44 62 48 C84 52 98 38 122 36 C146 34 160 46 184 44 C210 42 222 30 248 32 C274 34 288 46 312 42 C336 38 352 34 376 40 V112 Z";
const MESAS =
  "M0 112 V74 L10 73 L15 62 L19 58 L50 58 L54 62 L59 72 L88 74 L95 60 L98 50 L101 47 L109 47 L112 50 L115 60 L121 73 L162 76 L168 66 L172 61 L226 61 L230 66 L237 76 L274 78 L281 62 L285 52 L288 49 L297 49 L300 52 L304 62 L311 78 L346 79 L351 70 L354 66 L376 66 V112 Z";
/* Sunlit caps on each mesa top, drawn over the mesas. */
const MESA_CAPS = "M19 58 H50 L52 61 H17 Z M101 47 H109 L111 50 H99 Z M172 61 H226 L228 64 H170 Z M288 49 H297 L299 52 H286 Z M354 66 H376 V69 H352 Z";
const FLOOR = "M0 112 V88 C60 84 120 86 188 88 C256 90 320 86 376 84 V112 Z";
/** Program minutes per real second. */
const SPEED = 32;

/** Tour guest · large. A package's program day as a route with timed stops and the night's hotel; a dot drives the route with the time of day, Day 1/2/3 switches the program and tapping a stop jumps there. */
export function DayProgramWidget({ index }: { index?: number }) {
  const [dayIdx, setDayIdx] = useState(1);
  const day = DAYS[dayIdx];
  const dayRef = useRef(day);
  dayRef.current = day;
  const delay = 0.3 + (index ?? 0) * 0.06;

  const t = useMotionValue(range(day).from);
  const ctrl = useRef<ReturnType<typeof animate> | null>(null);
  const first = useRef(true);

  const [cur, setCur] = useState(-1);
  const [night, setNight] = useState(false);
  const curRef = useRef(-1);
  const nightRef = useRef(false);

  /* Drive the clock along the day, hold at the hotel, then start over. */
  const run = useRef((from: number, wait: number) => {
    const d = dayRef.current;
    const { from: start, to } = range(d);
    ctrl.current?.stop();
    ctrl.current = animate(t, [from, to], {
      duration: Math.max(0.1, (to - from) / SPEED),
      ease: "linear",
      delay: wait,
      onComplete: () => {
        // With animations skipped every animate() completes at once, and this
        // self-restarting loop would recurse synchronously until the tab dies.
        if (MotionGlobalConfig.skipAnimations) return;
        ctrl.current = animate(t, start, {
          duration: 0.8,
          delay: 1.6,
          ease: "easeInOut",
          onComplete: () => run.current(start, 0.4),
        });
      },
    });
  });

  useEffect(() => {
    const { from } = range(DAYS[dayIdx]);
    t.set(from);
    run.current(from, first.current ? delay + 0.5 : 0.35);
    first.current = false;
    return () => ctrl.current?.stop();
  }, [dayIdx, delay, t]);

  useMotionValueEvent(t, "change", (m) => {
    const stops = dayRef.current.stops;
    let idx = -1;
    for (let i = 0; i < stops.length; i++) if (toMin(stops[i].time) <= m) idx = i;
    if (idx !== curRef.current) {
      curRef.current = idx;
      setCur(idx);
    }
    const isNight = m >= 19 * 60;
    if (isNight !== nightRef.current) {
      nightRef.current = isNight;
      setNight(isNight);
    }
  });

  const jump = (m: number) => {
    ctrl.current?.stop();
    ctrl.current = animate(t, m, {
      type: "spring",
      stiffness: 50,
      damping: 15,
      restDelta: 0.5,
      onComplete: () => !MotionGlobalConfig.skipAnimations && run.current(m, 0.8),
    });
  };

  const u = useTransform(t, (m) => uOf(dayRef.current, m));
  const dotX = useTransform(t, (m) => rx(uOf(dayRef.current, m)));
  const dotY = useTransform(t, (m) => ry(uOf(dayRef.current, m), dayRef.current.phase));
  const sunX = useTransform(t, (m) => 24 + sunU(m) * (W - 48));
  const sunY = useTransform(t, (m) => 62 - Math.sin(sunU(m) * Math.PI) * 46);
  const dusk = useTransform(t, [17 * 60, 20 * 60], [0, 1]);
  const sunOpacity = useTransform(dusk, [0, 1], [1, 0]);
  const clockText = useTransform(t, (m) => clock(m));

  return (
    <Widget size="large" index={index} label="Day program">
      <WidgetHeader
        icon={<Map20Filled />}
        tint="var(--ios-teal)"
        title="Red Rock 3-Day Package"
        subtitle={`Day ${dayIdx + 1} · ${day.title}`}
        extra={
          <Segmented
            size="small"
            value={dayIdx}
            onChange={(v) => setDayIdx(v as number)}
            options={DAYS.map((_, i) => ({ label: `Day ${i + 1}`, value: i }))}
          />
        }
      />

      {/* The route: sky, the Mogollon Rim, the road with its stops and the moving dot. */}
      <div className="relative mt-2 h-[112px] shrink-0 overflow-hidden rounded-2xl bg-fill-quaternary">
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-ios-indigo/25 to-transparent"
          style={{ opacity: dusk }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ios-blue/10 to-transparent" />
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" aria-hidden>
          <defs>
            <radialGradient id="dp-glow">
              <stop offset="0%" stopColor="var(--ios-yellow)" stopOpacity={0.55} />
              <stop offset="45%" stopColor="var(--ios-orange)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--ios-orange)" stopOpacity={0} />
            </radialGradient>
            <radialGradient id="dp-sun" cx="40%" cy="38%">
              <stop offset="0%" stopColor="#fff6c8" />
              <stop offset="55%" stopColor="var(--ios-yellow)" />
              <stop offset="100%" stopColor="var(--ios-orange)" />
            </radialGradient>
            <linearGradient id="dp-mesa" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c8643c" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#8a3f24" stopOpacity={0.28} />
            </linearGradient>
          </defs>
          <motion.g style={{ opacity: sunOpacity }}>
            <motion.circle r={30} cx={sunX} cy={sunY} fill="url(#dp-glow)" />
            <motion.circle r={8.5} cx={sunX} cy={sunY} fill="url(#dp-sun)" />
          </motion.g>
          <motion.g style={{ opacity: dusk }}>
            <motion.circle r={7.5} cx={sunX} cy={sunY} fill="#e8e6ff" />
            <motion.circle r={7.5} cx={sunX} cy={sunY} fill="var(--ios-indigo)" opacity={0.35} />
          </motion.g>
          <path d={FAR_RIDGE} fill="var(--ant-color-fill-secondary)" opacity={0.55} />
          <path d={MESAS} fill="url(#dp-mesa)" />
          <path d={MESA_CAPS} fill="#e58a5a" opacity={0.55} />
          <path d={FLOOR} fill="var(--ant-color-fill-tertiary)" />
          <AnimatePresence initial={false}>
            <motion.g
              key={dayIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <path
                d={roadPath(day.phase)}
                fill="none"
                stroke="var(--widget-surface)"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <motion.path
                d={roadPath(day.phase)}
                fill="none"
                stroke="var(--ios-teal)"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ pathLength: u }}
              />
              {day.stops.map((s, i) => {
                const su = uOf(day, toMin(s.time));
                const passed = i <= cur;
                return (
                  <motion.circle
                    key={s.time}
                    cx={rx(su)}
                    cy={ry(su, day.phase)}
                    r={5}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 18, delay: (first.current ? delay : 0) + 0.2 + i * 0.06 }}
                    fill={passed ? KIND[s.kind].color : "var(--widget-surface)"}
                    stroke={KIND[s.kind].color}
                    strokeWidth={2}
                    style={{ transformBox: "fill-box", transformOrigin: "center" }}
                  />
                );
              })}
              {/* The night's stop at the road's end. */}
              <rect
                x={rx(1) - 6}
                y={ry(1, day.phase) - 6}
                width={12}
                height={12}
                rx={3}
                fill={day.overnight ? "var(--ios-purple)" : "var(--ios-blue)"}
                stroke="var(--widget-surface)"
                strokeWidth={2}
              />
            </motion.g>
          </AnimatePresence>
          <motion.circle cx={dotX} cy={dotY} r={11} fill="var(--ios-teal)" opacity={0.22} />
          <motion.circle cx={dotX} cy={dotY} r={6} fill="var(--widget-surface)" stroke="var(--ios-teal)" strokeWidth={3} />
        </svg>
        <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-widget-surface/85 px-2 py-0.5 text-[11px] font-semibold text-heading tabular">
          {night ? <WeatherMoon16Filled className="text-ios-indigo" /> : <WeatherSunny16Filled className="text-ios-orange" />}
          <motion.span>{clockText}</motion.span>
        </div>
      </div>

      {/* The stops. */}
      <LayoutGroup id={`day-program-${index ?? 0}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul
            key={dayIdx}
            className="mt-1.5 flex flex-col"
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
          >
            {day.stops.map((s, i) => {
              const k = KIND[s.kind];
              const isCur = i === cur;
              const passed = i < cur;
              return (
                <motion.li
                  key={s.time}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 30, delay: (first.current ? delay : 0) + 0.1 + i * 0.05 }}
                  className="relative"
                >
                  {isCur ? (
                    <motion.span
                      layoutId="day-program-current"
                      className="absolute inset-0 rounded-[10px] bg-fill-tertiary"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => jump(toMin(s.time))}
                    className="relative flex h-8 w-full cursor-pointer items-center gap-2.5 px-1.5 text-left outline-none"
                  >
                    <span className={cn("w-[34px] shrink-0 text-[11.5px] font-semibold tabular", passed ? "text-tertiary" : "text-heading")}>
                      {s.time}
                    </span>
                    <span className={cn("grid size-[22px] shrink-0 place-items-center rounded-full text-[13px]", k.bg, k.text)}>
                      <k.Icon />
                    </span>
                    <span className={cn("min-w-0 flex-1 truncate text-[12.5px] font-medium", passed ? "text-secondary" : "text-heading")}>
                      {s.title}
                    </span>
                    {s.included === true ? (
                      <span className="shrink-0 rounded-full bg-ios-green/15 px-1.5 text-[10px] leading-4 font-semibold text-ios-green">
                        Included
                      </span>
                    ) : s.included === false ? (
                      <span className="shrink-0 rounded-full bg-fill-secondary px-1.5 text-[10px] leading-4 font-semibold text-secondary tabular">
                        {s.extra ?? "Not incl."}
                      </span>
                    ) : null}
                  </button>
                </motion.li>
              );
            })}
          </motion.ul>
        </AnimatePresence>
      </LayoutGroup>

      {/* Where the day ends. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={dayIdx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="mt-auto flex h-10 shrink-0 items-center gap-2.5 rounded-xl bg-fill-quaternary px-2.5"
        >
          <span
            className={cn(
              "grid size-[22px] shrink-0 place-items-center rounded-full text-[13px] text-white",
              day.overnight ? "bg-ios-purple" : "bg-ios-blue",
            )}
          >
            {day.overnight ? <Bed16Filled /> : <AirplaneTakeOff16Regular />}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[12.5px] font-semibold text-heading">
              {day.overnight ? `Overnight · ${day.overnight.place}` : "Tour ends"}
            </div>
            <div className="truncate text-[11px] text-tertiary">{day.overnight ? day.overnight.hotel : day.finish}</div>
          </div>
          <span className="shrink-0 text-[11px] font-semibold text-secondary tabular">
            {day.overnight ? `Check-in ${day.end}` : `~${day.end}`}
          </span>
        </motion.div>
      </AnimatePresence>
    </Widget>
  );
}
