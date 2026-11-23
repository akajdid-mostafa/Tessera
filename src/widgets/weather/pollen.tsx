import { LeafTwo20Filled, Mold20Filled, PlantGrass20Filled, PlantRagweed20Filled, TreeDeciduous20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ComponentType, useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/* Canberra in November: peak ryegrass season. Levels 0–4; Thursday's rain knocks grass down and lifts mould. */
const DAYS = ["Today", "Tuesday", "Wednesday", "Thursday", "Friday"];
const RAIN_DAY = 3;

const LEVELS = [
  { label: "None", fill: "var(--ant-color-fill-secondary)", text: "text-tertiary", pill: "bg-fill-secondary" },
  { label: "Low", fill: "var(--ios-green)", text: "text-ios-green", pill: "bg-ios-green/15" },
  { label: "Moderate", fill: "var(--ios-yellow)", text: "text-ios-yellow", pill: "bg-ios-yellow/15" },
  { label: "High", fill: "var(--ios-orange)", text: "text-ios-orange", pill: "bg-ios-orange/15" },
  { label: "Very High", fill: "var(--ios-red)", text: "text-ios-red", pill: "bg-ios-red/15" },
];

type Kind = {
  id: string;
  name: string;
  top: string;
  Icon: ComponentType<{ className?: string }>;
  days: number[];
  /** Today's count, with its unit and a believable wobble. */
  count: number;
  unit: string;
  jitter: number;
};

const KINDS: Kind[] = [
  { id: "grass", name: "Grass", top: "Ryegrass", Icon: PlantGrass20Filled, days: [4, 4, 3, 1, 3], count: 112, unit: "gr/m³", jitter: 6 },
  { id: "tree", name: "Tree", top: "Plane tree", Icon: TreeDeciduous20Filled, days: [2, 2, 2, 1, 2], count: 34, unit: "gr/m³", jitter: 3 },
  { id: "weed", name: "Weed", top: "Plantain", Icon: PlantRagweed20Filled, days: [1, 2, 2, 0, 1], count: 12, unit: "gr/m³", jitter: 2 },
  { id: "mold", name: "Mould", top: "Alternaria", Icon: Mold20Filled, days: [1, 1, 2, 3, 2], count: 2400, unit: "sp/m³", jitter: 120 },
];

/** Weather · medium. Grass, tree, weed and mould levels with a five-day heat strip per row and live counts for today; hover a day's column to switch every level to that day. */
export function PollenWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [day, setDay] = useState<number | null>(null);
  const [counts, setCounts] = useState(() => KINDS.map((k) => k.count));

  useEffect(() => {
    const t = window.setInterval(() => {
      setCounts((cs) => cs.map((c, i) => {
        const k = KINDS[i];
        const next = c + Math.round((Math.random() - 0.5) * k.jitter);
        return Math.max(k.count - k.jitter * 2, Math.min(k.count + k.jitter * 2, next));
      }));
    }, 3000);
    return () => window.clearInterval(t);
  }, []);

  const d = day ?? 0;
  const worst = KINDS.reduce((w, k, i) => (k.days[d] > KINDS[w].days[d] ? i : w), 0);

  return (
    <Widget size="medium" index={index} label="Pollen forecast">
      <WidgetHeader
        icon={<LeafTwo20Filled />}
        tint="var(--ios-green)"
        title="Pollen"
        subtitle={`Canberra · ${KINDS[worst].name} leads`}
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={d}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-0.5 shrink-0 rounded-full bg-fill-secondary px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-secondary"
            >
              {DAYS[d]}
              {d === RAIN_DAY ? <span className="font-normal text-tertiary"> · rain</span> : null}
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="mt-1.5 flex flex-1 flex-col divide-y-[0.5px] divide-split" onMouseLeave={() => setDay(null)}>
        {KINDS.map((k, r) => {
          const lv = LEVELS[k.days[d]];
          return (
            <div key={k.id} className="flex flex-1 items-center gap-2 whitespace-nowrap">
              <span className={cn("grid size-6 shrink-0 place-items-center rounded-md text-[14px]", lv.pill, lv.text)}>
                <k.Icon />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[13px] font-medium text-heading">{k.name}</span>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={day === null ? "live" : "fc"}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="block truncate text-[11px] text-tertiary tabular"
                  >
                    {k.top}
                    {day === null || day === 0 ? (
                      <>
                        {" · "}
                        <AnimatedNumber value={counts[r]} format={{ useGrouping: true }} /> {k.unit}
                      </>
                    ) : (
                      " · forecast"
                    )}
                  </motion.span>
                </AnimatePresence>
              </span>

              <span className="flex shrink-0 gap-[3px]">
                {k.days.map((l, c) => (
                  <motion.button
                    key={c}
                    type="button"
                    aria-label={`${k.name} ${DAYS[c]}: ${LEVELS[l].label}`}
                    onMouseEnter={() => setDay(c)}
                    onFocus={() => setDay(c)}
                    onClick={() => setDay(c)}
                    className={cn(
                      "h-[18px] w-[18px] cursor-pointer rounded-[5px] outline-none transition-shadow",
                      day === c && "ring-1 ring-inset ring-sel",
                    )}
                    style={{ background: LEVELS[l].fill }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: day === null || day === c ? 1 : 0.45 }}
                    transition={{
                      scale: { delay: delay + r * 0.06 + c * 0.04, type: "spring", stiffness: 420, damping: 20 },
                      opacity: { duration: 0.15 },
                    }}
                  />
                ))}
              </span>

              <span className="w-[72px] shrink-0">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={lv.label}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={cn("block rounded-md py-0.5 text-center text-[11px] font-semibold", lv.pill, lv.text)}
                  >
                    {lv.label}
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>
          );
        })}
      </div>
    </Widget>
  );
}
