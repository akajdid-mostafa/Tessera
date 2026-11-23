import { Grid20Filled } from "@fluentui/react-icons";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { FD, type FrontDesk, HK, PROPERTY, ROOM_TYPES, ROOMS, type Room } from "./_parts-a";

/* Tonight's front-desk state per room id 1–100 (a arriving, o occupied, d departing, x departed, t turnover,
 * O out of order, b blocked, v vacant). */
const FD_CODES =
  "aovOoxvoot" + "tdooaxvooo" + "avdoovoodv" + "ooaovoxooo" + "voaovoovdo" +
  "xvoodaoovo" + "ovxoooaovo" + "voaoOovooo" + "voaoovbbov" + "oavotoaxvv";
const FD_OF: Record<string, FrontDesk> = {
  a: "arriving", o: "occupied", d: "departing", x: "departed", t: "turnover", O: "out_of_order", b: "blocked", v: "vacant",
};

const GUESTS = [
  "Mia Keller", "Eric Wheeler", "Sarah Collins", "Oliver Grant", "Leah Simmons", "Lucas Moreau", "Hannah Fischer",
  "Mark Allen", "Isabella Conti", "Noah Bennett", "Diane Cook", "Jakob Lindqvist", "Chloé Martin", "Adam Porter",
  "Grace Turner", "Felix Wagner", "Alyssa Keane", "Zoe Harris", "Colin Ward", "Laura Bianchi", "Ethan Brooks",
  "Sierra Lane", "Tobias Klein", "Molly Reed", "Ryan Walsh", "Inês Duarte", "Kyle Dunn", "Elena Petrova",
];

type Tile = {
  room: Room;
  fd: FrontDesk;
  guest: string | null;
  /** Second line of the hover detail: night n of m, an arrival or a checkout. */
  note: string;
  block?: string;
};

/* The scenario rooms keep the PMS's own guests; every other room gets a stable synthetic one. */
const SCENARIO: Record<string, Partial<Tile>> = {
  "101": { guest: "Connor Hale", note: "Arrives 18:30 · 1 night" },
  "102": { guest: "Cody Hayes", note: "Night 1 of 2" },
  "104": { block: "Broken AC", note: "Out of order until Oct 16" },
  "105": { guest: "David Miller", note: "Night 3 of 4" },
  "108": { guest: "Ellie Dawson", note: "Night 4 of 6" },
  "110": { guest: "Jenna Clark → Anna Schmidt", note: "Out 12:00 · in 14:00" },
  "111": { guest: "Brian Young → Claire Dubois", note: "Out 11:00 · in 14:00" },
  "112": { guest: "Erin Cole", note: "Checks out 10:30" },
  "113": { guest: "Paige Ellis", note: "Night 5 of 7" },
  "115": { guest: "Jacob Ames", note: "Arrives 15:00 · 2 nights" },
  "206": { guest: "Lena Brooks", note: "Night 2 of 2 · split 1/2" },
  "210": { guest: "Nina Petrova", note: "Night 4 of 4" },
  "211": { guest: "Tom Baker", note: "Checks out 12:00" },
  "418": { block: "Shower leak", note: "Out of order until Oct 15" },
  S1: { block: "Owner use", note: "Blocked until Oct 16" },
  S2: { block: "Owner use", note: "Blocked until Oct 16" },
  V2: { guest: "Hans Becker → Olivia Brown", note: "Out 12:00 · in 13:00" },
  V3: { guest: "Alicia Tate", note: "Night 7 of 11" },
  V4: { guest: "Julia Novak", note: "Arrives today · no ETA" },
};

const synth = (room: Room, fd: FrontDesk): Partial<Tile> => {
  const guest = GUESTS[(room.id * 7) % GUESTS.length];
  const of = 2 + (room.id % 5);
  const n = 1 + ((room.id * 3) % of);
  switch (fd) {
    case "occupied":
      return { guest, note: `Night ${n} of ${of}` };
    case "arriving":
      return { guest, note: `Arrives ${14 + (room.id % 6)}:${room.id % 2 ? "30" : "00"} · ${of} nights` };
    case "departing":
      return { guest, note: "Checks out 12:00" };
    case "departed":
      return { guest: null, note: `${guest} left ${9 + (room.id % 3)}:${room.id % 2 ? "40" : "15"}` };
    default:
      return { guest: null, note: "Free tonight" };
  }
};

const INITIAL: Tile[] = ROOMS.map((room) => {
  const fd = FD_OF[FD_CODES[room.id - 1]] ?? "vacant";
  return { room, fd, guest: null, note: "", ...synth(room, fd), ...SCENARIO[room.number] };
});

/* The desk's morning, replayed: check-ins, check-outs and a clean landing, one every few seconds. */
type Change = { number: string; to: Partial<Tile> & { hk?: Room["hk"] }; say: string };
const CHANGES: Change[] = [
  { number: "115", to: { fd: "occupied", note: "Night 1 of 2" }, say: "115 · Jacob Ames checked in" },
  { number: "112", to: { fd: "departed", guest: null, note: "Erin Cole left 10:30" }, say: "112 · Erin Cole checked out" },
  { number: "211", to: { fd: "departed", guest: null, note: "Tom Baker left 11:52" }, say: "211 · Tom Baker checked out" },
  { number: "112", to: { hk: "clean" }, say: "112 · housekeeping set Clean" },
  { number: "101", to: { fd: "occupied", note: "Night 1 of 1" }, say: "101 · Connor Hale checked in" },
  { number: "211", to: { hk: "inspected" }, say: "211 · housekeeping set Inspected" },
];

const CHIPS = [
  { key: "arrivals", label: "Arrivals", color: "var(--ios-indigo)" },
  { key: "departures", label: "Departures", color: "var(--ios-orange)" },
  { key: "inHouse", label: "In house", color: "var(--ios-green)" },
  { key: "turnover", label: "Turnover", color: "var(--ios-teal)" },
  { key: "vacantClean", label: "Clean", color: HK.clean.color },
  { key: "vacantDirty", label: "Dirty", color: HK.dirty.color },
  { key: "outOfOrder", label: "OOO", color: "var(--ios-pink)" },
  { key: "blocked", label: "Blocked", color: "var(--ios-purple)" },
] as const;
type Chip = (typeof CHIPS)[number]["key"];

const free = (t: Tile) => t.fd === "vacant" || t.fd === "departed";
/* One rule for both the counts and the filter, so a chip's count is always the tiles it shows. */
const inChip = (t: Tile, chip: Chip) => {
  switch (chip) {
    case "arrivals":
      return t.fd === "arriving" || t.fd === "turnover";
    case "departures":
      return t.fd === "departing" || t.fd === "turnover";
    case "inHouse":
      return t.fd === "occupied";
    case "turnover":
      return t.fd === "turnover";
    case "vacantClean":
      return free(t) && (t.room.hk === "clean" || t.room.hk === "inspected");
    case "vacantDirty":
      return free(t) && (t.room.hk === "dirty" || t.room.hk === "pickup");
    case "outOfOrder":
      return t.fd === "out_of_order";
    case "blocked":
      return t.fd === "blocked";
  }
};

const FLOORS = [0, 1, 2, 3, 4, 5, 6];
const floorLabel = (f: number) => (f === 0 ? "G" : `${f}F`);
const COLS = 14;

const tileFill = (fd: FrontDesk) => {
  const c = FD[fd].color;
  if (fd === "vacant") return undefined;
  if (fd === "out_of_order" || fd === "blocked")
    return {
      backgroundColor: `color-mix(in srgb, ${c} 16%, transparent)`,
      backgroundImage: `repeating-linear-gradient(135deg, transparent 0 4px, color-mix(in srgb, ${c} 30%, transparent) 4px 5.5px)`,
    };
  return { backgroundColor: `color-mix(in srgb, ${c} ${fd === "departed" ? 14 : 22}%, transparent)` };
};

/** Front desk · large. The room rack: every room as a tile colored by tonight's front-desk state with a housekeeping dot; summary chips filter and the tiles reflow, hovering a tile reads its guest and night. */
export function RoomRackWidget({ index }: { index?: number }) {
  const uid = useId();
  const [tiles, setTiles] = useState<Tile[]>(INITIAL);
  const [chips, setChips] = useState<Chip[]>([]);
  const [hover, setHover] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [flash, setFlash] = useState<{ number: string; say: string } | null>(null);
  const [touched, setTouched] = useState(false);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => setStep((s) => s + 1), 4200);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (step === 0) return;
    const k = (step - 1) % (CHANGES.length + 2);
    if (k >= CHANGES.length) {
      // Two quiet beats, then the morning starts over.
      if (k === CHANGES.length + 1) {
        setTiles(INITIAL);
        setFlash(null);
      }
      return;
    }
    const c = CHANGES[k];
    setTouched(true);
    setTiles((ts) =>
      ts.map((t) =>
        t.room.number !== c.number
          ? t
          : { ...t, ...c.to, room: c.to.hk ? { ...t.room, hk: c.to.hk } : t.room },
      ),
    );
    setFlash({ number: c.number, say: c.say });
  }, [step]);

  const counts = Object.fromEntries(CHIPS.map((c) => [c.key, tiles.filter((t) => inChip(t, c.key)).length])) as Record<Chip, number>;
  const shown = (t: Tile) => chips.length === 0 || chips.some((c) => inChip(t, c));
  const occ = counts.inHouse / (tiles.length - counts.outOfOrder);

  // The grid: a floor marker, then its rooms. A floor with nothing to show drops its marker too.
  const cells: ({ kind: "floor"; floor: number } | { kind: "tile"; t: Tile })[] = FLOORS.flatMap((f) => {
    const rooms = tiles.filter((t) => t.room.floor === f && shown(t));
    return rooms.length ? [{ kind: "floor" as const, floor: f }, ...rooms.map((t) => ({ kind: "tile" as const, t }))] : [];
  });
  const peek = (n: string | null) => {
    setTouched(true);
    setHover(n);
  };
  const focus = hover ? tiles.find((t) => t.room.number === hover) : null;

  return (
    <Widget size="large" index={index} label="Room rack">
      <WidgetHeader
        icon={<Grid20Filled />}
        tint="var(--ios-indigo)"
        title="Room Rack"
        subtitle={
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={flash?.say ?? "base"}
              className="block truncate"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {flash ? flash.say : `${PROPERTY} · Today · 100 rooms`}
            </motion.span>
          </AnimatePresence>
        }
        extra={
          <div className="text-right leading-none">
            <AnimatedNumber
              value={occ}
              format={{ style: "percent", maximumFractionDigits: 0 }}
              className="text-[17px] font-semibold tracking-tight text-heading"
            />
            <div className="mt-0.5 text-[10px] text-tertiary">occupied</div>
          </div>
        }
      />

      <div className="mt-2.5 grid grid-cols-4 gap-1">
        {CHIPS.map((c, i) => {
          const on = chips.includes(c.key);
          return (
            <motion.button
              key={c.key}
              type="button"
              aria-pressed={on}
              onClick={() => {
                setTouched(true);
                setChips((cs) => (cs.includes(c.key) ? cs.filter((x) => x !== c.key) : [...cs, c.key]));
              }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 420, damping: 28, delay: delay + i * 0.03 }}
              className={cn(
                "flex h-[26px] min-w-0 cursor-pointer items-center gap-1 rounded-lg px-1.5 text-left transition-colors duration-200",
                on ? "bg-fill-secondary" : "bg-fill-quaternary hover:bg-fill-tertiary",
              )}
              style={on ? { boxShadow: `inset 0 0 0 1px ${c.color}` } : undefined}
            >
              <span className="size-1.5 shrink-0 rounded-full" style={{ background: c.color }} />
              <span className="min-w-0 flex-1 truncate text-[10px] text-secondary">{c.label}</span>
              <AnimatedNumber value={counts[c.key]} className="text-[12px] font-semibold text-heading" />
            </motion.button>
          );
        })}
      </div>

      <LayoutGroup id={uid}>
        <div
          className="mt-2 grid content-start gap-[2px]"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
          onMouseLeave={() => peek(null)}
        >
          <AnimatePresence mode="popLayout">
            {cells.map((cell, i) => {
              const row = Math.floor(i / COLS);
              const col = i % COLS;
              const enter = touched ? 0 : delay + 0.15 + row * 0.05 + col * 0.012;
              if (cell.kind === "floor")
                return (
                  <motion.span
                    key={`f${cell.floor}`}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 32, delay: enter }}
                    className="grid h-[28px] place-items-center text-[9.5px] font-semibold text-tertiary tabular"
                  >
                    {floorLabel(cell.floor)}
                  </motion.span>
                );
              const { t } = cell;
              const st = FD[t.fd];
              const lit = flash?.number === t.room.number;
              return (
                <motion.button
                  key={t.room.number}
                  type="button"
                  layout
                  aria-label={`${t.room.number}, ${ROOM_TYPES[t.room.type].name}, ${st.label}, ${HK[t.room.hk].label}`}
                  onMouseEnter={() => peek(t.room.number)}
                  onFocus={() => peek(t.room.number)}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: hover && hover !== t.room.number ? 0.55 : 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  whileHover={{ scale: 1.14, zIndex: 2 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{
                    layout: { type: "spring", stiffness: 380, damping: 32 },
                    default: { type: "spring", stiffness: 420, damping: 26, delay: enter },
                    opacity: { duration: 0.2, delay: enter },
                  }}
                  className={cn(
                    "relative grid h-[28px] min-w-0 cursor-default place-items-center rounded-[4px] transition-colors duration-500",
                    st.text,
                    t.fd === "vacant" && "bg-fill-quaternary",
                  )}
                  style={tileFill(t.fd)}
                >
                  <span className="text-[9.5px] leading-none font-semibold tabular">{t.room.number}</span>
                  <motion.span
                    key={t.room.hk}
                    className="absolute top-[3px] right-[3px] size-[5px] rounded-full"
                    style={{ background: HK[t.room.hk].color }}
                    initial={{ scale: touched ? 2.4 : 1 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 14 }}
                  />
                  {lit ? (
                    <motion.span
                      key={`${flash?.say}`}
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-[4px]"
                      style={{ boxShadow: `inset 0 0 0 1px ${st.color ?? "var(--ant-color-text-tertiary)"}` }}
                      initial={{ opacity: 1 }}
                      animate={{ opacity: [1, 0.2, 1, 0] }}
                      transition={{ duration: 1.6 }}
                    />
                  ) : null}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </LayoutGroup>

      <div className="mt-auto flex h-4 items-center gap-1.5 pt-0 text-[11px] leading-4">
        <AnimatePresence mode="wait" initial={false}>
          {focus ? (
            <motion.div
              key="detail"
              className="flex min-w-0 flex-1 items-center gap-1.5"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <span className="size-2 shrink-0 rounded-[3px]" style={{ background: FD[focus.fd].color ?? "var(--ant-color-fill)" }} />
              <span className="shrink-0 font-semibold text-heading tabular">{focus.room.number}</span>
              <span className="min-w-0 truncate text-secondary">
                {ROOM_TYPES[focus.room.type].name} · {focus.guest ?? focus.block ?? FD[focus.fd].label}
              </span>
              <span className="ml-auto shrink-0 text-tertiary tabular">{focus.note}</span>
            </motion.div>
          ) : (
            <motion.div
              key="legend"
              className="flex min-w-0 flex-1 items-center justify-between text-[10px] text-tertiary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {(["occupied", "arriving", "departing", "turnover", "vacant"] as FrontDesk[]).map((k) => (
                <span key={k} className="flex items-center gap-1 whitespace-nowrap">
                  <span
                    className={cn("size-2 rounded-[3px]", k === "vacant" && "bg-fill-secondary")}
                    style={k === "vacant" ? undefined : { background: FD[k].color ?? undefined }}
                  />
                  {FD[k].label}
                </span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
