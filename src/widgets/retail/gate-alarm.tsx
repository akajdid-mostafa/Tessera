import { Checkmark16Filled, ShieldError20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

type Phase = "alarm" | "classify" | "armed";
type Alarm = { gate: string; tags: number };
const NEXT: Alarm[] = [
  { gate: "Gate B", tags: 2 },
  { gate: "Gate A", tags: 1 },
  { gate: "Gate C", tags: 3 },
];
const REARM_MS = 14_000;
const TWO = { minimumIntegerDigits: 2 } as const;

/** An EAS exit gate seen from the front: two pedestal panels on feet, a status light on each,
 * and, while a tag is in the field, a security tag between them with a slow ripple. */
function Pedestals({ alarm }: { alarm: boolean }) {
  return (
    <svg viewBox="0 0 52 64" className="h-[64px] w-[52px] shrink-0">
      {/* Floor line. */}
      <line x1={2} x2={50} y1={62} y2={62} strokeWidth={1} strokeLinecap="round" className="stroke-fill" />
      {[4, 40].map((x) => (
        <g key={x}>
          <rect x={x} y={4} width={8} height={54} rx={4} strokeWidth={1.25} className="fill-fill-tertiary stroke-fill" />
          <rect x={x - 2} y={58} width={12} height={4} rx={1.5} className="fill-fill" />
          <motion.circle
            cx={x + 4}
            cy={10}
            r={2}
            animate={{ opacity: alarm ? [1, 0.4, 1] : 1 }}
            transition={alarm ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
            className={alarm ? "fill-ios-red" : "fill-ios-green"}
          />
        </g>
      ))}
      <AnimatePresence>
        {alarm && (
          <motion.g key="tag" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            {[0, 1].map((k) => (
              <motion.circle
                key={k}
                cx={26}
                cy={33}
                r={5}
                fill="none"
                strokeWidth={1.25}
                className="stroke-ios-red"
                initial={{ r: 5, opacity: 0 }}
                animate={{ r: [5, 13], opacity: [0.6, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: k * 1.2, ease: "easeOut" }}
              />
            ))}
            {/* Hard tag: a rounded body with its pin. */}
            <g transform="rotate(-18 26 33)">
              <rect x={21} y={29.5} width={10} height={7} rx={2} className="fill-ios-red" />
              <circle cx={26} cy={33} r={1.3} className="fill-[var(--widget-surface)]" />
            </g>
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
}

/** Retail · small. The exit gates' security alarm: pedestals pulse and a timer counts while tags are detected; acknowledge, log it as real or false, and the gates re-arm until the next one. */
export function GateAlarmWidget({ index }: { index?: number }) {
  const [phase, setPhase] = useState<Phase>("alarm");
  const [n, setN] = useState(0);
  const [secs, setSecs] = useState(38);
  const [today, setToday] = useState({ alarms: 6, real: 2 });
  const alarm = NEXT[n % NEXT.length];
  const ringing = phase !== "armed";

  useEffect(() => {
    if (!ringing) return;
    const t = window.setInterval(() => setSecs((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [ringing]);

  useEffect(() => {
    if (phase !== "armed") return;
    const t = window.setTimeout(() => {
      setN((k) => k + 1);
      setSecs(0);
      setToday((d) => ({ ...d, alarms: d.alarms + 1 }));
      setPhase("alarm");
    }, REARM_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  const log = (real: boolean) => {
    setToday((d) => ({ ...d, real: d.real + (real ? 1 : 0) }));
    setPhase("armed");
  };

  return (
    <Widget
      size="small"
      index={index}
      label="Exit gate alarm"
      glow={{ mode: "pulse", colors: ["#FF453A", "#FF9F0A", "#FF453A"], blur: 18, duration: 1.4 }}
      glowActive={phase === "alarm"}
    >
      <WidgetHeader
        icon={<ShieldError20Filled />}
        tint={ringing ? "var(--ios-red)" : "var(--ios-green)"}
        title="Exit Gates"
        subtitle={ringing ? "Tag detected" : "All 3 armed"}
      />

      <div className="mt-2 flex items-center gap-2.5">
        <Pedestals alarm={ringing} />
        <AnimatePresence mode="wait" initial={false}>
          {ringing ? (
            <motion.div
              key={`alarm-${n}`}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="min-w-0 leading-tight whitespace-nowrap"
            >
              <div className="text-[20px] font-semibold tracking-tight text-ios-red">{alarm.gate}</div>
              <div className="text-[11px] text-secondary">
                {alarm.tags} {alarm.tags === 1 ? "tag" : "tags"} in field
              </div>
              <div className="mt-0.5 text-[12px] font-semibold text-heading">
                <AnimatedNumber value={Math.floor(secs / 60)} />:
                <AnimatedNumber value={secs % 60} format={TWO} />
                <span className="font-normal text-tertiary"> ago</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="armed"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="min-w-0 leading-tight whitespace-nowrap"
            >
              <div className="flex items-center gap-1 text-[20px] font-semibold tracking-tight text-heading">
                Armed
              </div>
              <div className="text-[11px] text-tertiary">
                <AnimatedNumber value={today.alarms} className="font-medium text-secondary" /> alarms today
              </div>
              <div className="text-[11px] text-tertiary">
                <AnimatedNumber value={today.real} className="font-medium text-secondary" /> real · rest false
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-auto">
        {phase === "alarm" ? (
          <Button block color="danger" variant="solid" onClick={() => setPhase("classify")}>
            Acknowledge
          </Button>
        ) : phase === "classify" ? (
          <div className="flex gap-1.5">
            <Button block variant="filled" color="green" className="text-ios-green" onClick={() => log(true)}>
              Real
            </Button>
            <Button block variant="filled" color="default" onClick={() => log(false)}>
              False
            </Button>
          </div>
        ) : (
          <div className={cn("flex h-8 items-center justify-center gap-1 rounded-[10px] bg-fill-quaternary text-[12px] text-secondary")}>
            <Checkmark16Filled className="size-3.5 text-ios-green" /> Logged · gates re-armed
          </div>
        )}
      </div>
    </Widget>
  );
}
