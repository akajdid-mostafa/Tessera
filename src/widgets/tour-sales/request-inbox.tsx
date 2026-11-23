import {
  CheckmarkCircle16Filled,
  DismissCircle16Filled,
  MailInbox20Filled,
  Send16Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { CHANNEL, type Channel, PRODUCT } from "./_parts-a";

/** A request's supplier answer; `null` until the supplier link goes out. */
type Decision = "confirmed" | "declined" | "pending" | null;
type Request = {
  reference: string;
  lead: string;
  pax: number;
  product: string;
  date: string;
  channel: Channel;
  decision: Decision;
};

const SEED: Request[] = [
  { reference: "KY-26-0401", lead: "Hans Weber", pax: 6, product: PRODUCT.montezuma, date: "Nov 20", channel: "website", decision: null },
  { reference: "KY-26-0411", lead: "Carol Owens", pax: 2, product: PRODUCT.package3, date: "Nov 27", channel: "widget", decision: "pending" },
  { reference: "KY-26-0414", lead: "Lina Haddad", pax: 5, product: PRODUCT.rafting, date: "Nov 15", channel: "b2b", decision: "confirmed" },
];
/** Carol's supplier (the package's hotel) answers a few seconds in. */
const LIVE_ANSWER = { reference: "KY-26-0411", afterMs: 5200 };
const SUPPLIER_REPLY_MS = 5600;

const PILL: Record<Exclude<Decision, null>, { label: string; tone: string; icon?: ReactNode }> = {
  confirmed: { label: "Confirmed", tone: "bg-ios-green/15 text-ios-green", icon: <CheckmarkCircle16Filled className="size-3" /> },
  declined: { label: "Declined", tone: "bg-ios-red/15 text-ios-red", icon: <DismissCircle16Filled className="size-3" /> },
  pending: { label: "Pending", tone: "bg-ios-orange/15 text-ios-orange" },
};

/** The paper plane that leaves the button and flies off to the supplier. */
function PaperPlane() {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute top-1/2 left-[8px] z-10 -mt-2 grid size-4 place-items-center text-ios-blue"
      initial={{ x: 0, y: 0, rotate: -10, opacity: 1, scale: 1 }}
      animate={{ x: [0, -6, 70], y: [0, 4, -46], rotate: [-10, -20, -38], opacity: [1, 1, 0], scale: [1, 1.1, 0.6] }}
      transition={{ duration: 0.8, times: [0, 0.2, 1], ease: "easeIn" }}
    >
      <Send16Filled className="size-4" />
    </motion.span>
  );
}

/** Tour sales · medium. Booking requests with channel and supplier decision; Send supplier link plays a paper-plane flight and flips the row to pending until the answer lands. */
export function RequestInboxWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [rows, setRows] = useState(SEED);
  const [flying, setFlying] = useState<string | null>(null);
  const [answered, setAnswered] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  const decide = (reference: string, decision: Decision) => {
    setRows((rs) => rs.map((r) => (r.reference === reference ? { ...r, decision } : r)));
    if (decision === "confirmed" || decision === "declined") setAnswered(reference);
  };

  useEffect(() => {
    const list = timers.current;
    list.push(window.setTimeout(() => decide(LIVE_ANSWER.reference, "confirmed"), delay * 1000 + LIVE_ANSWER.afterMs));
    return () => list.forEach((t) => window.clearTimeout(t));
  }, [delay]);

  useEffect(() => {
    if (!answered) return;
    const t = window.setTimeout(() => setAnswered(null), 1400);
    return () => window.clearTimeout(t);
  }, [answered]);

  const send = (reference: string) => {
    setFlying(reference);
    timers.current.push(
      window.setTimeout(() => {
        setFlying(null);
        decide(reference, "pending");
      }, 650),
      window.setTimeout(() => decide(reference, "confirmed"), 650 + SUPPLIER_REPLY_MS),
    );
  };

  const waiting = rows.filter((r) => r.decision === "pending" || r.decision === null).length;

  return (
    <Widget size="medium" index={index} label="Request inbox">
      <WidgetHeader
        icon={<MailInbox20Filled />}
        tint="var(--ios-indigo)"
        title="Request inbox"
        subtitle={
          <span className="tabular">
            {rows.length} requests · <AnimatedNumber value={waiting} /> awaiting supplier
          </span>
        }
      />

      <ul className="mt-auto flex flex-col gap-2">
        {rows.map((r, i) => {
          const ch = CHANNEL[r.channel];
          const flash = answered === r.reference;
          return (
            <motion.li
              key={r.reference}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 28, delay: delay + i * 0.07 }}
              className={cn(
                "relative -mx-1.5 flex h-[38px] items-center gap-2 px-1.5",
                i > 0 && "before:absolute before:inset-x-1.5 before:-top-1 before:h-[0.5px] before:bg-split",
              )}
            >
              <AnimatePresence>
                {flash ? (
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 bg-ios-green"
                    initial={{ opacity: 0.28 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.3, ease: "easeOut" }}
                  />
                ) : null}
              </AnimatePresence>
              <MemojiAvatar who={r.lead} size={26} className="relative" />
              <div className="relative min-w-0 flex-1 leading-tight">
                <div className="truncate text-[12px] font-medium text-heading">
                  {r.lead} <span className="font-normal text-tertiary tabular">· {r.pax} pax</span>
                </div>
                <div className="truncate text-[10.5px] text-tertiary tabular">
                  {r.reference} · {r.product} · {r.date}
                </div>
              </div>
              <span
                className={cn(
                  "relative inline-flex w-[84px] shrink-0 items-center justify-center gap-1 rounded-full py-0.5 text-[10px] font-medium",
                  ch.tone,
                )}
              >
                {ch.icon}
                {ch.label}
              </span>
              <div className="relative grid w-[78px] shrink-0 place-items-end">
                <AnimatePresence mode="popLayout" initial={false}>
                  {r.decision === null ? (
                    <motion.div
                      key="send"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <Tooltip title="Send supplier link">
                        <Button
                          size="small"
                          type="primary"
                          className="w-[78px] px-0 text-[11px] font-medium"
                          aria-label={`Send supplier link for ${r.reference}`}
                          disabled={flying === r.reference}
                          icon={
                            <span className={cn("grid", flying === r.reference && "opacity-0")}>
                              <Send16Filled className="size-3" />
                            </span>
                          }
                          onClick={() => send(r.reference)}
                        >
                          Send link
                        </Button>
                      </Tooltip>
                    </motion.div>
                  ) : (
                    <motion.span
                      key={r.decision}
                      initial={{ opacity: 0, y: 8, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 420, damping: 26 }}
                      className={cn(
                        "inline-flex w-[78px] items-center justify-center gap-1 rounded-full py-0.5 text-[10px] font-semibold",
                        PILL[r.decision].tone,
                      )}
                    >
                      {r.decision === "pending" ? (
                        <motion.span
                          className="size-1.5 rounded-full bg-ios-orange"
                          animate={{ opacity: [1, 0.25, 1] }}
                          transition={{ duration: 1.4, repeat: Infinity }}
                        />
                      ) : (
                        PILL[r.decision].icon
                      )}
                      {PILL[r.decision].label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {flying === r.reference ? <PaperPlane /> : null}
              </div>
            </motion.li>
          );
        })}
      </ul>
    </Widget>
  );
}
