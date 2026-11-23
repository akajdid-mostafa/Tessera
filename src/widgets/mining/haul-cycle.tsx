import { VehicleTruckProfile20Filled } from "@fluentui/react-icons";
import { motion, useAnimationFrame, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { enterDelay } from "./_parts";

type Phase = "queue" | "load" | "haul" | "dump" | "return";
type Seg = { id: Phase; label: string; min: number; plan: number };

const SEGS: Seg[] = [
  { id: "queue", label: "Queue at shovel", min: 1.8, plan: 0.8 },
  { id: "load", label: "Spot and load", min: 2.6, plan: 2.5 },
  { id: "haul", label: "Haul loaded", min: 9.4, plan: 9.0 },
  { id: "dump", label: "Dump at crusher", min: 1.1, plan: 1.0 },
  { id: "return", label: "Return empty", min: 6.2, plan: 6.2 },
];
const CYCLE = SEGS.reduce((s, x) => s + x.min, 0);
const PLAN = SEGS.reduce((s, x) => s + x.plan, 0);
const BOUNDS = SEGS.reduce<number[]>((acc, s) => [...acc, (acc[acc.length - 1] ?? 0) + s.min / CYCLE], []);
const CYCLE_S = 26; // real seconds per haul cycle
const TRUCKS = ["HT-211", "HT-212", "HT-214", "HT-215", "HT-219", "HT-220", "HT-223"];
const PAYLOAD = 227; // t, nominal payload of a 240 t-class truck

/** Pit section, side view: one straight ramp from the shovel on the pit floor up to the crusher pocket. */
const ROAD: [number, number][] = [
  [64, 66],
  [112, 66],
  [318, 22],
];
const RET: [number, number][] = ROAD.map(([x, y]) => [x, y + 4] as [number, number]).reverse();
const QUEUE_AT = 0.9; // where a waiting truck stands on the return lane

const lens = (pts: [number, number][]) => pts.slice(1).map(([x, y], i) => Math.hypot(x - pts[i][0], y - pts[i][1]));
const ROAD_L = lens(ROAD);
const RET_L = lens(RET);
const toD = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");

function along(pts: [number, number][], ls: number[], s: number) {
  let d = Math.min(1, Math.max(0, s)) * ls.reduce((a, b) => a + b, 0);
  for (let i = 0; i < ls.length; i++) {
    if (d <= ls[i] || i === ls.length - 1) {
      const k = Math.min(1, d / ls[i]);
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k, dx: x1 - x0, dy: y1 - y0 };
    }
    d -= ls[i];
  }
  return { x: pts[0][0], y: pts[0][1], dx: 1, dy: 0 };
}

/** Pose of a truck `ph` (0–1) through its cycle: where it is, and how much ore it carries. */
function pose(ph: number) {
  const [q, l, h, d] = BOUNDS;
  if (ph < q) return { ...along(RET, RET_L, QUEUE_AT), ore: 0 };
  if (ph < l) return { ...along(ROAD, ROAD_L, 0), ore: (ph - q) / (l - q) };
  if (ph < h) return { ...along(ROAD, ROAD_L, (ph - l) / (h - l)), ore: 1 };
  if (ph < d) return { ...along(ROAD, ROAD_L, 1), ore: 1 - (ph - h) / (d - h) };
  return { ...along(RET, RET_L, ((ph - d) / (1 - d)) * QUEUE_AT), ore: 0 };
}

const transformOf = (p: { x: number; y: number; dx: number; dy: number }) => {
  const dir = p.dx < 0 ? -1 : 1;
  const ang = (Math.atan2(p.dy, Math.abs(p.dx)) * 180) / Math.PI;
  return `translate(${p.x.toFixed(1)} ${(p.y - 5).toFixed(1)}) scale(${dir * 1.4} 1.4) rotate(${ang.toFixed(1)})`;
};

/** Mining · medium. A pit section with seven haul trucks cycling between the shovel and the crusher, one broken down on the ramp; tonnes roll up as each truck tips, and hovering a phase of the cycle bar lights that stretch of road. */
export function HaulCycleWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [hauled, setHauled] = useState(31_420);
  const [hover, setHover] = useState<Phase | null>(null);
  const refs = useRef<(SVGGElement | null)[]>([]);
  const ores = useRef<(SVGPathElement | null)[]>([]);
  const last = useRef<number[]>([]);
  const delay = enterDelay(index);

  useAnimationFrame((time) => {
    const u = reduce ? 0.37 : time / 1000 / CYCLE_S;
    let tipped = 0;
    TRUCKS.forEach((_, i) => {
      const ph = (u + i / TRUCKS.length) % 1;
      const p = pose(ph);
      refs.current[i]?.setAttribute("transform", transformOf(p));
      ores.current[i]?.setAttribute("opacity", p.ore.toFixed(2));
      const prev = last.current[i];
      if (prev !== undefined && prev < BOUNDS[3] && ph >= BOUNDS[3]) tipped++;
      last.current[i] = ph;
    });
    if (tipped) setHauled((h) => h + tipped * PAYLOAD);
  });

  const seg = SEGS.find((s) => s.id === hover);
  const rate = Math.round((TRUCKS.length * PAYLOAD * 60) / CYCLE);

  // The stretch of the drawing each phase lives on.
  const glow: Record<Phase, string> = {
    queue: toD(RET.slice(-2)),
    load: "M50 66H74",
    haul: toD(ROAD),
    dump: "M306 26L324 20",
    return: toD(RET),
  };

  return (
    <Widget size="medium" index={index} label="Haul cycle">
      <WidgetHeader
        icon={<VehicleTruckProfile20Filled />}
        tint="var(--ios-orange)"
        title="Haul Cycle · SH-04"
        subtitle={`7 of 8 trucks · 240 t · ${rate.toLocaleString("en-US")} t/h to crusher`}
        extra={
          <Tooltip title="HT-217 · right rear tyre 92 °C · parked on ramp shoulder since 09:42">
            <span className="flex cursor-default items-center gap-1 rounded-full bg-ios-orange/15 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-ios-orange">
              HT-217 down
            </span>
          </Tooltip>
        }
      />

      <svg viewBox="0 0 376 78" className="mt-1.5 h-[78px] w-full overflow-visible" aria-hidden>
        {/* Ground in section: pit wall benches on the left, ramp and surface to the right. */}
        <path
          d="M0 14H6L9 30H14L17 48H20L22 70H112L318 26H376V78H0Z"
          className="fill-fill-quaternary"
        />
        <path d="M0 14H6L9 30H14L17 48H20L22 70" fill="none" strokeWidth="1" className="stroke-fill-secondary" />
        <path d={toD(ROAD)} fill="none" strokeWidth="9" strokeLinejoin="round" className="stroke-fill-secondary" />
        {seg ? (
          <motion.path
            key={seg.id}
            d={glow[seg.id]}
            fill="none"
            strokeWidth="9"
            strokeLinejoin="round"
            strokeLinecap="round"
            className={seg.id === "queue" ? "stroke-[var(--ios-orange)]" : "stroke-[var(--ant-color-text-tertiary)]"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
          />
        ) : null}

        {/* Shovel: tracks, house, boom, dipper bobbing over the truck. */}
        <rect x="24" y="64" width="24" height="6" rx="3" className="fill-[var(--ant-color-text-tertiary)]" />
        <rect x="27" y="54" width="18" height="10" rx="1.5" className="fill-[var(--ant-color-text-quaternary)]" />
        <line x1="42" y1="55" x2="60" y2="40" strokeWidth="2.4" strokeLinecap="round" className="stroke-[var(--ant-color-text-tertiary)]" />
        <motion.g animate={reduce ? undefined : { y: [0, -2.5, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}>
          <line x1="60" y1="40" x2="66" y2="54" strokeWidth="1.8" className="stroke-[var(--ant-color-text-tertiary)]" />
          <path d="M62 53h8l-1 6h-6Z" className="fill-[var(--ant-color-text-tertiary)]" />
        </motion.g>
        <text x="24" y="40" fontSize="9" className="fill-tertiary">
          SH-04
        </text>

        {/* Primary crusher at the top of the ramp. */}
        <path d="M318 22h16l-3 6h-10Z" className="fill-[var(--ant-color-text-quaternary)]" />
        <rect x="334" y="4" width="26" height="22" rx="2" className="fill-[var(--ant-color-text-quaternary)]" />
        <line x1="360" y1="20" x2="376" y2="14" strokeWidth="2" className="stroke-[var(--ant-color-text-quaternary)]" />
        <text x="347" y="17" textAnchor="middle" fontSize="9" fontWeight="600" className="fill-secondary">
          PC1
        </text>

        {/* HT-217, down on the shoulder. */}
        <g transform="translate(172 59) scale(1.4)">
          <Truck />
          <path d="M6 -14 10 -7H2Z" className="fill-[var(--ios-orange)]" />
        </g>

        {TRUCKS.map((id, i) => (
          <motion.g key={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + i * 0.06 }}>
            <g ref={(el) => void (refs.current[i] = el)} transform={transformOf(pose(i / TRUCKS.length))}>
              <Truck oreRef={(el) => void (ores.current[i] = el)} />
            </g>
          </motion.g>
        ))}
      </svg>

      <div className="mt-auto">
        <div className="flex h-4 items-center gap-2 text-[11px] whitespace-nowrap">
          <span className={cn("min-w-0 truncate tabular", seg?.id === "queue" ? "font-medium text-ios-orange" : "text-tertiary")}>
            {seg ? (
              <>
                {seg.label} · <span className="font-semibold">{seg.min.toFixed(1)} min</span> · plan {seg.plan.toFixed(1)}
              </>
            ) : (
              <>
                Cycle <span className="font-semibold text-secondary">{CYCLE.toFixed(1)} min</span> · plan {PLAN.toFixed(1)}
              </>
            )}
          </span>
          <span className="ml-auto text-tertiary">
            Shift <AnimatedNumber value={hauled} className="font-semibold text-heading" /> t
          </span>
        </div>
        <div className="mt-1 flex h-4 gap-[2px]" onPointerLeave={() => setHover(null)}>
          {SEGS.map((s, i) => {
            const over = s.min > s.plan * 1.5;
            return (
              <motion.button
                key={s.id}
                type="button"
                aria-label={`${s.label} ${s.min} minutes`}
                onPointerEnter={() => setHover(s.id)}
                onFocus={() => setHover(s.id)}
                onBlur={() => setHover(null)}
                className={cn(
                  "grid h-full origin-left cursor-pointer place-items-center rounded-[4px] text-[10px] font-semibold tabular transition-colors",
                  over ? "bg-ios-orange/15 text-ios-orange" : hover === s.id ? "bg-[var(--ant-color-text-tertiary)] text-heading" : "bg-fill-secondary text-secondary",
                )}
                style={{ flexGrow: s.min, flexBasis: 0 }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 26, delay: delay + 0.2 + i * 0.06 }}
              >
                {s.min.toFixed(1)}
              </motion.button>
            );
          })}
        </div>
      </div>
    </Widget>
  );
}

/** A rigid-frame haul truck in side view, nose to +x, wheels on y = 4. */
function Truck({ oreRef }: { oreRef?: (el: SVGPathElement | null) => void }) {
  return (
    <g>
      {oreRef ? <path ref={oreRef} d="M-6.5-2.6Q-3-6.4 1.5-2.6Z" className="fill-[var(--ant-color-text-secondary)]" opacity="0" /> : null}
      <path d="M-7-2.6H2.4L1.4 1.6H-6.2Z" className="fill-[var(--ant-color-text-tertiary)]" />
      <rect x="2.6" y="-2" width="4" height="3.6" rx="0.8" className="fill-[var(--ant-color-text-tertiary)]" />
      <circle cx="-4.2" cy="2.6" r="1.6" className="fill-heading" />
      <circle cx="4.2" cy="2.6" r="1.6" className="fill-heading" />
    </g>
  );
}
