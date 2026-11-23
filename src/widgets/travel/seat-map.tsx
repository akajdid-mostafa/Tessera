import { ArrowRight12Regular, Checkmark12Filled, Seat20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const ROWS = Array.from({ length: 15 }, (_, i) => 10 + i);
const LETTERS = ["A", "B", "C", "D", "E", "F"] as const;
type Letter = (typeof LETTERS)[number];

/* Seat geometry inside a 376×150 cabin, nose on the left, aisle between C and D. */
const X0 = 52;
const DX = 21.5;
const SEAT = 16;
const Y: Record<Letter, number> = { A: 12, B: 30, C: 48, D: 86, E: 104, F: 122 };
const sx = (row: number) => X0 + (row - 10) * DX;
const FUSELAGE = "M376 4 H46 C18 4 2 44 2 75 C2 106 18 146 46 146 H376";

type Tier = "front" | "legroom" | "standard";
const TIER: Record<Tier, { label: string; price: number; free: string; solid: string; text: string }> = {
  front: { label: "Front row", price: 12, free: "bg-ios-purple/30", solid: "bg-ios-purple", text: "text-ios-purple" },
  legroom: { label: "Extra legroom", price: 24, free: "bg-ios-teal/40", solid: "bg-ios-teal", text: "text-ios-teal" },
  standard: { label: "Standard", price: 0, free: "bg-ios-blue/25", solid: "bg-ios-blue", text: "text-ios-blue" },
};
const tierOf = (row: number): Tier => (row <= 11 ? "front" : row === 14 || row === 15 ? "legroom" : "standard");
const kindOf = (l: Letter) => (l === "A" || l === "F" ? "Window" : l === "C" || l === "D" ? "Aisle" : "Middle");

/* About two thirds of the cabin is sold; a few good seats are still open. */
const OPEN = new Set(["10A", "11C", "14A", "15F", "15D", "12F", "18A", "19D", "21C", "23F", "24A", "17B"]);
const START_SEAT = "22E";
function soldAtStart() {
  const sold = new Set<string>();
  for (const r of ROWS)
    for (const [li, l] of LETTERS.entries()) {
      const id = `${r}${l}`;
      if (id === START_SEAT || OPEN.has(id)) continue;
      if ((r * 7 + li * 13 + r * li) % 10 < 7) sold.add(id);
    }
  return sold;
}
/** Seats that other passengers keep taking and giving back while the map is open. */
const CHURN = ["12C", "16A", "18F", "20D", "13B", "21A", "23C", "17E"];
const CHURN_MS = 4200;
const CONFIRM_MS = 3000;

/** Travel · large. The cabin's seat map with sold, free, front-row and extra-legroom seats and you in 22E; hover a seat to preview it, pick one and confirm, and your memoji glides to the new seat while other seats come and go live. */
export function SeatMapWidget({ index }: { index?: number }) {
  const [sold, setSold] = useState(soldAtStart);
  const [mine, setMine] = useState(START_SEAT);
  const [pick, setPick] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [arming, setArming] = useState(false);
  const [moved, setMoved] = useState<string | null>(null);
  const [beat, setBeat] = useState(0);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => setBeat((b) => b + 1), CHURN_MS);
    return () => window.clearInterval(t);
  }, []);
  // Live: one seat elsewhere in the cabin is taken or released on each beat.
  useEffect(() => {
    if (beat === 0) return;
    const id = CHURN[beat % CHURN.length];
    if (id === pick || id === mine) return;
    setSold((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, [beat, pick, mine]);
  useEffect(() => {
    if (!arming) return;
    const t = window.setTimeout(() => setArming(false), CONFIRM_MS);
    return () => window.clearTimeout(t);
  }, [arming]);
  useEffect(() => {
    if (!moved) return;
    const t = window.setTimeout(() => setMoved(null), 2200);
    return () => window.clearTimeout(t);
  }, [moved]);

  const parse = (id: string) => ({ row: Number(id.slice(0, -1)), letter: id.slice(-1) as Letter });
  const preview = hover ?? pick;
  const p = preview ? parse(preview) : null;
  const pTier = p ? TIER[tierOf(p.row)] : null;
  const m = parse(mine);
  const pickTier = pick ? TIER[tierOf(parse(pick).row)] : null;

  const move = () => {
    if (!pick || !pickTier) return;
    if (pickTier.price > 0 && !arming) {
      setArming(true);
      return;
    }
    setArming(false);
    setMine(pick);
    setMoved(pick);
    setPick(null);
  };

  return (
    <Widget size="large" index={index} label="Seat map">
      <WidgetHeader
        icon={<Seat20Filled />}
        tint="var(--ios-indigo)"
        title="Seat Map"
        subtitle="AX 204 · LAX → JFK · Economy"
        extra={
          <AnimatePresence>
            {moved ? (
              <motion.span
                key={moved}
                initial={{ opacity: 0, y: -6, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-0.5 flex items-center gap-1 rounded-full bg-ios-green/15 px-2 py-0.5 text-[11px] font-semibold text-ios-green"
              >
                <Checkmark12Filled className="size-3" /> Now in {moved}
              </motion.span>
            ) : null}
          </AnimatePresence>
        }
      />

      <div className="mt-3 flex h-[56px] items-center gap-3 rounded-2xl bg-fill-quaternary px-3">
        <div className="leading-tight">
          <div className="text-[10px] text-tertiary">Your seat</div>
          <div className="text-[24px] leading-none font-semibold tracking-tight text-heading tabular">{mine}</div>
          <div className="text-[10px] text-tertiary">{kindOf(m.letter)}</div>
        </div>
        <ArrowRight12Regular className="size-4 shrink-0 text-tertiary" />
        <AnimatePresence mode="wait" initial={false}>
          {p && pTier && preview ? (
            <motion.div
              key={preview}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <div className="leading-tight">
                <div className={cn("text-[10px] font-medium", pTier.text)}>{pTier.label}</div>
                <div className="text-[24px] leading-none font-semibold tracking-tight text-heading tabular">{preview}</div>
                <div className="text-[10px] text-tertiary">
                  {sold.has(preview) ? "Taken" : `${kindOf(p.letter)}${p.row === 14 || p.row === 15 ? " · exit row" : ""}`}
                </div>
              </div>
              <div className="ml-auto text-right text-[18px] font-semibold text-heading tabular">
                {sold.has(preview) ? "—" : pTier.price ? `$${pTier.price}` : "Free"}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[12px] text-secondary"
            >
              Hover or tap a free seat
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative mt-3 h-[150px] w-full shrink-0" onPointerLeave={() => setHover(null)}>
        <svg viewBox="0 0 376 150" className="absolute inset-0 size-full" aria-hidden>
          <path d={FUSELAGE} className="fill-fill-quaternary stroke-fill" strokeWidth="1.5" />
          {/* Over-wing exits sit at rows 14 and 15. */}
          {[4, 146].map((y) => (
            <rect key={y} x={sx(14) - 2} y={y - 2} width={DX * 2} height="4" rx="2" fill="var(--ios-teal)" />
          ))}
          {LETTERS.map((l) => (
            <text key={l} x="38" y={Y[l] + 12} textAnchor="middle" className="fill-tertiary text-[9px] font-semibold">
              {l}
            </text>
          ))}
          {ROWS.map((r) => (
            <text key={r} x={sx(r) + SEAT / 2} y="72" textAnchor="middle" className="fill-tertiary text-[9px] tabular">
              {r}
            </text>
          ))}
        </svg>

        {ROWS.map((r, ri) =>
          LETTERS.map((l) => {
            const id = `${r}${l}`;
            const t = TIER[tierOf(r)];
            const taken = sold.has(id) && id !== mine;
            const isMine = id === mine;
            const picked = id === pick;
            return (
              <motion.button
                key={id}
                type="button"
                disabled={taken || isMine}
                aria-label={`Seat ${id}${taken ? ", taken" : ""}`}
                aria-pressed={picked}
                onPointerEnter={() => !taken && setHover(id)}
                onClick={() => {
                  setPick(picked ? null : id);
                  setArming(false);
                }}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: picked ? 1.15 : 1 }}
                whileHover={taken || isMine ? undefined : { scale: 1.2 }}
                transition={{ type: "spring", stiffness: 420, damping: 24, delay: beat === 0 && !pick ? delay + ri * 0.025 : 0 }}
                className={cn(
                  "absolute grid place-items-center rounded-[4px] transition-colors",
                  taken
                    ? "bg-fill-secondary"
                    : picked
                      ? cn(t.solid, "text-white", "ring-2 ring-[var(--widget-surface)]")
                      : isMine
                        ? "bg-transparent"
                        : cn(t.free, "cursor-pointer"),
                )}
                style={{ left: sx(r), top: Y[l], width: SEAT, height: SEAT }}
              >
                {picked ? <Checkmark12Filled className="size-2.5" /> : null}
              </motion.button>
            );
          }),
        )}

        <motion.div
          className="pointer-events-none absolute z-10"
          initial={false}
          animate={{ left: sx(m.row) - 2, top: Y[m.letter] - 2 }}
          transition={{ type: "spring", stiffness: 140, damping: 18 }}
        >
          <MemojiAvatar who="f5" size={20} className="ring-[1.5px] ring-ios-indigo" />
        </motion.div>
      </div>

      <div className="mt-2 flex items-center gap-3 text-[10px] text-tertiary whitespace-nowrap">
        {(["standard", "front", "legroom"] as Tier[]).map((k) => (
          <span key={k} className="flex items-center gap-1">
            <span className={cn("size-2.5 rounded-[3px]", TIER[k].free)} />
            {TIER[k].label}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-[3px] bg-fill-secondary" />
          Taken
        </span>
      </div>

      <motion.button
        type="button"
        disabled={!pick}
        onClick={move}
        whileTap={pick ? { scale: 0.97 } : undefined}
        className={cn(
          "relative mt-auto h-8 w-full overflow-hidden rounded-xl text-[13px] font-semibold transition-colors",
          !pick
            ? "bg-fill-tertiary text-tertiary"
            : arming
              ? "cursor-pointer bg-ios-orange/15 text-ios-orange"
              : "cursor-pointer bg-ios-indigo text-white",
        )}
      >
        {arming ? (
          <motion.span
            aria-hidden
            className="absolute inset-y-0 left-0 bg-black/15"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: CONFIRM_MS / 1000, ease: "linear" }}
          />
        ) : null}
        <span className="relative">
          {!pick || !pickTier
            ? "Pick a seat to move"
            : arming
              ? `Tap again to pay $${pickTier.price}`
              : `Move to ${pick}${pickTier.price ? ` · $${pickTier.price}` : " · free"}`}
        </span>
      </motion.button>
    </Widget>
  );
}
