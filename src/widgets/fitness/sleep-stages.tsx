import { Sleep20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Stage = "awake" | "rem" | "core" | "deep";
const LANES: Stage[] = ["awake", "rem", "core", "deep"];
const STAGE: Record<Stage, { label: string; color: string; text: string }> = {
  awake: { label: "Awake", color: "var(--ios-orange)", text: "text-ios-orange" },
  rem: { label: "REM", color: "var(--ios-teal)", text: "text-ios-teal" },
  core: { label: "Core", color: "var(--ios-blue)", text: "text-ios-blue" },
  deep: { label: "Deep", color: "var(--ios-indigo)", text: "text-ios-indigo" },
};

/* Last night, 23:42 to 07:06, in minutes per block. Deep sleep front-loaded, REM growing toward morning. */
const RAW: [Stage, number][] = [
  ["core", 18], ["deep", 42], ["core", 26], ["rem", 14], ["awake", 3], ["core", 32], ["deep", 28],
  ["core", 24], ["rem", 22], ["core", 38], ["awake", 6], ["deep", 12], ["core", 30], ["rem", 28],
  ["core", 36], ["awake", 4], ["rem", 34], ["core", 26], ["awake", 5], ["rem", 16],
];
const START = 23 * 60 + 42;
const BLOCKS = RAW.reduce<{ stage: Stage; start: number; len: number }[]>((acc, [stage, len]) => {
  const prev = acc[acc.length - 1];
  acc.push({ stage, start: prev ? prev.start + prev.len : 0, len });
  return acc;
}, []);
const TOTAL = BLOCKS[BLOCKS.length - 1].start + BLOCKS[BLOCKS.length - 1].len;
const SUM = Object.fromEntries(LANES.map((s) => [s, BLOCKS.filter((b) => b.stage === s).reduce((a, b) => a + b.len, 0)])) as Record<Stage, number>;
const ASLEEP = TOTAL - SUM.awake;
const TICKS = [0, 2, 4, 6].map((h) => {
  const m = (h * 60 + 24 * 60 - START) % (24 * 60);
  return { label: `${String(h).padStart(2, "0")}:00`, at: m / TOTAL };
});
const LANE_H = 17;
const BAR_H = 9;

const clock = (min: number) => {
  const t = (START + min) % (24 * 60);
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
};
const dur = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min}m`);

/** Fitness · medium. Last night's hypnogram by stage; scrub across it to read the stage and clock time at any minute. */
export function SleepStagesWidget({ index }: { index?: number }) {
  const [at, setAt] = useState<number | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const block = at === null ? null : BLOCKS.find((b) => at >= b.start && at < b.start + b.len) ?? BLOCKS[BLOCKS.length - 1];

  return (
    <Widget size="medium" index={index} label="Sleep stages">
      <WidgetHeader
        icon={<Sleep20Filled />}
        tint="var(--ios-indigo)"
        title="Sleep"
        subtitle={`${clock(0)} – ${clock(TOTAL)} · in bed ${dur(TOTAL)}`}
        extra={
          <span className="rounded-full bg-ios-indigo/15 px-2 py-0.5 text-[11px] font-semibold text-ios-indigo">
            Score <AnimatedNumber value={84} />
          </span>
        }
      />

      <div className="mt-1.5 flex h-[30px] items-baseline-last gap-3">
        <div className="flex items-baseline gap-1 whitespace-nowrap">
          <span className="text-[26px] leading-none font-semibold tracking-tight text-heading">
            <AnimatedNumber value={Math.floor(ASLEEP / 60)} />
            <span className="text-[13px] font-medium text-tertiary">h </span>
            <AnimatedNumber value={ASLEEP % 60} />
            <span className="text-[13px] font-medium text-tertiary">m</span>
          </span>
          <span className="text-[11px] text-tertiary">asleep</span>
        </div>
        <div className="mb-0.5 ml-auto flex min-w-0 items-center gap-2.5 text-[11px] whitespace-nowrap">
          {block ? (
            <motion.div key="scrub" initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5">
              <span className="text-secondary tabular">{clock(at ?? 0)}</span>
              <span className="size-2 rounded-full" style={{ background: STAGE[block.stage].color }} />
              <span className={cn("font-semibold", STAGE[block.stage].text)}>{STAGE[block.stage].label}</span>
              <span className="text-tertiary">· {dur(block.len)} block</span>
            </motion.div>
          ) : (
            (["deep", "rem"] as const).map((s) => (
              <span key={s} className="flex items-center gap-1">
                <span className="size-2 rounded-full" style={{ background: STAGE[s].color }} />
                <span className="text-tertiary">{STAGE[s].label}</span>
                <span className="font-semibold text-secondary tabular">{dur(SUM[s])}</span>
              </span>
            ))
          )}
        </div>
      </div>

      <div className="mt-auto flex gap-2">
        <div className="flex w-[34px] shrink-0 flex-col">
          {LANES.map((s) => (
            <div key={s} className="flex items-center text-[10px] text-tertiary" style={{ height: LANE_H }}>
              {STAGE[s].label}
            </div>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="relative cursor-crosshair touch-none"
            style={{ height: LANE_H * LANES.length }}
            onPointerMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const t = Math.min(0.999, Math.max(0, (e.clientX - r.left) / r.width));
              setAt(Math.floor(t * TOTAL));
            }}
            onPointerLeave={() => setAt(null)}
          >
            {LANES.map((s, i) => (
              <div
                key={s}
                className="absolute inset-x-0 border-t border-dashed border-split"
                style={{ top: i * LANE_H + LANE_H / 2 }}
              />
            ))}
            <motion.div
              className="absolute inset-0"
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay }}
            >
              {BLOCKS.map((b, i) => {
                const next = BLOCKS[i + 1];
                const lane = LANES.indexOf(b.stage);
                const dim = block !== null && block !== b;
                return (
                  <div key={i}>
                    <div
                      className="absolute rounded-[3px] transition-opacity duration-200"
                      style={{
                        left: `${(b.start / TOTAL) * 100}%`,
                        width: `max(2px, ${(b.len / TOTAL) * 100}%)`,
                        top: lane * LANE_H + (LANE_H - BAR_H) / 2,
                        height: BAR_H,
                        background: STAGE[b.stage].color,
                        opacity: dim ? 0.35 : 1,
                      }}
                    />
                    {next ? (
                      <div
                        className="absolute w-px bg-fill"
                        style={{
                          left: `${((b.start + b.len) / TOTAL) * 100}%`,
                          top: Math.min(lane, LANES.indexOf(next.stage)) * LANE_H + LANE_H / 2,
                          height: Math.abs(lane - LANES.indexOf(next.stage)) * LANE_H,
                        }}
                      />
                    ) : null}
                  </div>
                );
              })}
            </motion.div>
            {at !== null ? (
              <div
                className="pointer-events-none absolute inset-y-0 w-px bg-[var(--ant-color-text-tertiary)]"
                style={{ left: `${(at / TOTAL) * 100}%` }}
              />
            ) : null}
          </div>
          <div className="relative mt-0.5 h-3">
            {TICKS.map((t) => (
              <span
                key={t.label}
                className="absolute -translate-x-1/2 text-[9px] leading-3 text-tertiary tabular"
                style={{ left: `${t.at * 100}%` }}
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Widget>
  );
}
