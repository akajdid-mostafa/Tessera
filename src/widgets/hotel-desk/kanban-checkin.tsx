import { Board20Filled, Checkmark16Filled, DoorArrowRight16Regular, Payment16Regular } from "@fluentui/react-icons";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { type ReactNode, useEffect, useId, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { BUSINESS_DAY, Sheet, clock, usd, useInterval, useTimeouts } from "./_parts-b";

type Card = {
  id: string;
  name: string;
  room: string;
  type: string;
  nights: number;
  channel: string;
  /** What the guest owes on the folio now, in USD. */
  balance: number;
  /** Seconds the guest has been waiting at the desk. */
  waiting?: number;
  /** HH:mm the guest was checked in. */
  inAt?: string;
};

const ARRIVING: Card[] = [
  { id: "ob", name: "Olivia Brown", room: "95", type: "Villa", nights: 3, channel: "Booking.com", balance: 0, waiting: 372 },
  { id: "cd", name: "Claire Dubois", room: "11", type: "Std Double", nights: 3, channel: "Online", balance: 420 },
  { id: "as", name: "Anna Schmidt", room: "10", type: "Deluxe Sea View", nights: 4, channel: "Expedia", balance: 0 },
  { id: "ya", name: "Jacob Ames", room: "15", type: "Standard Twin", nights: 2, channel: "Agoda", balance: 285 },
  { id: "jn", name: "Julia Novak", room: "97", type: "Villa", nights: 4, channel: "Online", balance: 0 },
];
const IN_HOUSE: Card[] = [
  { id: "ed", name: "Ellie Dawson", room: "8", type: "Std Double", nights: 6, channel: "Online", balance: 0, inAt: "Oct 11" },
  { id: "dm", name: "David Miller", room: "5", type: "Single Room", nights: 4, channel: "Expedia", balance: 0, inAt: "Oct 12" },
];
const IN_HOUSE_COUNT = 58;
/** How far right a card has to travel to land in the other lane. */
const DROP_X = 100;

type Ask = { id: string; step: "pay" | "paying" | "confirm" };

/** Front desk · medium. Arriving and In house lanes of guest cards: drag or tap a card across, confirm in the sheet and it springs into In house, while a guest with a balance due is asked to pay first. */
export function KanbanCheckinWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const uid = useId();
  const later = useTimeouts();
  const [arriving, setArriving] = useState(ARRIVING);
  const [inHouse, setInHouse] = useState(IN_HOUSE);
  const [count, setCount] = useState(IN_HOUSE_COUNT);
  const [ask, setAsk] = useState<Ask | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [landed, setLanded] = useState<string | null>(null);
  const [mins, setMins] = useState(14 * 60 + 6);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), (delay + 1) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  // The waiting clock of a guest at the desk ticks; the desk clock follows.
  useInterval(() => {
    setArriving((list) => list.map((c) => (c.waiting === undefined ? c : { ...c, waiting: c.waiting + 1 })));
  }, 1000);
  useInterval(() => setMins((m) => m + 1), 6000);

  // Once everyone is in, the next wave of arrivals comes in.
  useEffect(() => {
    if (arriving.length) return;
    const t = window.setTimeout(() => {
      setArriving(ARRIVING.map((c) => ({ ...c, id: `${c.id}-${Date.now()}` })));
      setInHouse(IN_HOUSE);
      setCount(IN_HOUSE_COUNT);
    }, 5000);
    return () => window.clearTimeout(t);
  }, [arriving.length]);

  useEffect(() => {
    if (!landed) return;
    const t = window.setTimeout(() => setLanded(null), 1300);
    return () => window.clearTimeout(t);
  }, [landed]);

  const cur = arriving.find((c) => c.id === ask?.id) ?? null;
  const request = (c: Card) => setAsk({ id: c.id, step: c.balance > 0 ? "pay" : "confirm" });

  const takePayment = () => {
    if (!cur) return;
    const id = cur.id;
    setAsk({ id, step: "paying" });
    later(() => {
      setArriving((list) => list.map((c) => (c.id === id ? { ...c, balance: 0 } : c)));
      setAsk((a) => (a && a.id === id ? { id, step: "confirm" } : a));
    }, 900);
  };

  const checkIn = () => {
    if (!cur) return;
    const moved: Card = { ...cur, waiting: undefined, inAt: clock(mins) };
    setAsk(null);
    setArriving((list) => list.filter((c) => c.id !== moved.id));
    setInHouse((list) => [moved, ...list]);
    setCount((n) => n + 1);
    setLanded(moved.id);
  };

  return (
    <Widget
      size="medium"
      index={index}
      label="Check-in board"
      glow={{ mode: "pulse", colors: ["#30D158", "#63E6E2", "#30D158"], blur: 18, duration: 1.2 }}
      glowActive={!!landed}
    >
      <WidgetHeader
        icon={<Board20Filled />}
        tint="var(--ios-indigo)"
        title="Check-in board"
        subtitle={`Front desk · ${BUSINESS_DAY} · ${clock(mins)}`}
        extra={
          <div className="text-right leading-tight">
            <div className="text-[10px] text-tertiary">Checked in today</div>
            <AnimatedNumber value={count - IN_HOUSE_COUNT + 6} className="text-[15px] font-semibold text-heading" />
          </div>
        }
      />

      <LayoutGroup id={uid}>
        <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 gap-2">
          <Lane title="Arriving" n={arriving.length} tone="text-ios-blue">
            <AnimatePresence mode="popLayout" initial={false}>
              {arriving.slice(0, 3).map((c, i) => (
                <GuestCard
                  key={c.id}
                  card={c}
                  draggable
                  initialDelay={entered ? null : delay + i * 0.07}
                  onTap={() => request(c)}
                  onDragStart={() => setDragging(c.id)}
                  onDragMove={(x) => setOver(x > DROP_X)}
                  onDrop={(x) => {
                    setDragging(null);
                    setOver(false);
                    if (x > DROP_X) request(c);
                  }}
                  lifted={dragging === c.id}
                />
              ))}
            </AnimatePresence>
            {arriving.length === 0 ? (
              <div className="m-auto text-center text-[11px] text-tertiary">Everyone due is in</div>
            ) : null}
          </Lane>

          <Lane
            title="In house"
            n={count}
            tone="text-ios-green"
            className={cn(over && "bg-ios-green/12 ring-2 ring-ios-green/60 ring-inset")}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {inHouse.slice(0, 3).map((c, i) => (
                <GuestCard key={c.id} card={c} justIn={landed === c.id} initialDelay={entered ? null : delay + 0.1 + i * 0.07} />
              ))}
            </AnimatePresence>
          </Lane>
        </div>
      </LayoutGroup>

      <Sheet open={!!cur} onClose={() => setAsk(null)} label="Check in guest">
        {cur && ask ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <MemojiAvatar who={cur.name} size={30} />
              <div className="min-w-0 flex-1 leading-tight">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={ask.step === "confirm" ? "confirm" : "pay"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                  >
                    <div className="truncate text-[13px] font-semibold text-heading">
                      {ask.step === "confirm" ? `Check in ${cur.name}?` : `${cur.name} owes ${usd(cur.balance)}`}
                    </div>
                    <div className="truncate text-[11px] text-tertiary tabular">
                      {ask.step === "confirm"
                        ? `Room ${cur.room} · ${cur.type} · ${cur.nights} nights`
                        : `Take payment before check-in · ${cur.channel}`}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="small" variant="filled" color="default" onClick={() => setAsk(null)}>
                Cancel
              </Button>
              {ask.step === "confirm" ? (
                <Button
                  size="small"
                  color="green"
                  variant="filled"
                  className="font-semibold"
                  icon={<DoorArrowRight16Regular />}
                  onClick={checkIn}
                >
                  Check in
                </Button>
              ) : (
                <Button
                  size="small"
                  type="primary"
                  className="font-semibold"
                  loading={ask.step === "paying"}
                  icon={<Payment16Regular />}
                  onClick={takePayment}
                >
                  Take {usd(cur.balance)}
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </Sheet>
    </Widget>
  );
}

function Lane({
  title,
  n,
  tone,
  className,
  children,
}: {
  title: string;
  n: number;
  tone: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("relative flex min-w-0 flex-col gap-1 rounded-[12px] bg-fill-quaternary p-1 transition-colors duration-200", className)}>
      <div className="flex h-4 items-center justify-between px-1 text-[10.5px] leading-none">
        <span className={cn("font-semibold", tone)}>{title}</span>
        <AnimatedNumber value={n} className="text-tertiary" />
      </div>
      {children}
    </div>
  );
}

function GuestCard({
  card,
  draggable,
  lifted,
  justIn,
  initialDelay,
  onTap,
  onDragStart,
  onDragMove,
  onDrop,
}: {
  card: Card;
  draggable?: boolean;
  lifted?: boolean;
  justIn?: boolean;
  initialDelay: number | null;
  onTap?: () => void;
  onDragStart?: () => void;
  onDragMove?: (x: number) => void;
  onDrop?: (x: number) => void;
}) {
  const due = card.balance > 0;
  const w = card.waiting;
  return (
    <motion.div
      layout
      layoutId={`card-${card.id}`}
      role={draggable ? "button" : undefined}
      tabIndex={draggable ? 0 : undefined}
      aria-label={draggable ? `Check in ${card.name}` : undefined}
      onTap={draggable ? onTap : undefined}
      onKeyDown={(e) => {
        if (draggable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onTap?.();
        }
      }}
      drag={draggable}
      dragSnapToOrigin
      dragElastic={0.5}
      onDragStart={onDragStart}
      onDrag={(_, info) => onDragMove?.(info.offset.x)}
      onDragEnd={(_, info) => onDrop?.(info.offset.x)}
      whileDrag={{ scale: 1.05, rotate: 2, zIndex: 40, boxShadow: "0 10px 24px rgba(0,0,0,0.28)" }}
      whileHover={draggable ? { y: -1 } : undefined}
      initial={initialDelay === null ? { opacity: 0, scale: 0.9 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        layout: { type: "spring", stiffness: 320, damping: 26 },
        default: { type: "spring", stiffness: 380, damping: 28, delay: initialDelay ?? 0 },
      }}
      className={cn(
        "relative flex h-[29px] shrink-0 items-center gap-1.5 rounded-[9px] bg-[var(--widget-surface)] px-1.5 ring-inset select-none",
        draggable && "cursor-grab touch-none active:cursor-grabbing",
        lifted && "ring-1 ring-ios-blue/60",
        justIn && "ring-1 ring-ios-green/60",
      )}
    >
      {justIn ? (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-[9px] ring-2 ring-ios-green"
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 1.12 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
        />
      ) : null}
      <MemojiAvatar who={card.name} size={20} />
      <div className="min-w-0 flex-1 leading-[12px]">
        <div className="truncate text-[11px] font-semibold text-heading">{card.name}</div>
        <div className="truncate text-[9.5px] text-tertiary tabular">
          <span className="font-medium text-secondary">{card.room}</span>
          {w !== undefined ? (
            <span className="font-medium text-ios-orange">
              {" "}
              · Waiting {Math.floor(w / 60)}:{String(w % 60).padStart(2, "0")}
            </span>
          ) : card.inAt ? (
            ` · In ${card.inAt}`
          ) : (
            ` · ${card.type}`
          )}
        </div>
      </div>
      {justIn ? (
        <motion.span
          className="grid size-4 shrink-0 place-items-center rounded-full bg-ios-green text-white"
          initial={{ scale: 0, rotate: -60 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 520, damping: 15, delay: 0.25 }}
        >
          <Checkmark16Filled className="size-3" />
        </motion.span>
      ) : due ? (
        <span className="shrink-0 text-[10px] font-semibold text-ios-red tabular">{usd(card.balance)}</span>
      ) : (
        <span className="shrink-0 text-[10px] text-tertiary">Paid</span>
      )}
    </motion.div>
  );
}
