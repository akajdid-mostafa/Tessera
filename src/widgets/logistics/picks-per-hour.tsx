import { BoxMultiple20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const TARGET = 1200;
const MAX = 1500;
const DONE = [
  { h: 6, v: 980 },
  { h: 7, v: 1240 },
  { h: 8, v: 1312 },
  { h: 9, v: 1105 },
  { h: 10, v: 1268 },
  { h: 11, v: 1186 },
  { h: 12, v: 1334 },
];
const LIVE_HOUR = 13;
const TICK_MS = 2000;
const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

/** Logistics · medium. Picks per hour against a dashed target; the live hour's bar grows, hover any bar to read it. */
export function PicksPerHourWidget({ index }: { index?: number }) {
  const [live, setLive] = useState({ v: 642, min: 32 });
  const [hover, setHover] = useState<number | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      setLive((l) =>
        l.min >= 59.5
          ? { v: 612, min: 30 }
          : { v: l.v + 7 + Math.round(Math.random() * 6), min: l.min + 0.5 },
      );
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, []);

  const bars = [...DONE, { h: LIVE_HOUR, v: live.v }];
  const liveIdx = bars.length - 1;
  const at = hover ?? liveIdx;
  const isLive = at === liveIdx;
  const value = bars[at].v;
  const pace = isLive ? value / (live.min / 60) : value;
  const vsTarget = pace / TARGET - 1;
  const ok = vsTarget >= 0;

  return (
    <Widget size="medium" index={index} label="Picks per hour">
      <WidgetHeader
        icon={<BoxMultiple20Filled />}
        tint="var(--ios-orange)"
        title="Picks per Hour"
        subtitle="Joliet DC · Shift A 06–14"
        extra={
          <span className="flex items-center gap-1.5 whitespace-nowrap pt-1 text-[11px] text-tertiary">
            <svg width="14" height="2" aria-hidden className="overflow-visible">
              <line x1="0" y1="1" x2="14" y2="1" strokeWidth="1.5" strokeDasharray="3 2" className="stroke-[var(--ant-color-text-tertiary)]" />
            </svg>
            Target 1.2k
          </span>
        }
      />

      <div className="mt-2 flex min-h-0 flex-1 gap-3">
        <div className="flex w-[94px] shrink-0 flex-col whitespace-nowrap leading-tight">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={isLive ? "live" : at}
              initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(3px)" }}
              className="flex items-center gap-1 text-[11px] text-tertiary tabular"
            >
              {isLive ? (
                <>
                  <span className="size-1.5 animate-pulse rounded-full bg-ios-orange" />
                  This hour
                </>
              ) : (
                `${hh(bars[at].h)}–${hh(bars[at].h + 1)}`
              )}
            </motion.div>
          </AnimatePresence>
          <AnimatedNumber
            value={value}
            className="mt-0.5 text-[28px] leading-none font-semibold tracking-tight text-heading"
          />
          <div className="mt-1 text-[11px] text-tertiary">
            {isLive ? (
              <>
                pace <AnimatedNumber value={Math.round(pace)} className="font-medium text-secondary" />/h
              </>
            ) : (
              "picks"
            )}
          </div>
          <span
            className={cn(
              "mt-auto inline-flex w-fit items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold transition-colors duration-mid",
              ok ? "bg-ios-green/15 text-ios-green" : "bg-ios-orange/15 text-ios-orange",
            )}
          >
            <AnimatedNumber
              value={vsTarget}
              format={{ style: "percent", maximumFractionDigits: 1, signDisplay: "always" }}
            />
            <span className="ml-1 font-medium opacity-80">vs target</span>
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col" onMouseLeave={() => setHover(null)}>
          <div className="relative flex-1">
            <div
              className="pointer-events-none absolute inset-x-0 border-t-[1.5px] border-dashed border-[var(--ant-color-text-tertiary)]"
              style={{ bottom: `${(TARGET / MAX) * 100}%` }}
            />
            <div className="absolute inset-0 flex items-end gap-1.5">
              {bars.map((b, i) => {
                const current = i === liveIdx;
                const active = i === at;
                const met = b.v >= TARGET;
                return (
                  <button
                    key={b.h}
                    type="button"
                    aria-label={`${hh(b.h)}: ${b.v} picks`}
                    onMouseEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    className="relative flex h-full flex-1 cursor-pointer items-end outline-none"
                  >
                    <motion.span
                      className={cn(
                        "relative w-full overflow-hidden rounded-[5px] transition-opacity duration-mid",
                        met || current ? "bg-ios-orange" : "bg-ios-orange/45",
                        hover !== null && !active && "opacity-40",
                      )}
                      initial={{ height: 0 }}
                      animate={{ height: `${(Math.min(b.v, MAX) / MAX) * 100}%` }}
                      transition={{
                        type: "spring",
                        stiffness: current ? 120 : 200,
                        damping: 20,
                        delay: current && live.min > 32 ? 0 : delay + i * 0.04,
                      }}
                    >
                      {current ? (
                        <motion.span
                          aria-hidden
                          className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.28)_0_4px,transparent_4px_8px)]"
                          animate={{ backgroundPositionX: ["0px", "11.3px"] }}
                          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                        />
                      ) : null}
                    </motion.span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-1 flex gap-1.5 text-[10px] text-tertiary tabular">
            {bars.map((b, i) => (
              <span
                key={b.h}
                className={cn("flex-1 text-center", i === at && "font-semibold text-secondary")}
              >
                {i === liveIdx ? "Now" : String(b.h).padStart(2, "0")}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Widget>
  );
}
