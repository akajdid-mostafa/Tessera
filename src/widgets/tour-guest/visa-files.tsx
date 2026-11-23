import { ArrowUndo16Filled, BookGlobe20Filled, Checkmark12Filled, Dismiss12Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

/** The visa file's main line (contracts `VISA_TRANSITIONS`); the side exits (cancelled, withdrawn) are left out. */
type Status =
  | "new"
  | "collectingDocuments"
  | "underReview"
  | "appointmentBooked"
  | "submitted"
  | "approved"
  | "refused"
  | "passportReturned";
type Holder = "customer" | "agency" | "consulate";

type VisaFile = {
  id: string;
  name: string;
  country: string;
  template: string;
  provider: string;
  /** Days to the apply-by day (negative once past). */
  applyBy: number;
  status: Status;
  /** The consulate refuses this one. */
  refuse?: boolean;
  movedAt: number;
  /** Just opened (pops in rather than sliding from a column). */
  arrived?: boolean;
};

const COLUMNS: { key: string; label: string; statuses: Status[]; holder: Holder }[] = [
  { key: "new", label: "New", statuses: ["new"], holder: "customer" },
  { key: "docs", label: "Docs", statuses: ["collectingDocuments"], holder: "customer" },
  { key: "review", label: "Review", statuses: ["underReview"], holder: "agency" },
  { key: "appt", label: "Appt.", statuses: ["appointmentBooked"], holder: "agency" },
  { key: "submitted", label: "Submitted", statuses: ["submitted"], holder: "consulate" },
  { key: "decision", label: "Decision", statuses: ["approved", "refused"], holder: "agency" },
  { key: "returned", label: "Returned", statuses: ["passportReturned"], holder: "agency" },
];

const HOLDER: Record<Holder, { label: string; color: string }> = {
  customer: { label: "Customer", color: "var(--ios-orange)" },
  agency: { label: "Agency", color: "var(--ios-blue)" },
  consulate: { label: "Consulate", color: "var(--ios-purple)" },
};

const STATUS_LABEL: Record<Status, string> = {
  new: "New",
  collectingDocuments: "Collecting documents",
  underReview: "Under review",
  appointmentBooked: "Appointment booked",
  submitted: "Submitted",
  approved: "Approved",
  refused: "Refused",
  passportReturned: "Passport returned",
};

const BEFORE_SUBMIT: Status[] = ["new", "collectingDocuments", "underReview", "appointmentBooked"];

/** The next step on the main line; `null` = closed. */
function next(f: VisaFile): Status | null {
  switch (f.status) {
    case "new":
      return "collectingDocuments";
    case "collectingDocuments":
      return "underReview";
    case "underReview":
      return "appointmentBooked";
    case "appointmentBooked":
      return "submitted";
    case "submitted":
      return f.refuse ? "refused" : "approved";
    case "approved":
    case "refused":
      return "passportReturned";
    case "passportReturned":
      return null;
  }
}

/** More than 7 days left is green, 0 to 7 amber, past red (`applyByTone`). */
const tone = (d: number) => (d > 7 ? "green" : d >= 0 ? "amber" : "red");
const TONE_TEXT = { green: "text-ios-green", amber: "text-ios-yellow", red: "text-ios-red" } as const;
const TONE_DOT = { green: "var(--ios-green)", amber: "var(--ios-yellow)", red: "var(--ios-red)" } as const;

const T = {
  cn: { country: "CN", template: "China tourist visa (L)", provider: "CVASC" },
  ind: { country: "IN", template: "India e-Tourist Visa", provider: "e-Visa" },
  br: { country: "BR", template: "Brazil e-Visa", provider: "VFS" },
  vn: { country: "VN", template: "Vietnam e-Visa", provider: "Embassy" },
  au: { country: "AU", template: "Australia ETA", provider: "ETA app" },
};

const SEED: VisaFile[] = [
  { id: "VZ-26-0009", name: "Blake Shaw", ...T.au, applyBy: 12, status: "new", movedAt: 0 },
  { id: "VZ-26-0010", name: "Dylan Yates", ...T.ind, applyBy: 23, status: "new", movedAt: 0 },
  { id: "VZ-26-0007", name: "Grace Ayers", ...T.ind, applyBy: -2, status: "collectingDocuments", movedAt: 0 },
  { id: "VZ-26-0001", name: "Mark Hayes", ...T.cn, applyBy: 5, status: "collectingDocuments", movedAt: 0 },
  { id: "VZ-26-0011", name: "Neil Price", ...T.cn, applyBy: 9, status: "collectingDocuments", movedAt: 0 },
  { id: "VZ-26-0008", name: "Paige Wilson", ...T.vn, applyBy: 3, status: "underReview", movedAt: 0, refuse: true },
  { id: "VZ-26-0002", name: "Emma Hayes", ...T.cn, applyBy: 5, status: "appointmentBooked", movedAt: 0 },
  { id: "VZ-26-0006", name: "Kyle Ross", ...T.br, applyBy: 11, status: "appointmentBooked", movedAt: 0 },
  { id: "VZ-26-0005", name: "M. Carter", ...T.vn, applyBy: 0, status: "submitted", movedAt: 0 },
  { id: "VZ-26-0012", name: "Diane Ross", ...T.ind, applyBy: 0, status: "submitted", movedAt: 0 },
  { id: "VZ-26-0003", name: "Shelby Allen", ...T.br, applyBy: 0, status: "approved", movedAt: 0 },
  { id: "VZ-26-0004", name: "Michael Carter", ...T.br, applyBy: 0, status: "refused", movedAt: 0 },
  { id: "VZ-26-0013", name: "Allison Turner", ...T.cn, applyBy: 0, status: "passportReturned", movedAt: 0 },
];

const POOL: Omit<VisaFile, "id" | "status" | "movedAt">[] = [
  { name: "Craig Turner", ...T.cn, applyBy: 18 },
  { name: "Erin Sanders", ...T.au, applyBy: 6 },
  { name: "Victor Sanders", ...T.ind, applyBy: 27 },
  { name: "Gina Baker", ...T.br, applyBy: 14 },
];

const SHOWN = 2;

function sortFiles(files: VisaFile[]) {
  return [...files].sort((a, b) => b.movedAt - a.movedAt || a.applyBy - b.applyBy);
}

/** Tour guest · medium. Visa files flow left to right through their statuses, each column's strip colored by who holds the ball; a chip shows the applicant and the apply-by tone, a tap moves it one allowed step and it slides to the next column, and the consulate answers on its own. */
export function VisaFilesWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [files, setFiles] = useState(SEED);
  const [settled, setSettled] = useState(false);
  const serial = useRef(14);
  const pool = useRef(0);

  useEffect(() => {
    const t = window.setTimeout(() => setSettled(true), (delay + 1.2) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  const spawn = () => {
    const n = serial.current++;
    const p = POOL[pool.current++ % POOL.length];
    const at = Date.now();
    setFiles((list) => [...list, { ...p, id: `VZ-26-${String(n).padStart(4, "0")}`, status: "new", movedAt: at, arrived: true }]);
  };

  const advance = (id: string) => {
    const at = Date.now();
    const f = files.find((x) => x.id === id);
    if (!f) return;
    const to = next(f);
    setFiles((list) => list.flatMap((x) => (x.id !== id ? [x] : to ? [{ ...x, status: to, movedAt: at, arrived: false }] : [])));
    if (!to) window.setTimeout(spawn, 900);
  };

  // The consulate answers the longest-waiting submission now and then.
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);
  useEffect(() => {
    const t = window.setInterval(() => {
      const sub = filesRef.current.filter((f) => f.status === "submitted");
      if (!sub.length) return;
      const pick = [...sub].sort((a, b) => a.movedAt - b.movedAt)[0];
      const at = Date.now();
      setFiles((list) => list.map((x) => (x.id === pick.id ? { ...x, status: x.refuse ? "refused" : "approved", movedAt: at, arrived: false } : x)));
    }, 11_000);
    return () => window.clearInterval(t);
  }, []);

  const open = files.length;
  const urgent = files.filter((f) => BEFORE_SUBMIT.includes(f.status) && f.applyBy <= 7).length;

  return (
    <Widget size="medium" index={index} label="Visa files">
      <WidgetHeader
        icon={<BookGlobe20Filled />}
        tint="var(--ios-indigo)"
        title="Visa Files"
        subtitle={
          <span className="tabular">
            <AnimatedNumber value={open} /> open · <AnimatedNumber value={urgent} /> apply-by ≤ 7d
          </span>
        }
        extra={
          <div className="flex items-center gap-2 pt-1 text-[10px] whitespace-nowrap text-tertiary">
            {(Object.keys(HOLDER) as Holder[]).map((h) => (
              <span key={h} className="flex items-center gap-1">
                <span className="size-1.5 rounded-full" style={{ background: HOLDER[h].color }} />
                {HOLDER[h].label}
              </span>
            ))}
          </div>
        }
      />

      <div className="mt-2 grid grid-cols-7 gap-[3px]">
        {COLUMNS.map((c, ci) => {
          const inCol = sortFiles(files.filter((f) => c.statuses.includes(f.status)));
          return (
            <div key={c.key} className="flex min-w-0 flex-col">
              <div className="truncate text-[9px] leading-3 font-medium text-tertiary">{c.label}</div>
              <div className="flex h-[22px] items-baseline justify-between">
                <AnimatedNumber
                  value={inCol.length}
                  className={cn("text-[17px] leading-none font-semibold", inCol.length ? "text-heading" : "text-tertiary")}
                />
                {inCol.length > SHOWN ? (
                  <span className="text-[9px] font-medium text-tertiary tabular">+{inCol.length - SHOWN}</span>
                ) : null}
              </div>
              <div className="relative mt-0.5 h-[3px] overflow-hidden rounded-full bg-fill-tertiary">
                <motion.span
                  className="absolute inset-0 origin-left rounded-full"
                  style={{ background: HOLDER[c.holder].color }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ type: "spring", stiffness: 140, damping: 22, delay: delay + ci * 0.07 }}
                />
                {/* The flow: a light passes column to column. */}
                <motion.span
                  className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                  initial={{ x: "-100%" }}
                  animate={{ x: "220%" }}
                  transition={{ duration: 0.45, ease: "linear", delay: delay + 1 + ci * 0.42, repeat: Infinity, repeatDelay: 5.2 - 0.45 }}
                />
              </div>
              <div className="mt-1.5 flex flex-col gap-1">
                <AnimatePresence mode="popLayout">
                  {inCol.slice(0, SHOWN).map((f, i) => (
                    <FileChip
                      key={f.id}
                      f={f}
                      holder={c.holder}
                      delay={settled ? 0 : delay + 0.25 + ci * 0.06 + i * 0.05}
                      onAdvance={() => advance(f.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </Widget>
  );
}

function FileChip({ f, holder, delay, onAdvance }: { f: VisaFile; holder: Holder; delay: number; onAdvance: () => void }) {
  const pre = BEFORE_SUBMIT.includes(f.status);
  const tn = tone(f.applyBy);
  const sub =
    pre ? (
      <span className={cn("font-semibold", TONE_TEXT[tn])}>{f.applyBy < 0 ? `−${-f.applyBy}d` : `${f.applyBy}d`}</span>
    ) : f.status === "submitted" ? (
      <span className="flex h-[11px] items-center gap-[2px]" aria-label="At the consulate">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-[3px] rounded-full bg-ios-purple"
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </span>
    ) : f.status === "approved" ? (
      <Checkmark12Filled className="size-[11px] text-ios-green" aria-label="Approved" />
    ) : f.status === "refused" ? (
      <Dismiss12Filled className="size-[11px] text-ios-red" aria-label="Refused" />
    ) : (
      <ArrowUndo16Filled className="size-[11px] text-tertiary" aria-label="Passport returned" />
    );
  const nextStatus = next(f);

  return (
    <Tooltip
      title={
        <span className="tabular">
          {f.id} · {f.name} — {f.template} ({f.provider}) · {STATUS_LABEL[f.status]} · ball with {HOLDER[holder].label.toLowerCase()}
          {pre ? ` · apply by ${f.applyBy < 0 ? `${-f.applyBy}d ago` : `in ${f.applyBy}d`}` : ""}
          {nextStatus ? ` · tap → ${STATUS_LABEL[nextStatus]}` : " · tap to close"}
        </span>
      }
    >
      <motion.button
        type="button"
        layoutId={`visa-${f.id}`}
        initial={f.movedAt && !f.arrived ? false : { opacity: 0, scale: 0.85, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
        transition={{ type: "spring", stiffness: 420, damping: 32, delay, layout: { type: "spring", stiffness: 360, damping: 32 } }}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.94 }}
        onClick={onAdvance}
        className="relative flex h-[30px] w-full cursor-pointer items-center gap-1 rounded-[9px] bg-fill-tertiary px-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ios-blue"
      >
        <span className="relative shrink-0">
          <MemojiAvatar who={f.name} size={18} alt={f.name} />
          {pre ? (
            <span
              className="absolute -right-0.5 -bottom-0.5 size-[7px] rounded-full ring-[1.5px] ring-[var(--widget-surface)]"
              style={{ background: TONE_DOT[tn] }}
            />
          ) : null}
        </span>
        <span className="min-w-0 flex-1 leading-none">
          <span className="block truncate text-[10px] leading-[12px] font-semibold text-heading">{f.country}</span>
          <span className="flex h-[11px] items-center truncate text-[9px] leading-[11px] tabular">{sub}</span>
        </span>
      </motion.button>
    </Tooltip>
  );
}
