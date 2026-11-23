import { Avatar, type AvatarProps } from "@/registry/antuikit/ui/avatar";
import { cn } from "@/registry/antuikit/lib/utils";

/* Every person in a widget is a memoji, never a photo of a real person and never
 * bare initials. Nineteen faces from the antuikit set, served from /public/memoji:
 * f1–f9 (feminine) and m1–m10 (masculine), each on its own pastel ground. */
export const MEMOJI = [
  "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9",
  "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10",
] as const;
export type MemojiId = (typeof MEMOJI)[number];

export const memojiSrc = (id: MemojiId) => `/memoji/${id}.png`;

/** A stable memoji for any name or index, so the same person keeps the same face. */
export function memojiFor(key: string | number): MemojiId {
  const n =
    typeof key === "number" ? key : [...key].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  return MEMOJI[Math.abs(n) % MEMOJI.length];
}

export interface MemojiAvatarProps extends Omit<AvatarProps, "src" | "children"> {
  /** A memoji id, or any name/index to pick one deterministically. */
  who: MemojiId | string | number;
}

/** The kit's Avatar showing a memoji. */
export function MemojiAvatar({ who, className, alt, ...props }: MemojiAvatarProps) {
  const id = typeof who === "string" && (MEMOJI as readonly string[]).includes(who) ? (who as MemojiId) : memojiFor(who);
  return (
    <Avatar
      {...props}
      src={memojiSrc(id)}
      alt={alt ?? ""}
      draggable={false}
      className={cn("shrink-0 bg-fill-tertiary", className)}
    />
  );
}
