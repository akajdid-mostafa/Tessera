import { Checkmark16Filled, CheckmarkCircle16Filled, Dismiss16Filled, Hourglass20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { PRODUCT, usd } from "./_parts-a";

type Option = {
  reference: string;
  lead: string;
  pax: number;
  product: string;
  departure: string;
  total: number;
  /** Minutes until `optionExpiresAt`; zero or less means the option lapsed to `expired`. */
  left: number;
};

/* Kaibab Yonder's option bookings from the seed, re-timed to this morning. */
const SEED: Option[] = [
  { reference: "KY-26-0403", lead: "Brandon Ames", pax: 2, product: PRODUCT.sedona, departure: "Nov 12, 08:00", total: 330, left: -190 },
  { reference: "KY-26-0402", lead: "Sarah Kane", pax: 4, product: PRODUCT.sedona, departure: "Nov 19, 08:00", total: 660, left: 162 },
  { reference: "KY-26-0408", lead: "Olivia Yates", pax: 2, product: PRODUCT.lodge, departure: "Nov 14 · 1 night B&B", total: 312, left: 14 * 60 + 25 },
];
/** The option window the ring measures against (an option holds for up to 72 h). */
const WINDOW = 72 * 60;
const EXTEND = 24 * 60;

const urgency = (left: number) =>
  left <= 0 ? "red" : left < 6 * 60 ? "red" : left < 24 * 60 ? "orange" : "green";
const STROKE = { red: "var(--ios-red)", orange: "var(--ios-orange)", green: "var(--ios-green)" } as const;
const TEXT = { red: "text-ios-red", orange: "text-ios-orange", green: "text-ios-green" } as const;

const fmtLeft = (m: number) => {
  const a = Math.abs(m);
  const h = Math.floor(a / 60);
  const mm = a % 60;
  return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h ${String(mm).padStart(2, "0")}m`;
};

/** A ring around the lead's memoji that empties as the option runs out. */
function HoursRing({ left, who, delay }: { left: number; who: string; delay: number }) {
  const tone = urgency(left);
  const frac = left <= 0 ? 0 : Math.min(1, left / WINDOW);
  return (
    <span className="relative grid size-[30px] shrink-0 place-items-center">
      <svg viewBox="0 0 30 30" className="absolute inset-0 -rotate-90">
        <circle cx={15} cy={15} r={13.5} fill="none" strokeWidth={2.5} stroke={left <= 0 ? "var(--ios-red)" : "var(--ant-color-fill-secondary)"} strokeOpacity={left <= 0 ? 0.55 : 1} strokeDasharray={left <= 0 ? "2.6 2.4" : undefined} />
        <motion.circle
          cx={15}
          cy={15}
          r={13.5}
          fill="none"
          strokeWidth={2.5}
          strokeLinecap="round"
          stroke={STROKE[tone]}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: frac }}
          transition={{ type: "spring", stiffness: 90, damping: 18, delay }}
        />
      </svg>
      <MemojiAvatar who={who} size={22} className={cn(left <= 0 && "opacity-60 grayscale")} />
    </span>
  );
}

/** Tour sales · medium. Option bookings by optionExpiresAt with a live hours-left ring; Confirm slides a row out, Extend adds 24 h and refills the ring. */
export function OptionsExpiringWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [rows, setRows] = useState(SEED);
  const [done, setDone] = useState<string | null>(null);
  const [bumped, setBumped] = useState<{ ref: string; n: number } | null>(null);

  // The clock runs: every tick an open option loses a minute.
  useEffect(() => {
    const t = window.setInterval(() => {
      setRows((rs) => rs.map((r) => (r.left > 0 ? { ...r, left: r.left - 1 } : r)));
    }, 2000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => {
      setRows((rs) => rs.filter((r) => r.reference !== done));
      setDone(null);
    }, 650);
    return () => window.clearTimeout(t);
  }, [done]);

  useEffect(() => {
    if (!bumped) return;
    const t = window.setTimeout(() => setBumped(null), 1100);
    return () => window.clearTimeout(t);
  }, [bumped]);

  const extend = (ref: string) => {
    const n = Date.now();
    setRows((rs) => rs.map((r) => (r.reference === ref ? { ...r, left: Math.max(r.left, 0) + EXTEND } : r)));
    setBumped({ ref, n });
  };

  const sorted = [...rows].sort((a, b) => a.left - b.left);
  const open = rows.filter((r) => r.left > 0 && r.reference !== done);
  const lapsed = rows.filter((r) => r.left <= 0).length;
  const onHold = open.reduce((s, r) => s + r.total, 0);

  return (
    <Widget size="medium" index={index} label="Options expiring">
      <WidgetHeader
        icon={<Hourglass20Filled />}
        tint="var(--ios-orange)"
        title="Options expiring"
        subtitle={
          <span className="tabular">
            <AnimatedNumber value={open.length} /> on hold · <AnimatedNumber value={onHold} prefix="$" />
          </span>
        }
        extra={
          <AnimatePresence>
            {lapsed > 0 ? (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="rounded-full bg-ios-red/15 px-2 py-0.5 text-[11px] font-semibold text-ios-red tabular"
              >
                {lapsed} expired
              </motion.span>
            ) : null}
          </AnimatePresence>
        }
      />

      <ul className="relative mt-1.5 flex min-h-0 flex-1 flex-col gap-1.5">
        <AnimatePresence>
          {sorted.map((r, i) => {
            const expired = r.left <= 0;
            const tone = urgency(r.left);
            const confirming = done === r.reference;
            return (
              <motion.li
                key={r.reference}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 80, transition: { duration: 0.28 } }}
                transition={{
                  layout: { type: "spring", stiffness: 380, damping: 34 },
                  default: { type: "spring", stiffness: 380, damping: 28, delay: delay + i * 0.07 },
                }}
                className={cn(
                  "relative -mx-1.5 flex h-[38px] shrink-0 items-center gap-2.5 rounded-[8px] px-1.5",
                  i > 0 && "before:absolute before:inset-x-1.5 before:-top-[3.5px] before:h-[0.5px] before:bg-split",
                )}
              >
                <AnimatePresence>
                  {confirming ? (
                    <motion.span
                      key="confirm"
                      aria-hidden
                      className="absolute inset-0 rounded-[8px] bg-ios-green"
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: 0.1 }}
                      transition={{ duration: 0.6 }}
                    />
                  ) : expired ? (
                    <span key="expired" aria-hidden className="absolute inset-0 rounded-[8px] bg-ios-red/8" />
                  ) : null}
                </AnimatePresence>
                <HoursRing left={r.left} who={r.lead} delay={delay + 0.2 + i * 0.08} />
                <div className="relative min-w-0 flex-1 leading-tight">
                  <div className="truncate text-[12px] font-medium text-heading">
                    {r.lead} <span className="font-normal text-tertiary tabular">· {r.pax} pax</span>
                  </div>
                  <Tooltip title={`${r.departure} · ${usd(r.total)}`}>
                    <div className="truncate text-[10px] text-tertiary tabular">
                      {r.reference} · {r.product}
                    </div>
                  </Tooltip>
                </div>
                <div className="relative w-[50px] shrink-0 text-right leading-tight">
                  <div className={cn("text-[11px] font-semibold tabular", TEXT[tone])}>
                    {confirming ? <span className="text-ios-green">Done</span> : expired ? "Expired" : fmtLeft(r.left)}
                  </div>
                  <div className="text-[10px] text-tertiary tabular">
                    {confirming ? "confirmed" : expired ? `${fmtLeft(r.left)} ago` : "left"}
                  </div>
                  <AnimatePresence>
                    {bumped?.ref === r.reference ? (
                      <motion.span
                        key={bumped.n}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: -10 }}
                        exit={{ opacity: 0, y: -16 }}
                        className="pointer-events-none absolute right-0 -top-1 rounded-full bg-ios-green-deep px-1.5 text-[10px] font-semibold text-white"
                      >
                        +24h
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>
                <div className="relative flex shrink-0 items-center gap-1">
                  {expired ? (
                    <Tooltip title="Seats go back on sale">
                      <Button
                        size="small"
                        color="red"
                        variant="filled"
                        className="w-[72px] px-0 text-[11px] font-medium"
                        aria-label={`Release ${r.reference}`}
                        icon={<Dismiss16Filled className="size-3" />}
                        onClick={() => setRows((rs) => rs.filter((x) => x.reference !== r.reference))}
                      >
                        Release
                      </Button>
                    </Tooltip>
                  ) : (
                    <>
                      <Tooltip title="Confirm booking">
                        <Button
                          size="small"
                          shape="circle"
                          color="green"
                          variant="filled"
                          aria-label={`Confirm ${r.reference}`}
                          disabled={confirming}
                          icon={<Checkmark16Filled className="size-3.5" />}
                          onClick={() => setDone(r.reference)}
                        />
                      </Tooltip>
                      <Button
                        size="small"
                        color="default"
                        variant="filled"
                        className="w-[44px] px-0 text-[11px] font-medium tabular"
                        aria-label={`Extend ${r.reference} by 24 hours`}
                        disabled={confirming}
                        onClick={() => extend(r.reference)}
                      >
                        +24h
                      </Button>
                    </>
                  )}
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
        <AnimatePresence>
          {rows.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center"
            >
              <CheckmarkCircle16Filled className="size-6 text-ios-green" />
              <div className="text-[13px] font-medium text-heading">No options on hold</div>
              <div className="text-[11px] text-tertiary">Every seat is confirmed or released</div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </ul>
    </Widget>
  );
}
