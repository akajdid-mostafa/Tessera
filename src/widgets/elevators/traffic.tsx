import { DataBarVertical20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";

type Mode = "Trips" | "kWh";

const HOURS = Array.from({ length: 16 }, (_, i) => 6 + i);
const UP = [12, 48, 186, 412, 228, 120, 138, 214, 168, 110, 96, 122, 98, 64, 40, 22];
const DOWN = [6, 14, 40, 96, 88, 92, 130, 206, 150, 104, 120, 260, 380, 190, 70, 34];
const DRAWN = [1.4, 2.9, 6.8, 9.6, 6.2, 4.1, 4.6, 7.0, 5.6, 3.9, 3.7, 6.4, 8.2, 4.4, 2.2, 1.3];
const REGEN = [0.2, 0.5, 1.6, 2.6, 1.4, 0.8, 1.0, 1.7, 1.2, 0.8, 0.9, 1.6, 2.2, 1.0, 0.4, 0.2];
/** 15:00 is the last full hour; later bars are the typical day, drawn faint. */
const NOW = 9;

const W = 376;
const AXIS = 40;
const HALF = 37;
const SLOT = W / HOURS.length;
const BAR = 14;

const sum = (a: number[]) => a.slice(0, NOW + 1).reduce((x, y) => x + y, 0);
const TRIPS = sum(UP) + sum(DOWN);
const KWH = sum(DRAWN);
const REGEN_SHARE = sum(REGEN) / KWH;
const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

const SERIES = {
  Trips: { a: UP, b: DOWN, max: 420, ca: "var(--ios-blue)", cb: "var(--ios-teal)", la: "Up", lb: "Down" },
  kWh: { a: DRAWN, b: REGEN, max: 10, ca: "var(--ios-orange)", cb: "var(--ios-green)", la: "Drawn", lb: "Regen" },
} as const;

/** Elevators · medium. The day's traffic as diverging bars, up above the axis and down below, with up-peak and down-peak plain to see; switch to energy drawn versus regenerated and scrub any hour. */
export function TrafficWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [mode, setMode] = useState<Mode>("Trips");
  const [hover, setHover] = useState<number | null>(null);
  const [first, setFirst] = useState(true);
  const s = SERIES[mode];
  const trips = mode === "Trips";

  const hero = hover === null ? (trips ? TRIPS : KWH) : s.a[hover] + (trips ? s.b[hover] : 0);
  const fmt = trips ? { useGrouping: true } : { minimumFractionDigits: 1, maximumFractionDigits: 1 };

  return (
    <Widget size="medium" index={index} label="Elevator traffic today">
      <WidgetHeader
        icon={<DataBarVertical20Filled />}
        tint="var(--ios-indigo)"
        title="Traffic Today"
        subtitle="Bank A · 06:00–22:00"
        extra={
          <Segmented
            size="small"
            value={mode}
            onChange={(v) => {
              setMode(v as Mode);
              setHover(null);
              setFirst(false);
            }}
            options={["Trips", "kWh"]}
            className="text-[11px]"
          />
        }
      />

      <div className="mt-1.5 flex h-[30px] items-baseline-last gap-2 whitespace-nowrap">
        <span className="text-[26px] leading-none font-semibold tracking-tight text-heading">
          <AnimatedNumber value={hero} format={fmt} />
        </span>
        <span className="mb-0.5 text-[12px] text-tertiary">{trips ? "trips" : "kWh"}</span>
        <span className="mb-0.5 ml-auto flex items-center gap-2.5 text-[11px] text-tertiary tabular">
          {hover === null ? (
            trips ? (
              <span>Down-peak next · 17:00</span>
            ) : (
              <span>
                <span className="font-semibold text-ios-green">
                  <AnimatedNumber value={REGEN_SHARE} format={{ style: "percent", maximumFractionDigits: 0 }} />
                </span>{" "}
                regenerated
              </span>
            )
          ) : (
            <>
              <span className="font-semibold text-secondary">{hh(HOURS[hover])}</span>
              <Legend color={s.ca} label={`${s.la} ${trips ? s.a[hover] : s.a[hover].toFixed(1)}`} />
              <Legend color={s.cb} label={`${s.lb} ${trips ? s.b[hover] : s.b[hover].toFixed(1)}`} />
            </>
          )}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} 92`}
        className="mt-auto w-full shrink-0 cursor-crosshair"
        style={{ height: 92 }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const t = Math.min(0.999, Math.max(0, (e.clientX - r.left) / r.width));
          setHover(Math.floor(t * HOURS.length));
        }}
        onPointerLeave={() => setHover(null)}
      >
        {HOURS.map((h, i) => {
          const future = i > NOW;
          const ha = (s.a[i] / s.max) * HALF;
          const hb = (s.b[i] / s.max) * HALF;
          const x = i * SLOT + (SLOT - BAR) / 2;
          const dim = hover !== null && hover !== i;
          const t = { type: "spring" as const, stiffness: 170, damping: 22, delay: first ? delay + i * 0.03 : i * 0.015 };
          return (
            <g key={h} style={{ opacity: dim ? 0.35 : 1, transition: "opacity 160ms" }}>
              <motion.rect
                x={x}
                width={BAR}
                rx="3"
                initial={{ attrY: AXIS, height: 0 }}
                animate={{ attrY: AXIS - ha - 1, height: ha }}
                transition={t}
                style={{ fill: future ? "var(--ant-color-fill-secondary)" : s.ca }}
              />
              <motion.rect
                x={x}
                width={BAR}
                rx="3"
                y={AXIS + 1}
                initial={{ height: 0 }}
                animate={{ height: hb }}
                transition={t}
                style={{ fill: future ? "var(--ant-color-fill-tertiary)" : s.cb }}
              />
              {h % 3 === 0 ? (
                <text x={i * SLOT + SLOT / 2} y="90" textAnchor="middle" fontSize="9" style={{ fill: "var(--ant-color-text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
                  {h}
                </text>
              ) : null}
            </g>
          );
        })}
        <line x1="0" x2={W} y1={AXIS} y2={AXIS} strokeWidth="1" style={{ stroke: "var(--ant-color-split)" }} />
        <line
          x1={(NOW + 1) * SLOT}
          x2={(NOW + 1) * SLOT}
          y1="0"
          y2={AXIS + HALF}
          strokeWidth="1"
          strokeDasharray="2 3"
          style={{ stroke: "var(--ant-color-text-tertiary)" }}
        />
        <text x={(NOW + 1) * SLOT + 4} y="8" fontSize="9" fontWeight="600" style={{ fill: "var(--ant-color-text-secondary)" }}>
          Now
        </text>
      </svg>
    </Widget>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className={cn("flex items-center gap-1")}>
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
