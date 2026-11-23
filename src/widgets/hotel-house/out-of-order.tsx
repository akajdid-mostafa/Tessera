import { CheckmarkCircle16Filled, Clock12Regular, Wrench20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Ticket = { room: string; type: string; reason: string; tech: string; fix: string; rate: number };
/* Rooms pulled from sale at Seabright Villas, with tonight's best rate they can't earn. */
const TICKETS: Ticket[] = [
  { room: "209", type: "Standard Twin", reason: "Water leak", tech: "Carlos Diaz", fix: "fix by 14:30", rate: 275 },
  { room: "104", type: "Single Room", reason: "Broken AC", tech: "Brad Owens", fix: "part due Fri", rate: 210 },
];
const CONFIRM_MS = 3000;
const USD = { maximumFractionDigits: 0 } as const;

/** Housekeeping · small. Rooms out of order with their fault, technician and the rate lost tonight; tap to page tickets, and a two-step Return to service puts a room back on sale. */
export function OutOfOrderWidget({ index }: { index?: number }) {
  const [open, setOpen] = useState(TICKETS);
  const [page, setPage] = useState(0);
  const [arming, setArming] = useState(false);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const t = open[Math.min(page, open.length - 1)];
  const lost = open.reduce((s, x) => s + x.rate, 0);

  // An armed button disarms itself if the second tap never comes.
  useEffect(() => {
    if (!arming) return;
    const id = window.setTimeout(() => setArming(false), CONFIRM_MS);
    return () => window.clearTimeout(id);
  }, [arming]);

  const press = () => {
    if (!t) return;
    if (!arming) {
      setArming(true);
      return;
    }
    setArming(false);
    setOpen((list) => list.filter((x) => x.room !== t.room));
    setPage(0);
  };

  return (
    <Widget size="small" index={index} label="Rooms out of order">
      <WidgetHeader
        icon={<Wrench20Filled />}
        tint={open.length ? "var(--ios-red)" : "var(--ios-green)"}
        title="Out of Order"
        subtitle={
          <>
            <AnimatedNumber value={open.length} /> out · $<AnimatedNumber value={lost} format={USD} />
          </>
        }
        extra={
          open.length > 1 ? (
            <div className="flex gap-1 pt-1.5">
              {open.map((x, i) => (
                <span key={x.room} className={cn("size-1.5 rounded-full", i === page ? "bg-ios-red" : "bg-fill")} />
              ))}
            </div>
          ) : null
        }
      />

      <AnimatePresence mode="wait" initial={false}>
        {t ? (
          <motion.button
            type="button"
            key={t.room}
            onClick={() => {
              setPage((p) => (p + 1) % open.length);
              setArming(false);
            }}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="mt-2 flex cursor-pointer flex-col text-left"
            aria-label={`Room ${t.room}, ${t.reason}. Next ticket`}
          >
            <div className="flex items-center gap-2">
              <span className="relative text-[26px] leading-none font-semibold tracking-tight text-heading tabular">
                {t.room}
                <motion.span
                  className="absolute -top-0.5 -right-2 size-1.5 rounded-full bg-ios-red"
                  animate={{ opacity: [1, 0.25, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay }}
                />
              </span>
              <div className="ml-1.5 min-w-0 leading-tight">
                <div className="truncate text-[12px] font-semibold text-ios-red">{t.reason}</div>
                <div className="truncate text-[10px] text-tertiary">{t.type}</div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5 whitespace-nowrap">
              <MemojiAvatar who={t.tech} size={18} />
              <span className="truncate text-[11px] text-secondary">{t.tech.split(" ")[0]}</span>
              <span className="flex items-center gap-0.5 text-[11px] text-tertiary">
                <Clock12Regular className="size-3" />
                {t.fix}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-tertiary">
              <span className="font-semibold text-secondary tabular">−${t.rate.toLocaleString("en-US")}</span> tonight
            </div>
          </motion.button>
        ) : (
          <motion.div
            key="clear"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="flex flex-1 flex-col items-center justify-center gap-1"
          >
            <motion.span
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 16, delay: 0.1 }}
              className="text-ios-green"
            >
              <CheckmarkCircle16Filled className="size-9" />
            </motion.span>
            <span className="text-[12px] font-semibold text-heading">All rooms in service</span>
          </motion.div>
        )}
      </AnimatePresence>

      {t ? (
        <motion.button
          type="button"
          onClick={press}
          whileTap={{ scale: 0.96 }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 26, delay: delay + 0.15 }}
          className={cn(
            "relative mt-auto h-7 w-full cursor-pointer overflow-hidden rounded-[9px] text-[12px] font-semibold transition-colors",
            arming ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-tertiary text-heading hover:bg-fill-secondary",
          )}
        >
          {arming ? (
            <motion.span
              aria-hidden
              className="absolute inset-y-0 left-0 bg-black/15"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: CONFIRM_MS / 1000, ease: "linear" }}
            />
          ) : null}
          <span className="relative">{arming ? `Confirm · room ${t.room}` : "Return to service"}</span>
        </motion.button>
      ) : null}
    </Widget>
  );
}
