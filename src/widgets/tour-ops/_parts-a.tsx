import { motion } from "motion/react";
import type { ReactNode } from "react";

/* Kaibab Yonder Tours (KY), Flagstaff: the seed tenant's staff, fleet and
 * today's departures, shared by the tour-ops widgets in _entries-a. */

export type Role = "guide" | "driver";
export type Staff = { name: string; short: string; roles: Role[] };
export const STAFF: Staff[] = [
  { name: "Kevin Walsh", short: "Kevin", roles: ["guide"] },
  { name: "Cody Owens", short: "Cody", roles: ["guide", "driver"] },
  { name: "Chris Adams", short: "Chris", roles: ["driver"] },
];

export type Vehicle = { plate: string; model: string; seats: number };
export const VEHICLES: Vehicle[] = [
  { plate: "KAB 101", model: "Transit", seats: 7 },
  { plate: "KAC 201", model: "Sprinter", seats: 16 },
];

export type Departure = {
  id: string;
  time: string;
  title: string;
  from: string;
  sold: number;
  capacity: number;
  defaultCapacity: number;
  guide: string;
  plate: string;
};

/** Today's departures (Mon, Nov 9), in time order. */
export const DEPARTURES: Departure[] = [
  { id: "montezuma", time: "08:00", title: "Montezuma Castle", from: "Heritage Sq", sold: 12, capacity: 14, defaultCapacity: 14, guide: "Cody Owens", plate: "KAB 101" },
  { id: "sedona", time: "09:00", title: "Sedona & Oak Creek", from: "Heritage Sq", sold: 15, capacity: 16, defaultCapacity: 16, guide: "Kevin Walsh", plate: "KAC 201" },
  { id: "rafting", time: "10:00", title: "Verde River Rafting", from: "Camp Verde", sold: 18, capacity: 16, defaultCapacity: 16, guide: "Cody Owens", plate: "KAB 101" },
  { id: "city", time: "14:00", title: "Flagstaff & Mars Hill", from: "Heritage Sq", sold: 6, capacity: 12, defaultCapacity: 16, guide: "Kevin Walsh", plate: "KAB 101" },
];

export const TWO = { minimumIntegerDigits: 2 } as const;

/** "09:00" → minutes since midnight. */
export const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** A plate as Arizona plates read: a thin outlined chip with a blue AZ band. */
export function Plate({ plate, className }: { plate: string; className?: string }) {
  return (
    <span
      className={
        "inline-flex h-[18px] shrink-0 items-stretch overflow-hidden rounded-[4px] text-[10px] font-semibold whitespace-nowrap text-heading ring-1 ring-inset ring-[var(--ant-color-border)] tabular " +
        (className ?? "")
      }
    >
      {/* EU band: the ring of twelve stars over the country code. */}
      <span className="flex w-[13px] flex-col items-center justify-center gap-[1px] bg-[#003399] text-[6px] leading-none font-bold text-white" aria-hidden>
        <svg viewBox="-5 -5 10 10" className="size-[8px]">
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <circle key={i} cx={Math.sin(a) * 3.6} cy={-Math.cos(a) * 3.6} r={0.75} fill="#ffcc00" />;
          })}
        </svg>
        D
      </span>
      <span className="grid place-items-center px-1">{plate}</span>
    </span>
  );
}

/** A progress ring; `parts` stack around it in order, each a fraction of the whole. */
export function Ring({
  size,
  stroke,
  parts,
  delay = 0,
  children,
}: {
  size: number;
  stroke: number;
  parts: { value: number; color: string }[];
  delay?: number;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let start = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-fill-secondary" />
        {parts.map((p, i) => {
          const v = Math.max(0, Math.min(1 - start, p.value));
          const offset = start;
          start += v;
          return (
            <motion.circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap={v > 0 ? "round" : "butt"}
              strokeDasharray={`${c} ${c}`}
              initial={{ strokeDashoffset: c, rotate: offset * 360, stroke: p.color }}
              animate={{ strokeDashoffset: c * (1 - v), rotate: offset * 360, stroke: p.color }}
              style={{ originX: "50%", originY: "50%" }}
              transition={{ type: "spring", stiffness: 90, damping: 18, delay }}
            />
          );
        })}
      </svg>
      {children ? <div className="absolute inset-0 grid place-items-center">{children}</div> : null}
    </div>
  );
}
