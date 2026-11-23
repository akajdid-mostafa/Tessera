import {
  Box16Regular,
  Dismiss16Regular,
  DoorArrowLeft16Regular,
  LockClosed16Filled,
  LockOpen16Filled,
  Mic16Filled,
  PersonWalking16Regular,
  Video20Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ComponentType, useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

type Phase = "ringing" | "talking" | "idle";
type Lock = "locked" | "confirm" | "unlocking" | "unlocked";
type Event = { id: number; Icon: ComponentType<{ className?: string }>; text: string; time: string };

const VISITORS = [
  { who: "m6", label: "Courier" },
  { who: "f4", label: "Neighbor" },
];
const REPLIES = [
  { id: "leave", text: "Leave at door", leaves: true },
  { id: "omw", text: "On my way", leaves: false },
];
/** Camera clock starts at 4:12:20 PM; the ring came in six seconds earlier. */
const BASE_S = 16 * 3600 + 12 * 60 + 20;
const RE_RING_MS = 15_000;

const stamp = (s: number) => {
  const h = Math.floor(s / 3600) % 24;
  const m = Math.floor(s / 60) % 60;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};
const short = (s: number) => {
  const h = Math.floor(s / 3600) % 24;
  return `${h % 12 || 12}:${String(Math.floor(s / 60) % 60).padStart(2, "0")} PM`;
};

/** Smart home · medium. A doorbell camera with a courier at the door, a live clock and a pulsing ring; talk, send a quick reply, unlock with a confirm tap or dismiss, and the visitor walks off and lands in the activity list. */
export function DoorbellWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [secs, setSecs] = useState(BASE_S);
  const [phase, setPhase] = useState<Phase>("ringing");
  const [ringAt, setRingAt] = useState(BASE_S - 6);
  const [talkAt, setTalkAt] = useState(BASE_S);
  const [visitor, setVisitor] = useState(0);
  const [bubble, setBubble] = useState<string | null>(null);
  const [lock, setLock] = useState<Lock>("locked");
  const [events, setEvents] = useState<Event[]>([
    { id: 1, Icon: Box16Regular, text: "Package detected", time: "4:11 PM" },
    { id: 0, Icon: PersonWalking16Regular, text: "Motion · driveway", time: "2:41 PM" },
  ]);
  const nextId = useRef(2);
  const now = useRef(secs);
  now.current = secs;

  useEffect(() => {
    const t = window.setInterval(() => setSecs((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  // An idle porch gets a new caller after a while, so the demo keeps telling its story.
  useEffect(() => {
    if (phase !== "idle") return;
    const t = window.setTimeout(() => {
      setVisitor((v) => (v + 1) % VISITORS.length);
      setRingAt(now.current);
      setPhase("ringing");
    }, RE_RING_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (!bubble) return;
    const t = window.setTimeout(() => setBubble(null), 2600);
    return () => window.clearTimeout(t);
  }, [bubble]);

  useEffect(() => {
    if (lock === "locked") return;
    const next: Record<Exclude<Lock, "locked">, Lock> = { confirm: "locked", unlocking: "unlocked", unlocked: "locked" };
    const t = window.setTimeout(() => setLock(next[lock]), lock === "confirm" ? 3000 : lock === "unlocking" ? 1000 : 6000);
    return () => window.clearTimeout(t);
  }, [lock]);

  const log = (Icon: Event["Icon"], text: string) => {
    const id = nextId.current++;
    const time = short(now.current);
    setEvents((es) => [{ id, Icon, text, time }, ...es].slice(0, 2));
  };
  const leave = (text: string) => {
    setPhase("idle");
    log(DoorArrowLeft16Regular, text);
  };

  const present = phase !== "idle";
  const v = VISITORS[visitor];
  const elapsed = Math.max(0, secs - (phase === "talking" ? talkAt : ringAt));

  return (
    <Widget size="medium" index={index} label="Doorbell camera">
      <div className="flex h-full gap-3">
        <Camera
          delay={delay}
          present={present}
          ringing={phase === "ringing"}
          talking={phase === "talking"}
          who={v.who}
          label={v.label}
          clock={stamp(secs)}
          bubble={bubble}
          open={lock === "unlocked"}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <WidgetHeader
            icon={<Video20Filled />}
            tint={phase === "ringing" ? "var(--ios-orange)" : "var(--ios-blue)"}
            title="Front Door"
            subtitle={
              phase === "idle" ? (
                "No one at the door"
              ) : (
                <span className="tabular">
                  {phase === "ringing" ? `${v.label} ringing · ` : "Talking · "}
                  <AnimatedNumber value={Math.floor(elapsed / 60)} />:
                  <AnimatedNumber value={elapsed % 60} format={{ minimumIntegerDigits: 2 }} />
                </span>
              )
            }
          />

          <div className="mt-2 flex gap-1.5">
            {REPLIES.map((r) => (
              <motion.button
                key={r.id}
                type="button"
                disabled={!present}
                whileTap={present ? { scale: 0.92 } : undefined}
                onClick={() => {
                  setBubble(r.text);
                  if (r.leaves) leave(`${v.label} left parcel`);
                }}
                className={cn(
                  "h-6 cursor-pointer rounded-full px-2.5 text-[11px] font-semibold whitespace-nowrap transition-opacity",
                  "bg-ios-blue/15 text-ios-blue disabled:cursor-default disabled:opacity-40",
                )}
              >
                {r.text}
              </motion.button>
            ))}
          </div>

          <div className="mt-2 flex flex-col divide-y-[0.5px] divide-split">
            <AnimatePresence initial={false} mode="popLayout">
              {events.map((e) => (
                <motion.div
                  key={e.id}
                  layout
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  className="flex h-[22px] items-center gap-1.5 text-[11px] whitespace-nowrap"
                >
                  <e.Icon className="shrink-0 text-[13px] text-tertiary" />
                  <span className="min-w-0 flex-1 truncate text-secondary">{e.text}</span>
                  <span className="shrink-0 text-tertiary tabular">{e.time}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-auto flex h-7 items-center gap-1.5">
            <Button
              size="small"
              variant={phase === "talking" ? "solid" : "filled"}
              color={phase === "talking" ? "danger" : "default"}
              disabled={!present}
              icon={<Mic16Filled />}
              className="flex-1"
              onClick={() => {
                if (phase === "talking") setPhase("ringing");
                else {
                  setTalkAt(now.current);
                  setPhase("talking");
                }
              }}
            >
              {phase === "talking" ? "End" : "Talk"}
            </Button>
            <Button
              size="small"
              variant={lock === "confirm" ? "solid" : "filled"}
              color={lock === "unlocked" ? "green" : lock === "confirm" ? "primary" : "default"}
              icon={lock === "unlocked" ? <LockOpen16Filled /> : <LockClosed16Filled />}
              loading={lock === "unlocking"}
              className="relative flex-[1.3] overflow-hidden"
              onClick={() => setLock((l) => (l === "locked" ? "confirm" : l === "confirm" ? "unlocking" : l))}
            >
              {lock === "confirm" ? "Confirm" : lock === "unlocking" ? "Unlocking" : lock === "unlocked" ? "Unlocked" : "Unlock"}
              {lock === "confirm" ? (
                <motion.span
                  className="absolute bottom-0 left-0 h-[2px] bg-white/70"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 3, ease: "linear" }}
                />
              ) : null}
            </Button>
            <Button
              size="small"
              shape="circle"
              variant="filled"
              color="default"
              aria-label="Dismiss"
              disabled={!present}
              icon={<Dismiss16Regular />}
              onClick={() => leave(`${v.label} dismissed`)}
            />
          </div>
        </div>
      </div>
    </Widget>
  );
}

/**
 * Porch photo: "A cardboard box sitting in front of a door" (Pasadena, CA), Unsplash,
 * free Unsplash License (no attribution required), no people in frame. Unsplash page:
 * https://unsplash.com/photos/MuocECxCLlY. Served at 2x the 150 x 164 view.
 */
const PORCH_SRC = "https://images.unsplash.com/photo-1638501478003-4e9761dcfe22?w=300&h=328&fit=crop&auto=format&q=65";

/** The doorbell's view of the porch: a real photo with a fisheye/vignette treatment on a fixed dark palette, so it reads the same in both themes. */
function Camera({
  delay,
  present,
  ringing,
  talking,
  who,
  label,
  clock,
  bubble,
  open,
}: {
  delay: number;
  present: boolean;
  ringing: boolean;
  talking: boolean;
  who: string;
  label: string;
  clock: string;
  bubble: string | null;
  open: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative h-full w-[150px] shrink-0 overflow-hidden rounded-xl bg-[linear-gradient(180deg,#46536a_0%,#2a313d_70%,#1c2129_100%)]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {failed ? null : (
          <img
            src={PORCH_SRC}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={() => setFailed(true)}
            className="absolute inset-0 size-full scale-[1.08] object-cover object-[60%_60%]"
            style={{ filter: "saturate(0.85) contrast(1.05) brightness(0.92)" }}
          />
        )}
        {/* Door swings open: warm light spills from the doorway on the right. */}
        <motion.div
          className="absolute inset-y-0 right-0 w-[45%] bg-[linear-gradient(270deg,rgba(255,214,140,0.55),rgba(255,214,140,0))]"
          initial={false}
          animate={{ opacity: open ? 1 : 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        {/* Doorbell-camera lens: barrel vignette, darker corners, a faint lens sheen. */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_70%_at_50%_48%,rgba(0,0,0,0)_55%,rgba(0,0,0,0.35)_80%,rgba(0,0,0,0.75)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_22%,rgba(255,255,255,0.08),rgba(255,255,255,0)_45%)]" />
        {/* Scan line, the camera's only constant motion. */}
        <motion.div
          className="absolute inset-x-0 top-0 h-[22px] bg-white/[0.04]"
          initial={{ y: -22 }}
          animate={{ y: 164 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <AnimatePresence>
        {present ? (
          <motion.div
            key={who}
            className="absolute top-[46px] left-[41px]"
            initial={{ opacity: 0, x: 30, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40, transition: { duration: 0.6 } }}
            transition={{ delay: delay + 0.2, type: "spring", stiffness: 200, damping: 22 }}
          >
            <motion.div animate={{ y: [0, -1.5, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}>
              <MemojiAvatar who={who} size={68} className="ring-[1.5px] ring-black/20" />
            </motion.div>
            <motion.div
              className="absolute -inset-1.5 rounded-lg border border-dashed border-ios-yellow"
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.6, type: "spring", stiffness: 300, damping: 24 }}
            >
              <span className="absolute -top-[17px] left-0 rounded bg-ios-yellow-deep px-1 text-[10px] leading-[14px] font-semibold text-white">
                {label}
              </span>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="absolute inset-x-2 top-2 flex items-center justify-between text-[10px] leading-none font-semibold text-white">
        <span className="flex items-center gap-1 rounded bg-black/45 px-1 py-0.5">
          <motion.span
            className="size-1.5 rounded-full bg-ios-red"
            animate={{ opacity: [1, 0.25, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          LIVE
        </span>
        <span className="rounded bg-black/45 px-1 py-0.5 font-medium text-white/85 tabular">{clock}</span>
      </div>

      <div className="absolute inset-x-2 bottom-2 flex justify-center">
        <AnimatePresence mode="popLayout">
          {bubble ? (
            <motion.span
              key="bubble"
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4 }}
              className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-black shadow"
            >
              “{bubble}”
            </motion.span>
          ) : talking ? (
            <motion.span
              key="wave"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-5 items-center gap-[3px] rounded-full bg-black/50 px-2"
            >
              {[0.9, 0.6, 1.1, 0.7, 1].map((d, i) => (
                <motion.span
                  key={i}
                  className="h-3 w-[3px] rounded-full bg-ios-green"
                  animate={{ scaleY: [0.3, 1, 0.4, 0.8, 0.3] }}
                  transition={{ duration: d, repeat: Infinity, ease: "easeInOut" }}
                />
              ))}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      {ringing ? (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-ios-orange ring-inset"
          animate={{ opacity: [0.9, 0.2, 0.9] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}
    </div>
  );
}
