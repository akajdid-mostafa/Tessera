import { BatteryCharge20Filled, SpeakerMute16Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Phase = "online" | "battery" | "recharging";
type Node = "input" | "rectifier" | "battery" | "inverter" | "output";

const PHASE_S: Record<Phase, number> = { online: 16, battery: 15, recharging: 9 };
const FULL_RUNTIME = 18 * 60;
const TWO = { minimumIntegerDigits: 2 } as const;

const PROBE: Record<Node, string> = {
  input: "Utility in · 231 V · 50.0 Hz",
  rectifier: "Rectifier · 97.1% efficiency",
  battery: "VRLA string · 25 °C · health 92%",
  inverter: "Inverter · 230 V · 50.0 Hz",
  output: "Output · 184 kW to PDU-A",
};

/** Data center · medium. A UPS mimic whose power flow re-routes through the battery on a mains failure, with a live runtime countdown and an alarm you can silence. */
export function UpsWidget({ index }: { index?: number }) {
  const [state, setState] = useState<{ phase: Phase; t: number; charge: number; first: boolean }>({
    phase: "online",
    t: 0,
    charge: 100,
    first: true,
  });
  const [muted, setMuted] = useState(false);
  const [probe, setProbe] = useState<Node | null>(null);
  const { phase, charge } = state;

  useEffect(() => {
    const id = window.setInterval(() => {
      setState((prev) => {
        // The first mains failure comes sooner, so the story shows up early.
        const limit = prev.phase === "online" && prev.first ? 7 : PHASE_S[prev.phase];
        const t = prev.t + 1;
        if (t < limit) {
          const step = prev.phase === "battery" ? -100 / FULL_RUNTIME : prev.phase === "recharging" ? 0.25 : 0;
          return { ...prev, t, charge: Math.min(100, Math.max(0, prev.charge + step)) };
        }
        const next: Phase = prev.phase === "online" ? "battery" : prev.phase === "battery" ? "recharging" : "online";
        return { phase: next, t: 0, charge: next === "online" ? 100 : prev.charge, first: false };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (phase !== "battery") setMuted(false);
  }, [phase]);

  const onBattery = phase === "battery";
  const runtime = Math.round((FULL_RUNTIME * charge) / 100);
  const alarm = onBattery && !muted;

  return (
    <Widget
      size="medium"
      index={index}
      label="UPS status"
      glow={{ mode: "pulse", colors: ["#FF9F0A", "#FF453A", "#FF9F0A"], blur: 18, duration: 1.8 }}
      glowActive={alarm}
    >
      <WidgetHeader
        icon={<BatteryCharge20Filled />}
        tint={onBattery ? "var(--ios-orange)" : "var(--ios-green)"}
        title="UPS-A · Galaxy VX"
        subtitle="Hall 2 · 500 kVA · 2N"
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={phase}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                onBattery ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-secondary text-secondary",
              )}
            >
              <span className={cn("size-1.5 rounded-full", onBattery ? "bg-ios-orange" : "bg-ios-green", alarm && "animate-pulse")} />
              {onBattery ? "On battery" : phase === "recharging" ? "Online · charging" : "Online"}
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="mt-2 flex items-center gap-3">
        <Mimic phase={phase} charge={charge} probe={probe} setProbe={setProbe} index={index} />

        <div className="min-w-0 flex-1 leading-none">
          <div className="text-[11px] text-tertiary">{onBattery ? "Runtime left" : "Est. runtime"}</div>
          <div className={cn("mt-1 flex items-baseline text-[24px] font-semibold tracking-tight", onBattery ? "text-ios-orange" : "text-heading")}>
            <AnimatedNumber value={Math.floor(runtime / 60)} trend={onBattery ? -1 : 0} />
            <span className="px-px">:</span>
            <AnimatedNumber value={runtime % 60} format={TWO} trend={onBattery ? -1 : 0} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-2 text-[11px] text-tertiary">
            <span>Load</span>
            <span>Battery</span>
            <span className="font-semibold text-secondary tabular">46%</span>
            <span className={cn("font-semibold tabular", onBattery ? "text-ios-orange" : "text-secondary")}>
              <AnimatedNumber value={Math.round(charge)} suffix="%" />
            </span>
          </div>
        </div>
      </div>

      <div className="mt-auto flex h-[26px] items-center gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {onBattery ? (
            <motion.div
              key="paged"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex min-w-0 flex-1 items-center gap-2"
            >
              <MemojiAvatar who="f4" size={24} alt="Emily Young" />
              <div className="min-w-0 truncate text-[11px] leading-tight text-tertiary">
                <span className="font-semibold text-heading">Emily Y.</span> on call · paged
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={probe ?? "meta"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="min-w-0 flex-1 truncate text-[11px] text-tertiary"
            >
              {probe ? <span className="text-secondary">{PROBE[probe]}</span> : "Mains 231 V · 50.0 Hz · self-test passed Nov 2"}
            </motion.div>
          )}
        </AnimatePresence>
        {onBattery ? (
          <motion.button
            type="button"
            onClick={() => setMuted(true)}
            disabled={muted}
            whileTap={{ scale: 0.92 }}
            className={cn(
              "flex h-[26px] shrink-0 cursor-pointer items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold whitespace-nowrap outline-none transition-colors duration-mid disabled:cursor-default",
              muted ? "bg-fill-tertiary text-tertiary" : "bg-ios-orange/15 text-ios-orange hover:bg-ios-orange/25",
            )}
          >
            <SpeakerMute16Regular />
            {muted ? "Muted 1 h" : "Silence"}
          </motion.button>
        ) : null}
      </div>
    </Widget>
  );
}

/** Input → rectifier → DC bus (battery) → inverter → output, with the static bypass above. */
function Mimic({
  phase,
  charge,
  probe,
  setProbe,
  index,
}: {
  phase: Phase;
  charge: number;
  probe: Node | null;
  setProbe: (n: Node | null) => void;
  index?: number;
}) {
  const onBattery = phase === "battery";
  const flow = onBattery ? "stroke-ios-orange" : "stroke-secondary";
  const delay = 0.3 + (index ?? 0) * 0.06;

  const box = (id: Node, x: number, y: number, glyph: ReactNode, alert = false) => (
    <g
      key={id}
      onMouseEnter={() => setProbe(id)}
      onMouseLeave={() => setProbe(null)}
      className="cursor-default"
    >
      <motion.rect
        x={x}
        y={y}
        width={28}
        height={22}
        rx={6}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: delay + x / 400 }}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
        className={cn(
          "transition-colors duration-mid",
          alert ? "fill-ios-red/15 stroke-ios-red" : probe === id ? "fill-fill-secondary stroke-secondary" : "fill-fill-tertiary stroke-transparent",
        )}
        strokeWidth={1}
      />
      <g transform={`translate(${x + 14} ${y + 11})`} className={alert ? "text-ios-red" : "text-secondary"}>
        {glyph}
      </g>
    </g>
  );

  return (
    <svg viewBox="0 0 192 70" className="h-[70px] w-[192px] shrink-0 overflow-visible" aria-label="UPS mimic diagram">
      {/* Static bypass, idle */}
      <path d="M17 29 V9 H175 V29" fill="none" strokeWidth={1.2} strokeDasharray="2 3" className="stroke-quaternary" />
      <text x={96} y={6} textAnchor="middle" className="fill-tertiary text-[9px]">
        Bypass
      </text>

      {/* Wires */}
      {[
        { d: "M31 40 H50", live: !onBattery, dead: onBattery },
        { d: "M78 40 H114", live: true },
        { d: "M142 40 H161", live: true },
      ].map((w) => (
        <g key={w.d}>
          <path d={w.d} fill="none" strokeWidth={2} className={w.dead ? "stroke-ios-red/50" : "stroke-fill"} strokeDasharray={w.dead ? "3 3" : undefined} />
          {w.live ? (
            <motion.path
              d={w.d}
              fill="none"
              strokeWidth={2}
              strokeDasharray="3 6"
              strokeLinecap="round"
              className={cn("transition-colors duration-mid", flow)}
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: [0, -18] }}
              transition={{ duration: onBattery ? 0.7 : 1.3, repeat: Infinity, ease: "linear" }}
            />
          ) : null}
        </g>
      ))}

      {/* DC bus tap to the battery: charging flows down, discharging flows up */}
      <path d="M96 40 V49" fill="none" strokeWidth={2} className="stroke-fill" />
      {phase !== "online" ? (
        <motion.path
          key={phase}
          d="M96 40 V49"
          fill="none"
          strokeWidth={2}
          strokeDasharray="2 4"
          className={onBattery ? "stroke-ios-orange" : "stroke-ios-green"}
          initial={{ strokeDashoffset: onBattery ? [0, 12] : [0, -12] }}
          animate={{ strokeDashoffset: onBattery ? [0, 12] : [0, -12] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
      ) : null}

      {box(
        "input",
        3,
        29,
        <>
          <path d="M-7 0 q3.5 -6 7 0 t7 0" fill="none" stroke="currentColor" strokeWidth={1.4} />
          {onBattery ? <path d="M-5 -5 L5 5 M5 -5 L-5 5" stroke="currentColor" strokeWidth={1.4} /> : null}
        </>,
        onBattery,
      )}
      {box(
        "rectifier",
        50,
        29,
        <>
          <path d="M-8 6 L8 -6" stroke="currentColor" strokeWidth={1} opacity={0.6} />
          <path d="M-8 -4 q2 -3 4 0 t4 0" fill="none" stroke="currentColor" strokeWidth={1.2} />
          <path d="M1 3 H8 M1 5.5 H8" stroke="currentColor" strokeWidth={1.2} />
        </>,
      )}
      {box(
        "inverter",
        114,
        29,
        <>
          <path d="M-8 6 L8 -6" stroke="currentColor" strokeWidth={1} opacity={0.6} />
          <path d="M-8 -5 H-1 M-8 -2.5 H-1" stroke="currentColor" strokeWidth={1.2} />
          <path d="M0 4 q2 -3 4 0 t4 0" fill="none" stroke="currentColor" strokeWidth={1.2} />
        </>,
      )}
      {box(
        "output",
        161,
        29,
        <>
          {[-5, -1, 3].map((yy) => (
            <rect key={yy} x={-6} y={yy} width={12} height={2.6} rx={0.8} fill="currentColor" opacity={0.85} />
          ))}
        </>,
      )}

      {/* Battery string */}
      <g onMouseEnter={() => setProbe("battery")} onMouseLeave={() => setProbe(null)}>
        <rect
          x={80}
          y={49}
          width={32}
          height={19}
          rx={5}
          strokeWidth={1}
          className={cn(
            "transition-colors duration-mid",
            onBattery ? "fill-ios-orange/15 stroke-ios-orange" : probe === "battery" ? "fill-fill-secondary stroke-secondary" : "fill-fill-tertiary stroke-transparent",
          )}
        />
        <rect x={86} y={54} width={18} height={9} rx={1.5} fill="none" strokeWidth={1.2} className={onBattery ? "stroke-ios-orange" : "stroke-secondary"} />
        <rect x={104} y={56.5} width={2} height={4} rx={0.5} className={onBattery ? "fill-ios-orange" : "fill-secondary"} />
        <motion.rect
          x={87.5}
          y={55.5}
          height={6}
          rx={0.8}
          className={onBattery ? "fill-ios-orange" : phase === "recharging" ? "fill-ios-green" : "fill-secondary"}
          initial={{ width: 0 }}
          animate={{ width: 15 * (charge / 100) }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </g>
    </svg>
  );
}
