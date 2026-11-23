import {
  ArrowClockwise16Regular,
  Briefcase16Filled,
  CalendarLtr20Filled,
  Checkmark12Filled,
  Clock12Regular,
  Edit12Regular,
  ErrorCircle12Filled,
  Image16Filled,
  Mail16Filled,
  Play16Filled,
  Video16Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { type ComponentType, useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

type NetKey = "ig" | "tt" | "li" | "em" | "yt";
const NETS: Record<
  NetKey,
  { name: string; Glyph: ComponentType<{ className?: string }>; soft: string; text: string; solid: string }
> = {
  ig: { name: "Instagram", Glyph: Image16Filled, soft: "bg-ios-pink/20", text: "text-ios-pink", solid: "var(--ios-pink)" },
  tt: { name: "TikTok", Glyph: Video16Filled, soft: "bg-ios-teal/20", text: "text-ios-teal", solid: "var(--ios-teal)" },
  li: { name: "LinkedIn", Glyph: Briefcase16Filled, soft: "bg-ios-blue/20", text: "text-ios-blue", solid: "var(--ios-blue)" },
  em: { name: "Email", Glyph: Mail16Filled, soft: "bg-ios-orange/20", text: "text-ios-orange", solid: "var(--ios-orange)" },
  yt: { name: "YouTube", Glyph: Play16Filled, soft: "bg-ios-red/20", text: "text-ios-red", solid: "var(--ios-red)" },
};

type Status = "published" | "scheduled" | "draft" | "failed" | "publishing";
type Post = {
  id: string;
  day: number; // 0 = Mon Nov 9
  slot: number; // 0: 9–12, 1: 12–3, 2: 3–6, 3: 6–9
  time: string;
  net: NetKey;
  title: string;
  status: Status;
  reach?: number;
  rate?: string;
  note?: string;
};

const POSTS: Post[] = [
  { id: "p1", day: 0, slot: 0, time: "9:30 AM", net: "ig", title: "Monday pour-over guide", status: "published", reach: 12_420, rate: "6.1% engagement" },
  { id: "p2", day: 0, slot: 3, time: "6:00 PM", net: "li", title: "Q3 sustainability report", status: "published", reach: 4_130, rate: "3.2% engagement" },
  { id: "p3", day: 1, slot: 1, time: "12:15 PM", net: "tt", title: "Latte art fails, ranked", status: "published", reach: 61_902, rate: "9.8% engagement" },
  { id: "p4", day: 1, slot: 2, time: "3:30 PM", net: "em", title: "Gift guide teaser", status: "published", reach: 18_640, rate: "41% opens · 4.7% clicks" },
  { id: "p5", day: 2, slot: 0, time: "9:00 AM", net: "ig", title: "Holiday blend drop", status: "failed", note: "Instagram token expired" },
  { id: "p6", day: 2, slot: 1, time: "12:30 PM", net: "li", title: "Meet the Austin roastery team", status: "published", reach: 2_310, rate: "4.4% engagement" },
  { id: "p7", day: 2, slot: 3, time: "6:00 PM", net: "tt", title: "Cold brew in 60 seconds", status: "scheduled", note: "Goes live in 4h 20m" },
  { id: "p8", day: 3, slot: 1, time: "12:00 PM", net: "ig", title: "Behind the roast: Guji", status: "scheduled", note: "Queued · Thu 12:00 PM" },
  { id: "p9", day: 4, slot: 0, time: "9:00 AM", net: "em", title: "Black Friday early access", status: "scheduled", note: "Queued · 18,900 recipients" },
  { id: "p10", day: 4, slot: 2, time: "3:00 PM", net: "yt", title: "Brand story, 30s cut", status: "draft", note: "Draft · waiting on legal review" },
  { id: "p11", day: 5, slot: 1, time: "12:00 PM", net: "ig", title: "Weekend market stall", status: "scheduled", note: "Queued · Sat 12:00 PM" },
  { id: "p12", day: 6, slot: 3, time: "6:00 PM", net: "tt", title: "Sunday slow pour", status: "draft", note: "Draft · needs caption" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS = ["9 AM", "12 PM", "3 PM", "6 PM"];
const TODAY = 2; // Wednesday, Nov 11
const ROW = 48;
const GAP = 4;
/** 1:40 PM on a 9 AM–9 PM grid. */
const NOW_Y = ((13 + 40 / 60 - 9) / 12) * (ROW * 4 + GAP * 3);
const DAY_NAME = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Marketing · large. A week of scheduled posts by network with a live now line; select a post for detail and retry the one that failed. */
export function ContentCalendarWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [selected, setSelected] = useState("p5");
  const [fresh, setFresh] = useState(0);

  const statusOf = (p: Post) => status[p.id] ?? p.status;
  const failed = POSTS.filter((p) => statusOf(p) === "failed").length;
  const sel = POSTS.find((p) => p.id === selected)!;
  const selStatus = statusOf(sel);

  // Publishing takes a beat, then the recovered post starts collecting reach.
  useEffect(() => {
    if (status.p5 !== "publishing") return;
    const t = window.setTimeout(() => setStatus((s) => ({ ...s, p5: "published" })), 1400);
    return () => window.clearTimeout(t);
  }, [status.p5]);
  useEffect(() => {
    if (status.p5 !== "published") return;
    const t = window.setInterval(() => setFresh((f) => f + 40 + Math.round(Math.random() * 120)), 1500);
    return () => window.clearInterval(t);
  }, [status.p5]);

  return (
    <Widget size="large" index={index} label="Content calendar">
      <WidgetHeader
        icon={<CalendarLtr20Filled />}
        tint="var(--ios-purple)"
        title="Content Calendar"
        subtitle={`Nov 9 – 15 · ${POSTS.length} posts · 5 networks`}
        extra={
          <AnimatePresence>
            {failed ? (
              <motion.span
                key="failed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mt-0.5 flex items-center gap-1 rounded-full bg-ios-red/15 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-ios-red"
              >
                <ErrorCircle12Filled /> {failed} failed
              </motion.span>
            ) : null}
          </AnimatePresence>
        }
      />

      <div className="mt-3 flex gap-1">
        {/* Time gutter */}
        <div className="w-[30px] shrink-0">
          <div className="h-[34px]" />
          <div className="flex flex-col" style={{ gap: GAP }}>
            {SLOTS.map((s) => (
              <div key={s} className="text-[10px] leading-none whitespace-nowrap text-tertiary" style={{ height: ROW }}>
                {s}
              </div>
            ))}
          </div>
        </div>

        {DAYS.map((d, day) => (
          <div key={d} className="min-w-0 flex-1">
            <div className="flex h-[34px] flex-col items-center leading-none">
              <span className={cn("text-[10px]", day === TODAY ? "font-semibold text-ios-purple" : "text-tertiary")}>{d}</span>
              <span
                className={cn(
                  "mt-1 grid size-[22px] place-items-center rounded-full text-[13px] font-semibold tabular",
                  day === TODAY ? "bg-ios-purple text-white" : day < TODAY ? "text-tertiary" : "text-heading",
                )}
              >
                {9 + day}
              </span>
            </div>
            <div className="relative flex flex-col" style={{ gap: GAP }}>
              {SLOTS.map((_, slot) => {
                const p = POSTS.find((x) => x.day === day && x.slot === slot);
                return (
                  <div key={slot} className="rounded-[8px] bg-fill-quaternary" style={{ height: ROW }}>
                    {p ? (
                      <Block
                        post={p}
                        status={statusOf(p)}
                        selected={selected === p.id}
                        onSelect={() => setSelected(p.id)}
                        delay={delay + day * 0.05 + slot * 0.03}
                      />
                    ) : null}
                  </div>
                );
              })}
              {day === TODAY ? (
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute -inset-x-0.5 flex items-center"
                  style={{ top: NOW_Y - 4 }}
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: delay + 0.5, type: "spring", stiffness: 260, damping: 24 }}
                >
                  <motion.span
                    className="size-2 shrink-0 rounded-full bg-ios-red"
                    animate={{ scale: [1, 1.35, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <span className="h-[2px] flex-1 rounded-full bg-ios-red" />
                </motion.div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Detail */}
      <div className="relative mt-auto h-[84px] overflow-hidden rounded-[14px] bg-fill-tertiary">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={sel.id}
            className="absolute inset-0 flex flex-col p-2.5"
            initial={{ opacity: 0, y: 10, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(3px)" }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
          >
            <div className="flex items-center gap-2">
              <span
                className="grid size-7 shrink-0 place-items-center rounded-full text-[14px] text-white"
                style={{ background: NETS[sel.net].solid }}
              >
                {(() => {
                  const G = NETS[sel.net].Glyph;
                  return <G className="size-3.5" />;
                })()}
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[13px] font-semibold text-heading">{sel.title}</div>
                <div className="truncate text-[11px] text-tertiary">
                  {NETS[sel.net].name} · {DAY_NAME[sel.day]} {sel.time}
                </div>
              </div>
              <StatusTag status={selStatus} />
            </div>

            <div className="mt-auto flex h-7 items-center gap-2 text-[12px]">
              {selStatus === "failed" || selStatus === "publishing" ? (
                <>
                  <span className="min-w-0 flex-1 truncate font-medium text-ios-red">
                    {sel.note} · missed {sel.time}
                  </span>
                  <Button
                    size="small"
                    shape="round"
                    color="danger"
                    variant="solid"
                    loading={selStatus === "publishing"}
                    icon={<ArrowClockwise16Regular />}
                    onClick={() => setStatus((s) => ({ ...s, [sel.id]: "publishing" }))}
                    className="font-semibold"
                  >
                    {selStatus === "publishing" ? "Posting" : "Retry now"}
                  </Button>
                </>
              ) : selStatus === "published" ? (
                <span className="flex items-baseline gap-1.5 text-tertiary">
                  <AnimatedNumber
                    value={sel.reach ?? fresh}
                    format={{ notation: "compact", maximumFractionDigits: 1 }}
                    className="text-[17px] font-semibold tracking-tight text-heading"
                  />
                  reach · {sel.rate ?? "posted just now"}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-secondary">
                  {selStatus === "draft" ? <Edit12Regular /> : <Clock12Regular />}
                  {sel.note}
                </span>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </Widget>
  );
}

function Block({
  post,
  status,
  selected,
  onSelect,
  delay,
}: {
  post: Post;
  status: Status;
  selected: boolean;
  onSelect: () => void;
  delay: number;
}) {
  const net = NETS[post.net];
  const failed = status === "failed";
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-label={`${post.title}, ${status}`}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 420, damping: 22, delay }}
      className={cn(
        "relative flex h-full w-full cursor-pointer flex-col justify-between rounded-[8px] p-1 text-left outline-none",
        status === "draft" ? "border border-dashed border-border" : net.soft,
        failed && "bg-ios-red/15 ring-1 ring-ios-red ring-inset",
        selected && "ring-1 ring-current ring-inset",
        failed ? "text-ios-red" : status === "draft" ? "text-tertiary" : net.text,
      )}
    >
      <span className="flex items-start justify-between">
        <net.Glyph className="size-3.5" />
        <StatusMark status={status} />
      </span>
      <span className="truncate text-[10px] leading-none font-medium tabular">{post.time.replace(/ (AM|PM)/, "")}</span>
    </motion.button>
  );
}

function StatusMark({ status }: { status: Status }) {
  if (status === "published")
    return (
      <span className="grid size-3 shrink-0 place-items-center rounded-full bg-ios-green text-white">
        <Checkmark12Filled className="size-2" />
      </span>
    );
  if (status === "failed")
    return (
      <motion.span
        className="grid shrink-0 place-items-center"
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ErrorCircle12Filled />
      </motion.span>
    );
  if (status === "publishing")
    return (
      <motion.span
        className="size-2.5 shrink-0 rounded-full border-2 border-current border-t-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
      />
    );
  return null;
}

function StatusTag({ status }: { status: Status }) {
  const map: Record<Status, [string, string]> = {
    published: ["Published", "bg-ios-green/15 text-ios-green"],
    scheduled: ["Scheduled", "bg-ios-blue/15 text-ios-blue"],
    draft: ["Draft", "bg-fill-secondary text-secondary"],
    failed: ["Failed", "bg-ios-red/15 text-ios-red"],
    publishing: ["Posting…", "bg-ios-orange/15 text-ios-orange"],
  };
  const [label, cls] = map[status];
  return (
    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", cls)}>{label}</span>
  );
}
