import { CalendarPerson20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Reason = "vacation" | "sick" | "parental" | "travel";
const REASON: Record<Reason, { label: string; dot: string }> = {
  vacation: { label: "Vacation", dot: "bg-ios-teal" },
  sick: { label: "Sick", dot: "bg-ios-orange" },
  parental: { label: "Parental leave", dot: "bg-ios-pink" },
  travel: { label: "Business trip", dot: "bg-ios-indigo" },
};

type Person = { name: string; who: string; reason: Reason; back: string };
const PEOPLE: Record<string, Person> = {
  priya: { name: "Priya Shah", who: "f2", reason: "vacation", back: "back Thu" },
  marcus: { name: "Marcus Lee", who: "m3", reason: "sick", back: "back tomorrow" },
  hannah: { name: "Hannah Berg", who: "f5", reason: "parental", back: "back Jan 4" },
  diego: { name: "Diego Alvarez", who: "m6", reason: "vacation", back: "back Mon" },
  aiko: { name: "Aiko Tanaka", who: "f8", reason: "travel", back: "Web Summit · back Thu" },
  tom: { name: "Tom Reilly", who: "m9", reason: "sick", back: "back Wed" },
  fatima: { name: "Fatima Noor", who: "f4", reason: "vacation", back: "back Fri" },
  owen: { name: "Owen Brooks", who: "m1", reason: "vacation", back: "back Nov 16" },
  lucia: { name: "Lucía Romero", who: "f7", reason: "travel", back: "Client visit · back Wed" },
  sam: { name: "Sam Patel", who: "m4", reason: "vacation", back: "back Nov 16" },
  ines: { name: "Inès Moreau", who: "f1", reason: "vacation", back: "back Nov 16" },
  kofi: { name: "Kofi Mensah", who: "m7", reason: "sick", back: "back Mon" },
  ella: { name: "Ella Novak", who: "f9", reason: "vacation", back: "back Nov 16" },
};

const PAGES = [
  { label: "Today", date: "Mon, Nov 9", ids: ["priya", "marcus", "hannah", "diego", "aiko", "tom", "fatima"] },
  { label: "Tomorrow", date: "Tue, Nov 10", ids: ["priya", "hannah", "diego", "aiko", "tom", "fatima", "owen", "lucia", "sam"] },
  { label: "Friday", date: "Fri, Nov 13", ids: ["hannah", "diego", "owen", "sam", "ines", "kofi", "ella", "fatima", "priya", "lucia", "tom", "aiko"] },
] as const;
const STAFF = 64;
const SLOTS = 8;

/** HR · small. Who is out, as faces with a reason dot; tap to page through tomorrow and Friday, hover a face for when they're back. */
export function WhosOutWidget({ index }: { index?: number }) {
  const [page, setPage] = useState(0);
  const [paged, setPaged] = useState(false);
  const p = PAGES[page];
  const overflow = p.ids.length > SLOTS;
  const shown = overflow ? p.ids.slice(0, SLOTS - 1) : p.ids;
  const delay = paged ? 0 : 0.3 + (index ?? 0) * 0.06;

  return (
    <Widget
      size="small"
      index={index}
      label="Who's out"
      pressable
      onPress={() => {
        setPage((n) => (n + 1) % PAGES.length);
        setPaged(true);
      }}
    >
      <WidgetHeader icon={<CalendarPerson20Filled />} tint="var(--ios-teal)" title="Who's Out" subtitle={p.date} />

      <div className="mt-2 flex items-center gap-2 whitespace-nowrap">
        <AnimatedNumber value={p.ids.length} className="text-[30px] leading-none font-semibold tracking-tight text-heading" />
        <div className="text-[11px] leading-[14px] text-tertiary">
          <motion.div
            key={p.label}
            initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            className="font-semibold text-ios-teal"
          >
            {p.label}
          </motion.div>
          <div>
            <AnimatedNumber
              value={p.ids.length / STAFF}
              format={{ style: "percent", maximumFractionDigits: 0 }}
              className="font-medium text-secondary"
            />{" "}
            of {STAFF}
          </div>
        </div>
      </div>

      <div className="relative mt-auto h-[66px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={page}
            className="absolute inset-0 grid grid-cols-4 content-end justify-items-center gap-x-1 gap-y-1.5"
            exit={{ opacity: 0, x: -16, filter: "blur(3px)", transition: { duration: 0.18 } }}
          >
            {shown.map((id, i) => {
              const person = PEOPLE[id];
              const r = REASON[person.reason];
              return (
                <Tooltip key={id} title={`${person.name} · ${r.label} · ${person.back}`}>
                  <motion.span
                    className="relative block"
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.12 }}
                    transition={{ type: "spring", stiffness: 420, damping: 20, delay: delay + i * 0.04 }}
                  >
                    <MemojiAvatar
                      who={person.who}
                      size={30}
                      indicatorPosition="bottom-end"
                      indicator={<span className={cn("block size-[7px] rounded-full ring-[1.5px] ring-[var(--widget-surface)]", r.dot)} />}
                    />
                  </motion.span>
                </Tooltip>
              );
            })}
            {overflow ? (
              <Tooltip
                title={p.ids
                  .slice(SLOTS - 1)
                  .map((id) => PEOPLE[id].name)
                  .join(", ")}
              >
                <motion.span
                  className="grid size-[30px] place-items-center rounded-full bg-fill-tertiary text-[11px] font-semibold text-secondary tabular"
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 20, delay: delay + shown.length * 0.04 }}
                >
                  +{p.ids.length - shown.length}
                </motion.span>
              </Tooltip>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-2 flex justify-center gap-1">
        {PAGES.map((x, i) => (
          <motion.span
            key={x.label}
            layout
            className={cn("h-1.5 rounded-full", i === page ? "w-3.5 bg-ios-teal" : "w-1.5 bg-fill")}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        ))}
      </div>
    </Widget>
  );
}
