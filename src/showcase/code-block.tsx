import { Checkmark16Regular, Copy16Regular } from "@fluentui/react-icons";
import { type ReactNode, useState } from "react";
import { cn } from "@/registry/antuikit/lib/utils";

/** Copies `text` and flips to a check for a moment. */
export function useCopy(ms = 1400) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, key = text) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(key);
    window.setTimeout(() => setCopied((c) => (c === key ? null : c)), ms);
  };
  return { copied, copy };
}

export function CopyButton({ text, label = "Copy code", className }: { text: string; label?: string; className?: string }) {
  const { copied, copy } = useCopy();
  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : label}
      onClick={() => copy(text)}
      className={cn(
        "flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-md px-1.5 text-[12px] text-tertiary transition-colors hover:bg-fill-tertiary hover:text-heading",
        className,
      )}
    >
      {copied ? <Checkmark16Regular className="text-ios-green" /> : <Copy16Regular />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

/* A small, dependency-free highlighter for the TSX, CSS and shell snippets in the
 * docs and the inspector. Order matters: the first group that matches wins. */
const TOKEN =
  /(\/\/.*$|\/\*.*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(<\/?[A-Za-z][\w.]*)|\b(import|from|export|default|function|return|const|let|type|interface|extends|if|else|true|false|null|undefined|new|async|await)\b|\b(\d+(?:\.\d+)?)\b/gm;
const TONE = ["text-tertiary italic", "text-ios-green", "text-ios-blue", "text-ios-pink", "text-ios-orange"];

export function highlight(line: string): ReactNode {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of line.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push(line.slice(last, at));
    const group = m.slice(1).findIndex((g) => g !== undefined);
    out.push(
      <span key={at} className={TONE[group]}>
        {m[0]}
      </span>,
    );
    last = at + m[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out.length ? out : " ";
}

/** A code snippet with its file name, a copy button and optional line numbers. */
export function CodeBlock({
  code,
  file,
  lang,
  numbers = false,
  plain = false,
  className,
}: {
  code: string;
  /** Shown in the header, e.g. `src/main.tsx`. */
  file?: string;
  /** Shown on the right of the header when there is no file, e.g. `bash`. */
  lang?: string;
  numbers?: boolean;
  /** Skip highlighting (shell commands read better uncolored). */
  plain?: boolean;
  className?: string;
}) {
  const lines = code.replace(/\n$/, "").split("\n");
  return (
    <div className={cn("mt-3 overflow-hidden rounded-xl bg-fill-quaternary ring-[0.5px] ring-inset ring-widget-ring", className)}>
      <div className="flex h-9 items-center gap-2 border-b-[0.5px] border-split pr-1 pl-3.5">
        <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-tertiary">{file ?? lang ?? ""}</span>
        <CopyButton text={code.replace(/\n$/, "")} />
      </div>
      <pre className="m-0 overflow-x-auto py-3 font-mono text-[12px] leading-[1.7] text-heading">
        {lines.map((line, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: lines of a fixed snippet
          <div key={i} className={cn("flex whitespace-pre pr-4", !numbers && "pl-3.5")}>
            {numbers ? <span className="w-10 shrink-0 select-none pr-3.5 text-right text-quaternary">{i + 1}</span> : null}
            <span>{plain ? line || " " : highlight(line)}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}
