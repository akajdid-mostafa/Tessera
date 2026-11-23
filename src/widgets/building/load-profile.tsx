import { Grid20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";

type Layer = "all" | "hvac" | "light";
type Split = { hvac: number; light: number; plug: number; l5: boolean };

/** Seven days ending today (Monday, Nov 9); today stops at the current hour. */
const DAYS = [
  { short: "Tue", long: "Tue, Nov 3", weekend: false },
  { short: "Wed", long: "Wed, Nov 4", weekend: false },
  { short: "Thu", long: "Thu, Nov 5", weekend: false },
  { short: "Fri", long: "Fri, Nov 6", weekend: false },
  { short: "Sat", long: "Sat, Nov 7", weekend: true },
  { short: "Sun", long: "Sun, Nov 8", weekend: true },
  { short: "Mon", long: "Today", weekend: false },
];
const NOW_HOUR = 14;
const TODAY = 6;

/** Occupancy shape of a weekday, 0–1 by hour. */
const OCC = [0, 0, 0, 0, 0, 0, 0.2, 0.6, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.6, 0.3, 0, 0, 0, 0];

/** A small deterministic wobble so the grid looks measured, not drawn. */
const wobble = (d: number, h: number) => 1 + (((d * 7919 + h * 104729) % 97) / 97 - 0.5) * 0.09;

/** End-use split for a cell. Level 5 East lights stay on overnight Tue to Fri: the story this widget tells. */
function split(d: number, h: number): Split {
  const day = DAYS[d];
  const occ = day.weekend ? 0 : OCC[h];
  const heat = h >= 8 && h <= 18 ? Math.sin(((h - 8) / 10) * Math.PI) * 34 : 0;
  const warmup = !day.weekend && (h === 5 || h === 6) ? 70 : 0;
  const l5 = d <= 3 && (h >= 20 || h < 6);
  const w = wobble(d, h);
  return {
    hvac: Math.round((day.weekend ? 64 + (h >= 10 && h <= 16 ? 12 : 0) : 72 + 158 * occ + heat + warmup) * w),
    light: Math.round((day.weekend ? 9 : 9 + 66 * occ + (l5 ? 23 : 0)) * w),
    plug: Math.round((day.weekend ? 56 : 58 + 54 * occ) * w),
    l5,
  };
}

const GRID = DAYS.map((_, d) => Array.from({ length: 24 }, (_, h) => (d === TODAY && h > NOW_HOUR ? null : split(d, h))));

const valueOf = (s: Split, layer: Layer) => (layer === "hvac" ? s.hvac : layer === "light" ? s.light : s.hvac + s.light + s.plug);

const PARTS = [
  { id: "hvac", label: "HVAC", cls: "bg-ios-blue" },
  { id: "light", label: "Lighting", cls: "bg-ios-yellow" },
  { id: "plug", label: "Plug & IT", cls: "bg-ios-indigo" },
] as const;

/** Building · large. A week of hourly load as a heatmap with night baseload and peak; the cells sweep in, hovering one splits it by end use, and the after-hours lighting fault stands out on the Lighting layer. */
export function LoadProfileWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [layer, setLayer] = useState<Layer>("all");
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [pinned, setPinned] = useState<[number, number]>([TODAY, NOW_HOUR]);
  const [live, setLive] = useState<Split>(GRID[TODAY][NOW_HOUR]!);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setSettled(true), (delay + 1.4) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  // The current hour is still filling: its reading moves with every meter sample.
  useEffect(() => {
    const base = GRID[TODAY][NOW_HOUR]!;
    const t = window.setInterval(() => {
      const j = () => 0.96 + Math.random() * 0.08;
      setLive({ ...base, hvac: Math.round(base.hvac * j()), light: Math.round(base.light * j()), plug: Math.round(base.plug * j()) });
    }, 2600);
    return () => window.clearInterval(t);
  }, []);

  const cell = (d: number, h: number) => (d === TODAY && h === NOW_HOUR ? live : GRID[d][h]);

  const stats = useMemo(() => {
    let peak = { v: 0, d: 0, h: 0 };
    let night = 0;
    let nights = 0;
    GRID.forEach((row, d) =>
      row.forEach((s, h) => {
        if (!s) return;
        const v = valueOf(s, layer);
        if (v > peak.v) peak = { v, d, h };
        if (h >= 1 && h <= 4) {
          night += v;
          nights++;
        }
      }),
    );
    return { peak, base: night / nights };
  }, [layer]);

  const max = stats.peak.v;
  const ratio = stats.base / max;
  const [sd, sh] = hover ?? pinned;
  const sel = cell(sd, sh)!;
  const total = sel.hvac + sel.light + sel.plug;
  const anomaly = sel.l5;

  return (
    <Widget size="large" index={index} label="Building load profile">
      <WidgetHeader
        icon={<Grid20Filled />}
        tint="var(--ios-teal)"
        title="Load Profile"
        subtitle="HQ Tower · last 7 days"
        extra={
          <Segmented
            size="small"
            value={layer}
            onChange={(v) => setLayer(v as Layer)}
            options={[
              { label: "All", value: "all" },
              { label: "HVAC", value: "hvac" },
              { label: "Light", value: "light" },
            ]}
          />
        }
      />

      <div className="mt-3 flex items-baseline-last justify-between gap-3">
        <div className="leading-none">
          <div className="text-[11px] text-tertiary">Night baseload · 01–05</div>
          <div className="mt-1.5 whitespace-nowrap">
            <AnimatedNumber value={Math.round(stats.base)} className="text-[30px] font-semibold tracking-tight text-heading" />
            <span className="ml-1 text-[13px] font-medium text-tertiary">kW</span>
            <span
              className={cn(
                "ml-2 rounded-full px-1.5 py-0.5 align-[5px] text-[11px] font-semibold tabular transition-colors duration-500",
                ratio > 0.3 ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-tertiary text-secondary",
              )}
            >
              {Math.round(ratio * 100)}% of peak
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right leading-none">
          <div className="text-[11px] text-tertiary">Peak · {DAYS[stats.peak.d].short} {String(stats.peak.h).padStart(2, "0")}:00</div>
          <div className="mt-1.5 whitespace-nowrap">
            <AnimatedNumber value={max} className="text-[20px] font-semibold tracking-tight text-heading" />
            <span className="ml-0.5 text-[12px] font-medium text-tertiary">kW</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-1" onMouseLeave={() => setHover(null)}>
        <div className="flex w-6 shrink-0 flex-col">
          <div className="h-3" />
          <div className="mt-1 grid grid-rows-7 gap-[2px] text-[9px] text-tertiary">
            {DAYS.map((d, i) => (
              <span key={d.short} className={cn("flex h-[18px] items-center leading-none", i === sd && "font-semibold text-heading")}>
                {d.short}
              </span>
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative h-3 text-[9px] leading-3 text-tertiary tabular">
            {[0, 6, 12, 18].map((h) => (
              <span key={h} className="absolute" style={{ left: `${(h / 24) * 100}%` }}>
                {String(h).padStart(2, "0")}
              </span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-24 gap-[2px]">
            {DAYS.map((_, d) =>
              Array.from({ length: 24 }, (_, h) => {
                const s = cell(d, h);
                const key = `${d}-${h}`;
                if (!s) return <span key={key} className="h-[18px] rounded-[3px] border border-dashed border-split" />;
                const t = Math.min(1, valueOf(s, layer) / max);
                const flag = layer === "light" && s.l5;
                const isSel = sd === d && sh === h;
                const isNow = d === TODAY && h === NOW_HOUR;
                return (
                  <motion.span
                    key={key}
                    onMouseEnter={() => setHover([d, h])}
                    onClick={() => setPinned([d, h])}
                    className={cn(
                      "relative h-[18px] cursor-pointer rounded-[3px] transition-[background-color] duration-500",
                      isSel && "ring-1 ring-inset ring-sel",
                    )}
                    style={{
                      backgroundColor: flag
                        ? `color-mix(in srgb, var(--ios-orange) ${Math.round(45 + t * 50)}%, transparent)`
                        : `color-mix(in srgb, var(--ios-teal) ${Math.round(8 + Math.pow(t, 1.4) * 88)}%, transparent)`,
                    }}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.25, zIndex: 2 }}
                    transition={{ type: "spring", stiffness: 420, damping: 24, delay: settled ? 0 : delay + h * 0.028 + d * 0.012 }}
                  >
                    {isNow ? (
                      <motion.span
                        className="absolute inset-0 rounded-[3px] ring-2 ring-ios-teal"
                        animate={{ opacity: [0.9, 0.2, 0.9] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                      />
                    ) : null}
                  </motion.span>
                );
              }),
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto rounded-xl bg-fill-quaternary px-3 py-2">
        <div className="flex items-baseline justify-between gap-2">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={`${sd}-${sh}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              className="truncate text-[12px] font-semibold text-heading tabular"
            >
              {DAYS[sd].long} · {String(sh).padStart(2, "0")}:00{sd === TODAY && sh === NOW_HOUR ? " · live" : ""}
            </motion.span>
          </AnimatePresence>
          <span className="shrink-0 text-[12px] text-tertiary">
            <AnimatedNumber value={total} className="text-[15px] font-semibold text-heading" /> kW
          </span>
        </div>
        <div className="mt-1.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
          {PARTS.map((p) => (
            <motion.span
              key={p.id}
              className={cn("h-full rounded-full transition-opacity duration-300", p.cls, layer !== "all" && layer !== p.id && "opacity-35")}
              animate={{ width: `${(sel[p.id] / total) * 100}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          ))}
        </div>
        <div className="mt-1.5 flex items-center gap-3 whitespace-nowrap text-[11px] text-tertiary">
          {PARTS.map((p) => (
            <span key={p.id} className="flex items-center gap-1">
              <span className={cn("size-1.5 rounded-full", p.cls)} />
              {p.label} <AnimatedNumber value={sel[p.id]} className="font-medium text-secondary" />
            </span>
          ))}
        </div>
        <div className={cn("mt-1 truncate text-[11px]", anomaly ? "font-medium text-ios-orange" : "text-tertiary")}>
          {anomaly
            ? "L5 East lit after hours · +23 kW · not on schedule"
            : DAYS[sd].weekend
              ? "Weekend setback · reduced HVAC"
              : sh === 5 || sh === 6
                ? "Morning warm-up · AHUs pre-start"
                : OCC[sh] > 0
                ? "Occupied · within schedule"
                : "Night setback · within schedule"}
        </div>
      </div>
    </Widget>
  );
}
