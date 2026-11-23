import { DataPie20Filled, Sparkle12Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/* Where each upcoming night's price came from: its rate level, a hand edit, or autopilot. */
const SOURCES = [
  { key: "level", label: "Rate level", count: 3485, color: "var(--ios-blue)", dot: "bg-ios-blue", text: "text-ios-blue" },
  { key: "manual", label: "Manual", count: 791, color: "var(--ios-orange)", dot: "bg-ios-orange", text: "text-ios-orange" },
  { key: "autopilot", label: "Autopilot", count: 124, color: "var(--ios-purple)", dot: "bg-ios-purple", text: "text-ios-purple" },
] as const;
const TOTAL = SOURCES.reduce((s, x) => s + x.count, 0);
const AUTO = 2;

const SIZE = 78;
const STROKE = 10;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const GAP = 2.5;

const share = (count: number) => {
  const v = (count / TOTAL) * 100;
  return `${v < 10 ? v.toFixed(1) : Math.round(v)}%`;
};

/** Revenue · small. The share of upcoming prices set by rate level, by hand and by autopilot as a donut whose autopilot slice shimmers; tap to step the highlight through the legend. */
export function ValueSourcesWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const gid = useId().replace(/:/g, "");
  // null is the whole mix; taps step through the three sources and back.
  const [focus, setFocus] = useState<number | null>(null);
  const next = () => setFocus((f) => (f === null ? 0 : f === SOURCES.length - 1 ? null : f + 1));
  const f = focus === null ? null : SOURCES[focus];

  let start = 0;
  const arcs = SOURCES.map((s) => {
    const len = (s.count / TOTAL) * C;
    const arc = { ...s, start, len: Math.max(1.5, len - GAP) };
    start += len;
    return arc;
  });

  return (
    <Widget size="small" index={index} label="Value sources" pressable onPress={next}>
      <WidgetHeader
        icon={<DataPie20Filled />}
        tint="var(--ios-teal)"
        title="Value sources"
        subtitle="Upcoming nights"
      />

      <div className="mt-2.5 flex items-center gap-2">
        <div className="relative grid shrink-0 place-items-center" style={{ width: SIZE, height: SIZE }}>
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 -rotate-90 overflow-visible" aria-hidden>
            <defs>
              <linearGradient id={`${gid}-shine`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={SIZE} y2="0">
                <stop offset="0" stopColor="var(--ios-purple)" />
                <stop offset="0.45" stopColor="var(--ios-pink)" />
                <stop offset="0.55" stopColor="#fff" />
                <stop offset="0.65" stopColor="var(--ios-pink)" />
                <stop offset="1" stopColor="var(--ios-purple)" />
                <animateTransform
                  attributeName="gradientTransform"
                  type="translate"
                  values={`-${SIZE} 0; ${SIZE} 0`}
                  dur="2.4s"
                  repeatCount="indefinite"
                />
              </linearGradient>
              <filter id={`${gid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.5" />
              </filter>
            </defs>
            <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" strokeWidth={STROKE} className="stroke-fill-tertiary" />
            {arcs.map((a, i) => {
              const dim = focus !== null && focus !== i;
              const on = focus === i;
              const isAuto = i === AUTO;
              return (
                <g key={a.key}>
                  {isAuto ? (
                    <motion.circle
                      cx={SIZE / 2}
                      cy={SIZE / 2}
                      r={R}
                      fill="none"
                      stroke="var(--ios-purple)"
                      strokeWidth={STROKE + 2}
                      strokeDasharray={`${a.len} ${C}`}
                      strokeDashoffset={-a.start}
                      filter={`url(#${gid}-glow)`}
                      animate={{ opacity: dim ? 0 : [0.25, 0.75, 0.25] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                  ) : null}
                  <motion.circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={R}
                    fill="none"
                    stroke={isAuto ? `url(#${gid}-shine)` : a.color}
                    strokeDashoffset={-a.start}
                    initial={{ strokeDasharray: `0 ${C}`, strokeWidth: STROKE }}
                    animate={{
                      strokeDasharray: `${a.len} ${C}`,
                      strokeWidth: on ? STROKE + 4 : STROKE,
                      opacity: dim ? 0.3 : 1,
                    }}
                    transition={{
                      strokeDasharray: { delay: delay + i * 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                      default: { type: "spring", stiffness: 380, damping: 26 },
                    }}
                  />
                </g>
              );
            })}
          </svg>
          <div className="relative flex flex-col items-center leading-none">
            <AnimatedNumber
              value={f ? f.count / TOTAL : TOTAL}
              format={f ? { style: "percent", maximumFractionDigits: f.count / TOTAL < 0.1 ? 1 : 0 } : undefined}
              className="text-[19px] font-semibold tracking-tight text-heading"
            />
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={f?.key ?? "all"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className={cn("mt-0.5 max-w-[56px] truncate text-[10px]", f ? cn("font-medium", f.text) : "text-tertiary")}
              >
                {f ? f.label : "prices"}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        <ul className="flex min-w-0 flex-1 flex-col gap-0.5">
          {SOURCES.map((s, i) => {
            const on = focus === i;
            const dim = focus !== null && !on;
            return (
              <motion.li
                key={s.key}
                className="relative min-w-0 rounded-lg px-1 py-[2px] leading-tight"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: dim ? 0.45 : 1, x: 0 }}
                transition={{ delay: focus === null ? delay + 0.1 + i * 0.07 : 0, type: "spring", stiffness: 380, damping: 26 }}
              >
                {on ? (
                  <motion.span
                    layoutId={`${gid}-hl`}
                    className="absolute inset-0 rounded-lg bg-fill-tertiary"
                    transition={{ type: "spring", stiffness: 500, damping: 36 }}
                  />
                ) : null}
                <div className="relative flex items-center gap-1 text-[11px] font-medium text-heading">
                  <span className={cn("size-1.5 shrink-0 rounded-full", s.dot)} />
                  <span className="truncate">{s.label}</span>
                </div>
                <div className="relative pl-2.5 text-[10px] text-tertiary tabular">
                  {s.count.toLocaleString("en-US")} · {share(s.count)}
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>

      <div className="mt-auto flex min-w-0 items-center gap-1 text-[10px] text-tertiary">
        <motion.span
          className="grid shrink-0 place-items-center text-ios-purple"
          animate={{ rotate: [0, 18, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkle12Filled />
        </motion.span>
        <span className="truncate">
          Autopilot set <span className="font-medium text-secondary tabular">{SOURCES[AUTO].count}</span> nights
        </span>
      </div>
    </Widget>
  );
}
