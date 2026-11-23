import {
  ArrowRight16Regular,
  Board20Filled,
  Checkmark12Filled,
  Checkmark16Filled,
  Clock16Regular,
  Dismiss16Regular,
} from "@fluentui/react-icons";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

const STAGES = ["Proposal", "Negotiation", "Won"] as const;
const WON = STAGES.length - 1;
const STALE_DAYS = 30;

type Card = { id: string; company: string; amount: number; owner: string; age: number; stage: number };

const START: Card[] = [
  { id: "pb", company: "Pinecrest Bank", amount: 118_000, owner: "Maya Chen", age: 15, stage: 0 },
  { id: "at", company: "Atlas Robotics", amount: 74_000, owner: "Jonah Park", age: 2, stage: 0 },
  { id: "qc", company: "Quarry & Co", amount: 61_000, owner: "Diego Ramos", age: 7, stage: 0 },
  { id: "bm", company: "Brightline Media", amount: 42_800, owner: "Priya Natarajan", age: 11, stage: 0 },
  { id: "hh", company: "Halcyon Health", amount: 126_500, owner: "Diego Ramos", age: 41, stage: 1 },
  { id: "nw", company: "Northwind Logistics", amount: 84_000, owner: "Maya Chen", age: 18, stage: 1 },
  { id: "eo", company: "Ember & Oak", amount: 23_900, owner: "Lena Fischer", age: 12, stage: 1 },
  { id: "vf", company: "Vantage Freight", amount: 67_200, owner: "Owen Brooks", age: 0, stage: 2 },
  { id: "sd", company: "Solace Dental", amount: 31_400, owner: "Sam Okoye", age: 0, stage: 2 },
];
/** Won earlier in the quarter, off the board. */
const WON_BEFORE = 219_400;
const MAX_CARDS = 4;

const K1 = { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 } as const;
const K0 = { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 0 } as const;
const k = (n: number) => `$${Math.round(n / 1000)}K`;

/** Sales · large. Kanban pipeline; select a deal to advance it, cards slide across and Won rolls up with a green pulse. */
export function DealBoardWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const uid = useId();
  const [cards, setCards] = useState(START);
  const [selected, setSelected] = useState<string | null>(null);
  const [wonPulse, setWonPulse] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), (delay + 1.2) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!wonPulse) return;
    const t = window.setTimeout(() => setWonPulse(null), 1400);
    return () => window.clearTimeout(t);
  }, [wonPulse]);

  const open = cards.filter((c) => c.stage < WON);
  const openTotal = open.reduce((s, c) => s + c.amount, 0);
  const wonTotal = WON_BEFORE + cards.filter((c) => c.stage === WON).reduce((s, c) => s + c.amount, 0);
  const sel = cards.find((c) => c.id === selected) ?? null;

  const advance = () => {
    if (!sel || sel.stage === WON) return;
    const next = sel.stage + 1;
    // Moved cards go to the top of their new column.
    setCards((cs) => [{ ...sel, stage: next, age: 0 }, ...cs.filter((c) => c.id !== sel.id)]);
    if (next === WON) {
      setWonPulse(sel.id);
      setSelected(null);
    }
  };

  return (
    <Widget
      size="large"
      index={index}
      label="Deal pipeline board"
      glow={{ mode: "pulse", colors: ["#30D158", "#63E6E2", "#30D158"], blur: 20, duration: 1.4 }}
      glowActive={!!wonPulse}
    >
      <WidgetHeader
        icon={<Board20Filled />}
        tint="var(--ios-indigo)"
        title="Pipeline"
        subtitle={`Team West · Q4 · ${open.length} open deals`}
      />

      {/* Summary, or the action for the selected deal */}
      <div className="relative mt-2.5 h-[46px]">
        <AnimatePresence mode="popLayout" initial={false}>
          {sel ? (
            <motion.div
              key="action"
              className="absolute inset-0 flex items-center gap-2"
              initial={{ opacity: 0, y: 8, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(3px)" }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
            >
              <MemojiAvatar who={sel.owner} size={28} />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[13px] font-semibold text-heading">{sel.company}</div>
                <div className="truncate text-[11px] text-tertiary tabular">
                  {k(sel.amount)} · {STAGES[sel.stage]} · {sel.owner}
                </div>
              </div>
              <Button
                size="small"
                shape="circle"
                variant="filled"
                color="default"
                icon={<Dismiss16Regular />}
                aria-label="Deselect"
                onClick={() => setSelected(null)}
              />
              {sel.stage === WON ? (
                <span className="flex items-center gap-1 text-[12px] font-semibold text-ios-green">
                  <Checkmark16Filled /> Closed won
                </span>
              ) : sel.stage === WON - 1 ? (
                <Button
                  size="small"
                  shape="round"
                  color="green"
                  variant="filled"
                  icon={<Checkmark16Filled />}
                  onClick={advance}
                  className="font-semibold"
                >
                  Mark won
                </Button>
              ) : (
                <Button size="small" shape="round" type="primary" onClick={advance} className="font-semibold">
                  {STAGES[sel.stage + 1]} <ArrowRight16Regular />
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="summary"
              className="absolute inset-0 flex items-baseline-last justify-between"
              initial={{ opacity: 0, y: 8, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(3px)" }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
            >
              <div className="leading-none">
                <div className="mb-1 text-[11px] text-tertiary">Open pipeline</div>
                <AnimatedNumber value={openTotal} format={K1} className="text-[26px] font-semibold tracking-tight text-heading" />
              </div>
              <div className="text-right leading-none">
                <div className="mb-1 text-[11px] text-tertiary">Won this quarter</div>
                <AnimatedNumber value={wonTotal} format={K0} className="text-[20px] font-semibold tracking-tight text-ios-green" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <LayoutGroup id={uid}>
        <div className="mt-2.5 grid min-h-0 flex-1 grid-cols-3 gap-1.5">
          {STAGES.map((stage, col) => {
            const inCol = cards.filter((c) => c.stage === col);
            const sum = inCol.reduce((s, c) => s + c.amount, 0);
            const overflow = inCol.length > MAX_CARDS;
            const shown = overflow ? inCol.slice(0, MAX_CARDS - 1) : inCol;
            const isWon = col === WON;
            return (
              <div
                key={stage}
                className={cn(
                  "relative flex min-w-0 flex-col gap-1 overflow-hidden rounded-[4px] p-1",
                  col === 0 && "rounded-l-[12px]",
                  col === STAGES.length - 1 && "rounded-r-[12px]",
                  isWon ? "bg-ios-green/10" : "bg-fill-quaternary",
                )}
              >
                {isWon ? (
                  <AnimatePresence>
                    {wonPulse ? (
                      <motion.span
                        key={wonPulse}
                        aria-hidden
                        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-ios-green"
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 1.1, ease: "easeOut" }}
                      />
                    ) : null}
                  </AnimatePresence>
                ) : null}
                <div className="relative h-[30px] px-1 pt-1 leading-tight">
                  <div className={cn("truncate text-[11px] font-semibold", isWon ? "text-ios-green" : "text-secondary")}>
                    {stage}
                  </div>
                  <div className="truncate text-[10px] text-tertiary tabular">
                    <AnimatedNumber value={inCol.length} /> · <AnimatedNumber value={sum} format={K0} />
                  </div>
                </div>

                {shown.map((c, row) => (
                  <DealCard
                    key={c.id}
                    card={c}
                    selected={selected === c.id}
                    justWon={wonPulse === c.id}
                    onSelect={() => setSelected((s) => (s === c.id ? null : c.id))}
                    initialDelay={entered ? null : delay + col * 0.08 + row * 0.05}
                  />
                ))}
                {overflow ? (
                  <div className="grid h-[18px] place-items-center rounded-[8px] text-[10px] text-tertiary tabular">
                    +{inCol.length - shown.length} more
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </LayoutGroup>
    </Widget>
  );
}

function DealCard({
  card,
  selected,
  justWon,
  onSelect,
  initialDelay,
}: {
  card: Card;
  selected: boolean;
  justWon: boolean;
  onSelect: () => void;
  initialDelay: number | null;
}) {
  const won = card.stage === WON;
  const stale = !won && card.age > STALE_DAYS;
  return (
    <motion.button
      type="button"
      layoutId={`deal-${card.id}`}
      onClick={onSelect}
      initial={initialDelay === null ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      transition={{
        layout: { type: "spring", stiffness: 300, damping: 30 },
        default: { type: "spring", stiffness: 380, damping: 28, delay: initialDelay ?? 0 },
      }}
      className={cn(
        "relative flex h-[56px] w-full shrink-0 cursor-pointer flex-col rounded-[9px] p-1.5 text-left outline-none ring-inset",
        won ? "bg-ios-green/15" : "bg-[var(--widget-surface)]",
        stale && "ring-1 ring-ios-orange/70",
        selected && "ring-1 ring-ios-blue",
      )}
    >
      {justWon ? (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-[9px] ring-2 ring-ios-green"
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 1.18 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.25 }}
        />
      ) : null}
      <span className="truncate pr-3 text-[11px] leading-[13px] font-semibold text-heading">{card.company}</span>
      <span className="text-[12px] leading-[15px] font-semibold text-secondary tabular">{k(card.amount)}</span>
      <span className="mt-auto flex items-center gap-1">
        <MemojiAvatar who={card.owner} size={16} />
        {won ? (
          <span className="text-[10px] font-medium text-ios-green">Won</span>
        ) : stale ? (
          <Tooltip title={`No activity in ${card.age} days`}>
            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-ios-orange tabular">
              <Clock16Regular className="size-3" />
              {card.age}d
            </span>
          </Tooltip>
        ) : (
          <span className="text-[10px] text-tertiary tabular">{card.age === 0 ? "today" : `${card.age}d`}</span>
        )}
      </span>
      {won ? (
        <motion.span
          className="absolute top-1.5 right-1.5 grid size-3.5 place-items-center rounded-full bg-ios-green text-white"
          initial={justWon ? { scale: 0, rotate: -60 } : false}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 520, damping: 14, delay: justWon ? 0.3 : 0 }}
        >
          <Checkmark12Filled className="size-2.5" />
        </motion.span>
      ) : null}
    </motion.button>
  );
}
