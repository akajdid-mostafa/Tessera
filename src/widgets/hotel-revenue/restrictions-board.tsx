import { CalendarSettings20Filled, Checkmark12Filled, Dismiss12Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { CHANNELS, MARK, type Field, type MarkKind, nightsFrom, usd0 } from "./_parts-a";

const NIGHTS = nightsFrom(7);
const PRICES = [255, 260, 275, 300, 265, 260, 260];

type Rules = { min_stay: number; cta: boolean; ctd: boolean; stop_sell: boolean };
const BASE: Rules[] = [
  { min_stay: 1, cta: false, ctd: false, stop_sell: false },
  { min_stay: 1, cta: false, ctd: true, stop_sell: false },
  { min_stay: 2, cta: false, ctd: false, stop_sell: false },
  { min_stay: 2, cta: true, ctd: false, stop_sell: false },
  { min_stay: 1, cta: false, ctd: false, stop_sell: false },
  { min_stay: 1, cta: false, ctd: false, stop_sell: false },
  { min_stay: 1, cta: false, ctd: false, stop_sell: true },
];
const KINDS: MarkKind[] = ["min_stay", "cta", "ctd", "stop_sell"];

type Draft = Partial<Rules>[];
type Job = { status: "idle" | "queued" | "running" | "done"; done: number; total: number; channels: number };

const takers = (field: Field) => CHANNELS.filter((c) => c.takes.includes(field));
const isOn = (kind: MarkKind, r: Rules) => (kind === "min_stay" ? r.min_stay > 1 : r[kind]);

/** Revenue · medium. A week of one rate's restrictions as chips; tap to draft changes, then Apply runs a queued job that commits them channel by channel. */
export function RestrictionsBoardWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [rules, setRules] = useState<Rules[]>(BASE);
  const [draft, setDraft] = useState<Draft>(() => NIGHTS.map(() => ({})));
  const [job, setJob] = useState<Job>({ status: "idle", done: 0, total: 0, channels: 0 });
  const [flash, setFlash] = useState<{ id: number; keys: string[] }>({ id: 0, keys: [] });

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), (delay + 0.7) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  const changes = draft.flatMap((d, i) => (Object.keys(d) as MarkKind[]).map((k) => ({ i, k })));
  const busy = job.status !== "idle";
  const skipsArrival = changes.some((c) => c.k === "cta" || c.k === "ctd");

  const toggle = (i: number, kind: MarkKind) => {
    if (busy) return;
    setDraft((all) =>
      all.map((d, di) => {
        if (di !== i) return d;
        const cur: Rules = { ...rules[i], ...d };
        const nextVal = kind === "min_stay" ? (cur.min_stay % 3) + 1 : !cur[kind];
        const out: Partial<Rules> = { ...d, [kind]: nextVal };
        if (out[kind] === rules[i][kind]) delete out[kind];
        return out;
      }),
    );
  };

  const apply = () => {
    const fields = new Set<Field>(changes.map((c) => c.k));
    const total = changes.reduce((s, c) => s + takers(c.k).length, 0);
    const channels = CHANNELS.filter((ch) => [...fields].some((f) => ch.takes.includes(f))).length;
    setJob({ status: "queued", done: 0, total, channels });
  };

  useEffect(() => {
    if (job.status === "queued") {
      const t = window.setTimeout(() => setJob((j) => ({ ...j, status: "running" })), 800);
      return () => window.clearTimeout(t);
    }
    if (job.status === "running") {
      if (job.done >= job.total) {
        setRules((r) => r.map((day, i) => ({ ...day, ...draft[i] })));
        setDraft(NIGHTS.map(() => ({})));
        const keys = draft.flatMap((d, i) => Object.keys(d).map((k) => `${i}-${k}`));
        setFlash((f) => ({ id: f.id + 1, keys }));
        setJob((j) => ({ ...j, status: "done" }));
        return;
      }
      const t = window.setTimeout(() => setJob((j) => ({ ...j, done: j.done + 1 })), Math.max(90, 1400 / job.total));
      return () => window.clearTimeout(t);
    }
    if (job.status === "done") {
      const t = window.setTimeout(() => setJob({ status: "idle", done: 0, total: 0, channels: 0 }), 2600);
      return () => window.clearTimeout(t);
    }
  }, [job, draft]);

  return (
    <Widget size="medium" index={index} label="Restrictions board" glow={{ mode: "pulse", colors: ["#30d158", "#34c759"], blur: 16, duration: 1.2 }} glowActive={job.status === "done"}>
      <WidgetHeader
        icon={<CalendarSettings20Filled />}
        tint="var(--ios-indigo)"
        title="Restrictions"
        subtitle="302 Standard Double · Best Available Rate"
        extra={
          <div className="flex h-7 items-center">
            <AnimatePresence mode="popLayout" initial={false}>
              {job.status === "idle" && changes.length > 0 ? (
                <motion.div
                  key="apply"
                  className="flex items-center gap-1"
                  initial={{ opacity: 0, scale: 0.6, x: 12 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ type: "spring", stiffness: 480, damping: 26 }}
                >
                  <Button
                    size="small"
                    shape="circle"
                    variant="filled"
                    color="default"
                    icon={<Dismiss12Regular />}
                    aria-label="Discard drafts"
                    onClick={() => setDraft(NIGHTS.map(() => ({})))}
                  />
                  <Button size="small" shape="round" color="green" variant="filled" onClick={apply}>
                    Apply {changes.length}
                  </Button>
                </motion.div>
              ) : busy ? (
                <motion.span
                  key="job"
                  className={cn(
                    "flex h-6 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold whitespace-nowrap",
                    job.status === "done" ? "bg-ios-green/15 text-ios-green" : "bg-fill-tertiary text-secondary",
                  )}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                >
                  {job.status === "done" ? (
                    <>
                      <Checkmark12Filled /> Done
                    </>
                  ) : (
                    <>
                      <motion.span
                        className={cn("size-1.5 rounded-full", job.status === "queued" ? "bg-ios-yellow" : "bg-ios-blue")}
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 0.9, repeat: Infinity }}
                      />
                      {job.status === "queued" ? "Queued" : "Running"}
                    </>
                  )}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </div>
        }
      />

      <div className="mt-2 grid grid-cols-7 gap-1">
        {NIGHTS.map((n, i) => {
          const cur: Rules = { ...rules[i], ...draft[i] };
          return (
            <div key={i} className="min-w-0">
              <div
                className={cn(
                  "truncate text-center text-[11px] leading-3 font-semibold",
                  n.today ? "text-ios-blue" : n.weekend ? "text-heading" : "text-secondary",
                )}
              >
                {n.weekday} {n.day}
              </div>
              <div className="mt-0.5 truncate text-center text-[10px] leading-3 text-tertiary tabular">{usd0(PRICES[i])}</div>
              <div className="mt-1 flex flex-col gap-[3px]">
                {KINDS.map((kind, ki) => {
                  const drafted = kind in draft[i];
                  const on = isOn(kind, cur);
                  const was = isOn(kind, rules[i]);
                  return (
                    <motion.button
                      key={kind}
                      type="button"
                      aria-label={`${MARK[kind].long}, ${n.long}`}
                      aria-pressed={on}
                      onClick={() => toggle(i, kind)}
                      disabled={busy}
                      className={cn(
                        "relative flex h-4 w-full items-center justify-center rounded-[5px] text-[10px] leading-none font-semibold whitespace-nowrap tabular outline-none",
                        on ? MARK[kind].on : "border border-dashed border-split text-tertiary",
                        drafted && "ring-[1.5px] ring-ios-green ring-inset",
                        drafted && !on && was && "line-through",
                        busy ? "cursor-default" : "cursor-pointer",
                      )}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={
                        drafted && job.status === "running"
                          ? { opacity: [1, 0.45, 1], scale: 1 }
                          : { opacity: 1, scale: 1 }
                      }
                      whileTap={busy ? undefined : { scale: 0.86 }}
                      transition={
                        drafted && job.status === "running"
                          ? { duration: 0.7, repeat: Infinity }
                          : { type: "spring", stiffness: 500, damping: 24, delay: ready ? 0 : delay + i * 0.04 + ki * 0.03 }
                      }
                    >
                      {kind === "min_stay" ? `☾${cur.min_stay}` : MARK[kind].label}
                      {flash.keys.includes(`${i}-${kind}`) ? (
                        <motion.span
                          key={`f${flash.id}`}
                          aria-hidden
                          className="pointer-events-none absolute inset-0 rounded-[5px] ring-[1.5px] ring-ios-green ring-inset"
                          initial={{ opacity: 1, scale: 1 }}
                          animate={{ opacity: 0, scale: 1.25 }}
                          transition={{ duration: 1.1, ease: "easeOut" }}
                        />
                      ) : null}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto h-[14px] text-[11px] leading-[14px] whitespace-nowrap">
        <AnimatePresence mode="wait" initial={false}>
          {job.status === "queued" || job.status === "running" ? (
            <motion.div key="run" className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-fill-secondary">
                {job.status === "queued" ? (
                  <motion.div
                    className="h-full w-1/4 rounded-full bg-ios-yellow"
                    animate={{ x: ["-100%", "400%"] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                  />
                ) : (
                  <motion.div
                    className="h-full rounded-full bg-ios-blue"
                    animate={{ width: `${(job.done / Math.max(1, job.total)) * 100}%` }}
                    transition={{ type: "spring", stiffness: 260, damping: 30 }}
                  />
                )}
              </div>
              <span className="text-tertiary tabular">
                <AnimatedNumber value={job.done} className="font-semibold text-secondary" />/{job.total} cells
              </span>
            </motion.div>
          ) : job.status === "done" ? (
            <motion.div key="done" className="truncate text-ios-green" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              Sent to {job.channels} channels · {job.total} cells saved
            </motion.div>
          ) : changes.length ? (
            <motion.div key="draft" className="truncate text-tertiary" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <span className="font-semibold text-ios-green">
                {changes.length} draft{changes.length === 1 ? "" : "s"}
              </span>
              {skipsArrival ? " · Expedia skips CTA and CTD" : " · goes to every channel that takes it"}
            </motion.div>
          ) : (
            <motion.div key="hint" className="truncate text-tertiary" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              Tap a chip to draft a change · ☾ is the min stay in nights
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
