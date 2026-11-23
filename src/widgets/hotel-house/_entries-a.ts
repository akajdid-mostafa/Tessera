import type { WidgetEntry } from "@/catalog/types";
import { HousekeepingFlowWidget } from "./housekeeping-flow";
import { PaymentsTodayWidget } from "./payments-today";
import { RoomCardWidget } from "./room-card";
import { VipTodayWidget } from "./vip-today";

export const entries: WidgetEntry[] = [
  {
    id: "housekeeping-flow",
    title: "Housekeeping Flow",
    size: "medium",
    description:
      "Rooms flow through Dirty, Pickup, Clean and Inspected columns with priority rooms flagged first and their attendant's memoji; tap or swipe a room to move it on, undo within five seconds, and the counts roll as a supervisor inspects live.",
    Component: HousekeepingFlowWidget,
  },
  {
    id: "room-card",
    title: "Room Card",
    size: "small",
    description:
      "One room's number, type, features, housekeeping tag and tonight's guest on night 3 of 5; tap the tag or long-press the card to set housekeeping, and the tag wipes to the new color.",
    Component: RoomCardWidget,
  },
  {
    id: "vip-today",
    title: "VIP & Tags Today",
    size: "medium",
    description:
      "Today's VIP, returning and corporate guests with their rooms and open check-in alerts, behind a memoji stack that fans out on hover; tap an alert to tick it done and the open count rolls down.",
    Component: VipTodayWidget,
  },
  {
    id: "payments-today",
    title: "Payments Today",
    size: "medium",
    description:
      "Today's payments in USD as a stacked bar by cash, card, transfer and payment link, with link requests and open authorizations; a waiting link turns paid live with a check, and tapping a method filters the total.",
    Component: PaymentsTodayWidget,
  },
];
