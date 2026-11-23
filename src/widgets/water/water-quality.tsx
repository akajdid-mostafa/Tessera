import { ArrowUp12Filled, Beaker20Filled, Checkmark12Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

/* Finished-water compliance strip. Each bullet bar shades the regulatory window
 * (light) and the operating target (darker); in-limit values stay grey. Free
 * chlorine sags under its 0.5 mg/L target now and then, the dosing loop answers. */
type Param = {
  key: "ph" | "ntu" | "cl" | "f";
  name: string;
  unit: string;
  min: number;
  max: number;
  limit: [number, number];
  target: [number, number];
  digits: number;
  note: string;
};
const PARAMS: Param[] = [
  { key: "ph", name: "pH", unit: "", min: 6, max: 9, limit: [6.5, 8.5], target: [7.2, 8.0], digits: 2, note: "Limits 6.5–8.5 · target 7.2–8.0" },
  { key: "ntu", name: "Turbidity", unit: "NTU", min: 0, max: 0.5, limit: [0, 0.3], target: [0, 0.15], digits: 2, note: "Limit 0.3 NTU (95%) · never >1.0" },
  { key: "cl", name: "Free chlorine", unit: "mg/L", min: 0, max: 4, limit: [0.2, 4], target: [0.5, 2], digits: 2, note: "Min 0.2 · MRDL 4.0 · target 0.5–2.0" },
  { key: "f", name: "Fluoride", unit: "mg/L", min: 0, max: 1.4, limit: [0.5, 1], target: [0.6, 0.8], digits: 2, note: "Control 0.5–1.0 · target 0.7" },
];
type Values = Record<Param["key"], number>;
const SEED: Values = { ph: 7.62, ntu: 0.08, cl: 1.12, f: 0.7 };
/** A 36-tick script for chlorine: sag below target, dose steps up, residual recovers. */
const CL_SCRIPT = [1.08, 1.0, 0.9, 0.78, 0.66, 0.56, 0.49, 0.45, 0.44, 0.46, 0.52, 0.6, 0.72, 0.84, 0.95, 1.04, 1.1];
const CYCLE = 36;
const SCRIPT_AT = 8;

const pct = (p: Param, v: number) => `${((Math.min(p.max, Math.max(p.min, v)) - p.min) / (p.max - p.min)) * 100}%`;

/** ISA-18.2 priority 3 marker: yellow, triangle down, numbered. */
function P3() {
  return (
    <svg viewBox="0 0 12 11" className="size-3 shrink-0" aria-label="Priority 3">
      <path d="M1 1h10L6 10.2z" fill="var(--ios-yellow)" />
      <text x="6" y="6.4" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="#000">
        3
      </text>
    </svg>
  );
}

/** Water · medium. pH, turbidity, chlorine and fluoride against their limit bands; pointers drift live and hover explains each limit. */
export function WaterQualityWidget({ index }: { index?: number }) {
  const [v, setV] = useState<Values>(SEED);
  const [dose, setDose] = useState(2.1);
  const tick = useRef(0);
  const [entered, setEntered] = useState(false);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      tick.current = (tick.current + 1) % CYCLE;
      setEntered(true);
      const k = tick.current - SCRIPT_AT;
      const scripted = k >= 0 && k < CL_SCRIPT.length;
      // The controller steps dose up once residual has sat under target for a few samples.
      if (k === 8) setDose(2.6);
      if (k === CL_SCRIPT.length) setDose(2.1);
      setV((x) => ({
        ph: Math.round((x.ph + (7.62 - x.ph) * 0.3 + (Math.random() - 0.5) * 0.04) * 100) / 100,
        ntu: Math.round((0.075 + Math.random() * 0.015) * 1000) / 1000,
        cl: scripted
          ? CL_SCRIPT[k] + (Math.random() - 0.5) * 0.01
          : Math.round((x.cl + (1.12 - x.cl) * 0.3 + (Math.random() - 0.5) * 0.03) * 100) / 100,
        f: Math.round((0.7 + (Math.random() - 0.5) * 0.03) * 100) / 100,
      }));
    }, 2200);
    return () => window.clearInterval(t);
  }, []);

  const low = (p: Param) => v[p.key] < p.target[0] || v[p.key] > p.target[1];
  const flagged = PARAMS.filter((p) => p.key === "cl" && low(p));
  const doseUp = dose > 2.1;

  return (
    <Widget size="medium" index={index} label="Finished water quality">
      <WidgetHeader
        icon={<Beaker20Filled />}
        tint="var(--ios-teal)"
        title="Finished Water"
        subtitle={
          <span className="inline-flex items-center gap-1">
            AIT-301 · Clearwell
            <AnimatePresence>
              {doseUp ? (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  className="inline-flex items-center gap-0.5 font-semibold text-secondary"
                >
                  · <ArrowUp12Filled /> Dose 2.6 mg/L
                </motion.span>
              ) : null}
            </AnimatePresence>
          </span>
        }
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={flagged.length ? "low" : "ok"}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                flagged.length ? "bg-ios-yellow/20 text-heading" : "bg-fill-tertiary text-secondary",
              )}
            >
              {flagged.length ? <P3 /> : <Checkmark12Filled />}
              {flagged.length ? "Cl₂ low" : "In limits"}
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="mt-auto flex flex-col">
        {PARAMS.map((p, i) => {
          const val = v[p.key];
          const off = p.key === "cl" && low(p);
          return (
            <Tooltip key={p.key} placement="top" title={<span className="tabular">{p.note}</span>}>
              <div
                className={cn(
                  "-mx-1.5 flex h-[26px] items-center gap-3 px-1.5 whitespace-nowrap transition-colors hover:bg-fill-quaternary",
                  i > 0 && "border-t-[0.5px] border-split",
                )}
              >
                <div className="w-[104px] shrink-0 truncate text-[12px] leading-none">
                  <span className="font-medium text-heading">{p.name}</span>
                  {p.unit ? <span className="ml-1 text-[10px] text-tertiary">{p.unit}</span> : null}
                </div>
                <div className="relative h-2 min-w-0 flex-1 rounded-full bg-fill-quaternary">
                  <div
                    className="absolute inset-y-0 rounded-full bg-fill-secondary"
                    style={{ left: pct(p, p.limit[0]), right: `calc(100% - ${pct(p, p.limit[1])})` }}
                  />
                  <div
                    className="absolute inset-y-0 bg-fill"
                    style={{ left: pct(p, p.target[0]), right: `calc(100% - ${pct(p, p.target[1])})` }}
                  />
                  <motion.span
                    className={cn(
                      "absolute -top-[3px] h-[14px] w-[3px] -translate-x-1/2 rounded-full ring-2 ring-[var(--widget-surface)]",
                      off ? "bg-ios-yellow" : "bg-heading",
                    )}
                    initial={{ left: "0%" }}
                    animate={{ left: pct(p, val) }}
                    transition={{ type: "spring", stiffness: 110, damping: 18, delay: entered ? 0 : delay + i * 0.07 }}
                  />
                </div>
                <div className="w-14 shrink-0 text-right text-[14px] leading-none font-semibold text-heading">
                  <span className="inline-flex items-center justify-end gap-1">
                    {off ? <P3 /> : null}
                    <AnimatedNumber value={val} format={{ minimumFractionDigits: p.digits, maximumFractionDigits: p.digits }} />
                  </span>
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </Widget>
  );
}
