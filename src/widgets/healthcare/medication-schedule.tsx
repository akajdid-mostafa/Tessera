import { Checkmark12Filled, Pill20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Dose = { id: string; t: number; drug: string; dose: string; note: string; tone: string };

const DOSES: Dose[] = [
  { id: "met-am", t: 8, drug: "Metformin", dose: "500 mg", note: "with breakfast", tone: "var(--ios-blue)" },
  { id: "amx-noon", t: 12, drug: "Amoxicillin", dose: "500 mg", note: "capsule · day 4 of 7", tone: "var(--ios-orange)" },
  { id: "vitd", t: 12, drug: "Vitamin D3", dose: "1,000 IU", note: "with lunch", tone: "var(--ios-yellow)" },
  { id: "met-pm", t: 18, drug: "Metformin", dose: "500 mg", note: "with dinner", tone: "var(--ios-blue)" },
  { id: "amx-pm", t: 18, drug: "Amoxicillin", dose: "500 mg", note: "capsule · day 4 of 7", tone: "var(--ios-orange)" },
  { id: "ator", t: 22, drug: "Atorvastatin", dose: "20 mg", note: "at bedtime", tone: "var(--ios-purple)" },
];
const SLOTS = [8, 12, 18, 22];
const NOW = 13.25;
const DAY_START = 6;
const DAY_END = 24;
/** The six days before today: 42 doses scheduled, 38 taken. */
const PRIOR = { taken: 38, scheduled: 42 };
const pos = (t: number) => ((t - DAY_START) / (DAY_END - DAY_START)) * 100;
const hh = (t: number) => `${String(Math.floor(t)).padStart(2, "0")}:${String(Math.round((t % 1) * 60)).padStart(2, "0")}`;

/** Healthcare · medium. Today's doses on a time track; tap a due dose to log it, the adherence rolls up. */
export function MedicationScheduleWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [taken, setTaken] = useState<Set<string>>(() => new Set(["met-am"]));
  const [notice, setNotice] = useState<{ id: number; text: string } | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 2200);
    return () => window.clearTimeout(t);
  }, [notice]);

  const due = DOSES.filter((d) => d.t <= NOW);
  const takenDue = due.filter((d) => taken.has(d.id)).length;
  const pending = due.length - takenDue;
  const adherence = (PRIOR.taken + takenDue) / (PRIOR.scheduled + due.length);
  const next = SLOTS.find((s) => s > NOW);
  const nextCount = DOSES.filter((d) => d.t === next).length;

  const tap = (d: Dose) => {
    if (taken.has(d.id)) return;
    if (d.t > NOW) {
      setNotice({ id: Date.now(), text: `${d.drug} isn't due until ${hh(d.t)}` });
      return;
    }
    setTaken((prev) => new Set(prev).add(d.id));
    setNotice({ id: Date.now(), text: `${d.drug} ${d.dose} logged at ${hh(NOW)}` });
  };

  return (
    <Widget size="medium" index={index} label="Medication schedule">
      <WidgetHeader
        icon={<Pill20Filled />}
        tint="var(--ios-pink)"
        title="Medications"
        subtitle={`Today · ${DOSES.length} doses`}
        extra={
          <div className="text-right leading-tight">
            <div className="text-[11px] text-tertiary">7-day adherence</div>
            <AnimatedNumber
              value={adherence}
              format={{ style: "percent", maximumFractionDigits: 0 }}
              className={cn(
                "text-[20px] leading-none font-semibold tracking-tight transition-colors duration-mid",
                adherence >= 0.9 ? "text-ios-green" : "text-heading",
              )}
            />
          </div>
        }
      />

      <div className="relative mx-4 mt-2.5">
        <div className="relative h-[30px]">
          {SLOTS.map((slot, si) => (
            <div
              key={slot}
              className="absolute bottom-0 flex -translate-x-1/2 gap-2"
              style={{ left: `${pos(slot)}%` }}
            >
              {DOSES.filter((d) => d.t === slot).map((d, di) => (
                <PillButton
                  key={d.id}
                  dose={d}
                  state={taken.has(d.id) ? "taken" : d.t <= NOW ? "due" : "upcoming"}
                  delay={delay + 0.2 + si * 0.12 + di * 0.05}
                  onTap={() => tap(d)}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="relative mt-1.5 h-3">
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-fill-secondary" />
          <motion.div
            className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-ios-pink/50 to-ios-pink"
            initial={{ width: 0 }}
            animate={{ width: `${pos(NOW)}%` }}
            transition={{ delay, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
          {SLOTS.map((slot) => {
            const slotDoses = DOSES.filter((d) => d.t === slot);
            const done = slotDoses.every((d) => taken.has(d.id));
            const late = slot <= NOW && !done;
            return (
              <span
                key={slot}
                className={cn(
                  "absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--widget-surface)] transition-colors duration-mid",
                  done ? "bg-ios-green" : late ? "bg-ios-orange" : "bg-fill",
                )}
                style={{ left: `${pos(slot)}%` }}
              />
            );
          })}
          <motion.span
            className="absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ios-pink"
            style={{ left: `${pos(NOW)}%` }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: [1, 1.35, 1] }}
            transition={{ delay: delay + 1.2, duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative mt-1 h-3 text-[10px] text-tertiary tabular">
          {SLOTS.map((slot) => (
            <span key={slot} className="absolute -translate-x-1/2 leading-3" style={{ left: `${pos(slot)}%` }}>
              {hh(slot)}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto flex h-[18px] items-center gap-2">
        <MemojiAvatar who="f7" size={18} />
        <div className="relative h-4 min-w-0 flex-1 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={notice?.id ?? `s-${pending}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={cn(
                "truncate whitespace-nowrap text-[11px] leading-4 font-medium",
                notice ? "text-secondary" : pending ? "text-ios-orange" : "text-ios-green",
              )}
            >
              {notice
                ? notice.text
                : pending
                  ? `Eleanor · ${pending} dose${pending > 1 ? "s" : ""} due · tap to log`
                  : `Eleanor · all caught up · next ${next ? hh(next) : "tomorrow"}${next ? ` (${nextCount})` : ""}`}
            </motion.div>
          </AnimatePresence>
        </div>
        <span className="shrink-0 text-[11px] text-tertiary">
          <AnimatedNumber value={taken.size} className="font-semibold text-heading" /> of {DOSES.length} taken
        </span>
      </div>
    </Widget>
  );
}

function PillButton({
  dose,
  state,
  delay,
  onTap,
}: {
  dose: Dose;
  state: "taken" | "due" | "upcoming";
  delay: number;
  onTap: () => void;
}) {
  const shake = useAnimationControls();
  return (
    <Tooltip
      title={
        <span className="tabular">
          {dose.drug} {dose.dose} · {hh(dose.t)} · {dose.note}
        </span>
      }
    >
      <motion.button
        type="button"
        aria-label={`${dose.drug} ${dose.dose}, ${state}`}
        onClick={() => {
          if (state === "upcoming") shake.start({ x: [0, -3, 3, -2, 2, 0], transition: { duration: 0.35 } });
          onTap();
        }}
        animate={shake}
        whileTap={{ scale: 0.88 }}
        className={cn(
          "relative grid size-[26px] cursor-pointer place-items-center rounded-full outline-none transition-colors duration-mid",
          state === "taken" && "bg-ios-green/15",
          state === "due" && "bg-fill-tertiary",
          state === "upcoming" && "bg-fill-quaternary",
        )}
      >
        <motion.span
          className="grid place-items-center"
          initial={{ scale: 0, rotate: -40 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 18, delay }}
        >
          <Capsule tone={dose.tone} dim={state === "upcoming"} />
        </motion.span>

        {state === "due" ? (
          <motion.span
            className="pointer-events-none absolute -inset-px rounded-full ring-2 ring-ios-orange"
            animate={{ opacity: [1, 0.35, 1], scale: [1, 1.08, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : null}

        <AnimatePresence>
          {state === "taken" ? (
            <motion.span
              key="check"
              className="absolute -right-1 -bottom-1 grid size-3.5 place-items-center rounded-full bg-ios-green text-[9px] text-white ring-2 ring-[var(--widget-surface)]"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.35, 1] }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <Checkmark12Filled />
            </motion.span>
          ) : null}
        </AnimatePresence>
      </motion.button>
    </Tooltip>
  );
}

/** A two-tone capsule, tilted the way a pill sits in a hand. */
function Capsule({ tone, dim }: { tone: string; dim?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden style={{ opacity: dim ? 0.5 : 1 }}>
      <g transform="rotate(-45 8 8)">
        <rect x="2" y="5" width="12" height="6" rx="3" fill={tone} opacity={0.35} />
        <path d="M8 5H5a3 3 0 0 0 0 6h3z" fill={tone} />
      </g>
    </svg>
  );
}
