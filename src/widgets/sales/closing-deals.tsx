import { Handshake20Filled, Warning16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Stage = "Proposal" | "Negotiation" | "Contract sent";
type Deal = {
  id: string;
  company: string;
  owner: string;
  stage: Stage;
  amount: number;
  prob: number;
  /** Days from today (Nov 9). */
  close: number;
  activity: string;
};

const STAGE_TONE: Record<Stage, string> = {
  Proposal: "bg-ios-blue/15 text-ios-blue",
  Negotiation: "bg-ios-purple/15 text-ios-purple",
  "Contract sent": "bg-ios-teal/15 text-ios-teal",
};

const DEALS: Deal[] = [
  { id: "nw", company: "Northwind Logistics", owner: "Maya Chen", stage: "Negotiation", amount: 84_000, prob: 0.7, close: 3, activity: "Pricing call yesterday" },
  { id: "hh", company: "Halcyon Health", owner: "Diego Ramos", stage: "Contract sent", amount: 126_500, prob: 0.8, close: 5, activity: "Redlines with their legal" },
  { id: "bm", company: "Brightline Media", owner: "Priya Natarajan", stage: "Proposal", amount: 42_800, prob: 0.4, close: 10, activity: "Proposal opened 4× today" },
];
const SLIP_ID = "hh";
const SLIP_TO = 25;

const dateLabel = (days: number) =>
  new Date(2026, 10, 9 + days).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const USD_K = { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 } as const;

/** Sales · medium. Deals due to close this month; a slipping deal flips red live; sort by date or value. */
export function ClosingDealsWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [sort, setSort] = useState<"Date" | "Value">("Date");
  const [slipped, setSlipped] = useState(false);

  // A few seconds in, the buyer pushes the close into December.
  useEffect(() => {
    const t = window.setTimeout(() => setSlipped(true), (delay + 3.2) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  const rows = useMemo(() => {
    const list = DEALS.map((d) => (d.id === SLIP_ID && slipped ? { ...d, close: SLIP_TO } : d));
    return list.sort((a, b) => (sort === "Date" ? a.close - b.close : b.amount - a.amount));
  }, [sort, slipped]);

  const inMonth = rows.filter((d) => d.close <= 21);
  const weighted = inMonth.reduce((s, d) => s + d.amount * d.prob, 0);

  return (
    <Widget size="medium" index={index} label="Deals closing this month">
      <WidgetHeader
        icon={<Handshake20Filled />}
        tint="var(--ios-purple)"
        title="Closing in November"
        subtitle={
          <span className="tabular">
            {inMonth.length} deals · <AnimatedNumber value={weighted} format={USD_K} /> weighted
          </span>
        }
        extra={
          <Segmented size="small" value={sort} onChange={(v) => setSort(v as "Date" | "Value")} options={["Date", "Value"]} />
        }
      />

      <ul className="mt-1.5 flex flex-col gap-2">
        {rows.map((d, i) => {
          const slip = d.id === SLIP_ID && slipped;
          return (
            <motion.li
              key={d.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                layout: { type: "spring", stiffness: 380, damping: 34 },
                default: { type: "spring", stiffness: 380, damping: 28, delay: delay + i * 0.07 },
              }}
              className={cn(
                "relative -mx-1.5 flex h-[40px] items-center gap-2.5 rounded-[8px] px-1.5",
                i > 0 && "before:absolute before:inset-x-1.5 before:-top-1 before:h-[0.5px] before:bg-split",
              )}
            >
              <MemojiAvatar who={d.owner} size={26} className="relative" />
              <div className="relative min-w-0 flex-1 leading-tight">
                <div className="flex items-center gap-1">
                  <span className="truncate text-[12px] font-medium text-heading">{d.company}</span>
                  {slip ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 16 }}
                      className="grid shrink-0 text-[12px] text-ios-red"
                    >
                      <Warning16Filled className="size-3" />
                    </motion.span>
                  ) : null}
                </div>
                <div className="truncate text-[10px] text-tertiary tabular">
                  {d.owner} · {Math.round(d.prob * 100)}%
                </div>
              </div>
              <span
                className={cn(
                  "relative w-[84px] shrink-0 truncate rounded-full px-1.5 py-0.5 text-center text-[10px] font-medium",
                  STAGE_TONE[d.stage],
                )}
              >
                {d.stage}
              </span>
              <Tooltip
                title={slip ? `Close moved Nov 14 → ${dateLabel(SLIP_TO)} · 2nd slip this quarter` : d.activity}
              >
                <div className="relative w-[50px] shrink-0 cursor-default text-right leading-tight">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                      key={d.close}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className={cn("text-[11px] font-medium tabular", slip ? "text-ios-red" : "text-heading")}
                    >
                      {dateLabel(d.close)}
                    </motion.div>
                  </AnimatePresence>
                  <div className={cn("text-[10px] tabular", slip ? "font-medium text-ios-red" : "text-tertiary")}>
                    {slip ? "Slipped" : `in ${d.close}d`}
                  </div>
                </div>
              </Tooltip>
              <span
                className={cn(
                  "relative w-[50px] shrink-0 text-right text-[12px] font-semibold tabular",
                  slip ? "text-tertiary line-through" : "text-heading",
                )}
              >
                ${(d.amount / 1000).toFixed(1)}K
              </span>
            </motion.li>
          );
        })}
      </ul>
    </Widget>
  );
}
