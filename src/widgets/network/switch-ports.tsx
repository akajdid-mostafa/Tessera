import { Connector20Filled, Flash16Filled, Warning16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";
import { GuardButton, walk } from "./_parts";

type State = "up" | "down" | "err" | "recovering";
type Port = {
  name: string;
  state: State;
  speed: 10000 | 1000 | 100 | 0;
  device: string;
  vlan?: { id: number; name: string };
  poe?: number;
  mbps?: number;
  sfp?: boolean;
};

const CORP = { id: 10, name: "Corp" };
const VOICE = { id: 20, name: "Voice" };
const CCTV = { id: 30, name: "CCTV" };
const ACCESS = { id: 40, name: "Access" };

const desk = (n: string, mbps: number): Partial<Port> => ({ device: `Desk ${n}`, vlan: CORP, speed: 1000, mbps });
const SPEC: Partial<Port>[] = [
  { device: "AP Lobby-1", vlan: CORP, speed: 1000, poe: 18.2, mbps: 214 },
  { device: "AP Lobby-2", vlan: CORP, speed: 1000, poe: 21.4, mbps: 336 },
  { device: "IP phone · Reception", vlan: VOICE, speed: 100, poe: 6.2, mbps: 0.4 },
  { device: "Printer 3F", vlan: CORP, speed: 100, mbps: 3 },
  desk("3F-12", 48),
  { state: "down", device: "Last seen 3 d ago" },
  desk("3F-14", 122),
  { device: "Camera 3F east", vlan: CCTV, speed: 1000, poe: 7.9, mbps: 8 },
  { device: "Camera 3F west", vlan: CCTV, speed: 1000, poe: 8.1, mbps: 8 },
  { state: "down", device: "Last seen 12 d ago" },
  desk("3F-17", 64),
  desk("3F-18", 18),
  { device: "IP phone · Desk 3F-12", vlan: VOICE, speed: 100, poe: 6.0, mbps: 0.2 },
  { state: "err", device: "Meeting room 3B wall jack", vlan: CORP, speed: 0 },
  desk("3F-21", 94),
  { state: "down", device: "Never connected" },
  { device: "IP phone · Desk 3F-21", vlan: VOICE, speed: 100, poe: 5.8, mbps: 0.3 },
  desk("3F-22", 38),
  { device: "Badge reader · 3F lift", vlan: ACCESS, speed: 100, poe: 4.1, mbps: 0.1 },
  { device: "Desk 3F-24", vlan: CORP, speed: 100, mbps: 6 },
  { state: "down", device: "Last seen 1 d ago" },
  { device: "AP 3F-East", vlan: CORP, speed: 1000, poe: 19.8, mbps: 288 },
  desk("3F-26", 72),
  { device: "Room display 3A", vlan: CORP, speed: 1000, poe: 12.6, mbps: 14 },
];
const PORTS: Port[] = [
  ...SPEC.map((p, i) => ({ name: `Gi1/0/${i + 1}`, state: "up" as State, speed: 0 as const, ...p }) as Port),
  { name: "Te1/1/1", state: "up", speed: 10000, device: "Uplink · dist-sw-1", vlan: { id: 1, name: "Trunk" }, mbps: 2410, sfp: true },
  { name: "Te1/1/2", state: "up", speed: 10000, device: "Uplink · dist-sw-2", vlan: { id: 1, name: "Trunk" }, mbps: 1980, sfp: true },
  { name: "Te1/1/3", state: "down", speed: 0, device: "Empty cage", sfp: true },
  { name: "Te1/1/4", state: "down", speed: 0, device: "Empty cage", sfp: true },
];
const POE_BUDGET = 370;
const LEN = 40;

const SPEED_LABEL = (s: number) => (s >= 10000 ? "10 Gb/s" : s >= 1000 ? "1 Gb/s" : s ? "100 Mb/s" : "—");

function seedSeries(mbps: number) {
  return {
    rx: Array.from({ length: LEN }, (_, i) => mbps * (0.7 + 0.3 * Math.abs(Math.sin(i * 0.5)))),
    tx: Array.from({ length: LEN }, (_, i) => mbps * 0.35 * (0.6 + 0.4 * Math.abs(Math.cos(i * 0.4)))),
  };
}

/** Network · large. A 24-port access switch faceplate with link LEDs blinking at each port's traffic; tap a port for its live throughput, and re-enable an err-disabled port with a guarded command. */
export function SwitchPortsWidget({ index }: { index?: number }) {
  const [ports, setPorts] = useState(PORTS);
  const [sel, setSel] = useState(13);
  const port = ports[sel];
  const [series, setSeries] = useState(() => seedSeries(port.mbps ?? 0));

  useEffect(() => setSeries(seedSeries(ports[sel].mbps ?? 0)), [sel]);

  useEffect(() => {
    const t = window.setInterval(() => {
      setSeries((s) => {
        const base = ports[sel].mbps ?? 0;
        return {
          rx: [...s.rx.slice(1), walk(s.rx[LEN - 1] + (base - s.rx[LEN - 1]) * 0.3, base * 0.25, 0, base * 1.6 + 1)],
          tx: [...s.tx.slice(1), walk(s.tx[LEN - 1] + (base * 0.35 - s.tx[LEN - 1]) * 0.3, base * 0.12, 0, base + 1)],
        };
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [sel, ports]);

  const recover = () => setPorts((ps) => ps.map((p, i) => (i === sel ? { ...p, state: "recovering" } : p)));
  const recovering = ports.some((p) => p.state === "recovering");

  // shutdown / no shutdown takes a few seconds before the link comes back.
  useEffect(() => {
    if (!recovering) return;
    const t = window.setTimeout(() => {
      setPorts((ps) =>
        ps.map((p) => (p.state === "recovering" ? { ...p, state: "up", speed: 1000, device: "Meeting room 3B · laptop", mbps: 36 } : p)),
      );
    }, 3200);
    return () => window.clearTimeout(t);
  }, [recovering]);

  const counts = useMemo(() => {
    const up = ports.filter((p) => p.state === "up").length;
    const err = ports.filter((p) => p.state === "err").length;
    return { up, err, down: ports.length - up - err };
  }, [ports]);
  const poe = ports.reduce((a, p) => a + (p.state === "up" ? (p.poe ?? 0) : 0), 0);

  const copper = ports.filter((p) => !p.sfp);
  const sfps = ports.filter((p) => p.sfp);
  const delay = 0.3 + (index ?? 0) * 0.06;
  const rxNow = series.rx[LEN - 1];
  const txNow = series.tx[LEN - 1];

  return (
    <Widget size="large" index={index} label="Switch port panel">
      <WidgetHeader
        icon={<Connector20Filled />}
        tint="var(--ios-blue)"
        title="access-sw-3F"
        subtitle="Catalyst 9300-24P · IDF 3"
        extra={
          counts.err ? (
            <span className="flex items-center gap-1 rounded-full bg-ios-red/15 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-ios-red">
              <span className="size-1.5 animate-pulse rounded-full bg-ios-red" />
              {counts.err} err-disabled
            </span>
          ) : (
            <span className="rounded-full bg-fill-secondary px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-secondary">All clear</span>
          )
        }
      />

      {/* Faceplate: odd ports on top, even below, then the SFP+ cages */}
      <div className="mt-3 flex gap-2 rounded-2xl bg-fill-quaternary p-2 ring-1 ring-inset ring-widget-ring">
        {[copper.slice(0, 12), copper.slice(12, 24)].map((group, g) => (
          <div key={g} className="grid flex-1 grid-flow-col grid-rows-2 gap-[3px]">
            {group.map((p, k) => {
              const i = g * 12 + k;
              return <PortCell key={p.name} p={p} selected={sel === i} onSelect={() => setSel(i)} delay={delay + i * 0.015} />;
            })}
          </div>
        ))}
        <div className="grid w-[46px] shrink-0 grid-flow-col grid-rows-2 gap-[3px] border-l-[0.5px] border-split pl-2">
          {sfps.map((p, k) => {
            const i = 24 + k;
            return <PortCell key={p.name} p={p} selected={sel === i} onSelect={() => setSel(i)} delay={delay + 0.4 + k * 0.03} />;
          })}
        </div>
      </div>

      {/* Port detail */}
      <div className="relative mt-3 min-h-0 flex-1">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`${port.name}-${port.state}`}
            initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
            transition={{ duration: 0.22 }}
            className="absolute inset-0 flex flex-col"
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1 leading-none">
                <div className="flex items-center gap-2">
                  <span className="text-[22px] font-semibold tracking-tight text-heading">{port.name}</span>
                  <StateChip p={port} />
                </div>
                <div className="mt-1.5 truncate text-[11px] text-tertiary">{port.device}</div>
              </div>
              {port.vlan ? (
                <span className="shrink-0 rounded-full bg-fill-tertiary px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-secondary tabular">
                  VLAN {port.vlan.id} · {port.vlan.name}
                </span>
              ) : null}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <Stat label="Speed" value={port.state === "up" ? SPEED_LABEL(port.speed) : "—"} />
              <Stat
                label="PoE"
                value={
                  port.poe && port.state === "up" ? (
                    <span className="inline-flex items-center gap-0.5">
                      <Flash16Filled className="text-ios-yellow" />
                      {port.poe.toFixed(1)} W
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
              <Stat label="Errors · 24 h" value={port.state === "err" ? <span className="text-ios-red">BPDU</span> : "0"} />
            </div>

            {port.state === "err" || port.state === "recovering" ? (
              <div className="mt-3 flex flex-1 flex-col rounded-2xl bg-ios-red/10 p-3">
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-ios-red">
                  <Warning16Filled />
                  {port.state === "recovering" ? "Bringing port up…" : "err-disabled · BPDU guard"}
                </div>
                <p className="mt-1 text-[11px] leading-snug text-secondary">
                  A switch plugged into this jack sent BPDUs at 14:02. The port was shut to stop a loop.
                </p>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <span className="text-[10px] text-tertiary">shutdown / no shutdown</span>
                  <GuardButton label="Re-enable" confirmLabel="Re-enable?" disabled={port.state === "recovering"} onConfirm={recover} />
                </div>
              </div>
            ) : port.state === "down" ? (
              <div className="mt-3 grid flex-1 place-items-center rounded-2xl border border-dashed border-split text-[11px] text-tertiary">
                No link on this port
              </div>
            ) : (
              <div className="mt-3 flex min-h-0 flex-1 flex-col">
                <div className="flex items-center gap-3 text-[11px] text-tertiary">
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-ios-blue" /> In
                    <span className="font-semibold text-heading">
                      <Rate mbps={rxNow} />
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-ios-teal" /> Out
                    <span className="font-semibold text-heading">
                      <Rate mbps={txNow} />
                    </span>
                  </span>
                  <span className="ml-auto text-[10px]">last 40 s</span>
                </div>
                <Mirrored rx={series.rx} tx={series.tx} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-3 flex items-center gap-3 border-t-[0.5px] border-split pt-2.5 text-[11px] text-tertiary">
        <span className="whitespace-nowrap tabular">
          <span className="font-semibold text-heading">{counts.up}</span> up · {counts.down} down
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Flash16Filled className="shrink-0 text-ios-yellow" />
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-fill-secondary">
            <motion.div
              className="h-full rounded-full bg-ios-yellow"
              initial={{ width: 0 }}
              animate={{ width: `${(poe / POE_BUDGET) * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20, delay: delay + 0.3 }}
            />
          </div>
          <span className="whitespace-nowrap tabular">
            <AnimatedNumber value={Math.round(poe)} className="font-semibold text-heading" /> / {POE_BUDGET} W
          </span>
        </div>
      </div>
    </Widget>
  );
}

function PortCell({ p, selected, onSelect, delay }: { p: Port; selected: boolean; onSelect: () => void; delay: number }) {
  const up = p.state === "up";
  // Activity blinks faster the more traffic the port carries.
  const blink = up && p.mbps ? Math.max(0.18, 1.6 - Math.log10(p.mbps + 1) * 0.45) : 0;
  const linkColor = p.state === "err" ? "bg-ios-red" : p.state === "recovering" ? "bg-ios-orange" : up ? (p.speed >= 1000 ? "bg-ios-green" : "bg-ios-orange") : "bg-transparent";

  return (
    <Tooltip title={`${p.name} · ${p.device}`} size="small">
      <motion.button
        type="button"
        onClick={onSelect}
        aria-label={`${p.name}, ${p.state}`}
        aria-pressed={selected}
        className={cn(
          "relative flex h-[19px] cursor-pointer items-end justify-center rounded-[4px] pb-[2px] outline-none transition-colors duration-mid",
          selected ? "bg-ios-blue/20 ring-[1.5px] ring-ios-blue" : p.state === "err" ? "bg-ios-red/15 ring-1 ring-ios-red/70" : "bg-fill-secondary hover:bg-fill",
        )}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 420, damping: 22, delay } }}
        whileTap={{ scale: 0.85, transition: { duration: 0.1 } }}
      >
        {/* Socket mouth */}
        <span className={cn("block h-[7px] rounded-[1.5px] bg-fill", p.sfp ? "w-[13px]" : "w-[9px]")} />
        <motion.span
          className={cn("absolute top-[2px] left-[2px] size-[4px] rounded-full", linkColor)}
          animate={p.state === "err" || p.state === "recovering" ? { opacity: [1, 0.25, 1] } : { opacity: 1 }}
          transition={p.state === "err" || p.state === "recovering" ? { duration: p.state === "err" ? 1.2 : 0.4, repeat: Infinity } : undefined}
        />
        {blink ? (
          <motion.span
            className="absolute top-[2px] right-[2px] size-[4px] rounded-full bg-ios-green"
            animate={{ opacity: [1, 0.15, 1] }}
            transition={{ duration: blink, repeat: Infinity, ease: "linear", delay: (p.name.length * 0.13) % 0.5 }}
          />
        ) : null}
      </motion.button>
    </Tooltip>
  );
}

function StateChip({ p }: { p: Port }) {
  const map: Record<State, [string, string]> = {
    up: ["Up", "bg-fill-secondary text-secondary"],
    down: ["Down", "bg-fill-secondary text-tertiary"],
    err: ["err-disabled", "bg-ios-red/15 text-ios-red"],
    recovering: ["Recovering", "bg-ios-orange/15 text-ios-orange"],
  };
  const [label, cls] = map[p.state];
  return <span className={cn("rounded-full px-1.5 py-px text-[10px] font-semibold whitespace-nowrap", cls)}>{label}</span>;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-fill-quaternary px-2 py-1.5 leading-none">
      <div className="truncate text-[10px] text-tertiary">{label}</div>
      <div className="mt-1 truncate text-[13px] font-semibold text-heading tabular">{value}</div>
    </div>
  );
}

function Rate({ mbps }: { mbps: number }) {
  if (mbps >= 1000) return <AnimatedNumber value={mbps / 1000} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} suffix=" Gb/s" />;
  if (mbps >= 10) return <AnimatedNumber value={Math.round(mbps)} suffix=" Mb/s" />;
  return <AnimatedNumber value={mbps * 1000} format={{ maximumFractionDigits: 0 }} suffix=" kb/s" />;
}

/** In above the axis, out below, streaming left as each second lands. */
function Mirrored({ rx, tx }: { rx: number[]; tx: number[] }) {
  const max = Math.max(1, ...rx, ...tx);
  const W = 300;
  const H = 80;
  const mid = H / 2;
  const x = (i: number) => (i / (LEN - 1)) * W;
  const up = rx.map((v, i) => `${x(i).toFixed(1)},${(mid - (v / max) * (mid - 3)).toFixed(1)}`);
  const down = tx.map((v, i) => `${x(i).toFixed(1)},${(mid + (v / max) * (mid - 3)).toFixed(1)}`);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="mt-1.5 min-h-0 w-full flex-1" aria-hidden>
      <polygon points={`0,${mid} ${up.join(" ")} ${W},${mid}`} className="fill-ios-blue/20" />
      <polyline points={up.join(" ")} fill="none" strokeWidth={1.5} vectorEffect="non-scaling-stroke" className="stroke-ios-blue" />
      <polygon points={`0,${mid} ${down.join(" ")} ${W},${mid}`} className="fill-ios-teal/20" />
      <polyline points={down.join(" ")} fill="none" strokeWidth={1.5} vectorEffect="non-scaling-stroke" className="stroke-ios-teal" />
      <line x1={0} x2={W} y1={mid} y2={mid} strokeWidth={1} vectorEffect="non-scaling-stroke" className="stroke-fill" />
    </svg>
  );
}
