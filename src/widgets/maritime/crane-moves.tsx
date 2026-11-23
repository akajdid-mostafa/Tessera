import { BoxMultiple20Filled } from "@fluentui/react-icons";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { enterDelay, useInterval } from "./_parts";

type Crane = { id: string; bay: number; gmph: number; moves: number; planned: number };

const TARGET = 28; // gross moves per hour, berth contract
const CYCLE_S = 5.2; // one animated lift (a real cycle is ~110 s)
const SEED: Crane[] = [
  { id: "QC04", bay: 26, gmph: 29.4, moves: 388, planned: 1_180 },
  { id: "QC05", bay: 34, gmph: 33.1, moves: 452, planned: 1_240 },
  { id: "QC06", bay: 42, gmph: 22.6, moves: 296, planned: 1_060 },
];

/* One lift: latch on the ship, hoist, traverse to the landside lane, land on the tractor, return. */
const T = [0, 0.14, 0.46, 0.58, 0.64, 0.72, 0.92, 1];
const TROLLEY_X = [35, 35, 107, 107, 107, 107, 35, 35];
const SPREADER_Y = [18, 12, 12, 36, 36, 12, 12, 18];
const BOX_ON_SPREADER = [1, 1, 1, 1, 0, 0, 0, 1];
const BOX_ON_TRUCK = [0, 0, 0, 0, 1, 1, 0, 0];

/** Maritime · small. A ship-to-shore crane lifting boxes off the vessel on loop while its gross moves per hour roll; tap to page through the berth's cranes. */
export function CraneMovesWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [cranes, setCranes] = useState(SEED);
  const [page, setPage] = useState(1);
  const delay = enterDelay(index);

  useInterval(() => {
    setCranes((cs) =>
      cs.map((c) => ({ ...c, gmph: Math.round((c.gmph + (Math.random() - 0.5) * 0.4) * 10) / 10 })),
    );
  }, 3000);
  useInterval(() => setCranes((cs) => cs.map((c) => ({ ...c, moves: Math.min(c.planned, c.moves + 1) }))), CYCLE_S * 1000);

  const c = cranes[page];
  const low = c.gmph < TARGET;
  const loop = () => ({
    duration: CYCLE_S,
    times: T,
    repeat: Infinity,
    ease: "easeInOut" as const,
    delay: delay + 0.4,
  });

  return (
    <Widget
      size="small"
      index={index}
      label="Quay crane moves per hour"
      pressable
      onPress={() => setPage((p) => (p + 1) % cranes.length)}
    >
      <WidgetHeader
        icon={<BoxMultiple20Filled />}
        tint={low ? "var(--ios-orange)" : "var(--ios-teal)"}
        title={`${c.id} · STS`}
        subtitle={`Ever Gentle · Bay ${c.bay}`}
      />

      <div className="mt-2 flex items-baseline-last justify-between whitespace-nowrap">
        <div className={cn("text-[28px] leading-none font-semibold tracking-tight", low ? "text-ios-orange" : "text-heading")}>
          <AnimatedNumber value={c.gmph} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
          <span className="text-[12px] font-medium text-tertiary"> mph</span>
        </div>
        <span
          className={cn(
            "mb-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
            low ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-tertiary text-secondary",
          )}
        >
          {low ? "Below 28" : "Tgt 28"}
        </span>
      </div>

      <svg viewBox="0 0 164 62" className="mt-1.5 h-[62px] w-full" aria-hidden>
        {/* water and hull */}
        <rect x="0" y="50" width="70" height="12" fill="var(--ios-blue)" opacity="0.14" />
        <path d="M2 38 H66 L62 56 H6 Z" className="fill-fill-secondary" />
        {[0, 1, 2, 3, 4].map((col) =>
          Array.from({ length: col === 2 ? 2 : 3 }, (_, row) => (
            <rect
              key={`${col}-${row}`}
              x={6 + col * 12}
              y={32 - row * 6}
              width="11"
              height="5.4"
              rx="0.8"
              className="fill-fill"
            />
          )),
        )}
        {/* quay apron and rails */}
        <rect x="66" y="50" width="98" height="12" className="fill-fill-tertiary" />
        <line x1="66" x2="164" y1="50" y2="50" strokeWidth="1" className="stroke-split" />
        {/* the crane: legs, portal, boom, apex stays, machinery house */}
        <g className="stroke-secondary" strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M84 50 V8 M126 50 V8 M84 28 H126 M84 8 H126" />
          <path d="M105 0 L6 7 M105 0 L158 7 M105 0 L84 8 M105 0 L126 8" strokeWidth="1" />
        </g>
        <rect x="4" y="6" width="156" height="3" rx="1" className="fill-secondary" />
        <rect x="128" y="1" width="18" height="5" rx="1" className="fill-tertiary" />
        {/* terminal tractor in the landside lane */}
        <g className="fill-tertiary">
          <rect x="94" y="44" width="24" height="2.5" rx="0.6" />
          <rect x="116" y="38" width="6" height="8.5" rx="1" />
          <circle cx="98" cy="48" r="1.8" />
          <circle cx="112" cy="48" r="1.8" />
          <circle cx="119" cy="48" r="1.8" />
        </g>
        <motion.rect
          x="101"
          y="38"
          width="12"
          height="6"
          rx="0.8"
          fill="var(--ios-teal)"
          initial={{ opacity: 0 }}
          animate={reduce ? { opacity: 0 } : { opacity: BOX_ON_TRUCK }}
          transition={loop()}
        />
        {/* trolley, hoist ropes, spreader and box */}
        <motion.g initial={{ x: 35 }} animate={reduce ? { x: 35 } : { x: TROLLEY_X }} transition={loop()}>
          <rect x="-5" y="9" width="10" height="3" rx="0.6" className="fill-heading" />
          {[-3, 3].map((dx) => (
            <motion.line
              key={dx}
              x1={dx}
              x2={dx}
              y1="12"
              y2={18}
              strokeWidth="0.8"
              className="stroke-secondary"
              initial={{ y2: 18 }}
              animate={reduce ? { y2: 18 } : { y2: SPREADER_Y }}
              transition={loop()}
            />
          ))}
          <motion.g initial={{ y: 18 }} animate={reduce ? { y: 18 } : { y: SPREADER_Y }} transition={loop()}>
            <rect x="-7" y="0" width="14" height="1.6" rx="0.4" className="fill-heading" />
            <motion.rect
              x="-6"
              y="1.6"
              width="12"
              height="6"
              rx="0.8"
              fill="var(--ios-teal)"
              initial={{ opacity: 1 }}
              animate={reduce ? { opacity: 1 } : { opacity: BOX_ON_SPREADER }}
              transition={loop()}
            />
          </motion.g>
        </motion.g>
      </svg>

      <div className="mt-auto flex items-center justify-between text-[10px] text-tertiary tabular">
        <span className="whitespace-nowrap">
          Moves <AnimatedNumber value={c.moves} className="font-semibold text-secondary" /> / {c.planned.toLocaleString("en-US")}
        </span>
        <span className="flex gap-1">
          {cranes.map((x, i) => (
            <span key={x.id} className={cn("size-1.5 rounded-full transition-colors", i === page ? "bg-heading" : "bg-fill")} />
          ))}
        </span>
      </div>
    </Widget>
  );
}
