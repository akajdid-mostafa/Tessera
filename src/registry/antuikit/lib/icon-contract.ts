import type { ComponentType, SVGAttributes } from "react";

/**
 * The icon contract: the semantic roles components ask for and the weight each
 * draws at. An icon pack maps every role to a glyph.
 *
 * A new role goes in `SemanticIconName`, then `iconDefaults`, then the pack.
 * Arrows and chevrons come in all four directions, because a rotated glyph is
 * not the pack's own drawing.
 */

/** A glyph's weight. Every pack draws `regular`, and `filled` where it has one. */
export type IconWeight = "regular" | "filled";

/** Every role a component can ask `Icon` for. */
export type SemanticIconName =
  | "chevron-down"
  | "chevron-up"
  | "chevron-left"
  | "chevron-right"
  | "chevrons-left"
  | "chevrons-right"
  | "arrow-down"
  | "arrow-up"
  | "arrow-left"
  | "arrow-right"
  | "close"
  | "check"
  | "search"
  | "loading"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "eye"
  | "eye-off"
  | "plus"
  | "minus"
  | "more"
  | "calendar"
  | "clock"
  | "copy"
  | "edit"
  | "enter"
  | "globe"
  | "shift"
  | "backspace"
  | "space"
  | "accessibility"
  | "contrast"
  | "text-size"
  | "external-link"
  | "upload"
  | "download"
  | "reload"
  | "filter"
  | "caret-up"
  | "caret-down"
  | "menu"
  | "rotate-left"
  | "rotate-right"
  | "zoom-in"
  | "zoom-out"
  | "flip-horizontal"
  | "flip-vertical"
  | "star"
  | "delete"
  | "file"
  | "paperclip"
  | "folder"
  | "folder-open"
  | "help"
  | "image"
  | "like"
  | "dislike"
  | "mic"
  | "mic-off"
  | "volume-off"
  | "sparkle"
  | "grip"
  | "columns"
  | "options"
  | "pin"
  | "sort"
  | "text"
  | "hash"
  | "link"
  | "mail"
  | "list"
  | "toggle"
  | "rows"
  | "cut"
  | "clear"
  | "duplicate"
  | "user"
  | "palette"
  | "play"
  | "pause"
  | "car"
  | "walk"
  | "ship"
  | "plane"
  | "train";

/**
 * The weight each role draws at unless a call site sets `filled`. The four
 * status roles are filled and the rest regular. A pack with no filled glyph
 * falls back to regular.
 */
export const iconDefaults: Record<SemanticIconName, IconWeight> = {
  info: "filled",
  success: "filled",
  warning: "filled",
  error: "filled",
  "chevron-down": "regular",
  "chevron-up": "regular",
  "chevron-left": "regular",
  "chevron-right": "regular",
  "chevrons-left": "regular",
  "chevrons-right": "regular",
  "arrow-down": "regular",
  "arrow-up": "regular",
  "arrow-left": "regular",
  "arrow-right": "regular",
  close: "regular",
  check: "regular",
  search: "regular",
  loading: "regular",
  eye: "regular",
  "eye-off": "regular",
  plus: "regular",
  minus: "regular",
  more: "regular",
  calendar: "regular",
  clock: "regular",
  copy: "regular",
  edit: "regular",
  enter: "regular",
  globe: "regular",
  shift: "regular",
  backspace: "regular",
  space: "regular",
  accessibility: "regular",
  contrast: "regular",
  "text-size": "regular",
  "external-link": "regular",
  upload: "regular",
  star: "regular",
  delete: "regular",
  file: "regular",
  paperclip: "regular",
  folder: "regular",
  "folder-open": "regular",
  image: "regular",
  help: "regular",
  download: "regular",
  reload: "regular",
  filter: "regular",
  "caret-up": "regular",
  "caret-down": "regular",
  menu: "regular",
  "rotate-left": "regular",
  "rotate-right": "regular",
  "zoom-in": "regular",
  "zoom-out": "regular",
  "flip-horizontal": "regular",
  "flip-vertical": "regular",
  like: "regular",
  dislike: "regular",
  mic: "regular",
  "mic-off": "regular",
  "volume-off": "regular",
  sparkle: "regular",
  grip: "regular",
  columns: "regular",
  options: "regular",
  pin: "regular",
  sort: "regular",
  text: "regular",
  hash: "regular",
  link: "regular",
  mail: "regular",
  list: "regular",
  toggle: "regular",
  rows: "regular",
  cut: "regular",
  clear: "regular",
  duplicate: "regular",
  user: "regular",
  palette: "regular",
  play: "regular",
  pause: "regular",
  car: "regular",
  walk: "regular",
  ship: "regular",
  plane: "regular",
  train: "regular",
};

/**
 * The props a pack's glyph component accepts. `children` is left out because a
 * glyph draws its own paths, and `children?: undefined` keeps packs like
 * `@remixicon/react` assignable.
 */
export type IconGlyphProps = Omit<SVGAttributes<SVGElement>, "children"> & {
  [key: `data-${string}`]: string;
  children?: undefined;
};

/** One role's glyphs. `filled` is optional, since most packs have one weight. */
export type IconPackEntry = {
  regular: ComponentType<IconGlyphProps>;
  filled?: ComponentType<IconGlyphProps>;
};

/** An icon pack: one entry for every role. */
export type IconPack = Record<SemanticIconName, IconPackEntry>;
