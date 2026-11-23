import { Water20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { LiveDot, mmss } from "./_parts";

const SYS = 118;
const SUP = 92;
/** Waterflow retard: flow must persist this long before the alarm (NFPA 72 allows up to 90 s). */
const RETARD = 12;
/** The test valve closes itself after this long. */
const TEST_LEN = 24;

type Sim = { sys: number; sup: number; testing: boolean; flowFor: number; alarm: boolean };

function step(s: Sim): Sim {
  const j = () => (Math.random() - 0.5) * 1.2;
  if (s.testing) {
    const flowFor = s.flowFor + 1;
    const sys = s.sys + (74 - s.sys) * 0.35 + j();
    const sup = s.sup + (71 - s.sup) * 0.3 + j();
    if (flowFor >= TEST_LEN) return { sys, sup, testing: false, flowFor: 0, alarm: s.alarm };
    return { sys, sup, testing: true, flowFor, alarm: s.alarm || flowFor >= RETARD };
  }
  const sys = s.sys + (SYS - s.sys) * 0.18 + j() * 0.5;
  const sup = s.sup + (SUP - s.sup) * 0.25 + j() * 0.5;
  // The alarm restores once system pressure is back near normal.
  return { sys, sup, testing: false, flowFor: 0, alarm: s.alarm && sys < SYS - 6 };
}

/** Gauge needle angle: 0–200 psi over a 240° sweep. */
const needle = (psi: number) => -120 + (Math.min(200, Math.max(0, psi)) / 200) * 240;

/** Fire safety · small. A wet-pipe sprinkler riser drawn with its valves and gauges: opening the inspector's test sends water up the pipe, the clapper lifts and gauges sag, and after the retard the waterflow alarm latches red until pressure recovers. */
export function SprinklerRiserWidget({ index }: { index?: number }) {
  const [sim, setSim] = useState<Sim>({ sys: SYS, sup: SUP, testing: false, flowFor: 0, alarm: false });
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const id = window.setInterval(() => setSim(step), 1000);
    return () => window.clearInterval(id);
  }, []);

  const flowing = sim.testing;

  return (
    <Widget
      size="small"
      index={index}
      label="Sprinkler riser"
      glow={{ mode: "pulse", colors: ["#FF453A", "#FF9F0A", "#FF453A"], blur: 18, duration: 1.1 }}
      glowActive={sim.alarm}
    >
      <WidgetHeader icon={<Water20Filled />} tint="var(--ios-blue)" title="Riser 2 · Wet" subtitle="Floors 6–10 · NFPA 13" />

      <div className="mt-2 flex min-h-0 flex-1 gap-2">
        <svg viewBox="0 0 60 124" className="h-full w-[58px] shrink-0" role="img" aria-label="Sprinkler riser">
          {/* Cross main with two heads. */}
          <rect x="22" y="9" width="36" height="5" rx="2" style={{ fill: "var(--ant-color-fill-secondary)" }} />
          {[38, 52].map((x) => (
            <g key={x}>
              <rect x={x - 1} y="14" width="2" height="4" style={{ fill: "var(--ant-color-text-tertiary)" }} />
              <path d={`M${x - 3.5} 21 L${x} 17.5 L${x + 3.5} 21 Z`} style={{ fill: "var(--ant-color-text-tertiary)" }} />
            </g>
          ))}
          {/* Inspector's test line and sight glass. */}
          <rect x="52" y="14" width="3.5" height="22" style={{ fill: "var(--ant-color-fill-secondary)" }} />
          <circle cx="53.75" cy="40" r="3.6" strokeWidth="1.2" style={{ fill: flowing ? "var(--ios-blue)" : "var(--widget-surface)", stroke: "var(--ant-color-text-tertiary)", transition: "fill 0.3s" }} />

          {/* Riser pipe, water-filled. */}
          <rect x="20" y="9" width="9" height="113" rx="2" style={{ fill: "var(--ant-color-fill-secondary)" }} />
          <motion.rect
            x="21.5"
            y="10"
            width="6"
            height="111"
            rx="1.5"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformBox: "fill-box", transformOrigin: "bottom", fill: "var(--ios-blue)", fillOpacity: 0.35 }}
          />
          {flowing ? (
            <motion.line
              x1="24.5"
              x2="24.5"
              y1="120"
              y2="11"
              strokeWidth="2"
              strokeDasharray="4 6"
              strokeLinecap="round"
              style={{ stroke: "var(--ios-blue)" }}
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: 20 }}
              transition={{ duration: 0.45, repeat: Infinity, ease: "linear" }}
            />
          ) : null}
          {flowing ? (
            <motion.path
              d="M24.5 11.5 H53.75 V36"
              fill="none"
              strokeWidth="1.6"
              strokeDasharray="3 5"
              style={{ stroke: "var(--ios-blue)" }}
              initial={{ strokeDashoffset: 16 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 0.45, repeat: Infinity, ease: "linear" }}
            />
          ) : null}

          {/* Flow switch with paddle. */}
          <rect x="30" y="34" width="8" height="7" rx="1.5" style={{ fill: sim.alarm ? "var(--ios-red)" : "var(--ant-color-text-tertiary)", transition: "fill 0.3s" }} />
          <motion.line
            x1="25"
            y1="37.5"
            x2="29"
            y2="37.5"
            strokeWidth="1.4"
            strokeLinecap="round"
            animate={{ rotate: flowing ? -40 : 0 }}
            style={{ transformBox: "fill-box", transformOrigin: "100% 50%", stroke: "var(--ant-color-text)" }}
          />

          {/* Alarm check valve with clapper. */}
          <circle cx="24.5" cy="72" r="8.5" style={{ fill: "var(--ant-color-fill-secondary)", stroke: "var(--ant-color-text-tertiary)" }} strokeWidth="1" />
          <motion.line
            x1="18.5"
            y1="72"
            x2="30.5"
            y2="72"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ rotate: flowing ? -55 : 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
            style={{ transformBox: "fill-box", transformOrigin: "0% 50%", stroke: "var(--ant-color-text)" }}
          />

          {/* Gauges: system above the clapper, supply below. */}
          <Gauge cx={8} cy={56} psi={sim.sys} hot={flowing} />
          <Gauge cx={8} cy={90} psi={sim.sup} hot={flowing} />
          <line x1="14" y1="56" x2="20" y2="56" strokeWidth="1.5" style={{ stroke: "var(--ant-color-fill-secondary)" }} />
          <line x1="14" y1="90" x2="20" y2="90" strokeWidth="1.5" style={{ stroke: "var(--ant-color-fill-secondary)" }} />

          {/* OS&Y gate valve with tamper switch. */}
          <path d="M17 100 L32 110 L32 100 L17 110 Z" style={{ fill: "var(--ant-color-text-tertiary)" }} />
          <line x1="24.5" y1="105" x2="40" y2="105" strokeWidth="1.2" style={{ stroke: "var(--ant-color-text-tertiary)" }} />
          <circle cx="43" cy="105" r="3" fill="none" strokeWidth="1.2" style={{ stroke: "var(--ant-color-text-tertiary)" }} />
          <rect x="35" y="110" width="7" height="5" rx="1" style={{ fill: "var(--ant-color-fill-secondary)" }} />
        </svg>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="text-[11px] font-medium text-tertiary">System</div>
          <div className={cn("mt-0.5 flex items-baseline whitespace-nowrap leading-none", flowing ? "text-ios-blue" : "text-heading")}>
            <AnimatedNumber value={Math.round(sim.sys)} className="text-[26px] font-semibold tracking-tight" />
            <span className="ml-0.5 text-[11px] font-medium text-tertiary">psi</span>
          </div>
          <div className="mt-1 whitespace-nowrap text-[10px] text-tertiary tabular">
            Supply <AnimatedNumber value={Math.round(sim.sup)} className="text-secondary" /> psi
          </div>

          <div className="mt-auto">
            <span
              className={cn(
                "inline-flex h-5 max-w-full items-center gap-1 whitespace-nowrap rounded-full px-2 text-[10px] font-semibold transition-colors duration-300 tabular",
                sim.alarm ? "bg-ios-red text-white" : flowing ? "bg-ios-blue/15 text-ios-blue" : "bg-fill-tertiary text-secondary",
              )}
            >
              {sim.alarm ? (
                <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.9, repeat: Infinity }} className="truncate">
                  Waterflow alarm
                </motion.span>
              ) : flowing ? (
                <span className="truncate">Retard {mmss(Math.max(0, RETARD - sim.flowFor))}</span>
              ) : (
                <>
                  <LiveDot color="var(--ios-green)" />
                  Normal
                </>
              )}
            </span>
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => setSim((s) => (s.testing ? { ...s, testing: false, flowFor: 0 } : { ...s, testing: true, flowFor: 0 }))}
              className={cn(
                "mt-1.5 flex h-6 w-full cursor-pointer items-center justify-center rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors",
                flowing ? "bg-ios-blue text-white" : "bg-fill-secondary text-heading hover:bg-fill",
              )}
            >
              {flowing ? "Close test valve" : "Inspector's test"}
            </motion.button>
          </div>
        </div>
      </div>
    </Widget>
  );
}

function Gauge({ cx, cy, psi, hot }: { cx: number; cy: number; psi: number; hot: boolean }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="6.5" strokeWidth="1.2" style={{ fill: "var(--widget-surface)", stroke: "var(--ant-color-text-tertiary)" }} />
      <motion.line
        x1={cx}
        y1={cy}
        x2={cx}
        y2={cy - 4.8}
        strokeWidth="1.3"
        strokeLinecap="round"
        animate={{ rotate: needle(psi) }}
        transition={{ type: "spring", stiffness: 120, damping: 12 }}
        style={{ transformBox: "fill-box", transformOrigin: "50% 100%", stroke: hot ? "var(--ios-blue)" : "var(--ios-red)" }}
      />
      <circle cx={cx} cy={cy} r="1.2" style={{ fill: "var(--ant-color-text)" }} />
    </g>
  );
}
