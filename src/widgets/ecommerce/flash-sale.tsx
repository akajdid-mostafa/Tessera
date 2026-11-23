import { AlertOn16Filled, Alert16Regular, Flash16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget } from "@/motion/widget";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

/** Starts just over an hour out, so the last-hour glow kicks in a few seconds after load. */
const START_SECONDS = 60 * 60 + 9;
const STOCK = 600;
const TWO = { minimumIntegerDigits: 2 } as const;

/** E-commerce · small. A live countdown on a warm surface; the claimed bar fills and the glow wakes in the last hour. */
export function FlashSaleWidget({ index }: { index?: number }) {
  const [left, setLeft] = useState(START_SECONDS);
  const [claimed, setClaimed] = useState(408);
  const [remind, setRemind] = useState(false);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      setLeft((s) => (s <= 1 ? START_SECONDS : s - 1));
    }, 1000);
    const c = window.setInterval(() => {
      setClaimed((n) => Math.min(STOCK - 18, n + 1 + Math.floor(Math.random() * 4)));
    }, 2600);
    return () => {
      window.clearInterval(t);
      window.clearInterval(c);
    };
  }, []);

  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  const lastHour = left < 3600;
  const share = claimed / STOCK;

  return (
    <Widget
      size="small"
      index={index}
      label="Flash sale"
      pressable
      onPress={() => setRemind((r) => !r)}
      glow={{ mode: "pulse", colors: ["#FF9F0A", "#FF375F", "#FFD60A"], blur: 20, duration: 1.8 }}
      glowActive={lastHour}
      surfaceClassName="bg-[linear-gradient(150deg,#ffb340_0%,#ff7a2e_48%,#ff375f_100%)] dark:bg-[linear-gradient(150deg,#e07b00_0%,#d9481e_50%,#b3123f_100%)] ring-white/15"
    >
      <Sheen />
      <div className="relative flex h-full flex-col text-white">
        <div className="flex items-center gap-1.5">
          <motion.span
            className="grid size-7 place-items-center rounded-full bg-white/22 text-[15px] backdrop-blur-sm"
            animate={{ rotate: [0, -10, 8, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 2.4, ease: "easeInOut" }}
          >
            <Flash16Filled />
          </motion.span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[13px] font-semibold">Flash Sale</div>
            <div className="truncate text-[11px] text-white/75">Aura Buds · 40% off</div>
          </div>
          <span className="relative grid size-5 place-items-center text-[14px] text-white/90">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={remind ? "on" : "off"}
                initial={{ scale: 0.3, rotate: -40, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.3, opacity: 0 }}
                transition={{ type: "spring", stiffness: 520, damping: 16 }}
                className="grid place-items-center"
              >
                {remind ? <AlertOn16Filled /> : <Alert16Regular />}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>

        <div className="mt-2.5 text-[11px] font-medium text-white/75">
          {remind ? "We'll remind you at 10 min" : lastHour ? "Last hour · ends in" : "Ends in"}
        </div>
        <div className="flex items-baseline text-[27px] leading-none font-semibold tracking-tight tabular">
          <AnimatedNumber value={h} format={TWO} />
          <span className="px-px text-white/60">:</span>
          <AnimatedNumber value={m} format={TWO} />
          <span className="px-px text-white/60">:</span>
          <AnimatedNumber value={s} format={TWO} trend={-1} />
        </div>

        <div className="mt-auto">
          <div className="mb-1 flex justify-between text-[11px] font-medium">
            <span className="text-white/80">Claimed</span>
            <AnimatedNumber value={share} format={{ style: "percent", maximumFractionDigits: 0 }} />
          </div>
          <Tooltip title={`${claimed} of ${STOCK} claimed · ${STOCK - claimed} left`}>
            <div className="relative h-1.5 overflow-hidden rounded-full bg-black/20">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${share * 100}%` }}
                transition={{ type: "spring", stiffness: 70, damping: 18, delay }}
              />
            </div>
          </Tooltip>
        </div>
      </div>
    </Widget>
  );
}

/** A soft highlight that sweeps across the surface now and then. */
function Sheen() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -right-8 -top-10 size-28 rounded-full bg-[radial-gradient(circle,rgba(255,230,140,0.45),transparent_65%)]" />
      <motion.div
        className="absolute -inset-y-6 w-16 rotate-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
        initial={{ x: -120 }}
        animate={{ x: 260 }}
        transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 4.5, ease: "easeInOut" }}
      />
    </div>
  );
}
