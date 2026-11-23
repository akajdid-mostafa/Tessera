import { Trophy20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/* The Wren's own rate against five nearby hotels of the same class, shopped this morning. */
const COMPS = ["SoHo Loft", "Tribeca House", "Hudson Rise", "Chelsea Inn", "Gramercy Suites"];
const NIGHTS = [
  { label: "Tonight", you: 186, comps: [162, 174, 214, 149, 198] },
  { label: "Friday", you: 228, comps: [171, 189, 236, 158, 219] },
  { label: "Saturday", you: 199, comps: [189, 205, 249, 172, 241] },
] as const;

/* The strip's price axis, fixed across nights so the dots travel when you page. */
const LO = 140;
const HI = 260;
const W = 164;
const PAD = 8;
const x = (p: number) => PAD + ((p - LO) / (HI - LO)) * (W - PAD * 2);
const USD = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const;

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Hospitality · small. Our rate on a price strip among five rival hotels; tap to page nights and the dots slide to their new prices. */
export function CompSetWidget({ index }: { index?: number }) {
  const [page, setPage] = useState(0);
  const [hot, setHot] = useState<number | null>(null);
  const n = NIGHTS[page];
  const all = [n.you, ...n.comps];
  const rank = all.filter((p) => p > n.you).length + 1;
  const vsMedian = n.you - median([...n.comps]);
  const delay = 0.3 + (index ?? 0) * 0.06;

  return (
    <Widget
      size="small"
      index={index}
      label="Competitor rates"
      pressable
      onPress={() => {
        setPage((p) => (p + 1) % NIGHTS.length);
        setHot(null);
      }}
    >
      <WidgetHeader icon={<Trophy20Filled />} tint="var(--ios-indigo)" title="Comp Set" subtitle={n.label} />

      <div className="mt-2 flex items-baseline gap-1.5 whitespace-nowrap">
        <AnimatedNumber value={n.you} format={USD} className="text-[26px] leading-none font-semibold tracking-tight text-heading" />
        <motion.span
          key={rank}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 480, damping: 22 }}
          className="rounded-full bg-ios-indigo/15 px-1.5 py-px text-[11px] font-semibold text-ios-indigo tabular"
        >
          #{rank} of 6
        </motion.span>
      </div>
      <div className="mt-1 h-[14px] truncate text-[11px] text-tertiary">
        {hot === null ? (
          <>
            vs median{" "}
            <span className={cn("font-semibold tabular", vsMedian >= 0 ? "text-ios-green" : "text-ios-orange")}>
              {vsMedian >= 0 ? "+" : "−"}${Math.abs(Math.round(vsMedian))}
            </span>
          </>
        ) : (
          <span className="text-secondary">
            {COMPS[hot]} <span className="font-semibold tabular">${n.comps[hot]}</span>
          </span>
        )}
      </div>

      <svg viewBox={`0 0 ${W} 46`} className="mt-auto w-full overflow-visible" onClick={(e) => e.stopPropagation()}>
        <line x1={PAD} x2={W - PAD} y1="24" y2="24" strokeWidth="2" strokeLinecap="round" className="stroke-fill-secondary" />
        {n.comps.map((p, i) => (
          <motion.circle
            key={COMPS[i]}
            cy="24"
            r={hot === i ? 5 : 3.5}
            initial={{ cx: PAD, opacity: 0 }}
            animate={{ cx: x(p), opacity: 1 }}
            transition={{ type: "spring", stiffness: 160, damping: 20, delay: page === 0 && hot === null ? delay + i * 0.05 : 0 }}
            className={cn("cursor-pointer", hot === i ? "fill-secondary" : "fill-fill")}
            onPointerEnter={() => setHot(i)}
            onPointerLeave={() => setHot(null)}
          />
        ))}
        <motion.g
          initial={{ x: PAD, opacity: 0 }}
          animate={{ x: x(n.you), opacity: 1 }}
          transition={{ type: "spring", stiffness: 140, damping: 18, delay: page === 0 ? delay + 0.3 : 0 }}
        >
          <circle cy="24" r="6.5" fill="var(--ios-indigo)" stroke="var(--widget-surface)" strokeWidth="2" />
          <text y="11" textAnchor="middle" className="fill-secondary text-[9px] font-semibold">
            You
          </text>
        </motion.g>
        <text x={PAD} y="42" className="fill-tertiary text-[9px] tabular">
          ${LO}
        </text>
        <text x={W - PAD} y="42" textAnchor="end" className="fill-tertiary text-[9px] tabular">
          ${HI}
        </text>
      </svg>

      <div className="mt-1 flex justify-center gap-1">
        {NIGHTS.map((x, i) => (
          <motion.span
            key={x.label}
            layout
            className={cn("h-1.5 rounded-full", i === page ? "w-3.5 bg-ios-indigo" : "w-1.5 bg-fill")}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        ))}
      </div>
    </Widget>
  );
}
