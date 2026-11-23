import { Add12Filled, ArrowSync16Regular, Grid20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

/* Bay B3, skincare: three shelves, six facings each, two facings per product. */
type Sku = { name: string; color: string; h: number; w: number; r: number };
const SKUS: Sku[] = [
  { name: "Hydra Serum 30 ml", color: "var(--ios-pink)", h: 17, w: 0.62, r: 4 },
  { name: "Vitamin C Drops 30 ml", color: "var(--ios-orange)", h: 15, w: 0.62, r: 4 },
  { name: "Retinol Night 30 ml", color: "var(--ios-purple)", h: 18, w: 0.62, r: 4 },
  { name: "Barrier Cream 50 ml", color: "var(--ios-teal)", h: 11, w: 0.9, r: 3 },
  { name: "Gel Moisturiser 50 ml", color: "var(--ios-blue)", h: 12, w: 0.9, r: 3 },
  { name: "SPF 50 Fluid 40 ml", color: "var(--ios-yellow)", h: 14, w: 0.72, r: 3 },
  { name: "Foaming Cleanser 150 ml", color: "var(--ios-mint)", h: 18, w: 0.72, r: 3 },
  { name: "Micellar Water 400 ml", color: "var(--ios-indigo)", h: 18, w: 0.8, r: 5 },
  { name: "Exfoliating Toner 200 ml", color: "var(--ios-red)", h: 16, w: 0.72, r: 3 },
];
const SHELVES = 3;
const PER = 6;
const FACINGS = SHELVES * PER;
/** The planogram: which product belongs in each facing. */
const PLAN = Array.from({ length: FACINGS }, (_, f) => Math.floor(f / 2));
const BACKROOM = [14, 6, 9, 22, 11, 8, 17, 12, 5];

type State = "ok" | "gap" | "wrong";
const START: State[] = PLAN.map((_, f) => (f === 3 || f === 8 || f === 15 ? "gap" : f === 11 ? "wrong" : "ok"));
/** A misplaced facing shows the product that wandered in. */
const WRONG_SKU = 0;

/** Retail · small. A shelf bay against its planogram with gaps and a misplaced product; tap a facing to refill or fix it, and shoppers keep emptying new ones. */
export function ShelfCheckWidget({ index }: { index?: number }) {
  const [cells, setCells] = useState<State[]>(START);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const ok = cells.filter((c) => c === "ok").length;
  const gaps = cells.filter((c) => c === "gap").length;
  const wrong = cells.filter((c) => c === "wrong").length;
  const perfect = ok === FACINGS;

  // Live: when the bay is nearly clean, a shopper takes the last of something.
  useEffect(() => {
    const t = window.setInterval(() => {
      setCells((cs) => {
        if (cs.filter((c) => c !== "ok").length >= 2) return cs;
        const candidates = cs.map((c, i) => (c === "ok" ? i : -1)).filter((i) => i >= 0);
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        return cs.map((c, i) => (i === pick ? "gap" : c));
      });
    }, 7000);
    return () => window.clearInterval(t);
  }, []);

  const fix = (i: number) => setCells((cs) => cs.map((c, k) => (k === i ? "ok" : c)));

  return (
    <Widget size="small" index={index} label="Shelf check">
      <WidgetHeader icon={<Grid20Filled />} tint="var(--ios-teal)" title="Shelf Check" subtitle="Beauty · Bay B3" />

      <div className="mt-1.5 flex items-baseline-last gap-2 whitespace-nowrap">
        <AnimatedNumber
          value={ok / FACINGS}
          format={{ style: "percent", maximumFractionDigits: 0 }}
          className={cn("text-[28px] leading-none font-semibold tracking-tight", perfect ? "text-ios-green" : "text-heading")}
        />
        <div className="mb-0.5 text-[10px] leading-tight">
          <div className="text-tertiary">to planogram</div>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={`${gaps}-${wrong}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className={cn("font-semibold", perfect ? "text-ios-green" : gaps ? "text-ios-red" : "text-ios-orange")}
            >
              {perfect ? "Bay compliant" : [gaps ? `${gaps} gap${gaps > 1 ? "s" : ""}` : null, wrong ? `${wrong} misplaced` : null].filter(Boolean).join(" · ")}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-auto rounded-lg bg-fill-quaternary px-1 pt-1 pb-0.5">
        {Array.from({ length: SHELVES }, (_, s) => (
          <div key={s} className="mb-0.5 last:mb-0">
            <div className="flex h-[22px] items-end gap-[3px]">
              {Array.from({ length: PER }, (_, k) => {
                const i = s * PER + k;
                const state = cells[i];
                const sku = SKUS[state === "wrong" ? WRONG_SKU : PLAN[i]];
                const want = SKUS[PLAN[i]];
                const tip =
                  state === "gap"
                    ? `Gap · ${want.name} · ${BACKROOM[PLAN[i]]} in back room · tap to refill`
                    : state === "wrong"
                      ? `Misplaced · ${sku.name} in ${want.name}'s facing · tap to fix`
                      : want.name;
                return (
                  <Tooltip key={k} title={tip}>
                    <button
                      type="button"
                      onClick={() => state !== "ok" && fix(i)}
                      aria-label={tip}
                      className={cn(
                        "relative flex h-full flex-1 items-end justify-center rounded-[3px]",
                        state === "ok" ? "cursor-default" : "cursor-pointer",
                      )}
                    >
                      <AnimatePresence mode="popLayout" initial={false}>
                        {state === "gap" ? (
                          <motion.span
                            key="gap"
                            className="absolute inset-0 grid place-items-center rounded-[3px] border border-dashed border-ios-red bg-ios-red/10 text-[10px] text-ios-red"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [1, 0.5, 1] }}
                            exit={{ opacity: 0 }}
                            transition={{ opacity: { duration: 1.6, repeat: Infinity } }}
                            whileHover={{ scale: 1.08 }}
                          >
                            <Add12Filled />
                          </motion.span>
                        ) : (
                          <motion.span
                            key={state === "wrong" ? "wrong" : "ok"}
                            className={cn("relative block", state === "wrong" && "ring-[1.5px] ring-ios-orange ring-offset-1 ring-offset-transparent")}
                            style={{
                              height: sku.h,
                              width: `${sku.w * 100}%`,
                              borderRadius: sku.r,
                              background: `linear-gradient(180deg, color-mix(in srgb, ${sku.color} 70%, white), ${sku.color})`,
                            }}
                            initial={{ y: -22, opacity: 0 }}
                            animate={{ y: 0, opacity: 1, rotate: state === "wrong" ? -8 : 0 }}
                            exit={{ opacity: 0, scale: 0.6 }}
                            transition={{ type: "spring", stiffness: 420, damping: 18, delay: cells === START ? delay + i * 0.025 : 0 }}
                          >
                            <span className="absolute inset-x-[20%] top-[3px] h-[2px] rounded-full bg-white/60" />
                            {state === "wrong" ? (
                              <ArrowSync16Regular className="absolute -top-2 -right-2 size-3 rounded-full bg-ios-orange p-px text-white" />
                            ) : null}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </Tooltip>
                );
              })}
            </div>
            <div className="h-[3px] rounded-full bg-fill" />
          </div>
        ))}
      </div>
    </Widget>
  );
}
