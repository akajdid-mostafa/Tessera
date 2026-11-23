import { AlertUrgent20Filled, Call16Regular, Checkmark16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

/** One week, Monday 00:00 to next Monday 00:00, in hours. */
const WEEK = 168;
const SHIFTS = [
  { who: "Lena Ortiz", from: 0, to: 9, fill: "bg-fill-secondary", detail: "Sun 09:00 → Mon 09:00 · 1 page" },
  { who: "Dana Whitfield", from: 9, to: 81, fill: "bg-ios-purple/25", detail: "Mon 09:00 → Thu 09:00 · primary now" },
  { who: "Theo Park", from: 81, to: 168, fill: "bg-ios-blue/15", detail: "Thu 09:00 → Mon 09:00 · next up" },
];
const PAGES = [
  { at: 3.2, text: "Mon 03:12 · webhook backlog · resolved in 14 min" },
  { at: 11.67, text: "Mon 11:40 · card auth p99 > 2 s · resolved in 9 min" },
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const START_NOW = 14 + 20 / 60;

type Phase = "idle" | "confirm" | "paging" | "acked";

const clock = (h: number) => `${String(Math.floor(h) % 24).padStart(2, "0")}:${String(Math.floor((h % 1) * 60)).padStart(2, "0")}`;

/** SaaS · medium. This week's on-call rotation as a strip with a live Now marker; Page asks to confirm, then waits for the acknowledgement. */
export function OnCallWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [now, setNow] = useState(START_NOW);
  const [phase, setPhase] = useState<Phase>("idle");
  const [secs, setSecs] = useState(0);

  // The Now marker creeps along: one minute every 15 seconds.
  useEffect(() => {
    const t = window.setInterval(() => setNow((h) => h + 1 / 60), 15000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (phase === "confirm") {
      const t = window.setTimeout(() => setPhase("idle"), 3200);
      return () => window.clearTimeout(t);
    }
    if (phase === "paging") {
      const tick = window.setInterval(() => setSecs((s) => s + 1), 1000);
      const ack = window.setTimeout(() => setPhase("acked"), 5200);
      return () => {
        window.clearInterval(tick);
        window.clearTimeout(ack);
      };
    }
    if (phase === "acked") {
      const t = window.setTimeout(() => setPhase("idle"), 4000);
      return () => window.clearTimeout(t);
    }
  }, [phase]);

  const press = () => {
    if (phase === "idle") setPhase("confirm");
    else if (phase === "confirm") {
      setSecs(0);
      setPhase("paging");
    }
  };

  const pill = {
    idle: { text: "Quiet", cls: "bg-fill-tertiary text-secondary" },
    confirm: { text: "Quiet", cls: "bg-fill-tertiary text-secondary" },
    paging: { text: "Paging", cls: "bg-ios-orange/15 text-ios-orange" },
    acked: { text: "Acked", cls: "bg-ios-green/15 text-ios-green" },
  }[phase];
  const ring =
    phase === "paging" ? "var(--ios-orange)" : phase === "acked" ? "var(--ios-green)" : "var(--ios-purple)";
  const nowPct = (now / WEEK) * 100;

  return (
    <Widget size="medium" index={index} label="On-call rotation">
      <WidgetHeader
        icon={<AlertUrgent20Filled />}
        tint="var(--ios-purple)"
        title="On-call · Payments"
        subtitle="Primary until Thu 09:00"
        extra={
          <motion.span
            key={pill.text}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
            className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", pill.cls)}
          >
            {pill.text}
          </motion.span>
        }
      />

      <div className="mt-3 flex items-center gap-3">
        <div className="relative shrink-0">
          <motion.span
            className="absolute -inset-[3px] rounded-full border-2"
            style={{ borderColor: ring }}
            animate={phase === "paging" ? { scale: [1, 1.12, 1], opacity: [1, 0.4, 1] } : { scale: 1, opacity: 1 }}
            transition={phase === "paging" ? { duration: 1, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
          />
          <MemojiAvatar who="Dana Whitfield" size={38} alt="Dana Whitfield" />
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[14px] font-semibold text-heading">Dana Whitfield</div>
          <div className="relative h-[16px] text-[11px]">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={phase === "confirm" ? "idle" : phase}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-1 whitespace-nowrap"
              >
                {phase === "paging" ? (
                  <span className="font-medium text-ios-orange tabular">Ack pending · 0:{String(secs).padStart(2, "0")}</span>
                ) : phase === "acked" ? (
                  <span className="flex items-center gap-1 font-medium text-ios-green tabular">
                    <Checkmark16Filled className="size-3.5" /> Acknowledged in 0:{String(secs).padStart(2, "0")}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-tertiary">
                    <MemojiAvatar who="Ravi Menon" size={14} alt="" /> Ravi Menon · secondary
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <Button
          size="small"
          shape="round"
          icon={phase === "acked" ? <Checkmark16Filled /> : <Call16Regular />}
          color={phase === "confirm" ? "danger" : "default"}
          variant={phase === "confirm" ? "solid" : "filled"}
          loading={phase === "paging"}
          disabled={phase === "acked"}
          onClick={press}
          className="w-[104px] shrink-0 text-[12px] font-semibold"
        >
          {phase === "confirm" ? "Confirm" : phase === "paging" ? "Paging" : phase === "acked" ? "Acked" : "Page Dana"}
        </Button>
      </div>

      <div className="mt-auto">
        <div className="relative h-3">
          <motion.span
            className="absolute -translate-x-1/2 whitespace-nowrap text-[9px] font-semibold leading-3 text-heading tabular"
            initial={false}
            animate={{ left: `${Math.max(nowPct, 4)}%` }}
          >
            Now {clock(now)}
          </motion.span>
        </div>
        <div className="relative mt-0.5 flex h-[18px] overflow-hidden rounded-md">
          {SHIFTS.map((s, i) => (
            <Tooltip key={s.who} title={`${s.who} · ${s.detail}`}>
              <motion.div
                className={cn("flex h-full cursor-default items-center gap-1 overflow-hidden border-r border-[var(--widget-surface)] pl-0.5", s.fill)}
                initial={{ width: 0 }}
                animate={{ width: `${((s.to - s.from) / WEEK) * 100}%` }}
                whileHover={{ filter: "brightness(1.15)" }}
                transition={{ type: "spring", stiffness: 140, damping: 22, delay: delay + i * 0.1 }}
              >
                <MemojiAvatar who={s.who} size={14} alt="" />
                {s.to - s.from > 30 ? (
                  <span className="truncate text-[10px] font-medium text-secondary">{s.who.split(" ")[0]}</span>
                ) : null}
              </motion.div>
            </Tooltip>
          ))}
          {/* What has already happened this week is washed back. */}
          <motion.span
            className="pointer-events-none absolute inset-y-0 left-0 bg-[var(--widget-surface)] opacity-40"
            initial={false}
            animate={{ width: `${nowPct}%` }}
          />
          {PAGES.map((p) => (
            <Tooltip key={p.at} title={p.text}>
              <motion.span
                className="absolute inset-y-[3px] w-[3px] -translate-x-1/2 cursor-default rounded-full bg-ios-red"
                style={{ left: `${(p.at / WEEK) * 100}%` }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: delay + 0.5, type: "spring", stiffness: 400, damping: 20 }}
              />
            </Tooltip>
          ))}
          <motion.span
            className="pointer-events-none absolute inset-y-0 w-[2px] -translate-x-1/2 bg-[var(--ant-color-text)]"
            initial={false}
            animate={{ left: `${nowPct}%` }}
          />
        </div>
        <div className="mt-1 grid grid-cols-7 text-[9px] text-tertiary">
          {DAYS.map((d, i) => (
            <span key={d} className={cn("pl-0.5", i === 0 && "font-semibold text-secondary")}>
              {d}
            </span>
          ))}
        </div>
      </div>
    </Widget>
  );
}
