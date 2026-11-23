import { cn } from "@/registry/antuikit/lib/utils";

/* Shared bits for the EV charging widgets: connector face glyphs drawn from
 * their pin patterns, and the CPMS status palette (OCPP 1.6 vocabulary plus the
 * CPMS-derived "Offline" for a charger that has missed its heartbeats). */

export type ConnectorType = "CCS2" | "Type2" | "NACS" | "CHAdeMO";

export const CONNECTOR_LABEL: Record<ConnectorType, string> = {
  CCS2: "CCS2",
  Type2: "Type 2",
  NACS: "NACS",
  CHAdeMO: "CHAdeMO",
};

/** A connector seen face-on, 24×24, drawn in currentColor. */
export function ConnectorGlyph({ type, className }: { type: ConnectorType; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4 shrink-0", className)} fill="none" aria-label={CONNECTOR_LABEL[type]} role="img">
      {type === "Type2" ? (
        <g>
          {/* Round face with the flat top that keys it. */}
          <path d="M8 4.2 H16 A8.4 8.4 0 1 1 8 4.2 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <g fill="currentColor">
            <circle cx="10" cy="7.4" r="0.95" />
            <circle cx="14" cy="7.4" r="0.95" />
            <circle cx="7.6" cy="11.8" r="1.55" />
            <circle cx="12" cy="11.8" r="1.55" />
            <circle cx="16.4" cy="11.8" r="1.55" />
            <circle cx="9.6" cy="16.2" r="1.55" />
            <circle cx="14.4" cy="16.2" r="1.55" />
          </g>
        </g>
      ) : type === "CCS2" ? (
        <g>
          {/* Type 2 head over the two DC pins. */}
          <path d="M9.1 2.2 H14.9 A6.1 6.1 0 1 1 9.1 2.2 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <g fill="currentColor">
            <circle cx="10.6" cy="4.6" r="0.75" />
            <circle cx="13.4" cy="4.6" r="0.75" />
            <circle cx="9" cy="7.7" r="1.05" />
            <circle cx="12" cy="7.7" r="1.05" />
            <circle cx="15" cy="7.7" r="1.05" />
            <circle cx="10.5" cy="10.5" r="1.05" />
            <circle cx="13.5" cy="10.5" r="1.05" />
          </g>
          <rect x="5.6" y="15.2" width="12.8" height="7" rx="3.5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="9.2" cy="18.7" r="1.75" fill="currentColor" />
          <circle cx="14.8" cy="18.7" r="1.75" fill="currentColor" />
        </g>
      ) : type === "NACS" ? (
        <g>
          {/* Slim handle face: two large power pins over ground and signal. */}
          <path
            d="M6.4 4 H17.6 Q20.9 4 20.3 7.4 L18.4 16.6 Q17.6 20.6 12 20.6 Q6.4 20.6 5.6 16.6 L3.7 7.4 Q3.1 4 6.4 4 Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <g fill="currentColor">
            <circle cx="8.8" cy="9.4" r="2.25" />
            <circle cx="15.2" cy="9.4" r="2.25" />
            <circle cx="9.3" cy="15" r="0.9" />
            <circle cx="12" cy="15.9" r="1.35" />
            <circle cx="14.7" cy="15" r="0.9" />
          </g>
        </g>
      ) : (
        <g>
          {/* CHAdeMO: large round face, two DC pins, a ring of signal pins. */}
          <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.6" />
          <rect x="10.6" y="1.6" width="2.8" height="2" rx="0.6" fill="currentColor" />
          <g fill="currentColor">
            <circle cx="7.7" cy="12" r="2.3" />
            <circle cx="16.3" cy="12" r="2.3" />
            <circle cx="12" cy="7" r="0.9" />
            <circle cx="9.1" cy="7.9" r="0.9" />
            <circle cx="14.9" cy="7.9" r="0.9" />
            <circle cx="12" cy="12" r="0.9" />
            <circle cx="12" cy="17" r="0.9" />
            <circle cx="9.1" cy="16.1" r="0.9" />
            <circle cx="14.9" cy="16.1" r="0.9" />
          </g>
        </g>
      )}
    </svg>
  );
}

export type Ocpp =
  | "Available"
  | "Preparing"
  | "Charging"
  | "SuspendedEV"
  | "Finishing"
  | "Faulted"
  | "Unavailable"
  | "Offline";

/** CPMS palette: green = free, blue = delivering, amber = paused / winding down,
 * red = fault, grey = out of service, dashed grey = no heartbeat. */
export const STATUS: Record<Ocpp, { label: string; fill: string; text: string; dot: string }> = {
  Available: { label: "Available", fill: "var(--ios-green)", text: "text-ios-green", dot: "bg-ios-green" },
  Preparing: { label: "Preparing", fill: "var(--ios-teal)", text: "text-ios-teal", dot: "bg-ios-teal" },
  Charging: { label: "Charging", fill: "var(--ios-blue)", text: "text-ios-blue", dot: "bg-ios-blue" },
  SuspendedEV: { label: "SuspendedEV", fill: "var(--ios-yellow)", text: "text-ios-yellow", dot: "bg-ios-yellow" },
  Finishing: { label: "Finishing", fill: "var(--ios-orange)", text: "text-ios-orange", dot: "bg-ios-orange" },
  Faulted: { label: "Faulted", fill: "var(--ios-red)", text: "text-ios-red", dot: "bg-ios-red" },
  Unavailable: { label: "Unavailable", fill: "var(--ant-color-text-tertiary)", text: "text-tertiary", dot: "bg-tertiary" },
  Offline: { label: "Offline", fill: "var(--ant-color-text-tertiary)", text: "text-tertiary", dot: "bg-tertiary" },
};

/** Deterministic noise so demo series look the same on every load. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** kW the car accepts at a given SoC: an 800 V pack on a 300 kW charger. */
const CURVE_800V: [number, number][] = [
  [0, 0],
  [3, 150],
  [10, 230],
  [20, 255],
  [30, 250],
  [40, 240],
  [50, 225],
  [60, 180],
  [70, 140],
  [80, 95],
  [90, 45],
  [100, 10],
];

export function curveKw(soc: number, table: [number, number][] = CURVE_800V) {
  const s = Math.max(0, Math.min(100, soc));
  for (let i = 1; i < table.length; i++) {
    const [x1, y1] = table[i];
    const [x0, y0] = table[i - 1];
    if (s <= x1) return y0 + ((s - x0) / (x1 - x0)) * (y1 - y0);
  }
  return table[table.length - 1][1];
}

/** mm:ss or h:mm:ss for a seconds count. */
export function clock(sec: number) {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}
