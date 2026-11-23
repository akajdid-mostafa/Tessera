import { ArrowUndo16Regular, Dismiss16Regular, Prohibited16Filled, Prohibited20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";

type Low = { id: string; name: string; station: string; left: number; par: number };
const LOW: Low[] = [
  { id: "rib", name: "Short Rib", station: "Grill", left: 4, par: 24 },
  { id: "hal", name: "Halibut", station: "Sauté", left: 2, par: 16 },
  { id: "bur", name: "Burrata", station: "Cold", left: 5, par: 20 },
];
const CONFIRM_MS = 4000;

/** Restaurant · small. Items running low with portions left; tap to page through them, 86 one with a timed confirm and it is struck from the menu, undo brings it back. */
export function EightySixWidget({ index }: { index?: number }) {
  const [items, setItems] = useState(LOW);
  const [i, setI] = useState(0);
  const [out, setOut] = useState<string[]>(["Oysters"]);
  const [confirm, setConfirm] = useState(false);
  const [touched, setTouched] = useState(false);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const it = items[i];
  const gone = out.includes(it.name);

  // Tickets keep firing: the first live item loses a portion every few seconds, down to its last one.
  useEffect(() => {
    const t = window.setInterval(() => {
      setItems((xs) => {
        const k = xs.findIndex((x) => x.left > 1 && !out.includes(x.name));
        return k < 0 ? xs : xs.map((x, j) => (j === k ? { ...x, left: x.left - 1 } : x));
      });
    }, 7000);
    return () => window.clearInterval(t);
  }, [out]);

  useEffect(() => {
    if (!confirm) return;
    const t = window.setTimeout(() => setConfirm(false), CONFIRM_MS);
    return () => window.clearTimeout(t);
  }, [confirm]);

  const pct = gone ? 0 : it.left / it.par;
  const critical = it.left <= 2;

  return (
    <Widget size="small" index={index} label="86 board">
      <WidgetHeader
        icon={<Prohibited20Filled />}
        tint="var(--ios-red)"
        title="86 Board"
        subtitle={
          <>
            <AnimatedNumber value={out.length} /> out · <AnimatedNumber value={items.filter((x) => !out.includes(x.name)).length} /> low
          </>
        }
      />

      <motion.button
        type="button"
        aria-label="Next low item"
        onClick={() => {
          setConfirm(false);
          setTouched(true);
          setI((n) => (n + 1) % items.length);
        }}
        whileTap={{ scale: 0.97 }}
        className="relative mt-1.5 -mx-1.5 cursor-pointer rounded-xl px-1.5 py-1 text-left transition-colors hover:bg-fill-quaternary"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={it.id}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
          >
            <div className="flex items-center justify-between text-[10px] text-tertiary">
              <span>{gone ? "86'd tonight" : "Running low"}</span>
              <span className="flex gap-0.5">
                {items.map((x, j) => (
                  <span key={x.id} className={cn("size-1 rounded-full", j === i ? "bg-ios-red" : "bg-fill")} />
                ))}
              </span>
            </div>
            <div className="relative">
              <div
                className={cn(
                  "truncate text-[18px] leading-tight font-semibold tracking-tight transition-colors",
                  gone ? "text-tertiary line-through" : "text-heading",
                )}
              >
                {it.name}
              </div>
              <AnimatePresence>
                {gone ? (
                  <motion.span
                    key="stamp"
                    className="absolute top-0 right-0 rounded-md border-2 border-ios-red px-1 text-[12px] leading-tight font-bold text-ios-red"
                    initial={{ scale: 2.2, rotate: -24, opacity: 0 }}
                    animate={{ scale: 1, rotate: -12, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 520, damping: 18 }}
                  >
                    86
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </div>
            <div className="mt-0.5 text-[11px] whitespace-nowrap text-tertiary">
              <AnimatedNumber
                value={gone ? 0 : it.left}
                className={cn("font-semibold", critical || gone ? "text-ios-red" : "text-ios-orange")}
              />{" "}
              of {it.par} portions · {it.station}
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-fill-secondary">
              <motion.div
                className={cn("h-full rounded-full", critical || gone ? "bg-ios-red" : "bg-ios-orange")}
                initial={{ width: 0 }}
                animate={{ width: `${pct * 100}%` }}
                transition={{ type: "spring", stiffness: 90, damping: 18, delay: touched ? 0.1 : delay }}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.button>

      <div className="mt-1 truncate text-[10.5px] text-tertiary">
        Out: <span className="text-secondary">{out.join(", ")}</span>
      </div>

      <div className="mt-auto">
        {gone ? (
          <Button
            block
            variant="filled"
            color="default"
            icon={<ArrowUndo16Regular />}
            onClick={() => setOut((o) => o.filter((x) => x !== it.name))}
          >
            Back on menu
          </Button>
        ) : confirm ? (
          <div className="flex gap-1.5">
            <Button
              shape="circle"
              variant="filled"
              color="default"
              icon={<Dismiss16Regular />}
              aria-label="Cancel"
              onClick={() => setConfirm(false)}
            />
            <Button
              block
              color="danger"
              variant="solid"
              className="relative overflow-hidden"
              onClick={() => {
                setOut((o) => [...o, it.name]);
                setConfirm(false);
              }}
            >
              Confirm 86
              <motion.span
                className="absolute bottom-0 left-0 h-[2px] bg-white/70"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: CONFIRM_MS / 1000, ease: "linear" }}
              />
            </Button>
          </div>
        ) : (
          <Button block variant="filled" color="danger" icon={<Prohibited16Filled />} onClick={() => setConfirm(true)}>
            <span className="truncate">86 {it.name}</span>
          </Button>
        )}
      </div>
    </Widget>
  );
}
