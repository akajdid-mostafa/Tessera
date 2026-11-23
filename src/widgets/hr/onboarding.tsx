import {
  Apps16Regular,
  Chat16Regular,
  Checkmark16Filled,
  ContactCard16Regular,
  Document16Regular,
  Food16Regular,
  Key16Regular,
  Laptop16Regular,
  PaintBrush16Regular,
  PeopleTeam16Regular,
  Presenter16Regular,
  Send16Regular,
  ShieldCheckmark16Regular,
  Target16Regular,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ComponentType, useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

type Status = "done" | "active" | "todo" | "blocked";
type Task = { id: string; name: string; owner: string; note: string; Glyph: ComponentType<{ className?: string }>; status: Status };

/* Ines Duarte started on Wed Nov 4; today, Mon Nov 9, is her fourth day. */
const DAYS: { label: string; tasks: Task[] }[] = [
  {
    label: "Wed 4",
    tasks: [
      { id: "laptop", name: "Laptop set up", owner: "IT", note: "Handed over 9:10 AM", Glyph: Laptop16Regular, status: "done" },
      { id: "sso", name: "Accounts and SSO", owner: "IT", note: "14 apps provisioned", Glyph: Key16Regular, status: "done" },
      { id: "lunch", name: "Team welcome lunch", owner: "Growth team", note: "6 people came", Glyph: Food16Regular, status: "done" },
    ],
  },
  {
    label: "Thu 5",
    tasks: [
      { id: "papers", name: "Contract and tax forms", owner: "People Ops", note: "Signed Thu 11:02 AM", Glyph: Document16Regular, status: "done" },
      { id: "security", name: "Security training", owner: "Security", note: "Passed 18/20", Glyph: ShieldCheckmark16Regular, status: "done" },
      { id: "badge", name: "Building badge", owner: "Facilities", note: "Requested Wed · 3 days late", Glyph: ContactCard16Regular, status: "blocked" },
    ],
  },
  {
    label: "Fri 6",
    tasks: [
      { id: "ds", name: "Design system tour", owner: "Kenji Mori", note: "Done Fri 2:00 PM", Glyph: PaintBrush16Regular, status: "done" },
      { id: "buddy", name: "Meet your buddy", owner: "Kenji Mori", note: "Coffee walk, 30 min", Glyph: PeopleTeam16Regular, status: "done" },
    ],
  },
  {
    label: "Mon 9",
    tasks: [
      { id: "oneone", name: "First 1:1", owner: "Noah Schmidt", note: "Done 10:00 AM", Glyph: Chat16Regular, status: "done" },
      { id: "tools", name: "Design tool seat", owner: "IT", note: "In review · approver out today", Glyph: Apps16Regular, status: "active" },
      { id: "demo", name: "Product demo", owner: "Product", note: "Today 4:00 PM", Glyph: Presenter16Regular, status: "todo" },
    ],
  },
  {
    label: "Tue 10",
    tasks: [
      { id: "ticket", name: "First small ticket", owner: "Noah Schmidt", note: "Picked for Tue", Glyph: Target16Regular, status: "todo" },
      { id: "goals", name: "30-day goals", owner: "Noah Schmidt", note: "Draft due Tue", Glyph: Document16Regular, status: "todo" },
    ],
  },
];
const TODAY = 3;
const ALL = DAYS.flatMap((d) => d.tasks);
const DONE = ALL.filter((t) => t.status === "done").length;
const BLOCKED = ALL.find((t) => t.status === "blocked")!;

const CHIP: Record<Status, string> = {
  done: "bg-ios-green/15 text-ios-green",
  active: "bg-ios-blue/15 text-ios-blue",
  todo: "bg-fill-tertiary text-tertiary",
  blocked: "bg-ios-red text-white",
};

type Nudge = "idle" | "sending" | "sent";

/** HR · medium. A new hire's first week as a day track of tasks with one blocked by Facilities; hover a task to read it and nudge the blocker. */
export function OnboardingWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [hover, setHover] = useState<Task | null>(null);
  const [nudge, setNudge] = useState<Nudge>("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const sendNudge = () => {
    if (nudge !== "idle") return;
    setNudge("sending");
    timer.current = window.setTimeout(() => setNudge("sent"), 800);
  };

  const t = hover ?? BLOCKED;
  const col = (i: number) => `${((i + 0.5) / DAYS.length) * 100}%`;

  return (
    <Widget size="medium" index={index} label="New hire onboarding">
      <WidgetHeader
        icon={<MemojiAvatar who="f3" size={28} />}
        tint="transparent"
        title="Ines Duarte · first week"
        subtitle="Product Designer · Growth"
        extra={
          <div className="text-right leading-none whitespace-nowrap">
            <span className="text-[18px] font-semibold tracking-tight text-heading">
              <AnimatedNumber value={DONE} />
              <span className="text-[12px] font-medium text-tertiary">/{ALL.length}</span>
            </span>
            <div className="mt-0.5 text-[10px] text-tertiary">tasks done</div>
          </div>
        }
      />

      {/* Day labels and the track, with NOW on today */}
      <div className="relative mt-3.5 h-[13px] text-[11px] leading-none">
        {DAYS.map((d, i) => (
          <span
            key={d.label}
            className={cn("absolute -translate-x-1/2 whitespace-nowrap tabular", i === TODAY ? "font-semibold text-ios-blue" : "text-tertiary")}
            style={{ left: col(i) }}
          >
            {i === TODAY ? "Today" : d.label}
          </span>
        ))}
      </div>
      <div className="relative mt-1.5 h-2">
        <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-fill-secondary" />
        <motion.span
          className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-ios-green"
          initial={{ width: 0 }}
          animate={{ width: col(TODAY) }}
          transition={{ type: "spring", stiffness: 70, damping: 18, delay }}
        />
        {DAYS.map((d, i) => (
          <motion.span
            key={d.label}
            className={cn(
              "absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--widget-surface)]",
              i < TODAY ? "bg-ios-green" : i === TODAY ? "bg-ios-blue" : "bg-fill",
            )}
            style={{ left: col(i) }}
            initial={{ scale: 0 }}
            animate={i === TODAY ? { scale: [1, 1.5, 1] } : { scale: 1 }}
            transition={
              i === TODAY
                ? { duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: delay + 0.6 }
                : { type: "spring", stiffness: 400, damping: 20, delay: delay + i * 0.12 }
            }
          />
        ))}
      </div>

      <div className="mt-3.5 flex" onMouseLeave={() => setHover(null)}>
        {DAYS.map((d, di) => (
          <div key={d.label} className="flex flex-1 justify-center gap-[3px]">
            {d.tasks.map((task, ti) => {
              const on = hover?.id === task.id;
              const isBlocked = task.status === "blocked";
              return (
                <motion.button
                  type="button"
                  key={task.id}
                  aria-label={`${task.name}: ${task.status}`}
                  className={cn(
                    "relative grid size-[22px] cursor-default place-items-center rounded-full outline-none",
                    CHIP[task.status],
                    on && "ring-1 ring-inset ring-sel",
                  )}
                  initial={{ opacity: 0, y: 6, scale: 0.6 }}
                  animate={{ opacity: 1, y: 0, scale: on ? 1.15 : 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 22, delay: hover ? 0 : delay + 0.2 + di * 0.1 + ti * 0.04 }}
                  onMouseEnter={() => setHover(task)}
                  onFocus={() => setHover(task)}
                  onBlur={() => setHover(null)}
                >
                  {isBlocked && nudge !== "sent" ? (
                    <motion.span
                      className="absolute inset-0 rounded-full border-2 border-ios-red"
                      animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                    />
                  ) : null}
                  {task.status === "active" ? (
                    <motion.span
                      className="absolute inset-0 rounded-full border-[1.5px] border-ios-blue border-r-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
                    />
                  ) : null}
                  <task.Glyph className="size-3.5" />
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-auto flex h-8 items-center gap-2 border-t-[0.5px] border-split pt-1.5">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={t.id}
            className="min-w-0 flex-1 leading-tight whitespace-nowrap"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.16 }}
          >
            <div className="truncate text-[12px]">
              <span className="font-semibold text-heading">{t.name}</span>
              <span className="text-tertiary"> · {t.owner}</span>
            </div>
            <div
              className={cn(
                "truncate text-[11px]",
                t.status === "blocked" ? (nudge === "sent" ? "text-secondary" : "text-ios-red") : t.status === "active" ? "text-ios-blue" : "text-tertiary",
              )}
            >
              {t.status === "blocked" && nudge === "sent" ? "Reminder sent to Facilities · 2:41 PM" : t.note}
            </div>
          </motion.div>
        </AnimatePresence>
        {t.status === "blocked" ? (
          nudge === "sent" ? (
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex shrink-0 items-center gap-1 rounded-full bg-ios-green/15 px-2.5 py-1 text-[12px] font-semibold text-ios-green"
            >
              <Checkmark16Filled className="size-3.5" /> Nudged
            </motion.span>
          ) : (
            <Button
              size="small"
              color="danger"
              variant="filled"
              icon={<Send16Regular />}
              loading={nudge === "sending"}
              onClick={sendNudge}
            >
              Nudge
            </Button>
          )
        ) : null}
      </div>
    </Widget>
  );
}
