import { Ruler20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";

/** Pixels per metre in the drawing. The flat is 12 × 8 m. */
const S = 28;
const W = 12;
const H = 8;
const FT2 = 10.7639;
const PRICE = 640_000;

type Room = { id: string; name: string; x: number; y: number; w: number; h: number; note: string };
const ROOMS: Room[] = [
  { id: "living", name: "Living", x: 0, y: 0, w: 7, h: 4.5, note: "South light · 2 windows" },
  { id: "bed1", name: "Bedroom 1", x: 7, y: 0, w: 5, h: 4.5, note: "Built-in wardrobe" },
  { id: "kitchen", name: "Kitchen", x: 0, y: 4.5, w: 3.5, h: 3.5, note: "Gas hob · new in 2023" },
  { id: "hall", name: "Hall", x: 3.5, y: 4.5, w: 4.5, h: 1.5, note: "Coat closet" },
  { id: "bath", name: "Bath", x: 3.5, y: 6, w: 3, h: 2, note: "Walk-in shower" },
  { id: "entry", name: "Entry", x: 6.5, y: 6, w: 1.5, h: 2, note: "Front door · intercom" },
  { id: "bed2", name: "Bedroom 2", x: 8, y: 4.5, w: 4, h: 3.5, note: "Corner room · 2 windows" },
];
const GROSS = W * H;

/** Door openings along a wall, in metres; the leaf swings towards `into`. The front door draws no swing so it clears the Entry label. */
const DOORS: { a: [number, number]; b: [number, number]; into: [number, number]; swing?: false }[] = [
  { a: [6.75, 8], b: [7.65, 8], into: [0, -1], swing: false },
  { a: [4.5, 4.5], b: [5.35, 4.5], into: [0, -1] },
  { a: [7.1, 4.5], b: [7.9, 4.5], into: [0, -1] },
  { a: [3.7, 6], b: [4.45, 6], into: [0, 1] },
  { a: [3.5, 4.75], b: [3.5, 5.6], into: [-1, 0] },
  { a: [8, 4.65], b: [8, 5.5], into: [1, 0] },
];
/** Hall and Entry share an open archway. */
const ARCH: [number, number, number, number] = [6.6, 6, 7.9, 6];
const WINDOWS: [number, number, number, number][] = [
  [1, 0, 3, 0],
  [4, 0, 6, 0],
  [8.5, 0, 10.5, 0],
  [12, 5.5, 12, 7],
  [0, 5.5, 0, 7],
  [9, 8, 11, 8],
];

type Unit = "m²" | "ft²";
const area = (m2: number, unit: Unit) => (unit === "m²" ? m2 : m2 * FT2);
const fmt = (m2: number, unit: Unit) =>
  unit === "m²" ? `${(Math.round(m2 * 10) / 10).toString()} m²` : `${Math.round(m2 * FT2)} ft²`;

/** Real estate · large. A drawn 2+1 floor plan whose walls trace in; hover a room to read its size and note, and switch m² and ft². */
export function FloorPlanWidget({ index }: { index?: number }) {
  const [active, setActive] = useState<string | null>(null);
  const [unit, setUnit] = useState<Unit>("m²");
  const delay = 0.3 + (index ?? 0) * 0.06;
  const room = ROOMS.find((r) => r.id === active) ?? null;
  const m2 = room ? room.w * room.h : GROSS;
  const perUnit = PRICE / area(GROSS, unit);

  return (
    <Widget size="large" index={index} label="Floor plan">
      <WidgetHeader
        icon={<Ruler20Filled />}
        tint="var(--ios-purple)"
        title="Mission Loft · 2BR"
        subtitle="Floor plan · 3rd floor"
        extra={<Segmented size="small" value={unit} onChange={(v) => setUnit(v as Unit)} options={["m²", "ft²"]} />}
      />

      <div className="mt-2.5 flex items-end gap-3">
        <div className="min-w-0">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={room?.id ?? "all"}
              initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(3px)" }}
              transition={{ duration: 0.18 }}
              className="truncate text-[11px] font-medium text-ios-purple"
            >
              {room ? room.name : "Whole flat · gross"}
            </motion.div>
          </AnimatePresence>
          <AnimatedNumber
            value={area(m2, unit)}
            format={{ maximumFractionDigits: unit === "m²" ? 1 : 0 }}
            suffix={` ${unit}`}
            className="text-[30px] leading-none font-semibold tracking-tight text-heading"
          />
        </div>
        <div className="mb-0.5 ml-auto min-w-0 text-right text-[11px] leading-tight text-tertiary">
          {room ? (
            <>
              <div className="truncate font-medium text-secondary">{room.note}</div>
              <div className="tabular">
                {room.w} × {room.h} m · {Math.round((m2 / GROSS) * 100)}% of flat
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="font-semibold text-secondary">$640K</span> asking
              </div>
              <div>
                <AnimatedNumber
                  value={perUnit}
                  format={{ style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }}
                  className="font-semibold text-secondary"
                />{" "}
                per {unit}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-2 min-h-0 flex-1">
        <svg
          viewBox={`-6 -6 ${W * S + 12} ${H * S + 12}`}
          className="block size-full"
          onMouseLeave={() => setActive(null)}
          role="img"
          aria-label="Floor plan with seven rooms"
        >
          {ROOMS.map((r, i) => {
            const on = r.id === active;
            return (
              <motion.rect
                key={r.id}
                x={r.x * S}
                y={r.y * S}
                width={r.w * S}
                height={r.h * S}
                onMouseEnter={() => setActive(r.id)}
                onClick={() => setActive((a) => (a === r.id ? null : r.id))}
                className="cursor-pointer"
                fill={on ? "var(--ios-purple)" : "var(--ant-color-fill-quaternary)"}
                stroke="var(--ant-color-text-tertiary)"
                strokeWidth={1.5}
                initial={{ opacity: 0, fillOpacity: on ? 0.22 : active ? 0.4 : 1 }}
                animate={{ opacity: 1, fillOpacity: on ? 0.22 : active ? 0.4 : 1 }}
                transition={{ opacity: { delay: delay + 0.5 + i * 0.06, duration: 0.35 }, fillOpacity: { duration: 0.2 } }}
              />
            );
          })}

          <motion.rect
            x={0}
            y={0}
            width={W * S}
            height={H * S}
            fill="none"
            stroke="var(--ant-color-text-heading)"
            strokeWidth={4}
            strokeLinejoin="round"
            pointerEvents="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          />

          <motion.g
            pointerEvents="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.9, duration: 0.4 }}
          >
            {/* Openings are cut by painting the surface over the wall. */}
            <line
              x1={ARCH[0] * S}
              y1={ARCH[1] * S}
              x2={ARCH[2] * S}
              y2={ARCH[3] * S}
              stroke="var(--widget-surface)"
              strokeWidth={3}
            />
            {DOORS.map((d, i) => {
              const [x1, y1] = [d.a[0] * S, d.a[1] * S];
              const [x2, y2] = [d.b[0] * S, d.b[1] * S];
              const len = Math.hypot(x2 - x1, y2 - y1);
              const lx = x1 + d.into[0] * len;
              const ly = y1 + d.into[1] * len;
              const cross = (lx - x1) * (y2 - y1) - (ly - y1) * (x2 - x1);
              const sweep = cross > 0 ? 1 : 0;
              return (
                <g key={i}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--widget-surface)" strokeWidth={6} />
                  {d.swing === false ? null : (
                    <>
                  <line x1={x1} y1={y1} x2={lx} y2={ly} stroke="var(--ant-color-text-tertiary)" strokeWidth={1.25} />
                  <path
                    d={`M ${lx} ${ly} A ${len} ${len} 0 0 ${sweep} ${x2} ${y2}`}
                    fill="none"
                    stroke="var(--ant-color-text-tertiary)"
                    strokeWidth={0.9}
                    strokeDasharray="2 2"
                  />
                    </>
                  )}
                </g>
              );
            })}
            {WINDOWS.map(([ax, ay, bx, by], i) => {
              const vertical = ax === bx;
              return (
                <g key={i}>
                  <line x1={ax * S} y1={ay * S} x2={bx * S} y2={by * S} stroke="var(--widget-surface)" strokeWidth={5} />
                  <line
                    x1={ax * S + (vertical ? -1.5 : 0)}
                    y1={ay * S + (vertical ? 0 : -1.5)}
                    x2={bx * S + (vertical ? -1.5 : 0)}
                    y2={by * S + (vertical ? 0 : -1.5)}
                    stroke="var(--ios-blue)"
                    strokeWidth={1}
                  />
                  <line
                    x1={ax * S + (vertical ? 1.5 : 0)}
                    y1={ay * S + (vertical ? 0 : 1.5)}
                    x2={bx * S + (vertical ? 1.5 : 0)}
                    y2={by * S + (vertical ? 0 : 1.5)}
                    stroke="var(--ios-blue)"
                    strokeWidth={1}
                  />
                </g>
              );
            })}
          </motion.g>

          {ROOMS.map((r, i) => {
            const cx = (r.x + r.w / 2) * S;
            const cy = (r.y + r.h / 2) * S;
            const on = r.id === active;
            return (
              <motion.g
                key={r.id}
                pointerEvents="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: active && !on ? 0.55 : 1 }}
                transition={{ delay: active === null ? delay + 0.8 + i * 0.05 : 0, duration: 0.25 }}
              >
                <text
                  x={cx}
                  y={cy - 3}
                  textAnchor="middle"
                  className={cn(
                    "text-[11px] font-semibold",
                    on ? "fill-[var(--ant-color-text-heading)]" : "fill-[var(--ant-color-text-secondary)]",
                  )}
                >
                  {r.name}
                </text>
                <text x={cx} y={cy + 11} textAnchor="middle" className="fill-[var(--ant-color-text-tertiary)] text-[10px] tabular">
                  {fmt(r.w * r.h, unit)}
                </text>
              </motion.g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-2 border-t-[0.5px] border-split pt-2">
        {[
          ["Bedrooms", "2"],
          ["Baths", "1"],
          ["Floor", "3 of 6"],
          ["Facing", "South"],
        ].map(([label, value], i) => (
          <motion.div
            key={label}
            className="min-w-0 leading-tight"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 26, delay: delay + 0.2 + i * 0.05 }}
          >
            <div className="truncate text-[10px] text-tertiary">{label}</div>
            <div className="truncate text-[13px] font-semibold text-heading">{value}</div>
          </motion.div>
        ))}
      </div>
    </Widget>
  );
}
