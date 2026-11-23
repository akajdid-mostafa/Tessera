import {
  CalendarLtr16Regular,
  Navigation16Filled,
  WeatherCloudy20Filled,
  WeatherMoon20Filled,
  WeatherPartlyCloudyDay20Filled,
  WeatherRain20Filled,
  WeatherSunny20Filled,
  WeatherSunnyLow20Filled,
  WeatherThunderstorm20Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ComponentType, useId, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Glyph = ComponentType<{ className?: string }>;
type Cond = { label: string; Glyph: Glyph; tint: string };

const COND = {
  sunny: { label: "Sunny", Glyph: WeatherSunny20Filled, tint: "text-ios-yellow" },
  partly: { label: "Mostly Sunny", Glyph: WeatherPartlyCloudyDay20Filled, tint: "text-ios-yellow" },
  cloudy: { label: "Cloudy", Glyph: WeatherCloudy20Filled, tint: "text-white" },
  rain: { label: "Rain", Glyph: WeatherRain20Filled, tint: "text-[#8be0ff]" },
  storm: { label: "Thunderstorms", Glyph: WeatherThunderstorm20Filled, tint: "text-[#8be0ff]" },
  sunset: { label: "Sunset", Glyph: WeatherSunnyLow20Filled, tint: "text-ios-orange" },
  clear: { label: "Clear", Glyph: WeatherMoon20Filled, tint: "text-white" },
} satisfies Record<string, Cond>;

const NOW = { temp: 64, cond: COND.partly, hi: 68, lo: 54 };

const HOURS: { t: string; temp: number | string; cond: Cond }[] = [
  { t: "Now", temp: 64, cond: COND.partly },
  { t: "2PM", temp: 66, cond: COND.sunny },
  { t: "3PM", temp: 67, cond: COND.sunny },
  { t: "4PM", temp: 65, cond: COND.partly },
  { t: "4:58", temp: "Sunset", cond: COND.sunset },
  { t: "6PM", temp: 59, cond: COND.clear },
];

const DAYS: { d: string; long: string; lo: number; hi: number; cond: Cond; rain?: number }[] = [
  { d: "Today", long: "Today", lo: 54, hi: 68, cond: COND.partly },
  { d: "Tue", long: "Tuesday", lo: 55, hi: 70, cond: COND.sunny },
  { d: "Wed", long: "Wednesday", lo: 53, hi: 62, cond: COND.rain, rain: 60 },
  { d: "Thu", long: "Thursday", lo: 50, hi: 57, cond: COND.storm, rain: 80 },
  { d: "Fri", long: "Friday", lo: 49, hi: 60, cond: COND.cloudy },
];
const MIN = Math.min(...DAYS.map((d) => d.lo));
const MAX = Math.max(...DAYS.map((d) => d.hi));
const SPAN = MAX - MIN;
/** One gradient across the whole week's scale; each bar shows its own slice of it. */
const SCALE = "linear-gradient(90deg,#5ac8fa 0%,#63e6be 30%,#ffd60a 65%,#ff9f0a 100%)";

type Preview = { label: string; temp: number; cond: Cond; hi: number; lo: number };

/** Weather · large. Apple's large forecast: hover an hour or a day to preview it up top; range bars share one scale. */
export function ForecastLargeWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const hoverId = `fc-hover-${useId()}`;
  const [preview, setPreview] = useState<Preview | null>(null);
  const [activeRow, setActiveRow] = useState<string | null>(null);
  const v = preview ?? { label: "San Francisco", temp: NOW.temp, cond: NOW.cond, hi: NOW.hi, lo: NOW.lo };

  const clear = () => {
    setPreview(null);
    setActiveRow(null);
  };

  return (
    <Widget
      size="large"
      index={index}
      label="Weather forecast"
      surfaceClassName="bg-[linear-gradient(170deg,#2f78cf_0%,#4b95e2_48%,#6aaee9_100%)] dark:bg-[linear-gradient(170deg,#0a1a3c_0%,#14315f_55%,#24508a_100%)] ring-white/10"
    >
      <Ambient />
      <div className="relative flex h-full flex-col text-white" onMouseLeave={clear}>
        <div className="flex items-start justify-between">
          <div className="min-w-0 leading-none">
            <div className="flex items-center gap-1 truncate text-[13px] font-semibold">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={v.label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  {v.label}
                </motion.span>
              </AnimatePresence>
              {preview ? null : <Navigation16Filled className="text-[11px]" />}
            </div>
            <div className="mt-1 text-[46px] font-light tracking-tighter">
              <AnimatedNumber value={v.temp} suffix="°" />
            </div>
          </div>
          <div className="text-right text-[12px] leading-tight">
            <motion.span
              key={v.cond.label}
              className="mb-1 ml-auto block w-fit"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 20 }}
            >
              <v.cond.Glyph className={cn("block text-[22px]", v.cond.tint)} />
            </motion.span>
            <div className="font-medium">{v.cond.label}</div>
            <div className="text-white/75 tabular">
              H:<AnimatedNumber value={v.hi} suffix="°" /> L:<AnimatedNumber value={v.lo} suffix="°" />
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-6 border-t-[0.5px] border-white/20 pt-2">
          {HOURS.map((h, i) => {
            const key = `h-${i}`;
            return (
              <button
                key={key}
                type="button"
                onMouseEnter={() => {
                  setActiveRow(key);
                  setPreview(
                    typeof h.temp === "number"
                      ? { label: i === 0 ? "San Francisco" : `Today at ${h.t}`, temp: h.temp, cond: h.cond, hi: NOW.hi, lo: NOW.lo }
                      : { label: "Sunset at 4:58 PM", temp: 62, cond: h.cond, hi: NOW.hi, lo: NOW.lo },
                  );
                }}
                className="relative flex cursor-pointer flex-col items-center gap-1 rounded-xl py-1 text-[11px] outline-none"
              >
                {activeRow === key ? (
                  <motion.span
                    layoutId={hoverId}
                    className="absolute inset-0 rounded-xl bg-white/15"
                    transition={{ type: "spring", stiffness: 500, damping: 36 }}
                  />
                ) : null}
                <span className="relative text-white/75">{h.t}</span>
                <motion.span
                  className="relative"
                  initial={{ y: 6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: delay + i * 0.04, type: "spring", stiffness: 380, damping: 22 }}
                >
                  <h.cond.Glyph className={cn("block text-[18px]", h.cond.tint)} />
                </motion.span>
                <span className={cn("relative font-semibold tabular", typeof h.temp === "string" && "text-[10px] font-medium")}>
                  {typeof h.temp === "number" ? `${h.temp}°` : h.temp}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-2.5 flex min-h-0 flex-1 flex-col border-t-[0.5px] border-white/20 pt-2">
          <div className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold tracking-wide text-white/60 uppercase">
            <CalendarLtr16Regular className="text-[12px]" /> 5-day forecast
          </div>
          <div className="flex flex-1 flex-col justify-between">
            {DAYS.map((d, i) => {
              const key = `d-${i}`;
              const left = (d.lo - MIN) / SPAN;
              const width = (d.hi - d.lo) / SPAN;
              return (
                <button
                  key={key}
                  type="button"
                  onMouseEnter={() => {
                    setActiveRow(key);
                    setPreview({ label: d.long, temp: d.hi, cond: d.cond, hi: d.hi, lo: d.lo });
                  }}
                  className="relative grid h-7 cursor-pointer grid-cols-[46px_30px_30px_1fr_30px] items-center gap-1.5 rounded-lg px-1 text-[13px] outline-none"
                >
                  {activeRow === key ? (
                    <motion.span
                      layoutId={hoverId}
                      className="absolute inset-0 rounded-lg bg-white/15"
                      transition={{ type: "spring", stiffness: 500, damping: 36 }}
                    />
                  ) : null}
                  <span className="relative text-left font-medium">{d.d}</span>
                  <span className="relative flex flex-col items-center leading-none">
                    <d.cond.Glyph className={cn("block text-[17px]", d.cond.tint)} />
                    {d.rain ? <span className="text-[9px] font-semibold text-[#8be0ff] tabular">{d.rain}%</span> : null}
                  </span>
                  <span className="relative text-right text-white/60 tabular">{d.lo}°</span>
                  <span className="relative h-1 rounded-full bg-black/20">
                    <motion.span
                      className="absolute inset-y-0 origin-left overflow-hidden rounded-full"
                      style={{ left: `${left * 100}%`, width: `${width * 100}%` }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: delay + 0.15 + i * 0.07, type: "spring", stiffness: 160, damping: 20 }}
                    >
                      <span
                        className="absolute inset-y-0"
                        style={{ left: `${(-left / width) * 100}%`, width: `${(1 / width) * 100}%`, background: SCALE }}
                      />
                    </motion.span>
                    {i === 0 ? (
                      <motion.span
                        className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-2 ring-black/25"
                        style={{ left: `${((NOW.temp - MIN) / SPAN) * 100}%` }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: delay + 0.7, type: "spring", stiffness: 500, damping: 20 }}
                      />
                    ) : null}
                  </span>
                  <span className="relative text-right font-semibold tabular">{d.hi}°</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Widget>
  );
}

/** A slow sun bloom and one drifting haze band, kept faint so the type stays crisp. */
function Ambient() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -right-16 -top-16 size-56 rounded-full bg-[radial-gradient(circle,rgba(255,214,10,0.45),transparent_62%)] dark:bg-[radial-gradient(circle,rgba(255,214,10,0.2),transparent_62%)]"
        animate={{ scale: [1, 1.1, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[9%] h-12 w-56 rounded-full bg-white opacity-[0.16] blur-2xl"
        initial={{ x: -260 }}
        animate={{ x: 460 }}
        transition={{ duration: 46, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/10 to-transparent" />
    </div>
  );
}
