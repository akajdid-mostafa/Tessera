import { type CSSProperties, useMemo, useState } from "react";
import { type Category, categories, type WidgetEntry } from "@/catalog";
import { LazyWidget } from "@/showcase/lazy-widget";
import { Segmented } from "@/registry/antuikit/ui/segmented";

type Item = { category: Category; entry: WidgetEntry };

const AREA = { small: 1, medium: 2, large: 4, xlarge: 8 } as const;
/** Every view fills five full rows of the 4-column dashboard (or ten of two). */
const TARGET_AREA = 20;

/**
 * Takes widgets from `pool` in order until their cells add up to TARGET_AREA (at most
 * two large, no xlarge), then trims smalls/mediums from the end until the total is a
 * multiple of 4, so short groups still end on a full row.
 */
function fill(pool: Item[]): Item[] {
  const out: Item[] = [];
  let total = 0;
  let large = 0;
  for (const it of pool) {
    const a = AREA[it.entry.size];
    if (a > 4 || total + a > TARGET_AREA || (a === 4 && large >= 2) || out.some((o) => o.entry === it.entry)) continue;
    out.push(it);
    total += a;
    if (a === 4) large++;
    if (total === TARGET_AREA) break;
  }
  while (total % 4) {
    const r = total % 4;
    let i = out.findLastIndex((o) => AREA[o.entry.size] <= r && AREA[o.entry.size] < 4);
    if (i < 0) i = out.findLastIndex((o) => AREA[o.entry.size] < 4);
    total -= AREA[out[i].entry.size];
    out.splice(i, 1);
  }
  return out;
}

const COLS = 4;
const SIZE = { small: [1, 1], medium: [2, 1], large: [2, 2], xlarge: [4, 2] } as const;
type Placed = Item & { c: number; r: number };

/**
 * A mixed bento: walks the 4-column grid cell by cell and drops in the first unused
 * widget (in its own, already mixed, sidebar order) that fits there, backtracking when
 * a choice leaves a hole. Since the area is a multiple of 4, it closes into a full
 * rectangle. Falls back to plain order if no exact fit exists.
 */
function bentoLayout(items: Item[]): Placed[] | null {
  const rows = Math.ceil(items.reduce((s, it) => s + AREA[it.entry.size], 0) / COLS);
  const grid = Array.from({ length: rows }, () => Array<boolean>(COLS).fill(false));
  const used = Array<boolean>(items.length).fill(false);
  const out: Placed[] = [];
  const fits = (c: number, r: number, w: number, h: number) => {
    if (c + w > COLS || r + h > rows) return false;
    for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) if (grid[y][x]) return false;
    return true;
  };
  const mark = (c: number, r: number, w: number, h: number, v: boolean) => {
    for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) grid[y][x] = v;
  };
  const step = (): boolean => {
    const at = grid.flat().indexOf(false);
    if (at < 0) return true;
    const c = at % COLS;
    const r = Math.floor(at / COLS);
    // Avoid putting the same size twice in a row where another size fits, so it stays mixed.
    const prev = out.at(-1)?.entry.size;
    const order = items
      .map((it, i) => i)
      .filter((i) => !used[i])
      .sort((a, b) => Number(items[a].entry.size === prev) - Number(items[b].entry.size === prev));
    for (const i of order) {
      const [w, h] = SIZE[items[i].entry.size];
      if (!fits(c, r, w, h)) continue;
      mark(c, r, w, h, true);
      used[i] = true;
      out.push({ ...items[i], c, r });
      if (step()) return true;
      out.pop();
      used[i] = false;
      mark(c, r, w, h, false);
    }
    return false;
  };
  return step() ? out : null;
}

/** One widget from as many categories as fit, in sidebar order; smalls from later categories top it up. */
function featured(): Item[] {
  const firsts = categories.flatMap((c) => (c.entries[0] ? [{ category: c, entry: c.entries[0] }] : []));
  const smalls = categories.flatMap((c) =>
    c.entries.filter((e) => e.size === "small").map((entry) => ({ category: c, entry })),
  );
  return fill([...firsts, ...smalls]);
}

/**
 * The landing preview: a live bento dashboard above the shelves. "Featured"
 * mixes one widget from every category; each group option lays out that group's
 * widgets as the dashboard a team in that sector would pin.
 */
export function HeroBento({ onInspect }: { onInspect: (item: Item) => void }) {
  const groups = useMemo(() => [...new Set(categories.map((c) => c.group))], []);
  const [view, setView] = useState("Featured");

  const items = useMemo<(Item | Placed)[]>(() => {
    const picked =
      view === "Featured"
        ? featured()
        : fill(categories.filter((c) => c.group === view).flatMap((c) => c.entries.map((entry) => ({ category: c, entry }))));
    return bentoLayout(picked) ?? picked;
  }, [view]);

  return (
    // Unframed, like the shelves below: the 4 × 196px grid fills the 832px column edge to edge.
    <section className="mt-10">
      <div className="mb-5 flex">
        <Segmented value={view} onChange={(v) => setView(String(v))} options={["Featured", ...groups]} />
      </div>

      <div className="shelf-grid">
        <div className="bento">
          {items.map((it, i) => (
            <LazyWidget
              key={`${view}:${it.category.slug}/${it.entry.id}`}
              entry={it.entry}
              index={i}
              onInspect={() => onInspect({ category: it.category, entry: it.entry })}
              style={"c" in it ? ({ "--c": it.c + 1, "--r": it.r + 1 } as CSSProperties) : undefined}
            />
          ))}
        </div>
        {items.length === 0 ? (
          <div className="grid h-40 place-items-center text-[13px] text-tertiary">Widgets for this group are on the way.</div>
        ) : null}
      </div>
    </section>
  );
}
