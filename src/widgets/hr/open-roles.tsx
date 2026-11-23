import { Briefcase20Filled, Warning12Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

const STAGES = [
  { label: "Applied", bar: "bg-fill", text: "text-secondary" },
  { label: "Screen", bar: "bg-ios-blue/55", text: "text-ios-blue" },
  { label: "Interview", bar: "bg-ios-indigo", text: "text-ios-indigo" },
  { label: "Offer", bar: "bg-ios-green", text: "text-ios-green" },
] as const;

type Role = { title: string; team: string; manager: string; who: string; pipe: [number, number, number, number]; days: number };
const ROLES: Role[] = [
  { title: "Senior Frontend Engineer", team: "Web Platform · Remote EU", manager: "Lena Fischer", who: "f3", pipe: [64, 18, 7, 2], days: 21 },
  { title: "Product Designer", team: "Growth · Berlin", manager: "Noah Schmidt", who: "m2", pipe: [112, 24, 6, 1], days: 14 },
  { title: "Senior Data Engineer", team: "Data · Berlin", manager: "Jonas Weber", who: "m8", pipe: [23, 6, 2, 0], days: 52 },
  { title: "Account Executive", team: "Sales DACH · Munich", manager: "Clara Hoffmann", who: "f6", pipe: [41, 15, 5, 1], days: 9 },
];
const OPEN_REQS = 14;
const STALE = 45;
const MAX = STAGES.map((_, s) => Math.max(...ROLES.map((r) => r.pipe[s])));
const TOTALS = STAGES.map((_, s) => ROLES.reduce((n, r) => n + r.pipe[s], 0));

/** HR · medium. Priority requisitions with candidates per stage; hover a stage column to light it up and total it in the corner. */
export function OpenRolesWidget({ index }: { index?: number }) {
  const [stage, setStage] = useState<number | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  return (
    <Widget size="medium" index={index} label="Open roles">
      <WidgetHeader
        icon={<Briefcase20Filled />}
        tint="var(--ios-indigo)"
        title="Open Roles"
        subtitle="Applied · Screen · Interview · Offer"
        extra={
          <div className="w-[92px] text-right leading-tight whitespace-nowrap">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={stage ?? "all"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={cn("text-[11px]", stage === null ? "text-tertiary" : STAGES[stage].text)}
              >
                {stage === null ? `${OPEN_REQS} open reqs` : STAGES[stage].label}
              </motion.div>
            </AnimatePresence>
            <div className="text-[15px] font-semibold text-heading">
              <AnimatedNumber value={stage === null ? ROLES.length : TOTALS[stage]} />
              <span className="ml-0.5 text-[11px] font-medium text-tertiary">{stage === null ? "priority" : "people"}</span>
            </div>
          </div>
        }
      />

      <div className="mt-1 flex min-h-0 flex-1 flex-col" onMouseLeave={() => setStage(null)}>
        {ROLES.map((r, ri) => {
          const stale = r.days > STALE;
          return (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 28, delay: delay + ri * 0.07 }}
              className="flex h-[30px] shrink-0 items-center gap-2 border-split [&:not(:first-child)]:border-t-[0.5px]"
            >
              <Tooltip title={`Hiring manager · ${r.manager}`}>
                <span className="grid">
                  <MemojiAvatar who={r.who} size={24} />
                </span>
              </Tooltip>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[12px] font-semibold text-heading">{r.title}</div>
                <div className="truncate text-[10.5px] text-tertiary">{r.team}</div>
              </div>
              <div className="flex shrink-0 gap-0.5">
                {r.pipe.map((n, s) => {
                  const on = stage === s;
                  const dim = stage !== null && !on;
                  return (
                    <div
                      key={s}
                      onMouseEnter={() => setStage(s)}
                      className={cn(
                        "flex w-[30px] cursor-default flex-col items-center rounded-md py-0.5 transition-colors",
                        on && "bg-fill-tertiary",
                      )}
                    >
                      <span
                        className={cn(
                          "text-[12px] leading-[14px] font-semibold tabular transition-colors",
                          n === 0 ? "text-tertiary" : on ? STAGES[s].text : dim ? "text-tertiary" : "text-heading",
                        )}
                      >
                        {n}
                      </span>
                      <span className="mt-0.5 h-[3px] w-5 overflow-hidden rounded-full bg-fill-quaternary">
                        <motion.span
                          className={cn("block h-full origin-left rounded-full", STAGES[s].bar)}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: n / MAX[s] }}
                          transition={{ type: "spring", stiffness: 120, damping: 18, delay: delay + 0.25 + ri * 0.07 + s * 0.05 }}
                        />
                      </span>
                    </div>
                  );
                })}
              </div>
              <Tooltip title={stale ? `No offer yet · ${r.days} days open (team avg 34)` : `${r.days} days open`}>
                <span
                  className={cn(
                    "inline-flex w-[42px] shrink-0 cursor-default items-center justify-center gap-0.5 rounded-full py-0.5 text-[11px] font-semibold tabular",
                    stale ? "bg-ios-red/15 text-ios-red" : "bg-fill-tertiary text-secondary",
                  )}
                >
                  {stale ? <Warning12Filled /> : null}
                  {r.days}d
                </span>
              </Tooltip>
            </motion.div>
          );
        })}
      </div>
    </Widget>
  );
}
