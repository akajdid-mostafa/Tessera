import { Temperature20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { enterDelay, useInterval } from "./_parts";

/* A hot axle-box detector reads both bearings of every axle as the train passes.
 * Alarms are set against ambient: warm at Δ50 K, hot at Δ70 K. */
const AMBIENT = 14;
const WARM = AMBIENT + 50;
const HOT = AMBIENT + 70;
const T_MAX = 110;
const LOCO = 6;
const WAGONS = 8;
const PER_WAGON = 4;
const AXLES = LOCO + WAGONS * PER_WAGON;
const SCAN_MS = 5200;
const TICK = 100;

type Train = { id: string; kind: string; kmh: number; l: number[]; r: number[] };
const noise = (i: number, k: number) => ((i * 53 + k * 17) % 13) - 6;
const base = (k: number) => Array.from({ length: AXLES }, (_, i) => 30 + noise(i, k) + (i < LOCO ? 4 : 0));
const withHot = (xs: number[], at: number, v: number) => xs.map((x, i) => (i === at ? v : x));

const TRAINS: Train[] = [
  { id: "6M42", kind: "Aggregates", kmh: 62, l: withHot(base(1), 10, 67), r: withHot(base(2), 22, 96) },
  { id: "4L19", kind: "Intermodal", kmh: 74, l: base(3), r: base(4) },
];
type Phase = "scan" | "result" | "acked";

/** Rail · medium. A hot axle-box detector as a train passes: bearing temperatures appear axle by axle under a scan line, a hot one flashes until acknowledged; hover any axle to read both sides. */
export function HotAxleWidget({ index }: { index?: number }) {
  const [ti, setTi] = useState(0);
  const [scan, setScan] = useState(0);
  const [phase, setPhase] = useState<Phase>("scan");
  const [hold, setHold] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const delay = enterDelay(index);

  const train = TRAINS[ti];
  const temps = train.l.map((l, i) => Math.max(l, train.r[i]));
  const hotAt = temps.findIndex((t) => t >= HOT);
  const alarm = hotAt >= 0;

  useInterval(() => {
    if (phase === "scan") {
      const next = Math.min(1, scan + TICK / SCAN_MS);
      setScan(next);
      if (next >= 1) {
        setPhase("result");
        setHold(0);
      }
      return;
    }
    // A clear train moves on by itself; an alarm waits for the signaller.
    if (phase === "result" && alarm) return;
    if (hold * TICK >= 5000) {
      setTi((x) => (x + 1) % TRAINS.length);
      setScan(0);
      setPhase("scan");
      setHover(null);
    } else setHold((h) => h + 1);
  }, TICK);

  const seen = Math.floor(scan * AXLES + 0.0001);
  const shown = hover !== null && hover < seen ? hover : null;
  const tone = (t: number) => (t >= HOT ? "hot" : t >= WARM ? "warm" : "ok");
  const flashing = phase === "result" && alarm;
  const side = alarm && train.r[hotAt] >= train.l[hotAt] ? "R" : "L";

  let info: string;
  if (shown !== null) info = `Axle ${shown + 1} · L ${train.l[shown]} °C · R ${train.r[shown]} °C`;
  else if (phase === "scan") info = `${train.id} · ${train.kind} · ${train.kmh} km/h · axle ${Math.max(1, seen)}/${AXLES}`;
  else if (alarm && phase === "result") info = `Axle ${hotAt + 1} ${side} · ${temps[hotAt]} °C · Δ${temps[hotAt] - AMBIENT} K`;
  else if (alarm) info = `${train.id} stopped at Ashby Loop for exam`;
  else info = `${train.id} · ${AXLES} axles · max ${Math.max(...temps)} °C · clear`;

  return (
    <Widget size="medium" index={index} label="Hot axle box detector">
      <WidgetHeader
        icon={<Temperature20Filled />}
        tint={alarm && phase !== "scan" ? "var(--ios-red)" : "var(--ios-indigo)"}
        title="Hot Axle Detector"
        subtitle={`Lodge Hill · Up Main · ${AMBIENT} °C`}
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={phase === "scan" ? "scan" : alarm ? phase : "clear"}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: flashing ? [1, 0.35, 1] : 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={flashing ? { opacity: { repeat: Infinity, duration: 0.9 } } : { duration: 0.2 }}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
                phase === "scan"
                  ? "bg-fill-tertiary text-secondary"
                  : alarm
                    ? "bg-ios-red text-white"
                    : "bg-ios-green/15 text-ios-green",
              )}
            >
              {phase === "scan" ? (
                <>
                  <span className="size-1.5 animate-pulse rounded-full bg-ios-blue" /> Scanning
                </>
              ) : alarm ? (
                phase === "acked" ? "HOT · acked" : "HOT AXLE"
              ) : (
                "Clear"
              )}
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="relative mt-2.5 h-[50px]" onPointerLeave={() => setHover(null)}>
        <div className="absolute inset-0 grid items-end gap-[2px]" style={{ gridTemplateColumns: `repeat(${AXLES}, minmax(0, 1fr))` }}>
          {temps.map((t, i) => {
            const tn = tone(t);
            const on = i < seen;
            return (
              <button
                key={`${train.id}-${i}`}
                type="button"
                aria-label={`Axle ${i + 1}`}
                onPointerEnter={() => setHover(i)}
                className="relative h-full cursor-crosshair outline-none"
              >
                <motion.span
                  className={cn(
                    "absolute inset-x-0 bottom-0 rounded-[2px]",
                    tn === "hot" ? "bg-ios-red" : tn === "warm" ? "bg-ios-orange" : hover === i ? "bg-secondary" : "bg-fill",
                  )}
                  initial={{ height: "0%" }}
                  animate={{
                    height: on ? `${(t / T_MAX) * 100}%` : "0%",
                    opacity: tn === "hot" && flashing ? [1, 0.3, 1] : 1,
                  }}
                  transition={{
                    height: { type: "spring", stiffness: 260, damping: 22, delay: ti === 0 && scan < 0.05 ? delay : 0 },
                    opacity: tn === "hot" && flashing ? { repeat: Infinity, duration: 0.9 } : { duration: 0.2 },
                  }}
                />
              </button>
            );
          })}
        </div>
        <span className="pointer-events-none absolute inset-x-0 border-t border-dashed border-ios-red/70" style={{ bottom: `${(HOT / T_MAX) * 100}%` }} />
        <span
          className="pointer-events-none absolute right-0 text-[9px] leading-none font-medium text-ios-red"
          style={{ bottom: `calc(${(HOT / T_MAX) * 100}% + 3px)` }}
        >
          Hot Δ70 K
        </span>
        {phase === "scan" ? (
          <span
            className="pointer-events-none absolute -bottom-[26px] top-0 w-[2px] rounded-full bg-ios-blue shadow-[0_0_8px_var(--ios-blue)]"
            style={{ left: `${scan * 100}%` }}
          />
        ) : null}
      </div>

      {/* the train, axle for axle under its bars */}
      <motion.div
        key={train.id}
        className="mt-1 grid gap-[2px]"
        style={{ gridTemplateColumns: `repeat(${AXLES}, minmax(0, 1fr))` }}
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 24, delay: ti === 0 && scan < 0.05 ? delay : 0 }}
      >
        <span className="h-[11px] rounded-l-[6px] rounded-r-[2px] bg-fill-secondary" style={{ gridColumn: `1 / span ${LOCO}` }} />
        {Array.from({ length: WAGONS }, (_, w) => (
          <span
            key={w}
            className={cn(
              "h-[11px] rounded-[2px]",
              alarm && Math.floor((hotAt - LOCO) / PER_WAGON) === w && phase !== "scan" ? "bg-ios-red/25" : "bg-fill-tertiary",
            )}
            style={{ gridColumn: `${LOCO + w * PER_WAGON + 1} / span ${PER_WAGON}` }}
          />
        ))}
        {temps.map((_, i) => (
          <span key={i} className="mx-auto mt-[1px] size-[5px] rounded-full bg-[var(--ant-color-text-tertiary)]" style={{ gridRow: 2, gridColumn: i + 1 }} />
        ))}
      </motion.div>

      <div className="mt-auto flex h-7 items-center gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={info}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "min-w-0 flex-1 truncate text-[11px] tabular",
              shown === null && alarm && phase === "result" ? "font-semibold text-ios-red" : "text-tertiary",
            )}
          >
            {info}
          </motion.span>
        </AnimatePresence>
        {flashing ? (
          <Button size="small" type="primary" danger onClick={() => { setPhase("acked"); setHold(0); }}>
            Acknowledge
          </Button>
        ) : null}
      </div>
    </Widget>
  );
}
