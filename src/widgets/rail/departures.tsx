import { VehicleSubway20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Widget } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { enterDelay, hhmm, useInterval } from "./_parts";

/* The board is its own fixed dark surface (a station display), so its ink is fixed
 * too: white, an amber LED tone and a signal red, in both themes. */
const AMBER = "#ffb84d";
const RED = "#ff6b61";
const INK = "rgba(255,255,255,0.92)";
const DIM = "rgba(255,255,255,0.55)";

type Dep = { id: string; time: number; dest: string; plat: string; exp: number | "cancelled"; coaches: number; calling: string[]; reason?: string };

const t = (h: number, m: number) => h * 60 + m;
const START = t(7, 52);
const LOOP_AT = t(8, 18);
const TICK_MS = 4000;

const SEED: Dep[] = [
  { id: "a", time: t(7, 54), dest: "Brighton", plat: "4", exp: t(7, 54), coaches: 12, calling: ["Gatwick Airport", "Haywards Heath", "Burgess Hill", "Hassocks", "Preston Park", "Brighton"] },
  { id: "b", time: t(7, 57), dest: "London Bridge", plat: "2", exp: t(7, 57), coaches: 12, calling: ["Norwood Junction", "London Bridge"] },
  { id: "c", time: t(7, 58), dest: "London Victoria", plat: "1", exp: t(8, 3), coaches: 8, calling: ["Clapham Junction", "London Victoria"] },
  { id: "d", time: t(8, 1), dest: "Gatwick Airport", plat: "3", exp: "cancelled", coaches: 4, reason: "a train fault", calling: ["Purley", "Coulsdon South", "Merstham", "Redhill", "Gatwick Airport"] },
  { id: "e", time: t(8, 5), dest: "Brighton", plat: "4", exp: t(8, 5), coaches: 8, calling: ["Redhill", "Gatwick Airport", "Three Bridges", "Haywards Heath", "Burgess Hill", "Hassocks", "Brighton"] },
  { id: "f", time: t(8, 9), dest: "Bedford", plat: "2", exp: t(8, 9), coaches: 12, calling: ["London Bridge", "London Blackfriars", "Farringdon", "St Pancras International", "Luton Airport Parkway", "Bedford"] },
  { id: "g", time: t(8, 11), dest: "London Bridge", plat: "2", exp: t(8, 11), coaches: 12, calling: ["London Bridge"] },
  { id: "h", time: t(8, 14), dest: "Littlehampton", plat: "3", exp: t(8, 16), coaches: 8, calling: ["Gatwick Airport", "Horsham", "Pulborough", "Arundel", "Littlehampton"] },
  { id: "i", time: t(8, 17), dest: "London Victoria", plat: "1", exp: t(8, 17), coaches: 10, calling: ["Clapham Junction", "London Victoria"] },
  { id: "j", time: t(8, 22), dest: "Three Bridges", plat: "4", exp: t(8, 22), coaches: 8, calling: ["Purley", "Redhill", "Earlswood", "Horley", "Gatwick Airport", "Three Bridges"] },
];

/** Scripted control-room updates: a slip, a platform alteration. */
const EVENTS: Record<number, (d: Dep[]) => Dep[]> = {
  [t(7, 55)]: (d) => d.map((x) => (x.id === "c" ? { ...x, exp: t(8, 4) } : x)),
  [t(7, 57)]: (d) => d.map((x) => (x.id === "f" ? { ...x, plat: "1" } : x)),
  [t(8, 3)]: (d) => d.map((x) => (x.id === "h" ? { ...x, exp: t(8, 18) } : x)),
};

/** One split-flap character: it flips over when its value changes. */
function Flap({ ch, tile, delay, color }: { ch: string; tile?: boolean; delay: number; color: string }) {
  const reduce = useReducedMotion();
  return (
    <span
      className={cn(
        "relative inline-grid place-items-center overflow-hidden",
        tile ? "h-[18px] w-[11px] rounded-[2px]" : "h-[18px] min-w-[3px]",
      )}
      style={tile ? { background: "rgba(255,255,255,0.08)" } : undefined}
    >
      <AnimatePresence mode="popLayout" initial={!reduce}>
        <motion.span
          key={ch}
          className="col-start-1 row-start-1 block"
          style={{ color, transformPerspective: 160 }}
          initial={{ rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: 90, opacity: 0 }}
          transition={{ duration: 0.28, delay, ease: "easeOut" }}
        >
          {ch === " " ? " " : ch}
        </motion.span>
      </AnimatePresence>
      {tile ? <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px" style={{ background: "rgba(0,0,0,0.45)" }} /> : null}
    </span>
  );
}

function FlapText({ text, tile, delay, color, step = 0.025 }: { text: string; tile?: boolean; delay: number; color: string; step?: number }) {
  return (
    <span className={cn("inline-flex", tile && "gap-px")}>
      {[...text].map((ch, i) => (
        <Flap key={i} ch={ch} tile={tile} color={color} delay={delay + i * step} />
      ))}
    </span>
  );
}

/** Rail · medium. A split-flap departure board whose characters flip as expected times slip, platforms change and trains leave; tap a row to scroll its calling points along the bottom. */
export function DeparturesWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [now, setNow] = useState(START);
  const [deps, setDeps] = useState(SEED);
  const [sel, setSel] = useState("a");
  const [entered, setEntered] = useState(false);
  const delay = enterDelay(index);

  useEffect(() => {
    const tm = window.setTimeout(() => setEntered(true), (delay + 1.4) * 1000);
    return () => window.clearTimeout(tm);
  }, [delay]);

  useInterval(() => {
    const n = now + 1;
    if (n > LOOP_AT) {
      setNow(START);
      setDeps(SEED);
      setSel("a");
      return;
    }
    setNow(n);
    setDeps((d) => (EVENTS[n] ? EVENTS[n](d) : d));
  }, TICK_MS);

  const board = deps.filter((d) => (d.exp === "cancelled" ? d.time >= now : d.exp >= now)).slice(0, 4);
  const pick = board.find((d) => d.id === sel) ?? board[0];

  return (
    <Widget
      size="medium"
      index={index}
      label="Departure board"
      surfaceClassName="bg-[linear-gradient(180deg,#1c1e24_0%,#0d0e11_100%)] ring-white/10"
    >
      <div className="flex h-[26px] items-center gap-2">
        <span className="grid size-[26px] shrink-0 place-items-center rounded-full text-[15px] text-black" style={{ background: AMBER }}>
          <VehicleSubway20Filled />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[13px] font-semibold" style={{ color: INK }}>
            East Croydon
          </div>
          <div className="truncate text-[11px]" style={{ color: DIM }}>
            Departures · platforms 1–6
          </div>
        </div>
        <span className="text-[12px] font-semibold tabular">
          <FlapText text={hhmm(now)} tile color={AMBER} delay={entered ? 0 : delay} />
        </span>
      </div>

      <div className="mt-2 flex flex-col gap-[3px]">
        <AnimatePresence mode="popLayout" initial={false}>
          {board.map((d, i) => {
            const late = d.exp !== "cancelled" && d.exp > d.time;
            const status = d.exp === "cancelled" ? "Cancelled" : late ? `Exp ${hhmm(d.exp)}` : "On time";
            const statusColor = d.exp === "cancelled" ? RED : late ? AMBER : DIM;
            const rowDelay = entered ? 0 : delay + 0.1 + i * 0.12;
            const active = pick?.id === d.id;
            return (
              <motion.button
                key={d.id}
                type="button"
                layout
                onClick={() => setSel(d.id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.25 } }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="relative flex h-[23px] cursor-pointer items-center gap-2 rounded-md px-1.5 text-left text-[12px] font-semibold outline-none"
                style={{ background: active ? "rgba(255,255,255,0.07)" : "transparent" }}
              >
                {active ? <span className="absolute inset-y-1 left-0 w-[2px] rounded-full" style={{ background: AMBER }} /> : null}
                <span className="tabular">
                  <FlapText text={hhmm(d.time)} tile color={AMBER} delay={rowDelay} />
                </span>
                <span className="min-w-0 flex-1 truncate">
                  <FlapText text={d.dest} color={d.exp === "cancelled" ? DIM : INK} delay={rowDelay + 0.1} step={0.018} />
                </span>
                <span className="shrink-0 text-[10px]" style={{ color: DIM }}>
                  Plat
                </span>
                <span className="relative shrink-0">
                  <FlapText text={d.plat} tile color={d.id === "f" && d.plat !== "2" ? AMBER : INK} delay={rowDelay + 0.2} />
                  {d.id === "f" && d.plat !== "2" && !reduce ? (
                    <motion.span
                      className="pointer-events-none absolute -inset-0.5 rounded-[3px] border"
                      style={{ borderColor: AMBER }}
                      animate={{ opacity: [1, 0.2, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  ) : null}
                </span>
                <span className="w-[74px] shrink-0 text-right">
                  <FlapText text={status} color={statusColor} delay={rowDelay + 0.25} step={0.02} />
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Calling points ticker for the selected row */}
      <div className="mt-auto flex h-[18px] items-center gap-2 overflow-hidden text-[11px]">
        <span className="shrink-0 font-semibold" style={{ color: AMBER }}>
          {pick ? hhmm(pick.time) : ""}
        </span>
        <div className="relative min-w-0 flex-1 overflow-hidden whitespace-nowrap" style={{ maskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)" }}>
          {pick ? (
            <motion.div
              key={`${pick.id}-${String(pick.exp)}`}
              className="inline-flex"
              style={{ color: DIM }}
              initial={{ x: "0%" }}
              animate={reduce ? { x: "0%" } : { x: ["0%", "-50%"] }}
              transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            >
              {[0, 1].map((k) => (
                <span key={k} className="pr-10">
                  {pick.exp === "cancelled"
                    ? `This service has been cancelled due to ${pick.reason}. Passengers for ${pick.calling.slice(0, -1).join(", ")} use the 08:05 to Brighton.`
                    : `Calling at ${pick.calling.slice(0, -1).join(", ")}${pick.calling.length > 1 ? " and " : ""}${pick.calling[pick.calling.length - 1]} · ${pick.coaches} coaches`}
                </span>
              ))}
            </motion.div>
          ) : null}
        </div>
      </div>
    </Widget>
  );
}
