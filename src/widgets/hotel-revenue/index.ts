import type { WidgetEntry } from "@/catalog/types";
import { entries as a } from "./_entries-a";
import { entries as b } from "./_entries-b";
import { entries as c } from "./_entries-c";

/* Builders filled this shelf in parallel, each owning one entries file. */
export const entries: WidgetEntry[] = [...a, ...b, ...c];
