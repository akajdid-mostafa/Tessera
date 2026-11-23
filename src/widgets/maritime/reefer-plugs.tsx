import { Checkmark12Filled, Temperature20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { enterDelay, sparkPath, useInterval } from "./_parts";

const COLS = 12;
const ROWS = 6;
const EMPTY = new Set([5, 17, 30, 44, 51, 61, 66, 70]);
const TECH = "Eric Kane";

type Phase = "idle" | "confirm" | "sent" | "onsite";
type Alarm = {
  cell: number;
  box: string;
  cargo: string;
  set: number;
  supply: number[];
  fault: string;
  since: number; // minutes
  sev: "red" | "orange";
  rise: number;
};

const SEED: Alarm[] = [
  { cell: 19, box: "TGHU 812044", cargo: "Chilled beef", set: -1.0, supply: [-0.9, -0.6, 0.1, 0.8, 1.6, 2.2, 2.7, 3.1, 3.5, 3.8], fault: "High supply temp", since: 18, sev: "red", rise: 0.06 },
  { cell: 40, box: "MNBU 330918", cargo: "Bananas", set: 13.3, supply: [13.3, 13.2, 13.4, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9], fault: "Power off · plug tripped", since: 6, sev: "orange", rise: 0.03 },
  { cell: 57, box: "SZLU 904127", cargo: "Frozen fish", set: -25.0, supply: [-25.1, -24.9, -24.6, -24.0, -23.4, -22.9, -22.4, -22.0, -21.8, -21.6], fault: "Defrost overrun", since: 41, sev: "orange", rise: 0.02 },
];

const PREFIX = ["MSKU", "CGMU", "TRIU", "SEGU", "OOLU", "CXRU", "TTNU", "HLBU"];
const loc = (cell: number) => `R4-${String(Math.floor(cell / COLS) + 1).padStart(2, "0")}-${String((cell % COLS) + 1).padStart(2, "0")}`;
const boxFor = (cell: number) => `${PREFIX[cell % PREFIX.length]} ${String(100_000 + ((cell * 7_919) % 899_999)).padStart(6, "0")}`;
const t1 = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)}`;

/** Maritime · medium. A reefer block's 72 plugs with three alarms pulsing; pick an alarm to see its supply-air drift and dispatch a technician through a confirm step. */
export function ReeferPlugsWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [alarms, setAlarms] = useState(SEED);
  const [sel, setSel] = useState(SEED[0].cell);
  const [phase, setPhase] = useState<Record<number, Phase>>({});
  const [eta, setEta] = useState<Record<number, number>>({});
  const delay = enterDelay(index);

  useInterval(() => {
    setAlarms((as) =>
      as.map((a) => {
        const p = phase[a.cell];
        const last = a.supply[a.supply.length - 1];
        // Once a tech is on site the unit is reset and pulls back toward set point.
        const next = p === "onsite" ? last + (a.set - last) * 0.18 : last + a.rise + (Math.random() - 0.4) * 0.05;
        return { ...a, supply: [...a.supply.slice(1), Math.round(next * 10) / 10] };
      }),
    );
    const next = { ...eta };
    const arrived: Record<number, Phase> = {};
    for (const k of Object.keys(next)) {
      const c = Number(k);
      if (next[c] > 0) next[c] -= 1;
      if (next[c] === 0 && phase[c] === "sent") arrived[c] = "onsite";
    }
    setEta(next);
    if (Object.keys(arrived).length) setPhase((p) => ({ ...p, ...arrived }));
  }, 3000);

  const a = alarms.find((x) => x.cell === sel) ?? alarms[0];
  const ph = phase[a.cell] ?? "idle";
  const supply = a.supply[a.supply.length - 1];
  const dev = supply - a.set;
  const open = alarms.filter((x) => !phase[x.cell] || phase[x.cell] === "idle" || phase[x.cell] === "confirm").length;
  const powered = COLS * ROWS - EMPTY.size;
  const setPh = (p: Phase) => setPhase((all) => ({ ...all, [a.cell]: p }));

  return (
    <Widget size="medium" index={index} label="Reefer plug monitor">
      <WidgetHeader
        icon={<Temperature20Filled />}
        tint={open ? "var(--ios-red)" : "var(--ios-teal)"}
        title="Reefer Block R4"
        subtitle={`${powered} on power · 440 V · Yard 3`}
        extra={
          open ? (
            <span className="flex items-center gap-1.5 rounded-full bg-ios-red/15 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-ios-red">
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-ios-red opacity-70" />
                <span className="relative size-1.5 rounded-full bg-ios-red" />
              </span>
              {open} open
            </span>
          ) : (
            <span className="rounded-full bg-fill-tertiary px-2 py-0.5 text-[11px] font-semibold text-secondary">All handled</span>
          )
        }
      />

      <div className="mt-2.5 flex min-h-0 flex-1 gap-3">
        {/* Plug grid: rows 01–06, slots 01–12 */}
        <div className="flex w-[142px] shrink-0 flex-col">
          <div className="grid grid-cols-12 gap-[2px]">
            {Array.from({ length: COLS * ROWS }, (_, c) => {
              const al = alarms.find((x) => x.cell === c);
              const empty = EMPTY.has(c);
              const st = al ? phase[al.cell] ?? "idle" : null;
              const live = al && (st === "idle" || st === "confirm");
              const cell = (
                <motion.button
                  type="button"
                  aria-disabled={!al}
                  onClick={() => al && setSel(c)}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={al ? { scale: 1.25 } : undefined}
                  transition={{ delay: delay + (c % COLS) * 0.015 + Math.floor(c / COLS) * 0.03, type: "spring", stiffness: 420, damping: 26 }}
                  className={cn(
                    "relative size-[10px] rounded-[3px] outline-none",
                    al ? "cursor-pointer" : "cursor-default",
                    empty
                      ? "ring-1 ring-fill ring-inset"
                      : !al
                        ? "bg-fill-secondary"
                        : st === "onsite"
                          ? "bg-ios-teal"
                          : al.sev === "red"
                            ? "bg-ios-red"
                            : "bg-ios-orange",
                    sel === c && "ring-1 ring-inset ring-sel",
                  )}
                >
                  {live && !reduce ? (
                    <span className={cn("absolute inset-0 animate-ping rounded-[3px] opacity-60", al.sev === "red" ? "bg-ios-red" : "bg-ios-orange")} />
                  ) : null}
                </motion.button>
              );
              return (
                <Tooltip
                  key={c}
                  title={
                    al
                      ? `${loc(c)} · ${al.box} · ${al.fault}`
                      : empty
                        ? `${loc(c)} · Free plug`
                        : `${loc(c)} · ${boxFor(c)} · in range`
                  }
                >
                  {cell}
                </Tooltip>
              );
            })}
          </div>
          <div className="mt-auto flex items-center justify-between text-[10px] text-tertiary tabular whitespace-nowrap">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-[2px] bg-fill-secondary" /> OK
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-[2px] ring-1 ring-fill ring-inset" /> Free {EMPTY.size}
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-[2px] bg-ios-red" /> Alarm
            </span>
          </div>
        </div>

        {/* Selected alarm */}
        <div className="flex min-w-0 flex-1 flex-col rounded-2xl bg-fill-quaternary px-2.5 py-1.5">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={a.cell}
              initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
              className="leading-tight whitespace-nowrap"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[12px] font-semibold text-heading tabular">{a.box}</span>
                <span className="text-[10px] text-tertiary tabular">{loc(a.cell)}</span>
              </div>
              <div className="truncate text-[11px] text-tertiary tabular">
                {a.cargo} · set {t1(a.set)} °C
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-1 flex items-baseline-last gap-2">
            <div
              className={cn(
                "text-[24px] leading-none font-semibold tracking-tight whitespace-nowrap",
                ph === "onsite" ? "text-heading" : a.sev === "red" ? "text-ios-red" : "text-ios-orange",
              )}
            >
              <AnimatedNumber value={supply} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: "exceptZero" }} />
              <span className="text-[11px] font-medium text-tertiary"> °C</span>
            </div>
            <svg viewBox="0 0 60 18" className="mb-0.5 h-[18px] min-w-0 flex-1" preserveAspectRatio="none" aria-hidden>
              <path
                d={sparkPath(a.supply, 60, 18)}
                fill="none"
                strokeWidth="1.5"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                style={{ stroke: ph === "onsite" ? "var(--ios-teal)" : a.sev === "red" ? "var(--ios-red)" : "var(--ios-orange)" }}
              />
            </svg>
          </div>
          <div className="mt-0.5 truncate text-[10px] text-tertiary tabular whitespace-nowrap">
            Supply air · {t1(dev)} °C off set · {a.fault} · {a.since} min
          </div>

          <div className="mt-auto h-6">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={`${a.cell}-${ph}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className="flex h-6 items-center gap-1.5 whitespace-nowrap"
              >
                {ph === "idle" ? (
                  <>
                    <span className="min-w-0 flex-1 truncate text-[11px] text-tertiary">Reefer tech on shift</span>
                    <Button size="small" type="primary" onClick={() => setPh("confirm")}>
                      Dispatch
                    </Button>
                  </>
                ) : ph === "confirm" ? (
                  <>
                    <MemojiAvatar who={TECH} size={22} />
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-heading">Send Eric?</span>
                    <Button size="small" variant="text" color="default" onClick={() => setPh("idle")}>
                      Back
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => {
                        setPh("sent");
                        setEta((e) => ({ ...e, [a.cell]: 4 }));
                      }}
                    >
                      Send
                    </Button>
                  </>
                ) : (
                  <>
                    <MemojiAvatar who={TECH} size={22} className="ring-[1.5px] ring-[var(--widget-surface)]" />
                    <span className="min-w-0 flex-1 truncate text-[11px] text-secondary">
                      {ph === "sent" ? (
                        <>
                          {TECH} · en route · <AnimatedNumber value={eta[a.cell] ?? 0} /> min
                        </>
                      ) : (
                        `${TECH} · on site, unit reset`
                      )}
                    </span>
                    <Checkmark12Filled className="text-tertiary" />
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
