import { Checkmark16Filled, WeatherDuststorm20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { AlarmMark, enterDelay, sparkPath, useInterval } from "./_parts";

type Gas = "NO₂" | "CO";
const GAS: Record<Gas, { a1: number; a2: number; top: number; base: number; bump: number; noise: number; digits: number }> = {
  "NO₂": { a1: 3, a2: 5, top: 6, base: 0.7, bump: 3.1, noise: 0.08, digits: 1 },
  CO: { a1: 25, a2: 50, top: 60, base: 7, bump: 11, noise: 0.5, digits: 0 },
};
const N = 60; // one point a minute, last hour
const PERIOD = 80;
const K0 = 48; // starts on the rising edge of the post-blast fume plume

/** Post-blast fumes reaching the return airway: a smooth plume every PERIOD minutes. */
function reading(gas: Gas, k: number) {
  const g = GAS[gas];
  const ph = ((k % PERIOD) + PERIOD) % PERIOD;
  const plume = ph >= 30 && ph <= 75 ? Math.pow(Math.sin((Math.PI * (ph - 30)) / 45), 1.5) : 0;
  const jitter = Math.sin(k * 2.7) * g.noise + Math.cos(k * 1.3) * g.noise * 0.6;
  return Math.max(0, g.base + g.bump * plume + jitter);
}

const W = 206;
const PW = 236; // plot plus label gutter
const H = 100;

/** Mining · medium. A return-airway gas trend for NO₂ or CO against its A1 and A2 alarm limits; the post-blast plume crosses A1 live, the trace turns orange above the limit, and the alarm flashes until acknowledged. */
export function VentilationWidget({ index }: { index?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [gas, setGas] = useState<Gas>("NO₂");
  const [k, setK] = useState(K0);
  const [acked, setAcked] = useState(false);
  const delay = enterDelay(index);

  useInterval(() => setK((v) => v + 1), 2500);

  const g = GAS[gas];
  const series = Array.from({ length: N }, (_, i) => reading(gas, k - N + 1 + i));
  const now = series[N - 1];
  const no2 = reading("NO₂", k);
  const alarm = no2 > GAS["NO₂"].a1;
  const inAlarm = now > g.a1;

  // A cleared alarm re-arms for the next plume.
  useEffect(() => {
    if (!alarm) setAcked(false);
  }, [alarm]);

  const y = (v: number) => H - (v / g.top) * H;
  const line = sparkPath(series, W, H, 0, g.top);
  const area = `${line} L${W} ${H} L0 ${H}Z`;

  return (
    <Widget size="medium" index={index} label="Underground ventilation gas">
      <WidgetHeader
        icon={<WeatherDuststorm20Filled />}
        tint={alarm && !acked ? "var(--ios-orange)" : "var(--ios-teal)"}
        title="Ventilation · 840 L"
        subtitle="Return airway RA-3 · 186 m³/s"
        extra={<Segmented size="small" value={gas} onChange={(v) => setGas(v as Gas)} options={["NO₂", "CO"]} />}
      />

      <div className="mt-auto flex h-[120px] gap-3">
        <div className="flex w-[110px] shrink-0 flex-col whitespace-nowrap">
          <div className="text-[11px] text-tertiary">{gas} · now</div>
          <div className="mt-1 flex items-baseline gap-1 leading-none">
            <span className={cn("text-[28px] font-semibold tracking-tight", inAlarm ? "text-ios-orange" : "text-heading")}>
              <AnimatedNumber value={Number(now.toFixed(g.digits))} format={{ minimumFractionDigits: g.digits, maximumFractionDigits: g.digits }} />
            </span>
            <span className="text-[12px] font-medium text-tertiary">ppm</span>
          </div>
          <div className={cn("mt-1 text-[11px]", inAlarm ? "font-medium text-ios-orange" : "text-tertiary")}>
            {inAlarm ? `A1 high · over ${g.a1} ppm` : `${Math.round((now / g.a1) * 100)}% of A1`}
          </div>

          <div className="mt-auto">
            <AnimatePresence mode="wait" initial={false}>
              {alarm ? (
                <motion.div
                  key={acked ? "acked" : "alarm"}
                  className="flex items-center gap-1.5"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  <AlarmMark priority={2} flashing={!acked} size={18} />
                  {acked ? (
                    <span className="flex items-center gap-0.5 text-[11px] font-medium text-tertiary">
                      <Checkmark16Filled className="size-3.5" /> NO₂ acked
                    </span>
                  ) : (
                    <Button size="small" color="orange" variant="filled" onClick={() => setAcked(true)}>
                      Ack NO₂
                    </Button>
                  )}
                </motion.div>
              ) : (
                <motion.div key="ok" className="text-[11px] leading-tight text-tertiary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="font-medium text-secondary">No active alarms</div>
                  <div>Re-entry clear · 13:42</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <svg viewBox={`0 0 ${PW} ${H}`} preserveAspectRatio="none" className="h-[100px] w-full shrink-0 overflow-visible" aria-hidden>
            <defs>
              <linearGradient id={`vt-fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--ant-color-text)" stopOpacity="0.12" />
                <stop offset="100%" stopColor="var(--ant-color-text)" stopOpacity="0" />
              </linearGradient>
              <clipPath id={`vt-hi-${uid}`}>
                <rect x="0" y="0" width={W} height={y(g.a1)} />
              </clipPath>
            </defs>
            <rect x="0" y="0" width={W} height={y(g.a2)} fill="color-mix(in srgb, var(--ios-red) 10%, transparent)" />
            <rect x="0" y={y(g.a2)} width={W} height={y(g.a1) - y(g.a2)} fill="color-mix(in srgb, var(--ios-orange) 12%, transparent)" />
            {[g.a1, g.a2].map((v) => (
              <line key={v} x1="0" x2={W} y1={y(v)} y2={y(v)} strokeWidth="1" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" className="stroke-tertiary" />
            ))}
            <line x1="0" x2={W} y1={H} y2={H} strokeWidth="1" vectorEffect="non-scaling-stroke" className="stroke-fill" />
            <motion.path
              d={area}
              fill={`url(#vt-fill-${uid})`}
              initial={{ d: area, opacity: 0 }}
              animate={{ d: area, opacity: 1 }}
              transition={{ opacity: { delay: delay + 0.4, duration: 0.8 }, d: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
            />
            <motion.path
              d={line}
              fill="none"
              strokeWidth="1.8"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className="stroke-[var(--ant-color-text-secondary)]"
              initial={{ d: line, opacity: 0 }}
              animate={{ d: line, opacity: 1 }}
              transition={{ opacity: { delay, duration: 1 }, d: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
            />
            <motion.path
              d={line}
              fill="none"
              strokeWidth="2.2"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              clipPath={`url(#vt-hi-${uid})`}
              className="stroke-[var(--ios-orange)]"
              initial={{ d: line, opacity: 0 }}
              animate={{ d: line, opacity: 1 }}
              transition={{ opacity: { delay, duration: 1 }, d: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
            />
          </svg>
          {/* Limit labels sit in the gutter, right of the plot, beside their lines. */}
          <div className="pointer-events-none relative -mt-[100px] h-[100px]" aria-hidden>
            {[
              { v: g.a2, label: `A2 ${g.a2}` },
              { v: g.a1, label: `A1 ${g.a1}` },
            ].map((l) => (
              <span
                key={l.label}
                className="absolute right-0 -translate-y-1/2 text-[9px] font-medium text-tertiary tabular"
                style={{ top: `${(y(l.v) / H) * 100}%` }}
              >
                {l.label}
              </span>
            ))}
            <span
              className={cn("absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--widget-surface)] transition-[top] duration-500", inAlarm ? "bg-ios-orange" : "bg-heading")}
              style={{ left: `${(W / PW) * 100}%`, top: `${(y(now) / H) * 100}%` }}
            />
          </div>
          <div className="relative mt-1 h-3 text-[10px] leading-3 text-tertiary tabular" style={{ width: `${(W / PW) * 100}%` }}>
            <span className="absolute left-0">−60 min</span>
            <span className="absolute left-1/2 -translate-x-1/2">−30</span>
            <span className="absolute right-0">now</span>
          </div>
        </div>
      </div>
    </Widget>
  );
}
