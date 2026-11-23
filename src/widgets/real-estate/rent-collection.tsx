import { AlertOn16Regular, Checkmark16Filled, ReceiptMoney20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Status = "Paid" | "Due" | "Late";
const ROWS: { unit: string; tenant: string; amount: number; status: Status; note: string }[] = [
  { unit: "2A", tenant: "Emily Y.", amount: 2_450, status: "Paid", note: "Paid Nov 1 · ACH" },
  { unit: "3B", tenant: "Mark K.", amount: 1_875, status: "Due", note: "Due Nov 10" },
  { unit: "4A", tenant: "Sarah A.", amount: 2_100, status: "Late", note: "8 days overdue" },
];
const DUE = 24_800;
const COLLECTED = 18_625;
const PILL: Record<Status, string> = {
  Paid: "bg-ios-green/15 text-ios-green",
  Due: "bg-ios-orange/15 text-ios-orange",
  Late: "bg-ios-red/15 text-ios-red",
};
const USD = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const;

type Reminder = "idle" | "sending" | "sent";

/** Real estate · medium. Rent collected vs due, with tenant rows; ring a late tenant's bell to send a reminder. */
export function RentCollectionWidget({ index }: { index?: number }) {
  const [reminders, setReminders] = useState<Record<string, Reminder>>({});
  const delay = 0.3 + (index ?? 0) * 0.06;
  const pct = COLLECTED / DUE;
  const sent = Object.values(reminders).filter((r) => r === "sent").length;

  useEffect(() => {
    const sending = Object.keys(reminders).filter((k) => reminders[k] === "sending");
    if (!sending.length) return;
    const t = window.setTimeout(() => {
      setReminders((r) => ({ ...r, ...Object.fromEntries(sending.map((k) => [k, "sent" as const])) }));
    }, 750);
    return () => window.clearTimeout(t);
  }, [reminders]);

  const remind = (unit: string) => {
    if (reminders[unit]) return;
    setReminders((r) => ({ ...r, [unit]: "sending" }));
  };

  return (
    <Widget size="medium" index={index} label="Rent collection">
      <WidgetHeader
        icon={<ReceiptMoney20Filled />}
        tint="var(--ios-green)"
        title="Rent · November"
        subtitle="Brookline Residences · 12 units"
      />

      <div className="mt-2 flex min-h-0 flex-1 gap-3.5">
        <div className="flex w-[100px] shrink-0 flex-col">
          <div className="text-[11px] text-tertiary">Collected</div>
          <AnimatedNumber
            value={COLLECTED}
            format={{ ...USD, notation: "compact", maximumFractionDigits: 1 }}
            className="text-[24px] leading-none font-semibold tracking-tight text-heading"
          />
          <div className="mt-1 text-[11px] text-tertiary tabular">
            of $24.8K due
          </div>

          <div className="mt-auto">
            <div className="mb-1 flex items-baseline justify-between text-[11px] tabular">
              <AnimatedNumber value={pct} format={{ style: "percent", maximumFractionDigits: 0 }} className="font-semibold text-ios-green" />
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={sent}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-[10px] text-tertiary"
                >
                  {sent ? `${sent} nudged` : "8 of 12 paid"}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className="flex h-1.5 gap-[2px] overflow-hidden rounded-full bg-fill-secondary">
              <motion.span
                className="h-full rounded-full bg-ios-green"
                initial={{ width: 0 }}
                animate={{ width: `${pct * 100}%` }}
                transition={{ delay, type: "spring", stiffness: 70, damping: 16 }}
              />
              <motion.span
                className="h-full rounded-full bg-ios-orange/70"
                initial={{ width: 0 }}
                animate={{ width: `${(1_875 / DUE) * 100}%` }}
                transition={{ delay: delay + 0.35, type: "spring", stiffness: 90, damping: 18 }}
              />
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
          {ROWS.map((r, i) => {
            const state = reminders[r.unit] ?? "idle";
            return (
              <motion.div
                key={r.unit}
                className={cn("relative flex h-[36px] items-center gap-2", i > 0 && "before:absolute before:inset-x-0 before:-top-1 before:h-[0.5px] before:bg-split")}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.1 + i * 0.06, type: "spring", stiffness: 320, damping: 26 }}
              >
                <MemojiAvatar who={r.tenant} size={24} />
                <div className="min-w-0 flex-1 truncate text-[12px] font-medium text-heading">
                  {r.tenant} <span className="text-[10px] font-normal text-tertiary">{r.unit}</span>
                </div>
                <span className="text-[11px] text-secondary tabular">${r.amount.toLocaleString("en-US")}</span>
                <div className="flex w-[52px] shrink-0 items-center justify-end gap-1">
                  {r.status !== "Late" ? (
                    <Tooltip title={r.note}>
                      <span className={cn("rounded-full px-1.5 py-px text-[10px] font-semibold", PILL[r.status])}>
                        {r.status}
                      </span>
                    </Tooltip>
                  ) : (
                    <LateCell
                      note={r.note}
                      state={state}
                      onRemind={() => remind(r.unit)}
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Widget>
  );
}

/** The Late pill and its bell. The bell rings, then the pair folds into a green "Sent". */
function LateCell({
  note,
  state,
  onRemind,
}: {
  note: string;
  state: Reminder;
  onRemind: () => void;
}) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {state === "sent" ? (
        <motion.span
          key="sent"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 480, damping: 22 }}
          className="flex items-center gap-0.5 rounded-full bg-ios-green/15 px-1.5 py-px text-[10px] font-semibold text-ios-green"
        >
          <motion.span
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.08, type: "spring", stiffness: 500, damping: 16 }}
            className="grid"
          >
            <Checkmark16Filled className="size-2.5" />
          </motion.span>
          Sent
        </motion.span>
      ) : (
        <motion.span
          key="late"
          exit={{ opacity: 0, scale: 0.6 }}
          className="flex items-center gap-1"
        >
          <Tooltip title={note}>
            <span className="rounded-full bg-ios-red/15 px-1.5 py-px text-[10px] font-semibold text-ios-red">Late</span>
          </Tooltip>
          <Tooltip title="Send payment reminder">
            <motion.button
              type="button"
              aria-label="Send payment reminder"
              onClick={onRemind}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88 }}
              animate={state === "sending" ? { rotate: [0, -22, 18, -14, 10, -5, 0] } : { rotate: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="grid size-[18px] cursor-pointer place-items-center rounded-full bg-fill-secondary text-ios-red"
            >
              <AlertOn16Regular className="size-3" />
            </motion.button>
          </Tooltip>
        </motion.span>
      )}
    </AnimatePresence>
  );
}
