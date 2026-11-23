import { PlugConnected20Filled } from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Segmented } from "@/registry/antuikit/ui/segmented";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Pct = "p50" | "p95" | "p99";
type Endpoint = { method: "GET" | "POST"; path: string; rpm: string; errors: string; base: number; before: number; series: number[] };

const N = 16;
/** p95 in ms is the reference; the other percentiles scale from it. */
const MULT: Record<Pct, number> = { p50: 0.46, p95: 1, p99: 1.85 };

/** A seeded series: `shape` bends the recent end so each row has its own story. */
function seed(base: number, shape: (i: number) => number) {
  return Array.from({ length: N }, (_, i) => Math.round(base * shape(i) * (0.94 + ((i * 37) % 11) / 90)));
}

const SEED: Endpoint[] = [
  // Regressed after this morning's deploy: a new fraud check runs in the request path.
  { method: "POST", path: "/v2/checkout", rpm: "420 rpm", errors: "0.31% errors", base: 412, before: 298, series: seed(412, (i) => (i < 9 ? 0.74 : 1)) },
  { method: "GET", path: "/v2/catalog/search", rpm: "3.1k rpm", errors: "0.02% errors", base: 184, before: 191, series: seed(184, () => 1) },
  { method: "GET", path: "/v2/orders/{id}", rpm: "1.8k rpm", errors: "0.05% errors", base: 96, before: 112, series: seed(96, (i) => 1.18 - i * 0.012) },
  { method: "POST", path: "/v1/webhooks/in", rpm: "960 rpm", errors: "0.12% errors", base: 58, before: 55, series: seed(58, () => 1) },
];

const W = 56;
const H = 18;

function spark(values: number[]) {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = Math.max(1, hi - lo);
  return values
    .map((v, i) => `${i ? "L" : "M"}${((i / (N - 1)) * W).toFixed(1)} ${(H - 2 - ((v - lo) / span) * (H - 4)).toFixed(1)}`)
    .join(" ");
}

/** SaaS · medium. API endpoints as stock-style rows with latency sparklines that tick live; switch percentile and the values, lines and change pills follow. */
export function EndpointLatencyWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [pct, setPct] = useState<Pct>("p95");
  const [rows, setRows] = useState(SEED);

  useEffect(() => {
    const t = window.setInterval(() => {
      setRows((list) =>
        list.map((e) => {
          const next = Math.round(e.base * (0.93 + Math.random() * 0.14));
          return { ...e, series: [...e.series.slice(1), next] };
        }),
      );
    }, 2000);
    return () => window.clearInterval(t);
  }, []);

  const m = MULT[pct];

  return (
    <Widget size="medium" index={index} label="API endpoint latency">
      <WidgetHeader
        icon={<PlugConnected20Filled />}
        tint="var(--ios-teal)"
        title="API Endpoints"
        subtitle="Latency · last 30 min"
        extra={
          <Segmented
            size="small"
            value={pct}
            onChange={(v) => setPct(v as Pct)}
            options={[
              { label: "p50", value: "p50" },
              { label: "p95", value: "p95" },
              { label: "p99", value: "p99" },
            ]}
          />
        }
      />

      <ul className="mt-2 flex flex-col gap-2">
        {rows.map((e, i) => {
          const now = Math.round(e.series[N - 1] * m);
          const change = e.series[N - 1] / e.before - 1;
          const bad = change > 0.1;
          const good = change < -0.05;
          const d = spark(e.series);
          return (
            <motion.li
              key={e.path}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + i * 0.07, type: "spring", stiffness: 380, damping: 28 }}
              className={cn("relative", i > 0 && "before:absolute before:inset-x-0 before:-top-1 before:h-[0.5px] before:bg-split")}
            >
              <Tooltip title={`${e.method} ${e.path} · ${e.rpm} · ${e.errors} · was ${Math.round(e.before * m)} ms before deploy`} placement="top">
                <div className="-mx-1.5 flex h-[25px] cursor-default items-center gap-2 px-1.5 transition-colors duration-200 hover:bg-fill-quaternary">
                  <span
                    className={cn(
                      "w-[34px] shrink-0 rounded px-1 py-px text-center font-mono text-[9px] font-semibold",
                      e.method === "GET" ? "bg-ios-blue/15 text-ios-blue" : "bg-ios-purple/15 text-ios-purple",
                    )}
                  >
                    {e.method}
                  </span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate font-mono text-[11px] font-medium text-heading">{e.path}</div>
                    <div className="truncate text-[10px] text-tertiary">{e.rpm}</div>
                  </div>
                  <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="shrink-0 overflow-visible" aria-hidden>
                    <motion.path
                      d={d}
                      fill="none"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      style={{ stroke: bad ? "var(--ios-red)" : "var(--ant-color-text-tertiary)" }}
                      initial={{ d, pathLength: 0 }}
                      animate={{ d, pathLength: 1 }}
                      transition={{ pathLength: { delay: delay + 0.2 + i * 0.07, duration: 0.8 }, d: { duration: 0.5, ease: "easeOut" } }}
                    />
                  </svg>
                  <span className="w-[54px] shrink-0 text-right text-[13px] font-semibold text-heading">
                    <AnimatedNumber value={now} />
                    <span className="ml-0.5 text-[10px] font-medium text-tertiary">ms</span>
                  </span>
                  <span
                    className={cn(
                      "w-[46px] shrink-0 rounded-md py-0.5 text-center text-[11px] font-semibold tabular transition-colors duration-300",
                      bad ? "bg-ios-red text-white" : good ? "bg-ios-green/15 text-ios-green" : "bg-fill-tertiary text-secondary",
                    )}
                  >
                    {change >= 0 ? "+" : "−"}
                    {Math.abs(Math.round(change * 100))}%
                  </span>
                </div>
              </Tooltip>
            </motion.li>
          );
        })}
      </ul>
    </Widget>
  );
}
