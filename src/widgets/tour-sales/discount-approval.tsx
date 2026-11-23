import {
  ArrowClockwise16Regular,
  ArrowRight12Regular,
  Checkmark16Filled,
  CheckmarkCircle20Filled,
  Dismiss16Filled,
  DismissCircle20Filled,
  TagPercent20Filled,
  Warning12Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { entranceDelay, money, USD } from "./_parts-b";

type Request = {
  id: string;
  /** A booking reference, or a custom offer's number. */
  reference: string;
  subject: "booking" | "customOffer";
  product: string;
  requestedBy: string;
  face: string;
  age: string;
  previousBps: number;
  requestedBps: number;
  totalBefore: number;
  totalAfter: number;
  marginBefore: number;
  marginAfter: number;
  reason: string;
};

/* List price × (1 − rate); the margin is that total less the trip's cost. */
const REQUESTS: Request[] = [
  {
    id: "dap_kaibab_001",
    reference: "KY-26-0405",
    subject: "booking",
    product: "Montezuma Castle Tour",
    requestedBy: "Megan Ayers",
    face: "f3",
    age: "2h ago",
    previousBps: 3000,
    requestedBps: 3500,
    totalBefore: 5_040,
    totalAfter: 4_680,
    marginBefore: 290,
    marginAfter: -70,
    reason: "School group of 4, competitor quoted 35%",
  },
  {
    id: "dap_kaibab_002",
    reference: "TKL-26-0014",
    subject: "customOffer",
    product: "Sedona and Oak Creek · 3 nights",
    requestedBy: "Ashley Sanders",
    face: "f6",
    age: "5h ago",
    previousBps: 1000,
    requestedBps: 1500,
    totalBefore: 5_760,
    totalAfter: 5_440,
    marginBefore: 1_640,
    marginAfter: 1_320,
    reason: "Returning family, stayed at Oak Creek Cabins last July",
  },
  {
    id: "dap_kaibab_003",
    reference: "KY-26-0412",
    subject: "booking",
    product: "Sedona Day Tour",
    requestedBy: "Mike Dunn",
    face: "m4",
    age: "Yesterday",
    previousBps: 0,
    requestedBps: 1200,
    totalBefore: 1_840,
    totalAfter: 1_619.2,
    marginBefore: 250,
    marginAfter: 29.2,
    reason: "Off-season weekday departure, 9 pax on one booking",
  },
];

type Decision = { id: string; kind: "approved" | "rejected" };

/** Tour sales · medium. A pending discount request applies itself (rate, total and margin roll, a loss turns red); Approve or Reject flips the card, the queue count rolls down and the next request slides in. */
export function DiscountApprovalWidget({ index }: { index?: number }) {
  const delay = entranceDelay(index);
  const [queue, setQueue] = useState<string[]>(() => REQUESTS.map((r) => r.id));
  const [decision, setDecision] = useState<Decision | null>(null);
  const first = useRef(true);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const current = REQUESTS.find((r) => r.id === queue[0]);

  const decide = (kind: Decision["kind"]) => {
    if (!current || decision) return;
    const id = current.id;
    first.current = false;
    setDecision({ id, kind });
    timer.current = window.setTimeout(() => {
      setQueue((q) => q.filter((x) => x !== id));
      setDecision(null);
    }, 1600);
  };

  const waiting = queue.length - (decision ? 1 : 0);

  return (
    <Widget size="medium" index={index} label="Discount approvals">
      <WidgetHeader
        icon={<TagPercent20Filled />}
        tint="var(--ios-orange)"
        title="Discount approval"
        subtitle="Over the sales limit · asked of you"
        extra={
          <span
            className={cn(
              "flex h-6 items-center gap-1 rounded-full px-2.5 text-[11px] font-medium transition-colors duration-mid",
              waiting ? "bg-ios-orange/15 text-ios-orange" : "bg-ios-green/15 text-ios-green",
            )}
          >
            <AnimatedNumber value={waiting} className="text-[13px] font-semibold" />
            waiting
          </span>
        }
      />

      <div className="relative mt-2 min-h-0 flex-1" style={{ perspective: 700 }}>
        <AnimatePresence mode="wait" initial={false}>
          {current ? (
            decision?.id === current.id ? (
              <DecidedFace key={`${current.id}-done`} request={current} kind={decision.kind} />
            ) : (
              <RequestFace
                key={current.id}
                request={current}
                applyAfter={first.current ? delay + 0.35 : 0.45}
                onApprove={() => decide("approved")}
                onReject={() => decide("rejected")}
              />
            )
          ) : (
            <motion.div
              key="empty"
              className="flex h-full flex-col items-center justify-center gap-1"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <CheckmarkCircle20Filled className="text-[26px] text-ios-green" />
              <div className="text-[13px] font-semibold text-heading">No discounts waiting</div>
              <button
                type="button"
                onClick={() => setQueue(REQUESTS.map((r) => r.id))}
                className="flex cursor-pointer items-center gap-1 text-[11px] text-tertiary transition-colors duration-mid hover:text-secondary"
              >
                <ArrowClockwise16Regular /> Reload requests
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Widget>
  );
}

/** The request: who asked, the rate, total and margin before → after, the reason and the decision. */
function RequestFace({
  request: r,
  applyAfter,
  onApprove,
  onReject,
}: {
  request: Request;
  applyAfter: number;
  onApprove: () => void;
  onReject: () => void;
}) {
  // The asked discount lands a beat after the card does: the rate, the total and the margin roll to it.
  const [applied, setApplied] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setApplied(true), applyAfter * 1000);
    return () => window.clearTimeout(t);
  }, [applyAfter]);

  const margin = applied ? r.marginAfter : r.marginBefore;
  const loss = margin < 0;

  return (
    <motion.div
      className="flex h-full flex-col"
      style={{ transformOrigin: "50% 50%" }}
      initial={{ opacity: 0, x: 44 }}
      animate={{ opacity: 1, x: 0, rotateX: 0 }}
      exit={{ opacity: 0, rotateX: -80, transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
    >
      <div className="flex h-[28px] items-center gap-2">
        <MemojiAvatar who={r.face} size={28} />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[12px] font-semibold text-heading">{r.requestedBy}</span>
            <span className="shrink-0 text-[10px] text-tertiary">{r.age}</span>
          </div>
          <div className="truncate text-[10px] text-tertiary">
            <span className={cn("font-medium tabular", r.subject === "customOffer" ? "text-ios-purple" : "text-secondary")}>
              {r.reference}
            </span>{" "}
            · {r.product}
          </div>
        </div>
        <span className="flex h-6 shrink-0 items-center gap-1 rounded-full bg-fill-tertiary px-2 text-[12px] tabular">
          <span className="text-tertiary">{r.previousBps / 100}%</span>
          <ArrowRight12Regular className="text-tertiary" />
          <AnimatedNumber
            value={(applied ? r.requestedBps : r.previousBps) / 10_000}
            format={{ style: "percent", maximumFractionDigits: 0 }}
            className="font-semibold text-ios-orange"
          />
        </span>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <div className="text-[10px] leading-[12px] text-tertiary">Total</div>
          <div className="flex items-center gap-1 whitespace-nowrap text-[13px] leading-[20px]">
            <span className="text-tertiary tabular">{money(r.totalBefore)}</span>
            <ArrowRight12Regular className="shrink-0 text-tertiary" />
            <AnimatedNumber value={applied ? r.totalAfter : r.totalBefore} format={USD} className="font-semibold text-heading" />
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex h-[12px] items-center gap-1 text-[10px] text-tertiary">
            Margin
            <AnimatePresence>
              {loss ? (
                <motion.span
                  className="flex items-center gap-0.5 font-semibold text-ios-red"
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Warning12Filled /> Loss with this discount
                </motion.span>
              ) : null}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-1 whitespace-nowrap text-[13px] leading-[20px]">
            <span className="text-tertiary tabular">{money(r.marginBefore)}</span>
            <ArrowRight12Regular className="shrink-0 text-tertiary" />
            <AnimatedNumber
              value={margin}
              format={USD}
              className={cn("font-semibold transition-colors duration-mid", loss ? "text-ios-red" : "text-heading")}
            />
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-end gap-2">
        <p className="m-0 line-clamp-2 min-w-0 flex-1 text-[11px] leading-[14px] text-secondary">
          <span className="text-tertiary">Reason · </span>
          {r.reason}
        </p>
        <Button
          size="small"
          shape="round"
          color="danger"
          variant="filled"
          icon={<Dismiss16Filled />}
          onClick={onReject}
          className="shrink-0 text-[11px] font-semibold"
        >
          Reject
        </Button>
        <Button
          size="small"
          shape="round"
          type="primary"
          icon={<Checkmark16Filled />}
          onClick={onApprove}
          className="shrink-0 text-[11px] font-semibold"
        >
          Approve
        </Button>
      </div>
    </motion.div>
  );
}

/** The back of the card once decided: the verdict, then it slides away for the next one. */
function DecidedFace({ request: r, kind }: { request: Request; kind: Decision["kind"] }) {
  const ok = kind === "approved";
  return (
    <motion.div
      className={cn(
        "flex h-full items-center gap-3 rounded-2xl px-4",
        ok ? "bg-ios-green/12" : "bg-ios-red/12",
      )}
      style={{ transformOrigin: "50% 50%" }}
      initial={{ opacity: 0, rotateX: 80 }}
      animate={{ opacity: 1, rotateX: 0, x: 0 }}
      exit={{ opacity: 0, x: -44, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
    >
      <motion.span
        className={cn("grid shrink-0 place-items-center text-[40px]", ok ? "text-ios-green" : "text-ios-red")}
        initial={{ scale: 0.3, rotate: -40 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 520, damping: 16, delay: 0.12 }}
      >
        {ok ? <CheckmarkCircle20Filled /> : <DismissCircle20Filled />}
      </motion.span>
      <div className="min-w-0 flex-1 leading-tight">
        <div className={cn("text-[15px] font-semibold", ok ? "text-ios-green" : "text-ios-red")}>
          {ok ? `Approved · ${r.requestedBps / 100}% off` : `Rejected · stays at ${r.previousBps / 100}%`}
        </div>
        <div className="mt-1 truncate text-[12px] text-secondary tabular">
          {r.reference} · total {money(ok ? r.totalAfter : r.totalBefore)}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-tertiary">
          <MemojiAvatar who={r.face} size={16} />
          {r.requestedBy.split(" ")[0]} is notified
        </div>
      </div>
    </motion.div>
  );
}
