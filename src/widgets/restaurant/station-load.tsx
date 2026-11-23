import { DataBarVertical20Filled, Fire20Filled, Food20Filled, FoodChickenLeg20Filled, LeafOne20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { type ComponentType, useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Station = {
  id: string;
  name: string;
  cook: string;
  crew: number;
  Glyph: ComponentType<{ className?: string }>;
  tint: string;
  text: string;
  open: number;
  avg: number;
  /** Open tickets over the last 30 minutes, one point per 3 min. */
  spark: number[];
};
const INITIAL: Station[] = [
  { id: "grill", name: "Grill", cook: "Marco Bianchi", crew: 2, Glyph: Fire20Filled, tint: "var(--ios-red)", text: "text-ios-red", open: 11, avg: 14 * 60 + 20, spark: [4, 5, 5, 6, 7, 7, 8, 9, 10, 11] },
  { id: "saute", name: "Sauté", cook: "Lena Park", crew: 2, Glyph: Food20Filled, tint: "var(--ios-orange)", text: "text-ios-orange", open: 6, avg: 9 * 60 + 40, spark: [5, 6, 7, 6, 6, 7, 6, 5, 6, 6] },
  { id: "fry", name: "Fry", cook: "Tom Okafor", crew: 1, Glyph: FoodChickenLeg20Filled, tint: "var(--ios-yellow)", text: "text-ios-yellow", open: 4, avg: 6 * 60 + 15, spark: [2, 3, 3, 4, 5, 4, 4, 3, 4, 4] },
  { id: "cold", name: "Pantry", cook: "Ana Ruiz", crew: 1, Glyph: LeafOne20Filled, tint: "var(--ios-green)", text: "text-ios-green", open: 2, avg: 4 * 60 + 30, spark: [3, 3, 2, 2, 3, 2, 1, 2, 2, 2] },
];
const SW = 58;
const SH = 18;
const TWO = { minimumIntegerDigits: 2 } as const;

const state = (s: Station) =>
  s.avg >= 12 * 60
    ? { label: "Backed up", cls: "bg-ios-red/15 text-ios-red", stroke: "var(--ios-red)" }
    : s.avg >= 8 * 60
      ? { label: "Busy", cls: "bg-ios-orange/15 text-ios-orange", stroke: "var(--ios-orange)" }
      : { label: "Steady", cls: "bg-ios-green/15 text-ios-green", stroke: "var(--ios-green)" };

const sparkPath = (pts: number[]) => {
  const max = 12;
  return pts
    .map((v, i) => `${i ? "L" : "M"}${((i / (pts.length - 1)) * (SW - 4) + 2).toFixed(1)} ${(SH - 2 - (v / max) * (SH - 4)).toFixed(1)}`)
    .join(" ");
};

/** Restaurant · medium. Each line station with its lead cook, a 30-minute ticket sparkline, open tickets or average time and a status pill; the grill is backed up. */
export function StationLoadWidget({ index }: { index?: number }) {
  const [rows, setRows] = useState(INITIAL);
  const [mode, setMode] = useState<"Open" | "Avg">("Open");
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      setRows((rs) =>
        rs.map((r) => {
          const drift = r.id === "grill" ? (Math.random() < 0.6 ? 1 : -1) : Math.round((Math.random() - 0.5) * 2);
          const open = Math.max(1, Math.min(12, r.open + drift));
          const base = INITIAL.find((x) => x.id === r.id)?.avg ?? r.avg;
          const avg = Math.max(base - 90, Math.min(base + 120, r.avg + drift * 18 + Math.round((Math.random() - 0.5) * 12)));
          return { ...r, open, avg, spark: [...r.spark.slice(1), open] };
        }),
      );
    }, 3200);
    return () => window.clearInterval(t);
  }, []);

  const total = rows.reduce((a, r) => a + r.open, 0);

  return (
    <Widget size="medium" index={index} label="Kitchen station load">
      <WidgetHeader
        icon={<DataBarVertical20Filled />}
        tint="var(--ios-red)"
        title="Station Load"
        subtitle={
          <>
            <AnimatedNumber value={total} /> open tickets · last 30 min
          </>
        }
        extra={
          <Segmented
            size="small"
            value={mode}
            onChange={(v) => setMode(v as "Open" | "Avg")}
            options={["Open", "Avg"]}
            className="text-[11px]"
          />
        }
      />

      <div className="mt-2 flex min-h-0 flex-1 flex-col">
        {rows.map((r, i) => {
          const s = state(r);
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30, delay: delay + i * 0.06 }}
              className="-mx-1.5 flex h-[29px] shrink-0 items-center gap-2.5 rounded-lg px-1.5 transition-colors hover:bg-fill-quaternary"
            >
              <span
                className={cn("grid size-[22px] shrink-0 place-items-center rounded-full", r.text)}
                style={{ background: `color-mix(in srgb, ${r.tint} 18%, transparent)` }}
              >
                <r.Glyph className="size-3.5" />
              </span>
              <div className="flex min-w-0 flex-1 items-center gap-2 leading-tight">
                <span className="w-[50px] shrink-0 truncate text-[12.5px] font-semibold text-heading">{r.name}</span>
                <span className="flex min-w-0 items-center gap-1 text-[11px] text-tertiary">
                  <MemojiAvatar who={r.cook} size={16} />
                  <span className="truncate">
                    {r.cook.split(" ")[0]}
                    {r.crew > 1 ? ` +${r.crew - 1}` : ""}
                  </span>
                </span>
              </div>
              <Tooltip title={`${r.spark[0]} → ${r.open} open in 30 min`}>
                <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} className="shrink-0 overflow-visible">
                  <motion.path
                    d={sparkPath(r.spark)}
                    initial={{ d: sparkPath(r.spark), pathLength: 0 }}
                    animate={{ d: sparkPath(r.spark), pathLength: 1 }}
                    transition={{ pathLength: { duration: 0.9, delay: delay + 0.2 + i * 0.06 }, d: { duration: 0.6 } }}
                    fill="none"
                    stroke={s.stroke}
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Tooltip>
              <div className="w-[40px] shrink-0 text-right text-[14px] font-semibold text-heading">
                {mode === "Open" ? (
                  <AnimatedNumber value={r.open} />
                ) : (
                  <span className={cn(r.avg >= 12 * 60 && "text-ios-red")}>
                    <AnimatedNumber value={Math.floor(r.avg / 60)} />:
                    <AnimatedNumber value={r.avg % 60} format={TWO} />
                  </span>
                )}
              </div>
              <span className={cn("w-[66px] shrink-0 rounded-full py-0.5 text-center text-[10.5px] font-semibold", s.cls)}>
                {s.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </Widget>
  );
}
