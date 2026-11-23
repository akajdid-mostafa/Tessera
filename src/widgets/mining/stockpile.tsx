import { Stack20Filled } from "@fluentui/react-icons";
import { motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { enterDelay, useInterval } from "./_parts";

type Pile = { id: string; name: string; live: number; cap: number; inTph: number; outTph: number; feeders: number; minCover: number };

const PILES: Pile[] = [
  { id: "CS-01", name: "Coarse ore", live: 38_400, cap: 60_000, inTph: 6_240, outTph: 5_900, feeders: 3, minCover: 4 },
  { id: "CS-02", name: "Pebble fines", live: 10_900, cap: 40_000, inTph: 0, outTph: 2_600, feeders: 2, minCover: 4 },
];
const SIM_H_PER_TICK = 1 / 30; // two sim minutes per tick
const W = 164;
const H = 58;
const GROUND = 46;
const HMAX = 34;
const TAN = Math.tan((37 * Math.PI) / 180); // angle of repose

/** Conical pile section: height grows with the cube root of tonnage. */
const pileD = (t: number, cap: number) => {
  const h = HMAX * Math.cbrt(Math.max(0, t) / cap);
  const half = Math.min(W / 2 - 4, h / TAN);
  const cx = W / 2;
  return `M${(cx - half).toFixed(1)} ${GROUND} L${cx - 3} ${(GROUND - h + 1.5).toFixed(1)} Q${cx} ${(GROUND - h - 0.5).toFixed(1)} ${cx + 3} ${(GROUND - h + 1.5).toFixed(1)} L${(cx + half).toFixed(1)} ${GROUND}Z`;
};

/** Mining · small. A stockpile in cross-section under its stacker, ore falling onto the cone and feeders drawing it down below; tonnage and hours of cover tick live, low cover turns orange, and a tap switches piles. */
export function StockpileWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [page, setPage] = useState(0);
  const [live, setLive] = useState(() => PILES.map((p) => p.live));
  const delay = enterDelay(index);

  useInterval(() => {
    setLive((ls) =>
      ls.map((v, i) => {
        const p = PILES[i];
        const next = v + (p.inTph - p.outTph) * SIM_H_PER_TICK + (Math.random() - 0.5) * 40;
        return p.inTph === 0 && next < 8_200 ? p.live : Math.round(next);
      }),
    );
  }, 2000);

  const p = PILES[page];
  const t = live[page];
  const cover = t / p.outTph;
  const low = cover < p.minCover;
  const stacking = p.inTph > 0;
  const net = p.inTph - p.outTph;
  const d = pileD(t, p.cap);
  const apex = GROUND - HMAX * Math.cbrt(t / p.cap);

  return (
    <Widget size="small" index={index} pressable onPress={() => setPage((v) => (v + 1) % PILES.length)} label="Stockpile, tap for next pile">
      <WidgetHeader
        icon={<Stack20Filled />}
        tint={low ? "var(--ios-orange)" : "var(--ios-teal)"}
        title={`Stockpile ${p.id}`}
        subtitle={p.name}
        extra={
          <span className="flex gap-1 pt-1.5" aria-hidden>
            {PILES.map((x, i) => (
              <motion.span key={x.id} className={cn("h-1.5 rounded-full", i === page ? "bg-heading" : "bg-fill")} animate={{ width: i === page ? 12 : 6 }} />
            ))}
          </span>
        }
      />

      <div className="mt-2 flex items-baseline gap-1 leading-none whitespace-nowrap">
        <span className="text-[26px] font-semibold tracking-tight text-heading">
          <AnimatedNumber value={t} />
        </span>
        <span className="text-[12px] font-medium text-tertiary">t live</span>
        <span className={cn("ml-auto text-[11px] font-semibold tabular", net < 0 ? "text-secondary" : "text-tertiary")}>
          {net > 0 ? "+" : "−"}
          {Math.abs(net).toLocaleString("en-US")} t/h
        </span>
      </div>
      <div className={cn("mt-1 truncate text-[11px] tabular", low ? "font-medium text-ios-orange" : "text-tertiary")}>
        <AnimatedNumber value={cover} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} /> h cover
        {low ? ` · below ${p.minCover} h` : ` · ${Math.round((t / p.cap) * 100)}% of live`}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-auto h-[58px] w-full overflow-visible" aria-hidden>
        <defs>
          <clipPath id={`sp-${uid}`}>
            <path d={d} />
          </clipPath>
        </defs>
        {/* Stacker conveyor and head chute. */}
        <line x1="4" y1="30" x2={W / 2 - 2} y2="3" strokeWidth="2.5" strokeLinecap="round" className="stroke-[var(--ant-color-text-quaternary)]" />
        <circle cx={W / 2} cy="3" r="2.5" className="fill-[var(--ant-color-text-tertiary)]" />
        {stacking && !reduce ? (
          <>
            <motion.line
              x1="4"
              y1="30"
              x2={W / 2 - 2}
              y2="3"
              strokeWidth="1.4"
              strokeDasharray="2 4"
              className="stroke-[var(--ant-color-text-secondary)]"
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: [0, -12] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
            />
            <motion.line
              x1={W / 2}
              x2={W / 2}
              y1="6"
              y2={apex}
              strokeWidth="2"
              strokeDasharray="2 3"
              strokeLinecap="round"
              className="stroke-[var(--ant-color-text-secondary)]"
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: [0, -10] }}
              transition={{ duration: 0.35, repeat: Infinity, ease: "linear" }}
            />
          </>
        ) : null}

        <motion.path
          d={d}
          className={low ? "fill-[var(--ios-orange)]" : "fill-[var(--ant-color-text-quaternary)]"}
          style={{ fillOpacity: low ? 0.45 : 1 }}
          initial={{ d: pileD(0, p.cap) }}
          animate={{ d }}
          transition={{ type: "spring", stiffness: 70, damping: 18, delay: live[page] === p.live ? delay : 0 }}
        />
        <g clipPath={`url(#sp-${uid})`}>
          {[8, 16, 24, 32].map((y) => (
            <line key={y} x1="0" x2={W} y1={GROUND - y} y2={GROUND - y + 3} strokeWidth="0.8" className="stroke-fill" />
          ))}
        </g>

        {/* Ground and reclaim tunnel with feeders. */}
        <line x1="0" x2={W} y1={GROUND} y2={GROUND} strokeWidth="1" className="stroke-tertiary" />
        <rect x="30" y={GROUND + 3} width={W - 60} height="9" rx="2" className="fill-fill-tertiary" />
        {[W / 2 - 22, W / 2, W / 2 + 22].map((x, i) => (
          <rect
            key={x}
            x={x - 3.5}
            y={GROUND + 1}
            width="7"
            height="4"
            rx="1"
            className={i < p.feeders ? "fill-[var(--ant-color-text-secondary)]" : "fill-fill"}
          />
        ))}
        {!reduce ? (
          <motion.line
            x1="32"
            x2={W - 32}
            y1={GROUND + 9}
            y2={GROUND + 9}
            strokeWidth="1.4"
            strokeDasharray="2 4"
            className="stroke-[var(--ant-color-text-secondary)]"
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: [0, -12] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
        ) : null}
      </svg>
    </Widget>
  );
}
