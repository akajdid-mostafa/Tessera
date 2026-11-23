import { BinRecycle20Filled, Dismiss16Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Bin = { id: string; name: string; street: string; fill: number; rate: number };
/** rate: fill % gained per hour from the sensor's recent trend. */
const BINS: Bin[] = [
  { id: "pier", name: "Pier", street: "Ferry Pier", fill: 66, rate: 3.2 },
  { id: "market", name: "Market", street: "Market St", fill: 84, rate: 2.4 },
  { id: "park", name: "Park", street: "Gilman Park gate", fill: 41, rate: 1.6 },
  { id: "school", name: "School", street: "School Lane", fill: 77, rate: 2.8 },
  { id: "ferry", name: "Quay", street: "Quay Square", fill: 98, rate: 1.4 },
  { id: "square", name: "Plaza", street: "Old Plaza", fill: 23, rate: 2.0 },
];
const DUE = 80;
const TICK_MS = 2600;
const COLLECT_MS = 2400;
type Phase = "idle" | "planned" | "running";

const tone = (f: number) => (f >= 100 ? "red" : f >= DUE ? "orange" : "calm");
const FILL = { red: "var(--ios-red)", orange: "var(--ios-orange)", calm: "var(--ios-teal)" } as const;

/** One bin: a can whose liquid level rises with its fill. */
function BinGlyph({ fill, uid, delay }: { fill: number; uid: string; delay: number }) {
  const level = Math.min(1, fill / 100);
  const top = 50 - level * 38;
  return (
    <svg viewBox="0 0 40 52" className="h-[46px] w-[36px] overflow-visible" aria-hidden>
      <defs>
        <clipPath id={uid}>
          <path d="M7 12 H33 L30.5 49 Q30.3 50.5 28.8 50.5 H11.2 Q9.7 50.5 9.5 49 Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid})`}>
        <rect x="0" y="0" width="40" height="52" className="fill-fill-quaternary" />
        <motion.rect
          x="0"
          width="40"
          height="52"
          initial={{ y: 52, fill: FILL[tone(fill)] }}
          animate={{ y: top, fill: FILL[tone(fill)] }}
          transition={{ y: { type: "spring", stiffness: 90, damping: 18, delay }, fill: { duration: 0.4 } }}
          opacity="0.75"
        />
      </g>
      <path
        d="M7 12 H33 L30.5 49 Q30.3 50.5 28.8 50.5 H11.2 Q9.7 50.5 9.5 49 Z"
        fill="none"
        strokeWidth="1.5"
        className="stroke-[var(--ant-color-text-tertiary)]"
      />
      {[15, 20, 25].map((x) => (
        <line key={x} x1={x} x2={x} y1="18" y2="45" strokeWidth="1" className="stroke-[var(--ant-color-text-tertiary)]" opacity="0.35" />
      ))}
      <rect x="4" y="6" width="32" height="4.5" rx="2" className="fill-[var(--ant-color-text-tertiary)]" />
      <rect x="16" y="2.5" width="8" height="3.5" rx="1.5" className="fill-[var(--ant-color-text-tertiary)]" />
    </svg>
  );
}

/** Smart city · medium. Six street bins whose levels rise live, overflowing ones wiggling; plan a route for the ones past 80 %, dispatch the truck and watch them empty in order. */
export function WasteBinsWidget({ index }: { index?: number }) {
  const uid = `wb${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [fill, setFill] = useState(() => BINS.map((b) => b.fill));
  const [phase, setPhase] = useState<Phase>("idle");
  const [route, setRoute] = useState<number[]>([]);
  const [served, setServed] = useState(0);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      setFill((f) => f.map((v, i) => Math.min(104, Math.round((v + (BINS[i].rate / 6) * (0.5 + Math.random())) * 10) / 10)));
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, []);

  // The truck works the route in order, one bin per step.
  useEffect(() => {
    if (phase !== "running") return;
    if (served >= route.length) {
      const t = window.setTimeout(() => {
        setPhase("idle");
        setRoute([]);
        setServed(0);
      }, 1600);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => {
      const bin = route[served];
      setFill((f) => f.map((v, i) => (i === bin ? 3 : v)));
      setServed((n) => n + 1);
    }, COLLECT_MS);
    return () => window.clearTimeout(t);
  }, [phase, served, route]);

  const due = fill.map((f, i) => (f >= DUE ? i : -1)).filter((i) => i >= 0);
  const km = 1.1 + route.length * 0.9;

  const plan = () => {
    // Bins are numbered in street order along the run.
    setRoute([...due].sort((a, b) => a - b));
    setPhase("planned");
  };

  return (
    <Widget size="medium" index={index} label="Waste bin fill levels">
      <WidgetHeader
        icon={<BinRecycle20Filled />}
        tint="var(--ios-green)"
        title="Waste Bins"
        subtitle={`Ballard district · collect at ${DUE}%`}
        extra={
          due.length ? (
            <span className="whitespace-nowrap rounded-full bg-ios-orange/15 px-2 py-0.5 text-[11px] font-semibold text-ios-orange">
              <AnimatedNumber value={due.length} /> due
            </span>
          ) : (
            <span className="whitespace-nowrap rounded-full bg-fill-tertiary px-2 py-0.5 text-[11px] font-semibold text-secondary">All clear</span>
          )
        }
      />

      <div className="mt-2 flex justify-between">
        {BINS.map((b, i) => {
          const f = fill[i];
          const t = tone(f);
          const stop = route.indexOf(i);
          const hoursLeft = Math.max(0, (100 - f) / b.rate);
          return (
            <Tooltip
              key={b.id}
              title={`${b.street} · ${Math.round(f)}% · ${f >= 100 ? "overflowing" : `full in ~${hoursLeft < 1 ? "<1" : Math.round(hoursLeft)} h`}`}
            >
              <div className="flex w-[56px] cursor-default flex-col items-center">
                <motion.div
                  className="relative"
                  animate={t === "red" ? { rotate: [0, -5, 5, -4, 4, 0] } : { rotate: 0 }}
                  transition={t === "red" ? { duration: 0.6, repeat: Infinity, repeatDelay: 1.4 } : { duration: 0.2 }}
                  whileHover={{ y: -2 }}
                  style={{ transformOrigin: "50% 100%" }}
                >
                  <BinGlyph fill={f} uid={`${uid}-${i}`} delay={delay + i * 0.06} />
                  <AnimatePresence>
                    {stop >= 0 && stop >= served ? (
                      <motion.span
                        key="n"
                        className="absolute -right-2 -top-1 grid size-4 place-items-center rounded-full bg-ios-blue text-[10px] font-bold text-white ring-2 ring-[var(--widget-surface)]"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 22, delay: phase === "planned" ? stop * 0.08 : 0 }}
                      >
                        {stop + 1}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
                <span
                  className={cn(
                    "mt-1 text-[12px] leading-tight font-semibold tabular",
                    t === "red" ? "text-ios-red" : t === "orange" ? "text-ios-orange" : "text-heading",
                  )}
                >
                  <AnimatedNumber value={Math.min(100, Math.round(f))} suffix="%" />
                </span>
                <span className="text-[10px] leading-tight text-tertiary">{b.name}</span>
              </div>
            </Tooltip>
          );
        })}
      </div>

      <div className="mt-auto flex h-7 items-center gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex min-w-0 flex-1 items-center gap-1.5 text-[11px] text-tertiary tabular"
          >
            {phase === "running" ? (
              <>
                <MemojiAvatar who="m6" size={20} alt="Truck 07 driver" />
                <span className="truncate">
                  Truck 07 · {served >= route.length ? "route done" : `stop ${served + 1} of ${route.length}`}
                </span>
              </>
            ) : phase === "planned" ? (
              <span className="truncate">
                {route.length} stops · {km.toFixed(1)} km · 38% shorter
              </span>
            ) : (
              <span className="truncate">Fixed round · Thu 06:00</span>
            )}
          </motion.div>
        </AnimatePresence>
        {phase === "planned" ? (
          <>
            <Button
              size="small"
              shape="circle"
              variant="filled"
              color="default"
              icon={<Dismiss16Regular />}
              aria-label="Discard route"
              onClick={() => {
                setPhase("idle");
                setRoute([]);
              }}
            />
            <Button size="small" type="primary" onClick={() => setPhase("running")}>
              Dispatch truck
            </Button>
          </>
        ) : phase === "running" ? (
          <span className="flex h-6 items-center gap-1.5 rounded-md bg-ios-blue/15 px-2 text-[11px] font-semibold text-ios-blue">
            <span className="size-1.5 animate-pulse rounded-full bg-ios-blue" />
            Collecting
          </span>
        ) : (
          <Button size="small" type="primary" disabled={!due.length} onClick={plan}>
            Plan route · {due.length}
          </Button>
        )}
      </div>
    </Widget>
  );
}
