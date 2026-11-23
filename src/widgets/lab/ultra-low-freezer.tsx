import { WeatherSnowflake20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { LiveDot, mmss } from "./_parts";

type Shelf = { racks: number; of: number; what: string };

const SHELVES: Shelf[] = [
  { racks: 4, of: 4, what: "Plasma · ONC-221" },
  { racks: 4, of: 4, what: "PBMC · ONC-221" },
  { racks: 3, of: 4, what: "Cell banks · MCB-07" },
  { racks: 2, of: 4, what: "Reagents · CRISPR kits" },
  { racks: 1, of: 4, what: "Spare · QC retains" },
];

const SP = -80;
const HI = -70;
const WARN = -75;
/** Ticks per cycle; the door is open from OPEN to CLOSE. */
const CYCLE = 38;
const OPEN = 10;
const CLOSE = 22;

type Sim = { n: number; t: number; open: boolean; openFor: number };

function step(s: Sim): Sim {
  const n = s.n + 1;
  const phase = n % CYCLE;
  const open = phase >= OPEN && phase < CLOSE;
  const jitter = (Math.random() - 0.5) * 0.18;
  const t = open ? s.t + 0.62 + Math.random() * 0.2 : s.t + (SP - s.t) * 0.14 + jitter;
  return { n, t: Math.round(Math.min(HI - 0.5, t) * 10) / 10, open, openFor: open ? s.openFor + 1 : 0 };
}

/** Lab · small. A −80 °C ultra-low freezer drawn shelf by shelf: the door swings open on its own, cold fog spills, the cabinet warms toward the −75 °C pre-alarm and recovers, and hovering a shelf reads its racks. */
export function UltraLowFreezerWidget({ index }: { index?: number }) {
  const [sim, setSim] = useState<Sim>({ n: 0, t: -79.6, open: false, openFor: 0 });
  const [hover, setHover] = useState<number | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const id = window.setInterval(() => setSim(step), 1000);
    return () => window.clearInterval(id);
  }, []);

  const warm = sim.t > WARN;
  const recovering = !sim.open && sim.t > SP + 1.5;
  const shelf = hover === null ? null : SHELVES[hover];
  // 0 at setpoint, 1 at the high alarm: tints the compartments.
  const heat = Math.min(1, Math.max(0, (sim.t - SP) / (HI - SP)));

  return (
    <Widget size="small" index={index} label="Ultra-low freezer">
      <WidgetHeader icon={<WeatherSnowflake20Filled />} tint="var(--ios-blue)" title="ULT Freezer B-14" subtitle="Biobank · Room 2.11" />

      <div className="mt-2 flex min-h-0 flex-1 gap-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <Swap k={shelf ? `s${hover}` : "cab"} className="h-[14px] text-[11px] font-medium text-tertiary">
            {shelf ? `Shelf ${hover! + 1} · ${shelf.racks}/${shelf.of}` : "Cabinet"}
          </Swap>
          <div
            className={cn(
              "mt-1 flex items-baseline whitespace-nowrap leading-none transition-colors duration-500",
              warm ? "text-ios-orange" : "text-heading",
            )}
          >
            <AnimatedNumber
              value={sim.t}
              format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
              className="text-[24px] font-semibold tracking-tight"
            />
            <span className="ml-0.5 text-[11px] font-medium text-tertiary">°C</span>
          </div>
          <Swap k={shelf ? `w${hover}` : "sp"} className="mt-1 h-[13px] text-[10px] text-tertiary tabular">
            {shelf ? shelf.what : `SP ${SP} · Pre ${WARN}`}
          </Swap>

          <div className="mt-auto">
            <span
              className={cn(
                "inline-flex h-5 items-center gap-1 whitespace-nowrap rounded-full px-2 text-[10px] font-semibold transition-colors duration-500 tabular",
                sim.open ? "bg-ios-orange/15 text-ios-orange" : recovering ? "bg-ios-blue/15 text-ios-blue" : "bg-fill-tertiary text-secondary",
              )}
            >
              {sim.open ? (
                <>
                  <LiveDot color="var(--ios-orange)" ping />
                  Open {mmss(sim.openFor)}
                </>
              ) : recovering ? (
                "Recovering"
              ) : (
                <>
                  <LiveDot color="var(--ios-green)" />
                  Stable
                </>
              )}
            </span>
          </div>
        </div>

        <svg
          viewBox="-18 0 74 124"
          className="h-full w-[70px] shrink-0"
          preserveAspectRatio="xMaxYMid meet"
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label="Freezer shelves"
        >
          {/* Cabinet. */}
          <rect x="2" y="2" width="52" height="114" rx="6" style={{ fill: "var(--ant-color-fill-tertiary)", stroke: "var(--ant-color-split)" }} strokeWidth="1.2" />
          <rect x="7" y="7" width="42" height="9" rx="2.5" style={{ fill: "var(--ant-color-fill-secondary)" }} />
          <circle cx="44" cy="11.5" r="1.8" style={{ fill: sim.open ? "var(--ios-orange)" : "var(--ios-green)", transition: "fill 0.4s" }} />
          <rect x="10" y="10" width="18" height="3" rx="1.5" style={{ fill: "var(--ant-color-text-tertiary)", opacity: 0.5 }} />
          <rect x="8" y="116" width="6" height="4" rx="1" style={{ fill: "var(--ant-color-fill-secondary)" }} />
          <rect x="42" y="116" width="6" height="4" rx="1" style={{ fill: "var(--ant-color-fill-secondary)" }} />

          {SHELVES.map((s, i) => {
            const y = 21 + i * 18.6;
            const on = hover === i;
            // Top shelves warm first when the door is open.
            const local = Math.min(1, heat * (1.25 - i * 0.12));
            return (
              <motion.g
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + i * 0.07, type: "spring", stiffness: 300, damping: 24 }}
                onMouseEnter={() => setHover(i)}
                style={{ cursor: "pointer" }}
              >
                <rect x="6.5" y={y} width="43" height="16" rx="3" style={{ fill: "var(--widget-surface)" }} />
                <rect
                  x="6.5"
                  y={y}
                  width="43"
                  height="16"
                  rx="3"
                  style={{
                    fill: local > 0.45 ? "var(--ios-orange)" : "var(--ios-blue)",
                    fillOpacity: local > 0.45 ? 0.12 + local * 0.2 : 0.16 - local * 0.1,
                    stroke: on ? "var(--ant-color-text)" : "transparent",
                    strokeWidth: 1.2,
                    transition: "fill 0.6s, fill-opacity 0.6s",
                  }}
                />
                {Array.from({ length: s.of }, (_, r) => (
                  <motion.rect
                    key={r}
                    x={9.5 + r * 9.6}
                    y={y + 3}
                    width="7.6"
                    height="10"
                    rx="1.2"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: delay + 0.2 + i * 0.07 + r * 0.04, type: "spring", stiffness: 380, damping: 22 }}
                    style={{
                      transformBox: "fill-box",
                      transformOrigin: "bottom",
                      fill: r < s.racks ? "var(--ant-color-text-tertiary)" : "none",
                      fillOpacity: r < s.racks ? 0.55 : 0,
                      stroke: r < s.racks ? "none" : "var(--ant-color-split)",
                      strokeDasharray: "2 1.5",
                    }}
                  />
                ))}
              </motion.g>
            );
          })}

          {/* Handle on the closed door; the door slab swings out on its hinge when open. */}
          <motion.rect
            x="50.5"
            y="44"
            width="2.6"
            height="28"
            rx="1.3"
            style={{ fill: "var(--ant-color-text-tertiary)" }}
            animate={{ opacity: sim.open ? 0 : 0.8 }}
          />
          <AnimatePresence>
            {sim.open ? (
              <motion.g key="door" initial={{ opacity: 0, scaleX: 0.2 }} animate={{ opacity: 1, scaleX: 1 }} exit={{ opacity: 0, scaleX: 0.2 }} transition={{ type: "spring", stiffness: 220, damping: 22 }} style={{ transformBox: "fill-box", transformOrigin: "100% 50%" }}>
                <polygon points="2,2 -15,9 -15,109 2,116" style={{ fill: "var(--ant-color-fill-secondary)", stroke: "var(--ant-color-split)" }} strokeWidth="1" strokeLinejoin="round" />
                <rect x="-12.5" y="46" width="2.4" height="24" rx="1.2" style={{ fill: "var(--ant-color-text-tertiary)" }} />
              </motion.g>
            ) : null}
          </AnimatePresence>
          {/* Cold fog spilling out of the open cabinet. */}
          {sim.open
            ? [0, 1, 2, 3].map((k) => (
                <motion.circle
                  key={`fog-${k}`}
                  cx={28}
                  cy={30 + k * 20}
                  r={5}
                  style={{ fill: "var(--ios-blue)" }}
                  initial={{ opacity: 0, x: 0, scale: 0.6 }}
                  animate={{ opacity: [0, 0.28, 0], x: [0, -12 - k * 2], y: [0, 8], scale: [0.6, 1.8] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: k * 0.5, ease: "easeOut" }}
                />
              ))
            : null}
        </svg>
      </div>
    </Widget>
  );
}

function Swap({ k, className, children }: { k: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={k}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="truncate"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
