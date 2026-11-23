import { TopSpeed20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type PointerEvent, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { AlarmMark, enterDelay, useInterval } from "./_parts";

/* A centrifugal gas compressor's performance map in normalised units: head against
 * inlet flow, speed lines bending down to the right, the surge limit line where they
 * end on the left and the surge control line 10% of flow inside it. Forward demand
 * swings with the export nomination; when it falls under the control line the
 * anti-surge valve opens to recycle gas, but it lags, so margin dips briefly. */
const SPEED = 0.96;
const RPM = 11_240;
const Q_DESIGN = 48; // k m³/h actual at q = 1
const H_DESIGN = 110; // kJ/kg polytropic at h = 1
const SCL = 0.1; // surge control margin
const head = (q: number, n: number) => n * n * (1.12 - 1.1 * (q / n - 0.55) ** 2);
const qSurge = (n: number) => 0.6 * n;

const W = 260;
const H = 124;
const Q0 = 0.35;
const Q1 = 1.25;
const H0 = 0.3;
const H1 = 1.3;
const X = (q: number) => 6 + ((q - Q0) / (Q1 - Q0)) * (W - 12);
const Y = (h: number) => 4 + ((H1 - h) / (H1 - H0)) * (H - 12);
const line = (pts: [number, number][]) => pts.map(([q, h], i) => `${i ? "L" : "M"}${X(q).toFixed(1)} ${Y(h).toFixed(1)}`).join(" ");

const speedLine = (n: number) =>
  line(Array.from({ length: 16 }, (_, k) => {
    const q = n * (0.6 + (0.55 * k) / 15);
    return [q, head(q, n)];
  }));
const NS = Array.from({ length: 12 }, (_, k) => 0.64 + k * 0.04);
const SLL = NS.map((n) => [qSurge(n), head(qSurge(n), n)] as [number, number]);
const SCLL = NS.map((n) => [qSurge(n) * (1 + SCL), head(qSurge(n) * (1 + SCL), n)] as [number, number]);
const SURGE_ZONE = `${line(SLL)} L${X(Q0)} ${Y(SLL[SLL.length - 1][1])} L${X(Q0)} ${Y(SLL[0][1])} Z`;
const MARGIN_ZONE = `${line(SLL)} ${line([...SCLL].reverse()).replace("M", "L")} Z`;
const LABELS = [0.7, 0.8, 0.9, 1.0];

const QS = qSurge(SPEED);
const Q_SCL = QS * (1 + SCL);
const TRAIL = 16;

/** Oil & gas · medium. A compressor map with speed lines, surge limit and control lines and a live operating point that trails across it as demand swings and the anti-surge valve answers; hover the map to read flow and head. */
export function CompressorMapWidget({ index }: { index?: number }) {
  const [t, setT] = useState(0);
  const [q, setQ] = useState(0.74);
  const [recycle, setRecycle] = useState(0);
  const [trail, setTrail] = useState<number[]>(() => Array.from({ length: TRAIL }, (_, k) => 0.74 - (TRAIL - k) * 0.002));
  const [hover, setHover] = useState<{ q: number; h: number } | null>(null);
  const [acked, setAcked] = useState(false);
  const delay = enterDelay(index);

  useInterval(() => {
    const nt = t + 0.8;
    const demand = 0.69 + 0.085 * Math.sin((nt / 30) * Math.PI * 2) + (Math.random() - 0.5) * 0.01;
    const needed = Math.max(0, Q_SCL + 0.008 - demand);
    const r = recycle + (needed - recycle) * 0.4;
    const nq = demand + r;
    setT(nt);
    setRecycle(r);
    setQ(nq);
    setTrail((tr) => [...tr.slice(1), nq]);
    // Each excursion is a fresh alarm: returning to normal re-arms the acknowledge.
    if (nq / QS - 1 >= SCL) setAcked(false);
  }, 800);

  const margin = q / QS - 1;
  const near = margin < SCL;
  const asv = Math.min(100, Math.round((recycle / 0.25) * 100));
  const ratio = 1 + 0.48 * head(q, SPEED);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - b.left) / b.width) * W;
    const py = ((e.clientY - b.top) / b.height) * H;
    const hq = Q0 + ((px - 6) / (W - 12)) * (Q1 - Q0);
    const hh = H1 - ((py - 4) / (H - 12)) * (H1 - H0);
    setHover({ q: Math.min(Q1, Math.max(Q0, hq)), h: Math.min(H1, Math.max(H0, hh)) });
  };

  return (
    <Widget size="medium" index={index} label="Compressor performance map">
      <WidgetHeader
        icon={<TopSpeed20Filled />}
        tint={near ? "var(--ios-orange)" : "var(--ios-indigo)"}
        title="K-301 · Compressor map"
        subtitle={`Gas export · ${RPM.toLocaleString("en-US")} rpm · 96%`}
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.button
              type="button"
              onClick={() => near && setAcked(true)}
              aria-label={near ? (acked ? "Near surge, acknowledged" : "Near surge, acknowledge") : "Anti-surge in control"}
              key={near ? "near" : "ok"}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className={cn(
                "flex items-center gap-1 rounded-full py-0.5 pr-2 text-[11px] font-semibold whitespace-nowrap",
                near ? "cursor-pointer bg-ios-orange/15 pl-1 text-ios-orange" : "cursor-default bg-fill-tertiary pl-2 text-secondary",
              )}
            >
              {near ? <AlarmMark priority={2} flashing={!acked} size={14} /> : null}
              {near ? "Near surge" : "In control"}
            </motion.button>
          </AnimatePresence>
        }
      />

      <div className="mt-2 flex min-h-0 flex-1 gap-3">
        <div className="flex w-[96px] shrink-0 flex-col whitespace-nowrap">
          <div className="text-[11px] leading-[13px] text-tertiary">Surge margin</div>
          <AnimatedNumber
            value={margin}
            format={{ style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            className={cn("shrink-0 text-[28px] leading-none font-semibold tracking-tight", near ? "text-ios-orange" : "text-heading")}
          />
          <div className="text-[11px] leading-[14px] text-tertiary tabular">
            Ratio <span className="font-semibold text-secondary">{ratio.toFixed(2)}</span>
          </div>

          {/* Anti-surge valve: the bowtie fills as it opens. */}
          <div className="mt-1 flex items-center gap-1.5">
            <svg viewBox="0 0 24 16" className="h-4 w-6 shrink-0" aria-hidden>
              <path d="M2 2 12 8 2 14Z M22 2 12 8 22 14Z" className="stroke-secondary" strokeWidth="1.3" strokeLinejoin="round" fill="none" />
              <motion.path
                d="M2 2 12 8 2 14Z M22 2 12 8 22 14Z"
                className="fill-secondary"
                animate={{ opacity: asv > 1 ? 0.25 + (asv / 100) * 0.75 : 0 }}
                transition={{ duration: 0.5 }}
              />
            </svg>
            <span className="text-[11px] text-tertiary tabular">
              ASV <AnimatedNumber value={asv} suffix="%" className="font-semibold text-secondary" />
            </span>
          </div>

          <div className="mt-auto text-[10px] leading-tight text-tertiary tabular">
            {hover ? (
              <>
                <div>Q {(hover.q * Q_DESIGN).toFixed(1)}k m³/h</div>
                <div>H {Math.round(hover.h * H_DESIGN)} kJ/kg</div>
              </>
            ) : (
              <>
                <div>Q {(q * Q_DESIGN).toFixed(1)}k m³/h</div>
                <div>H {Math.round(head(q, SPEED) * H_DESIGN)} kJ/kg</div>
              </>
            )}
          </div>
        </div>

        <div
          className="relative min-w-0 flex-1 cursor-crosshair"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full overflow-visible" aria-hidden>
            <path d={SURGE_ZONE} fill="color-mix(in srgb, var(--ios-red) 10%, transparent)" />
            <path d={MARGIN_ZONE} fill={`color-mix(in srgb, var(--ios-orange) ${near ? 22 : 10}%, transparent)`} style={{ transition: "fill 0.5s" }} />
            {LABELS.map((n) => (
              <g key={n}>
                <path d={speedLine(n)} fill="none" strokeWidth="1" className="stroke-fill" />
                <text x={X(1.15 * n) + 3} y={Y(head(1.15 * n, n)) + 3} fontSize="9" className="fill-tertiary">
                  {Math.round(n * 100)}%
                </text>
              </g>
            ))}
            <motion.path
              d={speedLine(SPEED)}
              fill="none"
              strokeWidth="1.5"
              className="stroke-tertiary"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
            />
            <path d={line(SLL)} fill="none" strokeWidth="1.5" stroke="var(--ios-red)" />
            <path d={line(SCLL)} fill="none" strokeWidth="1.2" strokeDasharray="3 2" stroke="var(--ios-orange)" />
            <text x={X(0.37)} y="12" fontSize="9" className="fill-tertiary">
              Surge
            </text>
            <text x={X(SCLL[SCLL.length - 1][0]) + 4} y="12" fontSize="9" className="fill-tertiary">
              Control
            </text>
            <text x={W - 4} y="12" fontSize="9" textAnchor="end" className="fill-tertiary">
              Head ↑
            </text>
            <text x={W - 4} y={H - 2} fontSize="9" textAnchor="end" className="fill-tertiary">
              Flow →
            </text>

            {trail.map((tq, k) => (
              <circle
                key={k}
                cx={X(tq)}
                cy={Y(head(tq, SPEED))}
                r={1.2 + (k / TRAIL) * 1.4}
                className="fill-heading"
                opacity={0.08 + (k / TRAIL) * 0.4}
              />
            ))}
            <motion.circle
              r="5"
              strokeWidth="2.5"
              stroke="var(--widget-surface)"
              fill={near ? "var(--ios-orange)" : "var(--ant-color-text-heading)"}
              initial={{ cx: X(q), cy: Y(head(q, SPEED)), opacity: 0 }}
              animate={{ cx: X(q), cy: Y(head(q, SPEED)), opacity: 1 }}
              transition={{ type: "spring", stiffness: 140, damping: 20, opacity: { delay: delay + 0.6 } }}
            />

            {hover ? (
              <g pointerEvents="none">
                <line x1={X(hover.q)} x2={X(hover.q)} y1="0" y2={H} strokeDasharray="2 3" strokeWidth="1" className="stroke-tertiary" />
                <line x1="0" x2={W} y1={Y(hover.h)} y2={Y(hover.h)} strokeDasharray="2 3" strokeWidth="1" className="stroke-tertiary" />
              </g>
            ) : null}
          </svg>
        </div>
      </div>
    </Widget>
  );
}
