import { Checkmark12Filled, PersonCall20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Presence = "in-house" | "busy" | "home";
type Doc = {
  id: string;
  who: string;
  name: string;
  role: string;
  presence: Presence;
  where: string;
  /** Seconds until they answer a page. */
  answer: number;
  reply: string;
};

const ROSTER: Doc[] = [
  { id: "osei", who: "m4", name: "Dr. Osei", role: "Cardiology", presence: "in-house", where: "Cath lab hall", answer: 3, reply: "calling back · x4410" },
  { id: "varga", who: "f3", name: "Dr. Varga", role: "Hospitalist", presence: "in-house", where: "Ward 4B", answer: 4, reply: "on the way · 5 min" },
  { id: "brennan", who: "f8", name: "Dr. Brennan", role: "Anesthesia", presence: "busy", where: "In OR 3 until ~21:40", answer: 6, reply: "via OR RN · out ~21:40" },
  { id: "park", who: "m7", name: "J. Park, RN", role: "Rapid resp.", presence: "in-house", where: "Floor 4", answer: 2, reply: "en route · 2 min" },
  { id: "haddad", who: "m9", name: "Dr. Haddad", role: "Surgery", presence: "home", where: "Home · 20 min out", answer: 8, reply: "calling back · cell" },
];

const RING: Record<Presence, string> = {
  "in-house": "var(--ios-green)",
  busy: "var(--ios-orange)",
  home: "var(--ant-color-fill)",
};
const LABEL: Record<Presence, string> = { "in-house": "In house", busy: "Busy", home: "Backup" };

type Page = { state: "paging" | "ack"; sent: number; took?: number };

/** Healthcare · medium. Tonight's on-call team as memoji with presence rings; tap someone to page them and watch the page ring until they acknowledge. */
export function OnCallWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [pages, setPages] = useState<Record<string, Page>>({});
  const [focus, setFocus] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const timers = useRef<number[]>([]);

  const paging = Object.values(pages).some((p) => p.state === "paging");

  useEffect(() => {
    if (!paging) return;
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, [paging]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const page = (d: Doc) => {
    setFocus(d.id);
    if (pages[d.id]?.state === "paging") return;
    const sent = Date.now();
    setNow(sent);
    setPages((p) => ({ ...p, [d.id]: { state: "paging", sent } }));
    const t = window.setTimeout(() => {
      setPages((p) => ({ ...p, [d.id]: { state: "ack", sent, took: d.answer } }));
    }, d.answer * 1000);
    timers.current.push(t);
  };

  const acked = Object.values(pages).filter((p) => p.state === "ack").length;
  const inHouse = ROSTER.filter((d) => d.presence === "in-house").length;
  const f = ROSTER.find((d) => d.id === focus);
  const fp = f ? pages[f.id] : undefined;

  let line: { key: string; text: string; tone: string };
  if (!f || !fp) {
    line = { key: "idle", text: "Tap someone to page", tone: "text-tertiary" };
  } else if (fp.state === "paging") {
    const s = Math.floor((now - fp.sent) / 1000);
    line = { key: `${f.id}-p`, text: `Paging ${f.name}… 0:${String(s).padStart(2, "0")}`, tone: "text-ios-blue" };
  } else {
    line = { key: `${f.id}-a`, text: `${f.name} ack in ${fp.took}s · ${f.reply}`, tone: "text-ios-green" };
  }

  return (
    <Widget size="medium" index={index} label="On-call roster">
      <WidgetHeader
        icon={<PersonCall20Filled />}
        tint="var(--ios-indigo)"
        title="On Call · Tonight"
        subtitle="Cardiac unit · 19:00–07:00"
        extra={
          <div className="text-right leading-tight whitespace-nowrap">
            <div className="text-[11px] text-tertiary">In house</div>
            <div className="text-[15px] font-semibold text-heading">
              <AnimatedNumber value={inHouse} />
              <span className="text-[11px] font-medium text-tertiary"> of {ROSTER.length}</span>
            </div>
          </div>
        }
      />

      <div className="mt-2.5 grid grid-cols-5 gap-1">
        {ROSTER.map((d, i) => {
          const p = pages[d.id];
          return (
            <Tooltip
              key={d.id}
              mouseEnterDelay={0.2}
              title={
                <span>
                  {d.name} · {d.where}
                </span>
              }
            >
              <motion.button
                type="button"
                aria-label={`Page ${d.name}, ${LABEL[d.presence]}`}
                onClick={() => page(d)}
                className="flex min-w-0 cursor-pointer flex-col items-center rounded-xl py-1 outline-none"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 380, damping: 26, delay: delay + i * 0.06 }}
              >
                <span className="relative grid size-[46px] place-items-center">
                  <svg viewBox="0 0 46 46" className="absolute inset-0 -rotate-90" aria-hidden>
                    <circle cx="23" cy="23" r="21" fill="none" strokeWidth="2.5" className="stroke-fill-quaternary" />
                    <motion.circle
                      cx="23"
                      cy="23"
                      r="21"
                      fill="none"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      pathLength={1}
                      strokeDasharray="1 1"
                      initial={{ strokeDashoffset: 1, stroke: p?.state === "paging" ? "var(--ios-blue)" : p?.state === "ack" ? "var(--ios-green)" : RING[d.presence] }}
                      animate={{
                        strokeDashoffset: 0,
                        stroke: p?.state === "paging" ? "var(--ios-blue)" : p?.state === "ack" ? "var(--ios-green)" : RING[d.presence],
                      }}
                      transition={{ type: "spring", stiffness: 70, damping: 16, delay: delay + 0.2 + i * 0.06 }}
                    />
                  </svg>
                  {p?.state === "paging" ? (
                    <motion.span
                      className="pointer-events-none absolute inset-0 rounded-full ring-[1.5px] ring-ios-blue"
                      initial={{ opacity: 0.7, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.35 }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
                    />
                  ) : null}
                  <MemojiAvatar who={d.who} size={38} className={cn(d.presence === "home" && "opacity-70")} />
                  <AnimatePresence>
                    {p?.state === "ack" ? (
                      <motion.span
                        key="ack"
                        className="absolute -right-0.5 -bottom-0.5 grid size-4 place-items-center rounded-full bg-ios-green text-[10px] text-white ring-2 ring-[var(--widget-surface)]"
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.3, 1] }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                      >
                        <Checkmark12Filled />
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </span>
                <span className="mt-1 w-full truncate text-center text-[11.5px] leading-tight font-semibold text-heading">
                  {d.name}
                </span>
                <span className="w-full truncate text-center text-[10px] leading-tight text-tertiary">{d.role}</span>
              </motion.button>
            </Tooltip>
          );
        })}
      </div>

      <div className="mt-auto flex h-4 items-center gap-2">
        <div className="relative h-4 min-w-0 flex-1 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={line.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={cn("truncate whitespace-nowrap text-[11px] leading-4 font-medium tabular", line.tone)}
            >
              {line.text}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 text-[10px] text-tertiary">
          {f ? null : (["in-house", "busy", "home"] as Presence[]).map((k) => (
            <span key={k} className="flex items-center gap-1 whitespace-nowrap">
              <span className="size-1.5 rounded-full" style={{ background: k === "home" ? "var(--ant-color-text-tertiary)" : RING[k] }} />
              {LABEL[k]}
            </span>
          ))}
          {acked ? (
            <span className="whitespace-nowrap font-semibold text-ios-green">
              <AnimatedNumber value={acked} /> ack
            </span>
          ) : null}
        </div>
      </div>
    </Widget>
  );
}
