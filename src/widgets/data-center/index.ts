import type { WidgetEntry } from "@/catalog/types";
import { InletTempsWidget } from "./inlet-temps";
import { PduOutletsWidget } from "./pdu-outlets";
import { PueWidget } from "./pue";
import { RackElevationWidget } from "./rack-elevation";
import { UpsWidget } from "./ups";
import { ChangeWindowsWidget } from "./change-windows";
import { CrahUnitsWidget } from "./crah-units";
import { GensetWidget } from "./genset";
import { HallMapWidget } from "./hall-map";
import { LeakDetectWidget } from "./leak-detect";

export const entries: WidgetEntry[] = [
  {
    id: "rack-elevation",
    title: "Rack Elevation",
    size: "large",
    description:
      "A 42U rack drawn device by device beside its live power list; devices slide in as if racked, hovering either side lifts the device out, and Locate blinks its UID LED.",
    Component: RackElevationWidget,
  },
  {
    id: "pue",
    title: "PUE",
    size: "small",
    description:
      "Power usage effectiveness on a half gauge that counts down from 2.00 to the live value; hover the load bar to split facility power into IT, cooling and losses.",
    Component: PueWidget,
  },
  {
    id: "pdu-outlets",
    title: "PDU Outlets",
    size: "small",
    description:
      "Eight rack PDU outlets with link LEDs and live draw; pick one, arm, then confirm a power-cycle that runs a five-second countdown ring before it comes back.",
    Component: PduOutletsWidget,
  },
  {
    id: "ups",
    title: "UPS Status",
    size: "medium",
    description:
      "A UPS mimic diagram whose power flow re-routes through the battery when mains fails, with a rolling runtime countdown, the on-call engineer paged and an alarm you can silence.",
    Component: UpsWidget,
  },
  {
    id: "inlet-temps",
    title: "Rack Inlet Temps",
    size: "medium",
    description:
      "Top, middle and bottom inlet sensors for eight racks against the ASHRAE 18–27 °C band; dots rise into place, drift live, flare amber when out of band, and hover picks a rack.",
    Component: InletTempsWidget,
  },
  {
    id: "hall-map",
    title: "Data Hall Map",
    size: "large",
    description:
      "A data hall floor plan with forty racks, hot-aisle containment and CRAHs on the walls, every rack tinted by inlet temperature, power or space; values breathe live, racks out of range pulse, hovering reads a rack and the segmented control re-tints the hall.",
    Component: HallMapWidget,
  },
  {
    id: "crah-units",
    title: "Cooling Units",
    size: "medium",
    description:
      "Three CRAH units with supply and return air, ΔT and fan duty, each fan glyph spinning at its real speed; Rotate lead hands the roles on, rows re-sort and fans spin up or coast down, and hovering a unit shows its valve and rpm.",
    Component: CrahUnitsWidget,
  },
  {
    id: "genset",
    title: "Genset",
    size: "small",
    description:
      "A standby generator's day tank with a sloshing fuel level and runtime at full load; arm and confirm a test run and it cranks, rolls to 1,500 rpm, shakes and burns fuel before cooling down.",
    Component: GensetWidget,
  },
  {
    id: "change-windows",
    title: "Change Windows",
    size: "medium",
    description:
      "Today's change windows and the quarter-end freeze on a 24-hour strip with a moving NOW marker; the live window fills as it runs and tapping any block shows its owner, ticket and status.",
    Component: ChangeWindowsWidget,
  },
  {
    id: "leak-detect",
    title: "Leak Detection",
    size: "small",
    description:
      "A rope leak-detection cable under the raised floor with a sense pulse running along it; the wet spot ripples red until acknowledged, a technician is dispatched with an ETA and the cable reads dry again.",
    Component: LeakDetectWidget,
  },
];
