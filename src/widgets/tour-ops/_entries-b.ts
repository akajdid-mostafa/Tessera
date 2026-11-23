import type { WidgetEntry } from "@/catalog/types";
import { FleetStatusWidget } from "./fleet-status";
import { JobTimelineWidget } from "./job-timeline";
import { RentalHandoverWidget } from "./rental-handover";
import { StaffDocumentsWidget } from "./staff-documents";
import { TransferRunWidget } from "./transfer-run";

export const entries: WidgetEntry[] = [
  {
    id: "job-timeline",
    title: "Today's Jobs",
    size: "large",
    description:
      "The day's departures, transfers, arrivals, check-outs and vehicle pickups and returns on a 06–22 strip with issue marks; the NOW line slides on, finished jobs fade, and hovering or tapping a job shows its time, pax, crew memoji and plate.",
    Component: JobTimelineWidget,
  },
  {
    id: "transfer-run",
    title: "Transfer Run",
    size: "medium",
    description:
      "A FLG arrival run with its flights, hotel stops, seats and driver; the changed UA 573 leg pulses amber until “Shift pickup +40 min” slides every stop time later.",
    Component: TransferRunWidget,
  },
  {
    id: "fleet-status",
    title: "Fleet Status",
    size: "small",
    description:
      "Vans by status with their share of seats filling in on entrance; tap flips to the plates whose inspection or insurance expires soon.",
    Component: FleetStatusWidget,
  },
  {
    id: "staff-documents",
    title: "Staff Documents",
    size: "medium",
    description:
      "Guides and drivers whose CDL, DOT medical card, license or guide permit has expired or runs out within 30 days, days left shrinking into bars; Remind sends and checks off each row.",
    Component: StaffDocumentsWidget,
  },
  {
    id: "rental-handover",
    title: "Rental Handover",
    size: "small",
    description:
      "A rental car return with a rolling odometer and a late chip that turns orange past 30 minutes; tap or drag the eight fuel segments to record the level and toggle a damage note.",
    Component: RentalHandoverWidget,
  },
];
