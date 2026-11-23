import {
  Image16Filled,
  Mail20Filled,
  Megaphone20Filled,
  Search16Regular,
  Video16Filled,
} from "@fluentui/react-icons";
import { motion } from "motion/react";
import { type ComponentType, useMemo, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Sort = "ROAS" | "Spend";
type Campaign = {
  id: string;
  name: string;
  channel: string;
  Glyph: ComponentType<{ className?: string }>;
  tile: string;
  spend: number;
  ctr: number;
  roas: number;
  /** Daily ROAS, oldest first. */
  trend: number[];
  note: string;
};

const CAMPAIGNS: Campaign[] = [
  {
    id: "bf",
    name: "Black Friday Early Access",
    channel: "Search",
    Glyph: Search16Regular,
    tile: "linear-gradient(140deg,#0a84ff,#5e5ce6)",
    spend: 12_480,
    ctr: 0.064,
    roas: 5.2,
    trend: [4.1, 4.4, 4.2, 4.9, 5.0, 5.4, 5.2],
    note: "$64.9K revenue · 1,212 orders",
  },
  {
    id: "rt",
    name: "Holiday Retargeting",
    channel: "Meta",
    Glyph: Image16Filled,
    tile: "linear-gradient(140deg,#5e5ce6,#bf5af2)",
    spend: 9_860,
    ctr: 0.019,
    roas: 3.8,
    trend: [3.2, 3.5, 3.9, 3.6, 4.0, 3.7, 3.8],
    note: "$37.5K revenue · over daily budget today",
  },
  {
    id: "gg",
    name: "Gift Guide Newsletter",
    channel: "Email",
    Glyph: Mail20Filled,
    tile: "linear-gradient(140deg,#ff9f0a,#ff375f)",
    spend: 1_240,
    ctr: 0.047,
    roas: 9.6,
    trend: [7.2, 8.8, 9.1, 9.4, 9.0, 9.9, 9.6],
    note: "$11.9K revenue · 41% opens",
  },
  {
    id: "bs",
    name: "Brand Story 30s",
    channel: "YouTube",
    Glyph: Video16Filled,
    tile: "linear-gradient(140deg,#ff453a,#ff9f0a)",
    spend: 8_950,
    ctr: 0.006,
    roas: 0.7,
    trend: [1.4, 1.2, 1.1, 0.9, 0.8, 0.7, 0.7],
    note: "Under 1.0× for 4 days · CPM up 38%",
  },
];

const TOTAL = CAMPAIGNS.reduce((s, c) => s + c.spend, 0);
const SW = 40;
const SH = 16;
function spark(t: number[]) {
  const lo = Math.min(...t);
  const hi = Math.max(...t);
  return t
    .map((v, i) => `${i ? "L" : "M"}${((i / (t.length - 1)) * SW).toFixed(1)} ${(SH - 1 - ((v - lo) / (hi - lo || 1)) * (SH - 2)).toFixed(1)}`)
    .join(" ");
}
const tone = (roas: number) =>
  roas >= 3 ? "bg-ios-green/15 text-ios-green" : roas >= 1 ? "bg-ios-orange/15 text-ios-orange" : "bg-ios-red/15 text-ios-red";

/** Marketing · medium. Active campaigns with spend, CTR and ROAS; sort by ROAS or spend and rows slide, one is losing money. */
export function CampaignsWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [sort, setSort] = useState<Sort>("ROAS");
  const rows = useMemo(
    () => [...CAMPAIGNS].sort((a, b) => (sort === "ROAS" ? b.roas - a.roas : b.spend - a.spend)),
    [sort],
  );

  return (
    <Widget size="medium" index={index} label="Ad campaigns">
      <WidgetHeader
        icon={<Megaphone20Filled />}
        tint="var(--ios-orange)"
        title="Campaigns"
        subtitle={`Last 7 days · $${(TOTAL / 1000).toFixed(1)}K spend`}
        extra={<Segmented size="small" value={sort} onChange={(v) => setSort(v as Sort)} options={["ROAS", "Spend"]} />}
      />

      <div className="mt-1.5 flex h-[14px] items-center gap-2 text-[10px] text-tertiary">
        <span className="flex-1 pl-7">Campaign</span>
        <span className="w-[40px] text-center">7d</span>
        <span className="w-[48px] text-right">Spend</span>
        <span className="w-[36px] text-right">CTR</span>
        <span className="w-[46px] text-right">ROAS</span>
      </div>

      <ul className="flex flex-col">
        {rows.map((c, i) => {
          const bad = c.roas < 1;
          const up = c.trend[c.trend.length - 1] >= c.trend[0];
          return (
            <motion.li
              key={c.id}
              layout
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                layout: { type: "spring", stiffness: 380, damping: 34 },
                default: { type: "spring", stiffness: 380, damping: 28, delay: delay + i * 0.06 },
              }}
              className={cn("flex h-[27px] items-center gap-2", i > 0 && "border-t-[0.5px] border-split")}
            >
              <motion.span
                className="grid size-5 shrink-0 place-items-center rounded-full text-[12px] text-white"
                style={{ background: c.tile }}
                whileHover={{ rotate: -8, scale: 1.1 }}
              >
                <c.Glyph className="size-3" />
              </motion.span>
              <div className="min-w-0 flex-1 truncate text-[12px] leading-tight">
                <span className="font-medium text-heading">{c.name}</span>
                <span className="text-tertiary"> · {c.channel}</span>
              </div>
              <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} className="shrink-0 overflow-visible" aria-hidden>
                <motion.path
                  d={spark(c.trend)}
                  fill="none"
                  stroke={bad ? "var(--ios-red)" : up ? "var(--ios-green)" : "var(--ios-orange)"}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: delay + 0.25 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                />
              </svg>
              <span className="w-[48px] shrink-0 text-right text-[12px] font-medium text-heading tabular">
                ${(c.spend / 1000).toFixed(1)}K
              </span>
              <span className="w-[36px] shrink-0 text-right text-[12px] text-secondary tabular">
                {(c.ctr * 100).toFixed(1)}%
              </span>
              <Tooltip title={c.note}>
                <span className="flex w-[46px] shrink-0 cursor-default justify-end">
                  <span className={cn("rounded-full px-1.5 py-px text-[11px] font-semibold", tone(c.roas))}>
                    <AnimatedNumber value={c.roas} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} suffix="×" />
                  </span>
                </span>
              </Tooltip>
            </motion.li>
          );
        })}
      </ul>
    </Widget>
  );
}
