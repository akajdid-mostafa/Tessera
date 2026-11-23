import { Checkmark12Filled, Luggage20Filled } from "@fluentui/react-icons";
import { AnimatePresence, type MotionValue, animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Switch } from "@/registry/antuikit/ui/switch";

/* The carousel: a stadium loop in a 150×104 box, two straights joined by half circles. */
const CX = 75;
const CY = 52;
const HALF = 35;
const RAD = 32;
const STRAIGHT = HALF * 2;
const ARC = Math.PI * RAD;
const LOOP = 2 * STRAIGHT + 2 * ARC;
const BELT = `M${CX - HALF} ${CY - RAD} H${CX + HALF} A${RAD} ${RAD} 0 0 1 ${CX + HALF} ${CY + RAD} H${CX - HALF} A${RAD} ${RAD} 0 0 1 ${CX - HALF} ${CY - RAD} Z`;

/** A point on the belt, `u` of the way round from the top-left, and the belt's heading there in degrees. */
function onBelt(u: number) {
  let s = (((u % 1) + 1) % 1) * LOOP;
  if (s < STRAIGHT) return { x: CX - HALF + s, y: CY - RAD, r: 0 };
  s -= STRAIGHT;
  if (s < ARC) {
    const a = -Math.PI / 2 + s / RAD;
    return { x: CX + HALF + Math.cos(a) * RAD, y: CY + Math.sin(a) * RAD, r: (a * 180) / Math.PI + 90 };
  }
  s -= ARC;
  if (s < STRAIGHT) return { x: CX + HALF - s, y: CY + RAD, r: 180 };
  s -= STRAIGHT;
  const a = Math.PI / 2 + s / RAD;
  return { x: CX - HALF + Math.cos(a) * RAD, y: CY + Math.sin(a) * RAD, r: (a * 180) / Math.PI + 90 };
}

/* Other passengers' bags round the belt; slot 4 is left free for yours. */
const BAGS = [
  "var(--ios-blue)",
  "var(--ant-color-text-tertiary)",
  "var(--ios-red)",
  "var(--ios-purple)",
  null,
  "var(--ant-color-text-tertiary)",
  "var(--ios-orange)",
  "var(--ios-indigo)",
  "var(--ant-color-text-tertiary)",
  "var(--ios-pink)",
];
const TOTAL = 260;
const STEPS = ["Unloading", "First bags out", "Your bag is out"] as const;

function Bag({ t, slot, color, shown, mine }: { t: MotionValue<number>; slot: number; color: string; shown: boolean; mine?: boolean }) {
  const off = slot / BAGS.length;
  const x = useTransform(t, (v) => onBelt(v + off).x);
  const y = useTransform(t, (v) => onBelt(v + off).y);
  const rotate = useTransform(t, (v) => onBelt(v + off).r);
  return (
    <motion.g style={{ x, y }}>
      <motion.g style={{ rotate }}>
        <motion.g
          initial={false}
          animate={{ scale: shown ? 1 : 0, opacity: shown ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 20 }}
        >
          <rect x="-8" y="-6" width="16" height="12" rx="3" fill={color} />
          <rect x="-3" y="-8" width="6" height="3" rx="1.5" fill="none" stroke={color} strokeWidth="1.2" />
          {mine ? <circle cx="5" cy="-3" r="2" fill="var(--widget-surface)" /> : null}
        </motion.g>
      </motion.g>
    </motion.g>
  );
}

/** Travel · medium. The baggage carousel drawn with bags riding the belt as the flight's bags come out; yours glows onto the belt with an alert, and Got it ticks the claim off. */
export function BaggageBeltWidget({ index }: { index?: number }) {
  const t = useMotionValue(0);
  const [stage, setStage] = useState(0);
  const [out, setOut] = useState(0);
  const [alert, setAlert] = useState(true);
  const [collected, setCollected] = useState(false);
  const delay = 0.3 + (index ?? 0) * 0.06;

  // The belt turns slowly and for good.
  useEffect(() => {
    const c = animate(t, [0, 1], { duration: 26, ease: "linear", repeat: Infinity });
    return () => c.stop();
  }, [t]);

  // The story: unloading, the first bags, then yours.
  useEffect(() => {
    const a = window.setTimeout(() => setStage(1), 3500);
    const b = window.setTimeout(() => setStage(2), 11000);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);

  useEffect(() => {
    if (stage === 0) return;
    const id = window.setInterval(() => setOut((n) => Math.min(TOTAL, n + 2 + Math.round(Math.random() * 4))), 700);
    return () => window.clearInterval(id);
  }, [stage]);

  const visible = Math.ceil((out / 60) * BAGS.length);
  const mineOut = stage >= 2 && !collected;
  const step = collected ? 3 : stage;

  return (
    <Widget
      size="medium"
      index={index}
      label="Baggage claim"
      glow={{ mode: "pulse", colors: ["#40C8E0", "#30D158", "#40C8E0"], blur: 18, duration: 1.6 }}
      glowActive={mineOut && alert}
    >
      <WidgetHeader
        icon={<Luggage20Filled />}
        tint="var(--ios-teal)"
        title="Baggage Claim"
        subtitle="AX 204 from JFK · landed 13:10"
        extra={
          <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-tertiary">
            Alert
            <Switch size="small" checked={alert} onChange={setAlert} aria-label="Alert when my bag is out" />
          </div>
        }
      />

      <div className="mt-1 flex min-h-0 flex-1 items-center gap-3">
        <svg viewBox="0 0 150 104" className="h-[112px] shrink-0 overflow-visible">
          <path d={BELT} fill="none" strokeWidth="22" strokeLinejoin="round" className="stroke-fill-tertiary" />
          <motion.path
            d={BELT}
            fill="none"
            strokeWidth="1"
            strokeDasharray="2 7"
            className="stroke-fill"
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: [0, -LOOP] }}
            transition={{ duration: 26, ease: "linear", repeat: Infinity }}
          />
          <text x={CX} y={CY + 9} textAnchor="middle" className="fill-tertiary text-[26px] font-semibold">
            7
          </text>
          {BAGS.map((c, i) =>
            c ? (
              <Bag key={i} t={t} slot={i} color={c} shown={i < visible} />
            ) : (
              <Bag key={i} t={t} slot={i} color="var(--ios-teal)" shown={mineOut} mine />
            ),
          )}
        </svg>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="text-[20px] leading-none font-semibold tracking-tight text-heading whitespace-nowrap">
            Belt 7
          </div>
          <div className="mt-1 text-[11px] text-tertiary whitespace-nowrap">
            <AnimatedNumber value={out} className="font-semibold text-secondary" /> of {TOTAL} bags out
          </div>

          <div className="mt-1.5 flex flex-col gap-0.5">
            {STEPS.map((s, i) => {
              const done = step > i;
              const now = step === i;
              return (
                <div key={s} className="flex h-4 items-center gap-1.5 whitespace-nowrap">
                  <motion.span
                    className={cn(
                      "grid size-3 place-items-center rounded-full",
                      done ? "bg-ios-teal/15 text-ios-teal" : now ? "bg-ios-teal/25" : "bg-fill-secondary",
                    )}
                    animate={now ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                    transition={now ? { duration: 1.4, repeat: Infinity, delay } : { type: "spring", stiffness: 400, damping: 20 }}
                  >
                    {done ? <Checkmark12Filled className="size-2" /> : null}
                  </motion.span>
                  <span className={cn("text-[11px]", done || now ? "font-medium text-heading" : "text-tertiary")}>{s}</span>
                </div>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {mineOut ? (
              <motion.div
                key="got"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-1.5"
              >
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCollected(true)}
                  className="h-6 cursor-pointer rounded-full bg-ios-teal/15 px-3 text-[12px] font-semibold text-ios-teal"
                >
                  Got it · teal case
                </motion.button>
              </motion.div>
            ) : collected ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-1.5 flex h-6 items-center gap-1 text-[12px] font-semibold text-ios-green"
              >
                <Checkmark12Filled className="size-3.5" /> Bag collected
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </Widget>
  );
}
