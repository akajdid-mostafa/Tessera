import { Fire16Filled, Flash20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const RINGS = [
  { key: "move", label: "Move", value: 412, goal: 560, unit: "kcal", color: "var(--ios-red)", text: "text-ios-red" },
  { key: "exercise", label: "Exercise", value: 24, goal: 30, unit: "min", color: "var(--ios-green)", text: "text-ios-green" },
  { key: "stand", label: "Stand", value: 9, goal: 12, unit: "hr", color: "var(--ios-teal)", text: "text-ios-teal" },
] as const;

/* The last seven days, Tuesday to today (Monday). Thursday's Move ring fell short and broke a 38-day streak. */
const WEEK = [
  { d: "T", v: [1.12, 1.3, 1] },
  { d: "W", v: [1.04, 1.1, 1] },
  { d: "T", v: [0.61, 0.4, 0.75], broken: true },
  { d: "F", v: [1.08, 1.2, 1] },
  { d: "S", v: [1.21, 1.6, 0.92] },
  { d: "S", v: [1.02, 1, 1] },
  { d: "M", v: [412 / 560, 24 / 30, 9 / 12], today: true },
] as const;

const BIG = [34, 25, 16];
const MINI = [8.4, 5.6, 2.8];

function Rings({
  radii,
  stroke,
  size,
  values,
  delay,
}: {
  radii: readonly number[];
  stroke: number;
  size: number;
  values: readonly number[];
  delay: number;
}) {
  const c = size / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90">
      {radii.map((r, i) => {
        const C = 2 * Math.PI * r;
        const color = RINGS[i].color;
        return (
          <g key={r}>
            <circle cx={c} cy={c} r={r} fill="none" strokeWidth={stroke} stroke={color} strokeOpacity={0.2} />
            <motion.circle
              cx={c}
              cy={c}
              r={r}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              stroke={color}
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C * (1 - Math.min(values[i], 0.999)) }}
              transition={{ type: "spring", stiffness: 70, damping: 16, delay: delay + i * 0.08 }}
            />
          </g>
        );
      })}
    </svg>
  );
}

/** Fitness · small. Today's Move, Exercise and Stand rings; tap to see the week, where a missed Thursday broke the streak. */
export function ActivityRingsWidget({ index }: { index?: number }) {
  const [page, setPage] = useState(0);
  const [seen, setSeen] = useState(false);
  const delay = seen ? 0 : 0.3 + (index ?? 0) * 0.06;

  return (
    <Widget
      size="small"
      index={index}
      label="Activity rings"
      pressable
      onPress={() => {
        setSeen(true);
        setPage((p) => (p + 1) % 2);
      }}
    >
      <WidgetHeader
        icon={<Flash20Filled />}
        tint="var(--ios-red)"
        title="Activity"
        subtitle={page === 0 ? "Today · 74% of Move" : "Last 7 days"}
      />

      <div className="relative mt-2 min-h-0 flex-1">
        <AnimatePresence mode="popLayout" initial={false}>
          {page === 0 ? (
            <motion.div
              key="today"
              className="absolute inset-0 flex items-center gap-2.5"
              initial={{ opacity: 0, x: -16, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -16, filter: "blur(4px)" }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
            >
              <div className="size-[76px] shrink-0">
                <Rings radii={BIG} stroke={8} size={80} values={RINGS.map((r) => r.value / r.goal)} delay={delay} />
              </div>
              <div className="flex min-w-0 flex-col gap-1 leading-none whitespace-nowrap">
                {RINGS.map((r) => (
                  <div key={r.key}>
                    <div className="text-[10px] text-tertiary">{r.label}</div>
                    <div className={cn("text-[15px] font-semibold tracking-tight", r.text)}>
                      <AnimatedNumber value={r.value} />
                      <span className="text-[11px] font-medium">
                        /{r.goal}
                        <span className="ml-0.5 text-[9px] uppercase">{r.unit}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="week"
              className="absolute inset-0 flex flex-col"
              initial={{ opacity: 0, x: 16, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: 16, filter: "blur(4px)" }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
            >
              <div className="flex items-center gap-1.5">
                <motion.span
                  className="text-[18px] text-ios-orange"
                  animate={{ scale: [1, 1.15, 1], rotate: [0, -6, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Fire16Filled className="block size-[18px]" />
                </motion.span>
                <span className="text-[26px] leading-none font-semibold tracking-tight text-heading">
                  <AnimatedNumber value={3} />
                </span>
                <span className="text-[12px] leading-tight text-secondary">
                  day
                  <br />
                  streak
                </span>
              </div>
              <div className="mt-1 truncate text-[11px] text-tertiary">
                <span className="font-semibold text-ios-red">Broken Thu</span> · Move 61%, best 38
              </div>
              <div className="mt-auto grid grid-cols-7 gap-0.5">
                {WEEK.map((w, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <div className={cn("size-[20px] rounded-full", "broken" in w && "ring-1 ring-ios-red/60 ring-offset-1 ring-offset-[var(--widget-surface)]")}>
                      <Rings radii={MINI} stroke={2.4} size={20} values={w.v} delay={0.05 * i} />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-medium",
                        "broken" in w ? "text-ios-red" : "today" in w ? "text-heading" : "text-tertiary",
                      )}
                    >
                      {w.d}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-1.5 flex justify-center gap-1">
        {[0, 1].map((i) => (
          <motion.span
            key={i}
            layout
            className={cn("h-1.5 rounded-full", i === page ? "w-3.5 bg-ios-red" : "w-1.5 bg-fill")}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        ))}
      </div>
    </Widget>
  );
}
