import {
  ArrowClockwise16Regular,
  ArrowSync20Filled,
  CheckmarkCircle16Filled,
  Circle16Regular,
  DismissCircle16Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

/* The job: 7 nights × 3 rate plans × price and min stay = 42 cells, sent to four channels. */
const CHANNELS = ["Online", "Booking.com", "Agoda", "Expedia"] as const;
const FAIL = 3;
const START = [0, 0.08, 0.16, 0.24];
const FINISH = [0.5, 0.72, 0.9, 1];
const TOTAL = 42;
const FAILED_CELLS = 7;
const TICK_MS = 100;
const FIRST_JOB = 4821;

type Status = "queued" | "running" | "done" | "partial";
type ChannelState = "pending" | "running" | "done" | "failed";
type Job = { id: number; status: Status; p: number; retry: boolean };

/** Every other full run has Expedia reject the Non-refundable prices; a retry goes to that channel only. */
const failing = (job: Job) => !job.retry && (job.id - FIRST_JOB) % 2 === 0;

const SIZE = 74;
const STROKE = 8;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const GAP = 3;

/** Revenue · small. The latest bulk update as a ring of cells with per-channel ticks; a partial result splits the ring and offers a retry, tap the ring to run it again. */
export function JobTrackerWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [job, setJob] = useState<Job>({ id: FIRST_JOB, status: "queued", p: 0, retry: false });

  useEffect(() => {
    if (job.status !== "queued") return;
    const wait = job.id === FIRST_JOB && !job.retry ? (delay + 0.6) * 1000 : 450;
    const t = window.setTimeout(() => setJob((j) => (j.status === "queued" ? { ...j, status: "running" } : j)), wait);
    return () => window.clearTimeout(t);
  }, [job.status, job.id, job.retry, delay]);

  useEffect(() => {
    if (job.status !== "running") return;
    const t = window.setInterval(() => {
      setJob((j) => {
        if (j.status !== "running") return j;
        const p = j.p + (j.retry ? 1 / 12 : 1 / 34);
        if (p < 1) return { ...j, p };
        return { ...j, p: 1, status: failing(j) ? "partial" : "done" };
      });
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, [job.status]);

  const fails = failing(job);
  const channel = (i: number): ChannelState => {
    if (job.retry) {
      if (i !== FAIL) return "done";
      return job.status === "done" ? "done" : job.status === "running" ? "running" : "failed";
    }
    if (job.status === "queued") return "pending";
    if (job.status === "partial") return i === FAIL ? "failed" : "done";
    if (job.status === "done") return "done";
    return job.p >= FINISH[i] ? "done" : job.p >= START[i] ? "running" : "pending";
  };

  const applied = TOTAL - FAILED_CELLS;
  const cellsDone = job.retry
    ? job.status === "done"
      ? TOTAL
      : applied + Math.round(job.p * FAILED_CELLS)
    : job.status === "queued"
      ? 0
      : job.status === "running"
        ? Math.round(job.p * (fails ? applied : TOTAL))
        : job.status === "partial"
          ? applied
          : TOTAL;

  // Arcs in cells: settled green, in-flight blue, rejected red.
  const green = job.status === "done" ? TOTAL : job.status === "partial" || job.retry ? applied : 0;
  const blue: [number, number] =
    job.status === "running" ? (job.retry ? [applied, cellsDone] : [0, cellsDone]) : [0, 0];
  const red: [number, number] =
    job.status === "partial" || (job.retry && job.status === "queued") ? [applied, TOTAL] : [0, 0];

  const rerun = () => {
    if (job.status === "running" || job.status === "queued") return;
    setJob((j) => ({ id: j.id + 1, status: "queued", p: 0, retry: false }));
  };
  const retry = () => setJob((j) => ({ ...j, status: "queued", p: 0, retry: true }));

  const subtitle = {
    queued: job.retry ? "Retry queued" : "Queued",
    running: `${job.retry ? "Retrying" : "Running"} · ${Math.round((cellsDone / TOTAL) * 100)}%`,
    partial: "Partly applied",
    done: "Done · 4 channels",
  }[job.status];

  return (
    <Widget size="small" index={index} label="Bulk update job">
      <WidgetHeader
        icon={
          <span className={cn("grid place-items-center", job.status === "running" && "animate-[spin_1.6s_linear_infinite]")}>
            <ArrowSync20Filled />
          </span>
        }
        tint="var(--ios-indigo)"
        title={`Bulk update #${job.id}`}
        subtitle={
          <span
            className={cn(
              "tabular",
              job.status === "partial" && "font-medium text-ios-orange",
              job.status === "done" && "font-medium text-ios-green",
            )}
          >
            {subtitle}
          </span>
        }
      />

      <div className="mt-2.5 flex items-center gap-2.5">
        <motion.button
          type="button"
          onClick={rerun}
          aria-label="Run the update again"
          className="group relative grid shrink-0 cursor-pointer place-items-center rounded-full outline-none"
          style={{ width: SIZE, height: SIZE }}
          initial={{ scale: 0.6, opacity: 0, rotate: -40 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 20, delay }}
          whileTap={{ scale: 0.93 }}
        >
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" strokeWidth={STROKE} className="stroke-fill-secondary" />
            <Arc from={0} to={green} stroke="var(--ios-green)" round={job.status === "done"} gapAfter={red[1] > red[0]} />
            <Arc from={blue[0]} to={blue[1]} stroke="var(--ios-blue)" round={!job.retry} />
            <Arc from={red[0]} to={red[1]} stroke="var(--ios-red)" gapAfter />
          </svg>
          <div className="relative flex flex-col items-center leading-none transition-opacity duration-mid group-hover:opacity-0">
            <AnimatedNumber value={cellsDone} className="text-[22px] font-semibold tracking-tight text-heading" />
            <span className="mt-0.5 text-[10px] text-tertiary tabular">of {TOTAL} cells</span>
          </div>
          {job.status === "done" || job.status === "partial" ? (
            <span className="absolute grid place-items-center text-[20px] text-secondary opacity-0 transition-opacity duration-mid group-hover:opacity-100">
              <ArrowClockwise16Regular />
            </span>
          ) : null}
        </motion.button>

        <ul className="flex min-w-0 flex-1 flex-col gap-1.5">
          {CHANNELS.map((name, i) => {
            const s = channel(i);
            return (
              <motion.li
                key={name}
                className="flex h-4 min-w-0 items-center gap-1.5 text-[11px] leading-none"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.15 + i * 0.06, type: "spring", stiffness: 380, damping: 26 }}
              >
                <Tick state={s} />
                <span
                  className={cn(
                    "truncate",
                    s === "failed" ? "font-medium text-ios-red" : s === "pending" ? "text-tertiary" : "text-heading",
                  )}
                >
                  {name.replace(".com", "")}
                </span>
              </motion.li>
            );
          })}
        </ul>
      </div>

      <div className="mt-auto flex h-6 items-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={job.status === "partial" ? "partial" : job.status === "done" ? "done" : "busy"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="flex w-full min-w-0 items-center gap-1.5 whitespace-nowrap text-[11px]"
          >
            {job.status === "partial" ? (
              <Button
                size="small"
                type="primary"
                danger
                shape="round"
                block
                icon={<ArrowClockwise16Regular />}
                onClick={retry}
              >
                Retry 1 channel
              </Button>
            ) : job.status === "done" ? (
              <span className="truncate text-tertiary">
                <span className="font-medium text-ios-green">Synced</span> · tap the ring to re-run
              </span>
            ) : (
              <>
                <MemojiAvatar who="Ashley Davis" size={18} />
                <span className="truncate text-tertiary">
                  Sent by <span className="font-medium text-secondary">Ashley</span>
                </span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Widget>
  );
}

/** A run of cells on the ring. Split arcs keep square ends and a hairline gap so green and red read apart. */
function Arc({
  from,
  to,
  stroke,
  round,
  gapAfter,
}: {
  from: number;
  to: number;
  stroke: string;
  round?: boolean;
  gapAfter?: boolean;
}) {
  const len = Math.max(0, ((to - from) / TOTAL) * C - (gapAfter ? GAP : 0));
  return (
    <circle
      cx={SIZE / 2}
      cy={SIZE / 2}
      r={R}
      fill="none"
      stroke={stroke}
      strokeWidth={STROKE}
      strokeLinecap={round && len > 1 ? "round" : "butt"}
      strokeDasharray={`${len} ${C}`}
      strokeDashoffset={-(from / TOTAL) * C}
      opacity={len > 0 ? 1 : 0}
      style={{ transition: `stroke-dasharray ${TICK_MS * 3}ms ease-out, stroke-dashoffset 300ms ease-out, opacity 200ms` }}
    />
  );
}

function Tick({ state }: { state: ChannelState }) {
  return (
    <span className="relative grid size-3.5 shrink-0 place-items-center">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={state}
          className={cn(
            "grid size-3.5 place-items-center [&>svg]:size-3.5",
            state === "done" && "text-ios-green",
            state === "failed" && "text-ios-red",
            state === "pending" && "text-tertiary",
          )}
          initial={{ scale: 0, rotate: -60 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
        >
          {state === "done" ? (
            <CheckmarkCircle16Filled />
          ) : state === "failed" ? (
            <DismissCircle16Filled />
          ) : state === "pending" ? (
            <Circle16Regular />
          ) : (
            <svg viewBox="0 0 12 12" className="animate-spin" aria-hidden>
              <circle cx="6" cy="6" r="4.5" fill="none" strokeWidth="1.6" className="stroke-fill-secondary" />
              <circle
                cx="6"
                cy="6"
                r="4.5"
                fill="none"
                stroke="var(--ios-blue)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeDasharray="9 30"
              />
            </svg>
          )}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
