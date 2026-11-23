import type { WidgetEntry } from "@/catalog/types";
import { AhuSchematicWidget } from "./ahu-schematic";
import { DemandWidget } from "./demand";
import { FaultListWidget } from "./fault-list";
import { FloorComfortWidget } from "./floor-comfort";
import { ZoneSetpointWidget } from "./zone-setpoint";
import { LightingScheduleWidget } from "./lighting-schedule";
import { LeakAlarmWidget } from "./leak-alarm";
import { LoadProfileWidget } from "./load-profile";
import { ChillerPlantWidget } from "./chiller-plant";

export const entries: WidgetEntry[] = [
  {
    id: "zone-setpoint",
    title: "Zone Setpoint",
    size: "small",
    description:
      "A zone thermostat whose ring follows room temperature and mode; ± stages a new setpoint that shows as pending, writes after a pause, and raises an override badge you tap to release back to schedule.",
    Component: ZoneSetpointWidget,
  },
  {
    id: "demand",
    title: "Building Demand",
    size: "small",
    description:
      "Main-meter kW against a 1,000 kW peak limit with a shaded warning band; a new reading lands every few seconds, the limit line pulses when demand nears it, and scrubbing reads any interval.",
    Component: DemandWidget,
  },
  {
    id: "ahu-schematic",
    title: "AHU Schematic",
    size: "medium",
    description:
      "An air handler drawn as a duct with damper, filter, coils, fan and supply sensor; the fan spins at VFD speed, air dashes through, the dirty filter flashes amber, and hovering a component reads it out below.",
    Component: AhuSchematicWidget,
  },
  {
    id: "fault-list",
    title: "Fault Detection",
    size: "medium",
    description:
      "Fault-detection findings ranked by avoidable cost per year; estimates re-score live and rows re-rank with a FLIP, hover explains a finding, and tapping one raises a work order.",
    Component: FaultListWidget,
  },
  {
    id: "floor-comfort",
    title: "Floor Comfort Map",
    size: "large",
    description:
      "A floor plan with zones tinted by temperature or CO₂; readings drift live, the crowded boardroom pulses a CO₂ alarm, and hovering a zone fills the hero with its values and memoji occupants.",
    Component: FloorComfortWidget,
  },
  {
    id: "lighting-schedule",
    title: "Lighting Schedule",
    size: "medium",
    description:
      "Today's lighting schedule for one floor on a 24 h band with sunrise, sunset and a Now marker; the daylight dim level drifts with the clouds, and Extend writes an after-hours override that stretches the occupied window and pushes the cleaning sweep back.",
    Component: LightingScheduleWidget,
  },
  {
    id: "leak-alarm",
    title: "Leak Detection",
    size: "small",
    description:
      "A pantry leak sensor trips with drops falling on a growing puddle; the alarm flashes until you acknowledge it, Close valve swings the shut-off and stops the flow, and Reset clears it once the sensor is dry.",
    Component: LeakAlarmWidget,
  },
  {
    id: "load-profile",
    title: "Load Profile",
    size: "large",
    description:
      "A week of hourly building load as a heatmap with night baseload and peak; the cells sweep in hour by hour, the current hour pulses live, hovering a cell splits it by end use, and the Lighting layer exposes a floor left lit overnight.",
    Component: LoadProfileWidget,
  },
  {
    id: "chiller-plant",
    title: "Chiller Plant",
    size: "medium",
    description:
      "Plant kW/ton on a half gauge with its 0.50–0.75 target band beside each chiller's load; loads and efficiency drift live, and hovering a chiller swings the gauge to its own kW/ton and COP.",
    Component: ChillerPlantWidget,
  },
];
