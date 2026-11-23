import { PeopleQueue20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { PageDots, useInterval } from "./_parts";

type Checkpoint = { id: string; name: string; wait: number; lo: number; hi: number; lanes: number; open: number; rate: number };

const TARGET = 15; // min, service level for the 95th percentile passenger
const POINTS: Checkpoint[] = [
  { id: "central", name: "T2 · Central Search", wait: 19, lo: 16, hi: 22, lanes: 9, open: 6, rate: 1140 },
  { id: "north", name: "T2 · North Search", wait: 7, lo: 5, hi: 9, lanes: 6, open: 4, rate: 620 },
  { id: "fast", name: "T2 · Fast Track", wait: 3, lo: 2, hi: 4, lanes: 2, open: 2, rate: 210 },
];

/** The serpentine of belt barriers, walked from the top-left entry to the lanes at bottom right. */
const QUEUE: [number, number][] = [
  [4, 6],
  [126, 6],
  [126, 20],
  [10, 20],
  [10, 34],
  [132, 34],
];
const QUEUE_D = QUEUE.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
const SEGS = QUEUE.slice(1).map(([x, y], i) => Math.hypot(x - QUEUE[i][0], y - QUEUE[i][1]));
const LEN = SEGS.reduce((a, b) => a + b, 0);

function pointAt(t: number): [number, number] {
  let d = t * LEN;
  for (let i = 0; i < SEGS.length; i++) {
    if (d <= SEGS[i]) {
      const k = d / SEGS[i];
      return [QUEUE[i][0] + (QUEUE[i + 1][0] - QUEUE[i][0]) * k, QUEUE[i][1] + (QUEUE[i + 1][1] - QUEUE[i][1]) * k];
    }
    d -= SEGS[i];
  }
  return QUEUE[QUEUE.length - 1];
}

/** Airport · small. A checkpoint's wait against the 15-minute target, with passengers walking the belt-barrier serpentine to the lanes; tap to page through checkpoints. */
export function SecurityQueueWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [page, setPage] = useState(0);
  const [waits, setWaits] = useState(() => POINTS.map((p) => p.wait));

  useInterval(() => {
    setWaits((ws) => ws.map((w, i) => Math.min(POINTS[i].hi, Math.max(POINTS[i].lo, w + Math.round((Math.random() - 0.5) * 2.4)))));
  }, 3400);

  const cp = POINTS[page];
  const wait = waits[page];
  const over = wait > TARGET;
  // The queue fills the serpentine back from the lanes in proportion to the base wait.
  const fill = Math.min(1, 0.18 + cp.wait / 24);
  const people = Math.round(4 + cp.wait * 1.1);
  const dur = 7 + cp.wait * 0.5;

  return (
    <Widget
      size="small"
      index={index}
      pressable
      onPress={() => setPage((p) => (p + 1) % POINTS.length)}
      label="Security queue, tap for next checkpoint"
    >
      <WidgetHeader
        icon={<PeopleQueue20Filled />}
        tint={over ? "var(--ios-orange)" : "var(--ios-blue)"}
        title="Security"
        subtitle={cp.name}
        extra={<div className="pt-1.5"><PageDots count={POINTS.length} active={page} /></div>}
      />

      <div className="mt-2 flex items-baseline-last justify-between whitespace-nowrap">
        <div className="flex items-baseline gap-1 leading-none">
          <span className={cn("text-[32px] font-semibold tracking-tight", over ? "text-ios-orange" : "text-heading")}>
            <AnimatedNumber value={wait} />
          </span>
          <span className="text-[13px] font-medium text-tertiary">min</span>
        </div>
        <div className="pb-0.5 text-right text-[11px] leading-tight text-tertiary">
          <div>
            <span className="font-semibold text-secondary tabular">
              {cp.open}/{cp.lanes}
            </span>{" "}
            lanes
          </div>
          <div className="tabular">
            <AnimatedNumber value={cp.rate} /> pax/h
          </div>
        </div>
      </div>
      <div className={cn("mt-1 truncate text-[11px] tabular", over ? "font-medium text-ios-orange" : "text-tertiary")}>
        {over ? `${wait - TARGET} min over the ${TARGET} min target` : `Within ${TARGET} min target`}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.svg
          key={cp.id}
          viewBox="0 0 164 42"
          className="mt-auto h-[42px] w-full overflow-visible"
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Belt barriers between the rows, posts at the ends. */}
          {[
            [4, 120, 13],
            [16, 132, 27],
          ].map(([a, b, y]) => (
            <g key={y}>
              <line x1={a} x2={b} y1={y} y2={y} strokeWidth="1" className="stroke-fill" />
              {[a, b].map((x) => (
                <circle key={x} cx={x} cy={y} r="1.6" className="fill-tertiary" />
              ))}
            </g>
          ))}
          {/* Lanes: four scanner arches, the last one closed. */}
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={140 + (i % 2) * 12}
              y={i < 2 ? 22 : 33}
              width="8"
              height="8"
              rx="1.5"
              strokeWidth="1.2"
              className={cn("fill-none", cp.open < 3 && i > 1 ? "stroke-fill" : "stroke-secondary")}
            />
          ))}
          <path d={QUEUE_D} fill="none" strokeWidth="5" strokeLinejoin="round" className="stroke-fill-quaternary" />
          {Array.from({ length: people }, (_, i) => {
            const start = 1 - fill;
            if (reduce) {
              const [x, y] = pointAt(start + (fill * i) / people);
              return <circle key={i} cx={x} cy={y} r="2" className="fill-secondary" />;
            }
            return (
              <circle key={i} r="2" className={i % 7 === 3 ? "fill-heading" : "fill-secondary"}>
                <animateMotion
                  path={QUEUE_D}
                  dur={`${dur}s`}
                  begin={`${-(dur * i) / people}s`}
                  repeatCount="indefinite"
                  keyPoints={`${start.toFixed(3)};1`}
                  keyTimes="0;1"
                  calcMode="linear"
                />
              </circle>
            );
          })}
        </motion.svg>
      </AnimatePresence>
    </Widget>
  );
}
