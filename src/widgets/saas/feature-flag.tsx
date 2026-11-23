import { Flag20Filled, Power20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

const STAGES = [1, 5, 25, 50, 100];
const USERS = 2_140_000;
const R = 28;
const C = 2 * Math.PI * R;

/** SaaS · small. A feature flag's rollout ring: tap a stage to widen it, or hit the power button to kill the flag and drain the ring. */
export function FeatureFlagWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [stage, setStage] = useState(2);
  const [on, setOn] = useState(true);
  const [err, setErr] = useState(0.41);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setSettled(true), (delay + 0.8) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  // The treatment's error rate breathes around the control's 0.48%.
  useEffect(() => {
    const t = window.setInterval(() => setErr(+(0.36 + Math.random() * 0.12).toFixed(2)), 2600);
    return () => window.clearInterval(t);
  }, []);

  const pct = on ? STAGES[stage] : 0;
  const tint = on ? "var(--ios-purple)" : "var(--ant-color-text-tertiary)";

  return (
    <Widget size="small" index={index} label="Feature flag rollout">
      <WidgetHeader icon={<Flag20Filled />} tint={on ? "var(--ios-purple)" : "var(--ant-color-text-tertiary)"} title="checkout-v2" subtitle="prod · 2.1M users" />

      <div className="mt-2 flex items-center justify-between">
        <div className="relative size-[70px] shrink-0">
          <svg viewBox="0 0 70 70" className="size-full -rotate-90" aria-hidden>
            <circle cx="35" cy="35" r={R} fill="none" strokeWidth="7" style={{ stroke: "var(--ant-color-fill-secondary)" }} />
            <motion.circle
              cx="35"
              cy="35"
              r={R}
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C * (1 - Math.max(pct, on ? 2 : 0) / 100) }}
              style={{ stroke: tint, transition: "stroke 0.4s" }}
              transition={{ type: "spring", stiffness: 90, damping: 18, delay: settled ? 0 : delay }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center leading-none">
            <div>
              <AnimatedNumber value={pct} suffix="%" className={cn("text-[17px] font-semibold", on ? "text-heading" : "text-tertiary")} />
              <div className="mt-0.5 text-[9px] text-tertiary">of users</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <Tooltip title={on ? "Kill switch: serve the old checkout to everyone" : "Restore rollout"}>
            <motion.button
              type="button"
              aria-label={on ? "Kill flag" : "Restore flag"}
              aria-pressed={on}
              onClick={() => setOn((v) => !v)}
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className={cn(
                "grid size-11 cursor-pointer place-items-center rounded-full text-[20px] transition-colors duration-300",
                on ? "bg-ios-purple text-white shadow-[0_4px_14px_-4px_var(--ios-purple)]" : "bg-fill-secondary text-tertiary",
              )}
            >
              <motion.span animate={{ rotate: on ? 0 : -90 }} className="grid place-items-center">
                <Power20Filled />
              </motion.span>
            </motion.button>
          </Tooltip>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={on ? "on" : "off"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className={cn("text-[10px] font-semibold tabular", on ? "text-tertiary" : "text-ios-red")}
            >
              {on ? `err ${err.toFixed(2)}%` : "Killed"}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-auto">
        <div className="mb-1 truncate text-[10px] text-tertiary tabular">
          {on ? (
            <>
              <AnimatedNumber value={Math.round((USERS * pct) / 100 / 1000)} className="font-medium text-secondary" />k users on new flow
            </>
          ) : (
            "Everyone on old checkout"
          )}
        </div>
        <div className="flex gap-1">
          {STAGES.map((s, i) => {
            const active = on && i === stage;
            const reached = on && i <= stage;
            return (
              <motion.button
                key={s}
                type="button"
                disabled={!on}
                onClick={() => setStage(i)}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delay + 0.2 + i * 0.05, type: "spring", stiffness: 420, damping: 26 }}
                className={cn(
                  "h-[20px] flex-1 cursor-pointer rounded-md text-[10px] font-semibold tabular transition-colors duration-200 disabled:cursor-not-allowed",
                  active
                    ? "bg-ios-purple text-white"
                    : reached
                      ? "bg-ios-purple/15 text-ios-purple"
                      : "bg-fill-tertiary text-tertiary",
                )}
              >
                {s}
              </motion.button>
            );
          })}
        </div>
      </div>
    </Widget>
  );
}
