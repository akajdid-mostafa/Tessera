import { Water20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { enterDelay, hhmm, useInterval } from "./_parts";

type Day = "Today" | "Tomorrow";
const DAYS: Day[] = ["Today", "Tomorrow"];

/* Semi-diurnal tide (M2, 12 h 25 min) above chart datum. */
const M2 = 745;
const MEAN = 2.3;
const AMP = 1.8;
const HW: Record<Day, number> = { Today: 948, Tomorrow: 998 }; // 15:48, 16:38
const tide = (t: number, day: Day) => MEAN + AMP * Math.cos((2 * Math.PI * (t - HW[day])) / M2);

/* Required height of tide: draft 16.2 m + 10 % UKC 1.6 m − dredged channel 14.8 m. */
const DRAFT = 16.2;
const REQ = 3.0;

const T0 = 360; // 06:00
const T1 = 1440; // 24:00
const W = 250;
const H = 108;
const H_MAX = 4.8;
const X = (t: number) => ((t - T0) / (T1 - T0)) * W;
const Y = (h: number) => H - (h / H_MAX) * H;
const TICKS = [6, 9, 12, 15, 18, 21, 24];

function curve(day: Day) {
  const pts = Array.from({ length: 73 }, (_, i) => T0 + ((T1 - T0) * i) / 72);
  return pts.map((t, i) => `${i ? "L" : "M"}${X(t).toFixed(1)} ${Y(tide(t, day)).toFixed(1)}`).join(" ");
}

/** Windows where the tide is at or above the requirement, clipped to the chart. */
function windows(day: Day) {
  const half = (Math.acos((REQ - MEAN) / AMP) / (2 * Math.PI)) * M2;
  return [HW[day] - M2, HW[day], HW[day] + M2]
    .map((hw) => ({ from: Math.max(T0, Math.round(hw - half)), to: Math.min(T1, Math.round(hw + half)) }))
    .filter((w) => w.to > w.from);
}

/** Maritime · medium. Predicted tide against the height a deep-draft ship needs to transit, with the sailing window shaded; the NOW mark rides the curve and scrubbing reads any time as go or no-go. */
export function TideWindowWidget({ index }: { index?: number }) {
  const [day, setDay] = useState<Day>("Today");
  const [now, setNow] = useState(730); // 12:10
  const [scrub, setScrub] = useState<number | null>(null);
  const delay = enterDelay(index);

  useInterval(() => setNow((n) => (n >= 1380 ? 730 : n + 1)), 2000);

  const today = day === "Today";
  const at = scrub ?? (today ? now : HW[day] - 60);
  const h = tide(at, day);
  const go = h >= REQ;
  const rising = tide(at + 5, day) > h;
  const wins = windows(day);
  const main = wins.reduce((a, b) => (b.to - b.from > a.to - a.from ? b : a), wins[0]);
  const d = curve(day);
  const area = `${d} L${W} ${H} L0 ${H}Z`;
  const toOpen = main.from - now;
  const toClose = main.to - now;

  let status: { text: string; cls: string };
  if (!today) status = { text: `${Math.round((main.to - main.from) / 6) / 10} h window`, cls: "text-secondary" };
  else if (toOpen > 0) status = { text: `Opens in ${Math.floor(toOpen / 60)} h ${toOpen % 60} min`, cls: "text-secondary" };
  else if (toClose > 0) status = { text: `Open · ${Math.floor(toClose / 60)} h ${toClose % 60} min left`, cls: "text-ios-green" };
  else status = { text: "Closed for today", cls: "text-ios-orange" };

  return (
    <Widget size="medium" index={index} label="Tidal window">
      <WidgetHeader
        icon={<Water20Filled />}
        tint="var(--ios-blue)"
        title="Tidal Window"
        subtitle={`MSC Aurora · T ${DRAFT} m · needs ${REQ.toFixed(1)} m`}
        extra={<Segmented size="small" value={day} onChange={(v) => setDay(v as Day)} options={DAYS} />}
      />

      <div className="mt-2 flex h-[122px] gap-3">
        <div className="flex w-[108px] shrink-0 flex-col whitespace-nowrap">
          <div className="text-[11px] text-tertiary tabular">{scrub !== null || !today ? `Tide at ${hhmm(at)}` : "Tide now"}</div>
          <div className="text-[28px] leading-none font-semibold tracking-tight text-heading">
            <AnimatedNumber value={h} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />
            <span className="text-[12px] font-medium text-tertiary"> m</span>
          </div>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={`${go}-${rising}`}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              className="mt-1 text-[11px] font-medium"
            >
              <span className={go ? "text-ios-green" : "text-ios-orange"}>{go ? "Go" : "No go"}</span>
              <span className="text-tertiary"> · {rising ? "rising" : "falling"}</span>
            </motion.div>
          </AnimatePresence>
          <div className="mt-auto leading-tight">
            <div className="text-[11px] text-tertiary">Window</div>
            <div className="text-[13px] font-semibold text-heading tabular">
              {hhmm(main.from)}–{hhmm(main.to)}
            </div>
            <div className={cn("text-[11px] tabular", status.cls)}>{status.text}</div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div
            className="relative h-[106px] cursor-crosshair"
            onPointerMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
              setScrub(Math.round(T0 + f * (T1 - T0)));
            }}
            onPointerLeave={() => setScrub(null)}
          >
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
              <defs>
                <linearGradient id={`tide-fill-${index ?? 0}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--ios-blue)" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="var(--ios-blue)" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {wins.map((w, i) => (
                <motion.rect
                  key={`${day}-${i}`}
                  x={X(w.from)}
                  width={X(w.to) - X(w.from)}
                  y="0"
                  height={H}
                  rx="3"
                  fill="var(--ios-green)"
                  fillOpacity="0.12"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  style={{ transformBox: "fill-box", transformOrigin: "bottom" }}
                  transition={{ type: "spring", stiffness: 200, damping: 24, delay: delay + 0.4 }}
                />
              ))}
              {[3, 6, 9, 12, 15, 18].map((k) => (
                <line key={k} x1={X(T0 + k * 60)} x2={X(T0 + k * 60)} y1="0" y2={H} strokeWidth="1" vectorEffect="non-scaling-stroke" className="stroke-split" />
              ))}
              <motion.path
                d={area}
                fill={`url(#tide-fill-${index ?? 0})`}
                initial={{ d: area, opacity: 0 }}
                animate={{ d: area, opacity: 1 }}
                transition={{ opacity: { delay: delay + 0.2, duration: 0.8 }, d: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
              />
              <motion.path
                d={d}
                fill="none"
                stroke="var(--ios-blue)"
                strokeWidth="2"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                initial={{ d, opacity: 0 }}
                animate={{ d, opacity: 1 }}
                transition={{ opacity: { delay, duration: 1 }, d: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
              />
              <line x1="0" x2={W} y1={Y(REQ)} y2={Y(REQ)} strokeDasharray="4 3" strokeWidth="1" vectorEffect="non-scaling-stroke" className="stroke-secondary" />
              {today ? (
                <line x1={X(now)} x2={X(now)} y1="0" y2={H} strokeWidth="1.5" vectorEffect="non-scaling-stroke" stroke="var(--ios-red)" />
              ) : null}
              {scrub !== null ? (
                <line x1={X(scrub)} x2={X(scrub)} y1="0" y2={H} strokeDasharray="2 2" strokeWidth="1" vectorEffect="non-scaling-stroke" className="stroke-tertiary" />
              ) : null}
            </svg>
            <span className="pointer-events-none absolute right-0 text-[9px] leading-none font-medium text-secondary" style={{ top: `calc(${(Y(REQ) / H) * 100}% - 11px)` }}>
              Req {REQ.toFixed(1)} m
            </span>
            <span
              className="pointer-events-none absolute -translate-x-1/2 text-[9px] leading-none text-tertiary tabular"
              style={{ left: `${(X(HW[day]) / W) * 100}%`, top: `calc(${(Y(MEAN + AMP) / H) * 100}% - 11px)` }}
            >
              HW {(MEAN + AMP).toFixed(1)}
            </span>
            <motion.span
              className={cn(
                "pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--widget-surface)]",
                go ? "bg-ios-green" : "bg-ios-blue",
              )}
              initial={{ opacity: 0 }}
              animate={{ left: `${(X(at) / W) * 100}%`, top: `${(Y(h) / H) * 100}%`, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 32, opacity: { delay: delay + 0.8 } }}
            />
          </div>
          <div className="relative mt-1 h-3 text-[10px] text-tertiary tabular">
            {TICKS.map((t) => (
              <span
                key={t}
                className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full"
                style={{ left: `${(X(t * 60) / W) * 100}%` }}
              >
                {String(t % 24).padStart(2, "0")}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Widget>
  );
}
