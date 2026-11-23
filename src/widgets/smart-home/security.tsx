import {
  Door20Filled,
  DoorArrowRight20Filled,
  PersonWalking20Filled,
  Shield20Filled,
  ShieldCheckmark20Filled,
  ShieldError20Filled,
  ShieldLock20Filled,
  Window20Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ComponentType, useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";

type Mode = "off" | "home" | "away";
type Phase = "disarmed" | "blocked" | "arming" | "armed";
type Zone = { id: string; name: string; kind: "door" | "window" | "motion"; Icon: ComponentType<{ className?: string }> };
type Entry = { id: number; who: string | null; text: string; time: string };

const ZONES: Zone[] = [
  { id: "front", name: "Front Door", kind: "door", Icon: Door20Filled },
  { id: "back", name: "Back Door", kind: "door", Icon: Door20Filled },
  { id: "kitchen", name: "Kitchen Window", kind: "window", Icon: Window20Filled },
  { id: "garage", name: "Garage Entry", kind: "door", Icon: DoorArrowRight20Filled },
  { id: "hall", name: "Hallway", kind: "motion", Icon: PersonWalking20Filled },
  { id: "living", name: "Living Room", kind: "motion", Icon: PersonWalking20Filled },
];
const EXIT_DELAY = 30;
const R = 32;
const C = 2 * Math.PI * R;
/** The person holding the phone. */
const ME = { name: "Maya", who: "f3" };
const BASE_MIN = 16 * 60 + 12;

const clock = (min: number) => `${Math.floor(min / 60) % 12 || 12}:${String(min % 60).padStart(2, "0")} PM`;

/** Smart home · large. An alarm panel with Off, Home and Away modes, an exit-delay ring that drains before arming, six door, window and motion sensors and a memoji activity log; an open window blocks arming until you bypass it. */
export function SecurityWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [mode, setMode] = useState<Mode>("off");
  const [phase, setPhase] = useState<Phase>("disarmed");
  const [count, setCount] = useState(EXIT_DELAY);
  const [bypassed, setBypassed] = useState(false);
  const [motionAt, setMotionAt] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(BASE_MIN);
  const [log, setLog] = useState<Entry[]>([
    { id: 2, who: null, text: "Kitchen Window opened", time: "4:05 PM" },
    { id: 1, who: ME.who, text: "Maya disarmed", time: "7:42 AM" },
    { id: 0, who: "m8", text: "Dan armed Home", time: "11:02 PM" },
  ]);
  const nextId = useRef(3);
  const nowMin = useRef(minutes);
  nowMin.current = minutes;

  useEffect(() => {
    const t = window.setInterval(() => setMinutes((m) => m + 1), 60_000);
    return () => window.clearInterval(t);
  }, []);

  // Exit delay: one second at a time, then the system arms.
  useEffect(() => {
    if (phase !== "arming") return;
    if (count <= 0) {
      setPhase("armed");
      return;
    }
    const t = window.setTimeout(() => setCount((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [phase, count]);

  // People moving around the house trip the motion sensors while it is disarmed or arming.
  useEffect(() => {
    if (phase === "armed") return;
    let clear: number | undefined;
    const t = window.setInterval(() => {
      setMotionAt(Math.random() < 0.5 ? "hall" : "living");
      window.clearTimeout(clear);
      clear = window.setTimeout(() => setMotionAt(null), 1800);
    }, 5200);
    return () => {
      window.clearInterval(t);
      window.clearTimeout(clear);
      setMotionAt(null);
    };
  }, [phase]);

  const add = (text: string, who: string | null = ME.who) => {
    const id = nextId.current++;
    const time = clock(nowMin.current);
    setLog((l) => [{ id, who, text, time }, ...l].slice(0, 3));
  };

  const arm = (m: Exclude<Mode, "off">, bypass: boolean) => {
    if (!bypass) {
      setPhase("blocked");
      return;
    }
    if (m === "away") {
      setCount(EXIT_DELAY);
      setPhase("arming");
      add(`${ME.name} armed Away`);
    } else {
      setPhase("armed");
      add(`${ME.name} armed Home`);
    }
  };

  const choose = (m: Mode) => {
    setMode(m);
    if (m === "off") {
      if (phase === "armed" || phase === "arming") add(`${ME.name} disarmed`);
      setPhase("disarmed");
      return;
    }
    arm(m, bypassed);
  };

  const doBypass = () => {
    setBypassed(true);
    add("Kitchen Window bypassed");
    if (mode !== "off") arm(mode, true);
  };

  const tone =
    phase === "blocked"
      ? { ring: "var(--ios-orange)", text: "text-ios-orange", pill: "bg-ios-orange/15", Icon: ShieldError20Filled }
      : phase === "arming"
        ? { ring: "var(--ios-orange)", text: "text-ios-orange", pill: "bg-ios-orange/15", Icon: ShieldLock20Filled }
        : phase === "armed"
          ? { ring: "var(--ios-blue)", text: "text-ios-blue", pill: "bg-ios-blue/15", Icon: ShieldCheckmark20Filled }
          : { ring: "var(--ant-color-text-tertiary)", text: "text-secondary", pill: "bg-fill-secondary", Icon: Shield20Filled };

  const title =
    phase === "blocked" ? "Can't arm" : phase === "arming" ? "Arming Away" : phase === "armed" ? (mode === "away" ? "Armed Away" : "Armed Home") : "Disarmed";
  const detail =
    phase === "blocked"
      ? "Kitchen Window is open"
      : phase === "arming"
        ? "Exit delay · leave now"
        : phase === "armed"
          ? mode === "away"
            ? "All sensors watching"
            : "Doors and windows only"
          : "3 people home";
  const frac = phase === "arming" ? count / EXIT_DELAY : 1;

  return (
    <Widget size="large" index={index} label="Home security">
      <WidgetHeader
        icon={<ShieldLock20Filled />}
        tint={phase === "disarmed" ? "var(--ios-green)" : tone.ring}
        title="Security"
        subtitle="Maple House · 6 sensors"
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={phase}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={cn("mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap", tone.pill, tone.text)}
            >
              {phase === "blocked" ? "Action needed" : phase === "arming" ? "Exit delay" : phase === "armed" ? "Armed" : "Off"}
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="mt-2 flex h-[76px] shrink-0 items-center gap-3">
        <div className="relative size-[76px] shrink-0">
          <svg viewBox="0 0 76 76" className="size-full -rotate-90" aria-hidden>
            <circle cx="38" cy="38" r={R} fill="none" strokeWidth="6" className="stroke-fill-secondary" />
            <motion.circle
              cx="38"
              cy="38"
              r={R}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C, stroke: tone.ring }}
              animate={{ strokeDashoffset: C * (1 - frac), stroke: tone.ring }}
              transition={{
                strokeDashoffset: phase === "arming" ? { duration: 1, ease: "linear" } : { delay, type: "spring", stiffness: 80, damping: 18 },
                stroke: { duration: 0.3 },
              }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <AnimatePresence mode="popLayout" initial={false}>
              {phase === "arming" ? (
                <motion.span
                  key="n"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  className="text-[22px] leading-none font-semibold text-heading"
                >
                  <AnimatedNumber value={count} trend={-1} />
                </motion.span>
              ) : (
                <motion.span
                  key={phase}
                  initial={{ opacity: 0, scale: 0.4, rotate: -20 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.4 }}
                  transition={{ type: "spring", stiffness: 420, damping: 18 }}
                  className={cn("grid place-items-center text-[28px]", tone.text)}
                >
                  <tone.Icon />
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="leading-tight whitespace-nowrap">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={cn("truncate text-[20px] font-semibold tracking-tight", phase === "blocked" ? "text-ios-orange" : "text-heading")}
              >
                {title}
              </motion.div>
            </AnimatePresence>
            <div className="truncate text-[11px] text-tertiary">{detail}</div>
          </div>
          <Segmented<Mode>
            size="small"
            block
            value={mode}
            onChange={(v) => choose(v)}
            options={[
              { label: "Off", value: "off" },
              { label: "Home", value: "home" },
              { label: "Away", value: "away" },
            ]}
          />
        </div>
      </div>

      <div className="mt-2.5 mb-1 text-[11px] font-semibold tracking-wide text-tertiary uppercase">Sensors</div>
      <div className="grid shrink-0 grid-cols-2 gap-1.5">
        {ZONES.map((z, i) => {
          const isOpen = z.id === "kitchen";
          const tripped = motionAt === z.id;
          const ignored = z.kind === "motion" && phase === "armed" && mode === "home";
          const needsBypass = isOpen && !bypassed && phase === "blocked";
          const state = isOpen
            ? bypassed
              ? "Bypassed"
              : "Open"
            : z.kind === "motion"
              ? ignored
                ? "Ignored"
                : tripped
                  ? "Motion"
                  : "Clear"
              : "Closed";
          const warn = isOpen && !bypassed;
          return (
            <motion.div
              key={z.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: ignored ? 0.55 : 1, y: 0 }}
              transition={{ delay: delay + 0.2 + i * 0.04, type: "spring", stiffness: 380, damping: 28 }}
              className={cn(
                "relative flex h-[32px] items-center gap-2 overflow-hidden rounded-lg px-2 whitespace-nowrap",
                warn ? "bg-ios-orange/15" : "bg-fill-tertiary",
              )}
            >
              <span className={cn("relative grid shrink-0 place-items-center text-[16px]", warn ? "text-ios-orange" : tripped ? "text-ios-blue" : "text-secondary")}>
                <z.Icon />
                {tripped ? (
                  <motion.span
                    className="absolute -inset-1 rounded-full ring-2 ring-ios-blue"
                    initial={{ opacity: 0.9, scale: 0.7 }}
                    animate={{ opacity: 0, scale: 1.5 }}
                    transition={{ duration: 0.9, repeat: 1 }}
                  />
                ) : null}
              </span>
              <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-heading">{z.name}</span>
              {needsBypass ? (
                <motion.button
                  type="button"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: [1, 1.06, 1], opacity: 1 }}
                  transition={{ scale: { duration: 1, repeat: Infinity }, opacity: { duration: 0.2 } }}
                  whileTap={{ scale: 0.9 }}
                  onClick={doBypass}
                  className="shrink-0 cursor-pointer rounded-md bg-ios-orange/15 px-1.5 py-0.5 text-[11px] font-semibold text-ios-orange"
                >
                  Bypass
                </motion.button>
              ) : (
                <span
                  className={cn(
                    "shrink-0 text-[11px] font-semibold",
                    warn ? "text-ios-orange" : tripped ? "text-ios-blue" : "text-tertiary",
                  )}
                >
                  {state}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-2.5 mb-0.5 text-[11px] font-semibold tracking-wide text-tertiary uppercase">Activity</div>
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <AnimatePresence initial={false} mode="popLayout">
          {log.map((e) => (
            <motion.div
              key={e.id}
              layout
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="relative flex h-[25px] shrink-0 items-center gap-2 whitespace-nowrap not-first:before:absolute not-first:before:inset-x-0 not-first:before:-top-1 not-first:before:h-[0.5px] not-first:before:bg-split"
            >
              {e.who ? (
                <MemojiAvatar who={e.who} size={20} />
              ) : (
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-ios-orange/15 text-[12px] text-ios-orange">
                  <Window20Filled />
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-[12px] text-secondary">{e.text}</span>
              <span className="shrink-0 text-[11px] text-tertiary tabular">{e.time}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
