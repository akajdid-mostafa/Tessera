import { PeopleAdd20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Network = {
  key: string;
  name: string;
  color: string;
  bg: string;
  followers: number;
  gain30: number;
  goal: number;
  /** Seconds between live follows. */
  every: number;
};

const NETWORKS: Network[] = [
  { key: "ig", name: "Instagram · @driftwoodcoffee", color: "var(--ios-pink)", bg: "bg-ios-pink", followers: 48_216, gain30: 1_284, goal: 50_000, every: 2.6 },
  { key: "tt", name: "TikTok · @driftwood.brews", color: "var(--ios-teal)", bg: "bg-ios-teal", followers: 31_870, gain30: 3_412, goal: 40_000, every: 1.4 },
  { key: "li", name: "LinkedIn · Driftwood Coffee Co.", color: "var(--ios-blue)", bg: "bg-ios-blue", followers: 12_405, gain30: 386, goal: 12_500, every: 6 },
];

/** Today is Nov 9; the goal is due Dec 31. */
const DAYS_LEFT = 52;
const W = 196; // full-bleed: the 164 px content box plus both 16 px paddings
const H = 60;
const PAD_T = 13;
const PAD_B = 3;
const SPLIT = 118; // x where the past 30 days end and the forecast begins

/** Thirty days of believable, mostly rising follower counts ending at today's number. */
function history(n: Network, seed: number) {
  const start = n.followers - n.gain30;
  return Array.from({ length: 31 }, (_, i) => {
    const t = i / 30;
    const wobble = Math.sin(i * 1.3 + seed) * 0.03 + Math.cos(i * 0.7 + seed * 2) * 0.02;
    return start + n.gain30 * Math.min(1, Math.max(0, t + (i === 30 ? 0 : wobble)));
  });
}

function shortDate(daysFromToday: number) {
  return new Date(2026, 10, 9 + daysFromToday).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Marketing · small. Followers tick up live over a 30-day area with a goal line and forecast cone; tap to switch network. */
export function FollowerGrowthWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const uid = useId().replace(/:/g, "");
  const [page, setPage] = useState(0);
  const [live, setLive] = useState<number[]>(() => NETWORKS.map(() => 0));
  const n = NETWORKS[page];

  useEffect(() => {
    const t = window.setInterval(() => {
      setLive((l) => l.map((v, i) => v + (Math.random() < 1.4 / NETWORKS[i].every ? 1 + Math.floor(Math.random() * 2) : 0)));
    }, 1400);
    return () => window.clearInterval(t);
  }, []);

  const followers = n.followers + live[page];
  const perDay = n.gain30 / 30;
  const daysToGoal = Math.ceil((n.goal - followers) / perDay);
  const onTrack = daysToGoal <= DAYS_LEFT;
  const projected = followers + perDay * DAYS_LEFT;

  // Chart scales
  const pts = history(n, page);
  const hi = Math.max(n.goal, followers + perDay * DAYS_LEFT * 1.25) * 1.002;
  const lo = Math.min(...pts) * 0.998;
  const y = (v: number) => PAD_T + (H - PAD_T - PAD_B) * (1 - (v - lo) / (hi - lo));
  const xp = (i: number) => (i / 30) * SPLIT;
  const line = pts.map((v, i) => `${i ? "L" : "M"}${xp(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${SPLIT} ${H} L0 ${H} Z`;
  const yNow = y(pts[30]);
  const cone = `M${SPLIT} ${yNow} L${W} ${y(followers + perDay * DAYS_LEFT * 1.25)} L${W} ${y(followers + perDay * DAYS_LEFT * 0.75)} Z`;
  const yGoal = y(n.goal);

  return (
    <Widget
      size="small"
      index={index}
      label="Follower growth"
      pressable
      onPress={() => setPage((p) => (p + 1) % NETWORKS.length)}
    >
      <WidgetHeader
        icon={<PeopleAdd20Filled />}
        tint={n.color}
        title="Followers"
        subtitle={n.name}
        extra={
          <div className="flex gap-1 pt-1" aria-hidden>
            {NETWORKS.map((x, i) => (
              <span
                key={x.key}
                className={cn("h-[5px] rounded-full transition-all duration-300", i === page ? cn("w-3", x.bg) : "w-[5px] bg-fill")}
              />
            ))}
          </div>
        }
      />

      <AnimatedNumber
        value={followers}
        className="mt-2 text-[26px] leading-none font-semibold tracking-tight text-heading"
      />
      <div className="mt-1 flex items-center justify-between text-[11px] leading-tight whitespace-nowrap tabular">
        <span className="font-semibold text-ios-green">
          +<AnimatedNumber value={n.gain30 + live[page]} />
          <span className="ml-1 font-normal text-tertiary">30d</span>
        </span>
        <span className={onTrack ? "text-tertiary" : "font-medium text-ios-orange"}>
          {onTrack ? `Goal by ${shortDate(daysToGoal)}` : `−${((n.goal - projected) / 1000).toFixed(1)}K at Dec 31`}
        </span>
      </div>

      {/* Fixed-height box with the charts stacked inside it, so the outgoing and
          incoming chart cross-fade in place instead of pushing each other. */}
      <div className="relative -mx-4 -mb-4 mt-auto shrink-0" style={{ height: H }}>
        <AnimatePresence initial={false}>
          <motion.svg
            key={n.key}
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            height={H}
            preserveAspectRatio="none"
            className="absolute inset-0 block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            aria-hidden
          >
            <defs>
              <linearGradient id={`fg-${uid}-${n.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={n.color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={n.color} stopOpacity={0} />
              </linearGradient>
              <clipPath id={`fgc-${uid}-${n.key}`}>
                <motion.rect
                  x={0}
                  y={0}
                  height={H}
                  initial={{ width: 0 }}
                  animate={{ width: W }}
                  transition={{ duration: 1.1, delay: page === 0 ? delay : 0.05, ease: [0.22, 1, 0.36, 1] }}
                />
              </clipPath>
            </defs>
            <g clipPath={`url(#fgc-${uid}-${n.key})`}>
              <path d={area} fill={`url(#fg-${uid}-${n.key})`} />
              <path d={line} fill="none" stroke={n.color} strokeWidth={2} strokeLinejoin="round" />
              <path d={cone} fill={n.color} fillOpacity={0.14} />
              <line
                x1={SPLIT}
                y1={yNow}
                x2={W}
                y2={y(projected)}
                stroke={n.color}
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
            </g>
            <line x1={0} x2={W} y1={yGoal} y2={yGoal} stroke="var(--ant-color-text-tertiary)" strokeDasharray="2 3" />
          </motion.svg>
        </AnimatePresence>
      </div>
      {/* Label kept out of the stretched SVG so it is not distorted */}
      <span
        className="pointer-events-none absolute left-4 text-[10px] leading-none text-tertiary tabular"
        style={{ bottom: H - yGoal + 2 }}
      >
        Goal {(n.goal / 1000).toFixed(n.goal % 1000 ? 1 : 0)}K
      </span>
      <motion.span
        className="pointer-events-none absolute size-2 rounded-full ring-2 ring-[var(--widget-surface)]"
        style={{ background: n.color, left: `calc(${(SPLIT / W) * 100}% - 4px)`, bottom: H - yNow - 4 }}
        animate={{ scale: [1, 1.35, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </Widget>
  );
}
