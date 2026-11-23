import { AirplaneTakeOff20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { enterDelay, hhmm, useInterval } from "./_parts";

type Mode = "Departures" | "Arrivals";
type Tone = "green" | "blue" | "orange" | "red" | "neutral" | "quiet";
type Flight = { code: string; city: string; type: string; reg: string; stand: string };

const DEP: Flight[] = [
  { code: "U2 8031", city: "Barcelona", type: "A320neo", reg: "G-UZHA", stand: "47" },
  { code: "BA 2662", city: "Málaga", type: "A320", reg: "G-GATN", stand: "52" },
  { code: "EK 16", city: "Dubai", type: "A380", reg: "A6-EOT", stand: "101" },
  { code: "UA 925", city: "Washington", type: "787-10", reg: "N12010", stand: "33" },
  { code: "W9 5734", city: "Budapest", type: "A321neo", reg: "G-WUKK", stand: "18" },
  { code: "B6 22", city: "New York JFK", type: "A321LR", reg: "N4048J", stand: "110" },
  { code: "DY 1303", city: "Oslo", type: "737-800", reg: "LN-NIH", stand: "26" },
  { code: "QR 330", city: "Doha", type: "787-9", reg: "A7-BHD", stand: "104" },
  { code: "VY 7821", city: "Barcelona", type: "A320", reg: "EC-MLE", stand: "41" },
  { code: "U2 8209", city: "Geneva", type: "A319", reg: "G-EZIV", stand: "49" },
];
const ARR: Flight[] = [
  { code: "BA 2611", city: "Nice", type: "A320", reg: "G-EUYR", stand: "4" },
  { code: "EK 15", city: "Dubai", type: "A380", reg: "A6-EOT", stand: "7" },
  { code: "U2 8318", city: "Lisbon", type: "A320neo", reg: "G-UZHF", stand: "2" },
  { code: "UA 924", city: "Washington", type: "787-10", reg: "N12010", stand: "5" },
  { code: "DY 1302", city: "Oslo", type: "737-800", reg: "LN-NIH", stand: "3" },
  { code: "B6 21", city: "New York JFK", type: "A321LR", reg: "N4048J", stand: "8" },
  { code: "W9 5733", city: "Budapest", type: "A321neo", reg: "G-WUKK", stand: "1" },
  { code: "VY 7820", city: "Barcelona", type: "A320", reg: "EC-MLE", stand: "6" },
  { code: "QR 329", city: "Doha", type: "787-9", reg: "A7-BHD", stand: "7" },
  { code: "U2 8402", city: "Palma", type: "A321neo", reg: "G-UZMB", stand: "2" },
];

const BASE = 14 * 60 + 5;
const STEP = 7;
const PHASES = 3;
const TICK_MS = 3200;
const ROWS = 4;

const TONE: Record<Tone, string> = {
  green: "bg-ios-green/15 text-ios-green",
  blue: "bg-ios-blue/15 text-ios-blue",
  orange: "bg-ios-orange/15 text-ios-orange",
  red: "bg-ios-red/15 text-ios-red",
  neutral: "bg-fill-tertiary text-secondary",
  quiet: "text-tertiary",
};

/** Status of flight `n` sitting at row `pos`, `phase` ticks into the top slot. */
function status(mode: Mode, n: number, pos: number, phase: number): { label: string; tone: Tone } {
  const std = BASE + n * STEP;
  const late = n % 5 === 2;
  if (mode === "Departures") {
    if (n % 11 === 7 && pos > 0) return { label: "Cancelled", tone: "red" };
    if (pos === 0) return [
      { label: "Boarding", tone: "green" as Tone },
      { label: "Final call", tone: "blue" as Tone },
      { label: "Gate closed", tone: "neutral" as Tone },
    ][phase];
    if (late) return { label: `Delayed ${hhmm(std + 35)}`, tone: "orange" };
    if (pos === 1) return { label: phase === 2 ? "Boarding" : "Go to gate", tone: phase === 2 ? "green" : "neutral" };
    return { label: pos === 2 ? "Go to gate" : "Wait in lounge", tone: "quiet" };
  }
  if (pos === 0) return [
    { label: `Landed ${hhmm(std - 4)}`, tone: "neutral" as Tone },
    { label: "On stand", tone: "neutral" as Tone },
    { label: "Bags on belt", tone: "green" as Tone },
  ][phase];
  if (late) return { label: `Expected ${hhmm(std + 25)}`, tone: "orange" };
  if (pos === 1) return { label: phase === 2 ? "Landed" : "Final approach", tone: phase === 2 ? "neutral" : "blue" };
  return { label: pos === 2 ? `Expected ${hhmm(std - 2)}` : "Scheduled", tone: "quiet" };
}

/** Airport · medium. A live flight information board, departures or arrivals, where the top flight steps through its statuses and rolls off as the next moves up; hover a row for TOBT, aircraft and stand. */
export function DeparturesBoardWidget({ index }: { index?: number }) {
  const [mode, setMode] = useState<Mode>("Departures");
  const [tick, setTick] = useState(0);
  const settled = useRef(false);
  const delay = enterDelay(index);

  useEffect(() => {
    const t = window.setTimeout(() => (settled.current = true), 1600);
    return () => window.clearTimeout(t);
  }, []);
  useInterval(() => setTick((t) => t + 1), TICK_MS);

  const k = Math.floor(tick / PHASES);
  const phase = tick % PHASES;
  const list = mode === "Departures" ? DEP : ARR;
  const rows = Array.from({ length: ROWS }, (_, pos) => k + pos);
  const now = BASE + k * STEP - 6 + phase * 2;
  const dep = mode === "Departures";

  return (
    <Widget size="medium" index={index} label="Flight information board">
      <WidgetHeader
        icon={<AirplaneTakeOff20Filled />}
        tint="var(--ios-indigo)"
        title="LGW · South Terminal"
        subtitle={`Local ${hhmm(now)} · ${dep ? "Gates 1–110" : "Belts 1–8"}`}
        extra={<Segmented size="small" value={mode} onChange={(v) => setMode(v as Mode)} options={["Departures", "Arrivals"]} />}
      />

      <ul className="mt-auto flex flex-col gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {rows.map((n, pos) => {
            const f = list[n % list.length];
            const std = BASE + n * STEP;
            const st = status(mode, n, pos, phase);
            const tip = dep
              ? `TOBT ${hhmm(std - 5)} · TSAT ${hhmm(std - 3)} · ${f.type} ${f.reg} · Stand ${f.stand}`
              : `ELDT ${hhmm(std - 4)} · ${f.type} ${f.reg} · Belt ${f.stand}`;
            return (
              <motion.li
                key={`${mode}-${n}`}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ type: "spring", stiffness: 360, damping: 32, delay: settled.current ? 0 : delay + pos * 0.06 }}
                className={cn("relative", pos > 0 && "before:absolute before:inset-x-0 before:-top-1 before:h-[0.5px] before:bg-split")}
              >
                <Tooltip placement="top" title={tip}>
                  <div className="-mx-1.5 flex h-[26px] cursor-default items-center gap-2 px-1.5 whitespace-nowrap transition-colors duration-200 hover:bg-fill-quaternary">
                    <span className="w-[38px] shrink-0 text-[13px] font-semibold text-heading tabular">{hhmm(std)}</span>
                    <span className="w-[58px] shrink-0 text-[12px] font-medium text-secondary tabular">{f.code}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-heading">{f.city}</span>
                    <span className="w-[42px] shrink-0 text-right text-[11px] text-tertiary tabular">
                      {dep ? "Gate" : "Belt"} <span className="font-semibold text-secondary">{f.stand}</span>
                    </span>
                    <span className="flex w-[106px] shrink-0 justify-end [perspective:300px]">
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                          key={st.label}
                          initial={{ rotateX: -90, opacity: 0 }}
                          animate={{ rotateX: 0, opacity: 1 }}
                          exit={{ rotateX: 90, opacity: 0 }}
                          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold tabular", TONE[st.tone], st.tone === "quiet" && "px-0 font-medium")}
                        >
                          {st.label}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                  </div>
                </Tooltip>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </Widget>
  );
}
