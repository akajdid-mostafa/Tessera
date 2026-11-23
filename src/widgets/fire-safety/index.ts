import type { WidgetEntry } from "@/catalog/types";
import { ActiveAlarmsWidget } from "./active-alarms";
import { CauseEffectWidget } from "./cause-effect";
import { EvacuationWidget } from "./evacuation";
import { FloorPlanWidget } from "./floor-plan";
import { SmokeObscurationWidget } from "./smoke-obscuration";
import { SprinklerRiserWidget } from "./sprinkler-riser";

export const entries: WidgetEntry[] = [
  {
    id: "sprinkler-riser",
    title: "Sprinkler Riser",
    size: "small",
    description:
      "A wet-pipe riser drawn with its gate valve, alarm check and gauges; opening the inspector's test sends water up the pipe, lifts the clapper and sags the needles, and after the retard the waterflow alarm latches red until pressure recovers.",
    Component: SprinklerRiserWidget,
  },
  {
    id: "smoke-obscuration",
    title: "Detector Obscuration",
    size: "small",
    description:
      "Twenty-four hours of a smoke detector's obscuration in %/ft against pre-alarm and alarm lines; the trace draws in, the morning steam spike crosses pre-alarm in amber, the live reading ticks, and scrubbing reads any half hour.",
    Component: SmokeObscurationWidget,
  },
  {
    id: "active-alarms",
    title: "Fire Alarm Panel",
    size: "medium",
    description:
      "A fire panel's event queue with Acknowledge, Silence and a two-step Reset; unacknowledged events flash and the sounder icon pulses until silenced, Reset asks to confirm and clears the alarm while the ground fault stays, and a new alarm arrives soon after.",
    Component: ActiveAlarmsWidget,
  },
  {
    id: "cause-effect",
    title: "Cause & Effect",
    size: "medium",
    description:
      "The outputs of a Zone 5-2 smoke alarm step from pending to commanded to confirmed with live counts of doors shut, dampers closed and cars recalled; one damper never reports back and fails red, and Replay runs the sequence again.",
    Component: CauseEffectWidget,
  },
  {
    id: "evacuation",
    title: "Evacuation",
    size: "medium",
    description:
      "A phased evacuation floor stack; the fire floor and its neighbours drain first while people stream down the stair, outer floors move from Alert to Evacuate in waves, two people wait in the 5F refuge, and hovering a floor reads its count and warden.",
    Component: EvacuationWidget,
  },
  {
    id: "floor-plan",
    title: "Device Floor Plan",
    size: "large",
    description:
      "A floor plan of addressable detectors, pull stations and horn/strobes by zone; on 5F the corridor detector pulses red in its alarm zone with smoke drifting and egress arrows running to the stairs, the floor switch reveals a dirty detector on 4F, and hovering any device reads its live analog value.",
    Component: FloorPlanWidget,
  },
];
