import type { WidgetEntry } from "@/catalog/types";
import { DeparturesWidget } from "./departures";
import { InterlockingWidget } from "./interlocking";
import { PointsHealthWidget } from "./points-health";
import { PunctualityWidget } from "./punctuality";
import { SpeedProfileWidget } from "./speed-profile";
import { TrainGraphWidget } from "./train-graph";
import { HotAxleWidget } from "./hot-axle";
import { RegenEnergyWidget } from "./regen-energy";
import { ConsistWidget } from "./consist";

export const entries: WidgetEntry[] = [
  {
    id: "train-graph",
    title: "Train Graph",
    size: "large",
    description:
      "A time-distance train graph where each run draws solid up to a creeping NOW line and dashed beyond; a late stopper sets up a pulsing headway conflict at Earlswood Jn that you clear by holding the fast behind it.",
    Component: TrainGraphWidget,
  },
  {
    id: "punctuality",
    title: "Punctuality",
    size: "small",
    description:
      "Today's PPM on a ring with its target tick, nudged by every arrival as it lands; tap to page through PPM, right time and CaSL.",
    Component: PunctualityWidget,
  },
  {
    id: "departures",
    title: "Departures",
    size: "medium",
    description:
      "A split-flap departure board whose characters flip as times slip, platforms change and trains leave; tap a row to scroll its calling points along the bottom.",
    Component: DeparturesWidget,
  },
  {
    id: "interlocking",
    title: "Route Setting",
    size: "medium",
    description:
      "A signalling panel with live track circuits and signal aspects; tap SG12 to set a route (the main is locked out by a failed track circuit), confirm, and watch the points throw, the signal clear and the train run into the loop.",
    Component: InterlockingWidget,
  },
  {
    id: "speed-profile",
    title: "Speed vs Limit",
    size: "medium",
    description:
      "A train's speed traced live against line speed, a temporary restriction and its braking curve, glowing orange when the driver brakes late; scrub to read limit and speed at any kilometre.",
    Component: SpeedProfileWidget,
  },
  {
    id: "points-health",
    title: "Points Health",
    size: "small",
    description:
      "A point machine throwing live between normal and reverse with its throw times against the 4.0 s limit, slow throws turning orange and red; hover a bar to read that throw.",
    Component: PointsHealthWidget,
  },
  {
    id: "hot-axle",
    title: "Hot Axle Detector",
    size: "medium",
    description:
      "A trackside detector reading bearing temperatures axle by axle under a scan line as a train passes, a hot box flashing red until acknowledged; hover any axle for both sides.",
    Component: HotAxleWidget,
  },
  {
    id: "regen-energy",
    title: "Regen Energy",
    size: "small",
    description:
      "A power meter centred on zero that swings right as the train draws power and left in green as regenerative braking feeds the line, with the share recovered rolling up; tap for this trip or today.",
    Component: RegenEnergyWidget,
  },
  {
    id: "consist",
    title: "Train Consist",
    size: "large",
    description:
      "Twelve cars filling to their passenger load as the train runs stop to stop, with fault marks on the cars; tap a car for its load, saloon temperature and doors, and isolate a failed door through a confirm.",
    Component: ConsistWidget,
  },
];
