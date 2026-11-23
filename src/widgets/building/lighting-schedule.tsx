import {
  ArrowUndo16Regular,
  Clock16Regular,
  LightbulbFilament20Filled,
  WeatherMoon16Regular,
  WeatherSunny16Regular,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

const ON = 7;
const OFF = 19;
const CLEAN = 2;
const MAX_EXT = 3;
const SUNRISE = 7 + 14 / 60;
const SUNSET = 16 + 46 / 60;
const START_NOW = 14 + 20 / 60;

const x = (h: number) => `${(h / 24) * 100}%`;
const hhmm = (h: number) => `${String(Math.floor(h) % 24).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;

/** Building · medium. Today's lighting schedule on a 24 h band with sun times and a Now marker; Extend writes an after-hours override that stretches the occupied window, and the daylight dim level drifts as clouds pass. */
export function LightingScheduleWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [ext, setExt] = useState(0);
  const [writing, setWriting] = useState(false);
  const [dim, setDim] = useState(68);
  const [now, setNow] = useState(START_NOW);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setSettled(true), (delay + 1) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  // Daylight harvesting: the photocell trims output as clouds come and go.
  useEffect(() => {
    const t = window.setInterval(() => {
      setDim((d) => Math.round(Math.min(82, Math.max(54, d + (Math.random() - 0.5) * 10))));
    }, 2800);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => setNow((h) => h + 1 / 60), 20000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!writing) return;
    const t = window.setTimeout(() => {
      setExt((e) => Math.min(MAX_EXT, e + 1));
      setWriting(false);
    }, 650);
    return () => window.clearTimeout(t);
  }, [writing]);

  const off = OFF + ext;
  const left = off - now;
  const windows = [
    { id: "occ", from: ON, to: OFF, cls: "bg-ios-yellow/35", label: "Occupied", tip: `Occupied 07:00–19:00 · 100% max · daylight harvesting` },
    ...(ext
      ? [{ id: "ext", from: OFF, to: off, cls: "bg-ios-orange/45", label: ext > 1 ? `+${ext} h` : "", tip: `After-hours override · until ${hhmm(off)} · operator` }]
      : []),
    { id: "clean", from: off, to: off + CLEAN, cls: "bg-ios-purple/20", label: "Clean", tip: `Cleaning ${hhmm(off)}–${hhmm(off + CLEAN)} · 50% then sweep-off` },
  ];

  return (
    <Widget size="medium" index={index} label="Lighting schedule">
      <WidgetHeader
        icon={<LightbulbFilament20Filled />}
        tint="var(--ios-orange)"
        title="Lighting · Level 5"
        subtitle="Open office E · 42 fixtures"
        extra={
          <div className="text-right leading-tight">
            <div className="text-[11px] text-tertiary">Daylight dim</div>
            <AnimatedNumber value={dim} suffix="%" className="text-[17px] font-semibold text-heading" />
          </div>
        }
      />

      <div className="mt-2">
        <div className="relative h-4 text-[13px] text-tertiary">
          <Tooltip title={`Sunrise ${hhmm(SUNRISE)}`}>
            <span className="absolute top-0 -translate-x-1/2 cursor-default" style={{ left: x(SUNRISE) }}>
              <WeatherSunny16Regular className="size-3.5" />
            </span>
          </Tooltip>
          <Tooltip title={`Sunset ${hhmm(SUNSET)}`}>
            <span className="absolute top-0 -translate-x-1/2 cursor-default" style={{ left: x(SUNSET) }}>
              <WeatherMoon16Regular className="size-3.5" />
            </span>
          </Tooltip>
          <motion.span
            className="absolute top-0 -translate-x-1/2 text-[10px] font-semibold leading-4 text-heading tabular"
            initial={false}
            animate={{ left: x(now) }}
          >
            {hhmm(now)}
          </motion.span>
        </div>

        <div className="relative mt-0.5 h-[26px] rounded-md bg-fill-tertiary">
          {windows.map((w, i) => (
            <Tooltip key={w.id} title={w.tip}>
              <motion.div
                className={cn("@container absolute inset-y-0 flex cursor-default items-center overflow-hidden first:rounded-l-md", w.cls)}
                initial={{ left: x(w.from), width: 0, opacity: 0 }}
                animate={{ left: x(w.from), width: x(w.to - w.from), opacity: 1 }}
                whileHover={{ filter: "brightness(1.12)" }}
                transition={{ type: "spring", stiffness: 140, damping: 22, delay: settled ? 0 : delay + i * 0.12 }}
              >
                {w.label ? (
                  <span
                    className={cn(
                      "hidden pl-1.5 font-medium whitespace-nowrap text-secondary",
                      w.id === "occ" ? "text-[10px] @[56px]:block" : "text-[9px] @[36px]:block",
                    )}
                  >
                    {w.label}
                  </span>
                ) : null}
              </motion.div>
            </Tooltip>
          ))}
          <motion.span
            className="pointer-events-none absolute -inset-y-1 w-[2px] -translate-x-1/2 rounded-full bg-[var(--ant-color-text)]"
            initial={{ left: x(now), scaleY: 0 }}
            animate={{ left: x(now), scaleY: 1 }}
            transition={{ scaleY: { delay: delay + 0.4 } }}
          />
        </div>

        <div className="relative mt-1 h-3 text-[9px] leading-3 text-tertiary tabular">
          {[0, 6, 12, 18, 24].map((h) => (
            <span
              key={h}
              className={cn("absolute", h === 0 ? "" : h === 24 ? "-translate-x-full" : "-translate-x-1/2")}
              style={{ left: x(h) }}
            >
              {String(h).padStart(2, "0")}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <div className="min-w-0 flex-1 leading-tight">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={off}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="truncate text-[12px] font-medium text-heading tabular"
            >
              Sweep-off {hhmm(off)}
              <span className="font-normal text-tertiary">
                {" "}
                · in {Math.floor(left)} h {Math.round((left % 1) * 60)} m
              </span>
            </motion.div>
          </AnimatePresence>
          <div className="truncate text-[11px] text-tertiary">
            {ext ? <span className="font-medium text-ios-orange">Override · operator</span> : "On schedule · occupancy sensors"}
          </div>
        </div>
        <AnimatePresence>
          {ext ? (
            <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}>
              <Tooltip title="Release override">
                <Button
                  size="small"
                  shape="circle"
                  color="default"
                  variant="filled"
                  aria-label="Release override"
                  icon={<ArrowUndo16Regular />}
                  onClick={() => setExt(0)}
                />
              </Tooltip>
            </motion.span>
          ) : null}
        </AnimatePresence>
        <Button
          size="small"
          shape="round"
          color="orange"
          variant="filled"
          icon={<Clock16Regular />}
          loading={writing}
          disabled={ext >= MAX_EXT}
          onClick={() => setWriting(true)}
          className="shrink-0 text-[12px] font-semibold"
        >
          <span className={ext >= MAX_EXT ? undefined : "text-ios-orange"}>{ext >= MAX_EXT ? "Max +3 h" : "Extend 1 h"}</span>
        </Button>
      </div>
    </Widget>
  );
}
