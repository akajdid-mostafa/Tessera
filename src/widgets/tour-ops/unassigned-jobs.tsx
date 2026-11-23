import { ArrowCounterclockwise12Regular, Checkmark12Filled, PersonQuestionMark20Filled, Warning12Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { Plate, STAFF, type Staff, type Vehicle, VEHICLES } from "./_parts-a";

type Issue = "unassigned_staff" | "unassigned_driver" | "unassigned_vehicle";
type Job = { key: string; time: string; title: string; pax: number; issues: Issue[] };

const JOBS: Job[] = [
  { key: "sedona", time: "09:00", title: "Sedona & Oak Creek", pax: 15, issues: ["unassigned_staff", "unassigned_vehicle"] },
  { key: "trf", time: "10:30", title: "Transfer FLG → Sedona", pax: 5, issues: ["unassigned_driver", "unassigned_vehicle"] },
  { key: "city", time: "14:00", title: "Flagstaff & Mars Hill", pax: 6, issues: ["unassigned_staff"] },
];
const LABEL: Record<Issue, string> = { unassigned_staff: "Guide", unassigned_driver: "Driver", unassigned_vehicle: "Vehicle" };

type Item = { kind: "staff"; s: Staff } | { kind: "vehicle"; v: Vehicle };
const TRAY: Item[] = [...STAFF.map((s) => ({ kind: "staff" as const, s })), ...VEHICLES.map((v) => ({ kind: "vehicle" as const, v }))];
const idOf = (it: Item) => (it.kind === "staff" ? it.s.name : it.v.plate);
const fits = (it: Item, issue: Issue) =>
  it.kind === "vehicle"
    ? issue === "unassigned_vehicle"
    : (issue === "unassigned_staff" && it.s.roles.includes("guide")) ||
      (issue === "unassigned_driver" && it.s.roles.includes("driver"));

/** Tour ops · medium. Today's jobs missing a guide, driver or vehicle; drag (or tap, then tap) a staff memoji or a plate onto a job and its warning turns into a check while the open count rolls down. */
export function UnassignedJobsWidget({ index }: { index?: number }) {
  const [filled, setFilled] = useState<Record<string, Item>>({});
  const [picked, setPickedState] = useState<Item | null>(null);
  const [touched, setTouched] = useState(false);
  const setPicked = (it: Item | null) => {
    setTouched(true);
    setPickedState(it);
  };
  const [reject, setReject] = useState<{ slot: string; why: string } | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const open = JOBS.reduce((a, j) => a + j.issues.filter((i) => !filled[`${j.key}:${i}`]).length, 0);

  useEffect(() => {
    if (!reject) return;
    const t = window.setTimeout(() => setReject(null), 1600);
    return () => window.clearTimeout(t);
  }, [reject]);

  const assign = (it: Item, job: Job, issue?: Issue) => {
    const target = issue ?? job.issues.find((i) => !filled[`${job.key}:${i}`] && fits(it, i));
    if (!target || !fits(it, target) || filled[`${job.key}:${target}`]) {
      const slot = `${job.key}:${issue ?? job.issues[0]}`;
      const why = filled[slot]
        ? "Already assigned"
        : it.kind === "staff"
          ? `${it.s.short} is not a ${issue ? LABEL[issue].toLowerCase() : "fit"} here`
          : "That job needs a person, not a vehicle";
      setReject({ slot, why });
      return;
    }
    if (it.kind === "vehicle" && it.v.seats < job.pax) {
      setReject({ slot: `${job.key}:${target}`, why: `${it.v.model} seats ${it.v.seats} < ${job.pax} pax` });
      return;
    }
    setFilled((f) => ({ ...f, [`${job.key}:${target}`]: it }));
    setPicked(null);
  };

  const dropAt = (it: Item, info: PanInfo) => {
    const els = document.elementsFromPoint(info.point.x - window.scrollX, info.point.y - window.scrollY);
    const el = els.find((e) => e instanceof HTMLElement && e.dataset.job) as HTMLElement | undefined;
    if (!el) return;
    const job = JOBS.find((j) => j.key === el.dataset.job);
    if (job) assign(it, job, el.dataset.issue as Issue | undefined);
  };

  return (
    <Widget size="medium" index={index} label="Unassigned jobs">
      <WidgetHeader
        icon={<PersonQuestionMark20Filled />}
        tint="var(--ios-orange)"
        title="Unassigned Jobs"
        subtitle={reject ? <span className="text-ios-red">{reject.why}</span> : "Today · drag a face or plate onto a job"}
        extra={
          <motion.div
            animate={{ scale: open === 0 ? [1, 1.15, 1] : 1 }}
            className={cn(
              "flex h-[26px] items-center gap-1 rounded-full px-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors",
              open ? "bg-ios-orange/15 text-ios-orange" : "bg-ios-green/15 text-ios-green",
            )}
          >
            {open ? <Warning12Filled /> : <Checkmark12Filled />}
            <AnimatedNumber value={open} trend={-1} />
            <span className="text-[11px] font-medium">open</span>
          </motion.div>
        }
      />

      <div className="mt-1.5 flex flex-col">
        {JOBS.map((j, ji) => (
          <motion.div
            key={j.key}
            data-job={j.key}
            onClick={() => picked && assign(picked, j)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30, delay: delay + ji * 0.07 }}
            className={cn(
              "flex h-[28px] items-center gap-2 border-split [&:not(:first-child)]:border-t-[0.5px]",
              picked && "cursor-copy",
            )}
          >
            <span className="w-[34px] shrink-0 text-[11px] font-semibold text-secondary tabular">{j.time}</span>
            <div className="min-w-0 flex-1 truncate text-[12px] font-medium text-heading" data-job={j.key}>
              {j.title}
              <span className="ml-1 text-[10.5px] font-normal text-tertiary tabular">{j.pax} pax</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {j.issues.map((i) => {
                const slot = `${j.key}:${i}`;
                const it = filled[slot];
                const glowing = !it && picked && fits(picked, i);
                return (
                  <motion.button
                    key={i}
                    type="button"
                    layout
                    data-job={j.key}
                    data-issue={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (picked) assign(picked, j, i);
                    }}
                    animate={reject?.slot === slot ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
                    transition={{ layout: { type: "spring", stiffness: 420, damping: 30 }, x: { duration: 0.35 } }}
                    className={cn(
                      "relative flex h-[20px] cursor-pointer items-center gap-1 overflow-hidden rounded-full px-1.5 text-[10.5px] font-semibold whitespace-nowrap",
                      it ? "bg-ios-green/15 text-ios-green" : "bg-ios-orange/15 text-ios-orange",
                      glowing && "ring-[1.5px] ring-ios-orange",
                    )}
                  >
                    {glowing ? (
                      <motion.span
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-ios-orange/25"
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1.1, repeat: Infinity }}
                      />
                    ) : null}
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={it ? "ok" : "warn"}
                        className="relative grid"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 520, damping: 20 }}
                      >
                        {it ? <Checkmark12Filled /> : <Warning12Filled />}
                      </motion.span>
                    </AnimatePresence>
                    <span className="relative">
                      {it ? (it.kind === "staff" ? it.s.short : it.v.plate) : LABEL[i]}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tray */}
      <div className="mt-auto flex h-[32px] items-center gap-1.5 rounded-xl bg-fill-quaternary px-1.5">
        <span className="shrink-0 pl-0.5 text-[10px] leading-tight font-medium text-tertiary">
          Free
          <br />
          today
        </span>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
          {TRAY.map((it, k) => {
            const id = idOf(it);
            const on = picked && idOf(picked) === id;
            const tip = it.kind === "staff" ? `${it.s.name} · ${it.s.roles.join(" & ")}` : `${it.v.model} · ${it.v.seats} seats`;
            return (
              <Tooltip key={id} title={tip}>
                <motion.div
                  drag
                  dragSnapToOrigin
                  dragElastic={0.9}
                  dragMomentum={false}
                  whileDrag={{ scale: 1.15, zIndex: 20 }}
                  onDragStart={() => setPicked(it)}
                  onDragEnd={(_, info) => dropAt(it, info)}
                  onTap={() => setPicked(on ? null : it)}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: on ? 1.12 : 1, y: on ? -2 : 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 24, delay: touched ? 0 : delay + 0.25 + k * 0.05 }}
                  className={cn(
                    "relative shrink-0 cursor-grab touch-none rounded-full active:cursor-grabbing",
                    on && "ring-1 ring-inset ring-sel",
                  )}
                >
                  {it.kind === "staff" ? (
                    <MemojiAvatar who={it.s.name} size={24} className="pointer-events-none" />
                  ) : (
                    <Plate plate={it.v.plate} className="pointer-events-none" />
                  )}
                </motion.div>
              </Tooltip>
            );
          })}
          <AnimatePresence>
            {open === 0 ? (
              <motion.button
                type="button"
                aria-label="Reset assignments"
                onClick={() => setFilled({})}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                whileTap={{ rotate: -120, scale: 0.85 }}
                className="grid size-[22px] shrink-0 cursor-pointer place-items-center rounded-full bg-fill-tertiary text-secondary"
              >
                <ArrowCounterclockwise12Regular />
              </motion.button>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </Widget>
  );
}
