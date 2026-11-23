import type { WidgetEntry } from "@/catalog/types";
import { AirQualityWidget } from "./air-quality";
import { BusLineWidget } from "./bus-line";
import { IntersectionWidget } from "./intersection";
import { ParkingWidget } from "./parking";
import { StreetLightsWidget } from "./street-lights";
import { WasteBinsWidget } from "./waste-bins";
import { NoiseLevelWidget } from "./noise-level";
import { DispatchBoardWidget } from "./dispatch-board";

export const entries: WidgetEntry[] = [
  {
    id: "air-quality",
    title: "Air Quality",
    size: "small",
    description:
      "AQI and PM2.5 over 24 hours against the WHO guideline, the trace drawing in and turning orange above the limit; scrub an hour and the AQI and category follow.",
    Component: AirQualityWidget,
  },
  {
    id: "street-lights",
    title: "Street Lights",
    size: "small",
    description:
      "A district's dimming level as an iOS-style brightness pill; drag to stage an override, confirm it within five seconds, and the glow and kW load follow.",
    Component: StreetLightsWidget,
  },
  {
    id: "parking",
    title: "Parking",
    size: "medium",
    description:
      "Lots with occupancy against the 60–85 % target band and live free counts, one filling to FULL; tap a lot to push its count to the guidance sign.",
    Component: ParkingWidget,
  },
  {
    id: "bus-line",
    title: "Bus Line",
    size: "medium",
    description:
      "Buses glide along a line diagram with headway drawn between them and a bunched pair pulsing red; tap a bus for its driver and hold it until the gap recovers.",
    Component: BusLineWidget,
  },
  {
    id: "intersection",
    title: "Intersection Live",
    size: "large",
    description:
      "A plan view where signals cycle through the plan, cars queue on red and pull away on green, with queues, delay and LOS beside it; hover an approach to trace it.",
    Component: IntersectionWidget,
  },
  {
    id: "waste-bins",
    title: "Waste Bins",
    size: "medium",
    description:
      "Six street bins whose levels rise live, turning orange past 80% and wiggling when they overflow; plan a route for the due ones, dispatch the truck and watch them empty in order.",
    Component: WasteBinsWidget,
  },
  {
    id: "noise-level",
    title: "Night Noise",
    size: "small",
    description:
      "A bar level meter of recent samples against a dashed night limit while the rolling Leq is held against the night limit, spiking on a horn or a motorbike; tap to step through sensors.",
    Component: NoiseLevelWidget,
  },
  {
    id: "dispatch-board",
    title: "Dispatch",
    size: "large",
    description:
      "An EMS board where a P1 call waits with its processing timer and unit chips glide between Available, En route, On scene and Transport; assign the closest unit and follow it to the scene.",
    Component: DispatchBoardWidget,
  },
];
