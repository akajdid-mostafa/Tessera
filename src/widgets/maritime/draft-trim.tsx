import { Ruler20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { enterDelay, useInterval } from "./_parts";

type Mark = "aft" | "mid" | "fwd";

const WATER_DEPTH = 18.7; // berth depth 17.5 m below CD + 1.2 m tide
const MAX_DRAFT = 15.5; // berth draft restriction
const START = { fwd: 14.38, aft: 14.86 };
const WL = 32; // waterline in the drawing
const KV = 4.5; // px per metre of draft change (exaggerated)
const BAYS = 9;
const LABEL: Record<Mark, string> = { aft: "Aft", mid: "Mid", fwd: "Fwd" };
const MARKS: Mark[] = ["aft", "mid", "fwd"];
const MARK_X: Record<Mark, number> = { aft: 14, mid: 83, fwd: 152 };

/** Maritime · small. A container ship sinks and trims by the stern as it loads (heights exaggerated); hover the stern, midships or bow to read that draft mark. */
export function DraftTrimWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [d, setD] = useState(START);
  const [mark, setMark] = useState<Mark | null>(null);
  const delay = enterDelay(index);

  useInterval(() => {
    setD((v) => {
      const mean = (v.fwd + v.aft) / 2;
      if (mean >= 15.3) return START;
      return {
        fwd: Math.round((v.fwd + 0.008 + Math.random() * 0.008) * 100) / 100,
        aft: Math.round((v.aft + 0.006 + Math.random() * 0.006) * 100) / 100,
      };
    });
  }, 2500);

  const mean = (d.fwd + d.aft) / 2;
  const mid = mean + 0.03; // a little sag amidships
  const trim = d.aft - d.fwd;
  const shown = mark === "aft" ? d.aft : mark === "fwd" ? d.fwd : mark === "mid" ? mid : mean;
  const ukc = WATER_DEPTH - d.aft;
  const near = d.aft > MAX_DRAFT - 0.3;
  const progress = Math.min(1, (mean - 14.62) / (15.3 - 14.62));
  const sink = (mean - 14.62) * KV;
  const tilt = -trim * 3; // degrees, stern down (exaggerated)
  const fmt = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

  return (
    <Widget size="small" index={index} label="Draft and trim">
      <WidgetHeader icon={<Ruler20Filled />} tint="var(--ios-blue)" title="Draft & Trim" subtitle="Ever Gentle · Berth 32" />

      <div className="mt-2 flex items-baseline-last justify-between whitespace-nowrap">
        <div className={cn("text-[28px] leading-none font-semibold tracking-tight", near ? "text-ios-orange" : "text-heading")}>
          <AnimatedNumber value={shown} format={fmt} />
          <span className="text-[12px] font-medium text-tertiary"> m</span>
        </div>
        <div className="mb-0.5 text-right text-[10px] leading-tight">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={mark ?? "mean"}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              className="font-semibold text-secondary"
            >
              {mark ? `${LABEL[mark]} mark` : "Mean draft"}
            </motion.div>
          </AnimatePresence>
          <div className="text-tertiary tabular">Trim {trim.toFixed(2)} m A</div>
        </div>
      </div>

      <div className="relative mt-1.5 h-[64px]" onPointerLeave={() => setMark(null)}>
        <svg viewBox="0 0 164 64" className="absolute inset-0 size-full" aria-hidden>
          <motion.g
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: sink, rotate: tilt, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 18, opacity: { delay, duration: 0.4 }, y: { type: "spring", stiffness: 120, damping: 14, delay } }}
            style={{ transformBox: "view-box", transformOrigin: `83px ${WL}px` }}
          >
            {/* hull: transom stern left, raked bow right */}
            <path d="M8 21 H149 L159 22 L151 49 H24 Q12 49 10 41 Z" className="fill-fill-secondary" />
            <path d="M8 21 H149 L159 22" fill="none" strokeWidth="1" className="stroke-tertiary" />
            {/* accommodation and funnel */}
            <rect x="20" y="5" width="15" height="16" rx="1" className="fill-tertiary" />
            <rect x="17" y="5" width="21" height="2" rx="0.6" className="fill-secondary" />
            <rect x="38" y="10" width="5" height="11" rx="0.8" className="fill-fill" />
            {/* stacks rise as the bays are loaded */}
            {Array.from({ length: BAYS }, (_, b) => {
              const tiers = Math.max(1, Math.min(4, Math.round(1 + progress * 3 + ((b * 7) % 3) - 1)));
              return (
                <motion.rect
                  key={b}
                  x={47 + b * 11.2}
                  width="10.2"
                  rx="0.6"
                  className={b % 2 ? "fill-fill" : "fill-fill-secondary"}
                  initial={{ height: 0, y: 21 }}
                  animate={{ height: tiers * 3.2, y: 21 - tiers * 3.2 }}
                  transition={{ type: "spring", stiffness: 200, damping: 22, delay: delay + 0.2 + b * 0.04 }}
                />
              );
            })}
            {/* draft mark ladders at stern, midships and bow */}
            {MARKS.map((m) => (
              <g key={m} className={mark === m ? "stroke-heading" : "stroke-tertiary"} strokeWidth="0.8">
                {[0, 1, 2, 3, 4, 5].map((k) => (
                  <line key={k} x1={MARK_X[m] - 2} x2={MARK_X[m] + 2} y1={26 + k * 4} y2={26 + k * 4} />
                ))}
              </g>
            ))}
          </motion.g>
          {/* water over the hull, so the submerged part reads below the surface */}
          <rect x="0" y={WL} width="164" height={64 - WL} fill="var(--ios-blue)" opacity="0.2" />
          <motion.path
            d="M-24 32 q6 -2.2 12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0"
            fill="none"
            stroke="var(--ios-blue)"
            strokeWidth="1.2"
            animate={reduce ? undefined : { x: [0, 24] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
          />
          {mark ? (
            <line x1={MARK_X[mark]} x2={MARK_X[mark]} y1="0" y2="64" strokeDasharray="2 2" strokeWidth="1" className="stroke-tertiary" />
          ) : null}
        </svg>
        <div className="absolute inset-0 grid grid-cols-3">
          {MARKS.map((m) => (
            <span key={m} className="cursor-crosshair" onPointerEnter={() => setMark(m)} aria-label={`${LABEL[m]} draft`} />
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between text-[10px] text-tertiary tabular whitespace-nowrap">
        <span>
          UKC <span className="font-semibold text-secondary">{ukc.toFixed(2)} m</span>
        </span>
        <span className={near ? "font-semibold text-ios-orange" : undefined}>Max {MAX_DRAFT.toFixed(2)} m</span>
      </div>
    </Widget>
  );
}
