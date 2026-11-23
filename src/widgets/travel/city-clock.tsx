import { WeatherMoon16Filled, WeatherSunny16Filled } from "@fluentui/react-icons";
import { AnimatePresence, animate, motion, useMotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Widget } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const CITIES = [
  { code: "TYO", name: "Tokyo", tz: "Asia/Tokyo" },
  { code: "NYC", name: "New York", tz: "America/New_York" },
  { code: "LON", name: "London", tz: "Europe/London" },
  { code: "SYD", name: "Sydney", tz: "Australia/Sydney" },
] as const;

/** A zone's offset from UTC right now, in ms, read from Intl so DST is right. */
function zoneOffset(tz: string, at: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(new Date(at));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const wall = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return wall - Math.floor(at / 1000) * 1000;
}

/** Hand angles for a wall-clock time expressed as a UTC timestamp. */
function angles(wall: number) {
  const d = new Date(wall);
  const s = d.getUTCSeconds() + d.getUTCMilliseconds() / 1000;
  const m = d.getUTCMinutes() + s / 60;
  const h = (d.getUTCHours() % 12) + m / 60;
  return { h: h * 30, m: m * 6, s: s * 6 };
}

const TICKS = Array.from({ length: 60 }, (_, i) => i);
const SPRING = { type: "spring", stiffness: 60, damping: 14 } as const;

/** Travel · small. An Apple-style world clock with a sweeping second hand; tap to spin to the next city. */
export function CityClockWidget({ index }: { index?: number }) {
  const [page, setPage] = useState(0);
  const city = CITIES[page];
  const offset = useRef(zoneOffset(city.tz, Date.now()));
  const hourAdj = useMotionValue(-360);
  const minAdj = useMotionValue(-720);
  const hour = useMotionValue(0);
  const minute = useMotionValue(0);
  const second = useMotionValue(0);
  const [wallHour, setWallHour] = useState(() => new Date(Date.now() + offset.current).getUTCHours());

  // Entrance: both hands wind in from a spin.
  useEffect(() => {
    const delay = 0.35 + (index ?? 0) * 0.06;
    const a = animate(hourAdj, 0, { ...SPRING, delay });
    const b = animate(minAdj, 0, { ...SPRING, delay });
    return () => {
      a.stop();
      b.stop();
    };
  }, [hourAdj, minAdj, index]);

  // A smooth sweep: every frame reads the clock.
  useEffect(() => {
    let raf = 0;
    let lastHour = -1;
    const loop = () => {
      const wall = Date.now() + offset.current;
      const a = angles(wall);
      hour.set(a.h + hourAdj.get());
      minute.set(a.m + minAdj.get());
      second.set(a.s);
      const h = new Date(wall).getUTCHours();
      if (h !== lastHour) {
        lastHour = h;
        setWallHour(h);
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [hour, minute, second, hourAdj, minAdj]);

  const next = () => {
    const now = Date.now();
    const to = CITIES[(page + 1) % CITIES.length];
    const from = offset.current;
    const target = zoneOffset(to.tz, now);
    const delta = target - from;
    const a = angles(now + from);
    const b = angles(now + target);
    // Keep the hands where they are, then let them travel the real difference.
    const h0 = hourAdj.get() + a.h - b.h;
    const m0 = minAdj.get() + a.m - b.m;
    hourAdj.set(h0);
    minAdj.set(m0);
    offset.current = target;
    const dir = delta === 0 ? 1 : Math.sign(delta);
    animate(hourAdj, h0 + (delta / 3_600_000) * 30, SPRING);
    animate(minAdj, m0 + dir * 360 + (((b.m - a.m + 540) % 360) - 180), SPRING);
    setPage((n) => (n + 1) % CITIES.length);
  };

  const localOffset = -new Date().getTimezoneOffset() * 60_000;
  const rel = Math.round((offset.current - localOffset) / 3_600_000 * 2) / 2;
  const stamp = Date.now();
  const localDate = new Date(stamp + localOffset).toISOString().slice(0, 10);
  const cityDate = new Date(stamp + offset.current).toISOString().slice(0, 10);
  const day = cityDate === localDate ? "Today" : cityDate > localDate ? "Tomorrow" : "Yesterday";
  const night = wallHour < 6 || wallHour >= 19;

  return (
    <Widget size="small" index={index} label="World clock" pressable onPress={next}>
      <div
        className={cn(
          "relative mx-auto size-[98px] shrink-0 rounded-full ring-1 ring-inset ring-widget-ring transition-colors duration-slow",
          night ? "bg-fill-secondary" : "bg-fill-quaternary",
        )}
      >
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
          {TICKS.map((i) => {
            const major = i % 5 === 0;
            return (
              <line
                key={i}
                x1="50"
                y1={major ? 4.5 : 4}
                x2="50"
                y2={major ? 10 : 7}
                strokeWidth={major ? 1.6 : 0.8}
                strokeLinecap="round"
                transform={`rotate(${i * 6} 50 50)`}
                className={major ? "stroke-[var(--ant-color-text-secondary)]" : "stroke-[var(--ant-color-text-tertiary)]"}
              />
            );
          })}
          {[12, 3, 6, 9].map((n) => {
            const a = (n / 12) * Math.PI * 2;
            return (
              <text
                key={n}
                x={50 + Math.sin(a) * 32}
                y={50 - Math.cos(a) * 32}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-[var(--ant-color-text-heading)] text-[11px] font-semibold"
              >
                {n}
              </text>
            );
          })}
        </svg>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={city.code}
            className="absolute inset-x-0 top-[29%] text-center text-[9px] font-semibold tracking-wide text-tertiary"
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
          >
            {city.code}
          </motion.span>
        </AnimatePresence>

        {/* Hands pivot on their own bottom edge at the dial's center. */}
        <motion.span
          className="absolute bottom-1/2 left-1/2 -ml-[2px] h-[25px] w-[4px] origin-bottom rounded-full bg-[var(--ant-color-text-heading)]"
          style={{ rotate: hour }}
        />
        <motion.span
          className="absolute bottom-1/2 left-1/2 -ml-[1.5px] h-[38px] w-[3px] origin-bottom rounded-full bg-[var(--ant-color-text-heading)]"
          style={{ rotate: minute }}
        />
        <motion.span
          className="absolute left-1/2 -ml-[0.75px] w-[1.5px] rounded-full bg-ios-orange"
          style={{ rotate: second, height: 50, bottom: "calc(50% - 9px)", transformOrigin: "50% 41px" }}
        />
        <span className="absolute left-1/2 top-1/2 size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ios-orange ring-2 ring-[var(--ant-color-text-heading)]" />
        <span className="absolute left-1/2 top-1/2 size-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-widget-surface" />
      </div>

      <div className="mt-auto flex items-end justify-between gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={city.code}
            initial={{ opacity: 0, y: 5, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -5, filter: "blur(3px)" }}
            className="min-w-0 leading-tight"
          >
            <div className="flex items-center gap-1 text-[13px] font-semibold text-heading">
              <span className="truncate">{city.name}</span>
              {night ? (
                <WeatherMoon16Filled className="size-3.5 shrink-0 text-ios-indigo" />
              ) : (
                <WeatherSunny16Filled className="size-3.5 shrink-0 text-ios-yellow" />
              )}
            </div>
            <div className="truncate text-[11px] text-tertiary tabular">
              {day}, {rel >= 0 ? "+" : "−"}
              {Math.abs(rel)}h
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="mb-1 flex shrink-0 gap-1">
          {CITIES.map((c, i) => (
            <motion.span
              key={c.code}
              layout
              className={cn("h-1.5 rounded-full", i === page ? "w-3.5 bg-ios-orange" : "w-1.5 bg-fill")}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          ))}
        </div>
      </div>
    </Widget>
  );
}
