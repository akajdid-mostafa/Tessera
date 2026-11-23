import {
  ArrowClockwise16Regular,
  BranchRequest20Filled,
  Checkmark16Filled,
  CheckmarkCircle16Filled,
  DismissCircle16Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { Button } from "@/registry/antuikit/ui/button";
import { Tooltip } from "@/registry/antuikit/ui/tooltip";

type Checks = "pass" | "fail" | "pending";
type PR = { repo: string; n: number; title: string; author: string; age: string; add: number; del: number; checks: Checks; detail: string };

const PRS: PR[] = [
  { repo: "storefront-web", n: 4821, title: "Fix tax rounding on multi-currency checkout", author: "Ellie Kane", age: "2h", add: 142, del: 38, checks: "pass", detail: "14/14 checks passed" },
  { repo: "api-gateway", n: 1307, title: "Per-tenant rate limiting for /v2/orders", author: "Marcus Lee", age: "5h", add: 318, del: 61, checks: "fail", detail: "2 of 11 failed · e2e (chromium)" },
  { repo: "design-system", n: 912, title: "Migrate spacing scale to rem tokens", author: "Sofia Reyes", age: "1d", add: 96, del: 104, checks: "pending", detail: "Running · 6 of 9 complete" },
  { repo: "storefront-web", n: 4816, title: "Lazy-load the analytics dashboard charts", author: "Daniel Okafor", age: "1d", add: 57, del: 12, checks: "pass", detail: "14/14 checks passed" },
  { repo: "infra", n: 288, title: "Bump Terraform AWS provider to 5.72", author: "Hannah Berg", age: "2d", add: 9, del: 9, checks: "pass", detail: "6/6 checks passed" },
  { repo: "mobile-app", n: 2044, title: "Handle expired refresh tokens on resume", author: "Kenji Sato", age: "2d", add: 88, del: 23, checks: "fail", detail: "1 of 8 failed · iOS unit tests" },
  { repo: "api-gateway", n: 1299, title: "Structured logging for webhook retries", author: "Priya Shah", age: "3d", add: 140, del: 47, checks: "pass", detail: "11/11 checks passed" },
  { repo: "storefront-web", n: 4790, title: "Remove legacy feature flags from settings", author: "Tom Novak", age: "4d", add: 12, del: 236, checks: "pass", detail: "14/14 checks passed" },
];
const VISIBLE = 3;

/** SaaS · medium. Pull requests waiting on you; Approve collapses a row away and the next one slides up. */
export function PullRequestsWidget({ index }: { index?: number }) {
  const delay = 0.3 + (index ?? 0) * 0.06;
  const [queue, setQueue] = useState<number[]>(() => PRS.map((p) => p.n));
  const [approving, setApproving] = useState<number | null>(null);

  const approve = (n: number) => {
    if (approving !== null) return;
    setApproving(n);
    window.setTimeout(() => {
      setQueue((q) => q.filter((x) => x !== n));
      setApproving(null);
    }, 550);
  };

  const rows = queue.slice(0, VISIBLE).map((n) => PRS.find((p) => p.n === n)!);

  return (
    <Widget size="medium" index={index} label="Pull requests awaiting review">
      <WidgetHeader
        icon={<BranchRequest20Filled />}
        tint="var(--ios-indigo)"
        title="Pull Requests"
        subtitle="Reviews requested · acme"
        extra={
          <AnimatedNumber
            value={queue.length}
            className={cn(
              "text-[26px] leading-none font-semibold tracking-tight transition-colors duration-mid",
              queue.length ? "text-heading" : "text-ios-green",
            )}
          />
        }
      />

      <div className="relative mt-2 min-h-0 flex-1">
        <ul className="flex flex-col">
          <AnimatePresence initial={false}>
            {rows.map((pr, i) => (
              <motion.li
                key={pr.n}
                className="overflow-hidden"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 41 }}
                exit={{ opacity: 0, height: 0, x: 40, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}
                transition={{ type: "spring", stiffness: 380, damping: 34 }}
              >
                <motion.div
                  className={cn("flex h-[41px] items-center gap-2", i < rows.length - 1 && "border-b-[0.5px] border-split")}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: delay + i * 0.07, type: "spring", stiffness: 380, damping: 28 }}
                >
                  <MemojiAvatar who={pr.author} size={24} />
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-[12px] font-medium text-heading">{pr.title}</div>
                    <div className="truncate text-[10px] text-tertiary tabular">
                      {pr.repo} #{pr.n} · {pr.age} ·{" "}
                      <span className="text-ios-green">+{pr.add}</span> <span className="text-ios-red">−{pr.del}</span>
                    </div>
                  </div>
                  <Tooltip title={pr.detail}>
                    <span className="grid shrink-0 cursor-default place-items-center text-[16px]">
                      <ChecksIcon checks={pr.checks} />
                    </span>
                  </Tooltip>
                  <Button
                    size="small"
                    shape="round"
                    color="green"
                    variant={approving === pr.n ? "solid" : "filled"}
                    icon={approving === pr.n ? <Checkmark16Filled /> : undefined}
                    onClick={() => approve(pr.n)}
                    className={cn("w-[78px] shrink-0 text-[11px] font-semibold", approving !== pr.n && "text-ios-green")}
                  >
                    {approving === pr.n ? "Approved" : "Approve"}
                  </Button>
                </motion.div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <AnimatePresence>
          {queue.length === 0 ? (
            <motion.div
              key="empty"
              className="absolute inset-0 flex flex-col items-center justify-center gap-1"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 24 }}
            >
              <CheckmarkCircle16Filled className="text-[26px] text-ios-green" />
              <div className="text-[13px] font-semibold text-heading">All caught up</div>
              <button
                type="button"
                onClick={() => setQueue(PRS.map((p) => p.n))}
                className="flex cursor-pointer items-center gap-1 text-[11px] text-tertiary transition-colors duration-mid hover:text-secondary"
              >
                <ArrowClockwise16Regular /> Reload requests
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </Widget>
  );
}

function ChecksIcon({ checks }: { checks: Checks }) {
  if (checks === "pass") return <CheckmarkCircle16Filled className="text-ios-green" />;
  if (checks === "fail") return <DismissCircle16Filled className="text-ios-red" />;
  return (
    <span className="relative grid size-4 place-items-center" aria-label="Checks running">
      <motion.span
        className="absolute inset-[3px] rounded-full border-2 border-ios-yellow border-t-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
      />
    </span>
  );
}
