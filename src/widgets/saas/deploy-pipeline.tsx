import {
  ArrowClockwise16Regular,
  Beaker16Regular,
  Box16Regular,
  Checkmark16Filled,
  CloudArrowUp16Regular,
  Dismiss16Filled,
  Rocket20Filled,
  ShieldCheckmark16Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ComponentType, useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

const STAGES: { label: string; Icon: ComponentType<{ className?: string }>; ticks: number; took: string }[] = [
  { label: "Build", Icon: Box16Regular, ticks: 24, took: "48s" },
  { label: "Test", Icon: Beaker16Regular, ticks: 32, took: "1m 36s" },
  { label: "Security scan", Icon: ShieldCheckmark16Filled, ticks: 26, took: "2m 04s" },
  { label: "Deploy", Icon: CloudArrowUp16Regular, ticks: 20, took: "41s" },
];
const TICK_MS = 90;
const FAIL_STAGE = 2;
const FAIL_AT = 0.62;
const FIRST_RUN = 1284;

type Status = "queued" | "running" | "failed" | "done";
type Run = { id: number; stage: number; p: number; status: Status };

const R = 15;
const C = 2 * Math.PI * R;

/** SaaS · medium. A run flows through the pipeline live; the first run fails its scan, Retry runs it again. */
export function DeployPipelineWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [run, setRun] = useState<Run>({ id: FIRST_RUN, stage: 0, p: 0, status: "queued" });

  useEffect(() => {
    const t = window.setTimeout(() => setRun((r) => ({ ...r, status: "running" })), (delay + 0.5) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (run.status !== "running") return;
    const t = window.setInterval(() => {
      setRun((r) => {
        if (r.status !== "running") return r;
        const p = r.p + 1 / STAGES[r.stage].ticks;
        // The first run trips the scan: two high-severity CVEs in a transitive dependency.
        if (r.id === FIRST_RUN && r.stage === FAIL_STAGE && p >= FAIL_AT) return { ...r, p: FAIL_AT, status: "failed" };
        if (p < 1) return { ...r, p };
        if (r.stage === STAGES.length - 1) return { ...r, p: 1, status: "done" };
        return { ...r, stage: r.stage + 1, p: 0 };
      });
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, [run.status]);

  const rerun = () => setRun((r) => ({ id: r.id + 1, stage: 0, p: 0, status: "running" }));

  const track = run.status === "done" ? 1 : Math.min(1, (run.stage + run.p) / (STAGES.length - 1));
  const pill = {
    queued: { text: "Queued", cls: "bg-fill-tertiary text-tertiary" },
    running: { text: "Running", cls: "bg-ios-blue/15 text-ios-blue" },
    failed: { text: "Failed", cls: "bg-ios-red/15 text-ios-red" },
    done: { text: "Live", cls: "bg-ios-green/15 text-ios-green" },
  }[run.status];

  return (
    <Widget
      size="medium"
      index={index}
      label="Deploy pipeline"
    >
      <WidgetHeader
        icon={<Rocket20Filled />}
        tint="var(--ios-indigo)"
        title="storefront-web · main"
        subtitle={`#${run.id} · a3f9c21 Fix checkout tax rounding`}
        extra={
          <motion.span
            key={run.status}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
              pill.cls,
            )}
          >
            {run.status === "running" ? (
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-ios-blue opacity-70" />
                <span className="relative size-1.5 rounded-full bg-ios-blue" />
              </span>
            ) : null}
            {pill.text}
          </motion.span>
        }
      />

      <div className="relative mt-3.5 grid grid-cols-4">
        <div className="absolute inset-x-[12.5%] top-4 h-[3px] -translate-y-1/2 rounded-full bg-fill-secondary" />
        <motion.div
          className={cn(
            "absolute left-[12.5%] top-4 h-[3px] -translate-y-1/2 rounded-full",
            run.status === "failed" ? "bg-ios-red" : run.status === "done" ? "bg-ios-green" : "bg-ios-blue",
          )}
          animate={{ width: `${track * 75}%` }}
          transition={{ duration: TICK_MS / 1000, ease: "linear" }}
        />
        {STAGES.map((s, i) => {
          const state: "done" | "running" | "failed" | "pending" =
            i < run.stage || run.status === "done"
              ? "done"
              : i === run.stage && run.status === "running"
                ? "running"
                : i === run.stage && run.status === "failed"
                  ? "failed"
                  : "pending";
          return (
            <div key={s.label} className="relative flex min-w-0 flex-col items-center">
              <Node state={state} p={i === run.stage ? run.p : 0} Icon={s.Icon} delay={delay + i * 0.08} />
              <div className="mt-1.5 max-w-full truncate text-[11px] leading-tight font-medium text-heading">{s.label}</div>
              <div
                className={cn(
                  "max-w-full truncate text-[10px] leading-tight tabular",
                  state === "failed" ? "font-medium text-ios-red" : state === "running" ? "text-ios-blue" : "text-tertiary",
                )}
              >
                {state === "done"
                  ? s.took
                  : state === "running"
                    ? `${Math.round(run.p * 100)}%`
                    : state === "failed"
                      ? "2 high CVEs"
                      : "Waiting"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex h-6 items-center gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={run.status}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="flex min-w-0 flex-1 items-center gap-1.5 whitespace-nowrap text-[11px]"
          >
            {run.status === "failed" ? (
              <span className="truncate font-medium text-ios-red">lodash@4.17.19 · CVE-2021-23337</span>
            ) : run.status === "done" ? (
              <span className="truncate font-medium text-ios-green">Deployed to production · eu-west-1</span>
            ) : (
              <>
                <MemojiAvatar who="Ellie Kane" size={18} />
                <span className="truncate text-tertiary">
                  Triggered by <span className="font-medium text-secondary">Ellie Kane</span> · push
                </span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
        {run.status === "failed" ? (
          <Button size="small" type="primary" danger shape="round" icon={<ArrowClockwise16Regular />} onClick={rerun}>
            Retry
          </Button>
        ) : run.status === "done" ? (
          <Button size="small" color="default" variant="filled" shape="round" icon={<ArrowClockwise16Regular />} onClick={rerun}>
            Re-run
          </Button>
        ) : null}
      </div>
    </Widget>
  );
}

function Node({
  state,
  p,
  Icon,
  delay,
}: {
  state: "done" | "running" | "failed" | "pending";
  p: number;
  Icon: ComponentType<{ className?: string }>;
  delay: number;
}) {
  return (
    <motion.div
      className="relative grid size-8 place-items-center"
      initial={{ scale: 0.4, opacity: 0 }}
      animate={state === "failed" ? { scale: 1, opacity: 1, x: [0, -3, 3, -2, 2, 0] } : { scale: 1, opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 20, delay: state === "pending" ? delay : 0 }}
    >
      <span className="absolute inset-0 rounded-full bg-[var(--widget-surface)]" />
      <span
        className={cn(
          "absolute inset-0 rounded-full transition-colors duration-mid",
          state === "done" && "bg-ios-green",
          state === "failed" && "bg-ios-red",
          state === "running" && "bg-ios-blue/15",
          state === "pending" && "bg-fill-tertiary",
        )}
      />
      {state === "running" ? (
        <svg viewBox="0 0 34 34" className="absolute -inset-px size-[34px] -rotate-90" aria-hidden>
          <circle
            cx="17"
            cy="17"
            r={R}
            fill="none"
            stroke="var(--ios-blue)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - p)}
            style={{ transition: `stroke-dashoffset ${TICK_MS}ms linear` }}
          />
        </svg>
      ) : null}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={state === "done" ? "ok" : state === "failed" ? "x" : "icon"}
          className={cn(
            "relative grid place-items-center text-[16px]",
            state === "done" || state === "failed" ? "text-white" : state === "running" ? "text-ios-blue" : "text-tertiary",
          )}
          initial={{ scale: 0, rotate: -60 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
        >
          {state === "done" ? <Checkmark16Filled /> : state === "failed" ? <Dismiss16Filled /> : <Icon />}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}
