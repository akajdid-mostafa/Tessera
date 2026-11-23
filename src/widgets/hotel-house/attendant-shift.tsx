import { Broom20Filled, Checkmark12Filled, PeopleSwap16Regular } from "@fluentui/react-icons";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { ATTENDANTS } from "./_parts-a";

type Who = (typeof ATTENDANTS)[number];
type Job = { room: string; type: string; min: number };

/* Cleaning minutes per room type, as the PMS credits them. */
const J = {
  single: (room: string): Job => ({ room, type: "Single Room", min: 45 }),
  dbl: (room: string): Job => ({ room, type: "Standard Double", min: 45 }),
  twin: (room: string): Job => ({ room, type: "Standard Twin", min: 45 }),
  sup: (room: string): Job => ({ room, type: "Superior Double", min: 45 }),
  garden: (room: string): Job => ({ room, type: "Deluxe Garden View", min: 45 }),
  family: (room: string): Job => ({ room, type: "Family Room", min: 60 }),
  junior: (room: string): Job => ({ room, type: "Junior Suite", min: 60 }),
  suite: (room: string): Job => ({ room, type: "Suite", min: 75 }),
  villa: (room: string): Job => ({ room, type: "Villa", min: 90 }),
};

/* This morning's board: Ellen was given both suites and runs past the end of the shift. */
const PLAN: Record<Who, Job[]> = {
  "Ashley King": [J.single("104"), J.dbl("107"), J.dbl("108"), J.dbl("109"), J.dbl("111"), J.dbl("113"), J.dbl("115")],
  "Mike Daniels": [J.family("413"), J.family("415"), J.junior("503"), J.junior("506")],
  "Rosa Martinez": [J.villa("V1"), J.villa("V2"), J.villa("V3"), J.villa("V5")],
  "Ellen Shaw": [
    J.twin("207"),
    J.twin("210"),
    J.twin("211"),
    J.twin("213"),
    J.sup("302"),
    J.sup("304"),
    J.sup("306"),
    J.suite("S2"),
    J.garden("315"),
    J.suite("S4"),
  ],
};
/** Rooms the supervisor hands from the overloaded attendant to the one with slack. */
const MOVE = { from: "Ellen Shaw" as Who, to: "Mike Daniels" as Who, rooms: ["315", "S4"] };

const START = 8 * 60;
const END = 16 * 60;
const AXIS_END = 17 * 60 + 30;
const SPAN = AXIS_END - START;
const TRAVEL = 5;
const TICKS = [8, 10, 12, 14, 16];
const pct = (m: number) => `${((m - START) / SPAN) * 100}%`;
const clock = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

function schedule(jobs: Job[]) {
  let t = START;
  return jobs.map((j) => {
    const start = t;
    t += j.min + TRAVEL;
    return { ...j, start, end: start + j.min };
  });
}

/** Housekeeping · large. Each attendant's rooms on a shift timeline with a live NOW line; one runs past 16:00 until Rebalance flies two rooms to a colleague with slack. */
export function AttendantShiftWidget({ index }: { index?: number }) {
  const [plan, setPlan] = useState(PLAN);
  const [now, setNow] = useState(11 * 60 + 20);
  const balanced = plan[MOVE.from].length < PLAN[MOVE.from].length;
  const delay = 0.3 + (index ?? 0) * 0.06;

  // Live: the shift clock runs a minute every two seconds so the board visibly moves.
  useEffect(() => {
    const t = window.setInterval(() => setNow((n) => Math.min(END, n + 1)), 2000);
    return () => window.clearInterval(t);
  }, []);

  const lanes = ATTENDANTS.map((who) => {
    const jobs = schedule(plan[who]);
    const ends = jobs[jobs.length - 1].end;
    return { who, jobs, ends, over: Math.max(0, ends - END) };
  });
  const total = lanes.reduce((s, l) => s + l.jobs.length, 0);
  const done = lanes.reduce((s, l) => s + l.jobs.filter((j) => j.end <= now).length, 0);
  const late = lanes.find((l) => l.over > 0);

  const rebalance = () => {
    if (balanced) return;
    setPlan((p) => ({
      ...p,
      [MOVE.from]: p[MOVE.from].filter((j) => !MOVE.rooms.includes(j.room)),
      [MOVE.to]: [...p[MOVE.to], ...p[MOVE.from].filter((j) => MOVE.rooms.includes(j.room))],
    }));
  };

  return (
    <Widget size="large" index={index} label="Attendant shift">
      <WidgetHeader
        icon={<Broom20Filled />}
        tint="var(--ios-teal)"
        title="Attendant Shift"
        subtitle="Seabright Villas · 08:00–16:00"
        extra={
          <Button
            size="small"
            variant={balanced ? "filled" : "solid"}
            color={balanced ? "green" : "primary"}
            icon={balanced ? <Checkmark12Filled /> : <PeopleSwap16Regular />}
            onClick={rebalance}
            disabled={!late && !balanced}
          >
            {balanced ? "Balanced" : "Rebalance"}
          </Button>
        }
      />

      <div className="mt-3 flex items-baseline-last gap-2 whitespace-nowrap">
        <span className="text-[28px] leading-none font-semibold tracking-tight text-heading">
          <AnimatedNumber value={done} />
          <span className="text-[13px] font-medium text-tertiary">/{total} rooms</span>
        </span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={late ? `late-${late.over}` : "ok"}
            initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -4 }}
            className={cn(
              "mb-0.5 ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold",
              late ? "bg-ios-red/15 text-ios-red" : "bg-ios-green/15 text-ios-green",
            )}
          >
            {late ? `${late.who.split(" ")[0]} +${late.over} min over` : "All finish by 16:00"}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="relative mt-3 h-3 text-[10px] text-tertiary tabular">
        {TICKS.map((h, i) => (
          <span
            key={h}
            className="absolute top-0 leading-none"
            style={{ left: pct(h * 60), transform: i === 0 ? undefined : "translateX(-50%)" }}
          >
            {String(h).padStart(2, "0")}:00
          </span>
        ))}
      </div>

      <LayoutGroup>
        <div className="mt-1.5 flex min-h-0 flex-1 flex-col justify-between">
          {lanes.map((l, li) => (
            <div key={l.who}>
              <div className="flex h-5 items-center gap-1.5 whitespace-nowrap">
                <MemojiAvatar who={l.who} size={20} />
                <span className="text-[12px] font-semibold text-heading">{l.who}</span>
                <span className="ml-auto text-[11px] text-tertiary tabular">
                  {l.jobs.length} rooms · ends{" "}
                  <span className={cn("font-semibold", l.over ? "text-ios-red" : "text-secondary")}>{clock(l.ends)}</span>
                </span>
              </div>
              <div className="relative mt-1 h-[26px] rounded-md bg-fill-quaternary">
                <span
                  aria-hidden
                  className="absolute inset-y-0 border-l border-dashed border-[var(--ant-color-text-tertiary)]"
                  style={{ left: pct(END) }}
                />
                {l.jobs.map((j, ji) => {
                  const state = j.end <= now ? "done" : j.start <= now ? "doing" : "next";
                  const over = j.end > END;
                  const progress = state === "doing" ? (now - j.start) / j.min : 0;
                  return (
                    <Tooltip key={j.room} title={`Room ${j.room} · ${j.type} · ${j.min} min`}>
                      <motion.div
                        layoutId={`shift-${j.room}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 260,
                          damping: 26,
                          delay: balanced ? 0 : delay + li * 0.08 + ji * 0.025,
                        }}
                        className={cn(
                          "absolute inset-y-0 grid cursor-default place-items-center overflow-hidden rounded-[5px] text-[10px] font-semibold tabular",
                          over
                            ? "bg-ios-red/15 text-ios-red ring-1 ring-ios-red ring-inset"
                            : state === "done"
                              ? "bg-ios-green/25 text-heading"
                              : state === "doing"
                                ? "bg-ios-blue/20 text-heading"
                                : "bg-fill-secondary text-secondary",
                        )}
                        style={{ left: pct(j.start), width: `calc(${((j.min / SPAN) * 100).toFixed(3)}% - 1px)` }}
                      >
                        {state === "doing" ? (
                          <motion.span
                            aria-hidden
                            className="absolute inset-y-0 left-0 bg-ios-blue/40"
                            animate={{ width: `${progress * 100}%` }}
                            transition={{ type: "spring", stiffness: 120, damping: 24 }}
                          />
                        ) : null}
                        <span className="relative">{j.room}</span>
                      </motion.div>
                    </Tooltip>
                  );
                })}
                <motion.span
                  aria-hidden
                  className="absolute -inset-y-1 z-10 w-0.5 rounded-full bg-ios-blue"
                  animate={{ left: pct(now) }}
                  transition={{ type: "spring", stiffness: 120, damping: 24 }}
                />
              </div>
            </div>
          ))}
        </div>
      </LayoutGroup>

      <div className="mt-2 flex items-center gap-3 text-[10px] text-tertiary whitespace-nowrap">
        <span className="flex items-center gap-1 font-semibold text-ios-blue tabular">
          <motion.span
            className="size-1.5 rounded-full bg-ios-blue"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          Now {clock(now)}
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-sm bg-ios-green/40" />
          Done
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-sm bg-fill-secondary" />
          Next
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-sm ring-1 ring-ios-red ring-inset" />
          Past 16:00
        </span>
      </div>
    </Widget>
  );
}
