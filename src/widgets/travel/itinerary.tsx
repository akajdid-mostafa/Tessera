import {
  AirplaneTakeOff16Regular,
  Bed16Filled,
  BuildingBank16Filled,
  Checkmark12Filled,
  Food16Filled,
  Map20Filled,
  Navigation16Filled,
  PersonWalking16Filled,
  WeatherPartlyCloudyDay20Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

type Item = {
  id: string;
  at: number;
  icon: ReactNode;
  tint: string;
  title: string;
  sub: string;
  details: [string, string][];
};
const hm = (h: number, m = 0) => h * 60 + m;
const ITEMS: Item[] = [
  {
    id: "flight",
    at: hm(7, 40),
    icon: <AirplaneTakeOff16Regular />,
    tint: "var(--ios-red)",
    title: "AX 1971 to Heathrow",
    sub: "JFK T7 → LHR T2 · lands 09:45",
    details: [
      ["Seat", "14C"],
      ["Bags", "Belt 7"],
      ["Ref", "TQ8K2L"],
    ],
  },
  {
    id: "hotel",
    at: hm(11, 30),
    icon: <Bed16Filled />,
    tint: "var(--ios-indigo)",
    title: "Check in · The Hoxton",
    sub: "199-206 High Holborn",
    details: [
      ["Room", "412 King"],
      ["Nights", "3"],
      ["Ref", "HX-58213"],
    ],
  },
  {
    id: "museum",
    at: hm(14, 30),
    icon: <BuildingBank16Filled />,
    tint: "var(--ios-orange)",
    title: "Tate Modern",
    sub: "Bankside · 2 timed tickets",
    details: [
      ["Entry", "14:30"],
      ["Walk", "18 min"],
      ["Gate", "Turbine Hall"],
    ],
  },
  {
    id: "walk",
    at: hm(17, 15),
    icon: <PersonWalking16Filled />,
    tint: "var(--ios-green)",
    title: "Sky Garden at sunset",
    sub: "20 Fenchurch St · free slot",
    details: [
      ["Slot", "17:15"],
      ["Sunset", "16:12"],
      ["Walk", "25 min"],
    ],
  },
  {
    id: "dinner",
    at: hm(19, 45),
    icon: <Food16Filled />,
    tint: "var(--ios-pink)",
    title: "Dinner · Dishoom",
    sub: "Covent Garden · table for 2",
    details: [
      ["Table", "19:45"],
      ["Party", "2"],
      ["Ref", "DSH-2291"],
    ],
  },
];
const START = hm(13, 50);
const MINUTE_MS = 5000;
const clock = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(Math.floor(m % 60)).padStart(2, "0")}`;
const SPRING = { type: "spring", stiffness: 420, damping: 36 } as const;

/** Travel · large. A day's plans on a vertical timeline with a live NOW marker; tap a plan to open its details. */
export function ItineraryWidget({ index }: { index?: number }) {
  const [now, setNow] = useState(START);
  const [open, setOpen] = useState<string | null>("museum");
  const [sent, setSent] = useState<string | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => setNow((n) => (n >= hm(21) ? START : n + 1)), MINUTE_MS);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!sent) return;
    const t = window.setTimeout(() => setSent(null), 1800);
    return () => window.clearTimeout(t);
  }, [sent]);

  const nextIdx = ITEMS.findIndex((i) => i.at > now);
  const doneCount = nextIdx === -1 ? ITEMS.length : nextIdx;
  const next = nextIdx === -1 ? null : ITEMS[nextIdx];

  const nowRow = (
    <motion.li key="now" layout transition={SPRING} className="flex gap-3">
      <div className="relative flex w-7 shrink-0 items-center justify-center py-1">
        <span className="absolute -top-1 -bottom-1 w-[2px] rounded-full bg-fill-secondary" />
        <span className="relative flex size-2.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-ios-red opacity-60" />
          <span className="relative size-2.5 rounded-full bg-ios-red ring-2 ring-[var(--widget-surface)]" />
        </span>
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2 pb-0.5 text-[11px] font-semibold text-ios-red tabular">
        <span className="whitespace-nowrap">Now · {clock(now)}</span>
        <span className="h-px flex-1 bg-ios-red/40" />
        {next ? (
          <span className="whitespace-nowrap font-medium text-tertiary">
            next in <AnimatedNumber value={next.at - now} trend={-1} className="font-semibold text-secondary" /> min
          </span>
        ) : null}
      </div>
    </motion.li>
  );

  return (
    <Widget size="large" index={index} label="Trip itinerary">
      <WidgetHeader
        icon={<Map20Filled />}
        tint="var(--ios-pink)"
        title="London"
        subtitle={`Sat, Nov 14 · ${ITEMS.length} plans`}
        extra={
          <span className="flex items-center gap-1 text-[13px] font-semibold text-heading">
            <WeatherPartlyCloudyDay20Filled className="text-[16px] text-ios-yellow" />
            11°
          </span>
        }
      />

      <LayoutGroup>
        <ul className="mt-2.5 flex flex-col">
          {ITEMS.map((it, i) => {
            const done = it.at <= now;
            const isOpen = open === it.id;
            const last = i === ITEMS.length - 1;
            return [
              i === doneCount ? nowRow : null,
              <motion.li
                key={it.id}
                layout
                transition={SPRING}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-3"
              >
                <div className="flex w-7 shrink-0 flex-col items-center">
                  <motion.span
                    className={cn(
                      "relative grid size-7 shrink-0 place-items-center rounded-full text-[14px] transition-colors duration-mid",
                      done ? "text-white" : "bg-fill-tertiary",
                    )}
                    style={done ? { background: it.tint } : { color: it.tint }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 20,
                      delay: delay + i * 0.06,
                    }}
                  >
                    {it.icon}
                    {done ? (
                      <span className="absolute -bottom-0.5 -right-0.5 grid size-3 place-items-center rounded-full bg-ios-green text-[8px] text-white ring-2 ring-[var(--widget-surface)]">
                        <Checkmark12Filled className="size-2" />
                      </span>
                    ) : null}
                  </motion.span>
                  {!last ? (
                    <span className="relative my-1 w-[2px] flex-1 overflow-hidden rounded-full bg-fill-secondary">
                      <motion.span
                        className="absolute inset-x-0 top-0 rounded-full"
                        style={{ background: it.tint }}
                        initial={{ height: 0 }}
                        animate={{
                          height: done && ITEMS[i + 1].at <= now ? "100%" : "0%",
                        }}
                        transition={{
                          duration: 0.6,
                          delay: delay + 0.3 + i * 0.08,
                        }}
                      />
                    </span>
                  ) : null}
                </div>

                <motion.div layout="position" className={cn("min-w-0 flex-1 pb-2", last && "pb-0")}>
                  <motion.button
                    type="button"
                    onClick={() => setOpen((o) => (o === it.id ? null : it.id))}
                    whileTap={{ scale: 0.98 }}
                    aria-expanded={isOpen}
                    className="block w-full cursor-pointer text-left outline-none"
                  >
                    <div className="flex items-baseline gap-2">
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-[13px] font-semibold",
                          done ? "text-secondary" : "text-heading",
                        )}
                      >
                        {it.title}
                      </span>
                      <span
                        className={cn("text-[11px] font-semibold tabular", done ? "text-tertiary" : "text-heading")}
                      >
                        {clock(it.at)}
                      </span>
                    </div>
                    <div className="truncate text-[11px] text-tertiary">{it.sub}</div>
                  </motion.button>

                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        key="details"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={SPRING}
                        className="overflow-hidden"
                      >
                        <div className="mt-1.5 flex items-center gap-2 rounded-xl bg-fill-quaternary px-2.5 py-1.5">
                          <div className="grid min-w-0 flex-1 grid-cols-3 gap-2 text-[11px] leading-tight">
                            {it.details.map(([k, v]) => (
                              <div key={k} className="min-w-0">
                                <div className="truncate text-tertiary">{k}</div>
                                <div className="truncate font-semibold text-heading tabular">{v}</div>
                              </div>
                            ))}
                          </div>
                          <Button
                            size="small"
                            shape="circle"
                            color="default"
                            variant="filled"
                            aria-label="Send directions to phone"
                            icon={
                              sent === it.id ? (
                                <Checkmark12Filled className="text-ios-green" />
                              ) : (
                                <Navigation16Filled style={{ color: it.tint }} />
                              )
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              setSent(it.id);
                            }}
                          />
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              </motion.li>,
            ];
          })}
          {doneCount === ITEMS.length ? nowRow : null}
        </ul>
      </LayoutGroup>
    </Widget>
  );
}
