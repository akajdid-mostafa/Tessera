import { Bed20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Status = "occupied" | "free" | "cleaning" | "reserved";

const STATUS: Record<Status, { label: string; dot: string; tile: string }> = {
  occupied: { label: "Occupied", dot: "bg-ios-blue", tile: "bg-ios-blue/15 text-white" },
  free: {
    label: "Free",
    dot: "bg-ios-green",
    tile: "bg-ios-green/10 text-ios-green ring-1 ring-inset ring-ios-green/50",
  },
  cleaning: { label: "Cleaning", dot: "bg-ios-orange", tile: "bg-ios-orange/15 text-ios-orange" },
  reserved: { label: "Reserved", dot: "bg-ios-purple", tile: "bg-ios-purple/15 text-ios-purple" },
};
const ORDER: Status[] = ["occupied", "free", "cleaning", "reserved"];
const CODE: Record<string, Status> = { o: "occupied", f: "free", c: "cleaning", r: "reserved" };
const INITIAL: Status[] = ("oooforoo" + "ocoofooo" + "ooroocfo").split("").map((c) => CODE[c]);
const ADMISSIONS = ["M. Alvarez", "D. Chen", "R. Patel", "S. Kowalski", "A. Haddad", "L. Moreau"];

/** The ward's own churn, one event per tick: a full turnover cycle keeps the counts believable. */
const EVENTS: { from: Status; to: Status; text: (bed: string) => string; tone: string }[] = [
  { from: "cleaning", to: "free", text: (b) => `Bed ${b} cleaned · ready`, tone: "text-ios-green" },
  { from: "free", to: "reserved", text: (b) => `Bed ${b} held for ED admit`, tone: "text-ios-purple" },
  { from: "reserved", to: "occupied", text: (b) => `Bed ${b} · arrived from PACU`, tone: "text-ios-blue" },
  { from: "occupied", to: "cleaning", text: (b) => `Bed ${b} discharged`, tone: "text-ios-orange" },
];
const TICK_MS = 6500;

type Note = { id: number; text: string; tone: string; who?: string };
const bedNo = (i: number) => String(i + 1).padStart(2, "0");

/** Healthcare · medium. A live bed board; tap a free bed to admit the next ED patient into it. */
export function WardBedsWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [beds, setBeds] = useState<Status[]>(INITIAL);
  const [queue, setQueue] = useState(3);
  const [admitted, setAdmitted] = useState(0);
  const [settled, setSettled] = useState(false);
  const [note, setNote] = useState<Note>({ id: 0, text: "Tap a free bed to assign", tone: "text-tertiary" });
  const bedsRef = useRef(beds);

  useEffect(() => {
    bedsRef.current = beds;
  }, [beds]);

  useEffect(() => {
    const t = window.setTimeout(() => setSettled(true), (delay + 1.6) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    let n = 0;
    const t = window.setInterval(() => {
      const ev = EVENTS[n % EVENTS.length];
      n++;
      if (n % 3 === 0) setQueue((q) => Math.min(5, q + 1));
      const pool = bedsRef.current.flatMap((s, i) => (s === ev.from ? [i] : []));
      if (!pool.length) return;
      const i = pool[Math.floor(Math.random() * pool.length)];
      setBeds((cur) => cur.map((s, j) => (j === i ? ev.to : s)));
      setNote({ id: Date.now(), text: ev.text(bedNo(i)), tone: ev.tone });
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, []);

  const assign = (i: number) => {
    if (queue === 0) {
      setNote({ id: Date.now(), text: "No patients waiting in ED", tone: "text-tertiary" });
      return;
    }
    const name = ADMISSIONS[admitted % ADMISSIONS.length];
    setBeds((cur) => cur.map((s, j) => (j === i ? "occupied" : s)));
    setQueue((q) => q - 1);
    setAdmitted((a) => a + 1);
    setNote({ id: Date.now(), text: `Bed ${bedNo(i)} → ${name}`, tone: "text-ios-blue", who: name });
  };

  const counts = ORDER.reduce(
    (acc, k) => ({ ...acc, [k]: beds.filter((s) => s === k).length }),
    {} as Record<Status, number>,
  );

  return (
    <Widget size="medium" index={index} label="Ward bed board">
      <WidgetHeader
        icon={<Bed20Filled />}
        tint="var(--ios-teal)"
        title="Ward 4B · Cardiology"
        subtitle="24 beds · Charge RN Okafor"
        extra={
          <span
            className={cn(
              "flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors duration-mid",
              queue > 0 ? "bg-ios-red/15 text-ios-red" : "bg-fill-tertiary text-tertiary",
            )}
          >
            ED <AnimatedNumber value={queue} /> waiting
          </span>
        }
      />

      <div className="mt-3 flex items-center gap-4">
        <div className="grid w-[196px] shrink-0 grid-cols-8 gap-1">
          {beds.map((s, i) => (
            <BedTile
              key={i}
              n={bedNo(i)}
              status={s}
              delay={settled ? 0 : delay + i * 0.022}
              fillDelay={settled ? 0 : delay + 0.25 + i * 0.022}
              onAssign={() => assign(i)}
            />
          ))}
        </div>

        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-[11px] text-tertiary">Occupancy</div>
          <AnimatedNumber
            value={counts.occupied / beds.length}
            format={{ style: "percent", maximumFractionDigits: 0 }}
            className="text-[28px] leading-none font-semibold tracking-tight text-heading"
          />
          <div className="relative mt-1.5 h-4 overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10, filter: "blur(3px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className={cn("flex items-center gap-1 whitespace-nowrap text-[11px] font-medium", note.tone)}
              >
                {note.who ? <MemojiAvatar who={note.who} size={16} /> : null}
                <span className="truncate">{note.text}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2">
        {ORDER.map((k) => (
          <div key={k} className="flex items-center gap-1.5 whitespace-nowrap text-[11px]">
            <span className={cn("size-2 rounded-[3px]", STATUS[k].dot)} />
            <AnimatedNumber value={counts[k]} className="font-semibold text-heading" />
            <span className="text-tertiary">{STATUS[k].label}</span>
          </div>
        ))}
      </div>
    </Widget>
  );
}

function BedTile({
  n,
  status,
  delay,
  fillDelay,
  onAssign,
}: {
  n: string;
  status: Status;
  delay: number;
  fillDelay: number;
  onAssign: () => void;
}) {
  const s = STATUS[status];
  const free = status === "free";
  return (
    <Tooltip
      mouseEnterDelay={0.2}
      title={
        <span className="tabular">
          Bed {n} · {s.label}
          {free ? " · tap to assign" : ""}
        </span>
      }
    >
      <motion.button
        type="button"
        aria-label={`Bed ${n}, ${s.label}`}
        onClick={free ? onAssign : undefined}
        className={cn(
          "relative grid h-[18px] place-items-center overflow-hidden rounded-[5px] outline-none transition-colors duration-mid",
          s.tile,
          free ? "cursor-pointer" : "cursor-default",
        )}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={free ? { scale: 1.15 } : undefined}
        whileTap={free ? { scale: 0.86 } : undefined}
        transition={{ type: "spring", stiffness: 420, damping: 22, delay }}
      >
        <AnimatePresence>
          {status === "occupied" ? (
            <motion.span
              key="fill"
              className="absolute inset-0 origin-left bg-ios-blue"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.35 } }}
              transition={{ type: "spring", stiffness: 170, damping: 19, delay: fillDelay }}
            />
          ) : null}
        </AnimatePresence>
        <BedIcon className="relative h-[9px] w-4" />
      </motion.button>
    </Tooltip>
  );
}

/** A side-on hospital bed: headboard, pillow, mattress, footboard. */
function BedIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 11" className={className} fill="currentColor" aria-hidden>
      <rect x="0.5" y="0.5" width="1.8" height="10" rx="0.9" />
      <rect x="3.2" y="2.4" width="4.6" height="2.8" rx="1.2" />
      <rect x="2.3" y="5.4" width="17" height="3" rx="1.2" />
      <rect x="17.8" y="5.4" width="1.7" height="5.1" rx="0.85" />
    </svg>
  );
}
