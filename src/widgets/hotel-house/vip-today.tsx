import {
  ArrowRepeatAll16Regular,
  Briefcase16Regular,
  Crown16Filled,
  Crown20Filled,
  DrinkWine16Regular,
  Gift16Regular,
  Star16Filled,
  WeatherMoon16Regular,
} from "@fluentui/react-icons";
import { motion } from "motion/react";
import { type ComponentType, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { tint } from "./_parts-a";

/** A guest's classification, or the profile tag that put them on today's list. */
type Flag = "VIP" | "Returning" | "Corporate" | "Loyalty member";
const FLAG: Record<Flag, { color: string; text: string; Icon: ComponentType<{ className?: string }> }> = {
  VIP: { color: "var(--ios-purple)", text: "text-ios-purple", Icon: Crown16Filled },
  Returning: { color: "var(--ios-teal)", text: "text-ios-teal", Icon: ArrowRepeatAll16Regular },
  Corporate: { color: "var(--ios-indigo)", text: "text-ios-indigo", Icon: Briefcase16Regular },
  "Loyalty member": { color: "var(--ios-pink)", text: "text-ios-pink", Icon: Star16Filled },
};

type Guest = {
  id: string;
  name: string;
  face: string;
  flag: Flag;
  room: string;
  type: string;
  alert?: { text: string; Icon: ComponentType<{ className?: string }> };
};

/* Arrivals and in-house guests at Seabright Villas today that the desk should know by name. */
const GUESTS: Guest[] = [
  { id: "ob", name: "Olivia Brown", face: "f3", flag: "VIP", room: "V4", type: "Villa", alert: { text: "Champagne in room", Icon: DrinkWine16Regular } },
  { id: "mr", name: "Marco Rossi", face: "m2", flag: "VIP", room: "504", type: "Junior Suite", alert: { text: "Late arrival 23:00", Icon: WeatherMoon16Regular } },
  { id: "cd", name: "Claire Dubois", face: "f7", flag: "Returning", room: "105", type: "Single Room", alert: { text: "Cake at 20:00", Icon: Gift16Regular } },
  { id: "ke", name: "Connor Hale", face: "m5", flag: "Corporate", room: "312", type: "Superior Double" },
  { id: "sr", name: "Sofia Rossi", face: "f9", flag: "Loyalty member", room: "403", type: "Deluxe Sea View" },
  { id: "hb", name: "Hans Becker", face: "m8", flag: "Returning", room: "V2", type: "Villa" },
  { id: "np", name: "Nina Petrova", face: "f4", flag: "VIP", room: "417", type: "Family Room" },
];
const STACK = 5;
const ROWS = GUESTS.filter((g) => g.alert);

/** Guests · medium. Today's VIP and tagged guests as a memoji stack that fans out on hover, with their open check-in alerts; tap an alert to tick it done. */
export function VipTodayWidget({ index }: { index?: number }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [fan, setFan] = useState(false);
  const [hot, setHot] = useState<string | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const open = ROWS.filter((g) => !done[g.id]).length;
  const stack = GUESTS.slice(0, STACK);

  return (
    <Widget size="medium" index={index} label="VIP and tagged guests today">
      <WidgetHeader
        icon={<Crown20Filled />}
        tint="var(--ios-purple)"
        title="VIP & Tags Today"
        subtitle={
          <>
            {GUESTS.length} guests ·{" "}
            <AnimatedNumber value={open} className={cn("font-semibold", open ? "text-ios-orange" : "text-ios-green")} />{" "}
            open alerts
          </>
        }
        extra={
          <div
            className="flex shrink-0 items-center pt-0.5"
            onMouseEnter={() => setFan(true)}
            onMouseLeave={() => {
              setFan(false);
              setHot(null);
            }}
          >
            {stack.map((g, i) => (
              <Tooltip key={g.id} title={`${g.name} · ${g.flag} · Room ${g.room}`}>
                <motion.span
                  className="relative block rounded-full"
                  style={{ zIndex: STACK + 1 - i }}
                  initial={{ opacity: 0, scale: 0.4, marginLeft: i ? -9 : 0 }}
                  animate={{ opacity: 1, scale: 1, marginLeft: i === 0 ? 0 : fan ? 3 : -9 }}
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 26,
                    opacity: { delay: delay + i * 0.05 },
                    scale: { type: "spring", stiffness: 420, damping: 20, delay: delay + i * 0.05 },
                  }}
                  onMouseEnter={() => setHot(g.id)}
                >
                  <motion.span
                    className="block rounded-full"
                    animate={{ scale: hot === g.id ? 1.15 : 1, y: hot === g.id ? -2 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  >
                    <MemojiAvatar
                      who={g.face}
                      size={24}
                      className="ring-[1.5px] ring-[var(--widget-surface)]"
                      indicatorPosition="bottom-end"
                      indicator={
                        <span
                          className="block size-[7px] rounded-full ring-[1.5px] ring-[var(--widget-surface)]"
                          style={{ background: FLAG[g.flag].color }}
                        />
                      }
                    />
                  </motion.span>
                </motion.span>
              </Tooltip>
            ))}
            <Tooltip title={GUESTS.slice(STACK).map((g) => `${g.name} (${g.room})`).join(", ")}>
              <motion.span
                className="grid size-6 place-items-center rounded-full bg-fill-tertiary text-[10px] font-semibold text-secondary ring-2 ring-[var(--widget-surface)] tabular"
                initial={{ opacity: 0, marginLeft: -9 }}
                animate={{ opacity: 1, marginLeft: fan ? 3 : -9 }}
                transition={{ type: "spring", stiffness: 420, damping: 26, opacity: { delay: delay + STACK * 0.05 } }}
              >
                +{GUESTS.length - STACK}
              </motion.span>
            </Tooltip>
          </div>
        }
      />

      <ul className="mt-auto flex flex-col gap-2">
        {ROWS.map((g, i) => {
          const f = FLAG[g.flag];
          const alert = g.alert!;
          const ticked = !!done[g.id];
          return (
            <motion.li
              key={g.id}
              className={cn(
                "relative flex h-[38px] items-center gap-2.5",
                i > 0 && "before:absolute before:inset-x-0 before:-top-1 before:h-[0.5px] before:bg-split",
              )}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 28, delay: delay + 0.1 + i * 0.06 }}
              onMouseEnter={() => setHot(g.id)}
              onMouseLeave={() => setHot(null)}
            >
              <motion.span animate={{ scale: hot === g.id ? 1.1 : 1 }} transition={{ type: "spring", stiffness: 500, damping: 22 }}>
                <MemojiAvatar who={g.face} size={28} />
              </motion.span>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-[12px] font-semibold text-heading">{g.name}</span>
                  <span
                    className={cn("flex h-4 shrink-0 items-center gap-0.5 rounded px-1 text-[10px] font-semibold", f.text)}
                    style={{ backgroundColor: tint(f.color, 16) }}
                  >
                    <f.Icon className="size-2.5" />
                    {g.flag}
                  </span>
                </div>
                <div className="truncate text-[11px] text-tertiary">
                  Room <span className="tabular">{g.room}</span> · {g.type}
                </div>
              </div>

              <motion.button
                type="button"
                aria-pressed={ticked}
                aria-label={`${alert.text}: ${ticked ? "done, tap to reopen" : "tap to mark done"}`}
                onClick={() => setDone((d) => ({ ...d, [g.id]: !d[g.id] }))}
                whileTap={{ scale: 0.94 }}
                className={cn(
                  "flex h-6 max-w-[168px] shrink-0 cursor-pointer items-center gap-1.5 rounded-full pr-1 pl-2 transition-colors duration-300",
                  ticked ? "" : "bg-fill-tertiary hover:bg-fill-secondary",
                )}
                style={ticked ? { backgroundColor: tint("var(--ios-green)", 14) } : undefined}
              >
                <alert.Icon className={cn("size-3 shrink-0", ticked ? "text-tertiary" : "text-ios-orange")} />
                <span
                  className={cn(
                    "truncate text-[11px] font-medium transition-colors duration-300",
                    ticked ? "text-tertiary line-through" : "text-heading",
                  )}
                >
                  {alert.text}
                </span>
                <span
                  className={cn(
                    "relative grid size-4 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors duration-300",
                    ticked ? "border-transparent" : "border-[var(--ant-color-border)]",
                  )}
                >
                  <motion.span
                    className="absolute -inset-[1.5px] rounded-full bg-ios-green"
                    initial={false}
                    animate={{ scale: ticked ? 1 : 0 }}
                    transition={{ type: "spring", stiffness: 520, damping: 22 }}
                  />
                  <svg viewBox="0 0 12 12" className="relative size-2.5" aria-hidden>
                    <motion.path
                      d="M2.5 6.2 5 8.6 9.6 3.6"
                      fill="none"
                      stroke="black"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={false}
                      animate={{ pathLength: ticked ? 1 : 0, opacity: ticked ? 1 : 0 }}
                      transition={{ duration: 0.3, delay: ticked ? 0.1 : 0 }}
                    />
                  </svg>
                </span>
              </motion.button>
            </motion.li>
          );
        })}
      </ul>
    </Widget>
  );
}
