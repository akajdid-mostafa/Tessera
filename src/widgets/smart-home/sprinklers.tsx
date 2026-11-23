import { ArrowCounterclockwise16Regular, Checkmark16Regular, Next16Filled, Pause16Filled, Play16Filled, Water20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

/* This morning's program from 05:00, in minutes. Flow per zone in gallons per minute. */
const ZONES = [
  { id: "front", name: "Front Lawn", short: "Front", kind: "Spray heads", start: 0, min: 12, gpm: 9.5 },
  { id: "back", name: "Back Lawn", short: "Back", kind: "Rotors", start: 12, min: 18, gpm: 11.2 },
  { id: "drip", name: "Garden Drip", short: "Drip", kind: "Drip line", start: 30, min: 30, gpm: 1.8 },
  { id: "side", name: "Side Beds", short: "Side", kind: "Bubblers", start: 60, min: 8, gpm: 6.4 },
];
const END = 68 * 60;
const SPAN = 80;
const START_S = 16 * 60 + 18;
const pos = (min: number) => (min / SPAN) * 100;
const hhmm = (min: number) => `${5 + Math.floor(min / 60)}:${String(Math.round(min % 60)).padStart(2, "0")}`;

/** Smart home · medium. This morning's sprinkler program on a 05:00–06:20 strip with done, running and queued zones, a moving NOW line and water used ticking up; pause, skip a zone or tap a block to preview it. */
export function SprinklersWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [t, setT] = useState(START_S);
  const [paused, setPaused] = useState(false);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [watered, setWatered] = useState<number[]>([720, START_S - 720, 0, 0]);
  const [preview, setPreview] = useState<number | null>(null);

  const done = t >= END;
  const zi = done ? -1 : ZONES.findIndex((z) => t < (z.start + z.min) * 60);

  useEffect(() => {
    if (paused || done) return;
    const id = window.setInterval(() => {
      setT((v) => v + 1);
      setWatered((w) => w.map((s, i) => (i === zi ? s + 1 : s)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [paused, done, zi]);

  useEffect(() => {
    if (preview === null) return;
    const id = window.setTimeout(() => setPreview(null), 4000);
    return () => window.clearTimeout(id);
  }, [preview]);

  const skip = () => {
    if (done) {
      setT(0);
      setSkipped([]);
      setWatered([0, 0, 0, 0]);
      setPaused(false);
      return;
    }
    const z = ZONES[zi];
    setSkipped((s) => [...s, z.id]);
    setT((z.start + z.min) * 60);
  };

  const gallons = Math.round(watered.reduce((a, s, i) => a + (s / 60) * ZONES[i].gpm, 0));
  const shownI = preview ?? zi;
  const z = shownI >= 0 ? ZONES[shownI] : null;
  const left = zi >= 0 ? (ZONES[zi].start + ZONES[zi].min) * 60 - t : 0;
  const nowMin = t / 60;

  const subtitle = done
    ? "Done · next run Wed 05:00"
    : `${paused ? "Paused" : "Running"} · zone ${zi + 1} of ${ZONES.length}`;

  return (
    <Widget size="medium" index={index} label="Sprinklers">
      <WidgetHeader
        icon={<Water20Filled />}
        tint={done ? "var(--ios-green)" : paused ? "var(--ios-orange)" : "var(--ios-teal)"}
        title="Sprinklers"
        subtitle={subtitle}
        extra={
          <div className="flex shrink-0 gap-1.5">
            <Button
              size="small"
              shape="circle"
              variant="filled"
              color="default"
              disabled={done}
              aria-label={paused ? "Resume" : "Pause"}
              icon={paused ? <Play16Filled /> : <Pause16Filled />}
              onClick={() => setPaused((p) => !p)}
            />
            <Button
              size="small"
              shape="circle"
              variant="filled"
              color="default"
              aria-label={done ? "Run again" : "Skip zone"}
              icon={done ? <ArrowCounterclockwise16Regular /> : <Next16Filled />}
              onClick={skip}
            />
          </div>
        }
      />

      <div className="mt-2 flex items-end justify-between gap-3 whitespace-nowrap">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={z ? `${z.id}-${preview === null}` : "done"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="min-w-0 leading-tight"
          >
            <div className="truncate text-[15px] font-semibold text-heading">{z ? z.name : "All zones watered"}</div>
            <div className="truncate text-[11px] text-tertiary tabular">
              {z
                ? preview !== null
                  ? `${hhmm(z.start)}–${hhmm(z.start + z.min)} · ${z.min} min · ${Math.round(z.min * z.gpm)} gal planned`
                  : `${z.kind} · ${z.gpm} gal/min`
                : "Next run Wed 05:00 · 4 zones"}
            </div>
          </motion.div>
        </AnimatePresence>
        {!done && preview === null ? (
          <div className="flex items-baseline gap-1 leading-none">
            <span className="text-[26px] font-semibold tracking-tight text-heading tabular">
              <AnimatedNumber value={Math.floor(left / 60)} />:
              <AnimatedNumber value={left % 60} format={{ minimumIntegerDigits: 2 }} />
            </span>
            <span className="text-[11px] text-tertiary">left</span>
          </div>
        ) : null}
      </div>

      <div className="relative mt-auto h-[28px] rounded-md bg-fill-tertiary">
        {ZONES.map((zone, i) => {
          const isSkipped = skipped.includes(zone.id);
          const state = done || i < zi ? (isSkipped ? "skipped" : "done") : i === zi ? "running" : "queued";
          const runFrac = state === "running" ? (t - zone.start * 60) / (zone.min * 60) : 0;
          return (
            <motion.button
              key={zone.id}
              type="button"
              onClick={() => setPreview((p) => (p === i ? null : i))}
              className={cn(
                "@container absolute inset-y-0.5 cursor-pointer overflow-hidden rounded-[5px] outline-none",
                state === "queued" && "bg-fill-secondary",
                state === "done" && "bg-ios-teal/30",
                state === "skipped" && "bg-[repeating-linear-gradient(135deg,var(--ant-color-fill-secondary)_0_4px,transparent_4px_8px)]",
                state === "running" && "bg-ios-teal/20",
                preview === i && "ring-1 ring-ios-teal",
              )}
              style={{ left: `calc(${pos(zone.start)}% + 1px)`, width: `calc(${pos(zone.min)}% - 2px)`, transformOrigin: "left" }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              whileTap={{ scale: 0.94 }}
              transition={{ delay: delay + i * 0.08, type: "spring", stiffness: 220, damping: 24 }}
            >
              {state === "running" ? (
                <motion.span
                  className="absolute inset-y-0 left-0 bg-[repeating-linear-gradient(120deg,var(--ios-teal)_0_6px,color-mix(in_srgb,var(--ios-teal)_70%,transparent)_6px_12px)] bg-[length:28px_100%]"
                  style={{ width: `${runFrac * 100}%` }}
                  animate={paused ? { backgroundPositionX: "0px" } : { backgroundPositionX: ["0px", "28px"] }}
                  transition={paused ? { duration: 0 } : { duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
              ) : null}
              <span
                className={cn(
                  "relative flex h-full items-center justify-center gap-0.5 px-1 text-[10px] font-semibold whitespace-nowrap",
                  state === "running" ? "text-heading" : state === "done" ? "text-ios-teal" : "text-tertiary",
                )}
              >
                {state === "done" ? <Checkmark16Regular className="shrink-0 text-[11px]" /> : null}
                <span className={cn("hidden", state === "done" ? "@[52px]:inline" : "@[40px]:inline")}>{state === "skipped" ? "Skip" : zone.short}</span>
              </span>
            </motion.button>
          );
        })}
        {!done ? (
          <motion.span
            className="pointer-events-none absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-[var(--ant-color-text)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, left: `${pos(nowMin)}%` }}
            transition={{ opacity: { delay: delay + 0.5 }, left: { type: "tween", duration: 0.9, ease: "linear" } }}
          />
        ) : null}
      </div>

      <div className="relative mt-1 h-3 text-[10px] leading-none text-tertiary tabular">
        {[0, 20, 40, 60, 80].map((m, i, a) => (
          <span
            key={m}
            className={cn("absolute", i === 0 ? "left-0" : i === a.length - 1 ? "right-0" : "-translate-x-1/2")}
            style={i === 0 || i === a.length - 1 ? undefined : { left: `${pos(m)}%` }}
          >
            {hhmm(m)}
          </span>
        ))}
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[11px] whitespace-nowrap text-tertiary tabular">
        <span>
          Used <AnimatedNumber value={gallons} className="font-semibold text-secondary" /> gal
        </span>
        <span>Thu skipped · rain 0.4 in</span>
      </div>
    </Widget>
  );
}
