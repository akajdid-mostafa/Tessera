import type { WidgetEntry } from "@/catalog/types";
import { ChargeSessionWidget } from "./charge-session";
import { ClimateWidget } from "./climate";
import { DriveModeWidget } from "./drive-mode";
import { DriveViewWidget } from "./drive-view";
import { GuardModeWidget } from "./guard-mode";
import { NextTurnWidget } from "./next-turn";
import { RangeEnergyWidget } from "./range-energy";
import { VehicleStatusWidget } from "./vehicle-status";

export const entries: WidgetEntry[] = [
  {
    id: "drive-view",
    title: "Drive View",
    size: "large",
    description:
      "A glass-cockpit driving view on a fixed dark surface where lane lines stream toward the ego car and traffic drifts around it, with a dock that nudges for hands-on, escalates to a red takeover and lets you engage assist or roll the set speed.",
    Component: DriveViewWidget,
  },
  {
    id: "range-energy",
    title: "Range & Energy",
    size: "small",
    description:
      "Charge, projected and rated range over a 50 km Wh/km trace that wipes in green and orange around its average; scrub it to roll the range to that stretch's pace.",
    Component: RangeEnergyWidget,
  },
  {
    id: "next-turn",
    title: "Next Turn",
    size: "medium",
    description:
      "A glassy next-turn card on a fixed dark surface whose distance counts down live over a flowing route, swelling the arrow near the junction; tap to peek at the step after.",
    Component: NextTurnWidget,
  },
  {
    id: "climate",
    title: "Climate",
    size: "medium",
    description:
      "Cabin climate for the driver's profile with a set point the cabin creeps toward, a spinning fan ring and seat heat you tap to cycle, and defrost that wipes amber then red.",
    Component: ClimateWidget,
  },
  {
    id: "drive-mode",
    title: "Drive Mode",
    size: "small",
    description:
      "Drive mode and regen level over a live power meter that swings into green regen; picking Sport sweeps a red glow around the card.",
    Component: DriveModeWidget,
  },
  {
    id: "vehicle-status",
    title: "Vehicle Status",
    size: "large",
    description:
      "A top-down car where tapping a door swings it open, the trunks ask to confirm before lifting and every wheel shows its pressure, with a low rear tyre blinking amber; tap a tyre for psi.",
    Component: VehicleStatusWidget,
  },
  {
    id: "charge-session",
    title: "Charge Session",
    size: "medium",
    description:
      "A glassy charge card where a cold battery holds power at 48 kW until preconditioning warms it to full speed; drag the limit slider into the daily or trip zone.",
    Component: ChargeSessionWidget,
  },
  {
    id: "guard-mode",
    title: "Guard Mode",
    size: "small",
    description:
      "A camera-guard radar that sweeps while armed and drops a pulsing blip with each new motion event; flip the switch to disarm it.",
    Component: GuardModeWidget,
  },
];
