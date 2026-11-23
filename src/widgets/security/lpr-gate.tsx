import { VehicleCar20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Verdict = "allow" | "unknown" | "hotlist";
type Read = { plate: string; who: string; verdict: Verdict; conf: number };

const READS: Read[] = [
  { plate: "8KLM482", who: "Staff · Hana S.", verdict: "allow", conf: 98 },
  { plate: "7BRT117", who: "Visitor · booked", verdict: "allow", conf: 96 },
  { plate: "6ZEF903", who: "Not on any list", verdict: "unknown", conf: 91 },
  { plate: "8FTR026", who: "Delivery · 15:00", verdict: "allow", conf: 97 },
  { plate: "5HAK552", who: "Reported stolen", verdict: "hotlist", conf: 99 },
];
const VERDICT: Record<Verdict, { label: string; chip: string }> = {
  allow: { label: "Allowlist", chip: "bg-ios-green/15 text-ios-green" },
  unknown: { label: "Unknown", chip: "bg-ios-orange/15 text-ios-orange" },
  hotlist: { label: "Hotlist hit", chip: "bg-ios-red/15 text-ios-red" },
};
const READ_EVERY_MS = 4800;
const OPEN_MS = 2600;

/** Security · small. A car-park gate's plate reader: each read types in, the barrier lifts for allowlisted plates, a hotlist hit flashes red, and tapping opens the barrier manually. */
export function LprGateWidget({ index }: { index?: number }) {
  const [i, setI] = useState(0);
  const [up, setUp] = useState(false);
  const [manual, setManual] = useState(false);
  const [reads, setReads] = useState(142);

  useEffect(() => {
    const t = window.setInterval(() => {
      setI((n) => (n + 1) % READS.length);
      setReads((r) => r + 1);
      setManual(false);
    }, READ_EVERY_MS);
    return () => window.clearInterval(t);
  }, []);

  // Allowlisted plates lift the barrier shortly after the read settles.
  useEffect(() => {
    if (READS[i].verdict !== "allow") return;
    const a = window.setTimeout(() => setUp(true), 700 + (i === 0 ? (index ?? 0) * 60 + 400 : 0));
    return () => window.clearTimeout(a);
  }, [i, index]);

  useEffect(() => {
    if (!up) return;
    const t = window.setTimeout(() => setUp(false), OPEN_MS);
    return () => window.clearTimeout(t);
  }, [up]);

  const r = READS[i];
  const v = VERDICT[r.verdict];
  const hot = r.verdict === "hotlist";

  return (
    <Widget
      size="small"
      index={index}
      label="Plate recognition gate"
      pressable
      onPress={() => {
        if (hot) return;
        setManual(true);
        setUp(true);
      }}
      glow={{ mode: "pulse", colors: ["#FF453A", "#FF9F0A", "#FF453A"], blur: 16, duration: 1.2 }}
      glowActive={hot}
    >
      <WidgetHeader icon={<VehicleCar20Filled />} tint={hot ? "var(--ios-red)" : "var(--ios-blue)"} title="Gate 2 · LPR" subtitle="Staff car park" />

      {/* The plate: its own fixed white surface, so dark text holds in both themes. */}
      <div className="mt-2 flex h-[30px] overflow-hidden rounded-md border-2 border-black/80 bg-white">
        <span className="w-[11px] shrink-0 bg-ios-blue" aria-hidden />
        <div className="relative flex flex-1 items-center justify-center overflow-hidden font-mono text-[17px] font-bold tracking-wide text-black">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={r.plate} className="flex" exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}>
              {[...r.plate].map((ch, k) => (
                <motion.span
                  key={k}
                  className="inline-block whitespace-pre"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.1 + k * 0.035 }}
                >
                  {ch}
                </motion.span>
              ))}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-2 flex h-[44px] items-center gap-2">
        {/* Boom barrier seen side-on. The arm pivots at the housing (9, 36) and stops near
            vertical inside the 44 px box; a plain CSS transform keeps that pivot exact
            (motion's SVG transforms re-centre the origin on the group's own box). */}
        <svg viewBox="0 0 52 44" className="h-[44px] w-[52px] shrink-0" role="img" aria-label={up ? "Barrier raised" : "Barrier down"}>
          <line x1={1} x2={51} y1={43} y2={43} strokeWidth={1.5} strokeLinecap="round" className="stroke-fill" />
          {/* Rest post the arm lies on when down. */}
          <rect x={42} y={38} width={3} height={5} rx={1} className="fill-fill" />
          <g
            style={{
              transformOrigin: "9px 36px",
              transform: `rotate(${up ? -84 : 0}deg)`,
              transition: up
                ? "transform 0.9s cubic-bezier(0.3, 0, 0.2, 1)"
                : "transform 1.1s cubic-bezier(0.45, 0, 0.25, 1)",
            }}
          >
            <rect x={9} y={34} width={36} height={4} rx={2} className="fill-ios-red" />
            {[17, 26, 35].map((x) => (
              <rect key={x} x={x} y={34} width={4.5} height={4} className="fill-white" />
            ))}
          </g>
          <rect x={3} y={30} width={12} height={13} rx={2} className="fill-fill" />
          <circle cx={9} cy={36} r={2.4} className="fill-secondary" />
          <circle
            cx={9}
            cy={40.5}
            r={1.3}
            style={{ fill: up ? "var(--ios-green)" : hot ? "var(--ios-red)" : "var(--ios-orange)", transition: "fill 0.3s" }}
          />
        </svg>

        <div className="min-w-0 flex-1 leading-none whitespace-nowrap">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={r.plate}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ delay: 0.35 }}
            >
              <span className={cn("inline-block rounded-full px-1.5 py-0.5 text-[11px] font-semibold", v.chip)}>{v.label}</span>
              <div className="mt-1 truncate text-[11px] text-secondary">{r.who}</div>
            </motion.div>
          </AnimatePresence>
          <div className="mt-1 text-[10px] text-tertiary tabular">
            {r.conf}% · <AnimatedNumber value={reads} />
            /h
          </div>
        </div>
      </div>

      <div className="relative mt-auto h-[14px] overflow-hidden text-[11px] leading-[14px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={manual ? "manual" : hot ? "hot" : r.verdict}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={cn("truncate", hot ? "font-semibold text-ios-red" : "text-tertiary")}
          >
            {manual ? "Opened manually · logged" : hot ? "Held · patrol dispatched" : r.verdict === "unknown" ? "Held · tap to let in" : "Tap to open manually"}
          </motion.div>
        </AnimatePresence>
      </div>
    </Widget>
  );
}
