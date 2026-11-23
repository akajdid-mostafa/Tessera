import { Money20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";

type Month = "sep" | "oct" | "nov";
type Kind = "start" | "new" | "exp" | "con" | "churn" | "end";
type Row = { name: string; note: string; amount: number | string };
type Step = { kind: Kind; value: number; count: number; rows: Row[] };

const KINDS: { kind: Kind; label: string; title: string; bar: string; text: string }[] = [
  { kind: "start", label: "Start", title: "Opening MRR", bar: "bg-fill", text: "text-heading" },
  { kind: "new", label: "New", title: "New business", bar: "bg-ios-green", text: "text-ios-green" },
  { kind: "exp", label: "Expansion", title: "Expansion", bar: "bg-ios-teal", text: "text-ios-teal" },
  { kind: "con", label: "Contraction", title: "Contraction", bar: "bg-ios-orange", text: "text-ios-orange" },
  { kind: "churn", label: "Churn", title: "Churned", bar: "bg-ios-red", text: "text-ios-red" },
  { kind: "end", label: "End", title: "Closing MRR", bar: "bg-ios-indigo", text: "text-heading" },
];

/** Values in $k. Each month's deltas sum to its closing MRR. */
const DATA: Record<Month, { label: string; steps: Step[] }> = {
  sep: {
    label: "September",
    steps: [
      { kind: "start", value: 451.0, count: 1241, rows: [{ name: "Customers", note: "paying accounts", amount: "1,241" }, { name: "ARPA", note: "avg revenue per account", amount: "$363" }, { name: "Trials", note: "converting this month", amount: "212" }] },
      { kind: "new", value: 18.9, count: 34, rows: [{ name: "Juniper Analytics", note: "Scale · annual", amount: 3.6 }, { name: "Harbor Clinics", note: "Business · 80 seats", amount: 2.4 }, { name: "Vela Studios", note: "Team · monthly", amount: 1.1 }] },
      { kind: "exp", value: 9.7, count: 22, rows: [{ name: "Meridian Retail", note: "seats 90 → 120", amount: 1.9 }, { name: "Kestrel Media", note: "added SSO add-on", amount: 1.2 }, { name: "Fernhill Bank", note: "Team → Business", amount: 0.9 }] },
      { kind: "con", value: -6.2, count: 15, rows: [{ name: "Ashgrove Studio", note: "Business → Team", amount: -1.4 }, { name: "Pinecrest Legal", note: "seats 40 → 25", amount: -0.9 }, { name: "Orbit Fitness", note: "dropped add-on", amount: -0.6 }] },
      { kind: "churn", value: -9.2, count: 12, rows: [{ name: "Sable & Co", note: "budget cut", amount: -2.1 }, { name: "Lumen Events", note: "seasonal pause", amount: -1.6 }, { name: "Tidewater Co", note: "moved to competitor", amount: -1.2 }] },
      { kind: "end", value: 464.2, count: 1263, rows: [{ name: "Customers", note: "net new logos +22", amount: "1,263" }, { name: "ARPA", note: "up $5 on August", amount: "$368" }, { name: "Net retention", note: "trailing 12 months", amount: "104%" }] },
    ],
  },
  oct: {
    label: "October",
    steps: [
      { kind: "start", value: 464.2, count: 1263, rows: [{ name: "Customers", note: "paying accounts", amount: "1,263" }, { name: "ARPA", note: "avg revenue per account", amount: "$368" }, { name: "Trials", note: "converting this month", amount: "248" }] },
      { kind: "new", value: 21.8, count: 41, rows: [{ name: "Larkspur Labs", note: "Scale · annual", amount: 4.8 }, { name: "Brightwave Health", note: "Business · 120 seats", amount: 3.2 }, { name: "Okto Freight", note: "Business · monthly", amount: 2.6 }] },
      { kind: "exp", value: 12.6, count: 27, rows: [{ name: "Meridian Retail", note: "seats 120 → 180", amount: 3.9 }, { name: "Kestrel Media", note: "Team → Business", amount: 2.1 }, { name: "Fernhill Bank", note: "added audit logs", amount: 1.7 }] },
      { kind: "con", value: -4.9, count: 11, rows: [{ name: "Quillon Data", note: "seats 60 → 35", amount: -1.6 }, { name: "Corva Travel", note: "Business → Team", amount: -1.1 }, { name: "Rowan Schools", note: "dropped add-on", amount: -0.8 }] },
      { kind: "churn", value: -11.1, count: 13, rows: [{ name: "Nimbus Outfitters", note: "built in-house", amount: -3.4 }, { name: "Halden Group", note: "acquired", amount: -2.2 }, { name: "Marlow Cafés", note: "card failed ×3", amount: -1.9 }] },
      { kind: "end", value: 482.6, count: 1291, rows: [{ name: "Customers", note: "net new logos +28", amount: "1,291" }, { name: "ARPA", note: "up $6 on September", amount: "$374" }, { name: "Net retention", note: "trailing 12 months", amount: "108%" }] },
    ],
  },
  nov: {
    label: "November, to date",
    steps: [
      { kind: "start", value: 482.6, count: 1291, rows: [{ name: "Customers", note: "paying accounts", amount: "1,291" }, { name: "ARPA", note: "avg revenue per account", amount: "$374" }, { name: "Trials", note: "converting this month", amount: "231" }] },
      { kind: "new", value: 6.4, count: 12, rows: [{ name: "Cobalt Robotics", note: "Scale · annual", amount: 2.2 }, { name: "Wrenfield Hotels", note: "Business · 40 seats", amount: 1.3 }, { name: "Atlas Dental", note: "Team · monthly", amount: 0.6 }] },
      { kind: "exp", value: 3.1, count: 7, rows: [{ name: "Brightwave Health", note: "seats 120 → 150", amount: 1.2 }, { name: "Larkspur Labs", note: "added SSO add-on", amount: 0.8 }, { name: "Okto Freight", note: "Business → Scale", amount: 0.6 }] },
      { kind: "con", value: -1.2, count: 4, rows: [{ name: "Pinecrest Legal", note: "seats 25 → 18", amount: -0.5 }, { name: "Orbit Fitness", note: "Business → Team", amount: -0.4 }, { name: "Vela Studios", note: "dropped add-on", amount: -0.2 }] },
      { kind: "churn", value: -5.8, count: 3, rows: [{ name: "Granite Logistics", note: "consolidated vendors", amount: -4.6 }, { name: "Lumen Events", note: "seasonal pause", amount: -0.7 }, { name: "Marlow Cafés", note: "card failed ×3", amount: -0.5 }] },
      { kind: "end", value: 485.1, count: 1300, rows: [{ name: "Customers", note: "net new logos +9", amount: "1,300" }, { name: "ARPA", note: "flat on October", amount: "$373" }, { name: "Biggest risk", note: "Granite was 1% of MRR", amount: "−$4.6k" }] },
    ],
  },
};

/** The axis does not start at zero: the opening and closing bars are cut, so the movements read. */
const Y_MIN = 430;
const Y_MAX = 510;
const pct = (v: number) => ((Y_MAX - v) / (Y_MAX - Y_MIN)) * 100;
const money = (k: number, sign = false) => `${sign ? (k < 0 ? "−" : "+") : ""}$${Math.abs(k).toFixed(1)}k`;

/** Lay the steps out as floating bars: each delta hangs from the running total. */
function layout(steps: Step[]) {
  let run = 0;
  return steps.map((s) => {
    if (s.kind === "start" || s.kind === "end") {
      run = s.value;
      return { top: pct(s.value), bottom: 100, level: s.value };
    }
    const from = run;
    run = +(run + s.value).toFixed(1);
    return { top: pct(Math.max(from, run)), bottom: pct(Math.min(from, run)), level: run };
  });
}

/** SaaS · large. An MRR waterfall from opening to closing; hover a movement to see the accounts behind it, switch months to re-flow the bars. */
export function MrrMovementWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [month, setMonth] = useState<Month>("oct");
  const [sel, setSel] = useState(1);
  const [pinned, setPinned] = useState(1);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), (delay + 1) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  const d = DATA[month];
  const bars = layout(d.steps);
  const start = d.steps[0].value;
  const end = d.steps[5].value;
  const net = +(end - start).toFixed(1);
  const gained = d.steps[1].value + d.steps[2].value;
  const lost = -(d.steps[3].value + d.steps[4].value);
  const quick = gained / lost;
  const step = d.steps[sel];
  const k = KINDS[sel];

  return (
    <Widget size="large" index={index} label="MRR movement">
      <WidgetHeader
        icon={<Money20Filled />}
        tint="var(--ios-green)"
        title="MRR Movement"
        subtitle={d.label}
        extra={
          <Segmented
            size="small"
            value={month}
            onChange={(v) => setMonth(v as Month)}
            options={[
              { label: "Sep", value: "sep" },
              { label: "Oct", value: "oct" },
              { label: "Nov", value: "nov" },
            ]}
          />
        }
      />

      <div className="mt-3 flex items-baseline-last justify-between gap-3">
        <div className="min-w-0 leading-none">
          <div className="text-[11px] text-tertiary">Closing MRR</div>
          <div className="mt-1.5 flex items-baseline gap-2 whitespace-nowrap">
            <AnimatedNumber
              value={end * 1000}
              format={{ style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }}
              className="text-[30px] font-semibold tracking-tight text-heading"
            />
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular transition-colors duration-500",
                net >= 0 ? "bg-ios-green/15 text-ios-green" : "bg-ios-red/15 text-ios-red",
              )}
            >
              {money(net, true)} · {((net / start) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right leading-none">
          <div className="text-[11px] text-tertiary">Quick ratio</div>
          <AnimatedNumber
            value={quick}
            format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            className={cn(
              "mt-1.5 block text-[20px] font-semibold tracking-tight transition-colors duration-500",
              quick < 1.5 ? "text-ios-orange" : "text-heading",
            )}
          />
        </div>
      </div>

      {/* The waterfall. Bars are HTML so their labels stay crisp; connectors are a stretched SVG. */}
      <div className="mt-3 flex min-h-0 flex-1 flex-col" onMouseLeave={() => setSel(pinned)}>
        <div className="relative min-h-0 flex-1">
          <svg viewBox="0 0 600 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
            {bars.slice(0, -1).map((b, i) => {
              const y = pct(b.level);
              return (
                <motion.line
                  key={i}
                  x1={i * 100 + 88}
                  x2={i * 100 + 112}
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  vectorEffect="non-scaling-stroke"
                  style={{ stroke: "var(--ant-color-text-tertiary)" }}
                  initial={{ opacity: 0, y1: y, y2: y }}
                  animate={{ opacity: 0.8, y1: y, y2: y }}
                  transition={{ opacity: { delay: entered ? 0 : delay + 0.5 + i * 0.08 }, default: { type: "spring", stiffness: 160, damping: 22 } }}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 grid grid-cols-6">
            {d.steps.map((s, i) => {
              const b = bars[i];
              const kind = KINDS[i];
              const down = s.value < 0;
              const dim = sel !== i;
              const total = s.kind === "start" || s.kind === "end";
              return (
                <button
                  key={s.kind}
                  type="button"
                  aria-label={kind.title}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => {
                    setSel(i);
                    setPinned(i);
                  }}
                  className="relative h-full cursor-pointer"
                >
                  <motion.div
                    className="absolute inset-x-[12%]"
                    initial={false}
                    animate={{ top: `${b.top}%`, height: `${b.bottom - b.top}%` }}
                    transition={{ type: "spring", stiffness: 160, damping: 22 }}
                  >
                    <motion.div
                      className={cn("absolute inset-0 rounded-[5px] transition-opacity duration-300", kind.bar, dim && "opacity-45")}
                      style={{ originY: down ? 0 : 1 }}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      whileHover={{ scaleX: 1.06 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20, delay: entered ? 0 : delay + i * 0.09 }}
                    />
                    {total ? (
                      // A cut through the bar: this axis starts at $430k.
                      <span className="absolute inset-x-0 bottom-2 h-[3px] -skew-y-6 bg-[var(--widget-surface)]" />
                    ) : null}
                    <motion.span
                      className={cn(
                        "absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold tabular",
                        down ? "top-full mt-0.5" : "bottom-full mb-0.5",
                        dim ? "text-tertiary" : kind.text,
                      )}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: entered ? 0 : delay + 0.4 + i * 0.09 }}
                    >
                      {money(s.value, !total)}
                    </motion.span>
                  </motion.div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-1 grid grid-cols-6 border-t-[0.5px] border-split pt-1">
          {KINDS.map((x, i) => (
            <span
              key={x.kind}
              className={cn(
                "truncate text-center text-[10px] transition-colors duration-200",
                sel === i ? "font-semibold text-heading" : "text-tertiary",
              )}
            >
              {x.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-2.5 h-[86px] shrink-0 rounded-xl bg-fill-quaternary px-3 py-2">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`${month}-${sel}`}
            initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex h-[18px] items-center gap-1.5 whitespace-nowrap text-[12px]">
              <span className={cn("size-2 shrink-0 rounded-full", k.bar)} />
              <span className="font-semibold text-heading">{k.title}</span>
              <span className="ml-auto text-[11px] text-tertiary tabular">
                {step.kind === "start" || step.kind === "end"
                  ? money(step.value)
                  : `${money(step.value, true)} · ${step.count} accounts`}
              </span>
            </div>
            <ul className="mt-1">
              {step.rows.map((r) => (
                <li key={r.name} className="flex h-[19px] items-center gap-2 whitespace-nowrap text-[12px]">
                  <span className="shrink-0 font-medium text-heading">{r.name}</span>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-tertiary">{r.note}</span>
                  <span
                    className={cn(
                      "shrink-0 font-semibold tabular",
                      typeof r.amount === "number" ? (r.amount < 0 ? "text-ios-red" : "text-ios-green") : "text-secondary",
                    )}
                  >
                    {typeof r.amount === "number" ? money(r.amount, true) : r.amount}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>
    </Widget>
  );
}
