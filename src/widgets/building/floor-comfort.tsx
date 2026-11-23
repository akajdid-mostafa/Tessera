import { Map20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useMemo, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";

type Layer = "temp" | "co2";
type Zone = {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  temp: number;
  sp: number;
  rh: number;
  co2: number;
  people: string[];
};

const SEED: Zone[] = [
  { id: "board", name: "Boardroom", x: 6, y: 6, w: 92, h: 62, temp: 23.6, sp: 22, rh: 48, co2: 1210, people: ["Emily Walsh", "Marco Bianchi", "Hana Sato", "Owen Price", "Leila Haddad", "Tom Becker", "Ines Duarte", "Raj Patel", "Ana Lima", "Sam Ortiz", "Nora Kim", "Jonas Berg"] },
  { id: "huddle", name: "Huddle 3.2", x: 102, y: 6, w: 52, h: 62, temp: 22.9, sp: 22.5, rh: 44, co2: 760, people: ["Priya Shah", "Luca Romano"] },
  { id: "focus", name: "Focus Pods", x: 216, y: 6, w: 48, h: 62, temp: 21.4, sp: 22, rh: 41, co2: 520, people: ["Mia Novak"] },
  { id: "exec", name: "Exec Suite", x: 268, y: 6, w: 46, h: 62, temp: 22.1, sp: 22, rh: 43, co2: 610, people: ["David Chen"] },
  { id: "west", name: "Open Office W", x: 6, y: 72, w: 148, h: 74, temp: 22.3, sp: 22, rh: 45, co2: 690, people: ["Zoe Martin", "Kevin Adams", "Lena Vogel", "Ben Carter", "Aisha Bello", "Yuki Mori", "Paul Dubois", "Chloe Evans"] },
  { id: "east", name: "Open Office E", x: 158, y: 72, w: 156, h: 74, temp: 20.8, sp: 22, rh: 39, co2: 580, people: ["Omar Farouk", "Sofia Rossi", "Ethan Wright", "Mei Lin", "Jack Hughes"] },
  { id: "cafe", name: "Café", x: 6, y: 150, w: 92, h: 34, temp: 22.6, sp: 22, rh: 47, co2: 820, people: ["Lucas Silva", "Emma Weber", "Chris Dunn"] },
  { id: "recep", name: "Reception", x: 102, y: 150, w: 110, h: 34, temp: 21.9, sp: 22, rh: 42, co2: 540, people: ["Grace Park"] },
  { id: "it", name: "IT Room", x: 216, y: 150, w: 98, h: 34, temp: 19.6, sp: 20, rh: 38, co2: 450, people: [] },
];

const CO2_ALARM = 1000;

/** Tint for a zone: neutral when on target, color only when it drifts (ISA-101). */
function tintOf(z: Zone, layer: Layer): { color: string; opacity: number } {
  if (layer === "temp") {
    const d = z.temp - z.sp;
    const a = Math.abs(d);
    if (a <= 0.5) return { color: "var(--ios-green)", opacity: 0 };
    return { color: d < 0 ? "var(--ios-blue)" : a > 1.5 ? "var(--ios-red)" : "var(--ios-orange)", opacity: Math.min(0.55, 0.18 + (a - 0.5) * 0.3) };
  }
  if (z.co2 < 800) return { color: "var(--ios-green)", opacity: 0 };
  if (z.co2 < CO2_ALARM) return { color: "var(--ios-yellow)", opacity: 0.3 };
  if (z.co2 < 1200) return { color: "var(--ios-orange)", opacity: 0.42 };
  return { color: "var(--ios-red)", opacity: 0.45 };
}

const ONE = { minimumFractionDigits: 1, maximumFractionDigits: 1 } as const;

/** Building · large. Level 3 floor plan with zones tinted by temperature or CO₂: values drift live, the boardroom raises a pulsing CO₂ alarm, and hovering a zone fills the hero with its readings and occupants. */
export function FloorComfortWidget({ index }: { index?: number }) {
  const [layer, setLayer] = useState<Layer>("temp");
  const [zones, setZones] = useState(SEED);
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const hatch = `fc-hatch-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    const t = window.setInterval(() => {
      setZones((list) =>
        list.map((z) => {
          const base = SEED.find((s) => s.id === z.id)!;
          const temp = Math.round((z.temp + (base.temp - z.temp) * 0.3 + (Math.random() - 0.5) * 0.2) * 10) / 10;
          const co2 =
            z.id === "board"
              ? Math.round(Math.min(1290, Math.max(1150, z.co2 + (Math.random() - 0.35) * 40)))
              : Math.round(Math.min(base.co2 + 80, Math.max(base.co2 - 80, z.co2 + (Math.random() - 0.5) * 36)));
          return { ...z, temp, co2 };
        }),
      );
    }, 3000);
    return () => window.clearInterval(t);
  }, []);

  const selId = hover ?? pinned;
  const sel = zones.find((z) => z.id === selId) ?? null;
  const alarms = zones.filter((z) => z.co2 >= CO2_ALARM);
  const people = useMemo(() => zones.flatMap((z) => z.people), [zones]);
  const avgTemp = zones.reduce((s, z) => s + z.temp, 0) / zones.length;
  const avgCo2 = zones.reduce((s, z) => s + z.co2 * Math.max(1, z.people.length), 0) / zones.reduce((s, z) => s + Math.max(1, z.people.length), 0);
  const delay = 0.3 + (index ?? 0) * 0.06;

  const heroValue = layer === "temp" ? (sel ? sel.temp : avgTemp) : sel ? sel.co2 : avgCo2;
  const crew = sel ? sel.people : people;
  const heroAlarm = sel ? sel.co2 >= CO2_ALARM : false;

  return (
    <Widget size="large" index={index} label="Floor comfort map">
      <WidgetHeader
        icon={<Map20Filled />}
        tint="var(--ios-teal)"
        title="Level 3 · Comfort"
        subtitle="HQ Tower · 9 zones"
        extra={
          <Segmented
            size="small"
            value={layer}
            onChange={(v) => setLayer(v as Layer)}
            options={[
              { label: "Temp", value: "temp" },
              { label: "CO₂", value: "co2" },
            ]}
          />
        }
      />

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0 leading-none">
          <div className="flex h-[16px] items-center gap-1.5 whitespace-nowrap text-[11px]">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={sel?.id ?? "avg"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={cn("truncate font-medium", heroAlarm ? "text-ios-red" : "text-tertiary")}
              >
                {sel ? sel.name : layer === "temp" ? "Floor average" : "Occupied average"}
              </motion.span>
            </AnimatePresence>
            {!sel && alarms.length ? (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-full bg-ios-red/15 px-1.5 py-px text-[10px] font-semibold text-ios-red"
              >
                {alarms.length} alarm · {alarms[0].name} CO₂
              </motion.span>
            ) : null}
          </div>
          <div className="mt-1.5 whitespace-nowrap text-[30px] font-semibold tracking-tight text-heading">
            {layer === "temp" ? (
              <AnimatedNumber value={heroValue} format={ONE} suffix="°" />
            ) : (
              <>
                <AnimatedNumber value={Math.round(heroValue)} className={heroAlarm ? "text-ios-red" : undefined} />
                <span className="ml-1 text-[13px] font-medium text-tertiary">ppm</span>
              </>
            )}
          </div>
        </div>

        <div className="shrink-0 pb-0.5 text-right leading-tight">
          <div className="text-[11px] text-tertiary tabular">
            {sel ? (
              <>
                SP {sel.sp.toFixed(1)}° · RH {sel.rh}%
              </>
            ) : (
              <>{crew.length} people on floor</>
            )}
          </div>
          <div className="mt-1 flex h-[22px] items-center justify-end">
            {crew.length ? (
              <>
                {crew.slice(0, 4).map((n, i) => (
                  <motion.span
                    key={`${sel?.id ?? "all"}-${n}`}
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, type: "spring", stiffness: 500, damping: 30 }}
                    className={i ? "-ml-1.5" : undefined}
                  >
                    <MemojiAvatar who={n} size={22} alt={n} className="ring-[1.5px] ring-[var(--widget-surface)]" />
                  </motion.span>
                ))}
                {crew.length > 4 ? (
                  <span className="-ml-1.5 grid h-[22px] min-w-[22px] place-items-center rounded-full bg-fill-secondary px-1 text-[10px] font-semibold text-secondary ring-2 ring-[var(--widget-surface)] tabular">
                    +{crew.length - 4}
                  </span>
                ) : null}
              </>
            ) : (
              <span className="text-[11px] text-tertiary">Unoccupied</span>
            )}
          </div>
        </div>
      </div>

      <svg
        viewBox="0 0 320 190"
        className="mt-3 min-h-0 w-full flex-1"
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label="Level 3 floor plan"
      >
        <defs>
          <pattern id={hatch} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="5" strokeWidth="1.5" style={{ stroke: "var(--ant-color-fill-secondary)" }} />
          </pattern>
        </defs>
        <rect x="1" y="1" width="318" height="188" rx="10" fill="none" strokeWidth="1.5" style={{ stroke: "var(--ant-color-split)" }} />
        {/* Building core: lifts, stairs, risers. Not a comfort zone. */}
        <rect x="158" y="6" width="54" height="62" rx="6" fill={`url(#${hatch})`} />
        <text x="185" y="40" textAnchor="middle" fontSize="9" style={{ fill: "var(--ant-color-text-tertiary)" }}>
          Core
        </text>

        {zones.map((z, i) => {
          const t = tintOf(z, layer);
          const active = selId === z.id;
          const alarm = z.co2 >= CO2_ALARM;
          const big = z.w >= 90;
          const value = layer === "temp" ? `${z.temp.toFixed(1)}°` : `${z.co2}`;
          return (
            <motion.g
              key={z.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + i * 0.045, type: "spring", stiffness: 260, damping: 22 }}
              onMouseEnter={() => setHover(z.id)}
              onClick={() => setPinned((p) => (p === z.id ? null : z.id))}
              style={{ cursor: "pointer" }}
            >
              <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="6" style={{ fill: "var(--ant-color-fill-tertiary)" }} />
              <rect
                x={z.x}
                y={z.y}
                width={z.w}
                height={z.h}
                rx="6"
                style={{ fill: t.color, fillOpacity: t.opacity, transition: "fill 0.7s, fill-opacity 0.7s" }}
              />
              {active ? (
                <motion.rect
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  x={z.x + 0.5}
                  y={z.y + 0.5}
                  width={z.w - 1}
                  height={z.h - 1}
                  rx="5.5"
                  fill="none"
                  strokeWidth="1"
                  style={{ stroke: `color-mix(in oklab, ${t.color}, black 35%)` }}
                />
              ) : null}
              {alarm ? (
                <motion.rect
                  x={z.x + 0.75}
                  y={z.y + 0.75}
                  width={z.w - 1.5}
                  height={z.h - 1.5}
                  rx="5.5"
                  fill="none"
                  strokeWidth="1"
                  style={{ stroke: "var(--ios-red)" }}
                  animate={{ opacity: [1, 0.25, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                />
              ) : null}
              {big ? (
                // A short zone has no room to stack name over value, so the two
                // share one line: name on the left, value on the right.
                <text
                  x={z.x + 7}
                  y={z.h <= 40 ? z.y + z.h / 2 + 3 : z.y + 13}
                  fontSize="9"
                  style={{ fill: "var(--ant-color-text-tertiary)" }}
                >
                  {z.name}
                </text>
              ) : null}
              <text
                x={big && z.h <= 40 ? z.x + z.w - 7 : z.x + z.w / 2}
                y={z.y + z.h / 2 + (big && z.h > 40 ? 6 : 4)}
                textAnchor={big && z.h <= 40 ? "end" : "middle"}
                fontSize={z.w >= 90 ? 13 : 11}
                fontWeight="600"
                style={{ fill: alarm && layer === "co2" ? "var(--ios-red)" : "var(--ant-color-text)", fontVariantNumeric: "tabular-nums" }}
              >
                {value}
              </text>
            </motion.g>
          );
        })}
      </svg>

      <div className="mt-2.5 flex items-center gap-3 whitespace-nowrap text-[11px] text-tertiary">
        {(layer === "temp"
          ? [
              ["var(--ios-blue)", "Cool"],
              ["var(--ant-color-fill-secondary)", "On target"],
              ["var(--ios-orange)", "Warm"],
            ]
          : [
              ["var(--ant-color-fill-secondary)", "< 800"],
              ["var(--ios-yellow)", "800–1,000"],
              ["var(--ios-red)", "> 1,000 ppm"],
            ]
        ).map(([c, l]) => (
          <span key={l} className="flex items-center gap-1">
            <span className="size-2 rounded-full" style={{ background: c }} />
            {l}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-1 text-tertiary">
          <span className="relative flex size-1.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-ios-green opacity-60" />
            <span className="relative size-1.5 rounded-full bg-ios-green" />
          </span>
          Live
        </span>
      </div>
    </Widget>
  );
}
