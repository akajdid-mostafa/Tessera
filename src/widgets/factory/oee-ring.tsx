import { Gauge20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { enterDelay } from "./_parts";

const LINES = [
  { name: "Line 1", area: "Filling · Krones", a: 0.92, p: 0.81, q: 0.992, loss: "Speed loss" },
  { name: "Line 2", area: "Press shop", a: 0.874, p: 0.953, q: 0.986, loss: "Die change" },
  { name: "Line 3", area: "Final assembly", a: 0.962, p: 0.958, q: 0.995, loss: "" },
] as const;

/** Per-factor targets that multiply out to world-class OEE (≈85%). */
const TARGET = { a: 0.9, p: 0.95, q: 0.99 } as const;
const OEE_TARGET = 0.85;
const RINGS = [
  { key: "a", label: "A", r: 34, ink: "var(--ant-color-text)" },
  { key: "p", label: "P", r: 25, ink: "var(--ant-color-text-secondary)" },
  { key: "q", label: "Q", r: 16, ink: "var(--ant-color-text-tertiary)" },
] as const;
const AMBER = "var(--ios-orange)";

/** Factory · small. A×P×Q as three rings that sweep in one after another; tap to page lines, a ring turns amber only below its target. */
export function OeeRingWidget({ index }: { index?: number }) {
  const [page, setPage] = useState(0);
  const line = LINES[page];
  const oee = line.a * line.p * line.q;
  const gap = Math.round((oee - OEE_TARGET) * 100);
  const delay = enterDelay(index);
  const first = page === 0;

  return (
    <Widget
      size="small"
      index={index}
      label="Overall equipment effectiveness"
      pressable
      onPress={() => setPage((n) => (n + 1) % LINES.length)}
    >
      <WidgetHeader
        icon={<Gauge20Filled />}
        tint="var(--ios-indigo)"
        title="OEE"
        subtitle={line.area}
        extra={
          <div className="mt-1 flex gap-[3px]">
            {LINES.map((l, i) => (
              <motion.span
                key={l.name}
                layout
                className={cn("h-1.5 rounded-full", i === page ? "w-3 bg-heading" : "w-1.5 bg-fill")}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            ))}
          </div>
        }
      />

      <div className="mt-2 flex items-center gap-2.5">
        <svg viewBox="0 0 80 80" className="size-[74px] shrink-0 -rotate-90" aria-hidden>
          {RINGS.map((ring, i) => {
            const v = line[ring.key];
            const t = TARGET[ring.key];
            const c = 2 * Math.PI * ring.r;
            const low = v < t;
            const ang = t * 2 * Math.PI;
            return (
              <g key={ring.key}>
                <circle cx="40" cy="40" r={ring.r} fill="none" strokeWidth="7" className="stroke-fill-secondary" />
                <motion.circle
                  cx="40"
                  cy="40"
                  r={ring.r}
                  fill="none"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={c}
                  initial={{ strokeDashoffset: c }}
                  animate={{ strokeDashoffset: c * (1 - v) }}
                  style={{ stroke: low ? AMBER : ring.ink, transition: "stroke 0.4s" }}
                  transition={{ type: "spring", stiffness: 70, damping: 16, delay: first ? delay + i * 0.22 : i * 0.06 }}
                />
                {/* Target notch, cut into the ring with the surface colour. */}
                <line
                  x1={40 + (ring.r - 4.5) * Math.cos(ang)}
                  y1={40 + (ring.r - 4.5) * Math.sin(ang)}
                  x2={40 + (ring.r + 4.5) * Math.cos(ang)}
                  y2={40 + (ring.r + 4.5) * Math.sin(ang)}
                  stroke="var(--widget-surface)"
                  strokeWidth="1.6"
                />
              </g>
            );
          })}
        </svg>

        <div className="min-w-0 whitespace-nowrap leading-tight">
          <motion.div
            key={line.name}
            initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            className="text-[11px] font-semibold text-secondary"
          >
            {line.name}
          </motion.div>
          <AnimatedNumber
            value={oee}
            format={{ style: "percent", maximumFractionDigits: 0 }}
            className="text-[26px] leading-none font-semibold tracking-tight text-heading"
          />
          <div className={cn("mt-0.5 truncate text-[11px] font-medium", gap < 0 ? "text-ios-orange" : "text-tertiary")}>
            {gap < 0 ? line.loss : "World-class"}
          </div>
          <div className="text-[10px] text-tertiary tabular">
            {gap >= 0 ? "+" : "−"}
            {Math.abs(gap)} vs 85
          </div>
        </div>
      </div>

      <div className="mt-auto flex justify-between text-[11px] tabular">
        {RINGS.map((ring) => {
          const v = line[ring.key];
          const low = v < TARGET[ring.key];
          return (
            <span key={ring.key} className="flex items-center gap-1">
              <span
                className="size-1.5 rounded-full transition-colors duration-500"
                style={{ background: low ? AMBER : ring.ink }}
              />
              <span className="text-tertiary">{ring.label}</span>
              <AnimatedNumber
                value={v}
                format={{ style: "percent", maximumFractionDigits: 0 }}
                className={cn("font-semibold", low ? "text-ios-orange" : "text-secondary")}
              />
            </span>
          );
        })}
      </div>
    </Widget>
  );
}
