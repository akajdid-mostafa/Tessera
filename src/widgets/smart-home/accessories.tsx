import {
  LightbulbFilament20Filled,
  Lightbulb20Filled,
  LockClosed20Filled,
  LockOpen20Filled,
  PlugDisconnected20Filled,
  Tv20Filled,
  Speaker220Filled,
  Temperature16Regular,
} from "@fluentui/react-icons";
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@/registry/antuikit/lib/utils";
import { Widget } from "@/motion/widget";
import { BlindsGlyph, FanGlyph } from "./_glyphs";

type Kind = "light" | "blinds" | "tv" | "fan" | "speaker" | "lock" | "plug";
type LockPhase = "locked" | "confirm" | "unlocking" | "unlocked" | "locking";
type Tile = { id: string; name: string; kind: Kind; on: boolean; level?: number };

const TILES: Tile[] = [
  { id: "pendant", name: "Pendant", kind: "light", on: true, level: 80 },
  { id: "lamp", name: "Floor Lamp", kind: "light", on: true, level: 35 },
  { id: "blinds", name: "Blinds", kind: "blinds", on: true, level: 60 },
  { id: "tv", name: "Apple TV", kind: "tv", on: false },
  { id: "purifier", name: "Purifier", kind: "fan", on: true },
  { id: "homepod", name: "HomePod", kind: "speaker", on: true },
  { id: "door", name: "Front Door", kind: "lock", on: true },
  { id: "plug", name: "Patio Plug", kind: "plug", on: false },
];

/** Icon disc color per kind, with the glyph ink that reads on it. */
const DISC: Record<Kind, { bg: string; ink: string }> = {
  light: { bg: "var(--ios-yellow)", ink: "text-black" },
  blinds: { bg: "var(--ios-teal)", ink: "text-white" },
  tv: { bg: "var(--ios-blue)", ink: "text-white" },
  fan: { bg: "var(--ios-mint)", ink: "text-black" },
  speaker: { bg: "var(--ios-pink)", ink: "text-white" },
  lock: { bg: "var(--ios-blue)", ink: "text-white" },
  plug: { bg: "var(--ios-red)", ink: "text-white" },
};

/** Smart home · medium. Apple Home accessory tiles: tap to switch lights, blinds, TV, purifier and HomePod with a bright on state, the front door needs a second tap to unlock, and an offline plug shakes. */
export function AccessoriesWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [on, setOn] = useState<Record<string, boolean>>(() => Object.fromEntries(TILES.map((t) => [t.id, t.on])));
  const [lock, setLock] = useState<LockPhase>("locked");
  const count = TILES.filter((t) => t.kind !== "lock" && t.kind !== "plug" && on[t.id]).length;

  useEffect(() => {
    if (lock === "locked" || lock === "unlocked") return;
    const next: Record<string, LockPhase> = { confirm: "locked", unlocking: "unlocked", locking: "locked" };
    const t = window.setTimeout(() => setLock(next[lock]), lock === "confirm" ? 3000 : 1100);
    return () => window.clearTimeout(t);
  }, [lock]);

  return (
    <Widget size="medium" index={index} label="Home accessories">
      <div className="flex h-[18px] items-center gap-2 whitespace-nowrap">
        <span className="text-[13px] font-semibold text-heading">Living Room</span>
        <span className="text-[11px] text-tertiary tabular">{count} on</span>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-tertiary tabular">
          <Temperature16Regular className="text-[12px]" />
          21.5° · 44%
        </span>
      </div>

      <div className="mt-1.5 grid min-h-0 flex-1 grid-cols-4 grid-rows-2 gap-1.5">
        {TILES.map((t, i) => (
          <AccessoryTile
            key={t.id}
            tile={t}
            on={on[t.id]}
            lock={lock}
            delay={delay + i * 0.04}
            onTap={() => {
              if (t.kind === "lock") {
                setLock((l) => (l === "locked" ? "confirm" : l === "confirm" ? "unlocking" : l === "unlocked" ? "locking" : l));
              } else if (t.kind !== "plug") {
                setOn((p) => ({ ...p, [t.id]: !p[t.id] }));
              }
            }}
          />
        ))}
      </div>
    </Widget>
  );
}

function AccessoryTile({
  tile,
  on: rawOn,
  lock,
  delay,
  onTap,
}: {
  tile: Tile;
  on: boolean;
  lock: LockPhase;
  delay: number;
  onTap: () => void;
}) {
  const reduce = useReducedMotion();
  const shake = useAnimationControls();
  const [retrying, setRetrying] = useState(false);
  const isLock = tile.kind === "lock";
  const offline = tile.kind === "plug";
  const unlocked = isLock && (lock === "unlocked" || lock === "unlocking");
  const on = isLock ? true : offline ? false : rawOn;
  const disc = isLock && unlocked ? { bg: "var(--ios-orange)", ink: "text-black" } : DISC[tile.kind];

  useEffect(() => {
    if (!retrying) return;
    const t = window.setTimeout(() => setRetrying(false), 1600);
    return () => window.clearTimeout(t);
  }, [retrying]);

  const state = isLock
    ? { locked: "Locked", confirm: "Tap to unlock", unlocking: "Unlocking…", unlocked: "Unlocked", locking: "Locking…" }[lock]
    : offline
      ? retrying
        ? "Retrying…"
        : "No Response"
      : !on
        ? tile.kind === "blinds"
          ? "Closed"
          : tile.kind === "speaker"
            ? "Paused"
            : "Off"
        : tile.kind === "light"
          ? `${tile.level}%`
          : tile.kind === "blinds"
            ? `Open ${tile.level}%`
            : tile.kind === "fan"
              ? "Auto · Low"
              : tile.kind === "speaker"
                ? "Playing"
                : "On";

  let glyph: ReactNode;
  switch (tile.kind) {
    case "light":
      glyph = tile.id === "lamp" ? <Lightbulb20Filled /> : <LightbulbFilament20Filled />;
      break;
    case "blinds":
      glyph = <BlindsGlyph open={on ? (tile.level ?? 100) / 100 : 0} />;
      break;
    case "tv":
      glyph = <Tv20Filled />;
      break;
    case "fan":
      glyph = <FanGlyph spin={on && !reduce} />;
      break;
    case "speaker":
      glyph = on && !reduce ? <Eq /> : <Speaker220Filled />;
      break;
    case "lock":
      glyph = unlocked ? <LockOpen20Filled /> : <LockClosed20Filled />;
      break;
    default:
      glyph = <PlugDisconnected20Filled />;
  }

  return (
    <motion.button
      type="button"
      aria-pressed={on}
      onClick={() => {
        if (offline) {
          setRetrying(true);
          if (!reduce) shake.start({ x: [0, -5, 5, -4, 4, -2, 0], transition: { duration: 0.45 } });
        }
        onTap();
      }}
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 360, damping: 24 }}
      whileTap={reduce ? undefined : { scale: 0.93 }}
      className={cn(
        "relative flex min-w-0 cursor-pointer flex-col items-start justify-between overflow-hidden rounded-[14px] p-[7px] text-left outline-none transition-[background-color,box-shadow] duration-300",
        on ? "bg-white shadow-[0_2px_10px_rgba(0,0,0,0.12)] ring-1 ring-black/5" : "bg-fill-tertiary",
        isLock && lock === "confirm" && "ring-1 ring-ios-orange",
      )}
    >
      <motion.span animate={shake} className="relative flex w-full items-start justify-between">
        <motion.span
          className={cn(
            "grid size-[22px] place-items-center rounded-full text-[13px] transition-colors duration-300",
            on || offline ? disc.ink : "text-tertiary",
          )}
          style={{ background: on || offline ? disc.bg : "var(--ant-color-fill-secondary)" }}
          key={on ? "on" : "off"}
          initial={{ scale: 0.7 }}
          animate={{ scale: 1, opacity: offline ? 0.6 : 1 }}
          transition={{ type: "spring", stiffness: 520, damping: 14 }}
        >
          {glyph}
        </motion.span>
        {offline ? <span className="mt-0.5 size-1.5 rounded-full bg-ios-red" /> : null}
      </motion.span>

      <span className="w-full min-w-0 leading-tight">
        <span className={cn("block truncate text-[12px] font-semibold", on ? "text-black" : "text-heading", offline && "opacity-60")}>{tile.name}</span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={state}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.18 }}
            className={cn(
              "block truncate text-[11px] tabular",
              on ? "text-black/55" : offline ? "text-ios-red" : "text-tertiary",
              isLock && (lock === "confirm" || unlocked) && "font-semibold text-[#c25e00]",
            )}
          >
            {state}
          </motion.span>
        </AnimatePresence>
      </span>

      {isLock && lock === "confirm" ? (
        <motion.span
          className="absolute bottom-0 left-0 h-[2px] bg-ios-orange"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: 3, ease: "linear" }}
        />
      ) : null}
    </motion.button>
  );
}

/** Three equalizer bars bouncing while the HomePod plays. */
function Eq() {
  return (
    <span className="flex h-[11px] items-end gap-[2px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-full w-[2.5px] origin-bottom rounded-full bg-current"
          animate={{ scaleY: [0.35, 1, 0.55, 0.85, 0.35] }}
          transition={{ duration: 1.1 + i * 0.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}
