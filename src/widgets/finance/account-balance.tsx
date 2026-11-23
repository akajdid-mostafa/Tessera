import { ArrowUp16Filled, Eye16Regular, EyeOff16Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget } from "@/motion/widget";

const BALANCE = 8_432.17;
const USD = { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

/** Finance · small. A mini card slides in and the balance rolls up; tap to blur it behind privacy dots. */
export function AccountBalanceWidget({ index }: { index?: number }) {
  const [hidden, setHidden] = useState(false);
  const [shown, setShown] = useState(0);
  const delay = 0.3 + (index ?? 0) * 0.06;

  // Roll the digits up from zero once the widget has landed.
  useEffect(() => {
    const t = window.setTimeout(() => setShown(BALANCE), (delay + 0.25) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  return (
    <Widget
      size="small"
      index={index}
      label="Account balance"
      pressable
      onPress={() => setHidden((h) => !h)}
    >
      <div className="flex items-start justify-between">
        <MiniCard hidden={hidden} delay={delay} />
        <motion.span
          className="grid size-7 place-items-center rounded-full bg-fill-tertiary text-[16px] text-secondary"
          whileHover={{ scale: 1.1 }}
          aria-label={hidden ? "Show balance" : "Hide balance"}
          role="img"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={hidden ? "off" : "on"}
              initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="grid place-items-center"
            >
              {hidden ? <EyeOff16Regular /> : <Eye16Regular />}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      </div>

      <div className="mt-auto text-[11px] text-tertiary">Everyday Checking</div>
      <div className="relative h-[26px]">
        <motion.div
          animate={{ filter: hidden ? "blur(8px)" : "blur(0px)", opacity: hidden ? 0 : 1 }}
          transition={{ duration: 0.35 }}
          className="absolute inset-0 whitespace-nowrap"
          aria-hidden={hidden}
        >
          <AnimatedNumber
            value={shown}
            format={USD}
            className="text-[24px] leading-none font-semibold tracking-tight text-heading"
          />
        </motion.div>
        <AnimatePresence>
          {hidden ? (
            <motion.div
              className="absolute inset-0 flex items-center gap-[5px]"
              initial="off"
              animate="on"
              exit="off"
              variants={{ on: { transition: { staggerChildren: 0.035 } }, off: {} }}
            >
              <span className="mr-0.5 text-[22px] leading-none font-semibold text-heading">$</span>
              {Array.from({ length: 6 }, (_, i) => (
                <motion.span
                  key={i}
                  className="size-[9px] rounded-full bg-heading"
                  variants={{
                    off: { scale: 0, opacity: 0 },
                    on: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 600, damping: 20 } },
                  }}
                />
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <div className="mt-1 flex items-center gap-1 whitespace-nowrap text-[11px] text-tertiary">
        <span className="inline-flex items-center gap-0.5 font-semibold text-ios-green">
          <ArrowUp16Filled className="text-[11px]" />
          {hidden ? "••••" : "$1,240"}
        </span>
        this month
      </div>
    </Widget>
  );
}

/** A tilted debit card with a chip, a contactless mark and the last four digits. */
function MiniCard({ hidden, delay }: { hidden: boolean; delay: number }) {
  return (
    <motion.div
      className="relative h-[44px] w-[70px] overflow-hidden rounded-[7px] bg-[linear-gradient(135deg,#5e5ce6_0%,#0a84ff_55%,#40c8e0_100%)] shadow-[0_6px_14px_-6px_rgba(10,132,255,0.6)]"
      initial={{ x: -30, rotate: -14, opacity: 0 }}
      animate={{ x: 0, rotate: -4, opacity: 1 }}
      whileHover={{ rotate: 0, scale: 1.04 }}
      transition={{ type: "spring", stiffness: 220, damping: 16, delay }}
      aria-hidden
    >
      <motion.span
        className="absolute -inset-y-2 w-6 rotate-12 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        initial={{ x: -40 }}
        animate={{ x: 110 }}
        transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 5, ease: "easeInOut", delay: delay + 0.6 }}
      />
      <span className="absolute left-[7px] top-[8px] h-[9px] w-[12px] rounded-[2px] bg-[linear-gradient(135deg,#ffe8a3,#d4a843)]" />
      <svg viewBox="0 0 10 10" className="absolute right-[7px] top-[7px] size-[10px] text-white/80" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <path d="M3 2.5a4 4 0 0 1 0 5M5.5 1a6.5 6.5 0 0 1 0 8M8 0.2a8.5 8.5 0 0 1 0 9.6" />
      </svg>
      <span className="absolute bottom-[6px] left-[7px] text-[9px] font-semibold tracking-wider text-white tabular">
        {hidden ? "•••• ••••" : "•••• 4821"}
      </span>
    </motion.div>
  );
}
