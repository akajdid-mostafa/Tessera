import { Drop20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { AlarmMark, enterDelay, sparkPath, useInterval } from "./_parts";

type Fluid = "Oil" | "Gas";
type State = "flowing" | "pumpoff" | "comms";
type Well = {
  id: string;
  lift: string;
  state: State;
  oil: number[];
  gas: number[];
  detail: string;
};

const LEN = 18;
const walk = (base: number, amp: number, seed: number) =>
  Array.from({ length: LEN }, (_, i) => Math.round(base + Math.sin(i * 0.9 + seed) * amp + Math.cos(i * 0.37 + seed) * amp * 0.6));

const SEED: Well[] = [
  { id: "7-1H", lift: "ESP", state: "flowing", oil: walk(486, 14, 1), gas: walk(1240, 40, 1), detail: "58 Hz · intake 840 psi · THP 420 psi" },
  {
    id: "7-2H", lift: "Rod", state: "pumpoff",
    oil: [...walk(268, 8, 2).slice(0, 10), 250, 238, 226, 214, 208, 214, 210, 212],
    gas: [...walk(420, 12, 2).slice(0, 10), 410, 398, 392, 386, 380, 384, 378, 380],
    detail: "Fillage 64% · 7.4 SPM · idle timer 12 min",
  },
  { id: "7-3H", lift: "Plunger", state: "flowing", oil: walk(318, 22, 3), gas: walk(2960, 120, 3), detail: "Arrival 6 min · 720 ft/min · CHP 610 psi" },
  {
    id: "7-4H", lift: "ESP", state: "comms",
    oil: [...walk(402, 10, 4).slice(0, 12), 402, 402, 402, 402, 402, 402],
    gas: [...walk(1050, 30, 4).slice(0, 12), 1050, 1050, 1050, 1050, 1050, 1050],
    detail: "RTU-74 no reply since 13:55 · last good value held",
  },
];

const NOTE: Record<State, string> = { flowing: "Flowing", pumpoff: "Pump-off", comms: "Comm loss 14m" };
const SW = 70;
const SH = 16;

function Mark({ state, acked }: { state: State; acked: boolean }) {
  if (state === "pumpoff") return <AlarmMark priority={3} flashing={!acked} size={16} />;
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" className="shrink-0" aria-label={state === "comms" ? "Communication lost" : "Flowing"}>
      {state === "comms" ? (
        <>
          <circle cx="10" cy="10" r="6" fill="none" strokeWidth="1.6" stroke="var(--ant-color-text-tertiary)" />
          <line x1="5.5" y1="14.5" x2="14.5" y2="5.5" strokeWidth="1.6" stroke="var(--ant-color-text-tertiary)" />
        </>
      ) : (
        <circle cx="10" cy="10" r="5" fill="var(--ant-color-text-secondary)" />
      )}
    </svg>
  );
}

/** Oil & gas · medium. A four-well pad as data-dense rows that tick live with sparklines; switch oil and gas, hover a well for its lift detail, tap the pumped-off well to acknowledge it. */
export function WellPadWidget({ index }: { index?: number }) {
  const [wells, setWells] = useState(SEED);
  const [fluid, setFluid] = useState<Fluid>("Oil");
  const [acked, setAcked] = useState(false);
  const delay = enterDelay(index);

  useInterval(() => {
    setWells((ws) =>
      ws.map((w) => {
        if (w.state === "comms") return w;
        const step = (s: number[], amp: number) => [...s.slice(1), Math.round(s[s.length - 1] + (Math.random() - 0.5) * amp)];
        const pull = w.state === "pumpoff" ? 0.5 : 1;
        return { ...w, oil: step(w.oil, 18 * pull), gas: step(w.gas, 70 * pull) };
      }),
    );
  }, 2800);

  const key = fluid === "Oil" ? "oil" : "gas";
  const total = wells.reduce((s, w) => s + w[key][w[key].length - 1], 0);
  const unit = fluid === "Oil" ? "bbl/d" : "Mscf/d";

  return (
    <Widget size="medium" index={index} label="Well pad production">
      <WidgetHeader
        icon={<Drop20Filled />}
        tint={acked ? "var(--ios-blue)" : "var(--ios-yellow)"}
        title="Pad 7 · Delaware Basin"
        subtitle={
          <>
            <AnimatedNumber value={total} className="font-medium text-secondary" /> {unit} · 4 wells
          </>
        }
        extra={<Segmented size="small" value={fluid} onChange={(v) => setFluid(v as Fluid)} options={["Oil", "Gas"]} />}
      />

      <ul className="mt-auto flex flex-col gap-2">
        {wells.map((w, i) => {
          const series = w[key];
          const v = series[series.length - 1];
          const stale = w.state === "comms";
          const lo = Math.min(...series) * 0.96;
          const hi = Math.max(...series) * 1.02;
          return (
            <li key={w.id} className={cn("relative", i > 0 && "before:absolute before:inset-x-0 before:-top-1 before:h-[0.5px] before:bg-split")}>
              <Tooltip placement="top" title={`${w.id} · ${w.lift} · ${w.detail}`}>
                <button
                  type="button"
                  onClick={() => w.state === "pumpoff" && setAcked(true)}
                  aria-label={w.state === "pumpoff" && !acked ? `${w.id} pump-off, acknowledge` : w.id}
                  className="-mx-1.5 flex h-[26px] w-[calc(100%+0.75rem)] cursor-pointer items-center gap-2 px-1.5 text-left whitespace-nowrap transition-colors duration-200 outline-none hover:bg-fill-quaternary"
                >
                  <Mark state={w.state} acked={acked} />
                  <span className="w-[38px] shrink-0 text-[13px] font-semibold text-heading">{w.id}</span>
                  <span
                    className={cn(
                      "w-[112px] shrink-0 truncate text-[11px]",
                      w.state === "flowing" ? "text-tertiary" : "font-medium text-secondary",
                    )}
                  >
                    {w.lift} · {NOTE[w.state]}
                  </span>
                  <svg viewBox={`0 0 ${SW} ${SH}`} preserveAspectRatio="none" className="h-4 min-w-0 flex-1 overflow-visible" aria-hidden>
                    <motion.path d={sparkPath(series, SW, SH, lo, hi)}
                      fill="none"
                      stroke={stale ? "var(--ant-color-text-tertiary)" : "var(--ant-color-text-secondary)"}
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      initial={{ d: sparkPath(series, SW, SH, lo, hi), opacity: 0 }}
                      animate={{ opacity: 1, d: sparkPath(series, SW, SH, lo, hi) }}
                      transition={{
                        opacity: { duration: 1, delay: delay + i * 0.08, ease: [0.22, 1, 0.36, 1] },
                        d: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                      }}
                    />
                  </svg>
                  <span className={cn("w-[52px] shrink-0 text-right text-[13px] font-semibold", stale ? "text-tertiary" : "text-heading")}>
                    <AnimatedNumber value={v} format={{ useGrouping: true }} />
                  </span>
                </button>
              </Tooltip>
            </li>
          );
        })}
      </ul>
    </Widget>
  );
}
