import { Bug20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const N = 40;
const W = 100;
/** The newest point sits a little in from the edge so its live dot is not clipped. */
const XMAX = 96;
const H = 48;
const SLO = 2;
const TICK_MS = 1400;
/** Seconds each point stands for: 40 points cover the last five minutes. */
const STEP_S = 7.5;
/** A bad deploy: errors climb for a few samples, then the rollback lands. */
const SPIKE = [1.4, 3.1, 4.6, 3.8, 2.4, 1.2, 0.7];
const SPIKE_EVERY = 22;
const SPIKE_FIRST = 9;

const quiet = () => 0.3 + Math.random() * 0.24;
const SEED = Array.from({ length: N }, (_, i) => 0.34 + Math.abs(Math.sin(i * 1.3)) * 0.18 + (i % 7 === 3 ? 0.12 : 0));

/** Catmull-Rom through the points, as cubic Béziers, so the line stays smooth while it morphs. */
function smooth(pts: [number, number][]) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
}

/** SaaS · small. A live error-rate sparkline; a spike past the SLO turns it red and asks “Incident?”. Hover to read a point. */
export function ErrorRateWidget({ index }: { index?: number }) {
  const uid = useId().replace(/:/g, "");
  const [pts, setPts] = useState<number[]>(SEED);
  const [hover, setHover] = useState<number | null>(null);
  const hovering = useRef(false);

  useEffect(() => {
    let tick = 0;
    const t = window.setInterval(() => {
      if (hovering.current) return;
      tick++;
      const k = tick >= SPIKE_FIRST ? (tick - SPIKE_FIRST) % SPIKE_EVERY : -1;
      const v = k >= 0 && k < SPIKE.length ? SPIKE[k] * (0.92 + Math.random() * 0.16) : quiet();
      setPts((p) => [...p.slice(1), v]);
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, []);

  const max = Math.max(2.6, ...pts) * 1.12;
  const y = (v: number) => H - (v / max) * (H - 4);
  const x = (i: number) => (i / (N - 1)) * XMAX;
  const xy = pts.map((v, i) => [x(i), y(v)] as [number, number]);
  const line = smooth(xy);
  const area = `${line} L${XMAX} ${H} L0 ${H} Z`;
  const sloY = y(SLO);

  const current = pts[N - 1];
  const incident = current > SLO;
  const shown = hover === null ? current : pts[hover];
  const hot = shown > SLO;
  const ago = hover === null ? 0 : (N - 1 - hover) * STEP_S;

  return (
    <Widget
      size="small"
      index={index}
      label="Error rate"
      glow={{ mode: "pulse", colors: ["#FF453A", "#FF9F0A", "#FF453A"], blur: 18, duration: 1.4 }}
      glowActive={incident}
    >
      <WidgetHeader
        icon={<Bug20Filled />}
        tint={incident ? "var(--ios-red)" : "var(--ios-orange)"}
        title="Error Rate"
        subtitle="checkout-api · 5 min"
      />

      <div
        className={cn(
          "mt-2.5 text-[28px] leading-none font-semibold tracking-tight transition-colors duration-mid",
          hot ? "text-ios-red" : "text-heading",
        )}
      >
        <AnimatedNumber
          value={shown / 100}
          format={{ style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 }}
        />
      </div>

      <div className="relative mt-1.5 h-[18px]">
        <AnimatePresence mode="popLayout" initial={false}>
          {hover !== null ? (
            <motion.div
              key="ago"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-[11px] leading-[18px] text-tertiary tabular"
            >
              {ago === 0 ? "Now" : `${Math.floor(ago / 60) ? `${Math.floor(ago / 60)}m ` : ""}${Math.round(ago % 60)}s ago`}
            </motion.div>
          ) : incident ? (
            <motion.span
              key="incident"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-ios-red px-2 py-0.5 text-[11px] font-semibold text-white"
            >
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-white opacity-80" />
                <span className="relative size-1.5 rounded-full bg-white" />
              </span>
              Incident?
            </motion.span>
          ) : (
            <motion.div
              key="ok"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="truncate text-[11px] leading-[18px] text-tertiary"
            >
              18.2k req/min · SLO {SLO}%
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        className="relative -mx-4 -mb-4 mt-auto h-[72px] cursor-crosshair"
        onPointerEnter={() => {
          hovering.current = true;
        }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const t = Math.min(1, Math.max(0, (e.clientX - r.left) / (r.width * (XMAX / W))));
          setHover(Math.round(t * (N - 1)));
        }}
        onPointerLeave={() => {
          hovering.current = false;
          setHover(null);
        }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id={`er-stroke-${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={H}>
              <stop offset={0} stopColor="var(--ios-red)" />
              <stop offset={sloY / H} stopColor="var(--ios-red)" />
              <stop offset={sloY / H} stopColor="var(--ios-teal)" />
              <stop offset={1} stopColor="var(--ios-teal)" />
            </linearGradient>
            <linearGradient id={`er-fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={incident ? "var(--ios-red)" : "var(--ios-teal)"} stopOpacity={0.32} />
              <stop offset="100%" stopColor={incident ? "var(--ios-red)" : "var(--ios-teal)"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <motion.line
            x1={0}
            x2={W}
            y1={sloY}
            y2={sloY}
            initial={false}
            stroke="var(--ant-color-text-tertiary)"
            strokeDasharray="2 3"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            animate={{ y1: sloY, y2: sloY }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <motion.path d={area}
            fill={`url(#er-fill-${uid})`}
            initial={false}
            animate={{ d: area }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <motion.path d={line}
            fill="none"
            stroke={`url(#er-stroke-${uid})`}
            strokeWidth={1.8}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={{ opacity: 0, d: line }}
            animate={{ opacity: 1, d: line }}
            transition={{
              opacity: { delay: 0.3 + (index ?? 0) * 0.06, duration: 1.1, ease: [0.22, 1, 0.36, 1] },
              d: { duration: 0.5, ease: "easeOut" },
            }}
          />
        </svg>

        {hover !== null ? (
          <>
            <span
              className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-[var(--ant-color-text-tertiary)]"
              style={{ left: `${x(hover)}%` }}
            />
            <span
              className={cn(
                "pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--widget-surface)]",
                pts[hover] > SLO ? "bg-ios-red" : "bg-ios-teal",
              )}
              style={{ left: `${x(hover)}%`, top: `${(y(pts[hover]) / H) * 100}%` }}
            />
          </>
        ) : (
          <motion.span
            className={cn(
              "pointer-events-none absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
              incident ? "bg-ios-red" : "bg-ios-teal",
            )}
            style={{ left: `${XMAX}%`, top: `${(y(current) / H) * 100}%` }}
            animate={{ scale: [1, 1.6, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        )}
      </div>
    </Widget>
  );
}
