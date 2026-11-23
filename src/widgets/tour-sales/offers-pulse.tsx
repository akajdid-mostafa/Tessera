import { Checkmark16Filled, Eye16Regular, Eye20Filled, Send16Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { entranceDelay, money, USD } from "./_parts-b";

type Status = "sent" | "accepted" | "declined";
type Offer = { number: string; customer: string; face: string; trip: string; total: number; status: Status; views: number };

/* Custom offers (`TKL-`) on their links today: how often each customer opened it. */
const OFFERS: Offer[] = [
  { number: "TKL-26-0014", customer: "Diana Kirk", face: "f2", trip: "Sedona and Oak Creek · 3 nights", total: 3_850, status: "sent", views: 3 },
  { number: "TKL-26-0012", customer: "Mohammed Al-Sabah", face: "m7", trip: "Family trip · Sedona and Oak Creek", total: 6_420, status: "accepted", views: 5 },
  { number: "TKL-26-0011", customer: "Stacy Hunt", face: "f8", trip: "Sedona weekend", total: 1_480, status: "sent", views: 1 },
];

/** What lands on the links, in turn: a view, or the customer accepting. Loops. */
const EVENTS: { n: number; kind: "view" | "accept" }[] = [
  { n: 0, kind: "view" },
  { n: 2, kind: "view" },
  { n: 0, kind: "view" },
  { n: 2, kind: "view" },
  { n: 2, kind: "accept" },
  { n: 0, kind: "view" },
  { n: 1, kind: "view" },
];

const STATUS: Record<Status, { label: string; className: string }> = {
  sent: { label: "Sent", className: "bg-ios-blue/15 text-ios-blue" },
  accepted: { label: "Accepted", className: "bg-ios-green/15 text-ios-green" },
  declined: { label: "Declined", className: "bg-fill-tertiary text-tertiary" },
};

/** Tour sales · medium. Today's offer links with their view counts; when a customer opens one the eye blinks, the row flashes and its count rolls, an acceptance adds to the unpaid total, and Nudge resends a link. */
export function OffersPulseWidget({ index }: { index?: number }) {
  const delay = entranceDelay(index);
  const [offers, setOffers] = useState<Offer[]>(OFFERS);
  const [hit, setHit] = useState<{ n: number; at: number } | null>(null);
  const [blink, setBlink] = useState(0);
  const [nudged, setNudged] = useState<Record<string, "sending" | "done">>({});
  const step = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const ev = EVENTS[step.current % EVENTS.length];
      step.current += 1;
      setOffers((list) =>
        list.map((o, i) => {
          if (i !== ev.n) return o;
          // Only a sent offer can be accepted; once it is, later events on it are views.
          if (ev.kind === "accept" && o.status === "sent") return { ...o, status: "accepted", views: o.views + 1 };
          return { ...o, views: o.views + 1 };
        }),
      );
      setHit({ n: ev.n, at: Date.now() });
      setBlink((b) => b + 1);
    }, 3400);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // A view's highlight fades after a moment.
  useEffect(() => {
    if (!hit) return;
    const t = window.setTimeout(() => setHit(null), 1500);
    return () => window.clearTimeout(t);
  }, [hit]);

  const nudge = (number: string) => {
    if (nudged[number]) return;
    setNudged((m) => ({ ...m, [number]: "sending" }));
    timers.current.push(
      window.setTimeout(() => setNudged((m) => ({ ...m, [number]: "done" })), 700),
      window.setTimeout(
        () =>
          setNudged((m) => {
            const next = { ...m };
            delete next[number];
            return next;
          }),
        6000,
      ),
    );
  };

  const views = offers.reduce((s, o) => s + o.views, 0);
  const accepted = offers.filter((o) => o.status === "accepted");
  const unpaid = accepted.reduce((s, o) => s + o.total, 0);

  return (
    <Widget size="medium" index={index} label="Offers pulse">
      <WidgetHeader
        icon={<BlinkingEye blink={blink} />}
        tint="var(--ios-teal)"
        title="Offers pulse"
        subtitle={
          <span className="tabular">
            <AnimatedNumber value={views} /> views today
          </span>
        }
        extra={
          <div className="flex flex-col items-end">
            <div className="text-[10px] leading-[12px] whitespace-nowrap text-tertiary">
              Accepted, unpaid · <AnimatedNumber value={accepted.length} />
            </div>
            <AnimatedNumber value={unpaid} format={USD} className="text-[15px] leading-none font-semibold tracking-tight text-ios-green" />
          </div>
        }
      />

      <ul className="m-0 mt-auto flex list-none flex-col gap-2 p-0">
        {offers.map((o, i) => {
          const flash = hit?.n === i;
          const st = STATUS[o.status];
          const nd = nudged[o.number];
          return (
            <motion.li
              key={o.number}
              className={cn(
                "relative flex h-[37px] items-center gap-2",
                i > 0 && "before:absolute before:inset-x-0 before:-top-1 before:h-[0.5px] before:bg-split",
              )}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + i * 0.06, type: "spring", stiffness: 380, damping: 28 }}
            >
              <AnimatePresence>
                {flash ? (
                  <motion.span
                    key={hit!.at}
                    className="pointer-events-none absolute inset-x-[-6px] inset-y-0 bg-ios-teal/15"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 1.4, ease: "easeOut" }}
                  />
                ) : null}
              </AnimatePresence>
              <MemojiAvatar who={o.face} size={26} />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[12px] font-medium text-heading">{o.customer}</div>
                <div className="truncate text-[10.5px] text-tertiary tabular">
                  {o.number} · {money(o.total)} · {o.trip}
                </div>
              </div>
              <span
                className={cn(
                  "flex w-[34px] shrink-0 items-center justify-end gap-0.5 text-[11px] tabular transition-colors duration-mid",
                  flash ? "text-ios-teal" : "text-tertiary",
                )}
              >
                <Eye16Regular className="text-[12px]" />
                <AnimatedNumber value={o.views} />
              </span>
              <motion.span
                layout
                className={cn("flex h-5 w-[62px] shrink-0 items-center justify-center rounded-full text-[10px] font-semibold", st.className)}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={o.status}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ type: "spring", stiffness: 500, damping: 24 }}
                  >
                    {st.label}
                  </motion.span>
                </AnimatePresence>
              </motion.span>
              <div className="flex w-[64px] shrink-0 justify-end">
                {o.status === "sent" ? (
                  <Button
                    size="small"
                    shape="round"
                    color={nd === "done" ? "green" : "default"}
                    variant="filled"
                    loading={nd === "sending"}
                    icon={nd === "done" ? <Checkmark16Filled /> : nd ? undefined : <Send16Regular />}
                    onClick={() => nudge(o.number)}
                    className={cn("h-[22px] w-[64px] px-0 text-[11px] font-semibold", nd === "done" && "text-ios-green")}
                  >
                    {nd === "done" ? "Sent" : "Nudge"}
                  </Button>
                ) : (
                  <span className="text-[10px] text-tertiary">{o.status === "accepted" ? "Deposit due" : "Closed"}</span>
                )}
              </div>
            </motion.li>
          );
        })}
      </ul>
    </Widget>
  );
}

/** The header's eye: it blinks (lid closes and opens) each time a view lands. */
function BlinkingEye({ blink }: { blink: number }) {
  return (
    <motion.span
      key={blink}
      className="grid place-items-center"
      initial={false}
      animate={blink ? { scaleY: [1, 0.1, 1, 0.1, 1] } : { scaleY: 1 }}
      transition={{ duration: 0.55, times: [0, 0.2, 0.45, 0.65, 1] }}
    >
      <Eye20Filled />
    </motion.span>
  );
}
