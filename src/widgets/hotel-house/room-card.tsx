import {
  Accessibility16Regular,
  Checkmark16Filled,
  ChevronRight12Regular,
  Clock12Regular,
  Dismiss16Regular,
  DoorTag20Filled,
  LeafOne16Regular,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { Widget } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { HK, HK_ORDER, type HkStatus, tint } from "./_parts-a";

const ROOM = { no: "105", type: "Single", floor: "Floor 1" };
const FEATURES = [
  { label: "Garden", Icon: LeafOne16Regular },
  { label: "Accessible", Icon: Accessibility16Regular },
];
const GUEST = { name: "Claire Dubois", night: 3, nights: 5, out: "out Sat 12:00" };
const LONG_PRESS = 450;

const ago = (min: number) => (min < 1 ? "updated just now" : `updated ${min} min ago`);

/** Housekeeping · small. One room's card with its housekeeping tag and tonight's guest; tap the tag or long-press to set housekeeping, the tag wipes to the new color. */
export function RoomCardWidget({ index }: { index?: number }) {
  const [status, setStatus] = useState<HkStatus>("pickup");
  const [prev, setPrev] = useState<HkStatus>("pickup");
  const [changed, setChanged] = useState(false);
  const [minutes, setMinutes] = useState(12);
  const [open, setOpen] = useState(false);
  const press = useRef<number | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const st = HK[status];

  // Live: the "updated" age counts up with the clock.
  useEffect(() => {
    const t = window.setInterval(() => setMinutes((m) => m + 1), 60_000);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => () => {
    if (press.current) window.clearTimeout(press.current);
  }, []);

  const startPress = () => {
    if (open) return;
    press.current = window.setTimeout(() => setOpen(true), LONG_PRESS);
  };
  const endPress = () => {
    if (press.current) window.clearTimeout(press.current);
    press.current = null;
  };

  const choose = (next: HkStatus) => {
    setOpen(false);
    if (next === status) return;
    setPrev(status);
    setStatus(next);
    setChanged(true);
    setMinutes(0);
  };

  return (
    <Widget size="small" index={index} label={`Room ${ROOM.no}`}>
      <div
        className="flex h-full min-h-0 flex-col select-none"
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerLeave={endPress}
        onPointerCancel={endPress}
      >
        <div className="flex items-start gap-2">
          <span className="text-[30px] leading-none font-semibold tracking-tight text-heading tabular">{ROOM.no}</span>
          <div className="min-w-0 flex-1 pt-0.5 leading-tight">
            <div className="truncate text-[12px] font-medium text-secondary">{ROOM.type}</div>
            <div className="truncate text-[10px] text-tertiary">{ROOM.floor}</div>
          </div>
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ios-teal text-white">
            <DoorTag20Filled className="size-3.5" />
          </span>
        </div>

        <div className="mt-2 flex gap-1">
          {FEATURES.map(({ label, Icon }, i) => (
            <motion.span
              key={label}
              className="flex h-[18px] items-center gap-0.5 rounded-full bg-fill-tertiary px-1.5 text-[10px] font-medium whitespace-nowrap text-secondary"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.1 + i * 0.06, type: "spring", stiffness: 380, damping: 26 }}
            >
              <Icon className="size-3" />
              {label}
            </motion.span>
          ))}
        </div>

        <motion.button
          type="button"
          onClick={() => setOpen(true)}
          whileTap={{ scale: 0.96 }}
          aria-label={`Housekeeping ${st.label}. Set housekeeping`}
          className={cn(
            "relative mt-2.5 flex h-[26px] w-full cursor-pointer items-center gap-1 overflow-hidden rounded-[9px] pr-1.5 pl-2 text-left",
            !changed && "bg-fill-quaternary",
          )}
          style={changed ? { backgroundColor: tint(HK[prev].color, 20) } : undefined}
        >
          <motion.span
            key={status + String(changed)}
            aria-hidden
            className="absolute inset-0 origin-left"
            style={{ backgroundColor: "var(--widget-surface)" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: changed ? 0 : delay + 0.2 }}
          >
            <span className="absolute inset-0" style={{ backgroundColor: tint(st.color, 20) }} />
          </motion.span>
          <motion.span
            key={`g-${status}`}
            className={cn("relative", st.text)}
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 520, damping: 18, delay: changed ? 0.15 : delay + 0.3 }}
          >
            <st.Glyph className="block size-3.5" />
          </motion.span>
          <span className={cn("relative text-[12px] font-semibold", st.text)}>{st.label}</span>
          <span className="relative ml-auto flex items-center text-[10px] text-tertiary">
            Set
            <ChevronRight12Regular className="size-3" />
          </span>
        </motion.button>
        <div className="mt-1 flex items-center gap-1 text-[10px] text-tertiary">
          <Clock12Regular className="size-3" />
          <span className="tabular">{ago(minutes)}</span>
        </div>

        <div className="mt-auto flex items-center gap-2">
          <MemojiAvatar who="f7" size={28} className="ring-[1.5px] ring-[var(--widget-surface)]" />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[12px] font-semibold text-heading">{GUEST.name}</div>
            <div className="flex items-center gap-1.5 text-[10px] text-tertiary">
              <span className="whitespace-nowrap tabular">
                Night {GUEST.night} of {GUEST.nights}
              </span>
              <span className="flex gap-[3px]">
                {Array.from({ length: GUEST.nights }, (_, i) => (
                  <motion.span
                    key={i}
                    className={cn("size-[5px] rounded-full", i < GUEST.night ? "bg-ios-indigo" : "bg-fill")}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20, delay: delay + 0.35 + i * 0.07 }}
                  />
                ))}
              </span>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="sheet"
            className="absolute inset-0 z-10 flex flex-col bg-widget-surface p-3"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24, transition: { duration: 0.16 } }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
          >
            <div className="flex h-5 items-center gap-1">
              <span className="text-[12px] font-semibold text-heading">Set housekeeping</span>
              <ChevronRight12Regular className="size-3 text-tertiary" />
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="ml-auto grid size-5 cursor-pointer place-items-center rounded-full bg-fill-tertiary text-secondary"
              >
                <Dismiss16Regular className="size-3" />
              </button>
            </div>
            <div className="text-[10px] text-tertiary">
              Room {ROOM.no} · {ROOM.type}
            </div>
            <div className="mt-1.5 flex flex-col gap-1">
              {HK_ORDER.map((s, i) => {
                const o = HK[s];
                const on = s === status;
                return (
                  <motion.button
                    key={s}
                    type="button"
                    onClick={() => choose(s)}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ delay: 0.04 + i * 0.04, type: "spring", stiffness: 420, damping: 28 }}
                    className={cn(
                      "flex h-[28px] cursor-pointer items-center gap-1.5 rounded-lg px-2 text-left transition-colors",
                      on ? "" : "hover:bg-fill-tertiary",
                    )}
                    style={on ? { backgroundColor: tint(o.color, 20) } : undefined}
                  >
                    <o.Glyph className={cn("size-3.5", o.text)} />
                    <span className={cn("text-[12px] font-medium", on ? o.text : "text-heading")}>{o.label}</span>
                    {on ? <Checkmark16Filled className={cn("ml-auto size-3.5", o.text)} /> : null}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Widget>
  );
}
