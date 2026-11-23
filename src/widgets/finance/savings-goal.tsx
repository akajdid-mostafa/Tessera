import { Add16Filled, Checkmark16Filled, Savings20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

const GOAL = 4_500;
const START = 3_675;
const DEPOSIT = 125;
const USD = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const;
const usd = (n: number) => n.toLocaleString("en-US", USD);

/* The jar, in a 46×58 box: a lid, a short neck and a rounded body. */
const BODY = { x: 4, y: 14, w: 38, h: 42 };
const JAR = "M12 10 h22 v3 q8 1 8 9 v26 q0 8 -8 8 h-22 q-8 0 -8 -8 v-26 q0 -8 8 -9 z";

/** Finance · small. A jar fills toward the goal; Add drops a coin in and the total rolls up. */
export function SavingsGoalWidget({ index }: { index?: number }) {
  const [saved, setSaved] = useState(START);
  const [drops, setDrops] = useState<number[]>([]);
  const delay = 0.3 + (index ?? 0) * 0.06;
  // useId's colons or guillemets are not safe inside url(#…).
  const clip = `jar-${useId().replace(/[^\w-]/g, "")}`;

  const pct = Math.min(1, saved / GOAL);
  const reached = saved >= GOAL;
  const level = BODY.y + BODY.h * (1 - pct);

  const add = () => {
    if (reached || drops.length) return;
    setDrops([Date.now()]);
  };

  // The coin lands about half a second in; the total moves when it does.
  useEffect(() => {
    if (!drops.length) return;
    const land = window.setTimeout(() => setSaved((s) => s + DEPOSIT), 480);
    const clear = window.setTimeout(() => setDrops([]), 1100);
    return () => {
      window.clearTimeout(land);
      window.clearTimeout(clear);
    };
  }, [drops]);

  return (
    <Widget
      size="small"
      index={index}
      label="Savings goal"
      glow={{ mode: "pulse", colors: ["#63E6E2", "#30D158", "#FFD60A"], blur: 18, duration: 1.8 }}
      glowActive={reached}
    >
      <WidgetHeader
        icon={<Savings20Filled />}
        tint="var(--ios-mint)"
        title="Summer Trip"
        subtitle={`Goal ${usd(GOAL)} · Jun 15`}
      />

      <AnimatedNumber
        value={saved}
        format={USD}
        className="mt-2 text-[24px] leading-none font-semibold tracking-tight text-heading"
      />

      <div className="mt-auto flex items-end gap-2">
        <div className="min-w-0 flex-1 whitespace-nowrap">
          <div className="text-[11px] leading-tight text-tertiary">
            <AnimatedNumber
              value={pct}
              format={{ style: "percent", maximumFractionDigits: 0 }}
              className="font-semibold text-ios-mint"
            />{" "}
            saved
          </div>
          <div className="mb-1.5 truncate text-[11px] leading-tight text-tertiary">
            {reached ? "Ready for Maui" : `${usd(GOAL - saved)} to go`}
          </div>
          <motion.div
            key={reached ? "done" : "add"}
            initial={reached ? { scale: 0.85 } : false}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 520, damping: 14 }}
          >
            <Button
              size="small"
              shape="round"
              type="primary"
              onClick={add}
              icon={reached ? <Checkmark16Filled /> : <Add16Filled />}
              aria-label={reached ? "Goal reached" : `Add ${usd(DEPOSIT)}`}
              className={cn(
                "font-semibold",
                reached
                  ? "pointer-events-none border-0 bg-ios-green/15 text-ios-green shadow-none"
                  : "bg-ios-mint/15 text-ios-mint hover:bg-ios-mint/25",
              )}
            >
              {reached ? "Done" : "Add"}
            </Button>
          </motion.div>
        </div>

        <div className="relative h-[58px] w-[46px] shrink-0">
          <AnimatePresence>
            {drops.map((id) => (
              <motion.span
                key={id}
                aria-hidden
                className="absolute left-1/2 top-0 z-10 -ml-[7px] grid size-[14px] place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff3b0,#ffd60a_45%,#c99700)] text-[8px] font-bold text-black/60 shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                initial={{ y: -46, opacity: 0, rotate: 0 }}
                animate={{ y: [-46, level - 10, level - 14, level - 8], opacity: [0, 1, 1, 0], rotate: 220 }}
                transition={{ duration: 0.9, times: [0, 0.55, 0.75, 1], ease: "easeIn" }}
              >
                $
              </motion.span>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {drops.slice(-1).map((id) => (
              <motion.span
                key={`chip-${id}`}
                className="absolute -top-5 right-0 z-10 rounded-full bg-ios-mint-deep px-1.5 py-px text-[9px] font-semibold text-white tabular"
                initial={{ opacity: 0, y: 6, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: "spring", stiffness: 420, damping: 22, delay: 0.45 }}
              >
                +{DEPOSIT.toLocaleString("en-US")}
              </motion.span>
            ))}
          </AnimatePresence>

          <svg viewBox="0 0 46 58" className="size-full overflow-visible" aria-hidden>
            <defs>
              <clipPath id={clip}>
                <path d={JAR} />
              </clipPath>
            </defs>
            <rect x="11" y="4" width="24" height="6" rx="2" className="fill-fill" />
            <path d={JAR} className="fill-fill-quaternary" />
            <g clipPath={`url(#${clip})`}>
              <motion.g
                initial={{ y: BODY.y + BODY.h }}
                animate={{ y: level }}
                transition={{ type: "spring", stiffness: 70, damping: 15, delay }}
              >
                {/* A flat fill: the money settles level, no wave. */}
                <rect x="0" y="0" width="46" height="60" fill="var(--ios-mint)" fillOpacity={0.85} />
                {/* A few coins resting in the fill. */}
                {[
                  [14, 12],
                  [24, 16],
                  [32, 10],
                  [19, 22],
                  [29, 26],
                ].map(([cx, cy]) => (
                  <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx="4" ry="2" fill="#ffd60a" fillOpacity={0.75} />
                ))}
              </motion.g>
            </g>
            <path d={JAR} fill="none" strokeWidth="1.5" className="stroke-fill" />
            <path d="M9 22 v18" strokeWidth="2" strokeLinecap="round" stroke="white" strokeOpacity={0.35} />
          </svg>
        </div>
      </div>
    </Widget>
  );
}
