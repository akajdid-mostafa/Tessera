import { Grid20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { AlarmMark, enterDelay, useInterval } from "./_parts";

/* A 100 MWac plant with forty 2.5 MW central inverters, laid out as the blocks sit
 * in the field. Tiles are greyscale by output; only abnormal ones get colour and a
 * shape: a tripped inverter (DC insulation fault, priority 2), two thermally
 * derated ones (priority 3) and one with lost comms (hatched, last value unknown).
 * A cloud shadow drifts across the blocks and the plant total follows it. */
const COLS = 10;
const ROWS = 4;
const RATED = 2.5;
const CLEAR = 2.18;
type Kind = "ok" | "fault" | "derate" | "comms";
const SPECIAL: Record<number, Kind> = { 6: "fault", 23: "derate", 24: "derate", 17: "comms" };
const INVS = Array.from({ length: COLS * ROWS }, (_, i) => ({
  id: `INV-${String(i + 1).padStart(2, "0")}`,
  kind: SPECIAL[i] ?? ("ok" as Kind),
  col: i % COLS,
  row: Math.floor(i / COLS),
  bias: 0.97 + ((i * 37) % 11) / 180,
  vdc: 1140 + ((i * 53) % 90),
  temp: 38 + ((i * 29) % 8),
}));
const DETAIL: Record<Exclude<Kind, "ok">, string> = {
  fault: "DC insul. fault",
  derate: "Derated · 61 °C",
  comms: "No comms 11:42",
};

/** Energy · medium. Forty solar inverters as a greyscale field of tiles that dim as a cloud shadow drifts across; hover a tile for its readings and tap the tripped one to acknowledge it. */
export function InverterMatrixWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [cloud, setCloud] = useState(2.4);
  const [hover, setHover] = useState<number | null>(null);
  const [acked, setAcked] = useState(false);
  const delay = enterDelay(index);

  useInterval(() => setCloud((c) => (c > COLS + 3 ? -4 : +(c + 0.12).toFixed(2))), reduce ? null : 400);

  const mw = useMemo(
    () =>
      INVS.map((v) => {
        if (v.kind === "fault") return 0;
        const shade = 1 - 0.5 * Math.exp(-((v.col - cloud) ** 2) / 3 - ((v.row - 1.6) ** 2) / 6);
        const raw = CLEAR * v.bias * shade;
        return v.kind === "derate" ? Math.min(1.8, raw) : raw;
      }),
    [cloud],
  );
  const total = mw.reduce((s, x, i) => s + (INVS[i].kind === "comms" ? CLEAR * 0.9 : x), 0);
  const producing = INVS.filter((v) => v.kind === "ok" || v.kind === "derate").length;
  const h = hover !== null ? INVS[hover] : null;

  return (
    <Widget size="medium" index={index} label="Solar inverter matrix">
      <WidgetHeader
        icon={<Grid20Filled />}
        tint={acked ? "var(--ios-indigo)" : "var(--ios-orange)"}
        title="Saltbush Solar · Inverters"
        subtitle="40 × 2.5 MW · blocks A–D"
      />

      <div className="mt-2 flex min-h-0 flex-1 gap-3">
        <div className="flex w-[100px] shrink-0 flex-col whitespace-nowrap">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={h ? h.id : "plant"}
              initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(3px)" }}
              transition={{ duration: 0.18 }}
            >
              <div className="text-[11px] font-semibold text-secondary">{h ? h.id : "Plant output"}</div>
              <div className="flex items-baseline gap-1 leading-none">
                {h?.kind === "comms" ? (
                  <span className="text-[28px] font-semibold tracking-tight text-tertiary">—</span>
                ) : (
                  <AnimatedNumber
                    value={h ? mw[hover!] : total}
                    format={{ minimumFractionDigits: h ? 2 : 1, maximumFractionDigits: h ? 2 : 1 }}
                    className="text-[28px] font-semibold tracking-tight text-heading"
                  />
                )}
                <span className="text-[12px] text-tertiary">MW</span>
              </div>
              <div className={cn("mt-1 truncate text-[11px]", h && h.kind !== "ok" ? "font-medium text-heading" : "text-tertiary")}>
                {h ? (h.kind === "ok" ? `${h.vdc.toLocaleString("en-US")} V · ${h.temp} °C` : DETAIL[h.kind]) : `of 100 MWac`}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-auto flex flex-col gap-1 text-[11px] leading-none text-tertiary tabular">
            <span>
              <span className="font-semibold text-secondary">{producing}</span> producing
            </span>
            <span className="flex items-center gap-1">
              <AlarmMark priority={2} flashing={!acked} size={13} />1 tripped
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative grid flex-1 gap-[3px]" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))` }}>
            {INVS.map((v, i) => {
              const share = mw[i] / RATED;
              return (
                <motion.button
                  key={v.id}
                  type="button"
                  aria-label={`${v.id}${v.kind === "fault" && !acked ? ", tripped, acknowledge" : ""}`}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onClick={() => v.kind === "fault" && setAcked(true)}
                  className={cn(
                    "relative cursor-pointer overflow-hidden rounded-[4px] outline-none",
                    v.kind === "comms" && "border border-dashed border-[var(--ant-color-text-tertiary)]",
                    v.kind === "derate" && "ring-[1.5px] ring-ios-yellow ring-inset",
                    hover === i && "ring-1 ring-inset ring-sel",
                  )}
                  style={
                    v.kind === "comms"
                      ? { backgroundImage: "repeating-linear-gradient(135deg, var(--ant-color-fill) 0 2px, transparent 2px 5px)" }
                      : { background: `color-mix(in srgb, var(--ant-color-text) ${Math.round(8 + share * 52)}%, transparent)`, transition: "background 0.6s" }
                  }
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: delay + (v.col + v.row) * 0.025, type: "spring", stiffness: 380, damping: 24 }}
                >
                  {v.kind === "fault" ? (
                    <motion.span
                      className="absolute inset-0 rounded-[4px] ring-2 ring-ios-orange ring-inset"
                      animate={!acked && !reduce ? { opacity: [1, 0.2, 1] } : { opacity: 1 }}
                      transition={!acked && !reduce ? { duration: 1, repeat: Infinity } : { duration: 0.2 }}
                    />
                  ) : null}
                </motion.button>
              );
            })}
          </div>
          <div className="mt-1.5 flex items-center gap-3 text-[10px] leading-none whitespace-nowrap text-tertiary">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-[2px] bg-[var(--ant-color-text-tertiary)]" />
              Output
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-[2px] ring-[1.5px] ring-ios-yellow ring-inset" />
              Derated
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-[2px] border border-dashed border-[var(--ant-color-text-tertiary)]" />
              No comms
            </span>
          </div>
        </div>
      </div>
    </Widget>
  );
}
