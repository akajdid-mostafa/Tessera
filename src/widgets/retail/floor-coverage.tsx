import { Checkmark16Filled, PeopleTeam20Filled, Send16Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

/* Associates on the floor per hour, 08:00–22:00. It is 16:20. */
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const NEEDED = [3, 4, 6, 7, 8, 8, 8, 9, 10, 11, 11, 10, 7, 4];
const ROSTER = [3, 4, 6, 7, 8, 9, 8, 9, 9, 10, 10, 10, 7, 4];
const NOW = 8;
/** The cover shift on offer, 16:30–19:00. */
const SHIFT = [8, 9, 10];
const PICKERS = ["Priya Nair", "Jonah Reyes", "Ellie Kane"];
const MAX = 12;
const BAR_H = 36;

type Phase = "idle" | "sent" | "taken";

const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

/** Retail · medium. Associates rostered per hour against the floor's need, with a short window this evening; offer the cover shift and a teammate takes it as the bars fill. */
export function FloorCoverageWidget({ index }: { index?: number }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [hover, setHover] = useState<number | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    if (phase !== "sent") return;
    const t = window.setTimeout(() => setPhase("taken"), 2600);
    return () => window.clearTimeout(t);
  }, [phase]);

  const roster = ROSTER.map((n, i) => n + (phase === "taken" && SHIFT.includes(i) ? 1 : 0));
  const i = hover ?? NOW;
  const gap = roster[i] - NEEDED[i];
  const shortHours = roster.filter((n, k) => k >= NOW && n < NEEDED[k]).length;

  return (
    <Widget size="medium" index={index} label="Floor coverage">
      <WidgetHeader
        icon={<PeopleTeam20Filled />}
        tint="var(--ios-indigo)"
        title="Floor Coverage"
        subtitle={
          shortHours ? (
            <>
              <AnimatedNumber value={shortHours} /> short {shortHours === 1 ? "hour" : "hours"} left today
            </>
          ) : (
            "Covered to close"
          )
        }
      />

      <div className="mt-1.5 flex h-[28px] items-baseline-last gap-2 whitespace-nowrap">
        <div className="leading-none">
          <AnimatedNumber value={roster[i]} className="text-[26px] font-semibold tracking-tight text-heading" />
          <span className="text-[13px] font-medium text-tertiary">
            {" "}
            of <AnimatedNumber value={NEEDED[i]} /> needed
          </span>
        </div>
        <span
          className={cn(
            "mb-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
            gap < -1 ? "bg-ios-red/15 text-ios-red" : gap < 0 ? "bg-ios-orange/15 text-ios-orange" : "bg-ios-green/15 text-ios-green",
          )}
        >
          {gap < 0 ? `Short ${-gap}` : gap > 0 ? `+${gap} spare` : "Covered"}
        </span>
        <span className="mb-0.5 ml-auto text-[11px] text-tertiary tabular">
          {hover === null ? "Now · 16:20" : i < NOW ? `${hh(HOURS[i])} · worked` : hh(HOURS[i])}
        </span>
      </div>

      <div className="relative mt-2" onPointerLeave={() => setHover(null)}>
        <div className="flex h-[36px] items-end gap-[3px]">
          {HOURS.map((h, k) => {
            const short = roster[k] - NEEDED[k];
            const past = k < NOW;
            return (
              <div
                key={h}
                className="relative flex h-full flex-1 cursor-crosshair items-end"
                onPointerEnter={() => setHover(k)}
              >
                <motion.div
                  className={cn(
                    "w-full rounded-[3px]",
                    short < -1 ? "bg-ios-red" : short < 0 ? "bg-ios-orange" : past ? "bg-fill" : "bg-ios-indigo",
                  )}
                  initial={{ height: 2 }}
                  animate={{
                    height: (roster[k] / MAX) * BAR_H,
                    opacity: hover === null || hover === k ? 1 : 0.4,
                  }}
                  transition={{
                    height: { type: "spring", stiffness: 200, damping: 20, delay: phase === "taken" ? Math.max(0, k - NOW) * 0.08 : delay + k * 0.03 },
                    opacity: { duration: 0.15 },
                  }}
                />
                <span
                  className="pointer-events-none absolute inset-x-0 h-[2px] rounded-full bg-[var(--ant-color-text-secondary)]"
                  style={{ bottom: (NEEDED[k] / MAX) * BAR_H - 1 }}
                />
              </div>
            );
          })}
        </div>
        <div
          className="pointer-events-none absolute -top-0.5 bottom-0 w-[1.5px] rounded-full bg-ios-red"
          style={{ left: `${((NOW + 0.33) / HOURS.length) * 100}%` }}
        />
        <div className="mt-0.5 flex text-[9.5px] leading-[12px] text-tertiary tabular">
          {HOURS.map((h, k) => (
            <span key={h} className={cn("flex-1 text-center", k === NOW && "font-semibold text-ios-red")}>
              {k === NOW ? "NOW" : h % 3 === 2 && Math.abs(k - NOW) > 1 ? h : ""}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto flex h-6 items-center gap-2">
        <AnimatePresence mode="wait" initial={false}>
          {phase === "taken" ? (
            <motion.div
              key="taken"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex min-w-0 flex-1 items-center gap-1.5 text-[12px]"
            >
              <MemojiAvatar who={PICKERS[0]} size={22} className="ring-[1.5px] ring-ios-green" />
              <span className="truncate text-secondary">
                <span className="font-semibold text-heading">Priya</span> took 16:30–19:00
              </span>
            </motion.div>
          ) : (
            <motion.div key="who" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-w-0 flex-1 items-center gap-1.5">
              <div className="flex">
                {PICKERS.map((p, k) => (
                  <MemojiAvatar key={p} who={p} size={22} className={cn("ring-[1.5px] ring-[var(--widget-surface)]", k && "-ml-1.5")} />
                ))}
              </div>
              <span className="truncate text-[12px] text-tertiary">
                {phase === "sent" ? "Waiting for a reply…" : "3 can cover 16:30–19"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        {phase === "taken" ? (
          <span className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-ios-green">
            <Checkmark16Filled className="size-3.5" /> Filled
          </span>
        ) : (
          <Button
            size="small"
            color="primary"
            variant={phase === "sent" ? "filled" : "solid"}
            loading={phase === "sent"}
            icon={phase === "sent" ? undefined : <Send16Regular />}
            onClick={() => setPhase("sent")}
          >
            {phase === "sent" ? "Sent" : "Offer shift"}
          </Button>
        )}
      </div>
    </Widget>
  );
}
