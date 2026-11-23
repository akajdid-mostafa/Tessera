import { Wifi120Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { walk } from "./_parts";

type Band = { band: string; channel: string; clients: number; own: number; neighbor: number };
const BANDS: Band[] = [
  { band: "5 GHz", channel: "Ch 36 · 80 MHz", clients: 34, own: 29, neighbor: 12 },
  { band: "2.4 GHz", channel: "Ch 6 · 20 MHz", clients: 9, own: 21, neighbor: 36 },
  { band: "6 GHz", channel: "Ch 37 · 160 MHz", clients: 7, own: 9, neighbor: 3 },
];
const CONGESTED = 60;

/** Network · small. An access point radiating rings at a pace set by its client count; tap to step through its radios, utilisation fills and turns amber past 60%. */
export function WifiApWidget({ index }: { index?: number }) {
  const [page, setPage] = useState(0);
  const [live, setLive] = useState(BANDS);

  useEffect(() => {
    const t = window.setInterval(() => {
      setLive((bs) =>
        bs.map((b, i) => ({
          ...b,
          clients: Math.round(walk(b.clients + (BANDS[i].clients - b.clients) * 0.3, 1.2, 1, 60)),
          own: Math.round(walk(b.own + (BANDS[i].own - b.own) * 0.3, 3, 2, 60)),
          neighbor: Math.round(walk(b.neighbor + (BANDS[i].neighbor - b.neighbor) * 0.3, 3, 1, 50)),
        })),
      );
    }, 2800);
    return () => window.clearInterval(t);
  }, []);

  const b = live[page];
  const util = b.own + b.neighbor;
  const busy = util > CONGESTED;
  // More clients, quicker rings: one ring every 0.9–3 s.
  const period = Math.max(0.9, 3 - b.clients / 18);
  const delay = 0.3 + (index ?? 0) * 0.06;

  return (
    <Widget size="small" index={index} label="Wi-Fi access point" pressable onPress={() => setPage((p) => (p + 1) % BANDS.length)}>
      <WidgetHeader icon={<Wifi120Filled />} tint="var(--ios-blue)" title="AP Lobby-2" subtitle="U7 Pro · Floor 1" />

      <div className="mt-2 flex items-center gap-2.5">
        <div className="relative grid size-[46px] shrink-0 place-items-center">
          {[0, 1, 2].map((k) => (
            <motion.span
              key={`${page}-${k}`}
              className="absolute inset-0 rounded-full border-[1.5px] border-ios-blue"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 1], opacity: [0.7, 0] }}
              transition={{ duration: period * 1.6, repeat: Infinity, ease: "easeOut", delay: k * ((period * 1.6) / 3) }}
            />
          ))}
          <span className="relative grid size-[18px] place-items-center rounded-full bg-ios-blue">
            <span className="size-1.5 rounded-full bg-white" />
          </span>
        </div>
        <div className="min-w-0 leading-none">
          <AnimatedNumber value={b.clients} className="text-[28px] font-semibold tracking-tight text-heading" />
          <div className="mt-1 text-[11px] text-tertiary">clients</div>
        </div>
      </div>

      <div className="mt-auto">
        <div className="flex items-baseline justify-between text-[11px] whitespace-nowrap">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={b.band}
              initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
              className="truncate font-semibold text-ios-blue"
            >
              {b.band}
            </motion.span>
          </AnimatePresence>
          <span className={cn("font-semibold tabular", busy ? "text-ios-orange" : "text-secondary")}>
            <AnimatedNumber value={util} suffix="%" />
            <span className="font-normal text-tertiary"> util</span>
          </span>
        </div>
        <div className="relative mt-1 flex h-[6px] gap-[2px] overflow-hidden rounded-full bg-fill-secondary">
          <motion.span
            className={cn("h-full rounded-full", busy ? "bg-ios-orange" : "bg-ios-blue")}
            initial={{ width: 0 }}
            animate={{ width: `${b.own}%` }}
            transition={{ type: "spring", stiffness: 140, damping: 20, delay }}
          />
          <motion.span
            className={cn("h-full rounded-full", busy ? "bg-ios-orange/45" : "bg-fill")}
            initial={{ width: 0 }}
            animate={{ width: `${b.neighbor}%` }}
            transition={{ type: "spring", stiffness: 140, damping: 20, delay: delay + 0.1 }}
          />
          <span className="absolute inset-y-0 w-px bg-tertiary" style={{ left: `${CONGESTED}%` }} />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-tertiary">
          <span className="truncate">{b.channel}</span>
          <span className="flex gap-[3px]">
            {BANDS.map((x, i) => (
              <motion.span
                key={x.band}
                layout
                className={cn("h-1 rounded-full", i === page ? "w-3 bg-ios-blue" : "w-1 bg-fill")}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            ))}
          </span>
        </div>
      </div>
    </Widget>
  );
}
