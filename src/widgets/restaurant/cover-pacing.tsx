import { CalendarLtr20Filled, People16Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Switch } from "@/registry/antuikit/ui/switch";

/* Tonight in 15-minute slots, 17:00–22:45. It is 18:40, inside the 18:30 slot. */
const SLOTS = Array.from({ length: 24 }, (_, k) => 17 * 60 + k * 15);
const START = [6, 8, 10, 12, 14, 18, 22, 24, 30, 34, 32, 26, 24, 20, 18, 16, 12, 10, 8, 6, 4, 4, 2, 2];
const NOW = 6;
const CAP = 28;
const MAX = 40;

const NAMES = ["Lindqvist", "Okafor", "Moreau", "Haddad", "Brennan", "Tanaka", "Silva", "Novak", "Rossi", "Kowalski", "Duarte", "Fischer", "Mensah", "Varga", "Ibarra"];
const NOTES = ["Birthday", "Nut allergy", "Window", "", "Anniversary", "High chair", "", "Regulars"];
const SIZES = [4, 2, 6, 2, 3, 4, 5, 2, 8];

const clock = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;

/** The slot's bookings, largest first, filled out to its cover count. */
function partiesFor(slot: number, covers: number) {
  const out: { name: string; size: number; table: number; note: string }[] = [];
  let left = covers;
  for (let k = 0; left > 0; k++) {
    const size = Math.min(left, SIZES[(slot * 3 + k) % SIZES.length]);
    out.push({
      name: NAMES[(slot * 5 + k * 7) % NAMES.length],
      size,
      table: 2 + ((slot * 7 + k * 5) % 28),
      note: NOTES[(slot + k * 3) % NOTES.length],
    });
    left -= size;
  }
  return out.sort((a, b) => b.size - a.size);
}

/** Restaurant · large. Tonight's covers per 15-minute slot against the kitchen's pacing cap with a NOW marker, online bookings landing live; pick a slot to see its biggest parties and hold it from online booking. */
export function CoverPacingWidget({ index }: { index?: number }) {
  const [covers, setCovers] = useState(START);
  const [sel, setSel] = useState(9);
  const [held, setHeld] = useState<number[]>([]);
  const [landed, setLanded] = useState<{ slot: number; id: number } | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  // Online bookings keep landing in open future slots; walk-ins add to the current one.
  useEffect(() => {
    const t = window.setInterval(() => {
      const walkIn = Math.random() < 0.3;
      const slot = walkIn ? NOW : NOW + 1 + Math.floor(Math.random() * 8);
      if (!walkIn && held.includes(slot)) return;
      const size = 2 + Math.floor(Math.random() * 3);
      setCovers((cs) => cs.map((c, k) => (k === slot ? Math.min(MAX - 2, c + size) : c)));
      setLanded({ slot, id: Date.now() });
    }, 4200);
    return () => window.clearInterval(t);
  }, [held]);

  useEffect(() => {
    if (!landed) return;
    const t = window.setTimeout(() => setLanded(null), 1400);
    return () => window.clearTimeout(t);
  }, [landed]);

  const c = covers[sel];
  const over = c - CAP;
  const isHeld = held.includes(sel);
  const parties = partiesFor(sel, c);
  const tonight = covers.reduce((s, n) => s + n, 0);
  const overSlots = covers.filter((n, k) => k >= NOW && n > CAP).length;

  return (
    <Widget size="large" index={index} label="Cover pacing">
      <WidgetHeader
        icon={<CalendarLtr20Filled />}
        tint="var(--ios-purple)"
        title="Cover Pacing"
        subtitle={
          <>
            Tonight · <AnimatedNumber value={tonight} /> covers ·{" "}
            <span className={cn(overSlots && "font-medium text-ios-red")}>
              <AnimatedNumber value={overSlots} /> slots over cap
            </span>
          </>
        }
      />

      <div className="mt-2.5 flex h-[30px] items-baseline-last gap-2 whitespace-nowrap">
        <div className="leading-none">
          <span className="text-[13px] font-semibold text-secondary tabular">{clock(SLOTS[sel])}</span>
          <AnimatedNumber value={c} className="ml-2 text-[28px] font-semibold tracking-tight text-heading" />
          <span className="ml-1 text-[12px] font-medium text-tertiary">covers</span>
        </div>
        <span
          className={cn(
            "mb-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
            over > 0 ? "bg-ios-red/15 text-ios-red" : over > -4 ? "bg-ios-orange/15 text-ios-orange" : "bg-ios-green/15 text-ios-green",
          )}
        >
          {over > 0 ? `+${over} over cap` : `${-over} under cap`}
        </span>
        <label className="mb-0.5 ml-auto flex cursor-pointer items-center gap-1.5 text-[11.5px] text-tertiary">
          {isHeld ? "Held" : "Online"}
          <Switch
            size="small"
            checked={!isHeld}
            disabled={sel <= NOW}
            onChange={(on) => setHeld((h) => (on ? h.filter((x) => x !== sel) : [...h, sel]))}
            aria-label={`Online booking at ${clock(SLOTS[sel])}`}
          />
        </label>
      </div>

      <div className="relative mt-3 min-h-0 flex-1">
        <div className="absolute inset-x-0 top-0 bottom-[14px] isolate flex items-end gap-[3px]">
          {covers.map((n, k) => {
            const past = k < NOW;
            const hot = n > CAP;
            const on = k === sel;
            return (
              <button
                key={SLOTS[k]}
                type="button"
                aria-label={`${clock(SLOTS[k])}, ${n} covers`}
                onClick={() => setSel(k)}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse" && e.buttons === 1) setSel(k);
                }}
                className="relative flex h-full flex-1 cursor-pointer items-end"
              >
                <motion.span
                  className={cn(
                    "relative w-full overflow-hidden rounded-[3px]",
                    past ? "bg-fill" : hot ? "bg-ios-red" : "bg-ios-purple",
                    held.includes(k) && "bg-[repeating-linear-gradient(135deg,var(--ant-color-fill)_0_3px,transparent_3px_6px)]",
                  )}
                  initial={{ height: "2%" }}
                  animate={{ height: `${(n / MAX) * 100}%`, opacity: on ? 1 : past ? 0.9 : 0.55 }}
                  transition={{
                    height: { type: "spring", stiffness: 170, damping: 20, delay: landed ? 0 : delay + k * 0.02 },
                    opacity: { duration: 0.2 },
                  }}
                />
                <AnimatePresence>
                  {landed?.slot === k ? (
                    <motion.span
                      key={landed.id}
                      className="absolute inset-x-0 bottom-0 rounded-[3px] bg-ios-purple"
                      initial={{ opacity: 0.8, height: `${(n / MAX) * 100}%` }}
                      animate={{ opacity: 0, scaleX: 2.2 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.9 }}
                    />
                  ) : null}
                </AnimatePresence>
                {on ? (
                  <motion.span
                    layoutId="pacing-sel"
                    className="absolute -inset-x-[1.5px] top-0 bottom-0 -z-10 rounded-[4px] bg-fill-tertiary"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Kitchen pacing cap */}
        <div
          className="pointer-events-none absolute inset-x-0 border-t-[1.5px] border-dashed border-[var(--ant-color-text-secondary)]"
          style={{ bottom: `calc(14px + (100% - 14px) * ${CAP / MAX})` }}
        />
        <span
          className="pointer-events-none absolute right-0 text-[10px] font-medium text-secondary"
          style={{ bottom: `calc(16px + (100% - 14px) * ${CAP / MAX})` }}
        >
          Cap {CAP}
        </span>

        {/* NOW, 18:40, two thirds into the 18:30 slot */}
        <div
          className="pointer-events-none absolute top-0 bottom-[14px] w-[1.5px] bg-heading"
          style={{ left: `${((NOW + 0.66) / SLOTS.length) * 100}%` }}
        />
        <span
          className="pointer-events-none absolute top-0 -translate-x-[calc(100%+3px)] text-[10px] font-semibold text-heading"
          style={{ left: `${((NOW + 0.66) / SLOTS.length) * 100}%` }}
        >
          18:40
        </span>

        <div className="absolute inset-x-0 bottom-0 flex h-[12px] text-[10px] leading-[12px] text-tertiary tabular">
          {SLOTS.map((m, k) => (
            <span key={m} className="relative flex-1">
              {k % 4 === 0 ? <span className="absolute left-0">{clock(m)}</span> : null}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 flex h-[96px] shrink-0 flex-col">
        <AnimatePresence mode="popLayout" initial={false}>
          {parties.slice(0, 3).map((p, i) => (
            <motion.div
              key={`${sel}-${p.name}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ type: "spring", stiffness: 420, damping: 32, delay: i * 0.04 }}
              className={cn("flex h-[32px] shrink-0 items-center gap-2", i > 0 && "border-t-[0.5px] border-split")}
            >
              <MemojiAvatar who={p.name} size={22} />
              <span className="min-w-0 flex-1 truncate text-[12.5px] leading-tight">
                <span className="font-semibold text-heading">{p.name}</span>
                <span className="text-tertiary"> · Table {p.table}</span>
              </span>
              {p.note ? (
                <span className="shrink-0 rounded-full bg-fill-tertiary px-1.5 py-px text-[10.5px] font-medium text-secondary">
                  {p.note}
                </span>
              ) : null}
              <span className="flex w-[34px] shrink-0 items-center justify-end gap-0.5 text-[12.5px] font-semibold text-heading tabular">
                <People16Regular className="size-3.5 text-tertiary" />
                {p.size}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="mt-0.5 text-[11px] text-tertiary">
        {parties.length > 3 ? `+${parties.length - 3} more parties at ${clock(SLOTS[sel])}` : `All parties at ${clock(SLOTS[sel])}`}
        {isHeld ? " · held from online" : ""}
      </div>
    </Widget>
  );
}
