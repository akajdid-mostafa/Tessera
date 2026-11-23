import {
  Call20Filled,
  CallCheckmark20Filled,
  CallMissed16Regular,
  Checkmark16Filled,
  Voicemail16Regular,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ComponentType, useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Outcome = "talked" | "vm" | "none";

const OUTCOMES: {
  key: Outcome;
  label: string;
  Glyph: ComponentType<{ className?: string }>;
  /** Solid tile once logged; text stays readable on it. */
  on: string;
  bar: string;
}[] = [
  { key: "talked", label: "Talked", Glyph: CallCheckmark20Filled, on: "bg-ios-green/15 text-ios-green", bar: "bg-ios-green" },
  { key: "vm", label: "Left VM", Glyph: Voicemail16Regular, on: "bg-ios-orange/15 text-ios-orange", bar: "bg-ios-orange" },
  { key: "none", label: "No reply", Glyph: CallMissed16Regular, on: "bg-fill text-heading", bar: "bg-fill" },
];

const LEADS = [
  { name: "Dana Whitfield", org: "Northwind · VP Ops" },
  { name: "Marcus Bell", org: "Pinecrest Bank · CFO" },
  { name: "Aiko Tanaka", org: "Lumen Labs · Head of IT" },
  { name: "Rafael Ortiz", org: "Cobalt Retail · COO" },
  { name: "Grace Liu", org: "Fernway Hotels · Ops Director" },
];

const GOAL = 40;

/** Sales · medium. Call block: tap an outcome to log the call, the count rolls and the next lead slides in. */
export function LogCallWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [counts, setCounts] = useState<Record<Outcome, number>>({ talked: 9, vm: 8, none: 6 });
  const [lead, setLead] = useState(0);
  const [logged, setLogged] = useState<Outcome | null>(null);
  const total = counts.talked + counts.vm + counts.none;

  useEffect(() => {
    if (!logged) return;
    const t = window.setTimeout(() => {
      setLead((l) => (l + 1) % LEADS.length);
      setLogged(null);
    }, 950);
    return () => window.clearTimeout(t);
  }, [logged]);

  const log = (o: Outcome) => {
    if (logged) return;
    setLogged(o);
    setCounts((c) => ({ ...c, [o]: c[o] + 1 }));
  };

  const person = LEADS[lead];

  return (
    <Widget
      size="medium"
      index={index}
      label="Log a call"
      glow={{ mode: "pulse", colors: ["#30D158", "#63E6E2", "#30D158"], blur: 18, duration: 1.4 }}
      glowActive={logged === "talked"}
    >
      <WidgetHeader icon={<Call20Filled />} tint="var(--ios-green)" title="Call Block" subtitle="Today · 2–4 PM" />

      <div className="relative mt-2.5 h-[30px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={person.name}
            className="absolute inset-0 flex items-center gap-2"
            initial={{ opacity: 0, x: 24, filter: "blur(3px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -24, filter: "blur(3px)" }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <MemojiAvatar who={person.name} size={28} />
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[12px] font-semibold text-heading">{person.name}</div>
              <div className="truncate text-[10px] text-tertiary">{person.org}</div>
            </div>
            <div className="shrink-0 text-right leading-tight">
              <div className="text-[10px] text-tertiary">Next up</div>
              <div className="text-[11px] font-medium text-secondary">{LEADS[(lead + 1) % LEADS.length].name}</div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-2 grid h-[58px] grid-cols-3 gap-2">
        {OUTCOMES.map((o, i) => {
          const on = logged === o.key;
          return (
            <motion.button
              key={o.key}
              type="button"
              onClick={() => log(o.key)}
              disabled={!!logged && !on}
              aria-label={`Log call: ${o.label}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: logged && !on ? 0.45 : 1, y: 0, scale: on ? [1, 1.06, 1] : 1 }}
              whileTap={{ scale: 0.92 }}
              transition={{
                y: { type: "spring", stiffness: 380, damping: 26, delay: delay + i * 0.06 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.35 },
              }}
              className={cn(
                "flex cursor-pointer flex-col justify-between rounded-[12px] p-2.5 text-left transition-colors duration-200 outline-none",
                on ? o.on : "bg-fill-tertiary text-secondary hover:bg-fill-secondary",
              )}
            >
              <span className="flex h-[18px] items-center justify-between text-[18px]">
                <AnimatePresence mode="popLayout" initial={false}>
                  {on ? (
                    <motion.span
                      key="check"
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 18 }}
                    >
                      <Checkmark16Filled />
                    </motion.span>
                  ) : (
                    <motion.span key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <o.Glyph className="size-[18px]" />
                    </motion.span>
                  )}
                </AnimatePresence>
                <AnimatedNumber
                  value={counts[o.key]}
                  className={cn("text-[15px] leading-none font-semibold tracking-tight", on ? "" : "text-heading")}
                />
              </span>
              <span className={cn("truncate text-[12px] leading-none font-medium", on ? "" : "text-secondary")}>{o.label}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-auto">
        <div className="flex items-baseline justify-between text-[11px] leading-none text-tertiary">
          <span>
            <AnimatedNumber value={total} className="font-semibold text-heading" /> / {GOAL} calls
          </span>
          <AnimatedNumber value={counts.talked} suffix=" talked" className="text-ios-green" />
        </div>
        <div className="mt-1.5 flex h-1.5 gap-px overflow-hidden rounded-full bg-fill-quaternary">
          {OUTCOMES.map((o, i) => (
            <motion.span
              key={o.key}
              className={cn("h-full first:rounded-l-full", o.bar)}
              initial={{ width: 0 }}
              animate={{ width: `${(counts[o.key] / GOAL) * 100}%` }}
              transition={{ type: "spring", stiffness: 160, damping: 22, delay: logged ? 0 : delay + 0.2 + i * 0.1 }}
            />
          ))}
        </div>
      </div>
    </Widget>
  );
}
