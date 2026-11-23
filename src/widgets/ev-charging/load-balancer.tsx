import { Building20Filled, Gauge20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { ConnectorGlyph, type ConnectorType, seeded } from "./_parts";

/* A workplace car park on a 150 kW grid connection. The building takes its
 * share first; whatever is left is split across plugged cars by water-filling
 * (no car gets more than it asks for, the rest share equally). When demand runs
 * past the limit the controller curtails, and the curtailed demand shows as a
 * hatched ghost beyond the limit line. */
type Ch = { id: string; type: ConnectorType; max: number; car: number; plugged: boolean; fill: string; text: string; bg: string };

const LIMIT = 150;
const SCALE = 180;
const SEED: Ch[] = [
  { id: "C1", type: "CCS2", max: 50, car: 48, plugged: true, fill: "var(--ios-blue)", text: "text-ios-blue", bg: "bg-ios-blue/15" },
  { id: "C2", type: "CCS2", max: 50, car: 50, plugged: false, fill: "var(--ios-indigo)", text: "text-ios-indigo", bg: "bg-ios-indigo/15" },
  { id: "C3", type: "Type2", max: 22, car: 22, plugged: true, fill: "var(--ios-teal)", text: "text-ios-teal", bg: "bg-ios-teal/15" },
  { id: "C4", type: "Type2", max: 22, car: 11, plugged: true, fill: "var(--ios-purple)", text: "text-ios-purple", bg: "bg-ios-purple/15" },
  { id: "C5", type: "Type2", max: 22, car: 22, plugged: false, fill: "var(--ios-pink)", text: "text-ios-pink", bg: "bg-ios-pink/15" },
  { id: "C6", type: "Type2", max: 22, car: 22, plugged: true, fill: "var(--ios-mint)", text: "text-ios-mint", bg: "bg-ios-mint/15" },
];
/* The demo's own day: cars arrive and leave on a loop. */
const SCRIPT: [string, boolean][] = [
  ["C2", true],
  ["C5", true],
  ["C1", false],
  ["C1", true],
  ["C5", false],
  ["C2", false],
];

function allocate(chs: Ch[], available: number) {
  const req = new Map(chs.filter((c) => c.plugged).map((c) => [c.id, Math.min(c.max, c.car)]));
  const out = new Map<string, number>();
  let left = Math.max(0, available);
  let open = [...req.keys()];
  while (open.length) {
    const share = left / open.length;
    const done = open.filter((id) => req.get(id)! <= share);
    if (!done.length) {
      open.forEach((id) => out.set(id, share));
      left = 0;
      break;
    }
    done.forEach((id) => {
      out.set(id, req.get(id)!);
      left -= req.get(id)!;
    });
    open = open.filter((id) => !done.includes(id));
  }
  const demand = [...req.values()].reduce((a, b) => a + b, 0);
  return { out, demand };
}

const w = (kw: number) => `${(kw / SCALE) * 100}%`;

/** EV charging · medium. Dynamic power sharing against a grid limit; cars plug in and the bar rebalances, tap a charger to plug or unplug. */
export function LoadBalancerWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [chs, setChs] = useState(SEED);
  const [building, setBuilding] = useState(26);
  const [ready, setReady] = useState(false);
  const step = useRef(0);
  const rand = useMemo(() => seeded(150), []);

  useEffect(() => {
    const r = window.setTimeout(() => setReady(true), delay * 1000 + 150);
    const b = window.setInterval(() => {
      setBuilding((v) => Math.max(20, Math.min(32, v + (rand() - 0.5) * 2.4 + (26 - v) * 0.15)));
    }, 2000);
    const s = window.setInterval(() => {
      const [id, plugged] = SCRIPT[step.current % SCRIPT.length];
      step.current += 1;
      setChs((all) => all.map((c) => (c.id === id ? { ...c, plugged } : c)));
    }, 6500);
    return () => {
      window.clearTimeout(r);
      window.clearInterval(b);
      window.clearInterval(s);
    };
  }, [delay, rand]);

  const toggle = (id: string) => setChs((all) => all.map((c) => (c.id === id ? { ...c, plugged: !c.plugged } : c)));

  const { out, demand } = allocate(chs, LIMIT - building);
  const evKw = [...out.values()].reduce((a, b) => a + b, 0);
  const total = building + evKw;
  const curtailed = Math.max(0, demand - evKw);
  const capped = curtailed > 0.5;
  const headroom = LIMIT - total;

  return (
    <Widget size="medium" index={index} label="Site load sharing">
      <WidgetHeader
        icon={<Gauge20Filled />}
        tint="var(--ios-teal)"
        title="Site load sharing"
        subtitle="Car park B · 6 chargers"
        extra={
          <div className="text-right leading-tight whitespace-nowrap">
            <div className="text-[11px] text-tertiary">Grid draw</div>
            <div className="text-[15px] font-semibold text-heading">
              <AnimatedNumber value={ready ? total : 0} format={{ maximumFractionDigits: 0 }} />
              <span className="ml-0.5 text-[11px] font-medium text-tertiary"> / {LIMIT} kW</span>
            </div>
          </div>
        }
      />

      <div className="mt-2 flex h-4 items-center justify-between gap-3 text-[11px] whitespace-nowrap">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={capped ? "cap" : "ok"}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={cn("truncate tabular", capped ? "font-semibold text-ios-orange" : "text-tertiary")}
          >
            {capped ? (
              <>
                At limit · <AnimatedNumber value={curtailed} format={{ maximumFractionDigits: 0 }} /> kW curtailed
              </>
            ) : (
              <>
                Headroom <span className="font-semibold text-secondary"><AnimatedNumber value={headroom} format={{ maximumFractionDigits: 0 }} /> kW</span>
              </>
            )}
          </motion.span>
        </AnimatePresence>
        <span className="flex items-center gap-1 text-tertiary">
          <span className={cn("h-2.5 w-0.5 rounded-full", capped ? "bg-ios-red" : "bg-heading")} />
          Grid limit {LIMIT} kW
        </span>
      </div>

      {/* Stacked allocation against the limit */}
      <div className="relative mt-1.5 h-[24px]">
        <div className="absolute inset-0 flex overflow-hidden rounded-lg bg-fill-quaternary">
          <Tooltip title={<span className="tabular">Building base load · {building.toFixed(1)} kW</span>}>
            <motion.div
              className="h-full shrink-0 border-r-2 border-[var(--widget-surface)] bg-fill-secondary"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, var(--ant-color-fill) 0 2px, transparent 2px 5px)",
              }}
              initial={{ width: 0 }}
              animate={{ width: ready ? w(building) : 0 }}
              transition={{ type: "spring", stiffness: 140, damping: 22 }}
            />
          </Tooltip>
          <AnimatePresence initial={false}>
            {chs
              .filter((c) => c.plugged)
              .map((c) => {
                const kw = out.get(c.id) ?? 0;
                return (
                  <Tooltip
                    key={c.id}
                    title={
                      <span className="tabular">
                        {c.id} · {kw.toFixed(1)} of {Math.min(c.max, c.car)} kW asked
                      </span>
                    }
                  >
                    <motion.div
                      className="h-full shrink-0 border-r-2 border-[var(--widget-surface)]"
                      style={{ background: c.fill }}
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: ready ? w(kw) : 0, opacity: 0.9 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 140, damping: 22 }}
                    />
                  </Tooltip>
                );
              })}
          </AnimatePresence>
          {/* Demand the controller is holding back */}
          <motion.div
            className="h-full shrink-0"
            style={{
              backgroundImage: "repeating-linear-gradient(135deg, var(--ios-orange) 0 2px, transparent 2px 6px)",
            }}
            initial={false}
            animate={{ width: ready ? w(curtailed) : 0, opacity: capped ? 0.7 : 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 22 }}
          />
        </div>
        <motion.span
          className={cn("absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2 rounded-full", capped ? "bg-ios-red" : "bg-heading")}
          style={{ left: w(LIMIT) }}
          animate={capped ? { opacity: [1, 0.25, 1] } : { opacity: 1 }}
          transition={capped ? { duration: 0.9, repeat: Infinity } : { duration: 0.2 }}
        />
      </div>

      {/* Chargers */}
      <div className="mt-auto flex items-start justify-between">
        <div className="flex w-[46px] flex-col items-center leading-tight">
          <span className="grid size-[28px] place-items-center rounded-full bg-fill-tertiary text-tertiary">
            <Building20Filled className="size-4" />
          </span>
          <span className="mt-1 text-[10px] text-tertiary">Building</span>
          <span className="text-[12px] font-semibold text-secondary">
            <AnimatedNumber value={building} format={{ maximumFractionDigits: 0 }} />
          </span>
        </div>
        {chs.map((c) => {
          const kw = out.get(c.id) ?? 0;
          const held = c.plugged && kw < Math.min(c.max, c.car) - 0.5;
          return (
            <motion.button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              whileTap={{ scale: 0.88 }}
              aria-pressed={c.plugged}
              aria-label={`${c.id} ${c.plugged ? "unplug car" : "plug in car"}`}
              className="group flex w-[46px] cursor-pointer flex-col items-center leading-tight outline-none"
            >
              <span
                className={cn(
                  "relative grid size-[28px] place-items-center rounded-full transition-colors",
                  c.plugged ? cn(c.bg, c.text) : "border border-dashed border-[var(--ant-color-text-tertiary)] text-tertiary group-hover:bg-fill-quaternary",
                )}
              >
                <ConnectorGlyph type={c.type} className="size-4" />
                <AnimatePresence>
                  {c.plugged ? (
                    <motion.span
                      key="ping"
                      className="absolute inset-0 rounded-full border-2"
                      style={{ borderColor: c.fill }}
                      initial={{ scale: 1, opacity: 0.8 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  ) : null}
                </AnimatePresence>
              </span>
              <span className="mt-1 text-[10px] text-tertiary">
                {c.id} · {c.max > 22 ? "DC" : "AC"}
              </span>
              <span className={cn("text-[12px] font-semibold", !c.plugged ? "text-tertiary" : held ? "text-ios-orange" : "text-heading")}>
                {c.plugged ? <AnimatedNumber value={ready ? kw : 0} format={{ maximumFractionDigits: 1, minimumFractionDigits: kw < 10 ? 1 : 0 }} /> : "—"}
              </span>
            </motion.button>
          );
        })}
      </div>
    </Widget>
  );
}
