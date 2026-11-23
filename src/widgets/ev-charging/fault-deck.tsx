import { ArrowSync16Filled, Checkmark12Filled, CheckmarkCircle16Filled, Dismiss12Filled, ErrorCircle20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { ConnectorGlyph, type ConnectorType } from "./_parts";

/* Open faults across the network as a deck, worst first. Each card is one
 * StatusNotification with errorCode (OCPP 1.6) and the vendor's own code.
 * Reset is a soft Reset to the charger, armed for 4 s, then confirmed. */
type Sev = "critical" | "high" | "medium";
type Fault = { id: string; charger: string; conn: string; type: ConnectorType; code: string; label: string; vendor: string; age: number; sev: Sev };

const FAULTS: Fault[] = [
  { id: "f1", charger: "SFO-SOM-DC-03", conn: "2B", type: "CCS2", code: "GroundFailure", label: "Ground fault", vendor: "ERR_IMD_FAULT", age: 38, sev: "critical" },
  { id: "f2", charger: "SEA-BLD-DC-11", conn: "1A", type: "CCS2", code: "HighTemperature", label: "Over temperature", vendor: "PS_MODULE_3_OVT", age: 61, sev: "high" },
  { id: "f3", charger: "AUS-DTN-AC-07", conn: "2", type: "Type2", code: "ConnectorLockFailure", label: "Lock failed", vendor: "E-0x2A11", age: 124, sev: "medium" },
  { id: "f4", charger: "BOS-BKB-DC-02", conn: "1B", type: "CHAdeMO", code: "EVCommunicationError", label: "Vehicle comms", vendor: "E-0x1F03", age: 187, sev: "medium" },
];
const ARM_S = 4;

/** ISA-style priority marks: red diamond, orange square, yellow triangle. */
function SevMark({ sev }: { sev: Sev }) {
  return (
    <svg viewBox="0 0 12 12" className="size-3 shrink-0" aria-label={`${sev} priority`}>
      {sev === "critical" ? (
        <rect x="2.2" y="2.2" width="7.6" height="7.6" transform="rotate(45 6 6)" fill="var(--ios-red)" />
      ) : sev === "high" ? (
        <rect x="1.5" y="1.5" width="9" height="9" rx="1.5" fill="var(--ios-orange)" />
      ) : (
        <path d="M6 1.2 L11 10.5 H1 Z" fill="var(--ios-yellow)" />
      )}
    </svg>
  );
}

const ago = (m: number) => (m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`);

/** EV charging · small. Open OCPP faults as a card deck; tap to flip through, Reset arms then confirms and the card flies off. */
export function FaultDeckWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [list, setList] = useState(FAULTS);
  const [act, setAct] = useState<"idle" | "confirm" | "sending" | "done">("idle");
  const [left, setLeft] = useState(ARM_S);
  const timers = useRef<number[]>([]);
  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  useEffect(() => {
    const t = window.setInterval(() => setList((l) => l.map((f) => ({ ...f, age: f.age + 1 }))), 60_000);
    return () => {
      window.clearInterval(t);
      timers.current.forEach((x) => window.clearTimeout(x));
    };
  }, []);

  // The armed reset disarms itself.
  useEffect(() => {
    if (act !== "confirm") return;
    if (left <= 0) {
      setAct("idle");
      return;
    }
    const t = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [act, left]);

  // When the deck is empty, new faults come in after a while.
  useEffect(() => {
    if (list.length) return;
    const t = window.setTimeout(() => setList(FAULTS.slice(0, 3).map((f) => ({ ...f, id: `${f.id}-${Date.now()}`, age: 0 }))), 7000);
    return () => window.clearTimeout(t);
  }, [list.length]);

  const top = list[0];
  const flip = () => {
    if (act !== "idle" || list.length < 2) return;
    setList((l) => [...l.slice(1), l[0]]);
  };
  const confirm = () => {
    setAct("sending");
    later(1200, () => {
      setAct("done");
      later(700, () => {
        setList((l) => l.slice(1));
        setAct("idle");
      });
    });
  };

  return (
    <Widget size="small" index={index} label="Open charger faults">
      <WidgetHeader
        icon={<ErrorCircle20Filled />}
        tint="var(--ios-red)"
        title="Open faults"
        subtitle="OCPP · network"
        extra={
          <span
            className={cn(
              "grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold transition-colors",
              list.length ? "bg-ios-red text-white" : "bg-fill-tertiary text-tertiary",
            )}
          >
            <AnimatedNumber value={list.length} />
          </span>
        }
      />

      <div className="relative mt-4 h-[86px]">
        <AnimatePresence initial={false}>
          {list.length === 0 ? (
            <motion.div
              key="clear"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center"
            >
              <CheckmarkCircle16Filled className="size-7 text-ios-green" />
              <div className="text-[12px] font-semibold text-heading">No open faults</div>
              <div className="text-[11px] text-tertiary">All chargers reporting</div>
            </motion.div>
          ) : null}
          {list.slice(0, 3).map((f, k) => (
            <motion.div
              key={f.id}
              className="absolute inset-x-0 top-0 h-[76px] cursor-pointer"
              style={{ zIndex: 3 - k, originY: 1 }}
              initial={{ opacity: 0, y: -16, scale: 1 }}
              animate={{
                opacity: 1 - k * 0.3,
                y: k * 5,
                scale: 1 - k * 0.06,
                transition: { type: "spring", stiffness: 320, damping: 26, delay: k === 0 ? 0 : 0.04 * k },
              }}
              exit={{ opacity: 0, x: 150, rotate: 12, transition: { duration: 0.35, ease: "easeIn" } }}
              onClick={flip}
              whileTap={k === 0 ? { scale: 0.97 } : undefined}
            >
              <div className="absolute inset-0 rounded-xl bg-[var(--widget-surface)]" />
              <div
                className={cn(
                  "absolute inset-0 rounded-xl ring-1 ring-inset",
                  f.sev === "critical" ? "bg-ios-red/12 ring-ios-red/25" : "bg-fill-tertiary ring-transparent",
                )}
              />
              {k === 0 ? (
                <motion.div
                  className="relative flex h-full flex-col px-2.5 py-2 leading-tight whitespace-nowrap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: list.length === FAULTS.length && f.id === "f1" ? delay : 0.1 }}
                >
                  <div className="flex items-center gap-1.5">
                    <SevMark sev={f.sev} />
                    <span className="truncate text-[12px] font-semibold text-heading">{f.code}</span>
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-tertiary">
                    {f.label} · {f.vendor}
                  </div>
                  <div className="mt-auto flex items-center gap-1 text-[11px] text-secondary">
                    <ConnectorGlyph type={f.type} className="size-3 text-tertiary" />
                    <span className="truncate">
                      {f.charger} · {f.conn}
                    </span>
                    <span className="ml-auto shrink-0 text-tertiary tabular">{ago(f.age)}</span>
                  </div>
                </motion.div>
              ) : null}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-auto flex h-6 items-center gap-1.5 whitespace-nowrap">
        {list.length ? (
          <div className="flex items-center gap-1">
            {list.slice(0, 4).map((f, i) => (
              <span key={f.id} className={cn("h-1.5 rounded-full transition-all", i === 0 ? "w-3 bg-heading" : "w-1.5 bg-fill")} />
            ))}
          </div>
        ) : (
          <span className="text-[11px] text-tertiary">Watching 64 ports</span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {!top ? null : act === "confirm" ? (
            <>
              <Button size="small" shape="circle" variant="filled" color="default" icon={<Dismiss12Filled />} aria-label="Cancel" onClick={() => setAct("idle")} />
              <Button size="small" color="danger" variant="solid" onClick={confirm}>
                Confirm · {left}s
              </Button>
            </>
          ) : act === "sending" ? (
            <span className="flex items-center gap-1.5 text-[11px] text-tertiary">
              <motion.span
                className="size-3.5 rounded-full border-2 border-fill border-t-heading"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
              Reset sent
            </span>
          ) : act === "done" ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-secondary">
              <Checkmark12Filled /> Accepted
            </span>
          ) : (
            <Button
              size="small"
              variant="filled"
              color="danger"
              icon={<ArrowSync16Filled />}
              onClick={() => {
                setLeft(ARM_S);
                setAct("confirm");
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </Widget>
  );
}
