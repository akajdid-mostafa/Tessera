import { Code20Filled, Fire16Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/** mulberry32: a tiny seeded generator, so the grid is the same on every load. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WEEKS = 20;
const TODAY = new Date(2026, 10, 9);
const START = new Date(2026, 10, 8 - 7 * (WEEKS - 1));
const STREAK = 23;

type Day = { date: Date; count: number; future: boolean };

const DAYS: Day[] = (() => {
  const r = rng(20261109);
  const vacation = [new Date(2026, 7, 10), new Date(2026, 7, 16)];
  const out: Day[] = [];
  for (let i = 0; i < WEEKS * 7; i++) {
    const date = new Date(START.getFullYear(), START.getMonth(), START.getDate() + i);
    const future = date > TODAY;
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const away = date >= vacation[0] && date <= vacation[1];
    let count = 0;
    if (!future && !away && r() > (weekend ? 0.55 : 0.1)) {
      count = 1 + Math.floor(Math.pow(r(), 1.7) * (weekend ? 6 : 16));
    }
    out.push({ date, count, future });
  }
  const last = out.filter((d) => !d.future).length - 1;
  for (let k = 0; k < STREAK; k++) if (out[last - k].count === 0) out[last - k].count = 1 + Math.floor(r() * 4);
  out[last - STREAK].count = 0;
  return out;
})();
const LAST = DAYS.filter((d) => !d.future).length - 1;

const TOTAL = DAYS.reduce((s, d) => s + d.count, 0);
const ACTIVE = DAYS.filter((d) => d.count > 0).length;
const LONGEST = DAYS.reduce(
  (acc, d) => {
    const run = d.count > 0 ? acc.run + 1 : 0;
    return { run, best: Math.max(acc.best, run) };
  },
  { run: 0, best: 0 },
).best;

const LEVELS = ["bg-fill-secondary", "bg-ios-green/30", "bg-ios-green/55", "bg-ios-green/80", "bg-ios-green"];
const level = (c: number) => (c === 0 ? 0 : c <= 2 ? 1 : c <= 5 ? 2 : c <= 9 ? 3 : 4);

const REPOS = [
  { name: "storefront-web", cls: "bg-ios-green" },
  { name: "api-gateway", cls: "bg-ios-teal" },
  { name: "infra", cls: "bg-ios-indigo" },
];

/** A day's commits split across repos, seeded by the date so a cell always tells the same story. */
function split(d: Day) {
  if (!d.count) return [0, 0, 0];
  const r = rng(Math.floor(d.date.getTime() / 864e5));
  const a = Math.max(1, Math.round(d.count * (0.45 + r() * 0.3)));
  const b = Math.round((d.count - a) * (0.45 + r() * 0.45));
  return [a, b, d.count - a - b];
}

const MONTHS = Array.from({ length: WEEKS }, (_, w) => {
  if (w === 0) return null;
  const m = DAYS[w * 7].date.getMonth();
  return m !== DAYS[(w - 1) * 7].date.getMonth() ? DAYS[w * 7].date.toLocaleDateString("en-US", { month: "short" }) : null;
});

/** SaaS · large. A contribution grid cascades in; hover any day to read its commits split by repo. */
export function CommitHeatmapWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [hover, setHover] = useState<number | null>(null);
  const [counted, setCounted] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setCounted(true), (delay + 0.2) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  const sel = DAYS[hover ?? LAST];
  const parts = split(sel);

  return (
    <Widget size="large" index={index} label="Contribution heatmap">
      <WidgetHeader
        icon={<Code20Filled />}
        tint="var(--ios-green)"
        title="Contributions"
        subtitle="acme · last 20 weeks"
        extra={
          <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-ios-orange/15 px-2 py-0.5 text-[11px] font-semibold text-ios-orange">
            <motion.span
              className="grid place-items-center"
              animate={{ scale: [1, 1.18, 1], rotate: [0, -6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <Fire16Filled />
            </motion.span>
            On a streak
          </span>
        }
      />

      <div className="mt-3 flex items-baseline-last justify-between gap-3">
        <div className="leading-none">
          <div className="text-[32px] font-semibold tracking-tight text-heading">
            <AnimatedNumber value={counted ? TOTAL : 0} />
          </div>
          <div className="mt-1 text-[11px] text-tertiary">contributions</div>
        </div>
        <div className="flex gap-4 text-right leading-none">
          <Stat label="Current streak" value={counted ? STREAK : 0} accent />
          <Stat label="Longest" value={counted ? LONGEST : 0} />
        </div>
      </div>

      <div className="mt-3 flex gap-1.5">
        <div className="flex w-6 shrink-0 flex-col">
          <div className="h-3" />
          <div className="mt-1 grid flex-1 grid-rows-7 gap-[3px] text-[9px] text-tertiary">
            {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
              <span key={i} className="flex items-center leading-none">
                {d}
              </span>
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="grid h-3 grid-cols-20 gap-x-[3px] text-[9px] leading-3 text-tertiary">
            {MONTHS.map((m, w) => (
              <span key={w} className="overflow-visible whitespace-nowrap">
                {m}
              </span>
            ))}
          </div>
          <div className="mt-1 grid grid-flow-col grid-cols-20 grid-rows-7 gap-[3px]" onMouseLeave={() => setHover(null)}>
            {DAYS.map((d, i) => {
              const w = Math.floor(i / 7);
              const dow = i % 7;
              if (d.future) return <span key={i} className="aspect-square" />;
              return (
                <motion.span
                  key={i}
                  onMouseEnter={() => setHover(i)}
                  className={cn(
                    "aspect-square cursor-pointer rounded-[3px]",
                    LEVELS[level(d.count)],
                    (hover ?? LAST) === i && "ring-1 ring-inset ring-sel",
                  )}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.3 }}
                  transition={{ type: "spring", stiffness: 420, damping: 22, delay: hover === null && !counted ? delay + (w + dow) * 0.018 : 0 }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-tertiary tabular">
        <span>Avg {(TOTAL / ACTIVE).toFixed(1)} per active day</span>
        <span className="flex items-center gap-[3px]">
          Less
          {LEVELS.map((l) => (
            <span key={l} className={cn("size-2.5 rounded-[3px]", l)} />
          ))}
          More
        </span>
      </div>

      <div className="mt-auto rounded-xl bg-fill-quaternary px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <motion.span
            key={sel.date.getTime()}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="truncate text-[12px] font-semibold text-heading"
          >
            {(hover ?? LAST) === LAST ? "Today, " : ""}
            {sel.date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </motion.span>
          <span className="shrink-0 text-[12px] text-tertiary">
            <AnimatedNumber value={sel.count} className="font-semibold text-heading" /> commit{sel.count === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-fill-secondary">
          {REPOS.map((r, i) => (
            <motion.span
              key={r.name}
              className={cn("h-full rounded-full", r.cls)}
              animate={{ width: sel.count ? `${(parts[i] / sel.count) * 100}%` : "0%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          ))}
        </div>
        <div className="mt-1.5 flex gap-3 overflow-hidden text-[11px] whitespace-nowrap text-tertiary">
          {sel.count === 0 ? (
            <span>No commits · rest day</span>
          ) : (
            REPOS.map((r, i) =>
              parts[i] ? (
                <span key={r.name} className="flex items-center gap-1">
                  <span className={cn("size-1.5 rounded-full", r.cls)} />
                  {r.name} <span className="font-medium text-secondary tabular">{parts[i]}</span>
                </span>
              ) : null,
            )
          )}
        </div>
      </div>
    </Widget>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div>
      <div className={cn("text-[20px] font-semibold tracking-tight", accent ? "text-ios-orange" : "text-heading")}>
        <AnimatedNumber value={value} />
        <span className="ml-0.5 text-[12px] font-medium text-tertiary">d</span>
      </div>
      <div className="mt-1 text-[11px] text-tertiary">{label}</div>
    </div>
  );
}
