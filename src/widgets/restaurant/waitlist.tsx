import { Chat16Regular, Checkmark16Filled, PeopleQueue20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

type Party = { id: number; name: string; size: number; quoted: number; waited: number; note: string; texted?: boolean };

const START: Party[] = [
  { id: 1, name: "Rossi", size: 4, quoted: 25, waited: 27, note: "Booth" },
  { id: 2, name: "Okoye", size: 2, quoted: 20, waited: 17, note: "Bar ok" },
  { id: 3, name: "Lindqvist", size: 6, quoted: 40, waited: 21, note: "High chair" },
  { id: 4, name: "Tanaka", size: 3, quoted: 25, waited: 9, note: "Patio" },
  { id: 5, name: "Moreau", size: 2, quoted: 15, waited: 3, note: "Any table" },
];
const WALK_INS = [
  { name: "Haddad", size: 2, quoted: 20, note: "Window" },
  { name: "Brennan", size: 5, quoted: 35, note: "Birthday" },
  { name: "Silva", size: 4, quoted: 25, note: "Booth" },
  { name: "Novak", size: 2, quoted: 15, note: "Bar ok" },
];
const R = 21;
const C = 2 * Math.PI * R;
const SEAT_MS = 5000;

const tone = (p: Party) => {
  const r = p.waited / p.quoted;
  return r > 1
    ? { stroke: "var(--ios-red)", text: "text-ios-red" }
    : r >= 0.8
      ? { stroke: "var(--ios-orange)", text: "text-ios-orange" }
      : { stroke: "var(--ios-indigo)", text: "text-tertiary" };
};

/** Restaurant · medium. The host stand's waitlist as a row of parties whose rings fill from quote to wait, the first one over; pick a party, text them their table is ready and they are seated as the next walk-in joins. */
export function WaitlistWidget({ index }: { index?: number }) {
  const [parties, setParties] = useState(START);
  const [sel, setSel] = useState(1);
  const next = useRef(0);
  const delay = 0.3 + (index ?? 0) * 0.06;

  // One simulated minute every 4 seconds.
  useEffect(() => {
    const t = window.setInterval(() => setParties((ps) => ps.map((p) => ({ ...p, waited: p.waited + 1 }))), 4000);
    return () => window.clearInterval(t);
  }, []);

  const texted = parties.find((p) => p.texted);
  const textedId = texted?.id;
  useEffect(() => {
    if (textedId === undefined) return;
    const t = window.setTimeout(() => {
      const w = WALK_INS[next.current % WALK_INS.length];
      const id = 100 + next.current;
      next.current += 1;
      setParties((ps) => [...ps.filter((p) => p.id !== textedId), { id, ...w, waited: 0 }]);
      setSel((s) => (s === textedId ? -1 : s));
    }, SEAT_MS);
    return () => window.clearTimeout(t);
  }, [textedId]);

  const party = parties.find((p) => p.id === sel) ?? parties[0];
  const guests = parties.reduce((s, p) => s + p.size, 0);
  const t = tone(party);

  return (
    <Widget size="medium" index={index} label="Waitlist">
      <WidgetHeader
        icon={<PeopleQueue20Filled />}
        tint="var(--ios-indigo)"
        title="Waitlist"
        subtitle={
          <>
            <AnimatedNumber value={parties.length} /> parties · <AnimatedNumber value={guests} /> guests · host stand
          </>
        }
      />

      <div className="mt-2 flex">
        <AnimatePresence mode="popLayout" initial={false}>
          {parties.map((p, i) => {
            const pt = tone(p);
            const r = Math.min(1, p.waited / p.quoted);
            const on = p.id === party.id;
            return (
              <motion.button
                key={p.id}
                type="button"
                layout
                onClick={() => setSel(p.id)}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6, y: -10, filter: "blur(4px)" }}
                transition={{ type: "spring", stiffness: 380, damping: 28, delay: i < 5 && p.id < 100 ? delay + i * 0.06 : 0 }}
                className={cn(
                  "flex min-w-0 flex-1 cursor-pointer flex-col items-center rounded-xl py-1 transition-colors",
                  on ? "bg-fill-tertiary" : "hover:bg-fill-quaternary",
                )}
              >
                <div className="relative size-[48px]">
                  <svg viewBox="0 0 48 48" className="absolute inset-0 size-full -rotate-90">
                    <circle cx="24" cy="24" r={R} fill="none" strokeWidth="3" className="stroke-fill-secondary" />
                    <motion.circle
                      cx="24"
                      cy="24"
                      r={R}
                      fill="none"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={C}
                      initial={{ strokeDashoffset: C, stroke: p.texted ? "var(--ios-green)" : pt.stroke }}
                      animate={{ strokeDashoffset: C * (1 - r), stroke: p.texted ? "var(--ios-green)" : pt.stroke }}
                      transition={{ type: "spring", stiffness: 90, damping: 18, delay: p.id < 100 ? delay + 0.1 + i * 0.06 : 0.1 }}
                    />
                  </svg>
                  <MemojiAvatar who={`${p.name}-${p.id}`} size={36} className="absolute top-[6px] left-[6px]" />
                  <span className="absolute -right-0.5 -bottom-0.5 grid size-[18px] place-items-center rounded-full bg-heading text-[10px] font-bold text-[var(--widget-surface)] ring-2 ring-[var(--widget-surface)] tabular">
                    {p.size}
                  </span>
                  {p.texted ? (
                    <motion.span
                      className="absolute -top-0.5 -right-0.5 grid size-[18px] place-items-center rounded-full bg-ios-green text-white ring-2 ring-[var(--widget-surface)]"
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Chat16Regular className="size-[11px]" />
                    </motion.span>
                  ) : null}
                </div>
                <span className="mt-1 max-w-full truncate px-0.5 text-[11.5px] leading-[14px] font-semibold text-heading">{p.name}</span>
                <span className={cn("text-[10.5px] leading-[13px] font-medium whitespace-nowrap tabular", pt.text)}>
                  <AnimatedNumber value={p.waited} />/{p.quoted}m
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-auto flex h-7 items-center gap-2">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={party.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="min-w-0 flex-1 truncate text-[12px] text-tertiary"
          >
            <span className="font-semibold text-heading">{party.name}</span> · {party.size} guests · {party.note}
            {party.waited > party.quoted ? (
              <span className={cn("font-medium", t.text)}> · {party.waited - party.quoted}m over</span>
            ) : null}
          </motion.div>
        </AnimatePresence>
        {party.texted ? (
          <span className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-ios-green">
            <Checkmark16Filled className="size-3.5" /> Texted · seating
          </span>
        ) : (
          <Button
            size="small"
            type="primary"
            icon={<Chat16Regular />}
            disabled={!!texted}
            onClick={() => setParties((ps) => ps.map((p) => (p.id === party.id ? { ...p, texted: true } : p)))}
          >
            Table ready
          </Button>
        )}
      </div>
    </Widget>
  );
}
