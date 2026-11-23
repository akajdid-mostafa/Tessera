import { Add16Regular, ArrowUndo16Regular, Drop20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { Button } from "@/registry/antuikit/ui/button";

const GOAL = 2500;
const GLASS = 250;
/* Glass drawn in a 52 × 76 box: a tumbler that narrows toward the base. */
const W = 52;
const H = 76;
const TUMBLER = "M4 4 L48 4 L43 70 Q42.6 74 38.5 74 L13.5 74 Q9.4 74 9 70 Z";
const TOP = 6;
const BOTTOM = 72;
/* Two wave periods across the glass so the strip can slide by one period and loop. */
const wave = (amp: number, y = 4) =>
  `M0 ${y} Q${W / 4} ${y - amp} ${W / 2} ${y} T${W} ${y} T${W * 1.5} ${y} T${W * 2} ${y} L${W * 2} ${H} L0 ${H} Z`;

/** Fitness · small. Today's water against a 2.5 L goal; tap +250 ml and the glass fills, the digits roll, undo takes the last one back. */
export function HydrationWidget({ index }: { index?: number }) {
  const [log, setLog] = useState<number[]>([500, 250, 250, 250]);
  const [pops, setPops] = useState<number[]>([]);
  const [touched, setTouched] = useState(false);
  const ml = log.reduce((a, b) => a + b, 0);
  const pct = Math.min(1, ml / GOAL);
  const done = ml >= GOAL;
  const level = BOTTOM - (BOTTOM - TOP) * pct;
  const delay = 0.3 + (index ?? 0) * 0.06;

  const add = () => {
    setTouched(true);
    setLog((l) => [...l, GLASS]);
    const id = Date.now();
    setPops((p) => [...p, id]);
    window.setTimeout(() => setPops((p) => p.filter((x) => x !== id)), 900);
  };

  return (
    <Widget
      size="small"
      index={index}
      label="Water intake"
      glow={{ mode: "pulse", colors: ["#0A84FF", "#40C8E0", "#0A84FF"], blur: 18, duration: 2.4 }}
      glowActive={done}
    >
      <WidgetHeader
        icon={<Drop20Filled />}
        tint="var(--ios-blue)"
        title="Water"
        subtitle={done ? "Goal reached" : `${Math.ceil((GOAL - ml) / GLASS)} glasses to go`}
      />

      <div className="mt-2 flex min-h-0 flex-1 items-center justify-between gap-2">
        <div className="relative min-w-0 leading-none">
          <div className="flex items-baseline gap-0.5">
            <AnimatedNumber
              value={ml / 1000}
              format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
              className="text-[30px] font-semibold tracking-tight text-heading"
            />
            <span className="text-[13px] font-medium text-tertiary">L</span>
          </div>
          <div className="mt-1.5 text-[11px] whitespace-nowrap text-tertiary">
            of 2.5 L ·{" "}
            <AnimatedNumber
              value={pct}
              format={{ style: "percent", maximumFractionDigits: 0 }}
              className={done ? "font-semibold text-ios-green" : "font-semibold text-ios-blue"}
            />
          </div>
          <AnimatePresence>
            {pops.map((id) => (
              <motion.span
                key={id}
                className="pointer-events-none absolute top-0 right-0 text-[11px] font-semibold text-ios-blue"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: -14 }}
                exit={{ opacity: 0, y: -22 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                +250
              </motion.span>
            ))}
          </AnimatePresence>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} className="h-[76px] w-[52px] shrink-0 overflow-visible" aria-hidden>
          <defs>
            <clipPath id="fit-hyd-glass">
              <path d={TUMBLER} />
            </clipPath>
          </defs>
          <path d={TUMBLER} className="fill-fill-quaternary" />
          <g clipPath="url(#fit-hyd-glass)">
            <motion.g initial={{ y: BOTTOM }} animate={{ y: level - 4 }} transition={{ type: "spring", stiffness: 70, damping: 14, delay: touched ? 0 : delay }}>
              <motion.path
                d={wave(3)}
                fill="var(--ios-teal)"
                fillOpacity={0.45}
                animate={{ x: [-W, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
              />
              <motion.path
                d={wave(2.4, 5.5)}
                fill="var(--ios-blue)"
                fillOpacity={0.85}
                animate={{ x: [0, -W] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
              />
            </motion.g>
          </g>
          <path d={TUMBLER} fill="none" strokeWidth="2" className="stroke-fill" strokeLinejoin="round" />
          <path d="M9 12 L12 62" stroke="white" strokeOpacity={0.35} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <div className="mt-auto flex gap-1.5">
        <Button
          shape="circle"
          variant="filled"
          color="default"
          icon={<ArrowUndo16Regular />}
          aria-label="Undo last glass"
          disabled={log.length === 0}
          onClick={() => {
            setTouched(true);
            setLog((l) => l.slice(0, -1));
          }}
        />
        <Button block type="primary" icon={<Add16Regular />} onClick={add}>
          250 ml
        </Button>
      </div>
    </Widget>
  );
}
