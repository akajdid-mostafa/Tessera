import {
  CheckmarkCircle16Filled,
  Door16Regular,
  LockClosed16Filled,
  LockOpen16Filled,
  VehicleCar20Filled,
  Warning16Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { CAR } from "./_parts";

type Door = "fl" | "fr" | "rl" | "rr";
type Lid = "frunk" | "trunk";
type Closure = Door | Lid | "port";

const NAME: Record<Closure, string> = {
  fl: "driver door",
  fr: "passenger door",
  rl: "rear left door",
  rr: "rear right door",
  frunk: "front trunk",
  trunk: "trunk",
  port: "charge port",
};

/* Each door is a 3 × len panel on the body's flank, hinged at its front edge. */
const DOORS: { id: Door; x: number; y: number; len: number; side: 1 | -1 }[] = [
  { id: "fl", x: 20.4, y: 72, len: 42, side: 1 },
  { id: "rl", x: 20.2, y: 117, len: 40, side: 1 },
  { id: "fr", x: 96.4, y: 72, len: 42, side: -1 },
  { id: "rr", x: 96.6, y: 117, len: 40, side: -1 },
];

const RECOMMENDED = 2.9;
const TYRES: Record<Door, { label: string; bar: number; temp: number }> = {
  fl: { label: "Front left", bar: 2.9, temp: 24 },
  fr: { label: "Front right", bar: 2.9, temp: 24 },
  rl: { label: "Rear left", bar: 3.0, temp: 25 },
  rr: { label: "Rear right", bar: 2.3, temp: 21 },
};
const isLow = (bar: number) => bar < RECOMMENDED * 0.85;
const LOW = (Object.keys(TYRES) as Door[]).find((k) => isLow(TYRES[k].bar));

const CLOSED: Record<Closure, boolean> = { fl: false, fr: false, rl: false, rr: false, frunk: false, trunk: false, port: false };

/** In-car · large. A top-down car whose doors swing open on tap, with a confirm for the trunks and pressure at every wheel. */
export function VehicleStatusWidget({ index }: { index?: number }) {
  const [open, setOpen] = useState(CLOSED);
  const [locked, setLocked] = useState(true);
  const [confirm, setConfirm] = useState<Lid | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [psi, setPsi] = useState(false);
  const hintTimer = useRef<number | undefined>(undefined);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => () => window.clearTimeout(hintTimer.current), []);

  const set = (k: Closure, v: boolean) => {
    setOpen((o) => ({ ...o, [k]: v }));
    if (v && k !== "port") setLocked(false);
  };
  const toggleLid = (k: Lid) => (open[k] ? set(k, false) : setConfirm(k));
  const openNow = (Object.keys(open) as Closure[]).filter((k) => open[k] && k !== "port");

  const pressLock = () => {
    if (!locked && openNow.length) {
      setHint(`Close the ${NAME[openNow[0]]} first`);
      setShake((n) => n + 1);
      window.clearTimeout(hintTimer.current);
      hintTimer.current = window.setTimeout(() => setHint(null), 2400);
      return;
    }
    setLocked((l) => !l);
  };

  const status = confirm ? "confirm" : hint ? "hint" : openNow.length ? "open" : LOW ? "tyre" : "ok";

  return (
    <Widget size="large" index={index} label="Vehicle status">
      <WidgetHeader
        icon={<VehicleCar20Filled />}
        tint="var(--ios-blue)"
        title="My car"
        subtitle={`Parked · ${locked ? "Locked" : "Unlocked"} · 68%`}
        extra={
          <motion.button
            type="button"
            aria-label={locked ? "Unlock car" : "Lock car"}
            aria-pressed={locked}
            onClick={pressLock}
            key={shake}
            animate={shake ? { x: [0, -4, 4, -3, 3, 0] } : undefined}
            transition={{ duration: 0.4 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "grid size-7 shrink-0 cursor-pointer place-items-center rounded-full text-[15px] outline-none transition-colors duration-300",
              locked ? "bg-fill-tertiary text-heading" : "bg-ios-blue/15 text-ios-blue",
            )}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={String(locked)}
                initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 24 }}
                className="grid"
              >
                {locked ? <LockClosed16Filled /> : <LockOpen16Filled />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        }
      />

      <div className="mt-2 grid min-h-0 flex-1 grid-cols-[1fr_124px_1fr] gap-2">
        <div className="flex flex-col justify-around">
          {(["fl", "rl"] as const).map((k, i) => (
            <TyreTile key={k} id={k} psi={psi} delay={delay + i * 0.08} onPress={() => setPsi((p) => !p)} />
          ))}
        </div>

        <div className="flex min-h-0 flex-col items-center gap-1">
          <LidPill label="Front trunk" open={open.frunk} onPress={() => toggleLid("frunk")} />
          <motion.svg
            viewBox={`0 0 ${CAR.w} ${CAR.h}`}
            className="min-h-0 w-full flex-1 overflow-visible"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: "spring", stiffness: 200, damping: 24 }}
            role="group"
            aria-label="Car closures"
          >
            {(Object.keys(CAR.wheels) as Door[]).map((k) => {
              const [x, y] = CAR.wheels[k];
              const low = isLow(TYRES[k].bar);
              return (
                <motion.rect
                  key={k}
                  x={x}
                  y={y}
                  width="9"
                  height="30"
                  rx="3"
                  className={low ? "fill-ios-orange" : "fill-[var(--ant-color-text-tertiary)]"}
                  animate={low ? { opacity: [1, 0.35, 1] } : undefined}
                  transition={low ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : undefined}
                />
              );
            })}
            <ellipse cx="18.5" cy="75" rx="4.5" ry="2.6" className="fill-[var(--ant-color-text-quaternary)]" />
            <ellipse cx="101.5" cy="75" rx="4.5" ry="2.6" className="fill-[var(--ant-color-text-quaternary)]" />
            <path d={CAR.body} fill="var(--widget-surface)" />
            <path d={CAR.body} className="fill-fill-secondary stroke-[var(--ant-color-text-quaternary)]" strokeWidth="1.2" />

            {/* Lids: a cavity under an opaque lid that folds toward its hinge. */}
            <LidShape d={CAR.frunk} open={open.frunk} originY={1} onPress={() => toggleLid("frunk")} label="Front trunk" />
            <path d={CAR.windshield} className="fill-fill" />
            <path d={CAR.roof} className="fill-fill-secondary" />
            <path d={CAR.rear} className="fill-fill" />
            <LidShape d={CAR.trunk} open={open.trunk} originY={0} onPress={() => toggleLid("trunk")} label="Trunk" />

            {DOORS.map((d) => (
              <g
                key={d.id}
                role="button"
                tabIndex={0}
                aria-label={`${open[d.id] ? "Close" : "Open"} ${NAME[d.id]}`}
                aria-pressed={open[d.id]}
                onClick={() => set(d.id, !open[d.id])}
                onKeyDown={onKey(() => set(d.id, !open[d.id]))}
                className="cursor-pointer outline-none"
              >
                <rect x={d.side === 1 ? d.x - 12 : d.x - 6} y={d.y} width="21" height={d.len} fill="transparent" />
                <motion.rect
                  x={d.x}
                  y={d.y}
                  width="3.2"
                  height={d.len}
                  rx="1.6"
                  style={{ originX: 0.5, originY: 0 }}
                  className={open[d.id] ? "fill-ios-blue" : "fill-[var(--ant-color-text-quaternary)]"}
                  initial={false}
                  animate={{ rotate: open[d.id] ? d.side * 38 : 0 }}
                  transition={{ type: "spring", stiffness: 170, damping: 15 }}
                />
              </g>
            ))}

            <g
              role="button"
              tabIndex={0}
              aria-label={`${open.port ? "Close" : "Open"} charge port`}
              aria-pressed={open.port}
              onClick={() => set("port", !open.port)}
              onKeyDown={onKey(() => set("port", !open.port))}
              className="cursor-pointer outline-none"
            >
              <circle cx="24" cy="176" r="10" fill="transparent" />
              <AnimatePresence>
                {open.port ? (
                  <motion.circle
                    cx="24"
                    cy="176"
                    r="4"
                    fill="var(--ios-green)"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [1, 1.5, 1], opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ scale: { duration: 1.6, repeat: Infinity }, opacity: { duration: 0.2 } }}
                    style={{ filter: "drop-shadow(0 0 3px var(--ios-green))" }}
                  />
                ) : null}
              </AnimatePresence>
              <motion.rect
                x="21.6"
                y="171"
                width="3"
                height="10"
                rx="1.2"
                style={{ originX: 0.5, originY: 0 }}
                className={open.port ? "fill-ios-green" : "fill-[var(--ant-color-text-tertiary)]"}
                initial={false}
                animate={{ rotate: open.port ? 75 : 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
              />
            </g>
          </motion.svg>
          <LidPill label="Trunk" open={open.trunk} onPress={() => toggleLid("trunk")} />
        </div>

        <div className="flex flex-col justify-around">
          {(["fr", "rr"] as const).map((k, i) => (
            <TyreTile key={k} id={k} psi={psi} delay={delay + 0.04 + i * 0.08} onPress={() => setPsi((p) => !p)} />
          ))}
        </div>
      </div>

      <div className="mt-2 flex h-8 shrink-0 items-center overflow-hidden rounded-xl bg-fill-quaternary pr-1 pl-2.5">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={status + (hint ?? "") + openNow.join()}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="flex min-w-0 flex-1 items-center gap-1.5 whitespace-nowrap text-[12px]"
          >
            {status === "confirm" && confirm ? (
              <>
                <span className="min-w-0 flex-1 truncate font-semibold text-heading">Open {NAME[confirm]}?</span>
                <Button size="small" variant="filled" color="default" onClick={() => setConfirm(null)}>
                  Cancel
                </Button>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => {
                    set(confirm, true);
                    setConfirm(null);
                  }}
                >
                  Open
                </Button>
              </>
            ) : status === "hint" ? (
              <>
                <Warning16Filled className="shrink-0 text-ios-orange" />
                <span className="truncate font-medium text-ios-orange">{hint}</span>
              </>
            ) : status === "open" ? (
              <>
                <Door16Regular className="shrink-0 text-ios-blue" />
                <span className="truncate text-heading">
                  <span className="font-semibold tabular">{openNow.length} open</span>
                  <span className="text-secondary"> · {openNow.map((k) => NAME[k]).join(", ")}</span>
                </span>
              </>
            ) : status === "tyre" && LOW ? (
              <>
                <Warning16Filled className="shrink-0 text-ios-orange" />
                <span className="truncate">
                  <span className="font-semibold text-ios-orange">{TYRES[LOW].label} tyre low</span>
                  <span className="text-secondary tabular">
                    {" "}
                    · {TYRES[LOW].bar.toFixed(1)} bar, {Math.round((1 - TYRES[LOW].bar / RECOMMENDED) * 100)}% under
                  </span>
                </span>
              </>
            ) : (
              <>
                <CheckmarkCircle16Filled className="shrink-0 text-ios-green" />
                <span className="truncate text-secondary">All closed · {locked ? "Locked" : "Unlocked"}</span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Widget>
  );
}

const onKey = (fn: () => void) => (e: KeyboardEvent) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fn();
  }
};

/** A trunk lid: the dark cavity shows as the opaque lid folds toward its hinge. */
function LidShape({ d, open, originY, onPress, label }: { d: string; open: boolean; originY: 0 | 1; onPress: () => void; label: string }) {
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${open ? "Close" : "Open"} ${label.toLowerCase()}`}
      onClick={onPress}
      onKeyDown={onKey(onPress)}
      className="cursor-pointer outline-none"
    >
      <path d={d} className="fill-fill" />
      <motion.g style={{ originX: 0.5, originY }} initial={false} animate={{ scaleY: open ? 0.38 : 1 }} transition={{ type: "spring", stiffness: 180, damping: 18 }}>
        <path d={d} fill="var(--widget-surface)" />
        <path
          d={d}
          className={cn(open ? "fill-ios-blue/25 stroke-ios-blue" : "fill-fill-secondary stroke-[var(--ant-color-text-quaternary)]")}
          strokeWidth="1"
        />
      </motion.g>
    </g>
  );
}

function LidPill({ label, open, onPress }: { label: string; open: boolean; onPress: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onPress}
      whileTap={{ scale: 0.94 }}
      aria-pressed={open}
      className={cn(
        "h-[22px] shrink-0 cursor-pointer whitespace-nowrap rounded-full px-2.5 text-[11px] font-medium outline-none transition-colors duration-300",
        open ? "bg-ios-blue/15 text-ios-blue" : "bg-fill-tertiary text-secondary hover:bg-fill-secondary",
      )}
    >
      {label} · <span className={open ? "" : "text-ios-blue"}>{open ? "Close" : "Open"}</span>
    </motion.button>
  );
}

function TyreTile({ id, psi, delay, onPress }: { id: Door; psi: boolean; delay: number; onPress: () => void }) {
  const t = TYRES[id];
  const low = isLow(t.bar);
  // The bar spans 2.0–3.4 bar with a tick at the recommended pressure.
  const pos = (v: number) => (v - 2) / 1.4;
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={`${t.label} tyre, tap to switch units`}
      className={cn(
        "w-full cursor-pointer rounded-2xl p-2.5 text-left outline-none transition-colors",
        low ? "bg-ios-orange/10 ring-1 ring-ios-orange/40 ring-inset" : "bg-fill-quaternary hover:bg-fill-tertiary",
      )}
    >
      <div className="flex items-center justify-between text-[11px] leading-none">
        <span className={cn("truncate", low ? "font-semibold text-ios-orange" : "text-tertiary")}>{t.label}</span>
        {low ? (
          <span className="shrink-0 font-bold tracking-wide text-ios-orange">LOW</span>
        ) : (
          <span className="shrink-0 text-tertiary tabular">{t.temp}°C</span>
        )}
      </div>
      <div className={cn("mt-1 flex items-baseline gap-1", low ? "text-ios-orange" : "text-heading")}>
        <AnimatedNumber
          value={psi ? Math.round(t.bar * 14.5) : t.bar}
          format={psi ? undefined : { minimumFractionDigits: 1, maximumFractionDigits: 1 }}
          className="text-[22px] leading-none font-semibold tracking-tight"
        />
        <span className="text-[11px] font-medium text-tertiary">{psi ? "psi" : "bar"}</span>
      </div>
      <div className="relative mt-1.5 h-1 rounded-full bg-fill-secondary">
        <motion.div
          className={cn("absolute inset-y-0 left-0 origin-left rounded-full", low ? "bg-ios-orange" : "bg-[var(--ant-color-text-secondary)]")}
          style={{ width: `${pos(t.bar) * 100}%` }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay, type: "spring", stiffness: 120, damping: 18 }}
        />
        <span className="absolute -top-0.5 h-2 w-px bg-[var(--ant-color-text-tertiary)]" style={{ left: `${pos(RECOMMENDED) * 100}%` }} />
      </div>
    </button>
  );
}
