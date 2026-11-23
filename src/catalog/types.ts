import type { ComponentType } from "react";
import type { WidgetSize } from "@/motion/widget";

/** One widget in the catalog. `id` is also its file name inside the category folder. */
export interface WidgetEntry {
  id: string;
  title: string;
  /** One sentence on what it shows and how it moves, shown in the inspector. */
  description: string;
  size: WidgetSize;
  Component: ComponentType<{ index?: number }>;
}
