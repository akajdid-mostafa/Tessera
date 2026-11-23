import { Door16Regular, Temperature20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

const LIMIT = 5;
const SET = 3.2;
const LO = 2;
const HI = 7;
const W = 132;
const H = 44;
/** Readings every 30 s (a 1.5 s tick here), the last 12 minutes. */
const SEED = [3.3, 3.2, 3.3, 3.2, 3.3, 3.4, 3.3, 3.2, 3.5, 3.7, 3.8, 4.0, 4.1, 4.2, 4.3, 4.4];
const REOPEN_MS = 22_000;

const y = (t: number) => H - ((t - LO) / (HI - LO)) * H;
const trace = (pts: number[]) =>
  pts.map((v, i) => `${i ? "L" : "M"}${((i / (pts.length - 1)) * W).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
const TWO = { minimumIntegerDigits: 2 } as const;

/** Restaurant · small. The walk-in cooler's temperature trace against its 5 °C limit while the door is propped open; mark it closed and the box pulls back down, until the next delivery props it again. */
export function WalkInWidget({ index }: { index?: number }) {
  const [pts, setPts] = useState(SEED);
  const [open, setOpen] = useState(true);
  const [ajar, setAjar] = useState(126);
  const temp = pts[pts.length - 1];
  const over = temp >= LIMIT;
  const warm = temp >= 4.5;
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      setPts((ps) => {
        const last = ps[ps.length - 1];
        const target = open ? 6.4 : SET;
        const next = last + (target - last) * (open ? 0.06 : 0.12) + (Math.random() - 0.5) * 0.04;
        return [...ps.slice(1), Math.round(next * 100) / 100];
      });
      if (open) setAjar((s) => s + 2);
    }, 1500);
    return () => window.clearInterval(t);
  }, [open]);

  useEffect(() => {
    if (open) return;
    const t = window.setTimeout(() => {
      setAjar(0);
      setOpen(true);
    }, REOPEN_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  const d = trace(pts);

  return (
    <Widget size="small" index={index} label="Walk-in cooler">
      <WidgetHeader
        icon={<Temperature20Filled />}
        tint={over ? "var(--ios-red)" : warm ? "var(--ios-orange)" : "var(--ios-blue)"}
        title="Walk-in"
        subtitle={open ? "Door ajar" : "Door closed"}
        extra={
          open ? (
            <motion.span
              className="mt-0.5 rounded-full bg-ios-orange/15 px-1.5 py-px text-[11px] font-semibold text-ios-orange"
              animate={{ opacity: [1, 0.55, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            >
              <AnimatedNumber value={Math.floor(ajar / 60)} />:<AnimatedNumber value={ajar % 60} format={TWO} />
            </motion.span>
          ) : null
        }
      />

      <div className="mt-1.5 flex items-baseline-last gap-1 leading-none whitespace-nowrap">
        <AnimatedNumber
          value={temp}
          format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
          className={cn("text-[28px] font-semibold tracking-tight", over ? "text-ios-red" : warm ? "text-ios-orange" : "text-heading")}
        />
        <span className="mb-0.5 text-[13px] font-medium text-tertiary">°C</span>
        <span className="mb-0.5 ml-auto text-[10.5px] text-tertiary">
          {over ? "Over limit" : `Limit ${LIMIT.toFixed(1)}`}
        </span>
      </div>

      <div className="relative mt-1.5 h-[41px] shrink-0">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
          <rect x={0} y={0} width={W} height={y(LIMIT)} className="fill-ios-red/10" />
          <line
            x1={0}
            x2={W}
            y1={y(LIMIT)}
            y2={y(LIMIT)}
            strokeDasharray="3 3"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            className="stroke-ios-red"
          />
          <motion.path
            d={d}
            initial={{ d, opacity: 0 }}
            animate={{ d, opacity: 1 }}
            transition={{ opacity: { duration: 0.6, delay }, d: { duration: 0.4 } }}
            fill="none"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            stroke={over ? "var(--ios-red)" : warm ? "var(--ios-orange)" : "var(--ios-blue)"}
          />
        </svg>
      </div>
      <div className="mt-[3px] flex h-[11px] shrink-0 justify-between text-[9px] leading-[11px] text-tertiary">
        <span>−8 min</span>
        <span>now</span>
      </div>

      <div className="mt-auto">
        {open ? (
          <Button block size="small" type="primary" icon={<Door16Regular />} onClick={() => setOpen(false)}>
            Mark door closed
          </Button>
        ) : (
          <div className="flex h-6 items-center justify-center rounded-[8px] bg-fill-quaternary text-[11.5px] text-secondary">
            Pulling down to {SET.toFixed(1)} °C
          </div>
        )}
      </div>
    </Widget>
  );
}
