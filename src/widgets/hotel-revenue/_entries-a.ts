import type { WidgetEntry } from "@/catalog/types";
import { AvailabilityGridWidget } from "./availability-grid";
import { OrphanNightsWidget } from "./orphan-nights";
import { PickupRowWidget } from "./pickup-row";
import { RestrictionsBoardWidget } from "./restrictions-board";
import { StopSellWidget } from "./stop-sell";

export const entries: WidgetEntry[] = [
  {
    id: "availability-grid",
    title: "Availability Grid",
    size: "large",
    description:
      "Rooms left for ten room types over fourteen nights, tinted from calm blue to red as nights fill; live bookings tick cells down and hovering a cell reads its sold, total and blocked rooms.",
    Component: AvailabilityGridWidget,
  },
  {
    id: "restrictions-board",
    title: "Restrictions Board",
    size: "medium",
    description:
      "A week of min stay, CTA, CTD and stop sell chips for one rate; tap chips into green-edged drafts and Apply runs a queued job that commits them across channels.",
    Component: RestrictionsBoardWidget,
  },
  {
    id: "stop-sell",
    title: "Stop Sell",
    size: "small",
    description:
      "A room type's stop sell for one night with the channels that take it; the switch bounces over and each channel's sync dot runs from pending to synced.",
    Component: StopSellWidget,
  },
  {
    id: "pickup-row",
    title: "Pickup Row",
    size: "medium",
    description:
      "Last-7-day bookings per night for the next two weeks, tinted at 8% and 20% of rooms; new bookings ripple into the nights they hold and hovering a night shows its count and share.",
    Component: PickupRowWidget,
  },
  {
    id: "orphan-nights",
    title: "Orphan Nights",
    size: "medium",
    description:
      "Unsellable gaps with the restrictions that cause them and their value at the best rate; relaxing the min stay dissolves a gap into nights open to sell.",
    Component: OrphanNightsWidget,
  },
];
