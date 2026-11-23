import type { WidgetEntry } from "@/catalog/types";
import { CarLockWidget } from "./car-lock";
import { FleetAvailabilityWidget } from "./fleet-availability";
import { PickupsTodayWidget } from "./pickups-today";
import { RentalReturnWidget } from "./rental-return";
import { UtilizationWidget } from "./utilization";
import { DamageCheckWidget } from "./damage-check";
import { RateBoardWidget } from "./rate-board";

export const entries: WidgetEntry[] = [
  {
    id: "rental-return",
    title: "Rental Return",
    size: "small",
    description: "A live return countdown with fuel segments; tap to swap fuel for mileage.",
    Component: RentalReturnWidget,
  },
  {
    id: "fleet-availability",
    title: "Fleet Availability",
    size: "medium",
    description: "Stacked status bars for every branch that shift live as cars come and go; tap a branch to roll its free cars into the hero.",
    Component: FleetAvailabilityWidget,
  },
  {
    id: "pickups-today",
    title: "Pickups Today",
    size: "large",
    description: "The desk's pickups on a day timeline where a slow NOW line ticks each handover done; hover a block for the customer and plate.",
    Component: PickupsTodayWidget,
  },
  {
    id: "car-lock",
    title: "Car Lock",
    size: "small",
    description: "A remote lock for the rented car whose shackle lifts and drops behind a pulsing ring when you tap it.",
    Component: CarLockWidget,
  },
  {
    id: "utilization",
    title: "Utilization",
    size: "small",
    description: "A half-circle gauge of fleet utilization against last week; tap to spring the needle through today, week and month.",
    Component: UtilizationWidget,
  },
  {
    id: "damage-check",
    title: "Return Inspection",
    size: "medium",
    description: "A returned car drawn top-down with new damage pulsing red beside marks already on file, revealed by a scan line; tap a mark to read it, then charge the repair with a confirm or waive it.",
    Component: DamageCheckWidget,
  },
  {
    id: "rate-board",
    title: "Rate Board",
    size: "small",
    description: "A class's daily rate against the suggested price over a week of demand bars, with Friday filling live for a trade fair; tap a day, step the rate, or tap the gap to match.",
    Component: RateBoardWidget,
  },
];
