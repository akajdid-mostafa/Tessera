import { FlashFlow20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { enterDelay, useInterval } from "./_parts";

/* One station-to-station run, looped: power at the pantograph in MW
 * (positive = drawn from the line, negative = returned by regenerative braking). */
const CYCLE = 24;
const MIN = -2;
const MAX = 3;
const TICK_MS = 250;
/** Each real second stands for 20 s of running, so the counters move visibly. */
const KWH_PER_MW_TICK = (1000 * 20 * (TICK_MS / 1000)) / 3600;

function powerAt(t: number) {
  if (t < 6) return 2.8 - (t / 6) * 0.6;
  if (t < 12) return 0.7 + Math.sin(t * 2) * 0.05;
  if (t < 15) return 0.06;
  if (t < 20) return -1.7 + Math.abs(t - 17.5) * 0.28;
  return 0.08;
}
function phaseAt(t: number) {
  if (t < 6) return { label: "Accelerating", tone: "neutral" };
  if (t < 12) return { label: "Cruising", tone: "neutral" };
  if (t < 15) return { label: "Coasting", tone: "neutral" };
  if (t < 20) return { label: "Regen braking", tone: "regen" };
  return { label: "Dwell · Ashby Vale", tone: "neutral" };
}

const PAGES = [
  { key: "trip", label: "This trip", drawn: 412, back: 121 },
  { key: "day", label: "Today", drawn: 6840, back: 2031 },
] as const;

/** Rail · small. A train's power meter centred on zero, swinging right as it draws traction power and left in green as regenerative braking feeds the line, with the share recovered; tap to switch between this trip and today. */
export function RegenEnergyWidget({ index }: { index?: number }) {
  const [t, setT] = useState(4);
  const [page, setPage] = useState(0);
  const [acc, setAcc] = useState({ drawn: 0, back: 0 });
  const delay = enterDelay(index);

  useInterval(() => {
    const nt = (t + TICK_MS / 1000) % CYCLE;
    const p = powerAt(nt);
    setT(nt);
    setAcc((a) => (p >= 0 ? { ...a, drawn: a.drawn + p * KWH_PER_MW_TICK } : { ...a, back: a.back - p * KWH_PER_MW_TICK }));
  }, TICK_MS);

  const p = powerAt(t);
  const ph = phaseAt(t);
  const pg = PAGES[page];
  const drawn = pg.drawn + acc.drawn;
  const back = pg.back + acc.back;
  const share = back / drawn;
  const zero = (-MIN / (MAX - MIN)) * 100;
  const at = ((p - MIN) / (MAX - MIN)) * 100;
  const regen = p < 0;

  return (
    <Widget size="small" index={index} label="Regenerative energy" pressable onPress={() => setPage((x) => (x + 1) % PAGES.length)}>
      <WidgetHeader
        icon={<FlashFlow20Filled />}
        tint="var(--ios-green)"
        title="Regen Energy"
        subtitle={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={pg.key} className="inline-block" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
              Unit 4127 · {pg.label}
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="mt-2 flex items-baseline-last gap-1.5 whitespace-nowrap">
        <AnimatedNumber
          value={share}
          format={{ style: "percent", maximumFractionDigits: 1, minimumFractionDigits: 1 }}
          className="text-[28px] leading-none font-semibold tracking-tight text-heading"
        />
        <span className="mb-0.5 text-[11px] text-tertiary">recovered</span>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[11px] whitespace-nowrap">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={ph.label}
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            className={cn("truncate", ph.tone === "regen" ? "font-semibold text-ios-green" : "text-tertiary")}
          >
            {ph.label}
          </motion.span>
        </AnimatePresence>
        <span className={cn("font-semibold", regen ? "text-ios-green" : "text-secondary")}>
          <AnimatedNumber value={Math.round(p * 10) / 10} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: "exceptZero" }} /> MW
        </span>
      </div>

      {/* power meter: regen to the left of zero, traction to the right */}
      <div className="relative mt-1.5 h-2.5 rounded-full bg-fill-tertiary">
        <motion.span
          className={cn("absolute inset-y-0 rounded-full", regen ? "bg-ios-green" : "bg-[var(--ant-color-text-secondary)]")}
          initial={{ left: `${zero}%`, width: "0%" }}
          animate={{ left: `${Math.min(zero, at)}%`, width: `${Math.abs(at - zero)}%` }}
          transition={{ type: "spring", stiffness: 160, damping: 22, delay: t === 4 ? delay : 0 }}
        />
        <span className="absolute -inset-y-[3px] w-[2px] -translate-x-1/2 rounded-full bg-[var(--ant-color-text-heading)]" style={{ left: `${zero}%` }} />
      </div>

      <div className="mt-auto flex justify-between leading-tight whitespace-nowrap">
        <div>
          <div className="text-[10px] text-tertiary">Drawn</div>
          <AnimatedNumber value={Math.round(drawn)} className="text-[12px] font-semibold text-heading" />
          <span className="text-[10px] text-tertiary"> kWh</span>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-tertiary">Returned</div>
          <AnimatedNumber value={Math.round(back)} className="text-[12px] font-semibold text-ios-green" />
          <span className="text-[10px] text-tertiary"> kWh</span>
        </div>
      </div>
    </Widget>
  );
}
