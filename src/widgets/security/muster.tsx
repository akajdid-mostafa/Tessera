import { PeopleTeam20Filled, ShieldCheckmark16Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { mmss } from "./_parts";

type Person = { name: string; seen: string };

const TOTAL = 327;
const TARGET_S = 8 * 60;
const POINTS = [
  { name: "AP-1 North car park", warden: "Grace Park", weight: 5 },
  { name: "AP-2 Garden lawn", warden: "Dana Kim", weight: 3 },
  { name: "AP-3 Gate 3", warden: "Marco Bianchi", weight: 2 },
];
const SEED_AP = [118, 79, 44];
const PEOPLE: Person[] = [
  { name: "Priya Shah", seen: "Badge in · Lab 4.07 · 09:12" },
  { name: "Hana Sato", seen: "Badge in · Server Room B2" },
  { name: "Owen Price", seen: "Visitor · host Grace Park" },
  { name: "Leila Haddad", seen: "Wi-Fi · L2 meeting room" },
  { name: "Tom Becker", seen: "Badge in · Kitchen L1" },
  { name: "Sam Ortiz", seen: "Contractor · roof plant" },
  { name: "Raj Patel", seen: "Badge in · Loading dock 2" },
];
/** The last two never reach a muster point: a warden has to confirm them. */
const STUCK = 2;
const R = 40;
const C = 2 * Math.PI * R;

type S = { ap: number[]; named: Person[]; marked: number; elapsed: number; tick: number; lastAp: number | null };
const seed = (): S => ({ ap: [...SEED_AP], named: [...PEOPLE], marked: 0, elapsed: 130, tick: 0, lastAp: null });
const accountedOf = (s: S) => s.ap.reduce((a, b) => a + b, 0) + s.marked;

function pickAp() {
  const total = POINTS.reduce((a, p) => a + p.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < POINTS.length; i++) {
    r -= POINTS[i].weight;
    if (r < 0) return i;
  }
  return 0;
}

/** Security · large. An evacuation muster: people scan in at three assembly points as counts and the ring roll up, the unaccounted list shrinks live, and a warden marks the last stragglers safe to reach all clear. */
export function MusterWidget({ index }: { index?: number }) {
  const [s, setS] = useState(seed);
  const [armed, setArmed] = useState<string | null>(null);

  const accounted = accountedOf(s);
  const clear = accounted >= TOTAL;

  // Arrivals at the muster points, and the elapsed clock.
  useEffect(() => {
    if (clear) return;
    const t = window.setInterval(() => {
      setS((p) => {
        const anon = TOTAL - accountedOf(p) - p.named.length;
        const ap = [...p.ap];
        if (anon > 0) {
          const k = pickAp();
          ap[k] += Math.min(anon, 1 + Math.floor(Math.random() * 3));
          return { ...p, ap, tick: p.tick + 1, lastAp: k };
        }
        if (p.named.length > STUCK && p.tick % 3 === 0) {
          const k = pickAp();
          ap[k] += 1;
          return { ...p, ap, named: p.named.slice(1), tick: p.tick + 1, lastAp: k };
        }
        return { ...p, tick: p.tick + 1, lastAp: null };
      });
    }, 900);
    const c = window.setInterval(() => setS((p) => ({ ...p, elapsed: p.elapsed + 1 })), 1000);
    return () => {
      window.clearInterval(t);
      window.clearInterval(c);
    };
  }, [clear]);

  // After all clear, the drill resets so the story plays again.
  useEffect(() => {
    if (!clear) return;
    const t = window.setTimeout(() => setS(seed()), 12000);
    return () => window.clearTimeout(t);
  }, [clear]);

  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(null), 3500);
    return () => window.clearTimeout(t);
  }, [armed]);

  const markSafe = (name: string) => {
    if (armed !== name) {
      setArmed(name);
      return;
    }
    setArmed(null);
    setS((p) => ({ ...p, named: p.named.filter((x) => x.name !== name), marked: p.marked + 1 }));
  };

  const missing = TOTAL - accounted;
  const more = missing - Math.min(3, s.named.length);
  const pct = accounted / TOTAL;
  const late = s.elapsed > TARGET_S;
  const delay = 0.3 + (index ?? 0) * 0.06;

  return (
    <Widget
      size="large"
      index={index}
      label="Evacuation muster"
      glow={{ mode: "pulse", colors: ["#FF453A", "#FF9F0A", "#FF453A"], blur: 18, duration: 2.2 }}
      glowActive={!clear}
    >
      <WidgetHeader
        icon={<PeopleTeam20Filled />}
        tint={clear ? "var(--ios-green)" : "var(--ios-red)"}
        title="Evacuation Muster"
        subtitle="Fire alarm · Building A · drill"
        extra={
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-semibold whitespace-nowrap tabular transition-colors duration-mid",
              clear ? "bg-ios-green/15 text-ios-green" : late ? "bg-ios-orange/15 text-ios-orange" : "bg-ios-red/15 text-ios-red",
            )}
          >
            <span className={cn("size-1.5 rounded-full", clear ? "bg-ios-green" : "animate-pulse bg-ios-red")} />
            {clear ? `All clear ${mmss(s.elapsed)}` : mmss(s.elapsed)}
          </span>
        }
      />

      <div className="mt-3 flex h-[96px] items-center gap-4">
        <div className="relative size-[96px] shrink-0">
          <svg viewBox="0 0 96 96" className="size-full -rotate-90" aria-hidden>
            <circle cx={48} cy={48} r={R} fill="none" strokeWidth={10} className="stroke-fill-secondary" />
            <motion.circle
              cx={48}
              cy={48}
              r={R}
              fill="none"
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={C}
              className={cn("transition-colors duration-500", clear ? "stroke-ios-green" : "stroke-ios-blue")}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C * (1 - pct) }}
              transition={{ type: "spring", stiffness: 80, damping: 18, delay: s.tick === 0 ? delay : 0 }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <AnimatedNumber
              value={pct}
              format={{ style: "percent", maximumFractionDigits: 0 }}
              className="text-[19px] font-semibold tracking-tight text-heading"
            />
          </div>
        </div>

        <div className="min-w-0 flex-1 leading-none whitespace-nowrap">
          <div className="text-[11px] text-tertiary">Accounted for</div>
          <div className="mt-1.5 text-[34px] font-semibold tracking-tight text-heading">
            <AnimatedNumber value={accounted} />
            <span className="text-[15px] font-medium text-tertiary"> / {TOTAL}</span>
          </div>
          <div className={cn("mt-2 text-[12px] font-semibold", clear ? "text-ios-green" : "text-ios-red")}>
            {clear ? "Everyone accounted for" : <><AnimatedNumber value={missing} /> unaccounted</>}
          </div>
          <div className="mt-1 text-[11px] text-tertiary">Target all clear under {mmss(TARGET_S)}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        {POINTS.map((p, i) => (
          <div key={p.name} className="flex h-[20px] items-center gap-2">
            <MemojiAvatar who={p.warden} size={18} alt={p.warden} />
            <span className="w-[118px] shrink-0 truncate text-[11px] text-secondary">{p.name}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-fill-secondary">
              <motion.div
                className="h-full rounded-full bg-secondary"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (s.ap[i] / 160) * 100)}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20, delay: s.tick === 0 ? delay + 0.1 + i * 0.08 : 0 }}
              />
            </div>
            <span className="relative w-[34px] shrink-0 text-right text-[12px] font-semibold text-heading">
              <AnimatedNumber value={s.ap[i]} />
              <AnimatePresence>
                {s.lastAp === i ? (
                  <motion.span
                    key={s.tick}
                    className="absolute -right-1 -top-0.5 size-1.5 rounded-full bg-ios-blue"
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    transition={{ duration: 0.8 }}
                  />
                ) : null}
              </AnimatePresence>
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] leading-[14px] text-tertiary">
        <span className="font-semibold text-secondary">Unaccounted · last known</span>
        {more > 0 ? <span className="tabular">+{more} more</span> : null}
      </div>

      <div className="mt-1.5 flex min-h-0 flex-1 flex-col">
        <AnimatePresence mode="popLayout" initial={false}>
          {clear ? (
            <motion.div
              key="clear"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ios-green/10 text-[12px] font-semibold text-ios-green"
            >
              <ShieldCheckmark16Regular />
              Roll call complete · fire service briefed
            </motion.div>
          ) : (
            s.named.slice(0, 3).map((p, i) => {
              const stuck = s.named.length <= STUCK;
              const isArmed = armed === p.name;
              return (
                <motion.div
                  key={p.name}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className={cn("flex h-[40px] shrink-0 items-center gap-2.5", i > 0 && "border-t-[0.5px] border-split")}
                >
                  <MemojiAvatar who={p.name} size={28} alt={p.name} />
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-[12px] font-semibold text-heading">{p.name}</div>
                    <div className="mt-0.5 truncate text-[11px] text-tertiary">{p.seen}</div>
                  </div>
                  <motion.button
                    type="button"
                    layout
                    onClick={() => markSafe(p.name)}
                    whileTap={{ scale: 0.92 }}
                    className={cn(
                      "h-[24px] shrink-0 cursor-pointer rounded-full px-2.5 text-[11px] font-semibold whitespace-nowrap outline-none transition-colors duration-mid",
                      isArmed
                        ? "bg-ios-green/15 text-ios-green"
                        : stuck
                          ? "bg-ios-orange/15 text-ios-orange hover:bg-ios-orange/25"
                          : "bg-fill-secondary text-heading hover:bg-fill",
                    )}
                  >
                    {isArmed ? "Confirm safe" : "Mark safe"}
                  </motion.button>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
