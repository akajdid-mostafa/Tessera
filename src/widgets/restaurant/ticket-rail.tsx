import { Checkmark16Filled, Food20Filled, Warning16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

type Item = { q: number; name: string; mod?: string };
type Ticket = { id: string; label: string; channel: string; items: Item[]; t: number; done: number[] };

const WARN = 8 * 60;
const LATE = 12 * 60;
const TWO = { minimumIntegerDigits: 2 } as const;

const OPEN: Ticket[] = [
  { id: "t12", label: "T12", channel: "Dine-in · 4", t: 824, done: [0], items: [{ q: 2, name: "Ribeye", mod: "MR" }, { q: 1, name: "Salmon" }, { q: 1, name: "Risotto", mod: "no parm" }] },
  { id: "u4821", label: "#4821", channel: "Uber Eats", t: 611, done: [], items: [{ q: 2, name: "Smash Burger", mod: "no onion" }, { q: 2, name: "Frites" }, { q: 1, name: "Caesar" }] },
  { id: "t7", label: "T7", channel: "Dine-in · 2", t: 468, done: [], items: [{ q: 1, name: "Half Chicken" }, { q: 1, name: "Gnocchi", mod: "add truffle" }] },
  { id: "t3", label: "T3", channel: "Dine-in · 3", t: 305, done: [], items: [{ q: 3, name: "Burrata" }, { q: 1, name: "Octopus" }, { q: 2, name: "Focaccia" }] },
  { id: "k218", label: "#218", channel: "Takeout", t: 196, done: [], items: [{ q: 1, name: "Short Rib" }, { q: 1, name: "Mac & Cheese" }] },
  { id: "b2", label: "Bar 2", channel: "Dine-in · 1", t: 47, done: [], items: [{ q: 1, name: "Ribeye", mod: "MW" }, { q: 1, name: "Frites" }] },
];
const INCOMING: Omit<Ticket, "t" | "done">[] = [
  { id: "t15", label: "T15", channel: "Dine-in · 6", items: [{ q: 2, name: "Octopus" }, { q: 3, name: "Salmon" }, { q: 1, name: "Ribeye", mod: "R" }] },
  { id: "d903", label: "#903", channel: "DoorDash", items: [{ q: 1, name: "Smash Burger" }, { q: 1, name: "Caesar", mod: "dressing side" }] },
  { id: "t9", label: "T9", channel: "Dine-in · 2", items: [{ q: 2, name: "Gnocchi" }, { q: 1, name: "Burrata" }] },
  { id: "k219", label: "#219", channel: "Takeout", items: [{ q: 2, name: "Half Chicken" }, { q: 2, name: "Frites" }] },
];

const age = (t: number) =>
  t >= LATE
    ? { color: "var(--ios-red)", text: "text-ios-red", label: "Late" }
    : t >= WARN
      ? { color: "var(--ios-orange)", text: "text-ios-orange", label: "Warning" }
      : { color: "var(--ios-green)", text: "text-ios-green", label: "On time" };

/** Restaurant · large. The expo ticket rail with live timers that turn amber at 8 min and red past 12; tap items off and bump a ticket to clear it. */
export function TicketRailWidget({ index }: { index?: number }) {
  const [tickets, setTickets] = useState<Ticket[]>(OPEN);
  const [bumped, setBumped] = useState(47);
  const [avg, setAvg] = useState(9 * 60 + 48);
  const next = useRef(0);
  const [touched, setTouched] = useState(false);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => setTickets((ts) => ts.map((x) => ({ ...x, t: x.t + 1 }))), 1000);
    return () => window.clearInterval(t);
  }, []);

  const bump = (id: string) => {
    setTouched(true);
    const tk = tickets.find((x) => x.id === id);
    if (!tk) return;
    setAvg((a) => Math.round((a * bumped + tk.t) / (bumped + 1)));
    setBumped((b) => b + 1);
    const n = INCOMING[next.current % INCOMING.length];
    next.current += 1;
    // Read the counter NOW, not inside the updater: two quick bumps queue two
    // updaters that would both see the final count and mint the same key.
    const newId = `${n.id}-${next.current}`;
    setTickets((ts) => [...ts.filter((x) => x.id !== id), { ...n, id: newId, t: 0, done: [] }]);
  };

  const toggleItem = (id: string, i: number) =>
    setTickets((ts) =>
      ts.map((x) => (x.id === id ? { ...x, done: x.done.includes(i) ? x.done.filter((d) => d !== i) : [...x.done, i] } : x)),
    );

  const counts = { ok: 0, warn: 0, late: 0 };
  tickets.forEach((x) => {
    if (x.t >= LATE) counts.late += 1;
    else if (x.t >= WARN) counts.warn += 1;
    else counts.ok += 1;
  });

  return (
    <Widget size="large" index={index} label="Kitchen ticket rail">
      <WidgetHeader
        icon={<Food20Filled />}
        tint="var(--ios-orange)"
        title="Ticket Rail · Expo"
        subtitle="Harbor & Vine · Dinner service"
        extra={
          <div className="text-right leading-tight">
            <div className="text-[10px] text-tertiary">Bumped</div>
            <AnimatedNumber value={bumped} className="text-[15px] font-semibold text-heading" />
          </div>
        }
      />

      <div className="mt-2 flex h-[24px] items-center gap-1.5 text-[11px] whitespace-nowrap">
        {[
          { n: counts.ok, label: "On time", cls: "bg-ios-green/15 text-ios-green" },
          { n: counts.warn, label: "8m+", cls: "bg-ios-orange/15 text-ios-orange" },
          { n: counts.late, label: "12m+", cls: "bg-ios-red/15 text-ios-red" },
        ].map((c) => (
          <span key={c.label} className={cn("rounded-full px-2 py-0.5 font-semibold", c.cls)}>
            <AnimatedNumber value={c.n} /> {c.label}
          </span>
        ))}
        <span className="ml-auto text-tertiary">
          Avg{" "}
          <span className="font-semibold text-secondary">
            <AnimatedNumber value={Math.floor(avg / 60)} />:
            <AnimatedNumber value={avg % 60} format={TWO} />
          </span>{" "}
          · goal 12:00
        </span>
      </div>

      <div className="mt-2 grid min-h-0 flex-1 grid-cols-3 grid-rows-2 gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {tickets.slice(0, 6).map((tk, i) => {
            const a = age(tk.t);
            const late = tk.t >= LATE;
            return (
              <motion.div
                key={tk.id}
                layout
                initial={touched ? { opacity: 0, x: 30, scale: 0.9 } : { opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -24, scale: 0.85, filter: "blur(4px)", transition: { duration: 0.25 } }}
                transition={{ type: "spring", stiffness: 380, damping: 30, delay: touched ? 0 : delay + i * 0.05 }}
                className="relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl bg-fill-quaternary"
                style={{ boxShadow: late ? "inset 0 0 0 1.5px var(--ios-red)" : undefined }}
              >
                <div
                  className="relative flex h-[30px] shrink-0 items-center gap-1 px-2 transition-colors duration-500"
                  style={{ backgroundColor: `color-mix(in srgb, ${a.color} 20%, transparent)` }}
                >
                  {late ? (
                    <motion.span
                      aria-hidden
                      className="absolute inset-0 bg-ios-red/20"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    />
                  ) : null}
                  <div className="relative min-w-0 flex-1 leading-[1.05]">
                    <div className="truncate text-[12px] font-semibold text-heading">{tk.label}</div>
                    <div className="truncate text-[9.5px] text-secondary">{tk.channel}</div>
                  </div>
                  <span className={cn("relative flex items-center gap-0.5 text-[12px] font-semibold", a.text)}>
                    {late ? <Warning16Filled className="size-3" /> : null}
                    <AnimatedNumber value={Math.floor(tk.t / 60)} />:
                    <AnimatedNumber value={tk.t % 60} format={TWO} />
                  </span>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden px-2 pt-1.5">
                  {tk.items.map((it, j) => {
                    const done = tk.done.includes(j);
                    return (
                      <button
                        key={j}
                        type="button"
                        onClick={() => toggleItem(tk.id, j)}
                        className="group flex min-w-0 cursor-pointer items-baseline gap-1 text-left leading-tight"
                      >
                        <span className={cn("text-[11px] font-semibold tabular", done ? "text-tertiary" : "text-heading")}>{it.q}</span>
                        <span className="min-w-0">
                          <span
                            className={cn(
                              "block truncate text-[11px] transition-colors",
                              done ? "text-tertiary line-through" : "text-heading group-hover:text-secondary",
                            )}
                          >
                            {it.name}
                          </span>
                          {it.mod ? <span className="block truncate text-[9.5px] text-ios-orange">{it.mod}</span> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="shrink-0 p-1.5 pt-1">
                  <Button
                    size="small"
                    block
                    variant={late ? "solid" : "filled"}
                    color={late ? "danger" : "default"}
                    icon={<Checkmark16Filled />}
                    onClick={() => bump(tk.id)}
                    aria-label={`Bump ${tk.label}`}
                  >
                    Bump
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
