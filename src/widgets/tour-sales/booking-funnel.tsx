import { Flow20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Range = "7D" | "30D" | "90D";
const DAYS: Record<Range, number> = { "7D": 7, "30D": 30, "90D": 90 };

/** A booking's lifecycle, each stage tinted with the status color the product uses. */
const STAGES = [
  { key: "request", label: "Request", color: "indigo", text: "text-ios-indigo" },
  { key: "option", label: "Option", color: "orange", text: "text-ios-orange" },
  { key: "confirmed", label: "Confirmed", color: "green", text: "text-ios-green" },
  { key: "completed", label: "Completed", color: "teal", text: "text-ios-teal" },
] as const;
const LAST = STAGES.length - 1;

/** Bookings that reached each stage, and why the cancelled ones fell out. */
const DATA: Record<Range, { reached: number[]; cancelled: { customer: number; weather: number; operator: number } }> = {
  "7D": { reached: [38, 29, 22, 9], cancelled: { customer: 2, weather: 1, operator: 1 } },
  "30D": { reached: [148, 109, 86, 52], cancelled: { customer: 9, weather: 4, operator: 2 } },
  "90D": { reached: [412, 296, 238, 171], cancelled: { customer: 22, weather: 12, operator: 7 } },
};
const REASONS = [
  { key: "customer", label: "Customer", color: "bg-ios-purple" },
  { key: "weather", label: "Weather", color: "bg-ios-blue" },
  { key: "operator", label: "Operator", color: "bg-ios-pink" },
] as const;

/* Chart geometry, at the large content box's real width so nothing scales. */
const W = 376;
const CH = 160;
const TOP = 18;
const COL = 56;
const STEP = (W - COL) / LAST;
const colX = (i: number) => i * STEP;

const ribbon = (i: number, a: number, b: number) => {
  const ax = colX(i) + COL;
  const bx = colX(i + 1);
  const mx = (ax + bx) / 2;
  return `M${ax},${a} C${mx},${a} ${mx},${b} ${bx},${b} L${bx},${CH} L${ax},${CH} Z`;
};

const PCT = { style: "percent", maximumFractionDigits: 1 } as const;

/** Tour sales · large. Request → option → confirmed → completed as rising columns joined by flow ribbons, with drop-offs and cancellation reasons; the range re-flows and hovering a stage reads its conversion. */
export function BookingFunnelWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const uid = useId().replace(/:/g, "");
  const [range, setRange] = useState<Range>("90D");
  const [active, setActive] = useState<number>(LAST);
  const { reached, cancelled } = DATA[range];
  const tops = reached.map((n) => CH - (n / reached[0]) * (CH - TOP));
  const stage = STAGES[active];
  const count = reached[active];
  const step = active === 0 ? 1 : count / reached[active - 1];
  const ofRequests = count / reached[0];
  const cancelTotal = cancelled.customer + cancelled.weather + cancelled.operator;

  return (
    <Widget size="large" index={index} label="Booking lifecycle">
      <WidgetHeader
        icon={<Flow20Filled />}
        tint="var(--ios-teal)"
        title="Booking lifecycle"
        subtitle={`Kaibab Yonder · last ${DAYS[range]} days`}
        extra={
          <Segmented
            size="small"
            value={range}
            onChange={(v) => setRange(v as Range)}
            options={["7D", "30D", "90D"]}
          />
        }
      />

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={stage.key}
              initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(3px)" }}
              transition={{ duration: 0.2 }}
              className={cn("text-[11px] leading-[14px] font-semibold", stage.text)}
            >
              {stage.label}
            </motion.div>
          </AnimatePresence>
          <div className="flex items-baseline gap-1.5">
            <AnimatedNumber
              value={count}
              className="text-[32px] leading-none font-semibold tracking-tight text-heading"
            />
            <span className="text-[12px] text-tertiary">bookings</span>
          </div>
        </div>
        <div className="mb-0.5 shrink-0 text-right text-[11px] leading-[15px] text-tertiary">
          <div>
            <AnimatedNumber value={step} format={PCT} className="font-semibold text-heading" />{" "}
            {active === 0 ? "baseline" : `from ${STAGES[active - 1].label.toLowerCase()}`}
          </div>
          <div>
            {active === 0 ? (
              <>
                <AnimatedNumber
                  value={count / DAYS[range]}
                  format={{ maximumFractionDigits: 1 }}
                  className="font-semibold text-secondary"
                />{" "}
                a day
              </>
            ) : (
              <>
                <AnimatedNumber value={ofRequests} format={PCT} className="font-semibold text-secondary" /> of requests
              </>
            )}
          </div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${CH}`}
        className="mt-2 block h-[160px] w-full shrink-0 overflow-visible"
        onPointerLeave={() => setActive(LAST)}
        role="img"
        aria-label="Bookings reaching each stage"
      >
        <defs>
          {STAGES.slice(0, LAST).map((s, i) => (
            <linearGradient key={s.key} id={`${uid}-r${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={`var(--ios-${s.color})`} stopOpacity={0.3} />
              <stop offset="100%" stopColor={`var(--ios-${STAGES[i + 1].color})`} stopOpacity={0.3} />
            </linearGradient>
          ))}
        </defs>
        <line x1={0} x2={W} y1={CH - 0.5} y2={CH - 0.5} stroke="var(--ant-color-split)" />

        {STAGES.slice(0, LAST).map((s, i) => {
          const d = ribbon(i, tops[i], tops[i + 1]);
          const drop = 1 - reached[i + 1] / reached[i];
          const lit = active === i || active === i + 1;
          return (
            <g key={s.key}>
              <motion.path
                d={d}
                fill={`url(#${uid}-r${i})`}
                initial={{ d: ribbon(i, CH, CH), opacity: 0 }}
                animate={{ d, opacity: lit ? 1 : 0.55 }}
                transition={{
                  d: { type: "spring", stiffness: 120, damping: 20, delay: delay + 0.15 + i * 0.12 },
                  opacity: { duration: 0.25 },
                }}
              />
              <motion.text
                x={colX(i) + COL + (STEP - COL) / 2}
                textAnchor="middle"
                fontSize={10}
                fontWeight={600}
                fill="var(--ios-red)"
                className="tabular"
                initial={{ y: tops[i] - 6, opacity: 0 }}
                animate={{ y: tops[i] - 6, opacity: 1 }}
                transition={{
                  y: { type: "spring", stiffness: 120, damping: 20 },
                  opacity: { delay: delay + 0.6 + i * 0.12 },
                }}
              >
                −{Math.round(drop * 100)}%
              </motion.text>
            </g>
          );
        })}

        {STAGES.map((s, i) => {
          const h = CH - tops[i];
          return (
            <motion.rect
              key={s.key}
              x={colX(i)}
              width={COL}
              rx={9}
              fill={`var(--ios-${s.color})`}
              initial={{ y: CH, height: 0 }}
              animate={{ y: tops[i], height: h, opacity: active === i ? 1 : 0.42 }}
              transition={{
                y: { type: "spring", stiffness: 140, damping: 20, delay: delay + i * 0.12 },
                height: { type: "spring", stiffness: 140, damping: 20, delay: delay + i * 0.12 },
                opacity: { duration: 0.2 },
              }}
            />
          );
        })}

        {STAGES.map((s, i) => (
          <rect
            key={s.key}
            x={Math.max(0, colX(i) - (STEP - COL) / 2)}
            width={Math.min(W, colX(i) + COL + (STEP - COL) / 2) - Math.max(0, colX(i) - (STEP - COL) / 2)}
            y={0}
            height={CH}
            fill="transparent"
            onPointerEnter={() => setActive(i)}
          />
        ))}
      </svg>

      <div className="mt-1.5 flex justify-between">
        {STAGES.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onFocus={() => setActive(i)}
            onMouseEnter={() => setActive(i)}
            className="w-[56px] cursor-default text-center leading-[14px] whitespace-nowrap outline-none"
          >
            <div
              className={cn(
                "text-[11px] transition-colors duration-200",
                active === i ? "font-semibold text-heading" : "text-tertiary",
              )}
            >
              {s.label}
            </div>
            <AnimatedNumber value={reached[i]} className="text-[11px] font-medium text-secondary" />
          </button>
        ))}
      </div>

      <div className="mt-auto border-t-[0.5px] border-split pt-2.5">
        <div className="flex items-baseline justify-between text-[12px]">
          <span className="font-semibold text-heading">Cancellations</span>
          <span className="text-[11px] text-tertiary tabular">
            <AnimatedNumber value={cancelTotal} className="font-semibold text-secondary" /> ·{" "}
            <AnimatedNumber value={cancelTotal / reached[0]} format={PCT} /> of requests
          </span>
        </div>
        <div className="mt-1.5 flex h-2 gap-[2px] overflow-hidden rounded-full">
          {REASONS.map((r, i) => (
            <Tooltip key={r.key} title={`${r.label} · ${Math.round((cancelled[r.key] / cancelTotal) * 100)}% of cancellations`}>
              <motion.span
                className={cn("h-full rounded-full", r.color)}
                initial={{ flexGrow: 0 }}
                animate={{ flexGrow: cancelled[r.key] }}
                transition={{ type: "spring", stiffness: 120, damping: 20, delay: delay + 0.5 + i * 0.08 }}
                style={{ flexBasis: 0 }}
              />
            </Tooltip>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] leading-[14px]">
          {REASONS.map((r) => (
            <span key={r.key} className="flex items-center gap-1.5 text-tertiary">
              <span className={cn("size-2 rounded-full", r.color)} />
              {r.label}
              <AnimatedNumber value={cancelled[r.key]} className="font-semibold text-secondary" />
            </span>
          ))}
        </div>
      </div>
    </Widget>
  );
}
