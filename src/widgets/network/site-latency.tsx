import { GlobeClock20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { walk } from "./_parts";

type Site = { name: string; link: string; base: number; busy?: [number, number, number] };

/** Round-trip time to the HQ hub. `busy` = [from hour, to hour, extra ms] for a site that congests. */
const SITES: Site[] = [
  { name: "Frankfurt DC", link: "MPLS", base: 31 },
  { name: "London POP", link: "MPLS", base: 44 },
  { name: "Boston branch", link: "SD-WAN", base: 9 },
  { name: "Philly branch", link: "SD-WAN", base: 12, busy: [9, 11, 24] },
  { name: "Dubai office", link: "Internet VPN", base: 82, busy: [12, 16, 74] },
];
const HOURS = 24;
const NOW_H = 15;
const SLA = 100;
const CRIT = 150;
const hourOf = (col: number) => (NOW_H - (HOURS - 1) + col + HOURS) % HOURS;
const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

function seed(): number[][] {
  return SITES.map((s, si) =>
    Array.from({ length: HOURS }, (_, c) => {
      const h = hourOf(c);
      const wobble = Math.sin(c * 1.7 + si) * s.base * 0.08 + Math.cos(c * 0.6 + si * 2) * s.base * 0.05;
      // Business hours add a little queueing everywhere.
      const day = h >= 9 && h <= 18 ? s.base * 0.12 : 0;
      const busy = s.busy && h >= s.busy[0] && h <= s.busy[1] ? s.busy[2] * (0.7 + 0.3 * Math.sin(((h - s.busy[0]) / (s.busy[1] - s.busy[0] || 1)) * Math.PI)) : 0;
      return Math.max(2, s.base + wobble + day + busy);
    }),
  );
}

function tone(ms: number, base: number) {
  if (ms >= CRIT) return { fill: "var(--ios-red)", text: "text-ios-red" };
  if (ms >= SLA) return { fill: "var(--ios-orange)", text: "text-ios-orange" };
  // Normal cells stay calm: one teal, deeper as RTT rises against the site's own baseline.
  const p = Math.round(22 + Math.min(1, ms / Math.max(base * 1.6, 40)) * 48);
  return { fill: `color-mix(in oklab, var(--ios-teal) ${p}%, transparent)`, text: "text-heading" };
}

/** Network · medium. Twenty-four hours of round-trip time from five sites to HQ as a heatmap; cells sweep in, the current hour ticks live, SLA breaches burn amber and red, and hovering reads any cell. */
export function SiteLatencyWidget({ index }: { index?: number }) {
  const [grid, setGrid] = useState(seed);
  const [probe, setProbe] = useState<{ s: number; c: number } | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      setTick((n) => n + 1);
      setGrid((g) =>
        g.map((row, si) => {
          const s = SITES[si];
          const last = row[HOURS - 1];
          const target = seed()[si][HOURS - 1];
          const next = walk(last + (target - last) * 0.4, Math.max(1, s.base * 0.06), 2, 220);
          return [...row.slice(0, -1), next];
        }),
      );
    }, 2500);
    return () => window.clearInterval(t);
  }, []);

  const now = grid.map((r) => r[HOURS - 1]);
  const worst = now.indexOf(Math.max(...now));
  const sel = probe ?? { s: worst, c: HOURS - 1 };
  const ms = grid[sel.s][sel.c];
  const t = tone(ms, SITES[sel.s].base);
  const breaches = grid.flat().filter((v) => v >= SLA).length;
  const delay = 0.3 + (index ?? 0) * 0.06;

  return (
    <Widget size="medium" index={index} label="Site latency heatmap">
      <WidgetHeader
        icon={<GlobeClock20Filled />}
        tint="var(--ios-teal)"
        title="Site Latency"
        subtitle={`RTT to HQ · ${breaches} SLA breach hour${breaches === 1 ? "" : "s"}`}
        extra={
          <div className="text-right leading-none whitespace-nowrap">
            <div className="relative h-[13px] overflow-hidden text-[11px] text-tertiary">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={`${sel.s}-${sel.c}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  {SITES[sel.s].name.split(" ")[0]} · {sel.c === HOURS - 1 ? "now" : hh(hourOf(sel.c))}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className={cn("mt-1 text-[20px] font-semibold tracking-tight transition-colors duration-mid", t.text)}>
              <AnimatedNumber value={Math.round(ms)} />
              <span className="text-[12px] font-medium text-tertiary"> ms</span>
            </div>
          </div>
        }
      />

      <div className="mt-auto" onMouseLeave={() => setProbe(null)}>
        <div className="flex flex-col gap-[3px]">
          {SITES.map((s, si) => (
            <div key={s.name} className="flex items-center gap-1.5">
              <div
                className={cn(
                  "w-[76px] shrink-0 truncate text-[11px] leading-none transition-colors duration-mid",
                  sel.s === si ? "font-semibold text-heading" : "text-secondary",
                )}
              >
                {s.name}
              </div>
              <div className="grid h-[14px] min-w-0 flex-1 gap-[2px]" style={{ gridTemplateColumns: `repeat(${HOURS}, minmax(0, 1fr))` }}>
                {grid[si].map((v, c) => {
                  const tn = tone(v, s.base);
                  const live = c === HOURS - 1;
                  const on = probe?.s === si && probe.c === c;
                  return (
                    <motion.span
                      key={c}
                      onMouseEnter={() => setProbe({ s: si, c })}
                      className={cn(
                        "relative rounded-[3px] transition-[background-color] duration-700",
                        on && "ring-1 ring-inset ring-sel",
                      )}
                      style={{ backgroundColor: tn.fill }}
                      initial={{ opacity: 0, scale: 0.4 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 320, damping: 22, delay: delay + c * 0.02 + si * 0.03 }}
                    >
                      {live ? (
                        <motion.span
                          key={tick}
                          className="absolute inset-0 rounded-[3px] bg-white"
                          initial={{ opacity: 0.55 }}
                          animate={{ opacity: 0 }}
                          transition={{ duration: 0.9, ease: "easeOut" }}
                        />
                      ) : null}
                    </motion.span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] leading-none text-tertiary tabular">
          <span className="flex w-[76px] shrink-0 items-center gap-1">
            <span className="size-2 rounded-[2px] bg-ios-orange" /> &gt;{SLA}
            <span className="ml-1 size-2 rounded-[2px] bg-ios-red" /> &gt;{CRIT}
          </span>
          <div className="relative h-[10px] flex-1">
            {[0, 6, 12, 18].map((c) => (
              <span key={c} className="absolute" style={{ left: `${(c / HOURS) * 100}%` }}>
                {hh(hourOf(c))}
              </span>
            ))}
            <span className="absolute right-0 font-semibold text-secondary">Now</span>
          </div>
        </div>
      </div>
    </Widget>
  );
}
