import type { WidgetEntry } from "@/catalog/types";
import { BankStatusWidget } from "./bank-status";
import { DestinationDispatchWidget } from "./destination-dispatch";
import { EntrapmentWidget } from "./entrapment";
import { EscalatorWidget } from "./escalator";
import { ShaftViewWidget } from "./shaft-view";
import { TrafficWidget } from "./traffic";
import { RideQualityWidget } from "./ride-quality";

export const entries: WidgetEntry[] = [
  {
    id: "entrapment",
    title: "Entrapment",
    size: "small",
    description:
      "A live entrapment with the elapsed clock counting and the card pulsing red; a guarded two-step rescue levels the car to the nearest floor and opens the doors.",
    Component: EntrapmentWidget,
  },
  {
    id: "escalator",
    title: "Escalator",
    size: "small",
    description:
      "An escalator in profile whose steps and handrail move at the unit's speed and direction; tap to page through four units, one stopped on a handrail speed fault.",
    Component: EscalatorWidget,
  },
  {
    id: "bank-status",
    title: "Bank Status",
    size: "medium",
    description:
      "Every car in the bank with live floor, load, trips-per-hour sparkline and status, P3 out of service; hover a row to swap in its door-cycle health.",
    Component: BankStatusWidget,
  },
  {
    id: "traffic",
    title: "Traffic Today",
    size: "medium",
    description:
      "The day's trips as diverging up and down bars that grow in from the axis with the peaks plain to see; switch to energy drawn versus regenerated and scrub any hour.",
    Component: TrafficWidget,
  },
  {
    id: "destination-dispatch",
    title: "Destination Dispatch",
    size: "medium",
    description:
      "A lobby kiosk keypad where tapping a floor springs in an assigned car with walk side, ETA countdown and the riders grouped with you, car F crossed out on the lobby plan.",
    Component: DestinationDispatchWidget,
  },
  {
    id: "shaft-view",
    title: "Shaft View",
    size: "large",
    description:
      "A four-car bank drawn as shafts where cars travel floor to floor, doors slide open at each stop and hall lanterns light, car D hatched in inspection; hover or tap a car to read it.",
    Component: ShaftViewWidget,
  },
  {
    id: "ride-quality",
    title: "Ride Quality",
    size: "small",
    description:
      "Horizontal vibration A95 for each car's latest run against the 25 mg limit; a new run traces in every few seconds behind a scan line, and tapping a car chip switches to it, car C knocking on worn guide rollers.",
    Component: RideQualityWidget,
  },
];
