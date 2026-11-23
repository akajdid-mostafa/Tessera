import { Map20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Territory = {
  id: string;
  code: string;
  name: string;
  rep: string;
  /** Closed-won and quota for Q4, in $K. */
  closed: number;
  quota: number;
  /** Open pipeline as a multiple of the quota still to close. */
  coverage: number;
  row: number;
  col: number;
};

/** A hex cartogram of the sales regions, roughly west to east. */
const START: Territory[] = [
  { id: "pnw", code: "PNW", name: "Pacific Northwest", rep: "Owen Brooks", closed: 312, quota: 300, coverage: 1.9, row: 0, col: 0 },
  { id: "rck", code: "RCK", name: "Rockies", rep: "Lena Fischer", closed: 188, quota: 260, coverage: 2.7, row: 0, col: 1 },
  { id: "pln", code: "PLN", name: "Plains", rep: "Jonah Park", closed: 142, quota: 240, coverage: 1.4, row: 0, col: 2 },
  { id: "glk", code: "GLK", name: "Great Lakes", rep: "Sam Okoye", closed: 276, quota: 310, coverage: 3.1, row: 0, col: 3 },
  { id: "ne", code: "NE", name: "Northeast", rep: "Maya Chen", closed: 418, quota: 400, coverage: 2.2, row: 0, col: 4 },
  { id: "cal", code: "CAL", name: "California", rep: "Priya Natarajan", closed: 455, quota: 420, coverage: 2.4, row: 1, col: 0 },
  { id: "sw", code: "SW", name: "Southwest", rep: "Rafael Ortiz", closed: 201, quota: 280, coverage: 2.1, row: 1, col: 1 },
  { id: "hrt", code: "HRT", name: "Heartland", rep: "Grace Liu", closed: 164, quota: 250, coverage: 1.2, row: 1, col: 2 },
  { id: "ohv", code: "OHV", name: "Ohio Valley", rep: "Marcus Bell", closed: 233, quota: 270, coverage: 2.8, row: 1, col: 3 },
  { id: "mat", code: "MAT", name: "Mid-Atlantic", rep: "Aiko Tanaka", closed: 349, quota: 380, coverage: 2.5, row: 1, col: 4 },
  { id: "tx", code: "TX", name: "Texas", rep: "Diego Ramos", closed: 362, quota: 360, coverage: 2.0, row: 2, col: 2 },
  { id: "se", code: "SE", name: "Southeast", rep: "Dana Whitfield", closed: 247, quota: 330, coverage: 1.6, row: 2, col: 3 },
];

const BANDS = [
  { min: 1, label: "100%+", fill: "var(--ios-green)", text: "text-ios-green" },
  { min: 0.85, label: "85–99", fill: "var(--ios-teal)", text: "text-ios-teal" },
  { min: 0.7, label: "70–84", fill: "var(--ios-yellow)", text: "text-ios-yellow" },
  { min: 0, label: "<70%", fill: "var(--ios-orange)", text: "text-ios-orange" },
] as const;
const bandOf = (p: number) => BANDS.find((b) => p >= b.min) ?? BANDS[BANDS.length - 1];

/* Pointy-top hexes in a 376×180 box. */
const W = 376;
const H = 180;
const R = 35;
const HW = Math.sqrt(3) * R;
const OX = (W - (5 * HW + HW / 2)) / 2 + HW / 2;
const OY = R + 4;
const center = (t: Territory) => [OX + t.col * HW + (t.row % 2 ? HW / 2 : 0), OY + t.row * R * 1.5] as const;
const hex = (cx: number, cy: number, r: number) =>
  Array.from({ length: 6 }, (_, k) => {
    const a = ((60 * k - 90) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");

const K = (n: number) => `$${Math.round(n)}K`;

/** Sales · large. A hex map of territories coloured by attainment; deals close live with a ripple, tap a region for its rep. */
export function TerritoryMapWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [list, setList] = useState(START);
  const [sel, setSel] = useState("glk");
  const [event, setEvent] = useState<{ key: number; id: string; amount: number } | null>(null);

  const listRef = useRef(list);
  useEffect(() => {
    listRef.current = list;
  }, [list]);

  // Every few seconds a rep not yet well past quota closes a deal.
  useEffect(() => {
    const t = window.setInterval(() => {
      const open = listRef.current.filter((x) => x.closed < x.quota * 1.15);
      if (!open.length) return;
      const pick = open[Math.floor(Math.random() * open.length)];
      const amount = 12 + Math.round(Math.random() * 36);
      setEvent({ key: Date.now(), id: pick.id, amount });
      setList((ts) => ts.map((x) => (x.id === pick.id ? { ...x, closed: x.closed + amount } : x)));
    }, 5200);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    if (!event) return;
    const t = window.setTimeout(() => setEvent(null), 1800);
    return () => window.clearTimeout(t);
  }, [event]);

  const team = list.reduce((s, x) => s + x.closed, 0) / list.reduce((s, x) => s + x.quota, 0);
  const cur = list.find((x) => x.id === sel) ?? list[0];
  const pct = cur.closed / cur.quota;
  const band = bandOf(pct);
  const evTerritory = event ? list.find((x) => x.id === event.id) : null;

  return (
    <Widget size="large" index={index} label="Sales territories">
      <WidgetHeader
        icon={<Map20Filled />}
        tint="var(--ios-teal)"
        title="Territories"
        subtitle="Q4 attainment · 12 regions"
        extra={
          <span className="shrink-0 rounded-full bg-fill-tertiary px-2 py-0.5 text-[11px] text-secondary whitespace-nowrap">
            Team{" "}
            <AnimatedNumber
              value={team}
              format={{ style: "percent", maximumFractionDigits: 0 }}
              className="font-semibold text-heading"
            />
          </span>
        }
      />

      <div className="relative mt-2" style={{ height: H }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="size-full overflow-visible">
          {list.map((t) => {
            const [cx, cy] = center(t);
            const p = t.closed / t.quota;
            const b = bandOf(p);
            const on = t.id === sel;
            return (
              <motion.g
                key={t.id}
                role="button"
                tabIndex={0}
                aria-label={`${t.name}: ${Math.round(p * 100)}% of quota`}
                aria-pressed={on}
                onClick={() => setSel(t.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSel(t.id);
                  }
                }}
                className="cursor-pointer outline-none"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: on ? 1.06 : 1, opacity: 1 }}
                whileHover={{ scale: on ? 1.06 : 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 380, damping: 20, delay: delay + (cx / W) * 0.45 }}
              >
                <motion.polygon
                  points={hex(cx, cy, R - 3)}
                  strokeWidth={4}
                  strokeLinejoin="round"
                  initial={false}
                  animate={{ fill: b.fill, stroke: b.fill, fillOpacity: sel && !on ? 0.82 : 1 }}
                  transition={{ duration: 0.5 }}
                />
                {on ? (
                  <motion.polygon
                    points={hex(cx, cy, R)}
                    fill="none"
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                    style={{ stroke: `color-mix(in oklab, ${b.fill}, black 35%)` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                ) : null}
                <text x={cx} y={cy - 2} textAnchor="middle" className="fill-black text-[12px] font-semibold">
                  {t.code}
                </text>
                <text x={cx} y={cy + 12} textAnchor="middle" className="fill-black/70 text-[11px] font-medium tabular">
                  {Math.round(p * 100)}%
                </text>
              </motion.g>
            );
          })}

          <AnimatePresence>
            {event && evTerritory ? (
              <motion.polygon
                key={event.key}
                points={hex(...center(evTerritory), R)}
                fill="none"
                stroke="var(--ios-green)"
                strokeWidth={3}
                strokeLinejoin="round"
                initial={{ scale: 1, opacity: 0.9 }}
                animate={{ scale: 1.55, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                pointerEvents="none"
              />
            ) : null}
          </AnimatePresence>
        </svg>

        <AnimatePresence>
          {event && evTerritory ? (
            <motion.span
              key={event.key}
              className="absolute right-0 bottom-1 rounded-full bg-ios-green-deep px-2 py-0.5 text-[11px] font-semibold text-white whitespace-nowrap tabular"
              initial={{ opacity: 0, y: 8, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
            >
              +{K(event.amount)} won · {evTerritory.code}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="mt-1 flex items-center gap-2.5 text-[11px] text-tertiary">
        {[...BANDS].reverse().map((b) => (
          <span key={b.label} className="flex items-center gap-1 whitespace-nowrap">
            <span className="size-2 rounded-[3px]" style={{ background: b.fill }} />
            {b.label}
          </span>
        ))}
      </div>

      <div className="mt-auto rounded-2xl bg-fill-quaternary p-3">
        <div className="flex items-center gap-2.5">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={cur.id}
              className="flex min-w-0 flex-1 items-center gap-2.5"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <MemojiAvatar who={cur.rep} size={36} />
              <div className="min-w-0 leading-tight">
                <div className="truncate text-[13px] font-semibold text-heading">{cur.rep}</div>
                <div className="truncate text-[11px] text-tertiary">{cur.name}</div>
              </div>
            </motion.div>
          </AnimatePresence>
          <AnimatedNumber
            value={pct}
            format={{ style: "percent", maximumFractionDigits: 0 }}
            className={cn("shrink-0 text-[24px] leading-none font-semibold tracking-tight", band.text)}
          />
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-fill-secondary">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(1, pct) * 100}%`, background: band.fill }}
            transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.1 }}
          />
        </div>
        <div className="mt-2 grid grid-cols-3 text-[11px] leading-tight text-tertiary">
          <div>
            Closed
            <AnimatedNumber value={cur.closed} prefix="$" suffix="K" className="block text-[13px] font-semibold text-heading" />
          </div>
          <div>
            Quota
            <div className="text-[13px] font-semibold text-heading tabular">{K(cur.quota)}</div>
          </div>
          <div className="text-right">
            Coverage
            <div
              className={cn(
                "text-[13px] font-semibold tabular",
                cur.coverage < 1.5 && pct < 1 ? "text-ios-orange" : "text-heading",
              )}
            >
              {cur.coverage.toFixed(1)}×
            </div>
          </div>
        </div>
      </div>
    </Widget>
  );
}
