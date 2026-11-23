import { ArrowRepeatAll20Filled } from "@fluentui/react-icons";
import { motion, useAnimationFrame, useMotionValue } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { Switch } from "@/registry/antuikit/ui/switch";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

const CX = 100;
const CY = 100;
const R = 88;
const SECTORS = 36;
const STEP = 360 / SECTORS;
const START = 212;
/** Visual sweep at a 60 % timer, in degrees per second. A real pivot takes ~19 h. */
const BASE_RATE = 4;
const SPEEDS = [40, 60, 80] as const;
const DEPTH_AT_100 = 7.6;
const HOURS_AT_100 = 11.2;
const TRACKS = [22, 44, 66];

const norm = (a: number) => ((a % 360) + 360) % 360;
const pt = (a: number, r = R) => {
  const rad = (a * Math.PI) / 180;
  return `${(CX + r * Math.sin(rad)).toFixed(2)} ${(CY - r * Math.cos(rad)).toFixed(2)}`;
};
const wedge = (a0: number, a1: number, r = R) => `M${CX} ${CY} L${pt(a0, r)} A${r} ${r} 0 0 1 ${pt(a1, r)} Z`;

/** Agriculture · large. The pivot arm sweeps the field, leaving a wet trail that dries behind it. */
export function CenterPivotWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [dir, setDir] = useState<1 | -1>(1);
  const [speed, setSpeed] = useState<number>(60);
  const [endGun, setEndGun] = useState(true);
  const [now, setNow] = useState(0);
  const [pos, setPos] = useState(START);

  const angle = useMotionValue(START);
  const clock = useRef(0);
  const live = useRef({ dir, speed });
  live.current = { dir, speed };
  // Seconds since the arm last crossed each sector, as if it had been running forward.
  const visited = useRef<number[]>(
    Array.from({ length: SECTORS }, (_, i) => -norm(START - (i + 0.5) * STEP) / BASE_RATE),
  );

  useAnimationFrame((_, delta) => {
    const dt = Math.min(delta, 100) / 1000;
    clock.current += dt;
    const a = angle.get() + live.current.dir * BASE_RATE * (live.current.speed / 60) * dt;
    angle.set(a);
    visited.current[Math.floor(norm(a) / STEP) % SECTORS] = clock.current;
  });

  useEffect(() => {
    const t = window.setInterval(() => {
      setNow(clock.current);
      setPos(Math.round(norm(angle.get())));
    }, 1000);
    return () => window.clearInterval(t);
  }, [angle]);

  const depth = (DEPTH_AT_100 * 100) / speed;
  const hours = (HOURS_AT_100 * 100) / speed;

  return (
    <Widget size="large" index={index} label="Center pivot irrigation">
      <WidgetHeader
        icon={<ArrowRepeatAll20Filled />}
        tint="var(--ios-blue)"
        title="Pivot 3 · North 40"
        subtitle="Corn · 52 ha · V12 stage"
        extra={
          <Segmented
            size="small"
            value={dir}
            onChange={(v) => setDir(v as 1 | -1)}
            options={[
              { value: 1, label: "Fwd" },
              { value: -1, label: "Rev" },
            ]}
          />
        }
      />

      {/* The field takes the row's full height (the large cell has room for 240 px),
          so the drawing, not empty space, carries the widget. */}
      <div className="my-2.5 flex flex-1 items-center gap-3">
        <svg viewBox="0 0 200 200" className="size-[240px] shrink-0" aria-hidden>
          <rect x="1" y="1" width="198" height="198" rx="20" fill="var(--ant-color-fill-quaternary)" />
          <circle cx={CX} cy={CY} r={R} fill="var(--ant-color-fill-tertiary)" />
          {Array.from({ length: SECTORS }, (_, i) => {
            const wet = Math.min(1, 0.08 + 0.92 * Math.exp(-(now - visited.current[i]) / 55));
            return (
              <motion.path
                key={i}
                d={wedge(i * STEP, (i + 1) * STEP)}
                fill="var(--ios-blue)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + i * 0.018, duration: 0.4 }}
                style={{ fillOpacity: 0.05 + wet * 0.5, transition: "fill-opacity 1s linear" }}
              />
            );
          })}
          {TRACKS.map((r) => (
            <circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke="var(--widget-surface)" strokeOpacity={0.55} strokeWidth={1.2} />
          ))}
          <path d={`M${CX} ${CY} V199`} stroke="var(--widget-surface)" strokeOpacity={0.7} strokeWidth={3} />
          <text x="14" y="20" fontSize="9" fontWeight={600} fill="var(--ant-color-text-tertiary)">
            N ↑
          </text>

          <motion.g style={{ rotate: angle }}>
            {/* An invisible disc centered on the hub, so the group rotates about the pivot. */}
            <circle cx={CX} cy={CY} r={98} fill="transparent" />
            <motion.path
              d={dir === 1 ? wedge(-10, 0) : wedge(0, 10)}
              fill="var(--ios-blue)"
              animate={{ opacity: [0.25, 0.5, 0.25] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
            {endGun ? (
              <motion.path
                d={`M${CX} ${CY - R} L${CX - 7} ${CY - R - 9} Q${CX} ${CY - R - 12} ${CX + 7} ${CY - R - 9} Z`}
                fill="var(--ios-blue)"
                animate={{ opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              />
            ) : null}
            <line x1={CX} y1={CY} x2={CX} y2={CY - R} stroke="var(--ant-color-text-secondary)" strokeWidth={2.5} strokeLinecap="round" />
            {[22, 44, 66, 88].map((r) => (
              <circle key={r} cx={CX} cy={CY - r} r={2.6} fill="var(--widget-surface)" stroke="var(--ant-color-text-secondary)" strokeWidth={1.5} />
            ))}
          </motion.g>
          <circle cx={CX} cy={CY} r={6} fill="var(--ant-color-text-secondary)" />
          <circle cx={CX} cy={CY} r={2.2} fill="var(--widget-surface)" />
        </svg>

        <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch divide-y-[0.5px] divide-split whitespace-nowrap py-1">
          <Stat label="Position">
            <AnimatedNumber value={pos} suffix="°" />
            <span className="ml-1 text-[11px] font-medium text-tertiary">{dir === 1 ? "cw" : "ccw"}</span>
          </Stat>
          <Tooltip title="Tap to change the % timer">
            <button
              type="button"
              onClick={() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s as (typeof SPEEDS)[number]) + 1) % SPEEDS.length])}
              className="cursor-pointer text-left outline-none"
            >
              <Stat label="Speed timer">
                <AnimatedNumber value={speed} suffix="%" />
              </Stat>
            </button>
          </Tooltip>
          <Stat label="Applied / pass">
            <AnimatedNumber value={depth} format={{ maximumFractionDigits: 1 }} />
            <span className="ml-0.5 text-[11px] font-medium text-tertiary">mm</span>
          </Stat>
          <Stat label="Full circle">
            <AnimatedNumber value={hours} format={{ maximumFractionDigits: 1 }} />
            <span className="ml-0.5 text-[11px] font-medium text-tertiary">h · 1.9 bar</span>
          </Stat>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <MemojiAvatar who="m7" size={30} alt="Dale Hughes" />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[13px] font-medium text-heading">Dale Hughes</div>
          <div className="truncate text-[11px] text-tertiary">Started 05:40 · stops on rain</div>
        </div>
        <span className="text-[11px] text-secondary">End gun</span>
        <Switch size="small" checked={endGun} onChange={setEndGun} aria-label="End gun" />
      </div>
    </Widget>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-1.5 leading-tight">
      <div className="text-[11px] text-tertiary">{label}</div>
      <div className="text-[19px] font-semibold tracking-tight text-heading tabular">{children}</div>
    </div>
  );
}
