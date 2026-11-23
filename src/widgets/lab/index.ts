import type { WidgetEntry } from "@/catalog/types";
import { AutoclaveCycleWidget } from "./autoclave-cycle";
import { ExcursionAckWidget } from "./excursion-ack";
import { ParticleCountsWidget } from "./particle-counts";
import { PressureCascadeWidget } from "./pressure-cascade";
import { SampleQueueWidget } from "./sample-queue";
import { UltraLowFreezerWidget } from "./ultra-low-freezer";

export const entries: WidgetEntry[] = [
  {
    id: "ultra-low-freezer",
    title: "ULT Freezer",
    size: "small",
    description:
      "A −80 °C freezer drawn shelf by shelf; the door swings open on its own, cold fog spills and the cabinet warms past the −75 °C pre-alarm before recovering, and hovering a shelf reads its racks and contents.",
    Component: UltraLowFreezerWidget,
  },
  {
    id: "autoclave-cycle",
    title: "Autoclave Cycle",
    size: "small",
    description:
      "A steam autoclave cycle with a five-phase strip; the sterilize hold counts down in rolling digits while chamber temperature, pressure and F₀ tick live, and hovering a phase previews its planned time.",
    Component: AutoclaveCycleWidget,
  },
  {
    id: "particle-counts",
    title: "Particle Counts",
    size: "medium",
    description:
      "One-minute particle counts on a Grade A filling line against alert and action limits; a new bar slides in every few seconds, interventions spike amber past the alert line, a toggle swaps 0.5 µm and 5.0 µm, and hovering a bar reads that minute.",
    Component: ParticleCountsWidget,
  },
  {
    id: "sample-queue",
    title: "Sample Queue",
    size: "medium",
    description:
      "A LIMS test queue with analyst memoji, STAT flags and due times; the running assay fills and releases, the next sample starts, the late sterility read counts up in red, and the STAT filter re-sorts the rows.",
    Component: SampleQueueWidget,
  },
  {
    id: "excursion-ack",
    title: "Excursion Sign-off",
    size: "medium",
    description:
      "A stability-chamber humidity excursion that glows and counts until acknowledged; pick a reason, press and hold to e-sign, and the live trace eases back into its ±5 %RH band before the next drift.",
    Component: ExcursionAckWidget,
  },
  {
    id: "pressure-cascade",
    title: "Pressure Cascade",
    size: "large",
    description:
      "A cleanroom suite plan with live room pressures and airflow chevrons at every door; an operator opening the PAL reverses the closed MAL door in red, tapping a door swings it open while airlock interlocks refuse the second, and hovering reads any room or Δp.",
    Component: PressureCascadeWidget,
  },
];
