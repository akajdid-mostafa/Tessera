import { BuildingMultiple20Filled, CheckmarkCircle16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useMemo, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { LiveDot } from "./_parts";

type Kind = "smoke" | "heat" | "pull" | "horn";
type State = "normal" | "pre" | "alarm" | "trouble";
type Dev = { id: string; kind: Kind; x: number; y: number; zone: number; room: string };
type Zone = { n: number; name: string; x: number; y: number; w: number; h: number };

const ZONES: Zone[] = [
  { n: 1, name: "West", x: 6, y: 6, w: 116, h: 208 },
  { n: 3, name: "North", x: 128, y: 6, w: 88, h: 66 },
  { n: 4, name: "South", x: 128, y: 148, w: 88, h: 66 },
  { n: 2, name: "East", x: 222, y: 6, w: 116, h: 208 },
];

const DEVICES: Dev[] = [
  { id: "D021", kind: "smoke", x: 36, y: 40, zone: 1, room: "Office 01" },
  { id: "D022", kind: "smoke", x: 92, y: 40, zone: 1, room: "Open plan W" },
  { id: "D023", kind: "smoke", x: 36, y: 110, zone: 1, room: "Office 04" },
  { id: "D024", kind: "smoke", x: 92, y: 110, zone: 1, room: "Open plan W" },
  { id: "D025", kind: "smoke", x: 36, y: 180, zone: 1, room: "Office 07" },
  { id: "D026", kind: "smoke", x: 92, y: 180, zone: 1, room: "Copy room" },
  { id: "D031", kind: "smoke", x: 152, y: 36, zone: 3, room: "Meeting 10" },
  { id: "D032", kind: "smoke", x: 192, y: 36, zone: 3, room: "Meeting 11" },
  { id: "H041", kind: "heat", x: 152, y: 184, zone: 4, room: "Kitchenette" },
  { id: "D042", kind: "smoke", x: 192, y: 184, zone: 4, room: "Kitchen hall" },
  { id: "D035", kind: "smoke", x: 252, y: 40, zone: 2, room: "Open plan E" },
  { id: "D036", kind: "smoke", x: 308, y: 40, zone: 2, room: "Open plan E" },
  { id: "D037", kind: "smoke", x: 252, y: 110, zone: 2, room: "Corridor East" },
  { id: "D038", kind: "smoke", x: 308, y: 110, zone: 2, room: "Server closet" },
  { id: "D039", kind: "smoke", x: 252, y: 180, zone: 2, room: "Office 21" },
  { id: "D040", kind: "smoke", x: 308, y: 180, zone: 2, room: "Office 24" },
  { id: "M011", kind: "pull", x: 118, y: 136, zone: 1, room: "Stair A door" },
  { id: "M012", kind: "pull", x: 226, y: 136, zone: 2, room: "Stair B door" },
  { id: "A051", kind: "horn", x: 172, y: 62, zone: 3, room: "North lobby" },
  { id: "A052", kind: "horn", x: 172, y: 203, zone: 4, room: "South lobby" },
  { id: "A053", kind: "horn", x: 100, y: 162, zone: 1, room: "West corridor" },
  { id: "A054", kind: "horn", x: 244, y: 162, zone: 2, room: "East corridor" },
];

type Floor = "4" | "5" | "6";
/** Abnormal devices per floor; everything else is normal. */
const SPECIAL: Record<Floor, Record<string, { state: State; base: number }>> = {
  "5": { D037: { state: "alarm", base: 3.1 }, D036: { state: "pre", base: 1.72 }, D038: { state: "pre", base: 1.58 } },
  "4": { D024: { state: "trouble", base: 96 } },
  "6": {},
};
const NAC_FLOORS: Floor[] = ["4", "5", "6"];

function reading(d: Dev, floor: Floor): { state: State; v: number; unit: string; text?: string } {
  const sp = SPECIAL[floor][d.id];
  const j = Math.random() - 0.5;
  if (sp?.state === "trouble") return { state: "trouble", v: sp.base + Math.round(j * 2), unit: "% drift", text: "Dirty" };
  if (sp) return { state: sp.state, v: Math.round((sp.base + j * (sp.state === "alarm" ? 0.3 : 0.12)) * 100) / 100, unit: "%/ft" };
  if (d.kind === "heat") return { state: "normal", v: Math.round(74 + j * 1.4), unit: "°F" };
  if (d.kind === "pull") return { state: "normal", v: 0, unit: "", text: "Normal" };
  if (d.kind === "horn") return { state: "normal", v: 0, unit: "", text: NAC_FLOORS.includes(floor) ? "Sounding" : "Standby" };
  return { state: "normal", v: Math.round((0.38 + j * 0.16) * 100) / 100, unit: "%/ft" };
}

const COLOR: Record<State, string> = {
  normal: "var(--ant-color-text-tertiary)",
  pre: "var(--ios-orange)",
  alarm: "var(--ios-red)",
  trouble: "var(--ios-yellow)",
};
const KIND_LABEL: Record<Kind, string> = { smoke: "Smoke", heat: "Heat", pull: "Pull station", horn: "Horn/strobe" };
const RANK: Record<State, number> = { alarm: 3, pre: 2, trouble: 1, normal: 0 };

/** Fire safety · large. A floor plan of addressable devices by zone: on 5F the corridor detector pulses red inside its alarm zone with smoke drifting and egress arrows running to the stairs, the floor switch shows a dirty detector on 4F, and hovering any device reads its address and live analog value. */
export function FloorPlanWidget({ index }: { index?: number }) {
  const [floor, setFloor] = useState<Floor>("5");
  const [tick, setTick] = useState(0);
  const [hover, setHover] = useState<string | null>(null);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1600);
    return () => window.clearInterval(id);
  }, []);

  // Recomputed each tick, so analog values drift live.
  const reads = useMemo(
    () => Object.fromEntries(DEVICES.map((d) => [d.id, reading(d, floor)])) as Record<string, ReturnType<typeof reading>>,
    // `tick` is the clock: a new tick re-reads every analog value.
    [tick, floor],
  );
  const zoneState = (n: number): State =>
    DEVICES.filter((d) => d.zone === n).reduce<State>((s, d) => (RANK[reads[d.id].state] > RANK[s] ? reads[d.id].state : s), "normal");
  const worst = [...DEVICES].sort((a, b) => RANK[reads[b.id].state] - RANK[reads[a.id].state])[0];
  const focus = hover ? DEVICES.find((d) => d.id === hover)! : RANK[reads[worst.id].state] ? worst : null;
  const fr = focus ? reads[focus.id] : null;
  const counts = { alarm: 0, pre: 0, trouble: 0, normal: 0 } as Record<State, number>;
  DEVICES.forEach((d) => counts[reads[d.id].state]++);
  const alarmFloor = counts.alarm > 0;
  const smokeId = `fp-smoke-${uid}`;
  const hatch = `fp-hatch-${uid}`;

  return (
    <Widget size="large" index={index} label="Fire floor plan">
      <WidgetHeader
        icon={<BuildingMultiple20Filled />}
        tint="var(--ios-red)"
        title={`Level ${floor} · Devices`}
        subtitle={`Loop 1 · ${DEVICES.length} points · Zones ${floor}-1 to ${floor}-4`}
        extra={
          <Segmented
            size="small"
            value={floor}
            onChange={(v) => {
              setFloor(v as Floor);
              setHover(null);
            }}
            options={[
              { label: "4F", value: "4" },
              { label: "5F", value: "5" },
              { label: "6F", value: "6" },
            ]}
          />
        }
      />

      <div className="mt-3 flex h-[48px] items-end justify-between gap-3">
        <div className="min-w-0 leading-none">
          <div className="h-[14px] overflow-hidden text-[11px] font-medium">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={`${floor}-${focus?.id ?? "none"}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={cn("truncate", fr?.state === "alarm" ? "text-ios-red" : "text-tertiary")}
              >
                {focus ? `${KIND_LABEL[focus.kind]} · L1-${focus.id} · ${focus.room}` : `Level ${floor} · all points normal`}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-1.5 flex h-[30px] items-baseline whitespace-nowrap">
            {focus && fr && (fr.unit || fr.v) ? (
              <span
                className={cn(
                  "flex items-baseline transition-colors duration-300",
                  fr.state === "alarm" ? "text-ios-red" : fr.state === "pre" ? "text-ios-orange" : fr.state === "trouble" ? "text-ios-yellow" : "text-heading",
                )}
              >
                <AnimatedNumber
                  value={fr.v}
                  format={fr.unit === "%/ft" ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : undefined}
                  className="text-[28px] leading-none font-semibold tracking-tight"
                />
                <span className="ml-1 text-[13px] font-medium text-tertiary">{fr.unit}</span>
                {fr.text ? <span className="ml-2 text-[13px] font-semibold">{fr.text}</span> : null}
              </span>
            ) : focus && fr ? (
              <span className="text-[24px] leading-none font-semibold tracking-tight text-heading">{fr.text}</span>
            ) : (
              <span className="flex items-center gap-1.5 text-[24px] leading-none font-semibold tracking-tight text-heading">
                <CheckmarkCircle16Filled className="text-[20px] text-ios-green" /> Normal
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 pb-0.5 text-right text-[11px] leading-tight tabular">
          <div className="text-tertiary">
            {focus?.kind === "smoke" ? "Pre 1.5 · Alarm 2.5 %/ft" : focus ? `Zone ${floor}-${focus.zone}` : `${counts.normal} normal`}
          </div>
          <div className="mt-1 flex justify-end gap-1.5 font-semibold">
            {counts.alarm ? <span className="text-ios-red">{counts.alarm} alarm</span> : null}
            {counts.pre ? <span className="text-ios-orange">{counts.pre} pre-alarm</span> : null}
            {counts.trouble ? <span className="text-ios-yellow">{counts.trouble} trouble</span> : null}
            {!counts.alarm && !counts.pre && !counts.trouble ? <span className="text-secondary">No events</span> : null}
          </div>
        </div>
      </div>

      <svg viewBox="0 0 344 220" className="mt-2 min-h-0 w-full flex-1" onMouseLeave={() => setHover(null)} role="img" aria-label={`Level ${floor} fire device plan`}>
        <defs>
          <radialGradient id={smokeId}>
            <stop offset="0%" style={{ stopColor: "var(--ant-color-text-tertiary)", stopOpacity: 0.45 }} />
            <stop offset="100%" style={{ stopColor: "var(--ant-color-text-tertiary)", stopOpacity: 0 }} />
          </radialGradient>
          <pattern id={hatch} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="5" strokeWidth="1.5" style={{ stroke: "var(--ant-color-fill-secondary)" }} />
          </pattern>
        </defs>

        <rect x="1" y="1" width="342" height="218" rx="10" fill="none" strokeWidth="1.5" style={{ stroke: "var(--ant-color-split)" }} />

        {ZONES.map((z) => {
          const s = zoneState(z.n);
          const tinted = s === "alarm" || s === "trouble";
          return (
            <g key={z.n}>
              <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="6" style={{ fill: "var(--ant-color-fill-tertiary)" }} />
              <rect
                x={z.x}
                y={z.y}
                width={z.w}
                height={z.h}
                rx="6"
                style={{ fill: COLOR[s], fillOpacity: tinted ? (s === "alarm" ? 0.13 : 0.15) : 0, transition: "fill 0.5s, fill-opacity 0.5s" }}
              />
              {s === "alarm" ? (
                <motion.rect
                  x={z.x + 0.75}
                  y={z.y + 0.75}
                  width={z.w - 1.5}
                  height={z.h - 1.5}
                  rx="5.5"
                  fill="none"
                  strokeWidth="2"
                  style={{ stroke: "var(--ios-red)" }}
                  animate={{ opacity: [1, 0.25, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                />
              ) : null}
              <text x={z.x + 7} y={z.y + 14} fontSize="9.5" fontWeight="600" style={{ fill: s === "alarm" ? "var(--ios-red)" : "var(--ant-color-text-tertiary)" }}>
                {floor}-{z.n} {z.name}
              </text>
            </g>
          );
        })}

        {/* Partitions: perimeter offices along the west and east walls. */}
        <g strokeWidth="1" style={{ stroke: "var(--ant-color-split)" }}>
          {[76, 146].map((yy) => (
            <g key={yy}>
              <line x1="6" x2="64" y1={yy} y2={yy} />
              <line x1="280" x2="338" y1={yy} y2={yy} />
            </g>
          ))}
          <line x1="64" x2="64" y1="22" y2="200" />
          <line x1="280" x2="280" y1="22" y2="200" />
          <line x1="172" x2="172" y1="20" y2="54" />
          <line x1="172" x2="172" y1="168" y2="214" />
        </g>

        {/* Core: stairs and lifts. */}
        <rect x="128" y="78" width="88" height="64" rx="6" fill={`url(#${hatch})`} />
        <rect x="128" y="78" width="22" height="64" rx="4" style={{ fill: "var(--ant-color-fill-secondary)" }} />
        <rect x="194" y="78" width="22" height="64" rx="4" style={{ fill: "var(--ant-color-fill-secondary)" }} />
        <text x="139" y="114" textAnchor="middle" fontSize="9" fontWeight="600" style={{ fill: "var(--ant-color-text-secondary)" }}>
          A
        </text>
        <text x="172" y="114" textAnchor="middle" fontSize="9" style={{ fill: "var(--ant-color-text-tertiary)" }}>
          Lifts
        </text>
        <text x="205" y="114" textAnchor="middle" fontSize="9" fontWeight="600" style={{ fill: "var(--ant-color-text-secondary)" }}>
          B
        </text>

        {/* Egress arrows to both stairs, only on the alarm floor. */}
        {alarmFloor ? (
          <g fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: "var(--ios-green)" }}>
            {["M300 76 H240 V110 H218", "M300 146 H240 V120 H218", "M46 146 H110 V120 H126", "M46 76 H110 V100 H126"].map((d) => (
              <motion.path
                key={d}
                d={d}
                strokeDasharray="3 6"
                initial={{ strokeDashoffset: 18, opacity: 0 }}
                animate={{ strokeDashoffset: 0, opacity: 0.75 }}
                transition={{ strokeDashoffset: { duration: 0.9, repeat: Infinity, ease: "linear" }, opacity: { duration: 0.4 } }}
              />
            ))}
          </g>
        ) : null}

        <AnimatePresence mode="wait">
          <motion.g key={floor} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }}>
            {DEVICES.map((d, i) => (
              <Device
                key={d.id}
                d={d}
                state={reads[d.id].state}
                active={d.kind === "horn" && NAC_FLOORS.includes(floor)}
                alarmFloor={alarmFloor}
                hovered={hover === d.id}
                smoke={smokeId}
                delay={delay + 0.2 + i * 0.025}
                onHover={() => setHover(d.id)}
              />
            ))}
          </motion.g>
        </AnimatePresence>
      </svg>

      <div className="mt-2 flex h-[16px] items-center gap-3 whitespace-nowrap text-[11px] text-tertiary">
        {(["smoke", "heat", "pull", "horn"] as Kind[]).map((k) => (
          <span key={k} className="flex items-center gap-1">
            <svg viewBox="-7 -7 14 14" className="size-3" aria-hidden>
              <Shape kind={k} fill="var(--widget-surface)" stroke="var(--ant-color-text-tertiary)" />
            </svg>
            {k === "horn" ? "Horn/strobe" : k === "pull" ? "Pull" : KIND_LABEL[k]}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-1">
          <LiveDot color={alarmFloor ? "var(--ios-red)" : "var(--ios-green)"} ping />
          Live
        </span>
      </div>
    </Widget>
  );
}

function Shape({ kind, fill, stroke }: { kind: Kind; fill: string; stroke: string }) {
  const st = { fill, stroke, strokeWidth: 1.4 };
  if (kind === "heat") return <polygon points="0,-6 5.2,-3 5.2,3 0,6 -5.2,3 -5.2,-3" style={st} />;
  if (kind === "pull") return <rect x="-4.8" y="-4.8" width="9.6" height="9.6" rx="1.8" style={st} />;
  if (kind === "horn") return <polygon points="0,-5.6 5.4,4.4 -5.4,4.4" strokeLinejoin="round" style={st} />;
  return (
    <>
      <circle r="5.4" style={st} />
      <circle r="1.6" style={{ fill: stroke }} />
    </>
  );
}

function Device({
  d,
  state,
  active,
  alarmFloor,
  hovered,
  smoke,
  delay,
  onHover,
}: {
  d: Dev;
  state: State;
  active: boolean;
  alarmFloor: boolean;
  hovered: boolean;
  smoke: string;
  delay: number;
  onHover: () => void;
}) {
  const c = COLOR[state];
  const abnormal = state !== "normal";
  return (
    <g transform={`translate(${d.x} ${d.y})`} onMouseEnter={onHover} style={{ cursor: "pointer" }}>
      {state === "alarm" ? (
        <>
          <motion.circle
            r="22"
            fill={`url(#${smoke})`}
            animate={{ scale: [0.85, 1.2, 0.85], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          {[0, 1].map((k) => (
            <motion.circle
              key={k}
              r="6"
              fill="none"
              strokeWidth="1.5"
              style={{ stroke: c }}
              animate={{ scale: [1, 3], opacity: [0.8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: k * 0.8, ease: "easeOut" }}
            />
          ))}
        </>
      ) : null}
      {active ? (
        <motion.circle
          r="9"
          style={{ fill: alarmFloor ? "var(--ios-red)" : "var(--ios-orange)" }}
          animate={{ opacity: [0, alarmFloor ? 0.3 : 0.18, 0] }}
          transition={{ duration: alarmFloor ? 0.9 : 1.8, repeat: Infinity }}
        />
      ) : null}
      <rect x="-11" y="-11" width="22" height="22" fill="transparent" />
      <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 420, damping: 20, delay }}>
        <motion.g animate={{ scale: hovered ? 1.35 : 1 }} transition={{ type: "spring", stiffness: 500, damping: 22 }}>
        <Shape
          kind={d.kind}
          fill={abnormal ? c : "var(--widget-surface)"}
          stroke={abnormal ? c : hovered ? "var(--ant-color-text)" : "var(--ant-color-text-secondary)"}
        />
        {abnormal && d.kind === "smoke" ? <circle r="1.6" style={{ fill: "var(--widget-surface)" }} /> : null}
        </motion.g>
      </motion.g>
    </g>
  );
}
