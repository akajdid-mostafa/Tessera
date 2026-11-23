import { Heart20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget } from "@/motion/widget";

/* One heartbeat, 60 units wide: baseline, P wave, QRS spike, T wave. */
const BEAT = "l10 0 q3 -4 6 0 l4 0 l2 3 l3 -22 l3 26 l2 -7 l5 0 q4 -7 8 0 l17 0";
const UNIT = 60;
const BEATS = 4;
const trace = (copies: number) => `M0 30 ${Array.from({ length: copies }, () => BEAT).join(" ")}`;

/** Healthcare · small. A scrolling ECG under a heart that beats at the live rate. */
export function HeartRateWidget({ index }: { index?: number }) {
  const [bpm, setBpm] = useState(72);

  useEffect(() => {
    const t = window.setInterval(() => {
      setBpm((b) => Math.max(64, Math.min(84, b + Math.round((Math.random() - 0.5) * 6))));
    }, 2200);
    return () => window.clearInterval(t);
  }, []);

  const beat = 60 / bpm;

  return (
    <Widget size="small" index={index} label="Heart rate">
      <div className="flex items-center gap-2">
        <motion.span
          className="grid size-7 place-items-center rounded-full bg-ios-red text-[15px] text-white"
          animate={{ scale: [1, 1.18, 1, 1.08, 1] }}
          transition={{ duration: beat, repeat: Infinity, times: [0, 0.12, 0.28, 0.4, 1], ease: "easeOut" }}
        >
          <Heart20Filled />
        </motion.span>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold text-heading">Heart Rate</div>
          <div className="text-[11px] text-tertiary">Room 204 · Live</div>
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-1">
        <AnimatedNumber value={bpm} className="text-[34px] leading-none font-semibold tracking-tight text-heading" />
        <span className="text-[13px] font-medium text-ios-red">BPM</span>
      </div>
      <div className="text-[11px] text-tertiary">Resting · normal range</div>

      <div className="relative -mx-4 mt-auto h-12 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_18%,black_70%,transparent)]">
        <motion.svg
          viewBox={`0 0 ${UNIT * BEATS * 2} 40`}
          preserveAspectRatio="none"
          className="absolute inset-y-0 left-0 h-full"
          style={{ width: "200%" }}
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: beat * BEATS, repeat: Infinity, ease: "linear" }}
        >
          <defs>
            <filter id="hr-glow" x="-10%" y="-50%" width="120%" height="200%">
              <feGaussianBlur stdDeviation="1.6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d={trace(BEATS * 2)}
            fill="none"
            stroke="var(--ios-red)"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            filter="url(#hr-glow)"
          />
        </motion.svg>
      </div>
    </Widget>
  );
}
