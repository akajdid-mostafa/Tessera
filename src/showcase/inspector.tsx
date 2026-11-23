import {
  ArrowCounterclockwise16Regular,
  ArrowUpRight16Regular,
  Checkmark16Regular,
  Copy16Regular,
  Dismiss20Regular,
  LockClosed16Regular,
} from "@fluentui/react-icons";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Picked } from "@/app";
import { loadSource } from "@/catalog";
import { cn } from "@/registry/antuikit/lib/utils";
import { DEMO, PRODUCT, STORE_URL } from "./brand";
import { highlight } from "./code-block";

const SIZE_LABEL = { small: "Small · 1×1", medium: "Medium · 2×1", large: "Large · 2×2", xlarge: "Extra large · 4×2" };

const TABS = ["Usage", "Source"] as const;
type Tab = (typeof TABS)[number];

/** The right-hand drawer: the widget large, what it does, how to use it, and its source. */
export function Inspector({ picked, onClose }: { picked: Picked; onClose: () => void }) {
  const { category, entry } = picked;
  const [tab, setTab] = useState<Tab>("Usage");
  const [source, setSource] = useState<string>("");
  const [copied, setCopied] = useState(false);
  // Bumping the key remounts the widget, which plays its entrance again.
  const [replay, setReplay] = useState(0);

  // The public demo ships without the widget files, so its Source tab is locked.
  const locked = DEMO && tab === "Source";

  useEffect(() => {
    if (DEMO) return;
    let live = true;
    loadSource(category.slug, entry.id).then((s) => live && setSource(s));
    return () => {
      live = false;
    };
  }, [category.slug, entry.id]);

  const name = entry.Component.name || "Widget";
  const usage = `import { ${name} } from "@/widgets/${category.slug}/${entry.id}";

export function Dashboard() {
  return (
    <div className="shelf-grid">
      <div className="bento">
        <${name} />
      </div>
    </div>
  );
}`;
  const code = tab === "Source" ? source : usage;
  const file = tab === "Source" ? `widgets/${category.slug}/${entry.id}.tsx` : "app/dashboard.tsx";
  const Icon = category.icon;

  return (
    <motion.aside
      aria-label={entry.title}
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 28, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="fixed bottom-4 right-4 top-4 z-50 flex w-[min(476px,calc(100vw-32px))] flex-col gap-4 overflow-y-auto rounded-2xl bg-widget-surface p-[18px] shadow-[0_0_0_1px_var(--widget-ring),0_24px_60px_-24px_rgb(0_0_0/0.45)]"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[16px] font-medium tracking-tight text-heading">{entry.title}</div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-tertiary">
            <Icon className="text-ios-blue" fontSize={16} />
            {category.name}
            <span className="text-quaternary">·</span>
            {SIZE_LABEL[entry.size]}
          </div>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="grid size-7 cursor-pointer place-items-center rounded-md text-tertiary hover:bg-fill-tertiary hover:text-heading"
        >
          <Dismiss20Regular />
        </button>
      </div>

      <div className="relative grid place-items-center rounded-xl bg-widget-page px-4 py-8 ring-1 ring-inset ring-widget-ring">
        <motion.button
          type="button"
          aria-label="Replay entrance animation"
          title="Replay animation"
          onClick={() => setReplay((n) => n + 1)}
          whileTap={{ scale: 0.9 }}
          className="absolute right-2 top-2 z-10 grid size-7 cursor-pointer place-items-center rounded-md text-tertiary hover:bg-fill-tertiary hover:text-heading"
        >
          {/* One turn per press, backwards like the arrow points. */}
          <motion.span className="grid" animate={{ rotate: replay * -360 }} transition={{ type: "spring", stiffness: 200, damping: 22 }}>
            <ArrowCounterclockwise16Regular />
          </motion.span>
        </motion.button>
        <div
          className={cn(
            "grid gap-4 [grid-auto-rows:196px]",
            entry.size === "small" ? "w-[196px] grid-cols-1" : "w-[408px] max-w-full grid-cols-2",
          )}
        >
          <entry.Component key={replay} />
        </div>
      </div>

      <p className="m-0 text-[13.5px] leading-relaxed text-secondary">{entry.description}</p>

      <div className="overflow-hidden rounded-xl ring-1 ring-inset ring-widget-ring">
        <div className="flex items-center gap-1 border-b border-split p-1.5">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-[13px]",
                t === tab ? "bg-fill-tertiary text-heading" : "text-tertiary hover:text-heading",
              )}
            >
              {t}
              {DEMO && t === "Source" ? <LockClosed16Regular className="size-3.5 opacity-70" /> : null}
            </button>
          ))}
          <span className="ml-auto mr-1 truncate font-mono text-[11.5px] text-quaternary">{file}</span>
          {locked ? null : (
            <button
              type="button"
              aria-label="Copy code"
              onClick={() => {
                navigator.clipboard.writeText(code);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
              className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-tertiary hover:bg-fill-tertiary hover:text-heading"
            >
              {copied ? <Checkmark16Regular className="text-ios-green" /> : <Copy16Regular />}
            </button>
          )}
        </div>
        {locked ? (
          <LockedSource />
        ) : (
          <pre className="m-0 max-h-[46vh] overflow-auto py-3 font-mono text-[11.5px] leading-[1.7] text-heading">
            {code.split("\n").map((line, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: lines of a fixed snippet
              <div key={i} className="flex whitespace-pre pr-4">
                <span className="w-10 shrink-0 select-none pr-3.5 text-right text-quaternary">{i + 1}</span>
                <span>{highlight(line)}</span>
              </div>
            ))}
          </pre>
        )}
      </div>
    </motion.aside>
  );
}

/** Line widths (in ch) of a made-up file, drawn as faint bars behind the locked note. */
const GHOST = [34, 22, 0, 28, 40, 36, 18, 30, 44, 26, 12, 0, 32, 20];

/** The demo's Source tab: the file stays in the kit, with a way to get it. */
function LockedSource() {
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="py-3 opacity-60 [mask-image:linear-gradient(#000,transparent_85%)]">
        {GHOST.map((w, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed decorative rows
          <div key={i} className="flex h-[19.5px] items-center">
            <span className="w-10 shrink-0 pr-3.5 text-right font-mono text-[11.5px] text-quaternary">{i + 1}</span>
            {w ? <span className="h-[7px] rounded-full bg-fill-secondary" style={{ width: `${w}ch` }} /> : null}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <LockClosed16Regular className="text-tertiary" />
        <div className="mt-2.5 text-[14px] font-medium text-heading">Source comes with the kit</div>
        <p className="m-0 mt-1 max-w-[280px] text-[13px] leading-relaxed text-tertiary">
          Every widget is one .tsx file you own and edit. Buy {PRODUCT} to get all of them.
        </p>
        <a
          href={STORE_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex h-8 items-center gap-1 rounded-lg bg-[var(--chip-bg)] pr-2.5 pl-3 text-[13px] font-medium text-[var(--chip-fg)] transition-transform active:scale-[0.97]"
        >
          Get {PRODUCT} on UI8 <ArrowUpRight16Regular />
        </a>
      </div>
    </div>
  );
}
