import { LockClosed16Filled, LockOpen16Filled, ShieldLock20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { HoldButton } from "./_parts";

type Mode = "Stay" | "Away";
type State = "disarmed" | "exit" | "armed";

const ZONES = 24;
const BYPASSED = 17;
const EXIT_DELAY: Record<Mode, number> = { Stay: 15, Away: 30 };
const OPERATOR = "Dana Kim";

const TINT: Record<State, string> = {
  disarmed: "var(--ios-green)",
  exit: "var(--ios-orange)",
  armed: "var(--ios-red)",
};

const hhmm = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/** Security · medium. An intrusion area keypad: hold to arm starts an exit-delay countdown that lights the 24-zone ring, then the area arms; hold again to disarm. */
export function IntrusionPanelWidget({ index }: { index?: number }) {
  const [mode, setMode] = useState<Mode>("Away");
  const [state, setState] = useState<State>("disarmed");
  const [left, setLeft] = useState(0);
  const [last, setLast] = useState({ verb: "Disarmed", at: "08:02" });

  useEffect(() => {
    if (state !== "exit") return;
    const t = window.setInterval(() => setLeft((s) => s - 1), 1000);
    return () => window.clearInterval(t);
  }, [state]);

  useEffect(() => {
    if (state === "exit" && left <= 0) {
      setState("armed");
      setLast({ verb: `Armed ${mode}`, at: hhmm(new Date()) });
    }
  }, [state, left, mode]);

  const arm = () => {
    setLeft(EXIT_DELAY[mode]);
    setState("exit");
  };
  const disarm = () => {
    setState("disarmed");
    setLast({ verb: "Disarmed", at: hhmm(new Date()) });
  };

  const tint = TINT[state];
  const total = EXIT_DELAY[mode];
  const lit = state === "armed" ? ZONES : state === "exit" ? Math.floor(((total - left) / total) * ZONES) : 0;
  const delay = 0.3 + (index ?? 0) * 0.06;

  return (
    <Widget size="medium" index={index} label="Intrusion panel">
      <WidgetHeader
        icon={<ShieldLock20Filled />}
        tint={tint}
        title="Intrusion · Area 1"
        subtitle="HQ Ground Floor · 24 zones"
        extra={
          <Segmented
            size="small"
            value={mode}
            disabled={state !== "disarmed"}
            onChange={(v) => setMode(v as Mode)}
            options={["Stay", "Away"]}
          />
        }
      />

      <div className="my-auto flex items-center gap-3 pt-1">
        <div className="relative size-[60px] shrink-0">
          <motion.svg
            viewBox="0 0 60 60"
            className="size-full"
            animate={state === "armed" ? { opacity: [1, 0.7, 1] } : { opacity: 1 }}
            transition={state === "armed" ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" } : undefined}
          >
            {Array.from({ length: ZONES }, (_, i) => {
              const bypassed = i === BYPASSED;
              const on = i < lit;
              return (
                <motion.line
                  key={i}
                  x1="30"
                  x2="30"
                  y1="3"
                  y2="9.5"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  transform={`rotate(${i * 15} 30 30)`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: bypassed ? 0.35 : 1 }}
                  transition={{ delay: delay + i * 0.02 }}
                  style={{
                    stroke: bypassed
                      ? "var(--ant-color-text-tertiary)"
                      : on
                        ? tint
                        : state === "disarmed"
                          ? "color-mix(in srgb, var(--ios-green) 55%, transparent)"
                          : "var(--ant-color-fill-secondary)",
                    transition: "stroke 0.35s",
                  }}
                  strokeDasharray={bypassed ? "1.5 2" : undefined}
                />
              );
            })}
          </motion.svg>
          <div className="absolute inset-0 grid place-items-center" style={{ color: tint }}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={state}
                initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
                className="grid place-items-center"
              >
                {state === "exit" ? (
                  <AnimatedNumber value={left} className="text-[17px] font-semibold" />
                ) : state === "armed" ? (
                  <LockClosed16Filled className="size-5" />
                ) : (
                  <LockOpen16Filled className="size-5" />
                )}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        <div className="min-w-0 flex-1 leading-none">
          <div className="text-[11px] text-tertiary">Area state</div>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={state === "armed" ? `armed-${mode}` : state}
              initial={{ opacity: 0, y: 8, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(3px)" }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="mt-1 whitespace-nowrap text-[24px] font-semibold tracking-tight"
              style={{ color: state === "disarmed" ? "var(--ant-color-text-heading)" : tint }}
            >
              {state === "disarmed" ? "Disarmed" : state === "exit" ? "Exit delay" : `Armed ${mode}`}
            </motion.div>
          </AnimatePresence>
          <div className="mt-1.5 truncate text-[11px] text-tertiary">
            {state === "exit" ? (
              <span className="tabular">Leave now · arming in {left}s</span>
            ) : (
              <>
                {state === "disarmed" ? "Ready · 23 of 24 zones" : "23 zones armed"} ·{" "}
                <Tooltip title="Zone 18 · Glass break, Café · bypassed for trouble (low battery)">
                  <span className="cursor-help underline decoration-dotted underline-offset-2">1 bypassed</span>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <MemojiAvatar who={OPERATOR} size={22} alt={OPERATOR} />
        <div className="min-w-0 flex-1 truncate text-[11px] leading-tight text-tertiary">
          <span className="font-medium text-secondary">{last.verb}</span> by Dana K. · {last.at}
        </div>
        {state === "exit" ? (
          <motion.button
            type="button"
            onClick={disarm}
            whileTap={{ scale: 0.94 }}
            className="h-8 cursor-pointer rounded-full bg-fill-secondary px-3.5 text-[12px] font-semibold text-heading"
          >
            Cancel
          </motion.button>
        ) : state === "armed" ? (
          <HoldButton label="Hold to disarm" tint="var(--ios-green)" icon={<LockOpen16Filled />} onConfirm={disarm} />
        ) : (
          <HoldButton label={`Hold to arm ${mode}`} tint="var(--ios-red)" icon={<LockClosed16Filled />} onConfirm={arm} />
        )}
      </div>
    </Widget>
  );
}
