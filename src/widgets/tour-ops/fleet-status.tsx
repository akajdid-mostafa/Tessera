import { VehicleBus20Filled, Warning16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Status = "active" | "maintenance" | "inactive";
type Doc = { kind: "inspection" | "insurance"; days: number };
type Vehicle = { plate: string; model: string; seats: number; status: Status; doc?: Doc };

/* Kaibab Yonder's vans (Resources › Vehicles). `days` = days to the document's `validUntil`; below 0 it has expired. */
const FLEET: Vehicle[] = [
  { plate: "KAB 101", model: "Transit", seats: 7, status: "active", doc: { kind: "insurance", days: 19 } },
  { plate: "KAB 102", model: "Transit", seats: 7, status: "maintenance", doc: { kind: "inspection", days: -4 } },
  { plate: "KAB 103", model: "Transit", seats: 7, status: "active" },
  { plate: "KAC 201", model: "Sprinter", seats: 16, status: "active", doc: { kind: "insurance", days: 23 } },
  { plate: "KAC 202", model: "Sprinter", seats: 16, status: "inactive" },
  { plate: "KAD 301", model: "Sprinter", seats: 19, status: "active", doc: { kind: "inspection", days: 12 } },
];
const STATUS: Record<Status, { label: string; bar: string }> = {
  active: { label: "Active", bar: "bg-ios-green" },
  maintenance: { label: "Maint.", bar: "bg-ios-orange" },
  inactive: { label: "Inactive", bar: "bg-fill" },
};
const ORDER: Status[] = ["active", "maintenance", "inactive"];
const SEATS = FLEET.reduce((s, v) => s + v.seats, 0);
const DUE = FLEET.filter((v) => v.doc).sort((a, b) => a.doc!.days - b.doc!.days);
const DOC_LABEL = { inspection: "Inspection", insurance: "Insurance" } as const;

/** Tour ops · small. Vans by status with their seat share; tap flips to the vehicles whose inspection or insurance runs out soon. */
export function FleetStatusWidget({ index }: { index?: number }) {
  const [face, setFace] = useState<"fleet" | "docs">("fleet");
  const [ready, setReady] = useState(false);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), delay * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  const by = (s: Status) => FLEET.filter((v) => v.status === s);
  const active = by("active");
  const activeSeats = active.reduce((s, v) => s + v.seats, 0);

  return (
    <Widget
      size="small"
      index={index}
      label="Fleet status"
      pressable
      onPress={() => setFace((f) => (f === "fleet" ? "docs" : "fleet"))}
    >
      <WidgetHeader
        icon={<VehicleBus20Filled />}
        tint="var(--ios-teal)"
        title="Fleet"
        subtitle={face === "fleet" ? `${FLEET.length} vehicles` : "Documents due"}
        extra={
          <span className="flex items-center gap-1 pt-1.5">
            {(["fleet", "docs"] as const).map((f) => (
              <motion.span
                key={f}
                className={cn("h-1.5 rounded-full", face === f ? "bg-[var(--ant-color-text-secondary)]" : "bg-fill")}
                animate={{ width: face === f ? 12 : 6 }}
              />
            ))}
          </span>
        }
      />

      <div className="relative mt-3 min-h-0 flex-1" style={{ perspective: 600 }}>
        <AnimatePresence mode="wait" initial={false}>
          {face === "fleet" ? (
            <motion.div
              key="fleet"
              className="absolute inset-0 flex flex-col"
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="flex items-start justify-between">
                <div className="leading-none">
                  <div className="flex items-baseline text-[30px] font-semibold tracking-tight text-heading">
                    <AnimatedNumber value={ready ? active.length : 0} />
                    <span className="ml-0.5 text-[13px] font-medium text-tertiary">/{FLEET.length} active</span>
                  </div>
                  <div className="mt-1.5 text-[11px] text-tertiary">
                    <AnimatedNumber value={ready ? activeSeats : 0} className="font-semibold text-secondary" /> of {SEATS} seats ready
                  </div>
                </div>
                <span className="mt-1 flex items-center gap-0.5 rounded-full bg-ios-orange/15 px-1.5 py-0.5 text-[11px] font-semibold text-ios-orange">
                  <Warning16Filled className="size-3" />
                  {DUE.length}
                </span>
              </div>

              <div className="mt-auto flex h-2.5 gap-[3px]">
                {ORDER.map((s, i) => {
                  const seats = by(s).reduce((n, v) => n + v.seats, 0);
                  return (
                    <motion.span
                      key={s}
                      className={cn("h-full origin-left rounded-full", STATUS[s].bar)}
                      style={{ width: `${(seats / SEATS) * 100}%` }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ type: "spring", stiffness: 160, damping: 22, delay: delay + 0.15 + i * 0.12 }}
                    />
                  );
                })}
              </div>
              <div className="mt-2 grid grid-cols-3 leading-tight">
                {ORDER.map((s) => (
                  <div key={s} className="min-w-0">
                    <div className="text-[13px] font-semibold text-heading tabular">{by(s).length}</div>
                    <div className="flex items-center gap-1 text-[10px] text-tertiary">
                      <span className={cn("size-1.5 shrink-0 rounded-full", STATUS[s].bar)} />
                      <span className="truncate">{STATUS[s].label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="docs"
              className="absolute inset-0 flex flex-col divide-y-[0.5px] divide-split"
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {DUE.map((v, i) => {
                const d = v.doc!;
                const expired = d.days < 0;
                return (
                  <motion.div
                    key={v.plate}
                    className="flex h-[28px] items-center gap-2"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.12 + i * 0.05 }}
                  >
                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="truncate text-[12px] font-semibold text-heading tabular">{v.plate}</div>
                      <div className="truncate text-[10px] text-tertiary">
                        {DOC_LABEL[d.kind]} · {v.model}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold whitespace-nowrap tabular",
                        expired ? "bg-ios-red/15 text-ios-red" : d.days <= 14 ? "bg-ios-orange/15 text-ios-orange" : "bg-ios-yellow/15 text-ios-yellow",
                      )}
                    >
                      {expired ? `${-d.days} d ago` : `${d.days} d`}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
