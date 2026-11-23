import { ArrowDown20Regular, Grid20Regular, WeatherMoon16Regular, WeatherSunny16Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { Activity, useEffect, useMemo, useState } from "react";
import { type Category, categories, total, type WidgetEntry } from "@/catalog";
import { cn } from "@/registry/antuikit/lib/utils";
import { useAntuikitTheme } from "@/registry/antuikit/providers/antuikit-provider";
import { Logo, PRODUCT, STORE_URL, VERSION } from "@/showcase/brand";
import { Docs } from "@/showcase/docs";
import { HeroBento } from "@/showcase/hero";
import { LazyWidget } from "@/showcase/lazy-widget";
import { MoreProducts } from "@/showcase/more-products";
import { Inspector } from "@/showcase/inspector";

type Page = "widgets" | "docs";
export type Picked = { category: Category; entry: WidgetEntry };

const RISE = { initial: { opacity: 0, y: 8, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 } };
const EASE = [0.16, 1, 0.3, 1] as const;

export function App() {
  const [page, setPage] = useState<Page>(() => (location.hash === "#docs" ? "docs" : "widgets"));
  const [shelf, setShelf] = useState("all");
  const [open, setOpen] = useState<Picked | null>(null);
  // Docs mounts on its first visit and then stays, like the widgets page.
  const [docsSeen, setDocsSeen] = useState(page === "docs");
  useEffect(() => {
    if (page === "docs") setDocsSeen(true);
  }, [page]);

  useEffect(() => {
    history.replaceState(null, "", location.pathname + location.search + (page === "docs" ? "#docs" : ""));
  }, [page]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  const shown = useMemo(
    () => categories.filter((c) => c.entries.length > 0 && (shelf === "all" || c.slug === shelf)),
    [shelf],
  );

  const go = (next: () => void) => {
    next();
    scrollTo({ top: 0 });
  };

  return (
    // The page width snaps down to whole gallery columns (196px cells, 16px gaps) so the grid's
    // right edge lines up with the top bar: 2·32 padding + 216 sidebar + 48 gap + 2–4 columns.
    // Thresholds keep 16px spare for a classic scrollbar.
    <div className="mx-auto px-5 pb-24 sm:px-8 md:max-w-[740px] min-[964px]:max-w-[948px] min-[1176px]:max-w-[1160px]">
      <TopBar page={page} onPage={(p) => go(() => setPage(p))} />

      {/* Both pages stay mounted; the hidden one sits in a hidden Activity, which keeps
          its DOM and state but pauses its effects (widget timers, observers).
          Unmounting the widgets page tore down ~370 lazy cells and rebuilt them on
          the way back, which froze the switch for half a second. */}
      {docsSeen ? (
        <Activity mode={page === "docs" ? "visible" : "hidden"}>
        <motion.div
          initial={false}
          animate={page === "docs" ? RISE.animate : RISE.initial}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <Docs />
        </motion.div>
        </Activity>
      ) : null}
      <Activity mode={page === "widgets" ? "visible" : "hidden"}>
      <motion.div
        initial={false}
        animate={page === "widgets" ? RISE.animate : RISE.initial}
        transition={{ duration: 0.35, ease: EASE }}
        className="mt-10 grid gap-10 md:grid-cols-[216px_minmax(0,1fr)] md:gap-12"
      >
            <Sidebar value={shelf} onChange={(s) => go(() => setShelf(s))} />

            <main className="min-w-0">
              {/* Keyed, not wrapped in AnimatePresence: waiting for every widget's
                  exit made the page sit blank between shelves. */}
              <motion.div
                  key={shelf}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  <h1 className="m-0 text-[17px] font-medium tracking-tight text-heading">
                    Every widget, by the work it{" "}
                    <i className="font-[Instrument_Serif,Georgia,serif] text-[1.18em] font-normal">watches</i>.
                  </h1>
                  <p className="mt-2.5 max-w-[580px] text-[14.5px] leading-relaxed text-secondary">
                    {categories.length} shelves and {total} live widgets for dashboards and control panels, from a
                    hotel's front desk to a dam's spillway. Each one moves, answers a touch, and switches between light
                    and dark. Hover one and open it to see it large and copy its code.
                  </p>

                  {shelf === "all" ? <HeroBento onInspect={setOpen} /> : null}

                  {shown.map((c, ci) => (
                    <Shelf key={c.slug} category={c} order={ci} onInspect={(entry) => setOpen({ category: c, entry })} />
                  ))}

                  <MoreProducts />

                  <footer className="mt-24 text-[13px] text-quaternary">
                    {total} widgets · React + antuikit · Light and dark
                  </footer>
                </motion.div>
            </main>
      </motion.div>
      </Activity>

      <AnimatePresence>
        {open ? <Inspector key={`${open.category.slug}/${open.entry.id}`} picked={open} onClose={() => setOpen(null)} /> : null}
      </AnimatePresence>
    </div>
  );
}

function TopBar({ page, onPage }: { page: Page; onPage: (p: Page) => void }) {
  const { isDark, setMode } = useAntuikitTheme();
  return (
    <header className="flex h-14 items-center justify-between">
      {/* Same columns as the sidebar rows below: a 20px icon slot, then the label. */}
      <div className="flex items-center gap-2.5 pl-2.5 text-[15px] font-medium tracking-tight text-heading">
        <span className="flex w-[18px]">
          <Logo size={20} className="shrink-0" />
        </span>
        <span>
          {PRODUCT} <span className="ml-1 text-[12.5px] font-normal text-tertiary">{VERSION}</span>
        </span>
      </div>
      <nav className="flex items-center gap-5">
        {(["widgets", "docs"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => page !== p && onPage(p)}
            className={cn(
              "cursor-pointer text-[13.5px] capitalize transition-colors duration-mid",
              page === p ? "text-heading" : "text-tertiary hover:text-heading",
            )}
          >
            {p}
          </button>
        ))}
        <div className="flex rounded-lg bg-fill-tertiary p-0.5" role="radiogroup" aria-label="Theme">
          {[
            { dark: false, Icon: WeatherSunny16Regular, label: "Light" },
            { dark: true, Icon: WeatherMoon16Regular, label: "Dark" },
          ].map(({ dark, Icon, label }) => (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={isDark === dark}
              aria-label={label}
              onClick={() => setMode(dark ? "dark" : "light")}
              className={cn(
                "relative grid h-7 w-8 cursor-pointer place-items-center rounded-md text-tertiary",
                isDark === dark && "text-heading",
              )}
            >
              {isDark === dark ? (
                <motion.span
                  layoutId="theme-pill"
                  className="absolute inset-0 rounded-md bg-widget-surface shadow-[0_1px_2px_rgb(0_0_0/0.12)]"
                  transition={{ type: "spring", stiffness: 500, damping: 36 }}
                />
              ) : null}
              <Icon className="relative" />
            </button>
          ))}
        </div>
        <a
          href={STORE_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-[30px] items-center rounded-lg bg-[var(--chip-bg)] px-3 text-[13px] font-medium text-[var(--chip-fg)] transition-transform active:scale-[0.97]"
        >
          Purchase
        </a>
      </nav>
    </header>
  );
}

function Sidebar({ value, onChange }: { value: string; onChange: (slug: string) => void }) {
  const groups = useMemo(() => {
    const out: { name: string; items: Category[] }[] = [];
    for (const c of categories) {
      const g = out.find((x) => x.name === c.group);
      if (g) g.items.push(c);
      else out.push({ name: c.group, items: [c] });
    }
    return out;
  }, []);

  const Item = ({ slug, label, count, Icon }: { slug: string; label: string; count: number; Icon: Category["icon"] }) => {
    const on = value === slug;
    return (
      <button
        type="button"
        onClick={() => !on && onChange(slug)}
        disabled={count === 0}
        className={cn(
          "relative flex h-[34px] w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-left text-[14px] transition-colors duration-mid",
          on ? "text-heading" : "text-secondary hover:bg-fill-quaternary",
          count === 0 && "cursor-default opacity-40 hover:bg-transparent",
        )}
      >
        {on ? (
          <motion.span
            layoutId="side-pill"
            className="absolute inset-0 rounded-lg bg-fill-tertiary"
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
          />
        ) : null}
        <Icon className={cn("relative size-[18px] shrink-0", on ? "text-heading" : "text-quaternary")} />
        <span className="relative flex-1 truncate">{label}</span>
        <em className="relative font-mono text-[12px] not-italic text-quaternary">{count}</em>
      </button>
    );
  };

  return (
    <aside className="md:sticky md:top-6 md:max-h-[calc(100vh-48px)] md:self-start md:overflow-y-auto md:pb-6">
      <Item slug="all" label="All" count={total} Icon={Grid20Regular} />
      {groups.map((g) => (
        <div key={g.name} className="mt-5">
          <div className="mb-1 px-2.5 text-[11px] font-medium uppercase tracking-wider text-quaternary">{g.name}</div>
          {g.items.map((c) => (
            <Item key={c.slug} slug={c.slug} label={c.name} count={c.entries.length} Icon={c.icon} />
          ))}
        </div>
      ))}
      {/* The author's other products sit under the last shelf; this jumps there. */}
      <a
        href="#more"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("more")?.scrollIntoView({ behavior: "smooth" });
        }}
        className="mt-5 flex h-[34px] items-center gap-2.5 rounded-lg px-2.5 text-[14px] text-secondary transition-colors duration-mid hover:bg-fill-quaternary hover:text-heading"
      >
        <ArrowDown20Regular className="size-[18px] shrink-0 text-quaternary" />
        <span className="flex-1 truncate">More from antuikit</span>
      </a>
    </aside>
  );
}

function Shelf({ category, order, onInspect }: { category: Category; order: number; onInspect: (e: WidgetEntry) => void }) {
  return (
    <section className="shelf-grid mt-16">
      <motion.h2
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(order, 6) * 0.05, duration: 0.45, ease: EASE }}
        className="m-0 mb-5 flex items-baseline gap-2.5 text-[14.5px] font-medium text-heading"
      >
        {category.name}
        <span className="font-mono text-[12px] font-normal text-quaternary">{category.entries.length}</span>
      </motion.h2>
      <div className="gallery">
        {category.entries.map((entry, i) => {
          const wide = entry.size !== "small";
          return (
            <div
              key={entry.id}
              className={cn("relative", wide ? "col-span-2" : "col-span-1")}
              style={{ gridRow: `span ${entry.size === "large" || entry.size === "xlarge" ? 2 : 1}` }}
            >
              <div className={cn("gallery-box", wide ? "grid-cols-2" : "grid-cols-1")}>
                <LazyWidget entry={entry} index={i} onInspect={() => onInspect(entry)} />
              </div>
              {/* The title hangs below the card, in the row gap, so every grid row stays
                  exactly one cell tall and short cards leave no hole beside tall ones. */}
              <button
                type="button"
                onClick={() => onInspect(entry)}
                className="absolute inset-x-0 top-full mt-3 block cursor-pointer px-1 text-center"
              >
                <span className="block text-[13.5px] font-medium text-heading">{entry.title}</span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
