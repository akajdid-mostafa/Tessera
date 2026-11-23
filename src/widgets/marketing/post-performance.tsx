import { ChatMultiple20Filled, Play16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/** Unsplash photos (free license), served from their CDN at thumbnail size. */
const photo = (id: string) => `https://images.unsplash.com/photo-${id}?w=240&h=300&fit=crop&auto=format&q=70`;

type Post = {
  id: string;
  network: string;
  kind: string;
  age: string;
  caption: string;
  /** The post's image. */
  image: string;
  video: boolean;
  /** Fallback behind the photo while it loads, decorative. */
  tile: string;
  dot: string;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  vsAvg: number;
  /** How lively the counters still are (a fresh post moves faster). */
  heat: number;
  /** Reach gained in each of the post's first 12 hours, as a share of its peak hour. */
  curve: number[];
};

const POSTS: Post[] = [
  {
    id: "guji",
    network: "Instagram",
    kind: "Reel",
    age: "2h ago",
    caption: "Behind the roast: Ethiopia Guji",
    image: photo("1447933601403-0c6688de566e"),
    video: true,
    tile: "linear-gradient(160deg,#ff9f0a 0%,#ff375f 55%,#bf5af2 100%)",
    dot: "#ff375f",
    reach: 24_318,
    likes: 2_146,
    comments: 184,
    shares: 312,
    saves: 497,
    vsAvg: 2.7,
    heat: 1,
    curve: [0.18, 0.46, 0.82, 1, 0.9, 0.74, 0.62, 0.55, 0.6, 0.71, 0.66, 0.58],
  },
  {
    id: "latte",
    network: "TikTok",
    kind: "Video",
    age: "1d ago",
    caption: "Latte art fails, ranked",
    image: photo("1495474472287-4d71bcdd2085"),
    video: true,
    tile: "linear-gradient(160deg,#40c8e0 0%,#5e5ce6 100%)",
    dot: "#40c8e0",
    reach: 61_902,
    likes: 7_830,
    comments: 640,
    shares: 1_215,
    saves: 902,
    vsAvg: 4.2,
    heat: 0.45,
    curve: [0.08, 0.2, 0.41, 0.66, 0.92, 1, 0.84, 0.7, 0.63, 0.52, 0.47, 0.4],
  },
  {
    id: "hiring",
    network: "LinkedIn",
    kind: "Post",
    age: "3d ago",
    caption: "We're hiring roasters in Austin",
    image: photo("1453614512568-c4024d13c247"),
    video: false,
    tile: "linear-gradient(160deg,#0a84ff 0%,#30b0c7 100%)",
    dot: "#0a84ff",
    reach: 9_410,
    likes: 388,
    comments: 46,
    shares: 71,
    saves: 22,
    vsAvg: 1.3,
    heat: 0.1,
    curve: [0.42, 0.88, 1, 0.76, 0.58, 0.44, 0.36, 0.31, 0.28, 0.24, 0.2, 0.18],
  },
];

type Metric = "likes" | "comments" | "shares" | "saves";
const METRICS: { key: Metric; label: string }[] = [
  { key: "likes", label: "Likes" },
  { key: "comments", label: "Replies" },
  { key: "shares", label: "Shares" },
  { key: "saves", label: "Saves" },
];

const ZERO = { reach: 0, likes: 0, comments: 0, shares: 0, saves: 0 };
const COMPACT = { notation: "compact", maximumFractionDigits: 1 } as const;

/** Marketing · large. The top post with its photo and climbing counters, its first-12-hours reach curve and the week's top three; tap a row (or the card) to switch posts. */
export function PostPerformanceWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [page, setPage] = useState(0);
  const [live, setLive] = useState(() => POSTS.map(() => ({ ...ZERO })));
  const p = POSTS[page];
  const now = live[page];

  useEffect(() => {
    const t = window.setInterval(() => {
      setLive((all) =>
        all.map((l, i) => {
          const h = POSTS[i].heat;
          if (Math.random() > h + 0.1) return l;
          return {
            reach: l.reach + Math.round((12 + Math.random() * 40) * h),
            likes: l.likes + Math.round(Math.random() * 6 * h),
            comments: l.comments + (Math.random() < 0.3 * h ? 1 : 0),
            shares: l.shares + (Math.random() < 0.4 * h ? 1 : 0),
            saves: l.saves + (Math.random() < 0.5 * h ? 1 : 0),
          };
        }),
      );
    }, 2000);
    return () => window.clearInterval(t);
  }, []);

  const v = (k: keyof typeof ZERO) => p[k] + now[k];
  const engagement = (v("likes") + v("comments") + v("shares") + v("saves")) / v("reach");

  return (
    <Widget
      size="large"
      index={index}
      label="Top social posts"
      pressable
      onPress={() => setPage((n) => (n + 1) % POSTS.length)}
    >
      <WidgetHeader
        icon={<ChatMultiple20Filled />}
        tint="var(--ios-pink)"
        title="Top Posts"
        subtitle="Driftwood Coffee · this week"
        extra={
          <div className="flex items-center gap-1 pt-1.5" aria-hidden>
            {POSTS.map((x, i) => (
              <span
                key={x.id}
                className={cn("h-[5px] rounded-full transition-all duration-300", i === page ? "w-3 bg-text" : "w-[5px] bg-fill")}
              />
            ))}
          </div>
        }
      />

      <div className="mt-2 flex h-[136px] shrink-0 gap-3">
        <div className="relative w-[100px] shrink-0">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={p.id}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotate: 3 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
            >
              <Thumbnail post={p} delay={page === 0 ? delay : 0} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-full truncate text-[12px] leading-tight"
            >
              <span className="font-semibold text-heading">{p.caption}</span>
              <span className="text-tertiary">
                {" "}
                · {p.network} {p.kind.toLowerCase()} · {p.age}
              </span>
            </motion.div>
          </AnimatePresence>

          <div className="mt-1.5 flex items-baseline-last gap-1.5 whitespace-nowrap">
            <AnimatedNumber value={v("reach")} className="text-[26px] leading-none font-semibold tracking-tight text-heading" />
            <span className="pb-0.5 text-[11px] text-tertiary">reach</span>
            <span className="mb-0.5 ml-auto rounded-full bg-ios-green/15 px-1.5 py-0.5 text-[11px] font-semibold text-ios-green tabular">
              <AnimatedNumber value={p.vsAvg} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} suffix="× avg" />
            </span>
          </div>
          <div className="mt-1 text-[11px] text-tertiary">
            <AnimatedNumber
              value={engagement}
              format={{ style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }}
              className="font-semibold text-secondary"
            />{" "}
            engagement rate
          </div>

          <div className="mt-auto grid grid-cols-4 gap-1.5">
            {METRICS.map((m, i) => (
              <motion.div
                key={m.key}
                className="flex h-[50px] flex-col justify-center rounded-[10px] bg-fill-tertiary px-2 py-1.5"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 380, damping: 26, delay: delay + 0.15 + i * 0.05 }}
              >
                <div className="leading-none">
                  <AnimatedNumber value={v(m.key)} format={COMPACT} className="text-[13px] font-semibold text-heading" />
                  <div className="mt-0.5 truncate text-[10px] text-tertiary">{m.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline justify-between text-[10.5px] text-tertiary">
          <span>Reach · first 12 hours</span>
          <span className="tabular">peak at hour {p.curve.indexOf(1) + 1}</span>
        </div>
        <div className="mt-1.5 flex h-[56px] items-end gap-[3px]">
          {p.curve.map((c, i) => (
            <motion.span
              key={`${p.id}-${i}`}
              className="min-w-0 flex-1 rounded-[3px]"
              style={{ background: p.dot, opacity: c === 1 ? 1 : 0.35 + c * 0.4 }}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(6, c * 100)}%` }}
              transition={{ type: "spring", stiffness: 220, damping: 22, delay: (page === 0 ? delay + 0.2 : 0) + i * 0.025 }}
            />
          ))}
        </div>
      </div>

      <ul className="m-0 mt-auto flex list-none flex-col divide-y-[0.5px] divide-split p-0">
        {POSTS.map((x, i) => {
          const on = i === page;
          return (
            <li key={x.id}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPage(i);
                }}
                className={cn(
                  "-mx-1.5 flex h-[30px] w-[calc(100%+12px)] cursor-pointer items-center gap-2 rounded-lg px-1.5 text-left transition-colors",
                  on ? "bg-fill-quaternary" : "hover:bg-fill-quaternary",
                )}
              >
                <span className="w-3 text-[11px] font-semibold text-tertiary tabular">{i + 1}</span>
                <span className="size-5 shrink-0 overflow-hidden rounded-[5px]" style={{ background: x.tile }}>
                  <img src={x.image} alt="" draggable={false} loading="lazy" className="size-full object-cover" />
                </span>
                <span className={cn("min-w-0 flex-1 truncate text-[11.5px]", on ? "font-semibold text-heading" : "text-secondary")}>
                  {x.caption}
                </span>
                <span className="size-1.5 shrink-0 rounded-full" style={{ background: x.dot }} />
                <AnimatedNumber
                  value={x.reach + live[i].reach}
                  format={COMPACT}
                  className="w-[42px] shrink-0 text-right text-[11.5px] font-semibold text-heading"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </Widget>
  );
}

/** The post's photo with a slow Ken Burns drift, shaded top and bottom so the chips read. */
function Thumbnail({ post, delay }: { post: Post; delay: number }) {
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
      style={{ background: post.tile }}
    >
      <motion.img
        src={post.image}
        alt=""
        draggable={false}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
        initial={{ scale: 1.15, opacity: 0 }}
        animate={{ scale: [1.06, 1.14, 1.06], opacity: 1 }}
        transition={{
          scale: { duration: 14, repeat: Infinity, ease: "easeInOut", delay },
          opacity: { duration: 0.5, delay },
        }}
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.35)_0%,transparent_32%,transparent_62%,rgba(0,0,0,0.45)_100%)]"
      />

      <span className="absolute top-1.5 left-1.5 rounded-full bg-black/35 px-1.5 py-px text-[10px] font-semibold text-white backdrop-blur-sm">
        {post.kind}
      </span>
      {post.video ? (
        <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-black/35 text-white backdrop-blur-sm">
          <Play16Filled className="size-2.5" />
        </span>
      ) : null}
      <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/35 px-1.5 py-px text-[10px] font-medium text-white backdrop-blur-sm">
        <span className="size-1.5 rounded-full" style={{ background: post.dot }} />
        {post.network}
      </span>
    </div>
  );
}
