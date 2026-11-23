import { ArrowCounterclockwise12Regular, Checkmark16Filled, PersonAvailable20Filled, ShieldDismiss16Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { Ring } from "./_parts-a";

/* The active job: departure:opt_kaibab_sedona|2026-11-09|09:00. */
const PAX = 15;
const START = { arrivedPax: 9, noShow: 1 };
const UNINSURED = 2;

/** Tour ops · small. The active job's arrived pax against its total with no-shows in red; tap +1 and the digits roll and the ring fills, uninsured guests stay flagged. */
export function CheckInCounterWidget({ index }: { index?: number }) {
  const [state, setState] = useState(START);
  const [pops, setPops] = useState<number[]>([]);
  const [touched, setTouched] = useState(false);
  const seq = useRef(0);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const { arrivedPax, noShow } = state;
  const toGo = PAX - arrivedPax - noShow;
  const done = toGo === 0;

  const press = () => {
    setTouched(true);
    if (done) {
      setState(START);
      return;
    }
    seq.current += 1;
    const id = seq.current;
    setState((s) => ({ ...s, arrivedPax: s.arrivedPax + 1 }));
    setPops((p) => [...p, id]);
    window.setTimeout(() => setPops((p) => p.filter((x) => x !== id)), 700);
  };

  return (
    <Widget size="small" index={index} label="Check-in counter" glow={{ colors: ["#34c759", "#30d158"] }} glowActive={done || undefined}>
      <WidgetHeader
        icon={<PersonAvailable20Filled />}
        tint="var(--ios-green)"
        title="Check-in"
        subtitle="Sedona & Oak Creek · 09:00"
      />

      <div className="mt-2.5 flex items-center gap-2.5">
        <Ring
          size={74}
          stroke={7}
          delay={touched ? 0 : delay}
          parts={[
            { value: arrivedPax / PAX, color: "var(--ios-green)" },
            { value: noShow / PAX, color: "var(--ios-red)" },
          ]}
        >
          <div className="text-center leading-none">
            <div className="text-[22px] font-semibold tracking-tight text-heading">
              <AnimatedNumber value={arrivedPax} trend={1} />
            </div>
            <div className="mt-0.5 text-[10px] font-medium text-tertiary">of {PAX}</div>
          </div>
        </Ring>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <div className="relative">
            <motion.button
              type="button"
              aria-label={done ? "Start over" : "Mark one guest arrived"}
              onClick={press}
              whileTap={{ scale: 0.86 }}
              className="grid size-[44px] cursor-pointer place-items-center rounded-full bg-ios-green-deep text-white shadow-sm"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={done ? "done" : "add"}
                  className="grid text-[15px] font-bold"
                  initial={{ scale: 0, rotate: -60 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 520, damping: 20 }}
                >
                  {done ? <Checkmark16Filled className="size-5" /> : "+1"}
                </motion.span>
              </AnimatePresence>
            </motion.button>
            <AnimatePresence>
              {pops.map((id) => (
                <motion.span
                  key={id}
                  aria-hidden
                  className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 text-[12px] font-semibold text-ios-green"
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -22 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  +1
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
          <div className="text-center text-[11px] leading-tight whitespace-nowrap">
            <AnimatePresence mode="wait" initial={false}>
              {done ? (
                <motion.button
                  key="all"
                  type="button"
                  onClick={press}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex cursor-pointer items-center gap-0.5 font-semibold text-ios-green"
                >
                  All in <ArrowCounterclockwise12Regular className="text-tertiary" />
                </motion.button>
              ) : (
                <motion.div key="left" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                  <AnimatedNumber value={toGo} trend={-1} className="font-semibold text-secondary" />
                  <span className="text-tertiary"> to go</span>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="text-ios-red">
              <span className="font-semibold">{noShow}</span> no-show
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 26, delay: delay + 0.4 }}
        className="mt-auto flex h-[22px] items-center gap-1 rounded-full bg-ios-orange/15 px-2 text-[11px] font-semibold whitespace-nowrap text-ios-orange"
      >
        <ShieldDismiss16Regular className="size-3.5 shrink-0" />
        {UNINSURED} not insured
        <span className="ml-auto truncate font-medium text-tertiary">of {PAX}</span>
      </motion.div>
    </Widget>
  );
}
