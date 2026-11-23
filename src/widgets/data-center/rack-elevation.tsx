import { Lightbulb16Filled, Server20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Status = "ok" | "warn" | "crit";
type Kind = "switch" | "patch" | "server" | "gpu" | "storage";
type Device = {
  id: string;
  top: number;
  u: number;
  kind: Kind;
  model: string;
  watts: number;
  inlet: number;
  status: Status;
  note?: string;
};

const DEVICES: Device[] = [
  { id: "sw-tor-a", top: 42, u: 1, kind: "switch", model: "Arista 7050SX3", watts: 182, inlet: 22.4, status: "ok" },
  { id: "sw-tor-b", top: 41, u: 1, kind: "switch", model: "Arista 7050SX3", watts: 176, inlet: 22.6, status: "ok" },
  { id: "patch-40", top: 40, u: 1, kind: "patch", model: "24-port LC patch", watts: 0, inlet: 0, status: "ok" },
  { id: "db-01", top: 37, u: 2, kind: "server", model: "Dell R760", watts: 612, inlet: 23.1, status: "ok" },
  { id: "db-02", top: 35, u: 2, kind: "server", model: "Dell R760", watts: 588, inlet: 23.4, status: "warn", note: "Fan 3 slow" },
  { id: "app-07", top: 31, u: 1, kind: "server", model: "Dell R660", watts: 342, inlet: 23.8, status: "ok" },
  { id: "app-08", top: 30, u: 1, kind: "server", model: "Dell R660", watts: 351, inlet: 23.9, status: "ok" },
  { id: "app-09", top: 29, u: 1, kind: "server", model: "Dell R660", watts: 186, inlet: 24.1, status: "crit", note: "PSU 2 lost" },
  { id: "gpu-01", top: 25, u: 4, kind: "gpu", model: "Supermicro SYS-421GE", watts: 2860, inlet: 24.6, status: "ok" },
  { id: "nas-01", top: 17, u: 4, kind: "storage", model: "NetApp AFF A400", watts: 690, inlet: 22.9, status: "ok" },
];
const LISTED = DEVICES.filter((d) => d.kind !== "patch");
const BUDGET_KW = 12;
const RACK_U = 42;
const U = 6.8;
const PAD = 6;
const RACK_H = RACK_U * U + PAD * 2;
const X0 = 10;
const DW = 92;
const yOf = (top: number) => PAD + (RACK_U - top) * U;

const LED: Record<Status, string> = { ok: "fill-ios-green", warn: "fill-ios-yellow", crit: "fill-ios-red" };
const PILL: Record<Exclude<Status, "ok">, string> = {
  warn: "bg-ios-yellow/15 text-ios-yellow",
  crit: "bg-ios-red/15 text-ios-red",
};
const uRange = (d: Device) => (d.u === 1 ? `U${d.top}` : `U${d.top - d.u + 1}–${d.top}`);

/** Data center · large. A 42U rack elevation linked to its device list: hover either to lift a device out, tap to pin it, and blink its locate LED. */
export function RackElevationWidget({ index }: { index?: number }) {
  const [watts, setWatts] = useState(() => Object.fromEntries(DEVICES.map((d) => [d.id, d.watts])) as Record<string, number>);
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState("app-09");
  const [located, setLocated] = useState<string | null>(null);
  const [racked, setRacked] = useState(false);

  useEffect(() => {
    const t = window.setInterval(() => {
      setWatts((w) =>
        Object.fromEntries(
          DEVICES.map((d) => [d.id, d.watts ? Math.round(d.watts * (1 + (Math.random() - 0.5) * (d.kind === "gpu" ? 0.12 : 0.05))) : 0]),
        ) as Record<string, number>,
      );
    }, 2800);
    const r = window.setTimeout(() => setRacked(true), 1600 + (index ?? 0) * 60);
    return () => {
      window.clearInterval(t);
      window.clearTimeout(r);
    };
  }, [index]);

  const focusId = hover ?? pinned;
  const focus = DEVICES.find((d) => d.id === focusId)!;
  const totalKw = Object.values(watts).reduce((a, b) => a + b, 0) / 1000;
  const usedU = DEVICES.reduce((a, d) => a + d.u, 0);
  const delay = 0.3 + (index ?? 0) * 0.06;

  return (
    <Widget size="large" index={index} label="Rack elevation">
      <WidgetHeader
        icon={<Server20Filled />}
        tint="var(--ios-indigo)"
        title="Rack C14"
        subtitle={`Hall 2 · Row C · ${usedU}/${RACK_U}U used`}
        extra={
          <div className="text-right leading-none whitespace-nowrap">
            <div className="text-[11px] text-tertiary">Power</div>
            <div className="mt-1 text-[17px] font-semibold tracking-tight text-heading">
              <AnimatedNumber value={totalKw} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
              <span className="text-[12px] font-medium text-tertiary"> / {BUDGET_KW} kW</span>
            </div>
          </div>
        }
      />

      <div className="mt-2.5 flex min-h-0 flex-1 gap-3">
        <svg
          viewBox={`0 0 112 ${RACK_H}`}
          width={112}
          height={RACK_H}
          className="shrink-0 overflow-visible"
          aria-label="Rack elevation, 42U"
          onMouseLeave={() => setHover(null)}
        >
          <rect x={0.5} y={0.5} width={111} height={RACK_H - 1} rx={6} strokeWidth={1} className="fill-fill-quaternary stroke-fill-secondary" />
          {/* U grid */}
          {Array.from({ length: RACK_U + 1 }, (_, i) => (
            <line key={i} x1={X0} x2={X0 + DW} y1={PAD + i * U} y2={PAD + i * U} strokeWidth={0.6} className="stroke-fill-tertiary" />
          ))}
          {/* PDU A / B strips */}
          {[3, 104].map((px) => (
            <g key={px}>
              <rect x={px} y={PAD} width={5} height={RACK_U * U} rx={2} className="fill-fill-secondary" />
              {Array.from({ length: 14 }, (_, i) => (
                <circle key={i} cx={px + 2.5} cy={PAD + 8 + i * 20.2} r={1} className="fill-tertiary" opacity={0.6} />
              ))}
            </g>
          ))}

          {DEVICES.map((d, i) => {
            const y = yOf(d.top);
            const h = d.u * U - 1;
            const on = d.id === focusId;
            return (
              <motion.g
                key={d.id}
                onMouseEnter={() => d.kind !== "patch" && setHover(d.id)}
                onClick={() => d.kind !== "patch" && setPinned(d.id)}
                className={d.kind === "patch" ? undefined : "cursor-pointer"}
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: on ? 5 : 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 24, delay: racked ? 0 : delay + i * 0.06 }}
              >
                <rect
                  x={X0}
                  y={y + 0.5}
                  width={DW}
                  height={h}
                  rx={1.6}
                  strokeWidth={on ? 1 : 0.8}
                  className={cn(
                    "transition-colors duration-mid",
                    on ? "fill-fill" : "fill-fill-secondary",
                    d.status === "crit" ? "stroke-ios-red" : on ? "stroke-secondary" : "stroke-transparent",
                  )}
                />
                <Faceplate d={d} y={y + 0.5} h={h} />
                {d.kind !== "patch" ? (
                  <>
                    {d.status === "crit" ? (
                      <motion.circle
                        cx={X0 + DW - 4}
                        cy={y + 3.8}
                        r={1.7}
                        className={LED.crit}
                        animate={{ opacity: [1, 0.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    ) : (
                      <circle cx={X0 + DW - 4} cy={y + 3.8} r={1.5} className={LED[d.status]} />
                    )}
                    <motion.circle
                      cx={X0 + DW - 9}
                      cy={y + 3.8}
                      r={1.5}
                      className={located === d.id ? "fill-ios-blue" : "fill-fill"}
                      animate={located === d.id ? { opacity: [1, 0.25, 1] } : { opacity: 1 }}
                      transition={located === d.id ? { duration: 0.8, repeat: Infinity } : undefined}
                    />
                  </>
                ) : null}
              </motion.g>
            );
          })}
        </svg>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-col" onMouseLeave={() => setHover(null)}>
            {LISTED.map((d, i) => {
              const on = d.id === focusId;
              return (
                <motion.button
                  key={d.id}
                  type="button"
                  onMouseEnter={() => setHover(d.id)}
                  onFocus={() => setHover(d.id)}
                  onClick={() => setPinned(d.id)}
                  className="relative flex h-[26px] cursor-pointer items-center gap-2 rounded-lg px-1.5 text-left outline-none"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.2 + i * 0.04, type: "spring", stiffness: 300, damping: 26 }}
                >
                  {on ? (
                    <motion.span
                      layoutId={`rack-row-${index ?? 0}`}
                      className="absolute inset-0 rounded-lg bg-fill-tertiary"
                      transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative size-1.5 shrink-0 rounded-full",
                      d.status === "crit" ? "bg-ios-red animate-pulse" : d.status === "warn" ? "bg-ios-yellow" : "bg-fill",
                    )}
                  />
                  <span className="relative min-w-0 flex-1 truncate text-[12px] leading-none font-medium text-heading">
                    {d.id}
                    <span className="ml-1 text-[10px] font-normal text-tertiary tabular">{uRange(d)}</span>
                  </span>
                  {d.status !== "ok" ? (
                    <span className={cn("relative rounded-full px-1.5 py-px text-[9px] font-semibold whitespace-nowrap", PILL[d.status])}>
                      {d.note}
                    </span>
                  ) : (
                    <span className="relative text-[11px] text-secondary tabular whitespace-nowrap">
                      <AnimatedNumber value={watts[d.id]} />
                      <span className="text-tertiary"> W</span>
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          <div className="mt-auto flex items-center gap-2 border-t-[0.5px] border-split pt-2.5">
            <div className="min-w-0 flex-1 leading-tight">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={focus.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="truncate text-[12px] font-semibold text-heading">{focus.model}</div>
                  <div className="truncate text-[11px] text-tertiary tabular">
                    {watts[focus.id]} W · inlet {focus.inlet.toFixed(1)} °C
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            <motion.button
              type="button"
              onClick={() => setLocated((l) => (l === focus.id ? null : focus.id))}
              whileTap={{ scale: 0.92 }}
              aria-pressed={located === focus.id}
              className={cn(
                "flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold outline-none transition-colors duration-mid",
                located === focus.id ? "bg-ios-blue text-white" : "bg-fill-secondary text-heading hover:bg-fill",
              )}
            >
              <Lightbulb16Filled />
              {located === focus.id ? "Locating" : "Locate"}
            </motion.button>
          </div>
        </div>
      </div>
    </Widget>
  );
}

/** The front of each device, drawn just enough to read as what it is. */
function Faceplate({ d, y, h }: { d: Device; y: number; h: number }) {
  const ink = "fill-tertiary";
  switch (d.kind) {
    case "switch":
      return (
        <g opacity={0.7}>
          {Array.from({ length: 16 }, (_, i) => (
            <rect key={i} x={X0 + 4 + i * 4.2} y={y + 1.6} width={3} height={h - 3.2} rx={0.5} className={ink} />
          ))}
        </g>
      );
    case "patch":
      return (
        <g opacity={0.5}>
          {Array.from({ length: 20 }, (_, i) => (
            <circle key={i} cx={X0 + 6 + i * 4} cy={y + h / 2} r={1} className={ink} />
          ))}
        </g>
      );
    case "server":
      return (
        <g opacity={0.6}>
          {Array.from({ length: d.u === 2 ? 12 : 8 }, (_, i) => {
            const cols = d.u === 2 ? 6 : 8;
            const row = Math.floor(i / cols);
            const col = i % cols;
            return (
              <rect
                key={i}
                x={X0 + 4 + col * 8}
                y={y + 1.4 + row * (U - 0.2)}
                width={7}
                height={U - 3.4}
                rx={0.6}
                className={ink}
              />
            );
          })}
        </g>
      );
    case "gpu":
      return (
        <g opacity={0.45}>
          {Array.from({ length: 7 }, (_, i) => (
            <rect key={i} x={X0 + 4} y={y + 3 + i * 3.6} width={DW - 22} height={1.4} rx={0.7} className={ink} />
          ))}
        </g>
      );
    case "storage":
      return (
        <g opacity={0.55}>
          {Array.from({ length: 36 }, (_, i) => {
            const row = Math.floor(i / 12);
            const col = i % 12;
            return <rect key={i} x={X0 + 4 + col * 6.2} y={y + 2 + row * 8.4} width={4.6} height={7} rx={0.6} className={ink} />;
          })}
        </g>
      );
  }
}
