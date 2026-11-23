import { Checkmark12Filled, HeartPulse20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

/* Neck-collar alerts for a 312-cow dairy herd. Heat shows as an activity spike over the
 * cow's own baseline; the best insemination window opens about 12 h after onset and
 * lasts about 6 h. Health alerts come from rumination minutes and quarter conductivity.
 * Acting on a row (bred, sorted to the pen) clears it; an empty list says so. */
type View = "Heat" | "Health";
type Row = { tag: string; sub: string; spark: number[]; change: number; action: string; done: string; tip: string };

const daily = (n: number, base: number, amp: number, tail: number[]) =>
  [...Array.from({ length: n - tail.length }, (_, i) => base + Math.sin((i / 12) * Math.PI * 2) * amp + Math.sin(i * 2.7) * amp * 0.3), ...tail];

const HEAT: Row[] = [
  { tag: "#4127", sub: "Lact 2 · 68 DIM", spark: daily(24, 46, 12, [64, 98, 131, 146]), change: 212, action: "AI 10–16", done: "Bred", tip: "Onset 22:10 · 2nd heat since calving" },
  { tag: "#3871", sub: "Lact 1 · 54 DIM", spark: daily(24, 52, 10, [58, 87, 136]), change: 164, action: "AI 14–20", done: "Bred", tip: "Onset 02:40 · first service · heifer pen 3" },
];
const ARRIVING: Row = { tag: "#4092", sub: "Lact 3 · 81 DIM", spark: daily(24, 41, 11, [49, 98]), change: 138, action: "AI 21–03", done: "Bred", tip: "Onset 09:05 · just flagged · watch for standing heat" };
const HEALTH: Row[] = [
  { tag: "#2954", sub: "Rumination 312 min", spark: daily(24, 480, 40, [430, 380, 340, 312]), change: -38, action: "Sort", done: "Sorted", tip: "Rumination down 38 % on her 7-day mean · 6 DIM, ketosis risk" },
  { tag: "#3310", sub: "Conductivity LR", spark: daily(24, 5.1, 0.15, [5.6, 6.0, 6.2]), change: 22, action: "Sort", done: "Sorted", tip: "Left-rear quarter +22 % · early mastitis sign · strip and test" },
  { tag: "#4018", sub: "Eating 74 min", spark: daily(24, 125, 14, [104, 88, 74]), change: -41, action: "Sort", done: "Sorted", tip: "Eating time down 41 % · 3 d after calving · check for fever" },
];

const SW = 100;
const SH = 18;
function spark(points: number[]) {
  const lo = Math.min(...points);
  const hi = Math.max(...points);
  const span = hi - lo || 1;
  return points.map((v, i) => [(i / (points.length - 1)) * SW, SH - ((v - lo) / span) * (SH - 2) - 1] as const);
}

/** Agriculture · medium. Collar alerts for cows in heat or off-feed with a 48 h activity or rumination sparkline; a new heat slides in live, and marking a cow bred or sorted clears its row down to an empty state. */
export function HerdAlertsWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [view, setView] = useState<View>("Heat");
  const [heat, setHeat] = useState(HEAT);
  const [health, setHealth] = useState(HEALTH);
  const [done, setDone] = useState<string[]>([]);
  const [fresh, setFresh] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setTimeout(() => {
      setHeat((rows) => (rows.some((r) => r.tag === ARRIVING.tag) ? rows : [ARRIVING, ...rows].slice(0, 3)));
      setFresh(ARRIVING.tag);
    }, 5200);
    const list = timers.current;
    return () => {
      window.clearTimeout(t);
      for (const id of list) window.clearTimeout(id);
    };
  }, []);

  const act = (tag: string) => {
    setDone((d) => [...d, tag]);
    const id = window.setTimeout(() => {
      setHeat((rows) => rows.filter((r) => r.tag !== tag));
      setHealth((rows) => rows.filter((r) => r.tag !== tag));
    }, 1300);
    timers.current.push(id);
  };

  const rows = view === "Heat" ? heat : health;
  const tone = view === "Heat" ? "var(--ios-pink)" : "var(--ios-orange)";
  const toneText = view === "Heat" ? "text-ios-pink" : "text-ios-orange";
  const toneBg = view === "Heat" ? "bg-ios-pink/15" : "bg-ios-orange/15";
  const open = rows.filter((r) => !done.includes(r.tag)).length;

  return (
    <Widget size="medium" index={index} label="Herd collar alerts">
      <WidgetHeader
        icon={<HeartPulse20Filled />}
        tint="var(--ios-pink)"
        title="Herd Alerts"
        subtitle={
          <span>
            Collars · <AnimatedNumber value={open} className="font-semibold text-secondary" /> open · 312 cows
          </span>
        }
        extra={<Segmented size="small" value={view} onChange={(v) => setView(v as View)} options={["Heat", "Health"]} />}
      />

      <ul className="relative mt-1.5 flex h-[103px] flex-col gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {rows.length === 0 ? (
            <motion.li
              key={`${view}-empty`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center"
            >
              <span className="grid size-7 place-items-center rounded-full bg-fill-tertiary text-secondary">
                <Checkmark12Filled />
              </span>
              <span className="text-[12px] font-semibold text-heading">{view === "Heat" ? "No cows in heat" : "No health alerts"}</span>
              <span className="text-[11px] text-tertiary">Next collar sync 10:00</span>
            </motion.li>
          ) : (
            rows.map((r, i) => {
              const pts = spark(r.spark);
              const d = pts.map(([x, y], k) => `${k ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
              const isDone = done.includes(r.tag);
              return (
                <motion.li
                  key={`${view}-${r.tag}`}
                  layout
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: isDone ? 0.5 : 1, x: 0 }}
                  exit={{ opacity: 0, x: -14, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 380, damping: 32, delay: i * 0.04 }}
                  className={cn("relative flex h-[29px] shrink-0 items-center gap-2.5 whitespace-nowrap", i > 0 && "before:absolute before:inset-x-0 before:-top-1 before:h-[0.5px] before:bg-split")}
                >
                  <Tooltip placement="top" title={`${r.tag} · ${r.tip}`}>
                    <span className="w-[112px] shrink-0 cursor-default leading-none">
                      <span className="flex items-center gap-1 text-[13px] font-semibold text-heading tabular">
                        {r.tag}
                        {fresh === r.tag ? (
                          <motion.span
                            className="size-1.5 rounded-full"
                            style={{ background: tone }}
                            animate={reduce ? undefined : { opacity: [1, 0.25, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                          />
                        ) : null}
                      </span>
                      <span className="mt-[3px] block truncate text-[10px] text-tertiary">{r.sub}</span>
                    </span>
                  </Tooltip>
                  <svg viewBox={`0 0 ${SW} ${SH}`} className="h-[18px] min-w-0 flex-1 overflow-visible" preserveAspectRatio="none" aria-hidden>
                    <motion.path
                      d={d}
                      fill="none"
                      stroke={tone}
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: delay + i * 0.06 }}
                    />
                  </svg>
                  <span className={cn("w-[46px] shrink-0 text-right text-[13px] font-semibold", toneText)}>
                    <AnimatedNumber value={r.change} prefix={r.change > 0 ? "+" : ""} suffix="%" />
                  </span>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    disabled={isDone}
                    onClick={() => act(r.tag)}
                    aria-label={`${r.action} ${r.tag}`}
                    className={cn(
                      "relative flex h-[22px] w-[78px] shrink-0 cursor-pointer items-center justify-center gap-1 rounded-full text-[11px] font-semibold transition-colors disabled:cursor-default",
                      isDone ? "bg-fill-tertiary text-secondary" : cn(toneBg, toneText),
                    )}
                  >
                    {isDone ? <Checkmark12Filled /> : null}
                    {isDone ? r.done : r.action}
                  </motion.button>
                </motion.li>
              );
            })
          )}
        </AnimatePresence>
      </ul>

      <div className="mt-auto flex items-center gap-2 text-[11px] whitespace-nowrap text-tertiary">
        <MemojiAvatar who={view === "Heat" ? "f4" : "m6"} size={20} />
        <span className="truncate">
          {view === "Heat" ? (
            <>
              <span className="font-semibold text-secondary">Dana</span> · AI tech on farm 13:30
            </>
          ) : (
            <>
              <span className="font-semibold text-secondary">Dr. Ruiz</span> · herd vet visit Thu 09:00
            </>
          )}
        </span>
      </div>
    </Widget>
  );
}
