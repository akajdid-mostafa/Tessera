import { ArrowUndo16Regular, Broom20Filled, Flag16Filled } from "@fluentui/react-icons";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { HK, HK_ORDER, type HkStatus, tint } from "./_parts-a";

type Room = { no: string; status: HkStatus; by: string; priority?: boolean; why?: string };

/* Floors 1–3 at Seabright Villas this morning. Priority rooms have a guest waiting on them. */
const ROOMS: Room[] = [
  { no: "110", status: "dirty", by: "Ashley King", priority: true, why: "Anna Schmidt arrives 14:00" },
  { no: "205", status: "dirty", by: "Mike Daniels", priority: true, why: "Early check-in 12:30" },
  { no: "106", status: "dirty", by: "Ashley King" },
  { no: "112", status: "dirty", by: "Ashley King" },
  { no: "118", status: "dirty", by: "Rosa Martinez" },
  { no: "219", status: "dirty", by: "Mike Daniels" },
  { no: "218", status: "pickup", by: "Ellen Shaw", priority: true, why: "Guest back at 13:00" },
  { no: "108", status: "pickup", by: "Rosa Martinez" },
  { no: "313", status: "pickup", by: "Ellen Shaw" },
  { no: "102", status: "clean", by: "Ashley King" },
  { no: "117", status: "clean", by: "Rosa Martinez" },
  { no: "214", status: "clean", by: "Mike Daniels" },
  { no: "115", status: "inspected", by: "Rosa Martinez" },
  { no: "204", status: "inspected", by: "Mike Daniels" },
  { no: "319", status: "inspected", by: "Ellen Shaw" },
];
const SLOTS = 4;
const SUPERVISOR_TICK = 9000;

type Toast = { id: number; no: string; from: HkStatus; to: HkStatus };

/** Priority first, then by room number. */
const order = (a: Room, b: Room) => Number(!!b.priority) - Number(!!a.priority) || a.no.localeCompare(b.no);

/** Housekeeping · medium. The day's rooms as a four-column flow; tap or swipe a chip on, undo within 5 s, a supervisor inspects live. */
export function HousekeepingFlowWidget({ index }: { index?: number }) {
  const uid = useId();
  const [rooms, setRooms] = useState(ROOMS);
  const [toast, setToast] = useState<Toast | null>(null);
  const [touched, setTouched] = useState(false);
  const dragged = useRef(false);
  const delay = 0.3 + (index ?? 0) * 0.06;

  const ready = rooms.filter((r) => r.status === "clean" || r.status === "inspected").length;

  // The undo window: the toast leaves after five seconds.
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Live: turns alternate between a housekeeper finishing a pickup and the supervisor
  // inspecting a clean room. Neither empties its column, so every stage stays populated.
  useEffect(() => {
    let turn = 0;
    const t = window.setInterval(() => {
      const [from, to]: [HkStatus, HkStatus] = turn++ % 2 === 0 ? ["pickup", "clean"] : ["clean", "inspected"];
      setRooms((rs) => {
        const col = rs.filter((r) => r.status === from);
        if (col.length <= 2) return rs;
        const next = col[0];
        return rs.map((r) => (r === next ? { ...r, status: to } : r));
      });
    }, SUPERVISOR_TICK);
    return () => window.clearInterval(t);
  }, []);

  const advance = (no: string) => {
    const room = rooms.find((r) => r.no === no);
    if (!room) return;
    const at = HK_ORDER.indexOf(room.status);
    if (at >= HK_ORDER.length - 1) return;
    const to = HK_ORDER[at + 1];
    const id = Date.now();
    setTouched(true);
    setRooms((rs) => rs.map((r) => (r.no === no ? { ...r, status: to } : r)));
    setToast({ id, no, from: room.status, to });
  };

  const undo = () => {
    if (!toast) return;
    const { no, from } = toast;
    setRooms((rs) => rs.map((r) => (r.no === no ? { ...r, status: from } : r)));
    setToast(null);
  };

  return (
    <Widget size="medium" index={index} label="Housekeeping flow">
      <div className="relative h-7 shrink-0">
        <AnimatePresence mode="popLayout" initial={false}>
          {toast ? (
            <motion.div
              key={`toast-${toast.id}`}
              className="absolute inset-0 flex items-center gap-2 overflow-hidden rounded-full bg-fill-secondary pr-1 pl-3"
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96, transition: { duration: 0.18 } }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
            >
              <span className="size-2 shrink-0 rounded-full" style={{ background: HK[toast.to].color }} />
              <span className="min-w-0 flex-1 truncate text-[12px] text-secondary">
                Room <span className="font-semibold text-heading tabular">{toast.no}</span> moved to{" "}
                <span className={cn("font-semibold", HK[toast.to].text)}>{HK[toast.to].label}</span>
              </span>
              <motion.button
                type="button"
                onClick={undo}
                whileTap={{ scale: 0.92 }}
                className="flex h-5 shrink-0 cursor-pointer items-center gap-1 rounded-full bg-fill-tertiary px-2 text-[11px] font-semibold text-ios-blue"
              >
                <ArrowUndo16Regular className="size-3" />
                Undo
              </motion.button>
              <motion.span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-ios-blue"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 5, ease: "linear" }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="header"
              className="absolute inset-0"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
            >
              <WidgetHeader
                icon={<Broom20Filled />}
                tint="var(--ios-mint)"
                title="Housekeeping Flow"
                subtitle="Seabright Villas · Floors 1–3"
                extra={
                  <div className="flex shrink-0 items-baseline gap-1 pt-0.5 whitespace-nowrap">
                    <AnimatedNumber value={ready} className="text-[15px] font-semibold text-heading" />
                    <span className="text-[11px] text-tertiary">/{rooms.length} ready</span>
                  </div>
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <LayoutGroup id={uid}>
        <div className="mt-2 grid min-h-0 flex-1 grid-cols-4 gap-1.5">
          {HK_ORDER.map((status, ci) => {
            const st = HK[status];
            const col = rooms.filter((r) => r.status === status).sort(order);
            const overflow = col.length > SLOTS;
            const shown = overflow ? col.slice(0, SLOTS - 1) : col;
            const last = ci === HK_ORDER.length - 1;
            return (
              <div key={status} className="flex min-w-0 flex-col gap-1">
                <div className="flex h-[18px] items-center gap-1 px-0.5">
                  <span className="size-1.5 shrink-0 rounded-full" style={{ background: st.color }} />
                  <span className="truncate text-[10px] font-medium text-tertiary">{st.label}</span>
                  <AnimatedNumber value={col.length} className="ml-auto text-[13px] font-semibold text-heading" />
                </div>
                <div className="flex flex-col gap-1">
                  {shown.map((room, i) => (
                    <Tooltip
                      key={room.no}
                      title={`${room.why ? `${room.why} · ` : ""}${room.by}${last ? "" : ` · tap or swipe to ${HK[HK_ORDER[ci + 1]].label}`}`}
                    >
                      <motion.button
                        type="button"
                        layoutId={`hk-${room.no}`}
                        aria-label={`Room ${room.no}, ${st.label}${room.priority ? ", priority" : ""}`}
                        drag={last ? false : "x"}
                        dragSnapToOrigin
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={{ left: 0.05, right: 0.6 }}
                        onDragStart={() => {
                          dragged.current = true;
                        }}
                        onDragEnd={(_, info) => {
                          if (info.offset.x > 26) advance(room.no);
                        }}
                        onClick={() => {
                          if (dragged.current) {
                            dragged.current = false;
                            return;
                          }
                          advance(room.no);
                        }}
                        className={cn(
                          "relative flex h-[22px] w-full min-w-0 items-center gap-1 rounded-[7px] pr-[3px] pl-1.5 text-left",
                          last ? "cursor-default" : "cursor-grab touch-pan-y active:cursor-grabbing",
                        )}
                        style={{ backgroundColor: tint(st.color, 16) }}
                        initial={touched ? false : { opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={last ? undefined : { scale: 1.04 }}
                        whileTap={last ? undefined : { scale: 0.94 }}
                        transition={{
                          type: "spring",
                          stiffness: 460,
                          damping: 30,
                          delay: touched ? 0 : delay + ci * 0.08 + i * 0.05,
                        }}
                      >
                        {room.priority ? (
                          <Flag16Filled className="size-2.5 shrink-0 text-ios-red" />
                        ) : (
                          <st.Glyph className={cn("size-2.5 shrink-0", st.text)} />
                        )}
                        <span className="text-[11px] font-semibold text-heading tabular">{room.no}</span>
                        <MemojiAvatar who={room.by} size={16} className="ml-auto" />
                      </motion.button>
                    </Tooltip>
                  ))}
                  {overflow ? (
                    <Tooltip title={col.slice(SLOTS - 1).map((r) => r.no).join(", ")}>
                      <motion.span
                        layout
                        className="grid h-[22px] place-items-center rounded-[7px] bg-fill-quaternary text-[10px] font-medium text-tertiary tabular"
                      >
                        +{col.length - shown.length} more
                      </motion.span>
                    </Tooltip>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </LayoutGroup>
    </Widget>
  );
}
