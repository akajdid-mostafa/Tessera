import { ArrowUpload16Regular, Checkmark12Filled, CheckmarkCircle16Filled, Flag20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { FOLD_BG, ROOM_TYPE, usd } from "./_parts-b";

/** Standard Double, Best Available Rate: each channel's copy against the master calendar (differsOn). */
const CHANNELS = [
  { id: 1, name: "Online", date: "Oct 16", master: 275, channel: 275 },
  { id: 6, name: "Booking.com", date: "Oct 16", master: 275, channel: 290 },
  { id: 2, name: "Expedia", date: "Oct 16", master: 275, channel: 260 },
  { id: 3, name: "Agoda", date: "Oct 17", master: 375, channel: 350 },
];

/** Revenue · small. Channels whose rates differ from the master carry an orange fold; tap one to compare and push the master price. */
export function ParityFlagsWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [fixed, setFixed] = useState<Record<number, boolean>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [pushing, setPushing] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  const [ready, setReady] = useState(false);

  const differs = (c: (typeof CHANNELS)[number]) => c.channel !== c.master && !fixed[c.id];
  const count = CHANNELS.filter(differs).length;

  // The count rolls up once the widget has landed.
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), delay * 1000 + 200);
    return () => window.clearTimeout(t);
  }, [delay]);
  useEffect(() => {
    if (ready) setShown(count);
  }, [ready, count]);

  // Pushing the master takes a beat; then the channel is back in step.
  useEffect(() => {
    if (pushing === null) return;
    const id = pushing;
    const t = window.setTimeout(() => {
      setFixed((f) => ({ ...f, [id]: true }));
      setPushing(null);
    }, 1000);
    return () => window.clearTimeout(t);
  }, [pushing]);

  const sel = CHANNELS.find((c) => c.id === selected) ?? null;

  return (
    <Widget
      size="small"
      index={index}
      label="Rate parity"
      glow={{ colors: ["#30D158", "#63E6E2", "#FFD60A"], blur: 18, duration: 3 }}
      glowActive={ready && count === 0}
    >
      <WidgetHeader icon={<Flag20Filled />} tint="var(--ios-orange)" title="Parity" subtitle={`${ROOM_TYPE} · today`} />

      <div className="relative mt-1.5 h-[64px]">
        <AnimatePresence mode="popLayout" initial={false}>
          {sel ? (
            <motion.div
              key={`sel-${sel.id}`}
              className="absolute inset-0 flex flex-col"
              initial={{ opacity: 0, y: 8, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(3px)" }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
            >
              <div className="grid grid-cols-2 gap-2 whitespace-nowrap">
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-[10px] text-tertiary">Master · {sel.date}</div>
                  <div className="text-[15px] font-semibold tracking-tight text-heading tabular">{usd(sel.master)}</div>
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-[10px] text-tertiary">{sel.name}</div>
                  <AnimatedNumber
                    value={differs(sel) ? sel.channel : sel.master}
                    format={{ style: "currency", currency: "USD", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }}
                    className={cn(
                      "text-[15px] font-semibold tracking-tight",
                      differs(sel) ? "text-ios-orange" : "text-ios-green",
                    )}
                  />
                </div>
              </div>
              <div className="mt-auto flex h-6 items-center gap-1.5">
                {differs(sel) ? (
                  <>
                    <Button
                      size="small"
                      shape="round"
                      color="orange"
                      variant="filled"
                      loading={pushing === sel.id}
                      icon={<ArrowUpload16Regular />}
                      onClick={() => setPushing(sel.id)}
                      className="font-semibold"
                    >
                      {pushing === sel.id ? "Pushing" : "Push master"}
                    </Button>
                    <span className="truncate text-[10px] font-semibold text-ios-orange tabular">
                      {sel.channel > sel.master ? "+" : "−"}
                      {usd(Math.abs(sel.channel - sel.master))}
                    </span>
                  </>
                ) : (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                    className="flex items-center gap-1 truncate text-[11px] font-semibold text-ios-green"
                  >
                    <CheckmarkCircle16Filled className="size-3.5 shrink-0" />
                    {fixed[sel.id] ? "Back in step" : "Matches master"}
                  </motion.span>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="summary"
              className="absolute inset-0 flex flex-col"
              initial={{ opacity: 0, y: 8, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(3px)" }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
            >
              {ready && count === 0 ? (
                <div className="flex items-center gap-1.5 text-[20px] leading-none font-semibold tracking-tight text-ios-green">
                  <CheckmarkCircle16Filled className="size-5" /> In step
                </div>
              ) : (
                <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                  <AnimatedNumber
                    value={shown}
                    className="text-[26px] leading-none font-semibold tracking-tight text-ios-orange"
                  />
                  <span className="text-[12px] font-medium text-heading">channels differ</span>
                </div>
              )}
              <div className="mt-1 text-[11px] leading-tight text-tertiary">from the master calendar</div>
              <div className="text-[11px] leading-tight text-tertiary">Tap a flag to compare</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-1">
        {CHANNELS.map((c, i) => {
          const flag = differs(c);
          const on = selected === c.id;
          return (
            <motion.button
              key={c.id}
              type="button"
              onClick={() => setSelected(on ? null : c.id)}
              aria-pressed={on}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 420, damping: 24, delay: delay + i * 0.05 } }}
              whileTap={{ scale: 0.93 }}
              transition={{ type: "spring", stiffness: 500, damping: 24 }}
              className={cn(
                "relative flex h-6 min-w-0 cursor-pointer items-center gap-1 overflow-hidden rounded-[8px] px-1.5 text-left",
                on ? "bg-fill-secondary ring-1 ring-inset ring-sel" : "bg-fill-tertiary",
              )}
            >
              <span className={cn("min-w-0 flex-1 truncate text-[10px] font-semibold", flag ? "text-heading" : "text-secondary")}>
                {c.name}
              </span>
              {!flag ? <Checkmark12Filled className="size-2.5 shrink-0 text-ios-green" /> : null}
              <AnimatePresence>
                {flag ? (
                  <motion.span
                    key="fold"
                    aria-label="Differs from master"
                    className="absolute top-0 right-0 size-[8px] origin-top-right"
                    style={{ background: FOLD_BG }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0, rotate: -45, transition: { duration: 0.35 } }}
                    transition={{ type: "spring", stiffness: 500, damping: 16, delay: delay + 0.25 + i * 0.07 }}
                  />
                ) : null}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </Widget>
  );
}
