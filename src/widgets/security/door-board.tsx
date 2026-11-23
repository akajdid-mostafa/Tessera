import {
  Checkmark12Filled,
  Door16Regular,
  Door20Filled,
  LockClosed16Regular,
  LockOpen16Regular,
  ShieldError16Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { mmss } from "./_parts";

type DoorState = "locked" | "unlocked" | "held" | "forced";
type Door = { id: string; name: string; state: DoorState; sub: string; who?: string; since?: number };

const SEED: Door[] = [
  { id: "srv", name: "Server Room B2", state: "forced", sub: "No valid credential · 14:02" },
  { id: "dock", name: "Loading Dock 2", state: "held", sub: "Courier · Sam Ortiz", who: "Sam Ortiz", since: 161 },
  { id: "main", name: "Main Entrance", state: "unlocked", sub: "Schedule · until 18:00", who: "Grace Park" },
  { id: "lab", name: "Lab 4.07", state: "locked", sub: "Priya Shah · 13:48", who: "Priya Shah" },
];

const BADGES = ["Marco Bianchi", "Hana Sato", "Owen Price", "Leila Haddad", "Priya Shah", "Raj Patel"];

const STYLE: Record<DoorState, { icon: ReactNode; chip: string; pill: string; label: string }> = {
  locked: { icon: <LockClosed16Regular />, chip: "bg-fill-tertiary text-secondary", pill: "bg-fill-tertiary text-secondary", label: "Locked" },
  unlocked: { icon: <LockOpen16Regular />, chip: "bg-ios-blue/15 text-ios-blue", pill: "bg-ios-blue/15 text-ios-blue", label: "Unlocked" },
  held: { icon: <Door16Regular />, chip: "bg-ios-orange/15 text-ios-orange", pill: "bg-ios-orange/15 text-ios-orange", label: "Held" },
  forced: { icon: <ShieldError16Filled />, chip: "bg-ios-red text-white", pill: "bg-ios-red/15 text-ios-red", label: "Forced" },
};

const HELD_CRITICAL = 300;
const hhmm = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/** Security · medium. Door status board: a forced door pulses until you reset it (tap, then confirm), a held-open door counts up and turns red past five minutes, and badge reads land live on the locked door. */
export function DoorBoardWidget({ index }: { index?: number }) {
  const [doors, setDoors] = useState(SEED);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [granted, setGranted] = useState<string | null>(null);

  // Held timer.
  useEffect(() => {
    const t = window.setInterval(
      () => setDoors((list) => list.map((d) => (d.state === "held" && d.since !== undefined ? { ...d, since: d.since + 1 } : d))),
      1000,
    );
    return () => window.clearInterval(t);
  }, []);

  // Badge reads on the lab door.
  useEffect(() => {
    let n = 0;
    const t = window.setInterval(() => {
      const who = BADGES[n++ % BADGES.length];
      setDoors((list) => list.map((d) => (d.id === "lab" ? { ...d, who, sub: `${who} · ${hhmm(new Date())}` } : d)));
      setGranted("lab");
    }, 6500);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!granted) return;
    const t = window.setTimeout(() => setGranted(null), 1500);
    return () => window.clearTimeout(t);
  }, [granted]);

  useEffect(() => {
    if (!confirm) return;
    const t = window.setTimeout(() => setConfirm(null), 3000);
    return () => window.clearTimeout(t);
  }, [confirm]);

  const reset = (id: string) => {
    if (confirm !== id) {
      setConfirm(id);
      return;
    }
    setConfirm(null);
    setDoors((list) =>
      list.map((d) => (d.id === id ? { ...d, state: "locked", sub: `Reset by Dana K. · ${hhmm(new Date())}`, who: "Dana Kim" } : d)),
    );
  };

  const alerts = doors.filter((d) => d.state === "forced" || d.state === "held").length;
  const forced = doors.some((d) => d.state === "forced");
  const delay = 0.3 + (index ?? 0) * 0.06;

  return (
    <Widget size="medium" index={index} label="Door status">
      <WidgetHeader
        icon={<Door20Filled />}
        tint="var(--ios-indigo)"
        title="Doors"
        subtitle="HQ · 128 readers · 124 secure"
        extra={
          <motion.span
            layout
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors duration-500",
              forced ? "bg-ios-red/15 text-ios-red" : alerts ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-secondary text-secondary",
            )}
          >
            <AnimatedNumber value={alerts} /> {alerts === 1 ? "alert" : "alerts"}
          </motion.span>
        }
      />

      <ul className="mt-2">
        {doors.map((d, i) => {
          const s = STYLE[d.state];
          const late = d.state === "held" && (d.since ?? 0) >= HELD_CRITICAL;
          const flash = granted === d.id;
          return (
            <motion.li
              key={d.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + i * 0.06, type: "spring", stiffness: 320, damping: 28 }}
              className="relative flex h-[31px] items-center gap-2 border-b-[0.5px] border-split last:border-b-0"
            >
              <motion.span
                className={cn("grid size-5 shrink-0 place-items-center rounded-full text-[12px] transition-colors duration-500", s.chip, late && "bg-ios-red/15 text-ios-red")}
                animate={d.state === "forced" ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                transition={d.state === "forced" ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
              >
                {s.icon}
              </motion.span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] leading-[14px] font-medium text-heading">{d.name}</div>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={d.sub}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="truncate text-[10px] leading-[12px] text-tertiary"
                  >
                    {d.sub}
                  </motion.div>
                </AnimatePresence>
              </div>

              {d.state === "forced" ? (
                <motion.button
                  type="button"
                  onClick={() => reset(d.id)}
                  whileTap={{ scale: 0.92 }}
                  layout
                  className={cn(
                    "h-[22px] shrink-0 cursor-pointer rounded-full px-2.5 text-[11px] font-semibold transition-colors",
                    confirm === d.id ? "bg-ios-red text-white" : "bg-fill-secondary text-heading",
                  )}
                >
                  {confirm === d.id ? "Confirm reset" : "Reset"}
                </motion.button>
              ) : d.who ? (
                <Tooltip title={d.state === "held" ? "Last badge before the door was propped" : "Last cardholder"}>
                  <span className="shrink-0">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={d.who}
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.4, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 26 }}
                        className="block"
                      >
                        <MemojiAvatar who={d.who} size={20} alt={d.who} />
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </Tooltip>
              ) : null}

              <span
                className={cn(
                  "flex h-[20px] w-[66px] shrink-0 items-center justify-center gap-1 rounded-full text-[11px] font-semibold transition-colors duration-500 tabular",
                  flash ? "bg-ios-green/15 text-ios-green" : s.pill,
                  late && "bg-ios-red/15 text-ios-red",
                )}
              >
                {flash ? (
                  <>
                    <Checkmark12Filled /> Granted
                  </>
                ) : d.state === "held" ? (
                  `${s.label} ${mmss(d.since ?? 0)}`
                ) : (
                  s.label
                )}
              </span>
              {d.state === "forced" ? (
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
