import type { WidgetEntry } from "@/catalog/types";
import { AttendantShiftWidget } from "./attendant-shift";
import { GuestRequestsWidget } from "./guest-requests";
import { OutOfOrderWidget } from "./out-of-order";

export const entries: WidgetEntry[] = [
  {
    id: "guest-requests",
    title: "Guest Requests",
    size: "medium",
    description:
      "Open guest requests as a notification stack with a live SLA ring that turns orange, then red past twenty minutes; swipe or tap Done to clear the top card, the next one rises and new requests slide in at the back.",
    Component: GuestRequestsWidget,
  },
  {
    id: "out-of-order",
    title: "Out of Order",
    size: "small",
    description:
      "Rooms pulled from sale with their fault, technician and the rate lost tonight, behind a pulsing alarm dot; tap to page tickets, and a two-step Return to service puts a room back on sale until an all-clear state shows.",
    Component: OutOfOrderWidget,
  },
  {
    id: "attendant-shift",
    title: "Attendant Shift",
    size: "large",
    description:
      "Each attendant's rooms as blocks on a 08:00–16:00 timeline sized by cleaning minutes, with a live NOW line filling the room in progress; one attendant runs past the shift end until Rebalance flies two rooms to a colleague with slack.",
    Component: AttendantShiftWidget,
  },
];
