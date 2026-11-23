import { CheckmarkCircle16Filled, Dismiss12Regular, Signature16Filled, Signature20Filled, Warning16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { clock, HoldButton, LiveDot, mmss } from "./_parts";

const SP = 60;
const BAND = 5;
const REASONS = ["Door opened for pull", "Humidifier valve fault", "Under investigation"];
const SIGNER = { name: "Dr. Lena Vogel", role: "QA reviewer · lvogel" };
const HISTORY = 36;

type Phase = "normal" | "rising" | "alarm" | "recovering";
type Step = "idle" | "reason" | "sign";
type Sim = { phase: Phase; rh: number; t: number; since: number; acked: boolean; trace: number[] };

const seedTrace = Array.from({ length: HISTORY }, (_, i) =>
  i < 18 ? SP + Math.sin(i * 0.9) * 0.6 : Math.min(67, SP + 0.6 + (i - 18) * 0.42 + Math.sin(i) * 0.2),
);
const START: Sim = { phase: "alarm", rh: 66.8, t: 0, since: 12 * 60 + 41, acked: false, trace: seedTrace };

function step(s: Sim): Sim {
  const jitter = (Math.random() - 0.5) * 0.3;
  let { phase, rh, t, since, acked } = s;
  t += 1;
  if (phase === "alarm") {
    rh = Math.min(68.4, Math.max(65.6, rh + jitter + (acked ? -0.4 : 0.05)));
    since += 1;
    if (acked) phase = "recovering";
  } else if (phase === "recovering") {
    rh = rh + (SP - rh) * 0.22 + jitter * 0.5;
    if (rh <= SP + BAND - 0.2 && t > 4) since = 0;
    if (Math.abs(rh - SP) < 0.8) {
      phase = "normal";
      t = 0;
    }
  } else if (phase === "normal") {
    rh = SP + jitter * 1.4;
    if (t > 14) {
      phase = "rising";
      t = 0;
      acked = false;
    }
  } else {
    rh = rh + 0.55 + jitter * 0.4;
    if (rh > SP + BAND) {
      phase = "alarm";
      since = 0;
    }
  }
  return { phase, rh: Math.round(rh * 10) / 10, t, since, acked, trace: [...s.trace.slice(1), rh] };
}

/** Lab · medium. A stability-chamber humidity excursion that holds its alarm until a QA reviewer acknowledges it: pick a reason, then press and hold to e-sign (21 CFR Part 11), after which the trace eases back into the ±5 %RH band. */
export function ExcursionAckWidget({ index }: { index?: number }) {
  const [sim, setSim] = useState<Sim>(START);
  const [stepUi, setStepUi] = useState<Step>("idle");
  const [reason, setReason] = useState<string | null>(null);
  const [signed, setSigned] = useState<{ at: string; reason: string } | null>(null);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const id = window.setInterval(() => setSim(step), 1000);
    return () => window.clearInterval(id);
  }, []);

  // A new excursion clears the previous signature.
  useEffect(() => {
    if (sim.phase === "rising") {
      setSigned(null);
      setStepUi("idle");
      setReason(null);
    }
  }, [sim.phase]);

  const alarm = sim.phase === "alarm" && !sim.acked;
  const out = sim.rh > SP + BAND;
  const sign = () => {
    setSigned({ at: clock(new Date()), reason: reason ?? REASONS[2] });
    setSim((s) => ({ ...s, acked: true }));
    setStepUi("idle");
  };

  // Sparkline geometry.
  const W = 148;
  const H = 40;
  const lo = 52;
  const hi = 70;
  const y = (v: number) => H - ((v - lo) / (hi - lo)) * H;
  const pts = sim.trace.map((v, i) => `${(i / (HISTORY - 1)) * W},${y(v).toFixed(1)}`).join(" ");
  const last = sim.trace[sim.trace.length - 1];

  return (
    <Widget
      size="medium"
      index={index}
      label="Excursion acknowledge"
      glow={{ mode: "pulse", colors: ["#FF9F0A", "#FF453A", "#FF9F0A"], blur: 18, duration: 1.4 }}
      glowActive={alarm}
    >
      <WidgetHeader
        icon={<Signature20Filled />}
        tint="var(--ios-orange)"
        title="Stability Chamber 4"
        subtitle="25 °C / 60 %RH · ICH long-term"
        extra={
          <span
            className={cn(
              "flex h-[22px] items-center gap-1.5 rounded-full px-2 text-[11px] font-semibold whitespace-nowrap transition-colors duration-500 tabular",
              alarm ? "bg-ios-red/15 text-ios-red" : sim.phase === "normal" ? "bg-fill-secondary text-secondary" : "bg-ios-orange/15 text-ios-orange",
            )}
          >
            <LiveDot color={alarm ? "var(--ios-red)" : sim.phase === "normal" ? "var(--ios-green)" : "var(--ios-orange)"} ping={alarm} />
            {alarm ? `Alarm ${mmss(sim.since)}` : sim.phase === "normal" ? "In range" : sim.phase === "rising" ? "Drifting" : "Acknowledged"}
          </span>
        }
      />

      <div className="mt-2.5 flex min-h-0 flex-1 gap-3">
        <div className="flex w-[148px] shrink-0 flex-col">
          <div className="text-[11px] font-medium text-tertiary">Relative humidity · RH-2</div>
          <div className={cn("mt-1 flex items-baseline leading-none transition-colors duration-500", out ? "text-ios-red" : "text-heading")}>
            <AnimatedNumber value={sim.rh} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} className="text-[28px] font-semibold tracking-tight" />
            <span className="ml-0.5 text-[12px] font-medium text-tertiary">%RH</span>
          </div>
          <div className="mt-1 text-[10px] text-tertiary tabular">
            Limit {SP} ± {BAND} · Temp 25.1 °C
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="mt-auto h-[40px] w-full overflow-visible" aria-hidden>
            <rect x="0" y={y(SP + BAND)} width={W} height={y(SP - BAND) - y(SP + BAND)} rx="3" style={{ fill: "var(--ant-color-fill-quaternary)" }} />
            <line x1="0" x2={W} y1={y(SP + BAND)} y2={y(SP + BAND)} strokeDasharray="3 3" strokeWidth="1" style={{ stroke: "var(--ios-red)", opacity: 0.6 }} />
            <motion.polyline
              points={pts}
              fill="none"
              strokeWidth="1.8"
              strokeLinejoin="round"
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay, duration: 0.6 }}
              style={{ stroke: out ? "var(--ios-red)" : "var(--ios-orange)", transition: "stroke 0.5s" }}
            />
            <circle cx={W} cy={y(last)} r="5" style={{ fill: out ? "var(--ios-red)" : "var(--ios-orange)", opacity: 0.25 }} />
            <circle cx={W} cy={y(last)} r="2.5" style={{ fill: out ? "var(--ios-red)" : "var(--ios-orange)" }} />
          </svg>
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-fill-quaternary p-2.5">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={signed && stepUi === "idle" ? "signed" : alarm ? stepUi : sim.phase}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="flex h-full min-h-0 flex-col"
            >
              {signed && stepUi === "idle" ? (
                <>
                  <div className="flex items-center gap-1.5 text-[12px] font-semibold text-ios-green">
                    <CheckmarkCircle16Filled /> Acknowledged
                  </div>
                  <div className="mt-1 truncate text-[10px] text-tertiary">Reason · {signed.reason}</div>
                  <div className="mt-auto flex items-center gap-2">
                    <MemojiAvatar who="f6" size={24} alt={SIGNER.name} />
                    <div className="min-w-0 leading-tight">
                      <div className="truncate text-[11px] font-medium text-heading">{SIGNER.name}</div>
                      <div className="truncate text-[10px] text-tertiary tabular">e-signed {signed.at}</div>
                    </div>
                    <Signature16Filled className="ml-auto shrink-0 text-tertiary" />
                  </div>
                </>
              ) : !alarm ? (
                <>
                  <div className="flex items-center gap-1.5 text-[12px] font-semibold text-heading">
                    <LiveDot color="var(--ios-green)" /> {sim.phase === "rising" ? "Watching drift" : "No open excursions"}
                  </div>
                  <div className="mt-1 text-[10px] leading-snug text-tertiary">
                    {sim.phase === "rising" ? "RH climbing toward the 65 %RH limit. Alarm raises on crossing." : "Last excursion signed off. Chamber holding 60 ± 5 %RH."}
                  </div>
                </>
              ) : stepUi === "idle" ? (
                <>
                  <div className="flex items-center gap-1.5 text-[12px] font-semibold text-ios-red">
                    <Warning16Filled className="shrink-0" /> RH high · above 65 %RH
                  </div>
                  <div className="mt-1 text-[10px] leading-snug text-tertiary">
                    84 samples on study. Sign-off needs a reason and an e-signature.
                  </div>
                  <Button size="small" type="primary" danger className="mt-auto self-start" onClick={() => setStepUi("reason")}>
                    Acknowledge…
                  </Button>
                </>
              ) : stepUi === "reason" ? (
                <>
                  <StepTitle title="1 · Reason" onCancel={() => setStepUi("idle")} />
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {REASONS.map((r) => (
                      <motion.button
                        key={r}
                        type="button"
                        whileTap={{ scale: 0.94 }}
                        onClick={() => {
                          setReason(r);
                          setStepUi("sign");
                        }}
                        className={cn(
                          "h-[22px] cursor-pointer rounded-full px-2 text-[10px] font-medium whitespace-nowrap transition-colors",
                          reason === r ? "bg-ios-orange/15 text-ios-orange" : "bg-fill-secondary text-heading hover:bg-fill",
                        )}
                      >
                        {r}
                      </motion.button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <StepTitle title="2 · E-signature" onCancel={() => setStepUi("reason")} />
                  <div className="mt-1.5 flex items-center gap-2">
                    <MemojiAvatar who="f6" size={24} alt={SIGNER.name} />
                    <div className="min-w-0 leading-tight">
                      <div className="truncate text-[11px] font-medium text-heading">{SIGNER.name}</div>
                      <div className="truncate text-[10px] text-tertiary">{reason}</div>
                    </div>
                  </div>
                  <HoldButton label="Hold to sign" holdingLabel="Signing…" tint="var(--ios-orange)" icon={<Signature16Filled />} onConfirm={sign} className="mt-auto" />
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Widget>
  );
}

function StepTitle({ title, onCancel }: { title: string; onCancel: () => void }) {
  return (
    <div className="flex items-center text-[11px] font-semibold text-secondary">
      {title}
      <button
        type="button"
        aria-label="Back"
        onClick={onCancel}
        className="ml-auto grid size-5 cursor-pointer place-items-center rounded-full bg-fill-secondary text-tertiary hover:text-heading"
      >
        <Dismiss12Regular />
      </button>
    </div>
  );
}
