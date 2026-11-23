import {
  Checkmark16Filled,
  CheckmarkCircle16Filled,
  Dismiss16Regular,
  PersonClock20Filled,
  Warning12Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

/* Customer Support, five agents, at least three on shift every working day. */
const TEAM = [
  { id: "sofia", name: "Sofia Marin", who: "f6" },
  { id: "james", name: "James Okafor", who: "m5" },
  { id: "mei", name: "Mei Lin", who: "f8" },
  { id: "daniel", name: "Daniel Costa", who: "m10" },
  { id: "kai", name: "Kai Andersen", who: "m2" },
] as const;
type Member = (typeof TEAM)[number]["id"];
const MIN = 3;

const DAYS = ["Wed 11", "Thu 12", "Fri 13", "Mon 16", "Tue 17", "Wed 18", "Thu 19"];
/** Already booked: Kai is off sick Thu–Fri, Daniel is on leave Fri and at a training Wed 18. */
const BOOKED: Record<number, { who: Member; why: string }[]> = {
  1: [{ who: "kai", why: "sick" }],
  2: [
    { who: "kai", why: "sick" },
    { who: "daniel", why: "vacation" },
  ],
  5: [{ who: "daniel", why: "training" }],
};

type Request = { id: string; who: Member; kind: string; range: string; days: number[]; balance: string };
const REQUESTS: Request[] = [
  { id: "r1", who: "sofia", kind: "Vacation", range: "Thu 12 – Mon 16", days: [1, 2, 3], balance: "14 of 25 days left" },
  { id: "r2", who: "james", kind: "Personal day", range: "Tue 17", days: [4], balance: "2 of 3 left" },
  { id: "r3", who: "mei", kind: "Vacation", range: "Wed 18 – Thu 19", days: [5, 6], balance: "9 of 25 days left" },
];

type Phase = "idle" | "confirm" | "approved" | "declined";
const CONFIRM_MS = 5000;

/** HR · medium. A leave request with the team's cover for the week; approving one that drops a day below minimum asks you to confirm. */
export function LeaveRequestWidget({ index }: { index?: number }) {
  const [queue, setQueue] = useState(REQUESTS);
  const [phase, setPhase] = useState<Phase>("idle");
  const [approved, setApproved] = useState<Request[]>([]);
  const delay = 0.3 + (index ?? 0) * 0.06;

  const req = queue[0];
  const member = req ? TEAM.find((m) => m.id === req.who)! : null;

  const offOn = (d: number, withPending: boolean) => {
    const off = (BOOKED[d] ?? []).map((b) => ({ who: b.who, why: b.why }));
    for (const a of approved) if (a.days.includes(d)) off.push({ who: a.who, why: a.kind.toLowerCase() });
    if (withPending && req && phase !== "declined" && req.days.includes(d)) off.push({ who: req.who, why: "pending" });
    return off;
  };
  const conflict = req ? req.days.find((d) => TEAM.length - offOn(d, true).length < MIN) : undefined;

  useEffect(() => {
    if (phase === "confirm") {
      const t = window.setTimeout(() => setPhase("idle"), CONFIRM_MS);
      return () => window.clearTimeout(t);
    }
    if (phase === "approved" || phase === "declined") {
      const t = window.setTimeout(() => {
        if (phase === "approved" && req) setApproved((a) => [...a, req]);
        setQueue((q) => q.slice(1));
        setPhase("idle");
      }, 950);
      return () => window.clearTimeout(t);
    }
  }, [phase, req]);

  const approve = () => {
    if (conflict !== undefined && phase === "idle") setPhase("confirm");
    else setPhase("approved");
  };

  return (
    <Widget size="medium" index={index} label="Leave requests">
      <WidgetHeader
        icon={<PersonClock20Filled />}
        tint="var(--ios-orange)"
        title="Leave Requests"
        subtitle={`Customer Support · min ${MIN} on shift`}
        extra={
          <span className="inline-flex items-center gap-1 rounded-full bg-fill-tertiary px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-secondary">
            <AnimatedNumber value={queue.length} trend={-1} /> pending
          </span>
        }
      />

      <div className="relative mt-2.5 h-[36px]">
        <AnimatePresence mode="popLayout" initial={false}>
          {req && member ? (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30, filter: "blur(4px)", transition: { duration: 0.22 } }}
              transition={{ type: "spring", stiffness: 360, damping: 28, delay: queue.length === REQUESTS.length ? delay : 0 }}
              className="absolute inset-0 flex items-center gap-2.5"
            >
              <MemojiAvatar who={member.who} size={36} />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[13px] font-semibold text-heading">
                  {member.name} <span className="font-normal text-tertiary">· {req.kind}</span>
                </div>
                <div className="truncate text-[11px] text-tertiary">
                  <span className="font-medium text-secondary">{req.range}</span> · {req.days.length}{" "}
                  {req.days.length === 1 ? "day" : "days"} · {req.balance}
                </div>
              </div>
              <Actions phase={phase} conflict={conflict !== undefined} onApprove={approve} onDecline={() => setPhase("declined")} onCancel={() => setPhase("idle")} />
            </motion.div>
          ) : (
            <motion.div
              key="clear"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center gap-2"
            >
              <CheckmarkCircle16Filled className="text-[22px] text-ios-green" />
              <div className="leading-tight">
                <div className="text-[13px] font-semibold text-heading">All requests handled</div>
                <div className="text-[11px] text-tertiary">Cover holds at {MIN}+ every day this week</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-auto">
        <div className="flex h-[14px] items-center justify-between text-[11px] leading-none">
          <span className="text-tertiary">Team cover</span>
          <AnimatePresence mode="popLayout" initial={false}>
            {conflict !== undefined && phase !== "declined" ? (
              <motion.span
                key={`c-${req?.id}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="inline-flex items-center gap-1 font-semibold text-ios-red"
              >
                <Warning12Filled />
                {DAYS[conflict]} drops to {TEAM.length - offOn(conflict, true).length} on shift
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {DAYS.map((label, d) => {
            const off = offOn(d, true);
            const on = TEAM.length - off.length;
            const short = on < MIN;
            const pending = !!req && phase !== "declined" && req.days.includes(d);
            return (
              <Tooltip
                key={label}
                title={off.length ? `Off: ${off.map((o) => `${TEAM.find((m) => m.id === o.who)!.name.split(" ")[0]} (${o.why})`).join(", ")}` : "Full team on shift"}
              >
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 380, damping: 24, delay: delay + 0.15 + d * 0.04 }}
                  className={cn(
                    "flex h-[50px] cursor-default flex-col items-center justify-center gap-1 rounded-lg transition-colors duration-300",
                    short ? "bg-ios-red/12 ring-1 ring-ios-red/40 ring-inset" : pending ? "bg-ios-orange/10" : "bg-fill-quaternary",
                  )}
                >
                  <span className="text-[10px] leading-none whitespace-nowrap text-tertiary">{label}</span>
                  <span className="flex gap-[2px]">
                    {TEAM.map((m) => {
                      const o = off.find((x) => x.who === m.id);
                      return (
                        <motion.span
                          key={m.id}
                          className={cn(
                            "size-[5px] rounded-full",
                            !o ? "bg-ios-teal" : o.why === "pending" ? "bg-ios-orange" : "bg-fill",
                          )}
                          animate={o?.why === "pending" ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
                          transition={o?.why === "pending" ? { duration: 1.4, repeat: Infinity } : { duration: 0.2 }}
                        />
                      );
                    })}
                  </span>
                  <span className={cn("text-[11px] leading-none font-semibold tabular", short ? "text-ios-red" : "text-heading")}>
                    <AnimatedNumber value={on} />
                    <span className="font-normal text-tertiary">/{TEAM.length}</span>
                  </span>
                </motion.div>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </Widget>
  );
}

function Actions({
  phase,
  conflict,
  onApprove,
  onDecline,
  onCancel,
}: {
  phase: Phase;
  conflict: boolean;
  onApprove: () => void;
  onDecline: () => void;
  onCancel: () => void;
}) {
  if (phase === "approved" || phase === "declined") {
    const ok = phase === "approved";
    return (
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 520, damping: 16 }}
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold",
          ok ? "bg-ios-green/15 text-ios-green" : "bg-fill-tertiary text-secondary",
        )}
      >
        {ok ? <Checkmark16Filled /> : <Dismiss16Regular />}
        {ok ? "Approved" : "Declined"}
      </motion.span>
    );
  }
  if (phase === "confirm") {
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        <Button size="small" shape="circle" variant="filled" color="default" icon={<Dismiss16Regular />} aria-label="Cancel" onClick={onCancel} />
        <Button size="small" shape="round" color="danger" variant="solid" className="relative overflow-hidden font-semibold" onClick={onApprove}>
          Approve anyway
          <motion.span
            className="absolute bottom-0 left-0 h-[2px] bg-white/70"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: CONFIRM_MS / 1000, ease: "linear" }}
          />
        </Button>
      </div>
    );
  }
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <Button size="small" shape="circle" variant="filled" color="default" icon={<Dismiss16Regular />} aria-label="Decline" onClick={onDecline} />
      <Button size="small" shape="round" type="primary" className="font-semibold" icon={conflict ? <Warning12Filled /> : <Checkmark16Filled />} onClick={onApprove}>
        Approve
      </Button>
    </div>
  );
}
