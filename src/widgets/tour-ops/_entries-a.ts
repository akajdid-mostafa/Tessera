import type { WidgetEntry } from "@/catalog/types";
import { CheckInCounterWidget } from "./check-in-counter";
import { DepartureCapacityWidget } from "./departure-capacity";
import { ManifestWidget } from "./manifest";
import { NextDepartureWidget } from "./next-departure";
import { UnassignedJobsWidget } from "./unassigned-jobs";

export const entries: WidgetEntry[] = [
  {
    id: "next-departure",
    title: "Next Departure",
    size: "small",
    description:
      "Today's next departure with its guide inside a sold-over-capacity ring, its time turning into a live countdown; tap to page through the next three.",
    Component: NextDepartureWidget,
  },
  {
    id: "departure-capacity",
    title: "Departure Capacity",
    size: "medium",
    description:
      "Today's departures as sold-versus-capacity bars with Private and overbooked states; drag a bar's end to override capacity and the reset chip springs it back to the default.",
    Component: DepartureCapacityWidget,
  },
  {
    id: "check-in-counter",
    title: "Check-in Counter",
    size: "small",
    description:
      "The active job's arrived pax and no-shows as a filling ring with an uninsured warning; tap +1 and the digits roll and the ring grows.",
    Component: CheckInCounterWidget,
  },
  {
    id: "manifest",
    title: "Manifest",
    size: "large",
    description:
      "A departure's guests grouped by pick-up stop with notes and visa and insurance flags; swipe a row right for arrived or left for no-show, and the washes and counts follow.",
    Component: ManifestWidget,
  },
  {
    id: "unassigned-jobs",
    title: "Unassigned Jobs",
    size: "medium",
    description:
      "Today's jobs missing a guide, driver or vehicle; drag or tap-assign a staff memoji or plate onto a job and its warning morphs into a check as the open count rolls down.",
    Component: UnassignedJobsWidget,
  },
];
