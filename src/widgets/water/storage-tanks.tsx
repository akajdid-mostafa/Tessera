import { ArrowDown12Filled, ArrowUp12Filled, Database20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { AlarmMark, enterDelay, sparkPath, useInterval } from "./_parts";

/* Distribution storage across three pressure zones. Levels are % of overflow height,
 * with the Low alarm at 30 %. Normal rows stay grey (ISA-101); Ridge Reservoir has been
 * drawing since its inlet altitude valve failed to open and sits on a priority-2 Low
 * that flashes until acknowledged. Each tick stands for about ten minutes. */
type Tank = {
  id: string;
  name: string;
  sub: string;
  level: number;
  rate: number;
  series: number[];
  capacity: number;
  alarm?: boolean;
  tip: string;
};

const LOW = 30;
const SW = 100;
const SH = 18;
const wave = (n: number, from: number, to: number, wobble: number) =>
  Array.from({ length: n }, (_, i) => from + ((to - from) * i) / (n - 1) + Math.sin(i * 0.9) * wobble);

const TANKS: Tank[] = [
  { id: "hill", name: "Hilltop Tower", sub: "Zone 3 · 12.0 m", level: 78, rate: 0.6, series: [...wave(12, 82, 61, 1.5), ...wave(12, 60, 78, 1)], capacity: 4.5, tip: "Inlet open · fills on the night tariff · 4.5 ML" },
  { id: "ridge", name: "Ridge Reservoir", sub: "Zone 5 · 8.0 m", level: 26.4, rate: -0.35, series: [...wave(10, 71, 64, 1.2), ...wave(14, 63, 26.4, 0.6)], capacity: 9, alarm: true, tip: "Altitude valve AV-51 failed to open 05:40 · LL in ≈ 3 h" },
  { id: "mill", name: "Mill Lane Tank", sub: "Zone 2 · 6.5 m", level: 63, rate: -0.4, series: [...wave(14, 70, 88, 1), ...wave(10, 87, 63, 1)], capacity: 2.2, tip: "Drawing on morning demand · refills 22:00" },
];

/** Water · medium. Three network service reservoirs with level, 24 h trend and fill or draw; levels move live and Ridge Reservoir's Low alarm flashes until you tap its row to acknowledge. */
export function StorageTanksWidget({ index }: { index?: number }) {
  const [tanks, setTanks] = useState(TANKS);
  const [acked, setAcked] = useState(false);
  const delay = enterDelay(index);

  useInterval(() => {
    setTanks((ts) =>
      ts.map((t) => {
        let rate = t.rate;
        if (!t.alarm && t.level + rate > 92) rate = -Math.abs(rate);
        if (!t.alarm && t.level + rate < 45) rate = Math.abs(rate);
        const level = Math.round(Math.max(21, t.level + rate + (Math.random() - 0.5) * 0.1) * 10) / 10;
        return { ...t, rate, level, series: [...t.series.slice(0, -1), level] };
      }),
    );
  }, 2000);

  const vol = tanks.reduce((s, t) => s + (t.level / 100) * t.capacity, 0);
  const cap = tanks.reduce((s, t) => s + t.capacity, 0);

  return (
    <Widget size="medium" index={index} label="Network service reservoirs">
      <WidgetHeader
        icon={<Database20Filled />}
        tint="var(--ios-blue)"
        title="Service Reservoirs"
        subtitle="3 zones · 24 h trend"
        extra={
          <span className="text-[11px] whitespace-nowrap text-tertiary">
            <AnimatedNumber value={vol} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} className="text-[15px] font-semibold text-heading" />
            <span className="ml-0.5">/ {cap.toFixed(1)} ML</span>
          </span>
        }
      />

      <ul className="mt-auto flex flex-col gap-2">
        {tanks.map((t, i) => {
          const alarm = !!t.alarm && t.level < LOW;
          const flashing = alarm && !acked;
          const yLow = SH - (LOW / 100) * SH;
          return (
            <li key={t.id} className={cn("relative", i > 0 && "before:absolute before:inset-x-0 before:-top-1 before:h-[0.5px] before:bg-split")}>
              <Tooltip placement="top" title={`${t.name} · ${t.tip}`}>
                <button
                  type="button"
                  onClick={() => alarm && setAcked(true)}
                  aria-label={flashing ? `${t.name} low level, acknowledge` : t.name}
                  className="-mx-1.5 flex h-[38px] w-[calc(100%+0.75rem)] cursor-pointer items-center gap-2.5 px-1.5 text-left whitespace-nowrap transition-colors outline-none hover:bg-fill-quaternary"
                >
                  <span className="relative h-6 w-3 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-[var(--ant-color-text-tertiary)] ring-inset">
                    <motion.span
                      className={cn("absolute inset-x-0 bottom-0", alarm ? "bg-ios-orange" : "bg-[var(--ant-color-text-tertiary)]")}
                      initial={{ height: "0%" }}
                      animate={{ height: `${t.level}%` }}
                      transition={{ type: "spring", stiffness: 90, damping: 18, delay: delay + i * 0.06 }}
                    />
                  </span>
                  <span className="w-[116px] shrink-0 leading-none">
                    <span className="block truncate text-[13px] font-semibold text-heading">{t.name}</span>
                    <span className="mt-1 block truncate text-[11px] text-tertiary tabular">{t.sub}</span>
                  </span>
                  <svg viewBox={`0 0 ${SW} ${SH}`} preserveAspectRatio="none" className="h-[22px] min-w-0 flex-1 overflow-visible" aria-hidden>
                    <line x1="0" x2={SW} y1={yLow} y2={yLow} strokeWidth="1" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" className="stroke-fill" />
                    <motion.path
                      d={sparkPath(t.series, SW, SH, 0, 100)}
                      fill="none"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      className={alarm ? "stroke-[var(--ios-orange)]" : "stroke-secondary"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: delay + 0.2 + i * 0.06 }}
                    />
                  </svg>
                  <span className="w-[42px] shrink-0 text-right text-[13px] font-semibold text-heading">
                    <AnimatedNumber value={Math.round(t.level)} suffix="%" />
                  </span>
                  <span className="flex w-[58px] shrink-0 items-center gap-1 text-[11px]">
                    {alarm ? (
                      <>
                        <AlarmMark priority={2} flashing={flashing} size={13} />
                        <span className="font-semibold text-ios-orange">Low</span>
                      </>
                    ) : t.rate > 0 ? (
                      <span className="flex items-center gap-0.5 text-secondary">
                        <ArrowUp12Filled /> Filling
                      </span>
                    ) : t.rate < 0 ? (
                      <span className="flex items-center gap-0.5 text-secondary">
                        <ArrowDown12Filled /> Drawing
                      </span>
                    ) : (
                      <span className="text-tertiary">Full</span>
                    )}
                  </span>
                </button>
              </Tooltip>
            </li>
          );
        })}
      </ul>
    </Widget>
  );
}
