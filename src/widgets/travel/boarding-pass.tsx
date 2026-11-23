import { Airplane20Filled, Timer16Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const STUB = 76;
const TWO = { minimumIntegerDigits: 2 } as const;
const FACE = "absolute inset-0 flex [backface-visibility:hidden] [-webkit-backface-visibility:hidden]";

/** A fixed barcode, from a small LCG so every render draws the same bars. */
function bars(count: number, seed: number) {
  let n = seed;
  const rnd = () => {
    n = (n * 1103515245 + 12345) % 2147483648;
    return n / 2147483648;
  };
  const out: { x: number; w: number }[] = [];
  let x = 0;
  for (let i = 0; i < count; i++) {
    const w = 1 + Math.floor(rnd() * 3);
    out.push({ x, w });
    x += w + 1 + Math.floor(rnd() * 2);
  }
  return { out, width: x };
}
const SMALL = bars(22, 7);
const LARGE = bars(64, 19);

function Barcode({ data, className, delay = 0 }: { data: ReturnType<typeof bars>; className?: string; delay?: number }) {
  return (
    <svg viewBox={`0 0 ${data.width} 40`} preserveAspectRatio="none" className={cn("text-heading", className)} aria-hidden>
      {data.out.map((b, i) => (
        <motion.rect
          key={i}
          x={b.x}
          y="0"
          width={b.w}
          height="40"
          fill="currentColor"
          style={{ originY: 1 }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: delay + i * 0.01, type: "spring", stiffness: 300, damping: 24 }}
        />
      ))}
    </svg>
  );
}

/** Ticket notches, cut into the widget's top and bottom edges at the perforation. */
function Notches({ side }: { side: "left" | "right" }) {
  const pos = { [side]: STUB - 9 } as const;
  return (
    <>
      <span aria-hidden className="absolute -top-[25px] size-[18px] rounded-full bg-widget-page" style={pos} />
      <span aria-hidden className="absolute -bottom-[25px] size-[18px] rounded-full bg-widget-page" style={pos} />
      <span
        aria-hidden
        className="absolute -top-[7px] -bottom-[7px] border-l-[1.5px] border-dashed border-split"
        style={{ [side]: STUB }}
      />
    </>
  );
}

/** Travel · medium. A boarding pass with a live boarding countdown; tap flips it to the scannable side. */
export function BoardingPassWidget({ index }: { index?: number }) {
  const [flipped, setFlipped] = useState(false);
  const [left, setLeft] = useState(42 * 60 + 10);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, []);

  const m = Math.floor(left / 60);
  const s = left % 60;
  const soon = left < 15 * 60;

  return (
    <Widget
      size="medium"
      index={index}
      label="Boarding pass"
      pressable
      onPress={() => setFlipped((f) => !f)}
    >
      <div className="relative flex-1 [perspective:900px]">
        <motion.div
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 20 }}
        >
          {/* Front */}
          <div className={FACE}>
            <Notches side="right" />
            <div className="flex min-w-0 flex-1 flex-col pr-3">
              <div className="flex items-center gap-2">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ios-red text-[15px] text-white">
                  <Airplane20Filled />
                </span>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-[13px] font-semibold text-heading">AX 1979</div>
                  <div className="truncate text-[11px] text-tertiary">Sat, Nov 14 · Economy</div>
                </div>
                <span
                  className={cn(
                    "flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors duration-mid",
                    soon ? "bg-ios-orange/15 text-ios-orange" : "bg-ios-green/15 text-ios-green",
                  )}
                >
                  {left === 0 ? (
                    "Boarding"
                  ) : (
                    <>
                      <Timer16Regular className="size-3.5" />
                      Boards in
                      <span>
                        <AnimatedNumber value={m} format={TWO} trend={-1} />:
                        <AnimatedNumber value={s} format={TWO} trend={-1} />
                      </span>
                    </>
                  )}
                </span>
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <div className="leading-none">
                  <div className="text-[28px] font-semibold tracking-tight text-heading">JFK</div>
                  <div className="mt-1 text-[10px] text-tertiary">New York</div>
                </div>
                <div className="relative flex h-[22px] flex-1 items-center">
                  <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="h-1 w-full" aria-hidden>
                    <motion.line
                      x1="0"
                      y1="2"
                      x2="100"
                      y2="2"
                      strokeWidth="2"
                      strokeDasharray="3 3"
                      vectorEffect="non-scaling-stroke"
                      className="stroke-[var(--ant-color-text-tertiary)]"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </svg>
                  <motion.span
                    className="absolute top-1/2 grid size-[22px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-widget-surface text-[14px] text-ios-red"
                    initial={{ left: "0%", opacity: 0 }}
                    animate={{ left: "50%", opacity: 1 }}
                    transition={{ delay, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Airplane20Filled />
                  </motion.span>
                  <span className="absolute top-[calc(100%+3px)] left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] leading-none text-tertiary tabular">
                    4h 05m
                  </span>
                </div>
                <div className="text-right leading-none">
                  <div className="text-[28px] font-semibold tracking-tight text-heading">LHR</div>
                  <div className="mt-1 text-[10px] text-tertiary">London</div>
                </div>
              </div>

              <div className="mt-auto grid grid-cols-4 gap-2 text-[11px] leading-tight">
                {[
                  ["Gate", "A7"],
                  ["Group", "2"],
                  ["Boards", "14:05"],
                  ["Departs", "14:35"],
                ].map(([k, v]) => (
                  <div key={k} className="min-w-0">
                    <div className="truncate text-tertiary">{k}</div>
                    <div className="text-[14px] font-semibold text-heading tabular">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex shrink-0 flex-col pl-3" style={{ width: STUB }}>
              <div className="text-[11px] leading-tight text-tertiary">Seat</div>
              <div className="text-[26px] leading-none font-semibold tracking-tight text-ios-red">14C</div>
              <Barcode data={SMALL} delay={delay + 0.3} className="mt-auto h-9 w-full" />
            </div>
          </div>

          {/* Back */}
          <div className={FACE} style={{ transform: "rotateY(180deg)" }}>
            <Notches side="left" />
            <div className="flex shrink-0 flex-col items-start pr-3" style={{ width: STUB }}>
              <MemojiAvatar who="m4" size={34} />
              <div className="mt-1.5 text-[11px] leading-tight text-tertiary">Passenger</div>
              <div className="text-[13px] leading-tight font-semibold text-heading">E. Kaplan</div>
              <div className="mt-auto text-[10px] text-tertiary tabular">SEQ 087</div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col pl-3">
              <div className="flex items-baseline justify-between text-[11px]">
                <span className="font-semibold text-heading">Scan at gate A7</span>
                <span className="text-tertiary tabular">PNR · TQ8K2L</span>
              </div>
              <div className="relative mt-2 flex-1 overflow-hidden rounded-lg bg-fill-quaternary px-2.5 py-2">
                {flipped ? <Barcode data={LARGE} className="h-full w-full" /> : null}
                <AnimatePresence>
                  {flipped ? (
                    <motion.span
                      aria-hidden
                      className="pointer-events-none absolute inset-0"
                      initial={{ y: "12%", opacity: 0 }}
                      animate={{ y: ["12%", "86%", "12%"], opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        y: { repeat: Infinity, duration: 2.4, ease: "easeInOut", delay: 0.4 },
                        opacity: { delay: 0.4 },
                      }}
                    >
                      <span className="absolute inset-x-1 top-0 h-[2px] rounded-full bg-ios-red shadow-[0_0_8px_var(--ios-red)]" />
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-tertiary tabular">
                <span>AX1979 JFK→LHR 14NOV</span>
                <span>14C · Y</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Widget>
  );
}
