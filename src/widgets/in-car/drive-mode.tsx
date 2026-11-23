import { Gauge20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const MODES = [
  { id: "Eco", tint: "var(--ios-green)", text: "text-ios-green", bar: "bg-ios-green", max: 60 },
  { id: "Comfort", tint: "var(--ios-blue)", text: "text-ios-blue", bar: "bg-ios-blue", max: 120 },
  { id: "Sport", tint: "var(--ios-red)", text: "text-ios-red", bar: "bg-ios-red", max: 240 },
] as const;
type Mode = (typeof MODES)[number]["id"];

const REGEN = [
  { id: "Low", kw: 30 },
  { id: "Standard", kw: 60 },
  { id: "High", kw: 90 },
] as const;

/* The power meter runs −100 kW (regen) to +250 kW, zero off-centre like a cluster's. */
const LO = -100;
const HI = 250;
const pos = (kw: number) => ((Math.min(HI, Math.max(LO, kw)) - LO) / (HI - LO)) * 100;
const ZERO = pos(0);

/** In-car · small. Drive mode and regen level over a live power meter; Sport sweeps a glow round the card. */
export function DriveModeWidget({ index }: { index?: number }) {
  const pillId = `dm-pill-${useId()}`;
  const [mode, setMode] = useState<Mode>("Comfort");
  const [regen, setRegen] = useState(1);
  const [power, setPower] = useState(0);
  const [flash, setFlash] = useState(false);
  const flashTimer = useRef<number | undefined>(undefined);
  const m = MODES.find((x) => x.id === mode) ?? MODES[1];
  const regenKw = REGEN[regen].kw;

  useEffect(() => {
    const t = window.setInterval(() => {
      setPower((p) => {
        const target = Math.random() < 0.28 ? -regenKw * (0.4 + Math.random() * 0.6) : m.max * (0.15 + Math.random() * 0.55);
        return Math.round(p + (target - p) * 0.6);
      });
    }, 1100);
    return () => window.clearInterval(t);
  }, [m.max, regenKw]);

  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  const pick = (id: Mode) => {
    setMode(id);
    window.clearTimeout(flashTimer.current);
    setFlash(id === "Sport");
    if (id === "Sport") flashTimer.current = window.setTimeout(() => setFlash(false), 1400);
  };

  const left = power < 0 ? pos(power) : ZERO;
  const width = Math.abs(pos(power) - ZERO);

  return (
    <Widget
      size="small"
      index={index}
      label="Drive mode"
      glow={{ mode: "rotate", colors: ["#FF453A", "#FF9F0A", "#FF375F"], blur: 20, duration: 1.4 }}
      glowActive={flash}
    >
      <WidgetHeader icon={<Gauge20Filled />} tint={m.tint} title="Drive mode" subtitle={`Regen · ${REGEN[regen].id}`} />

      <div className="mt-2 flex h-[26px] items-baseline justify-between">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={mode}
            className={cn("text-[22px] leading-none font-semibold tracking-tight", m.text)}
            initial={{ opacity: 0, y: 8, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(3px)" }}
          >
            {mode}
          </motion.span>
        </AnimatePresence>
        <span className="text-[13px] font-semibold text-heading">
          <AnimatedNumber value={power} />
          <span className="text-[11px] font-medium text-tertiary"> kW</span>
        </span>
      </div>

      <div className="relative mt-2 h-2 rounded-full bg-fill-secondary">
        <span
          className="absolute -top-0.5 h-3 border-l border-dashed border-ios-green/70 transition-[left] duration-500"
          style={{ left: `${pos(-regenKw)}%` }}
        />
        <motion.span
          className={cn("absolute inset-y-0 rounded-full", power < 0 ? "bg-ios-green" : m.bar)}
          initial={{ left: `${ZERO}%`, width: 0 }}
          animate={{ left: `${left}%`, width: `${width}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 18 }}
        />
        <span className="absolute -top-0.5 h-3 w-0.5 -translate-x-1/2 rounded-full bg-[var(--ant-color-text-secondary)]" style={{ left: `${ZERO}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] leading-none text-tertiary">
        <span>Regen</span>
        <span>Power</span>
      </div>

      <div className="mt-auto flex h-7 rounded-full bg-fill-tertiary p-0.5" role="radiogroup" aria-label="Drive mode">
        {MODES.map((x) => (
          <button
            key={x.id}
            type="button"
            role="radio"
            aria-checked={mode === x.id}
            onClick={() => pick(x.id)}
            className={cn(
              "relative flex-1 cursor-pointer rounded-full text-[11px] font-semibold outline-none transition-colors",
              mode === x.id ? x.text : "text-tertiary hover:text-secondary",
            )}
          >
            {mode === x.id ? (
              <motion.span
                layoutId={pillId}
                className="absolute inset-0 rounded-full bg-[var(--widget-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.18)]"
                transition={{ type: "spring", stiffness: 500, damping: 36 }}
              />
            ) : null}
            <span className="relative">{x.id}</span>
          </button>
        ))}
      </div>

      <div className="mt-1.5 flex h-4 items-center gap-2 text-[11px]">
        <span className="text-tertiary">Regen</span>
        <div className="flex items-end gap-1" role="radiogroup" aria-label="Regen level">
          {REGEN.map((r, i) => (
            <motion.button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={regen === i}
              aria-label={`${r.id} regen`}
              onClick={() => setRegen(i)}
              whileTap={{ scale: 0.85 }}
              className="flex h-4 w-4 cursor-pointer items-end justify-center outline-none"
            >
              <motion.span
                className={cn("w-2.5 rounded-sm transition-colors", i <= regen ? "bg-ios-green" : "bg-fill")}
                initial={{ height: 0 }}
                animate={{ height: 6 + i * 4 }}
                transition={{ delay: 0.35 + (index ?? 0) * 0.06 + i * 0.08, type: "spring", stiffness: 300, damping: 20 }}
              />
            </motion.button>
          ))}
        </div>
        <span className="ml-auto font-semibold text-secondary">{REGEN[regen].id}</span>
      </div>
    </Widget>
  );
}
