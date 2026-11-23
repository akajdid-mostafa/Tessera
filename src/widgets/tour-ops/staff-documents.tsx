import { Checkmark12Filled, ContactCard20Filled, Send16Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

type Kind = "license" | "src" | "psychotechnic" | "guideBadge";
type Row = { id: string; name: string; role: string; kind: Kind; note?: string; days: number };

/* The product's document names; a document is "expiring" inside 30 days (`DOCUMENT_WARNING_DAYS`). */
const KIND: Record<Kind, string> = {
  license: "Driver's license",
  src: "CDL",
  psychotechnic: "DOT medical card",
  guideBadge: "Guide permit",
};
const WARNING_DAYS = 30;
const ROWS: Row[] = [
  { id: "stf_003", name: "Matt Yates", role: "Driver", kind: "src", days: -20 },
  { id: "stf_007", name: "Keith Allen", role: "Driver", kind: "psychotechnic", days: 6 },
  { id: "stf_002", name: "Emma Hayes", role: "Guide", kind: "guideBadge", days: 11 },
];

type Send = "idle" | "sending" | "sent";

/** Tour ops · medium. Staff whose license, CDL, DOT medical card or guide permit has run out or is about to, days left as shrinking bars; "Remind" sends and checks off each row. */
export function StaffDocumentsWidget({ index }: { index?: number }) {
  const [state, setState] = useState<Record<string, Send>>({});
  const timers = useRef<number[]>([]);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const remind = (id: string) => {
    setState((s) => ({ ...s, [id]: "sending" }));
    timers.current.push(window.setTimeout(() => setState((s) => ({ ...s, [id]: "sent" })), 900));
  };
  const expired = ROWS.filter((r) => r.days < 0).length;
  const sent = ROWS.filter((r) => state[r.id] === "sent").length;

  return (
    <Widget size="medium" index={index} label="Staff documents">
      <WidgetHeader
        icon={<ContactCard20Filled />}
        tint="var(--ios-orange)"
        title="Staff Documents"
        subtitle={`${expired} expired · ${ROWS.length - expired} expiring within ${WARNING_DAYS} days`}
        extra={
          <AnimatePresence initial={false}>
            {sent ? (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1 rounded-full bg-ios-green/15 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-ios-green"
              >
                <Checkmark12Filled />
                <AnimatedNumber value={sent} />/{ROWS.length} reminded
              </motion.span>
            ) : null}
          </AnimatePresence>
        }
      />

      <div className="mt-auto flex flex-col gap-2">
        {ROWS.map((r, i) => {
          const isExpired = r.days < 0;
          const left = Math.max(0, r.days) / WARNING_DAYS;
          const tone = isExpired ? "bg-ios-red" : r.days <= 7 ? "bg-ios-orange" : "bg-ios-yellow";
          const s = state[r.id] ?? "idle";
          return (
            <div
              key={r.id}
              className={cn(
                "relative flex h-[38px] items-center gap-2",
                i > 0 && "before:absolute before:inset-x-0 before:-top-1 before:h-[0.5px] before:bg-split",
              )}
            >
              <MemojiAvatar who={r.name} size={26} />
              <div className="w-[104px] min-w-0 shrink-0 leading-tight">
                <div className="truncate text-[12px] font-medium text-heading">{r.name}</div>
                <div className="truncate text-[11px] text-tertiary">
                  {KIND[r.kind]}
                  {r.note ? ` · ${r.note}` : ""}
                </div>
              </div>

              <div className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-fill-secondary">
                {isExpired ? (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-ios-red/40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut", delay: delay + 0.6 }}
                  />
                ) : (
                  <motion.span
                    className={cn("absolute inset-y-0 left-0 rounded-full", tone)}
                    initial={{ width: "100%" }}
                    animate={{ width: `${left * 100}%` }}
                    transition={{ type: "spring", stiffness: 60, damping: 18, delay: delay + i * 0.08 }}
                  />
                )}
              </div>
              <span
                className={cn(
                  "w-[48px] shrink-0 text-right text-[11px] font-semibold whitespace-nowrap tabular",
                  isExpired ? "text-ios-red" : "text-heading",
                )}
              >
                {isExpired ? (
                  `${-r.days} d ago`
                ) : (
                  <Countdown to={r.days} delay={delay + i * 0.08} />
                )}
              </span>

              <div className="flex w-[78px] shrink-0 justify-end">
                <AnimatePresence mode="popLayout" initial={false}>
                  {s === "sent" ? (
                    <motion.span
                      key="sent"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 420, damping: 20 }}
                      className="flex h-6 items-center gap-1 pr-1 text-[11px] font-semibold text-ios-green"
                    >
                      <span className="grid size-4 place-items-center rounded-full bg-ios-green text-[10px] text-white">
                        <Checkmark12Filled />
                      </span>
                      Sent
                    </motion.span>
                  ) : (
                    <motion.span key="btn" exit={{ opacity: 0, scale: 0.8 }}>
                      <Button
                        size="small"
                        variant="filled"
                        color={isExpired ? "danger" : "default"}
                        loading={s === "sending"}
                        icon={s === "sending" ? undefined : <Send16Regular />}
                        onClick={() => remind(r.id)}
                      >
                        Remind
                      </Button>
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </Widget>
  );
}

/** "11 d" that counts down from the 30-day window on entrance. */
function Countdown({ to, delay }: { to: number; delay: number }) {
  const [v, setV] = useState(WARNING_DAYS);
  useEffect(() => {
    const t = window.setTimeout(() => setV(to), delay * 1000);
    return () => window.clearTimeout(t);
  }, [to, delay]);
  return <AnimatedNumber value={v} suffix=" d" trend={-1} />;
}
