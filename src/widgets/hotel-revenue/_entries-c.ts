import type { WidgetEntry } from "@/catalog/types";
import { EventRatesWidget } from "./event-rates";
import { JobTrackerWidget } from "./job-tracker";
import { ValueSourcesWidget } from "./value-sources";
import { WeekOccupancyWidget } from "./week-occupancy";

export const entries: WidgetEntry[] = [
  {
    id: "job-tracker",
    title: "Job Tracker",
    size: "small",
    description:
      "The latest bulk update as a ring of cells with a tick per channel; a partly applied job splits the ring green and red with a one-channel retry, and tapping the ring runs it again.",
    Component: JobTrackerWidget,
  },
  {
    id: "week-occupancy",
    title: "Week Occupancy",
    size: "medium",
    description:
      "One rail per room type grows to this ISO week's occupancy, colored blue, orange, volcano or red as it fills; switch weeks, or tap a rail to see its seven nights as filling dots.",
    Component: WeekOccupancyWidget,
  },
  {
    id: "event-rates",
    title: "Event-Aware Rates",
    size: "medium",
    description:
      "The next seven nights' master price and occupancy under their city-event dots; the +10% chip previews event-night prices as ghost bars and Apply rolls the new prices in.",
    Component: EventRatesWidget,
  },
  {
    id: "value-sources",
    title: "Value Sources",
    size: "small",
    description:
      "How upcoming prices were set, by rate level, by hand or by autopilot, as a donut whose autopilot slice shimmers; tap to step the highlight through the legend.",
    Component: ValueSourcesWidget,
  },
];
