import { Water20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useMemo, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { AlarmMark, enterDelay, sparkPath, useInterval } from "./_parts";

/* Dam-safety seepage read at three 90° V-notch weirs: Q = 1.38 · h^2.5 (m³/s, h in m).
 * What matters is the trend against the pool: W-1 and W-2 follow the reservoir, while
 * W-3 in the gallery climbs with the pool flat and has turned cloudy, a classic sign of
 * fines moving. That is a priority-2 alarm. */
type Weir = { id: string; name: string; h: number; drift: number; cloudy: boolean; series: number[] };

const qOf = (hmm: number) => 1.38 * Math.pow(hmm / 1000, 2.5) * 1000;
const POOL = Array.from({ length: 30 }, (_, i) => 412.2 + 1.1 * Math.min(1, i / 18) + 0.06 * Math.sin(i * 1.7));

const WEIRS: Weir[] = [
  { id: "W-1", name: "Abutment", h: 74, drift: 0, cloudy: false, series: POOL.map((p, i) => qOf(74 - (413.3 - p) * 6 + Math.sin(i * 2.3) * 0.6)) },
  { id: "W-2", name: "Toe drain", h: 102, drift: 0, cloudy: false, series: POOL.map((p, i) => qOf(102 - (413.3 - p) * 5 + Math.sin(i * 1.9) * 0.7)) },
  {
    id: "W-3",
    name: "Gallery",
    h: 84,
    drift: 0.25,
    cloudy: true,
    series: POOL.map((_, i) => qOf(72 + Math.max(0, i - 19) * 1.1 + Math.sin(i * 2.1) * 0.5)),
  },
];

const H_PX = 18 / 140; // px of drawing per mm of head
const SW = 132;
const SH = 30;

function Notch({ hmm, cloudy }: { hmm: number; cloudy: boolean }) {
  const reduce = useReducedMotion();
  const clip = `seep-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const top = 26 - hmm * H_PX;
  const half = (26 - top) * (12 / 18);
  const water = cloudy ? "var(--ios-orange)" : "var(--ios-blue)";
  return (
    <svg viewBox="0 0 48 40" className="h-10 w-12 shrink-0" aria-hidden>
      <defs>
        <clipPath id={clip}>
          <motion.path
            initial={{ d: `M24 26 L${24 - half} ${top} L${24 + half} ${top}Z` }}
            animate={{ d: `M24 26 L${24 - half} ${top} L${24 + half} ${top}Z` }}
            d={`M24 26 L${24 - half} ${top} L${24 + half} ${top}Z`}
            transition={{ type: "spring", stiffness: 80, damping: 18 }}
          />
        </clipPath>
      </defs>
      <path d="M2 8H12L24 26L36 8H46V36H2Z" strokeWidth="1.4" strokeLinejoin="round" className="fill-fill-tertiary stroke-tertiary" />
      <rect x="0" y="0" width="48" height="40" fill={water} fillOpacity="0.3" clipPath={`url(#${clip})`} />
      <g clipPath={`url(#${clip})`}>
        {[0, 1, 2].map((k) => (
          <motion.line
            key={k}
            x1={18 + k * 6}
            x2={18 + k * 6}
            y1="0"
            y2="4"
            stroke={water}
            strokeWidth="1.2"
            strokeLinecap="round"
            initial={{ y: 4 }}
            animate={reduce ? undefined : { y: [4, 26] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "linear", delay: k * 0.35 }}
          />
        ))}
      </g>
      <motion.line
        x1="4"
        x2="44"
        strokeWidth="1.2"
        strokeDasharray="2 2"
        className="stroke-secondary"
        initial={{ y1: 26, y2: 26 }}
        animate={{ y1: top, y2: top }}
        transition={{ type: "spring", stiffness: 80, damping: 18 }}
      />
      <line x1="0" x2="48" y1="38" y2="38" strokeWidth="1.4" className="stroke-tertiary" />
    </svg>
  );
}

/** Water · small. Seepage at a dam's V-notch weirs with 30 days of flow against the pool; the head jitters live, and a tap pages to the gallery weir, rising and cloudy on a P2 alarm. */
export function SeepageWeirWidget({ index }: { index?: number }) {
  const [page, setPage] = useState(0);
  const [heads, setHeads] = useState(WEIRS.map((w) => w.h));
  const delay = enterDelay(index);

  useInterval(() => {
    setHeads((hs) =>
      hs.map((h, i) => {
        const w = WEIRS[i];
        const next = h + w.drift + (Math.random() - 0.5) * 1.2;
        return Math.round(Math.min(w.h + 6, Math.max(w.h - 1.5, next)) * 10) / 10;
      }),
    );
  }, 2400);

  const w = WEIRS[page];
  const h = heads[page];
  const q = qOf(h);
  const series = useMemo(() => [...w.series.slice(0, -1), q], [w, q]);
  const lo = Math.min(...series) * 0.9;
  const hi = Math.max(...series) * 1.05;
  const poolD = sparkPath(POOL, SW, SH, 411.8, 413.6);
  const seepD = sparkPath(series, SW, SH, lo, hi);
  const alarm = w.cloudy;

  return (
    <Widget
      size="small"
      index={index}
      label="Dam seepage weirs"
      pressable
      onPress={() => setPage((p) => (p + 1) % WEIRS.length)}
    >
      <WidgetHeader
        icon={<Water20Filled />}
        tint={alarm ? "var(--ios-orange)" : "var(--ios-blue)"}
        title="Dam Seepage"
        subtitle={`${w.id} · ${w.name}`}
      />

      <div className="mt-2 flex items-center gap-2 whitespace-nowrap">
        <Notch hmm={h} cloudy={alarm} />
        <div className="min-w-0 leading-none">
          <div>
            <AnimatedNumber
              value={q}
              format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
              className="text-[24px] font-semibold tracking-tight text-heading"
            />
            <span className="ml-0.5 text-[12px] font-medium text-tertiary">L/s</span>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.18 }}
              className="mt-1 flex h-4 items-center gap-1 text-[11px]"
            >
              {alarm ? (
                <>
                  <AlarmMark priority={2} flashing size={13} />
                  <span className="font-semibold text-ios-orange">Cloudy · rising</span>
                </>
              ) : (
                <span className="text-tertiary">
                  h <AnimatedNumber value={Math.round(h)} className="font-semibold text-secondary" /> mm · clear
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-auto">
        <svg viewBox={`0 0 ${SW} ${SH}`} className="h-[30px] w-full overflow-visible" aria-hidden>
          <path d={poolD} fill="none" strokeWidth="1" strokeDasharray="2.5 2.5" className="stroke-tertiary" />
          <motion.path
            key={w.id}
            d={seepD}
            fill="none"
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeLinecap="round"
            className={alarm ? "stroke-[var(--ios-orange)]" : "stroke-heading"}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: page === 0 ? delay : 0 }}
          />
        </svg>
        <div className="mt-1 flex items-center justify-between text-[10px] leading-none text-tertiary">
          <span>30 d</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 border-t border-dashed border-[var(--ant-color-text-tertiary)]" />
            Pool
          </span>
          <span className="flex gap-1">
            {WEIRS.map((x, i) => (
              <motion.span
                key={x.id}
                layout
                className={cn("h-1.5 rounded-full", i === page ? "w-3 bg-heading" : "w-1.5 bg-fill")}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            ))}
          </span>
        </div>
      </div>
    </Widget>
  );
}
