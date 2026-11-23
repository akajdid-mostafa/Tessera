import { CalendarClock20Filled, Person16Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { clock, hm, PingDot } from "./_parts-b";

type Kind = "departure" | "transfer" | "arrival" | "checkout" | "rentalOut" | "rentalIn";
type Issue = "unassigned_driver" | "balance_due" | "option_open";
type Job = {
  id: string;
  kind: Kind;
  row: number;
  from: number;
  /** `null` for a moment job (a check-in, a check-out, a vehicle handover). */
  to: number | null;
  title: string;
  short?: string;
  ref: string;
  pax: number;
  who: { name: string; role: "Guide" | "Driver" | "Lead guest" } | null;
  plate: string | null;
  issues: Issue[];
};

/* The product's own section names (Daily operations) and its short issue chips. */
const KIND: Record<Kind, { label: string; bar: string; soft: string }> = {
  departure: { label: "Departures", bar: "bg-ios-indigo", soft: "bg-ios-indigo/20" },
  transfer: { label: "Transfers", bar: "bg-ios-teal", soft: "bg-ios-teal/20" },
  arrival: { label: "Arrivals", bar: "bg-ios-blue", soft: "bg-ios-blue/20" },
  checkout: { label: "Check-outs", bar: "bg-ios-purple", soft: "bg-ios-purple/20" },
  rentalOut: { label: "Pickups", bar: "bg-ios-pink", soft: "bg-ios-pink/20" },
  rentalIn: { label: "Returns", bar: "bg-ios-mint", soft: "bg-ios-mint/20" },
};
const ISSUE: Record<Issue, { label: string; dot: string; text: string }> = {
  unassigned_driver: { label: "No driver", dot: "bg-ios-red", text: "text-ios-red" },
  balance_due: { label: "Balance", dot: "bg-ios-orange", text: "text-ios-orange" },
  option_open: { label: "Option", dot: "bg-ios-yellow", text: "text-ios-yellow" },
};
/* Seven rows: departures overlap, so they take two. */
const ROWS: { kind: Kind; first: boolean }[] = [
  { kind: "departure", first: true },
  { kind: "departure", first: false },
  { kind: "transfer", first: true },
  { kind: "arrival", first: true },
  { kind: "checkout", first: true },
  { kind: "rentalOut", first: true },
  { kind: "rentalIn", first: true },
];

const guide = (name: string) => ({ name, role: "Guide" as const });
const driver = (name: string) => ({ name, role: "Driver" as const });
const lead = (name: string) => ({ name, role: "Lead guest" as const });

const JOBS: Job[] = [
  { id: "d1", kind: "departure", row: 0, from: hm(8), to: hm(19), title: "Sedona–Oak Creek day tour", short: "Sedona–Oak Creek day tour", ref: "6 bookings", pax: 19, who: guide("Kevin Walsh"), plate: "KAD 301", issues: ["balance_due"] },
  { id: "d2", kind: "departure", row: 1, from: hm(9), to: hm(14), title: "Montezuma Castle half-day", short: "Montezuma", ref: "4 bookings", pax: 14, who: guide("Cody Owens"), plate: "KAC 201", issues: [] },
  { id: "d3", kind: "departure", row: 1, from: hm(14), to: hm(16), title: "Verde River rafting", short: "Rafting", ref: "2 bookings", pax: 8, who: guide("Dana Allen"), plate: "Raft 1", issues: ["option_open"] },
  { id: "t1", kind: "transfer", row: 2, from: hm(6, 30), to: hm(7, 10), title: "Downtown Flagstaff → FLG", ref: "KY-26-0398", pax: 4, who: driver("Chris Adams"), plate: "KAB 101", issues: [] },
  { id: "t2", kind: "transfer", row: 2, from: hm(11, 10), to: hm(12, 50), title: "FLG → Sedona", short: "Sedona", ref: "KY-26-0402", pax: 3, who: driver("Hank Carter"), plate: "KTT 101", issues: [] },
  { id: "t3", kind: "transfer", row: 2, from: hm(16, 5), to: hm(19, 15), title: "FLG arrival run · AA 163, UA 573", short: "FLG run", ref: "Run · planned", pax: 6, who: driver("Chris Adams"), plate: "KAB 101", issues: [] },
  { id: "t4", kind: "transfer", row: 2, from: hm(20, 10), to: hm(20, 40), title: "FLG → Downtown Flagstaff", ref: "KY-26-0424", pax: 2, who: null, plate: "KAB 103", issues: ["unassigned_driver"] },
  { id: "a1", kind: "arrival", row: 3, from: hm(14), to: null, title: "Red Rock Lodge", ref: "KY-26-0412", pax: 4, who: lead("Zoe Kelly"), plate: null, issues: ["balance_due"] },
  { id: "a2", kind: "arrival", row: 3, from: hm(17, 45), to: null, title: "Red Rock Lodge", ref: "KY-26-0415", pax: 2, who: lead("Mohammed Al-Sabah"), plate: null, issues: [] },
  { id: "a3", kind: "arrival", row: 3, from: hm(19, 15), to: null, title: "Juniper cabin", ref: "KY-26-0421", pax: 5, who: lead("Owen Tate"), plate: null, issues: ["option_open"] },
  { id: "c1", kind: "checkout", row: 4, from: hm(10), to: null, title: "Sedona creek house", ref: "KY-26-0388", pax: 4, who: lead("Emily Shaw"), plate: null, issues: [] },
  { id: "c2", kind: "checkout", row: 4, from: hm(12), to: null, title: "Oak Creek Resort", ref: "KY-26-0391", pax: 2, who: lead("Thomas Weber"), plate: null, issues: [] },
  { id: "r1", kind: "rentalOut", row: 5, from: hm(9, 30), to: null, title: "Nissan Versa · FLG", ref: "KY-26-0405", pax: 1, who: lead("Brian Young"), plate: "KKY 302", issues: [] },
  { id: "r2", kind: "rentalOut", row: 5, from: hm(16, 30), to: null, title: "Toyota C-HR · FLG", ref: "KY-26-0419", pax: 1, who: lead("Sara Al-Mansour"), plate: "KKY 401", issues: ["balance_due"] },
  { id: "i1", kind: "rentalIn", row: 6, from: hm(11), to: null, title: "Nissan Versa · FLG", ref: "KY-26-0379", pax: 1, who: lead("Drew Ayers"), plate: "KKY 303", issues: [] },
  { id: "i2", kind: "rentalIn", row: 6, from: hm(19, 30), to: null, title: "Toyota C-HR · Flagstaff", ref: "KY-26-0383", pax: 1, who: lead("Aaron Cole"), plate: "KKY 402", issues: [] },
];

const DAY_START = hm(6);
const DAY_END = hm(22);
const SPAN = DAY_END - DAY_START;
const START = hm(13, 40);
const MINUTE_MS = 2500;
/** A moment job is drawn 40 minutes wide and counts as done 30 minutes after it starts. */
const MOMENT = 40;
const ROW_H = 22;
const TICKS = [6, 10, 14, 18, 22];

const x = (m: number) => ((m - DAY_START) / SPAN) * 100;
const endOf = (j: Job) => j.to ?? j.from + 30;
const span = (j: Job) => (j.to === null ? clock(j.from) : `${clock(j.from)}–${clock(j.to)}`);
const ISSUE_COUNT = (Object.keys(ISSUE) as Issue[]).map((k) => [k, JOBS.filter((j) => j.issues.includes(k)).length] as const);

/** Tour ops · large. The day's jobs by kind on a 06–22 strip with a sliding NOW line; hover or tap a job for its crew, pax and plate. */
export function JobTimelineWidget({ index }: { index?: number }) {
  const [now, setNow] = useState(START);
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => setNow((n) => (n >= DAY_END ? START : n + 1)), MINUTE_MS);
    return () => window.clearInterval(t);
  }, []);

  const done = JOBS.filter((j) => endOf(j) <= now).length;
  const onRoad = JOBS.filter((j) => j.to !== null && j.from <= now && now < j.to).reduce((s, j) => s + j.pax, 0);
  const next = JOBS.filter((j) => j.from > now).sort((a, b) => a.from - b.from)[0];
  const focusId = hover ?? pinned;
  const shown = JOBS.find((j) => j.id === focusId) ?? next;
  const isNext = !focusId;

  return (
    <Widget size="large" index={index} label="Today's jobs">
      <WidgetHeader
        icon={<CalendarClock20Filled />}
        tint="var(--ios-indigo)"
        title="Today's Jobs"
        subtitle="Kaibab Yonder Tours · Thu, Nov 12"
        extra={
          <span className="flex items-center gap-1.5 rounded-full bg-ios-red/15 px-2 py-0.5 text-[11px] font-semibold text-ios-red tabular">
            <PingDot tone="bg-ios-red" />
            {clock(now)}
          </span>
        }
      />

      <div className="mt-3 flex items-baseline-last gap-5">
        <div className="leading-none">
          <div className="mb-1 text-[11px] text-tertiary">Jobs done</div>
          <div className="flex items-baseline text-[30px] font-semibold tracking-tight text-heading">
            <AnimatedNumber value={done} />
            <span className="text-[15px] font-medium text-tertiary">/{JOBS.length}</span>
          </div>
        </div>
        <div className="leading-tight">
          <div className="text-[11px] text-tertiary">Pax on the road</div>
          <AnimatedNumber value={onRoad} className="text-[17px] font-semibold text-heading" />
        </div>
        <div className="ml-auto flex flex-col items-end gap-0.5 text-[11px] text-secondary">
          {ISSUE_COUNT.map(([k, n]) => (
            <span key={k} className="flex items-center gap-1.5 whitespace-nowrap">
              {ISSUE[k].label}
              <span className="font-semibold text-heading tabular">{n}</span>
              <span className={cn("size-[7px] rounded-full", ISSUE[k].dot)} />
            </span>
          ))}
        </div>
      </div>

      {/* Strip */}
      <div className="mt-3 flex gap-1.5">
        <div className="flex w-[58px] shrink-0 flex-col gap-1">
          {ROWS.map((r, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] font-semibold text-tertiary" style={{ height: ROW_H }}>
              {r.first ? (
                <>
                  <span className={cn("h-2 w-[3px] shrink-0 rounded-full", KIND[r.kind].bar)} />
                  <span className="truncate">{KIND[r.kind].label}</span>
                </>
              ) : null}
            </div>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex" style={{ height: ROWS.length * (ROW_H + 4) - 4 }}>
            {Array.from({ length: 8 }, (_, h) => (
              <span key={h} className="flex-1 border-l-[0.5px] border-split first:border-l-0" />
            ))}
          </div>
          <div className="relative flex flex-col gap-1">
            {ROWS.map((r, ri) => (
              <div key={ri} className="relative rounded-md bg-fill-quaternary" style={{ height: ROW_H }}>
                {JOBS.filter((j) => j.row === ri).map((j, k) => {
                  const end = j.to ?? j.from + MOMENT;
                  const past = endOf(j) <= now;
                  const active = j.to !== null && j.from <= now && now < j.to;
                  const focused = focusId === j.id;
                  const kd = KIND[j.kind];
                  const issue = j.issues[0];
                  return (
                    <motion.button
                      key={j.id}
                      type="button"
                      aria-label={`${j.title}, ${span(j)}`}
                      className="absolute inset-y-[2px] origin-left cursor-pointer outline-none"
                      style={{ left: `${x(j.from)}%`, width: `calc(${x(end) - x(j.from)}% - 2px)` }}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: past && !focused ? 0.4 : 1 }}
                      whileHover={{ y: -1 }}
                      transition={{
                        scaleX: { type: "spring", stiffness: 220, damping: 24, delay: delay + ri * 0.05 + k * 0.04 },
                        opacity: { duration: 0.4 },
                      }}
                      onHoverStart={() => setHover(j.id)}
                      onHoverEnd={() => setHover((h) => (h === j.id ? null : h))}
                      onClick={() => setPinned((p) => (p === j.id ? null : j.id))}
                    >
                      <span
                        className={cn(
                          "absolute inset-0 overflow-hidden rounded-[5px]",
                          j.to === null ? kd.bar : kd.soft,
                          focused && "ring-1 ring-inset ring-sel",
                        )}
                      >
                        {active ? (
                          <motion.span
                            className={cn("absolute inset-y-0 left-0 opacity-30", kd.bar)}
                            animate={{ width: `${((now - j.from) / (j.to! - j.from)) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        ) : null}
                        {j.short ? (
                          <span className="relative block truncate pl-1.5 text-left text-[9px] leading-[18px] font-semibold text-heading">
                            {j.short}
                          </span>
                        ) : null}
                      </span>
                      {issue ? (
                        <motion.span
                          className={cn("absolute -right-[3px] -top-[3px] size-[7px] rounded-full ring-[1.5px] ring-[var(--widget-surface)]", ISSUE[issue].dot)}
                          initial={{ scale: 0 }}
                          animate={issue === "unassigned_driver" ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                          transition={
                            issue === "unassigned_driver"
                              ? { repeat: Infinity, duration: 1.6, ease: "easeInOut", delay: delay + 0.8 }
                              : { type: "spring", stiffness: 400, damping: 18, delay: delay + 0.6 + ri * 0.05 }
                          }
                        />
                      ) : null}
                    </motion.button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* NOW line */}
          <motion.div
            className="pointer-events-none absolute -top-1 w-0"
            style={{ height: ROWS.length * (ROW_H + 4) + 4 }}
            initial={{ left: "0%", opacity: 0 }}
            animate={{ left: `${x(now)}%`, opacity: 1 }}
            transition={{
              left: { duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: now === START ? delay : 0 },
              opacity: { delay },
            }}
          >
            <span className="absolute inset-y-0 -left-px w-[2px] rounded-full bg-ios-red" />
            <span className="absolute -left-[4px] -top-[3px] size-2 rounded-full bg-ios-red ring-2 ring-[var(--widget-surface)]" />
          </motion.div>

          <div className="relative mt-1.5 h-3 text-[10px] text-tertiary tabular">
            {TICKS.map((h) => (
              <span
                key={h}
                className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full"
                style={{ left: `${x(hm(h))}%` }}
              >
                {String(h).padStart(2, "0")}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Detail */}
      <div className="mt-auto h-[46px] border-t-[0.5px] border-split pt-2.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown ? (
            <motion.div
              key={shown.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2.5"
            >
              {shown.who ? (
                <MemojiAvatar who={shown.who.name} size={32} alt={shown.who.role} />
              ) : (
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-dashed border-ios-red text-[16px] text-ios-red">
                  <Person16Regular />
                </span>
              )}
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[13px] font-medium text-heading">
                  {isNext ? "Next · " : ""}
                  {shown.title}
                </div>
                <div className="truncate text-[11px] text-tertiary tabular">
                  {span(shown)} · {shown.pax} pax · {shown.who ? `${shown.who.name}` : "Driver unassigned"}
                  {shown.plate ? ` · ${shown.plate}` : ""}
                </div>
              </div>
              {shown.issues.length ? (
                <div className="flex flex-col items-end gap-0.5">
                  {shown.issues.map((k) => (
                    <span key={k} className={cn("flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold", ISSUE[k].text)}>
                      <span className={cn("size-1.5 rounded-full", ISSUE[k].dot)} />
                      {ISSUE[k].label}
                    </span>
                  ))}
                </div>
              ) : isNext ? (
                <span className="whitespace-nowrap rounded-full bg-fill-tertiary px-2 py-0.5 text-[11px] font-semibold text-secondary">
                  in <AnimatedNumber value={shown.from - now} trend={-1} /> min
                </span>
              ) : (
                <span className="whitespace-nowrap text-[11px] text-tertiary tabular">{shown.ref}</span>
              )}
            </motion.div>
          ) : (
            <span key="none" className="text-[13px] text-tertiary">No more jobs today</span>
          )}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
