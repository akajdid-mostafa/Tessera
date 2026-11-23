import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type PartId = "oad" | "flt" | "hc" | "cc" | "fan" | "sat";
type Live = { hz: number; sat: number; dp: number; ccv: number; oa: number; sp: number; damper: number };

const PARTS: { id: PartId; x: number; name: string }[] = [
  { id: "oad", x: 40, name: "OA damper" },
  { id: "flt", x: 84, name: "Filter" },
  { id: "hc", x: 122, name: "Heat" },
  { id: "cc", x: 154, name: "Cool" },
  { id: "fan", x: 210, name: "Fan" },
  { id: "sat", x: 270, name: "Supply" },
];

const FILTER_LIMIT = 250;
const TEXT = "var(--ant-color-text)";
const MUTED = "var(--ant-color-text-tertiary)";
const FAINT = "var(--ant-color-text-tertiary)";

/** Building · medium. AHU-2 drawn as a duct: the fan spins at its VFD speed, air dashes through, the damper swings to position, and the dirty filter flashes amber; hover a component to read it. */
export function AhuSchematicWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [sel, setSel] = useState<PartId | null>(null);
  const [v, setV] = useState<Live>({ hz: 44.1, sat: 13.1, dp: 266, ccv: 42, oa: 8.4, sp: 375, damper: 35 });

  useEffect(() => {
    const t = window.setInterval(() => {
      setV((p) => ({
        ...p,
        hz: +Math.min(46, Math.max(42.5, p.hz + (Math.random() - 0.5) * 0.8)).toFixed(1),
        sat: +Math.min(13.6, Math.max(12.6, p.sat + (Math.random() - 0.5) * 0.2)).toFixed(1),
        dp: Math.min(274, p.dp + (Math.random() < 0.4 ? 1 : 0)),
        ccv: Math.round(Math.min(48, Math.max(38, p.ccv + (Math.random() - 0.5) * 3))),
        sp: Math.round(Math.min(388, Math.max(362, p.sp + (Math.random() - 0.5) * 8))),
      }));
    }, 2200);
    return () => window.clearInterval(t);
  }, []);

  const dirty = v.dp > FILTER_LIMIT;
  const delay = 0.3 + (index ?? 0) * 0.06;
  const spin = 52 / v.hz;

  const label: Record<PartId, string> = {
    oad: `${v.damper}%`,
    flt: `${v.dp} Pa`,
    hc: "0%",
    cc: `${v.ccv}%`,
    fan: `${v.hz.toFixed(1)} Hz`,
    sat: `${v.sat.toFixed(1)}°`,
  };

  return (
    <Widget size="medium" index={index} label="Air handling unit">
      <WidgetHeader
        icon={<FanGlyph />}
        tint="var(--ios-blue)"
        title="AHU-2 · Levels 3–5"
        subtitle="Occupied · Auto"
        extra={
          <div className="text-right leading-tight">
            <div className="text-[11px] text-tertiary">Supply air</div>
            <div className="text-[17px] font-semibold text-heading">
              <AnimatedNumber value={v.sat} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} suffix="°C" />
            </div>
          </div>
        }
      />

      <svg viewBox="0 0 320 66" className="mt-1.5 w-full overflow-visible" onMouseLeave={() => setSel(null)}>
        {/* Duct body and the air moving through it. */}
        <rect x="14" y="20" width="290" height="26" rx="6" style={{ fill: "var(--ant-color-fill-quaternary)", stroke: "var(--ant-color-split)" }} />
        <motion.line
          x1="18"
          x2="300"
          y1="33"
          y2="33"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="2 10"
          style={{ stroke: FAINT }}
          animate={reduce ? undefined : { strokeDashoffset: [0, -24] }}
          transition={{ duration: spin * 1.1, repeat: Infinity, ease: "linear" }}
        />
        <path d="M2 33h9m-3-3 3 3-3 3" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: MUTED }} />
        <path d="M306 33h10m-3-3 3 3-3 3" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: MUTED }} />

        {PARTS.map((p, i) => {
          const dim = sel !== null && sel !== p.id;
          const warn = p.id === "flt" && dirty;
          return (
            <motion.g
              key={p.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: dim ? 0.35 : 1, y: 0 }}
              transition={{ delay: sel === null ? delay + i * 0.07 : 0, duration: 0.35 }}
              onMouseEnter={() => setSel(p.id)}
              onClick={() => setSel((s) => (s === p.id ? null : p.id))}
              style={{ cursor: "pointer" }}
            >
              <rect x={p.x - 17} y="0" width="34" height="66" fill="transparent" />
              <text
                x={p.x}
                y="12"
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                style={{ fill: warn ? "var(--ios-orange)" : TEXT, fontVariantNumeric: "tabular-nums" }}
              >
                {label[p.id]}
              </text>
              <text x={p.x} y="61" textAnchor="middle" fontSize="9" style={{ fill: sel === p.id ? TEXT : MUTED }}>
                {p.name}
              </text>
              <Part id={p.id} x={p.x} v={v} spin={spin} dirty={dirty} reduce={!!reduce} delay={delay} />
            </motion.g>
          );
        })}
      </svg>

      <div className="mt-auto flex h-[22px] items-center gap-2 text-[12px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={sel ?? "all"}
            initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="flex min-w-0 flex-1 items-center gap-2 whitespace-nowrap"
          >
            <Readout sel={sel} v={v} dirty={dirty} />
          </motion.div>
        </AnimatePresence>
      </div>
    </Widget>
  );
}

function Readout({ sel, v, dirty }: { sel: PartId | null; v: Live; dirty: boolean }) {
  const rows: Record<PartId | "all", { name: string; detail: string; pill: string; tone: "ok" | "warn" | "info" | "idle" }> = {
    all: dirty
      ? { name: "1 maintenance flag", detail: `Filter ΔP ${v.dp} Pa`, pill: "Change filter", tone: "warn" }
      : { name: "All points normal", detail: `Static ${v.sp} Pa`, pill: "Running", tone: "ok" },
    oad: { name: "OA damper", detail: `${v.damper}% open · OA ${v.oa.toFixed(1)}°C · min 20%`, pill: "Min OA", tone: "idle" },
    flt: { name: "Filter bank", detail: `ΔP ${v.dp} Pa · change at ${FILTER_LIMIT} Pa`, pill: dirty ? "Change due" : "OK", tone: dirty ? "warn" : "ok" },
    hc: { name: "Heating coil", detail: "Valve 0% · HW 62°C", pill: "Idle", tone: "idle" },
    cc: { name: "Cooling coil", detail: `Valve ${v.ccv}% · CHW 6.7°C`, pill: "Cooling", tone: "info" },
    fan: { name: "Supply fan", detail: `${Math.round((v.hz / 60) * 100)}% VFD · ${v.sp} Pa static`, pill: "Running", tone: "ok" },
    sat: { name: "Supply air", detail: `${v.sat.toFixed(1)}°C · SP 13.0 ± 1.0`, pill: "In band", tone: "ok" },
  };
  const r = rows[sel ?? "all"];
  return (
    <>
      <span className="shrink-0 font-semibold text-heading">{r.name}</span>
      <span className="min-w-0 flex-1 truncate text-[11px] text-tertiary tabular">{r.detail}</span>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
          r.tone === "warn" && "bg-ios-orange/15 text-ios-orange",
          r.tone === "info" && "bg-ios-blue/15 text-ios-blue",
          r.tone === "ok" && "bg-fill-secondary text-secondary",
          r.tone === "idle" && "bg-fill-tertiary text-tertiary",
        )}
      >
        {r.pill}
      </span>
    </>
  );
}

function Part({
  id,
  x,
  v,
  spin,
  dirty,
  reduce,
  delay,
}: {
  id: PartId;
  x: number;
  v: Live;
  spin: number;
  dirty: boolean;
  reduce: boolean;
  delay: number;
}) {
  if (id === "oad") {
    // Blades lie flat when fully open, stand across the duct when closed.
    const angle = (1 - v.damper / 100) * 80;
    return (
      <g>
        <rect x={x - 9} y="21" width="18" height="24" fill="none" style={{ stroke: FAINT }} />
        {[26, 33, 40].map((cy) => (
          <motion.line
            key={cy}
            x1={x - 6}
            x2={x + 6}
            y1={cy}
            y2={cy}
            strokeWidth="2"
            strokeLinecap="round"
            style={{ stroke: TEXT }}
            initial={{ rotate: 90 }}
            animate={{ rotate: angle }}
            transition={{ type: "spring", stiffness: 60, damping: 12, delay: delay + 0.3 }}
          />
        ))}
      </g>
    );
  }
  if (id === "flt") {
    const pts = Array.from({ length: 9 }, (_, i) => `${i % 2 ? x + 5 : x - 5},${21 + i * 3}`).join(" ");
    return (
      <motion.polyline
        points={pts}
        fill="none"
        strokeWidth="1.5"
        strokeLinejoin="round"
        style={{ stroke: dirty ? "var(--ios-orange)" : MUTED }}
        animate={dirty && !reduce ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
        transition={dirty ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : undefined}
      />
    );
  }
  if (id === "hc" || id === "cc") {
    const active = id === "cc";
    return (
      <g>
        <rect x={x - 8} y="21" width="16" height="24" rx="2" fill="none" style={{ stroke: FAINT }} />
        {[-4.5, -1.5, 1.5, 4.5].map((dx) => (
          <line
            key={dx}
            x1={x + dx}
            x2={x + dx}
            y1="23"
            y2="43"
            strokeWidth="1.5"
            style={{
              stroke: active ? "var(--ios-blue)" : FAINT,
              opacity: active ? 0.45 + (v.ccv / 100) * 0.9 : 1,
            }}
          />
        ))}
      </g>
    );
  }
  if (id === "fan") {
    return (
      <g>
        <circle cx={x} cy="33" r="11.5" style={{ fill: "var(--widget-surface)", stroke: MUTED }} strokeWidth="1.25" />
        <g transform={`translate(${x} 33)`}>
          <g
            className={reduce ? undefined : "animate-spin"}
            style={{ animationDuration: `${spin}s`, transformBox: "fill-box", transformOrigin: "center" }}
          >
            {[0, 90, 180, 270].map((a) => (
              <path key={a} d="M0 0C1.5-4.5 5.5-8 8.5-6.5 9.5-3.5 5-1 0 0Z" transform={`rotate(${a})`} style={{ fill: TEXT }} />
            ))}
          </g>
          <circle r="1.6" style={{ fill: "var(--widget-surface)" }} />
        </g>
      </g>
    );
  }
  return (
    <g>
      <line x1={x} x2={x} y1="21" y2="33" strokeWidth="1.5" style={{ stroke: MUTED }} />
      <circle cx={x} cy="33" r="3.5" style={{ fill: "var(--ios-green)" }} />
      <motion.circle
        cx={x}
        cy="33"
        r="3.5"
        fill="none"
        strokeWidth="1"
        style={{ stroke: "var(--ios-green)" }}
        initial={{ r: 3.5, opacity: 0.7 }}
        animate={reduce ? undefined : { r: [3.5, 9], opacity: [0.7, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
      />
    </g>
  );
}

/** A four-blade fan for the header chip. */
function FanGlyph() {
  return (
    <svg viewBox="-10 -10 20 20" width="1em" height="1em" aria-hidden>
      {[0, 90, 180, 270].map((a) => (
        <path key={a} d="M0 0C1.5-4.5 5.5-8 8.5-6.5 9.5-3.5 5-1 0 0Z" transform={`rotate(${a})`} fill="currentColor" />
      ))}
      <circle r="1.6" fill="currentColor" />
    </svg>
  );
}
