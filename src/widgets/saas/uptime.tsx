import { Server20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Day = { date: string; uptime: number; level: "ok" | "minor" | "major" };
const DAYS: Day[] = Array.from({ length: 45 }, (_, i) => {
  const d = new Date(2026, 8, 25 + i);
  const level = i === 12 ? "major" : i === 29 || i === 37 ? "minor" : "ok";
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    uptime: level === "major" ? 98.71 : level === "minor" ? 99.82 : 100,
    level,
  };
});
const LEVEL = { ok: "bg-ios-green", minor: "bg-ios-yellow", major: "bg-ios-red" } as const;

/** SaaS · medium. Live latency ticks, a beam circles the healthy service, every day bar explains itself on hover. */
export function UptimeWidget({ index }: { index?: number }) {
  const [latency, setLatency] = useState(142);

  useEffect(() => {
    const t = window.setInterval(() => setLatency(118 + Math.round(Math.random() * 48)), 1500);
    return () => window.clearInterval(t);
  }, []);

  return (
    <Widget
      size="medium"
      index={index}
      label="Service uptime"
      beam={{
        color: [
          { color: "rgba(48,209,88,0)", percent: 0 },
          { color: "#30D158", percent: 70 },
        ],
        duration: 7,
      }}
    >
      <WidgetHeader
        icon={<Server20Filled />}
        tint="var(--ios-green)"
        title="Booking API"
        subtitle="eu-central-1 · 12 instances"
        extra={
          <span className="flex items-center gap-1.5 rounded-full bg-ios-green/15 px-2 py-0.5 text-[11px] font-semibold text-ios-green">
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-ios-green opacity-70" />
              <span className="relative size-1.5 rounded-full bg-ios-green" />
            </span>
            Operational
          </span>
        }
      />

      <div className="mt-3 flex items-baseline-last gap-6">
        <div>
          <div className="text-[11px] text-tertiary">Uptime · 45 days</div>
          <div className="text-[26px] leading-none font-semibold tracking-tight text-heading tabular">99.982%</div>
        </div>
        <div>
          <div className="text-[11px] text-tertiary">p95 latency</div>
          <div className="text-[26px] leading-none font-semibold tracking-tight text-heading">
            <AnimatedNumber value={latency} />
            <span className="ml-0.5 text-[13px] font-medium text-tertiary">ms</span>
          </div>
        </div>
      </div>

      <div className="mt-auto flex h-7 items-end gap-[2px]">
        {DAYS.map((d, i) => (
          <Tooltip
            key={d.date}
            title={
              <span className="tabular">
                {d.date} · {d.uptime}%{d.level !== "ok" ? (d.level === "major" ? " · 18 min outage" : " · degraded") : ""}
              </span>
            }
          >
            <motion.span
              className={cn("h-full flex-1 origin-bottom rounded-[2px]", LEVEL[d.level], d.level === "ok" && "opacity-80")}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              whileHover={{ scaleY: 1.25, opacity: 1 }}
              transition={{ delay: 0.3 + (index ?? 0) * 0.06 + i * 0.012, type: "spring", stiffness: 380, damping: 22 }}
            />
          </Tooltip>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[9px] text-tertiary">
        <span>45 days ago</span>
        <span>Today</span>
      </div>
    </Widget>
  );
}
