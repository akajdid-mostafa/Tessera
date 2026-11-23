import { Dismiss16Regular, LightbulbFilament20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

const LAMPS = 1284;
const WATTS = 68;
const SCHEDULE = 50;
const MIN = 30;
const CONFIRM_MS = 5000;

/** Smart city · small. Drag the brightness pill to stage a district dimming override, then confirm it; the glow and load follow. */
export function StreetLightsWidget({ index }: { index?: number }) {
  const [applied, setApplied] = useState(SCHEDULE);
  const [draft, setDraft] = useState(SCHEDULE);
  const [confirming, setConfirming] = useState(false);
  const [justApplied, setJustApplied] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    if (!confirming) return;
    const t = window.setTimeout(() => setConfirming(false), CONFIRM_MS);
    return () => window.clearTimeout(t);
  }, [confirming]);

  useEffect(() => {
    if (!justApplied) return;
    const t = window.setTimeout(() => setJustApplied(false), 2400);
    return () => window.clearTimeout(t);
  }, [justApplied]);

  const levelAt = (clientY: number) => {
    const r = track.current!.getBoundingClientRect();
    const t = 1 - (clientY - r.top) / r.height;
    return Math.min(100, Math.max(MIN, Math.round((t * 100) / 10) * 10));
  };

  const override = applied !== SCHEDULE;
  const pending = draft !== applied;
  const kw = (LAMPS * WATTS * draft) / 100 / 1000;

  return (
    <Widget
      size="small"
      index={index}
      label="Street light dimming"
      glow={{ mode: "pulse", colors: ["#FFD60A", "#FF9F0A", "#FFD60A"], blur: 18, duration: 1.2 }}
      glowActive={justApplied}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-[radial-gradient(circle,var(--ios-yellow),transparent_65%)]"
        animate={{ opacity: 0.06 + (draft / 100) * 0.34, scale: 0.7 + (draft / 100) * 0.5 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      />
      <WidgetHeader icon={<LightbulbFilament20Filled />} tint="var(--ios-orange)" title="Ballard Lights" subtitle={`${LAMPS.toLocaleString()} lamps`} />

      <div className="relative mt-2 flex h-[84px] gap-3">
        <div
          ref={track}
          role="slider"
          aria-label="Dim level"
          aria-valuemin={MIN}
          aria-valuemax={100}
          aria-valuenow={draft}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") setDraft((d) => Math.min(100, d + 10));
            if (e.key === "ArrowDown") setDraft((d) => Math.max(MIN, d - 10));
          }}
          onPointerDown={(e) => {
            if (confirming) return;
            dragging.current = true;
            try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
            setDraft(levelAt(e.clientY));
          }}
          onPointerMove={(e) => {
            if (dragging.current) setDraft(levelAt(e.clientY));
          }}
          onPointerUp={() => {
            dragging.current = false;
          }}
          className={cn(
            "relative w-[30px] shrink-0 touch-none overflow-hidden rounded-[11px] bg-fill-secondary outline-none",
            confirming ? "cursor-not-allowed" : "cursor-ns-resize",
          )}
        >
          <motion.div
            className="absolute inset-x-0 bottom-0 bg-ios-yellow"
            initial={{ height: "0%" }}
            animate={{ height: `${draft}%` }}
            transition={{ type: "spring", stiffness: 260, damping: 28, delay: draft === SCHEDULE && !override ? delay : 0 }}
          />
          {applied !== draft ? (
            <span
              className="absolute inset-x-1 h-[2px] rounded-full bg-[var(--ant-color-text-heading)] opacity-50"
              style={{ bottom: `calc(${applied}% - 1px)` }}
            />
          ) : null}
          <LightbulbFilament20Filled className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[15px] text-black/55" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between whitespace-nowrap">
          <div className="text-[28px] leading-none font-semibold tracking-tight text-heading">
            <AnimatedNumber value={draft} />
            <span className="ml-0.5 text-[13px] font-medium text-tertiary">%</span>
          </div>
          <div className="text-[11px] text-tertiary tabular">
            <AnimatedNumber value={kw} format={{ maximumFractionDigits: 1 }} className="font-semibold text-secondary" /> kW load
          </div>
          <div className={cn("truncate text-[11px] font-medium", override ? "text-ios-orange" : "text-tertiary")}>
            {override ? "Override · till 02:00" : "Schedule · 50% late"}
          </div>
        </div>
      </div>

      <div className="mt-auto flex gap-1.5">
        {confirming ? (
          <>
            <Button size="small" shape="circle" variant="filled" color="default" icon={<Dismiss16Regular />} aria-label="Cancel" onClick={() => setConfirming(false)} />
            <Button
              size="small"
              block
              color="orange"
              variant="solid"
              className="relative overflow-hidden"
              onClick={() => {
                setApplied(draft);
                setConfirming(false);
                setJustApplied(true);
              }}
            >
              Confirm {draft}%
              <motion.span
                className="absolute bottom-0 left-0 h-[2px] bg-white/70"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: CONFIRM_MS / 1000, ease: "linear" }}
              />
            </Button>
          </>
        ) : pending ? (
          <Button size="small" block type="primary" onClick={() => setConfirming(true)}>
            Set {draft}% for 2 h
          </Button>
        ) : override ? (
          <Button
            size="small"
            block
            variant="filled"
            color="default"
            onClick={() => {
              setApplied(SCHEDULE);
              setDraft(SCHEDULE);
            }}
          >
            Revert to schedule
          </Button>
        ) : (
          <div className="flex h-6 w-full items-center justify-center rounded-md bg-fill-quaternary text-[11px] text-tertiary">
            Drag to override
          </div>
        )}
      </div>
    </Widget>
  );
}
