import { NetworkCheck20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

const SUBNET = "10.40.0";
const POOL_FROM = 20;
const POOL_TO = 254;
const POOL = POOL_TO - POOL_FROM + 1;
const NEAR_FULL = 0.9;
const STATIC: Record<number, string> = {
  1: "gateway · core-sw-01",
  2: "dns-01",
  3: "dns-02",
  5: "prn-2f-east",
  6: "prn-3f-west",
  8: "nas-office",
  10: "badge-ctrl-01",
  12: "ap-mgmt",
};
const OWNERS = ["lt-hana", "ph-owen", "lt-priya", "tab-kiosk", "lt-marco", "ph-leila", "lt-raj", "ph-grace", "lt-sam", "voip-desk"];

const noise = (n: number) => {
  const s = Math.sin(n * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const host = (n: number) => `${OWNERS[n % OWNERS.length]}${n > 60 ? `-${(n % 9) + 1}` : ""}`;

type Kind = "net" | "static" | "leased" | "free";
const SEED: boolean[] = Array.from({ length: 256 }, (_, n) => n >= POOL_FROM && n <= POOL_TO && noise(n) < 0.9);

function kindOf(n: number, leased: boolean[]): Kind {
  if (n === 0 || n === 255) return "net";
  if (n < POOL_FROM) return "static";
  return leased[n] ? "leased" : "free";
}
const CELL: Record<Kind, string> = {
  net: "bg-transparent ring-1 ring-inset ring-fill",
  static: "bg-secondary/45",
  leased: "bg-ios-indigo",
  free: "bg-fill-tertiary",
};

/** Network · small. A /24 DHCP scope as a grid of 256 addresses; leases pop in green and expire live, the pool turns amber past 90%, and hovering any cell reads its address and host. */
export function DhcpPoolWidget({ index }: { index?: number }) {
  const [leased, setLeased] = useState(SEED);
  const [fresh, setFresh] = useState<number | null>(null);
  const [probe, setProbe] = useState<number | null>(null);
  const current = useRef(leased);
  current.current = leased;

  useEffect(() => {
    const t = window.setInterval(() => {
      const l = current.current;
      const free = l.map((v, i) => (!v && i >= POOL_FROM && i <= POOL_TO ? i : -1)).filter((i) => i >= 0);
      const used = l.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
      // Devices join and leave around a busy-afternoon level of ~92%.
      const grant = free.length > 4 && Math.random() < (used.length < 216 ? 0.7 : 0.3);
      const pick = grant ? free[Math.floor(Math.random() * free.length)] : used[Math.floor(Math.random() * used.length)];
      const next = [...l];
      next[pick] = grant;
      setLeased(next);
      setFresh(grant ? pick : null);
    }, 2200);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (fresh === null) return;
    const t = window.setTimeout(() => setFresh(null), 1300);
    return () => window.clearTimeout(t);
  }, [fresh]);

  const count = leased.filter(Boolean).length;
  const ratio = count / POOL;
  const full = ratio >= NEAR_FULL;
  const delay = 0.3 + (index ?? 0) * 0.06;

  const describe = (n: number) => {
    const k = kindOf(n, leased);
    if (k === "net") return n === 0 ? "network" : "broadcast";
    if (k === "static") return STATIC[n] ?? "reserved";
    if (k === "leased") return host(n);
    return "free";
  };

  return (
    <Widget size="small" index={index} label="DHCP scope">
      <WidgetHeader icon={<NetworkCheck20Filled />} tint="var(--ios-indigo)" title="DHCP · VLAN 40" subtitle={`${SUBNET}.0/24`} />

      <div className="mt-1 flex items-start gap-2.5">
        <div
          className="grid shrink-0 gap-[1.5px]"
          style={{ gridTemplateColumns: "repeat(16, 5px)", gridAutoRows: "5px" }}
          onMouseLeave={() => setProbe(null)}
        >
          {leased.map((_, n) => {
            const k = kindOf(n, leased);
            const isFresh = fresh === n;
            return (
              <motion.span
                key={n}
                onMouseEnter={() => setProbe(n)}
                className={cn(
                  "rounded-[1.5px] transition-colors duration-500",
                  isFresh ? "bg-ios-green" : CELL[k],
                  n === 1 && "bg-ios-teal",
                  probe === n && "ring-1 ring-inset ring-sel",
                )}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: isFresh ? [1.8, 1] : 1 }}
                transition={
                  isFresh
                    ? { type: "spring", stiffness: 500, damping: 14 }
                    : { type: "spring", stiffness: 400, damping: 24, delay: delay + ((n % 16) + Math.floor(n / 16)) * 0.012 }
                }
              />
            );
          })}
        </div>

        <div className="min-w-0 flex-1 leading-none whitespace-nowrap">
          <div className="text-[11px] text-tertiary">Leases</div>
          <AnimatedNumber
            value={count}
            className={cn("mt-1 block text-[22px] font-semibold tracking-tight transition-colors duration-mid", full ? "text-ios-orange" : "text-heading")}
          />
          <div className="mt-0.5 text-[11px] text-tertiary">of {POOL}</div>
          <span
            className={cn(
              "mt-1 inline-block rounded-full px-1.5 py-px text-[11px] font-semibold transition-colors duration-mid",
              full ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-tertiary text-secondary",
            )}
          >
            <AnimatedNumber value={ratio} format={{ style: "percent", maximumFractionDigits: 0 }} />
          </span>
          <div className="mt-0.5 flex flex-col text-[10px] leading-[13px] text-tertiary">
            <span className="flex items-center gap-1">
              <span className="size-[6px] rounded-[1.5px] bg-ios-indigo" /> leased
            </span>
            <span className="flex items-center gap-1">
              <span className="size-[6px] rounded-[1.5px] bg-secondary/45" /> static
            </span>
          </div>
        </div>
      </div>

      <div className="relative mt-auto h-[14px] overflow-hidden text-[11px] leading-[14px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={probe ?? "meta"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="truncate text-tertiary tabular"
          >
            {probe !== null ? (
              <>
                <span className="font-semibold text-heading">.{probe}</span> · {describe(probe)}
              </>
            ) : (
              <>
                <span className="font-semibold text-secondary">{POOL - count}</span> free · lease 8 h
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Widget>
  );
}
