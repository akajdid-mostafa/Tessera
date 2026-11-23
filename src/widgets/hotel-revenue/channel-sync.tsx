import { ArrowClockwise12Regular, ArrowSync20Filled, Checkmark12Filled, ErrorCircle12Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { PROPERTY, ago } from "./_parts-b";

type SyncState = "synced" | "pending" | "failed";
type SyncErrorCode = "channel_rejected" | "mapping_missing" | "credentials_invalid" | "timeout";

type Channel = {
  id: number;
  name: string;
  suspended?: boolean;
  status: SyncState;
  /** Seconds before the widget opened that the channel last went through. */
  lastSyncedAgo: number | null;
  error: SyncErrorCode | null;
  roomType?: string;
};

const CHANNELS: Channel[] = [
  { id: 1, name: "Online", status: "synced", lastSyncedAgo: 40, error: null },
  { id: 6, name: "Booking.com", status: "pending", lastSyncedAgo: 260, error: null },
  { id: 2, name: "Expedia", status: "failed", lastSyncedAgo: 3 * 3600 + 600, error: "credentials_invalid" },
  { id: 4, name: "iCal", status: "failed", lastSyncedAgo: 5400, error: "mapping_missing", roomType: "Villa" },
  { id: 5, name: "StayFinder", suspended: true, status: "synced", lastSyncedAgo: null, error: null },
];

const ERROR: Record<SyncErrorCode, [short: string, long: string]> = {
  channel_rejected: ["Rejected", "The channel refused the last changes."],
  mapping_missing: ["Mapping missing", "A room type or rate is not mapped on the channel."],
  credentials_invalid: ["Credentials invalid", "The channel's credentials are not valid."],
  timeout: ["Timed out", "The channel did not answer in time."],
};

type Live = { status: SyncState; at: number | null; error: SyncErrorCode | null };

/** Revenue · medium. Each channel's sync state with a live last-synced time; retry a failed channel and watch it go pending, then synced. */
export function ChannelSyncWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const opened = useRef(Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [live, setLive] = useState<Record<number, Live>>(() =>
    Object.fromEntries(
      CHANNELS.map((c) => [
        c.id,
        {
          status: c.status,
          at: c.lastSyncedAgo === null ? null : opened.current - c.lastSyncedAgo * 1000,
          error: c.error,
        },
      ]),
    ),
  );

  // The clock that ages every "last synced".
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  // A pending channel goes through after a short while.
  const pendingIds = CHANNELS.filter((c) => live[c.id].status === "pending")
    .map((c) => c.id)
    .join(",");
  useEffect(() => {
    if (!pendingIds) return;
    const ids = pendingIds.split(",").map(Number);
    const t = window.setTimeout(() => {
      const at = Date.now();
      setLive((l) => {
        const next = { ...l };
        ids.forEach((id) => {
          if (next[id].status === "pending") next[id] = { status: "synced", at, error: null };
        });
        return next;
      });
    }, 2600);
    return () => window.clearTimeout(t);
  }, [pendingIds]);

  // Now and then a healthy channel takes a fresh push from the rate grid.
  useEffect(() => {
    const t = window.setInterval(() => {
      setLive((l) => {
        const healthy = CHANNELS.filter((c) => !c.suspended && l[c.id].status === "synced");
        if (!healthy.length) return l;
        const pick = healthy[Math.floor(Math.random() * healthy.length)];
        return { ...l, [pick.id]: { ...l[pick.id], status: "pending" } };
      });
    }, 9000);
    return () => window.clearInterval(t);
  }, []);

  const retry = (id: number) => setLive((l) => ({ ...l, [id]: { ...l[id], status: "pending", error: null } }));
  const failed = CHANNELS.filter((c) => live[c.id].status === "failed").length;

  return (
    <Widget size="medium" index={index} label="Channel sync">
      <WidgetHeader
        icon={<ArrowSync20Filled />}
        tint="var(--ios-blue)"
        title="Channel Sync"
        subtitle={`${PROPERTY} · ${CHANNELS.length} channels`}
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            {failed ? (
              <motion.span
                key="failed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mt-0.5 flex items-center gap-1 rounded-full bg-ios-red/15 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-ios-red"
              >
                <ErrorCircle12Filled /> <AnimatedNumber value={failed} /> failed
              </motion.span>
            ) : (
              <motion.span
                key="ok"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mt-0.5 flex items-center gap-1 rounded-full bg-ios-green/15 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-ios-green"
              >
                <Checkmark12Filled /> All in step
              </motion.span>
            )}
          </AnimatePresence>
        }
      />

      <div className="mt-1 flex flex-col gap-2">
        {CHANNELS.map((c, i) => {
          const s = live[c.id];
          const state: SyncState | "suspended" = c.suspended ? "suspended" : s.status;
          return (
            <motion.div
              key={c.id}
              className={cn(
                "relative flex h-[19px] items-center gap-2 text-[11px] whitespace-nowrap",
                i > 0 && "before:absolute before:inset-x-0 before:-top-1 before:h-[0.5px] before:bg-split",
              )}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 28, delay: delay + i * 0.05 }}
            >
              <Dot state={state} />
              <span
                className={cn(
                  "w-[84px] shrink-0 truncate text-[12px] font-semibold",
                  c.suspended ? "text-tertiary" : "text-heading",
                )}
              >
                {c.name}
              </span>
              <span className="min-w-0 flex-1 truncate">
                {state === "failed" && s.error ? (
                  <Tooltip title={`${ERROR[s.error][1]}${c.roomType ? ` (${c.roomType})` : ""}`}>
                    <span className="cursor-help font-medium text-ios-red">{ERROR[s.error][0]}</span>
                  </Tooltip>
                ) : state === "pending" ? (
                  <span className="font-medium text-ios-blue">Sending changes…</span>
                ) : state === "suspended" ? (
                  <span className="text-tertiary">Suspended · not sending</span>
                ) : (
                  <span className="text-secondary">Synced</span>
                )}
              </span>
              <span className="w-[58px] shrink-0 text-right text-tertiary tabular">
                {s.at === null || c.suspended ? "—" : ago(now - s.at)}
              </span>
              <span className="flex w-[50px] shrink-0 justify-end">
                <AnimatePresence mode="popLayout" initial={false}>
                  {state === "failed" ? (
                    <motion.button
                      key="retry"
                      type="button"
                      onClick={() => retry(c.id)}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.9 }}
                      className="flex h-[17px] cursor-pointer items-center gap-0.5 rounded-full bg-ios-red/15 px-1.5 text-[10px] font-semibold text-ios-red"
                    >
                      <ArrowClockwise12Regular className="size-2.5" />
                      Retry
                    </motion.button>
                  ) : state === "pending" ? (
                    <motion.span
                      key="spin"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, rotate: 360 }}
                      exit={{ opacity: 0 }}
                      transition={{ rotate: { duration: 0.9, repeat: Infinity, ease: "linear" } }}
                      className="mr-1 size-2.5 rounded-full border-[1.5px] border-ios-blue border-t-transparent"
                    />
                  ) : null}
                </AnimatePresence>
              </span>
            </motion.div>
          );
        })}
      </div>
    </Widget>
  );
}

function Dot({ state }: { state: SyncState | "suspended" }) {
  if (state === "pending")
    return (
      <span className="relative flex size-2 shrink-0">
        <motion.span
          className="absolute inset-0 rounded-full bg-ios-blue"
          animate={{ scale: [1, 2.2], opacity: [0.55, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.span
          className="relative size-2 rounded-full bg-ios-blue"
          animate={{ opacity: [1, 0.45, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </span>
    );
  return (
    <motion.span
      className={cn(
        "size-2 shrink-0 rounded-full",
        state === "synced" && "bg-ios-green",
        state === "failed" && "bg-ios-red",
        state === "suspended" && "bg-fill",
      )}
      animate={{ scale: [1.6, 1] }}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
      key={state}
    />
  );
}
