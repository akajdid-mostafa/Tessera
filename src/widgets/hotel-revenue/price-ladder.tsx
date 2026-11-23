import { Add16Filled, ArrowReset20Regular, Money20Filled, Subtract16Filled, Warning12Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type PointerEvent, useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { ROOM_TYPE, USD, usd } from "./_parts-b";

/** The stored master price: Best Available Rate (3021), Standard Double, Fri, Oct 16. */
const SAVED = 275;
const MIN = 150;
const MAX = 450;
const STEP = 5;
/** Past ±20% the change set carries a large_price_change warning. */
const LIMIT = 0.2;

/** The plans derived from the master, as the rate plan says: derived_from { op, type: "%", value }. */
const DERIVED = [
  { id: 3022, name: "Bed and Breakfast", op: "+" as const, value: 15 },
  { id: 3023, name: "Non-refundable", op: "-" as const, value: 10 },
];
const derive = (master: number, d: (typeof DERIVED)[number]) =>
  Math.round(master * (1 + (d.op === "+" ? d.value : -d.value) / 100));

/** Derived rows: height and gap in px (gap-1.5), so the branch elbows land on each row's center. */
const ROW_H = 52;
const ROW_GAP = 6;
const BRANCH_H = DERIVED.length * ROW_H + (DERIVED.length - 1) * ROW_GAP;
/** Corner radius of each elbow. */
const BEND = 5;
const branch = (i: number) => {
  const y = i * (ROW_H + ROW_GAP) + ROW_H / 2;
  return `M1 0 V${y - BEND} Q1 ${y} ${1 + BEND} ${y} H12`;
};

const clamp = (n: number) => Math.min(MAX, Math.max(MIN, Math.round(n / STEP) * STEP));
const at = (n: number) => (n - MIN) / (MAX - MIN);

/** Revenue · medium. The master rate and its derived plans; drag or step the master and the derived prices cascade, with a warning past ±20%. */
export function PriceLadderWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [price, setPrice] = useState(SAVED);
  // Each derived plan follows a beat after the one above it, so the change reads as a cascade.
  const [follow, setFollow] = useState<number[]>(DERIVED.map(() => SAVED));
  const timers = useRef<number[]>([]);
  const track = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    DERIVED.forEach((_, i) => {
      const t = window.setTimeout(() => {
        setFollow((f) => f.map((v, j) => (j === i ? price : v)));
      }, 110 * (i + 1));
      timers.current.push(t);
    });
    timers.current = timers.current.slice(-8);
  }, [price]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const change = price / SAVED - 1;
  const large = Math.abs(change) > LIMIT;
  const diff = price - SAVED;

  const fromPointer = (e: PointerEvent) => {
    const box = track.current?.getBoundingClientRect();
    if (!box) return;
    setPrice(clamp(MIN + ((e.clientX - box.left) / box.width) * (MAX - MIN)));
  };

  return (
    <Widget size="medium" index={index} label="Price ladder">
      <WidgetHeader
        icon={<Money20Filled />}
        tint="var(--ios-green)"
        title="Price Ladder"
        subtitle={`${ROOM_TYPE} · Fri, Oct 16`}
        extra={
          <AnimatePresence>
            {large ? (
              <motion.span
                key="warn"
                initial={{ opacity: 0, scale: 0.8, x: 6 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 460, damping: 22 }}
                className="mt-0.5 flex items-center gap-1 rounded-full bg-ios-orange/15 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-ios-orange"
              >
                <motion.span
                  className="grid place-items-center"
                  animate={{ rotate: [0, -12, 12, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.6 }}
                >
                  <Warning12Filled />
                </motion.span>
                Large price change
              </motion.span>
            ) : null}
          </AnimatePresence>
        }
      />

      <div className="mt-2.5 flex min-h-0 flex-1 gap-3">
        {/* Master */}
        <div className="flex w-[156px] shrink-0 flex-col">
          <div className="flex items-center gap-1.5 text-[11px] leading-none whitespace-nowrap text-tertiary">
            Best Available Rate
            <span className="rounded-[4px] bg-ios-green/15 px-1 py-px text-[9px] font-semibold tracking-wide text-ios-green uppercase">
              Master
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5 whitespace-nowrap">
            <AnimatedNumber
              value={price}
              format={USD}
              className={cn(
                "text-[28px] leading-none font-semibold tracking-tight transition-colors",
                large ? "text-ios-orange" : "text-heading",
              )}
            />
          </div>
          <div className="mt-0.5 flex h-4 items-center gap-1 text-[11px] whitespace-nowrap text-tertiary">
            {diff === 0 ? (
              <span>Saved price</span>
            ) : (
              <>
                <span className={cn("font-semibold tabular", large ? "text-ios-orange" : "text-secondary")}>
                  {diff > 0 ? "+" : "−"}
                  {usd(Math.abs(diff))} · {diff > 0 ? "+" : "−"}
                  {Math.abs(Math.round(change * 100))}%
                </span>
                <button
                  type="button"
                  onClick={() => setPrice(SAVED)}
                  aria-label={`Reset to ${usd(SAVED)}`}
                  className="grid size-4 cursor-pointer place-items-center rounded-full text-tertiary hover:bg-fill-secondary hover:text-heading"
                >
                  <ArrowReset20Regular className="size-3" />
                </button>
              </>
            )}
          </div>

          <div className="mt-auto flex items-center gap-1.5">
            <Button
              size="small"
              shape="circle"
              icon={<Subtract16Filled />}
              aria-label="Lower by $5"
              onClick={() => setPrice((p) => clamp(p - STEP))}
            />
            <div
              ref={track}
              role="slider"
              aria-label="Master price"
              aria-valuemin={MIN}
              aria-valuemax={MAX}
              aria-valuenow={price}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowUp") setPrice((p) => clamp(p + STEP));
                if (e.key === "ArrowLeft" || e.key === "ArrowDown") setPrice((p) => clamp(p - STEP));
              }}
              onPointerDown={(e) => {
                dragging.current = true;
                try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
                fromPointer(e);
              }}
              onPointerMove={(e) => dragging.current && fromPointer(e)}
              onPointerUp={() => (dragging.current = false)}
              onPointerCancel={() => (dragging.current = false)}
              className="relative h-6 flex-1 cursor-grab touch-none outline-none active:cursor-grabbing"
            >
              <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-fill-secondary" />
              {/* The ±20% band the price can move in without a warning. */}
              <span
                className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-ios-green/35"
                style={{ left: `${at(SAVED * (1 - LIMIT)) * 100}%`, right: `${(1 - at(SAVED * (1 + LIMIT))) * 100}%` }}
              />
              <span
                className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-tertiary"
                style={{ left: `${at(SAVED) * 100}%` }}
              />
              <motion.span
                className={cn(
                  "absolute top-1/2 -mt-[9px] -ml-[9px] size-[18px] rounded-full border-[3px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.35)]",
                  large ? "border-ios-orange" : "border-ios-green",
                )}
                initial={{ left: `${at(MIN) * 100}%`, scale: 0.4 }}
                animate={{ left: `${at(price) * 100}%`, scale: 1 }}
                transition={{ type: "spring", stiffness: 520, damping: 34, delay: entered ? 0 : delay }}
                onAnimationComplete={() => setEntered(true)}
              />
            </div>
            <Button
              size="small"
              shape="circle"
              icon={<Add16Filled />}
              aria-label="Raise by $5"
              onClick={() => setPrice((p) => clamp(p + STEP))}
            />
          </div>
        </div>

        {/* Derived */}
        <div className="relative flex min-w-0 flex-1 flex-col gap-1.5 pl-3">
          {/* Branches: one trunk down the left, a rounded elbow into each row's vertical center. */}
          <svg
            aria-hidden
            className="absolute top-0 left-0 overflow-visible"
            width={12}
            height={BRANCH_H}
            viewBox={`0 0 12 ${BRANCH_H}`}
          >
            {DERIVED.map((d, i) => (
              <motion.path
                key={d.id}
                d={branch(i)}
                fill="none"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-fill"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: delay + 0.1 + i * 0.08 }}
              />
            ))}
          </svg>
          {DERIVED.map((d, i) => (
            <motion.div
              key={d.id}
              style={{ height: ROW_H }}
              className="relative flex items-center gap-2 rounded-[12px] bg-fill-tertiary px-2.5"
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 26, delay: delay + 0.15 + i * 0.08 }}
            >
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[12px] font-semibold text-heading">{d.name}</div>
                <div className="truncate text-[11px] text-tertiary">
                  BAR {d.op === "+" ? "+" : "−"}
                  {d.value}%
                </div>
              </div>
              <AnimatedNumber
                value={derive(follow[i], d)}
                format={USD}
                className={cn(
                  "shrink-0 text-[16px] leading-none font-semibold tracking-tight",
                  large ? "text-ios-orange" : "text-heading",
                )}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </Widget>
  );
}
