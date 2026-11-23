import { Payment20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

type Method = {
  name: string;
  /** Approval rate this hour, 0–1. */
  rate: number;
  auths: number;
};
const METHODS: Method[] = [
  { name: "Cards", rate: 0.978, auths: 1284 },
  { name: "Wallets", rate: 0.991, auths: 642 },
  { name: "Pay later", rate: 0.912, auths: 188 },
];
/** The gauge reads 80–100 %: below that a checkout is broken, not just noisy. */
const FLOOR = 0.8;
const TARGET = 0.95;
const TICK_MS = 2400;

/** Arc geometry: a half circle in a 140 × 78 box. */
const CX = 70;
const CY = 72;
const R = 60;
const ARC = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;
const toShare = (rate: number) => Math.min(1, Math.max(0, (rate - FLOOR) / (1 - FLOOR)));
function pointAt(share: number, radius: number) {
  const a = Math.PI * (1 - share);
  return [CX + Math.cos(a) * radius, CY - Math.sin(a) * radius] as const;
}

/** E-commerce · small. Payment approval rate on a half gauge with live authorisations; tap to page Cards, Wallets and Pay later. */
export function PaymentApprovalsWidget({ index }: { index?: number }) {
  const [page, setPage] = useState(0);
  const [live, setLive] = useState(METHODS);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      setLive((ms) =>
        ms.map((m, i) => {
          const added = 1 + Math.floor(Math.random() * (i === 0 ? 4 : 2));
          const drift = (Math.random() - 0.5) * 0.004;
          const base = METHODS[i].rate;
          return {
            ...m,
            auths: m.auths + added,
            rate: Math.min(base + 0.006, Math.max(base - 0.006, m.rate + drift)),
          };
        }),
      );
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, []);

  const m = live[page];
  const low = m.rate < TARGET;
  const share = toShare(m.rate);
  const [tx1, ty1] = pointAt(toShare(TARGET), R - 9);
  const [tx2, ty2] = pointAt(toShare(TARGET), R + 9);
  const stroke = low ? "var(--ios-orange)" : "var(--ios-green)";

  return (
    <Widget
      size="small"
      index={index}
      label="Payment approvals"
      pressable
      onPress={() => setPage((p) => (p + 1) % METHODS.length)}
    >
      <WidgetHeader
        icon={<Payment20Filled />}
        tint={low ? "var(--ios-orange)" : "var(--ios-green)"}
        title="Payments"
        subtitle="Approved · last hour"
      />

      <div className="relative mx-auto mt-1.5 w-[140px]">
        <svg viewBox="0 0 140 78" className="block w-full overflow-visible" aria-hidden>
          <path d={ARC} fill="none" stroke="var(--ant-color-fill-secondary)" strokeWidth={10} strokeLinecap="round" />
          <motion.path
            d={ARC}
            fill="none"
            strokeWidth={10}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: Math.max(0.02, share), stroke }}
            transition={{
              pathLength: { type: "spring", stiffness: 60, damping: 16, delay },
              stroke: { duration: 0.4 },
            }}
          />
          <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke="var(--ant-color-text-tertiary)" strokeWidth={1.5} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center leading-none">
          <AnimatedNumber
            value={m.rate}
            format={{ style: "percent", maximumFractionDigits: 1, minimumFractionDigits: 1 }}
            className={cn(
              "text-[24px] font-semibold tracking-tight transition-colors duration-300",
              low ? "text-ios-orange" : "text-heading",
            )}
          />
          <span className={cn("mt-0.5 text-[10px] font-medium", low ? "text-ios-orange" : "text-tertiary")}>
            {low ? "Below 95% target" : "Target 95%"}
          </span>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-1.5 text-[11px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={m.name}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            className="truncate font-semibold text-heading"
          >
            {m.name}
          </motion.span>
        </AnimatePresence>
        <span className="truncate text-tertiary">
          <AnimatedNumber value={m.auths} className="text-secondary" /> auths
        </span>
        <div className="ml-auto flex shrink-0 gap-[3px]">
          {METHODS.map((x, i) => (
            <motion.span
              key={x.name}
              layout
              className={cn("h-1.5 rounded-full", i === page ? "w-3" : "w-1.5 bg-fill")}
              style={i === page ? { background: stroke } : undefined}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          ))}
        </div>
      </div>
    </Widget>
  );
}
