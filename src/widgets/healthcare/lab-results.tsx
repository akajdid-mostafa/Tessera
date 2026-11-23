import { Beaker20Filled, Call16Regular, Checkmark16Filled, Warning16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

type Flag = "HH" | "H" | "L" | null;
type Analyte = {
  id: string;
  name: string;
  unit: string;
  lo: number;
  hi: number;
  /** Display domain for the range bar. */
  min: number;
  max: number;
  /** Five draws, oldest first; the last is this morning's. */
  trend: number[];
  digits: number;
  flag: Flag;
};

/* A basic metabolic panel plus CBC for a patient developing acute kidney injury:
 * creatinine and BUN climbing over five draws, potassium crossing the 6.0 critical line. */
const LABS: Analyte[] = [
  { id: "k", name: "Potassium", unit: "mmol/L", lo: 3.5, hi: 5.1, min: 2.5, max: 7, trend: [4.6, 4.9, 5.4, 5.8, 6.1], digits: 1, flag: "HH" },
  { id: "cr", name: "Creatinine", unit: "mg/dL", lo: 0.7, hi: 1.3, min: 0, max: 3, trend: [1.1, 1.4, 1.8, 2.1, 2.4], digits: 1, flag: "H" },
  { id: "bun", name: "BUN", unit: "mg/dL", lo: 7, hi: 20, min: 0, max: 60, trend: [22, 29, 36, 42, 48], digits: 0, flag: "H" },
  { id: "na", name: "Sodium", unit: "mmol/L", lo: 135, hi: 145, min: 125, max: 155, trend: [138, 137, 136, 135, 134], digits: 0, flag: "L" },
  { id: "cl", name: "Chloride", unit: "mmol/L", lo: 98, hi: 107, min: 88, max: 117, trend: [103, 102, 102, 101, 101], digits: 0, flag: null },
  { id: "hgb", name: "Hemoglobin", unit: "g/dL", lo: 13.5, hi: 17.5, min: 8, max: 19, trend: [11.8, 11.6, 11.5, 11.3, 11.2], digits: 1, flag: "L" },
  { id: "wbc", name: "WBC", unit: "K/µL", lo: 4.5, hi: 11, min: 0, max: 16, trend: [7.9, 8.6, 8.1, 8.8, 8.4], digits: 1, flag: null },
];
const DRAWS = ["Fri", "Sat", "Sun", "Mon AM", "Today"];

const FLAG_STYLE: Record<Exclude<Flag, null>, string> = {
  HH: "bg-ios-red/15 text-ios-red",
  H: "bg-ios-orange/15 text-ios-orange",
  L: "bg-ios-orange/15 text-ios-orange",
};
const pct = (a: Analyte, v: number) => Math.min(97, Math.max(3, ((v - a.min) / (a.max - a.min)) * 100));

/** Healthcare · large. This morning's chemistry and CBC against reference ranges; hover a row for its five-draw trend, and read back the critical potassium to clear the alarm. */
export function LabResultsWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [hover, setHover] = useState<string | null>(null);
  const [stage, setStage] = useState<"open" | "confirm" | "done">("open");

  useEffect(() => {
    if (stage !== "confirm") return;
    const t = window.setTimeout(() => setStage("open"), 4000);
    return () => window.clearTimeout(t);
  }, [stage]);

  const abnormal = LABS.filter((a) => a.flag).length;
  const critical = stage !== "done";

  return (
    <Widget
      size="large"
      index={index}
      label="Lab results"
      beam={critical ? { color: [{ color: "rgba(255,69,58,0)", percent: 0 }, { color: "#FF453A", percent: 70 }], duration: 4 } : undefined}
    >
      <WidgetHeader
        icon={<Beaker20Filled />}
        tint="var(--ios-purple)"
        title="Lab Results"
        subtitle="BMP + CBC · drawn 06:10"
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={critical ? "crit" : "ok"}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: "spring", stiffness: 480, damping: 24 }}
              className={cn(
                "flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
                critical ? "bg-ios-red/15 text-ios-red" : "bg-ios-green/15 text-ios-green",
              )}
            >
              {critical ? <Warning16Filled className="size-3.5" /> : <Checkmark16Filled className="size-3.5" />}
              {critical ? "1 critical" : "Reviewed"}
            </motion.span>
          </AnimatePresence>
        }
      />

      {/* Avatar sits on the header chip's column: same x, same 28 px size, same gap. */}
      <div className="mt-2.5 flex h-[34px] items-center gap-2">
        <MemojiAvatar who="m8" size={28} />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[12px] font-semibold text-heading">Harold Jensen, 67 · Bed 4B-07</div>
          <div className="truncate text-[10.5px] text-tertiary">MRN 448-2019 · Dr. Osei</div>
        </div>
        <div className="shrink-0 text-right leading-tight whitespace-nowrap">
          <div className="text-[10.5px] text-tertiary">Abnormal</div>
          <div className="text-[13px] font-semibold text-heading">
            <AnimatedNumber value={abnormal} />
            <span className="text-[11px] font-medium text-tertiary"> of {LABS.length}</span>
          </div>
        </div>
      </div>

      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-tertiary">
        <span className="w-[86px]">Test</span>
        <span className="w-[74px] text-right">Result</span>
        <span className="flex-1 pl-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={hover ? "t" : "r"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {hover ? "Last 5 draws" : "Reference range"}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className="w-[26px] text-center">Flag</span>
      </div>

      <div className="mt-0.5 flex flex-col" onPointerLeave={() => setHover(null)}>
        {LABS.map((a, i) => (
          <Row
            key={a.id}
            a={a}
            i={i}
            delay={delay}
            hover={hover === a.id}
            pulse={a.flag === "HH" && critical}
            onHover={() => setHover(a.id)}
          />
        ))}
      </div>

      <div className="mt-auto">
        <AnimatePresence mode="popLayout" initial={false}>
          {stage !== "done" ? (
            <motion.div
              key="alert"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, filter: "blur(3px)" }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="flex h-[40px] items-center gap-2 rounded-xl bg-ios-red/15 px-2.5"
            >
              <Call16Regular className="shrink-0 text-ios-red" />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[12px] font-semibold text-ios-red">Critical K⁺ 6.1 mmol/L</div>
                <div className="truncate text-[10.5px] text-secondary">
                  {stage === "confirm" ? "Tap again to sign read-back" : "Lab called 06:42 · needs read-back"}
                </div>
              </div>
              <Button
                size="small"
                type="primary"
                danger
                className={cn("shrink-0", stage === "confirm" && "animate-pulse")}
                onClick={() => setStage((s) => (s === "open" ? "confirm" : "done"))}
              >
                {stage === "confirm" ? "Confirm" : "Read back"}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="flex h-[40px] items-center gap-2 rounded-xl bg-ios-green/15 px-2.5"
            >
              <MemojiAvatar who="f6" size={22} />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[12px] font-semibold text-ios-green">Read back · RN Okafor 06:44</div>
                <div className="truncate text-[10.5px] text-secondary">Dr. Osei notified · repeat K⁺ at 10:00</div>
              </div>
              <motion.span
                className="grid size-6 shrink-0 place-items-center rounded-full bg-ios-green text-white"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.25, 1] }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                <Checkmark16Filled />
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Widget>
  );
}

function Row({
  a,
  i,
  delay,
  hover,
  pulse,
  onHover,
}: {
  a: Analyte;
  i: number;
  delay: number;
  hover: boolean;
  pulse: boolean;
  onHover: () => void;
}) {
  const v = a.trend[a.trend.length - 1];
  const tone = a.flag === "HH" ? "var(--ios-red)" : a.flag ? "var(--ios-orange)" : "var(--ios-green)";
  return (
    <motion.div
      onPointerEnter={onHover}
      onClick={onHover}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 30, delay: delay + i * 0.05 }}
      className={cn(
        "flex h-[30px] shrink-0 cursor-default items-center gap-2 border-split transition-colors duration-mid [&:not(:first-child)]:border-t-[0.5px]",
        hover && "bg-fill-quaternary",
      )}
    >
      <span className="w-[86px] truncate text-[12px] font-medium text-heading">{a.name}</span>
      <span className="flex w-[74px] items-baseline justify-end gap-1 whitespace-nowrap">
        <span
          className={cn(
            "text-[13px] font-semibold tabular",
            a.flag === "HH" ? "text-ios-red" : a.flag ? "text-ios-orange" : "text-heading",
          )}
        >
          {v.toFixed(a.digits)}
        </span>
        <span className="text-[10px] text-tertiary">{a.unit}</span>
      </span>
      <div className="relative h-[22px] min-w-0 flex-1 pl-1">
        <AnimatePresence initial={false} mode="wait">
          {hover ? <Trend key="trend" a={a} tone={tone} /> : <Range key="range" a={a} v={v} tone={tone} delay={delay + 0.2 + i * 0.05} />}
        </AnimatePresence>
      </div>
      <span className="grid w-[26px] shrink-0 place-items-center">
        {a.flag ? (
          <motion.span
            className={cn("rounded-full px-1.5 text-[10px] leading-4 font-bold", FLAG_STYLE[a.flag])}
            animate={pulse ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={pulse ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
          >
            {a.flag}
          </motion.span>
        ) : (
          <span className="size-1.5 rounded-full bg-fill" />
        )}
      </span>
    </motion.div>
  );
}

function Range({ a, v, tone, delay }: { a: Analyte; v: number; tone: string; delay: number }) {
  const lo = pct(a, a.lo);
  const hi = pct(a, a.hi);
  return (
    <motion.div
      className="absolute inset-0 left-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
    >
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-fill-quaternary" />
      <div
        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-ios-green/30"
        style={{ left: `${lo}%`, width: `${hi - lo}%` }}
      />
      <motion.span
        className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--widget-surface)]"
        style={{ background: tone }}
        initial={{ left: "0%" }}
        animate={{ left: `${pct(a, v)}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 18, delay }}
      />
    </motion.div>
  );
}

/** The five draws as a line with the reference band behind it. The box keeps its aspect ratio, so the dots stay round. */
function Trend({ a, tone }: { a: Analyte; tone: string }) {
  const W = 160;
  const H = 22;
  const lo = Math.min(a.lo, ...a.trend);
  const hi = Math.max(a.hi, ...a.trend);
  const pad = (hi - lo) * 0.12;
  const y = (v: number) => H - 3 - ((v - (lo - pad)) / (hi - lo + 2 * pad)) * (H - 6);
  const x = (k: number) => 6 + (k / (a.trend.length - 1)) * (W - 12);
  const d = a.trend.map((v, k) => `${k ? "L" : "M"}${x(k).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  return (
    <motion.svg
      viewBox={`0 0 ${W} ${H}`}
      className="absolute inset-0 left-1 h-full w-[calc(100%-4px)]"
      aria-label={`${a.name} trend ${DRAWS.map((dl, k) => `${dl} ${a.trend[k]}`).join(", ")}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
    >
      <rect x="0" width={W} y={y(a.hi)} height={Math.max(1, y(a.lo) - y(a.hi))} fill="var(--ios-green)" opacity={0.14} />
      <path d={d} fill="none" stroke={tone} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      {a.trend.map((v, k) => (
        <motion.circle
          key={k}
          cx={x(k)}
          cy={y(v)}
          r={k === a.trend.length - 1 ? 2.6 : 1.8}
          fill={k === a.trend.length - 1 ? tone : "var(--ant-color-text-tertiary)"}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 22, delay: k * 0.04 }}
        />
      ))}
    </motion.svg>
  );
}
