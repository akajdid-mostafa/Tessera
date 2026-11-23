import { PeopleTeam20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { enterDelay, hhmm, useInterval } from "./_parts";

const START = 12 * 60; // first slot, 12:00
const SLOT = 15;
const NOW = 8; // 14:00
const LANE_RATE = 190; // pax/h through one lane
const OPEN = 6;
const LANES = 9;
const CAP = OPEN * LANE_RATE; // 1,140
const MAX = LANES * LANE_RATE; // 1,710
const TOP = 1_800;

/** Show-up profile at the checkpoint, pax/h per 15-minute slot: the afternoon long-haul bank peaks at 16:15. */
const BASE = [
  610, 680, 720, 790, 860, 910, 880, 940, 1010, 1060, 1120, 1180, 1240, 1310, 1350, 1390, 1420, 1360, 1270, 1150, 1040, 960, 900, 840,
];

/** Airport · medium. Checkpoint show-ups per 15 minutes against open-lane and full capacity: bars rise on entry, slots over capacity turn orange, the current slot fills live, and scrubbing reads any slot. */
export function PaxFlowWidget({ index }: { index?: number }) {
  const [data, setData] = useState(BASE);
  const [hover, setHover] = useState<number | null>(null);
  const delay = enterDelay(index);

  useInterval(() => {
    setData((d) =>
      d.map((v, i) => (i === NOW ? Math.round(BASE[i] + (Math.random() - 0.35) * 70) : i > NOW ? Math.round(BASE[i] + (Math.random() - 0.5) * 40) : v)),
    );
  }, 3000);

  const sel = hover ?? NOW;
  const v = data[sel];
  const over = v - CAP;
  const peak = data.reduce((m, x, i) => (x > data[m] ? i : m), 0);
  const overSlots = data.filter((x, i) => i >= NOW && x > CAP).length;
  const y = (n: number) => `${(n / TOP) * 100}%`;

  return (
    <Widget size="medium" index={index} label="Passenger flow forecast">
      <WidgetHeader
        icon={<PeopleTeam20Filled />}
        tint={overSlots ? "var(--ios-orange)" : "var(--ios-blue)"}
        title="Passenger Flow"
        subtitle={`Central Search · peak ${hhmm(START + peak * SLOT)}`}
        extra={
          overSlots ? (
            <span className="rounded-full bg-ios-orange/15 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-ios-orange tabular">
              {overSlots * SLOT} min over cap
            </span>
          ) : null
        }
      />

      <div className="mt-auto flex h-[122px] gap-3">
        {/* Reading for the slot under the pointer, or now. */}
        <div className="flex w-[108px] shrink-0 flex-col whitespace-nowrap">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={sel === NOW ? "now" : "f"}
              className="text-[11px] text-tertiary tabular"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
            >
              {hhmm(START + sel * SLOT)} · {sel < NOW ? "actual" : sel === NOW ? "now" : "forecast"}
            </motion.div>
          </AnimatePresence>
          <div className="mt-1 flex items-baseline gap-1 leading-none">
            <span className={cn("text-[28px] font-semibold tracking-tight", over > 0 ? "text-ios-orange" : "text-heading")}>
              <AnimatedNumber value={v} />
            </span>
            <span className="text-[11px] font-medium text-tertiary">pax/h</span>
          </div>
          <div className={cn("mt-1 text-[11px]", over > 0 ? "font-medium text-ios-orange" : "text-tertiary")}>
            {over > 0 ? (
              <>
                +<AnimatedNumber value={over} /> over open lanes
              </>
            ) : (
              <>
                <AnimatedNumber value={-over} /> spare
              </>
            )}
          </div>

          <div className="mt-auto flex flex-col gap-1 text-[10px] leading-tight text-tertiary tabular">
            <span className="flex items-center gap-1.5">
              <span className="w-3 border-t-[1.5px] border-dashed border-[var(--ios-orange)]" />
              {OPEN} lanes · 1,140
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 border-t border-dashed border-[var(--ant-color-text-tertiary)]" />
              All {LANES} · 1,710
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div
            className="relative min-h-0 flex-1 cursor-crosshair touch-none"
            onPointerMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setHover(Math.max(0, Math.min(data.length - 1, Math.floor(((e.clientX - r.left) / r.width) * data.length))));
            }}
            onPointerLeave={() => setHover(null)}
          >
            <div className="absolute inset-x-0 border-t border-dashed border-[var(--ant-color-text-tertiary)] opacity-70" style={{ bottom: y(MAX) }} />
            <div className="absolute inset-x-0 border-t-[1.5px] border-dashed border-[var(--ios-orange)]" style={{ bottom: y(CAP) }} />
            <div className="absolute inset-0 flex items-end gap-[3px]">
              {data.map((n, i) => {
                const hot = n > CAP;
                const past = i < NOW;
                const active = i === sel;
                return (
                  <motion.div
                    key={i}
                    className="relative flex-1 origin-bottom rounded-t-[3px]"
                    style={{
                      background: hot ? "var(--ios-orange)" : past || i === NOW ? "var(--ant-color-text-tertiary)" : "var(--ant-color-fill)",
                    }}
                    initial={{ scaleY: 0, height: y(n) }}
                    animate={{ scaleY: 1, height: y(n), opacity: active ? 1 : hot && !past ? 0.55 : past ? 0.75 : 0.9 }}
                    transition={{
                      scaleY: { type: "spring", stiffness: 220, damping: 24, delay: delay + i * 0.02 },
                      height: { type: "spring", stiffness: 200, damping: 26 },
                      opacity: { duration: 0.2 },
                    }}
                  >
                    {i === NOW ? <span className="absolute -top-2.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-ios-blue ring-2 ring-[var(--widget-surface)]" /> : null}
                  </motion.div>
                );
              })}
            </div>
            {hover !== null ? (
              <div
                className="pointer-events-none absolute inset-y-0 w-px bg-[var(--ant-color-text-secondary)] opacity-60"
                style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}
              />
            ) : null}
          </div>
          <div className="relative mt-1 h-3 text-[10px] leading-3 text-tertiary tabular">
            {[0, 8, 16, 23].map((i) => (
              <span
                key={i}
                className={cn("absolute", i === 0 ? "" : i === 23 ? "-translate-x-full" : "-translate-x-1/2")}
                style={{ left: i === 23 ? "100%" : `${(i / data.length) * 100}%` }}
              >
                {hhmm(START + i * SLOT + (i === 23 ? SLOT : 0))}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Widget>
  );
}
