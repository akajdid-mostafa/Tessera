import type { WidgetEntry } from "@/catalog/types";
import { DamSectionWidget } from "./dam-section";
import { FilterTurbidityWidget } from "./filter-turbidity";
import { TreatmentTrainWidget } from "./treatment-train";
import { WaterQualityWidget } from "./water-quality";
import { WetWellWidget } from "./wet-well";
import { DosingPumpWidget } from "./dosing-pump";
import { SeepageWeirWidget } from "./seepage-weir";
import { NightFlowWidget } from "./night-flow";
import { StorageTanksWidget } from "./storage-tanks";
import { PressureZonesWidget } from "./pressure-zones";

export const entries: WidgetEntry[] = [
  {
    id: "filter-turbidity",
    title: "Filter Turbidity",
    size: "small",
    description:
      "One filter's effluent turbidity over 24 h under its 0.3 NTU limit, with the post-backwash ripening bump marked; the trace draws in, the latest sample ticks live, and scrubbing reads any half-hour.",
    Component: FilterTurbidityWidget,
  },
  {
    id: "wet-well",
    title: "Lift Station",
    size: "small",
    description:
      "A wet well with Stop / Lead / Lag / High levels and two pumps; the level rises and falls as the lead pump calls in and out (its marker flashes, its impeller spins), and tapping a pump makes it lead.",
    Component: WetWellWidget,
  },
  {
    id: "water-quality",
    title: "Water Quality",
    size: "medium",
    description:
      "Finished-water pH, turbidity, free chlorine and fluoride as bullet bars with limit and target bands; pointers drift live, chlorine sags to a priority-3 low until the dose steps up, and each row explains its limits on hover.",
    Component: WaterQualityWidget,
  },
  {
    id: "treatment-train",
    title: "Treatment Train",
    size: "medium",
    description:
      "A treatment plant's intake-to-clearwell process train drawn in outline, with flow running through the pipe, mixers turning and a filter backwashing; tap a stage to read its live KPIs.",
    Component: TreatmentTrainWidget,
  },
  {
    id: "dam-section",
    title: "Dam Cross-Section",
    size: "large",
    description:
      "A dam section with the pool rising through the flood-control zone, inflow streaking in and the spill sheet running down the face; step the gate target within the 1 m move limit and hold to raise the radial gates as outflow climbs.",
    Component: DamSectionWidget,
  },
  {
    id: "dosing-pump",
    title: "Hypo Dosing",
    size: "small",
    description:
      "A flow-paced hypochlorite dosing pump with feed rate, stroke rate and bulk-tank days left; the plunger strokes at the live rate, and stepping the dose setpoint moves feed, strokes and days of supply.",
    Component: DosingPumpWidget,
  },
  {
    id: "seepage-weir",
    title: "Dam Seepage",
    size: "small",
    description:
      "Seepage at a dam's V-notch weirs with 30 days of flow against the pool level; the weir head ticks live, and a tap pages to the gallery weir, rising and cloudy on a priority-2 alarm.",
    Component: SeepageWeirWidget,
  },
  {
    id: "night-flow",
    title: "Night Flow",
    size: "medium",
    description:
      "Last night's inflow to a metered district with the 02–04 minimum-night-flow window and the leakage gap above legitimate night use shaded; the trace draws in, you switch districts and scrub any quarter hour.",
    Component: NightFlowWidget,
  },
  {
    id: "storage-tanks",
    title: "Service Reservoirs",
    size: "medium",
    description:
      "Three network service reservoirs with level, 24 h trend and fill or draw state; levels move live, and Ridge Reservoir's priority-2 Low flashes until you tap its row to acknowledge.",
    Component: StorageTanksWidget,
  },
  {
    id: "pressure-zones",
    title: "Network Pressure",
    size: "large",
    description:
      "A distribution network map where a main bursts live, pressures sag into P1 and P2 alarms and inlet flow jumps; tap a sensor to read it, then hold to close two valves and isolate the break until it is repaired.",
    Component: PressureZonesWidget,
  },
];
