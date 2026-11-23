import { CheckmarkCircle16Filled, ChatMultiple20Filled, Checkmark12Filled, Clock12Regular, PersonAdd16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { CHANNEL_LABEL, ChannelGlyph, clock, type Channel } from "./_parts-b";

type Conv = { id: number; name: string; channel: Channel; topic: string; since: number };

/** You, on the inbox (Ashley Sanders, sales at Kaibab Yonder Tours). */
const ME = "Ashley Sanders";
/** Past this the home page's waiting card turns orange. */
const LATE_S = 5 * 60;
const MAX_SHOWN = 4;

const SEED: Omit<Conv, "since" | "id">[] = [
  { name: "Jenna Bishop", channel: "whatsapp", topic: "Sedona on Saturday, 4 pax?" },
  { name: "Lukas Weber", channel: "email", topic: "Montezuma half-day, German guide" },
  { name: "Emma Hayes", channel: "instagram", topic: "Oak Creek cabin, 2 nights" },
  { name: "Henry Young", channel: "chat", topic: "Pickup from FLG at 23:40" },
  { name: "Molly Green", channel: "whatsapp", topic: "Rafting 13:00 slot left?" },
];
const WAITED = [276, 203, 141, 72, 18];

const POOL: Omit<Conv, "since" | "id">[] = [
  { name: "Adam Kline", channel: "chat", topic: "Grand Canyon day trip price" },
  { name: "Sophie Martin", channel: "email", topic: "Group of 18 in May" },
  { name: "Blake Shaw", channel: "instagram", topic: "Sedona balloon add-on" },
  { name: "Grace Ayers", channel: "whatsapp", topic: "Deposit by transfer?" },
];

/** Tour guest · small. The inbox's unassigned conversations with their channels; the longest wait ticks live and past five minutes the card pulses orange, and "Take it" hands the oldest to you, your memoji lands on it and the count rolls down. */
export function WaitingChatsWidget({ index }: { index?: number }) {
  const [now, setNow] = useState(() => Date.now());
  const [convs, setConvs] = useState<Conv[]>(() => {
    const t = Date.now();
    return SEED.map((c, i) => ({ ...c, id: i, since: t - WAITED[i] * 1000 }));
  });
  const [taking, setTaking] = useState<number | null>(null);
  const serial = useRef(SEED.length);
  const pool = useRef(0);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  // A new visitor writes in now and then.
  useEffect(() => {
    const t = window.setInterval(() => {
      const id = serial.current++;
      const next = POOL[pool.current++ % POOL.length];
      const at = Date.now();
      setConvs((list) => (list.length >= 7 ? list : [...list, { ...next, id, since: at }]));
    }, 13_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (taking === null) return;
    const t = window.setTimeout(() => {
      setConvs((list) => list.filter((c) => c.id !== taking));
      setTaking(null);
    }, 1300);
    return () => window.clearTimeout(t);
  }, [taking]);

  const sorted = [...convs].sort((a, b) => a.since - b.since);
  const oldest = sorted[0];
  const wait = oldest ? (now - oldest.since) / 1000 : 0;
  const late = !!oldest && wait >= LATE_S && taking === null;
  const shown = sorted.slice(0, MAX_SHOWN);
  const more = sorted.length - shown.length;
  const count = convs.length - (taking !== null ? 1 : 0);

  return (
    <Widget
      size="small"
      index={index}
      label="Waiting conversations"
      glow={{ colors: ["#FF9F0A", "#FFB340", "#FF6A00"], mode: "pulse", blur: 18, duration: 1.6 }}
      glowActive={late}
    >
      <AnimatePresence>
        {late ? (
          <motion.div
            key="pulse"
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-ios-orange"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.04, 0.16, 0.04] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : null}
      </AnimatePresence>

      <WidgetHeader
        icon={<ChatMultiple20Filled />}
        tint={late ? "var(--ios-orange)" : "var(--ios-blue)"}
        title="Waiting Chats"
        subtitle="Unassigned · Inbox"
      />

      <div className="relative mt-2 flex h-[36px] items-baseline-last justify-between">
        <div className="flex items-baseline gap-1">
          <AnimatedNumber value={count} className="text-[32px] leading-none font-semibold tracking-tight text-heading" />
          <span className="text-[11px] font-medium text-tertiary">waiting</span>
        </div>
        <div className="mb-1 flex items-center">
          <AnimatePresence initial={false} mode="popLayout">
            {shown.map((c, i) => (
              <motion.span
                key={c.id}
                layout
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: c.id === taking ? 0.35 : 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 26 }}
                className={cn("rounded-full ring-2 ring-[var(--widget-surface)]", i > 0 && "-ml-1.5")}
                style={{ zIndex: MAX_SHOWN - i }}
              >
                <ChannelGlyph channel={c.channel} size={18} />
              </motion.span>
            ))}
          </AnimatePresence>
          {more > 0 ? <span className="ml-1 text-[10px] font-semibold text-tertiary tabular">+{more}</span> : null}
        </div>
      </div>

      <div className="relative mt-2 h-[28px]">
        <AnimatePresence mode="popLayout" initial={false}>
          {oldest ? (
            <motion.div
              key={oldest.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 24, transition: { duration: 0.25 } }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="flex h-full items-center gap-2"
            >
              <Tooltip title={`${oldest.name} · ${CHANNEL_LABEL[oldest.channel]} — “${oldest.topic}”`}>
                <span className="relative shrink-0">
                  <MemojiAvatar who={oldest.name} size={26} alt={oldest.name} />
                  <ChannelGlyph channel={oldest.channel} size={12} className="absolute -right-1 -bottom-0.5 ring-2 ring-[var(--widget-surface)]" />
                  <AnimatePresence>
                    {taking === oldest.id ? (
                      <motion.span
                        key="me"
                        className="absolute top-0 left-4 rounded-full ring-2 ring-[var(--widget-surface)]"
                        initial={{ x: 40, scale: 0.4, opacity: 0 }}
                        animate={{ x: 0, scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 420, damping: 24 }}
                      >
                        <MemojiAvatar who={ME} size={26} alt={ME} />
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </span>
              </Tooltip>
              <div className={cn("min-w-0 flex-1 leading-tight transition-[padding]", taking === oldest.id && "pl-4")}>
                <div className="truncate text-[12px] font-semibold text-heading">{oldest.name}</div>
                <div
                  className={cn(
                    "flex items-center gap-0.5 text-[11px] whitespace-nowrap tabular",
                    taking === oldest.id ? "text-ios-green" : late ? "font-semibold text-ios-orange" : "text-tertiary",
                  )}
                >
                  {taking === oldest.id ? (
                    <>
                      <Checkmark12Filled /> Assigned to you
                    </>
                  ) : (
                    <>
                      <Clock12Regular /> {clock(wait)} waiting
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full items-center gap-1.5 text-[12px] font-medium text-ios-green"
            >
              <CheckmarkCircle16Filled /> All caught up
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-auto">
        <Button
          block
          type={late ? undefined : "primary"}
          color={late ? "orange" : undefined}
          variant={late ? "filled" : undefined}
          icon={taking !== null ? <Checkmark12Filled /> : <PersonAdd16Filled />}
          disabled={!oldest || taking !== null}
          onClick={() => oldest && setTaking(oldest.id)}
        >
          {taking !== null ? "Yours" : oldest ? "Take it" : "No one waiting"}
        </Button>
      </div>
    </Widget>
  );
}
