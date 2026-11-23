import { ArrowSwap16Regular, Router20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { GuardButton, walk } from "./_parts";

type Link = "wan1" | "wan2";
type Health = "healthy" | "degraded" | "recovering";
type Stats = { latency: number; loss: number };

const LINKS: Record<Link, { name: string; carrier: string; path: string }> = {
  wan1: { name: "WAN1 · Fiber", carrier: "Metro Fiber", path: "M27 31 C 48 6, 70 6, 91 31" },
  wan2: { name: "WAN2 · LTE", carrier: "Skyline LTE", path: "M27 41 C 48 66, 70 66, 91 41" },
};
const NORMAL: Record<Link, Stats> = { wan1: { latency: 9, loss: 0 }, wan2: { latency: 38, loss: 0.2 } };
const BAD: Stats = { latency: 71, loss: 3.8 };
const ONE_DP = { minimumFractionDigits: 1, maximumFractionDigits: 1 } as const;

/** Network · medium. Two WAN uplinks with packets riding the active one; when the fiber degrades, a guarded failover moves traffic to LTE and the Active badge slides across. */
export function WanUplinksWidget({ index }: { index?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [active, setActive] = useState<Link>("wan1");
  const [health, setHealth] = useState<Health>("healthy");
  const [stats, setStats] = useState<Record<Link, Stats>>(NORMAL);

  // Fiber starts losing packets a few seconds in: the abnormal moment.
  useEffect(() => {
    const t = window.setTimeout(() => setHealth("degraded"), 6500 + (index ?? 0) * 60);
    return () => window.clearTimeout(t);
  }, [index]);

  // After a failover, the fiber recovers on its own a little later.
  useEffect(() => {
    if (active !== "wan2" || health !== "degraded") return;
    const t = window.setTimeout(() => setHealth("recovering"), 9000);
    return () => window.clearTimeout(t);
  }, [active, health]);

  useEffect(() => {
    const t = window.setInterval(() => {
      setStats((s) => {
        const target1 = health === "degraded" ? BAD : NORMAL.wan1;
        return {
          wan1: {
            latency: Math.round(walk(s.wan1.latency + (target1.latency - s.wan1.latency) * 0.45, 2, 7, 90)),
            loss: Math.max(0, walk(s.wan1.loss + (target1.loss - s.wan1.loss) * 0.45, 0.15, 0, 6)),
          },
          wan2: {
            latency: Math.round(walk(s.wan2.latency, 3, 31, 48)),
            loss: walk(s.wan2.loss, 0.08, 0, 0.5),
          },
        };
      });
    }, 1400);
    return () => window.clearInterval(t);
  }, [health]);

  const degraded = health === "degraded";
  const onBackup = active === "wan2";
  const status = degraded && !onBackup ? "WAN1 degraded" : onBackup ? "On LTE backup" : "Healthy";

  const failover = () => setActive("wan2");
  const failback = () => {
    setActive("wan1");
    setHealth("healthy");
  };

  return (
    <Widget size="medium" index={index} label="WAN uplinks">
      <WidgetHeader
        icon={<Router20Filled />}
        tint="var(--ios-indigo)"
        title="Brooklyn branch"
        subtitle="MX85 · SD-WAN edge"
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={status}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                degraded && !onBackup ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-secondary text-secondary",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  degraded && !onBackup ? "animate-pulse bg-ios-orange" : onBackup ? "bg-ios-yellow" : "bg-ios-green",
                )}
              />
              {status}
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="mt-2 flex items-center gap-2.5">
        <svg viewBox="0 0 118 72" className="h-[72px] w-[118px] shrink-0 overflow-visible" aria-hidden>
          {(["wan1", "wan2"] as Link[]).map((l) => {
            const isActive = l === active;
            const bad = l === "wan1" && degraded;
            return (
              <g key={l}>
                <path id={`${uid}-${l}`} d={LINKS[l].path} fill="none" strokeWidth={isActive ? 2.5 : 1.5} strokeDasharray={isActive ? undefined : "3 4"} className={cn("transition-all duration-mid", bad ? "stroke-ios-orange/60" : isActive ? "stroke-fill" : "stroke-fill-secondary")} />
                {isActive
                  ? [0, 1, 2].map((k) => (
                      <circle key={`${l}-${k}`} r={2.4} className={bad ? "fill-ios-orange" : "fill-ios-green"}>
                        <animateMotion dur={bad ? "2.4s" : "1.5s"} begin={`${k * (bad ? 0.8 : 0.5)}s`} repeatCount="indefinite">
                          <mpath href={`#${uid}-${l}`} />
                        </animateMotion>
                        {bad ? <animate attributeName="opacity" values="1;1;0;1" dur={`${1.7 + k * 0.4}s`} repeatCount="indefinite" /> : null}
                      </circle>
                    ))
                  : null}
                <text x={59} y={l === "wan1" ? 9 : 70} textAnchor="middle" className={cn("text-[9px] font-semibold", isActive ? "fill-secondary" : "fill-tertiary")}>
                  {l === "wan1" ? "Fiber" : "LTE"}
                </text>
              </g>
            );
          })}
          {/* Edge router */}
          <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.3 + (index ?? 0) * 0.06 }} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
            <circle cx={15} cy={36} r={13} className="fill-fill-secondary" />
            <path d="M9 33 h12 M9 39 h12 M18 30 l3 3 -3 3 M12 36 l-3 3 3 3" fill="none" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" className="stroke-secondary" />
          </motion.g>
          {/* Internet */}
          <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.4 + (index ?? 0) * 0.06 }} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
            <circle cx={103} cy={36} r={13} className="fill-fill-secondary" />
            <circle cx={103} cy={36} r={6.5} fill="none" strokeWidth={1.3} className="stroke-secondary" />
            <ellipse cx={103} cy={36} rx={2.8} ry={6.5} fill="none" strokeWidth={1.1} className="stroke-secondary" />
            <path d="M96.5 36 h13" strokeWidth={1.1} className="stroke-secondary" />
          </motion.g>
        </svg>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {(["wan1", "wan2"] as Link[]).map((l) => {
            const s = stats[l];
            const bad = l === "wan1" && degraded;
            return (
              <div key={l} className="flex h-[33px] items-center gap-2 rounded-xl bg-fill-quaternary px-2.5">
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-[12px] font-semibold text-heading">{LINKS[l].name}</div>
                  <div className="truncate text-[10px] text-tertiary tabular">
                    <AnimatedNumber value={s.latency} className={cn(bad && "font-semibold text-ios-orange")} /> ms ·{" "}
                    <AnimatedNumber value={s.loss} format={ONE_DP} className={cn(bad && "font-semibold text-ios-orange")} />% loss
                  </div>
                </div>
                {l === active ? (
                  <motion.span
                    layoutId={`wan-active-${uid}`}
                    className="rounded-full bg-ios-green/15 px-1.5 py-px text-[10px] font-semibold text-ios-green"
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  >
                    Active
                  </motion.span>
                ) : (
                  <span className="rounded-full bg-fill-secondary px-1.5 py-px text-[10px] font-semibold text-tertiary">Ready</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto flex h-[26px] items-center gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={degraded && !onBackup ? "paged" : `${active}-${health}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex min-w-0 flex-1 items-center gap-2 text-[11px] text-tertiary"
          >
            {degraded && !onBackup ? (
              <>
                <MemojiAvatar who="m6" size={24} alt="Drew Allen" />
                <span className="truncate">
                  <span className="font-semibold text-heading">Drew A.</span> on call · loss SLA 1%
                </span>
              </>
            ) : onBackup ? (
              <span className="truncate">{health === "recovering" ? "Fiber loss back to 0% · safe to fail back" : health === "degraded" ? "Traffic on LTE · fiber ticket #4471 open" : "Manual failover · fiber standing by"}</span>
            ) : (
              <span className="truncate">SLA · loss under 1% · latency under 50 ms</span>
            )}
          </motion.div>
        </AnimatePresence>
        <GuardButton
          icon={<ArrowSwap16Regular />}
          label={onBackup ? "Fail back" : "Fail over"}
          confirmLabel={onBackup ? "To fiber?" : "To LTE?"}
          emphasis={degraded && !onBackup}
          disabled={onBackup && degraded}
          onConfirm={onBackup ? failback : failover}
        />
      </div>
    </Widget>
  );
}
