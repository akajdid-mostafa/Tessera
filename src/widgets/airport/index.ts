import type { WidgetEntry } from "@/catalog/types";
import { BaggageBeltWidget } from "./baggage-belt";
import { DeparturesBoardWidget } from "./departures-board";
import { PaxFlowWidget } from "./pax-flow";
import { RunwayConfigWidget } from "./runway-config";
import { SecurityQueueWidget } from "./security-queue";
import { TurnaroundWidget } from "./turnaround";

export const entries: WidgetEntry[] = [
  {
    id: "runway-config",
    title: "Runway in Use",
    size: "small",
    description:
      "The active runway drawn top-down with a landing aircraft rolling out and a live wind arrow; a tailwind past the 5 kt limit turns it orange, and a select-then-confirm change flips the landing direction.",
    Component: RunwayConfigWidget,
  },
  {
    id: "security-queue",
    title: "Security Queue",
    size: "small",
    description:
      "A checkpoint's wait against its 15-minute target while passengers walk the belt-barrier serpentine to the lanes; the wait ticks live, runs orange when over target, and a tap pages through checkpoints.",
    Component: SecurityQueueWidget,
  },
  {
    id: "departures-board",
    title: "Departures Board",
    size: "medium",
    description:
      "A dense flight board for departures or arrivals where the top flight flips through its statuses split-flap style and rolls off as the next moves up; hover a row for TOBT, TSAT, aircraft and stand.",
    Component: DeparturesBoardWidget,
  },
  {
    id: "pax-flow",
    title: "Passenger Flow",
    size: "medium",
    description:
      "Checkpoint show-ups per 15 minutes against open-lane and full-lane capacity, with slots over capacity in orange; bars spring up on entry, the current slot fills live, and scrubbing reads any slot.",
    Component: PaxFlowWidget,
  },
  {
    id: "baggage-belt",
    title: "Baggage Reclaim",
    size: "medium",
    description:
      "A reclaim carousel drawn top-down with bags riding the belt as delivered counts roll against first- and last-bag targets; switch belts, and the flight past its last-bag target shows orange.",
    Component: BaggageBeltWidget,
  },
  {
    id: "turnaround",
    title: "Turnaround",
    size: "large",
    description:
      "An A320 turnaround on stand: ground vehicles drive in and out around the top-down aircraft as the milestone Gantt counts down to TOBT, late catering flags the TOBT at risk, and tapping a task highlights its vehicle and crew.",
    Component: TurnaroundWidget,
  },
];
