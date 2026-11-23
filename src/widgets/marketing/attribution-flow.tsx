import { Flow20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useId, useMemo, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { Segmented } from "@/registry/antuikit/ui/segmented";

type Model = "First" | "Linear" | "Last";

const CHANNELS = [
  { name: "Paid Search", color: "var(--ios-blue)", text: "text-ios-blue", trial: 0.62 },
  { name: "Social", color: "var(--ios-pink)", text: "text-ios-pink", trial: 0.78 },
  { name: "Email", color: "var(--ios-orange)", text: "text-ios-orange", trial: 0.48 },
  { name: "Organic", color: "var(--ios-green)", text: "text-ios-green", trial: 0.66 },
  { name: "Referral", color: "var(--ios-purple)", text: "text-ios-purple", trial: 0.6 },
];

/** Conversions credited to each channel under each model; every row sums to 1,846. */
const CREDIT: Record<Model, number[]> = {
  First: [488, 542, 196, 471, 149],
  Linear: [551, 417, 318, 430, 130],
  Last: [612, 298, 421, 389, 126],
};
const TOTAL = 1_846;

const NOTE: Record<Model, string> = {
  First: "Credit goes to the visit that first brought them in.",
  Linear: "Credit is split evenly across every touch.",
  Last: "Credit goes to the final touch before converting.",
};

const W = 376;
const H = 212;
const GAP = 6;
const NODE = 8;
const X0 = NODE;
const X1 = W - NODE;
const MID = (X0 + X1) / 2;
const K = (H - GAP * (CHANNELS.length - 1)) / TOTAL;
const OUT_GAP = H - TOTAL * K;

function ribbon(y0: number, y1: number, w: number) {
  const f = (n: number) => n.toFixed(2);
  return `M${X0} ${f(y0)} C${MID} ${f(y0)} ${MID} ${f(y1)} ${X1} ${f(y1)} L${X1} ${f(y1 + w)} C${MID} ${f(y1 + w)} ${MID} ${f(y0 + w)} ${X0} ${f(y0 + w)} Z`;
}
function centre(y0: number, y1: number, w: number) {
  const a = y0 + w / 2;
  const b = y1 + w / 2;
  return `M${X0} ${a.toFixed(2)} C${MID} ${a.toFixed(2)} ${MID} ${b.toFixed(2)} ${X1} ${b.toFixed(2)}`;
}

function layout(model: Model) {
  const credit = CREDIT[model];
  const trial = credit.reduce((s, v, i) => s + v * CHANNELS[i].trial, 0);
  const trialH = trial * K;
  let left = 0;
  let rTrial = 0;
  let rPaid = trialH + OUT_GAP;
  const nodes = credit.map((v, i) => {
    const wT = v * CHANNELS[i].trial * K;
    const wP = v * (1 - CHANNELS[i].trial) * K;
    const top = left;
    const links = [
      { d: ribbon(top, rTrial, wT), c: centre(top, rTrial, wT) },
      { d: ribbon(top + wT, rPaid, wP), c: centre(top + wT, rPaid, wP) },
    ];
    left += wT + wP + GAP;
    rTrial += wT;
    rPaid += wP;
    return { top, h: wT + wP, links };
  });
  return { nodes, trial: Math.round(trial), paid: TOTAL - Math.round(trial), trialH };
}

/** Marketing · large. A Sankey of channels flowing into trials and paid plans; hover a channel, switch the attribution model and ribbons reflow. */
export function AttributionFlowWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const uid = useId().replace(/:/g, "");
  const [model, setModel] = useState<Model>("Last");
  const [hot, setHot] = useState<number | null>(null);
  const g = useMemo(() => layout(model), [model]);
  const credit = CREDIT[model];
  const top = credit.indexOf(Math.max(...credit));
  const ch = hot === null ? null : CHANNELS[hot];

  return (
    <Widget size="large" index={index} label="Marketing attribution flow">
      <WidgetHeader
        icon={<Flow20Filled />}
        tint="var(--ios-teal)"
        title="Attribution"
        subtitle="Conversions · last 30 days"
        extra={
          <Segmented
            size="small"
            value={model}
            onChange={(v) => setModel(v as Model)}
            options={["First", "Linear", "Last"]}
          />
        }
      />

      <div className="mt-3 flex items-baseline-last justify-between gap-3 whitespace-nowrap">
        <div className="min-w-0">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={ch?.name ?? "all"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className={`truncate text-[11px] font-medium ${ch ? ch.text : "text-tertiary"}`}
            >
              {ch ? ch.name : "Conversions"}
            </motion.div>
          </AnimatePresence>
          <AnimatedNumber
            value={hot === null ? TOTAL : credit[hot]}
            className="text-[30px] leading-none font-semibold tracking-tight text-heading"
          />
        </div>
        <div className="text-right text-[11px] text-tertiary">
          {hot === null ? (
            <>
              Top · <span className="font-medium text-secondary">{CHANNELS[top].name}</span>
            </>
          ) : (
            <>
              <AnimatedNumber
                value={credit[hot] / TOTAL}
                format={{ style: "percent", maximumFractionDigits: 0 }}
                className="font-semibold text-secondary"
              />{" "}
              of credit
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        <svg
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full shrink-0 overflow-visible"
          onPointerLeave={() => setHot(null)}
          aria-label="Channel to outcome flow"
        >
          <defs>
            <clipPath id={`af-${uid}`}>
              <motion.rect
                x={0}
                y={-4}
                height={H + 8}
                initial={{ width: 0 }}
                animate={{ width: W }}
                transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
              />
            </clipPath>
          </defs>

          <g clipPath={`url(#af-${uid})`}>
            {g.nodes.map((n, i) => {
              const dim = hot !== null && hot !== i;
              return (
                <g key={CHANNELS[i].name} onPointerEnter={() => setHot(i)} className="cursor-default">
                  {n.links.map((l, j) => (
                    <motion.path
                      key={j}
                      d={l.d}
                      fill={CHANNELS[i].color}
                      initial={{ d: l.d, fillOpacity: 0.32 }}
                      animate={{ d: l.d, fillOpacity: dim ? 0.08 : hot === i ? 0.6 : j === 0 ? 0.32 : 0.24 }}
                      transition={{ d: { type: "spring", stiffness: 140, damping: 22 }, fillOpacity: { duration: 0.2 } }}
                    />
                  ))}
                  {n.links.map((l, j) => (
                    <motion.path
                      key={`f${j}`}
                      d={l.c}
                      fill="none"
                      stroke={CHANNELS[i].color}
                      strokeWidth={1.25}
                      strokeLinecap="round"
                      strokeDasharray="2 16"
                      className="pointer-events-none"
                      initial={{ d: l.c, strokeDashoffset: 0 }}
                      animate={{ d: l.c, strokeDashoffset: -36, opacity: dim ? 0 : hot === i ? 1 : 0.55 }}
                      transition={{
                        d: { type: "spring", stiffness: 140, damping: 22 },
                        strokeDashoffset: { duration: 2.4, repeat: Infinity, ease: "linear" },
                        opacity: { duration: 0.2 },
                      }}
                    />
                  ))}
                  <motion.rect
                    x={0}
                    width={NODE}
                    rx={2}
                    fill={CHANNELS[i].color}
                    initial={{ y: n.top, height: n.h }}
                    animate={{ y: n.top, height: n.h, opacity: dim ? 0.35 : 1 }}
                    transition={{ type: "spring", stiffness: 140, damping: 22 }}
                  />
                </g>
              );
            })}

            {/* Outcome nodes */}
            <motion.rect
              x={X1}
              width={NODE}
              rx={2}
              y={0}
              fill="var(--ant-color-text-secondary)"
              initial={{ height: g.trialH }}
              animate={{ height: g.trialH }}
              transition={{ type: "spring", stiffness: 140, damping: 22 }}
            />
            <motion.rect
              x={X1}
              width={NODE}
              rx={2}
              fill="var(--ant-color-text-secondary)"
              initial={{ y: g.trialH + OUT_GAP, height: H - g.trialH - OUT_GAP }}
              animate={{ y: g.trialH + OUT_GAP, height: H - g.trialH - OUT_GAP }}
              transition={{ type: "spring", stiffness: 140, damping: 22 }}
            />
          </g>

          {/* Labels sit on top of the ribbons with a surface-coloured halo */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: delay + 0.7 }}
            fontSize={11}
            className="pointer-events-none"
            stroke="var(--widget-surface)"
            strokeWidth={3}
            paintOrder="stroke"
            strokeLinejoin="round"
          >
            {g.nodes.map((n, i) => (
              <motion.text
                key={CHANNELS[i].name}
                x={NODE + 5}
                initial={{ y: n.top + n.h / 2 + 3.5 }}
                animate={{ y: n.top + n.h / 2 + 3.5, opacity: hot !== null && hot !== i ? 0.4 : 1 }}
                transition={{ y: { type: "spring", stiffness: 140, damping: 22 }, opacity: { duration: 0.2 } }}
                fill="var(--ant-color-text-heading)"
                fontWeight={500}
              >
                {CHANNELS[i].name}
              </motion.text>
            ))}
            <motion.text
              x={X1 - 5}
              textAnchor="end"
              fill="var(--ant-color-text-heading)"
              fontWeight={600}
              initial={{ y: g.trialH / 2 + 3.5 }}
              animate={{ y: g.trialH / 2 + 3.5 }}
              transition={{ type: "spring", stiffness: 140, damping: 22 }}
            >
              Trial · {g.trial.toLocaleString("en-US")}
            </motion.text>
            <motion.text
              x={X1 - 5}
              textAnchor="end"
              fill="var(--ant-color-text-heading)"
              fontWeight={600}
              initial={{ y: g.trialH + OUT_GAP + (H - g.trialH - OUT_GAP) / 2 + 3.5 }}
              animate={{ y: g.trialH + OUT_GAP + (H - g.trialH - OUT_GAP) / 2 + 3.5 }}
              transition={{ type: "spring", stiffness: 140, damping: 22 }}
            >
              Paid · {g.paid.toLocaleString("en-US")}
            </motion.text>
          </motion.g>
        </svg>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={model}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-auto truncate text-[11px] text-tertiary"
          >
            {NOTE[model]}
          </motion.p>
        </AnimatePresence>
      </div>
    </Widget>
  );
}
