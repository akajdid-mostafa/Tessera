import { Dust20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { LiveDot } from "./_parts";

type Size = "0.5" | "5.0";
type Sample = { id: number; min: number; s05: number; s5: number; note?: string };

/** EU GMP Annex 1, Grade A in operation (ISO 5): action = the class limit, alert = site-set. */
const LIMITS: Record<Size, { alert: number; action: number }> = {
  "0.5": { alert: 2000, action: 3520 },
  "5.0": { alert: 15, action: 29 },
};
const BARS = 28;
const TICK_MS = 2600;
/** Every Nth sample is an intervention that crosses the alert limit. */
const EXCURSION_EVERY = 19;
const START_MIN = 14 * 60 + 21;

const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

function sample(id: number): Sample {
  const min = START_MIN - (BARS - 1) + id;
  if (id % EXCURSION_EVERY === 8) {
    return { id, min, s05: 2480 + Math.round(Math.random() * 260), s5: 17 + Math.round(Math.random() * 4), note: "Glove-port intervention" };
  }
  const s05 = Math.round(160 + Math.random() * 420 + (Math.random() < 0.15 ? 380 : 0));
  return { id, min, s05, s5: Math.round(Math.random() * 4 + (s05 > 600 ? 3 : 0)) };
}

const SEED = Array.from({ length: BARS }, (_, i) => sample(i));

function stateOf(v: number, size: Size) {
  const l = LIMITS[size];
  return v >= l.action ? "action" : v >= l.alert ? "alert" : "ok";
}

/** Lab · medium. One-minute particle counts on a Grade A filling line against alert and action limits: a new bar slides in every few seconds, an intervention spikes amber past the alert line, the size toggle swaps 0.5 µm and 5.0 µm, and hovering a bar reads that minute. */
export function ParticleCountsWidget({ index }: { index?: number }) {
  const [size, setSize] = useState<Size>("0.5");
  const [data, setData] = useState(SEED);
  const [hover, setHover] = useState<number | null>(null);
  const next = useRef(BARS);
  const first = useRef(true);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setTimeout(() => (first.current = false), 2000);
    const id = window.setInterval(() => {
      const s = sample(next.current++);
      setData((d) => [...d.slice(1), s]);
    }, TICK_MS);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(id);
    };
  }, []);

  const lim = LIMITS[size];
  const max = lim.action * 1.18;
  const val = (s: Sample) => (size === "0.5" ? s.s05 : s.s5);
  const hovered = hover === null ? undefined : data.find((s) => s.id === hover);
  const point = hovered ?? data[data.length - 1];
  const v = val(point);
  const st = stateOf(v, size);
  const alerts = data.filter((s) => stateOf(val(s), size) !== "ok").length;
  const pct = (x: number) => `${Math.min(100, (x / max) * 100)}%`;

  return (
    <Widget size="medium" index={index} label="Particle counts">
      <WidgetHeader
        icon={<Dust20Filled />}
        tint="var(--ios-indigo)"
        title="Particle Counts"
        subtitle="Filling Line 2 · Grade A · ISO 5"
        extra={
          <Segmented
            size="small"
            value={size}
            onChange={(x) => setSize(x as Size)}
            options={[
              { label: "0.5 µm", value: "0.5" },
              { label: "5.0 µm", value: "5.0" },
            ]}
          />
        }
      />

      <div className="mt-2 flex min-h-0 flex-1 gap-3">
        <div className="flex w-[108px] shrink-0 flex-col">
          <div className="h-[14px] overflow-hidden text-[11px] font-medium text-tertiary">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={hovered ? hovered.id : "now"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="truncate tabular"
              >
                {hovered ? `${hhmm(hovered.min)} · 1 min` : `Last minute · ${hhmm(point.min)}`}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-1 whitespace-nowrap leading-none">
            <AnimatedNumber
              value={v}
              className={cn(
                "text-[28px] font-semibold tracking-tight transition-colors duration-300",
                st === "action" ? "text-ios-red" : st === "alert" ? "text-ios-orange" : "text-heading",
              )}
            />
          </div>
          <div className="mt-1 text-[10px] text-tertiary">per m³ · ≥ {size} µm</div>

          <div className="mt-auto">
            <span
              className={cn(
                "inline-flex h-5 max-w-full items-center gap-1 whitespace-nowrap rounded-full px-2 text-[10px] font-semibold transition-colors duration-300",
                st === "alert" ? "bg-ios-orange/15 text-ios-orange" : st === "action" ? "bg-ios-red/15 text-ios-red" : "bg-fill-tertiary text-secondary",
              )}
            >
              <LiveDot color={st === "ok" ? "var(--ios-green)" : st === "action" ? "var(--ios-red)" : "var(--ios-orange)"} ping={st !== "ok" && !hovered} />
              <span className="truncate">{st === "action" ? "Above action" : st === "alert" ? "Above alert" : "Within limits"}</span>
            </span>
            <div className="mt-1 truncate text-[10px] text-tertiary tabular">
              {point.note && st !== "ok" ? point.note : `${alerts} alert${alerts === 1 ? "" : "s"} · last ${BARS} min`}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1">
            <div className="relative min-w-0 flex-1" onMouseLeave={() => setHover(null)}>
              {/* Action band, then the two limit lines. */}
              <div className="pointer-events-none absolute inset-x-0 top-0 rounded-t-[4px] bg-ios-red/[0.07]" style={{ bottom: pct(lim.action) }} />
              <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-ios-red/70" style={{ bottom: pct(lim.action) }} />
              <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-ios-orange/70" style={{ bottom: pct(lim.alert) }} />
              <div className="relative flex h-full items-end gap-[2px]">
                <AnimatePresence initial={false} mode="popLayout">
                  {data.map((s, i) => {
                    const x = val(s);
                    const ss = stateOf(x, size);
                    const on = hover === s.id;
                    const latest = i === data.length - 1;
                    return (
                      <motion.button
                        key={s.id}
                        type="button"
                        layout="position"
                        aria-label={`${hhmm(s.min)} ${x} per cubic metre`}
                        onMouseEnter={() => setHover(s.id)}
                        onFocus={() => setHover(s.id)}
                        onBlur={() => setHover(null)}
                        exit={{ opacity: 0, transition: { duration: 0.2 } }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="flex h-full min-w-0 flex-1 cursor-pointer items-end outline-none"
                      >
                        <motion.span
                          className={cn(
                            "block w-full rounded-[2px] transition-colors duration-200",
                            ss === "action" ? "bg-ios-red" : ss === "alert" ? "bg-ios-orange" : on ? "bg-ios-indigo" : latest ? "bg-ios-indigo/70" : "bg-fill",
                          )}
                          style={ss !== "ok" ? { boxShadow: "0 0 8px color-mix(in srgb, var(--ios-orange) 50%, transparent)" } : undefined}
                          initial={{ height: 0 }}
                          animate={{ height: pct(Math.max(x, max * 0.025)), opacity: hover === null || on ? 1 : 0.55 }}
                          transition={{
                            height: { type: "spring", stiffness: 210, damping: 20, delay: first.current ? delay + i * 0.025 : 0 },
                            opacity: { duration: 0.15 },
                          }}
                        />
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
            {/* Limit labels sit in a gutter, outside the bars. */}
            <div className="relative w-[36px] shrink-0 text-[9px] font-semibold tabular">
              <span className="absolute right-0 translate-y-1/2 text-ios-red" style={{ bottom: pct(lim.action) }}>
                {lim.action.toLocaleString("en-US")}
              </span>
              <span className="absolute right-0 translate-y-1/2 text-ios-orange" style={{ bottom: pct(lim.alert) }}>
                {lim.alert.toLocaleString("en-US")}
              </span>
            </div>
          </div>
          <div className="mt-1 flex pr-[36px] text-[9px] text-tertiary tabular">
            <span>{hhmm(data[0].min)}</span>
            <span className="ml-auto">now</span>
          </div>
        </div>
      </div>
    </Widget>
  );
}
