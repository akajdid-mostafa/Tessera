import { CalendarPerson20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const SHOWINGS = [
  {
    home: "Mission Loft · 2BR",
    address: "112 Valencia St, SF",
    when: "Wed, Nov 11 · 11:00",
    startsIn: 2 * 86400 + 1 * 3600 + 19 * 60 + 40,
    guests: ["Emily Young", "Brian Kelly", "Sarah Allen", "Matt Tate"],
    rsvps: 12,
  },
  {
    home: "Nob Hill Flat · 3BR",
    address: "41 Jackson St, SF",
    when: "Thu, Nov 12 · 18:30",
    startsIn: 3 * 86400 + 8 * 3600 + 49 * 60 + 40,
    guests: ["Dana Adams", "Chris Diaz", "Zoe Shaw"],
    rsvps: 8,
  },
  {
    home: "Bayfront House · 4BR",
    address: "27 Bridgeway, Sausalito",
    when: "Sat, Nov 14 · 14:00",
    startsIn: 5 * 86400 + 4 * 3600 + 19 * 60 + 40,
    guests: ["Amy Cole", "Eric Price", "Lisa Owens", "Kyle Ames"],
    rsvps: 21,
  },
] as const;
const TWO = { minimumIntegerDigits: 2 } as const;

/** Real estate · small. Countdown to the next showing; RSVPs pop in; tap to page through showings. */
export function OpenHouseWidget({ index }: { index?: number }) {
  const [page, setPage] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  const s = SHOWINGS[page];
  const left = Math.max(0, s.startsIn - elapsed);
  const d = Math.floor(left / 86400);
  const h = Math.floor((left % 86400) / 3600);
  const m = Math.floor((left % 3600) / 60);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const faces = s.guests.slice(0, 3);

  return (
    <Widget
      size="small"
      index={index}
      label="Open house"
      pressable
      onPress={() => setPage((p) => (p + 1) % SHOWINGS.length)}
      // A solid orange card in both themes; everything on it is white.
      surfaceClassName="bg-[color(display-p3_0.980392_0.364706_0.098039)] ring-white/10"
    >
      <div className="flex items-start gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/20 text-[15px] text-white">
          <CalendarPerson20Filled />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[13px] font-semibold text-white">Open House</div>
          <div className="truncate text-[11px] text-white/75">{s.home}</div>
        </div>
      </div>

      <div className="mt-2.5 flex items-baseline text-[26px] leading-none font-semibold tracking-tight text-white">
        <AnimatedNumber value={d} />
        <span className="mr-1.5 text-[14px] font-medium text-white/70">d</span>
        <AnimatedNumber value={h} format={TWO} />
        <motion.span
          className="px-px text-white/70"
          animate={{ opacity: [1, 0.25, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        >
          :
        </motion.span>
        <AnimatedNumber value={m} format={TWO} trend={-1} />
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={page}
          initial={{ opacity: 0, x: 10, filter: "blur(3px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, x: -10, filter: "blur(3px)" }}
          className="mt-1.5 leading-tight"
        >
          <div className="truncate text-[11px] font-semibold text-white">{s.when}</div>
          <div className="truncate text-[11px] text-white/75">{s.address}</div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-auto flex items-center">
        <div className="flex">
          {faces.map((g, i) => (
            <motion.span
              key={`${page}-${g}`}
              className={cn("rounded-full ring-[1.5px] ring-[color(display-p3_0.980392_0.364706_0.098039)]", i > 0 && "-ml-1.5")}
              style={{ zIndex: faces.length - i }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 520,
                damping: 18,
                delay: (page === 0 && elapsed < 3 ? delay : 0.05) + i * 0.07,
              }}
            >
              <MemojiAvatar who={g} size={20} className="block" />
            </motion.span>
          ))}
        </div>
        <span className="ml-1.5 text-[11px] text-white/75">
          <AnimatedNumber value={s.rsvps} className="font-semibold text-white" /> going
        </span>
        <div className="ml-auto flex gap-[3px]">
          {SHOWINGS.map((x, i) => (
            <motion.span
              key={x.home}
              layout
              className={cn("h-1.5 rounded-full", i === page ? "w-3 bg-white" : "w-1.5 bg-white/35")}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          ))}
        </div>
      </div>
    </Widget>
  );
}
