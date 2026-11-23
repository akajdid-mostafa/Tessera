import { WeatherSnowflake20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Chiller = { id: string; tons: number; cap: number; kwpt: number; on: boolean };

const SEED: Chiller[] = [
  { id: "CH-1", tons: 226, cap: 285, kwpt: 0.56, on: true },
  { id: "CH-2", tons: 186, cap: 285, kwpt: 0.61, on: true },
  { id: "CH-3", tons: 0, cap: 285, kwpt: 0, on: false },
];
/** Pumps and cooling-tower fans, in kW. */
const AUX = 30;
const LO = 0.3;
const HI = 1.2;
const BAND: [number, number] = [0.5, 0.75];
const CX = 75;
const CY = 76;
const R = 60;
const ARC = Math.PI * R;
const TON_KW = 3.517;

const frac = (v: number) => Math.min(1, Math.max(0, (v - LO) / (HI - LO)));
const polar = (f: number, r: number) => [CX - r * Math.cos(Math.PI * f), CY - r * Math.sin(Math.PI * f)] as const;
function arc(f0: number, f1: number, r: number) {
  const [x0, y0] = polar(f0, r);
  const [x1, y1] = polar(f1, r);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}
const TWO = { minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

/** Building · medium. Plant kW/ton on a half gauge with the 0.50–0.75 target band, beside the chillers' load; loads drift live and hovering a chiller swings the gauge to its own efficiency. */
export function ChillerPlantWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [chillers, setChillers] = useState(SEED);
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => {
      setChillers((list) =>
        list.map((c) => {
          if (!c.on) return c;
          const base = SEED.find((s) => s.id === c.id)!;
          const tons = Math.round(Math.min(base.tons + 14, Math.max(base.tons - 14, c.tons + (Math.random() - 0.5) * 10)));
          // Centrifugals run best near 70–80% load; efficiency drifts with it.
          const kwpt = +(base.kwpt + (Math.abs(tons / c.cap - 0.76) * 0.18) + (Math.random() - 0.5) * 0.01).toFixed(2);
          return { ...c, tons, kwpt };
        }),
      );
    }, 2500);
    return () => window.clearInterval(t);
  }, []);

  const running = chillers.filter((c) => c.on);
  const tons = running.reduce((s, c) => s + c.tons, 0);
  const kw = running.reduce((s, c) => s + c.tons * c.kwpt, 0) + AUX;
  const plant = kw / tons;
  const c = chillers.find((x) => x.id === sel) ?? null;
  const standby = c !== null && !c.on;
  const value = c ? c.kwpt : plant;
  const f = standby ? 0 : frac(value);
  const high = !standby && value > BAND[1] + 0.1;
  const color = standby ? "var(--ant-color-fill-secondary)" : high ? "var(--ios-orange)" : "var(--ios-teal)";

  return (
    <Widget size="medium" index={index} label="Chiller plant efficiency">
      <WidgetHeader
        icon={<WeatherSnowflake20Filled />}
        tint="var(--ios-blue)"
        title="Chiller Plant"
        subtitle="Central plant · B1"
        extra={
          <span className="whitespace-nowrap rounded-full bg-fill-tertiary px-2 py-0.5 text-[11px] font-semibold text-secondary tabular">
            {running.length} of {chillers.length} running
          </span>
        }
      />

      <div className="mt-1.5 flex min-h-0 flex-1 items-center gap-3">
        <div className="relative w-[150px] shrink-0">
          <svg viewBox="0 0 150 86" className="w-full overflow-visible" aria-hidden>
            <path d={arc(0, 1, R)} fill="none" strokeWidth="9" strokeLinecap="round" style={{ stroke: "var(--ant-color-fill-tertiary)" }} />
            {/* Target band, drawn just outside the track. */}
            <path d={arc(frac(BAND[0]), frac(BAND[1]), R + 9)} fill="none" strokeWidth="2.5" strokeLinecap="round" style={{ stroke: "var(--ios-green)", opacity: 0.7 }} />
            <motion.path
              d={arc(0, 1, R)}
              fill="none"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={ARC}
              initial={{ strokeDashoffset: ARC }}
              animate={{ strokeDashoffset: ARC * (1 - f) }}
              transition={{ type: "spring", stiffness: 80, damping: 16, delay: sel === null ? delay : 0 }}
              style={{ stroke: color, transition: "stroke 0.4s" }}
            />
            <motion.g
              initial={{ rotate: 0, opacity: 0 }}
              animate={{ rotate: f * 180, opacity: standby ? 0 : 1 }}
              transition={{ type: "spring", stiffness: 80, damping: 16, delay: sel === null ? delay : 0 }}
            >
              {/* A transparent disc centres the group's box on the gauge pivot. */}
              <circle cx={CX} cy={CY} r={R + 6} fill="transparent" />
              <circle cx={CX - R} cy={CY} r="6" strokeWidth="2.5" style={{ fill: "var(--ant-color-text)", stroke: "var(--widget-surface)" }} />
            </motion.g>
            <text x={CX - R} y={CY + 10} textAnchor="middle" fontSize="9" style={{ fill: "var(--ant-color-text-tertiary)" }}>
              {LO.toFixed(1)}
            </text>
            <text x={CX + R} y={CY + 10} textAnchor="middle" fontSize="9" style={{ fill: "var(--ant-color-text-tertiary)" }}>
              {HI.toFixed(1)}
            </text>
          </svg>
          {/* Caption over the value: under it, it ran into the 0.3 / 1.2 scale ends. */}
          <div className="absolute inset-x-0 bottom-[2px] text-center leading-none">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={sel ?? "plant"}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                className="mb-1 text-[10px] text-tertiary tabular"
              >
                {standby ? "Lead/lag swap Thu" : c ? `${c.id} · COP ${(TON_KW / c.kwpt).toFixed(1)}` : "kW/ton · plant"}
              </motion.div>
            </AnimatePresence>
            {standby ? (
              <div className="text-[18px] font-semibold text-tertiary">Standby</div>
            ) : (
              <AnimatedNumber value={value} format={TWO} className={cn("text-[24px] font-semibold tracking-tight", high ? "text-ios-orange" : "text-heading")} />
            )}
          </div>
        </div>

        <ul className="min-w-0 flex-1" onMouseLeave={() => setSel(null)}>
          {chillers.map((x, i) => {
            const load = x.tons / x.cap;
            return (
              <motion.li
                key={x.id}
                onMouseEnter={() => setSel(x.id)}
                onClick={() => setSel((s) => (s === x.id ? null : x.id))}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.1 + i * 0.07, type: "spring", stiffness: 380, damping: 28 }}
                className={cn(
                  "-mx-1.5 flex h-[30px] cursor-pointer items-center gap-2 rounded-md px-1.5 transition-colors duration-200",
                  sel === x.id ? "bg-fill-tertiary" : "hover:bg-fill-quaternary",
                )}
              >
                <span className={cn("size-1.5 shrink-0 rounded-full", x.on ? "bg-ios-green" : "bg-fill")} />
                <div className="w-[62px] shrink-0 leading-tight">
                  <div className={cn("text-[12px] font-semibold", x.on ? "text-heading" : "text-tertiary")}>{x.id}</div>
                  <div className="text-[10px] text-tertiary tabular">{x.on ? `${x.tons} tons` : "Standby"}</div>
                </div>
                <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-fill-secondary">
                  <motion.span
                    className="block h-full rounded-full bg-ios-blue"
                    initial={{ width: 0 }}
                    animate={{ width: `${load * 100}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20, delay: sel === null ? delay + 0.2 + i * 0.07 : 0 }}
                  />
                </span>
                <span className="w-[32px] shrink-0 text-right text-[11px] text-tertiary tabular">{Math.round(load * 100)}%</span>
                <span className="w-[34px] shrink-0 text-right text-[12px] font-semibold text-heading">
                  {x.on ? <AnimatedNumber value={x.kwpt} format={TWO} /> : <span className="text-tertiary">—</span>}
                </span>
              </motion.li>
            );
          })}
        </ul>
      </div>

      <div className="mt-1 truncate text-[11px] text-tertiary tabular">
        Load <span className="font-medium text-secondary">{tons} tons</span> · {Math.round(kw)} kW · CHWS 6.7°C · ΔT 5.5 K
      </div>
    </Widget>
  );
}
