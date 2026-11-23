# Tessera

### _A tile for every signal._

Tessera is a kit of **366 animated React widgets** arranged in **42 shelves**: dashboards and control panels for hotels, factories, hospitals, airports, storefronts, data centers, and everything between. Each widget is one editable React file. It arrives with a spring, breathes while it lives, answers a tap or a hover, and looks right in light and dark.

The name comes from the *tessera*, the small square a mosaic is made of. A few hundred of them, set side by side, make a panorama.

```text
  ┌───────────┐ ┌───────────────────┐ ┌───────────────────┐
  │  header   │ │  header           │ │  header           │
  │           │ │                   │ │                   │
  │  99.98%   │ │  99.98%    ───╱╲╱ │ │  ┌─────┬─────┐    │
  │           │ │                   │ │  │  A  │  B  │    │
  │  no incidents │  no incidents   │ │  ├─────┼─────┤    │
  └───────────┘ └───────────────────┘ │  │  C  │  D  │    │
      small          medium           └───────────────────┘
                                            large
```

It is **source, not a package**: copy the tiles you want into your app and make them yours. This folder is also a complete Vite showcase — gallery, docs, and an inspector that shows each widget's real source.

---

## Start the showcase

**Requirements:** Node.js 20.19+ or 22.12+ (Vite 8 has opinions), and pnpm or npm.

```bash
pnpm install
pnpm dev
```

Open **http://localhost:5181**. The port is fixed on purpose; the dev server fails rather than silently moving. npm works the same way with `npm install` and `npm run dev`.

| Script | Command | What it does |
| --- | --- | --- |
| `dev` | `vite` | Showcase with hot reload on http://localhost:5181. |
| `build` | `vite build` | Production build to `dist/`. |
| `preview` | `vite preview` | Serves `dist/` locally. Run `build` first. |
| `build:demo` | `VITE_DEMO=1 vite build` | Public preview variant — no source in the bundle. |
| `typecheck` | `tsc --noEmit` | Type-checks the whole project. |

Run any script with `pnpm <script>` or `npm run <script>`. `build:demo` sets its variable inline, which works in macOS, Linux and WSL; on Windows `cmd`/PowerShell, set `VITE_DEMO=1` first and then run `vite build`.

---

## Inside the box

```text
index.html                  Entry point; sets the theme class before first paint
package.json
pnpm-lock.yaml
tsconfig.json               @/ alias for TypeScript
vite.config.ts              @/ alias for Vite, port 5181
public/
  favicon.svg               The Tessera mark
  memoji/                   Faces used by MemojiAvatar
src/
  main.tsx                  Mounts the showcase in AntuikitProvider
  app.tsx                   Sidebar, gallery, docs and inspector
  styles.css                Tokens, iOS colors, grid classes (shelf-grid, bento, gallery)
  catalog/
    index.ts                The 42 shelves, their icons, and the total
    types.ts                WidgetEntry: id, title, description, size, Component
  motion/
    widget.tsx              Widget + WidgetHeader: the shell every tile renders in
    animated-number.tsx     AnimatedNumber: rolling digits
    glow-effect.tsx         Hover glow
    inspect.tsx             Inspect badge shown on hover
  lib/
    memoji.tsx              MemojiAvatar and the face set
  registry/antuikit/        The UI kit built on Ant Design
    providers/              AntuikitProvider, ThemeScope
    ui/                     Button, Tag, Segmented, Tooltip, Progress, charts, ...
    lib/                    Theme, icons, cn
    styles/antuikit.css     Token bridge between antd and Tailwind
  showcase/                 Gallery, docs, inspector, code blocks
  widgets/
    AUTHORING.md            How to write a widget
    <shelf>/                One folder per shelf
      <id>.tsx              One widget per file
      index.ts              Display order and metadata
```

Some shelves keep shared helpers in underscore files such as `_parts.tsx` or `_entries-a.ts`.

---

## The making of a tile

A widget is one file, one export, one shell. The shell owns the squircle surface, the staggered entrance, the hover lift and the press; the widget owns the story it tells.

```tsx
// src/widgets/ops/uptime.tsx
import { Server20Filled } from "@fluentui/react-icons";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";

export function UptimeWidget({ index }: { index?: number }) {
  return (
    <Widget size="small" index={index} label="Uptime" glow>
      <WidgetHeader icon={<Server20Filled />} title="Uptime" subtitle="Last 30 days" />
      <AnimatedNumber
        value={99.98}
        format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
        suffix="%"
        className="mt-3 text-[28px] font-semibold tracking-tight"
      />
      <div className="mt-auto text-[11px] text-tertiary">No incidents in 42 days</div>
    </Widget>
  );
}
```

Register it in `src/widgets/ops/index.ts`:

```ts
import type { WidgetEntry } from "@/catalog/types";
import { UptimeWidget } from "./uptime";

export const entries: WidgetEntry[] = [
  {
    id: "uptime",
    title: "Uptime",
    size: "small",
    description: "Thirty-day availability with rolling digits; a soft glow wakes on hover.",
    Component: UptimeWidget,
  },
];
```

A new shelf is a new folder with this `index.ts`, plus one line in the `categories` array in `src/catalog/index.ts` (slug, name, group, icon, entries). The full field guide — colors, memoji, motion, pixel budget and the classic traps — lives in [`src/widgets/AUTHORING.md`](src/widgets/AUTHORING.md).

---

## Take it into your app

**1. Bring the dependencies**

```bash
pnpm add antd @ant-design/cssinjs motion @number-flow/react recharts @fluentui/react-icons clsx tailwind-merge class-variance-authority
pnpm add -D tailwindcss @tailwindcss/vite tw-animate-css
```

With npm, use `npm install` / `npm install -D`. Your app also needs React 19, Vite and `@vitejs/plugin-react`; `package.json` here has the exact versions.

**2. Copy the source you need**

```text
src/registry/antuikit/   # theme, provider, UI components
src/motion/              # Widget shell, WidgetHeader, AnimatedNumber, glow
src/lib/memoji.tsx       # MemojiAvatar
public/memoji/           # the faces
src/styles.css           # tokens, iOS colors, grid classes
src/widgets/<shelf>/     # the tiles you picked
```

Import `styles.css` once in your entry file. If a widget imports `_parts.tsx`, take its shelf's helpers too. Shelf `index.ts` files need `src/catalog/types.ts`; copy that only if you want the catalog listing.

**3. Point `@` at `src`**

```ts
// vite.config.ts
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: [{ find: "@", replacement: resolve(import.meta.dirname, "src") }],
  },
});
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

**4. Wrap the app**

```tsx
// src/main.tsx
import { createRoot } from "react-dom/client";
import { AntuikitProvider } from "@/registry/antuikit/providers/antuikit-provider";
import { App } from "./app";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <AntuikitProvider defaultMode="auto">
    <App />
  </AntuikitProvider>,
);
```

**5. Set the mosaic**

```tsx
// src/dashboard.tsx
import { PropertyValueWidget } from "@/widgets/real-estate/property-value";
import { OccupancyWidget } from "@/widgets/hospitality/occupancy";
import { LiveSalesWidget } from "@/widgets/ecommerce/live-sales";

export function Dashboard() {
  return (
    // shelf-grid sets the container the cells are measured from.
    <div className="shelf-grid">
      <div className="bento">
        <PropertyValueWidget index={0} />
        <OccupancyWidget index={1} />
        <LiveSalesWidget index={2} />
      </div>
    </div>
  );
}
```

Pass `index` so entrances stagger. Every widget exports `<Name>Widget` with an optional `index`.

---

## The grid, measured

| Size | Cells | Span | Content box |
| --- | --- | --- | --- |
| `small` | 1x1 | 1 column, 1 row | 164 x 164 px |
| `medium` | 2x1 | 2 columns, 1 row | 376 x 164 px |
| `large` | 2x2 | 2 columns, 2 rows | 376 x 376 px |
| `xlarge` | 4x2 | 4 columns, 2 rows (2 on narrow screens) | 800 x 376 px |

Cells are 196px with a 16px gap; every card has 16px padding. Overflow is clipped — the cell never grows. `bento` packs mixed sizes densely across two to four columns and measures itself from the nearest `shelf-grid`. `gallery` is the showcase layout: each tile at true size with its name below.

---

## Two moods

Tessera ships light and dark. `AntuikitProvider` holds the mode; widgets read Ant Design tokens, so they follow along.

- `defaultMode` takes `"light"`, `"dark"` or `"auto"` (system preference). The provider defaults to `"auto"`.
- The showcase opens in dark. Add `?theme=light`, `?theme=dark` or `?theme=auto`, e.g. http://localhost:5181/?theme=light. That query parameter belongs to the showcase (`src/main.tsx` and `index.html`), not the provider — in your own app, pass `defaultMode`.
- Switch it from anywhere inside the provider:

```tsx
import { useAntuikitTheme } from "@/registry/antuikit/providers/antuikit-provider";

export function ThemeToggle() {
  const { isDark, setMode } = useAntuikitTheme();
  return <button onClick={() => setMode(isDark ? "light" : "dark")}>{isDark ? "Light" : "Dark"}</button>;
}
```

To rebrand the whole kit, pass a `theme` to `AntuikitProvider` instead of editing tiles one by one.

---

## Public preview build

```bash
pnpm build:demo
```

That is `VITE_DEMO=1 vite build`: the inspector's Source tab is locked and widget sources stay out of the bundle, so you can host a public preview without handing over the code. A normal `dev` or `build` keeps the Source tab live. Output goes to `dist/`; `pnpm preview` serves it.

---

## The shelves

| Group | Shelf | Folder | Widgets |
| --- | --- | --- | --- |
| Business | Real Estate | `src/widgets/real-estate` | 8 |
| Business | E-commerce | `src/widgets/ecommerce` | 11 |
| Business | Finance | `src/widgets/finance` | 11 |
| Business | Sales & CRM | `src/widgets/sales` | 9 |
| Business | Marketing | `src/widgets/marketing` | 10 |
| Business | HR & People | `src/widgets/hr` | 8 |
| Business | Retail Store | `src/widgets/retail` | 11 |
| Business | Restaurant | `src/widgets/restaurant` | 10 |
| Hospitality | Hotel Overview | `src/widgets/hospitality` | 7 |
| Hospitality | Front Desk & Rack | `src/widgets/hotel-desk` | 12 |
| Hospitality | Revenue & Inventory | `src/widgets/hotel-revenue` | 14 |
| Hospitality | Housekeeping & Guests | `src/widgets/hotel-house` | 7 |
| Tour Operator | Tour Operations | `src/widgets/tour-ops` | 10 |
| Tour Operator | Tour Bookings | `src/widgets/tour-sales` | 11 |
| Tour Operator | Guests & Finance | `src/widgets/tour-guest` | 9 |
| Mobility | Car Rental | `src/widgets/car-rental` | 7 |
| Mobility | Logistics | `src/widgets/logistics` | 9 |
| Mobility | Travel & Aviation | `src/widgets/travel` | 9 |
| Mobility | Smart City | `src/widgets/smart-city` | 8 |
| Mobility | EV Charging | `src/widgets/ev-charging` | 8 |
| Mobility | In-Car Display | `src/widgets/in-car` | 8 |
| Mobility | Maritime & Ports | `src/widgets/maritime` | 5 |
| Mobility | Rail | `src/widgets/rail` | 9 |
| Mobility | Airport Ops | `src/widgets/airport` | 6 |
| Industry | Factory | `src/widgets/factory` | 10 |
| Industry | Energy & Grid | `src/widgets/energy` | 9 |
| Industry | Water & Dams | `src/widgets/water` | 10 |
| Industry | Oil & Gas | `src/widgets/oil-gas` | 5 |
| Industry | Agriculture | `src/widgets/agriculture` | 8 |
| Industry | Mining | `src/widgets/mining` | 7 |
| Industry | Lab & Cleanroom | `src/widgets/lab` | 6 |
| Facilities & IT | Building | `src/widgets/building` | 9 |
| Facilities & IT | Security & CCTV | `src/widgets/security` | 8 |
| Facilities & IT | Data Center | `src/widgets/data-center` | 10 |
| Facilities & IT | Network | `src/widgets/network` | 7 |
| Facilities & IT | Fire & Life Safety | `src/widgets/fire-safety` | 6 |
| Facilities & IT | Elevators | `src/widgets/elevators` | 7 |
| Facilities & IT | SaaS & DevOps | `src/widgets/saas` | 10 |
| Life | Healthcare | `src/widgets/healthcare` | 8 |
| Life | Weather | `src/widgets/weather` | 9 |
| Life | Smart Home | `src/widgets/smart-home` | 10 |
| Life | Fitness | `src/widgets/fitness` | 10 |
| | **Total** | **42 shelves** | **366** |

---

## Standing on shoulders

- Memoji-style avatar images in `public/memoji`
- [Fluent UI System Icons](https://github.com/microsoft/fluentui-system-icons) (MIT)
- [Ant Design](https://ant.design) (MIT)
- [Motion](https://motion.dev) (MIT)
- [Recharts](https://recharts.org) (MIT)
- [NumberFlow](https://number-flow.barvian.me) (MIT)

Third-party libraries keep their own licenses. The kit itself is covered by the UI8 license of your purchase.

## Support

Questions and bug reports: reach the author through the UI8 page, https://ui8.net/users/antuikit.
