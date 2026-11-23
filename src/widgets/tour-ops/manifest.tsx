import {
  Checkmark12Filled,
  ClipboardTaskListLtr20Filled,
  Dismiss12Filled,
  Globe12Regular,
  Location12Filled,
  ShieldDismiss16Regular,
} from "@fluentui/react-icons";
import { AnimatePresence, motion, type PanInfo, useMotionValue, useTransform } from "motion/react";
import { useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type CheckIn = "arrived" | "noShow" | null;
type Guest = {
  ref: string;
  lead: string;
  pax: number;
  note: string;
  uninsured?: number;
  visa?: "open";
  checkIn: CheckIn;
};
type Stop = { name: string; time: string; guests: Guest[] };

/* The manifest of departure:opt_kaibab_sedona|2026-11-09|09:00, pick-ups grouped by stop. */
const STOPS: Stop[] = [
  {
    name: "Hampton Inn Flagstaff",
    time: "08:15",
    guests: [
      { ref: "KY-26-0401", lead: "Hans Weber", pax: 2, note: "German-speaking guide", checkIn: "arrived" },
      { ref: "KY-26-0402", lead: "Sarah Kane", pax: 3, note: "1 child seat (age 5)", uninsured: 1, checkIn: "arrived" },
    ],
  },
  {
    name: "Weatherford Hotel",
    time: "08:30",
    guests: [
      { ref: "KY-26-0403", lead: "Brandon Ames", pax: 2, note: "Vegetarian lunch × 2", checkIn: null },
      { ref: "KY-26-0405", lead: "Megan Ayers", pax: 4, note: "Balance $240 on board", checkIn: null },
    ],
  },
  {
    name: "Heritage Square",
    time: "09:00",
    guests: [
      { ref: "KY-26-0412", lead: "Yusuf Al-Mansouri", pax: 2, note: "Arabic speaker · 2 adults", visa: "open", uninsured: 1, checkIn: null },
    ],
  },
];
const TOTAL = STOPS.flatMap((s) => s.guests).reduce((a, g) => a + g.pax, 0);
const SWIPE = 48;
const NEXT: Record<string, CheckIn> = { null: "arrived", arrived: "noShow", noShow: null };

function GuestRow({
  g,
  state,
  set,
  delay,
}: {
  g: Guest;
  state: CheckIn;
  set: (c: CheckIn) => void;
  delay: number;
}) {
  const x = useMotionValue(0);
  const showIn = useTransform(x, [8, SWIPE], [0, 1]);
  const showOut = useTransform(x, [-SWIPE, -8], [1, 0]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE) set("arrived");
    else if (info.offset.x < -SWIPE) set("noShow");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 30, delay }}
      className="relative h-[39px] shrink-0 overflow-hidden rounded-lg"
    >
      {/* What a swipe reveals */}
      <div aria-hidden className="absolute inset-0 flex items-center justify-between px-3 text-[11px] font-semibold">
        <motion.span style={{ opacity: showIn }} className="flex items-center gap-1 text-ios-green">
          <Checkmark12Filled /> Arrived
        </motion.span>
        <motion.span style={{ opacity: showOut }} className="flex items-center gap-1 text-ios-red">
          No-show <Dismiss12Filled />
        </motion.span>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.55}
        dragDirectionLock
        onDragEnd={onDragEnd}
        style={{ x }}
        className="relative flex h-full cursor-grab touch-pan-y items-center gap-2 bg-widget-surface px-1 active:cursor-grabbing"
      >
        {/* The wash that stays */}
        <motion.span
          aria-hidden
          className={cn("absolute inset-0 origin-left rounded-lg", state === "noShow" ? "bg-ios-red/12" : "bg-ios-green/12")}
          initial={false}
          animate={{ scaleX: state ? 1 : 0, opacity: state ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 28 }}
        />
        <MemojiAvatar
          who={g.lead}
          size={26}
          className={cn("relative transition-opacity", state === "noShow" && "opacity-50 grayscale")}
        />
        <div className="relative min-w-0 flex-1 leading-tight">
          <div className="flex min-w-0 items-center gap-1">
            <span
              className={cn(
                "truncate text-[12.5px] font-semibold",
                state === "noShow" ? "text-tertiary line-through" : "text-heading",
              )}
            >
              {g.lead}
            </span>
            <span className="shrink-0 text-[11px] font-medium text-tertiary tabular">×{g.pax}</span>
            {g.uninsured ? (
              <Tooltip title={`${g.uninsured} traveller not insured`}>
                <ShieldDismiss16Regular className="size-3 shrink-0 text-ios-orange" />
              </Tooltip>
            ) : null}
            {g.visa ? (
              <Tooltip title="Visa file open">
                <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-ios-purple/15 px-1 text-[9px] leading-[13px] font-semibold text-ios-purple">
                  <Globe12Regular className="size-2.5" />
                  Visa
                </span>
              </Tooltip>
            ) : null}
          </div>
          <div className="truncate text-[10.5px] text-tertiary">
            <span className="font-medium text-secondary tabular">{g.ref}</span> · {g.note}
          </div>
        </div>
        <motion.button
          type="button"
          aria-label={`${g.lead}: ${state ?? "waiting"}, tap to change`}
          onClick={() => set(NEXT[String(state)])}
          onPointerDownCapture={(e) => e.stopPropagation()}
          whileTap={{ scale: 0.85 }}
          className={cn(
            "relative grid size-[24px] shrink-0 cursor-pointer place-items-center rounded-full transition-colors",
            state === "arrived" && "bg-ios-green/15 text-ios-green",
            state === "noShow" && "bg-ios-red text-white",
            !state && "border-[1.5px] border-dashed border-[var(--ant-color-border)] text-tertiary",
          )}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {state ? (
              <motion.span
                key={state}
                className="grid"
                initial={{ scale: 0, rotate: -60 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 520, damping: 20 }}
              >
                {state === "arrived" ? <Checkmark12Filled /> : <Dismiss12Filled />}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

/** Tour ops · large. The departure's manifest grouped by pick-up stop with notes and visa/insurance flags; swipe a guest right for arrived or left for no-show, and the counts roll. */
export function ManifestWidget({ index }: { index?: number }) {
  const [checks, setChecks] = useState<Record<string, CheckIn>>(() =>
    Object.fromEntries(STOPS.flatMap((s) => s.guests).map((g) => [g.ref, g.checkIn])),
  );
  const delay = 0.3 + (index ?? 0) * 0.06;
  const guests = STOPS.flatMap((s) => s.guests);
  const paxBy = (c: CheckIn) => guests.filter((g) => checks[g.ref] === c).reduce((a, g) => a + g.pax, 0);
  const arrived = paxBy("arrived");
  const noShow = paxBy("noShow");
  const waiting = TOTAL - arrived - noShow;
  let row = 0;

  return (
    <Widget size="large" index={index} label="Manifest">
      <WidgetHeader
        icon={<ClipboardTaskListLtr20Filled />}
        tint="var(--ios-teal)"
        title="Manifest · Sedona & Oak Creek"
        subtitle="Today 09:00 · Kevin Walsh · KAC 201"
        extra={
          <div className="text-right leading-tight">
            <div className="text-[10px] text-tertiary">On board</div>
            <div className="text-[15px] font-semibold text-heading">
              <AnimatedNumber value={arrived} />
              <span className="text-[11px] font-medium text-tertiary">/{TOTAL}</span>
            </div>
          </div>
        }
      />

      <div className="mt-2 flex h-[22px] items-center gap-1.5 text-[11px] whitespace-nowrap">
        {[
          { n: arrived, label: "arrived", cls: "bg-ios-green/15 text-ios-green" },
          { n: noShow, label: "no-show", cls: "bg-ios-red/15 text-ios-red" },
          { n: waiting, label: "waiting", cls: "bg-fill-tertiary text-secondary" },
        ].map((c) => (
          <span key={c.label} className={cn("rounded-full px-2 py-0.5 font-semibold", c.cls)}>
            <AnimatedNumber value={c.n} /> {c.label}
          </span>
        ))}
        <span className="ml-auto text-[10.5px] text-tertiary">Swipe → in · ← no-show</span>
      </div>

      <div className="mt-1.5 flex h-1 overflow-hidden rounded-full bg-fill-secondary">
        <motion.span
          className="h-full bg-ios-green"
          initial={{ width: 0 }}
          animate={{ width: `${(arrived / TOTAL) * 100}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 22, delay }}
        />
        <motion.span
          className="h-full bg-ios-red"
          initial={{ width: 0 }}
          animate={{ width: `${(noShow / TOTAL) * 100}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 22 }}
        />
      </div>

      <div className="mt-1.5 flex min-h-0 flex-1 flex-col gap-2">
        {STOPS.map((s, si) => {
          const stopPax = s.guests.reduce((a, g) => a + g.pax, 0);
          const stopIn = s.guests.filter((g) => checks[g.ref] === "arrived").reduce((a, g) => a + g.pax, 0);
          return (
            <div
              key={s.name}
              className={cn(
                "relative flex flex-col gap-1",
                si > 0 && "before:absolute before:inset-x-0 before:-top-1 before:h-[0.5px] before:bg-split",
              )}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + si * 0.12 }}
                className="flex h-[21px] items-center gap-1 px-1 text-[11px] whitespace-nowrap"
              >
                <Location12Filled className="shrink-0 text-ios-teal" />
                <span className="truncate font-semibold text-secondary">{s.name}</span>
                <span className="font-medium text-tertiary tabular">· {s.time}</span>
                <span
                  className={cn(
                    "ml-auto font-semibold tabular",
                    stopIn === stopPax ? "text-ios-green" : "text-tertiary",
                  )}
                >
                  <AnimatedNumber value={stopIn} />/{stopPax} pax
                </span>
              </motion.div>
              {s.guests.map((g) => {
                row += 1;
                return (
                  <GuestRow
                    key={g.ref}
                    g={g}
                    state={checks[g.ref]}
                    set={(c) => setChecks((m) => ({ ...m, [g.ref]: c }))}
                    delay={delay + 0.05 + row * 0.05}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </Widget>
  );
}
