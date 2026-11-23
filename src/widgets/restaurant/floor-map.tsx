import { TableSimple20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Status = "seated" | "check" | "open" | "reserved" | "dirty";
type Shape = "round" | "square" | "booth";
type Table = {
  id: string;
  shape: Shape;
  x: number;
  y: number;
  seats: number;
  status: Status;
  covers?: number;
  mins?: number;
  course?: string;
  server?: string;
  at?: string;
};

const TURN: Record<Shape, number> = { round: 60, square: 75, booth: 90 };
const STATUS: Record<Status, { label: string; color: string; text: string }> = {
  seated: { label: "Seated", color: "var(--ios-blue)", text: "text-ios-blue" },
  check: { label: "Check dropped", color: "var(--ios-purple)", text: "text-ios-purple" },
  open: { label: "Open", color: "var(--ios-green)", text: "text-ios-green" },
  reserved: { label: "Reserved", color: "var(--ios-indigo)", text: "text-ios-indigo" },
  dirty: { label: "Needs bussing", color: "var(--ios-orange)", text: "text-ios-orange" },
};
const OVER = { color: "var(--ios-red)", text: "text-ios-red" };

const TABLES: Table[] = [
  { id: "1", shape: "round", x: 26, y: 22, seats: 2, status: "seated", covers: 2, mins: 34, course: "Mains", server: "Ava Morales" },
  { id: "2", shape: "round", x: 64, y: 22, seats: 2, status: "open" },
  { id: "3", shape: "round", x: 102, y: 22, seats: 2, status: "reserved", covers: 2, at: "19:30" },
  { id: "4", shape: "round", x: 140, y: 22, seats: 2, status: "check", covers: 2, mins: 61, course: "Paying", server: "Ava Morales" },
  { id: "5", shape: "square", x: 30, y: 66, seats: 4, status: "seated", covers: 4, mins: 56, course: "Mains", server: "Liam Foster" },
  { id: "6", shape: "square", x: 80, y: 66, seats: 4, status: "dirty" },
  { id: "7", shape: "square", x: 130, y: 66, seats: 4, status: "seated", covers: 3, mins: 22, course: "Starters", server: "Liam Foster" },
  { id: "10", shape: "booth", x: 198, y: 24, seats: 6, status: "seated", covers: 6, mins: 108, course: "Dessert", server: "Nadia Rahman" },
  { id: "11", shape: "booth", x: 198, y: 66, seats: 6, status: "seated", covers: 5, mins: 41, course: "Mains", server: "Nadia Rahman" },
  { id: "12", shape: "booth", x: 198, y: 108, seats: 6, status: "reserved", covers: 6, at: "20:00" },
];
const SIZE: Record<Shape, { w: number; h: number; r: number }> = {
  round: { w: 20, h: 20, r: 10 },
  square: { w: 24, h: 24, r: 5 },
  booth: { w: 36, h: 20, r: 5 },
};

/** Seat dots around a table, in table-local coordinates. */
function seatsFor(shape: Shape): [number, number][] {
  if (shape === "round") return [[-15, 0], [15, 0]];
  if (shape === "square") return [[0, -17], [17, 0], [0, 17], [-17, 0]];
  return [[-12, -15], [0, -15], [12, -15], [-12, 15], [0, 15], [12, 15]];
}

const dur = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);
const over = (t: Table) => t.mins !== undefined && t.mins > TURN[t.shape];

/** Restaurant · medium. The dining room as a floor plan with seated covers and turn progress; hover a table to read its covers, course, server and time. */
export function FloorMapWidget({ index }: { index?: number }) {
  const [tables, setTables] = useState(TABLES);
  const [sel, setSel] = useState("10");
  const delay = 0.3 + (index ?? 0) * 0.06;

  // The room keeps eating: every few seconds a minute passes at every seated table.
  useEffect(() => {
    const t = window.setInterval(
      () => setTables((ts) => ts.map((x) => (x.mins !== undefined ? { ...x, mins: x.mins + 1 } : x))),
      4000,
    );
    return () => window.clearInterval(t);
  }, []);

  const t = tables.find((x) => x.id === sel) ?? tables[0];
  const seated = tables.reduce((a, x) => a + (x.mins !== undefined ? x.covers ?? 0 : 0), 0);
  const open = tables.filter((x) => x.status === "open").length;
  const st = STATUS[t.status];
  const isOver = over(t);

  return (
    <Widget size="medium" index={index} label="Dining room floor plan">
      <WidgetHeader
        icon={<TableSimple20Filled />}
        tint="var(--ios-blue)"
        title="Floor · Dining Room"
        subtitle={`${seated} covers seated · ${open} open · 2 booked`}
        extra={
          <span className="rounded-full bg-ios-red/15 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-ios-red">
            <AnimatedNumber value={tables.filter(over).length} /> over turn
          </span>
        }
      />

      <div className="mt-2 flex min-h-0 flex-1 gap-2.5">
        <svg viewBox="0 0 228 128" className="h-[124px] w-[221px] shrink-0 self-center">
          <rect x="1" y="1" width="226" height="126" rx="10" fill="none" strokeWidth="1.5" className="stroke-fill" />
          {/* Bar and entrance. */}
          <rect x="10" y="100" width="146" height="18" rx="4" className="fill-fill-tertiary" />
          <text x="83" y="112.5" textAnchor="middle" fontSize="9" className="fill-[var(--ant-color-text-tertiary)]">
            Bar
          </text>
          <line x1="227" y1="86" x2="227" y2="94" strokeWidth="3" className="stroke-[var(--widget-surface)]" />

          {tables.map((tb, i) => {
            const s = SIZE[tb.shape];
            const meta = STATUS[tb.status];
            const late = over(tb);
            const color = late ? OVER.color : meta.color;
            const on = tb.id === sel;
            const filled = tb.mins !== undefined ? tb.covers ?? 0 : 0;
            const pct = tb.mins !== undefined ? Math.min(1, tb.mins / TURN[tb.shape]) : 0;
            return (
              <motion.g
                key={tb.id}
                role="button"
                aria-label={`Table ${tb.id}, ${meta.label}`}
                className="cursor-pointer"
                onPointerEnter={() => setSel(tb.id)}
                onClick={() => setSel(tb.id)}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: on ? 1.08 : 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 22, delay: on ? 0 : delay + i * 0.04 }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              >
                {seatsFor(tb.shape).map(([dx, dy], j) => (
                  <circle
                    key={j}
                    cx={tb.x + dx}
                    cy={tb.y + dy}
                    r={3}
                    fill={j < filled ? color : "none"}
                    stroke={color}
                    strokeOpacity={j < filled ? 1 : 0.45}
                    strokeWidth={1}
                  />
                ))}
                <rect
                  x={tb.x - s.w / 2}
                  y={tb.y - s.h / 2}
                  width={s.w}
                  height={s.h}
                  rx={s.r}
                  fill={color}
                  fillOpacity={tb.status === "open" ? 0.08 : 0.22}
                  stroke={color}
                  strokeWidth={on ? 2 : 1.2}
                  strokeDasharray={tb.status === "reserved" ? "3 2" : undefined}
                />
                {tb.mins !== undefined ? (
                  <rect
                    x={tb.x - s.w / 2 + 3}
                    y={tb.y + s.h / 2 - 4.5}
                    width={(s.w - 6) * pct}
                    height={2}
                    rx={1}
                    fill={color}
                  />
                ) : null}
                <text
                  x={tb.x}
                  y={tb.y + 3}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="600"
                  className="pointer-events-none fill-[var(--ant-color-text-heading)]"
                >
                  {tb.id}
                </text>
                {late ? (
                  <motion.rect
                    x={tb.x - s.w / 2 - 2}
                    y={tb.y - s.h / 2 - 2}
                    width={s.w + 4}
                    height={s.h + 4}
                    rx={s.r + 2}
                    fill="none"
                    stroke={OVER.color}
                    strokeWidth={1.5}
                    animate={{ opacity: [0.9, 0, 0.9] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  />
                ) : null}
              </motion.g>
            );
          })}
        </svg>

        <div className="relative min-w-0 flex-1">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={t.id}
              className="absolute inset-0 flex flex-col"
              initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-baseline gap-1.5">
                <span className="text-[15px] font-semibold text-heading">Table {t.id}</span>
                <span className="text-[11px] text-tertiary">· {t.seats}-top</span>
              </div>
              <div className={cn("truncate text-[11px] font-semibold", isOver ? OVER.text : st.text)}>
                {isOver ? "Over turn time" : st.label}
                {t.at ? ` · ${t.at}` : ""}
              </div>

              {t.mins !== undefined ? (
                <>
                  <div className="mt-1.5 flex items-baseline gap-1 leading-none whitespace-nowrap">
                    <span className={cn("text-[24px] font-semibold tracking-tight", isOver ? "text-ios-red" : "text-heading")}>
                      {t.mins >= 60 ? (
                        <>
                          <AnimatedNumber value={Math.floor(t.mins / 60)} />
                          <span className="text-[12px] font-medium text-tertiary">h </span>
                        </>
                      ) : null}
                      <AnimatedNumber value={t.mins % 60} />
                      <span className="text-[12px] font-medium text-tertiary">m</span>
                    </span>
                  </div>
                  <div className="mt-1 truncate text-[11px] text-tertiary">
                    {t.covers} covers · {t.course} · turn {dur(TURN[t.shape])}
                  </div>
                </>
              ) : (
                <div className="mt-1.5 text-[11px] leading-snug text-tertiary">
                  {t.status === "open"
                    ? "Ready to seat. Next on the waitlist: party of 2, 12 min."
                    : t.status === "dirty"
                      ? "Party left 4 min ago. Reset before the 19:45 walk-in."
                      : `Party of ${t.covers} booked, holding the table.`}
                </div>
              )}

              {t.server ? (
                <div className="mt-auto flex items-center gap-1.5">
                  <MemojiAvatar who={t.server} size={22} />
                  <div className="min-w-0 leading-tight">
                    <div className="truncate text-[11px] font-semibold text-secondary">{t.server}</div>
                    <div className="text-[10px] text-tertiary">Server · Section B</div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Widget>
  );
}
