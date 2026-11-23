import {
  CheckmarkCircle16Filled,
  ChevronLeft12Filled,
  ChevronRight12Filled,
  Fire20Filled,
  Speaker216Filled,
  SpeakerMute16Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { clock } from "./_parts";

type Kind = "alarm" | "supv" | "trbl";
type FireEvent = { id: string; kind: Kind; title: string; addr: string; at: string; acked?: string };

const KIND: Record<Kind, { label: string; text: string; strip: string; flash: string }> = {
  alarm: { label: "Fire alarm", text: "text-ios-red", strip: "bg-ios-red", flash: "bg-ios-red" },
  supv: { label: "Supervisory", text: "text-ios-orange", strip: "bg-ios-orange", flash: "bg-ios-orange" },
  trbl: { label: "Trouble", text: "text-ios-yellow", strip: "bg-ios-yellow", flash: "bg-ios-yellow" },
};

const TROUBLE: FireEvent = { id: "t1", kind: "trbl", title: "Ground fault · NAC circuit 3", addr: "Panel 1 · Card 4 · Floors 7–9", at: "13:41:05" };
const ALARMS: FireEvent[] = [
  { id: "a1", kind: "alarm", title: "Smoke · 5F Corridor East", addr: "L1-D037 · Zone 5-2", at: "14:02:17" },
  { id: "a2", kind: "alarm", title: "Pull station · 2F Stair B", addr: "L1-M018 · Zone 2-1", at: "" },
];
const SUPV: FireEvent = { id: "s1", kind: "supv", title: "Valve tamper · Riser 2 OS&Y", addr: "L2-M112 · Pump room", at: "13:58:40" };
const OPERATOR = "Owen Price";

/** Fire safety · medium. A fire alarm panel's event queue with Acknowledge, Silence and a two-step Reset: unacknowledged events flash and the sounders pulse until silenced, Reset asks for confirmation and clears the alarm while the ground fault stays, and a new alarm arrives a few seconds later. */
export function ActiveAlarmsWidget({ index }: { index?: number }) {
  const [events, setEvents] = useState<FireEvent[]>([ALARMS[0], SUPV, TROUBLE]);
  const [cur, setCur] = useState(0);
  const [silenced, setSilenced] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [round, setRound] = useState(1);

  useEffect(() => {
    if (!confirm) return;
    const t = window.setTimeout(() => setConfirm(false), 3000);
    return () => window.clearTimeout(t);
  }, [confirm]);

  // After a reset leaves only the trouble, the next alarm comes in.
  const hasAlarm = events.some((e) => e.kind === "alarm");
  useEffect(() => {
    if (hasAlarm) return;
    const t = window.setTimeout(() => {
      const next = { ...ALARMS[round % ALARMS.length], at: clock(new Date()) };
      setEvents((list) => [next, ...list]);
      setCur(0);
      setSilenced(false);
      setRound((r) => r + 1);
    }, 9000);
    return () => window.clearTimeout(t);
  }, [hasAlarm, round]);

  const idx = Math.min(cur, events.length - 1);
  const e = events[idx];
  const k = KIND[e.kind];
  const unacked = events.filter((x) => !x.acked);
  const sounding = hasAlarm && !silenced;
  const top: Kind | "normal" = hasAlarm ? "alarm" : events.some((x) => x.kind === "supv") ? "supv" : events.length ? "trbl" : "normal";
  const flashing = !e.acked;

  const acknowledge = () => {
    const target = unacked.find((x) => x.id === e.id) ?? unacked[0];
    if (!target) return;
    setEvents((list) => list.map((x) => (x.id === target.id ? { ...x, acked: clock(new Date()) } : x)));
    setCur(events.findIndex((x) => x.id === target.id));
  };
  const reset = () => {
    if (!confirm) {
      setConfirm(true);
      return;
    }
    setConfirm(false);
    setSilenced(false);
    // The ground fault is still physically there, so it reports again unacknowledged.
    setEvents([{ ...TROUBLE }]);
    setCur(0);
  };

  return (
    <Widget
      size="medium"
      index={index}
      label="Fire alarm panel"
      glow={{ mode: "pulse", colors: ["#FF453A", "#FF9F0A", "#FF453A"], blur: 20, duration: 1 }}
      glowActive={hasAlarm && events.some((x) => x.kind === "alarm" && !x.acked)}
    >
      <WidgetHeader
        icon={<Fire20Filled />}
        tint="var(--ios-red)"
        title="FACP-1 · Tower A"
        subtitle="Addressable · 1,284 points"
        extra={
          <motion.span
            key={top}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={top === "alarm" && unacked.some((x) => x.kind === "alarm") ? { scale: 1, opacity: [1, 0.45, 1] } : { scale: 1, opacity: 1 }}
            transition={top === "alarm" ? { opacity: { duration: 0.9, repeat: Infinity }, scale: { type: "spring", stiffness: 400, damping: 20 } } : { type: "spring", stiffness: 400, damping: 20 }}
            className={cn(
              "flex h-[22px] items-center rounded-full px-2 text-[11px] font-bold tracking-wide whitespace-nowrap",
              top === "alarm" ? "bg-ios-red text-white" : top === "supv" ? "bg-ios-orange/15 text-ios-orange" : top === "trbl" ? "bg-ios-yellow/15 text-ios-yellow" : "bg-fill-secondary text-secondary",
            )}
          >
            {top === "alarm" ? "FIRE ALARM" : top === "supv" ? "SUPERVISORY" : top === "trbl" ? "TROUBLE" : "NORMAL"}
          </motion.span>
        }
      />

      <div className="relative mt-2 h-[62px] overflow-hidden rounded-xl bg-fill-quaternary">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={e.id + (e.acked ?? "")}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="absolute inset-0 flex"
          >
            {flashing ? (
              <motion.span
                className={cn("pointer-events-none absolute inset-0", k.flash)}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.16, 0] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              />
            ) : null}
            <span className={cn("my-2 ml-2 w-[3px] shrink-0 rounded-full", k.strip)} />
            <div className="relative min-w-0 flex-1 py-2 pr-2 pl-2.5">
              <div className="flex items-center gap-1.5 text-[10px] leading-[12px]">
                <span className={cn("font-bold tracking-wide uppercase", k.text)}>{k.label}</span>
                <span className="text-tertiary tabular">{e.at}</span>
                <span className="ml-auto flex items-center gap-0.5 text-tertiary tabular">
                  <button
                    type="button"
                    aria-label="Previous event"
                    onClick={() => setCur((c) => (Math.min(c, events.length - 1) - 1 + events.length) % events.length)}
                    className="grid size-[18px] cursor-pointer place-items-center rounded-full hover:bg-fill-secondary hover:text-heading"
                  >
                    <ChevronLeft12Filled />
                  </button>
                  {idx + 1}/{events.length}
                  <button
                    type="button"
                    aria-label="Next event"
                    onClick={() => setCur((c) => (Math.min(c, events.length - 1) + 1) % events.length)}
                    className="grid size-[18px] cursor-pointer place-items-center rounded-full hover:bg-fill-secondary hover:text-heading"
                  >
                    <ChevronRight12Filled />
                  </button>
                </span>
              </div>
              <div className="mt-0.5 truncate text-[13px] leading-[16px] font-semibold text-heading">{e.title}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] leading-[14px] text-tertiary">
                <span className="truncate tabular">{e.addr}</span>
                {e.acked ? (
                  <span className="ml-auto flex shrink-0 items-center gap-1">
                    <MemojiAvatar who={OPERATOR} size={14} alt={OPERATOR} />
                    Ack {e.acked}
                  </span>
                ) : (
                  <span className={cn("ml-auto shrink-0 font-semibold", k.text)}>Unacknowledged</span>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-1.5 flex h-[16px] items-center gap-1.5 whitespace-nowrap text-[11px]">
        {sounding ? (
          <motion.span animate={{ scale: [1, 1.18, 1] }} transition={{ duration: 0.7, repeat: Infinity }} className="flex text-ios-red">
            <Speaker216Filled />
          </motion.span>
        ) : silenced ? (
          <SpeakerMute16Filled className="text-tertiary" />
        ) : (
          <CheckmarkCircle16Filled className="text-tertiary" />
        )}
        <span className={cn(sounding ? "font-medium text-ios-red" : "text-tertiary")}>
          {sounding ? "Signals sounding · NAC 1–4" : silenced ? "Signals silenced" : "No signals active"}
        </span>
        <span className="ml-auto text-tertiary tabular">
          {(["alarm", "supv", "trbl"] as Kind[])
            .map((kk) => [kk, events.filter((x) => x.kind === kk).length] as const)
            .map(([kk, n]) => `${n} ${kk === "alarm" ? "alm" : kk}`)
            .join(" · ")}
        </span>
      </div>

      <div className="mt-auto grid grid-cols-3 gap-2">
        <Button size="small" type={unacked.length ? "primary" : "default"} disabled={!unacked.length} onClick={acknowledge}>
          Acknowledge
        </Button>
        <Button size="small" disabled={!hasAlarm} onClick={() => setSilenced((s) => !s)}>
          {silenced ? "Resound" : "Silence"}
        </Button>
        <Button size="small" type={confirm ? "primary" : "default"} danger={confirm} onClick={reset}>
          {confirm ? "Confirm reset" : "Reset"}
        </Button>
      </div>
    </Widget>
  );
}
