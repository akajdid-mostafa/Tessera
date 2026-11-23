import {
  ArrowUndo16Regular,
  Checkmark16Filled,
  Dismiss16Regular,
  Receipt16Regular,
  VehicleCar20Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

type Damage = {
  id: string;
  part: string;
  kind: string;
  detail: string;
  /** Position on the 64 × 128 top-down drawing, front at the top. */
  x: number;
  y: number;
  isNew: boolean;
  cost: number;
};
type Phase = "idle" | "confirm" | "charged" | "waived";

const DAMAGE: Damage[] = [
  { id: "bumper", part: "Rear bumper", kind: "Dent", detail: "4 cm, paint cracked · not on pickup report", x: 41, y: 121, isNew: true, cost: 240 },
  { id: "glass", part: "Windshield", kind: "Stone chip", detail: "3 mm, outside the wiper sweep", x: 23, y: 41, isNew: true, cost: 85 },
  { id: "door", part: "Front-left door", kind: "Scratch", detail: "On the pickup report, Nov 6", x: 8.5, y: 62, isNew: false, cost: 0 },
  { id: "rim", part: "Rear-right wheel", kind: "Rim scuff", detail: "On file since Oct 21", x: 57, y: 99, isNew: false, cost: 0 },
];
const SCAN_S = 1.4;
const CONFIRM_MS = 4000;
const USD = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const;

/** A plain top-down hatchback, front up. */
function CarTopDown() {
  return (
    <svg viewBox="0 0 64 128" className="absolute inset-0 size-full" aria-hidden>
      {/* Wheels sit behind the body */}
      {[
        [4, 20],
        [56, 20],
        [4, 90],
        [56, 90],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="4" height="18" rx="2" className="fill-fill" />
      ))}
      <ellipse cx="6.5" cy="44" rx="3" ry="2" className="fill-fill" />
      <ellipse cx="57.5" cy="44" rx="3" ry="2" className="fill-fill" />
      <rect x="8" y="4" width="48" height="120" rx="17" className="fill-fill-tertiary stroke-[var(--ant-color-border)]" strokeWidth="1" />
      {/* Bonnet crease, glass and roof */}
      <path d="M20 8 Q32 5 44 8" fill="none" className="stroke-[var(--ant-color-border)]" strokeWidth="1" />
      <path d="M14 36 Q32 30 50 36 L47 50 Q32 47 17 50 Z" className="fill-fill-secondary" />
      <rect x="17" y="53" width="30" height="30" rx="4" className="fill-fill-quaternary stroke-[var(--ant-color-border)]" strokeWidth="0.75" />
      <path d="M17 86 Q32 89 47 86 L49 98 Q32 102 15 98 Z" className="fill-fill-secondary" />
      <line x1="8.5" y1="66" x2="16" y2="66" className="stroke-[var(--ant-color-border)]" strokeWidth="0.75" />
      <line x1="48" y1="66" x2="55.5" y2="66" className="stroke-[var(--ant-color-border)]" strokeWidth="0.75" />
      <rect x="13" y="6" width="9" height="3" rx="1.5" className="fill-fill" />
      <rect x="42" y="6" width="9" height="3" rx="1.5" className="fill-fill" />
      <rect x="12" y="119" width="8" height="2.5" rx="1.25" className="fill-ios-red/60" />
      <rect x="44" y="119" width="8" height="2.5" rx="1.25" className="fill-ios-red/60" />
    </svg>
  );
}

/** Car rental · medium. A return inspection on a top-down car with new and known damage; tap a mark, then charge or waive the repair. */
export function DamageCheckWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [sel, setSel] = useState(DAMAGE[0].id);
  const [phase, setPhase] = useState<Record<string, Phase>>({});

  const d = DAMAGE.find((x) => x.id === sel)!;
  const p = phase[d.id] ?? "idle";
  const set = (id: string, v: Phase) => setPhase((all) => ({ ...all, [id]: v }));

  useEffect(() => {
    if (p !== "confirm") return;
    const id = d.id;
    const t = window.setTimeout(() => set(id, "idle"), CONFIRM_MS);
    return () => window.clearTimeout(t);
  }, [p, d.id]);

  const open = DAMAGE.filter((x) => x.isNew && !["charged", "waived"].includes(phase[x.id] ?? "idle"));
  const openTotal = open.reduce((s, x) => s + x.cost, 0);

  return (
    <Widget size="medium" index={index} label="Return damage inspection">
      <WidgetHeader
        icon={<VehicleCar20Filled />}
        tint="var(--ios-orange)"
        title="Return Inspection"
        subtitle="7RNT207 · Compact hatch · Bay 4"
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={open.length ? "open" : "clear"}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={cn(
                "mt-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap tabular",
                open.length ? "bg-ios-red/15 text-ios-red" : "bg-ios-green/15 text-ios-green",
              )}
            >
              {open.length ? `${open.length} new · $${openTotal}` : "All settled"}
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="mt-1 flex min-h-0 flex-1 gap-4">
        <div className="relative ml-2 h-[124px] w-[62px] shrink-0">
          <CarTopDown />
          <motion.span
            className="pointer-events-none absolute -inset-x-2 top-0 h-[2px] rounded-full bg-ios-blue shadow-[0_0_8px_var(--ios-blue)]"
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: [0, 124], opacity: [0, 0.9, 0.9, 0] }}
            transition={{ duration: SCAN_S, delay, repeat: Infinity, repeatDelay: 6, ease: "easeInOut" }}
          />
          {DAMAGE.map((x) => {
            const ph = phase[x.id] ?? "idle";
            const settled = ph === "charged" || ph === "waived";
            const on = x.id === sel;
            return (
              <motion.button
                type="button"
                key={x.id}
                aria-label={`${x.part}: ${x.kind}`}
                onClick={() => setSel(x.id)}
                className="absolute grid size-[18px] -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full outline-none"
                style={{ left: `${(x.x / 64) * 100}%`, top: `${(x.y / 128) * 100}%` }}
                initial={{ scale: 0 }}
                animate={{ scale: on ? 1.2 : 1 }}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 420, damping: 20, delay: delay + SCAN_S * (x.y / 128) }}
              >
                {x.isNew && !settled ? (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-ios-red"
                    animate={{ scale: [1, 2], opacity: [0.45, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                  />
                ) : null}
                <span
                  className={cn(
                    "relative size-[10px] rounded-full ring-1 transition-colors",
                    on ? "ring-sel" : "ring-transparent",
                    !x.isNew ? "bg-fill" : ph === "charged" ? "bg-ios-green" : ph === "waived" ? "bg-fill" : "bg-ios-red",
                  )}
                />
              </motion.button>
            );
          })}
        </div>

        <div className="flex min-w-0 flex-1 flex-col pt-1">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={d.id}
              initial={{ opacity: 0, x: 8, filter: "blur(3px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -8, filter: "blur(3px)" }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
            >
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span
                  className={cn(
                    "rounded-[5px] px-1.5 py-px text-[10px] font-bold tracking-wide",
                    d.isNew ? "bg-ios-red/15 text-ios-red" : "bg-fill-secondary text-secondary",
                  )}
                >
                  {d.isNew ? "NEW" : "KNOWN"}
                </span>
                <span className="truncate text-[13px] font-semibold text-heading">
                  {d.part} · {d.kind}
                </span>
              </div>
              <div className="mt-1 truncate text-[11px] text-tertiary">{d.detail}</div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-2 flex items-baseline gap-1.5 whitespace-nowrap">
            <AnimatedNumber
              value={d.cost}
              format={USD}
              className={cn(
                "text-[26px] leading-none font-semibold tracking-tight",
                d.isNew && p !== "waived" ? "text-heading" : "text-tertiary",
              )}
            />
            <span className="text-[11px] text-tertiary">
              {d.isNew ? (p === "waived" ? "waived" : "repair estimate") : "no charge"}
            </span>
          </div>

          <div className="relative mt-auto h-8">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={`${d.id}-${d.isNew ? p : "known"}`}
                className="absolute inset-0 flex items-center gap-1.5"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {!d.isNew ? (
                  <span className="flex items-center gap-1 text-[11px] text-tertiary">
                    <Checkmark16Filled className="size-3.5 text-ios-green" /> Matches the pickup photos
                  </span>
                ) : p === "idle" ? (
                  <>
                    <Button variant="filled" color="default" onClick={() => set(d.id, "waived")}>
                      Waive
                    </Button>
                    <Button block color="danger" variant="solid" icon={<Receipt16Regular />} onClick={() => set(d.id, "confirm")}>
                      Charge ${d.cost}
                    </Button>
                  </>
                ) : p === "confirm" ? (
                  <>
                    <Button
                      shape="circle"
                      variant="filled"
                      color="default"
                      icon={<Dismiss16Regular />}
                      aria-label="Cancel charge"
                      onClick={() => set(d.id, "idle")}
                    />
                    <Button block color="danger" variant="solid" className="relative overflow-hidden" onClick={() => set(d.id, "charged")}>
                      Confirm ${d.cost} to card
                      <motion.span
                        className="absolute bottom-0 left-0 h-[2px] bg-white/70"
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: CONFIRM_MS / 1000, ease: "linear" }}
                      />
                    </Button>
                  </>
                ) : (
                  <>
                    <span
                      className={cn(
                        "flex h-8 flex-1 items-center gap-1 rounded-full px-3 text-[12px] font-semibold whitespace-nowrap",
                        p === "charged" ? "bg-ios-green/15 text-ios-green" : "bg-fill-secondary text-secondary",
                      )}
                    >
                      <Checkmark16Filled className="size-3.5" />
                      {p === "charged" ? "Added to invoice · card •• 4417" : "Waived · noted on file"}
                    </span>
                    <Button
                      shape="circle"
                      variant="filled"
                      color="default"
                      icon={<ArrowUndo16Regular />}
                      aria-label="Undo"
                      onClick={() => set(d.id, "idle")}
                    />
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Widget>
  );
}
