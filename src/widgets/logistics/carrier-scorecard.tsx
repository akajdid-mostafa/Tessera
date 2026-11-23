import { Ribbon20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Range = "7D" | "30D";
type Stat = { otif: number; prev: number; loads: number; onTime: number; inFull: number; spark: number[] };
type Carrier = { code: string; name: string; tint: string; stats: Record<Range, Stat> };

const TARGET = 95;
const LO = 84;
const HI = 100;

/* OTIF per day (7D) or per 3-day bucket (30D), outbound lanes only. */
const CARRIERS: Carrier[] = [
  {
    code: "NG",
    name: "Northgate Freight",
    tint: "bg-ios-blue/15 text-ios-blue",
    stats: {
      "7D": { otif: 97.2, prev: 95.8, loads: 64, onTime: 97.9, inFull: 99.3, spark: [95.1, 96.4, 97.8, 96.9, 98.2, 97.5, 98.4] },
      "30D": { otif: 96.1, prev: 95.4, loads: 271, onTime: 96.8, inFull: 99.2, spark: [94.2, 95.6, 96.8, 95.1, 96.4, 97.2, 95.9, 96.6, 97.1, 97.4] },
    },
  },
  {
    code: "BW",
    name: "Bluewater Haulage",
    tint: "bg-ios-teal/15 text-ios-teal",
    stats: {
      "7D": { otif: 94.6, prev: 95.9, loads: 41, onTime: 95.4, inFull: 99.1, spark: [96.2, 95.8, 94.1, 93.2, 95.0, 93.8, 94.9] },
      "30D": { otif: 95.3, prev: 94.8, loads: 182, onTime: 96.0, inFull: 99.3, spark: [94.0, 95.2, 96.1, 95.8, 96.3, 95.4, 94.9, 95.1, 94.2, 94.8] },
    },
  },
  {
    code: "KX",
    name: "Kestrel Express",
    tint: "bg-ios-orange/15 text-ios-orange",
    stats: {
      "7D": { otif: 89.1, prev: 92.4, loads: 37, onTime: 90.2, inFull: 98.8, spark: [93.1, 91.8, 90.4, 88.2, 87.6, 89.0, 86.9] },
      "30D": { otif: 91.7, prev: 93.0, loads: 158, onTime: 92.6, inFull: 99.0, spark: [94.4, 93.8, 93.1, 92.9, 92.0, 91.6, 90.8, 90.2, 89.5, 88.9] },
    },
  },
  {
    code: "AL",
    name: "Appalachian Line",
    tint: "bg-ios-purple/15 text-ios-purple",
    stats: {
      "7D": { otif: 98.4, prev: 97.1, loads: 29, onTime: 98.6, inFull: 99.8, spark: [97.5, 98.2, 98.9, 97.8, 98.6, 99.1, 98.7] },
      "30D": { otif: 97.0, prev: 97.3, loads: 117, onTime: 97.4, inFull: 99.6, spark: [96.4, 97.1, 96.8, 97.6, 97.2, 96.5, 97.9, 97.3, 96.9, 97.8] },
    },
  },
];

const SW = 58;
const SH = 22;
const sy = (v: number) => SH - 1 - ((Math.min(HI, Math.max(LO, v)) - LO) / (HI - LO)) * (SH - 2);
/* Both ranges get 10 points so the path keeps its command count and can morph. */
function sparkD(points: number[]) {
  const pts = points.length === 10 ? points : Array.from({ length: 10 }, (_, i) => {
    const t = (i / 9) * (points.length - 1);
    const a = Math.floor(t);
    const b = Math.min(points.length - 1, a + 1);
    return points[a] + (points[b] - points[a]) * (t - a);
  });
  return pts.map((v, i) => `${i ? "L" : "M"}${((i / 9) * SW).toFixed(1)} ${sy(v).toFixed(1)}`).join(" ");
}

/** Logistics · medium. Carriers ranked by OTIF with a sparkline, value and change against the last period; switch the range and the rows re-rank, hover one for its split. */
export function CarrierScorecardWidget({ index }: { index?: number }) {
  const [range, setRange] = useState<Range>("7D");
  const [changed, setChanged] = useState(false);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const rows = [...CARRIERS].sort((a, b) => b.stats[range].otif - a.stats[range].otif);

  return (
    <Widget size="medium" index={index} label="Carrier OTIF scorecard">
      <WidgetHeader
        icon={<Ribbon20Filled />}
        tint="var(--ios-green)"
        title="Carrier OTIF"
        subtitle={`Outbound lanes · target ${TARGET}%`}
        extra={
          <Segmented
            size="small"
            value={range}
            onChange={(v) => {
              setRange(v as Range);
              setChanged(true);
            }}
            options={["7D", "30D"]}
          />
        }
      />

      <div className="mt-2 flex min-h-0 flex-1 flex-col justify-between">
        {rows.map((c, i) => {
          const s = c.stats[range];
          const below = s.otif < TARGET;
          const delta = Math.round((s.otif - s.prev) * 10) / 10;
          return (
            <motion.div
              key={c.code}
              layout
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                layout: { type: "spring", stiffness: 320, damping: 30 },
                opacity: { delay: changed ? 0 : delay + i * 0.06 },
                x: { delay: changed ? 0 : delay + i * 0.06, type: "spring", stiffness: 300, damping: 26 },
              }}
              className="relative flex min-h-0 flex-1 before:absolute before:inset-x-0 before:top-0 before:h-[0.5px] before:bg-split first:before:hidden"
            >
              <Tooltip
                title={`On time ${s.onTime}% · In full ${s.inFull}% · ${Math.round(s.loads * (1 - s.otif / 100))} failed of ${s.loads} loads`}
              >
                <div className="-mx-1.5 flex min-w-0 flex-1 cursor-default items-center gap-2.5 px-1.5 whitespace-nowrap transition-colors hover:bg-fill-quaternary">
                  <span className={cn("grid size-7 shrink-0 place-items-center rounded-md text-[10px] font-bold", c.tint)}>{c.code}</span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-[13px] font-medium text-heading">{c.name}</span>
                    <span className="block truncate text-[11px] text-tertiary tabular">
                      <AnimatedNumber value={s.loads} /> loads
                    </span>
                  </span>
                  <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} className="shrink-0 overflow-visible" aria-hidden>
                    <line x1="0" x2={SW} y1={sy(TARGET)} y2={sy(TARGET)} strokeWidth="1" strokeDasharray="2 2" className="stroke-[var(--ant-color-text-tertiary)]" opacity="0.6" />
                    <motion.path
                      d={sparkD(s.spark)}
                      fill="none"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, d: sparkD(s.spark), stroke: below ? "var(--ios-orange)" : "var(--ant-color-text-secondary)" }}
                      animate={{
                        pathLength: 1,
                        d: sparkD(s.spark),
                        stroke: below ? "var(--ios-orange)" : "var(--ant-color-text-secondary)",
                      }}
                      transition={{
                        pathLength: { delay: delay + 0.2 + i * 0.06, duration: 0.9, ease: [0.22, 1, 0.36, 1] },
                        d: { type: "spring", stiffness: 160, damping: 22 },
                        stroke: { duration: 0.3 },
                      }}
                    />
                  </svg>
                  <span className={cn("w-[46px] text-right text-[14px] font-semibold", below ? "text-ios-orange" : "text-heading")}>
                    <AnimatedNumber value={s.otif} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} suffix="%" />
                  </span>
                  <span
                    className={cn(
                      "w-[48px] rounded-md py-0.5 text-center text-[11px] font-semibold transition-colors",
                      delta >= 0 ? "bg-ios-green/15 text-ios-green" : "bg-ios-red/15 text-ios-red",
                    )}
                  >
                    <AnimatedNumber value={delta} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: "always" }} />
                  </span>
                </div>
              </Tooltip>
            </motion.div>
          );
        })}
      </div>
    </Widget>
  );
}
