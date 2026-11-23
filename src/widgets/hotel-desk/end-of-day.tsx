import {
  ArrowUndo16Regular,
  Broom16Regular,
  Checkmark12Filled,
  Checkmark16Filled,
  ChevronDown12Filled,
  DoorArrowLeft16Regular,
  Note16Regular,
  PersonClock16Regular,
  Wallet16Regular,
  WeatherMoon20Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { BUSINESS_DAY, PROPERTY, RoomChip, USD, usd, useInterval } from "./_parts-b";

type SecId = "arr" | "out" | "bal" | "dirty";
type Item = { id: string; name: string; room: string; meta: string; red?: boolean; amount?: number; person: boolean };
type Section = { id: SecId; title: string; icon: ReactNode; text: string; seg: string; items: Item[] };

const SECTIONS: Section[] = [
  {
    id: "arr",
    title: "Arrivals not here yet",
    icon: <PersonClock16Regular />,
    text: "text-ios-blue",
    seg: "bg-ios-blue/35",
    items: [
      { id: "ke", name: "Connor Hale", room: "1", meta: "ETA 23:30", person: true },
      { id: "jn", name: "Julia Novak", room: "97", meta: "Reserved · ETA 16:00", person: true },
      { id: "dk", name: "Derek Kane", room: "Unassigned", meta: "Reserved · not paid", person: true },
    ],
  },
  {
    id: "out",
    title: "Still to check out",
    icon: <DoorArrowLeft16Regular />,
    text: "text-ios-orange",
    seg: "bg-ios-orange/35",
    items: [
      { id: "tb", name: "Tom Baker", room: "29", meta: "Late out 19:00", person: true },
      { id: "ek", name: "Erin Cole", room: "12", meta: usd(114), red: true, amount: 114, person: true },
    ],
  },
  {
    id: "bal",
    title: "Open balances",
    icon: <Wallet16Regular />,
    text: "text-ios-red",
    seg: "bg-ios-red/35",
    items: [
      { id: "at", name: "Alicia Tate", room: "96", meta: usd(924), red: true, amount: 924, person: true },
      { id: "ed", name: "Ellie Dawson", room: "8", meta: usd(648), red: true, amount: 648, person: true },
      { id: "pu", name: "Paige Ellis", room: "13", meta: usd(392), red: true, amount: 392, person: true },
      { id: "np", name: "Nina Petrova", room: "28", meta: usd(175), red: true, amount: 175, person: true },
    ],
  },
  {
    id: "dirty",
    title: "Dirty rooms free tonight",
    icon: <Broom16Regular />,
    text: "text-ios-purple",
    seg: "bg-ios-purple/35",
    items: [
      { id: "r12", name: "Standard Double", room: "12", meta: "Dirty", person: false },
      { id: "r41", name: "Deluxe Garden View", room: "41", meta: "Dirty", person: false },
      { id: "r63", name: "Junior Suite", room: "63", meta: "Pickup", person: false },
    ],
  },
];
const ALL = SECTIONS.flatMap((s) => s.items.map((it) => ({ ...it, sec: s })));
const AGENT = "Morgan Ash";
const HANDOVER_AT = "18:42";

function noteFor(done: string[]) {
  const open = (id: SecId) => SECTIONS.find((s) => s.id === id)!.items.filter((it) => !done.includes(it.id));
  const parts: string[] = [];
  const arr = open("arr");
  if (arr.length) parts.push(`${arr.map((i) => i.name).join(", ")} not here yet.`);
  const out = open("out");
  if (out.length) parts.push(`${out.map((i) => i.name).join(", ")} still to check out.`);
  const bal = open("bal");
  if (bal.length) {
    const sum = bal.reduce((s, i) => s + (i.amount ?? 0), 0);
    parts.push(`${bal.length} ${bal.length === 1 ? "balance" : "balances"} open, ${usd(sum)}.`);
  }
  const dirty = open("dirty");
  if (dirty.length) parts.push(`${dirty.length === 1 ? "Room" : "Rooms"} ${dirty.map((i) => i.room).join(", ")} dirty, free tonight.`);
  return parts.length ? parts.join(" ") : "Everything is closed for the night audit.";
}

/** Front desk · large. The end-of-day checklist (arrivals not here yet, still to check out, open balances, dirty rooms free tonight) with expandable rows to tick off; Handover sweeps every section to a check and types a note for the next shift. */
export function EndOfDayWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [done, setDone] = useState<string[]>(["r63"]);
  const [expanded, setExpanded] = useState<SecId | null>("arr");
  const [phase, setPhase] = useState<"open" | "sweep" | "saved">("open");
  const [note, setNote] = useState("");
  const [typed, setTyped] = useState(0);
  const [meta, setMeta] = useState<Record<string, string>>({});
  const [flash, setFlash] = useState<string | null>(null);

  // Midway through the shift a late guest walks in, and the desk ticks them off.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setDone((d) => (d.includes("jn") ? d : [...d, "jn"]));
      setMeta((m) => ({ ...m, jn: "Arrived 18:21" }));
      setFlash("jn");
    }, (delay + 6) * 1000);
    return () => window.clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 1400);
    return () => window.clearTimeout(t);
  }, [flash]);

  useEffect(() => {
    if (phase !== "sweep") return;
    const t = window.setTimeout(() => setPhase("saved"), 900);
    return () => window.clearTimeout(t);
  }, [phase]);

  useInterval(() => setTyped((n) => Math.min(note.length, n + 2)), phase === "saved" && typed < note.length ? 28 : null);

  const toggle = (id: string) => {
    if (phase !== "open") return;
    setDone((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  };
  const handover = () => {
    setNote(noteFor(done));
    setTyped(0);
    setExpanded(null);
    setPhase("sweep");
  };
  const reopen = () => {
    setPhase("open");
    setNote("");
    setTyped(0);
    setExpanded("arr");
  };

  const openCount = ALL.filter((it) => !done.includes(it.id)).length;
  const handed = phase !== "open";

  return (
    <Widget
      size="large"
      index={index}
      label="End of day"
      glow={{ mode: "pulse", colors: ["#30D158", "#64D2FF", "#30D158"], blur: 20, duration: 1.4 }}
      glowActive={phase === "sweep"}
    >
      <WidgetHeader
        icon={<WeatherMoon20Filled />}
        tint="var(--ios-indigo)"
        title="End of day"
        subtitle={`${PROPERTY} · ${BUSINESS_DAY} · Evening shift`}
        extra={<span className="pt-0.5 text-[11px] whitespace-nowrap text-tertiary">Night audit 02:00</span>}
      />

      {/* Hero: what is still open, and one pip per item */}
      <div className="mt-2">
        <div className="flex h-[34px] items-baseline-last justify-between">
          <div className="flex items-baseline gap-1.5 leading-none">
            <AnimatedNumber
              value={openCount}
              className={cn("text-[30px] font-semibold tracking-tight", openCount ? "text-heading" : "text-ios-green")}
            />
            <span className="text-[12px] text-tertiary">{handed ? "carried over" : "open"}</span>
          </div>
          <div className="pb-0.5 text-[11px] text-tertiary tabular">
            <span className="font-semibold text-ios-green">
              <AnimatedNumber value={ALL.length - openCount} />
            </span>{" "}
            of {ALL.length} cleared
          </div>
        </div>
        <div className="mt-1.5 flex h-[6px] gap-[3px]">
          {ALL.map((it, i) => {
            const ok = done.includes(it.id);
            return (
              <motion.span
                key={it.id}
                className={cn("flex-1 origin-bottom rounded-full transition-colors duration-300", ok ? "bg-ios-green" : it.sec.seg)}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: delay + i * 0.03 }}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-2.5 flex min-h-0 flex-col gap-1">
        {SECTIONS.map((s, si) => {
          const left = s.items.filter((it) => !done.includes(it.id));
          const isOpen = expanded === s.id;
          const sum = s.id === "bal" ? left.reduce((a, it) => a + (it.amount ?? 0), 0) : null;
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30, delay: delay + 0.15 + si * 0.06 }}
              className="overflow-hidden rounded-[10px] bg-fill-quaternary"
            >
              <button
                type="button"
                disabled={handed}
                aria-expanded={isOpen}
                onClick={() => setExpanded((e) => (e === s.id ? null : s.id))}
                className="relative flex h-[28px] w-full cursor-pointer items-center gap-2 px-2 text-left disabled:cursor-default"
              >
                <AnimatePresence>
                  {handed ? (
                    <motion.span
                      key="sweep"
                      aria-hidden
                      className="absolute inset-0 origin-left bg-ios-green/15"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: si * 0.12 }}
                    />
                  ) : null}
                </AnimatePresence>
                <span className={cn("relative flex text-[16px]", s.text)}>{s.icon}</span>
                <span className="relative min-w-0 flex-1 truncate text-[12.5px] font-semibold text-heading">{s.title}</span>
                {sum !== null && sum > 0 && !handed ? (
                  <AnimatedNumber value={sum} format={USD} className="relative text-[11px] font-medium text-ios-red" />
                ) : null}
                <span className="relative grid h-[18px] min-w-[22px] place-items-center">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {handed || left.length === 0 ? (
                      <motion.span
                        key="ok"
                        className="grid size-[18px] place-items-center rounded-full bg-ios-green text-white"
                        initial={{ scale: 0, rotate: -60 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 520, damping: 16, delay: handed ? si * 0.12 + 0.25 : 0 }}
                      >
                        <Checkmark12Filled />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="n"
                        className="rounded-full bg-fill-secondary px-1.5 text-[11px] leading-[18px] font-semibold text-secondary"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                      >
                        <AnimatedNumber value={left.length} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <motion.span
                  className="relative flex text-tertiary"
                  animate={{ rotate: isOpen ? 180 : 0, opacity: handed ? 0 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                >
                  <ChevronDown12Filled />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    key="rows"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  >
                    <div className="px-2 pb-1">
                      {s.items.map((it) => {
                        const ok = done.includes(it.id);
                        return (
                          <div
                            key={it.id}
                            className={cn(
                              "relative flex h-[25px] items-center gap-2 border-split transition-colors [&:not(:first-child)]:border-t-[0.5px]",
                              flash === it.id && "bg-ios-green/10",
                            )}
                          >
                            {it.person ? (
                              <MemojiAvatar who={it.name} size={18} />
                            ) : (
                              <RoomChip room={it.room} className="h-[18px] min-w-[24px] text-[10px]" />
                            )}
                            <span
                              className={cn(
                                "min-w-0 flex-1 truncate text-[12px] transition-colors",
                                ok ? "text-tertiary line-through" : "text-heading",
                              )}
                            >
                              {it.name}
                              {it.person ? <span className="text-tertiary tabular"> · {it.room}</span> : null}
                            </span>
                            <span
                              className={cn(
                                "shrink-0 text-[11px] tabular",
                                ok ? "text-tertiary" : it.red ? "font-semibold text-ios-red" : "text-secondary",
                              )}
                            >
                              {meta[it.id] ?? it.meta}
                            </span>
                            <motion.button
                              type="button"
                              aria-label={ok ? `Reopen ${it.name}` : `Tick off ${it.name}`}
                              aria-pressed={ok}
                              onClick={() => toggle(it.id)}
                              whileTap={{ scale: 0.8 }}
                              className={cn(
                                "grid size-[18px] shrink-0 cursor-pointer place-items-center rounded-full transition-colors duration-200",
                                ok ? "bg-ios-green/15 text-ios-green" : "bg-fill-secondary hover:bg-fill",
                              )}
                            >
                              <AnimatePresence initial={false}>
                                {ok ? (
                                  <motion.span
                                    key="c"
                                    className="grid"
                                    initial={{ scale: 0, rotate: -60 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0 }}
                                    transition={{ type: "spring", stiffness: 520, damping: 16 }}
                                  >
                                    <Checkmark12Filled />
                                  </motion.span>
                                ) : null}
                              </AnimatePresence>
                            </motion.button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <div className="relative mt-auto pt-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {phase === "saved" ? (
            <motion.div
              key="note"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
            >
              <div className="rounded-[12px] bg-ios-yellow/12 p-2.5 ring-1 ring-ios-yellow/25 ring-inset">
                <div className="flex items-center gap-1.5">
                  <MemojiAvatar who={AGENT} size={20} />
                  <span className="text-[12px] font-semibold text-heading">{AGENT}</span>
                  <span className="text-[11px] text-tertiary tabular">· {HANDOVER_AT} · Note for the next shift</span>
                </div>
                <p className="mt-1 line-clamp-3 min-h-[45px] text-[11.5px] leading-[15px] text-secondary">
                  {note.slice(0, typed)}
                  {typed < note.length ? (
                    <motion.span
                      className="ml-px inline-block h-[11px] w-[1.5px] translate-y-[1px] bg-ios-orange"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    />
                  ) : null}
                </p>
              </div>
              <div className="mt-1.5 flex h-[22px] items-center gap-1.5 text-[11px]">
                <Checkmark16Filled className="text-ios-green" />
                <span className="font-medium text-ios-green">Saved on today's note</span>
                <Button
                  size="small"
                  variant="text"
                  color="default"
                  icon={<ArrowUndo16Regular />}
                  onClick={reopen}
                  className="ml-auto text-[11px]"
                >
                  Reopen
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="bar"
              className="flex h-[32px] items-center gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: phase === "sweep" ? 0.5 : 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            >
              <MemojiAvatar who={AGENT} size={26} />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[12px] font-semibold text-heading">{AGENT}</div>
                <div className="truncate text-[11px] text-tertiary">Front desk · 14:00–22:00</div>
              </div>
              <Button
                type="primary"
                shape="round"
                icon={<Note16Regular />}
                loading={phase === "sweep"}
                onClick={handover}
                className="font-semibold"
              >
                Handover
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
