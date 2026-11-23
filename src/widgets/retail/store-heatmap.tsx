import { Map20Filled, Warning12Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Mode = "Traffic" | "Dwell";
type Zone = { id: string; name: string; x: number; y: number; w: number; h: number; visitors: number; dwell: number; staff: number };

/* Ground floor plan in a 376 × 248 frame; the doors are the gap in the front wall. */
const VW = 376;
const VH = 248;
const ZONES: Zone[] = [
  { id: "fit", name: "Fitting rooms", x: 8, y: 8, w: 100, h: 52, visitors: 412, dwell: 11.8, staff: 1 },
  { id: "shoe", name: "Footwear", x: 114, y: 8, w: 120, h: 52, visitors: 530, dwell: 8.4, staff: 0 },
  { id: "women", name: "Womenswear", x: 8, y: 66, w: 128, h: 118, visitors: 1120, dwell: 6.2, staff: 2 },
  { id: "beauty", name: "Beauty", x: 142, y: 66, w: 92, h: 70, visitors: 980, dwell: 4.1, staff: 1 },
  { id: "acc", name: "Accessories", x: 142, y: 142, w: 92, h: 42, visitors: 760, dwell: 2.3, staff: 0 },
  { id: "men", name: "Menswear", x: 240, y: 66, w: 128, h: 118, visitors: 610, dwell: 4.8, staff: 1 },
  { id: "cc", name: "Click & Collect", x: 8, y: 190, w: 96, h: 50, visitors: 96, dwell: 3.2, staff: 1 },
  { id: "promo", name: "Entrance", x: 110, y: 190, w: 124, h: 50, visitors: 1846, dwell: 0.6, staff: 0 },
  { id: "till", name: "Checkout", x: 240, y: 190, w: 128, h: 50, visitors: 432, dwell: 3.9, staff: 4 },
];
const STOCKROOM = { x: 240, y: 8, w: 128, h: 52 };
const MAX = { Traffic: 1846, Dwell: 11.8 };
const heat = (z: Zone, m: Mode) => (m === "Traffic" ? z.visitors / MAX.Traffic : z.dwell / MAX.Dwell);
/** Shoppers concentrate at points, not evenly over a zone: doors, the promo table, till lanes,
 * fitting-room queue. Each spot borrows its zone's heat; `k` is how packed that spot is. */
const SPOTS = [
  { zone: "promo", x: 180, y: 236, r: 38, k: 1 }, // doors
  { zone: "promo", x: 138, y: 210, r: 24, k: 0.85 }, // promo table
  { zone: "till", x: 272, y: 214, r: 24, k: 1.2 }, // till lanes
  { zone: "till", x: 330, y: 214, r: 22, k: 1.05 },
  { zone: "women", x: 52, y: 108, r: 32, k: 0.95 },
  { zone: "women", x: 102, y: 152, r: 24, k: 0.8 },
  { zone: "beauty", x: 188, y: 100, r: 30, k: 1 },
  { zone: "acc", x: 188, y: 164, r: 22, k: 0.9 },
  { zone: "men", x: 292, y: 112, r: 32, k: 0.9 },
  { zone: "men", x: 342, y: 162, r: 20, k: 0.7 },
  { zone: "shoe", x: 160, y: 34, r: 28, k: 0.9 },
  { zone: "shoe", x: 212, y: 36, r: 20, k: 0.8 },
  { zone: "fit", x: 50, y: 34, r: 30, k: 1 },
  { zone: "cc", x: 56, y: 216, r: 20, k: 0.9 },
];
/** Blue → teal → green → yellow → orange → red, read off the blurred intensity. */
const RAMP = {
  r: "0.2 0.2 0.3 1 1 1",
  g: "0.45 0.8 0.85 0.85 0.55 0.2",
  b: "1 0.85 0.35 0.1 0.05 0.15",
  a: "0 0.42 0.58 0.7 0.8 0.88",
};
const RAMP_CSS = "linear-gradient(90deg, #3373FF, #33CCD9, #4DD959, #FFD91A, #FF8C0D, #FF3326)";

/** Associates on the floor, placed in the plan's frame. */
const STAFF = [
  { name: "Jade", who: "f2", x: 86, y: 42, zone: "Fitting rooms" },
  { name: "Nina", who: "f1", x: 44, y: 116, zone: "Womenswear" },
  { name: "Leo", who: "m3", x: 104, y: 156, zone: "Womenswear" },
  { name: "Aisha", who: "f7", x: 206, y: 104, zone: "Beauty" },
  { name: "Sam", who: "m6", x: 312, y: 134, zone: "Menswear" },
  { name: "Ollie", who: "m10", x: 76, y: 220, zone: "Click & Collect" },
];
/** Slow shopper paths, as keyframes in the plan's frame. */
const WALKERS = [
  { xs: [180, 190, 70, 60, 180], ys: [236, 160, 120, 40, 236], d: 22 },
  { xs: [170, 200, 300, 330, 270, 170], ys: [236, 110, 90, 150, 214, 236], d: 26 },
  { xs: [196, 160, 40, 176, 196], ys: [232, 34, 140, 170, 232], d: 24 },
  { xs: [150, 90, 50, 150], ys: [230, 100, 210, 230], d: 18 },
  { xs: [210, 260, 350, 300, 210], ys: [236, 100, 40, 214, 236], d: 28 },
  { xs: [186, 120, 200, 186], ys: [226, 150, 80, 226], d: 16 },
];
const pctX = (x: number) => `${(x / VW) * 100}%`;
const pctY = (y: number) => `${(y / VH) * 100}%`;

/** Retail · large. The ground floor as a traffic or dwell heatmap with associates and shoppers on it; hover a zone to read it, and a hot zone with no staff is flagged. */
export function StoreHeatmapWidget({ index }: { index?: number }) {
  const [mode, setMode] = useState<Mode>("Traffic");
  const [hover, setHover] = useState<Zone | null>(null);
  const [inStore, setInStore] = useState(186);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      setInStore((n) => Math.max(168, Math.min(204, n + Math.round(Math.random() * 6 - 2.6))));
    }, 2500);
    return () => window.clearInterval(t);
  }, []);

  const hottest = [...ZONES].filter((z) => z.id !== "promo").sort((a, b) => heat(b, mode) - heat(a, mode))[0];
  const shoe = ZONES.find((z) => z.id === "shoe")!;

  return (
    <Widget size="large" index={index} label="Store heatmap">
      <WidgetHeader
        icon={<Map20Filled />}
        tint="var(--ios-orange)"
        title="Store Heatmap"
        subtitle="Oxford St · Ground floor · today"
        extra={<Segmented size="small" value={mode} onChange={(v) => setMode(v as Mode)} options={["Traffic", "Dwell"]} />}
      />

      <div className="mt-2 flex h-[46px] items-end gap-3 whitespace-nowrap">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={hover ? hover.id : "store"}
            initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="leading-none"
          >
            <div className="mb-1 text-[11px] text-tertiary">{hover ? hover.name : "In store now"}</div>
            {hover ? (
              mode === "Traffic" ? (
                <span className="text-[26px] font-semibold tracking-tight text-heading">
                  <AnimatedNumber value={hover.visitors} />
                  <span className="ml-1 text-[12px] font-medium text-tertiary">visitors</span>
                </span>
              ) : (
                <span className="text-[26px] font-semibold tracking-tight text-heading">
                  <AnimatedNumber value={hover.dwell} format={{ maximumFractionDigits: 1, minimumFractionDigits: 1 }} />
                  <span className="ml-1 text-[12px] font-medium text-tertiary">min dwell</span>
                </span>
              )
            ) : (
              <span className="text-[26px] font-semibold tracking-tight text-heading">
                <AnimatedNumber value={inStore} />
                <span className="ml-1 text-[12px] font-medium text-tertiary">shoppers</span>
              </span>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="mb-0.5 ml-auto text-right text-[11px] leading-tight text-tertiary">
          {hover ? (
            <>
              <div>{mode === "Traffic" ? `${hover.dwell.toFixed(1)} min dwell` : `${hover.visitors.toLocaleString("en-GB")} visitors`}</div>
              <div className={cn("font-medium", hover.staff === 0 && hover.id !== "promo" ? "text-ios-orange" : "text-secondary")}>
                {hover.staff === 0 ? "No associate" : `${hover.staff} staff here`}
              </div>
            </>
          ) : (
            <>
              <div>Hottest {mode === "Traffic" ? "zone" : "dwell"}</div>
              <div className="font-medium text-secondary">{hottest.name}</div>
            </>
          )}
        </div>
      </div>

      <div className="relative mt-2 h-[248px] shrink-0" onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${VW} ${VH}`} className="absolute inset-0 size-full">
          <defs>
            <radialGradient id="rt-blob">
              <stop offset="0%" stopColor="#fff" stopOpacity={1} />
              <stop offset="45%" stopColor="#fff" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#fff" stopOpacity={0} />
            </radialGradient>
            {/* Intensity (alpha) is blurred, copied into RGB, then mapped through the color ramp. */}
            <filter id="rt-heat" filterUnits="userSpaceOnUse" x="0" y="0" width={VW} height={VH} colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 1 0"
                result="gray"
              />
              <feComponentTransfer in="gray">
                <feFuncR type="table" tableValues={RAMP.r} />
                <feFuncG type="table" tableValues={RAMP.g} />
                <feFuncB type="table" tableValues={RAMP.b} />
                <feFuncA type="table" tableValues={RAMP.a} />
              </feComponentTransfer>
            </filter>
            <clipPath id="rt-floor">
              <rect x="2" y="2" width={VW - 4} height={VH - 4} rx="10" />
            </clipPath>
            <pattern id="rt-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" strokeWidth="2" className="stroke-fill-secondary" />
            </pattern>
          </defs>

          <rect x="2" y="2" width={VW - 4} height={VH - 4} rx="10" className="fill-fill-quaternary" />

          <g clipPath="url(#rt-floor)" className="pointer-events-none">
            <g filter="url(#rt-heat)">
              {/* A faint floor of heat over the sales floor so quiet aisles read cool, not empty. */}
              {ZONES.map((z) => (
                <motion.rect
                  key={z.id}
                  x={z.x + 6}
                  y={z.y + 6}
                  width={z.w - 12}
                  height={z.h - 12}
                  fill="#fff"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.1 }}
                  transition={{ duration: 0.8, delay }}
                />
              ))}
              {SPOTS.map((s, i) => {
                const z = ZONES.find((zz) => zz.id === s.zone)!;
                // The doors breathe with the live head count.
                const live = s.zone === "promo" && mode === "Traffic" ? 0.9 + ((inStore - 168) / 36) * 0.2 : 1;
                const v = Math.min(1, s.k * Math.sqrt(heat(z, mode)) * live);
                return (
                  <motion.circle
                    key={i}
                    cx={s.x}
                    cy={s.y}
                    r={0}
                    fill="url(#rt-blob)"
                    initial={{ r: 0, opacity: 0 }}
                    animate={{ r: s.r * (0.75 + v * 0.45), opacity: v }}
                    transition={{ type: "spring", stiffness: 60, damping: 18, delay: delay + 0.1 + i * 0.04 }}
                  />
                );
              })}
            </g>
          </g>

          <rect x={STOCKROOM.x} y={STOCKROOM.y} width={STOCKROOM.w} height={STOCKROOM.h} rx="6" fill="url(#rt-hatch)" />
          <text x={STOCKROOM.x + 7} y={STOCKROOM.y + 15} fontSize="10" className="fill-[var(--ant-color-text-tertiary)]">
            Stockroom
          </text>

          {ZONES.map((z) => {
            const on = hover?.id === z.id;
            return (
              <g key={z.id}>
                <rect
                  x={z.x}
                  y={z.y}
                  width={z.w}
                  height={z.h}
                  rx="6"
                  fill="transparent"
                  strokeWidth={1}
                  className={cn("cursor-default transition-[stroke]", on ? "stroke-[var(--ant-color-text-tertiary)]" : "stroke-[var(--ant-color-border)]")}
                  onMouseEnter={() => setHover(z)}
                />
                <text
                  x={z.x + 7}
                  y={z.y + 15}
                  fontSize="10"
                  fontWeight={600}
                  strokeWidth={3}
                  strokeLinejoin="round"
                  paintOrder="stroke"
                  className="pointer-events-none fill-[var(--ant-color-text)] stroke-[var(--widget-surface)] [stroke-opacity:0.7]"
                >
                  {z.name}
                </text>
              </g>
            );
          })}

          {/* Front wall with the doors. */}
          <path d={`M 150 ${VH - 2} H 12 Q 2 ${VH - 2} 2 ${VH - 12} V 12 Q 2 2 12 2 H ${VW - 12} Q ${VW - 2} 2 ${VW - 2} 12 V ${VH - 12} Q ${VW - 2} ${VH - 2} ${VW - 12} ${VH - 2} H 210`} fill="none" strokeWidth="2.5" strokeLinecap="round" className="pointer-events-none stroke-[var(--ant-color-text-tertiary)]" />

          {WALKERS.map((w, i) => (
            <motion.circle
              key={i}
              r="2.6"
              cx={w.xs[0]}
              cy={w.ys[0]}
              className="pointer-events-none fill-[var(--ant-color-text)]"
              initial={{ opacity: 0, cx: w.xs[0], cy: w.ys[0] }}
              animate={{ cx: w.xs, cy: w.ys, opacity: 0.55 }}
              transition={{
                cx: { duration: w.d, repeat: Infinity, ease: "easeInOut", delay: delay + i * 0.8 },
                cy: { duration: w.d, repeat: Infinity, ease: "easeInOut", delay: delay + i * 0.8 },
                opacity: { duration: 0.6, delay: delay + 0.8 },
              }}
            />
          ))}
        </svg>

        {STAFF.map((s, i) => (
          <Tooltip key={s.name} title={`${s.name} · ${s.zone}`}>
            <motion.span
              className="absolute -mt-[10px] -ml-[10px] block rounded-full"
              style={{ left: pctX(s.x), top: pctY(s.y), boxShadow: "0 0 0 1.5px var(--widget-surface), 0 0 0 3px var(--ios-green)" }}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.2 }}
              transition={{ type: "spring", stiffness: 420, damping: 20, delay: delay + 0.6 + i * 0.06 }}
            >
              <MemojiAvatar who={s.who} size={20} />
            </motion.span>
          </Tooltip>
        ))}

        <Tooltip title={`Footwear · ${shoe.dwell} min dwell and no associate for 18 min`}>
          <motion.span
            className="absolute -mt-[11px] -ml-[11px] grid size-[22px] place-items-center rounded-full bg-ios-orange text-[12px] text-white"
            style={{ left: pctX(204), top: pctY(36) }}
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: delay + 1 }}
          >
            <Warning12Filled />
          </motion.span>
        </Tooltip>
      </div>

      <div className="mt-auto flex items-center gap-2 text-[11px] whitespace-nowrap text-tertiary">
        <span>Low</span>
        <span
          className="h-1.5 w-[72px] rounded-full"
          style={{ background: RAMP_CSS }}
        />
        <span>High</span>
        <span className="ml-auto flex items-center gap-1">
          <span className="size-2 rounded-full bg-ios-green" />
          <span className="font-medium text-secondary tabular">{STAFF.length}</span> on floor
        </span>
        <span>
          Conversion <span className="font-medium text-secondary tabular">23%</span>
        </span>
      </div>
    </Widget>
  );
}
