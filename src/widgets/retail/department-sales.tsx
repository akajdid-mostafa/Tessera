import {
  ClothesHanger16Regular,
  Home16Regular,
  Sparkle16Regular,
  TagMultiple20Filled,
} from "@fluentui/react-icons";
import { motion } from "motion/react";
import { type ComponentType, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Range = "Today" | "MTD";
type Dept = {
  name: string;
  floor: string;
  Glyph: ComponentType<{ className?: string }>;
  tint: string;
  /** Sales and the target to this point, in $. */
  sales: Record<Range, number>;
  target: Record<Range, number>;
  conv: number;
  atv: number;
};
const DEPTS: Dept[] = [
  { name: "Womenswear", floor: "Ground · 4 on floor", Glyph: ClothesHanger16Regular, tint: "var(--ios-pink)", sales: { Today: 14_820, MTD: 131_400 }, target: { Today: 15_900, MTD: 138_000 }, conv: 21, atv: 68 },
  { name: "Beauty", floor: "Ground · 3 on floor", Glyph: Sparkle16Regular, tint: "var(--ios-purple)", sales: { Today: 9_610, MTD: 88_200 }, target: { Today: 9_200, MTD: 81_500 }, conv: 34, atv: 41 },
  { name: "Home & Living", floor: "Level 1 · 2 on floor", Glyph: Home16Regular, tint: "var(--ios-teal)", sales: { Today: 7_930, MTD: 61_800 }, target: { Today: 7_400, MTD: 63_100 }, conv: 16, atv: 74 },
];
/** The bar spans 0–125 % of target, so the target tick sits at 80 %. */
const SCALE = 1.25;
const USD = { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 } as const;

const tone = (r: number) =>
  r >= 1
    ? { bar: "bg-ios-green", pill: "bg-ios-green/15 text-ios-green" }
    : r >= 0.9
      ? { bar: "bg-ios-orange", pill: "bg-ios-orange/15 text-ios-orange" }
      : { bar: "bg-ios-red", pill: "bg-ios-red/15 text-ios-red" };

/** Retail · medium. Each department's sales against its target to now; switch today or month-to-date and the bars and figures roll. */
export function DepartmentSalesWidget({ index }: { index?: number }) {
  const [range, setRange] = useState<Range>("Today");
  const [switched, setSwitched] = useState(false);
  const delay = switched ? 0 : 0.3 + (index ?? 0) * 0.06;
  const total = DEPTS.reduce((s, d) => s + d.sales[range], 0);
  const goal = DEPTS.reduce((s, d) => s + d.target[range], 0);

  return (
    <Widget size="medium" index={index} label="Sales vs target by department">
      <WidgetHeader
        icon={<TagMultiple20Filled />}
        tint="var(--ios-green)"
        title="Sales vs Target"
        subtitle={
          <span className="tabular">
            <AnimatedNumber value={total} format={USD} className="font-semibold text-secondary" /> of{" "}
            <AnimatedNumber value={goal} format={USD} /> {range === "Today" ? "to 14:40" : "Nov 1–9"}
          </span>
        }
        extra={
          <Segmented
            size="small"
            value={range}
            onChange={(v) => {
              setRange(v as Range);
              setSwitched(true);
            }}
            options={["Today", "MTD"]}
          />
        }
      />

      <div className="mt-2 flex min-h-0 flex-1 flex-col gap-2">
        {DEPTS.map((d, i) => {
          const r = d.sales[range] / d.target[range];
          const t = tone(r);
          return (
            <Tooltip
              key={d.name}
              placement="left"
              title={`${d.name} · conversion ${d.conv}% · avg basket $${d.atv} · target $${d.target[range].toLocaleString("en-US")}`}
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 360, damping: 28, delay: 0.3 + (index ?? 0) * 0.06 + i * 0.07 }}
                className="group relative -mx-1.5 flex h-[36px] shrink-0 cursor-default items-center gap-2.5 px-1.5 transition-colors hover:bg-fill-quaternary [&:not(:first-child)]:before:absolute [&:not(:first-child)]:before:inset-x-1.5 [&:not(:first-child)]:before:-top-1 [&:not(:first-child)]:before:h-[0.5px] [&:not(:first-child)]:before:bg-split"
              >
                <span
                  className="grid size-6 shrink-0 place-items-center rounded-full text-[13px] text-white"
                  style={{ background: d.tint }}
                >
                  <d.Glyph />
                </span>
                <div className="w-[104px] min-w-0 shrink-0 leading-tight">
                  <div className="truncate text-[12.5px] font-semibold text-heading">{d.name}</div>
                  <div className="truncate text-[10.5px] text-tertiary">{d.floor}</div>
                </div>
                <div className="relative h-1.5 min-w-0 flex-1 rounded-full bg-fill-secondary">
                  <motion.div
                    className={cn("absolute inset-y-0 left-0 rounded-full", t.bar)}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(1, r / SCALE) * 100}%` }}
                    transition={{ type: "spring", stiffness: 90, damping: 18, delay: delay + 0.2 + i * 0.07 }}
                  />
                  <span
                    className="absolute -top-[3px] h-3 w-0.5 rounded-full bg-[var(--ant-color-text)]"
                    style={{ left: `${(1 / SCALE) * 100}%` }}
                  />
                </div>
                <AnimatedNumber
                  value={d.sales[range]}
                  format={USD}
                  className="w-[54px] shrink-0 text-right text-[13px] font-semibold text-heading"
                />
                <span className={cn("inline-flex w-[44px] shrink-0 justify-center rounded-full py-0.5 text-[11px] font-semibold", t.pill)}>
                  <AnimatedNumber value={r} format={{ style: "percent", maximumFractionDigits: 0 }} />
                </span>
              </motion.div>
            </Tooltip>
          );
        })}
      </div>
    </Widget>
  );
}
