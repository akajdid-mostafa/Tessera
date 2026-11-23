import { LocationRipple20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { LiveDot } from "./_parts";

const ZONES = ["North gate", "NE fence", "East fence", "East yard", "South dock", "SW lot", "West fence", "NW fence"];
const SEED = [1, 0, 3, 1, 4, 0, 2, 1];
const WEIGHT = [2, 1, 3, 1, 4, 1, 2, 1];
const R = 34;
const C = 42;
const SPAN = 360 / ZONES.length;
const GAP = 5;

/** An arc on the ring, angles in degrees clockwise from north. */
function arc(a0: number, a1: number) {
  const p = (a: number) => {
    const t = (a * Math.PI) / 180;
    return `${(C + R * Math.sin(t)).toFixed(2)} ${(C - R * Math.cos(t)).toFixed(2)}`;
  };
  return `M${p(a0)} A${R} ${R} 0 0 1 ${p(a1)}`;
}
const zoneArc = (i: number) => arc(i * SPAN - SPAN / 2 + GAP / 2, (i + 1) * SPAN - SPAN / 2 - GAP / 2);

function pickZone() {
  const total = WEIGHT.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < WEIGHT.length; i++) {
    r -= WEIGHT[i];
    if (r < 0) return i;
  }
  return 0;
}

/** Security · small. Eight fence zones ring the site: a detection sweeps along its segment and flashes it amber while the count rolls; hover a segment to read that zone. */
export function PerimeterWidget({ index }: { index?: number }) {
  const [counts, setCounts] = useState(SEED);
  const [focus, setFocus] = useState<number | null>(null);
  const [last, setLast] = useState(4);
  const [sweep, setSweep] = useState<{ zone: number; id: number } | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => {
      const zone = pickZone();
      setCounts((c) => c.map((v, i) => (i === zone ? v + 1 : v)));
      setLast(zone);
      setSweep({ zone, id: Date.now() });
    }, 6000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!sweep) return;
    const t = window.setTimeout(() => setSweep(null), 2400);
    return () => window.clearTimeout(t);
  }, [sweep]);

  const shown = focus ?? last;
  const total = counts.reduce((s, v) => s + v, 0);
  const delay = 0.3 + (index ?? 0) * 0.06;

  return (
    <Widget size="small" index={index} label="Perimeter zones">
      <WidgetHeader icon={<LocationRipple20Filled />} tint="var(--ios-teal)" title="Perimeter" subtitle="8 fence zones" />

      <div className="mt-1.5 flex items-center gap-2">
        <svg viewBox="0 0 84 84" className="size-[80px] shrink-0 overflow-visible" onMouseLeave={() => setFocus(null)}>
          {/* Site footprint. */}
          <rect x="27" y="31" width="30" height="22" rx="3" style={{ fill: "var(--ant-color-fill-tertiary)" }} />
          <rect x="35" y="53" width="14" height="5" rx="1.5" style={{ fill: "var(--ant-color-fill-secondary)" }} />
          <text x="42" y="45" textAnchor="middle" fontSize="9" fontWeight="600" style={{ fill: "var(--ant-color-text-tertiary)" }}>
            HQ
          </text>

          {ZONES.map((name, i) => {
            const alert = sweep?.zone === i;
            const on = shown === i;
            return (
              <g key={name} onMouseEnter={() => setFocus(i)} style={{ cursor: "pointer" }}>
                <motion.path
                  d={zoneArc(i)}
                  fill="none"
                  strokeWidth="6"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: delay + i * 0.06, duration: 0.5, ease: "easeOut" }}
                  style={{
                    stroke: alert
                      ? "var(--ios-orange)"
                      : on
                        ? "var(--ant-color-text-secondary)"
                        : "var(--ant-color-text-tertiary)",
                    transition: "stroke 0.4s",
                  }}
                />
                <path d={zoneArc(i)} fill="none" strokeWidth="14" stroke="transparent" />
              </g>
            );
          })}

          <AnimatePresence>
            {sweep ? (
              <motion.path
                key={sweep.id}
                d={zoneArc(sweep.zone)}
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                style={{ stroke: "var(--ios-yellow)" }}
                initial={{ pathLength: 0, pathOffset: 0 }}
                animate={{ pathLength: [0, 0.35, 0], pathOffset: [0, 0.3, 1] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              />
            ) : null}
            {sweep ? (
              <motion.circle
                key={`ping-${sweep.id}`}
                cx="42"
                cy="42"
                fill="none"
                strokeWidth="1"
                style={{ stroke: "var(--ios-orange)" }}
                initial={{ r: 16, opacity: 0.8 }}
                animate={{ r: 40, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, ease: "easeOut" }}
              />
            ) : null}
          </AnimatePresence>
        </svg>

        <div className="min-w-0 flex-1 leading-none">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={shown}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className={cn("truncate text-[11px] font-medium", sweep?.zone === shown ? "text-ios-orange" : "text-tertiary")}
            >
              {ZONES[shown]}
            </motion.div>
          </AnimatePresence>
          <AnimatedNumber value={counts[shown]} className="mt-1 block text-[28px] font-semibold tracking-tight text-heading" />
          <div className="mt-0.5 text-[10px] whitespace-nowrap text-tertiary">detections</div>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-1.5 whitespace-nowrap text-[11px] text-tertiary">
        <LiveDot color="var(--ios-green)" />
        <span className="truncate">
          Armed · <AnimatedNumber value={total} className="font-semibold text-secondary" /> today
        </span>
      </div>
    </Widget>
  );
}
