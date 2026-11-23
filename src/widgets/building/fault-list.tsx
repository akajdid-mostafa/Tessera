import { Stethoscope20Filled, Wrench16Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Severity = "high" | "medium" | "low";
type Finding = { id: string; fault: string; asset: string; cost: number; severity: Severity; detail: string };

const SEED: Finding[] = [
  { id: "shc", fault: "Simultaneous heat & cool", asset: "AHU-3", cost: 4200, severity: "high", detail: "HW and CHW valves both open 31% of occupied hours" },
  { id: "eco", fault: "Economizer stuck closed", asset: "AHU-1", cost: 3650, severity: "high", detail: "OA damper at 0% while OA 11°C · free cooling missed" },
  { id: "dt", fault: "Low chilled-water ΔT", asset: "CH-2", cost: 2900, severity: "medium", detail: "ΔT 3.4 K vs 5.5 K design · extra pump energy" },
  { id: "vav", fault: "VAV damper hunting", asset: "VAV-3-14", cost: 2750, severity: "medium", detail: "Damper reversed 46 times/h · tune PID loop" },
  { id: "lgt", fault: "Lights on after hours", asset: "L5 East", cost: 940, severity: "low", detail: "Zone lit 22:00–06:00 four nights this week" },
];

const SEV = {
  high: "var(--ios-orange)",
  medium: "var(--ios-yellow)",
  low: "var(--ant-color-text-tertiary)",
} as const;

const USD = { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 } as const;

/** Building · medium. Fault-detection findings ranked by avoidable cost: estimates re-score live and rows re-rank with a FLIP, hover explains a finding and tapping one raises a work order. */
export function FaultListWidget({ index }: { index?: number }) {
  const [findings, setFindings] = useState(SEED);
  const [orders, setOrders] = useState<Set<string>>(new Set());
  const settled = useRef(false);

  useEffect(() => {
    const t = window.setTimeout(() => (settled.current = true), 1500);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => {
      setFindings((list) => {
        const k = Math.floor(Math.random() * list.length);
        return list.map((f, i) =>
          i === k ? { ...f, cost: Math.max(600, Math.round((f.cost + (Math.random() - 0.4) * 520) / 10) * 10) } : f,
        );
      });
    }, 3800);
    return () => window.clearInterval(t);
  }, []);

  const ranked = useMemo(() => [...findings].sort((a, b) => b.cost - a.cost), [findings]);
  const top = ranked.slice(0, 4);
  const max = ranked[0].cost;
  const total = findings.reduce((s, f) => s + f.cost, 0);
  const delay = 0.3 + (index ?? 0) * 0.06;

  const toggle = (id: string) =>
    setOrders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Widget size="medium" index={index} label="Fault detection">
      <WidgetHeader
        icon={<Stethoscope20Filled />}
        tint="var(--ios-indigo)"
        title="Fault Detection"
        subtitle={`HQ Tower · ${findings.length} open findings`}
        extra={
          <div className="text-right leading-tight">
            <div className="text-[11px] text-tertiary">Avoidable</div>
            <div className="text-[15px] font-semibold text-heading">
              <AnimatedNumber value={total} format={USD} />
              <span className="text-[11px] font-medium text-tertiary">/yr</span>
            </div>
          </div>
        }
      />

      <ul className="mt-2">
        <AnimatePresence initial={false} mode="popLayout">
          {top.map((f, i) => {
            const wo = orders.has(f.id);
            return (
              <motion.li
                key={f.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="border-b-[0.5px] border-split last:border-b-0"
              >
                <Tooltip title={f.detail} placement="top">
                  <div onClick={() => toggle(f.id)} className="flex h-[30px] cursor-pointer items-center gap-2">
                    <span className="grid w-4 shrink-0 place-items-center text-[11px] font-medium text-tertiary tabular">
                      <AnimatePresence mode="popLayout" initial={false}>
                        {wo ? (
                          <motion.span
                            key="wo"
                            initial={{ scale: 0, rotate: -40 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0 }}
                            transition={{ type: "spring", stiffness: 520, damping: 20 }}
                            className="text-ios-indigo"
                          >
                            <Wrench16Regular className="size-3.5" />
                          </motion.span>
                        ) : (
                          <motion.span key="n" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            {i + 1}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                    <span className="min-w-0 flex-1 truncate whitespace-nowrap text-[12px]">
                      <span className={cn("font-medium", wo ? "text-tertiary" : "text-heading")}>{f.fault}</span>
                      <span className="ml-1.5 text-[11px] text-tertiary">{wo ? "WO raised" : f.asset}</span>
                    </span>
                    <span className="h-1 w-12 shrink-0 overflow-hidden rounded-full bg-fill-secondary">
                      <motion.span
                        className="block h-full rounded-full"
                        style={{ background: SEV[f.severity] }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(f.cost / max) * 100}%` }}
                        transition={{ type: "spring", stiffness: 140, damping: 20, delay: settled.current ? 0 : delay + i * 0.06 }}
                      />
                    </span>
                    <AnimatedNumber
                      value={f.cost}
                      format={USD}
                      className="w-10 shrink-0 text-right text-[12px] font-semibold text-heading"
                    />
                  </div>
                </Tooltip>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </Widget>
  );
}
