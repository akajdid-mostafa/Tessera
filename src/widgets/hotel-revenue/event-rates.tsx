import { ArrowUndo16Regular, CalendarStar20Filled, Checkmark16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { occupancyPreset, PRESET, USD } from "./_parts-c";

type Event = { title: string; color: string };
const EV = {
  fair: { title: "Travel Expo", color: "var(--ios-blue)" },
  jazz: { title: "Jazz Night", color: "var(--ios-pink)" },
  congress: { title: "Medical Congress", color: "var(--ios-orange)" },
  marathon: { title: "City Marathon", color: "var(--ios-green)" },
  tech: { title: "Tech Summit", color: "var(--ios-purple)" },
  derby: { title: "Rivalry Game", color: "var(--ios-green)" },
  theatre: { title: "Theater Festival", color: "var(--ios-pink)" },
} satisfies Record<string, Event>;

/* Best Available Rate (3021, the master) and house occupancy for the next seven nights, with the events calendar. */
const DAYS: { d: string; n: number; price: number; occ: number; events: Event[] }[] = [
  { d: "Thu", n: 15, price: 260, occ: 32, events: [EV.fair, EV.jazz, EV.congress] },
  { d: "Fri", n: 16, price: 275, occ: 60, events: [EV.fair, EV.marathon] },
  { d: "Sat", n: 17, price: 300, occ: 47, events: [] },
  { d: "Sun", n: 18, price: 265, occ: 27, events: [EV.fair] },
  { d: "Mon", n: 19, price: 260, occ: 35, events: [] },
  { d: "Tue", n: 20, price: 260, occ: 30, events: [] },
  { d: "Wed", n: 21, price: 260, occ: 30, events: [EV.tech, EV.derby, EV.theatre] },
];
const UPLIFT = 0.1;
const raised = (price: number) => Math.round(price * (1 + UPLIFT));
const EVENT_DAYS = DAYS.filter((d) => d.events.length);
const DELTA = EVENT_DAYS.reduce((s, d) => s + raised(d.price) - d.price, 0);

const BAR_H = 30;
const barHeight = (price: number) => 6 + ((price - 250) / 60) * (BAR_H - 6);

type Mode = "idle" | "preview" | "applied";

/** Revenue · medium. The next seven nights' master price and occupancy under their event dots; +10% previews event-night prices as ghost bars and Apply rolls them in. */
export function EventRatesWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const uid = useId();
  const [mode, setMode] = useState<Mode>("idle");
  const [hover, setHover] = useState<number | null>(null);
  // The first growth waits for the entrance; later price changes move at once.
  const [touched, setTouched] = useState(false);
  const go = (m: Mode) => {
    setTouched(true);
    setMode(m);
  };
  const h = hover === null ? null : DAYS[hover];

  return (
    <Widget size="medium" index={index} label="Event-aware rates">
      <WidgetHeader
        icon={<CalendarStar20Filled />}
        tint="var(--ios-indigo)"
        title="Event-aware rates"
        subtitle="Best Available Rate · Oct 15–21"
        extra={
          <motion.button
            type="button"
            disabled={mode === "applied"}
            onClick={() => go(mode === "idle" ? "preview" : "idle")}
            whileTap={{ scale: 0.92 }}
            className={cn(
              "flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold outline-none transition-colors duration-mid disabled:cursor-default",
              mode === "idle" && "bg-fill-tertiary text-heading hover:bg-fill-secondary",
              mode === "preview" && "bg-ios-indigo text-white",
              mode === "applied" && "bg-ios-green/15 text-ios-green",
            )}
          >
            {mode === "applied" ? <Checkmark16Filled className="text-[12px]" /> : null}
            <span className="tabular">+10%</span>
            <span className={cn("font-medium", mode === "preview" ? "text-white/80" : "text-tertiary")}>
              {mode === "applied" ? "live" : "events"}
            </span>
          </motion.button>
        }
      />

      <div className="mt-2 grid grid-cols-7" onMouseLeave={() => setHover(null)}>
        {DAYS.map((day, i) => {
          const ev = day.events.length > 0;
          const next = raised(day.price);
          const shown = mode === "applied" && ev ? next : day.price;
          const preset = PRESET[occupancyPreset(day.occ)];
          return (
            <div
              key={day.n}
              role="presentation"
              onMouseEnter={() => setHover(i)}
              className="relative flex min-w-0 cursor-default flex-col items-center py-0.5 leading-tight"
            >
              {hover === i ? (
                <motion.span
                  layoutId={`${uid}-day`}
                  className="absolute inset-0 rounded-lg bg-fill-quaternary"
                  transition={{ type: "spring", stiffness: 500, damping: 36 }}
                />
              ) : null}
              <span className={cn("relative text-[10px] tabular", ev ? "font-medium text-secondary" : "text-tertiary")}>
                {day.d} {day.n}
              </span>
              <span className="relative mt-1 flex h-2 items-center gap-0.5">
                {day.events.map((e, k) => (
                  <motion.span
                    key={e.title}
                    className="size-1.5 rounded-full"
                    style={{ background: e.color }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 600, damping: 18, delay: delay + 0.35 + i * 0.04 + k * 0.05 }}
                  />
                ))}
              </span>
              <span className="relative mt-1 flex w-[18px] items-end justify-center" style={{ height: BAR_H }}>
                <AnimatePresence>
                  {mode === "preview" && ev ? (
                    <motion.span
                      key="ghost"
                      className="absolute inset-x-0 bottom-0 rounded-t-[5px] rounded-b-[2px] border border-dashed border-ios-indigo bg-ios-indigo/15"
                      initial={{ height: barHeight(day.price), opacity: 0 }}
                      animate={{ height: barHeight(next), opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 22, delay: i * 0.03 }}
                    />
                  ) : null}
                </AnimatePresence>
                <motion.span
                  className={cn("relative w-full rounded-t-[5px] rounded-b-[2px]", ev ? "bg-ios-indigo" : "bg-fill-secondary")}
                  initial={{ height: 0 }}
                  animate={{ height: barHeight(shown) }}
                  transition={{
                    type: "spring",
                    stiffness: 160,
                    damping: 20,
                    delay: touched ? i * 0.03 : delay + i * 0.05,
                  }}
                />
              </span>
              <span className="relative mt-0.5 text-[12px] font-semibold text-heading">
                <AnimatedNumber value={shown} format={USD} />
              </span>
              <span className="relative h-[13px] text-[10px] font-medium tabular">
                <AnimatePresence mode="popLayout" initial={false}>
                  {mode === "preview" && ev ? (
                    <motion.span
                      key="next"
                      className="block text-ios-indigo"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      → {next.toLocaleString("en-US")}
                    </motion.span>
                  ) : (
                    <motion.span
                      key="occ"
                      className={cn("block", preset.text)}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      {day.occ}% sold
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex h-6 items-center gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={mode === "idle" ? `idle-${hover ?? "all"}` : mode}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex min-w-0 flex-1 items-center gap-1.5 whitespace-nowrap text-[11px]"
          >
            {mode === "preview" ? (
              <span className="truncate text-tertiary">
                <span className="font-semibold text-ios-indigo tabular">+${DELTA.toLocaleString("en-US")}</span> a room
                across {EVENT_DAYS.length} event nights
              </span>
            ) : mode === "applied" ? (
              <span className="flex min-w-0 items-center gap-1 truncate text-tertiary">
                <Checkmark16Filled className="shrink-0 text-ios-green" />
                <span className="truncate">
                  <span className="font-medium text-ios-green">Applied</span> · sent to Online, Booking.com, Expedia,
                  Agoda
                </span>
              </span>
            ) : h ? (
              h.events.length ? (
                <span className="flex min-w-0 items-center gap-2 truncate">
                  {h.events.map((e) => (
                    <span key={e.title} className="flex min-w-0 items-center gap-1 text-secondary">
                      <span className="size-1.5 shrink-0 rounded-full" style={{ background: e.color }} />
                      <span className="truncate">{e.title}</span>
                    </span>
                  ))}
                </span>
              ) : (
                <span className="truncate text-tertiary">
                  {h.d}, Oct {h.n} · no events · {h.occ}% sold
                </span>
              )
            ) : (
              <span className="truncate text-tertiary">
                <span className="font-medium text-secondary">{EVENT_DAYS.length} event nights</span> · Travel Expo,
                City Marathon, Rivalry Game
              </span>
            )}
          </motion.div>
        </AnimatePresence>
        {mode === "preview" ? (
          <Button size="small" type="primary" shape="round" onClick={() => go("applied")}>
            Apply
          </Button>
        ) : mode === "applied" ? (
          <Button
            size="small"
            color="default"
            variant="filled"
            shape="round"
            icon={<ArrowUndo16Regular />}
            onClick={() => go("idle")}
          >
            Undo
          </Button>
        ) : null}
      </div>
    </Widget>
  );
}
