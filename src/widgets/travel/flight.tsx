import { Airplane20Filled } from "@fluentui/react-icons";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";
import { Widget } from "@/motion/widget";
import { Tag } from "@/registry/antuikit/ui/tag";

const PROGRESS = 0.46;
/* The route arc, as a quadratic curve in a 200×56 box. */
const P0 = { x: 8, y: 48 };
const P1 = { x: 100, y: -8 };
const P2 = { x: 192, y: 48 };
const ARC = `M${P0.x} ${P0.y} Q${P1.x} ${P1.y} ${P2.x} ${P2.y}`;
const at = (t: number, a: number, b: number, c: number) => (1 - t) ** 2 * a + 2 * (1 - t) * t * b + t ** 2 * c;
const slope = (t: number) =>
  (Math.atan2(2 * (1 - t) * (P1.y - P0.y) + 2 * t * (P2.y - P1.y), 2 * (1 - t) * (P1.x - P0.x) + 2 * t * (P2.x - P1.x)) * 180) / Math.PI;

/** Travel · medium. The plane flies the arc to where the flight is now, trailing a solid line. */
export function FlightWidget({ index }: { index?: number }) {
  const t = useMotionValue(0);
  const x = useTransform(t, (v) => at(v, P0.x, P1.x, P2.x));
  const y = useTransform(t, (v) => at(v, P0.y, P1.y, P2.y));
  const rotate = useTransform(t, slope);
  const length = useTransform(t, (v) => v);

  useEffect(() => {
    const c = animate(t, PROGRESS, { delay: 0.4 + (index ?? 0) * 0.06, duration: 1.8, ease: [0.22, 1, 0.36, 1] });
    return () => c.stop();
  }, [t, index]);

  return (
    <Widget size="medium" index={index} label="Flight status">
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-full bg-ios-red text-[15px] text-white">
          <Airplane20Filled />
        </span>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold text-heading">AX 204 · Airbus A350</div>
          <div className="text-[11px] text-tertiary">Thu, Nov 12 · In flight</div>
        </div>
        <Tag color="success" variant="filled"className="ml-auto me-0 rounded-full">
          On time
        </Tag>
      </div>

      <div className="mt-auto flex items-end gap-2">
        <div className="leading-none">
          <div className="text-[26px] font-semibold tracking-tight text-heading">LAX</div>
          <div className="mt-1 text-[11px] text-tertiary tabular">09:35 · T1</div>
        </div>
        <svg viewBox="0 0 200 56" className="h-14 flex-1 overflow-visible">
          <path d={ARC} fill="none" strokeWidth="1.5" strokeDasharray="3 4" className="stroke-fill" />
          <motion.path d={ARC} fill="none" stroke="var(--ios-red)" strokeWidth="2" strokeLinecap="round" style={{ pathLength: length }} />
          <circle cx={P0.x} cy={P0.y} r="3" fill="var(--ios-red)" />
          <circle cx={P2.x} cy={P2.y} r="3" className="fill-fill" />
          <motion.g style={{ x, y }}>
            <motion.g style={{ rotate }}>
              <circle r="11" fill="var(--widget-surface)" />
              {/* Fluent's airplane already faces +x. The icon always renders its own
                  20-unit box (it ignores width/height), so scale it to 16 and centre it. */}
              <g transform="translate(-8 -8) scale(0.8)">
                <Airplane20Filled color="var(--ios-red)" />
              </g>
            </motion.g>
          </motion.g>
        </svg>
        <div className="text-right leading-none">
          <div className="text-[26px] font-semibold tracking-tight text-heading">JFK</div>
          <div className="mt-1 text-[11px] text-tertiary tabular">17:55 · T4</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 border-t-[0.5px] border-split pt-2 text-[11px] leading-tight">
        {[
          ["Lands in", "5h 12m"],
          ["Gate", "B12"],
          ["Seat", "14A"],
        ].map(([k, v], i) => (
          <div key={k} className={i === 1 ? "text-center" : i === 2 ? "text-right" : ""}>
            <div className="text-tertiary">{k}</div>
            <div className="text-[13px] font-semibold text-heading tabular">{v}</div>
          </div>
        ))}
      </div>
    </Widget>
  );
}
