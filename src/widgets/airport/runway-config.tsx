import { AirplaneLanding20Filled, Dismiss16Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { enterDelay, useInterval } from "./_parts";

type Rwy = "26L" | "08R";
type Phase = "idle" | "armed" | "changing";

/** True headings of Gatwick's main runway, each way. */
const HDG: Record<Rwy, number> = { "26L": 257, "08R": 77 };
const TAIL_LIMIT = 5; // kt, runway change considered above this
const ARM_S = 5;
const CHANGE_MS = 2600;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const pad3 = (n: number) => String(Math.round(n)).padStart(3, "0");

/** Airport · small. The runway in use with live wind: a tailwind past the 5 kt limit turns it orange, and a select-then-confirm change flips the landing direction on the drawing. */
export function RunwayConfigWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [rwy, setRwy] = useState<Rwy>("26L");
  const [phase, setPhase] = useState<Phase>("idle");
  const [arm, setArm] = useState(ARM_S);
  const [wind, setWind] = useState({ dir: 95, spd: 9, gust: 14 });
  const delay = enterDelay(index);
  const other: Rwy = rwy === "26L" ? "08R" : "26L";

  useInterval(() => {
    setWind((w) => {
      const spd = clamp(w.spd + Math.round((Math.random() - 0.5) * 2.4), 7, 11);
      return {
        dir: clamp(w.dir + Math.round((Math.random() - 0.5) * 10), 82, 110),
        spd,
        gust: clamp(spd + 4 + Math.round(Math.random() * 3), 11, 17),
      };
    });
  }, 2800);

  useInterval(
    () => {
      if (arm <= 1) {
        setPhase("idle");
        setArm(ARM_S);
      } else setArm(arm - 1);
    },
    phase === "armed" ? 1000 : null,
  );

  useEffect(() => {
    if (phase !== "changing") return;
    const t = window.setTimeout(() => {
      setRwy((r) => (r === "26L" ? "08R" : "26L"));
      setPhase("idle");
    }, CHANGE_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  const rel = ((wind.dir - HDG[rwy]) * Math.PI) / 180;
  const head = wind.spd * Math.cos(rel);
  const cross = Math.abs(wind.spd * Math.sin(rel));
  const tail = head < 0;
  const over = tail && -head > TAIL_LIMIT && phase !== "changing";
  const westbound = rwy === "26L";

  return (
    <Widget size="small" index={index} label="Runway in use">
      <WidgetHeader
        icon={<AirplaneLanding20Filled />}
        tint={over ? "var(--ios-orange)" : "var(--ios-teal)"}
        title={`Runway ${rwy}`}
        subtitle={phase === "changing" ? `Changing to ${other}…` : `LGW · ${westbound ? "Westerly" : "Easterly"} ops`}
      />

      {/* Top-down runway: threshold labels, a landing aircraft rolling out, the wind arrow overhead. */}
      <svg viewBox="0 0 164 44" className="mt-1 h-[44px] w-full overflow-visible" aria-hidden>
        <line x1="34" x2="130" y1="39" y2="39" strokeWidth="2" strokeLinecap="round" className="stroke-fill-secondary" />
        {[48, 82, 116].map((x) => (
          <line key={x} x1={x} x2={x - 5} y1="32" y2="39" strokeWidth="2" className="stroke-fill-secondary" />
        ))}
        <rect x="26" y="21" width="112" height="11" rx="2" className="fill-fill-secondary" />
        <line x1="32" x2="132" y1="26.5" y2="26.5" strokeWidth="0.9" strokeDasharray="5 4" className="stroke-tertiary" />
        {[29, 133].map((x) => (
          <g key={x}>
            {[23.5, 25.5, 27.5, 29.5].map((y) => (
              <line key={y} x1={x - 1.5} x2={x + 1.5} y1={y} y2={y} strokeWidth="0.8" className="stroke-tertiary" />
            ))}
          </g>
        ))}
        {(["08R", "26L"] as Rwy[]).map((r) => (
          <text
            key={r}
            x={r === "08R" ? 12 : 152}
            y="30"
            textAnchor="middle"
            fontSize="9.5"
            fontWeight={r === rwy ? 700 : 500}
            className={cn("transition-colors duration-500", r === rwy ? "fill-heading" : "fill-tertiary")}
          >
            {r}
          </text>
        ))}

        {phase !== "changing" ? (
          <motion.g
            key={rwy}
            initial={{ x: westbound ? 136 : 28, opacity: 0 }}
            animate={reduce ? { x: 82, opacity: 1 } : { x: westbound ? [136, 34] : [28, 130], opacity: [0, 1, 1, 0] }}
            transition={
              reduce
                ? { duration: 0 }
                : {
                    x: { duration: 3.6, repeat: Infinity, repeatDelay: 1.2, ease: [0.25, 0.6, 0.4, 1], delay },
                    opacity: { duration: 3.6, repeat: Infinity, repeatDelay: 1.2, times: [0, 0.12, 0.8, 1], delay },
                  }
            }
          >
            <g transform={`translate(0 26.5) scale(${westbound ? -1 : 1} 1)`}>
              <path
                d="M6 0 4.6-.9-1.6-.9-4.4-6H-6L-3.8-.9H-6.4L-7.8-3H-8.8L-8.2 0-8.8 3H-7.8L-6.4.9H-3.8L-6 6H-4.4L-1.6.9 4.6.9Z"
                className="fill-heading"
              />
            </g>
          </motion.g>
        ) : null}

        {/* Wind arrow: points where the wind blows to. */}
        <g transform="translate(82 8)">
          <motion.g initial={false} animate={{ rotate: wind.dir + 90 }} transition={{ type: "spring", stiffness: 60, damping: 14 }}>
            <path
              d="M-11 0H12M8.5-3.5 13 0 8.5 3.5M-11 0-13.5-3M-8 0-10.5-3"
              fill="none"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={over ? "stroke-[var(--ios-orange)]" : "stroke-secondary"}
            />
          </motion.g>
        </g>
      </svg>

      <div className="mt-1 flex items-baseline gap-1 whitespace-nowrap leading-none">
        <span className={cn("text-[26px] font-semibold tracking-tight", over ? "text-ios-orange" : "text-heading")}>
          <AnimatedNumber value={Math.round(Math.abs(head))} />
        </span>
        <span className="text-[12px] font-medium text-tertiary">kt {tail ? "tail" : "head"}</span>
        <span className="ml-auto text-[11px] text-tertiary tabular">
          X <AnimatedNumber value={Math.round(cross)} className="font-semibold text-secondary" /> kt
        </span>
      </div>
      <div className="mt-0.5 truncate text-[11px] leading-[13px] text-tertiary tabular">
        {pad3(wind.dir)}° {wind.spd}G{wind.gust} kt · {over ? `limit ${TAIL_LIMIT} kt` : "QNH 1009"}
      </div>

      <div className="mt-auto">
        <AnimatePresence mode="wait" initial={false}>
          {phase === "armed" ? (
            <motion.div key="arm" className="flex gap-1" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}>
              <Button size="small" color="orange" variant="filled" block className="tabular" onClick={() => setPhase("changing")}>
                Confirm {other} · {arm}
              </Button>
              <Button size="small" color="default" variant="filled" icon={<Dismiss16Regular />} aria-label="Cancel" onClick={() => setPhase("idle")} />
            </motion.div>
          ) : (
            <motion.div key="sel" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}>
              <Button
                size="small"
                color="default"
                variant="filled"
                block
                disabled={phase === "changing"}
                onClick={() => {
                  setArm(ARM_S);
                  setPhase("armed");
                }}
              >
                {phase === "changing" ? "Notifying ATC…" : `Change to ${other}`}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
