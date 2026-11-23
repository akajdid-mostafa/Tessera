import { Add12Filled, Organization20Filled, Sparkle12Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Seat =
  | { kind: "person"; name: string; role: string; who?: string; note?: "new" | "leaving"; detail?: string }
  | { kind: "open"; role: string; detail: string };
type Team = {
  name: string;
  lead: { name: string; role: string; who: string };
  color: string;
  text: string;
  tenure: number;
  enps: number;
  seats: Seat[];
};

const p = (name: string, role: string, extra?: Partial<Extract<Seat, { kind: "person" }>>): Seat => ({ kind: "person", name, role, ...extra });
const open = (role: string, detail: string): Seat => ({ kind: "open", role, detail });

const VP = { name: "Ana Ribeiro", role: "VP Engineering", who: "f4" };
const TEAMS: Team[] = [
  {
    name: "Platform",
    lead: { name: "Marcus Chen", role: "Eng Manager · Platform", who: "m4" },
    color: "var(--ios-blue)",
    text: "text-ios-blue",
    tenure: 3.1,
    enps: 41,
    seats: [
      p("Rafael Souza", "Staff Engineer", { who: "m1" }),
      p("Yuki Sato", "Senior SRE", { who: "f2" }),
      p("Tobias Klein", "Backend Engineer", { who: "m6" }),
      p("Amara Okeke", "Backend Engineer", { who: "f9" }),
      p("Felix Wagner", "SRE", { who: "m9" }),
      p("Nora Lindqvist", "Security Engineer", { who: "f1", note: "leaving", detail: "Notice period · last day Nov 27" }),
      p("Leo Martins", "Backend Engineer", { who: "m3" }),
      p("Sana Iqbal", "Platform Engineer", { who: "f7" }),
      p("Paul Becker", "DevOps Engineer", { who: "m7" }),
      open("Senior SRE", "3 candidates in final round"),
      open("Staff Engineer, Infra", "Sourcing · opened Oct 19"),
    ],
  },
  {
    name: "Product",
    lead: { name: "Priya Nair", role: "Eng Manager · Product", who: "f3" },
    color: "var(--ios-pink)",
    text: "text-ios-pink",
    tenure: 2.2,
    enps: 36,
    seats: [
      p("Emma Laurent", "Senior Frontend Engineer", { who: "f5" }),
      p("Jamal Wright", "Full-stack Engineer", { who: "m2" }),
      p("Chloé Martin", "Frontend Engineer", { who: "f6" }),
      p("Daniel Kim", "Mobile Engineer", { who: "m8" }),
      p("Olivia Grant", "Product Engineer", { who: "f8" }),
      p("Mateo Rossi", "Frontend Engineer", { who: "m10" }),
      p("Hana Wilson", "QA Engineer", { who: "f2" }),
      p("Ben Carter", "Mobile Engineer", { who: "m5" }),
      p("Lara Kovac", "Full-stack Engineer", { who: "f9" }),
      p("Ivan Petrov", "Frontend Engineer", { who: "m1" }),
      p("Zara Ahmed", "Product Engineer", { who: "f1" }),
      open("Senior Frontend Engineer", "Offer out · reply due Fri"),
    ],
  },
  {
    name: "Data",
    lead: { name: "Jonas Weber", role: "Eng Manager · Data", who: "m8" },
    color: "var(--ios-teal)",
    text: "text-ios-teal",
    tenure: 1.8,
    enps: 22,
    seats: [
      p("Mia Schulz", "Data Engineer", { who: "f7" }),
      p("Arjun Rao", "ML Engineer", { who: "m6" }),
      p("Grace Liu", "Analytics Engineer", { who: "f3" }),
      p("Kwame Asante", "Data Engineer", { who: "m3" }),
      p("Elena Popescu", "Data Scientist", { who: "f5" }),
      p("Tom Hayes", "Data Engineer", { who: "m9" }),
      p("Lucas Moreau", "ML Engineer", { who: "m2", note: "new", detail: "Starts Mon, Nov 16" }),
      open("Senior Data Engineer", "52 days open · no offer yet"),
      open("ML Engineer", "Interviewing · 4 in loop"),
    ],
  },
];

const people = (t: Team) => 1 + t.seats.filter((s) => s.kind === "person").length;
const openSeats = (t: Team) => t.seats.filter((s) => s.kind === "open").length;
const ALL = {
  people: 1 + TEAMS.reduce((n, t) => n + people(t), 0),
  open: TEAMS.reduce((n, t) => n + openSeats(t), 0),
  tenure: 2.4,
  enps: 34,
};

/* Connector geometry, in the drawing's own 376 px width. */
const W = 376;
const CX = [W / 6, W / 2, (5 * W) / 6];
const trunk = `M ${W / 2} 38 V 52`;
const rail = `M ${CX[0]} 52 H ${CX[2]}`;
const drop = (i: number) => `M ${CX[i]} 52 V 60`;

/** HR · large. The engineering org as a tree of faces with open seats; tap a team to focus it and its numbers roll in below. */
export function OrgChartWidget({ index }: { index?: number }) {
  const [focus, setFocus] = useState<number | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const t = focus === null ? null : TEAMS[focus];
  const stats = t
    ? { people: people(t), open: openSeats(t), tenure: t.tenure, enps: t.enps }
    : ALL;

  return (
    <Widget size="large" index={index} label="Org chart">
      <WidgetHeader
        icon={<Organization20Filled />}
        tint="var(--ios-indigo)"
        title="Engineering Org"
        subtitle="Tap a team to focus"
        extra={
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={t ? t.name : "all"}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                t ? cn("bg-fill-tertiary", t.text) : "bg-fill-tertiary text-secondary",
              )}
            >
              {t ? `${t.name} team` : "All teams"}
            </motion.span>
          </AnimatePresence>
        }
      />

      <div className="relative mt-3 h-[276px] shrink-0">
        <svg viewBox={`0 0 ${W} 70`} className="pointer-events-none absolute inset-x-0 top-0 h-[70px] w-full" fill="none">
          {[trunk, rail, drop(0), drop(1), drop(2)].map((d, i) => (
            <motion.path
              key={d}
              d={d}
              strokeWidth="1.5"
              strokeLinecap="round"
              className="stroke-fill"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: delay + 0.15 + (i === 0 ? 0 : i === 1 ? 0.2 : 0.4) }}
            />
          ))}
          {focus !== null ? (
            <motion.path
              key={`hl-${focus}`}
              d={`M ${W / 2} 38 V 52 H ${CX[focus]} V 60`}
              strokeWidth="2"
              strokeLinecap="round"
              stroke={TEAMS[focus].color}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          ) : null}
        </svg>

        <Tooltip title={`${VP.name} · ${VP.role}`}>
          <motion.button
            type="button"
            onClick={() => setFocus(null)}
            className="absolute top-0 left-1/2 -ml-[18px] block cursor-pointer rounded-full"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.08 }}
            transition={{ type: "spring", stiffness: 380, damping: 20, delay }}
          >
            <MemojiAvatar who={VP.who} size={36} style={{ boxShadow: "0 0 0 2px var(--widget-surface), 0 0 0 3.5px var(--ios-indigo)" }} />
          </motion.button>
        </Tooltip>

        <div className="absolute inset-x-0 top-[66px] bottom-0 grid grid-cols-3">
          {TEAMS.map((team, ti) => {
            const on = focus === ti;
            const dim = focus !== null && !on;
            return (
              <motion.button
                key={team.name}
                type="button"
                onClick={() => setFocus(on ? null : ti)}
                aria-pressed={on}
                aria-label={`${team.name} team`}
                className={cn(
                  "flex cursor-pointer flex-col items-center rounded-2xl pb-1 transition-colors",
                  on ? "bg-fill-quaternary" : "hover:bg-fill-quaternary",
                )}
                animate={{ opacity: dim ? 0.32 : 1 }}
                transition={{ duration: 0.25 }}
              >
                <motion.span
                  className="block rounded-full"
                  style={{ boxShadow: `0 0 0 2px var(--widget-surface), 0 0 0 3.5px ${team.color}` }}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: on ? 1.08 : 1 }}
                  transition={{ type: "spring", stiffness: 380, damping: 20, delay: delay + 0.55 + ti * 0.08 }}
                >
                  <MemojiAvatar who={team.lead.who} size={32} />
                </motion.span>
                <span className="mt-1.5 max-w-full truncate text-[11px] leading-[14px] font-semibold text-heading">{team.lead.name}</span>
                <span className={cn("text-[10px] leading-[12px] font-medium", team.text)}>
                  {team.name} · {people(team)}
                </span>

                <div className="mt-2 grid grid-cols-3 gap-[6px]">
                  {team.seats.map((s, si) => (
                    <SeatDot key={si} seat={s} color={team.color} text={team.text} delay={delay + 0.75 + ti * 0.08 + si * 0.03} />
                  ))}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto grid grid-cols-4 gap-2 border-t-[0.5px] border-split pt-2">
        <Stat label="People" value={<AnimatedNumber value={stats.people} />} />
        <Stat label="Open seats" value={<AnimatedNumber value={stats.open} className="text-ios-orange" />} />
        <Stat
          label="Avg tenure"
          value={<AnimatedNumber value={stats.tenure} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} suffix=" yrs" />}
        />
        <Stat label="eNPS" value={<AnimatedNumber value={stats.enps} format={{ signDisplay: "always" }} />} />
      </div>
    </Widget>
  );
}

function SeatDot({ seat, color, text, delay }: { seat: Seat; color: string; text: string; delay: number }) {
  const anim = {
    initial: { opacity: 0, scale: 0.3 },
    animate: { opacity: 1, scale: 1 },
    whileHover: { scale: 1.15, zIndex: 2 },
    transition: { type: "spring" as const, stiffness: 420, damping: 22, delay },
  };
  if (seat.kind === "open") {
    return (
      <Tooltip title={`Open seat · ${seat.role} · ${seat.detail}`}>
        <motion.span
          {...anim}
          className={cn("grid size-7 place-items-center rounded-full border-[1.5px] border-dashed text-[12px]", text)}
          style={{ borderColor: color }}
        >
          <Add12Filled />
        </motion.span>
      </Tooltip>
    );
  }
  return (
    <Tooltip title={`${seat.name} · ${seat.role}${seat.detail ? ` · ${seat.detail}` : ""}`}>
      <motion.span {...anim} className="relative block">
        <MemojiAvatar
          who={seat.who ?? seat.name}
          size={28}
          indicatorPosition={seat.note === "new" ? "top-end" : "bottom-end"}
          indicator={
            seat.note === "new" ? (
              <span className="grid size-[13px] place-items-center rounded-full bg-ios-yellow-deep text-[9px] text-white ring-[1.5px] ring-[var(--widget-surface)]">
                <Sparkle12Filled className="size-[9px]" />
              </span>
            ) : seat.note === "leaving" ? (
              <motion.span
                className="block size-[7px] rounded-full bg-ios-orange ring-[1.5px] ring-[var(--widget-surface)]"
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
            ) : undefined
          }
        />
      </motion.span>
    </Tooltip>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 leading-tight">
      <div className="truncate text-[10px] text-tertiary">{label}</div>
      <div className="text-[15px] font-semibold whitespace-nowrap text-heading">{value}</div>
    </div>
  );
}
