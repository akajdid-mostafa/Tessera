import { Checkmark12Filled, DeveloperBoard20Filled } from "@fluentui/react-icons";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { AlarmMark, enterDelay, useInterval } from "./_parts";

/* A seven-slot PLC rack. Channel LEDs stay neutral: lit = signal on. The analog
 * input card in slot 6 has an open 4–20 mA loop on channel 3 (below 3.6 mA, the
 * NAMUR NE43 wire-break limit), annunciated priority 2 until acknowledged. */
type Kind = "ps" | "cpu" | "di" | "do" | "ai" | "ao";
type Slot = { slot: number; tag: string; kind: Kind; info: string };
const SLOTS: Slot[] = [
  { slot: 0, tag: "PS", kind: "ps", info: "PS 24 V · 10 A · load 46%" },
  { slot: 1, tag: "CPU", kind: "cpu", info: "CPU · RUN · 2 MB · fw 4.2" },
  { slot: 2, tag: "DI", kind: "di", info: "DI-16 · 24 V DC · sink" },
  { slot: 3, tag: "DI", kind: "di", info: "DI-16 · 24 V DC · sink" },
  { slot: 4, tag: "DO", kind: "do", info: "DO-16 · 0.5 A · relay" },
  { slot: 5, tag: "AI", kind: "ai", info: "AI-8 · 4–20 mA · ch 3 at 0.4 mA" },
  { slot: 6, tag: "AO", kind: "ao", info: "AO-4 · 4–20 mA · all in range" },
];
const FAULT_SLOT = 5;
const CHANNELS: Partial<Record<Kind, number>> = { di: 8, do: 8, ai: 4, ao: 4 };
const CLEAR_MS = 10000;

type Alarm = "unack" | "ack" | "clear";

const bits = (n: number) => Array.from({ length: n }, () => Math.random() > 0.45);

/** Factory · small. A PLC rack drawn slot by slot, channel LEDs flickering with the I/O; the faulted analog card flashes until tapped, and hovering a card names it. */
export function PlcRackWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [io, setIo] = useState(() => SLOTS.map((s) => bits(CHANNELS[s.kind] ?? 0)));
  const [scan, setScan] = useState(12.4);
  const [cpu, setCpu] = useState(41);
  const [alarm, setAlarm] = useState<Alarm>("unack");
  const delay = enterDelay(index);

  useInterval(() => {
    setIo((cur) =>
      cur.map((ch, i) => {
        const k = SLOTS[i].kind;
        if (k === "ai" || k === "ao") return ch;
        return ch.map((b) => (Math.random() < 0.18 ? !b : b));
      }),
    );
  }, reduce ? null : 700);
  useInterval(() => {
    setScan(+(11.8 + Math.random() * 1.4).toFixed(1));
    setCpu(38 + Math.round(Math.random() * 7));
  }, 2400);

  // Acknowledged, the field tech re-terminates the loop and the alarm returns to normal.
  useEffect(() => {
    if (alarm !== "ack") return;
    const t = window.setTimeout(() => setAlarm("clear"), CLEAR_MS);
    return () => window.clearTimeout(t);
  }, [alarm]);

  const faulted = alarm !== "clear";

  return (
    <Widget size="small" index={index} label="PLC rack health">
      <WidgetHeader
        icon={<DeveloperBoard20Filled />}
        tint={alarm === "unack" ? "var(--ios-orange)" : "var(--ios-indigo)"}
        title="PLC-3 Rack"
        subtitle="Line 2 · 7 slots"
      />

      <div className="mt-2.5 flex h-[50px] gap-[3px]">
        {SLOTS.map((s, i) => {
          const isFault = faulted && s.slot === FAULT_SLOT;
          const ch = io[i];
          return (
            <Tooltip key={s.slot} placement="top" title={<span className="tabular">{`Slot ${s.slot} · ${s.info}`}</span>}>
              <motion.button
                type="button"
                aria-label={isFault && alarm === "unack" ? `Slot ${s.slot} wire break, acknowledge` : `Slot ${s.slot} ${s.tag}`}
                onClick={() => isFault && alarm === "unack" && setAlarm("ack")}
                className={cn(
                  "relative flex h-full min-w-0 flex-1 cursor-pointer flex-col items-center gap-[3px] rounded-[4px] pt-1 outline-none",
                  "bg-fill-tertiary transition-colors hover:bg-fill-secondary",
                  isFault && "ring-[1.5px] ring-ios-orange ring-inset",
                )}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delay + i * 0.04, type: "spring", stiffness: 320, damping: 24 }}
              >
                {/* Status LED: the CPU's beats with the scan, the faulted card's flashes until acked. */}
                <motion.span
                  className={cn("size-[5px] rounded-full", isFault ? "bg-ios-orange" : "bg-[var(--ant-color-text-secondary)]")}
                  animate={
                    reduce
                      ? { opacity: 1 }
                      : isFault && alarm === "unack"
                        ? { opacity: [1, 0.2, 1] }
                        : s.kind === "cpu"
                          ? { opacity: [1, 0.3, 1] }
                          : { opacity: 1 }
                  }
                  transition={
                    (isFault && alarm === "unack") || s.kind === "cpu"
                      ? { duration: s.kind === "cpu" ? 0.5 : 1, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.2 }
                  }
                />
                {ch.length ? (
                  <span className={cn("grid gap-[2px]", ch.length > 4 ? "grid-cols-2" : "grid-cols-1")}>
                    {ch.map((on, c) => {
                      const broken = isFault && c === 2;
                      return (
                        <span
                          key={c}
                          className={cn(
                            "size-[3px] rounded-[1px] transition-colors duration-150",
                            broken ? "bg-ios-orange" : on ? "bg-[var(--ant-color-text-secondary)]" : "bg-fill",
                          )}
                        />
                      );
                    })}
                  </span>
                ) : s.kind === "ps" ? (
                  <span className="mt-0.5 h-3 w-[3px] rounded-full bg-fill" />
                ) : (
                  <span className="mt-0.5 h-3 w-2 rounded-[2px] bg-fill" />
                )}
                <span className="absolute bottom-0.5 text-[9px] leading-none font-semibold text-tertiary">{s.tag}</span>
              </motion.button>
            </Tooltip>
          );
        })}
      </div>

      <div className="mt-2.5 flex items-baseline-last justify-between whitespace-nowrap">
        <div className="leading-none">
          <AnimatedNumber
            value={scan}
            format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            className="text-[24px] font-semibold tracking-tight text-heading"
          />
          <span className="text-[11px] text-tertiary"> ms scan</span>
        </div>
        <div className="text-[11px] text-tertiary tabular">
          CPU <AnimatedNumber value={cpu} suffix="%" className="font-semibold text-secondary" />
        </div>
      </div>

      <div className="mt-auto flex h-[18px] items-center gap-1 text-[11px] leading-none whitespace-nowrap">
        {faulted ? (
          <>
            <AlarmMark priority={2} flashing={alarm === "unack"} size={15} />
            <span className="truncate font-medium text-heading">Slot 5 · wire break</span>
          </>
        ) : (
          <motion.span className="flex items-center gap-1 text-tertiary" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
            <Checkmark12Filled />
            All modules OK
          </motion.span>
        )}
      </div>
    </Widget>
  );
}
