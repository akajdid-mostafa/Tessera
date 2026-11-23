import { Add12Filled, FlashSettings20Filled, Subtract12Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { AlarmMark, enterDelay, useInterval } from "./_parts";

/* A 90 MVA 132/33 kV grid transformer on ONAF cooling with one of its two fan banks
 * failed, so the winding hot spot creeps toward its 110 °C alarm under 82% load.
 * The on-load tap changer has 17 positions of 1.25% each; an operation takes a few
 * seconds, during which the control is locked out. */
const TAPS = 17;
const STEP_PCT = 1.25;
const NOMINAL_TAP = 9;
const LV_NOM = 33;
const TRAVEL_MS = 3200;

type Temp = { key: string; label: string; lo: number; hi: number; h: number; hh: number };
const OIL: Temp = { key: "oil", label: "Top oil", lo: 20, hi: 120, h: 95, hh: 105 };
const HOT: Temp = { key: "hot", label: "Hot spot", lo: 20, hi: 130, h: 110, hh: 120 };
const pct = (t: Temp, v: number) => ((Math.min(t.hi, Math.max(t.lo, v)) - t.lo) / (t.hi - t.lo)) * 100;

function Fan({ cx, cy, on, failed, reduce }: { cx: number; cy: number; on: boolean; failed: boolean; reduce: boolean | null }) {
  const spin = on && !reduce;
  return (
    <g>
      <circle cx={cx} cy={cy} r="10" className="fill-fill-tertiary" stroke={failed ? "var(--ios-orange)" : "var(--ant-color-text-tertiary)"} strokeWidth={failed ? 1.6 : 1.1} />
      <motion.g
        animate={spin ? { rotate: 360 } : { rotate: 20 }}
        transition={spin ? { duration: 0.9, repeat: Infinity, ease: "linear" } : { duration: 0.4 }}
      >
        <circle cx={cx} cy={cy} r="9" fill="transparent" />
        {[0, 120, 240].map((a) => (
          <path
            key={a}
            d={`M${cx} ${cy} q 2 -7 0 -8 q -3 1 0 8`}
            transform={`rotate(${a} ${cx} ${cy})`}
            className={failed ? "fill-tertiary" : "fill-secondary"}
          />
        ))}
      </motion.g>
      <circle cx={cx} cy={cy} r="1.6" className="fill-heading" />
    </g>
  );
}

function TempRow({ t, v, delay }: { t: Temp; v: number; delay: number }) {
  const high = v >= t.h;
  return (
    <Tooltip placement="left" title={<span className="tabular">{`${t.label} · H ${t.h} · HH ${t.hh} °C`}</span>}>
      <div className="-mx-1.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-fill-quaternary">
        <div className="flex items-baseline justify-between text-[11px] leading-none whitespace-nowrap">
          <span className={cn(high ? "font-semibold text-ios-orange" : "text-secondary")}>{t.label}</span>
          <span className="tabular">
            <AnimatedNumber
              value={v}
              format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
              className={cn("text-[14px] font-semibold", high ? "text-ios-orange" : "text-heading")}
            />
            <span className="text-tertiary"> °C</span>
          </span>
        </div>
        <div className="relative mt-1.5 h-1.5 rounded-full bg-fill-secondary">
          <motion.div
            className={cn("absolute inset-y-0 left-0 rounded-full", high ? "bg-ios-orange" : "bg-[var(--ant-color-text-secondary)]")}
            initial={{ width: 0 }}
            animate={{ width: `${pct(t, v)}%` }}
            transition={{ type: "spring", stiffness: 90, damping: 20, delay }}
          />
          <span className="absolute -top-1 h-3.5 w-[2px] -translate-x-1/2 rounded-full bg-[var(--ant-color-text-tertiary)]" style={{ left: `${pct(t, t.h)}%` }} />
          <span className="absolute -top-1 h-3.5 w-[2px] -translate-x-1/2 rounded-full bg-heading" style={{ left: `${pct(t, t.hh)}%` }} />
        </div>
      </div>
    </Tooltip>
  );
}

/** Energy · medium. A grid transformer with its fan banks, oil and hot-spot temperatures on H/HH bars and a locked-out tap changer; the hot spot creeps up live, and ± raises or lowers the tap. */
export function TransformerWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [oil, setOil] = useState(78.2);
  const [hot, setHot] = useState(104.1);
  const [tap, setTap] = useState(NOMINAL_TAP - 1);
  const [travel, setTravel] = useState<1 | -1 | null>(null);
  const [acked, setAcked] = useState(false);
  const delay = enterDelay(index);

  useInterval(() => {
    setOil((o) => +Math.min(84.5, o + 0.08 + Math.random() * 0.1).toFixed(1));
    setHot((h) => +Math.min(111.6, h + 0.12 + Math.random() * 0.14).toFixed(1));
  }, 2000);

  useEffect(() => {
    if (travel === null) return;
    const dir = travel;
    const t = window.setTimeout(() => {
      setTap((x) => Math.min(TAPS, Math.max(1, x + dir)));
      setTravel(null);
    }, TRAVEL_MS);
    return () => window.clearTimeout(t);
  }, [travel]);

  const lv = LV_NOM * (1 + ((tap - NOMINAL_TAP) * STEP_PCT) / 100) * 0.9995;
  const pu = lv / LV_NOM;
  const lvOff = Math.abs(pu - 1) > 0.025;

  return (
    <Widget size="medium" index={index} label="Grid transformer">
      <WidgetHeader
        icon={<FlashSettings20Filled />}
        tint={hot >= HOT.h ? "var(--ios-orange)" : "var(--ios-indigo)"}
        title="T2 · 132/33 kV · 90 MVA"
        subtitle="ONAF cooling · 82% load"
        extra={
          <button
            type="button"
            onClick={() => setAcked(true)}
            aria-label={acked ? "Fan bank 2 failed, acknowledged" : "Fan bank 2 failed, acknowledge"}
            className="flex cursor-pointer items-center gap-1 rounded-full bg-ios-yellow/20 py-0.5 pr-2 pl-1 text-[11px] font-semibold whitespace-nowrap text-heading"
          >
            <AlarmMark priority={3} flashing={!acked} size={14} />
            Fan 2 fail
          </button>
        }
      />

      <div className="mt-2 flex min-h-0 flex-1 gap-3">
        {/* Elevation sketch: tank with two windings, radiator bank and its two fans. */}
        <div className="flex w-[96px] shrink-0 flex-col">
          <svg viewBox="0 0 96 96" className="h-[96px] w-[96px]" aria-hidden>
            <rect x="6" y="14" width="46" height="62" rx="4" className="fill-fill-tertiary stroke-tertiary" strokeWidth="1.1" />
            <circle cx="29" cy="37" r="11" fill="none" className="stroke-secondary" strokeWidth="1.5" />
            <circle cx="29" cy="53" r="11" fill="none" className="stroke-secondary" strokeWidth="1.5" />
            {[20, 38].map((x) => (
              <rect key={x} x={x - 3} y="6" width="6" height="9" rx="1.5" className="fill-fill" />
            ))}
            {Array.from({ length: 7 }, (_, k) => (
              <rect key={k} x={56 + k * 5} y="18" width="3" height="40" rx="1" className="fill-fill" />
            ))}
            <line x1="52" x2="90" y1="22" y2="22" className="stroke-fill" strokeWidth="1.5" />
            <line x1="52" x2="90" y1="54" y2="54" className="stroke-fill" strokeWidth="1.5" />
            <Fan cx={63} cy={72} on failed={false} reduce={reduce} />
            <Fan cx={85} cy={72} on={false} failed reduce={reduce} />
            <rect x="4" y="76" width="50" height="4" rx="1" className="fill-fill" />
          </svg>
          <div className="mt-auto text-[11px] leading-tight text-tertiary tabular whitespace-nowrap">
            <span className="font-semibold text-secondary">73.8</span> MVA load
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <TempRow t={OIL} v={oil} delay={delay} />
          <TempRow t={HOT} v={hot} delay={delay + 0.1} />

          <div className="mt-auto flex items-center gap-2 whitespace-nowrap">
            <span className="rounded-md bg-fill-tertiary px-1.5 py-0.5 text-[10px] font-semibold text-secondary">AVR M</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={travel !== null || tap <= 1}
                onClick={() => setTravel(-1)}
                aria-label="Lower tap"
                className="grid size-6 cursor-pointer place-items-center rounded-full bg-fill-tertiary text-heading transition-colors hover:bg-fill-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Subtract12Filled />
              </button>
              <div className="w-[46px] text-center leading-none">
                <AnimatePresence mode="popLayout" initial={false}>
                  {travel !== null ? (
                    <motion.span
                      key="t"
                      className="text-[11px] font-semibold text-secondary"
                      initial={{ opacity: 0 }}
                      animate={reduce ? { opacity: 1 } : { opacity: [1, 0.35, 1] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, repeat: reduce ? 0 : Infinity }}
                    >
                      {travel > 0 ? "Raise…" : "Lower…"}
                    </motion.span>
                  ) : (
                    <motion.span key="n" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[13px] font-semibold text-heading">
                      Tap <AnimatedNumber value={tap} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <button
                type="button"
                disabled={travel !== null || tap >= TAPS}
                onClick={() => setTravel(1)}
                aria-label="Raise tap"
                className="grid size-6 cursor-pointer place-items-center rounded-full bg-fill-tertiary text-heading transition-colors hover:bg-fill-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Add12Filled />
              </button>
            </div>
            <div className="ml-auto text-right leading-none">
              <AnimatedNumber
                value={lv}
                format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                className={cn("text-[14px] font-semibold", lvOff ? "text-ios-orange" : "text-heading")}
              />
              <span className="text-[11px] text-tertiary"> kV</span>
            </div>
          </div>
        </div>
      </div>
    </Widget>
  );
}
