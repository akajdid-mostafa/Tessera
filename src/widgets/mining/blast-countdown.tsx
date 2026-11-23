import { Checkmark12Filled, Flash20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { HoldButton, enterDelay, useInterval } from "./_parts";

const START_S = 500; // T−08:20 to the 13:00 shot
const STEP_S = 5; // sim seconds per real second
const G4_CLEAR_AT = 360;
const HOLD_AT = 60; // the shot holds here until the shotfirer confirms all clear
const GUARDS = ["G1", "G2", "G3", "G4", "G5", "G6"];

/** Mining · small. A blast countdown with six guard posts: one post is not yet clear and keeps the confirm locked, then a press-and-hold confirms all clear or the clock holds at T−1 min. */
export function BlastCountdownWidget({ index }: { index?: number }) {
  const [s, setS] = useState(START_S);
  const [confirmed, setConfirmed] = useState(false);
  const [after, setAfter] = useState(0); // ticks since firing
  const delay = enterDelay(index);

  const g4Clear = s <= G4_CLEAR_AT;
  const holding = !confirmed && s <= HOLD_AT;
  const fired = s <= 0;

  useInterval(() => {
    if (fired) {
      if (after >= 7) {
        setS(START_S);
        setConfirmed(false);
        setAfter(0);
      } else setAfter(after + 1);
      return;
    }
    if (holding) return;
    setS(Math.max(0, s - STEP_S));
  }, 1000);

  const clear = GUARDS.filter((g) => g !== "G4" || g4Clear).length;

  return (
    <Widget size="small" index={index} label="Blast countdown" glow={holding ? { colors: ["var(--ios-orange)", "var(--ios-yellow)"], mode: "pulse" } : undefined} glowActive={holding}>
      <WidgetHeader
        icon={<Flash20Filled />}
        tint={holding || !g4Clear ? "var(--ios-orange)" : "var(--ios-yellow)"}
        title="Blast · Pit 3"
        subtitle="Bench 1180 · pattern B-42"
      />

      <div className="mt-2 flex items-end justify-between whitespace-nowrap">
        <AnimatePresence mode="popLayout" initial={false}>
          {fired ? (
            <motion.div
              key="fired"
              className="text-[28px] leading-none font-semibold tracking-tight text-heading"
              initial={{ opacity: 0, scale: 1.3, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
            >
              Fired
            </motion.div>
          ) : (
            <motion.div
              key="count"
              className={cn("flex items-baseline text-[28px] leading-none font-semibold tracking-tight", holding ? "text-ios-orange" : "text-heading")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="text-[17px] font-medium text-tertiary">T−</span>
              <AnimatedNumber value={Math.floor(s / 60)} trend={-1} format={{ minimumIntegerDigits: 2 }} />
              <span className="px-px">:</span>
              <AnimatedNumber value={s % 60} trend={-1} format={{ minimumIntegerDigits: 2 }} />
            </motion.div>
          )}
        </AnimatePresence>
        <span className="pb-0.5 text-[12px] font-semibold text-secondary tabular">13:00</span>
      </div>
      <div className={cn("mt-1 truncate text-[11px]", holding ? "font-medium text-ios-orange" : "text-tertiary")}>
        {fired ? "Re-entry after fume check · 15 min" : holding ? "HOLD · all clear not confirmed" : "412 holes · 86 t ANFO"}
      </div>

      <div className="mt-2 flex items-center gap-1">
        {GUARDS.map((g, i) => {
          const ok = g !== "G4" || g4Clear;
          return (
            <motion.span
              key={g}
              title={ok ? `${g} clear` : `${g} not clear · haul road 3 gate`}
              className={cn(
                "grid h-[18px] flex-1 place-items-center rounded-[5px] text-[9px] font-semibold",
                ok ? "bg-fill-tertiary text-secondary" : "bg-ios-orange/15 text-ios-orange",
              )}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0, scale: ok ? 1 : [1, 1.08, 1] }}
              transition={{
                opacity: { delay: delay + i * 0.05 },
                y: { delay: delay + i * 0.05, type: "spring", stiffness: 400, damping: 24 },
                scale: ok ? { duration: 0.2 } : { duration: 1, repeat: Infinity },
              }}
            >
              {ok ? (
                <span className="flex items-center gap-px">
                  <Checkmark12Filled className="size-2.5" />
                  {g.slice(1)}
                </span>
              ) : (
                g
              )}
            </motion.span>
          );
        })}
      </div>

      <div className="mt-auto">
        {confirmed || fired ? (
          <div className="flex h-7 items-center justify-center gap-1 rounded-full bg-fill-quaternary text-[12px] font-medium text-secondary">
            <Checkmark12Filled /> {fired ? "Shot fired 13:00" : "All clear · siren armed"}
          </div>
        ) : (
          <HoldButton
            tint={holding ? "var(--ios-orange)" : "var(--ios-yellow)"}
            disabled={!g4Clear}
            label={g4Clear ? `Hold · confirm ${clear}/6 clear` : "Waiting on G4"}
            onConfirm={() => setConfirmed(true)}
          />
        )}
      </div>
    </Widget>
  );
}
