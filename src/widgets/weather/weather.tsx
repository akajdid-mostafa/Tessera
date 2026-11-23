import { WeatherCloudy20Filled, WeatherMoon20Filled, WeatherPartlyCloudyDay20Filled, WeatherRain20Filled, WeatherSunny20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ComponentType, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget } from "@/motion/widget";
import { Icon } from "@/registry/antuikit/ui/icon";
import { cn } from "@/registry/antuikit/lib/utils";

type Hour = { t: string; temp: number; cond: string; Glyph: ComponentType<{ className?: string }>; tint: string };

const HOURS: Hour[] = [
  { t: "Now", temp: 64, cond: "Partly Cloudy", Glyph: WeatherPartlyCloudyDay20Filled, tint: "text-ios-yellow" },
  { t: "15", temp: 66, cond: "Sunny", Glyph: WeatherSunny20Filled, tint: "text-ios-yellow" },
  { t: "16", temp: 66, cond: "Sunny", Glyph: WeatherSunny20Filled, tint: "text-ios-yellow" },
  { t: "17", temp: 63, cond: "Cloudy", Glyph: WeatherCloudy20Filled, tint: "text-white" },
  { t: "18", temp: 59, cond: "Light Rain", Glyph: WeatherRain20Filled, tint: "text-ios-teal" },
  { t: "19", temp: 57, cond: "Clear", Glyph: WeatherMoon20Filled, tint: "text-white" },
];

/** Weather · medium. Clouds drift over a living sky; hover an hour to preview it up top. */
export function WeatherWidget({ index }: { index?: number }) {
  const [active, setActive] = useState(0);
  const h = HOURS[active];

  return (
    <Widget
      size="medium"
      index={index}
      label="Weather"
      surfaceClassName="bg-[linear-gradient(160deg,#2b6fd6_0%,#3f8fe8_45%,#7fb6f2_100%)] dark:bg-[linear-gradient(160deg,#0b1f45_0%,#17396f_55%,#2d5a9a_100%)] ring-white/10"
    >
      <Sky />
      <div className="relative flex h-full flex-col text-white">
        <div className="flex items-start justify-between">
          <div className="leading-none">
            <div className="flex items-center gap-1 text-[13px] font-semibold">
              Chicago <Icon name="arrow-up" className="rotate-45 text-[11px]" />
            </div>
            <div className="mt-1 text-[44px] font-light tracking-tighter">
              <AnimatedNumber value={h.temp} suffix="°" />
            </div>
          </div>
          <div className="text-right text-[12px] leading-tight">
            <h.Glyph className={cn("mb-1 ml-auto block text-[20px]", h.tint)} />
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={h.cond}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="font-medium"
              >
                {h.cond}
              </motion.div>
            </AnimatePresence>
            <div className="text-white/70">H:70° L:55°</div>
          </div>
        </div>

        <div className="mt-auto grid grid-cols-6" onMouseLeave={() => setActive(0)}>
          {HOURS.map((x, i) => (
            <button
              key={x.t}
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className="relative flex cursor-pointer flex-col items-center gap-1 rounded-xl py-1 text-[11px] outline-none"
            >
              {active === i ? (
                <motion.span
                  layoutId="wx-hour"
                  className="absolute inset-0 rounded-xl bg-white/15"
                  transition={{ type: "spring", stiffness: 500, damping: 36 }}
                />
              ) : null}
              <span className="relative text-white/75">{x.t}</span>
              <x.Glyph className={cn("relative text-[16px]", x.tint)} />
              <span className="relative font-semibold tabular">{x.temp}°</span>
            </button>
          ))}
        </div>
      </div>
    </Widget>
  );
}

/** A sun glow and two cloud wisps on slow, offset loops. */
function Sky() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -right-10 -top-12 size-40 rounded-full bg-[radial-gradient(circle,rgba(255,214,10,0.55),transparent_65%)] dark:bg-[radial-gradient(circle,rgba(255,214,10,0.28),transparent_65%)]"
        animate={{ scale: [1, 1.12, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      {[
        { top: "18%", w: 160, d: 28, delay: 0, o: 0.22 },
        { top: "48%", w: 220, d: 40, delay: -14, o: 0.14 },
      ].map((c) => (
        <motion.div
          key={c.top}
          className="absolute h-10 rounded-full bg-white blur-xl"
          style={{ top: c.top, width: c.w, opacity: c.o }}
          initial={{ x: -240 }}
          animate={{ x: 480 }}
          transition={{ duration: c.d, repeat: Infinity, ease: "linear", delay: c.delay }}
        />
      ))}
    </div>
  );
}
