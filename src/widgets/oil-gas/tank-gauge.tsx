import { ArrowUp12Filled, Database20Filled, Timer16Regular } from "@fluentui/react-icons";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { enterDelay, useInterval } from "./_parts";

/** Shell height and API 2350 levels of concern, in feet; `label` is where each callout sits, since the ticks crowd. */
const SHELL_FT = 48;
const LEVELS = [
  { key: "CH", ft: 46, label: 6 },
  { key: "HH", ft: 44, label: 16 },
  { key: "H", ft: 42, label: 26 },
  { key: "L", ft: 6, label: 80 },
  { key: "LL", ft: 4, label: 91 },
] as const;
const BBL_PER_FT = 5_200;
const RATE_BBL_H = 6_200;
const M3_PER_BBL = 0.158987;
const M_PER_FT = 0.3048;

/** Drawing box: shell from y=8 to y=94. */
const TOP = 8;
const BOTTOM = 94;
const yOf = (ft: number) => BOTTOM - (ft / SHELL_FT) * (BOTTOM - TOP);

/** Oil & gas · small. A floating-roof tank on a receipt: the product and roof rise live against API 2350 ticks, tap to switch US and SI units. */
export function TankGaugeWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [ft, setFt] = useState(38.33);
  const [si, setSi] = useState(false);
  const delay = enterDelay(index);

  // Demo time runs fast: each tick adds about ten real minutes of receipt.
  useInterval(() => setFt((l) => Math.min(41.6, +(l + 0.012 + Math.random() * 0.01).toFixed(3))), 2200);

  const bbl = ft * BBL_PER_FT;
  const toHH = (44 - ft) / (RATE_BBL_H / BBL_PER_FT); // hours
  const h = Math.floor(toHH);
  const m = Math.round((toHH - h) * 60);
  const whole = Math.floor(ft);
  const inches = Math.floor((ft - whole) * 12);
  const y = yOf(ft);

  return (
    <Widget size="small" index={index} label="Tank level gauge" pressable onPress={() => setSi((s) => !s)}>
      <WidgetHeader
        icon={<Database20Filled />}
        tint="var(--ios-blue)"
        title="TK-104"
        subtitle="ULSD · receiving"
        extra={<span className="mt-0.5 text-[10px] font-semibold text-tertiary">{si ? "SI" : "US"}</span>}
      />

      <div className="mt-1.5 flex min-h-0 flex-1 gap-1.5">
        <svg viewBox="0 0 64 100" className="h-[100px] w-[64px] shrink-0 overflow-visible" aria-hidden>
          <defs>
            <clipPath id={`tk-shell-${index ?? 0}`}>
              <rect x="10" y={TOP} width="30" height={BOTTOM - TOP} rx="2" />
            </clipPath>
          </defs>
          {/* Inlet line with product moving into the tank. */}
          <line x1="0" x2="10" y1="88" y2="88" strokeWidth="2.4" className="stroke-fill" />
          <motion.line
            x1="0"
            x2="10"
            y1="88"
            y2="88"
            strokeWidth="1.4"
            strokeDasharray="1.5 2.5"
            strokeLinecap="round"
            className="stroke-secondary"
            animate={reduce ? undefined : { strokeDashoffset: [0, -8] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          />
          <rect x="10" y={TOP} width="30" height={BOTTOM - TOP} rx="2" className="fill-fill-quaternary" />
          <g clipPath={`url(#tk-shell-${index ?? 0})`}>
            <motion.rect
              x="10"
              width="30"
              className="fill-fill"
              initial={{ y: BOTTOM, height: 0 }}
              animate={{ y, height: BOTTOM - y }}
              transition={{ type: "spring", stiffness: 60, damping: 18, delay }}
            />
            {/* The floating roof rides the product surface. */}
            <motion.rect
              x="11"
              width="28"
              height="2.6"
              rx="1"
              className="fill-[var(--ant-color-text-secondary)]"
              initial={{ y: BOTTOM - 2.6 }}
              animate={{ y: y - 2.6 }}
              transition={{ type: "spring", stiffness: 60, damping: 18, delay }}
            />
          </g>
          <rect x="10" y={TOP} width="30" height={BOTTOM - TOP} rx="2" fill="none" strokeWidth="1.3" className="stroke-tertiary" />
          {LEVELS.map((l) => {
            const ly = yOf(l.ft);
            const high = l.key === "CH" || l.key === "HH";
            return (
              <g key={l.key}>
                <polyline
                  points={`40,${ly} 43,${ly} 46,${l.label}`}
                  fill="none"
                  strokeWidth="1"
                  strokeLinejoin="round"
                  className={high ? "stroke-ios-orange" : "stroke-tertiary"}
                />
                <text
                  x="48"
                  y={l.label + 3.2}
                  fontSize="9"
                  className={cn("tabular", high ? "fill-ios-orange" : "fill-tertiary")}
                >
                  {l.key}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="flex min-w-0 flex-1 flex-col whitespace-nowrap leading-tight">
          <div className="text-[22px] leading-none font-semibold tracking-tight text-heading">
            {si ? (
              <>
                <AnimatedNumber value={ft * M_PER_FT} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />
                <span className="text-[12px] font-medium text-tertiary"> m</span>
              </>
            ) : (
              <>
                <AnimatedNumber value={whole} />
                <span className="text-[14px] text-tertiary">′</span>
                <AnimatedNumber value={inches} />
                <span className="text-[14px] text-tertiary">″</span>
              </>
            )}
          </div>
          <div className="mt-1 text-[11px] font-medium text-secondary">
            <AnimatedNumber value={Math.round(si ? bbl * M3_PER_BBL : bbl)} />
            <span className="text-tertiary"> {si ? "m³" : "bbl"}</span>
          </div>
          <div className="flex items-center gap-0.5 text-[11px] text-tertiary">
            <ArrowUp12Filled className="shrink-0" />
            <AnimatedNumber value={Math.round(si ? RATE_BBL_H * M3_PER_BBL : RATE_BBL_H)} />
            {si ? " m³/h" : " bbl/h"}
          </div>
          <div className="mt-auto flex w-fit items-center gap-1 rounded-full bg-fill-tertiary px-1.5 py-0.5 text-[10px] font-medium text-secondary tabular">
            <Timer16Regular className="size-3 shrink-0" />
            HH in {h}h {String(m).padStart(2, "0")}m
          </div>
        </div>
      </div>
    </Widget>
  );
}
