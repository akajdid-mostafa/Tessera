import { Building20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type CSSProperties, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Status = "occupied" | "vacant" | "notice" | "renovation";
const STATUS: Record<Status, { label: string; className: string; style?: CSSProperties }> = {
  occupied: { label: "Occupied", className: "bg-ios-indigo" },
  vacant: { label: "Vacant", className: "bg-fill-secondary ring-1 ring-inset ring-widget-ring" },
  notice: { label: "Notice", className: "bg-ios-orange" },
  renovation: {
    label: "Renovation",
    className: "",
    style: {
      background:
        "repeating-linear-gradient(135deg, var(--ios-teal) 0 3px, color-mix(in srgb, var(--ios-teal) 35%, transparent) 3px 6px)",
    },
  },
};
const ORDER: Status[] = ["occupied", "vacant", "notice", "renovation"];

type Unit = { id: string; status: Status; tenant?: string; detail: string };

const NAMES = [
  "Emily Young", "Mark Kelly", "Sarah Allen", "Chris Diaz", "Dana Adams", "Zoe Shaw",
  "Brian Ortiz", "Amy Cole", "Eric Price", "Lisa Owens", "Kyle Ames", "Erin Hayes",
  "Owen Clark", "Nora Ellis", "Todd Kerr", "Ivy Grant", "Adam Young", "Mia Turner",
];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** A small seeded generator so the stack is the same on every render and reload. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function makeBuilding(floors: number, perFloor: number, seed: number, renoFloor: number) {
  const rnd = seeded(seed);
  const rows: Unit[][] = [];
  for (let f = floors; f >= 1; f--) {
    const row: Unit[] = [];
    for (let u = 0; u < perFloor; u++) {
      const id = `${f}${String.fromCharCode(65 + u)}`;
      const r = rnd();
      const status: Status =
        f === renoFloor && u < perFloor - 2 ? "renovation" : r < 0.8 ? "occupied" : r < 0.9 ? "vacant" : "notice";
      const tenant = status === "occupied" || status === "notice" ? NAMES[Math.floor(rnd() * NAMES.length)] : undefined;
      const month = MONTHS[Math.floor(rnd() * 12)];
      const detail =
        status === "occupied"
          ? `Lease ends ${month} ${2027 + Math.floor(rnd() * 2)}`
          : status === "notice"
            ? `Moving out ${month === "Nov" ? "Nov 30" : "Dec 31"}`
            : status === "vacant"
              ? `Ready to lease · $${(26 + Math.floor(rnd() * 14)) / 10}K/mo`
              : "Kitchen refit · done Jan 12";
      row.push({ id, status, tenant, detail });
    }
    rows.push(row);
  }
  return rows;
}

const BUILDINGS = {
  Bayview: { address: "1858 Bay St", rent: 3_120, rows: makeBuilding(8, 6, 11, 2) },
  Parkside: { address: "214 Park Ave", rent: 2_780, rows: makeBuilding(10, 4, 29, 6) },
} as const;
type Name = keyof typeof BUILDINGS;

/** Real estate · large. A building's units as a floor stack; switch buildings to rebuild it, hover a unit for its lease. */
export function BuildingUnitsWidget({ index }: { index?: number }) {
  const [name, setName] = useState<Name>("Bayview");
  const [switched, setSwitched] = useState(false);
  const b = BUILDINGS[name];
  const units = b.rows.flat();
  const counts = Object.fromEntries(ORDER.map((s) => [s, units.filter((u) => u.status === s).length])) as Record<
    Status,
    number
  >;
  const leased = counts.occupied + counts.notice;
  const delay = switched ? 0.05 : 0.3 + (index ?? 0) * 0.06;
  const floors = b.rows.length;

  return (
    <Widget size="large" index={index} label="Building units">
      <WidgetHeader
        icon={<Building20Filled />}
        tint="var(--ios-indigo)"
        title="Unit Map"
        subtitle={b.address}
        extra={
          <Segmented
            size="small"
            value={name}
            onChange={(v) => {
              setName(v as Name);
              setSwitched(true);
            }}
            options={Object.keys(BUILDINGS)}
          />
        }
      />

      <div className="mt-3 flex items-baseline-last gap-2">
        <AnimatedNumber
          value={leased / units.length}
          format={{ style: "percent", maximumFractionDigits: 0 }}
          className="text-[30px] leading-none font-semibold tracking-tight text-heading"
        />
        <div className="mb-0.5 text-[11px] leading-tight text-tertiary">
          leased
          <div>
            <AnimatedNumber value={leased} className="font-semibold text-secondary" /> of{" "}
            <AnimatedNumber value={units.length} /> units
          </div>
        </div>
        <div className="mb-0.5 ml-auto text-right text-[11px] leading-tight text-tertiary">
          Avg rent
          <div>
            <AnimatedNumber
              value={b.rent}
              format={{ style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }}
              className="text-[13px] font-semibold text-heading"
            />
            /mo
          </div>
        </div>
      </div>

      <div className="relative mt-3 flex min-h-0 flex-1 flex-col">
        <AnimatePresence mode="wait" initial={true}>
          <motion.div
            key={name}
            className="flex min-h-0 flex-1 flex-col rounded-t-xl rounded-b-md bg-fill-quaternary p-1.5 pt-2"
            exit={{ opacity: 0, y: 6, filter: "blur(4px)", transition: { duration: 0.18 } }}
          >
            <div className="flex min-h-0 flex-1 flex-col gap-1">
              {b.rows.map((row, fi) => {
                const fromGround = floors - 1 - fi;
                return (
                  <div key={fi} className="flex min-h-0 flex-1 items-stretch gap-1">
                    <span className="w-4 shrink-0 self-center text-right text-[9px] text-tertiary tabular">
                      {floors - fi}
                    </span>
                    {row.map((u, ui) => (
                      <Tooltip
                        key={u.id}
                        title={
                          <span className="block leading-snug">
                            <span className="block font-semibold">
                              Unit {u.id} · {STATUS[u.status].label}
                            </span>
                            {u.tenant ? <span className="block">{u.tenant}</span> : null}
                            <span className="block opacity-75">{u.detail}</span>
                          </span>
                        }
                      >
                        <motion.div
                          className={cn("relative flex-1 cursor-default rounded-[4px] hover:z-10", STATUS[u.status].className)}
                          style={STATUS[u.status].style}
                          initial={{ opacity: 0, scaleY: 0.2, y: 6 }}
                          animate={{ opacity: 1, scaleY: 1, y: 0 }}
                          whileHover={{ scale: 1.18 }}
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 24,
                            delay: delay + fromGround * 0.045 + ui * 0.018,
                          }}
                        />
                      </Tooltip>
                    ))}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="h-1 rounded-full bg-fill-secondary" />
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {ORDER.map((s) => (
          <div key={s} className="min-w-0 leading-tight">
            <div className="flex items-center gap-1 text-[10px] text-tertiary">
              <span className={cn("size-2 shrink-0 rounded-[2px]", STATUS[s].className)} style={STATUS[s].style} />
              <span className="truncate">{STATUS[s].label}</span>
            </div>
            <AnimatedNumber value={counts[s]} className="text-[15px] font-semibold text-heading" />
          </div>
        ))}
      </div>
    </Widget>
  );
}
