import { Fire16Filled, PersonRunning20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { mmss } from "./_parts";

type Floor = { f: number; occ: number; warden: string; start: number; rate: number; fire?: boolean; refuge?: number };

/** Phased evacuation: the fire floor and the floors either side go first, then outward. */
const FLOORS: Floor[] = [
  { f: 8, occ: 84, warden: "Nora Kim", start: 150, rate: 1.1 },
  { f: 7, occ: 109, warden: "Ethan Wright", start: 75, rate: 1.2 },
  { f: 6, occ: 122, warden: "Mei Lin", start: 0, rate: 1.05 },
  { f: 5, occ: 97, warden: "Kevin Adams", start: 0, rate: 1.15, fire: true, refuge: 2 },
  { f: 4, occ: 131, warden: "Sofia Rossi", start: 0, rate: 1.0 },
  { f: 3, occ: 126, warden: "Jack Hughes", start: 75, rate: 1.1 },
  { f: 2, occ: 118, warden: "Aisha Bello", start: 150, rate: 1.25 },
  { f: 1, occ: 64, warden: "Ben Carter", start: 195, rate: 1.4 },
];
const TOTAL = FLOORS.reduce((s, f) => s + f.occ, 0);
/** The fire service reaches the Stair B refuge and brings the two down. */
const REFUGE_CLEARED = 330;
const SIM_STEP = 5;
const START_T = 95;
const END_T = 360;

const outOf = (fl: Floor, t: number) => {
  if (t < fl.start) return 0;
  const moved = Math.floor((t - fl.start) * fl.rate);
  const cap = fl.refuge && t < REFUGE_CLEARED ? fl.occ - fl.refuge : fl.occ;
  return Math.min(cap, moved);
};

/** Fire safety · medium. A phased evacuation stack: the fire floor and the floors either side drain first while people stream down the stair, outer floors move from Alert to Evacuate in waves, two people wait in the 5F refuge until the fire service arrives, and hovering a floor reads its count and warden. */
export function EvacuationWidget({ index }: { index?: number }) {
  const [t, setT] = useState(START_T);
  const [hover, setHover] = useState<number | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const id = window.setInterval(() => setT((x) => (x >= END_T + 40 ? START_T : x + SIM_STEP)), 900);
    return () => window.clearInterval(id);
  }, []);

  const outs = FLOORS.map((fl) => outOf(fl, t));
  const out = outs.reduce((s, n) => s + n, 0);
  const sel = hover === null ? null : FLOORS.findIndex((fl) => fl.f === hover);
  const fl = sel === null ? null : FLOORS[sel];
  const flOut = sel === null ? 0 : outs[sel];
  const moving = FLOORS.some((f, i) => t >= f.start && outs[i] < f.occ - (f.refuge && t < REFUGE_CLEARED ? f.refuge : 0));
  const reported = FLOORS.filter((f, i) => outs[i] >= f.occ - (f.refuge && t < REFUGE_CLEARED ? f.refuge : 0) && t >= f.start);
  const pct = fl ? flOut / fl.occ : out / TOTAL;
  const left = fl ? fl.occ - flOut : TOTAL - out;
  const refugeWaiting = t < REFUGE_CLEARED;

  return (
    <Widget size="medium" index={index} label="Evacuation progress">
      <WidgetHeader
        icon={<PersonRunning20Filled />}
        tint="var(--ios-green)"
        title="Evacuation · Tower A"
        subtitle={<span className="tabular">Phased · fire on 5F · T+{mmss(t)}</span>}
      />

      <div className="mt-2 flex min-h-0 flex-1 gap-3">
        <div className="flex w-[130px] shrink-0 flex-col">
          <div className="h-[14px] overflow-hidden text-[11px] font-medium">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={hover ?? "all"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={cn("truncate", fl?.fire ? "text-ios-red" : "text-tertiary")}
              >
                {fl ? `${fl.f}F · ${fl.fire ? "Fire floor" : t < fl.start ? "Alert · stand by" : "Evacuate"}` : "Building out"}
              </motion.div>
            </AnimatePresence>
          </div>
          <AnimatedNumber
            value={pct}
            format={{ style: "percent", maximumFractionDigits: 0 }}
            className="mt-1 text-[30px] leading-none font-semibold tracking-tight text-heading"
          />
          <div className="mt-1 truncate text-[10px] text-tertiary tabular">
            <AnimatedNumber value={left} /> still inside{fl ? ` of ${fl.occ}` : ` of ${TOTAL}`}
          </div>

          <div className="mt-auto flex h-[22px] items-center gap-1.5">
            {fl ? (
              <>
                <MemojiAvatar who={fl.warden} size={22} alt={fl.warden} />
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-[11px] font-medium text-heading">{fl.warden}</div>
                  <div className="truncate text-[10px] text-tertiary">Floor warden</div>
                </div>
              </>
            ) : (
              <>
                <span className="flex">
                  {reported.slice(0, 4).map((r, i) => (
                    <motion.span
                      key={r.f}
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 26 }}
                      className={i ? "-ml-1.5" : undefined}
                    >
                      <MemojiAvatar who={r.warden} size={20} alt={r.warden} className="ring-[1.5px] ring-[var(--widget-surface)]" />
                    </motion.span>
                  ))}
                </span>
                <span className="truncate text-[10px] text-tertiary tabular">
                  {reported.length}/{FLOORS.length} wardens clear
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 gap-2" onMouseLeave={() => setHover(null)}>
          <ul className="flex min-w-0 flex-1 flex-col gap-[2px]">
            {FLOORS.map((f, i) => {
              const o = outs[i];
              const evac = t >= f.start;
              const waiting = f.refuge && refugeWaiting && o >= f.occ - f.refuge;
              const clear = evac && o >= f.occ;
              const on = hover === f.f;
              return (
                <li
                  key={f.f}
                  onMouseEnter={() => setHover(f.f)}
                  className={cn("flex h-[13px] cursor-pointer items-center gap-1.5 rounded-[4px]", on && "bg-fill-quaternary")}
                >
                  <span className={cn("flex w-[22px] shrink-0 items-center justify-end gap-0.5 text-[10px] font-semibold tabular", f.fire ? "text-ios-red" : "text-secondary")}>
                    {f.fire ? <Fire16Filled className="text-[10px]" /> : null}
                    {f.f}F
                  </span>
                  <span className="relative h-[7px] min-w-0 flex-1 overflow-hidden rounded-full bg-fill-tertiary">
                    <motion.span
                      className={cn("absolute inset-y-0 left-0 rounded-full", clear ? "bg-ios-green" : f.fire ? "bg-ios-red" : "bg-ios-blue")}
                      initial={{ width: 0 }}
                      animate={{ width: `${(o / f.occ) * 100}%` }}
                      transition={{ type: "spring", stiffness: 90, damping: 20, delay: t === START_T ? delay + i * 0.04 : 0 }}
                    />
                  </span>
                  <span
                    className={cn(
                      "w-[50px] shrink-0 text-right text-[10px] whitespace-nowrap tabular",
                      waiting ? "font-semibold text-ios-red" : clear ? "font-medium text-ios-green" : evac ? "text-secondary" : "text-tertiary",
                    )}
                  >
                    {waiting ? `${f.refuge} refuge` : clear ? "Clear" : evac ? `${f.occ - o} left` : "Alert"}
                  </span>
                </li>
              );
            })}
          </ul>
          {/* Stair B: people streaming down while any floor is moving. */}
          <div className="relative w-[10px] shrink-0 overflow-hidden rounded-full bg-fill-quaternary">
            {moving
              ? [0, 1, 2, 3, 4].map((k) => (
                  <motion.span
                    key={k}
                    className="absolute inset-0"
                    initial={{ y: "-6%", opacity: 0 }}
                    animate={{ y: ["-6%", "104%"], opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, delay: k * 0.44, ease: "linear" }}
                  >
                    <span className="absolute left-1/2 top-0 size-[4px] -translate-x-1/2 rounded-full bg-ios-green" />
                  </motion.span>
                ))
              : null}
          </div>
        </div>
      </div>
    </Widget>
  );
}
