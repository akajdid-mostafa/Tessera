import type { WidgetEntry } from "@/catalog/types";
import { BlastCountdownWidget } from "./blast-countdown";
import { CrusherCircuitWidget } from "./crusher-circuit";
import { FleetDispatchWidget } from "./fleet-dispatch";
import { HaulCycleWidget } from "./haul-cycle";
import { StockpileWidget } from "./stockpile";
import { VentilationWidget } from "./ventilation";
import { PersonnelTagsWidget } from "./personnel-tags";

export const entries: WidgetEntry[] = [
  {
    id: "blast-countdown",
    title: "Blast Countdown",
    size: "small",
    description:
      "A blast countdown with six guard posts where one post not yet clear locks the confirm, then a press-and-hold confirms all clear, or the clock holds at T−1 min and glows orange until it is.",
    Component: BlastCountdownWidget,
  },
  {
    id: "stockpile",
    title: "Stockpile",
    size: "small",
    description:
      "A stockpile in cross-section with ore falling from the stacker and feeders drawing it down, tonnage and hours of cover ticking live; low cover turns the pile orange, and a tap morphs to the next pile.",
    Component: StockpileWidget,
  },
  {
    id: "haul-cycle",
    title: "Haul Cycle",
    size: "medium",
    description:
      "A pit section with seven haul trucks cycling between the shovel and the crusher and one broken down on the ramp; shift tonnes roll up as each truck tips, and hovering a phase of the cycle bar lights its stretch of road.",
    Component: HaulCycleWidget,
  },
  {
    id: "fleet-dispatch",
    title: "Fleet Dispatch",
    size: "medium",
    description:
      "Dense dispatch rows for trucks or loaders with payload or dig-rate sparklines against the 10/10/20 limits; a truck loads pass by pass live, and a 122% overload flashes until tapped to acknowledge.",
    Component: FleetDispatchWidget,
  },
  {
    id: "ventilation",
    title: "Ventilation Gas",
    size: "medium",
    description:
      "A return-airway NO₂ or CO trend against its A1 and A2 alarm limits as a post-blast fume plume crosses A1 live, the trace turning orange above the limit and the alarm flashing until acknowledged.",
    Component: VentilationWidget,
  },
  {
    id: "crusher-circuit",
    title: "Primary Crushing",
    size: "large",
    description:
      "The primary crushing circuit in section, with a truck tipping into the gyratory and ore riding two conveyors onto the stockpile while throughput and shift tonnes tick live; a CV-02 belt-drift alarm waits for acknowledgement, and tapping a unit shows its readings.",
    Component: CrusherCircuitWidget,
  },
  {
    id: "personnel-tags",
    title: "Underground Tags",
    size: "medium",
    description:
      "The underground tag board by level with crews as memoji and counts shifting live; hold to call a muster and refuge-chamber counts roll up until one missing worker raises a P1 alarm to acknowledge.",
    Component: PersonnelTagsWidget,
  },
];
