import { Cart20Filled, Checkmark16Filled, Dismiss16Regular, Megaphone16Regular, Warning12Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MEMOJI, MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Customer = { id: number; who: string };
type Lane = { n: number; cashier: string | null; who: string | null; secs: number; queue: Customer[]; express?: boolean };

const LIMIT = 300; // 5 min
const CONFIRM_MS = 5000;
const SPARE = { name: "Ravi", who: "m7" };

let uid = 0;
const face = () => MEMOJI[(uid * 7 + 3) % MEMOJI.length];
const crowd = (k: number): Customer[] => Array.from({ length: k }, () => ({ id: ++uid, who: face() }));

const START: Lane[] = [
  { n: 1, cashier: "Grace", who: "f3", secs: 62, queue: crowd(3) },
  { n: 2, cashier: "Omar", who: "m5", secs: 54, queue: crowd(5) },
  { n: 3, cashier: "Lily", who: "f9", secs: 63, queue: crowd(6) },
  { n: 4, cashier: "Tom", who: "m1", secs: 52, queue: crowd(4) },
  { n: 5, cashier: null, who: null, secs: 60, queue: [] },
  { n: 6, cashier: "Beth", who: "f5", secs: 40, queue: crowd(2), express: true },
];

const wait = (l: Lane) => l.queue.length * l.secs;
const mmss = (s: number) => ({ m: Math.floor(s / 60), s: s % 60 });
const TWO = { minimumIntegerDigits: 2 } as const;

type Phase = "idle" | "confirm" | "opening" | "open";

/** Retail · medium. Checkout lanes seen from above with live queues; the longest wait trips past 5 minutes until you open lane 5 and the line rebalances. */
export function CheckoutLanesWidget({ index }: { index?: number }) {
  const [lanes, setLanes] = useState<Lane[]>(START);
  const [phase, setPhase] = useState<Phase>("idle");
  const tick = useRef(0);
  const delay = 0.3 + (index ?? 0) * 0.06;

  // Live: a customer is served at one till and someone new joins the same line.
  useEffect(() => {
    const t = window.setInterval(() => {
      tick.current += 1;
      setLanes((ls) => {
        const open = ls.filter((l) => l.cashier && l.queue.length > 0);
        const pick = open[tick.current % open.length];
        return ls.map((l) => (l === pick ? { ...l, queue: [...l.queue.slice(1), ...crowd(1)] } : l));
      });
    }, 2800);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (phase === "confirm") {
      const t = window.setTimeout(() => setPhase("idle"), CONFIRM_MS);
      return () => window.clearTimeout(t);
    }
    if (phase === "opening") {
      const t = window.setTimeout(() => {
        setLanes((ls) => {
          const moved: Customer[] = [];
          const next = ls.map((l) => {
            if (l.n === 3) {
              moved.push(...l.queue.slice(-2));
              return { ...l, queue: l.queue.slice(0, -2) };
            }
            if (l.n === 2) {
              moved.push(...l.queue.slice(-1));
              return { ...l, queue: l.queue.slice(0, -1) };
            }
            return l;
          });
          return next.map((l) => (l.n === 5 ? { ...l, cashier: SPARE.name, who: SPARE.who, queue: moved } : l));
        });
        setPhase("open");
      }, 1100);
      return () => window.clearTimeout(t);
    }
  }, [phase]);

  const worst = lanes.reduce((a, b) => (wait(b) > wait(a) ? b : a));
  const worstWait = wait(worst);
  const alarm = worstWait > LIMIT;
  const open = lanes.filter((l) => l.cashier).length;
  const t = mmss(worstWait);

  return (
    <Widget
      size="medium"
      index={index}
      label="Checkout lanes"
      glow={{ mode: "pulse", colors: ["#FF453A", "#FF9F0A", "#FF453A"], blur: 18, duration: 2.4 }}
      glowActive={alarm}
    >
      <WidgetHeader
        icon={<Cart20Filled />}
        tint={alarm ? "var(--ios-red)" : "var(--ios-green)"}
        title="Checkout Lanes"
        subtitle={`${open} of ${lanes.length} tills open · Oxford St`}
      />

      <div className="mt-2 flex min-h-0 flex-1 gap-3">
        <div className="grid flex-1 grid-cols-6 gap-1.5">
          {lanes.map((l, li) => {
            const w = wait(l);
            const over = w > LIMIT;
            const lw = mmss(w);
            const closed = !l.cashier;
            const isOpening = l.n === 5 && phase === "opening";
            return (
              <div key={l.n} className="flex min-w-0 flex-col items-center">
                <div
                  className={cn(
                    "h-[14px] text-[11px] leading-[14px] font-semibold tabular",
                    closed ? "text-tertiary" : over ? "text-ios-red" : "text-secondary",
                  )}
                >
                  {closed ? "–" : `${lw.m}:${String(lw.s).padStart(2, "0")}`}
                </div>

                <div
                  className={cn(
                    "relative mt-1 flex h-[74px] w-full flex-col-reverse items-center overflow-hidden rounded-md pb-px",
                    over ? "bg-ios-red/10" : "bg-fill-quaternary",
                  )}
                >
                  {over ? (
                    <motion.span
                      className="absolute inset-0 rounded-md ring-1 ring-ios-red/60 ring-inset"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                    />
                  ) : null}
                  <AnimatePresence initial={false} mode="popLayout">
                    {l.queue.map((c, ci) => (
                      <motion.span
                        key={c.id}
                        layout
                        className="relative -mb-[7px] block first:mb-0"
                        style={{ zIndex: 20 - ci }}
                        initial={{ opacity: 0, y: -14, scale: 0.6 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 14, scale: 0.6, transition: { duration: 0.25 } }}
                        transition={{ type: "spring", stiffness: 340, damping: 26, delay: tick.current === 0 ? delay + li * 0.05 + ci * 0.04 : 0 }}
                      >
                        <MemojiAvatar who={c.who} size={18} className="ring-[1.5px] ring-[var(--widget-surface)]" />
                      </motion.span>
                    ))}
                  </AnimatePresence>
                  {closed && !isOpening ? (
                    <span className="m-auto text-[10px] font-medium text-tertiary [writing-mode:vertical-rl]">Closed</span>
                  ) : null}
                </div>

                <Tooltip
                  title={
                    closed
                      ? `Till ${l.n} · closed`
                      : `Till ${l.n}${l.express ? " · Express ≤10 items" : ""} · ${l.cashier} · ${l.queue.length} waiting · ~${l.secs}s each`
                  }
                >
                  <div
                    className={cn(
                      "mt-1 flex h-[24px] w-full cursor-default items-center justify-center gap-1 rounded-md transition-colors",
                      closed && !isOpening ? "bg-fill-quaternary" : "bg-fill-tertiary",
                    )}
                  >
                    <span className={cn("text-[10px] font-semibold tabular", l.express ? "text-ios-teal" : "text-tertiary")}>
                      {l.express ? "E" : l.n}
                    </span>
                    <AnimatePresence mode="popLayout">
                      {l.who ? (
                        <motion.span
                          key={l.who}
                          initial={{ scale: 0, y: 8 }}
                          animate={{ scale: 1, y: 0 }}
                          transition={{ type: "spring", stiffness: 420, damping: 18, delay: tick.current === 0 ? delay + li * 0.05 : 0 }}
                          className="grid"
                        >
                          <MemojiAvatar who={l.who} size={18} style={{ boxShadow: "0 0 0 1.5px var(--ios-green)" }} />
                        </motion.span>
                      ) : isOpening ? (
                        <motion.span
                          key="calling"
                          className="size-[18px] rounded-full border-[1.5px] border-dashed border-ios-orange"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                        />
                      ) : (
                        <span key="off" className="size-[18px] rounded-full border-[1.5px] border-dashed border-[var(--ant-color-border)]" />
                      )}
                    </AnimatePresence>
                  </div>
                </Tooltip>
              </div>
            );
          })}
        </div>

        <div className="flex w-[112px] shrink-0 flex-col">
          <div className="text-[11px] leading-tight text-tertiary">Longest wait</div>
          <div
            className={cn(
              "mt-0.5 flex items-baseline text-[28px] leading-none font-semibold tracking-tight",
              alarm ? "text-ios-red" : "text-heading",
            )}
          >
            <AnimatedNumber value={t.m} />
            <span className="px-px">:</span>
            <AnimatedNumber value={t.s} format={TWO} />
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] leading-tight whitespace-nowrap">
            {alarm ? (
              <span className="inline-flex items-center gap-0.5 font-semibold text-ios-red">
                <Warning12Filled /> Till {worst.n} · {worst.queue.length} in line
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 font-semibold text-ios-green">
                <Checkmark16Filled className="size-3" /> All under 5 min
              </span>
            )}
          </div>

          <div className="mt-auto">
            {phase === "idle" ? (
              <Button block size="small" type="primary" icon={<Megaphone16Regular />} onClick={() => setPhase("confirm")} className="font-semibold">
                Open till 5
              </Button>
            ) : phase === "confirm" ? (
              <div className="flex gap-1">
                <Button size="small" shape="circle" variant="filled" color="default" icon={<Dismiss16Regular />} aria-label="Cancel" onClick={() => setPhase("idle")} />
                <Button
                  block
                  size="small"
                  color="danger"
                  variant="solid"
                  className="relative overflow-hidden font-semibold"
                  onClick={() => setPhase("opening")}
                >
                  Call {SPARE.name}
                  <motion.span
                    className="absolute bottom-0 left-0 h-[2px] bg-white/70"
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: CONFIRM_MS / 1000, ease: "linear" }}
                  />
                </Button>
              </div>
            ) : (
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 480, damping: 18 }}
                className={cn(
                  "flex h-6 items-center justify-center gap-1 rounded-full text-[12px] font-semibold",
                  phase === "open" ? "bg-ios-green/15 text-ios-green" : "bg-ios-orange/15 text-ios-orange",
                )}
              >
                {phase === "open" ? <Checkmark16Filled /> : null}
                {phase === "open" ? "Till 5 open" : `Paging ${SPARE.name}…`}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </Widget>
  );
}
