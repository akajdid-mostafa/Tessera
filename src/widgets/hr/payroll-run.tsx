import { ArrowUndo16Regular, Checkmark16Filled, LockClosed16Filled, Money20Filled, Warning12Filled } from "@fluentui/react-icons";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import { type PointerEvent, useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

/* Semi-monthly run for Nov 1–15, paid Wed Nov 11; approval closes today at 5:00 PM (now 2:40 PM). */
const GROSS = 1_418_240;
const HEADS = 248;
const CUTOFF_IN = 2 * 3600 + 19 * 60 + 15;
const HOLD_S = 1.2;
const EXCEPTIONS = [
  "Overtime over 20 h · Lin Wei, Warehouse",
  "Bank details missing · new hire Ama Boateng",
];
const TWO = { minimumIntegerDigits: 2 } as const;

/** HR · small. The payroll run ahead of today's cut-off with a live countdown; press and hold to approve, then it locks. */
export function PayrollRunWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [gross, setGross] = useState(0);
  const [left, setLeft] = useState(CUTOFF_IN);
  const [approved, setApproved] = useState(false);
  const [holding, setHolding] = useState(false);
  const hold = useMotionValue(0);
  const width = useTransform(hold, (v) => `${v * 100}%`);
  const run = useRef<ReturnType<typeof animate> | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setGross(GROSS), delay * 1000 + 150);
    const c = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(c);
      run.current?.stop();
    };
  }, [delay]);

  const start = (e?: PointerEvent<HTMLButtonElement>) => {
    if (approved) return;
    if (e) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
    }
    setHolding(true);
    run.current?.stop();
    run.current = animate(hold, 1, {
      duration: HOLD_S * (1 - hold.get()),
      ease: "linear",
      onComplete: () => {
        setHolding(false);
        setApproved(true);
        hold.set(0);
      },
    });
  };
  const cancel = () => {
    if (approved) return;
    setHolding(false);
    run.current?.stop();
    run.current = animate(hold, 0, { duration: 0.25, ease: "easeOut" });
  };

  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;

  return (
    <Widget
      size="small"
      index={index}
      label="Payroll run"
      glow={{ mode: "pulse", colors: ["#30D158", "#63E6E2", "#30D158"], blur: 18, duration: 1.4 }}
      glowActive={holding}
    >
      <WidgetHeader icon={<Money20Filled />} tint="var(--ios-green)" title="Payroll" subtitle="Pays Wed, Nov 11" />

      <AnimatedNumber
        value={gross}
        format={{ style: "currency", currency: "USD", notation: "compact", minimumFractionDigits: 2, maximumFractionDigits: 2 }}
        className="mt-2 text-[26px] leading-none font-semibold tracking-tight text-heading"
      />
      <div className="mt-1 h-[14px] text-[11px] leading-[14px] whitespace-nowrap text-tertiary">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={approved ? "ok" : "due"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            {approved ? (
              <span className="flex items-center gap-1">
                <LockClosed16Filled className="size-3 text-ios-green" />
                Locked · {HEADS} people
              </span>
            ) : (
              <span className="tabular">
                Cut-off in{" "}
                <span className="font-semibold text-ios-orange">
                  <AnimatedNumber value={h} />:<AnimatedNumber value={m} format={TWO} />:
                  <AnimatedNumber value={s} format={TWO} trend={-1} />
                </span>
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <Tooltip
        title={
          <div className="text-[12px] leading-snug">
            {EXCEPTIONS.map((x) => (
              <div key={x}>• {x}</div>
            ))}
          </div>
        }
      >
        <motion.span
          className="mt-2 inline-flex w-fit cursor-default items-center gap-1 rounded-full bg-ios-orange/15 px-2 py-0.5 text-[11px] font-semibold text-ios-orange"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 380, damping: 22, delay: delay + 0.2 }}
        >
          <Warning12Filled /> {EXCEPTIONS.length} exceptions
        </motion.span>
      </Tooltip>

      <div className="relative mt-auto h-8">
        <AnimatePresence mode="popLayout" initial={false}>
          {approved ? (
            <motion.div
              key="done"
              className="absolute inset-0 flex gap-1.5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
            >
              <span className="flex flex-1 items-center justify-center gap-1 rounded-full bg-ios-green/15 text-[13px] font-semibold text-ios-green">
                <Checkmark16Filled /> Approved
              </span>
              <Button
                shape="circle"
                variant="filled"
                color="default"
                icon={<ArrowUndo16Regular />}
                aria-label="Reopen run"
                onClick={() => setApproved(false)}
              />
            </motion.div>
          ) : (
            <motion.button
              key="hold"
              type="button"
              className="absolute inset-0 grid cursor-pointer touch-none select-none place-items-center overflow-hidden rounded-full bg-ios-green/15 outline-none"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: holding ? 0.97 : 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
              onPointerDown={start}
              onPointerUp={cancel}
              onPointerCancel={cancel}
              onPointerLeave={cancel}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
                  e.preventDefault();
                  start();
                }
              }}
              onKeyUp={cancel}
              aria-label="Hold to approve payroll"
            >
              <span className="relative text-[13px] font-semibold text-ios-green">
                {holding ? "Keep holding…" : "Hold to approve"}
              </span>
              {/* The fill carries its own white copy of the label on a deepened green. */}
              <motion.span className="absolute inset-y-0 left-0 overflow-hidden bg-ios-green-deep" style={{ width }} aria-hidden>
                <span className="absolute inset-y-0 left-0 grid w-[164px] place-items-center text-[13px] font-semibold whitespace-nowrap text-white">
                  {holding ? "Keep holding…" : "Hold to approve"}
                </span>
              </motion.span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
