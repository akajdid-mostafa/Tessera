import { Heart20Filled, Pause16Filled, Play16Filled, Run20Filled, Stop16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

type Phase = "idle" | "countdown" | "running" | "paused";

const MAX_HR = 190;
const ZONES = [
  { z: 1, name: "Recovery", lo: 0.5, color: "var(--ios-teal)", text: "text-ios-teal" },
  { z: 2, name: "Endurance", lo: 0.6, color: "var(--ios-blue)", text: "text-ios-blue" },
  { z: 3, name: "Tempo", lo: 0.7, color: "var(--ios-green)", text: "text-ios-green" },
  { z: 4, name: "Threshold", lo: 0.8, color: "var(--ios-orange)", text: "text-ios-orange" },
  { z: 5, name: "VO₂ max", lo: 0.9, color: "var(--ios-red)", text: "text-ios-red" },
] as const;
/* The zone bar spans 50–100 % of max HR; anything under sits at its left edge. */
const zoneOf = (bpm: number) => {
  const f = bpm / MAX_HR;
  let z = -1;
  ZONES.forEach((x, i) => {
    if (f >= x.lo) z = i;
  });
  return z;
};
const markerAt = (bpm: number) => Math.min(1, Math.max(0, (bpm / MAX_HR - 0.5) / 0.5));

/* Saturday's 42-minute easy run, in seconds per zone. */
const LAST = [240, 1500, 660, 120, 0];
const LAST_STATS = { km: 7.62, kcal: 498, secs: 2520 };
const TWO = { minimumIntegerDigits: 2 } as const;

/** Fitness · large. Start an outdoor run and the timer, heart rate, zone marker and time-in-zone bars go live; pause or end it. */
export function LiveWorkoutWidget({ index }: { index?: number }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(3);
  const [secs, setSecs] = useState(0);
  const [bpm, setBpm] = useState(66);
  const [km, setKm] = useState(0);
  const [kcal, setKcal] = useState(0);
  const [inZone, setInZone] = useState<number[]>(LAST);
  const [fresh, setFresh] = useState(false);
  const tRef = useRef(0);
  const bpmRef = useRef(66);
  const delay = 0.3 + (index ?? 0) * 0.06;

  // Countdown 3 · 2 · 1, then go.
  useEffect(() => {
    if (phase !== "countdown") return;
    if (count === 0) {
      setPhase("running");
      return;
    }
    const t = window.setTimeout(() => setCount((c) => c - 1), 700);
    return () => window.clearTimeout(t);
  }, [phase, count]);

  // Resting heart rate wanders while idle or paused; the run drives it up through the zones.
  useEffect(() => {
    const t = window.setInterval(() => {
      const b = bpmRef.current;
      let next: number;
      if (phase === "running") {
        tRef.current += 1;
        const s = tRef.current;
        const target = s < 90 ? 98 + s * 0.55 : 147 + 11 * Math.sin(s / 24) + (s % 47 > 40 ? 12 : 0);
        next = Math.round(b + (target - b) * 0.35 + (Math.random() - 0.5) * 3);
        const z = zoneOf(next);
        setSecs((x) => x + 1);
        setKm((k) => k + 1 / 332);
        setKcal((c) => c + 0.19);
        if (z >= 0) setInZone((arr) => arr.map((v, i) => (i === z ? v + 1 : v)));
      } else {
        const rest = phase === "paused" ? 118 : 66;
        next = Math.round(b + (rest - b) * 0.2 + (Math.random() - 0.5) * 4);
      }
      bpmRef.current = next;
      setBpm(next);
    }, 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  const start = () => {
    tRef.current = 0;
    setSecs(0);
    setKm(0);
    setKcal(0);
    setInZone([0, 0, 0, 0, 0]);
    setFresh(true);
    setCount(3);
    setPhase("countdown");
  };

  const live = phase === "running" || phase === "paused";
  const zone = zoneOf(bpm);
  const zMeta = zone >= 0 ? ZONES[zone] : null;
  const shownSecs = live ? secs : fresh ? secs : LAST_STATS.secs;
  const shownKm = live || fresh ? km : LAST_STATS.km;
  const shownKcal = live || fresh ? kcal : LAST_STATS.kcal;
  const pace = shownKm > 0.02 ? shownSecs / shownKm : 0;
  const zoneMax = Math.max(60, ...inZone);
  const beat = 60 / bpm;

  return (
    <Widget
      size="large"
      index={index}
      label="Live workout"
      glow={{ mode: "pulse", colors: ["#30D158", "#FF9F0A", "#30D158"], blur: 20, duration: 2.6 }}
      glowActive={phase === "running"}
    >
      <WidgetHeader
        icon={<Run20Filled />}
        tint="var(--ios-green)"
        title="Outdoor Run"
        subtitle={
          phase === "running"
            ? `Live · Zone ${zMeta?.z ?? 1} ${zMeta?.name ?? "Recovery"}`
            : phase === "paused"
              ? "Paused · GPS holding"
              : phase === "countdown"
                ? "Starting…"
                : fresh
                  ? "Saved · just now"
                  : "Ready · GPS locked · last run Sat"
        }
        extra={
          phase === "running" ? (
            <span className="flex items-center gap-1.5 rounded-full bg-ios-red/15 px-2 py-0.5 text-[11px] font-semibold text-ios-red">
              <motion.span
                className="size-1.5 rounded-full bg-ios-red"
                animate={{ opacity: [1, 0.25, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              LIVE
            </span>
          ) : null
        }
      />

      {/* Hero: elapsed time and live heart rate. */}
      <div className="relative mt-3 flex h-[56px] items-baseline-last justify-between">
        <div className="leading-none">
          <div className="mb-1 text-[11px] text-tertiary">{live ? "Elapsed" : fresh ? "Finished" : "Last run"}</div>
          <div className="flex items-baseline text-[34px] font-semibold tracking-tight text-heading">
            <AnimatedNumber value={Math.floor(shownSecs / 60)} format={TWO} />
            <span className="px-px text-tertiary">:</span>
            <AnimatedNumber value={shownSecs % 60} format={TWO} />
          </div>
        </div>
        <div className="flex items-end gap-2 leading-none">
          <motion.span
            className="mb-1 grid size-8 place-items-center rounded-full bg-ios-red text-[16px] text-white"
            animate={{ scale: [1, 1.16, 1, 1.06, 1] }}
            transition={{ duration: beat, repeat: Infinity, times: [0, 0.12, 0.28, 0.4, 1], ease: "easeOut" }}
          >
            <Heart20Filled />
          </motion.span>
          <div className="text-right">
            <div className={cn("mb-1 text-[11px] font-semibold", zMeta ? zMeta.text : "text-tertiary")}>
              {zMeta ? `Zone ${zMeta.z}` : "Resting"}
            </div>
            <div className="text-[34px] font-semibold tracking-tight text-heading">
              <AnimatedNumber value={bpm} />
              <span className="ml-0.5 text-[12px] font-medium text-tertiary">bpm</span>
            </div>
          </div>
        </div>
        <AnimatePresence>
          {phase === "countdown" ? (
            <motion.div
              key={count}
              className="absolute inset-0 grid place-items-center bg-[var(--widget-surface)] text-[40px] font-semibold text-ios-green tabular"
              initial={{ opacity: 0, scale: 1.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
            >
              {count || "Go"}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Heart-rate zone bar with a live marker. */}
      <div className="mt-3">
        <div className="relative h-[16px]">
          <motion.div
            className="absolute top-0 -ml-[5px] h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent"
            style={{ borderTopColor: zMeta?.color ?? "var(--ant-color-text-tertiary)" }}
            initial={{ left: "0%" }}
            animate={{ left: `${markerAt(bpm) * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
          />
          <div className="absolute inset-x-0 bottom-0 flex h-2 gap-[3px]">
            {ZONES.map((z, i) => (
              <motion.span
                key={z.z}
                className="flex-1 rounded-full"
                style={{ background: z.color, originX: 0 }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1, opacity: zone === i || zone < 0 ? 1 : 0.4 }}
                transition={{ type: "spring", stiffness: 160, damping: 22, delay: fresh ? 0 : delay + i * 0.06 }}
              />
            ))}
          </div>
        </div>
        <div className="relative mt-1 flex gap-[3px] text-[10px] text-tertiary tabular">
          {ZONES.map((z) => (
            <span key={z.z} className="flex-1 truncate">
              {Math.round(z.lo * MAX_HR)}
            </span>
          ))}
        </div>
      </div>

      {/* Time in each zone. */}
      <div className="mt-3 flex min-h-0 flex-1 flex-col">
        <div className="mb-1 flex items-baseline justify-between text-[11px]">
          <span className="font-semibold text-secondary">Time in zone</span>
          <span className="text-tertiary">{live || fresh ? "This run" : "Sat · Easy run"}</span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-between">
          {[...ZONES].reverse().map((z) => {
            const v = inZone[z.z - 1];
            return (
              <div key={z.z} className="flex h-[15px] items-center gap-2">
                <span className={cn("w-5 text-[10px] font-semibold", z.text)}>Z{z.z}</span>
                <span className="w-[60px] truncate text-[10px] text-tertiary">{z.name}</span>
                <div className="relative h-[7px] flex-1 overflow-hidden rounded-full bg-fill-quaternary">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: z.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(v / zoneMax) * 100}%` }}
                    transition={{ type: "spring", stiffness: 90, damping: 20, delay: fresh ? 0 : delay + 0.2 + z.z * 0.05 }}
                  />
                </div>
                <span className="w-[34px] text-right text-[10.5px] font-medium text-secondary tabular">
                  <AnimatedNumber value={Math.floor(v / 60)} />:
                  <AnimatedNumber value={v % 60} format={TWO} />
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Distance, pace, energy. */}
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {[
          { label: "Distance", node: <AnimatedNumber value={shownKm} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />, unit: "km" },
          {
            label: "Avg pace",
            node: pace ? (
              <>
                <AnimatedNumber value={Math.floor(pace / 60)} />:
                <AnimatedNumber value={Math.floor(pace % 60)} format={TWO} />
              </>
            ) : (
              "–:––"
            ),
            unit: "/km",
          },
          { label: "Active", node: <AnimatedNumber value={Math.round(shownKcal)} />, unit: "kcal" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl bg-fill-quaternary px-2.5 py-1.5 leading-tight">
            <div className="text-[10px] text-tertiary">{m.label}</div>
            <div className="text-[16px] font-semibold tracking-tight whitespace-nowrap text-heading">
              {m.node}
              <span className="ml-0.5 text-[10px] font-medium text-tertiary">{m.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-1.5">
        {phase === "idle" || phase === "countdown" ? (
          <Button
            block
            color="green"
            variant="filled"
            icon={<Play16Filled className="size-3.5" />}
            disabled={phase === "countdown"}
            onClick={start}
          >
            Start run
          </Button>
        ) : (
          <>
            <Button
              block
              variant="filled"
              color="default"
              icon={phase === "running" ? <Pause16Filled className="size-3.5" /> : <Play16Filled className="size-3.5" />}
              onClick={() => setPhase((p) => (p === "running" ? "paused" : "running"))}
            >
              {phase === "running" ? "Pause" : "Resume"}
            </Button>
            <Button block variant="filled" color="danger" icon={<Stop16Filled className="size-3.5" />} onClick={() => setPhase("idle")}>
              End
            </Button>
          </>
        )}
      </div>
    </Widget>
  );
}
