import { LeafOne20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Part = "it" | "cooling" | "losses";
const PARTS: { key: Part; label: string; className: string }[] = [
  { key: "it", label: "IT load", className: "bg-ios-green" },
  { key: "cooling", label: "Cooling", className: "bg-ios-teal" },
  { key: "losses", label: "UPS & losses", className: "bg-fill" },
];
const TWO_DP = { minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

/* A half-circle from PUE 1.0 (left) to 2.0 (right). */
const ARC = "M 12 60 A 48 48 0 0 1 108 60";

function tone(pue: number) {
  if (pue < 1.5) return "var(--ios-green)";
  if (pue < 1.8) return "var(--ios-orange)";
  return "var(--ios-red)";
}

/** Data center · small. PUE counts down from 2.00 to its live value; hover the load bar to split facility power. */
export function PueWidget({ index }: { index?: number }) {
  const [load, setLoad] = useState({ it: 412, cooling: 118, losses: 39 });
  const [settled, setSettled] = useState(false);
  const [hover, setHover] = useState<Part | null>(null);

  useEffect(() => {
    const s = window.setTimeout(() => setSettled(true), 450 + (index ?? 0) * 60);
    const t = window.setInterval(() => {
      setLoad((l) => ({
        it: Math.round(Math.min(430, Math.max(398, l.it + (Math.random() - 0.5) * 8))),
        cooling: Math.round(Math.min(126, Math.max(110, l.cooling + (Math.random() - 0.5) * 5))),
        losses: Math.round(Math.min(42, Math.max(36, l.losses + (Math.random() - 0.5) * 2))),
      }));
    }, 3200);
    return () => {
      window.clearTimeout(s);
      window.clearInterval(t);
    };
  }, [index]);

  const total = load.it + load.cooling + load.losses;
  const pue = total / load.it;
  const shown = settled ? pue : 2;
  const part = hover ? PARTS.find((p) => p.key === hover)! : null;

  return (
    <Widget size="small" index={index} label="Power usage effectiveness">
      <WidgetHeader icon={<LeafOne20Filled />} tint="var(--ios-green)" title="PUE" subtitle="Hall 2 · FRA-3" />

      <div className="relative mx-auto mt-1 h-[64px] w-[120px]">
        <svg viewBox="0 0 120 64" className="size-full overflow-visible" aria-hidden>
          <path d={ARC} fill="none" strokeWidth="9" strokeLinecap="round" className="stroke-fill-secondary" />
          <motion.path
            d={ARC}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            initial={{ pathLength: 0, stroke: tone(shown) }}
            animate={{ pathLength: Math.max(0.02, Math.min(1, shown - 1)), stroke: tone(shown) }}
            transition={{ type: "spring", stiffness: 60, damping: 16, delay: settled ? 0 : 0.3 + (index ?? 0) * 0.06 }}
          />
          {[1.2, 1.5].map((v) => {
            const a = Math.PI * (1 - (v - 1));
            return (
              <line
                key={v}
                x1={60 + Math.cos(a) * 54}
                y1={60 - Math.sin(a) * 54}
                x2={60 + Math.cos(a) * 58}
                y2={60 - Math.sin(a) * 58}
                strokeWidth="1.5"
                strokeLinecap="round"
                className="stroke-quaternary"
              />
            );
          })}
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center leading-none">
          <AnimatedNumber value={shown} format={TWO_DP} trend={-1} className="text-[26px] font-semibold tracking-tight text-heading" />
        </div>
        <span className="absolute -bottom-0.5 left-0 text-[9px] text-tertiary">1.0</span>
        <span className="absolute -bottom-0.5 right-0 text-[9px] text-tertiary">2.0</span>
      </div>

      <div className="mt-auto">
        <div className="flex h-2 gap-[2px] overflow-hidden rounded-full" onMouseLeave={() => setHover(null)}>
          {PARTS.map((p, i) => (
            <motion.button
              key={p.key}
              type="button"
              aria-label={p.label}
              onMouseEnter={() => setHover(p.key)}
              onFocus={() => setHover(p.key)}
              onBlur={() => setHover(null)}
              className={cn("h-full cursor-pointer rounded-[2px] outline-none transition-opacity duration-mid", p.className, hover && hover !== p.key && "opacity-35")}
              initial={{ flexGrow: 0 }}
              animate={{ flexGrow: load[p.key] }}
              style={{ flexBasis: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.4 + (index ?? 0) * 0.06 + i * 0.08 }}
            />
          ))}
        </div>
        <div className="relative mt-1.5 h-[14px] overflow-hidden text-[11px] leading-[14px]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={part?.key ?? "all"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="flex justify-between whitespace-nowrap text-tertiary"
            >
              {part ? (
                <>
                  <span>{part.label}</span>
                  <span className="font-semibold text-secondary tabular">
                    {load[part.key]} kW · {Math.round((load[part.key] / total) * 100)}%
                  </span>
                </>
              ) : (
                <>
                  <span>
                    IT <AnimatedNumber value={load.it} className="font-semibold text-secondary" />
                  </span>
                  <span>
                    Total <AnimatedNumber value={total} className="font-semibold text-secondary" /> kW
                  </span>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Widget>
  );
}
