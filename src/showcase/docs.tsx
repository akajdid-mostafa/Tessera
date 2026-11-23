import { Checkmark12Filled, Dismiss12Filled } from "@fluentui/react-icons";
import { type ReactNode, useEffect, useState } from "react";
import { categories, total } from "@/catalog";
import { cn } from "@/registry/antuikit/lib/utils";
import { CodeBlock, CopyButton, useCopy } from "./code-block";

/* ------------------------------------------------------------------ content */

const SECTIONS = [
  { id: "install", label: "Installation" },
  { id: "quick-start", label: "Quick start" },
  { id: "grid", label: "Grid and sizes" },
  { id: "widget", label: "Widget" },
  { id: "header", label: "WidgetHeader" },
  { id: "number", label: "AnimatedNumber" },
  { id: "theming", label: "Theming" },
  { id: "colors", label: "Colors" },
  { id: "authoring", label: "Writing a widget" },
] as const;

const DEPS = "antd @ant-design/cssinjs motion @number-flow/react recharts @fluentui/react-icons clsx tailwind-merge class-variance-authority";
const DEV_DEPS = "tailwindcss @tailwindcss/vite tw-animate-css";
const MANAGERS = {
  pnpm: { add: "pnpm add", dev: "pnpm add -D" },
  npm: { add: "npm install", dev: "npm install -D" },
  yarn: { add: "yarn add", dev: "yarn add -D" },
  bun: { add: "bun add", dev: "bun add -d" },
} as const;
type Manager = keyof typeof MANAGERS;

const COPY_FILES = `src/registry/antuikit/   # the kit: theme, provider, UI components
src/motion/              # Widget shell, WidgetHeader, AnimatedNumber, glow
src/lib/memoji.tsx       # MemojiAvatar, the faces every widget uses
public/memoji/           # the memoji images
src/styles.css           # tokens, iOS colors and the grid classes
src/widgets/<shelf>/     # the widgets you want`;

const VITE = `import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: [{ find: "@", replacement: resolve(import.meta.dirname, "src") }],
  },
});`;

const TSCONFIG = `{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}`;

const MAIN = `import { createRoot } from "react-dom/client";
import { AntuikitProvider } from "@/registry/antuikit/providers/antuikit-provider";
import { App } from "./app";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <AntuikitProvider defaultMode="auto">
    <App />
  </AntuikitProvider>,
);`;

const DASHBOARD = `import { PropertyValueWidget } from "@/widgets/real-estate/property-value";
import { OccupancyWidget } from "@/widgets/hospitality/occupancy";
import { LiveSalesWidget } from "@/widgets/ecommerce/live-sales";

export function Dashboard() {
  return (
    // shelf-grid sets the container the cells are sized from.
    <div className="shelf-grid">
      <div className="bento">
        <PropertyValueWidget index={0} />
        <OccupancyWidget index={1} />
        <LiveSalesWidget index={2} />
      </div>
    </div>
  );
}`;

const SHELL = `import { Home20Filled } from "@fluentui/react-icons";
import { useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";

/** Small. Tonight's occupancy; tap to switch between rooms and beds. */
export function TonightWidget({ index }: { index?: number }) {
  const [beds, setBeds] = useState(false);
  return (
    <Widget size="small" index={index} label="Tonight" pressable onPress={() => setBeds((b) => !b)}>
      <WidgetHeader icon={<Home20Filled />} tint="var(--ios-indigo)" title="Tonight" subtitle={beds ? "Beds" : "Rooms"} />
      <AnimatedNumber
        value={beds ? 0.78 : 0.91}
        format={{ style: "percent" }}
        className="mt-auto text-[30px] leading-none font-semibold tracking-tight text-heading"
      />
    </Widget>
  );
}`;

const THEME_TOGGLE = `import { useAntuikitTheme } from "@/registry/antuikit/providers/antuikit-provider";

export function ThemeToggle() {
  const { isDark, setMode } = useAntuikitTheme();
  return <button onClick={() => setMode(isDark ? "light" : "dark")}>{isDark ? "Light" : "Dark"}</button>;
}`;

type Row = [prop: string, type: string, def: string, what: string];

const WIDGET_PROPS: Row[] = [
  ["size", '"small" | "medium" | "large" | "xlarge"', "—", "Grid span: 1×1, 2×1, 2×2 or 4×2 cells. Required."],
  ["index", "number", "0", "Position in the grid; staggers the entrance."],
  ["label", "string", "—", "Accessible name for the widget."],
  ["pressable", "boolean", "false", "Presses down on tap. Only when the whole face is the control."],
  ["onPress", "() => void", "—", "Called on tap, e.g. to page through views."],
  ["glow", "boolean | GlowEffectProps", "—", "A blurred conic glow behind the widget while hovered."],
  ["glowActive", "boolean", "—", "Forces the glow on for live events (a new order, an alarm)."],
  ["beam", "boolean | BorderBeamProps", "—", "A light running the edge, for live or highlighted states."],
  ["surfaceClassName", "string", "—", "Replaces the surface fill, for full-bleed tinted widgets."],
  ["className", "string", "—", "Classes on the outer motion wrapper."],
];

const HEADER_PROPS: Row[] = [
  ["title", "ReactNode", "—", "The widget's name. Required."],
  ["subtitle", "ReactNode", "—", "One line of context under the title."],
  ["icon", "ReactNode", "—", "A 20px Fluent icon, drawn white on the tinted chip."],
  ["tint", "string", "var(--ant-color-primary)", "The chip color; pass an iOS color like var(--ios-teal)."],
  ["extra", "ReactNode", "—", "Right-aligned slot: a Segmented control, page dots, a total."],
];

const NUMBER_PROPS: Row[] = [
  ["value", "number", "—", "The number to roll to. Required."],
  ["format", "Intl.NumberFormatOptions", "—", "Currency, percent, compact notation, fraction digits."],
  ["prefix", "string", "—", "Text before the digits."],
  ["suffix", "string", "—", "Text after the digits, e.g. × avg."],
  ["locales", "string", "—", "Formatting locale; the browser's by default."],
  ["trend", "-1 | 0 | 1", "—", "Forces the roll direction of the digits."],
  ["className", "string", "—", "Size, weight and color of the figure."],
];

const PROVIDER_PROPS: Row[] = [
  ["defaultMode", '"light" | "dark" | "auto"', '"auto"', "Initial theme; auto follows the OS."],
  ["defaultCompact", "boolean", "false", "Starts in compact density."],
  ["defaultDirection", '"ltr" | "rtl"', '"ltr"', "Initial text direction."],
  ["theme", "AntuikitTheme", "built in", "One antd ThemeConfig per mode, to rebrand."],
];

const SIZES = [
  { name: "small", cols: 1, rows: 1, box: "164 × 164" },
  { name: "medium", cols: 2, rows: 1, box: "376 × 164" },
  { name: "large", cols: 2, rows: 2, box: "376 × 376" },
  { name: "xlarge", cols: 4, rows: 2, box: "800 × 376" },
] as const;

const IOS = ["blue", "green", "red", "orange", "yellow", "purple", "pink", "teal", "indigo", "mint"] as const;

const DO: [boolean, string][] = [
  [true, "One hero metric, one visual and a small meta row."],
  [true, "Color text with text-ios-* classes; they deepen in light mode so the text stays readable."],
  [true, "Soft fills for chips and buttons: bg-ios-green/15 with text-ios-green."],
  [true, "Hairline dividers: border-t-[0.5px] border-split or divide-y-[0.5px]."],
  [true, "Selected cells get a thin ring-1 ring-inset ring-sel, a darker shade of their own fill."],
  [true, "Clear every setInterval on unmount and roll changing numbers with AnimatedNumber."],
  [false, "Black text on a vivid fill, or white text on orange, yellow, green or mint."],
  [false, "2px black or heading-colored outlines around selected items."],
  [false, "Content taller than the cell: the card clips, it never grows."],
];

/* --------------------------------------------------------------- the page */

/** The docs page: install, quick start, the shell's API, theming and the house rules. */
export function Docs() {
  const active = useActiveSection();
  return (
    <div className="mt-10 grid gap-10 md:grid-cols-[176px_minmax(0,1fr)] md:gap-12">
      <nav aria-label="On this page" className="hidden md:block">
        <div className="sticky top-6">
          <div className="mb-2.5 text-[11.5px] font-medium tracking-wide text-tertiary uppercase">On this page</div>
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={cn(
                    "block rounded-md px-2 py-1 text-[13px] no-underline transition-colors",
                    active === s.id ? "bg-fill-quaternary font-medium text-heading" : "text-tertiary hover:text-heading",
                  )}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <article className="min-w-0 max-w-[680px] text-[14px] leading-relaxed text-secondary">
        <h1 className="m-0 text-[17px] font-medium tracking-tight text-heading">Docs</h1>
        <p className="mt-2.5">
          Every widget is one React file built on antuikit: Ant Design v6 components with a Tailwind token bridge, so it
          follows your theme in light and dark. Motion comes from <Code>motion</Code> and rolling digits from{" "}
          <Code>@number-flow/react</Code>.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat value={String(total)} label="widgets" />
          <Stat value={String(categories.length)} label="shelves" />
          <Stat value="4" label="sizes" />
        </div>

        <Section id="install" title="Installation">
          <Step n={1} title="Add the dependencies">
            <InstallTabs />
          </Step>
          <Step n={2} title="Copy the source">
            <p className="m-0">There is no package to install; the files are yours to edit.</p>
            <CodeBlock code={COPY_FILES} lang="files" plain />
          </Step>
          <Step n={3} title="Point @ at src">
            <p className="m-0">
              Every import uses the <Code>@/</Code> alias, in both Vite and TypeScript.
            </p>
            <CodeBlock code={VITE} file="vite.config.ts" />
            <CodeBlock code={TSCONFIG} file="tsconfig.json" />
          </Step>
          <Step n={4} title="Wrap the app and import the styles" last>
            <CodeBlock code={MAIN} file="src/main.tsx" />
          </Step>
        </Section>

        <Section id="quick-start" title="Quick start">
          <p className="m-0">
            Import widgets and drop them in a grid. Pass <Code>index</Code> so they land one after another.
          </p>
          <CodeBlock code={DASHBOARD} file="src/dashboard.tsx" numbers />
          <Note>
            Every widget's own source and usage snippet is one click away: open any widget on the Widgets page and copy
            it from the panel.
          </Note>
        </Section>

        <Section id="grid" title="Grid and sizes">
          <p className="m-0">
            Widgets come in four sizes on a 196px cell with 16px gaps. <Code>bento</Code> packs them densely so
            mixed sizes leave no holes; it sizes cells from the nearest <Code>shelf-grid</Code> container and runs two to
            four columns.
          </p>
          <SizeDiagram />
          <p className="mt-3">
            Each widget has 16px padding, so the content box is fixed. Content that does not fit is clipped by the card;
            the cell never grows.
          </p>
        </Section>

        <Section id="widget" title="Widget">
          <p className="m-0">
            Every widget renders inside <Code>&lt;Widget&gt;</Code>, which owns the surface, the entrance, the hover lift,
            the press, and the optional glow and beam. Widgets themselves only draw content.
          </p>
          <PropTable rows={WIDGET_PROPS} />
          <CodeBlock code={SHELL} file="src/widgets/hotel/tonight.tsx" numbers />
        </Section>

        <Section id="header" title="WidgetHeader">
          <p className="m-0">The title row most widgets open with: a tinted icon chip, a title and a subtitle. It takes 28px.</p>
          <PropTable rows={HEADER_PROPS} />
        </Section>

        <Section id="number" title="AnimatedNumber">
          <p className="m-0">Use it for every number that changes, so digits roll instead of jumping.</p>
          <PropTable rows={NUMBER_PROPS} />
        </Section>

        <Section id="theming" title="Theming">
          <p className="m-0">
            <Code>AntuikitProvider</Code> holds the theme. Widgets read antd tokens, so a rebrand is a new{" "}
            <Code>theme</Code>, not a change to any widget.
          </p>
          <PropTable rows={PROVIDER_PROPS} />
          <p className="mt-4">
            Read or switch the theme anywhere with <Code>useAntuikitTheme</Code>:
          </p>
          <CodeBlock code={THEME_TOGGLE} file="src/theme-toggle.tsx" />
        </Section>

        <Section id="colors" title="Colors">
          <p className="m-0">
            Data accents use ten system colors; neutrals stay on antd tokens. Click a swatch to copy its variable.
          </p>
          <Swatches />
          <p className="mt-3">
            In Tailwind they are <Code>text-ios-green</Code>, <Code>bg-ios-red/15</Code> and so on. For a solid fill under
            white text use the <Code>-deep</Code> variants: <Code>bg-ios-green-deep</Code>, <Code>bg-ios-orange-deep</Code>,{" "}
            <Code>bg-ios-yellow-deep</Code>, <Code>bg-ios-teal-deep</Code>, <Code>bg-ios-mint-deep</Code>.
          </p>
        </Section>

        <Section id="authoring" title="Writing a widget">
          <p className="m-0">
            One widget per file in <Code>src/widgets/&lt;shelf&gt;/&lt;id&gt;.tsx</Code>, registered in that shelf's{" "}
            <Code>index.ts</Code> with an id, title, size and a one-sentence description. The full guide lives in{" "}
            <Code>src/widgets/AUTHORING.md</Code>.
          </p>
          <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
            {DO.map(([ok, text]) => (
              <li key={text} className="flex items-start gap-2.5">
                <span
                  className={cn(
                    "mt-[3px] grid size-4 shrink-0 place-items-center rounded-full",
                    ok ? "bg-ios-green/15 text-ios-green" : "bg-ios-red/15 text-ios-red",
                  )}
                >
                  {ok ? <Checkmark12Filled className="size-2.5" /> : <Dismiss12Filled className="size-2.5" />}
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </Section>
      </article>
    </div>
  );
}

/* ------------------------------------------------------------- the pieces */

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-[5px] bg-fill-tertiary px-1 py-px font-mono text-[12.5px] text-heading">{children}</code>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const { copied, copy } = useCopy();
  return (
    <section id={id} className="scroll-mt-6 pt-12">
      <h2 className="group m-0 mb-3 flex items-center gap-2 text-[15px] font-medium text-heading">
        {title}
        <button
          type="button"
          aria-label={`Copy link to ${title}`}
          onClick={() => copy(`${location.origin}${location.pathname}#${id}`)}
          className="cursor-pointer text-[13px] font-normal text-quaternary opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          {copied ? "Link copied" : "#"}
        </button>
      </h2>
      {children}
    </section>
  );
}

function Step({ n, title, last, children }: { n: number; title: string; last?: boolean; children: ReactNode }) {
  return (
    <div className="relative flex gap-3.5 pb-7 last:pb-0">
      {last ? null : <span aria-hidden className="absolute top-7 bottom-1 left-[11px] w-[0.5px] bg-split" />}
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-fill-tertiary text-[12px] font-semibold text-heading tabular">
        {n}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="mb-1.5 text-[14px] font-medium text-heading">{title}</div>
        {children}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-fill-quaternary px-3.5 py-2.5">
      <div className="text-[20px] leading-none font-semibold tracking-tight text-heading tabular">{value}</div>
      <div className="mt-1 text-[12px] text-tertiary">{label}</div>
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="mt-3 rounded-xl bg-ios-blue/10 px-3.5 py-2.5 text-[13px] text-secondary">{children}</p>;
}

function InstallTabs() {
  const [pm, setPm] = useState<Manager>(() => {
    try {
      return (localStorage.getItem("docs-pm") as Manager) || "pnpm";
    } catch {
      return "pnpm";
    }
  });
  const pick = (m: Manager) => {
    setPm(m);
    try {
      localStorage.setItem("docs-pm", m);
    } catch {}
  };
  const cmd = `${MANAGERS[pm].add} ${DEPS}\n${MANAGERS[pm].dev} ${DEV_DEPS}`;
  return (
    <div className="overflow-hidden rounded-xl bg-fill-quaternary ring-[0.5px] ring-inset ring-widget-ring">
      <div className="flex h-9 items-center gap-0.5 border-b-[0.5px] border-split pr-1 pl-1.5">
        {(Object.keys(MANAGERS) as Manager[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => pick(m)}
            aria-pressed={pm === m}
            className={cn(
              "h-6 cursor-pointer rounded-md px-2 font-mono text-[11.5px]",
              pm === m ? "bg-fill-tertiary text-heading" : "text-tertiary hover:text-heading",
            )}
          >
            {m}
          </button>
        ))}
        <span className="flex-1" />
        <CopyButton text={cmd} label="Copy install command" />
      </div>
      <pre className="m-0 overflow-x-auto px-3.5 py-3 font-mono text-[12px] leading-[1.7] whitespace-pre-wrap text-heading">
        {cmd.split("\n").map((l) => (
          <div key={l}>
            <span className="select-none text-quaternary">$ </span>
            {l}
          </div>
        ))}
      </pre>
    </div>
  );
}

function SizeDiagram() {
  const cell = 34;
  const gap = 4;
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {SIZES.map((s) => (
        <div key={s.name} className="flex flex-col rounded-xl bg-fill-quaternary p-3">
          <div className="grid h-[72px] place-items-center">
            <div
              className="grid"
              style={{ gridTemplateColumns: `repeat(${s.cols}, ${cell / (s.cols > 2 ? 2 : 1)}px)`, gap }}
            >
              {Array.from({ length: s.cols * s.rows }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static diagram cells
                <span key={i} className="rounded-[4px] bg-ios-blue/25" style={{ height: cell / (s.cols > 2 ? 2 : 1) }} />
              ))}
            </div>
          </div>
          <div className="mt-2 font-mono text-[12px] text-heading">{s.name}</div>
          <div className="text-[11.5px] text-tertiary tabular">
            {s.cols}×{s.rows} cells · {s.box}
          </div>
        </div>
      ))}
    </div>
  );
}

function Swatches() {
  const { copied, copy } = useCopy();
  return (
    <div className="mt-4 grid grid-cols-5 gap-2">
      {IOS.map((c) => {
        const v = `var(--ios-${c})`;
        const done = copied === v;
        return (
          <button
            key={c}
            type="button"
            onClick={() => copy(v)}
            aria-label={`Copy ${v}`}
            className="group cursor-pointer rounded-xl bg-fill-quaternary p-2 text-left transition-colors hover:bg-fill-tertiary"
          >
            <span className="block h-9 rounded-lg" style={{ background: v }} />
            <span className="mt-1.5 block truncate font-mono text-[11px] text-heading">{done ? "Copied" : c}</span>
          </button>
        );
      })}
    </div>
  );
}

function PropTable({ rows }: { rows: Row[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl ring-[0.5px] ring-inset ring-widget-ring">
      <table className="w-full min-w-[560px] border-collapse text-[13px]">
        <thead>
          <tr className="bg-fill-quaternary">
            {["Prop", "Type", "Default", "Description"].map((h) => (
              <th key={h} className="px-3.5 py-2 text-left text-[12px] font-medium text-tertiary">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([p, t, d, w]) => (
            <tr key={p} className="border-t-[0.5px] border-split">
              <td className="px-3.5 py-2 align-top font-mono text-[12px] whitespace-nowrap text-heading">{p}</td>
              <td className="px-3.5 py-2 align-top font-mono text-[11.5px] text-ios-purple">{t}</td>
              <td className="px-3.5 py-2 align-top font-mono text-[11.5px] whitespace-nowrap text-tertiary">{d}</td>
              <td className="px-3.5 py-2 align-top">{w}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The last section whose heading has scrolled past the top third, for the table of contents. */
function useActiveSection() {
  const [active, setActive] = useState<string>(SECTIONS[0].id);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight * 0.3;
      let cur: string = SECTIONS[0].id;
      for (const sec of SECTIONS) {
        const el = document.getElementById(sec.id);
        if (el && el.getBoundingClientRect().top <= line) cur = sec.id;
      }
      // At the very bottom the last sections can never reach the line.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = SECTIONS[SECTIONS.length - 1].id;
      setActive(cur);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return active;
}
