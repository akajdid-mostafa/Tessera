import { ArrowUp12Filled, Heart20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/* Q4 pulse survey: 212 replies on "How likely are you to recommend working here?" */
const GROUPS = [
  { key: "promoters", label: "Promoters", sub: "scored 9–10", n: 102, bar: "bg-ios-green", text: "text-ios-green" },
  { key: "passives", label: "Passives", sub: "scored 7–8", n: 81, bar: "bg-fill", text: "text-secondary" },
  { key: "detractors", label: "Detractors", sub: "scored 0–6", n: 29, bar: "bg-ios-red", text: "text-ios-red" },
] as const;
const TOTAL = GROUPS.reduce((s, g) => s + g.n, 0);
const SCORE = Math.round(((GROUPS[0].n - GROUPS[2].n) / TOTAL) * 100);
const LAST_Q = 28;
const GOAL = 30;

/* Half gauge from −100 (left) to +100 (right). */
const CX = 70;
const CY = 70;
const R = 58;
const ARC = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;
const frac = (v: number) => (v + 100) / 200;
const at = (v: number, r: number) => {
  const a = Math.PI * (1 - frac(v));
  return { x: CX + r * Math.cos(a), y: CY - r * Math.sin(a) };
};

/** HR · small. Employee NPS on a half gauge with the goal tick; hover the split to read promoters, passives and detractors. */
export function EnpsWidget({ index }: { index?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const [touched, setTouched] = useState(false);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const g = hover === null ? null : GROUPS[hover];
  const t1 = at(GOAL, R - 9);
  const t2 = at(GOAL, R + 9);

  return (
    <Widget size="small" index={index} label="Employee NPS">
      <WidgetHeader icon={<Heart20Filled />} tint="var(--ios-pink)" title="eNPS" subtitle={`Q4 pulse · ${TOTAL} replies`} />

      <div className="relative mx-auto mt-1 h-[85px] w-[156px]">
        <svg viewBox="0 0 140 76" className="size-full">
          <path d={ARC} fill="none" strokeWidth="10" strokeLinecap="round" className="stroke-fill-secondary" />
          <motion.path
            d={ARC}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            stroke="var(--ios-green)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: frac(SCORE), opacity: g ? 0.35 : 1 }}
            transition={{ pathLength: { type: "spring", stiffness: 60, damping: 16, delay }, opacity: { duration: 0.2 } }}
          />
          <motion.line
            x1={t1.x}
            y1={t1.y}
            x2={t2.x}
            y2={t2.y}
            strokeWidth="2"
            strokeLinecap="round"
            className="stroke-[var(--ant-color-text)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.5 }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center leading-none">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={g ? g.key : "score"}
              initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
            >
              {g ? (
                <>
                  <AnimatedNumber
                    value={g.n / TOTAL}
                    format={{ style: "percent", maximumFractionDigits: 0 }}
                    className={cn("text-[26px] font-semibold tracking-tight", g.text)}
                  />
                  <div className="mt-0.5 text-[10px] whitespace-nowrap text-tertiary">
                    {g.label} · <span className="tabular">{g.n}</span>
                  </div>
                </>
              ) : (
                <>
                  <AnimatedNumber
                    value={SCORE}
                    format={{ signDisplay: "always" }}
                    className="text-[26px] font-semibold tracking-tight text-heading"
                  />
                  <div className="mt-0.5 flex items-center justify-center gap-0.5 text-[10px] whitespace-nowrap text-tertiary">
                    <ArrowUp12Filled className="text-ios-green" />
                    <span className="font-semibold text-ios-green tabular">{SCORE - LAST_Q}</span> vs Q3 · goal +{GOAL}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-auto flex gap-[3px]" onMouseLeave={() => setHover(null)}>
        {GROUPS.map((x, i) => (
          <div
            key={x.key}
            className="min-w-0 cursor-default"
            style={{ flex: `${x.n} 1 0` }}
            onMouseEnter={() => {
              setHover(i);
              setTouched(true);
            }}
            title={`${x.label} (${x.sub})`}
          >
            <motion.div
              className={cn("h-1.5 origin-left rounded-full", x.bar)}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1, opacity: hover === null || hover === i ? 1 : 0.35, scaleY: hover === i ? 1.6 : 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 22, delay: touched ? 0 : delay + 0.2 + i * 0.1 }}
            />
            {/* Never truncated: the narrowest group is thinner than its own label, so the
                last one hangs leftwards from its right edge instead. */}
            <div
              className={cn(
                "mt-1 flex text-[10px] font-medium whitespace-nowrap tabular transition-colors",
                i === GROUPS.length - 1 && "justify-end",
                hover === i ? x.text : "text-tertiary",
              )}
            >
              {Math.round((x.n / TOTAL) * 100)}%
            </div>
          </div>
        ))}
      </div>
    </Widget>
  );
}
