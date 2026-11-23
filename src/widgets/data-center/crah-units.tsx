import { ArrowSync16Regular, WeatherSnowflake20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useAnimationFrame, useMotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Role = "Lead" | "Lag" | "Standby";
const ROLES: Role[] = ["Lead", "Lag", "Standby"];
const UNITS = ["CRAH-1", "CRAH-2", "CRAH-3"];

/** What each role runs at: fan %, chilled-water valve %, supply and return air °C. */
const DUTY: Record<Role, { fan: number; valve: number; supply: number; ret: number }> = {
  Lead: { fan: 74, valve: 62, supply: 19.4, ret: 33.6 },
  Lag: { fan: 58, valve: 47, supply: 19.9, ret: 32.1 },
  Standby: { fan: 0, valve: 0, supply: 0, ret: 0 },
};
const ORDER: Record<Role, number> = { Lead: 0, Lag: 1, Standby: 2 };
const BADGE: Record<Role, string> = {
  Lead: "bg-ios-teal/15 text-ios-teal",
  Lag: "bg-fill-tertiary text-secondary",
  Standby: "bg-fill-quaternary text-tertiary",
};
const ONE_DP = { minimumFractionDigits: 1, maximumFractionDigits: 1 } as const;

type Live = { fan: number; supply: number; ret: number };

/** Data center · medium. Three CRAH units with fans spinning at their speed; Rotate hands the lead role on and the fans ramp to match. */
export function CrahUnitsWidget({ index }: { index?: number }) {
  const [shift, setShift] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [jitter, setJitter] = useState<Live[]>(() => UNITS.map(() => ({ fan: 0, supply: 0, ret: 0 })));

  useEffect(() => {
    const t = window.setInterval(() => {
      setJitter(() =>
        UNITS.map(() => ({
          fan: Math.round((Math.random() - 0.5) * 4),
          supply: (Math.random() - 0.5) * 0.4,
          ret: (Math.random() - 0.5) * 0.8,
        })),
      );
    }, 2800);
    return () => window.clearInterval(t);
  }, []);

  const units = UNITS.map((name, i) => {
    const role = ROLES[(i + shift) % ROLES.length];
    const d = DUTY[role];
    const on = role !== "Standby";
    return {
      i,
      name,
      role,
      valve: d.valve,
      fan: on ? d.fan + jitter[i].fan : 0,
      supply: on ? d.supply + jitter[i].supply : 0,
      ret: on ? d.ret + jitter[i].ret : 0,
    };
  }).sort((a, b) => ORDER[a.role] - ORDER[b.role]);

  const running = units.filter((u) => u.role !== "Standby");
  const kw = Math.round(running.reduce((s, u) => s + u.fan * 1.32, 0));
  const probe = hover === null ? null : units.find((u) => u.i === hover) ?? null;

  return (
    <Widget size="medium" index={index} label="CRAH cooling units">
      <WidgetHeader
        icon={<WeatherSnowflake20Filled />}
        tint="var(--ios-teal)"
        title="Cooling · Hall 2"
        subtitle="3 CRAH · N+1 · supply set 20 °C"
        extra={
          <motion.button
            type="button"
            onClick={() => setShift((s) => (s + 1) % 3)}
            whileTap={{ scale: 0.92 }}
            className="flex h-[26px] shrink-0 cursor-pointer items-center gap-1 rounded-full bg-fill-secondary px-2.5 text-[11px] font-semibold whitespace-nowrap text-heading outline-none transition-colors duration-mid hover:bg-fill"
          >
            <ArrowSync16Regular />
            Rotate lead
          </motion.button>
        }
      />

      <div className="mt-1.5 flex flex-col" onMouseLeave={() => setHover(null)}>
        {units.map((u, row) => (
          <motion.div
            key={u.name}
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              layout: { type: "spring", stiffness: 380, damping: 32 },
              default: { type: "spring", stiffness: 300, damping: 26, delay: 0.3 + (index ?? 0) * 0.06 + row * 0.07 },
            }}
            onMouseEnter={() => setHover(u.i)}
            className={cn(
              "flex h-[34px] items-center gap-2.5 px-1 transition-colors duration-mid",
              row > 0 && "border-t-[0.5px] border-split",
              hover === u.i && "bg-fill-quaternary",
            )}
          >
            <Fan pct={u.fan} />
            <div className="w-[64px] shrink-0 leading-none">
              <div className="text-[12px] font-semibold text-heading">{u.name}</div>
              <div className="relative mt-1 h-[14px] overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={u.role}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: "spring", stiffness: 420, damping: 30 }}
                    className={cn("inline-block rounded-full px-1.5 text-[10px] leading-[14px] font-semibold", BADGE[u.role])}
                  >
                    {u.role}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            <div className="min-w-0 flex-1 text-[12px] whitespace-nowrap text-tertiary tabular">
              {u.role === "Standby" ? (
                <span>Ready · auto-start on fault</span>
              ) : (
                <>
                  <AnimatedNumber value={u.supply} format={ONE_DP} className="font-semibold text-ios-teal" />
                  <span>°</span>
                  <span className="px-1">→</span>
                  <AnimatedNumber value={u.ret} format={ONE_DP} className="font-semibold text-secondary" />
                  <span>°</span>
                  <span className="ml-1.5 text-[10px]">ΔT {(u.ret - u.supply).toFixed(1)} K</span>
                </>
              )}
            </div>

            <div className="flex w-[72px] shrink-0 items-center gap-1.5">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-fill-secondary">
                <motion.div
                  className={cn("h-full rounded-full", u.role === "Lead" ? "bg-ios-teal" : "bg-secondary")}
                  initial={{ width: 0 }}
                  animate={{ width: `${u.fan}%` }}
                  transition={{ type: "spring", stiffness: 90, damping: 18 }}
                />
              </div>
              <AnimatedNumber value={u.fan} suffix="%" className="w-[30px] text-right text-[11px] font-semibold text-heading" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="relative mt-auto h-[14px] overflow-hidden text-[11px] leading-[14px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={probe ? probe.name + probe.role : "all"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="truncate text-tertiary"
          >
            {probe ? (
              probe.role === "Standby" ? (
                <span>
                  <span className="font-semibold text-secondary">{probe.name}</span> · CHW valve closed · filter ΔP 112 Pa
                </span>
              ) : (
                <span>
                  <span className="font-semibold text-secondary">{probe.name}</span> · CHW valve {probe.valve}% · fan{" "}
                  {Math.round(probe.fan * 13.6)} rpm
                </span>
              )
            ) : (
              <span>
                Cooling <AnimatedNumber value={kw} className="font-semibold text-secondary" /> kW · CHW 7.2 → 13.1 °C
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Widget>
  );
}

/** A four-blade fan that spins at a speed set by its duty, ramping up and down smoothly. */
function Fan({ pct }: { pct: number }) {
  const rot = useMotionValue(0);
  const speed = useRef(0);
  const target = useRef(pct);
  target.current = pct;

  useAnimationFrame((_, delta) => {
    // Ease the speed toward the target so a unit spins up or coasts down.
    speed.current += (target.current - speed.current) * Math.min(1, delta / 900);
    if (speed.current < 0.2) return;
    rot.set((rot.get() + speed.current * delta * 0.012) % 360);
  });

  const off = pct === 0;
  return (
    <span className={cn("grid size-[26px] shrink-0 place-items-center rounded-full", off ? "bg-fill-quaternary" : "bg-fill-tertiary")}>
      <motion.svg viewBox="-10 -10 20 20" className={cn("size-[20px]", off ? "text-tertiary" : "text-secondary")} style={{ rotate: rot }} aria-hidden>
        {[0, 90, 180, 270].map((a) => (
          <path key={a} d="M0 -1.6 C 2 -4, 2 -8, 0 -8.6 C -2.2 -8, -2.6 -5, -1.2 -1.8 Z" fill="currentColor" transform={`rotate(${a})`} opacity={0.9} />
        ))}
        <circle r={2} className="fill-[var(--widget-surface)]" />
        <circle r={1.1} fill="currentColor" />
      </motion.svg>
    </span>
  );
}
