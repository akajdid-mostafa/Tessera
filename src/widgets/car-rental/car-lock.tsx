import { Location16Filled, VehicleCar20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const SHACKLE_LOCKED = "M8 11V7.5a4 4 0 0 1 8 0V11";
const SHACKLE_OPEN = "M8 11V4.5a4 4 0 0 1 8 0V6";
const RING_R = 28;
const RING_C = 2 * Math.PI * RING_R;
const SEND_MS = 750;

/** Car rental · small. A remote lock for the rented car; tap the button and the shackle follows. */
export function CarLockWidget({ index }: { index?: number }) {
  const [locked, setLocked] = useState(true);
  const [pending, setPending] = useState(false);
  const [pulses, setPulses] = useState(0);
  const [range, setRange] = useState(0);
  const [seen, setSeen] = useState(2);
  const timer = useRef<number | undefined>(undefined);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setTimeout(() => setRange(412), delay * 1000 + 200);
    const s = window.setInterval(() => setSeen((m) => m + 1), 60_000);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(s);
      window.clearTimeout(timer.current);
    };
  }, [delay]);

  const press = () => {
    if (pending) return;
    setPending(true);
    timer.current = window.setTimeout(() => {
      setLocked((l) => !l);
      setPending(false);
      setPulses((n) => n + 1);
      setSeen(0);
    }, SEND_MS);
  };

  const tint = locked ? "var(--ios-green)" : "var(--ios-orange)";

  return (
    <Widget size="small" index={index} label="Remote car lock">
      <WidgetHeader icon={<VehicleCar20Filled />} tint="var(--ios-blue)" title="Renault Clio" subtitle="8RNT518" />

      <div className="mt-2 flex items-center gap-2.5">
        <motion.button
          type="button"
          aria-label={locked ? "Unlock car" : "Lock car"}
          aria-pressed={locked}
          onClick={press}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.04 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
          className="relative grid size-[62px] shrink-0 cursor-pointer place-items-center rounded-full outline-none"
        >
          <AnimatePresence>
            {pulses > 0 ? (
              <motion.span
                key={pulses}
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: tint }}
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: 1.55, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            ) : null}
          </AnimatePresence>
          <span
            className={cn(
              "absolute inset-[5px] rounded-full transition-colors duration-mid",
              locked ? "bg-ios-green/15" : "bg-ios-orange/15",
            )}
          />
          <svg viewBox="0 0 64 64" className="absolute inset-0 size-full -rotate-90">
            <circle cx="32" cy="32" r={RING_R} fill="none" strokeWidth="3" className="stroke-fill-secondary" />
            <motion.circle
              cx="32"
              cy="32"
              r={RING_R}
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              initial={{ strokeDashoffset: RING_C }}
              style={{ stroke: tint, transition: "stroke 0.35s" }}
              animate={{ strokeDashoffset: pending ? RING_C * 0.72 : 0 }}
              transition={{ type: "spring", stiffness: 80, damping: 16, delay: pulses === 0 && !pending ? delay : 0 }}
            />
          </svg>
          {pending ? (
            <motion.span
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            >
              <svg viewBox="0 0 64 64" className="size-full">
                <circle
                  cx="32"
                  cy="32"
                  r={RING_R}
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                  stroke={tint}
                  strokeDasharray={`${RING_C * 0.22} ${RING_C}`}
                />
              </svg>
            </motion.span>
          ) : null}
          <svg viewBox="0 0 24 24" className="relative size-[28px]" fill="none" aria-hidden>
            <motion.path d={locked ? SHACKLE_LOCKED : SHACKLE_OPEN}
              initial={false}
              animate={{ d: locked ? SHACKLE_LOCKED : SHACKLE_OPEN }}
              style={{ stroke: tint, transition: "stroke 0.35s" }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <rect x="4.5" y="10.5" width="15" height="10.5" rx="3" style={{ fill: tint, transition: "fill 0.35s" }} />
            <circle cx="12" cy="15.2" r="1.5" fill="var(--widget-surface)" />
            <rect x="11.3" y="15.5" width="1.4" height="2.8" rx="0.7" fill="var(--widget-surface)" />
          </svg>
        </motion.button>

        <div className="min-w-0 whitespace-nowrap leading-tight">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={pending ? "send" : locked ? "locked" : "open"}
              initial={{ opacity: 0, y: 5, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -5, filter: "blur(3px)" }}
              className={cn(
                "text-[11px] font-semibold",
                pending ? "text-tertiary" : locked ? "text-ios-green" : "text-ios-orange",
              )}
            >
              {pending ? "Sending…" : locked ? "Locked" : "Unlocked"}
            </motion.div>
          </AnimatePresence>
          <div className="text-[24px] leading-none font-semibold tracking-tight text-heading">
            <AnimatedNumber value={range} />
            <span className="text-[12px] font-medium text-tertiary"> km</span>
          </div>
          <div className="mt-0.5 text-[11px] text-tertiary">range</div>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-1 text-[11px] text-tertiary">
        <Location16Filled className="shrink-0 text-ios-blue" />
        <span className="truncate">
          Silver Lake, LA · {seen === 0 ? "now" : `${seen}m ago`}
        </span>
      </div>
    </Widget>
  );
}
