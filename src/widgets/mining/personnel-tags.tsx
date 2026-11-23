import { Checkmark12Filled, PeopleTeam20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { AlarmMark, HoldButton, enterDelay, mmss, useInterval } from "./_parts";

/* The underground tag board: cap-lamp tags read at level readers, grouped by level with
 * each level's refuge chamber. Calling a muster (hold to confirm) starts the count as
 * people tag in at their chamber; one worker on 1385 L never reports, which raises a
 * priority-1 alarm with the last reader that saw the tag. Normal state stays grey. */
type Level = { id: string; sub: string; rc: string; crew: string[] };
const LEVELS: Level[] = [
  { id: "1240 L", sub: "Decline", rc: "RC-1", crew: ["m2", "f3", "m7", "m9", "f6", "m4", "m1", "f8", "m10"] },
  { id: "1310 L", sub: "Stopes", rc: "RC-2", crew: ["f1", "m3", "m5", "f7", "m8", "m6", "f2", "m1", "f9", "m9", "m2", "f5", "m10", "f4"] },
  { id: "1385 L", sub: "Headings", rc: "RC-3", crew: ["m6", "f9", "m3", "f2", "m8", "m4", "f6", "m7", "f1", "m5", "f3", "m2"] },
];
const MISSING = { level: 2, name: "T. Okafor", who: "m5", reader: "1385-04", ago: "6 min" };
type Phase = "normal" | "muster" | "missing" | "acked";

/** Mining · medium. The underground tag board by level with crews as memoji; hold to call a muster and refuge-chamber counts roll up live until one missing worker raises a P1 alarm to acknowledge. */
export function PersonnelTagsWidget({ index }: { index?: number }) {
  const delay = enterDelay(index);
  const [phase, setPhase] = useState<Phase>("normal");
  const [counts, setCounts] = useState(LEVELS.map((l) => l.crew.length));
  const [safe, setSafe] = useState(LEVELS.map(() => 0));
  const [clock, setClock] = useState(0);

  // Normal shift: people move between levels now and then.
  useInterval(
    () => {
      setCounts((c) => {
        const from = Math.floor(Math.random() * 3);
        const to = (from + 1) % 3;
        if (c[from] <= LEVELS[from].crew.length - 2) return c;
        const n = [...c];
        n[from] -= 1;
        n[to] += 1;
        return n.map((v, i) => Math.max(LEVELS[i].crew.length - 2, Math.min(LEVELS[i].crew.length + 2, v)));
      });
    },
    phase === "normal" ? 3600 : null,
  );

  // Muster: tags register at the refuge chambers; one never does.
  useInterval(
    () => {
      setClock((t) => t + 9);
      const target = counts.map((c, i) => (i === MISSING.level ? c - 1 : c));
      const next = safe.map((v, i) => Math.min(target[i], v + Math.floor(Math.random() * 3)));
      setSafe(next);
      if (next.every((v, i) => v === target[i])) setPhase("missing");
    },
    phase === "muster" ? 600 : null,
  );
  useInterval(() => setClock((t) => t + 1), phase === "missing" || phase === "acked" ? 1000 : null);

  const total = counts.reduce((a, b) => a + b, 0);
  const accounted = safe.reduce((a, b) => a + b, 0);
  const mustering = phase !== "normal";
  const alarm = phase === "missing" || phase === "acked";

  return (
    <Widget size="medium" index={index} label="Underground personnel tag board">
      <WidgetHeader
        icon={<PeopleTeam20Filled />}
        tint="var(--ios-blue)"
        title="Underground"
        subtitle={
          <span>
            <AnimatedNumber value={mustering ? accounted : total} className="font-semibold text-secondary" />
            {mustering ? ` of ${total} at refuge` : " tagged in · Shift B"}
          </span>
        }
        extra={
          mustering ? (
            <span className="flex items-center gap-1 rounded-full bg-fill-tertiary px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-heading tabular">
              Muster {mmss(clock)}
            </span>
          ) : null
        }
      />

      <ul className="mt-2 flex flex-col gap-2">
        {LEVELS.map((l, i) => {
          const c = counts[i];
          const short = alarm && i === MISSING.level;
          return (
            <li key={l.id} className={cn("relative flex h-[26px] items-center gap-2 whitespace-nowrap", i > 0 && "before:absolute before:inset-x-0 before:-top-1 before:h-[0.5px] before:bg-split")}>
              <span className="w-[48px] shrink-0 text-[13px] font-semibold text-heading tabular">{l.id}</span>
              <span className="w-[96px] shrink-0 truncate text-[11px] text-tertiary">
                {l.rc} · {l.sub}
              </span>
              <AnimatePresence mode="wait" initial={false}>
                {mustering ? (
                  <motion.span
                    key="bar"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex min-w-0 flex-1 items-center gap-2"
                  >
                    <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-fill-tertiary">
                      <motion.span
                        className={cn("block h-full rounded-full", short ? "bg-ios-red" : "bg-[var(--ant-color-text-secondary)]")}
                        initial={{ width: 0 }}
                        animate={{ width: `${(safe[i] / c) * 100}%` }}
                        transition={{ type: "spring", stiffness: 140, damping: 22 }}
                      />
                    </span>
                    <span className={cn("w-[38px] text-right text-[12px] font-semibold tabular", short ? "text-ios-red" : "text-heading")}>
                      {safe[i]}/{c}
                    </span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="crew"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex min-w-0 flex-1 items-center justify-between"
                  >
                    <Tooltip title={`${c} tags on ${l.id} · refuge ${l.rc} ready`}>
                      <span className="flex items-center">
                        {l.crew.slice(0, 4).map((w, k) => (
                          <motion.span
                            key={w + k}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 24, delay: delay + i * 0.06 + k * 0.04 }}
                            className={cn("rounded-full ring-[1.5px] ring-[var(--widget-surface)]", k > 0 && "-ml-1.5")}
                          >
                            <MemojiAvatar who={w} size={22} />
                          </motion.span>
                        ))}
                        {c > 4 ? <span className="ml-1 text-[10px] text-tertiary tabular">+{c - 4}</span> : null}
                      </span>
                    </Tooltip>
                    <span className="text-[12px] font-semibold text-heading">
                      <AnimatedNumber value={c} />
                      <span className="ml-0.5 text-[10px] font-normal text-tertiary">tags</span>
                    </span>
                  </motion.span>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto h-7">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={phase === "acked" ? "missing" : phase}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.18 }}
            className="flex h-7 items-center gap-2 whitespace-nowrap"
          >
            {phase === "normal" ? (
              <>
                <span className="min-w-0 flex-1 truncate text-[11px] text-tertiary">Last drill 12 d ago · counted 4:52</span>
                <HoldButton label="Hold to call muster" tint="var(--ios-orange)" onConfirm={() => {
                    setSafe(LEVELS.map(() => 0));
                    setClock(0);
                    setPhase("muster");
                  }} className="w-[150px] shrink-0" />
              </>
            ) : phase === "muster" ? (
              <span className="text-[12px] text-secondary">
                Counting at refuge chambers… <span className="font-semibold text-heading tabular">{accounted}/{total}</span>
              </span>
            ) : (
              <>
                <AlarmMark priority={1} flashing={phase === "missing"} size={15} />
                <MemojiAvatar who={MISSING.who} size={22} />
                <span className="min-w-0 flex-1 truncate text-[11px] leading-tight text-tertiary">
                  <span className="font-semibold text-ios-red">{MISSING.name} not reported</span>
                  <span className="block">
                    Last reader {MISSING.reader} · {MISSING.ago} ago
                  </span>
                </span>
                {phase === "missing" ? (
                  <Button size="small" variant="solid" color="default" onClick={() => setPhase("acked")}>
                    Acknowledge
                  </Button>
                ) : (
                  <Button size="small" variant="filled" color="default" icon={<Checkmark12Filled />} onClick={() => setPhase("normal")}>
                    Stand down
                  </Button>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Widget>
  );
}
