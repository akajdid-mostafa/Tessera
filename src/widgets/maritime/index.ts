import type { WidgetEntry } from "@/catalog/types";
import { CraneMovesWidget } from "./crane-moves";
import { DraftTrimWidget } from "./draft-trim";
import { EtaBoardWidget } from "./eta-board";
import { ReeferPlugsWidget } from "./reefer-plugs";
import { TideWindowWidget } from "./tide-window";

export const entries: WidgetEntry[] = [
  {
    id: "crane-moves",
    title: "Crane Moves",
    size: "small",
    description:
      "A ship-to-shore crane lifting boxes from ship to tractor on a loop while its gross moves per hour roll and turn orange below target; tap to page through the berth's cranes.",
    Component: CraneMovesWidget,
  },
  {
    id: "eta-board",
    title: "Vessel Arrivals",
    size: "medium",
    description:
      "Inbound ships with AIS speed sparklines and ETA against plan, rolling as each AIS report lands; sort by ETA or delay and hover a row for IMO, LOA, draft and distance to pilot.",
    Component: EtaBoardWidget,
  },
  {
    id: "tide-window",
    title: "Tidal Window",
    size: "medium",
    description:
      "Predicted tide against the height a deep-draft ship needs, with the sailing window shaded and a NOW mark riding the curve; scrub to read any time as go or no-go, or switch to tomorrow.",
    Component: TideWindowWidget,
  },
  {
    id: "reefer-plugs",
    title: "Reefer Plugs",
    size: "medium",
    description:
      "A reefer block's 72 plugs with three alarms pulsing; pick an alarm to see its supply-air drift and dispatch a technician through a confirm step, then watch the unit recover.",
    Component: ReeferPlugsWidget,
  },
  {
    id: "draft-trim",
    title: "Draft & Trim",
    size: "small",
    description:
      "A container ship that settles and trims by the stern as it loads, over a rolling waterline; hover the stern, midships or bow to read that draft mark.",
    Component: DraftTrimWidget,
  },
];
