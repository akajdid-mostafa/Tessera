import { Beaker20Filled, Checkmark12Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Status = "overdue" | "running" | "queued" | "done";
type Row = {
  id: string;
  test: string;
  sub: string;
  analyst: string;
  stat: boolean;
  status: Status;
  /** Minutes until the turnaround target; negative once late. */
  due: number;
  progress: number;
};

const SEED: Row[] = [
  { id: "S-24-11862", test: "Sterility", sub: "Lot 4471 · Isolator 2 · day 14", analyst: "Hana Sato", stat: false, status: "overdue", due: -21, progress: 0 },
  { id: "S-24-11873", test: "Endotoxin LAL", sub: "WFI Loop 3 · Reader R-02", analyst: "Priya Shah", stat: true, status: "running", due: 38, progress: 0.58 },
  { id: "S-24-11880", test: "Bioburden", sub: "Bulk 4471-B · pre-filtration", analyst: "Marco Bianchi", stat: true, status: "queued", due: 52, progress: 0 },
  { id: "S-24-11891", test: "TOC", sub: "WFI Loop 3 · POU 12", analyst: "Owen Price", stat: false, status: "queued", due: 186, progress: 0 },
  { id: "S-24-11894", test: "Conductivity", sub: "PW Loop 1 · POU 4", analyst: "Leila Haddad", stat: false, status: "queued", due: 214, progress: 0 },
  { id: "S-24-11897", test: "Mycoplasma qPCR", sub: "MCB-07 · vial 112", analyst: "Raj Patel", stat: true, status: "queued", due: 95, progress: 0 },
];

const POOL: Omit<Row, "id" | "status" | "progress">[] = [
  { test: "EM plates", sub: "Grade B · 6 contact plates", analyst: "Ana Lima", stat: false, due: 240 },
  { test: "Endotoxin LAL", sub: "Final fill 4472 · 3 vials", analyst: "Priya Shah", stat: true, due: 70 },
  { test: "Bioburden", sub: "Buffer prep B-19", analyst: "Marco Bianchi", stat: false, due: 260 },
  { test: "TOC", sub: "WFI Loop 1 · POU 3", analyst: "Owen Price", stat: false, due: 230 },
];

const ORDER: Record<Status, number> = { overdue: 0, done: 1, running: 1, queued: 2 };
const sortRows = (rows: Row[]) =>
  [...rows].sort((a, b) => ORDER[a.status] - ORDER[b.status] || Number(b.stat) - Number(a.stat) || a.due - b.due);

const TICK_MS = 2000;

/** Lab · medium. A LIMS sample queue with analyst memoji: the running endotoxin assay fills and releases, the next STAT sample starts, due times tick down while the late sterility read counts up in red, and the STAT filter re-sorts the list. */
export function SampleQueueWidget({ index }: { index?: number }) {
  const [rows, setRows] = useState(SEED);
  const [filter, setFilter] = useState<"all" | "stat">("all");
  const serial = useRef(11902);
  const pool = useRef(0);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const id = window.setInterval(() => {
      setRows((list) => {
        let next = list
          .filter((r) => r.status !== "done")
          .map((r): Row => {
            const due = r.due - 1;
            if (r.status === "running") {
              const progress = Math.min(1, r.progress + 0.07);
              return { ...r, due, progress, status: progress >= 1 ? "done" : "running" };
            }
            return { ...r, due, status: r.status === "queued" && due < 0 ? "overdue" : r.status };
          });
        // When the running assay releases, the next queued sample starts and a new one is logged.
        if (!next.some((r) => r.status === "running" || r.status === "done")) {
          const q = sortRows(next).find((r) => r.status === "queued");
          if (q) next = next.map((r) => (r.id === q.id ? { ...r, status: "running", progress: 0.04 } : r));
          const p = POOL[pool.current++ % POOL.length];
          next = [...next, { ...p, id: `S-24-${serial.current++}`, status: "queued", progress: 0 }];
        }
        return next;
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const shown = sortRows(rows.filter((r) => filter === "all" || r.stat)).slice(0, 3);
  const open = rows.filter((r) => r.status !== "done").length + 8;

  return (
    <Widget size="medium" index={index} label="Sample queue">
      <WidgetHeader
        icon={<Beaker20Filled />}
        tint="var(--ios-purple)"
        title="Sample Queue"
        subtitle={
          <span className="tabular">
            QC Micro · LIMS · <AnimatedNumber value={open} /> open
          </span>
        }
        extra={
          <Segmented
            size="small"
            value={filter}
            onChange={(v) => setFilter(v as "all" | "stat")}
            options={[
              { label: "All", value: "all" },
              { label: "STAT", value: "stat" },
            ]}
          />
        }
      />

      <ul className="relative mt-1.5 flex flex-col gap-2">
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map((r, i) => (
            <motion.li
              key={r.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 340, damping: 30, delay: rows === SEED ? delay + i * 0.06 : 0 }}
              className={cn("group relative flex h-[36px] items-center gap-2.5", i > 0 && "before:absolute before:inset-x-0 before:-top-1 before:h-[0.5px] before:bg-split")}
            >
              <Tooltip title={`Analyst · ${r.analyst}`}>
                <span className="shrink-0">
                  <MemojiAvatar who={r.analyst} size={26} alt={r.analyst} />
                </span>
              </Tooltip>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[13px] leading-[16px]">
                  <span className="truncate font-medium text-heading">{r.test}</span>
                  <span className="shrink-0 text-[10px] text-tertiary tabular">{r.id}</span>
                </div>
                <div className="mt-0.5 truncate text-[11px] leading-[13px] text-tertiary">{r.sub}</div>
              </div>
              <span className={cn("w-[34px] shrink-0 text-center text-[10px] font-bold tracking-wide", r.stat ? "text-ios-red" : "text-transparent")}>
                {r.stat ? "STAT" : "·"}
              </span>
              <StatusCell r={r} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </Widget>
  );
}

function StatusCell({ r }: { r: Row }) {
  const late = -r.due;
  return (
    <div className="flex w-[72px] shrink-0 justify-end">
      <AnimatePresence mode="popLayout" initial={false}>
        {r.status === "running" ? (
          <motion.div key="run" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex w-full items-center gap-1.5">
            <span className="relative h-[5px] flex-1 overflow-hidden rounded-full bg-fill-tertiary">
              <motion.span
                className="absolute inset-y-0 left-0 rounded-full bg-ios-purple"
                initial={{ width: 0 }}
                animate={{ width: `${r.progress * 100}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            </span>
            <span className="w-[26px] text-right text-[10px] font-semibold text-secondary tabular">
              <AnimatedNumber value={Math.round(r.progress * 100)} suffix="%" />
            </span>
          </motion.div>
        ) : r.status === "done" ? (
          <motion.span
            key="done"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
            className="flex h-5 items-center gap-1 rounded-full bg-ios-green/15 px-2 text-[10px] font-semibold text-ios-green"
          >
            <Checkmark12Filled /> Released
          </motion.span>
        ) : (
          <motion.span
            key={r.status}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "flex h-5 items-center rounded-full px-2 text-[10px] font-semibold whitespace-nowrap tabular",
              r.status === "overdue" ? "bg-ios-red/15 text-ios-red" : r.stat && r.due <= 60 ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-tertiary text-secondary",
            )}
          >
            {r.status === "overdue" ? `+${Math.floor(late / 60) ? `${Math.floor(late / 60)}h ` : ""}${late % 60}m late` : `due ${Math.floor(r.due / 60) ? `${Math.floor(r.due / 60)}h ` : ""}${r.due % 60}m`}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
