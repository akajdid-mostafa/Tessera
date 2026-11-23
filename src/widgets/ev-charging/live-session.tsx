import { Flash20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type PointerEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { clock, curveKw, seeded } from "./_parts";

/* A public DC session on an 800 V car (77 kWh usable). The curve is the car's
 * acceptance by SoC: a wide plateau, a taper from ~50 %, a cliff past 80 %.
 * Time runs 20× so the taper and the car's own stop at the limit show up in a
 * minute of watching. */
const CAP = 77;
const PRICE = 0.59;
const IDLE_FEE = 0.4;
const GRACE = 600;
const WARP = 20;
const SOC0 = 12;
const EUR = { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

/* Chart frame, in viewBox units. */
const W = 376;
const H = 184;
const PX0 = 26;
const PX1 = 370;
const PY0 = 16;
const PY1 = 158;
const KW_MAX = 300;
const sx = (soc: number) => PX0 + ((soc - 10) / 90) * (PX1 - PX0);
const sy = (kw: number) => PY1 - (kw / KW_MAX) * (PY1 - PY0);

const LINE = (() => {
  const pts: string[] = [];
  for (let s = 10; s <= 100; s += 1) pts.push(`${sx(s).toFixed(1)} ${sy(curveKw(s)).toFixed(1)}`);
  return `M${pts.join(" L")}`;
})();
const AREA = `${LINE} L${PX1} ${PY1} L${PX0} ${PY1} Z`;

/** Minutes from one SoC to another along the acceptance curve. */
function minutesTo(from: number, to: number) {
  let m = 0;
  for (let s = from; s < to; s += 0.5) {
    const step = Math.min(0.5, to - s);
    m += ((CAP * step) / 100 / Math.max(5, curveKw(s + step / 2))) * 60;
  }
  return m;
}

type Phase = "charging" | "stopped";
type Sim = { soc: number; kwh: number; elapsed: number; kw: number; phase: Phase; grace: number };

const RING_R = 44;
const RING_C = 2 * Math.PI * RING_R;
/** A short radial mark across the ring at a SoC (the SVG is turned -90°, so 0 % is at the top). */
const tick = (pct: number) => {
  const a = (pct / 100) * Math.PI * 2;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x1: 52 + 37 * c, y1: 52 + 37 * s, x2: 52 + 51 * c, y2: 52 + 51 * s };
};

/** EV charging · large. The live DC session: SoC ring, kW riding the taper curve, time to limit and cost. */
export function LiveSessionWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [target, setTarget] = useState(80);
  const targetRef = useRef(target);
  const [sim, setSim] = useState<Sim>({ soc: 54, kwh: 32.6, elapsed: 862, kw: 0, phase: "charging", grace: GRACE });
  const [scrub, setScrub] = useState<number | null>(null);
  const rand = useMemo(() => seeded(42), []);
  const uid = useId().replace(/[^\w-]/g, "");
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    const start = window.setTimeout(() => {
      setSim((p) => ({ ...p, kw: curveKw(p.soc) }));
    }, delay * 1000 + 200);
    const t = window.setInterval(() => {
      setSim((p) => {
        if (p.phase === "stopped") return { ...p, kw: 0, grace: p.grace - 1 };
        const kw = curveKw(p.soc) * (1 + (rand() - 0.5) * 0.035);
        const dE = (kw * WARP) / 3600;
        let soc = p.soc + (dE / CAP) * 100;
        const lim = targetRef.current;
        let phase: Phase = "charging";
        if (soc >= lim) {
          soc = lim;
          phase = "stopped";
        }
        return {
          soc,
          kwh: p.kwh + dE,
          elapsed: p.elapsed + WARP,
          kw: phase === "stopped" ? 0 : kw,
          phase,
          grace: GRACE,
        };
      });
    }, 1000);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(t);
    };
  }, [delay, rand]);

  const changeTarget = (v: number) => {
    setTarget(v);
    targetRef.current = v;
    setSim((p) => {
      if (v > p.soc + 0.2 && p.phase === "stopped") return { ...p, phase: "charging", kw: curveKw(p.soc), grace: GRACE };
      if (v <= p.soc) return { ...p, phase: "stopped", kw: 0, grace: GRACE };
      return p;
    });
  };

  const onMove = (e: PointerEvent<SVGRectElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const k = Math.min(r.width / W, r.height / H);
    const x = (e.clientX - r.left - (r.width - W * k) / 2) / k;
    const s = 10 + ((x - PX0) / (PX1 - PX0)) * 90;
    setScrub(Math.max(10, Math.min(100, Math.round(s))));
  };

  const charging = sim.phase === "charging";
  const toTarget = charging ? minutesTo(sim.soc, target) : 0;
  const cost = sim.kwh * PRICE;
  const idleSec = Math.max(0, -sim.grace);
  const volts = 690 + sim.soc * 1.4;
  const amps = (sim.kw * 1000) / volts;

  const heroKw = scrub != null ? curveKw(scrub) : sim.kw;
  const heroLabel =
    scrub != null ? (scrub <= sim.soc ? `At ${scrub}% · delivered` : `At ${scrub}% · expected`) : charging ? "Power" : "Power · car paused";

  return (
    <Widget size="large" index={index} label="Live charging session">
      <WidgetHeader
        icon={<Flash20Filled />}
        tint="var(--ios-green)"
        title="Fast charger 07"
        subtitle="CCS2 · DC 300 kW · Hub A"
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={sim.phase}
              initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
              className={cn(
                "flex h-6 items-center gap-1.5 rounded-full px-2 text-[11px] font-semibold whitespace-nowrap",
                charging ? "bg-ios-green/15 text-ios-green" : "bg-ios-orange/15 text-ios-orange",
              )}
            >
              <span className="relative grid size-2 place-items-center">
                {charging ? (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-ios-green"
                    animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                  />
                ) : null}
                <span className={cn("size-2 rounded-full", charging ? "bg-ios-green" : "bg-ios-orange")} />
              </span>
              {charging ? "Charging" : "Stopped by car"}
            </motion.span>
          </AnimatePresence>
        }
      />

      {/* Ring + numbers */}
      <div className="mt-3 flex h-[104px] items-center gap-4">
        <div className="relative size-[104px] shrink-0">
          <svg viewBox="0 0 104 104" className="size-full -rotate-90" aria-hidden>
            <defs>
              <linearGradient id={`soc-${uid}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--ios-mint)" />
                <stop offset="100%" stopColor="var(--ios-green)" />
              </linearGradient>
            </defs>
            <circle cx="52" cy="52" r={RING_R} fill="none" strokeWidth="9" className="stroke-fill-secondary" />
            {/* Still to come, up to the limit. */}
            <motion.circle
              cx="52"
              cy="52"
              r={RING_R}
              fill="none"
              strokeWidth="9"
              stroke="var(--ios-green)"
              strokeOpacity={0.22}
              strokeDasharray={`${RING_C} ${RING_C}`}
              initial={false}
              animate={{
                strokeDasharray: `${(RING_C * Math.max(0, target - sim.soc)) / 100} ${RING_C}`,
                strokeDashoffset: (-RING_C * sim.soc) / 100,
              }}
              transition={{ type: "spring", stiffness: 90, damping: 20 }}
            />
            <motion.circle
              cx="52"
              cy="52"
              r={RING_R}
              fill="none"
              strokeWidth="9"
              strokeLinecap="round"
              stroke={`url(#soc-${uid})`}
              strokeDasharray={RING_C}
              initial={{ strokeDashoffset: RING_C }}
              animate={{ strokeDashoffset: RING_C * (1 - sim.soc / 100) }}
              transition={{ type: "spring", stiffness: 70, damping: 18, delay: sim.kwh === 32.6 ? delay : 0 }}
            />
            {/* Limit tick */}
            <motion.line
              strokeWidth="2.5"
              strokeLinecap="round"
              className="stroke-heading"
              initial={false}
              animate={tick(target)}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
              {...tick(target)}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center leading-none">
            <div>
              <div className="text-[26px] font-semibold tracking-tight text-heading">
                <AnimatedNumber value={Math.floor(sim.soc)} />
                <span className="text-[13px] font-medium text-tertiary">%</span>
              </div>
              <div className="mt-1 text-[11px] text-tertiary tabular">limit {target}%</div>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 whitespace-nowrap">
          <div className="truncate text-[11px] leading-tight text-tertiary">{heroLabel}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] leading-none font-semibold tracking-tight text-heading">
              <AnimatedNumber value={heroKw} format={{ maximumFractionDigits: heroKw < 100 ? 1 : 0, minimumFractionDigits: heroKw < 100 ? 1 : 0 }} />
              <span className="ml-1 text-[13px] font-medium text-tertiary">kW</span>
            </span>
            <span className="truncate text-[11px] text-tertiary tabular">
              +{Math.round(heroKw * 5.9).toLocaleString("en-US")} km/h
            </span>
          </div>
          <div className="mt-2.5 flex gap-3 border-t-[0.5px] border-split pt-2">
            {[
              {
                k: `To ${target}%`,
                v: charging ? (
                  <>
                    <AnimatedNumber value={Math.max(1, Math.ceil(toTarget))} />
                    <span className="ml-0.5 text-[11px] font-medium text-tertiary">min</span>
                  </>
                ) : (
                  <span className="text-ios-orange">Reached</span>
                ),
              },
              {
                k: "Added",
                v: (
                  <>
                    <AnimatedNumber value={sim.kwh} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
                    <span className="ml-0.5 text-[11px] font-medium text-tertiary">kWh</span>
                  </>
                ),
              },
              { k: "Cost so far", v: <AnimatedNumber value={cost + (idleSec / 60) * IDLE_FEE} format={EUR} /> },
            ].map((s) => (
              <div key={s.k} className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[11px] text-tertiary">{s.k}</div>
                <div className="text-[15px] font-semibold text-heading">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* kW against SoC */}
      <div className="relative mt-2.5 min-h-0 flex-1">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="size-full" aria-label="Charging power by state of charge">
          <defs>
            <linearGradient id={`area-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ios-green)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--ios-green)" stopOpacity="0.02" />
            </linearGradient>
            <clipPath id={`done-${uid}`}>
              <motion.rect
                x={sx(SOC0)}
                y="0"
                height={H}
                initial={{ width: 0 }}
                animate={{ width: Math.max(0, sx(sim.soc) - sx(SOC0)) }}
                transition={{ type: "spring", stiffness: 60, damping: 18, delay: sim.kwh === 32.6 ? delay : 0 }}
              />
            </clipPath>
          </defs>

          {/* Slow zone past 80 % */}
          <rect x={sx(80)} y={PY0} width={sx(100) - sx(80)} height={PY1 - PY0} fill="var(--ios-orange)" fillOpacity={0.08} />
          <text x={sx(90)} y={PY0 + 11} textAnchor="middle" fontSize="9" className="fill-tertiary">
            Slow zone
          </text>

          {/* Grid */}
          {[100, 200, 300].map((k) => (
            <g key={k}>
              <line x1={PX0} x2={PX1} y1={sy(k)} y2={sy(k)} strokeWidth="1" strokeDasharray="2 4" className="stroke-split" />
              <text x={PX0 - 5} y={sy(k) + 3} textAnchor="end" fontSize="9" className="fill-tertiary tabular">
                {k}
              </text>
            </g>
          ))}
          <line x1={PX0} x2={PX1} y1={PY1} y2={PY1} strokeWidth="1" className="stroke-fill" />
          {[20, 40, 60, 80, 100].map((s) => (
            <text key={s} x={sx(s)} y={H - 12} textAnchor={s === 100 ? "end" : "middle"} fontSize="9" className="fill-tertiary tabular">
              {s}%
            </text>
          ))}
          <text x={PX0 - 5} y={H - 12} textAnchor="end" fontSize="9" className="fill-tertiary">
            kW
          </text>

          {/* Expected curve, then what has been delivered */}
          <path d={LINE} fill="none" strokeWidth="1.5" strokeDasharray="3 3" className="stroke-tertiary" />
          <g clipPath={`url(#done-${uid})`}>
            <path d={AREA} fill={`url(#area-${uid})`} />
            <path d={LINE} fill="none" stroke="var(--ios-green)" strokeWidth="2.2" strokeLinejoin="round" />
          </g>

          {/* Limit line: its label sits on the side away from the slow-zone caption */}
          <motion.g initial={false} animate={{ x: sx(target) }} transition={{ type: "spring", stiffness: 200, damping: 24 }}>
            <line x1={0} x2={0} y1={PY0 + 16} y2={PY1} strokeWidth="1.2" strokeDasharray="3 2" className="stroke-heading" />
            <text x={target >= 100 ? -4 : 4} y={PY1 - 6} textAnchor={target >= 100 ? "end" : "start"} fontSize="9" fontWeight="600" className="fill-secondary">
              Limit {target}%
            </text>
          </motion.g>

          {/* Now dot rides the curve, and drops to zero when the car stops */}
          <motion.g
            initial={{ x: sx(sim.soc), y: sy(0), opacity: 0 }}
            animate={{ x: sx(sim.soc), y: sy(sim.kw), opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 20, opacity: { delay } }}
          >
            {charging ? (
              <motion.circle
                r="5"
                fill="var(--ios-green)"
                initial={{ r: 5, opacity: 0.45 }}
                animate={{ r: [5, 13], opacity: [0.45, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
              />
            ) : null}
            <circle r="5" fill={charging ? "var(--ios-green)" : "var(--ios-orange)"} stroke="var(--widget-surface)" strokeWidth="2" />
          </motion.g>

          {/* Scrub */}
          {scrub != null ? (
            <g pointerEvents="none">
              <line x1={sx(scrub)} x2={sx(scrub)} y1={PY0} y2={PY1} strokeWidth="1" className="stroke-secondary" />
              <circle cx={sx(scrub)} cy={sy(curveKw(scrub))} r="3.5" className="fill-heading" />
            </g>
          ) : null}
          <rect
            x={PX0}
            y={PY0}
            width={PX1 - PX0}
            height={PY1 - PY0}
            fill="transparent"
            className="cursor-crosshair touch-none"
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setScrub(null)}
          />
        </svg>
      </div>

      {/* Limit + meta */}
      <div className="mt-2 flex h-7 items-center gap-2 whitespace-nowrap">
        <span className="text-[11px] text-tertiary">Limit</span>
        <Segmented
          size="small"
          value={target}
          onChange={(v) => changeTarget(v as number)}
          options={[
            { value: 80, label: "80%" },
            { value: 90, label: "90%" },
            { value: 100, label: "100%" },
          ]}
        />
        <div className="relative ml-auto min-w-0 text-right text-[11px]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={charging ? "live" : idleSec > 0 ? "fee" : "grace"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={cn("truncate tabular", charging ? "text-tertiary" : "font-medium text-ios-orange")}
            >
              {charging
                ? `${clock(sim.elapsed)} · ${Math.round(volts)} V · ${Math.round(amps)} A`
                : idleSec > 0
                  ? `Idle fee ${(IDLE_FEE).toFixed(2)} €/min · ${clock(idleSec)}`
                  : `Move car in ${clock(sim.grace)}`}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Widget>
  );
}
