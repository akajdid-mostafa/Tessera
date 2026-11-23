import type { WidgetEntry } from "@/catalog/types";
import { AccessoriesWidget } from "./accessories";
import { EnergyTodayWidget } from "./energy-today";
import { FloorPlanWidget } from "./floor-plan";
import { GarageDoorWidget } from "./garage-door";
import { RobotVacuumWidget } from "./robot-vacuum";
import { SensorsWidget } from "./sensors";
import { DoorbellWidget } from "./doorbell";
import { SecurityWidget } from "./security";
import { SprinklersWidget } from "./sprinklers";
import { ThermostatWidget } from "./thermostat";

export const entries: WidgetEntry[] = [
  {
    id: "garage-door",
    title: "Garage Door",
    size: "small",
    description:
      "A garage door drawn on the house front that rolls up on entry and flags being left open; closing or opening needs a confirm tap, then the panels travel as the percent counts.",
    Component: GarageDoorWidget,
  },
  {
    id: "robot-vacuum",
    title: "Robot Vacuum",
    size: "small",
    description:
      "A robot vacuum painting its lanes across a live room map with area, minutes left and battery rolling; pause, resume or send it back through the doorway to its dock.",
    Component: RobotVacuumWidget,
  },
  {
    id: "accessories",
    title: "Accessories",
    size: "medium",
    description:
      "Apple Home-style accessory tiles that flip to a bright on state with a popping icon, live fan and equalizer glyphs, a front door that needs a second tap to unlock and an offline plug that shakes.",
    Component: AccessoriesWidget,
  },
  {
    id: "energy-today",
    title: "Energy Today",
    size: "medium",
    description:
      "Hourly home use as bars over the rooftop solar curve with the peak-rate window shaded and cost rolled up; scrub an hour to read it and tap a series chip to hide it.",
    Component: EnergyTodayWidget,
  },
  {
    id: "sensors",
    title: "Sensors",
    size: "medium",
    description:
      "Room sensors with temperature sparklines and live CO₂, the nursery over 1,000 ppm and a pulsing kitchen leak whose water main you shut with a confirm tap; hover a row for air detail.",
    Component: SensorsWidget,
  },
  {
    id: "floor-plan",
    title: "Floor Plan",
    size: "large",
    description:
      "A home floor plan whose walls draw in, room lights glow, blinds tilt, the bedroom fan spins and the family's memoji walk between rooms; tap a room to switch its light or run a scene to restage the house.",
    Component: FloorPlanWidget,
  },
  {
    id: "thermostat",
    title: "Thermostat",
    size: "small",
    description:
      "A thermostat dial whose ticks pulse between the room and the setpoint while it heats or cools; drag around the dial to set the target and tap the chip to switch Heat, Cool and Off.",
    Component: ThermostatWidget,
  },
  {
    id: "doorbell",
    title: "Doorbell",
    size: "medium",
    description:
      "A doorbell camera with a courier at the door, a live clock and a pulsing ring; talk, send a quick reply, unlock with a confirm tap or dismiss, and the visitor walks off into the activity list.",
    Component: DoorbellWidget,
  },
  {
    id: "sprinklers",
    title: "Sprinklers",
    size: "medium",
    description:
      "This morning's sprinkler program on a 05:00–06:20 strip with done, running and queued zones, a moving NOW line and water used ticking up; pause, skip a zone or tap a block to preview it.",
    Component: SprinklersWidget,
  },
  {
    id: "security",
    title: "Security",
    size: "large",
    description:
      "An alarm panel whose exit-delay ring drains before arming, six door, window and motion sensors and a memoji activity log; an open window blocks arming until you bypass it.",
    Component: SecurityWidget,
  },
];
