import { ArrowUndo16Regular, Beaker20Filled, Dismiss16Regular, Rocket16Filled, Trophy16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Arm = { key: "A" | "B"; name: string; visitors: number; conv: number };
type Phase = "running" | "confirm" | "shipped";

/* Checkout button copy test: "Add to bag" (control) vs "Buy now · free returns". */
const SEED: Arm[] = [
  { key: "A", name: "Add to bag", visitors: 9_180, conv: 312 },
  { key: "B", name: "Buy now", visitors: 9_232, conv: 355 },
];
/** True rates the simulation draws from. */
const TRUE_RATE = { A: 0.034, B: 0.0392 };
const TICK_MS = 2200;
const CONFIRM_MS = 4000;
const SIG = 0.95;
/** The interval axis, as conversion rates. */
const LO = 0.028;
const HI = 0.046;
const TICKS = [0.03, 0.035, 0.04, 0.045];
const pos = (v: number) => `${((Math.min(HI, Math.max(LO, v)) - LO) / (HI - LO)) * 100}%`;
const PCT1 = { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 } as const;

const rate = (a: Arm) => a.conv / a.visitors;
const half = (a: Arm) => 1.96 * Math.sqrt((rate(a) * (1 - rate(a))) / a.visitors);

/** Standard normal CDF (Abramowitz–Stegun 7.1.26). */
function phi(z: number) {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}
function chanceBWins([a, b]: Arm[]) {
  const se = Math.sqrt((rate(a) * (1 - rate(a))) / a.visitors + (rate(b) * (1 - rate(b))) / b.visitors);
  return phi((rate(b) - rate(a)) / se);
}

/** Marketing · medium. A live A/B test with 95% intervals that tighten as visitors arrive; Ship B unlocks at 95% and asks to confirm. */
export function AbTestWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [arms, setArms] = useState(SEED);
  const [phase, setPhase] = useState<Phase>("running");

  useEffect(() => {
    if (phase === "shipped") return;
    const t = window.setInterval(() => {
      setArms((all) =>
        all.map((a) => {
          const n = 90 + Math.round(Math.random() * 60);
          const c = Math.max(0, Math.round(n * TRUE_RATE[a.key] + (Math.random() - 0.45) * 3));
          return { ...a, visitors: a.visitors + n, conv: a.conv + c };
        }),
      );
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "confirm") return;
    const t = window.setTimeout(() => setPhase("running"), CONFIRM_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  const p = chanceBWins(arms);
  const ready = p >= SIG;
  const shipped = phase === "shipped";
  const lift = rate(arms[1]) / rate(arms[0]) - 1;
  const total = arms[0].visitors + arms[1].visitors;

  return (
    <Widget size="medium" index={index} label="A/B test" beam={shipped ? { duration: 3 } : undefined}>
      <WidgetHeader
        icon={<Beaker20Filled />}
        tint="var(--ios-purple)"
        title="Checkout CTA test"
        subtitle={shipped ? "B live for 100% of traffic" : `Day 9 of 14 · ${total.toLocaleString("en-US")} visitors`}
        extra={
          <span className="mt-0.5 rounded-full bg-ios-green/15 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-ios-green tabular">
            <AnimatedNumber value={lift} format={{ style: "percent", maximumFractionDigits: 1, signDisplay: "always" }} /> lift
          </span>
        }
      />

      <div className="mt-2 flex flex-col">
        {arms.map((a, i) => {
          const r = rate(a);
          const h = half(a);
          const isB = a.key === "B";
          return (
            <Tooltip
              key={a.key}
              title={`${a.conv.toLocaleString("en-US")} of ${a.visitors.toLocaleString("en-US")} checked out · 95% CI ${((r - h) * 100).toFixed(2)}–${((r + h) * 100).toFixed(2)}%`}
            >
              <motion.div
                className={cn("group flex h-[30px] cursor-default items-center gap-2 rounded-[8px] px-1 transition-colors hover:bg-fill-quaternary", i > 0 && "mt-0.5")}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 28, delay: delay + i * 0.08 }}
              >
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-[6px] text-[11px] font-bold",
                    isB ? "bg-ios-purple text-white" : "bg-fill-secondary text-secondary",
                  )}
                >
                  {shipped && isB ? <Trophy16Filled className="size-3" /> : a.key}
                </span>
                <div className="w-[76px] shrink-0 truncate text-[12px] leading-tight">
                  <div className="font-medium text-heading">{a.name}</div>
                  <div className="text-[10px] text-tertiary">{isB ? "Variant" : "Control"}</div>
                </div>

                <div className="relative h-[30px] min-w-0 flex-1">
                  <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-fill" />
                  {TICKS.map((t) => (
                    <span key={t} className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-fill" style={{ left: pos(t) }} />
                  ))}
                  <motion.span
                    className={cn("absolute top-1/2 h-[8px] -translate-y-1/2 rounded-full", isB ? "bg-ios-purple/35" : "bg-fill-secondary")}
                    initial={{ left: pos(r), width: "0%" }}
                    animate={{ left: pos(r - h), width: `calc(${pos(r + h)} - ${pos(r - h)})` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20, delay: arms === SEED ? delay + 0.15 + i * 0.08 : 0 }}
                  />
                  <motion.span
                    className={cn(
                      "absolute top-1/2 size-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--widget-surface)]",
                      isB ? "bg-ios-purple" : "bg-[var(--ant-color-text-secondary)]",
                    )}
                    initial={{ left: pos(r), scale: 0 }}
                    animate={{ left: pos(r), scale: 1 }}
                    whileHover={{ scale: 1.3 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22, delay: arms === SEED ? delay + 0.3 + i * 0.08 : 0 }}
                  />
                </div>

                <AnimatedNumber
                  value={r}
                  format={{ style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                  className={cn("w-[48px] shrink-0 text-right text-[13px] font-semibold", isB ? "text-ios-purple" : "text-heading")}
                />
              </motion.div>
            </Tooltip>
          );
        })}
        <div className="relative ml-[116px] mr-[60px] h-3 text-[9px] leading-none text-tertiary tabular">
          {TICKS.map((t) => (
            <span key={t} className="absolute -translate-x-1/2" style={{ left: pos(t) }}>
              {(t * 100).toFixed(1)}%
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto flex h-8 items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between text-[11px] leading-tight whitespace-nowrap">
            <span className="text-tertiary">Chance B beats A</span>
            <AnimatedNumber
              value={p}
              format={PCT1}
              className={cn("font-semibold", ready ? "text-ios-green" : "text-heading")}
            />
          </div>
          <div className="relative mt-1 h-1.5 rounded-full bg-fill-secondary">
            <motion.div
              className={cn("absolute inset-y-0 left-0 rounded-full transition-colors duration-300", ready ? "bg-ios-green" : "bg-ios-purple")}
              initial={{ width: 0 }}
              animate={{ width: `${p * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20, delay: arms === SEED ? delay + 0.3 : 0 }}
            />
            <span
              className="absolute -top-[3px] h-3 w-[2px] rounded-full bg-heading ring-2 ring-[var(--widget-surface)]"
              style={{ left: `${SIG * 100}%` }}
            />
          </div>
        </div>

        <div className="relative h-8 w-[132px] shrink-0">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={phase}
              className="absolute inset-0 flex items-center gap-1.5"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {phase === "running" ? (
                <Tooltip title={ready ? undefined : "Unlocks at 95% chance to win"}>
                  <span className="block w-full">
                    <Button
                      block
                      color="purple"
                      variant={ready ? "solid" : "filled"}
                      disabled={!ready}
                      icon={<Rocket16Filled />}
                      onClick={() => setPhase("confirm")}
                    >
                      Ship B
                    </Button>
                  </span>
                </Tooltip>
              ) : phase === "confirm" ? (
                <>
                  <Button
                    shape="circle"
                    variant="filled"
                    color="default"
                    icon={<Dismiss16Regular />}
                    aria-label="Keep testing"
                    onClick={() => setPhase("running")}
                  />
                  <Button block color="purple" variant="solid" className="relative overflow-hidden" onClick={() => setPhase("shipped")}>
                    Confirm
                    <motion.span
                      className="absolute bottom-0 left-0 h-[2px] bg-white/70"
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: CONFIRM_MS / 1000, ease: "linear" }}
                    />
                  </Button>
                </>
              ) : (
                <Button block variant="filled" color="default" icon={<ArrowUndo16Regular />} onClick={() => setPhase("running")}>
                  Roll back
                </Button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Widget>
  );
}
