import { ArrowDown12Filled, ArrowUp12Filled, PersonClock20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

/** Emergency Severity Index, with the color code most US triage boards use. */
const ESI = [
  { name: "Resuscitation", target: "immediate", color: "var(--ios-red)" },
  { name: "Emergent", target: "< 10 min", color: "var(--ios-orange)" },
  { name: "Urgent", target: "< 30 min", color: "var(--ios-yellow)" },
  { name: "Less urgent", target: "< 60 min", color: "var(--ios-green)" },
  { name: "Non-urgent", target: "< 2 h", color: "var(--ios-blue)" },
] as const;
const HOUR_AGO = 34;
const MAX_BAR = 20;

/** Healthcare · small. Median ER wait ticks live; the triage strip shows who is waiting at each ESI level. */
export function ErWaitWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [wait, setWait] = useState(38);
  const [queue, setQueue] = useState([0, 3, 9, 6, 2]);
  const [bumped, setBumped] = useState<{ level: number; id: number } | null>(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setSettled(true), (delay + 1) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    const t = window.setInterval(() => {
      setWait((w) => Math.max(24, Math.min(52, w + Math.round((Math.random() - 0.45) * 4))));
      if (Math.random() < 0.6) {
        // Someone arrives or is roomed; ESI 1 stays empty, they go straight in.
        const level = 1 + Math.floor(Math.random() * 4);
        const arrive = Math.random() < 0.55;
        setQueue((q) => q.map((v, i) => (i === level ? Math.max(0, Math.min(14, v + (arrive ? 1 : -1))) : v)));
        setBumped({ level, id: Date.now() });
      }
    }, 3000);
    return () => window.clearInterval(t);
  }, []);

  const diff = wait - HOUR_AGO;
  const up = diff > 0;
  const total = queue.reduce((a, b) => a + b, 0);
  const max = Math.max(...queue, 1);

  return (
    <Widget size="small" index={index} label="Emergency room wait">
      <WidgetHeader icon={<PersonClock20Filled />} tint="var(--ios-red)" title="ER Wait" subtitle="Mercy General" />

      <div className="mt-2 flex items-baseline-last gap-1.5">
        <div className="flex items-baseline gap-0.5">
          <AnimatedNumber value={wait} className="text-[30px] leading-none font-semibold tracking-tight text-heading" />
          <span className="text-[13px] font-medium text-tertiary">min</span>
        </div>
        <motion.span
          key={up ? "up" : "down"}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 24 }}
          className={cn(
            "mb-0.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[10px] font-semibold",
            up ? "bg-ios-red/15 text-ios-red" : "bg-ios-green/15 text-ios-green",
          )}
        >
          {up ? <ArrowUp12Filled /> : <ArrowDown12Filled />}
          <AnimatedNumber value={Math.abs(diff)} />
        </motion.span>
      </div>
      <div className="mt-1 truncate text-[11px] text-tertiary">
        Median · <AnimatedNumber value={total} className="font-medium text-secondary" /> waiting
      </div>

      <div className="mt-auto grid grid-cols-5 gap-1.5">
        {queue.map((count, i) => {
          const e = ESI[i];
          const pop = bumped?.level === i;
          return (
            <Tooltip
              key={e.name}
              title={
                <span className="tabular">
                  ESI {i + 1} · {e.name} — {count} waiting · target {e.target}
                </span>
              }
            >
              <motion.div className="flex cursor-default flex-col items-center gap-0.5" whileHover={{ y: -2 }}>
                <span className="relative h-3 text-[10px] leading-3 font-semibold text-heading">
                  <AnimatePresence>
                    {pop ? (
                      <motion.span
                        key={bumped.id}
                        className="absolute inset-0 -m-1 rounded-full"
                        style={{ background: e.color }}
                        initial={{ opacity: 0.45, scale: 0.6 }}
                        animate={{ opacity: 0, scale: 1.8 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    ) : null}
                  </AnimatePresence>
                  <AnimatedNumber value={count} className={cn(count === 0 && "text-tertiary")} />
                </span>
                <div className="flex h-5 w-full items-end">
                  <motion.span
                    className="w-full rounded-[4px]"
                    style={{ background: e.color, opacity: count === 0 ? 0.25 : 1 }}
                    initial={{ height: 0 }}
                    animate={{ height: Math.max(3, (count / max) * MAX_BAR) }}
                    transition={{ type: "spring", stiffness: 220, damping: 20, delay: settled ? 0 : delay + i * 0.05 }}
                  />
                </div>
                <span className="text-[9px] leading-none font-medium text-tertiary">{i + 1}</span>
              </motion.div>
            </Tooltip>
          );
        })}
      </div>
    </Widget>
  );
}
