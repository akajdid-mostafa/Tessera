import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import { twMergeConfig } from "@/registry/antuikit/lib/tw-merge-config.generated";

/**
 * tailwind-merge configured with the kit's own scale names (`p-lg`,
 * `text-secondary`). Without it, a kit class can be dropped, or kept beside
 * the class it conflicts with.
 */
const twMerge = extendTailwindMerge(twMergeConfig);

/** Joins class names and resolves Tailwind conflicts, the kit's names included. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
