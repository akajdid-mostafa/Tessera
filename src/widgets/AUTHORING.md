# Writing a widget

This guide is for adding your own widget to Tessera. A widget is one React file that
draws its content inside the shared `Widget` shell; the shell takes care of the surface,
the entrance, the hover lift and the press. If you want a starting point, these finished
widgets cover most of the patterns below:

- `hospitality/occupancy.tsx`: tap to page through views, an animated ring
- `logistics/shipment.tsx`: a progress track, tooltips, kit buttons
- `ecommerce/live-sales.tsx`: live ticks, glow, rolling digits
- `finance/spending.tsx`: a large widget with a Recharts chart through the kit and toggles
- `weather/weather.tsx`: a full-bleed surface, ambient motion, a hover preview

## Files

- One widget per file: `src/widgets/<shelf>/<id>.tsx`, exporting
  `export function <Name>Widget({ index }: { index?: number })`. `id` is kebab-case and
  unique within its shelf.
- Register it in `src/widgets/<shelf>/index.ts` by adding an object to the `entries`
  array (the array order is the display order): `{ id, title, size, description, Component }`.
  `description` is one sentence: what the widget shows, then how it moves or responds.
- A new shelf is a new folder with its own `index.ts` exporting `entries`; add it to the
  `categories` list in `src/catalog/index.ts` with a slug, name, group and icon.
- A helper shared by several widgets in one shelf can sit next to them, for example
  `_parts.tsx` (see `src/widgets/airport/_parts.tsx`).

## Building blocks

- Shell: `Widget` and `WidgetHeader` from `@/motion/widget`. `Widget` props: `size`
  (`"small"`, `"medium"`, `"large"` or `"xlarge"`), `index` (pass it through), `pressable`
  and `onPress` (only when the whole face is the control), `glow` / `glowActive`, `beam`,
  `surfaceClassName`.
- `AnimatedNumber` from `@/motion/animated-number` for every number that changes
  (rolling digits). It supports `format` (Intl.NumberFormat options), `prefix` and `suffix`.
- antuikit components (`@/registry/antuikit/ui/...`): `segmented`, `tag`, `button`,
  `avatar`, `badge`, `progress`, `tooltip`, `switch`, `icon`, `recharts-chart`
  (`ChartContainer`, `ChartTooltip`, `ChartTooltipContent`), `border-beam`, `card`.
  They follow your theme in light and dark, so prefer them over hand-made controls.
  `cn` lives in `@/registry/antuikit/lib/utils`.
- Motion: `motion`, `AnimatePresence`, `useMotionValue`, `animate` and friends come from
  `motion/react`.
- Charts: Recharts inside the kit's `ChartContainer` (see `real-estate/property-value.tsx`),
  or hand-drawn SVG when the picture is domain-specific (a tank, a valve, a gauge, a rack).
- Icons: import from `@fluentui/react-icons` directly. `...20Filled` suits the header
  chip and `...16Regular` suits inline use. To check that an icon name exists:
  `grep -rqs "const Foo20Filled:" node_modules/@fluentui/react-icons/lib/ --include='*.d.ts'`.

## People are memoji

Every person shown in a widget (guest, courier, tenant, patient, operator, reviewer)
uses `MemojiAvatar` from `@/lib/memoji`: `<MemojiAvatar who="m3" size={28} />`, or
`who={name}` to pick a stable face from a name. The images live in `public/memoji`.
This keeps the set consistent and avoids photos of real people, initials-only avatars and
emoji faces. For an avatar stack, overlap several `MemojiAvatar`s with a negative margin
and a `ring-[1.5px] ring-[var(--widget-surface)]`.

## Look

- The widget language is Apple-like: one hero metric, one visual, a small meta row. Open
  with `WidgetHeader` (an icon chip tinted with an iOS color, a title, a subtitle and an
  optional `extra` slot).
- Colors: data accents use `var(--ios-blue|green|red|orange|yellow|purple|pink|teal|indigo|mint)`
  (Tailwind: `text-ios-green`, `bg-ios-red/15`, and so on). For neutrals use the antd
  tokens exposed as Tailwind classes: `text-heading`, `text-secondary`, `text-tertiary`
  (the faintest a text should be; `text-quaternary` fails contrast in light mode),
  `bg-fill`, `bg-fill-secondary`, `bg-fill-tertiary`, `bg-fill-quaternary`, `border-split`,
  and `var(--widget-surface)`. Avoid hex values for neutrals; hex is fine inside decorative
  gradients.
- Industrial and control-room widgets work best following ISA-101: calm neutrals for the
  normal state, with color reserved for abnormal states and alarms (red is critical,
  orange is high, yellow is medium).
- Every widget should look right in both dark (the showcase default) and light. Switch
  themes while you build, and watch for white text on a surface that turns white in light
  mode, unless the surface is your own fixed gradient.
- Type: hero numbers 24-34 px semibold (`tracking-tight`, `leading-none`), labels 11-13 px,
  nothing under 9 px. Units are smaller and `text-tertiary`. Use tabular figures for
  every changing number.
- Draw with SVG and CSS by default. Where a real picture reads better (camera feeds,
  product thumbnails, covers), the bundled widgets use Unsplash photos
  (`images.unsplash.com/photo-<id>?w=&h=&fit=crop&auto=format`, free license) with no
  identifiable people and a gradient fallback behind them. See `security/camera-wall.tsx`.
- Copy: use realistic values and consistent names, places and currency.

## Space budget

Grid cells are a fixed 196 x 196 px, the gap is 16 px and the widget padding is 16 px, so
the content box is:

| Size | Cells | Content box |
| --- | --- | --- |
| small | 1 x 1 | 164 x 164 |
| medium | 2 x 1 | 376 x 164 |
| large | 2 x 2 | 376 x 376 |
| xlarge | 4 x 2 | 800 x 376 |

Content that does not fit is clipped by the card; the cell never grows. `WidgetHeader`
takes 28 px. Plan the vertical stack in pixels, and keep 4-6 px of slack. Use `truncate` and
`whitespace-nowrap` on labels. Keep content in normal flow, with `mt-auto` for the bottom
row; only decorative layers should be absolutely positioned.

## Motion and interaction

Each widget in the kit has at least one entrance or live animation and at least one
micro-interaction. Aim for the same:

- Entrance: rings, bars and tracks fill with a spring, delayed by `0.3 + index * 0.06`.
- Live: `setInterval` ticks (always cleared on unmount), rolling digits, ambient loops such
  as flow in pipes, rotating fans or scanning lines, kept subtle and slow.
- Interaction: tap to page through views (with page dots), hover to reveal detail (the kit
  `Tooltip`, or a preview that updates the hero metric), scrub a chart, toggle a series,
  a segmented range switch, or a guarded action such as acknowledging an alarm.
- Within one shelf, vary the layout so no two widgets look alike.

## Patterns worth reaching for

- Data-dense list rows: icon, name and subtitle, sparkline, value and a colored change
  pill. Separate rows with `border-split` hairlines.
- Action widgets: a search or "ask" bar with round action buttons, or a 2 x 2 grid of
  shortcut tiles (icon top-left, label bottom-left, `bg-fill-tertiary`) that give
  feedback when pressed.
- Control widgets: a device with a big round power toggle that animates its state.
- Timeline strips: a horizontal 24 h band with a NOW marker and a highlighted window.
- Heatmaps and contribution grids, week-of-rings with a streak flame, half-circle gauges,
  header-band lists (a colored top band with rows below), avatar rows with status rings,
  full-bleed SVG maps with a pin and accuracy circle.
- Real states: where it fits, show an empty or alarm state instead of always-happy data
  (a pump "Tripped" with an Acknowledge button, "No incidents in 42 days").

## Known pitfalls

- Color text with the `text-ios-*` classes, not `style={{ color: "var(--ios-...)" }}`. In
  light mode the classes switch orange, yellow, green, teal and mint text to a deeper,
  readable shade; an inline style cannot. Fills and strokes may use the variables directly.
- Avoid black text on a vivid `bg-ios-*` fill, and white text on orange, yellow, green or
  mint, which fails contrast. Instead:
  - buttons, chips and pills: go soft with `bg-ios-X/15 text-ios-X` (`hover:bg-ios-X/25`);
    for antd buttons use `variant="filled"` with the color rather than `solid` plus
    `text-black`;
  - small icon badges: keep the vivid fill with a white glyph (`text-white`), or use
    `bg-ios-yellow-deep` / `bg-ios-mint-deep` for the light hues (the `-deep` variants
    also exist for green, orange and teal);
  - labels floating over a chart: `bg-ios-X-deep text-white`.
- Row dividers are hairlines: `border-t-[0.5px]`, `divide-y-[0.5px]` or
  `h-[0.5px] bg-split`, not the 1 px defaults.
- Labels drawn inside an SVG (axis ticks, band limits, zone names) collide easily. Two
  reference lines closer than about 12 px need their labels on opposite sides, and a
  band's two limit labels belong outside the band.
- A fixed-height row (for example `h-[70px]`) that holds rolling digits needs about 4 px
  more than the text alone, because NumberFlow's box is taller than a plain line.
- Let a large widget's drawing take the free height rather than leaving it at a small
  fixed size with empty space beneath.
- Do not read a ref (`counter.current`) inside a `setState(updater)`. Two quick taps queue
  two updaters that both see the final value, so new items get the same key. Read it into
  a const first, then use the const in the updater.
- Do not animate `pathLength` on a path with `vectorEffect="non-scaling-stroke"` inside an
  SVG with `preserveAspectRatio="none"`: the dash maths breaks and the line shows a gap.
  Fade it in with `opacity` instead, or keep the SVG's aspect ratio.
- When animating `d`, also pass it as the `d` attribute and in `initial`, or the first
  frame renders `d="undefined"`.

## Checking your work

Run `pnpm typecheck` (or `npm run typecheck`) from the project root; it should finish
with no errors. Then run `pnpm dev`, find your widget in the showcase and open it in the
inspector. Check it in light and dark (add `?theme=light` to the URL) at its size.
