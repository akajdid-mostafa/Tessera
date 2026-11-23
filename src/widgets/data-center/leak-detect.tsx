import { Drop20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type State = "alarm" | "acked" | "dry";

/** The sensing cable's route under the raised floor, in drawing units. */
const ROUTE: [number, number][] = [
  [8, 54],
  [8, 8],
  [56, 8],
  [56, 40],
  [108, 40],
  [108, 8],
  [156, 8],
  [156, 54],
];
const CABLE_M = 64;
const SEGS = ROUTE.slice(1).map((p, i) => Math.hypot(p[0] - ROUTE[i][0], p[1] - ROUTE[i][1]));
const TOTAL = SEGS.reduce((s, l) => s + l, 0);
const D = ROUTE.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ");

function pointAt(len: number) {
  let left = len;
  for (let i = 0; i < SEGS.length; i++) {
    if (left <= SEGS[i]) {
      const t = left / SEGS[i];
      return [ROUTE[i][0] + (ROUTE[i + 1][0] - ROUTE[i][0]) * t, ROUTE[i][1] + (ROUTE[i + 1][1] - ROUTE[i][1]) * t];
    }
    left -= SEGS[i];
  }
  return ROUTE[ROUTE.length - 1];
}

const LEAKS = [
  { m: 23.4, where: "under CRAH-2" },
  { m: 51.7, where: "at CHW riser" },
];
const DISPATCH_S = 9;
const DRY_S = 16;
const ONE_DP = { minimumFractionDigits: 1, maximumFractionDigits: 1 } as const;

/** Data center · small. A rope leak-detection cable under the raised floor; the wet spot ripples until acknowledged, a technician is dispatched and the cable reads dry again. */
export function LeakDetectWidget({ index }: { index?: number }) {
  const [state, setState] = useState<State>("alarm");
  const [leak, setLeak] = useState(0);
  const [left, setLeft] = useState(DISPATCH_S);

  useEffect(() => {
    if (state === "acked") {
      setLeft(DISPATCH_S);
      const t = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
      const done = window.setTimeout(() => setState("dry"), DISPATCH_S * 1000);
      return () => {
        window.clearInterval(t);
        window.clearTimeout(done);
      };
    }
    if (state === "dry") {
      const t = window.setTimeout(() => {
        setLeak((l) => (l + 1) % LEAKS.length);
        setState("alarm");
      }, DRY_S * 1000);
      return () => window.clearTimeout(t);
    }
  }, [state]);

  const L = LEAKS[leak];
  const at = (L.m / CABLE_M) * TOTAL;
  const [px, py] = pointAt(at);
  const wet = state !== "dry";
  const alarm = state === "alarm";
  const delay = 0.3 + (index ?? 0) * 0.06;

  return (
    <Widget
      size="small"
      index={index}
      label="Leak detection"
      glow={{ mode: "pulse", colors: ["#FF453A", "#FF9F0A", "#FF453A"], blur: 16, duration: 1.4 }}
      glowActive={alarm}
    >
      <WidgetHeader
        icon={<Drop20Filled />}
        tint={wet ? "var(--ios-red)" : "var(--ios-blue)"}
        title="Leak Detection"
        subtitle="Hall 2 · 64 m cable"
      />

      <svg viewBox="0 0 164 62" className="mt-1 block h-[62px] w-full overflow-visible" aria-label="Leak cable route">
        <rect x={0.5} y={0.5} width={163} height={61} rx={8} fill="none" strokeDasharray="3 3" strokeWidth={1} className="stroke-split" />
        <rect x={14} y={15} width={36} height={18} rx={4} className="fill-fill-tertiary" />
        <text x={32} y={27} textAnchor="middle" className="fill-tertiary text-[9px] font-semibold">
          CRAH-2
        </text>
        <circle cx={140} cy={26} r={6} className="fill-fill-tertiary" />
        <text x={140} y={46} textAnchor="middle" className="fill-tertiary text-[9px] font-semibold">
          CHW
        </text>
        <text x={82} y={26} textAnchor="middle" className="fill-tertiary text-[9px]">
          Row C
        </text>

        <motion.path
          d={D}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-fill"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: "easeInOut", delay }}
        />
        {/* A sense pulse travels the cable once every few seconds. */}
        <motion.path
          d={D}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`10 ${TOTAL}`}
          className="stroke-secondary"
          initial={{ strokeDashoffset: 10 }}
          animate={{ strokeDashoffset: [10, -TOTAL] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: delay + 1.1 }}
        />
        <AnimatePresence>
          {wet ? (
            <motion.g key={leak} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <path
                d={D}
                fill="none"
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray={`0 ${at - 10} 20 ${TOTAL}`}
                className="stroke-ios-red"
              />
              {alarm
                ? [0, 0.7].map((d) => (
                    <motion.circle
                      key={d}
                      cx={px}
                      cy={py}
                      r={4}
                      fill="none"
                      strokeWidth={1.5}
                      className="stroke-ios-red"
                      initial={{ scale: 0.6, opacity: 0.9 }}
                      animate={{ scale: 3.2, opacity: 0 }}
                      style={{ transformBox: "fill-box", transformOrigin: "center" }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut", delay: d }}
                    />
                  ))
                : null}
              <circle cx={px} cy={py} r={3.5} className="fill-ios-red" />
            </motion.g>
          ) : null}
        </AnimatePresence>
      </svg>

      <div className="relative mt-1.5 h-[26px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={wet ? `wet-${leak}` : "dry"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex h-full items-baseline gap-1.5 whitespace-nowrap"
          >
            {wet ? (
              <>
                <span className="text-[22px] leading-none font-semibold tracking-tight text-ios-red">
                  <AnimatedNumber value={L.m} format={ONE_DP} />
                  <span className="text-[12px] font-medium"> m</span>
                </span>
                <span className="min-w-0 truncate text-[11px] text-tertiary">{L.where}</span>
              </>
            ) : (
              <>
                <span className="text-[22px] leading-none font-semibold tracking-tight text-heading">Dry</span>
                <span className="min-w-0 truncate text-[11px] text-tertiary">0 of 64 m wet</span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-auto h-[26px]">
        <AnimatePresence mode="popLayout" initial={false}>
          {alarm ? (
            <motion.button
              key="ack"
              type="button"
              onClick={() => setState("acked")}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileTap={{ scale: 0.94 }}
              className="h-[26px] w-full cursor-pointer rounded-full bg-ios-red text-[11px] font-semibold text-white outline-none hover:bg-ios-red/85"
            >
              Acknowledge
            </motion.button>
          ) : (
            <motion.div
              key={state}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={cn("flex h-[26px] items-center gap-1.5 text-[11px] whitespace-nowrap text-tertiary")}
            >
              {state === "acked" ? (
                <>
                  <MemojiAvatar who="f7" size={22} alt="Leila Haddad" />
                  <span className="min-w-0 truncate">
                    <span className="font-semibold text-heading">Leila H.</span> · ETA{" "}
                    <span className="font-semibold text-secondary tabular">0:{String(left).padStart(2, "0")}</span>
                  </span>
                </>
              ) : (
                <>
                  <span className="size-1.5 rounded-full bg-ios-green" />
                  Cleared · floor dried
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Widget>
  );
}
