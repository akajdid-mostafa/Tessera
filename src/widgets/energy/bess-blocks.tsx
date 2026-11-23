import { BatteryCharge20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

/* Four 25 MW / 100 MWh LFP blocks. Cell spread under ~10 mV is healthy; B3 has
 * drifted to 58 mV, so the site controller derates it while it balances. */
type Block = { id: string; soc: number; temp: number; dv: number; mw: number; vmax: number; vmin: number };
const SEED: Block[] = [
  { id: "B1", soc: 66.2, temp: 27.4, dv: 9, mw: 18.1, vmax: 3.296, vmin: 3.287 },
  { id: "B2", soc: 64.8, temp: 28.1, dv: 11, mw: 18.0, vmax: 3.294, vmin: 3.283 },
  { id: "B3", soc: 58.9, temp: 31.6, dv: 58, mw: 8.2, vmax: 3.318, vmin: 3.26 },
  { id: "B4", soc: 65.5, temp: 26.9, dv: 8, mw: 18.1, vmax: 3.295, vmin: 3.287 },
];
const DV_WARN = 50;
const SPEEDUP = 5;
const TICK_MS = 2000;

/** ISA-18.2 priority 3: yellow, triangle pointing down, numbered. */
function P3() {
  return (
    <svg viewBox="0 0 12 11" className="size-3 shrink-0" aria-label="Priority 3">
      <path d="M1 1h10L6 10.2z" fill="var(--ios-yellow)" />
      <text x="6" y="6.4" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="#000">
        3
      </text>
    </svg>
  );
}

/** Energy · medium. Each block's SoC drains live as it discharges; hover a row for its cell extremes. */
export function BessBlocksWidget({ index }: { index?: number }) {
  const [blocks, setBlocks] = useState(SEED);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      setBlocks((bs) =>
        bs.map((b) => {
          const mw = Math.round((b.mw + (Math.random() - 0.5) * 0.4) * 10) / 10;
          const base = SEED.find((s) => s.id === b.id)!.mw;
          const settled = Math.round((mw + (base - mw) * 0.3) * 10) / 10;
          const soc = Math.max(5, b.soc - (settled / 100) * (TICK_MS / 3_600_000) * 100 * SPEEDUP);
          return { ...b, mw: settled, soc: Math.round(soc * 100) / 100 };
        }),
      );
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, []);

  const total = blocks.reduce((s, b) => s + b.mw, 0);
  const soc = blocks.reduce((s, b) => s + b.soc, 0) / blocks.length;

  return (
    <Widget size="medium" index={index} label="Battery storage blocks">
      <WidgetHeader
        icon={<BatteryCharge20Filled />}
        tint="var(--ios-green)"
        title="Kestrel BESS"
        subtitle={
          <span className="tabular">
            400 MWh · SoC <AnimatedNumber value={soc} format={{ maximumFractionDigits: 1, minimumFractionDigits: 1 }} />%
          </span>
        }
        extra={
          <div className="text-right leading-tight whitespace-nowrap">
            <div className="flex items-center justify-end gap-1 text-[11px] text-tertiary">
              Discharging
              <span className="flex">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="-ml-0.5 text-[10px] text-secondary"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  >
                    ›
                  </motion.span>
                ))}
              </span>
            </div>
            <div className="text-[15px] font-semibold text-heading">
              <AnimatedNumber value={total} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
              <span className="ml-0.5 text-[11px] font-medium text-tertiary">MW</span>
            </div>
          </div>
        }
      />

      <div className="mt-auto flex flex-col">
        {blocks.map((b, i) => {
          const warn = b.dv >= DV_WARN;
          return (
            <Tooltip
              key={b.id}
              placement="top"
              title={
                <span className="tabular">
                  {b.id} · cells {b.vmax.toFixed(3)} / {b.vmin.toFixed(3)} V · max {b.temp.toFixed(1)} °C
                  {warn ? " · balancing, derated" : ""}
                </span>
              }
            >
              <div
                className={cn(
                  "-mx-1.5 flex h-[25px] items-center gap-2 px-1.5 text-[11px] whitespace-nowrap transition-colors hover:bg-fill-quaternary",
                  i > 0 && "border-t-[0.5px] border-split",
                )}
              >
                <span className="w-5 font-semibold text-secondary">{b.id}</span>
                <div className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-fill-secondary">
                  <motion.div
                    className="absolute inset-y-0 left-0 overflow-hidden rounded-full bg-tertiary"
                    initial={{ width: 0 }}
                    animate={{ width: `${b.soc}%` }}
                    transition={{ type: "spring", stiffness: 90, damping: 20, delay: delay + i * 0.06 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-l from-transparent via-white/45 to-transparent bg-[length:32px_100%] bg-no-repeat dark:via-white/30"
                      initial={{ x: "100%" }}
                      animate={{ x: "-30%" }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
                    />
                  </motion.div>
                  {[5, 95].map((w) => (
                    <span key={w} className="absolute inset-y-0 w-px bg-quaternary" style={{ left: `${w}%` }} />
                  ))}
                </div>
                <span className="w-11 text-right font-semibold text-heading">
                  <AnimatedNumber value={b.soc} format={{ maximumFractionDigits: 1, minimumFractionDigits: 1 }} suffix="%" />
                </span>
                <span className="w-10 text-right text-tertiary tabular">{b.temp.toFixed(1)}°</span>
                <span
                  className={cn(
                    "flex w-[52px] items-center justify-end gap-1 rounded-full tabular",
                    warn ? "bg-ios-yellow/20 px-1 font-semibold text-heading" : "text-tertiary",
                  )}
                >
                  {warn ? <P3 /> : null}
                  {b.dv} mV
                </span>
                <span className="w-9 text-right font-medium text-secondary">
                  <AnimatedNumber value={b.mw} format={{ maximumFractionDigits: 1, minimumFractionDigits: 1 }} />
                </span>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </Widget>
  );
}
