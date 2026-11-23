import { ClipboardTaskListLtr20Filled, Pause16Filled, Play16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { clock, enterDelay, useInterval } from "./_parts";

type State = "execute" | "confirm" | "held";
const QTY = 480;
const CYCLE_S = 38.2;
const CONFIRM_S = 4;
/** Shift clock at mount, in minutes after midnight (14:09). */
const NOW_MIN = 14 * 60 + 9;

const hhmm = (min: number) =>
  `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(Math.round(min % 60)).padStart(2, "0")}`;

/** Factory · medium. A work order's run director: parts count up live against the plan marker; Hold needs a second tap within 4 s, and a held order shows its own timer. */
export function WorkOrderWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [state, setState] = useState<State>("execute");
  const [done, setDone] = useState(412);
  const [plan, setPlan] = useState(418);
  const [countdown, setCountdown] = useState(CONFIRM_S);
  const [held, setHeld] = useState(0);
  const delay = enterDelay(index);

  const running = state !== "held";
  useInterval(() => setDone((n) => Math.min(QTY, n + 1)), running && done < QTY ? 2100 : null);
  useInterval(() => setPlan((n) => Math.min(QTY, n + 1)), plan < QTY ? 2400 : null);
  useInterval(() => setHeld((s) => s + 1), state === "held" ? 1000 : null);
  // The confirm window lapses on its own: no second tap, no hold.
  useInterval(
    () => {
      if (countdown <= 1) {
        setState("execute");
        setCountdown(CONFIRM_S);
      } else setCountdown(countdown - 1);
    },
    state === "confirm" ? 1000 : null,
  );

  const delta = done - plan;
  const eta = NOW_MIN + ((QTY - done) * CYCLE_S) / 60;

  const askHold = () => {
    setCountdown(CONFIRM_S);
    setState("confirm");
  };
  const hold = () => {
    setHeld(0);
    setState("held");
  };

  return (
    <Widget size="medium" index={index} label="Work order run director">
      <WidgetHeader
        icon={<ClipboardTaskListLtr20Filled />}
        tint={state === "held" ? "var(--ios-orange)" : "var(--ios-indigo)"}
        title="WO-24817 · Bracket A-220"
        subtitle="Line 3 · Op 30 Mill · Haas VF-4"
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={state === "held" ? "held" : "exec"}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap",
                state === "held" ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-tertiary text-secondary",
              )}
            >
              {state === "held" ? (
                <Pause16Filled className="size-3" />
              ) : (
                <span className="relative flex size-1.5">
                  {!reduce ? (
                    <motion.span
                      className="absolute inset-0 rounded-full bg-secondary"
                      animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                    />
                  ) : null}
                  <span className="relative size-1.5 rounded-full bg-secondary" />
                </span>
              )}
              {state === "held" ? "HELD" : "EXECUTE"}
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="mt-2.5 flex items-baseline-last gap-2 whitespace-nowrap">
        <div className="leading-none">
          <AnimatedNumber value={done} className="text-[30px] font-semibold tracking-tight text-heading" />
          <span className="text-[12px] font-medium text-tertiary"> / {QTY} pcs</span>
        </div>
        <div className="ml-auto text-right text-[11px] leading-tight tabular">
          <div className={cn("font-semibold", delta < -5 ? "text-ios-orange" : "text-secondary")}>
            {delta >= 0 ? "+" : "−"}
            {Math.abs(delta)} vs plan
          </div>
          <div className="text-tertiary">{state === "held" ? `Held ${clock(held)}` : `ETA ${hhmm(eta)}`}</div>
        </div>
      </div>

      <div className="relative mt-2 h-2 rounded-full bg-fill-secondary">
        <motion.div
          className={cn("absolute inset-y-0 left-0 rounded-full", state === "held" ? "bg-ios-orange/70" : "bg-[var(--ant-color-text-secondary)]")}
          initial={{ width: 0 }}
          animate={{ width: `${(done / QTY) * 100}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 20, delay: done === 412 ? delay : 0 }}
        />
        <motion.span
          className="absolute -top-1 h-4 w-[2px] -translate-x-1/2 rounded-full bg-heading"
          initial={{ left: "0%", opacity: 0 }}
          animate={{ left: `${(plan / QTY) * 100}%`, opacity: 1 }}
          transition={{ type: "spring", stiffness: 90, damping: 20, delay: plan === 418 ? delay + 0.2 : 0 }}
          title="Plan"
        />
      </div>

      <div className="mt-auto flex items-center gap-2">
        <MemojiAvatar who="f4" size={26} alt="Amy D." />
        <div className="min-w-0 flex-1 leading-tight whitespace-nowrap">
          <div className="truncate text-[12px] font-medium text-heading">Amy D.</div>
          <div className="text-[11px] text-tertiary tabular">Cycle {CYCLE_S} s · ideal 36.0</div>
        </div>

        <AnimatePresence mode="popLayout" initial={false}>
          {state === "execute" ? (
            <motion.div key="hold" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
              <Button size="small" color="default" variant="filled" icon={<Pause16Filled />} onClick={askHold}>
                Hold
              </Button>
            </motion.div>
          ) : state === "confirm" ? (
            <motion.div
              key="confirm"
              className="flex items-center gap-1"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
            >
              <Button size="small" type="text" onClick={() => setState("execute")}>
                Cancel
              </Button>
              <Button size="small" color="orange" variant="solid" onClick={hold}>
                Confirm hold · {countdown}
              </Button>
            </motion.div>
          ) : (
            <motion.div key="resume" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
              <Button size="small" color="default" variant="solid" icon={<Play16Filled />} onClick={() => setState("execute")}>
                Resume
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
