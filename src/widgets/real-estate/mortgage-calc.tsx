import { Calculator20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type KeyboardEvent, type PointerEvent, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

const PRICE = 685_000;
type Term = "15Y" | "30Y";
const TERMS: Record<Term, { years: number; apr: number }> = {
  "15Y": { years: 15, apr: 0.0571 },
  "30Y": { years: 30, apr: 0.0642 },
};
/** Down payment range, as a share of the price. */
const MIN_DOWN = 0.05;
const MAX_DOWN = 0.4;
/** Below this, the lender adds mortgage insurance. */
const PMI_BELOW = 0.2;
const PMI_RATE = 0.0058;
const TAX_RATE = 0.011;
const INSURANCE = 145;

type Part = { key: string; label: string; value: number; bar: string; dot: string };

function monthly(down: number, term: Term) {
  const loan = PRICE * (1 - down);
  const r = TERMS[term].apr / 12;
  const n = TERMS[term].years * 12;
  const pi = (loan * r) / (1 - (1 + r) ** -n);
  const interest = loan * r;
  const parts: Part[] = [
    { key: "principal", label: "Principal", value: pi - interest, bar: "bg-ios-teal", dot: "bg-ios-teal" },
    { key: "interest", label: "Interest", value: interest, bar: "bg-ios-indigo", dot: "bg-ios-indigo" },
    { key: "tax", label: "Tax", value: (PRICE * TAX_RATE) / 12, bar: "bg-ios-orange", dot: "bg-ios-orange" },
    { key: "insurance", label: "Insurance", value: INSURANCE, bar: "bg-ios-yellow", dot: "bg-ios-yellow" },
  ];
  if (down < PMI_BELOW) {
    parts.push({ key: "pmi", label: "PMI", value: (loan * PMI_RATE) / 12, bar: "bg-ios-red", dot: "bg-ios-red" });
  }
  const total = parts.reduce((s, p) => s + p.value, 0);
  const lifetimeInterest = pi * n - loan;
  return { loan, parts, total, lifetimeInterest };
}

const USD0 = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const;
const USDK = { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 0 } as const;

/** Real estate · medium. Monthly payment for a listing; drag the down payment or switch the term and the hero, the split bar and PMI respond. */
export function MortgageCalcWidget({ index }: { index?: number }) {
  const [down, setDown] = useState(0.2);
  const [term, setTerm] = useState<Term>("30Y");
  const [dragging, setDragging] = useState(false);
  /** The entrance delay applies once; after any change everything answers at once. */
  const [touched, setTouched] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const delay = touched ? 0 : 0.3 + (index ?? 0) * 0.06;

  const { loan, parts, total, lifetimeInterest } = monthly(down, term);
  const share = (down - MIN_DOWN) / (MAX_DOWN - MIN_DOWN);
  const pmiAt = (PMI_BELOW - MIN_DOWN) / (MAX_DOWN - MIN_DOWN);

  const setFromPointer = (clientX: number) => {
    const el = track.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    setTouched(true);
    setDown(Math.round((MIN_DOWN + t * (MAX_DOWN - MIN_DOWN)) * 100) / 100);
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setDragging(true);
    setFromPointer(e.clientX);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging) setFromPointer(e.clientX);
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    setDragging(false);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowUp" ? 0.01 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -0.01 : 0;
    if (!step) return;
    e.preventDefault();
    setTouched(true);
    setDown((d) => Math.min(MAX_DOWN, Math.max(MIN_DOWN, Math.round((d + step) * 100) / 100)));
  };

  return (
    <Widget size="medium" index={index} label="Mortgage calculator">
      <WidgetHeader
        icon={<Calculator20Filled />}
        tint="var(--ios-teal)"
        title="Cedar Row Townhouse"
        subtitle={`$685K list · ${(TERMS[term].apr * 100).toFixed(2)}% APR`}
        extra={
          <Segmented size="small" value={term} onChange={(v) => {
              setTerm(v as Term);
              setTouched(true);
            }} options={["15Y", "30Y"]} />
        }
      />

      <div className="mt-2.5 flex items-baseline-last gap-2">
        <div className="flex items-baseline gap-1">
          <AnimatedNumber
            value={total}
            format={USD0}
            className="text-[28px] leading-none font-semibold tracking-tight text-heading"
          />
          <span className="text-[12px] text-tertiary">/mo</span>
        </div>
        <div className="mb-0.5 ml-auto text-right text-[11px] leading-tight text-tertiary">
          <div>
            Loan <AnimatedNumber value={loan} format={USDK} className="font-semibold text-secondary" />
          </div>
          <div>
            Interest over term <AnimatedNumber value={lifetimeInterest} format={USDK} className="font-semibold text-secondary" />
          </div>
        </div>
      </div>

      <div className="mt-2 flex h-2 gap-[2px] overflow-hidden rounded-full">
        <AnimatePresence initial={false}>
          {parts.map((p, i) => (
            <Tooltip key={p.key} title={`${p.label} · $${Math.round(p.value).toLocaleString("en-US")}/mo`}>
              <motion.span
                layout
                className={cn("h-full rounded-[2px] hover:brightness-110", p.bar)}
                initial={{ flexGrow: 0, opacity: 0 }}
                animate={{ flexGrow: p.value, opacity: 1 }}
                exit={{ flexGrow: 0, opacity: 0 }}
                style={{ flexBasis: 0 }}
                transition={{ type: "spring", stiffness: 120, damping: 20, delay: touched ? 0 : delay + i * 0.05 }}
              />
            </Tooltip>
          ))}
        </AnimatePresence>
      </div>
      <div className="mt-1.5 flex gap-2.5 text-[10px] text-tertiary">
        <AnimatePresence initial={false} mode="popLayout">
          {parts.map((p) => (
            <motion.span
              key={p.key}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={cn("flex items-center gap-1 whitespace-nowrap", p.key === "pmi" && "font-semibold text-ios-red")}
            >
              <span className={cn("size-1.5 rounded-full", p.dot)} />
              {p.label}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-auto">
        <div className="mb-1.5 flex items-baseline justify-between text-[11px] text-tertiary">
          <span>Down payment</span>
          <span>
            <AnimatedNumber value={down} format={{ style: "percent", maximumFractionDigits: 0 }} className="font-semibold text-heading" />
            {" · "}
            <AnimatedNumber value={PRICE * down} format={USDK} className="text-secondary" />
          </span>
        </div>
        <div
          ref={track}
          role="slider"
          tabIndex={0}
          aria-label="Down payment"
          aria-valuemin={MIN_DOWN * 100}
          aria-valuemax={MAX_DOWN * 100}
          aria-valuenow={Math.round(down * 100)}
          aria-valuetext={`${Math.round(down * 100)} percent down`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          className="relative h-4 cursor-pointer touch-none outline-none"
        >
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-fill-secondary" />
          <motion.div
            className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-ios-teal"
            initial={{ width: 0 }}
            animate={{ width: `${share * 100}%` }}
            transition={dragging ? { duration: 0 } : { type: "spring", stiffness: 160, damping: 22, delay }}
          />
          <span
            className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-[var(--ant-color-text-tertiary)]"
            style={{ left: `${pmiAt * 100}%` }}
          />
          <motion.span
            className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.3)] ring-1 ring-black/5"
            initial={{ left: "0%" }}
            animate={{ left: `${share * 100}%`, scale: dragging ? 1.2 : 1 }}
            transition={
              dragging
                ? { left: { duration: 0 }, scale: { type: "spring", stiffness: 500, damping: 24 } }
                : { type: "spring", stiffness: 160, damping: 22, delay }
            }
          />
        </div>
      </div>
    </Widget>
  );
}
