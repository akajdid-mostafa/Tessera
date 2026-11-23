import {
  ArrowClockwise16Regular,
  ArrowDown16Regular,
  Checkmark12Filled,
  DoorArrowRight16Regular,
  Flowchart20Filled,
  Grid16Regular,
  Speaker216Regular,
  Warning12Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { mmss } from "./_parts";

type Effect = {
  id: string;
  name: string;
  sub: string;
  icon: ReactNode;
  /** Seconds after the cause when the output is commanded, and when feedback confirms it. */
  cmd: number;
  done: number;
  result: string;
  count?: number;
  /** A device that never reports back: the row fails at `at`. */
  fail?: { at: number; label: string; detail: string };
  addr: string;
};

const EFFECTS: Effect[] = [
  { id: "nac", name: "Sounders & strobes", sub: "NAC 1–4 · Floors 4–6", icon: <Speaker216Regular />, cmd: 0.5, done: 1.5, result: "Active", addr: "NAC 1–4 · alert tone on floors 3 and 7" },
  { id: "door", name: "Door release", sub: "Hold-open magnets · 5F", icon: <DoorArrowRight16Regular />, cmd: 1, done: 3, result: "8/8 shut", count: 8, addr: "8 fire doors · 24 V holders de-energised" },
  {
    id: "damp",
    name: "Smoke dampers",
    sub: "5F ducts · end switches",
    icon: <Grid16Regular />,
    cmd: 1.5,
    done: 9,
    result: "12/12 shut",
    count: 12,
    fail: { at: 11.5, label: "11/12 · SD-5-07", detail: "SD-5-07 · east shaft · no end-switch feedback after 10 s" },
    addr: "12 motorised dampers on Level 5",
  },
  { id: "lift", name: "Elevator recall", sub: "Phase I · cars 1–4", icon: <ArrowDown16Regular />, cmd: 2, done: 16, result: "4/4 at lobby", count: 4, addr: "Primary recall to Lobby · doors open, out of service" },
];

const STEP = 0.25;

type Status = "pending" | "cmd" | "ok" | "fail";

function statusOf(e: Effect, t: number): { s: Status; n: number } {
  if (t < e.cmd) return { s: "pending", n: 0 };
  if (e.fail && t >= e.fail.at) return { s: "fail", n: (e.count ?? 1) - 1 };
  const f = Math.min(1, (t - e.cmd) / (e.done - e.cmd));
  const n = Math.floor(f * (e.count ?? 1) - (e.fail && f >= 1 ? 1 : 0));
  if (t >= e.done && !e.fail) return { s: "ok", n: e.count ?? 1 };
  return { s: "cmd", n: Math.max(0, e.fail ? Math.min(n, (e.count ?? 1) - 1) : n) };
}

/** Fire safety · medium. A cause-and-effect run for a Zone 5-2 smoke alarm: each output goes from pending to commanded to confirmed with live counts (doors shut, dampers closed, elevator cars recalled), one damper never reports back and fails red, and Replay runs the sequence again. */
export function CauseEffectWidget({ index }: { index?: number }) {
  const [t, setT] = useState(-(0.8 + (index ?? 0) * 0.06));
  const [spin, setSpin] = useState(0);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const id = window.setInterval(() => setT((x) => x + STEP), STEP * 1000);
    return () => window.clearInterval(id);
  }, []);

  const states = EFFECTS.map((e) => statusOf(e, t));
  const done = states.filter((s) => s.s === "ok").length;
  const failed = states.some((s) => s.s === "fail");

  return (
    <Widget size="medium" index={index} label="Cause and effect">
      <WidgetHeader
        icon={<Flowchart20Filled />}
        tint="var(--ios-indigo)"
        title="Cause & Effect"
        subtitle={
          <span className="tabular">
            Zone 5-2 smoke · T+{mmss(Math.max(0, t))} · {done}/{EFFECTS.length} confirmed
            {failed ? <span className="font-semibold text-ios-red"> · 1 failed</span> : null}
          </span>
        }
        extra={
          <motion.button
            type="button"
            aria-label="Replay"
            onClick={() => {
              setT(0);
              setSpin((s) => s + 1);
            }}
            whileTap={{ scale: 0.9 }}
            className="flex h-[24px] cursor-pointer items-center gap-1 rounded-full bg-fill-secondary px-2 text-[11px] font-semibold text-heading hover:bg-fill"
          >
            <motion.span className="flex" animate={{ rotate: spin * 360 }} transition={{ type: "spring", stiffness: 200, damping: 18 }}>
              <ArrowClockwise16Regular />
            </motion.span>
            Replay
          </motion.button>
        }
      />

      <ul className="mt-2">
        {EFFECTS.map((e, i) => {
          const { s, n } = states[i];
          return (
            <motion.li
              key={e.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + i * 0.05, type: "spring", stiffness: 320, damping: 28 }}
              className="relative flex h-[31px] items-center gap-2 border-b-[0.5px] border-split last:border-b-0"
            >
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full text-[12px] transition-colors duration-300",
                  s === "fail" ? "bg-ios-red text-white" : s === "cmd" ? "bg-ios-blue/15 text-ios-blue" : s === "ok" ? "bg-fill-secondary text-secondary" : "bg-fill-tertiary text-tertiary",
                )}
              >
                {e.icon}
              </span>
              <span className={cn("shrink-0 text-[12px] font-medium transition-colors", s === "pending" ? "text-tertiary" : "text-heading")}>{e.name}</span>
              <span className="min-w-0 flex-1 truncate text-[10px] text-tertiary">{e.sub}</span>
              <span className="w-[34px] shrink-0 text-right text-[10px] text-tertiary tabular">
                {s === "ok" ? `+${e.done}s` : s === "fail" ? `+${e.fail!.at}s` : s === "cmd" ? `+${e.cmd}s` : "—"}
              </span>
              <Tooltip title={s === "fail" ? e.fail!.detail : e.addr}>
                <span className="flex w-[92px] shrink-0 justify-end">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={s}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className={cn(
                        "flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-semibold whitespace-nowrap tabular",
                        s === "fail" ? "bg-ios-red/15 text-ios-red" : s === "cmd" ? "bg-ios-blue/15 text-ios-blue" : s === "ok" ? "bg-fill-tertiary text-secondary" : "text-tertiary",
                      )}
                    >
                      {s === "fail" ? (
                        <>
                          <Warning12Filled /> {e.fail!.label}
                        </>
                      ) : s === "ok" ? (
                        <>
                          <Checkmark12Filled className="text-ios-green" /> {e.result}
                        </>
                      ) : s === "cmd" ? (
                        <>
                          <motion.span
                            className="size-1.5 rounded-full bg-ios-blue"
                            animate={{ opacity: [1, 0.25, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                          />
                          {e.count ? `${n}/${e.count}` : "Commanded"}
                        </>
                      ) : (
                        "Pending"
                      )}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </Tooltip>
              {s === "fail" ? (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-[3px] -left-2 w-[3px] rounded-full bg-ios-red"
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                />
              ) : null}
            </motion.li>
          );
        })}
      </ul>
    </Widget>
  );
}
