import { Box20Filled, BuildingHome20Filled, BuildingRetail20Filled, Call20Filled, VehicleTruckProfile20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { MemojiAvatar } from "@/lib/memoji";
import { Button } from "@/registry/antuikit/ui/button";
import { Icon } from "@/registry/antuikit/ui/icon";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

const STOPS: { icon: ReactNode; label: string; time: string }[] = [
  { icon: <Box20Filled />, label: "Packed", time: "08:12" },
  { icon: <BuildingRetail20Filled />, label: "Left hub · Joliet", time: "10:40" },
  { icon: <VehicleTruckProfile20Filled />, label: "Out for delivery", time: "12:05" },
  { icon: <BuildingHome20Filled />, label: "Delivered", time: "ETA 14:20" },
];
const PROGRESS = 0.74;

/** Logistics · medium. The track fills, the truck rides its leading edge, stops light up as it passes. */
export function ShipmentWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;

  return (
    <Widget size="medium" index={index} label="Shipment tracking">
      <WidgetHeader
        icon={<VehicleTruckProfile20Filled />}
        tint="var(--ios-purple)"
        title="Order #US-20481"
        subtitle="2 items · Evanston, IL"
        extra={
          <div className="text-right leading-tight">
            <div className="text-[11px] text-tertiary">Arriving</div>
            <div className="text-[17px] font-semibold text-ios-purple tabular">14:20</div>
          </div>
        }
      />

      <div className="relative mx-3 mt-5 h-7">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-fill-secondary" />
        <motion.div
          className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-ios-purple/60 to-ios-purple"
          initial={{ width: 0 }}
          animate={{ width: `${PROGRESS * 100}%` }}
          transition={{ delay, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
        {STOPS.map((s, i) => {
          const at = i / (STOPS.length - 1);
          const reached = at <= PROGRESS;
          return (
            <Tooltip key={s.label} title={`${s.label} · ${s.time}`}>
              <motion.span
                className={cn(
                  "absolute top-1/2 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[14px]",
                  reached ? "bg-ios-purple text-white" : "bg-fill-secondary text-tertiary",
                )}
                style={{ left: `${at * 100}%` }}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.15 }}
                transition={{ delay: delay + at * 1.2, type: "spring", stiffness: 420, damping: 20 }}
              >
                {s.icon}
              </motion.span>
            </Tooltip>
          );
        })}
        <motion.span
          className="pointer-events-none absolute -top-[18px] -translate-x-1/2 text-ios-purple"
          initial={{ left: "0%" }}
          animate={{ left: `${PROGRESS * 100}%`, y: [0, -2, 0] }}
          transition={{
            left: { delay, duration: 1.4, ease: [0.22, 1, 0.36, 1] },
            y: { repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: delay + 1.4 },
          }}
        >
          <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden>
            <path d="M0 0h10L5 6z" fill="currentColor" />
          </svg>
        </motion.span>
      </div>

      <div className="mt-auto flex items-center gap-2.5">
        <MemojiAvatar who="m3" size={30} alt="Mike K." />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-[13px] font-medium text-heading">Mike K.</div>
          <div className="flex items-center gap-1 text-[11px] text-tertiary">
            <Icon name="star" className="text-ios-yellow" /> 4.9 · 3 stops away
          </div>
        </div>
        <Button shape="circle" color="default" variant="filled" icon={<Icon name="mail" />} aria-label="Message courier" />
        <Button
          shape="circle"
          type="primary"
          className="bg-ios-green hover:bg-ios-green/85"
          icon={<Call20Filled />}
          aria-label="Call courier"
        />
      </div>
    </Widget>
  );
}
