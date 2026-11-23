import { Trophy20Filled } from "@fluentui/react-icons";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useId, useMemo, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";

type Metric = "Revenue" | "Deals";
const REPS = [
  { name: "Maya Chen", revenue: 186_400, deals: 9 },
  { name: "Diego Ramos", revenue: 171_200, deals: 12 },
  { name: "Priya Natarajan", revenue: 158_900, deals: 7 },
  { name: "Owen Brooks", revenue: 132_500, deals: 11 },
  { name: "Lena Fischer", revenue: 118_000, deals: 8 },
  { name: "Sam Okoye", revenue: 96_300, deals: 10 },
  { name: "Jonah Park", revenue: 71_800, deals: 6 },
];

/** Podium slots left to right: 2nd, 1st, 3rd. */
const SLOTS = [
  { rank: 1, block: 34, face: 28, tone: "bg-gradient-to-b from-fill-secondary to-fill-quaternary", num: "text-secondary" },
  { rank: 0, block: 48, face: 34, tone: "bg-gradient-to-b from-ios-yellow/40 to-ios-yellow/5", num: "text-ios-yellow" },
  { rank: 2, block: 26, face: 28, tone: "bg-gradient-to-b from-ios-orange/30 to-ios-orange/5", num: "text-ios-orange" },
];
const RISE_ORDER = [1, 2, 0]; // 3rd rises first, then 2nd, then 1st

const K = { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 0 } as const;
const SPRING = { type: "spring", stiffness: 320, damping: 30 } as const;

/** Sales · medium. A podium for the top three reps; switching Revenue or Deals re-ranks and faces fly to new spots. */
export function RepLeaderboardWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const uid = useId();
  const [metric, setMetric] = useState<Metric>("Revenue");
  const ranked = useMemo(
    () => [...REPS].sort((a, b) => (metric === "Revenue" ? b.revenue - a.revenue : b.deals - a.deals)),
    [metric],
  );
  const val = (r: (typeof REPS)[number]) => (metric === "Revenue" ? r.revenue : r.deals);

  return (
    <Widget size="medium" index={index} label="Sales rep leaderboard">
      <WidgetHeader
        icon={<Trophy20Filled />}
        tint="var(--ios-yellow)"
        title="Leaderboard"
        subtitle="November · Team West"
        extra={<Segmented size="small" value={metric} onChange={(v) => setMetric(v as Metric)} options={["Revenue", "Deals"]} />}
      />

      <LayoutGroup id={uid}>
        <div className="mt-2 flex min-h-0 flex-1 gap-3">
          {/* Podium */}
          <div className="flex w-[190px] shrink-0 items-end gap-1">
            {SLOTS.map((s, si) => {
              const r = ranked[s.rank];
              return (
                <div key={s.rank} className="flex min-w-0 flex-1 flex-col items-center">
                  <div className="relative">
                    <motion.div layoutId={`face-${r.name}`} transition={SPRING} className="relative z-10">
                      <MemojiAvatar who={r.name} size={s.face} className="ring-[1.5px] ring-[var(--widget-surface)]" />
                    </motion.div>
                    {s.rank === 0 ? (
                      <motion.span
                        className="absolute -top-1.5 -right-2 z-20 grid size-[18px] place-items-center rounded-full bg-ios-yellow-deep text-[11px] text-white ring-2 ring-[var(--widget-surface)]"
                        initial={{ scale: 0, rotate: -40 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 14, delay: delay + 0.75 }}
                      >
                        <Trophy20Filled className="size-[11px]" />
                      </motion.span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 h-[13px] w-full overflow-hidden text-center">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.div
                        key={r.name}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="truncate text-[11px] leading-[13px] text-secondary"
                      >
                        {r.name.split(" ")[0]}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <AnimatedNumber
                    value={val(r)}
                    format={metric === "Revenue" ? K : undefined}
                    suffix={metric === "Deals" ? " deals" : undefined}
                    className="text-[12px] leading-[15px] font-semibold text-heading"
                  />
                  <motion.div
                    className={cn("mt-1 grid w-full origin-bottom place-items-center rounded-t-[10px]", s.tone)}
                    style={{ height: s.block }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ type: "spring", stiffness: 180, damping: 18, delay: delay + RISE_ORDER.indexOf(si) * 0.12 }}
                  >
                    <span className={cn("text-[15px] font-bold", s.num)}>{s.rank + 1}</span>
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* The rest */}
          <ul className="flex min-w-0 flex-1 flex-col justify-end">
            {ranked.slice(3).map((r, i) => (
              <motion.li
                key={`row-${i}`}
                className={cn("flex h-[30px] items-center gap-2", i > 0 && "border-t-[0.5px] border-split")}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 28, delay: delay + 0.3 + i * 0.06 }}
              >
                <span className="w-3 shrink-0 text-center text-[11px] font-semibold text-tertiary tabular">{i + 4}</span>
                <motion.div layoutId={`face-${r.name}`} transition={SPRING} className="shrink-0">
                  <MemojiAvatar who={r.name} size={20} />
                </motion.div>
                <span className="min-w-0 flex-1 truncate text-[12px] text-heading">{r.name}</span>
                <AnimatedNumber
                  value={val(r)}
                  format={metric === "Revenue" ? K : undefined}
                  className="shrink-0 text-[12px] font-semibold text-secondary"
                />
              </motion.li>
            ))}
          </ul>
        </div>
      </LayoutGroup>
    </Widget>
  );
}
