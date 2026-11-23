import { PeopleQueue20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

/* A full 12-stall hub on a holiday Friday. Average DC session is ~31 min, so a
 * stall frees roughly every 2.6 min; the queue is first come, first served.
 * Demo time runs fast: a stall frees every few seconds. */
type Driver = { id: number; who: string; you?: boolean };

const STALLS = 12;
const MIN_PER_CAR = 2.6;
const POOL = ["f2", "m4", "f6", "m7", "m2", "f8", "m9", "f3", "m5", "f1", "m10", "f5"];
const MAX_SHOWN = 5;

/** EV charging · small. A busy hub's queue of drivers; they step forward as stalls free up, and Join puts you in line. */
export function HubQueueWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [queue, setQueue] = useState<Driver[]>([
    { id: 1, who: "f2" },
    { id: 2, who: "m4" },
    { id: 3, who: "f6" },
    { id: 4, who: "m7" },
  ]);
  const [freeing, setFreeing] = useState<number | null>(null);
  const [called, setCalled] = useState<number | null>(null);
  const [soon, setSoon] = useState(3);
  const nextId = useRef(5);
  const tick = useRef(0);
  const timers = useRef<number[]>([]);
  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  const queueRef = useRef(queue);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    const t = window.setInterval(() => {
      tick.current += 1;
      setSoon(tick.current % 2 === 0 ? 3 : 1);
      // A stall frees, flashes, and the head of the line takes it.
      if (tick.current % 2 === 0) {
        const stall = (tick.current * 5) % STALLS;
        setFreeing(stall);
        later(1300, () => {
          const head = queueRef.current[0];
          if (head?.you) {
            setCalled(stall + 1);
            later(3200, () => setCalled(null));
          }
          setQueue((q) => q.slice(1));
          setFreeing(null);
        });
      }
      // Someone pulls in at the back.
      if (tick.current % 3 !== 1) {
        setQueue((q) =>
          q.filter((d) => !d.you).length >= 5 ? q : [...q, { id: nextId.current, who: POOL[nextId.current++ % POOL.length] }],
        );
      }
    }, 2600);
    return () => {
      window.clearInterval(t);
      timers.current.forEach((x) => window.clearTimeout(x));
    };
  }, []);

  const youAt = queue.findIndex((d) => d.you);
  const joined = youAt >= 0;
  const toggle = () => {
    if (joined) setQueue((q) => q.filter((d) => !d.you));
    else setQueue((q) => [...q, { id: nextId.current++, who: "m3", you: true }]);
  };

  // Keep "you" in view even when the line is longer than the lane.
  const shown = youAt >= MAX_SHOWN ? [...queue.slice(0, MAX_SHOWN - 1), queue[youAt]] : queue.slice(0, MAX_SHOWN);
  const more = queue.length - shown.length;
  const free = freeing == null ? 0 : 1;

  return (
    <Widget size="small" index={index} label="Charging hub queue">
      <WidgetHeader
        icon={<PeopleQueue20Filled />}
        tint="var(--ios-orange)"
        title="Hub A queue"
        subtitle={`${free}/${STALLS} stalls free`}
      />

      <div className="mt-2 flex items-baseline-last justify-between whitespace-nowrap">
        <div className="leading-none">
          <span className="text-[30px] font-semibold tracking-tight text-heading">
            <AnimatedNumber value={queue.length} />
          </span>
          <span className="ml-1 text-[12px] text-tertiary">waiting</span>
        </div>
        <div className="text-right leading-tight">
          <div className="text-[11px] text-tertiary">Next free</div>
          <div className="text-[13px] font-semibold text-secondary">
            ~<AnimatedNumber value={soon} /> min
          </div>
        </div>
      </div>

      {/* Stalls */}
      <div className="mt-2.5 grid h-2 grid-cols-12 gap-[2px]">
        {Array.from({ length: STALLS }, (_, i) => (
          <motion.span
            key={i}
            className={cn("rounded-[2px]", freeing === i ? "bg-ios-green" : "bg-ios-blue/45")}
            initial={{ scaleY: 0 }}
            animate={freeing === i ? { scaleY: 1, opacity: [1, 0.35, 1, 0.35, 1] } : { scaleY: 1, opacity: 1 }}
            transition={freeing === i ? { duration: 1.2 } : { type: "spring", stiffness: 260, damping: 18, delay: delay + i * 0.025 }}
          />
        ))}
      </div>

      {/* The line */}
      <div className="mt-2.5 flex h-7 items-center">
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map((d, i) => (
            <motion.div
              key={d.id}
              layout
              initial={{ opacity: 0, x: 24, scale: 0.6 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -24, y: -10, scale: 0.6 }}
              transition={{ type: "spring", stiffness: 340, damping: 26 }}
              className={cn("relative shrink-0", i > 0 && "-ml-1.5")}
              style={{ zIndex: MAX_SHOWN - i }}
            >
              <MemojiAvatar
                who={d.who}
                size={26}
                className={cn("ring-[1.5px]", d.you ? "ring-ios-blue" : "ring-[var(--widget-surface)]")}
              />
              {d.you ? (
                <span className="absolute -right-1 -bottom-1 rounded-full bg-ios-blue px-1 text-[9px] leading-[12px] font-semibold text-white">
                  You
                </span>
              ) : null}
            </motion.div>
          ))}
          {more > 0 ? (
            <motion.span
              key="more"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="ml-1 shrink-0 text-[11px] font-semibold text-tertiary tabular"
            >
              +{more}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="mt-auto flex h-6 items-center gap-2 whitespace-nowrap">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={called ? "go" : joined ? `pos-${youAt}` : "idle"}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={cn("min-w-0 truncate text-[11px] tabular", called ? "font-semibold text-ios-green" : joined ? "text-secondary" : "text-tertiary")}
          >
            {called
              ? `Go to stall ${called}`
              : joined
                ? `#${youAt + 1} · ~${Math.round((youAt + 1) * MIN_PER_CAR)} min`
                : `~${Math.round((queue.length + 1) * MIN_PER_CAR)} min wait`}
          </motion.span>
        </AnimatePresence>
        <Button
          size="small"
          shape="round"
          className="ml-auto"
          type={joined ? "default" : "primary"}
          variant={joined ? "filled" : undefined}
          onClick={toggle}
        >
          {joined ? "Leave" : "Join"}
        </Button>
      </div>
    </Widget>
  );
}
