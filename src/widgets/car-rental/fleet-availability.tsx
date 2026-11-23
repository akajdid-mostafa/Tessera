import { VehicleCar20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

const STATUS = [
  { key: "available", label: "Available", color: "var(--ios-green)" },
  { key: "rented", label: "Rented", color: "var(--ios-blue)" },
  { key: "service", label: "Service", color: "var(--ios-orange)" },
  { key: "reserved", label: "Reserved", color: "var(--ios-purple)" },
] as const;
type Key = (typeof STATUS)[number]["key"];
type Branch = { id: string; name: string } & Record<Key, number>;

const SEED: Branch[] = [
  { id: "lax", name: "LAX Airport", available: 42, rented: 108, service: 9, reserved: 25 },
  { id: "bur", name: "BUR Airport", available: 31, rented: 72, service: 6, reserved: 17 },
  { id: "pas", name: "Pasadena", available: 14, rented: 38, service: 5, reserved: 7 },
];
const TICK_MS = 3600;
const sum = (b: Branch) => STATUS.reduce((s, x) => s + b[x.key], 0);
const FLEET = SEED.reduce((s, b) => s + sum(b), 0);

/** One car changes hands at a branch: a return, a walk-up pickup, or a reservation collected. */
function step(b: Branch): Branch {
  const r = Math.random();
  if (r < 0.4 && b.rented > 0) return { ...b, rented: b.rented - 1, available: b.available + 1 };
  if (r < 0.75 && b.available > 0) return { ...b, available: b.available - 1, rented: b.rented + 1 };
  if (b.reserved > 0) return { ...b, reserved: b.reserved - 1, rented: b.rented + 1 };
  return b;
}

/** Car rental · medium. Per-branch fleet bars; tap a branch to roll its availability into the hero. */
export function FleetAvailabilityWidget({ index }: { index?: number }) {
  const [branches, setBranches] = useState(SEED);
  const [sel, setSel] = useState(0);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      const at = Math.floor(Math.random() * SEED.length);
      setBranches((all) => all.map((b, i) => (i === at ? step(b) : b)));
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, []);

  const b = branches[sel];
  const total = sum(b);

  return (
    <Widget size="medium" index={index} label="Fleet availability">
      <WidgetHeader
        icon={<VehicleCar20Filled />}
        tint="var(--ios-green)"
        title="Fleet Availability"
        subtitle={`3 branches · ${FLEET} cars`}
        extra={
          <span className="flex items-center gap-1.5 rounded-full bg-ios-green/15 px-2 py-0.5 text-[11px] font-semibold text-ios-green">
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-ios-green opacity-70" />
              <span className="relative size-1.5 rounded-full bg-ios-green" />
            </span>
            Live
          </span>
        }
      />

      <div className="mt-2.5 flex min-h-0 flex-1 gap-3">
        <div className="w-[88px] shrink-0 whitespace-nowrap leading-tight">
          <div className="text-[11px] text-tertiary">Available now</div>
          <AnimatedNumber
            value={b.available}
            className="text-[30px] leading-none font-semibold tracking-tight text-heading"
          />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 5, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -5, filter: "blur(3px)" }}
              className="mt-1 truncate text-[11px] font-semibold text-ios-green"
            >
              {b.name}
            </motion.div>
          </AnimatePresence>
          <div className="text-[11px] text-tertiary">
            of <AnimatedNumber value={total} className="font-medium text-secondary" /> cars
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between">
          {branches.map((br, i) => {
            const active = i === sel;
            const n = sum(br);
            return (
              <Tooltip
                key={br.id}
                placement="left"
                title={STATUS.map((s) => `${s.label} ${br[s.key]}`).join(" · ")}
              >
                <motion.button
                  type="button"
                  onClick={() => setSel(i)}
                  whileTap={{ scale: 0.97 }}
                  className="relative -mx-1.5 flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 outline-none"
                >
                  {active ? (
                    <motion.span
                      layoutId="fleet-branch"
                      className="absolute inset-0 rounded-lg bg-fill-tertiary"
                      transition={{ type: "spring", stiffness: 500, damping: 36 }}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative w-[64px] truncate text-left text-[11px] transition-colors duration-mid",
                      active ? "font-semibold text-heading" : "text-secondary",
                    )}
                  >
                    {br.name}
                  </span>
                  <motion.span
                    className="relative flex h-2 flex-1 overflow-hidden rounded-full bg-fill-quaternary"
                    animate={{ opacity: active ? 1 : 0.5 }}
                  >
                    {STATUS.map((s, k) => (
                      <motion.span
                        key={s.key}
                        className={cn("h-full shrink-0 overflow-hidden", k < STATUS.length - 1 && "pr-[2px]")}
                        initial={{ width: 0 }}
                        animate={{ width: `${(br[s.key] / n) * 100}%` }}
                        transition={{
                          type: "spring",
                          stiffness: 140,
                          damping: 20,
                          delay: delay + i * 0.08 + k * 0.05,
                        }}
                      >
                        <span className="block h-full rounded-[3px]" style={{ background: s.color }} />
                      </motion.span>
                    ))}
                  </motion.span>
                  <AnimatedNumber
                    value={br.available}
                    className={cn(
                      "relative w-6 text-right text-[11px] font-semibold",
                      active ? "text-ios-green" : "text-tertiary",
                    )}
                  />
                </motion.button>
              </Tooltip>
            );
          })}
        </div>
      </div>

      <div className="mt-auto flex gap-3 pt-2 text-[10px] text-tertiary">
        {STATUS.map((s) => (
          <span key={s.key} className="flex items-center gap-1 whitespace-nowrap">
            <span className="size-1.5 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
        <span className="ml-auto whitespace-nowrap text-tertiary">Tap a branch</span>
      </div>
    </Widget>
  );
}
