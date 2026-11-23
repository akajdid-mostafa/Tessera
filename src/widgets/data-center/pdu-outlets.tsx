import { PlugConnected20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Outlet = { n: number; load: string; watts: number; on: boolean };
const SEED: Outlet[] = [
  { n: 1, load: "sw-tor-b", watts: 176, on: true },
  { n: 2, load: "db-01 PSU2", watts: 304, on: true },
  { n: 3, load: "db-02 PSU2", watts: 296, on: true },
  { n: 4, load: "app-07 PSU2", watts: 171, on: true },
  { n: 5, load: "app-08 PSU2", watts: 168, on: true },
  { n: 6, load: "app-09 PSU2", watts: 0, on: true },
  { n: 7, load: "gpu-01 PSU3", watts: 1412, on: true },
  { n: 8, load: "Spare", watts: 0, on: false },
];
const CYCLE_S = 5;
const R = 9;
const C = 2 * Math.PI * R;

type Mode = { kind: "idle" } | { kind: "armed"; n: number } | { kind: "cycling"; n: number; left: number };

/** Data center · small. Eight live PDU outlets; pick one, arm, then confirm a power-cycle that counts down and restores it. */
export function PduOutletsWidget({ index }: { index?: number }) {
  const [outlets, setOutlets] = useState(SEED);
  const [selected, setSelected] = useState(6);
  const [mode, setMode] = useState<Mode>({ kind: "idle" });

  useEffect(() => {
    const t = window.setInterval(() => {
      setOutlets((os) =>
        os.map((o) =>
          o.on && o.watts > 0 ? { ...o, watts: Math.max(40, Math.round(o.watts + (Math.random() - 0.5) * o.watts * 0.04)) } : o,
        ),
      );
    }, 2600);
    return () => window.clearInterval(t);
  }, []);

  // An armed command disarms itself if it is not confirmed.
  useEffect(() => {
    if (mode.kind !== "armed") return;
    const t = window.setTimeout(() => setMode({ kind: "idle" }), 4000);
    return () => window.clearTimeout(t);
  }, [mode]);

  // The cycle: outlet off, count down, back on with the load ramping in.
  useEffect(() => {
    if (mode.kind !== "cycling") return;
    if (mode.left <= 0) {
      setOutlets((os) => os.map((o) => (o.n === mode.n ? { ...o, on: o.load !== "Spare", watts: o.load === "Spare" ? 0 : 158 } : o)));
      setMode({ kind: "idle" });
      return;
    }
    const t = window.setTimeout(() => setMode({ ...mode, left: mode.left - 1 }), 1000);
    return () => window.clearTimeout(t);
  }, [mode]);

  const sel = outlets.find((o) => o.n === selected)!;
  const busy = mode.kind === "cycling";
  const total = outlets.reduce((s, o) => s + (o.on ? o.watts : 0), 0);

  const act = () => {
    if (busy) return;
    if (mode.kind === "armed" && mode.n === selected) {
      setOutlets((os) => os.map((o) => (o.n === selected ? { ...o, on: false, watts: 0 } : o)));
      setMode({ kind: "cycling", n: selected, left: CYCLE_S });
    } else {
      setMode({ kind: "armed", n: selected });
    }
  };

  return (
    <Widget size="small" index={index} label="PDU outlets">
      <WidgetHeader
        icon={<PlugConnected20Filled />}
        tint="var(--ios-indigo)"
        title="PDU B · R14"
        subtitle={
          <span className="tabular">
            <AnimatedNumber value={total / 1000} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} /> kW · 16 A
          </span>
        }
      />

      <div className="mt-2 grid grid-cols-4 gap-1">
        {outlets.map((o, i) => {
          const cycling = mode.kind === "cycling" && mode.n === o.n;
          const isSel = o.n === selected;
          return (
            <motion.button
              key={o.n}
              type="button"
              disabled={busy}
              onClick={() => {
                setSelected(o.n);
                if (mode.kind === "armed") setMode({ kind: "idle" });
              }}
              aria-label={`Outlet ${o.n}, ${o.load}`}
              className={cn(
                "relative flex h-[33px] cursor-pointer flex-col items-center justify-center gap-[3px] rounded-[9px] outline-none transition-colors duration-mid disabled:cursor-default",
                isSel ? "bg-fill-secondary ring-1 ring-inset ring-ios-indigo/60" : "bg-fill-quaternary hover:bg-fill-tertiary",
              )}
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { type: "spring", stiffness: 420, damping: 22, delay: 0.3 + (index ?? 0) * 0.06 + i * 0.04 },
              }}
              whileTap={{ scale: 0.9, transition: { duration: 0.1 } }}
            >
              {/* C13 socket face */}
              <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden className="text-tertiary">
                <path d="M3 1h10l2 2v8H1V3z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                <rect x="4" y="5" width="1.6" height="3.2" rx="0.6" fill="currentColor" />
                <rect x="10.4" y="5" width="1.6" height="3.2" rx="0.6" fill="currentColor" />
                <rect x="7.2" y="3" width="1.6" height="2.4" rx="0.6" fill="currentColor" />
              </svg>
              <span className="flex items-center gap-[3px] text-[9px] leading-none font-medium text-tertiary tabular">
                <motion.span
                  className={cn("size-[5px] rounded-full", o.on ? "bg-ios-green" : "bg-fill")}
                  animate={o.on ? { opacity: [1, 0.55, 1] } : { opacity: 1 }}
                  transition={o.on ? { duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 } : undefined}
                />
                {o.n}
              </span>
              {cycling ? (
                <svg viewBox="0 0 24 24" className="absolute inset-0 m-auto size-[26px] -rotate-90" aria-hidden>
                  <motion.circle
                    cx="12"
                    cy="12"
                    r={R}
                    fill="none"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={C}
                    className="stroke-ios-indigo"
                    initial={{ strokeDashoffset: 0 }}
                    animate={{ strokeDashoffset: C }}
                    transition={{ duration: CYCLE_S, ease: "linear" }}
                  />
                </svg>
              ) : null}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-auto flex items-center gap-1.5">
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[11px] font-semibold text-heading">
            #{sel.n} · {sel.load}
          </div>
          <div className="truncate text-[10px] text-tertiary tabular">
            {mode.kind === "cycling" && mode.n === sel.n ? (
              <span className="text-ios-indigo">Back on in {mode.left}s</span>
            ) : sel.on ? (
              sel.watts > 0 ? (
                <>
                  <AnimatedNumber value={sel.watts} /> W
                </>
              ) : (
                <span className="text-ios-orange">On · no draw</span>
              )
            ) : (
              "Off"
            )}
          </div>
        </div>
        <motion.button
          type="button"
          onClick={act}
          disabled={busy}
          whileTap={{ scale: 0.92 }}
          layout
          className={cn(
            "h-[26px] shrink-0 cursor-pointer rounded-full px-2.5 text-[11px] font-semibold whitespace-nowrap outline-none transition-colors duration-mid disabled:cursor-default disabled:opacity-50",
            mode.kind === "armed" ? "bg-ios-red text-white" : "bg-fill-secondary text-heading hover:bg-fill",
          )}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={mode.kind === "armed" ? "confirm" : "cycle"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="block"
            >
              {mode.kind === "armed" ? "Confirm" : "Cycle"}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
    </Widget>
  );
}
