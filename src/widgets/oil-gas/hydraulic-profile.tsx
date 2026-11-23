import { Checkmark16Filled, Pipeline20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { AnimatedNumber, type AnimatedNumberProps } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { AlarmMark, enterDelay, useInterval } from "./_parts";

type Units = "SI" | "US";
type Kind = "pump" | "valve" | "terminal";
type Station = { id: string; name: string; km: number; kind: Kind; temp: number };

const LENGTH_KM = 186;
const MAOP = 99; // bar
const PAH = MAOP * 0.95; // high-pressure alarm
const FLOW_M3H = 4_240;
const PSI = 14.5038;
const BBL = 6.28981;

const STATIONS: Station[] = [
  { id: "midland", name: "Midland PS", km: 0, kind: "pump", temp: 31 },
  { id: "mlv104", name: "MLV-104", km: 44, kind: "valve", temp: 32 },
  { id: "stanton", name: "Stanton PS", km: 79, kind: "pump", temp: 33 },
  { id: "mlv122", name: "MLV-122", km: 128, kind: "valve", temp: 31 },
  { id: "crane", name: "Crane Tml", km: 186, kind: "terminal", temp: 29 },
];

/** Ground elevation along the right-of-way, metres. */
const elev = (km: number) => 872 - km * 0.45 + 28 * Math.sin(km / 23) + 12 * Math.cos(km / 9);

/** Two pumped segments: discharge decays by friction, bent by the terrain (crude ≈ 0.083 bar/m). */
const SEGMENTS = [
  { from: 0, to: 79, p0: 86.4, p1: 28.6, n: 12 },
  { from: 79, to: 186, p0: 94.6, p1: 6.8, n: 15 },
];
const BASE = SEGMENTS.flatMap((s) =>
  Array.from({ length: s.n }, (_, i) => {
    const km = s.from + ((s.to - s.from) * i) / (s.n - 1);
    const t = (km - s.from) / (s.to - s.from);
    const chord = elev(s.from) + (elev(s.to) - elev(s.from)) * t;
    return { km, p: s.p0 + (s.p1 - s.p0) * t - (elev(km) - chord) * 0.083 };
  }),
);
const STANTON_OUT = SEGMENTS[0].n; // index of Stanton discharge in BASE

const W = 340;
const H = 130;
const P_MAX = 110;
const X = (km: number) => (km / LENGTH_KM) * W;
const Y = (p: number) => H - (p / P_MAX) * H;
const YE = (e: number) => H - ((e - 700) / 300) * 40;

const ELEV_D = (() => {
  const pts = Array.from({ length: 32 }, (_, i) => (LENGTH_KM * i) / 31);
  return `M0 ${H} ${pts.map((km) => `L${X(km).toFixed(1)} ${YE(elev(km)).toFixed(1)}`).join(" ")} L${W} ${H}Z`;
})();

/** Pressure at a km on the live profile (the downstream segment owns a station's km). */
function pressureAt(profile: { km: number; p: number }[], km: number) {
  for (let i = profile.length - 1; i > 0; i--) {
    const a = profile[i - 1];
    const b = profile[i];
    if (km >= a.km && km <= b.km && b.km > a.km) return a.p + ((b.p - a.p) * (km - a.km)) / (b.km - a.km);
  }
  return profile[0].p;
}

function NodeGlyph({ kind, active }: { kind: Kind; active: boolean }) {
  const ink = active ? "var(--ant-color-text)" : "var(--ant-color-text-secondary)";
  if (kind === "valve")
    return (
      <svg viewBox="0 0 16 12" width="16" height="12" aria-hidden>
        <path d="M2 1.5 8 6 2 10.5Z M14 1.5 8 6 14 10.5Z" fill="var(--widget-surface)" stroke={ink} strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    );
  if (kind === "terminal")
    return (
      <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden>
        <rect x="1.5" y="1.5" width="11" height="11" rx="2" fill="var(--widget-surface)" stroke={ink} strokeWidth="1.4" />
      </svg>
    );
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
      <circle cx="8" cy="8" r="6.5" fill="var(--widget-surface)" stroke={ink} strokeWidth="1.4" />
      <path d="M5.5 4.8 11.5 8 5.5 11.2Z" fill={ink} />
    </svg>
  );
}

/** Oil & gas · large. A crude line's hydraulic profile over terrain against MAOP: the pressure line breathes with each scan, Stanton's discharge holds a flashing high alarm until acknowledged, tap any station for its readings. */
export function HydraulicProfileWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [units, setUnits] = useState<Units>("SI");
  const [selected, setSelected] = useState("stanton");
  const [acked, setAcked] = useState(false);
  const [noise, setNoise] = useState<number[]>(() => BASE.map(() => 0));
  const delay = enterDelay(index);

  useInterval(() => setNoise(BASE.map(() => (Math.random() - 0.5) * 0.8)), 3000);

  const profile = useMemo(() => BASE.map((b, i) => ({ km: b.km, p: b.p + noise[i] })), [noise]);
  const d = profile.map((pt, i) => `${i ? "L" : "M"}${X(pt.km).toFixed(1)} ${Y(pt.p).toFixed(1)}`).join(" ");
  const area = `${d} L${W} ${H} L0 ${H}Z`;
  const stantonOut = profile[STANTON_OUT].p;
  const alarm = stantonOut >= PAH;

  const si = units === "SI";
  const pr = (bar: number) => (si ? bar : bar * PSI);
  const prFmt = si ? { minimumFractionDigits: 1, maximumFractionDigits: 1 } : { maximumFractionDigits: 0 };
  const prUnit = si ? "bar" : "psi";
  const flow = si ? FLOW_M3H : FLOW_M3H * BBL;
  const flowUnit = si ? "m³/h" : "bbl/h";

  const st = STATIONS.find((s) => s.id === selected) ?? STATIONS[2];
  const stIndex = STATIONS.indexOf(st);
  const isStanton = st.id === "stanton";
  // Pump stations show suction and discharge; everything else one line pressure.
  const suction = st.id === "stanton" ? profile[STANTON_OUT - 1].p : st.id === "midland" ? 3.2 : null;
  const linePress = st.id === "stanton" ? stantonOut : pressureAt(profile, st.km);
  const stats: { label: string; value: number; unit: string; format?: AnimatedNumberProps["format"]; warn?: boolean }[] = [
    suction !== null
      ? { label: "Suction", value: pr(suction), unit: prUnit, format: prFmt }
      : { label: st.kind === "terminal" ? "Arrival" : "Line", value: pr(linePress), unit: prUnit, format: prFmt },
    suction !== null
      ? { label: "Discharge", value: pr(linePress), unit: prUnit, format: prFmt, warn: isStanton && alarm }
      : { label: "Flow", value: Math.round(flow - stIndex * 4), unit: flowUnit },
    {
      label: "MAOP",
      value: linePress / MAOP,
      unit: "",
      format: { style: "percent", maximumFractionDigits: 1, minimumFractionDigits: 1 },
      warn: isStanton && alarm,
    },
  ];

  return (
    <Widget size="large" index={index} label="Pipeline hydraulic profile">
      <WidgetHeader
        icon={<Pipeline20Filled />}
        tint={alarm && !acked ? "var(--ios-orange)" : "var(--ios-teal)"}
        title="Line 3 · Crude"
        subtitle="Midland → Crane · 186 km · 24″"
        extra={<Segmented size="small" value={units} onChange={(v) => setUnits(v as Units)} options={["SI", "US"]} />}
      />

      <div className="mt-3 flex items-baseline-last justify-between whitespace-nowrap">
        <div className="leading-none">
          <AnimatedNumber value={Math.round(flow)} className="text-[30px] font-semibold tracking-tight text-heading" />
          <span className="text-[12px] font-medium text-tertiary"> {flowUnit}</span>
          <div className="mt-1 text-[11px] text-tertiary">Throughput · batch WTI-2611</div>
        </div>
        <div className="text-right text-[11px] leading-tight">
          <div className="font-semibold text-secondary tabular">−0.04%</div>
          <div className="text-tertiary">Line balance · 1 h</div>
        </div>
      </div>

      {/* Profile: terrain silhouette, MAOP and its 95% alarm band, the live pressure line. */}
      <div className="relative mt-2 h-[110px]">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id={`hp-fill-${index ?? 0}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ant-color-text)" stopOpacity="0.1" />
              <stop offset="100%" stopColor="var(--ant-color-text)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={ELEV_D} className="fill-fill-tertiary" />
          <rect x="0" width={W} y={Y(MAOP)} height={Y(PAH) - Y(MAOP)} fill="color-mix(in srgb, var(--ios-orange) 16%, transparent)" />
          <line x1="0" x2={W} y1={Y(MAOP)} y2={Y(MAOP)} strokeDasharray="4 3" strokeWidth="1" vectorEffect="non-scaling-stroke" className="stroke-tertiary" />
          <motion.path d={area}
            fill={`url(#hp-fill-${index ?? 0})`}
            initial={{ d: area, opacity: 0 }}
            animate={{ opacity: 1, d: area }}
            transition={{ opacity: { delay: delay + 0.6, duration: 0.8 }, d: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }}
          />
          <motion.path d={d}
            fill="none"
            stroke="var(--ant-color-text)"
            strokeWidth="2"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={{ d: d, opacity: 0 }}
            animate={{ opacity: 1, d }}
            transition={{ opacity: { duration: 1.4, delay, ease: [0.22, 1, 0.36, 1] }, d: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }}
          />
          <line
            x1={X(st.km)}
            x2={X(st.km)}
            y1="0"
            y2={H}
            strokeDasharray="2 3"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            className="stroke-quaternary transition-all duration-300"
          />
        </svg>
        <span className="pointer-events-none absolute right-0 text-[9px] font-medium text-tertiary" style={{ top: `calc(${(Y(MAOP) / H) * 100}% - 12px)` }}>
          MAOP {si ? "99 bar" : "1,436 psi"}
        </span>
        <span className="pointer-events-none absolute bottom-0.5 left-0.5 text-[9px] text-tertiary">Elevation</span>

        {/* Stanton discharge: the point that is in alarm. */}
        <span
          className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 transition-[top] duration-700"
          style={{ left: `${(79 / LENGTH_KM) * 100}%`, top: `${(Y(stantonOut) / H) * 100}%` }}
        >
          {alarm && !acked && !reduce ? (
            <motion.span
              className="absolute inset-0 rounded-full bg-ios-orange"
              animate={{ scale: [1, 2.8], opacity: [0.6, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
            />
          ) : null}
          <span className={cn("absolute inset-0 rounded-full ring-2 ring-[var(--widget-surface)]", alarm ? "bg-ios-orange" : "bg-heading")} />
        </span>
      </div>

      {/* The line itself: flow moves west to east, stations are the controls. */}
      <div className="relative mt-1.5 h-[34px]">
        <svg viewBox={`0 0 ${W} 4`} preserveAspectRatio="none" className="absolute inset-x-0 top-[6px] h-1 w-full" aria-hidden>
          <line x1="0" x2={W} y1="2" y2="2" strokeWidth="4" vectorEffect="non-scaling-stroke" className="stroke-fill-secondary" />
          <motion.line
            x1="0"
            x2={W}
            y1="2"
            y2="2"
            strokeWidth="2"
            strokeDasharray="2 10"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            className="stroke-tertiary"
            animate={reduce ? undefined : { strokeDashoffset: [0, -24] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
        </svg>
        {STATIONS.map((s, i) => {
          const active = s.id === selected;
          const left = (s.km / LENGTH_KM) * 100;
          const align = i === 0 ? "items-start" : i === STATIONS.length - 1 ? "items-end" : "items-center";
          const shift = i === 0 ? "translate-x-0" : i === STATIONS.length - 1 ? "-translate-x-full" : "-translate-x-1/2";
          return (
            <motion.button
              key={s.id}
              type="button"
              onClick={() => setSelected(s.id)}
              aria-pressed={active}
              className={cn("absolute top-0 flex cursor-pointer flex-col gap-0.5 outline-none", align, shift)}
              style={{ left: `${left}%` }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0, scale: active ? 1.08 : 1 }}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 24, opacity: { delay: delay + 0.2 + i * 0.08 } }}
            >
              <span className="grid h-4 place-items-center">
                <NodeGlyph kind={s.kind} active={active} />
              </span>
              <span className={cn("text-[10px] whitespace-nowrap", active ? "font-semibold text-heading" : "text-tertiary")}>{s.name}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-auto rounded-2xl bg-fill-quaternary px-3 py-2">
        <div className="flex h-6 items-center gap-1.5 whitespace-nowrap">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={st.id}
              className="flex min-w-0 items-baseline gap-1.5"
              initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(3px)" }}
            >
              <span className="truncate text-[13px] font-semibold text-heading">{st.name}</span>
              <span className="text-[11px] text-tertiary tabular">
                KP {st.km} · {si ? `${st.temp} °C` : `${Math.round(st.temp * 1.8 + 32)} °F`}
                {st.kind === "valve" ? " · OPEN · R" : st.kind === "terminal" ? " · to TK-104" : ""}
              </span>
            </motion.div>
          </AnimatePresence>
          {isStanton && alarm ? (
            <div className="ml-auto flex items-center gap-1.5">
              <AlarmMark priority={2} flashing={!acked} size={16} />
              {acked ? (
                <span className="flex items-center gap-0.5 text-[11px] font-medium text-tertiary">
                  <Checkmark16Filled className="size-3.5" /> PAH acked
                </span>
              ) : (
                <Button size="small" color="orange" variant="filled" onClick={() => setAcked(true)}>
                  Ack PAH
                </Button>
              )}
            </div>
          ) : null}
        </div>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="min-w-0 leading-tight whitespace-nowrap">
              <div className="text-[10px] text-tertiary">{s.label}</div>
              <div className={cn("text-[15px] font-semibold", s.warn ? "text-ios-orange" : "text-heading")}>
                <AnimatedNumber value={s.value} format={s.format} />
                {s.unit ? <span className="text-[10px] font-medium text-tertiary"> {s.unit}</span> : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Widget>
  );
}
