import { ArrowSync16Filled, Checkmark12Filled, Dismiss12Filled, Flash20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { CONNECTOR_LABEL, ConnectorGlyph, type ConnectorType, type Ocpp, STATUS, curveKw, seeded } from "./_parts";

/* An 8-connector highway hub as the CPMS sees it. Status words are OCPP 1.6;
 * "Offline" is derived by the CPMS after three missed 300 s heartbeats. Faulted
 * connectors carry the OCPP errorCode plus the vendor's own code. */
type Stall = {
  id: string;
  type: ConnectorType;
  max: number;
  status: Ocpp;
  kw: number;
  soc: number;
  t: number;
  note?: string;
  code?: string;
  vendor?: string;
};

const SEED: Stall[] = [
  { id: "1A", type: "CCS2", max: 300, status: "Charging", kw: 212, soc: 38, t: 0 },
  { id: "1B", type: "CCS2", max: 300, status: "Faulted", kw: 0, soc: 0, t: 0, code: "GroundFailure", vendor: "ERR_IMD_FAULT", note: "since 14:02" },
  { id: "2A", type: "CCS2", max: 150, status: "Preparing", kw: 0, soc: 24, t: 0 },
  { id: "2B", type: "CCS2", max: 150, status: "Unavailable", kw: 0, soc: 0, t: 0, note: "Cable replacement" },
  { id: "3A", type: "Type2", max: 22, status: "Offline", kw: 0, soc: 0, t: 0, note: "Last heartbeat 14 min ago" },
  { id: "3B", type: "CHAdeMO", max: 50, status: "SuspendedEV", kw: 0, soc: 64, t: 0, note: "Car paused delivery" },
  { id: "4A", type: "NACS", max: 250, status: "Charging", kw: 141, soc: 52, t: 0 },
  { id: "4B", type: "CCS2", max: 150, status: "Available", kw: 0, soc: 0, t: 2 },
];
const FIXED = new Set(["2B", "3A", "3B"]);
const TICK = 2500;

type Act = "idle" | "confirm" | "sending" | "done";

function tileValue(s: Stall) {
  switch (s.status) {
    case "Charging":
      return null;
    case "Available":
      return `${s.max} kW`;
    case "Preparing":
      return "Auth…";
    case "SuspendedEV":
      return "0 kW";
    case "Finishing":
      return `Idle ${s.t + 2} min`;
    case "Faulted":
      return s.code ?? "Error";
    case "Unavailable":
      return "Service";
    case "Offline":
      return "14 min ago";
  }
}

/** EV charging · large. A hub's connectors as live OCPP tiles; tap one for detail, reset a faulted one with a confirm. */
export function ChargingHubWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [stalls, setStalls] = useState(SEED);
  const [sel, setSel] = useState("1B");
  const [act, setAct] = useState<Act>("idle");
  const [result, setResult] = useState({ text: "", ok: true });
  const rand = useMemo(() => seeded(2026), []);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const t = window.setInterval(() => {
      setStalls((all) =>
        all.map((s) => {
          if (FIXED.has(s.id) || s.status === "Faulted" || s.status === "Unavailable") return s;
          const t = s.t + 1;
          if (s.status === "Charging") {
            const dc = s.max > 22;
            const target = dc ? Math.min(s.max * 0.97, curveKw(s.soc)) : 10.9;
            const kw = Math.max(1, s.kw + (target - s.kw) * 0.4 + (rand() - 0.5) * (dc ? 4 : 0.2));
            const soc = Math.min(100, s.soc + ((kw * 25) / 3600 / 75) * 100);
            if (dc && soc >= 80) return { ...s, status: "Finishing", kw: 0, soc, t: 0 };
            return { ...s, kw, soc, t };
          }
          if (s.status === "Preparing" && t >= 2) return { ...s, status: "Charging", kw: 40, t: 0 };
          if (s.status === "Finishing" && t >= 4) return { ...s, status: "Available", kw: 0, soc: 0, t: 0 };
          if (s.status === "Available" && t >= 7 && rand() < 0.5)
            return { ...s, status: "Preparing", soc: Math.round(14 + rand() * 22), t: 0 };
          return { ...s, t };
        }),
      );
    }, TICK);
    return () => {
      window.clearInterval(t);
      timers.current.forEach((x) => window.clearTimeout(x));
    };
  }, [rand]);

  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
  const patch = (id: string, p: Partial<Stall>) => setStalls((all) => all.map((s) => (s.id === id ? { ...s, ...p } : s)));

  const pick = (id: string) => {
    if (act === "sending") return;
    setSel(id);
    setAct("idle");
  };

  const s = stalls.find((x) => x.id === sel)!;
  const load = stalls.reduce((a, x) => a + (x.status === "Charging" ? x.kw : 0), 0);
  const charging = stalls.filter((x) => x.status === "Charging").length;
  const free = stalls.filter((x) => x.status === "Available").length;
  const faulted = stalls.filter((x) => x.status === "Faulted").length;
  const offline = stalls.filter((x) => x.status === "Offline").length;

  const reset = () => {
    const id = s.id;
    setAct("sending");
    later(1300, () => {
      setResult({ text: "Accepted · rebooting", ok: true });
      setAct("done");
      patch(id, { status: "Unavailable", note: "Rebooting after reset", code: undefined, vendor: undefined });
      later(2600, () => {
        patch(id, { status: "Available", note: undefined, t: 0 });
        setAct("idle");
      });
    });
  };
  const ping = () => {
    setAct("sending");
    later(1400, () => {
      setResult({ text: "No reply · 3 heartbeats missed", ok: false });
      setAct("done");
      later(2600, () => setAct("idle"));
    });
  };
  const enable = () => {
    setAct("sending");
    const id = s.id;
    later(900, () => {
      setResult({ text: "Accepted · Operative", ok: true });
      setAct("done");
      patch(id, { status: "Available", note: undefined, t: 0 });
      later(1800, () => setAct("idle"));
    });
  };

  const detail = (() => {
    switch (s.status) {
      case "Charging":
        return `${s.kw < 100 ? s.kw.toFixed(1) : Math.round(s.kw)} kW · SoC ${Math.floor(s.soc)}% · ${CONNECTOR_LABEL[s.type]} ${s.max} kW`;
      case "Available":
        return `Ready · ${CONNECTOR_LABEL[s.type]} up to ${s.max} kW`;
      case "Preparing":
        return "Cable in · authorising and handshake";
      case "SuspendedEV":
        return `${s.note} · SoC ${s.soc}% · plugged 41 min`;
      case "Finishing":
        return `Session ended · idle fee from 10 min`;
      case "Faulted":
        return `${s.code} · ${s.vendor} · ${s.note}`;
      case "Unavailable":
        return s.note ?? "Out of service";
      case "Offline":
        return s.note ?? "No heartbeat";
    }
  })();

  const action =
    s.status === "Faulted"
      ? { label: "Reset", run: () => setAct("confirm") }
      : s.status === "Offline"
        ? { label: "Ping", run: ping }
        : s.status === "Unavailable" && s.note !== "Rebooting after reset"
          ? { label: "Enable", run: enable }
          : null;

  return (
    <Widget size="large" index={index} label="Charging hub connectors">
      <WidgetHeader
        icon={<Flash20Filled />}
        tint="var(--ios-blue)"
        title="Highway hub A"
        subtitle="8 connectors · 4 cabinets · 1.2 MW"
        extra={
          <div className="text-right leading-tight whitespace-nowrap">
            <div className="text-[11px] text-tertiary">Site load</div>
            <div className="text-[15px] font-semibold text-heading">
              <AnimatedNumber value={Math.round(load)} />
              <span className="ml-0.5 text-[11px] font-medium text-tertiary">kW</span>
            </div>
          </div>
        }
      />

      <div className="mt-2.5 flex h-4 items-center gap-3 text-[11px] whitespace-nowrap">
        <span className="text-tertiary">
          <span className="font-semibold text-ios-blue tabular">{charging}</span> charging ·{" "}
          <span className="font-semibold text-ios-green tabular">{free}</span> free
        </span>
        <span className="ml-auto flex items-center gap-2">
          {faulted ? (
            <span className="flex items-center gap-1 font-semibold text-ios-red">
              <span className="size-1.5 rounded-full bg-ios-red" />
              {faulted} faulted
            </span>
          ) : null}
          {offline ? (
            <span className="flex items-center gap-1 text-tertiary">
              <span className="size-1.5 rounded-full border border-dashed border-[var(--ant-color-text-tertiary)]" />
              {offline} offline
            </span>
          ) : null}
        </span>
      </div>

      {/* Connector tiles */}
      <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 grid-rows-4 gap-1.5">
        {stalls.map((st, i) => {
          const c = STATUS[st.status];
          const v = tileValue(st);
          const selected = st.id === sel;
          return (
            <motion.button
              key={st.id}
              type="button"
              onClick={() => pick(st.id)}
              initial={{ opacity: 0, scale: 0.85, y: 6 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                transition: { type: "spring", stiffness: 320, damping: 24, delay: delay + i * 0.03 },
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              aria-label={`${st.id} ${c.label}`}
              aria-pressed={selected}
              className={cn(
                "relative flex min-h-0 cursor-pointer flex-col overflow-hidden rounded-xl border px-2.5 pt-2 pb-3.5 text-left outline-none transition-colors",
                st.status === "Faulted" ? "border-transparent bg-ios-red/12" : "bg-fill-quaternary hover:bg-fill-tertiary",
                st.status === "Offline" ? "border-dashed border-[var(--ant-color-text-tertiary)]" : "border-transparent",
                selected && "ring-1 ring-ios-blue ring-inset",
              )}
            >
              <div className="flex w-full min-w-0 items-center gap-1.5 leading-tight">
                <span className="text-[12px] font-semibold text-heading">{st.id}</span>
                <ConnectorGlyph type={st.type} className="size-3.5 shrink-0 text-tertiary" />
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={st.status}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="ml-auto flex min-w-0 items-center gap-1"
                  >
                    {st.status === "Faulted" ? (
                      <motion.span
                        className="size-1.5 shrink-0 rounded-full bg-ios-red"
                        animate={{ opacity: [1, 0.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    ) : (
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          st.status === "Offline" ? "border border-dashed border-[var(--ant-color-text-tertiary)]" : c.dot,
                        )}
                      />
                    )}
                    <span className={cn("truncate text-[10px] font-medium tracking-tight", c.text)}>{c.label}</span>
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="mt-auto flex w-full items-baseline justify-between gap-2 leading-none whitespace-nowrap">
                {v == null ? (
                  <>
                    <span className="text-[15px] font-semibold text-heading">
                      <AnimatedNumber value={st.kw} format={{ maximumFractionDigits: st.kw < 100 ? 1 : 0, minimumFractionDigits: st.kw < 100 ? 1 : 0 }} />
                      <span className="ml-0.5 text-[10px] font-medium text-tertiary">kW</span>
                    </span>
                    <span className="text-[10px] text-tertiary tabular">SoC {Math.floor(st.soc)}%</span>
                  </>
                ) : (
                  <span
                    className={cn(
                      "truncate tabular",
                      st.status === "Faulted" ? "text-[11px] font-semibold text-ios-red" : "text-[11px] text-tertiary",
                    )}
                  >
                    {v}
                  </span>
                )}
              </div>
              {st.status === "Charging" ? (
                /* Inset from the tile's rounded corners so the flow is never clipped. */
                <span className="absolute inset-x-2.5 bottom-[6px] h-[3px] overflow-hidden rounded-full bg-fill-secondary">
                  <motion.span
                    className="absolute inset-y-0 left-0 overflow-hidden rounded-full bg-ios-blue"
                    initial={{ width: 0 }}
                    animate={{ width: `${st.soc}%` }}
                    transition={{ type: "spring", stiffness: 80, damping: 20 }}
                  >
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent bg-[length:16px_100%] bg-no-repeat"
                      initial={{ x: "-30%" }}
                      animate={{ x: "110%" }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "linear", delay: i * 0.2 }}
                    />
                  </motion.span>
                </span>
              ) : null}
            </motion.button>
          );
        })}
      </div>

      {/* Selected connector */}
      <div className="relative mt-2 h-[54px] shrink-0 overflow-hidden rounded-xl bg-fill-tertiary px-2.5">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`${s.id}-${act}-${s.status}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="flex h-[54px] items-center gap-2.5 whitespace-nowrap"
          >
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full",
                s.status === "Faulted" ? "bg-ios-red/15 text-ios-red" : "bg-fill-secondary text-secondary",
              )}
            >
              <ConnectorGlyph type={s.type} className="size-[18px]" />
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[12px] font-semibold text-heading">
                {act === "confirm" ? `Soft reset ${s.id}?` : `${s.id} · ${STATUS[s.status].label}`}
              </div>
              <div className={cn("truncate text-[11px] tabular", act === "done" ? (result.ok ? "text-secondary" : "text-ios-orange") : "text-tertiary")}>
                {act === "confirm"
                  ? "Cabinet reboots, about 60 s offline"
                  : act === "sending"
                    ? "Sending command…"
                    : act === "done"
                      ? result.text
                      : detail}
              </div>
            </div>
            {act === "confirm" ? (
              <>
                <Button size="small" variant="filled" color="default" onClick={() => setAct("idle")}>
                  Cancel
                </Button>
                <Button size="small" color="danger" variant="solid" onClick={reset}>
                  Confirm
                </Button>
              </>
            ) : act === "sending" ? (
              <motion.span
                className="size-4 shrink-0 rounded-full border-2 border-fill border-t-heading"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            ) : act === "done" ? (
              result.ok ? (
                <Checkmark12Filled className="shrink-0 text-heading" />
              ) : (
                <Dismiss12Filled className="shrink-0 text-ios-orange" />
              )
            ) : action ? (
              <Button
                size="small"
                icon={<ArrowSync16Filled />}
                color={s.status === "Faulted" ? "danger" : "default"}
                variant={s.status === "Faulted" ? "solid" : "filled"}
                onClick={action.run}
              >
                {action.label}
              </Button>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </Widget>
  );
}
