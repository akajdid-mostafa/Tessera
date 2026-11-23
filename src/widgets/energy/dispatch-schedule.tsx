import { CalendarClock20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type PointerEvent, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { enterDelay, useInterval } from "./_parts";

/* Kestrel BESS, 100 MW / 400 MWh, on today's day-ahead plan: charge overnight and
 * through the midday solar glut (13:00 clears at −4 €/MWh, so charging is paid),
 * discharge into the morning and evening peaks. SoC follows the plan with 95%
 * one-way efficiency and stays inside the 5–95% window. Positive MW = discharge. */
const MW = [0, -80, -100, -100, -60, 0, 40, 60, 60, 20, 0, -60, -60, -40, 0, 0, 0, 60, 100, 100, 30, 0, 0, 0];
const PRICE = [62, 48, 41, 38, 39, 47, 88, 124, 131, 96, 54, 22, 8, -4, 12, 46, 92, 168, 214, 236, 188, 132, 96, 74];
const CAP_MWH = 400;
const EFF = 0.95;
const SOC: number[] = MW.reduce<number[]>(
  (acc, m) => [...acc, acc[acc.length - 1] - ((m > 0 ? m / EFF : m * EFF) / CAP_MWH) * 100],
  [12],
);
const REV = MW.map((m, h) => m * PRICE[h]);
const NET = REV.reduce((s, x) => s + x, 0);
const START_MIN = 18 * 60 + 12;

const W = 376;
const H = 168;
const MID = H / 2;
const SLOT = W / 24;
const BAR = 10;
const P_MIN = Math.min(...PRICE);
const P_MAX = Math.max(...PRICE);

type Mode = "MW" | "€";
const hh = (h: number) => `${String(h % 24).padStart(2, "0")}:00`;
const socAt = (t: number) => {
  const h = Math.min(23, Math.floor(t));
  return SOC[h] + (SOC[h + 1] - SOC[h]) * (t - h);
};
const ySoc = (s: number) => H - (s / 100) * H;
const socPath = (from: number, to: number) => {
  const pts: string[] = [];
  const a = Math.max(0, from);
  for (let t = a; t <= to + 1e-6; t += 0.25) pts.push(`${pts.length ? "L" : "M"}${(t * SLOT).toFixed(1)} ${ySoc(socAt(t)).toFixed(1)}`);
  pts.push(`L${(to * SLOT).toFixed(1)} ${ySoc(socAt(to)).toFixed(1)}`);
  return pts.join(" ");
};

/** Energy · large. A battery's 24-hour dispatch plan as diverging charge/discharge bars with its SoC line and a price strip, the NOW line sliding live; scrub any hour to read it, and switch MW to € to see what each hour earns. */
export function DispatchScheduleWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<Mode>("MW");
  const [minute, setMinute] = useState(START_MIN);
  const [hover, setHover] = useState<number | null>(null);
  const delay = enterDelay(index);

  // Demo clock: one minute of the day per second.
  useInterval(() => setMinute((m) => (m + 1 >= 21 * 60 ? START_MIN : m + 1)), 1000);

  const now = minute / 60;
  const nowH = Math.floor(now);
  const sel = hover ?? nowH;
  const vals = mode === "MW" ? MW : REV;
  const vmax = mode === "MW" ? 100 : Math.max(...REV.map(Math.abs));
  const v = vals[sel];
  const socNow = hover === null ? socAt(now) : SOC[sel + 1];
  const yBar = (x: number) => (x / vmax) * (MID - 4);

  const verb = MW[sel] > 0 ? "Discharging" : MW[sel] < 0 ? "Charging" : "Idle";
  const pointerToHour = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setHover(Math.min(23, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * 24))));
  };

  return (
    <Widget size="large" index={index} label="Battery dispatch schedule">
      <WidgetHeader
        icon={<CalendarClock20Filled />}
        tint="var(--ios-indigo)"
        title="Kestrel BESS · Dispatch"
        subtitle="Day-ahead · 100 MW / 400 MWh"
        extra={<Segmented size="small" value={mode} onChange={(x) => setMode(x as Mode)} options={["MW", "€"]} />}
      />

      <div className="mt-3 flex items-end justify-between gap-3 whitespace-nowrap">
        <div className="min-w-0 leading-tight">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={hover === null ? "now" : sel}
              className="text-[11px] font-semibold text-secondary tabular"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              {hover === null
                ? `Now · ${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`
                : `${hh(sel)}–${hh(sel + 1)}`}
            </motion.div>
          </AnimatePresence>
          <div className="flex items-baseline gap-1 leading-none">
            <AnimatedNumber
              value={mode === "MW" ? v : v / 1000}
              prefix={mode === "€" ? (v < 0 ? "−€" : "€") : v > 0 ? "+" : v < 0 ? "−" : ""}
              format={mode === "MW" ? { maximumFractionDigits: 0, signDisplay: "never" } : { minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: "never" }}
              className="text-[30px] font-semibold tracking-tight text-heading"
            />
            <span className="text-[12px] text-tertiary">{mode === "MW" ? "MW" : "k"}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-tertiary tabular">
            {verb} · €{PRICE[sel]}/MWh
          </div>
        </div>
        <div className="shrink-0 text-right leading-tight">
          <div className="text-[11px] text-tertiary">{hover === null ? "SoC" : `SoC at ${hh(sel + 1)}`}</div>
          <AnimatedNumber
            value={socNow / 100}
            format={{ style: "percent", maximumFractionDigits: 0 }}
            className="text-[22px] leading-none font-semibold text-ios-indigo"
          />
          <div className="mt-0.5 text-[11px] text-tertiary tabular">
            Net{" "}
            <span className={cn("font-semibold", NET < 0 ? "text-ios-orange" : "text-secondary")}>€{(NET / 1000).toFixed(1)}k</span> today
          </div>
        </div>
      </div>

      <div
        className="relative mt-3 cursor-crosshair touch-none"
        style={{ height: H }}
        onPointerMove={pointerToHour}
        onPointerDown={pointerToHour}
        onPointerLeave={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full overflow-visible" aria-hidden>
          {[6, 12, 18].map((h) => (
            <line key={h} x1={h * SLOT} x2={h * SLOT} y1="0" y2={H} strokeWidth="1" strokeDasharray="2 4" className="stroke-fill" />
          ))}
          <line x1="0" x2={W} y1={MID} y2={MID} strokeWidth="1" className="stroke-fill" />
          <text x="3" y="11" fontSize="10" className="fill-tertiary">
            Discharge
          </text>
          <text x={14.2 * SLOT} y={H - 4} fontSize="10" className="fill-tertiary">
            Charge
          </text>

          {vals.map((x, h) => {
            const len = Math.abs(yBar(x));
            const up = x >= 0;
            const y = up ? MID - len : MID;
            const past = h < nowH;
            const cur = h === nowH;
            const frac = cur ? now - nowH : past ? 1 : 0;
            const bx = h * SLOT + (SLOT - BAR) / 2;
            const active = h === sel;
            return (
              <g key={h}>
                <motion.rect
                  x={bx}
                  width={BAR}
                  rx="2"
                  initial={{ y: MID, height: 0 }}
                  animate={{ y, height: len }}
                  transition={{ type: "spring", stiffness: 120, damping: 20, delay: mode === "MW" && minute === START_MIN ? delay + h * 0.02 : 0 }}
                  className={active ? "fill-[var(--ant-color-text)]" : "fill-fill"}
                />
                {/* Delivered share of the hour, solid; the rest stays plan. */}
                {frac > 0 && !active ? (
                  <motion.rect
                    x={bx}
                    width={BAR * frac}
                    rx="2"
                    initial={{ y: MID, height: 0 }}
                    animate={{ y, height: len }}
                    transition={{ type: "spring", stiffness: 120, damping: 20, delay: minute === START_MIN ? delay + h * 0.02 : 0 }}
                    className="fill-[var(--ant-color-text-tertiary)]"
                  />
                ) : null}
              </g>
            );
          })}

          <motion.path
            d={socPath(0, now)}
            fill="none"
            stroke="var(--ios-indigo)"
            strokeWidth="2"
            strokeLinejoin="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: delay + 0.4 }}
          />
          <motion.path
            d={socPath(now, 24)}
            fill="none"
            stroke="var(--ios-indigo)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            strokeOpacity="0.7"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: delay + 0.5 }}
          />

          <line x1={now * SLOT} x2={now * SLOT} y1="0" y2={H} strokeWidth="1.5" className="stroke-heading" />
          {hover !== null ? (
            <rect x={hover * SLOT} y="0" width={SLOT} height={H} className="fill-fill-quaternary" pointerEvents="none" />
          ) : null}
        </svg>

        {/* SoC dot at NOW, breathing. */}
        <span
          className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${(now / 24) * 100}%`, top: `${(ySoc(socAt(now)) / H) * 100}%` }}
        >
          {!reduce ? (
            <motion.span
              className="absolute inset-0 rounded-full bg-ios-indigo"
              animate={{ scale: [1, 2.4], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
          ) : null}
          <span className="absolute inset-0 rounded-full bg-ios-indigo ring-2 ring-[var(--widget-surface)]" />
        </span>
      </div>

      <div className="mt-1 flex justify-between text-[10px] leading-none text-tertiary tabular">
        {["00", "06", "12", "18", "24"].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>

      {/* Price strip: greyscale by €/MWh, a negative hour hatched. */}
      <div className="mt-1.5 flex h-3.5 gap-px overflow-hidden rounded-[4px]">
        {PRICE.map((p, h) => (
          <span
            key={h}
            className={cn("flex-1", h === sel && "ring-1 ring-inset ring-sel")}
            style={
              p < 0
                ? { backgroundImage: "repeating-linear-gradient(135deg, var(--ant-color-fill) 0 2px, transparent 2px 4px)" }
                : { background: `color-mix(in srgb, var(--ant-color-text) ${Math.round(6 + ((p - Math.max(0, P_MIN)) / (P_MAX - Math.max(0, P_MIN))) * 50)}%, transparent)` }
            }
          />
        ))}
      </div>

      <div className="mt-auto flex items-center gap-3 text-[10px] leading-none whitespace-nowrap text-tertiary">
        <span className="flex items-center gap-1">
          <span className="h-2 w-1.5 rounded-[1px] bg-fill" />
          Plan
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-1.5 rounded-[1px] bg-[var(--ant-color-text-tertiary)]" />
          Delivered
        </span>
        <span className="flex items-center gap-1">
          <span className="h-0.5 w-3 rounded-full bg-ios-indigo" />
          SoC
        </span>
        <span className="ml-auto">€/MWh {P_MIN} → {P_MAX}</span>
      </div>
    </Widget>
  );
}
